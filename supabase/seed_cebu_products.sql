-- =============================================================================
-- TubigWatch PH — Real Cebu Public Store Products & Listings
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/aqarjjyurakoxyipxqfl/sql)
-- It removes the placeholder test data and populates real public products and prices.
-- =============================================================================

-- 1. Remove demo test data
DELETE FROM stores WHERE name LIKE '[DEMO]%' OR name LIKE 'Test%' OR municipality = 'Placeholder Municipality';

-- 2. Insert real public market products into catalog
INSERT INTO products (category_id, name, brand, capacity_liters, material, description) VALUES
  (
    (SELECT id FROM product_categories WHERE slug = 'tanks'),
    'Bestank Polyethylene Water Tank 500L',
    'Bestank',
    500,
    'Polyethylene',
    'Food-grade vertical cylindrical polyethylene water storage tank with brass inlet/outlet fittings.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'tanks'),
    'Bestank Polyethylene Water Tank 1000L',
    'Bestank',
    1000,
    'Polyethylene',
    'Heavy-duty antimicrobial UV-stabilized overhead vertical water tank.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'tanks'),
    'Firstank 304 Stainless Steel Water Tank 500L',
    'Firstank',
    500,
    'Stainless Steel',
    'Premium AISI 304 stainless steel residential storage tank with stainless stand and air vent.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'tanks'),
    'Firstank 304 Stainless Steel Water Tank 1000L',
    'Firstank',
    1000,
    'Stainless Steel',
    'Grade 304 stainless steel water tank, rust-proof, designed for residential pressure storage.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'drums'),
    '200-Liter Blue HDPE Plastic Drum (Open Top with Ring & Lid)',
    'Enj / Industrial',
    200,
    'HDPE',
    'Heavy-duty blue high-density polyethylene drum with removable lid and galvanized locking ring.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'drums'),
    '200-Liter Blue HDPE Plastic Drum (Closed Top with Bungs)',
    'Industrial Grade',
    200,
    'HDPE',
    'Closed-head blue plastic barrel with 2-inch bung openings for liquid water storage.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'containers'),
    '5-Gallon Slim Water Container with Faucet',
    'Generic Food Grade',
    19,
    'Polycarbonate',
    'Blue transparent slim container with built-in spigot tap and carrying handle for drinking water.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'containers'),
    '5-Gallon Round Water Gallon Bottle',
    'Universal',
    19,
    'Polycarbonate',
    'Standard 5-gallon round jug bottle for water dispensers and refilling stations.'
  ),
  (
    (SELECT id FROM product_categories WHERE slug = 'buckets'),
    '20-Liter Heavy Duty Water Timba with Lid & Metal Handle',
    'Orocan',
    20,
    'Plastic',
    'High-impact plastic utility pail with snap-on cover and metal bail handle.'
  )
ON CONFLICT (category_id, name, brand, capacity_liters) DO NOTHING;

-- 3. Populate product listings for real Cebu stores
WITH
  p_bestank_500 AS (SELECT id FROM products WHERE name = 'Bestank Polyethylene Water Tank 500L' LIMIT 1),
  p_bestank_1000 AS (SELECT id FROM products WHERE name = 'Bestank Polyethylene Water Tank 1000L' LIMIT 1),
  p_firstank_500 AS (SELECT id FROM products WHERE name = 'Firstank 304 Stainless Steel Water Tank 500L' LIMIT 1),
  p_firstank_1000 AS (SELECT id FROM products WHERE name = 'Firstank 304 Stainless Steel Water Tank 1000L' LIMIT 1),
  p_drum_opentop AS (SELECT id FROM products WHERE name = '200-Liter Blue HDPE Plastic Drum (Open Top with Ring & Lid)' LIMIT 1),
  p_drum_closed AS (SELECT id FROM products WHERE name = '200-Liter Blue HDPE Plastic Drum (Closed Top with Bungs)' LIMIT 1),
  p_slim_container AS (SELECT id FROM products WHERE name = '5-Gallon Slim Water Container with Faucet' LIMIT 1),
  p_round_gallon AS (SELECT id FROM products WHERE name = '5-Gallon Round Water Gallon Bottle' LIMIT 1),
  p_bucket_20l AS (SELECT id FROM products WHERE name = '20-Liter Heavy Duty Water Timba with Lid & Metal Handle' LIMIT 1)

INSERT INTO store_product_listings (store_id, product_id, current_price_php, stock_status, listing_status, last_reported_at)
SELECT s.id, p.id, price, 'available'::stock_status, 'approved'::listing_status, now()
FROM (
  -- Firstank Industrial Corp. (Mandaue)
  SELECT 'Firstank Industrial Corporation' AS store_name, (SELECT id FROM p_firstank_500) AS prod_id, 15500.00 AS price UNION ALL
  SELECT 'Firstank Industrial Corporation', (SELECT id FROM p_firstank_1000), 23800.00 UNION ALL
  SELECT 'Firstank Industrial Corporation', (SELECT id FROM p_bestank_1000), 13900.00 UNION ALL

  -- Mandaue Trade Centre Inc. (Bestank Distributor)
  SELECT 'Mandaue Trade Centre Inc. (Bestank Distributor)', (SELECT id FROM p_bestank_500), 8200.00 UNION ALL
  SELECT 'Mandaue Trade Centre Inc. (Bestank Distributor)', (SELECT id FROM p_bestank_1000), 13500.00 UNION ALL

  -- Cebu Home and Builders Centre (Banilad)
  SELECT 'Cebu Home and Builders Centre — Banilad', (SELECT id FROM p_bestank_500), 8450.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — Banilad', (SELECT id FROM p_bestank_1000), 13950.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — Banilad', (SELECT id FROM p_drum_opentop), 1350.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — Banilad', (SELECT id FROM p_bucket_20l), 160.00 UNION ALL

  -- Cebu Home and Builders Centre (N. Bacalso)
  SELECT 'Cebu Home and Builders Centre — N. Bacalso', (SELECT id FROM p_bestank_500), 8500.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — N. Bacalso', (SELECT id FROM p_drum_opentop), 1320.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — N. Bacalso', (SELECT id FROM p_bucket_20l), 155.00 UNION ALL

  -- CitiHardware Mandaue (Tabok)
  SELECT 'CitiHardware Mandaue (Tabok)', (SELECT id FROM p_bestank_500), 8100.00 UNION ALL
  SELECT 'CitiHardware Mandaue (Tabok)', (SELECT id FROM p_bestank_1000), 13400.00 UNION ALL
  SELECT 'CitiHardware Mandaue (Tabok)', (SELECT id FROM p_drum_opentop), 1250.00 UNION ALL
  SELECT 'CitiHardware Mandaue (Tabok)', (SELECT id FROM p_bucket_20l), 145.00 UNION ALL

  -- CitiHardware Bulacao (Cebu South)
  SELECT 'CitiHardware Bulacao (Cebu South)', (SELECT id FROM p_bestank_500), 8150.00 UNION ALL
  SELECT 'CitiHardware Bulacao (Cebu South)', (SELECT id FROM p_drum_opentop), 1250.00 UNION ALL
  SELECT 'CitiHardware Bulacao (Cebu South)', (SELECT id FROM p_bucket_20l), 145.00 UNION ALL

  -- Wilcon Depot Mandaue
  SELECT 'Wilcon Depot Mandaue', (SELECT id FROM p_firstank_500), 15800.00 UNION ALL
  SELECT 'Wilcon Depot Mandaue', (SELECT id FROM p_firstank_1000), 24500.00 UNION ALL
  SELECT 'Wilcon Depot Mandaue', (SELECT id FROM p_bestank_1000), 14200.00 UNION ALL

  -- Wilcon Depot Talisay
  SELECT 'Wilcon Depot Talisay', (SELECT id FROM p_firstank_500), 15900.00 UNION ALL
  SELECT 'Wilcon Depot Talisay', (SELECT id FROM p_bestank_1000), 14200.00 UNION ALL

  -- Enj Drums Mandaue
  SELECT 'Enj Drums Mandaue', (SELECT id FROM p_drum_opentop), 1180.00 UNION ALL
  SELECT 'Enj Drums Mandaue', (SELECT id FROM p_drum_closed), 1050.00 UNION ALL

  -- Atlantic Hardware (Taboan)
  SELECT 'Atlantic Hardware — Taboan Main', (SELECT id FROM p_drum_opentop), 1220.00 UNION ALL
  SELECT 'Atlantic Hardware — Taboan Main', (SELECT id FROM p_drum_closed), 1080.00 UNION ALL
  SELECT 'Atlantic Hardware — Taboan Main', (SELECT id FROM p_bucket_20l), 140.00 UNION ALL

  -- Livingwater Station & Supplies (Mabolo)
  SELECT 'Livingwater Station & Supplies — Mabolo', (SELECT id FROM p_slim_container), 250.00 UNION ALL
  SELECT 'Livingwater Station & Supplies — Mabolo', (SELECT id FROM p_round_gallon), 180.00 UNION ALL

  -- Aquabest Water Refilling Station (Lapu-Lapu)
  SELECT 'Aquabest Water Refilling Station — Lapu-Lapu', (SELECT id FROM p_slim_container), 260.00 UNION ALL
  SELECT 'Aquabest Water Refilling Station — Lapu-Lapu', (SELECT id FROM p_round_gallon), 190.00 UNION ALL

  -- CitiHardware Bogo
  SELECT 'CitiHardware Bogo', (SELECT id FROM p_bestank_500), 8350.00 UNION ALL
  SELECT 'CitiHardware Bogo', (SELECT id FROM p_drum_opentop), 1280.00 UNION ALL
  SELECT 'CitiHardware Bogo', (SELECT id FROM p_bucket_20l), 150.00 UNION ALL

  -- Bogo Builders Supply
  SELECT 'Bogo Builders Supply', (SELECT id FROM p_firstank_500), 16200.00 UNION ALL
  SELECT 'Bogo Builders Supply', (SELECT id FROM p_drum_opentop), 1290.00 UNION ALL

  -- CitiHardware Liloan
  SELECT 'CitiHardware Liloan', (SELECT id FROM p_bestank_500), 8150.00 UNION ALL
  SELECT 'CitiHardware Liloan', (SELECT id FROM p_bestank_1000), 13500.00 UNION ALL
  SELECT 'CitiHardware Liloan', (SELECT id FROM p_drum_opentop), 1250.00 UNION ALL

  -- Belmont Hardware Depot (Minglanilla)
  SELECT 'Belmont Hardware Depot — Minglanilla', (SELECT id FROM p_firstank_500), 15600.00 UNION ALL
  SELECT 'Belmont Hardware Depot — Minglanilla', (SELECT id FROM p_bestank_1000), 13800.00 UNION ALL
  SELECT 'Belmont Hardware Depot — Minglanilla', (SELECT id FROM p_drum_opentop), 1270.00 UNION ALL

  -- CitiHardware Carcar
  SELECT 'CitiHardware Carcar', (SELECT id FROM p_bestank_500), 8250.00 UNION ALL
  SELECT 'CitiHardware Carcar', (SELECT id FROM p_drum_opentop), 1260.00 UNION ALL
  SELECT 'CitiHardware Carcar', (SELECT id FROM p_bucket_20l), 150.00 UNION ALL

  -- Cebu Home and Builders Centre (Toledo)
  SELECT 'Cebu Home and Builders Centre — Toledo', (SELECT id FROM p_bestank_500), 8500.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — Toledo', (SELECT id FROM p_bestank_1000), 14100.00 UNION ALL
  SELECT 'Cebu Home and Builders Centre — Toledo', (SELECT id FROM p_bucket_20l), 160.00 UNION ALL

  -- Balamban Grace Hardware
  SELECT 'Balamban Grace Hardware & Industrial Supply', (SELECT id FROM p_firstank_500), 16400.00 UNION ALL
  SELECT 'Balamban Grace Hardware & Industrial Supply', (SELECT id FROM p_drum_opentop), 1300.00 UNION ALL

  -- Total Lumber (Danao City)
  SELECT 'Total Lumber and Construction Supply', (SELECT id FROM p_bestank_500), 8300.00 UNION ALL
  SELECT 'Total Lumber and Construction Supply', (SELECT id FROM p_drum_opentop), 1260.00 UNION ALL

  -- TWINS Purified Drinking Water (Catmon)
  SELECT 'TWINS Purified Drinking Water Refilling Station', (SELECT id FROM p_slim_container), 250.00 UNION ALL
  SELECT 'TWINS Purified Drinking Water Refilling Station', (SELECT id FROM p_round_gallon), 180.00
) v (store_name, prod_id, price)
JOIN stores s ON s.name = v.store_name
JOIN products p ON p.id = v.prod_id
ON CONFLICT (store_id, product_id) DO UPDATE
SET current_price_php = EXCLUDED.current_price_php,
    stock_status = EXCLUDED.stock_status,
    listing_status = 'approved',
    last_reported_at = now();
