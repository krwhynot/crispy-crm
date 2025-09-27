#!/usr/bin/env node

/**
 * Seed script for products table
 * Tests single-point validation at API boundary
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (try multiple locations)
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test product data - includes valid and invalid cases for validation testing
const testProducts = [
  // Valid products
  {
    name: "Organic Whole Milk",
    sku: "DAIRY-MILK-001",
    principal_id: 1, // Assuming principal with ID 1 exists
    category: "dairy",
    description: "Fresh organic whole milk from local farms",
    brand: "Happy Farms",
    upc: "012345678901",
    status: "active",
    unit_of_measure: "gallon",
    list_price: 4.99,
    cost_per_unit: 3.50,
    map_price: 4.49,
    min_order_quantity: 6,
    units_per_case: 4,
    lead_time_days: 2,
    subcategory: "Milk & Cream"
  },
  {
    name: "Artisan Sourdough Bread",
    sku: "BAKE-BREAD-002",
    principal_id: 1,
    category: "baking_supplies",
    description: "Hand-crafted sourdough with 48-hour fermentation",
    brand: "Village Bakery",
    upc: "012345678902",
    status: "active",
    unit_of_measure: "each",
    list_price: 6.99,
    cost_per_unit: 4.20,
    map_price: 5.99,
    min_order_quantity: 12,
    units_per_case: 6,
    lead_time_days: 1,
    subcategory: "Bread & Rolls"
  },
  {
    name: "Wild-Caught Salmon Fillet",
    sku: "SEAFOOD-SALMON-003",
    principal_id: 1,
    category: "seafood",
    description: "Fresh Atlantic salmon, sustainably sourced",
    brand: "Ocean's Best",
    upc: "012345678903",
    status: "seasonal",
    unit_of_measure: "pound",
    list_price: 14.99,
    cost_per_unit: 10.50,
    map_price: 12.99,
    min_order_quantity: 5,
    units_per_case: 10,
    lead_time_days: 3,
    subcategory: "Fresh Fish"
  },
  {
    name: "Premium Coffee Beans",
    sku: "BEV-COFFEE-004",
    principal_id: 1,
    category: "beverages",
    description: "Single-origin Arabica beans, medium roast",
    brand: "Mountain Roasters",
    upc: "012345678904",
    status: "active",
    unit_of_measure: "pound",
    list_price: 18.99,
    cost_per_unit: 12.00,
    map_price: 15.99,
    min_order_quantity: 10,
    units_per_case: 12,
    lead_time_days: 7,
    subcategory: "Coffee & Tea"
  },
  {
    name: "Organic Baby Spinach",
    sku: "PRODUCE-SPIN-005",
    principal_id: 1,
    category: "fresh_produce",
    description: "Pre-washed organic baby spinach leaves",
    brand: "Green Gardens",
    upc: "012345678905",
    status: "active",
    unit_of_measure: "case",
    list_price: 24.99,
    cost_per_unit: 18.00,
    map_price: 22.99,
    min_order_quantity: 1,
    units_per_case: 24,
    lead_time_days: 1,
    subcategory: "Leafy Greens"
  }
];

// Invalid products for validation testing
const invalidProducts = [
  {
    // Missing required name
    sku: "INVALID-001",
    principal_id: 1,
    category: "dairy",
    description: "This should fail - missing name"
  },
  {
    name: "Invalid Price Product",
    sku: "INVALID-002",
    principal_id: 1,
    category: "beverages",
    list_price: -10, // Negative price should fail validation
    cost_per_unit: -5 // Negative cost should fail
  },
  {
    name: "Invalid Category Product",
    sku: "INVALID-003",
    principal_id: 1,
    category: "not_a_real_category", // Invalid category should fail
  },
  {
    name: "Missing Principal",
    sku: "INVALID-004",
    // Missing principal_id should fail
    category: "snacks",
  }
];

async function seedProducts() {
  console.log('🌱 Starting product seed...\n');

  // First, let's get or create a principal (supplier)
  console.log('📦 Checking for principal/supplier...');
  const { data: principals, error: principalError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('is_principal', true)
    .limit(1);

  let principalId = 1;

  if (principalError || !principals || principals.length === 0) {
    console.log('Creating test principal/supplier...');
    const { data: newPrincipal, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Food Supplier Co.',
        organization_type: 'principal',
        is_principal: true,
        segment: 'Food & Beverage Distribution'  // Changed from sector to segment
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating principal:', createError);
      process.exit(1);
    }

    principalId = newPrincipal.id;
    console.log(`✅ Created principal: ${newPrincipal.name} (ID: ${principalId})`);
  } else {
    principalId = principals[0].id;
    console.log(`✅ Using existing principal: ${principals[0].name} (ID: ${principalId})`);
  }

  // Update product data with correct principal_id
  const productsWithPrincipal = testProducts.map(p => ({
    ...p,
    principal_id: principalId
  }));

  // Insert valid products
  console.log('\n📝 Inserting valid test products...');

  for (const product of productsWithPrincipal) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select();

    if (error) {
      console.error(`❌ Error inserting ${product.name}:`, error.message);
    } else {
      console.log(`✅ Inserted: ${product.name} (${product.sku})`);
    }
  }

  // Test validation with invalid products
  console.log('\n🧪 Testing validation with invalid products...');

  for (const invalidProduct of invalidProducts) {
    const testProduct = {
      ...invalidProduct,
      principal_id: invalidProduct.principal_id || principalId
    };

    const { data, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select();

    if (error) {
      console.log(`✅ Validation working: ${error.message}`);
    } else {
      console.log(`⚠️  Invalid product was accepted: ${JSON.stringify(invalidProduct)}`);
    }
  }

  // Fetch and display all products
  console.log('\n📊 Current products in database:');
  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      category,
      status,
      list_price,
      principal:organizations!principal_id(name)
    `)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError);
  } else {
    console.table(allProducts.map(p => ({
      ID: p.id,
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      Status: p.status,
      Price: `$${p.list_price || 0}`,
      Supplier: p.principal?.name || 'Unknown'
    })));
    console.log(`\n✅ Total products: ${allProducts.length}`);
  }
}

// Run the seed
seedProducts().catch(console.error);