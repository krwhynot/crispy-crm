#!/usr/bin/env node

/**
 * Add More Test Data
 *
 * Adds additional organizations and products to existing test data
 * without cleaning the database.
 *
 * Usage:
 *   node scripts/add-more-test-data.js
 *   node scripts/add-more-test-data.js --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";

dotenv.config();

const CONFIG = {
  ORGANIZATION_COUNT: 5,
  PRODUCT_COUNT: 25,
  DRY_RUN: process.argv.includes("--dry-run"),
  VERBOSE: process.argv.includes("--verbose"),
};

// F&B organization types
const FB_ORGANIZATION_TYPES = [
  "Quick Service Restaurant",
  "Fine Dining",
  "Fast Casual",
  "Food Manufacturing",
  "Beverage Production",
  "Food Distribution",
  "Catering & Events",
  "Food Technology",
  "Craft Beverage",
  "Specialty Foods",
  "Organic & Natural Foods",
  "Plant-Based Foods",
  "Restaurant Chain",
  "Brewery",
  "Winery",
  "Coffee Roaster",
  "Bakery Chain",
  "Ghost Kitchen",
  "Food Wholesaler",
];

// Additional company names not in the original list
const ADDITIONAL_COMPANY_NAMES = [
  "Sunset Grill & Bar",
  "Harmony Health Foods",
  "River City Brewing",
  "Peak Performance Nutrition",
  "Coastal Kitchen Collective",
  "Urban Harvest Markets",
  "Skyline Restaurant Group",
  "Pure Plate Meal Prep",
  "Golden Hour Bistro",
  "Evergreen Food Solutions",
];

// Product categories
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

// Product templates for variety
const PRODUCT_IDEAS = [
  { category: "beverages", name: "Hibiscus Iced Tea", brand: "Botanical Brews", subcategory: "Tea" },
  { category: "beverages", name: "Mango Smoothie Mix", brand: "Tropical Blends", subcategory: "Smoothies" },
  { category: "dairy", name: "Goat Cheese Log", brand: "Artisan Dairy", subcategory: "Specialty Cheese" },
  { category: "dairy", name: "Oat Milk Creamer", brand: "PlantWise", subcategory: "Plant-Based" },
  { category: "frozen", name: "Cauliflower Rice", brand: "Healthy Harvest", subcategory: "Vegetables" },
  { category: "frozen", name: "Veggie Burger Patties", brand: "Plant Power", subcategory: "Plant-Based" },
  { category: "fresh_produce", name: "Organic Kale", brand: "Green Acres", subcategory: "Leafy Greens" },
  { category: "fresh_produce", name: "Avocados", brand: "Farm Fresh", subcategory: "Specialty Produce" },
  { category: "meat_poultry", name: "Italian Sausage", brand: "Butcher's Best", subcategory: "Sausage" },
  { category: "seafood", name: "Crab Cakes", brand: "Coastal Cuisine", subcategory: "Prepared Seafood" },
  { category: "snacks", name: "Dark Chocolate Almonds", brand: "Sweet & Nutty", subcategory: "Nuts" },
  { category: "snacks", name: "Rice Cakes", brand: "Light Bites", subcategory: "Grain Snacks" },
  { category: "condiments", name: "Chipotle Mayo", brand: "Spicy Spreads", subcategory: "Mayo" },
  { category: "condiments", name: "Honey Mustard", brand: "Golden Jar", subcategory: "Mustard" },
  { category: "baking_supplies", name: "Vanilla Extract", brand: "Baker's Pride", subcategory: "Extracts" },
  { category: "baking_supplies", name: "Baking Powder", brand: "Rise & Shine", subcategory: "Leavening" },
  { category: "spices_seasonings", name: "Italian Seasoning", brand: "The Spice Route", subcategory: "Blends" },
  { category: "spices_seasonings", name: "Garlic Powder", brand: "Flavor First", subcategory: "Single Spice" },
  { category: "canned_goods", name: "Diced Tomatoes", brand: "Valley Harvest", subcategory: "Tomatoes" },
  { category: "canned_goods", name: "Black Beans", brand: "Protein Pantry", subcategory: "Beans" },
  { category: "pasta_grains", name: "Fettuccine", brand: "Italian Import", subcategory: "Pasta" },
  { category: "pasta_grains", name: "Wild Rice", brand: "Ancient Grains", subcategory: "Rice" },
  { category: "oils_vinegars", name: "Extra Virgin Olive Oil", brand: "Mediterranean Gold", subcategory: "Oil" },
  { category: "oils_vinegars", name: "Apple Cider Vinegar", brand: "Farm Fresh", subcategory: "Vinegar" },
  { category: "oils_vinegars", name: "Avocado Oil", brand: "Pure Press", subcategory: "Oil" },
];

// Allergens
const ALLERGENS = ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy"];

// Certifications
const CERTIFICATIONS = ["organic", "non_gmo", "gluten_free", "kosher", "halal", "vegan", "fair_trade"];

class AdditionalDataSeeder {
  constructor() {
    this.supabase = null;
    this.organizations = [];
    this.products = [];
    this.spinner = ora();
  }

  async initialize() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(chalk.blue("🚀 Additional Test Data Seeder initialized"));
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow("⚠️  DRY RUN mode - no data will be inserted"));
    }
  }

  generateOrganizations() {
    this.spinner.start(`Generating ${CONFIG.ORGANIZATION_COUNT} organizations...`);

    for (let i = 0; i < CONFIG.ORGANIZATION_COUNT; i++) {
      const companyName = ADDITIONAL_COMPANY_NAMES[i] ||
        `${faker.helpers.arrayElement([
          "Prime", "Fresh", "Golden", "Gourmet", "Chef's", "Artisan", "Modern", "Classic"
        ])} ${faker.helpers.arrayElement([
          "Kitchen", "Dining", "Foods", "Cuisine", "Bistro", "Eatery", "Market", "Provisions"
        ])}`;

      const orgType = faker.helpers.arrayElement(FB_ORGANIZATION_TYPES);

      const org = {
        name: companyName,
        industry: orgType,
        segment: faker.helpers.arrayElement(["SMB", "Mid-Market", "Enterprise"]),
        priority: faker.helpers.arrayElement(["A", "B", "C", "D"]),
        website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.com`,
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        state: faker.location.state(),
        postal_code: faker.location.zipCode(),
        country: "United States",
        linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
        phone: faker.phone.number(),
        email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.com`,
        annual_revenue: faker.number.int({ min: 500000, max: 50000000 }),
        employee_count: faker.number.int({ min: 10, max: 2000 }),
        founded_year: faker.number.int({ min: 1990, max: 2024 }),
        description: faker.helpers.arrayElement([
          "Serving fresh, locally-sourced cuisine",
          "Crafting premium beverages since 2010",
          "Your trusted food service partner",
          "Innovation in every bite",
          "Farm-to-table excellence",
          "Quality ingredients, exceptional taste",
          "Sustainable food solutions",
          "Bringing communities together through food",
          "Award-winning culinary experiences",
          "Fresh from our kitchen to your table",
        ]),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        created_at: faker.date.past({ years: 2 }),
        updated_at: faker.date.recent(),
      };

      this.organizations.push(org);
    }

    this.spinner.succeed(`Generated ${CONFIG.ORGANIZATION_COUNT} organizations`);
  }

  async insertOrganizations() {
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow("\n📝 DRY RUN - Organizations that would be inserted:"));
      console.log(chalk.gray(`  Total organizations: ${this.organizations.length}`));
      if (CONFIG.VERBOSE) {
        this.organizations.forEach(org => {
          console.log(chalk.gray(`    - ${org.name} (${org.industry})`));
        });
      }
      return;
    }

    this.spinner.start("Inserting organizations...");

    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .insert(this.organizations)
        .select();

      if (error) throw error;

      // Store returned data with IDs for product generation
      this.organizations = data;

      this.spinner.succeed("Organizations inserted successfully");
      console.log(chalk.green(`  ✓ Added ${this.organizations.length} organizations`));
      this.organizations.forEach(org => {
        console.log(chalk.gray(`    - ${org.name}`));
      });
    } catch (error) {
      this.spinner.fail(`Failed to insert organizations: ${error.message}`);
      throw error;
    }
  }

  async loadAllOrganizations() {
    this.spinner.start("Loading all organizations for product linking...");

    const { data, error } = await this.supabase
      .from("organizations")
      .select("id, name")
      .limit(200);

    if (error) throw error;

    if (!data || data.length === 0) {
      this.spinner.fail("No organizations found");
      throw new Error("No organizations available for product linking");
    }

    this.allOrganizations = data;
    this.spinner.succeed(`Loaded ${this.allOrganizations.length} organizations`);
  }

  generateProducts() {
    this.spinner.start(`Generating ${CONFIG.PRODUCT_COUNT} products...`);

    for (let i = 0; i < CONFIG.PRODUCT_COUNT; i++) {
      const template = PRODUCT_IDEAS[i % PRODUCT_IDEAS.length];
      const principal = faker.helpers.arrayElement(this.allOrganizations);

      const costPerUnit = faker.number.float({ min: 1, max: 50, fractionDigits: 2 });
      const listPrice = faker.number.float({
        min: costPerUnit * 1.5,
        max: costPerUnit * 3,
        fractionDigits: 2
      });

      const productAllergens = faker.helpers.maybe(
        () => faker.helpers.arrayElements(ALLERGENS, { min: 1, max: 3 }),
        { probability: 0.4 }
      ) || [];

      const productCerts = faker.helpers.maybe(
        () => faker.helpers.arrayElements(CERTIFICATIONS, { min: 1, max: 2 }),
        { probability: 0.3 }
      ) || [];

      const product = {
        principal_id: principal.id,
        name: template.name,
        sku: `${template.brand.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
        category: template.category,
        subcategory: template.subcategory,
        brand: template.brand,
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
        ingredients: this.generateIngredients(template.category),
        nutritional_info: this.generateNutrition(),
        marketing_description: `Premium ${template.name} from ${template.brand} - perfect for your F&B operations`,
        currency_code: "USD",
        unit_of_measure: faker.helpers.arrayElement(["EA", "LB", "KG", "OZ", "GAL", "L", "CASE", "BOX"]),
        minimum_order_quantity: faker.helpers.arrayElement([1, 6, 12, 24, 50]),
        manufacturer_part_number: faker.string.alphanumeric(10).toUpperCase(),
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      };

      this.products.push(product);
    }

    this.spinner.succeed(`Generated ${CONFIG.PRODUCT_COUNT} products`);
  }

  generateIngredients(category) {
    const ingredientSets = {
      beverages: "Water, Natural Flavors, Citric Acid, Cane Sugar",
      dairy: "Milk, Active Cultures, Vitamin D",
      frozen: "Vegetables, Water, Salt",
      fresh_produce: "100% Fresh Produce",
      meat_poultry: "Meat, Water, Salt, Natural Flavoring",
      seafood: "Wild Caught Seafood, Water, Salt",
      snacks: "Whole Grains, Sunflower Oil, Sea Salt",
      condiments: "Tomatoes, Vinegar, Sugar, Salt, Spices",
      baking_supplies: "Wheat Flour, Baking Soda, Salt",
      spices_seasonings: "Dried Herbs and Spices",
      canned_goods: "Vegetables, Water, Salt",
      pasta_grains: "Durum Wheat Semolina, Water",
      oils_vinegars: "100% Pure Oil/Vinegar",
    };

    return ingredientSets[category] || "Natural Ingredients";
  }

  generateNutrition() {
    return {
      serving_size: faker.helpers.arrayElement(["1 cup", "100g", "1 piece", "8 oz", "1 tbsp"]),
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

      const breakdown = {};
      this.products.forEach(p => {
        breakdown[p.category] = (breakdown[p.category] || 0) + 1;
      });

      console.log(chalk.gray("\n  Products by category:"));
      Object.entries(breakdown).forEach(([cat, count]) => {
        console.log(chalk.gray(`    ${cat}: ${count}`));
      });

      if (CONFIG.VERBOSE) {
        console.log("\nSample products:");
        this.products.slice(0, 3).forEach(p => {
          console.log(chalk.gray(`    - ${p.name} by ${p.brand} ($${p.list_price})`));
        });
      }

      return;
    }

    this.spinner.start("Inserting products...");

    try {
      const { error } = await this.supabase
        .from("products")
        .insert(this.products);

      if (error) throw error;

      this.spinner.succeed("Products inserted successfully");
      console.log(chalk.green(`  ✓ Added ${this.products.length} products`));

      const breakdown = {};
      this.products.forEach(p => {
        breakdown[p.category] = (breakdown[p.category] || 0) + 1;
      });

      console.log(chalk.gray("  Products by category:"));
      Object.entries(breakdown).forEach(([cat, count]) => {
        console.log(chalk.gray(`    ${cat}: ${count}`));
      });
    } catch (error) {
      this.spinner.fail(`Failed to insert products: ${error.message}`);
      throw error;
    }
  }

  async run() {
    try {
      await this.initialize();

      // Generate and insert organizations
      this.generateOrganizations();
      await this.insertOrganizations();

      // Load all organizations (including newly added ones) for product linking
      await this.loadAllOrganizations();

      // Generate and insert products
      this.generateProducts();
      await this.insertProducts();

      console.log(chalk.green("\n✨ Additional test data generation complete!"));
      console.log(chalk.gray(`  Organizations added: ${CONFIG.ORGANIZATION_COUNT}`));
      console.log(chalk.gray(`  Products added: ${CONFIG.PRODUCT_COUNT}`));

    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error.message);
      if (CONFIG.VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }
}

const seeder = new AdditionalDataSeeder();
seeder.run();
