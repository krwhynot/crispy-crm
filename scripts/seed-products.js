#!/usr/bin/env node

/**
 * Seed F&B Products Generator
 *
 * Generates realistic food and beverage product data including:
 * - Beverages (sodas, juices, energy drinks, coffee)
 * - Dairy products
 * - Frozen foods
 * - Fresh produce
 * - Meat & poultry
 * - Snacks
 * - Condiments and more
 *
 * Usage:
 *   node scripts/seed-products.js
 *   node scripts/seed-products.js --dry-run
 *   node scripts/seed-products.js --count=50
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";

dotenv.config();

const CONFIG = {
  PRODUCT_COUNT: parseInt(process.env.SEED_PRODUCT_COUNT || "100"),
  DRY_RUN: process.argv.includes("--dry-run"),
  VERBOSE: process.argv.includes("--verbose"),
  CLEAN: process.argv.includes("--clean"),
  COUNT:
    process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] ||
    null,
};

// Product categories from enum
const CATEGORIES = [
  "beverages",
  "dairy",
  "frozen",
  "fresh_produce",
  "meat_poultry",
  "seafood",
  "dry_goods",
  "snacks",
  "condiments",
  "baking_supplies",
  "spices_seasonings",
  "canned_goods",
  "pasta_grains",
  "oils_vinegars",
];

// F&B Product Templates by Category
const PRODUCT_TEMPLATES = {
  beverages: [
    { name: "Premium Craft Cola", brand: "Heritage Sodas", subcategory: "Soft Drinks" },
    { name: "Cold Brew Coffee Concentrate", brand: "Roasted Peak", subcategory: "Coffee" },
    { name: "Organic Green Tea", brand: "Mountain Spring", subcategory: "Tea" },
    { name: "Fresh Squeezed Orange Juice", brand: "Valley Fresh", subcategory: "Juice" },
    { name: "Sparkling Mineral Water", brand: "Pure Source", subcategory: "Water" },
    { name: "Energy Boost Drink", brand: "Vitality", subcategory: "Energy Drinks" },
    { name: "Kombucha Ginger Lemon", brand: "Living Cultures", subcategory: "Fermented" },
    { name: "Vanilla Almond Milk", brand: "PlantWise", subcategory: "Plant-Based" },
    { name: "Coconut Water", brand: "Tropical Harvest", subcategory: "Functional" },
    { name: "Craft Root Beer", brand: "Brewmaster's Choice", subcategory: "Craft Soda" },
  ],
  dairy: [
    { name: "Organic Whole Milk", brand: "Heritage Creamery", subcategory: "Milk" },
    { name: "Greek Yogurt Plain", brand: "Valley Dairy", subcategory: "Yogurt" },
    { name: "Sharp Cheddar Cheese", brand: "Artisan Cheese Co", subcategory: "Cheese" },
    { name: "Salted Butter", brand: "Farm Fresh", subcategory: "Butter" },
    { name: "Heavy Whipping Cream", brand: "Premium Dairy", subcategory: "Cream" },
    { name: "Vanilla Ice Cream", brand: "Sweet Scoops", subcategory: "Ice Cream" },
    { name: "Cream Cheese", brand: "Morning Fresh", subcategory: "Soft Cheese" },
    { name: "Sour Cream", brand: "Valley Dairy", subcategory: "Cultured" },
  ],
  frozen: [
    { name: "French Fries", brand: "Golden Crisp", subcategory: "Potato" },
    { name: "Mixed Vegetables", brand: "Farm Frozen", subcategory: "Vegetables" },
    { name: "Chicken Nuggets", brand: "Quick Chef", subcategory: "Poultry" },
    { name: "Pizza Dough Balls", brand: "Stone Fire", subcategory: "Dough" },
    { name: "Ice Cream Sandwich", brand: "Sweet Treats", subcategory: "Dessert" },
    { name: "Edamame", brand: "Garden Fresh", subcategory: "Asian" },
  ],
  fresh_produce: [
    { name: "Romaine Lettuce", brand: "Fresh Fork Farms", subcategory: "Lettuce" },
    { name: "Vine Tomatoes", brand: "Harvest Moon", subcategory: "Tomatoes" },
    { name: "Red Bell Peppers", brand: "Green Acres", subcategory: "Peppers" },
    { name: "Yellow Onions", brand: "Farm Fresh", subcategory: "Onions" },
    { name: "Baby Carrots", brand: "Crunchy Garden", subcategory: "Carrots" },
    { name: "Russet Potatoes", brand: "Idaho Gold", subcategory: "Potatoes" },
    { name: "Fresh Basil", brand: "Herb Garden", subcategory: "Herbs" },
  ],
  meat_poultry: [
    { name: "Chicken Breast", brand: "Farm Raised", subcategory: "Chicken" },
    { name: "Ground Beef 80/20", brand: "Prime Cuts", subcategory: "Beef" },
    { name: "Pork Tenderloin", brand: "Heritage Farms", subcategory: "Pork" },
    { name: "Turkey Breast", brand: "Free Range", subcategory: "Turkey" },
    { name: "Bacon Strips", brand: "Smoky Mountain", subcategory: "Bacon" },
  ],
  seafood: [
    { name: "Atlantic Salmon Fillet", brand: "Pacific Catch", subcategory: "Salmon" },
    { name: "Wild Caught Shrimp", brand: "Ocean Fresh", subcategory: "Shrimp" },
    { name: "Cod Fillet", brand: "North Sea", subcategory: "Whitefish" },
    { name: "Tuna Steak", brand: "Premium Catch", subcategory: "Tuna" },
  ],
  snacks: [
    { name: "Sea Salt Potato Chips", brand: "Crunch Co", subcategory: "Chips" },
    { name: "Trail Mix", brand: "Nature's Path", subcategory: "Nuts" },
    { name: "Protein Bar Chocolate", brand: "Energy Plus", subcategory: "Bars" },
    { name: "Pretzels", brand: "Golden Twist", subcategory: "Pretzels" },
    { name: "Popcorn Kernels", brand: "Pop Perfect", subcategory: "Popcorn" },
  ],
  condiments: [
    { name: "Organic Ketchup", brand: "Fusion Flavors", subcategory: "Ketchup" },
    { name: "Dijon Mustard", brand: "Gourmet Pantry", subcategory: "Mustard" },
    { name: "Sriracha Hot Sauce", brand: "The Spice Route", subcategory: "Hot Sauce" },
    { name: "Balsamic Vinegar", brand: "Italian Heritage", subcategory: "Vinegar" },
    { name: "Soy Sauce", brand: "Asian Fusion", subcategory: "Asian" },
  ],
  dry_goods: [
    { name: "All-Purpose Flour", brand: "Golden Grain Mills", subcategory: "Flour" },
    { name: "Granulated Sugar", brand: "Sweet Harvest", subcategory: "Sugar" },
    { name: "Brown Rice", brand: "Grain & Green", subcategory: "Rice" },
    { name: "Quinoa", brand: "Ancient Grains", subcategory: "Grains" },
  ],
  pasta_grains: [
    { name: "Spaghetti Pasta", brand: "Italian Import", subcategory: "Pasta" },
    { name: "Penne Rigate", brand: "Artisan Pasta", subcategory: "Pasta" },
    { name: "Jasmine Rice", brand: "Thai Harvest", subcategory: "Rice" },
    { name: "Steel Cut Oats", brand: "Morning Grain", subcategory: "Oats" },
  ],
};

// Common allergens
const ALLERGENS = ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy"];

// Certifications
const CERTIFICATIONS = ["organic", "non_gmo", "gluten_free", "kosher", "halal", "vegan", "fair_trade"];

class ProductSeeder {
  constructor() {
    this.supabase = null;
    this.products = [];
    this.principals = [];
    this.spinner = ora();
  }

  async initialize() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(chalk.blue("🍕 F&B Product Seeder initialized"));
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow("⚠️  DRY RUN mode - no data will be inserted"));
    }
  }

  async loadPrincipals() {
    this.spinner.start("Loading principal organizations...");

    const { data, error } = await this.supabase
      .from("organizations")
      .select("id, name")
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) {
      this.spinner.fail("No organizations found. Please seed organizations first.");
      throw new Error("No principal organizations available");
    }

    this.principals = data;
    this.spinner.succeed(`Found ${this.principals.length} organizations`);
  }

  generateProducts(count) {
    this.spinner.start(`Generating ${count} F&B products...`);

    for (let i = 0; i < count; i++) {
      const category = faker.helpers.arrayElement(CATEGORIES);
      const templates = PRODUCT_TEMPLATES[category] || [];
      const template = templates.length > 0
        ? faker.helpers.arrayElement(templates)
        : null;

      const principal = faker.helpers.arrayElement(this.principals);

      const name = template?.name || `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
      const brand = template?.brand || faker.company.name();
      // Note: brand and subcategory fields don't exist in database schema - used only for SKU generation

      const listPrice = faker.number.float({
        min: 5,
        max: 150,
        fractionDigits: 2
      });

      // Random allergens
      const productAllergens = faker.helpers.maybe(
        () => faker.helpers.arrayElements(ALLERGENS, { min: 1, max: 3 }),
        { probability: 0.4 }
      ) || [];

      // Random certifications
      const productCerts = faker.helpers.maybe(
        () => faker.helpers.arrayElements(CERTIFICATIONS, { min: 1, max: 2 }),
        { probability: 0.3 }
      ) || [];

      const product = {
        principal_id: principal.id,
        name,
        sku: `${brand.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
        category,
        subcategory,
        brand,
        description: faker.commerce.productDescription(),
        cost_per_unit: costPerUnit,
        list_price: listPrice,
        status: faker.helpers.weightedArrayElement([
          { weight: 80, value: "active" },
          { weight: 10, value: "seasonal" },
          { weight: 5, value: "limited_availability" },
          { weight: 5, value: "coming_soon" },
        ]),
        certifications: productCerts,
        allergens: productAllergens,
        ingredients: this.generateIngredients(category),
        nutritional_info: this.generateNutrition(category),
        marketing_description: faker.helpers.arrayElement([
          `Premium ${name} sourced from the finest suppliers`,
          `Award-winning ${name} - customer favorite`,
          `Fresh, high-quality ${name} for your kitchen`,
          `Artisan ${name} crafted with care`,
          `Sustainable ${name} - environmentally responsible`,
        ]),
        currency_code: "USD",
        unit_of_measure: faker.helpers.arrayElement(["EA", "LB", "KG", "OZ", "GAL", "L", "CASE", "BOX"]),
        minimum_order_quantity: faker.helpers.arrayElement([1, 6, 12, 24, 50]),
        manufacturer_part_number: faker.string.alphanumeric(10).toUpperCase(),
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      };

      this.products.push(product);
    }

    this.spinner.succeed(`Generated ${count} F&B products`);
  }

  generateIngredients(category) {
    const ingredientSets = {
      beverages: "Water, Natural Flavors, Citric Acid, Cane Sugar",
      dairy: "Milk, Active Cultures, Vitamin D",
      frozen: "Potatoes, Vegetable Oil, Salt, Dextrose",
      fresh_produce: "100% Fresh Produce",
      meat_poultry: "Chicken, Water, Salt, Natural Flavoring",
      seafood: "Wild Caught Fish, Water, Salt",
      snacks: "Potatoes, Sunflower Oil, Sea Salt",
      condiments: "Tomatoes, Vinegar, Sugar, Salt, Spices",
      dry_goods: "Enriched Wheat Flour, Niacin, Iron, Thiamine",
      pasta_grains: "Durum Wheat Semolina, Water",
    };

    return ingredientSets[category] || faker.lorem.words(5);
  }

  generateNutrition(category) {
    return {
      serving_size: faker.helpers.arrayElement(["1 cup", "100g", "1 piece", "8 oz"]),
      calories: faker.number.int({ min: 50, max: 500 }),
      total_fat_g: faker.number.int({ min: 0, max: 30 }),
      saturated_fat_g: faker.number.int({ min: 0, max: 10 }),
      trans_fat_g: 0,
      cholesterol_mg: faker.number.int({ min: 0, max: 100 }),
      sodium_mg: faker.number.int({ min: 0, max: 1000 }),
      total_carbs_g: faker.number.int({ min: 0, max: 60 }),
      dietary_fiber_g: faker.number.int({ min: 0, max: 10 }),
      sugars_g: faker.number.int({ min: 0, max: 30 }),
      protein_g: faker.number.int({ min: 0, max: 30 }),
    };
  }

  async insertProducts() {
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow("\n📝 DRY RUN - Products that would be inserted:"));
      console.log(chalk.gray(`  Total products: ${this.products.length}`));

      if (CONFIG.VERBOSE) {
        console.log("\nSample product:");
        console.log(JSON.stringify(this.products[0], null, 2));
      }

      return;
    }

    this.spinner.start("Inserting products into database...");

    try {
      const { error } = await this.supabase
        .from("products")
        .insert(this.products);

      if (error) throw error;

      this.spinner.succeed("Products inserted successfully");

      console.log(chalk.green("\n✨ F&B product seeding complete!"));
      console.log(chalk.gray(`  Total products: ${this.products.length}`));

      // Category breakdown
      const breakdown = {};
      this.products.forEach(p => {
        breakdown[p.category] = (breakdown[p.category] || 0) + 1;
      });

      console.log(chalk.gray("\n  Products by category:"));
      Object.entries(breakdown).forEach(([cat, count]) => {
        console.log(chalk.gray(`    ${cat}: ${count}`));
      });

    } catch (error) {
      this.spinner.fail(`Failed to insert products: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.loadPrincipals();

      const count = CONFIG.COUNT ? parseInt(CONFIG.COUNT) : CONFIG.PRODUCT_COUNT;
      this.generateProducts(count);
      await this.insertProducts();

      console.log(chalk.blue("\n🎉 Product seeding completed successfully!"));
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error.message);
      if (CONFIG.VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }
}

const seeder = new ProductSeeder();
seeder.run();
