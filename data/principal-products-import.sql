-- Import Principal Organizations and Products
-- Generated from user-provided product list
-- Date: 2025-10-22

BEGIN;

-- Insert Principal Organizations
INSERT INTO organizations (name, organization_type, priority, created_at, updated_at)
VALUES
  ('Kaufholds', 'principal', 'A', NOW(), NOW()),
  ('Frites Street', 'principal', 'A', NOW(), NOW()),
  ('Better Balance', 'principal', 'A', NOW(), NOW()),
  ('VAF', 'principal', 'A', NOW(), NOW()),
  ('Ofk', 'principal', 'B', NOW(), NOW()),
  ('Annasea', 'principal', 'A', NOW(), NOW()),
  ('Wicks', 'principal', 'B', NOW(), NOW()),
  ('RJC', 'principal', 'B', NOW(), NOW()),
  ('Kayco', 'principal', 'A', NOW(), NOW()),
  ('Abdale', 'principal', 'B', NOW(), NOW()),
  ('Mccrum', 'principal', 'A', NOW(), NOW()),
  ('Rapid Rasoi', 'principal', 'A', NOW(), NOW()),
  ('SWAP', 'principal', 'B', NOW(), NOW()),
  ('Never Better', 'principal', 'B', NOW(), NOW()),
  ('TCFB', 'principal', 'B', NOW(), NOW()),
  ('Mrs Ressler''s', 'principal', 'B', NOW(), NOW());

-- Get principal IDs for product insertion
WITH principals AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY
      CASE name
        WHEN 'Kaufholds' THEN 1
        WHEN 'Frites Street' THEN 2
        WHEN 'Better Balance' THEN 3
        WHEN 'VAF' THEN 4
        WHEN 'Ofk' THEN 5
        WHEN 'Annasea' THEN 6
        WHEN 'Wicks' THEN 7
        WHEN 'RJC' THEN 8
        WHEN 'Kayco' THEN 9
        WHEN 'Abdale' THEN 10
        WHEN 'Mccrum' THEN 11
        WHEN 'Rapid Rasoi' THEN 12
        WHEN 'SWAP' THEN 13
        WHEN 'Never Better' THEN 14
        WHEN 'TCFB' THEN 15
        WHEN 'Mrs Ressler''s' THEN 16
      END
    ) as principal_order
  FROM organizations
  WHERE name IN (
    'Kaufholds', 'Frites Street', 'Better Balance', 'VAF',
    'Ofk', 'Annasea', 'Wicks', 'RJC', 'Kayco', 'Abdale',
    'Mccrum', 'Rapid Rasoi', 'SWAP', 'Never Better', 'TCFB', 'Mrs Ressler''s'
  )
)
INSERT INTO products (principal_id, name, sku, category, status, currency_code, unit_of_measure, created_at, updated_at)
SELECT
  p.id as principal_id,
  product_name,
  sku,
  category::product_category,
  'active'::product_status,
  'USD',
  unit_of_measure,
  NOW(),
  NOW()
FROM principals p
CROSS JOIN LATERAL (
  VALUES
    -- Kaufholds Products (principal_order=1)
    (1, 'Garlic', 'KAUF-GAR001', 'condiments', 'EA'),
    (1, 'Jalapeno', 'KAUF-JAL001', 'condiments', 'EA'),
    (1, 'Dill Pickle', 'KAUF-DIL001', 'condiments', 'EA'),
    (1, 'Original White Cheddar', 'KAUF-CHD001', 'dairy', 'LB'),
    (1, 'Yellow Curds', 'KAUF-CRD001', 'dairy', 'LB'),
    (1, 'Sirracha', 'KAUF-SIR001', 'condiments', 'EA'),
    (1, 'Cajun', 'KAUF-CAJ001', 'condiments', 'EA'),
    (1, 'Bakeable', 'KAUF-BAK001', 'frozen', 'CASE'),
    (1, 'Ranch', 'KAUF-RAN001', 'condiments', 'EA'),
    (1, 'Italian Mozzarella Bites', 'KAUF-MOZ001', 'dairy', 'LB'),
    (1, 'Original White Cheddar', 'KAUF-CHD002', 'dairy', 'LB'),

    -- Frites Street Products (principal_order=2)
    (2, 'Frites street 3/8', 'FRIT-038001', 'frozen', 'CASE'),
    (2, 'Frites street 1/4', 'FRIT-014001', 'frozen', 'CASE'),
    (2, 'Frites street 1/2', 'FRIT-012001', 'frozen', 'CASE'),
    (2, 'Frites street 3/4', 'FRIT-034001', 'frozen', 'CASE'),
    (2, 'Frites street crinkle', 'FRIT-CRN001', 'frozen', 'CASE'),
    (2, 'Frites street waffle', 'FRIT-WAF001', 'frozen', 'CASE'),
    (2, 'Frites street cottage', 'FRIT-COT001', 'frozen', 'CASE'),
    (2, 'Frites street lattice', 'FRIT-LAT001', 'frozen', 'CASE'),
    (2, 'Frites street home fries', 'FRIT-HOM001', 'frozen', 'CASE'),
    (2, 'Frites stree cowboy chips', 'FRIT-COW001', 'frozen', 'CASE'),
    (2, 'Cowboy chips', 'FRIT-COW002', 'frozen', 'CASE'),

    -- Better Balance Products (principal_order=3)
    (3, 'Better Balance hot dogs', 'BBAL-HOT001', 'meat_poultry', 'CASE'),
    (3, 'Shreds', 'BBAL-SHR001', 'fresh_produce', 'LB'),
    (3, 'Cheese', 'BBAL-CHE001', 'dairy', 'LB'),
    (3, 'Crumble', 'BBAL-CRM001', 'dairy', 'LB'),

    -- VAF Products (principal_order=4)
    (4, 'Red Romaine', 'VAF-ROM001', 'fresh_produce', 'CASE'),
    (4, 'Bibb Lettuce', 'VAF-BIB001', 'fresh_produce', 'CASE'),
    (4, 'Green Romaine', 'VAF-GRN001', 'fresh_produce', 'CASE'),
    (4, 'Chef''s Mix', 'VAF-MIX001', 'fresh_produce', 'CASE'),
    (4, 'Viola Editable Flowers', 'VAF-VIO001', 'fresh_produce', 'EA'),
    (4, 'Micros', 'VAF-MIC001', 'fresh_produce', 'EA'),
    (4, 'All', 'VAF-ALL001', 'fresh_produce', 'CASE'),
    (4, 'VAF BLITZ', 'VAF-BLI001', 'fresh_produce', 'CASE'),

    -- Ofk Products (principal_order=5)
    (5, 'Potato pancake', 'OFK-POT001', 'frozen', 'CASE'),
    (5, 'Crepes', 'OFK-CRP001', 'frozen', 'CASE'),
    (5, 'Ahi Tuna', 'OFK-AHI001', 'seafood', 'LB'),

    -- Annasea Products (principal_order=6)
    (6, 'Bulk pack', 'ANNA-BLK001', 'seafood', 'CASE'),

    -- Wicks Products (principal_order=7)
    -- No products listed

    -- RJC Products (principal_order=8)
    -- No products listed

    -- Kayco Products (principal_order=9)
    (9, 'Wonder juice', 'KAYC-WON001', 'beverages', 'CASE'),

    -- Abdale Products (principal_order=10)
    -- No products listed

    -- Mccrum Products (principal_order=11)
    (11, 'Dehli Tikka Masala', 'MCCR-TIK001', 'condiments', 'EA'),
    (11, 'Makhani', 'MCCR-MAK001', 'condiments', 'EA'),

    -- Rapid Rasoi Products (principal_order=12)
    (12, 'Chicken', 'RAPID-CHK001', 'meat_poultry', 'LB'),

    -- SWAP Products (principal_order=13)
    (13, '1 oz pouch', 'SWAP-PCH001', 'condiments', 'CASE'),
    (13, 'parmesan', 'SWAP-PAR001', 'dairy', 'LB'),
    (13, 'mozzarrella', 'SWAP-MOZ001', 'dairy', 'LB'),
    (13, 'cheddar', 'SWAP-CHD001', 'dairy', 'LB'),

    -- Never Better Products (principal_order=14)
    -- No products listed

    -- TCFB Products (principal_order=15)
    -- No products listed

    -- Mrs Ressler's Products (principal_order=16)
    -- No products listed

    -- Unknown category (to be categorized later)
    (1, 'Unknown', 'UNK-001', 'other', 'EA'),
    (2, 'Unknown', 'UNK-002', 'other', 'EA'),
    (3, 'Unknown', 'UNK-003', 'other', 'EA'),
    (4, 'Unknown', 'UNK-004', 'other', 'EA'),
    (5, 'Unknown', 'UNK-005', 'other', 'EA'),
    (6, 'Unknown', 'UNK-006', 'other', 'EA'),
    (7, 'Unknown', 'UNK-007', 'other', 'EA'),
    (8, 'Unknown', 'UNK-008', 'other', 'EA'),
    (9, 'Unknown', 'UNK-009', 'other', 'EA'),
    (10, 'Unknown', 'UNK-010', 'other', 'EA'),
    (11, 'Unknown', 'UNK-011', 'other', 'EA'),
    (12, 'Unknown', 'UNK-012', 'other', 'EA')

) AS products(principal_order, product_name, sku, category, unit_of_measure)
WHERE p.principal_order = products.principal_order;

COMMIT;

-- Verification
SELECT
  'Principal Organizations Added' as summary,
  COUNT(*) as count
FROM organizations
WHERE organization_type = 'principal';

SELECT
  'Products Added' as summary,
  COUNT(*) as count
FROM products;

-- Show breakdown by principal
SELECT
  o.name as principal_name,
  COUNT(p.id) as product_count
FROM organizations o
LEFT JOIN products p ON p.principal_id = o.id
WHERE o.organization_type = 'principal'
GROUP BY o.id, o.name
ORDER BY o.name;
