-- =============================================================================
-- TubigWatch PH — Initial Schema Migration
-- Phase 2: Database and access control
-- =============================================================================
-- Apply with: supabase db push  (or via Supabase dashboard SQL editor)
-- Rollback:   supabase db reset  (local dev only)
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy name search in Phase 7

-- =============================================================================
-- ENUMS
-- =============================================================================

create type listing_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type verification_status as enum ('unverified', 'store_confirmed', 'admin_verified');
create type stock_status as enum ('available', 'limited', 'sold_out', 'unknown');
create type price_source as enum ('community_reported', 'store_confirmed', 'admin_verified');
create type app_role as enum ('public', 'contributor', 'moderator', 'admin');
create type photo_type as enum ('storefront', 'product', 'price_evidence');
create type content_report_reason as enum (
  'incorrect_price', 'incorrect_location', 'duplicate',
  'closed_store', 'spam', 'other'
);
create type moderation_action_type as enum (
  'approve', 'reject', 'edit', 'suspend', 'merge',
  'verify_ownership', 'revoke_trust', 'grant_trust'
);

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         app_role    not null default 'public',
  trusted      boolean     not null default false,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table profiles is 'Application-level user profile and role. Extends auth.users.';
comment on column profiles.trusted is 'Trusted contributors have their price reports auto-accepted (ADR-03).';
comment on column profiles.role is 'admin and moderator roles are set server-side only via the setup script or moderation actions.';

-- Auto-create a profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- PRODUCT CATEGORIES
-- =============================================================================

create table product_categories (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null unique,
  slug        text        not null unique,
  description text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

comment on table product_categories is 'Configurable product categories. Managed by admins — no code deploy needed to add categories (ADR-11).';

-- Seed initial categories (ADR-11)
insert into product_categories (name, slug, sort_order) values
  ('Buckets',           'buckets',    1),
  ('Water Containers',  'containers', 2),
  ('Drums',             'drums',      3),
  ('Tanks',             'tanks',      4);

-- =============================================================================
-- STORES
-- =============================================================================

create table stores (
  id                  uuid               primary key default uuid_generate_v4(),
  name                text               not null,
  description         text,
  address_line        text,
  barangay            text,
  municipality        text               not null,
  province            text,
  latitude            double precision   not null check (latitude  between -90  and 90),
  longitude           double precision   not null check (longitude between -180 and 180),
  contact_number      text,
  opening_hours       text,
  delivers            boolean            not null default false,
  delivery_fee_php    numeric(10, 2)     check (delivery_fee_php >= 0),
  listing_status      listing_status     not null default 'pending',
  verification_status verification_status not null default 'unverified',
  creator_id          uuid               references profiles(id) on delete set null,
  owner_id            uuid               references profiles(id) on delete set null,
  created_at          timestamptz        not null default now(),
  updated_at          timestamptz        not null default now()
);

comment on table stores is 'Store locations. All community submissions default to pending and are not publicly visible until approved.';
comment on column stores.listing_status is 'Only approved stores are shown publicly. Pending/rejected/suspended are hidden from public queries.';

create index stores_listing_status_idx on stores (listing_status);
create index stores_municipality_idx   on stores (municipality);
create index stores_location_idx       on stores (latitude, longitude);
create index stores_name_trgm_idx      on stores using gin (name gin_trgm_ops);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

create table products (
  id              uuid        primary key default uuid_generate_v4(),
  category_id     uuid        not null references product_categories(id) on delete restrict,
  name            text        not null,
  brand           text,
  capacity_liters numeric(8, 2) check (capacity_liters > 0),
  material        text,
  dimensions_cm   text,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Prevent duplicate products: same name+brand+capacity+category
  unique (category_id, name, brand, capacity_liters)
);

comment on table products is 'Normalized product catalog. Products are shared across stores to enable price comparison of equivalent items.';
comment on column products.capacity_liters is 'Capacity in liters. Required for correct product comparison — different capacities are NOT treated as equivalent (FR-06).';

create index products_category_idx      on products (category_id);
create index products_capacity_idx      on products (capacity_liters);
create index products_name_trgm_idx     on products using gin (name gin_trgm_ops);

-- =============================================================================
-- STORE PRODUCT LISTINGS
-- =============================================================================

create table store_product_listings (
  id                uuid           primary key default uuid_generate_v4(),
  store_id          uuid           not null references stores(id) on delete cascade,
  product_id        uuid           not null references products(id) on delete restrict,
  current_price_php numeric(10, 2) check (current_price_php >= 0),
  stock_status      stock_status   not null default 'unknown',
  listing_status    listing_status not null default 'pending',
  last_reported_at  timestamptz,
  last_confirmed_at timestamptz,
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now(),
  unique (store_id, product_id)
);

comment on table store_product_listings is 'Links a product to a store with its current price and stock status. One record per product per store.';
comment on column store_product_listings.current_price_php is 'The currently accepted price. Changing this always creates a price_history record.';
comment on column store_product_listings.last_confirmed_at is 'Updated when a price is store-confirmed or admin-verified. Used to determine freshness (ADR-04: 7-day threshold).';

create index spl_store_id_idx   on store_product_listings (store_id);
create index spl_product_id_idx on store_product_listings (product_id);
create index spl_status_idx     on store_product_listings (listing_status);

-- =============================================================================
-- PRICE REPORTS
-- =============================================================================

create table price_reports (
  id                   uuid           primary key default uuid_generate_v4(),
  listing_id           uuid           not null references store_product_listings(id) on delete cascade,
  reported_price_php   numeric(10, 2) not null check (reported_price_php >= 0),
  stock_status         stock_status   not null default 'unknown',
  source               price_source   not null default 'community_reported',
  reporter_id          uuid           references profiles(id) on delete set null,
  evidence_photo_path  text,
  review_status        listing_status not null default 'pending',
  reviewer_id          uuid           references profiles(id) on delete set null,
  reviewed_at          timestamptz,
  created_at           timestamptz    not null default now()
);

comment on table price_reports is 'Community-submitted price updates. Kept separate from accepted prices. Auto-accepted for trusted contributors (ADR-03).';

create index price_reports_listing_id_idx     on price_reports (listing_id);
create index price_reports_review_status_idx  on price_reports (review_status);
create index price_reports_reporter_id_idx    on price_reports (reporter_id);

-- =============================================================================
-- PRICE HISTORY
-- =============================================================================

create table price_history (
  id                 uuid           primary key default uuid_generate_v4(),
  listing_id         uuid           not null references store_product_listings(id) on delete cascade,
  accepted_price_php numeric(10, 2) not null check (accepted_price_php >= 0),
  stock_status       stock_status   not null default 'unknown',
  source             price_source   not null default 'community_reported',
  source_report_id   uuid           references price_reports(id) on delete set null,
  verified_by_id     uuid           references profiles(id) on delete set null,
  effective_at       timestamptz    not null default now(),
  created_at         timestamptz    not null default now()
);

comment on table price_history is 'Immutable record of every accepted price change. Never overwritten — append only (FR-05).';

create index price_history_listing_id_idx  on price_history (listing_id);
create index price_history_effective_at_idx on price_history (listing_id, effective_at desc);

-- =============================================================================
-- STORE PHOTOS
-- =============================================================================

create table store_photos (
  id              uuid           primary key default uuid_generate_v4(),
  store_id        uuid           not null references stores(id) on delete cascade,
  storage_path    text           not null unique, -- UUID-named path, never original filename
  photo_type      photo_type     not null default 'storefront',
  review_status   listing_status not null default 'pending',
  uploaded_by_id  uuid           references profiles(id) on delete set null,
  created_at      timestamptz    not null default now()
);

comment on table store_photos is 'Photos associated with stores. storage_path is a UUID-generated path — never the original filename (FR-09).';

create index store_photos_store_id_idx on store_photos (store_id);

-- =============================================================================
-- PRODUCT PHOTOS (evidence / product images)
-- =============================================================================

create table product_photos (
  id              uuid           primary key default uuid_generate_v4(),
  listing_id      uuid           not null references store_product_listings(id) on delete cascade,
  storage_path    text           not null unique,
  review_status   listing_status not null default 'pending',
  uploaded_by_id  uuid           references profiles(id) on delete set null,
  created_at      timestamptz    not null default now()
);

comment on table product_photos is 'Photos for product listings and price evidence. Linked to the store-product listing, not the product catalog.';

create index product_photos_listing_id_idx on product_photos (listing_id);

-- =============================================================================
-- CONTENT REPORTS
-- =============================================================================

create table content_reports (
  id              uuid                   primary key default uuid_generate_v4(),
  target_table    text                   not null,
  target_id       uuid                   not null,
  reason          content_report_reason  not null,
  details         text,
  reporter_id     uuid                   references profiles(id) on delete set null,
  status          text                   not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text,
  resolved_by_id  uuid                   references profiles(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz            not null default now()
);

comment on table content_reports is 'Community reports of inaccurate, duplicate, or abusive listings. Reviewed by moderators.';

create index content_reports_status_idx     on content_reports (status);
create index content_reports_target_idx     on content_reports (target_table, target_id);

-- =============================================================================
-- MODERATION ACTIONS (audit trail — append only)
-- =============================================================================

create table moderation_actions (
  id              uuid                    primary key default uuid_generate_v4(),
  actor_id        uuid                    not null references profiles(id) on delete restrict,
  action          moderation_action_type  not null,
  target_table    text                    not null,
  target_id       uuid                    not null,
  previous_status text,
  new_status      text,
  reason          text,
  created_at      timestamptz             not null default now()
);

comment on table moderation_actions is 'Immutable audit trail of all moderation actions. Never updated or deleted (FR-10).';

create index moderation_actions_actor_id_idx  on moderation_actions (actor_id);
create index moderation_actions_target_idx    on moderation_actions (target_table, target_id);

-- =============================================================================
-- STORE OWNERSHIP CLAIMS (Post-MVP — ADR-01 / Requirements §4.2)
-- Table created now for schema stability; workflow not implemented until post-MVP.
-- =============================================================================

create table store_ownership_claims (
  id            uuid        primary key default uuid_generate_v4(),
  store_id      uuid        not null references stores(id) on delete cascade,
  claimant_id   uuid        not null references profiles(id) on delete cascade,
  evidence      text,
  status        text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id   uuid        references profiles(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (store_id, claimant_id)
);

comment on table store_ownership_claims is 'Post-MVP: store owner claim workflow. Table present for schema stability; UI workflow not implemented until post-MVP (Requirements §4.2).';

-- =============================================================================
-- UPDATED_AT TRIGGER (applied to mutable tables)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

create trigger set_stores_updated_at
  before update on stores
  for each row execute procedure public.set_updated_at();

create trigger set_products_updated_at
  before update on products
  for each row execute procedure public.set_updated_at();

create trigger set_spl_updated_at
  before update on store_product_listings
  for each row execute procedure public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
alter table profiles                enable row level security;
alter table product_categories      enable row level security;
alter table stores                  enable row level security;
alter table products                enable row level security;
alter table store_product_listings  enable row level security;
alter table price_reports           enable row level security;
alter table price_history           enable row level security;
alter table store_photos            enable row level security;
alter table product_photos          enable row level security;
alter table content_reports         enable row level security;
alter table moderation_actions      enable row level security;
alter table store_ownership_claims  enable row level security;

-- Helper: get the current user's role from profiles
create or replace function public.get_my_role()
returns app_role
language sql stable
security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper: check if current user is moderator or admin
create or replace function public.is_moderator_or_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(
    (select role in ('moderator', 'admin') from profiles where id = auth.uid()),
    false
  );
$$;

-- Helper: check if current user is trusted or admin
create or replace function public.is_trusted()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(
    (select trusted or role in ('moderator', 'admin') from profiles where id = auth.uid()),
    false
  );
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────
create policy "Users can read their own profile"
  on profiles for select using (id = auth.uid());

create policy "Moderators and admins can read all profiles"
  on profiles for select using (public.is_moderator_or_admin());

create policy "Users can update their own display_name"
  on profiles for update using (id = auth.uid())
  with check (id = auth.uid()); -- role/trusted fields protected by NOT granting update on those columns

-- ── product_categories (public read, admin write) ─────────────────────────────
create policy "Anyone can read categories"
  on product_categories for select using (true);

create policy "Admins can manage categories"
  on product_categories for all using (public.get_my_role() = 'admin');

-- ── stores ────────────────────────────────────────────────────────────────────
create policy "Anyone can read approved stores"
  on stores for select using (listing_status = 'approved');

create policy "Authenticated users can submit stores"
  on stores for insert
  with check (auth.uid() is not null);

create policy "Anonymous users can submit stores"
  on stores for insert
  with check (creator_id is null); -- anonymous: creator_id left null

create policy "Moderators can read all stores"
  on stores for select using (public.is_moderator_or_admin());

create policy "Moderators can update stores"
  on stores for update using (public.is_moderator_or_admin());

-- ── products ──────────────────────────────────────────────────────────────────
create policy "Anyone can read products"
  on products for select using (true);

create policy "Moderators can manage products"
  on products for all using (public.is_moderator_or_admin());

-- ── store_product_listings ────────────────────────────────────────────────────
create policy "Anyone can read approved listings"
  on store_product_listings for select
  using (listing_status = 'approved');

create policy "Authenticated users can submit listings"
  on store_product_listings for insert
  with check (auth.uid() is not null);

create policy "Moderators can manage listings"
  on store_product_listings for all using (public.is_moderator_or_admin());

-- ── price_reports ─────────────────────────────────────────────────────────────
create policy "Reporters can read their own reports"
  on price_reports for select using (reporter_id = auth.uid());

create policy "Anyone can submit a price report"
  on price_reports for insert with check (true);

create policy "Moderators can read and manage all reports"
  on price_reports for all using (public.is_moderator_or_admin());

-- ── price_history (read-only for public) ─────────────────────────────────────
create policy "Anyone can read approved price history"
  on price_history for select
  using (
    exists (
      select 1 from store_product_listings spl
      where spl.id = price_history.listing_id
        and spl.listing_status = 'approved'
    )
  );

create policy "Moderators can insert price history"
  on price_history for insert
  with check (public.is_moderator_or_admin());

-- ── store_photos ──────────────────────────────────────────────────────────────
create policy "Anyone can read approved store photos"
  on store_photos for select using (review_status = 'approved');

create policy "Anyone can upload a store photo"
  on store_photos for insert with check (true);

create policy "Moderators can manage store photos"
  on store_photos for all using (public.is_moderator_or_admin());

-- ── product_photos ────────────────────────────────────────────────────────────
create policy "Anyone can read approved product photos"
  on product_photos for select using (review_status = 'approved');

create policy "Anyone can upload a product photo"
  on product_photos for insert with check (true);

create policy "Moderators can manage product photos"
  on product_photos for all using (public.is_moderator_or_admin());

-- ── content_reports ───────────────────────────────────────────────────────────
create policy "Anyone can submit a content report"
  on content_reports for insert with check (true);

create policy "Reporters can see their own reports"
  on content_reports for select using (reporter_id = auth.uid());

create policy "Moderators can manage content reports"
  on content_reports for all using (public.is_moderator_or_admin());

-- ── moderation_actions (audit — no delete, no update) ────────────────────────
create policy "Moderators can read moderation actions"
  on moderation_actions for select using (public.is_moderator_or_admin());

create policy "Moderators can insert moderation actions"
  on moderation_actions for insert
  with check (public.is_moderator_or_admin());

-- ── store_ownership_claims (post-MVP) ─────────────────────────────────────────
create policy "Claimants can read their own claims"
  on store_ownership_claims for select using (claimant_id = auth.uid());

create policy "Moderators can manage ownership claims"
  on store_ownership_claims for all using (public.is_moderator_or_admin());

-- =============================================================================
-- DEVELOPMENT SEED DATA
-- All records are clearly fictional and labelled for development use only.
-- DO NOT use real prices, stores, or personal data here.
-- =============================================================================

-- Insert seed only when running locally (not in production migrations)
-- To apply seed data: run seed.sql separately after this migration.
-- See supabase/seed.sql
