-- =============================================================================
-- Delete Stores that do NOT have any approved products yet
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/aqarjjyurakoxyipxqfl/sql
-- =============================================================================

DELETE FROM stores
WHERE id NOT IN (
  SELECT DISTINCT store_id
  FROM store_product_listings
  WHERE listing_status = 'approved'
);
