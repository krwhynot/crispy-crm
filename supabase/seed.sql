-- Seed data for development
-- This file runs automatically after migrations on `supabase db reset`

-- Create test user (admin@test.com / password123)
-- Note: Password is auto-confirmed in local environment
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at;

-- Note: Sales record is auto-created by database trigger when auth.users is inserted

-- Insert 5 Principal Organizations
-- Removed columns: email, notes (dropped in cleanup), is_principal (replaced by organization_type enum)
INSERT INTO organizations (name, organization_type, priority, website, phone, description, created_at, updated_at)
VALUES
  (
    'Heritage Creamery Foods',
    'principal',
    'A',
    'https://heritagecreamery.com',
    '555-0101',
    'Premium dairy products manufacturer specializing in organic milk, cheese, and yogurt. Family-owned since 1985.',
    NOW(),
    NOW()
  ),
  (
    'Pacific Catch Seafood Co',
    'principal',
    'A',
    'https://pacificcatch.com',
    '555-0102',
    'Sustainable seafood supplier offering wild-caught fish, shellfish, and value-added seafood products.',
    NOW(),
    NOW()
  ),
  (
    'Artisan Pantry Foods',
    'principal',
    'B',
    'https://artisanpantry.com',
    '555-0103',
    'Gourmet condiments, sauces, and specialty food items. Known for organic ingredients and innovative flavors.',
    NOW(),
    NOW()
  ),
  (
    'Mountain Spring Beverage Group',
    'principal',
    'A',
    'https://mountainspring.com',
    '555-0104',
    'Natural beverage manufacturer - sparkling water, cold brew coffee, and organic teas.',
    NOW(),
    NOW()
  ),
  (
    'Farm Fresh Provisions',
    'principal',
    'B',
    'https://farmfreshprovisions.com',
    '555-0105',
    'Frozen and fresh produce supplier. Specializes in farm-to-table ingredients and seasonal offerings.',
    NOW(),
    NOW()
  );

-- Insert 25 products (5 per principal)
-- Get principal IDs dynamically
WITH principal_ids AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM organizations
  WHERE organization_type = 'principal'
  ORDER BY id
  LIMIT 5
)
INSERT INTO products (principal_id, name, sku, category, description, list_price, status, currency_code, unit_of_measure, created_at, updated_at)
SELECT
  principal_ids.id,
  product_name,
  sku,
  category::product_category,
  description,
  list_price,
  'active'::product_status,
  'USD',
  unit_of_measure,
  NOW(),
  NOW()
FROM principal_ids
CROSS JOIN LATERAL (
  VALUES
    -- Heritage Creamery Foods products (rn=1)
    (1, 'Organic Whole Milk', 'HER-MLK001', 'dairy', 'Fresh organic whole milk from grass-fed cows', 4.99, 'GAL'),
    (1, 'Greek Yogurt Plain', 'HER-YOG001', 'dairy', 'Thick and creamy Greek yogurt with live cultures', 6.49, 'EA'),
    (1, 'Sharp Cheddar Cheese', 'HER-CHZ001', 'dairy', 'Aged sharp cheddar cheese block', 8.99, 'LB'),
    (1, 'Heavy Whipping Cream', 'HER-CRM001', 'dairy', 'Ultra-pasteurized heavy cream', 5.99, 'QT'),
    (1, 'Vanilla Ice Cream', 'HER-ICE001', 'dairy', 'Premium vanilla ice cream', 7.99, 'GAL'),

    -- Pacific Catch Seafood products (rn=2)
    (2, 'Atlantic Salmon Fillet', 'PAC-SAL001', 'seafood', 'Fresh Atlantic salmon fillets', 18.99, 'LB'),
    (2, 'Wild Caught Shrimp', 'PAC-SHR001', 'seafood', 'Large wild-caught shrimp', 16.99, 'LB'),
    (2, 'Cod Fillet', 'PAC-COD001', 'seafood', 'Premium Atlantic cod fillets', 14.99, 'LB'),
    (2, 'Tuna Steak', 'PAC-TUN001', 'seafood', 'Sushi-grade yellowfin tuna steaks', 22.99, 'LB'),
    (2, 'Lobster Tail', 'PAC-LOB001', 'seafood', 'Cold water lobster tails', 28.99, 'EA'),

    -- Artisan Pantry Foods products (rn=3)
    (3, 'Organic Ketchup', 'ART-KET001', 'condiments', 'Organic tomato ketchup', 4.49, 'CASE'),
    (3, 'Dijon Mustard', 'ART-MUS001', 'condiments', 'Stone-ground Dijon mustard', 5.99, 'CASE'),
    (3, 'Sriracha Hot Sauce', 'ART-SRI001', 'condiments', 'Premium sriracha hot sauce', 6.49, 'CASE'),
    (3, 'Balsamic Vinegar', 'ART-BAL001', 'oils_vinegars', 'Aged balsamic vinegar', 12.99, 'EA'),
    (3, 'Soy Sauce', 'ART-SOY001', 'condiments', 'Naturally brewed soy sauce', 4.99, 'CASE'),

    -- Mountain Spring Beverage Group products (rn=4)
    (4, 'Cold Brew Coffee', 'MSB-COF001', 'beverages', 'Premium cold brew coffee concentrate', 12.99, 'EA'),
    (4, 'Organic Green Tea', 'MSB-TEA001', 'beverages', 'Organic green tea leaves', 8.99, 'BOX'),
    (4, 'Sparkling Mineral Water', 'MSB-WAT001', 'beverages', 'Naturally carbonated mineral water', 1.99, 'CASE'),
    (4, 'Energy Boost Drink', 'MSB-ENE001', 'beverages', 'Natural energy drink', 3.49, 'CASE'),
    (4, 'Kombucha Ginger Lemon', 'MSB-KOM001', 'beverages', 'Organic kombucha with ginger', 4.99, 'CASE'),

    -- Farm Fresh Provisions products (rn=5)
    (5, 'French Fries', 'FFP-FRI001', 'frozen', 'Crispy straight-cut French fries', 5.99, 'CASE'),
    (5, 'Mixed Vegetables', 'FFP-VEG001', 'frozen', 'Flash-frozen mixed vegetables', 4.49, 'CASE'),
    (5, 'Romaine Lettuce', 'FFP-LET001', 'fresh_produce', 'Fresh romaine lettuce hearts', 3.99, 'CASE'),
    (5, 'Vine Tomatoes', 'FFP-TOM001', 'fresh_produce', 'Fresh vine-ripened tomatoes', 4.99, 'LB'),
    (5, 'Baby Carrots', 'FFP-CAR001', 'fresh_produce', 'Fresh baby carrots', 3.49, 'CASE')
) AS products(principal_rn, product_name, sku, category, description, list_price, unit_of_measure)
WHERE principal_ids.rn = products.principal_rn;
