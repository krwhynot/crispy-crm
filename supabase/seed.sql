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
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  ''
);

-- Create sales record for admin user
INSERT INTO sales (user_id, first_name, last_name, email, is_admin, created_at, updated_at)
VALUES (
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'Admin',
  'User',
  'admin@test.com',
  true,
  NOW(),
  NOW()
);

-- Insert 5 Principal Organizations
INSERT INTO organizations (name, organization_type, priority, website, phone, email, notes, is_principal, created_at, updated_at)
VALUES
  (
    'Heritage Creamery Foods',
    'principal',
    'A',
    'https://heritagecreamery.com',
    '555-0101',
    'info@heritagecreamery.com',
    'Premium dairy products manufacturer specializing in organic milk, cheese, and yogurt. Family-owned since 1985.',
    true,
    NOW(),
    NOW()
  ),
  (
    'Pacific Catch Seafood Co',
    'principal',
    'A',
    'https://pacificcatch.com',
    '555-0102',
    'sales@pacificcatch.com',
    'Sustainable seafood supplier offering wild-caught fish, shellfish, and value-added seafood products.',
    true,
    NOW(),
    NOW()
  ),
  (
    'Artisan Pantry Foods',
    'principal',
    'B',
    'https://artisanpantry.com',
    '555-0103',
    'contact@artisanpantry.com',
    'Gourmet condiments, sauces, and specialty food items. Known for organic ingredients and innovative flavors.',
    true,
    NOW(),
    NOW()
  ),
  (
    'Mountain Spring Beverage Group',
    'principal',
    'A',
    'https://mountainspring.com',
    '555-0104',
    'sales@mountainspring.com',
    'Natural beverage manufacturer - sparkling water, cold brew coffee, and organic teas.',
    true,
    NOW(),
    NOW()
  ),
  (
    'Farm Fresh Provisions',
    'principal',
    'B',
    'https://farmfreshprovisions.com',
    '555-0105',
    'wholesale@farmfreshprovisions.com',
    'Frozen and fresh produce supplier. Specializes in farm-to-table ingredients and seasonal offerings.',
    true,
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
INSERT INTO products (principal_id, name, sku, category, description, list_price, status, currency_code, unit_of_measure, minimum_order_quantity, created_at, updated_at)
SELECT
  principal_id,
  product_name,
  sku,
  category::product_category,
  description,
  list_price,
  'active'::product_status,
  'USD',
  unit_of_measure,
  minimum_order_quantity,
  NOW(),
  NOW()
FROM principal_ids
CROSS JOIN LATERAL (
  VALUES
    -- Heritage Creamery Foods products (rn=1)
    (1, 'Organic Whole Milk', 'HER-MLK001', 'dairy', 'Fresh organic whole milk from grass-fed cows', 4.99, 'GAL', 12),
    (1, 'Greek Yogurt Plain', 'HER-YOG001', 'dairy', 'Thick and creamy Greek yogurt with live cultures', 6.49, 'EA', 24),
    (1, 'Sharp Cheddar Cheese', 'HER-CHZ001', 'dairy', 'Aged sharp cheddar cheese block', 8.99, 'LB', 6),
    (1, 'Heavy Whipping Cream', 'HER-CRM001', 'dairy', 'Ultra-pasteurized heavy cream', 5.99, 'QT', 12),
    (1, 'Vanilla Ice Cream', 'HER-ICE001', 'dairy', 'Premium vanilla ice cream', 7.99, 'GAL', 6),

    -- Pacific Catch Seafood products (rn=2)
    (2, 'Atlantic Salmon Fillet', 'PAC-SAL001', 'seafood', 'Fresh Atlantic salmon fillets', 18.99, 'LB', 10),
    (2, 'Wild Caught Shrimp', 'PAC-SHR001', 'seafood', 'Large wild-caught shrimp', 16.99, 'LB', 10),
    (2, 'Cod Fillet', 'PAC-COD001', 'seafood', 'Premium Atlantic cod fillets', 14.99, 'LB', 10),
    (2, 'Tuna Steak', 'PAC-TUN001', 'seafood', 'Sushi-grade yellowfin tuna steaks', 22.99, 'LB', 8),
    (2, 'Lobster Tail', 'PAC-LOB001', 'seafood', 'Cold water lobster tails', 28.99, 'EA', 12),

    -- Artisan Pantry Foods products (rn=3)
    (3, 'Organic Ketchup', 'ART-KET001', 'condiments', 'Organic tomato ketchup', 4.49, 'CASE', 12),
    (3, 'Dijon Mustard', 'ART-MUS001', 'condiments', 'Stone-ground Dijon mustard', 5.99, 'CASE', 12),
    (3, 'Sriracha Hot Sauce', 'ART-SRI001', 'condiments', 'Premium sriracha hot sauce', 6.49, 'CASE', 12),
    (3, 'Balsamic Vinegar', 'ART-BAL001', 'oils_vinegars', 'Aged balsamic vinegar', 12.99, 'EA', 6),
    (3, 'Soy Sauce', 'ART-SOY001', 'condiments', 'Naturally brewed soy sauce', 4.99, 'CASE', 12),

    -- Mountain Spring Beverage Group products (rn=4)
    (4, 'Cold Brew Coffee', 'MSB-COF001', 'beverages', 'Premium cold brew coffee concentrate', 12.99, 'EA', 12),
    (4, 'Organic Green Tea', 'MSB-TEA001', 'beverages', 'Organic green tea leaves', 8.99, 'BOX', 24),
    (4, 'Sparkling Mineral Water', 'MSB-WAT001', 'beverages', 'Naturally carbonated mineral water', 1.99, 'CASE', 24),
    (4, 'Energy Boost Drink', 'MSB-ENE001', 'beverages', 'Natural energy drink', 3.49, 'CASE', 24),
    (4, 'Kombucha Ginger Lemon', 'MSB-KOM001', 'beverages', 'Organic kombucha with ginger', 4.99, 'CASE', 12),

    -- Farm Fresh Provisions products (rn=5)
    (5, 'French Fries', 'FFP-FRI001', 'frozen', 'Crispy straight-cut French fries', 5.99, 'CASE', 6),
    (5, 'Mixed Vegetables', 'FFP-VEG001', 'frozen', 'Flash-frozen mixed vegetables', 4.49, 'CASE', 12),
    (5, 'Romaine Lettuce', 'FFP-LET001', 'fresh_produce', 'Fresh romaine lettuce hearts', 3.99, 'CASE', 24),
    (5, 'Vine Tomatoes', 'FFP-TOM001', 'fresh_produce', 'Fresh vine-ripened tomatoes', 4.99, 'LB', 20),
    (5, 'Baby Carrots', 'FFP-CAR001', 'fresh_produce', 'Fresh baby carrots', 3.49, 'CASE', 24)
) AS products(principal_rn, product_name, sku, category, description, list_price, unit_of_measure, minimum_order_quantity)
WHERE principal_ids.rn = products.principal_rn;
