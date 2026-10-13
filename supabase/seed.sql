-- =============================================================================
-- TubigWatch PH — Development Seed Data
-- FOR LOCAL DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION
-- All data is entirely fictional and clearly labelled.
-- =============================================================================

-- Fictional products (using category slugs to look up IDs)
insert into products (category_id, name, brand, capacity_liters, material) values
  (
    (select id from product_categories where slug = 'buckets'),
    'Standard Water Bucket', 'Demo Brand A', 20, 'Plastic'
  ),
  (
    (select id from product_categories where slug = 'drums'),
    'Industrial Water Drum', 'Demo Brand B', 200, 'HDPE'
  ),
  (
    (select id from product_categories where slug = 'tanks'),
    'Overhead Water Tank', 'Demo Brand C', 500, 'Polyethylene'
  ),
  (
    (select id from product_categories where slug = 'containers'),
    'Water Container Jug', 'Demo Brand A', 5, 'Plastic'
  )
on conflict do nothing;

-- Fictional stores (status: approved so they appear on map in dev)
insert into stores (
  name, description, address_line, barangay, municipality, province,
  latitude, longitude, listing_status, verification_status
) values
  (
    '[DEMO] Placeholder Hardware Store',
    'Fictional store for development testing only. Not a real business.',
    '123 Test Street', 'Barangay Demo', 'Placeholder Municipality', 'Placeholder Province',
    14.5995, 120.9842,
    'approved'::listing_status, 'unverified'::verification_status
  ),
  (
    '[DEMO] Sample Water Supply Shop',
    'Fictional store for development testing only. Not a real business.',
    '456 Sample Road', 'Barangay Test', 'Placeholder Municipality', 'Placeholder Province',
    14.6000, 120.9850,
    'approved'::listing_status, 'unverified'::verification_status
  ),
  (
    '[DEMO] Pending Store (not visible)',
    'This store is pending — should NOT appear in public queries.',
    '789 Hidden Lane', 'Barangay Hidden', 'Placeholder Municipality', 'Placeholder Province',
    14.6010, 120.9860,
    'pending'::listing_status, 'unverified'::verification_status
  )
on conflict do nothing;

-- Fictional listings linking demo stores to demo products
with
  store1 as (select id from stores where name = '[DEMO] Placeholder Hardware Store' limit 1),
  store2 as (select id from stores where name = '[DEMO] Sample Water Supply Shop' limit 1),
  bucket  as (select id from products where name = 'Standard Water Bucket' limit 1),
  drum    as (select id from products where name = 'Industrial Water Drum' limit 1),
  tank    as (select id from products where name = 'Overhead Water Tank' limit 1)
insert into store_product_listings (store_id, product_id, current_price_php, stock_status, listing_status, last_reported_at)
  select store1.id, bucket.id, 85.00,   'available'::stock_status, 'approved'::listing_status, now() - interval '2 days' from store1, bucket
  union all
  select store1.id, drum.id,   950.00,  'limited'::stock_status,   'approved'::listing_status, now() - interval '8 days' from store1, drum  -- stale (>7 days)
  union all
  select store2.id, bucket.id, 90.00,   'available'::stock_status, 'approved'::listing_status, now() - interval '1 day'  from store2, bucket
  union all
  select store2.id, tank.id,   2500.00, 'unknown'::stock_status,   'approved'::listing_status, now() - interval '3 days' from store2, tank
on conflict do nothing;

