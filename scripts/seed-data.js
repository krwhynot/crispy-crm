#!/usr/bin/env node

/**
 * Seed Data Generator for Development and Testing
 *
 * Generates test data for the CRM system including:
 * - Organizations and contacts with many-to-many relationships
 * - Opportunities (formerly deals) with participants
 * - Activities and interactions
 * - Notes and tags
 *
 * Usage:
 *   npm run seed:data           - Generate and insert seed data
 *   npm run seed:data -- --dry-run  - Preview data without inserting
 *   npm run seed:data -- --count=100 - Generate specific number of records
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";

// Load environment variables
// Load .env.local first (overrides .env)
dotenv.config({ path: ".env.local", override: true });
// Then load .env as fallback
dotenv.config();

// Configuration
const CONFIG = {
  // Test user ID (bigint sales.id for linking data to specific test user)
  TEST_USER_ID: process.env.TEST_USER_ID ? parseInt(process.env.TEST_USER_ID) : null,

  // Default counts
  ORGANIZATION_COUNT: parseInt(process.env.SEED_ORGANIZATION_COUNT || "50"),
  CONTACT_COUNT: parseInt(process.env.SEED_CONTACT_COUNT || "100"),
  OPPORTUNITY_COUNT: parseInt(process.env.SEED_OPPORTUNITY_COUNT || "75"),
  ACTIVITY_COUNT: parseInt(process.env.SEED_ACTIVITY_COUNT || "200"),
  NOTE_COUNT: parseInt(process.env.SEED_NOTE_COUNT || "150"),
  TAG_COUNT: parseInt(process.env.SEED_TAG_COUNT || "20"),

  // Opportunity configuration from environment
  DEFAULT_CATEGORY: process.env.OPPORTUNITY_DEFAULT_CATEGORY || "new_business",
  DEFAULT_STAGE: process.env.OPPORTUNITY_DEFAULT_STAGE || "new_lead",
  PIPELINE_STAGES: (
    process.env.OPPORTUNITY_PIPELINE_STAGES ||
    "new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost"
  ).split(","),
  MAX_AMOUNT: parseInt(process.env.OPPORTUNITY_MAX_AMOUNT || "1000000"),
  DEFAULT_PROBABILITY: parseInt(
    process.env.OPPORTUNITY_DEFAULT_PROBABILITY || "50",
  ),

  // Parse command line arguments
  DRY_RUN: process.argv.includes("--dry-run"),
  VERBOSE: process.argv.includes("--verbose"),
  CLEAN: process.argv.includes("--clean"),
  COUNT:
    process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] ||
    null,
};

// Opportunity categories
const OPPORTUNITY_CATEGORIES = [
  "new_business",
  "upsell",
  "renewal",
  "referral",
];

// Opportunity statuses
const OPPORTUNITY_STATUSES = ["active", "on_hold", "nurturing", "stalled", "expired"];

// Opportunity priority levels
const OPPORTUNITY_PRIORITIES = ["low", "medium", "high", "critical"];

// Lead sources
const LEAD_SOURCES = [
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
];

// Food & Beverage organization types
// Valid organization_type enum values from database schema
const FB_ORGANIZATION_TYPES = [
  "customer",
  "principal",
  "distributor",
  "prospect",
  "unknown",
];

// Contact genders
const CONTACT_GENDERS = ["male", "female", "other", "prefer_not_to_say"];

// Contact phone/email types
const PERSONAL_INFO_TYPES = ["Work", "Home", "Other"];

// Task types
const TASK_TYPES = [
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Proposal",
  "Discovery",
  "Administrative",
  "None",
];

// Task priorities
const TASK_PRIORITIES = ["low", "medium", "high", "critical"];

// Activity sentiments
const ACTIVITY_SENTIMENTS = ["positive", "neutral", "negative"];

// Product categories
const PRODUCT_CATEGORIES = [
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
  "sweeteners",
  "cleaning_supplies",
  "paper_products",
  "equipment",
  "other",
];

// Product statuses
const PRODUCT_STATUSES = [
  "active",
  "discontinued",
  "seasonal",
  "coming_soon",
  "limited_availability",
];

// US states for realistic addresses
const US_STATES = [
  "CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI",
  "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI",
];

// F&B company names by category
const FB_COMPANY_NAMES = [
  "Fresh Fork Bistro",
  "Golden Grain Mills",
  "Mountain Spring Water Co",
  "Urban Eats Catering",
  "FoodFlow Technologies",
  "Copper Kettle Brewing",
  "Valley View Vineyards",
  "Roasted Peak Coffee",
  "Sunrise Bakery Group",
  "Chef's Table Meal Kits",
  "Street Flavor Food Trucks",
  "CloudKitchen Collective",
  "Green Acres Organic",
  "Artisan Pantry Markets",
  "Crunch Co Snacks",
  "Vitality Energy Drinks",
  "Living Cultures Kombucha",
  "PlantWise Foods",
  "Heritage Creamery",
  "Pacific Catch Seafood",
  "Fusion Flavors Inc",
  "Harvest Moon Organics",
  "Brewmaster's Choice",
  "Gourmet Grounds",
  "Farm Fresh Distributors",
  "The Spice Route",
  "Coastal Cuisine Co",
  "Garden Fresh Grill",
  "Artisan Bowl Company",
  "Stone Fire Pizza",
  "Grain & Green Kitchen",
  "The Wellington House",
  "Sapphire Steakhouse",
  "Le Jardin Noir",
  "Metropolitan Grill",
  "Morning Brew Collective",
  "The Daily Grind Cafe",
  "Craft Hop Brewing",
  "The Taphouse Collection",
  "Hopworks Brewing Co",
  "Pure Source Beverages",
  "Natural Spring Waters",
  "Craft Soda Works",
  "Juice Bar Manufacturing",
  "Ready-to-Cook Co",
  "Quick Chef Meals",
  "Earth's Harvest Foods",
  "Plant Power Foods",
  "Regional Food Services",
  "Premium Beverage Distributors",
];

// F&B job titles
const FB_JOB_TITLES = [
  "Food & Beverage Director",
  "Executive Chef",
  "Head Chef",
  "Restaurant Manager",
  "Culinary Director",
  "Supply Chain Manager",
  "Food Safety Officer",
  "Procurement Manager",
  "Menu Development Chef",
  "Beverage Manager",
  "Catering Director",
  "Kitchen Operations Manager",
  "Brand Manager",
  "Distribution Manager",
  "Quality Assurance Manager",
  "R&D Chef",
  "Restaurant Owner",
  "Franchise Director",
  "VP of Operations",
  "Sous Chef",
  "Pastry Chef",
  "General Manager",
  "Assistant F&B Manager",
  "Banquet Manager",
  "Bar Manager",
  "Room Service Manager",
];

// F&B departments
const FB_DEPARTMENTS = [
  "Kitchen Operations",
  "Food & Beverage",
  "Supply Chain",
  "Quality Assurance",
  "Menu Development",
  "Catering",
  "Procurement",
  "Operations",
  "Brand Management",
  "Distribution",
  "Food Safety",
  "R&D",
  "Front of House",
  "Bar & Beverage Service",
  "Banquet & Events",
];

// F&B software products
const FB_PRODUCTS = [
  "Kitchen Management System",
  "POS Integration Platform",
  "Inventory Management Software",
  "Menu Planning Platform",
  "Food Cost Analytics",
  "Supplier Management System",
  "Compliance Tracking Software",
  "Recipe Management System",
  "Delivery Integration Platform",
  "Staff Scheduling Software",
  "Customer Loyalty Program",
  "Table Reservation System",
  "Food Safety Monitoring",
  "Waste Reduction Analytics",
  "Supply Chain Visibility Platform",
  "Kitchen Display System",
  "Order Management System",
  "Multi-Location Dashboard",
];

// F&B competitors
const FB_COMPETITORS = [
  "Toast POS",
  "Square for Restaurants",
  "Upserve",
  "TouchBistro",
  "Revel Systems",
  "Lightspeed",
  "MarketMan",
  "BlueCart",
  "Restaurant365",
  "7shifts",
  "In-house Solution",
  "None",
  "Unknown",
];

// Activity types
const ACTIVITY_TYPES = ["meeting", "call", "email", "task", "note", "event"];

// Interaction types
const INTERACTION_TYPES = [
  "sales_call",
  "support_ticket",
  "product_demo",
  "follow_up",
  "negotiation",
];

class SeedDataGenerator {
  constructor() {
    this.supabase = null;
    this.generatedData = {
      organizations: [],
      contacts: [],
      opportunities: [],
      activities: [],
      notes: [],
      tags: [],
      tasks: [],
      products: [],
    };
    this.spinner = ora();
  }

  async initialize() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(chalk.blue("🚀 Seed Data Generator initialized"));
    if (CONFIG.DRY_RUN) {
      console.log(
        chalk.yellow("⚠️  Running in DRY RUN mode - no data will be inserted"),
      );
    }
  }

  async cleanDatabase() {
    if (!CONFIG.CLEAN) return;

    this.spinner.start("Cleaning existing data...");

    try {
      // Delete in reverse dependency order (keep tags)
      await this.supabase.from("tasks").delete().gte("id", 0);
      await this.supabase.from("activities").delete().gte("id", 0);
      await this.supabase.from("opportunityNotes").delete().gte("id", 0);
      await this.supabase.from("opportunities").delete().gte("id", 0);
      await this.supabase.from("contactNotes").delete().gte("id", 0);
      await this.supabase.from("contact_organizations").delete().gte("id", 0);
      await this.supabase.from("contacts").delete().gte("id", 0);
      await this.supabase.from("products").delete().gte("id", 0);
      await this.supabase.from("organizations").delete().gte("id", 0);
      // Keep tags - they're managed separately

      this.spinner.succeed("Cleaned existing data");
    } catch (error) {
      this.spinner.fail(`Failed to clean database: ${error.message}`);
      if (!CONFIG.DRY_RUN) throw error;
    }
  }

  generateOrganizations(count = CONFIG.ORGANIZATION_COUNT) {
    this.spinner.start(`Generating ${count} F&B organizations...`);

    for (let i = 0; i < count; i++) {
      const companyName =
        i < FB_COMPANY_NAMES.length
          ? FB_COMPANY_NAMES[i]
          : `${faker.helpers.arrayElement([
              "Prime",
              "Fresh",
              "Golden",
              "Gourmet",
              "Chef's",
              "Artisan",
            ])} ${faker.helpers.arrayElement([
              "Kitchen",
              "Dining",
              "Foods",
              "Cuisine",
              "Bistro",
              "Eatery",
            ])}`;

      // Ensure ALL organization types are used at least once
      const orgType = i < FB_ORGANIZATION_TYPES.length
        ? FB_ORGANIZATION_TYPES[i]
        : faker.helpers.arrayElement(FB_ORGANIZATION_TYPES);

      // Ensure ALL priority levels are used at least once
      const priority = i < 4 ? ["A", "B", "C", "D"][i] : faker.helpers.arrayElement(["A", "B", "C", "D"]);

      const state = faker.helpers.arrayElement(US_STATES);
      const city = faker.location.city();

      const org = {
        name: companyName,
        organization_type: orgType,
        // Note: is_principal and is_distributor removed in migration 20251018104712
        // organization_type enum now handles this distinction
        priority: priority, // A=Highest, D=Lowest
        website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.com`,
        address: faker.location.streetAddress(),
        city: city,
        state: state,
        postal_code: faker.location.zipCode("#####"),
        linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
        phone: faker.phone.number("(###) ###-####"),
        // Note: email and notes fields removed from organizations table
        description: faker.company.catchPhrase(),
        context_links: faker.helpers.arrayElements([
          `https://example.com/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/products`,
          `https://example.com/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/catalog`,
          `https://example.com/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/about`,
        ], { min: 0, max: 2 }),
        // Note: tax_identifier removed - doesn't exist in database schema
        sales_id: CONFIG.TEST_USER_ID, // Link to test user if provided
        created_by: CONFIG.TEST_USER_ID, // Track creator if provided
        // Note: created_at and updated_at auto-managed by database triggers
      };
      this.generatedData.organizations.push(org);
    }

    this.spinner.succeed(`Generated ${count} F&B organizations`);
  }

  generateContacts(count = CONFIG.CONTACT_COUNT) {
    this.spinner.start(`Generating ${count} F&B contacts...`);

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const title = faker.helpers.arrayElement(FB_JOB_TITLES);
      const department = faker.helpers.arrayElement(FB_DEPARTMENTS);

      // Ensure ALL genders are used at least once
      const gender = i < CONTACT_GENDERS.length
        ? CONTACT_GENDERS[i]
        : faker.helpers.arrayElement(CONTACT_GENDERS);

      const state = faker.helpers.arrayElement(US_STATES);
      const city = faker.location.city();

      // Ensure ALL personal info types are used for email and phone
      const emailType = i < PERSONAL_INFO_TYPES.length
        ? PERSONAL_INFO_TYPES[i]
        : faker.helpers.arrayElement(PERSONAL_INFO_TYPES);

      const phoneType = i < PERSONAL_INFO_TYPES.length
        ? PERSONAL_INFO_TYPES[i]
        : faker.helpers.arrayElement(PERSONAL_INFO_TYPES);

      const contact = {
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        // JSONB array format for email
        email: [
          {
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            type: emailType,
          },
          // Some contacts have multiple emails
          ...(Math.random() > 0.7
            ? [
                {
                  email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                  type: faker.helpers.arrayElement(PERSONAL_INFO_TYPES),
                },
              ]
            : []),
        ],
        // JSONB array format for phone
        phone: [
          {
            number: faker.phone.number("(###) ###-####"),
            type: phoneType,
          },
          // Some contacts have mobile numbers
          ...(Math.random() > 0.5
            ? [
                {
                  number: faker.phone.number("(###) ###-####"),
                  type: "Mobile",
                },
              ]
            : []),
        ],
        title: title,
        department: department,
        gender: gender,
        birthday: Math.random() > 0.5 ? faker.date.birthdate({ min: 25, max: 65, mode: 'age' }).toISOString().split('T')[0] : null,
        address: Math.random() > 0.3 ? faker.location.streetAddress() : null,
        city: Math.random() > 0.3 ? city : null,
        state: Math.random() > 0.3 ? state : null,
        postal_code: Math.random() > 0.3 ? faker.location.zipCode("#####") : null,
        country: Math.random() > 0.7 ? faker.location.countryCode() : "USA",
        linkedin_url: Math.random() > 0.2 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${faker.string.alphanumeric(6)}` : null,
        twitter_handle: Math.random() > 0.7 ? `@${firstName.toLowerCase()}${lastName.toLowerCase()}${faker.number.int({ min: 1, max: 999 })}` : null,
        notes: faker.helpers.arrayElement([
          `${faker.number.int({ min: 5, max: 25 })} years of F&B industry experience. Specializes in ${department.toLowerCase()}.`,
          `Passionate about culinary excellence and operational efficiency. Background in ${department.toLowerCase()}.`,
          `Proven track record in ${department.toLowerCase()}. Known for innovation and cost control.`,
          `Industry veteran with expertise in ${department.toLowerCase()}. Committed to food safety and quality.`,
          `Results-driven professional in ${department.toLowerCase()}. Focus on sustainable operations.`,
        ]),
        sales_id: CONFIG.TEST_USER_ID, // Link to test user if provided
        created_by: CONFIG.TEST_USER_ID, // Track creator if provided
        created_at: faker.date.past({ years: 2 }),
        updated_at: faker.date.recent(),
      };

      // Store ONE organization index to link after insertion
      contact._org_index = faker.number.int({
        min: 0,
        max: this.generatedData.organizations.length - 1
      });

      this.generatedData.contacts.push(contact);
    }

    this.spinner.succeed(`Generated ${count} F&B contacts`);
  }

  generateOpportunities(count = CONFIG.OPPORTUNITY_COUNT) {
    this.spinner.start(`Generating ${count} F&B opportunities...`);

    for (let i = 0; i < count; i++) {
      // Ensure ALL stages are used at least once
      const stage = i < CONFIG.PIPELINE_STAGES.length
        ? CONFIG.PIPELINE_STAGES[i]
        : faker.helpers.arrayElement(CONFIG.PIPELINE_STAGES);

      // Ensure ALL statuses are used at least once
      const status = i < OPPORTUNITY_STATUSES.length
        ? OPPORTUNITY_STATUSES[i]
        : this.getStatusForStage(stage);

      // Ensure ALL priorities are used at least once
      const priority = i < OPPORTUNITY_PRIORITIES.length
        ? OPPORTUNITY_PRIORITIES[i]
        : faker.helpers.arrayElement(OPPORTUNITY_PRIORITIES);

      // Ensure ALL lead sources are used at least once
      const leadSource = i < LEAD_SOURCES.length
        ? LEAD_SOURCES[i]
        : faker.helpers.arrayElement(LEAD_SOURCES);

      const org = faker.helpers.arrayElement(this.generatedData.organizations);
      const product = faker.helpers.arrayElement(FB_PRODUCTS);

      // Get a principal and distributor if available
      const principalOrgs = this.generatedData.organizations.filter(o => o.organization_type === "principal");
      const distributorOrgs = this.generatedData.organizations.filter(o => o.organization_type === "distributor");

      const selectedContacts = faker.helpers.arrayElements(
        this.generatedData.contacts,
        { min: 1, max: 3 }
      );

      const isClosed = stage === "closed_won" || stage === "closed_lost";

      const opportunity = {
        name: `${org.name} - ${product}`,
        stage,
        status,
        priority: priority,
        lead_source: leadSource,
        estimated_close_date: isClosed ? faker.date.past({ years: 0.5 }) : faker.date.future({ years: 1 }),
        actual_close_date: isClosed ? faker.date.recent({ days: 30 }) : null,
        customer_organization_id: org.id,
        principal_organization_id: principalOrgs.length > 0 && Math.random() > 0.5
          ? faker.helpers.arrayElement(principalOrgs).id
          : null,
        distributor_organization_id: distributorOrgs.length > 0 && Math.random() > 0.7
          ? faker.helpers.arrayElement(distributorOrgs).id
          : null,
        contact_ids: selectedContacts.map(c => c.id),
        index: i, // For Kanban board ordering
        description: faker.helpers.arrayElement([
          "Looking to modernize kitchen operations and improve efficiency across all locations",
          "Seeking better inventory management and food cost control solutions",
          "Need to streamline multi-location restaurant operations and reporting",
          "Expanding delivery operations and need better third-party integration",
          "Food safety compliance and HACCP tracking requirements becoming critical",
          "Want to improve customer experience and implement loyalty program",
          "Need better supply chain visibility and vendor management tools",
          "Looking to reduce food waste by 25% and improve sustainability metrics",
          "Current POS system outdated, need modern cloud-based solution",
          "Menu engineering and recipe costing needs for 15+ locations",
        ]),
        next_action: !isClosed ? faker.helpers.arrayElement([
          "Schedule product demo at flagship location with kitchen staff",
          "Send ROI analysis and case studies from similar F&B clients",
          "Set up 30-day trial at busiest location to prove value",
          "Review integration requirements with IT and POS vendor",
          "Present to executive leadership team next week",
          "Conduct site visit during dinner rush to understand workflow",
          "Provide references from other restaurant chains in region",
          "Prepare proposal for multi-location rollout plan",
          "Demo waste tracking features to sustainability team",
          "Walk through food safety compliance reporting",
        ]) : null,
        next_action_date: !isClosed ? faker.date.future({ years: 0.5 }) : null,
        competition: faker.helpers.arrayElement([
          ...FB_COMPETITORS,
          null,
        ]),
        decision_criteria: faker.helpers.arrayElement([
          "Price and ROI within 12 months",
          "Ease of use for kitchen staff",
          "Integration with existing POS system",
          "Multi-location reporting capabilities",
          "Food safety compliance features",
          "Customer support and training",
          "Mobile accessibility for managers",
        ]),
        tags: faker.helpers.arrayElements(
          ["urgent", "high-value", "competitive", "renewal", "expansion"],
          { min: 0, max: 3 }
        ),
        opportunity_owner_id: CONFIG.TEST_USER_ID, // Link to test user if provided
        account_manager_id: CONFIG.TEST_USER_ID, // Link to test user if provided
        created_by: CONFIG.TEST_USER_ID, // Track creator if provided
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      };

      this.generatedData.opportunities.push(opportunity);
    }

    this.spinner.succeed(`Generated ${count} F&B opportunities`);
  }

  generateActivities(count = CONFIG.ACTIVITY_COUNT) {
    this.spinner.start(`Generating ${count} activities...`);

    const interactionTypes = ["call", "email", "meeting", "demo", "proposal", "follow_up", "trade_show", "site_visit", "contract_review", "check_in", "social"];

    for (let i = 0; i < count; i++) {
      // Ensure ALL interaction types are used at least once
      const interactionType = i < interactionTypes.length
        ? interactionTypes[i]
        : faker.helpers.arrayElement(interactionTypes);

      // Ensure ALL sentiments are used at least once
      const sentiment = i < ACTIVITY_SENTIMENTS.length
        ? ACTIVITY_SENTIMENTS[i]
        : faker.helpers.arrayElement(ACTIVITY_SENTIMENTS);

      const hasOpportunity = Math.random() > 0.3;

      // Store indices instead of IDs (IDs won't exist until after insertion)
      const _contact_index = faker.number.int({ min: 0, max: this.generatedData.contacts.length - 1 });
      const _org_index = faker.number.int({ min: 0, max: this.generatedData.organizations.length - 1 });
      const _opp_index = hasOpportunity ? faker.number.int({ min: 0, max: this.generatedData.opportunities.length - 1 }) : null;

      const requiresFollowUp = Math.random() > 0.6;

      const activity = {
        activity_type: hasOpportunity ? "interaction" : "engagement",
        type: interactionType,
        subject: this.getActivitySubject(interactionType),
        description: faker.lorem.paragraph(),
        activity_date: faker.date.past({ years: 0.5 }),
        duration_minutes: faker.helpers.arrayElement([15, 30, 45, 60, 90, 120, null]),
        _contact_index,  // Temporary - will be replaced with contact_id after insertion
        _org_index,      // Temporary - will be replaced with organization_id after insertion
        _opp_index,      // Temporary - will be replaced with opportunity_id after insertion
        follow_up_required: requiresFollowUp,
        follow_up_date: requiresFollowUp ? faker.date.future({ years: 0.2 }) : null,
        follow_up_notes: requiresFollowUp && Math.random() > 0.5 ? faker.lorem.sentence() : null,
        outcome: Math.random() > 0.4 ? faker.lorem.sentence() : null,
        sentiment: sentiment,
        location: ["meeting", "demo", "site_visit", "trade_show"].includes(interactionType)
          ? `${faker.location.city()}, ${faker.helpers.arrayElement(US_STATES)}`
          : null,
        attendees: ["meeting", "call", "demo"].includes(interactionType)
          ? faker.helpers.arrayElements([
              faker.person.fullName(),
              faker.person.fullName(),
              faker.person.fullName(),
              faker.person.fullName()
            ], { min: 1, max: 4 })
          : null,
        attachments: Math.random() > 0.7
          ? faker.helpers.arrayElements([
              `https://example.com/docs/presentation-${faker.string.alphanumeric(8)}.pdf`,
              `https://example.com/docs/contract-${faker.string.alphanumeric(8)}.pdf`,
              `https://example.com/docs/proposal-${faker.string.alphanumeric(8)}.pdf`,
            ], { min: 1, max: 2 })
          : null,
        tags: faker.helpers.arrayElements(["important", "follow-up", "urgent", "demo", "pricing", "technical"], { min: 0, max: 3 }),
        created_by: CONFIG.TEST_USER_ID, // Track creator if provided
      };

      this.generatedData.activities.push(activity);
    }

    this.spinner.succeed(`Generated ${count} activities`);
  }

  generateNotes(count = CONFIG.NOTE_COUNT) {
    this.spinner.start(`Generating ${count} notes...`);

    for (let i = 0; i < count; i++) {
      const isOpportunityNote = Math.random() > 0.4;

      const note = {
        text: faker.lorem.paragraphs({ min: 1, max: 3 }),
        date: faker.date.past({ years: 0.5 }),
        attachments: Math.random() > 0.8
          ? faker.helpers.arrayElements([
              `https://example.com/files/note-${faker.string.alphanumeric(8)}.pdf`,
              `https://example.com/files/attachment-${faker.string.alphanumeric(8)}.docx`,
            ], { min: 1, max: 2 })
          : null,
        sales_id: CONFIG.TEST_USER_ID, // Link to test user if provided
      };

      if (isOpportunityNote) {
        note._opp_index = faker.number.int({ min: 0, max: this.generatedData.opportunities.length - 1 });
        note.table = "opportunityNotes";
      } else {
        note._contact_index = faker.number.int({ min: 0, max: this.generatedData.contacts.length - 1 });
        note.table = "contactNotes";
      }

      this.generatedData.notes.push(note);
    }

    this.spinner.succeed(`Generated ${count} notes`);
  }

  generateTasks(count = 50) {
    this.spinner.start(`Generating ${count} tasks...`);

    for (let i = 0; i < count; i++) {
      // Ensure ALL task types are used at least once
      const taskType = i < TASK_TYPES.length
        ? TASK_TYPES[i]
        : faker.helpers.arrayElement(TASK_TYPES);

      // Ensure ALL task priorities are used at least once
      const priority = i < TASK_PRIORITIES.length
        ? TASK_PRIORITIES[i]
        : faker.helpers.arrayElement(TASK_PRIORITIES);

      const isCompleted = Math.random() > 0.6;
      const hasReminder = !isCompleted && Math.random() > 0.7;

      const task = {
        title: faker.helpers.arrayElement([
          `Follow up with ${faker.person.firstName()}`,
          "Send proposal document",
          "Schedule demo call",
          "Review contract terms",
          "Prepare pricing quote",
          "Update CRM records",
          "Research competitor pricing",
          "Send thank you email",
          "Prepare presentation slides",
          "Book meeting room",
        ]),
        description: Math.random() > 0.5 ? faker.lorem.paragraph() : null,
        type: taskType,
        priority: priority,
        due_date: isCompleted
          ? faker.date.past({ years: 0.2 })
          : faker.date.future({ years: 0.5 }),
        reminder_date: hasReminder
          ? faker.date.future({ years: 0.3 })
          : null,
        completed: isCompleted,
        completed_at: isCompleted ? faker.date.recent({ days: 30 }) : null,
        _contact_index: faker.number.int({ min: 0, max: this.generatedData.contacts.length - 1 }),
        _opp_index: Math.random() > 0.4
          ? faker.number.int({ min: 0, max: this.generatedData.opportunities.length - 1 })
          : null,
        sales_id: CONFIG.TEST_USER_ID,
      };

      this.generatedData.tasks = this.generatedData.tasks || [];
      this.generatedData.tasks.push(task);
    }

    this.spinner.succeed(`Generated ${count} tasks`);
  }

  generateProducts(count = 100) {
    this.spinner.start(`Generating ${count} F&B products...`);

    // Get principal organizations indices to link products to
    const principalOrgIndices = this.generatedData.organizations
      .map((org, index) => org.organization_type === "principal" ? index : null)
      .filter(index => index !== null);

    if (principalOrgIndices.length === 0) {
      this.spinner.warn("No principal organizations found - skipping product generation");
      return;
    }

    for (let i = 0; i < count; i++) {
      // Ensure ALL product categories are used at least once
      const category = i < PRODUCT_CATEGORIES.length
        ? PRODUCT_CATEGORIES[i]
        : faker.helpers.arrayElement(PRODUCT_CATEGORIES);

      // Ensure ALL product statuses are used at least once
      const status = i < PRODUCT_STATUSES.length
        ? PRODUCT_STATUSES[i]
        : faker.helpers.arrayElement(PRODUCT_STATUSES);

      const principalIndex = faker.helpers.arrayElement(principalOrgIndices);

      const productNames = {
        beverages: ["Craft Cola", "Artisan Lemonade", "Premium Orange Juice", "Sparkling Water"],
        dairy: ["Organic Whole Milk", "Greek Yogurt", "Aged Cheddar", "Butter Blend"],
        frozen: ["Premium Ice Cream", "Frozen Vegetables", "Frozen Pizza", "Breakfast Sausage"],
        fresh_produce: ["Organic Tomatoes", "Fresh Lettuce Mix", "Sweet Corn", "Avocados"],
        meat_poultry: ["Free-Range Chicken", "Grass-Fed Beef", "Pork Tenderloin", "Turkey Breast"],
        seafood: ["Wild Salmon", "Jumbo Shrimp", "Fresh Tuna", "Lobster Tails"],
        dry_goods: ["Organic Flour", "Brown Rice", "Quinoa", "Pasta"],
        snacks: ["Trail Mix", "Potato Chips", "Granola Bars", "Mixed Nuts"],
        condiments: ["Organic Ketchup", "Dijon Mustard", "BBQ Sauce", "Hot Sauce"],
        baking_supplies: ["Vanilla Extract", "Baking Powder", "Chocolate Chips", "Yeast"],
        spices_seasonings: ["Black Pepper", "Sea Salt", "Garlic Powder", "Italian Seasoning"],
        canned_goods: ["Diced Tomatoes", "Black Beans", "Chicken Broth", "Tuna"],
        pasta_grains: ["Penne Pasta", "Jasmine Rice", "Couscous", "Farro"],
        oils_vinegars: ["Extra Virgin Olive Oil", "Balsamic Vinegar", "Canola Oil", "Apple Cider Vinegar"],
        sweeteners: ["Organic Honey", "Maple Syrup", "Cane Sugar", "Agave Nectar"],
        cleaning_supplies: ["Dish Soap", "All-Purpose Cleaner", "Sanitizer", "Degreaser"],
        paper_products: ["Paper Towels", "Napkins", "Toilet Paper", "Wax Paper"],
        equipment: ["Commercial Blender", "Food Processor", "Chef's Knife", "Cutting Board"],
        other: ["Aluminum Foil", "Plastic Wrap", "Storage Containers", "Trash Bags"],
      };

      const productName = faker.helpers.arrayElement(productNames[category] || ["Generic Product"]);

      const product = {
        name: productName,
        sku: `${category.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
        _principal_index: principalIndex, // Temporary - will be replaced with principal_id after insertion
        category: category,
        status: status,
        description: faker.commerce.productDescription(),
        list_price: parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
        currency_code: "USD",
        unit_of_measure: faker.helpers.arrayElement(["each", "lb", "kg", "oz", "gal", "case", "box"]),
        manufacturer_part_number: Math.random() > 0.5 ? `MPN-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}` : null,
        certifications: faker.helpers.arrayElements(
          ["Organic", "Non-GMO", "Gluten-Free", "Kosher", "Halal", "Fair Trade"],
          { min: 0, max: 3 }
        ),
        allergens: faker.helpers.arrayElements(
          ["Milk", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", "Wheat", "Soybeans"],
          { min: 0, max: 2 }
        ),
        ingredients: Math.random() > 0.5 ? faker.lorem.sentence() : null,
        nutritional_info: Math.random() > 0.6
          ? {
              calories: faker.number.int({ min: 50, max: 500 }),
              protein: `${faker.number.int({ min: 1, max: 30 })}g`,
              carbs: `${faker.number.int({ min: 5, max: 50 })}g`,
              fat: `${faker.number.int({ min: 1, max: 20 })}g`,
            }
          : null,
        marketing_description: Math.random() > 0.5 ? faker.company.catchPhrase() : null,
        created_by: CONFIG.TEST_USER_ID,
        updated_by: CONFIG.TEST_USER_ID,
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      };

      this.generatedData.products = this.generatedData.products || [];
      this.generatedData.products.push(product);
    }

    this.spinner.succeed(`Generated ${count} F&B products`);
  }

  generateTags(count = CONFIG.TAG_COUNT) {
    this.spinner.start(`Generating ${count} F&B tags...`);

    const fbTags = [
      { name: "Hot Lead", color: "destructive", description: "High-priority lead requiring immediate attention" },
      { name: "Enterprise Deal", color: "primary", description: "Large multi-location opportunity" },
      { name: "QSR", color: "secondary", description: "Quick Service Restaurant segment" },
      { name: "Fine Dining", color: "info", description: "Fine dining restaurant segment" },
      { name: "Fast Casual", color: "secondary", description: "Fast casual restaurant segment" },
      { name: "Multi-Location", color: "primary", description: "Chain with multiple locations" },
      { name: "Food Safety Focus", color: "warning", description: "Compliance and food safety driven" },
      { name: "Cost Control", color: "success", description: "Focused on reducing food costs" },
      { name: "POS Integration", color: "info", description: "Requires POS system integration" },
      { name: "Inventory Management", color: "secondary", description: "Inventory tracking priority" },
      { name: "Waste Reduction", color: "success", description: "Sustainability and waste reduction focus" },
      { name: "Menu Engineering", color: "info", description: "Menu optimization and costing" },
      { name: "Brewery", color: "primary", description: "Craft brewery or taproom" },
      { name: "Winery", color: "primary", description: "Wine production or tasting room" },
      { name: "Catering", color: "secondary", description: "Catering and events business" },
      { name: "Ghost Kitchen", color: "info", description: "Delivery-only kitchen operation" },
      { name: "Competitor: Toast", color: "warning", description: "Currently evaluating Toast POS" },
      { name: "Competitor: Square", color: "warning", description: "Currently using Square" },
      { name: "Budget Approved", color: "success", description: "Budget approved, ready to purchase" },
      { name: "Trial Active", color: "info", description: "Currently in trial period" },
    ];

    for (let i = 0; i < Math.min(count, fbTags.length); i++) {
      const tag = {
        name: fbTags[i].name,
        color: fbTags[i].color,
        description: fbTags[i].description,
        usage_count: faker.number.int({ min: 0, max: 50 }),
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent(),
      };

      this.generatedData.tags.push(tag);
    }

    this.spinner.succeed(`Generated ${this.generatedData.tags.length} F&B tags`);
  }

  async insertData() {
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow("\n📝 DRY RUN - Data that would be inserted:"));
      console.log(
        chalk.gray(
          `  Organizations: ${this.generatedData.organizations.length}`,
        ),
      );
      console.log(
        chalk.gray(`  Contacts: ${this.generatedData.contacts.length}`),
      );
      console.log(
        chalk.gray(
          `  Opportunities: ${this.generatedData.opportunities.length}`,
        ),
      );
      console.log(
        chalk.gray(`  Activities: ${this.generatedData.activities.length}`),
      );
      console.log(chalk.gray(`  Notes: ${this.generatedData.notes.length}`));
      console.log(chalk.gray(`  Tags: ${this.generatedData.tags.length}`));

      if (CONFIG.VERBOSE) {
        console.log("\nSample opportunity:");
        console.log(
          JSON.stringify(this.generatedData.opportunities[0], null, 2),
        );
      }

      return;
    }

    this.spinner.start("Inserting data into database...");

    try {
      // Tags already in database - skip insertion

      // Insert organizations
      if (this.generatedData.organizations.length > 0) {
        console.log(chalk.gray(`  Inserting ${this.generatedData.organizations.length} organizations...`));
        const { data: insertedOrgs, error } = await this.supabase
          .from("organizations")
          .insert(this.generatedData.organizations)
          .select();
        if (error) {
          console.error(chalk.red("Failed to insert organizations:"), error);
          throw error;
        }

        // Update organizations with their database-assigned IDs
        this.generatedData.organizations.forEach((org, index) => {
          org.id = insertedOrgs[index].id;
        });
      }

      // Insert contacts
      if (this.generatedData.contacts.length > 0) {
        // Map indices to actual organization IDs and remove temporary fields
        const contactsWithRealIds = this.generatedData.contacts.map(
          ({ _org_index, ...contact }) => ({
            ...contact,
            organization_id: this.generatedData.organizations[_org_index].id,
          }),
        );
        const { data: insertedContacts, error } = await this.supabase
          .from("contacts")
          .insert(contactsWithRealIds)
          .select();
        if (error) throw error;

        // Update contacts with their database-assigned IDs
        this.generatedData.contacts.forEach((contact, index) => {
          contact.id = insertedContacts[index].id;
        });

        // Note: contact_organizations junction table is DEPRECATED
        // Contacts now use the organization_id field directly for their primary organization
      }

      // Insert opportunities
      if (this.generatedData.opportunities.length > 0) {
        const { data: insertedOpps, error } = await this.supabase
          .from("opportunities")
          .insert(this.generatedData.opportunities)
          .select();
        if (error) throw error;

        // Update opportunities with their database-assigned IDs
        this.generatedData.opportunities.forEach((opp, index) => {
          opp.id = insertedOpps[index].id;
        });
      }

      // Insert activities
      if (this.generatedData.activities.length > 0) {
        // Map indices to actual IDs and remove temporary fields
        const activitiesWithRealIds = this.generatedData.activities.map(
          ({ _contact_index, _org_index, _opp_index, ...activity }) => ({
            ...activity,
            contact_id: this.generatedData.contacts[_contact_index].id,
            organization_id: this.generatedData.organizations[_org_index].id,
            opportunity_id: _opp_index !== null ? this.generatedData.opportunities[_opp_index].id : null,
          }),
        );
        const { data: insertedActivities, error } = await this.supabase
          .from("activities")
          .insert(activitiesWithRealIds)
          .select();
        if (error) throw error;

        // Update activities with their database-assigned IDs
        this.generatedData.activities.forEach((activity, index) => {
          activity.id = insertedActivities[index].id;
        });
      }

      // Insert notes
      const opportunityNotes = this.generatedData.notes
        .filter((note) => note.table === "opportunityNotes")
        .map(({ table, _opp_index, ...note }) => ({
          ...note,
          opportunity_id: this.generatedData.opportunities[_opp_index].id,
        }));

      const contactNotes = this.generatedData.notes
        .filter((note) => note.table === "contactNotes")
        .map(({ table, _contact_index, ...note }) => ({
          ...note,
          contact_id: this.generatedData.contacts[_contact_index].id,
        }));

      if (opportunityNotes.length > 0) {
        const { error } = await this.supabase
          .from("opportunityNotes")
          .insert(opportunityNotes);
        if (error) throw error;
      }

      if (contactNotes.length > 0) {
        const { error } = await this.supabase
          .from("contactNotes")
          .insert(contactNotes);
        if (error) throw error;
      }

      // Insert products
      if (this.generatedData.products && this.generatedData.products.length > 0) {
        // Map indices to actual IDs and remove temporary fields
        const productsWithRealIds = this.generatedData.products.map(
          ({ _principal_index, ...product }) => ({
            ...product,
            principal_id: this.generatedData.organizations[_principal_index].id,
          }),
        );
        const { data: insertedProducts, error } = await this.supabase
          .from("products")
          .insert(productsWithRealIds)
          .select();
        if (error) throw error;

        // Update products with their database-assigned IDs
        this.generatedData.products.forEach((product, index) => {
          product.id = insertedProducts[index].id;
        });
      }

      // Insert tasks
      if (this.generatedData.tasks && this.generatedData.tasks.length > 0) {
        // Map indices to actual IDs and remove temporary fields
        const tasksWithRealIds = this.generatedData.tasks.map(
          ({ _contact_index, _opp_index, ...task }) => ({
            ...task,
            contact_id: this.generatedData.contacts[_contact_index].id,
            opportunity_id: _opp_index !== null ? this.generatedData.opportunities[_opp_index].id : null,
          }),
        );
        const { data: insertedTasks, error } = await this.supabase
          .from("tasks")
          .insert(tasksWithRealIds)
          .select();
        if (error) throw error;

        // Update tasks with their database-assigned IDs
        this.generatedData.tasks.forEach((task, index) => {
          task.id = insertedTasks[index].id;
        });
      }

      this.spinner.succeed("Data inserted successfully");

      // Ensure all auth users have sales profiles (CRITICAL FIX)
      await this.ensureAuthUserProfiles();

      // Print summary
      console.log(chalk.green("\n✨ Seed data generation complete!"));
      console.log(
        chalk.gray(
          `  Organizations: ${this.generatedData.organizations.length}`,
        ),
      );
      console.log(
        chalk.gray(`  Contacts: ${this.generatedData.contacts.length}`),
      );
      console.log(
        chalk.gray(
          `  Opportunities: ${this.generatedData.opportunities.length}`,
        ),
      );
      console.log(
        chalk.gray(`  Activities: ${this.generatedData.activities.length}`),
      );
      console.log(chalk.gray(`  Notes: ${this.generatedData.notes.length}`));
      console.log(chalk.gray(`  Products: ${this.generatedData.products?.length || 0}`));
      console.log(chalk.gray(`  Tasks: ${this.generatedData.tasks?.length || 0}`));
      console.log(chalk.gray(`  Tags: ${this.generatedData.tags.length}`));
    } catch (error) {
      this.spinner.fail(`Failed to insert data: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async ensureAuthUserProfiles() {
    this.spinner.start("Ensuring auth users have sales profiles...");

    try {
      // Use raw SQL to find auth users without sales profiles
      const { data: orphanedUsers, error } = await this.supabase.rpc('exec_sql', {
        sql: `
          SELECT
            u.id,
            u.email,
            u.raw_user_meta_data->>'first_name' as first_name,
            u.raw_user_meta_data->>'last_name' as last_name
          FROM auth.users u
          LEFT JOIN sales s ON s.user_id = u.id
          WHERE s.id IS NULL
        `
      });

      if (error) {
        // Fallback: just try to select from both tables and do the join in JS
        const { data: authUsers } = await this.supabase
          .schema('auth')
          .from('users')
          .select('id, email, raw_user_meta_data');

        const { data: salesProfiles } = await this.supabase
          .from('sales')
          .select('user_id');

        if (!authUsers || authUsers.length === 0) {
          this.spinner.succeed("No auth users found");
          return;
        }

        const existingUserIds = new Set(salesProfiles?.map(p => p.user_id) || []);
        const missingUsers = authUsers.filter(u => !existingUserIds.has(u.id));

        if (missingUsers.length === 0) {
          this.spinner.succeed("All auth users have sales profiles");
          return;
        }

        // Create missing sales profiles
        const newProfiles = missingUsers.map(user => {
          const firstName = user.raw_user_meta_data?.first_name || user.email?.split('@')[0] || 'User';
          const lastName = user.raw_user_meta_data?.last_name || 'Account';

          return {
            user_id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            is_admin: true,
          };
        });

        const { error: insertError } = await this.supabase
          .from("sales")
          .insert(newProfiles);

        if (insertError) throw insertError;

        this.spinner.succeed(`Created ${missingUsers.length} missing sales profile(s)`);
        console.log(chalk.gray(`  Fixed profiles for: ${missingUsers.map(u => u.email).join(', ')}`));
        return;
      }

      if (!orphanedUsers || orphanedUsers.length === 0) {
        this.spinner.succeed("All auth users have sales profiles");
        return;
      }

      // Create missing sales profiles
      const newProfiles = orphanedUsers.map(user => ({
        user_id: user.id,
        email: user.email,
        first_name: user.first_name || user.email?.split('@')[0] || 'User',
        last_name: user.last_name || 'Account',
        is_admin: true,
      }));

      const { error: insertError } = await this.supabase
        .from("sales")
        .insert(newProfiles);

      if (insertError) throw insertError;

      this.spinner.succeed(`Created ${orphanedUsers.length} missing sales profile(s)`);
      console.log(chalk.gray(`  Fixed profiles for: ${orphanedUsers.map(u => u.email).join(', ')}`));

    } catch (error) {
      this.spinner.warn(`Could not verify sales profiles: ${error.message}`);
      console.log(chalk.yellow("  ⚠️  You may need to manually create sales profiles for auth users"));
    }
  }

  // Helper methods
  getStatusForStage(stage) {
    // Map opportunity stages to valid status enum values
    if (stage === "closed_won" || stage === "closed_lost") return "expired";
    if (stage === "awaiting_response") return "stalled";
    if (stage === "feedback_logged") return "nurturing";
    return "active"; // Default for new_lead, initial_outreach, sample_visit_offered, demo_scheduled
  }

  getProbabilityForStage(stage) {
    const probabilities = {
      new_lead: 10,
      initial_outreach: 20,
      sample_visit_offered: 30,
      awaiting_response: 25,
      feedback_logged: 50,
      demo_scheduled: 70,
      closed_won: 100,
      closed_lost: 0,
    };
    return probabilities[stage] || CONFIG.DEFAULT_PROBABILITY;
  }

  getActivitySubject(type) {
    const subjects = {
      meeting: faker.helpers.arrayElement([
        "Kitchen Operations Demo",
        "Menu Costing Review",
        "Contract Negotiation",
        "Implementation Kickoff",
        "Multi-Location Rollout Planning",
        "Food Safety Compliance Demo",
        "POS Integration Discussion",
        "Executive Stakeholder Meeting",
      ]),
      call: faker.helpers.arrayElement([
        "Discovery Call - Pain Points",
        "Follow-up on Demo",
        "Check-in with Kitchen Manager",
        "Support Call - Integration Issues",
        "Budget Discussion",
        "Reference Call with Similar Restaurant",
        "Technical Requirements Call",
      ]),
      email: faker.helpers.arrayElement([
        "ROI Analysis Sent",
        "Case Study: Similar Restaurant Chain",
        "Thank You - Great Demo!",
        "Meeting Follow-up & Next Steps",
        "Integration Requirements Doc",
        "Trial Period Proposal",
        "Competitor Comparison Sheet",
      ]),
      task: faker.helpers.arrayElement([
        "Prepare Custom Proposal",
        "Send MSA Contract",
        "Schedule On-site Demo",
        "Review Kitchen Workflow",
        "Setup Trial Environment",
        "Coordinate with POS Vendor",
        "Gather References",
      ]),
      note: faker.helpers.arrayElement([
        "Internal Note - Pricing Strategy",
        "Chef Feedback on Features",
        "Demo Session Notes",
        "Competitive Situation Update",
        "Budget Cycle Timing",
        "Implementation Concerns",
        "Champion Identified",
      ]),
      event: faker.helpers.arrayElement([
        "NRA Show Booth Meeting",
        "Restaurant Tech Webinar",
        "F&B Manager Training",
        "Product Launch Event",
        "Regional Trade Show",
        "Customer Advisory Board",
      ]),
    };
    return subjects[type] || faker.lorem.sentence();
  }

  async run() {
    try {
      await this.initialize();
      await this.cleanDatabase();

      // Override counts if --count provided
      const count = CONFIG.COUNT ? parseInt(CONFIG.COUNT) : null;

      // Generate data in dependency order
      this.generateOrganizations(count || CONFIG.ORGANIZATION_COUNT);
      this.generateProducts(count || 100); // Generate products after organizations
      this.generateContacts(count || CONFIG.CONTACT_COUNT);
      this.generateOpportunities(count || CONFIG.OPPORTUNITY_COUNT);
      this.generateActivities(count || CONFIG.ACTIVITY_COUNT);
      this.generateTasks(count || 50); // Generate tasks after contacts and opportunities
      this.generateNotes(count || CONFIG.NOTE_COUNT);
      // Skip tags - already in database
      // this.generateTags(count || CONFIG.TAG_COUNT);

      // Insert into database
      await this.insertData();

      console.log(
        chalk.blue("\n🎉 Seed data generation completed successfully!"),
      );
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error.message);
      if (CONFIG.VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }
}

// Run the generator
const generator = new SeedDataGenerator();
generator.run();
