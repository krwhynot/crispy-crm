-- ============================================================================
-- PART 7: PRODUCTS (36 products - 4 per principal)
-- ============================================================================
-- Products from each principal manufacturer
-- Product IDs: 1-36
-- ============================================================================

INSERT INTO "public"."products" (
  id, name, category, principal_id, description, sku, status, created_at, updated_at
)
VALUES
  -- McCRUM Products (Principal ID: 1)
  (1, 'Premium Crinkle Cut Fries', 'Frozen Potato', 1, 'Classic crinkle cut fries, Idaho potatoes, 5/16" cut', 'MCR-FRY-001', 'active', NOW(), NOW()),
  (2, 'Seasoned Wedge Fries', 'Frozen Potato', 1, 'Skin-on potato wedges with seasoning blend', 'MCR-FRY-002', 'active', NOW(), NOW()),
  (3, 'Hash Brown Patties', 'Frozen Potato', 1, 'Formed hash brown patties, 2.25oz each', 'MCR-HB-001', 'active', NOW(), NOW()),
  (4, 'Diced Potatoes IQF', 'Frozen Potato', 1, '1/2" diced Idaho potatoes, individually quick frozen', 'MCR-DIC-001', 'active', NOW(), NOW()),

  -- SWAP Products (Principal ID: 2)
  (5, 'Plant-Based Crumbles', 'Plant-Based Protein', 2, 'Soy-free plant protein crumbles for tacos/bowls', 'SWP-PB-001', 'active', NOW(), NOW()),
  (6, 'Oat Milk Creamer', 'Dairy Alternative', 2, 'Barista-style oat milk, froths perfectly', 'SWP-OAT-001', 'active', NOW(), NOW()),
  (7, 'Cauliflower Rice', 'Vegetable', 2, 'Riced cauliflower, ready to heat', 'SWP-VEG-001', 'active', NOW(), NOW()),
  (8, 'Jackfruit Pulled Pork Style', 'Plant-Based Protein', 2, 'Seasoned young jackfruit, BBQ ready', 'SWP-PB-002', 'active', NOW(), NOW()),

  -- Rapid Rasoi Products (Principal ID: 3)
  (9, 'Garlic Naan', 'Bread', 3, 'Traditional Indian garlic naan, par-baked', 'RR-NAAN-001', 'active', NOW(), NOW()),
  (10, 'Butter Chicken Sauce', 'Sauce', 3, 'Authentic makhani sauce, heat and serve', 'RR-SAU-001', 'active', NOW(), NOW()),
  (11, 'Samosa (Vegetable)', 'Appetizer', 3, 'Crispy vegetable samosas, frozen', 'RR-APP-001', 'active', NOW(), NOW()),
  (12, 'Basmati Rice Pilaf', 'Rice', 3, 'Seasoned basmati rice with whole spices', 'RR-RICE-001', 'active', NOW(), NOW()),

  -- Lakeview Farms Products (Principal ID: 4)
  (13, 'French Onion Dip', 'Dip', 4, 'Creamy French onion dip, 5lb tub', 'LVF-DIP-001', 'active', NOW(), NOW()),
  (14, 'Fruit Parfait Cup', 'Dessert', 4, 'Layered yogurt parfait with granola', 'LVF-DES-001', 'active', NOW(), NOW()),
  (15, 'Spinach Artichoke Dip', 'Dip', 4, 'Premium spinach artichoke dip', 'LVF-DIP-002', 'active', NOW(), NOW()),
  (16, 'Cheesecake Slice', 'Dessert', 4, 'New York style cheesecake, pre-sliced', 'LVF-DES-002', 'active', NOW(), NOW()),

  -- Frico Products (Principal ID: 5)
  (17, 'Aged Parmesan Wheel', 'Cheese', 5, '24-month aged Parmigiano-Reggiano', 'FRC-CHE-001', 'active', NOW(), NOW()),
  (18, 'Gorgonzola Crumbles', 'Cheese', 5, 'Italian Gorgonzola, crumbled for salads', 'FRC-CHE-002', 'active', NOW(), NOW()),
  (19, 'Asiago Fresco', 'Cheese', 5, 'Young Asiago cheese, mild and creamy', 'FRC-CHE-003', 'active', NOW(), NOW()),
  (20, 'Shaved Parmesan', 'Cheese', 5, 'Pre-shaved Parmesan for finishing', 'FRC-CHE-004', 'active', NOW(), NOW()),

  -- Anchor Products (Principal ID: 6)
  (21, 'Professional Butter', 'Dairy', 6, 'New Zealand grass-fed butter, 82% fat', 'ANC-DAI-001', 'active', NOW(), NOW()),
  (22, 'Extra Thick Cream', 'Dairy', 6, 'Heavy cream for whipping, 40% fat', 'ANC-DAI-002', 'active', NOW(), NOW()),
  (23, 'UHT Cream Portions', 'Dairy', 6, 'Shelf-stable cream portions for coffee', 'ANC-DAI-003', 'active', NOW(), NOW()),
  (24, 'Clarified Butter', 'Dairy', 6, 'Ghee-style clarified butter for high-heat cooking', 'ANC-DAI-004', 'active', NOW(), NOW()),

  -- Tattooed Chef Products (Principal ID: 7)
  (25, 'Plant-Based Buddha Bowl', 'Frozen Entree', 7, 'Complete vegan meal bowl, quinoa base', 'TC-ENT-001', 'active', NOW(), NOW()),
  (26, 'Cauliflower Mac', 'Frozen Entree', 7, 'Plant-based mac and cheese alternative', 'TC-ENT-002', 'active', NOW(), NOW()),
  (27, 'Veggie Burrito', 'Frozen Entree', 7, 'Bean and vegetable burrito, vegan', 'TC-ENT-003', 'active', NOW(), NOW()),
  (28, 'Acai Bowl', 'Frozen Dessert', 7, 'Ready-to-serve acai bowl with toppings', 'TC-DES-001', 'active', NOW(), NOW()),

  -- Litehouse Products (Principal ID: 8)
  (29, 'Chunky Blue Cheese', 'Dressing', 8, 'Premium blue cheese dressing with chunks', 'LH-DRS-001', 'active', NOW(), NOW()),
  (30, 'Homestyle Ranch', 'Dressing', 8, 'Classic buttermilk ranch dressing', 'LH-DRS-002', 'active', NOW(), NOW()),
  (31, 'Caesar Dressing', 'Dressing', 8, 'Traditional Caesar with anchovy', 'LH-DRS-003', 'active', NOW(), NOW()),
  (32, 'Freeze-Dried Herbs', 'Seasoning', 8, 'Assorted freeze-dried herbs for finishing', 'LH-HRB-001', 'active', NOW(), NOW()),

  -- Custom Culinary Products (Principal ID: 9)
  (33, 'Gold Label Chicken Base', 'Base', 9, 'Premium chicken base, no MSG', 'CC-BAS-001', 'active', NOW(), NOW()),
  (34, 'Demi-Glace Concentrate', 'Sauce', 9, 'Classic French demi-glace, concentrated', 'CC-SAU-001', 'active', NOW(), NOW()),
  (35, 'Roasted Garlic Base', 'Base', 9, 'Roasted garlic flavor base for soups/sauces', 'CC-BAS-002', 'active', NOW(), NOW()),
  (36, 'Hollandaise Sauce Mix', 'Sauce', 9, 'Just-add-butter hollandaise mix', 'CC-SAU-002', 'active', NOW(), NOW());

-- Reset sequence
SELECT setval(pg_get_serial_sequence('products', 'id'), 36, true);
