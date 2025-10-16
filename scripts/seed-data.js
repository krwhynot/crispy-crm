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

// Food & Beverage organization types
// Valid organization_type enum values from database schema
const FB_ORGANIZATION_TYPES = [
  "customer",
  "principal",
  "distributor",
  "prospect",
  "partner",
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
      await this.supabase.from("activities").delete().gte("id", 0);
      await this.supabase.from("opportunityNotes").delete().gte("id", 0);
      await this.supabase.from("opportunities").delete().gte("id", 0);
      await this.supabase.from("contactNotes").delete().gte("id", 0);
      await this.supabase.from("contact_organizations").delete().gte("id", 0);
      await this.supabase.from("contacts").delete().gte("id", 0);
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

      const orgType = faker.helpers.arrayElement(FB_ORGANIZATION_TYPES);

      const org = {
        name: companyName,
        organization_type: orgType,
        priority: faker.helpers.arrayElement(["A", "B", "C", "D"]), // A=Highest, D=Lowest
        website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.com`,
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        state: faker.location.state(),
        postal_code: faker.location.zipCode(),
        linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
        phone: faker.phone.number(),
        email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.com`,
        annual_revenue: faker.number.int({ min: 500000, max: 50000000 }),
        employee_count: faker.number.int({ min: 10, max: 2000 }),
        founded_year: faker.number.int({ min: 1990, max: 2023 }),
        notes: faker.helpers.arrayElement([
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

      const contact = {
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        email: faker.internet.email({ firstName, lastName }),
        phone: {
          primary: faker.phone.number(),
          mobile: Math.random() > 0.5 ? faker.phone.number() : null,
        },
        title: title,
        department: department,
        linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
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

      // Store ONE organization index to link after insertion (unique constraint)
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
      const stage = faker.helpers.arrayElement(CONFIG.PIPELINE_STAGES);
      const status = this.getStatusForStage(stage);
      const org = faker.helpers.arrayElement(this.generatedData.organizations);
      const product = faker.helpers.arrayElement(FB_PRODUCTS);

      const selectedContacts = faker.helpers.arrayElements(
        this.generatedData.contacts,
        { min: 1, max: 3 }
      );

      const opportunity = {
        name: `${org.name} - ${product}`,
        stage,
        status,
        priority: faker.helpers.arrayElement(["low", "medium", "high", "critical"]), // These are enum values
        estimated_close_date: faker.date.future({ years: 1 }),
        customer_organization_id: org.id,
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
        next_action: faker.helpers.arrayElement([
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
        ]),
        next_action_date: faker.date.future({ years: 0.5 }),
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
      const interactionType = faker.helpers.arrayElement(interactionTypes);
      const hasOpportunity = Math.random() > 0.3;

      // Store indices instead of IDs (IDs won't exist until after insertion)
      const _contact_index = faker.number.int({ min: 0, max: this.generatedData.contacts.length - 1 });
      const _org_index = faker.number.int({ min: 0, max: this.generatedData.organizations.length - 1 });
      const _opp_index = hasOpportunity ? faker.number.int({ min: 0, max: this.generatedData.opportunities.length - 1 }) : null;

      const activity = {
        activity_type: hasOpportunity ? "interaction" : "engagement",
        type: interactionType,
        subject: this.getActivitySubject(interactionType),
        description: faker.lorem.paragraph(),
        activity_date: faker.date.past({ years: 0.5 }),
        duration_minutes: faker.helpers.arrayElement([15, 30, 45, 60, 90, 120]),
        _contact_index,  // Temporary - will be replaced with contact_id after insertion
        _org_index,      // Temporary - will be replaced with organization_id after insertion
        _opp_index,      // Temporary - will be replaced with opportunity_id after insertion
        follow_up_required: Math.random() > 0.6,
        follow_up_date: Math.random() > 0.6 ? faker.date.future({ years: 0.2 }) : null,
        follow_up_notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
        outcome: Math.random() > 0.5 ? faker.lorem.sentence() : null,
        sentiment: faker.helpers.arrayElement(["positive", "neutral", "negative"]),
        location: interactionType === "meeting" ? faker.location.city() : null,
        attendees: ["meeting", "call"].includes(interactionType)
          ? faker.helpers.arrayElements([
              faker.person.fullName(),
              faker.person.fullName(),
              faker.person.fullName()
            ], { min: 1, max: 3 })
          : null,
        tags: faker.helpers.arrayElements(["important", "follow-up", "urgent", "demo", "pricing"], { min: 0, max: 2 }),
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
        const { data: insertedOrgs, error } = await this.supabase
          .from("organizations")
          .insert(this.generatedData.organizations)
          .select();
        if (error) throw error;

        // Update organizations with their database-assigned IDs
        this.generatedData.organizations.forEach((org, index) => {
          org.id = insertedOrgs[index].id;
        });
      }

      // Insert contacts
      if (this.generatedData.contacts.length > 0) {
        const contactsWithoutTempData = this.generatedData.contacts.map(
          ({ _org_index, ...contact }) => contact,
        );
        const { data: insertedContacts, error } = await this.supabase
          .from("contacts")
          .insert(contactsWithoutTempData)
          .select();
        if (error) throw error;

        // Update contacts with their database-assigned IDs
        this.generatedData.contacts.forEach((contact, index) => {
          contact.id = insertedContacts[index].id;
        });

        // Insert contact-organization relationships (one per contact)
        const contactOrgs = [];
        this.generatedData.contacts.forEach((contact) => {
          const org = this.generatedData.organizations[contact._org_index];
          contactOrgs.push({
            contact_id: contact.id,
            organization_id: org.id,
            is_primary: true, // Only one organization, so it's primary
            relationship_start_date: faker.date.past({ years: 1 }),
          });
        });

        if (contactOrgs.length > 0) {
          const { error: orgError } = await this.supabase
            .from("contact_organizations")
            .insert(contactOrgs);
          if (orgError) throw orgError;
        }
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

      this.spinner.succeed("Data inserted successfully");

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
      console.log(chalk.gray(`  Tags: ${this.generatedData.tags.length}`));
    } catch (error) {
      this.spinner.fail(`Failed to insert data: ${error.message}`);
      console.error(error);
      process.exit(1);
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

      // Generate data
      this.generateOrganizations(count || CONFIG.ORGANIZATION_COUNT);
      this.generateContacts(count || CONFIG.CONTACT_COUNT);
      this.generateOpportunities(count || CONFIG.OPPORTUNITY_COUNT);
      this.generateActivities(count || CONFIG.ACTIVITY_COUNT);
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
