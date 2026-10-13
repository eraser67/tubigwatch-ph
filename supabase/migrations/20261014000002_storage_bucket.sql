-- =============================================================================
-- TubigWatch PH — Storage Bucket Setup
-- Phase 3: Store and product management
-- =============================================================================
-- Apply in the Supabase Dashboard SQL Editor after the initial schema migration.
-- =============================================================================

-- Create the 'photos' storage bucket (not public — URLs are signed or proxied)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false, -- not public — access controlled via storage policies below
  5242880, -- 5 MB (ADR-05)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage RLS policies ──────────────────────────────────────────────────────

-- Anyone can upload (anonymous submissions allowed per ADR-02)
-- Actual validation (size, MIME) is enforced by the bucket config and server-side code
create policy "Anyone can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Only the uploader or moderators can read their own pending photos
-- Approved photos are served via signed URLs from the server DAL
create policy "Authenticated users can read their own uploads"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[3] -- path: {type}/{entityId}/{uuid}.ext
  );

-- Moderators and admins can read all photos
create policy "Moderators can read all photos"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('moderator', 'admin')
    )
  );

-- Service role (admin client) manages deletions — no additional policy needed
-- since service role bypasses RLS entirely
