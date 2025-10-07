#!/usr/bin/env npx tsx
/**
 * Seed script to populate database with realistic fake data
 * for testing the unified data provider
 */

import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ path: join(process.cwd(), ".env") });
config({ path: join(process.cwd(), ".env.development") });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color palette for tags
const TAG_COLORS = [
  { name: "Hot Lead", color: "destructive" },
  { name: "Priority", color: "warning" },
  { name: "Enterprise", color: "primary" },
  { name: "Follow-up", color: "secondary" },
  { name: "Partner", color: "success" },
  { name: "Renewal", color: "info" },
];

// Food & Beverage specific data (reserved for future use)
// const _FB_COMPANY_TYPES = [
//   "Restaurant Chain", "Food Manufacturer", "Beverage Distributor",
//   "Catering Service", "Food Tech Startup", "Brewery", "Winery",
//   "Coffee Roaster", "Bakery Chain", "Meal Kit Service",
//   "Food Truck Fleet", "Ghost Kitchen", "Organic Farm Co-op",
//   "Specialty Food Retailer", "Snack Brand", "Energy Drink Company",
//   "Kombucha Brewery", "Plant-Based Foods", "Artisan Cheese Maker",
//   "Seafood Wholesaler"
// ];

const FB_COMPANY_NAMES = [
  "Fresh Fork Bistro", "Golden Grain Mills", "Mountain Spring Water Co",
  "Urban Eats Catering", "FoodFlow Technologies", "Copper Kettle Brewing",
  "Valley View Vineyards", "Roasted Peak Coffee", "Sunrise Bakery Group",
  "Chef's Table Meal Kits", "Street Flavor Food Trucks", "CloudKitchen Collective",
  "Green Acres Organic", "Artisan Pantry Markets", "Crunch Co Snacks",
  "Vitality Energy Drinks", "Living Cultures Kombucha", "PlantWise Foods",
  "Heritage Creamery", "Pacific Catch Seafood", "Fusion Flavors Inc",
  "Harvest Moon Organics", "Brewmaster's Choice", "Gourmet Grounds",
  "Farm Fresh Distributors", "The Spice Route", "Coastal Cuisine Co"
];

const FB_INDUSTRIES = [
  "Quick Service Restaurant", "Fine Dining", "Fast Casual",
  "Food Manufacturing", "Beverage Production", "Food Distribution",
  "Catering & Events", "Food Technology", "Craft Beverage",
  "Specialty Foods", "Organic & Natural Foods", "Plant-Based Foods"
];

const FB_JOB_TITLES = [
  "Head Chef", "Food & Beverage Director", "Restaurant Manager",
  "Culinary Director", "Supply Chain Manager", "Food Safety Officer",
  "Procurement Manager", "Menu Development Chef", "Beverage Manager",
  "Catering Director", "Kitchen Operations Manager", "Brand Manager",
  "Distribution Manager", "Quality Assurance Manager", "R&D Chef",
  "Restaurant Owner", "Franchise Director", "VP of Operations"
];

const FB_DEPARTMENTS = [
  "Kitchen Operations", "Food & Beverage", "Supply Chain",
  "Quality Assurance", "Menu Development", "Catering",
  "Procurement", "Operations", "Brand Management",
  "Distribution", "Food Safety", "R&D"
];

const FB_PRODUCTS = [
  "Kitchen Management System", "POS Integration", "Inventory Software",
  "Menu Planning Platform", "Food Cost Analytics", "Supplier Management",
  "Compliance Tracking", "Recipe Management", "Delivery Integration",
  "Staff Scheduling", "Customer Loyalty Program", "Table Reservation System",
  "Food Safety Monitoring", "Waste Reduction Analytics", "Supply Chain Visibility"
];

const FB_COMPETITORS = [
  "Toast POS", "Square for Restaurants", "Upserve", "TouchBistro",
  "Revel Systems", "Lightspeed", "MarketMan", "BlueCart"
];

// Opportunity stages with realistic probabilities
const OPPORTUNITY_STAGES = [
  { stage: "lead", probability: 10 },
  { stage: "qualified", probability: 25 },
  { stage: "proposal", probability: 50 },
  { stage: "negotiation", probability: 75 },
  { stage: "closed_won", probability: 100 },
  { stage: "closed_lost", probability: 0 },
];

async function clearExistingData() {
  console.log("🧹 Clearing existing test data...");

  // Delete in order to respect foreign key constraints
  await supabase.from("opportunityNotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contactNotes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("opportunity_contacts").delete().neq("opportunity_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("opportunity_participants").delete().neq("opportunity_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("opportunities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contact_organizations").delete().neq("contact_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("✅ Existing data cleared");
}

async function createTags() {
  console.log("🏷️  Creating tags...");

  const tags = TAG_COLORS.map(tag => ({
    name: tag.name,
    color: tag.color,
  }));

  const { data, error } = await supabase.from("tags").insert(tags).select();

  if (error) {
    console.error("❌ Error creating tags:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} tags`);
  return data;
}

async function createCompanies() {
  console.log("🏢 Creating F&B companies...");

  const companies = FB_COMPANY_NAMES.map((companyName) => {
    return {
      name: companyName,
      industry: faker.helpers.arrayElement(FB_INDUSTRIES),
      size: faker.helpers.arrayElement(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
      website: `https://${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com`,
      linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      annual_revenue: faker.number.int({ min: 500000, max: 50000000 }), // F&B typical range
      employee_count: faker.number.int({ min: 10, max: 2000 }),
      description: faker.helpers.arrayElement([
        "Serving fresh, locally-sourced cuisine",
        "Crafting premium beverages since 2010",
        "Your trusted food service partner",
        "Innovation in every bite",
        "Farm-to-table excellence",
        "Quality ingredients, exceptional taste",
        "Sustainable food solutions",
        "Bringing communities together through food"
      ]),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: "United States",
      postal_code: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: `info@${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com`,
    };
  });

  const { data, error } = await supabase.from("companies").insert(companies).select();

  if (error) {
    console.error("❌ Error creating companies:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} F&B companies`);
  return data;
}

async function createContacts(companies: any[]) {
  console.log("👥 Creating contacts...");

  const contacts = [];

  // Create 3-5 contacts per company
  for (const company of companies) {
    const contactCount = faker.number.int({ min: 3, max: 5 });

    for (let i = 0; i < contactCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({
        firstName,
        lastName,
        provider: company.website?.replace('https://', '').replace('http://', '') || 'example.com'
      });

      contacts.push({
        first_name: firstName,
        last_name: lastName,
        email: { primary: email },
        phone: {
          mobile: faker.phone.number(),
          office: faker.phone.number()
        },
        title: faker.helpers.arrayElement(FB_JOB_TITLES),
        department: faker.helpers.arrayElement(FB_DEPARTMENTS),
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        timezone: faker.helpers.arrayElement([
          "America/New_York", "America/Chicago", "America/Denver",
          "America/Los_Angeles", "Europe/London", "Asia/Tokyo"
        ]),
        communication_preference: faker.helpers.arrayElement(["email", "phone", "text", "linkedin"]),
        notes: faker.lorem.sentence(),
      });
    }
  }

  const { data, error } = await supabase.from("contacts").insert(contacts).select();

  if (error) {
    console.error("❌ Error creating contacts:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} contacts`);
  return data;
}

async function createContactOrganizationRelationships(contacts: any[], companies: any[]) {
  console.log("🔗 Creating contact-organization relationships...");

  const relationships = [];
  const contactsPerCompany = Math.ceil(contacts.length / companies.length);

  contacts.forEach((contact, index) => {
    const companyIndex = Math.floor(index / contactsPerCompany);
    if (companyIndex < companies.length) {
      relationships.push({
        contact_id: contact.id,
        organization_id: companies[companyIndex].id,
        role: faker.helpers.arrayElement([
          "primary_contact", "decision_maker", "influencer",
          "champion", "technical_contact", "billing_contact"
        ]),
        is_primary: index % contactsPerCompany === 0, // First contact is primary
        influence_level: faker.number.int({ min: 1, max: 10 }),
        notes: faker.lorem.sentence(),
      });
    }
  });

  const { data, error } = await supabase.from("contact_organizations").insert(relationships).select();

  if (error) {
    console.error("❌ Error creating relationships:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} contact-organization relationships`);
  return data;
}

async function createOpportunities(companies: any[], tags: any[]) {
  console.log("💰 Creating F&B opportunities...");

  const opportunities = [];

  // Create 1-3 opportunities per company
  for (const company of companies) {
    const oppCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < oppCount; i++) {
      const stage = faker.helpers.arrayElement(OPPORTUNITY_STAGES);
      const amount = faker.number.int({ min: 5000, max: 250000 }); // F&B software typical deal sizes

      opportunities.push({
        name: `${company.name} - ${faker.helpers.arrayElement(FB_PRODUCTS)}`,
        organization_id: company.id,
        amount: amount,
        stage: stage.stage,
        probability: stage.probability,
        expected_close_date: faker.date.future({ years: 1 }),
        description: faker.helpers.arrayElement([
          "Looking to modernize kitchen operations and improve efficiency",
          "Seeking better inventory management and cost control solutions",
          "Need to streamline multi-location restaurant operations",
          "Expanding delivery operations and need better integration",
          "Food safety compliance and tracking requirements",
          "Want to improve customer experience and loyalty program",
          "Need better supply chain visibility and vendor management",
          "Looking to reduce food waste and improve sustainability"
        ]),
        next_step: faker.helpers.arrayElement([
          "Schedule product demo with operations team",
          "Send ROI analysis and case studies",
          "Set up trial at flagship location",
          "Review integration requirements with IT",
          "Present to executive leadership team",
          "Conduct site visit at busy location",
          "Provide references from similar F&B clients"
        ]),
        competitor: faker.helpers.arrayElement([
          ...FB_COMPETITORS,
          "In-house Solution",
          "None",
          "Unknown"
        ]),
        source: faker.helpers.arrayElement([
          "Restaurant Trade Show", "Industry Referral", "Inbound Website",
          "LinkedIn Outreach", "Industry Conference", "Partner Referral",
          "Cold Outreach", "Content Marketing", "Webinar"
        ]),
        loss_reason: stage.stage === "closed_lost" ? faker.helpers.arrayElement([
          "Price too high for budget",
          "Chose competitor (Toast/Square)",
          "Decided to build in-house",
          "Not ready to change systems",
          "Budget frozen",
          "Poor timing with remodel",
          "Integration concerns"
        ]) : null,
        tag_ids: faker.helpers.arrayElements(tags.map(t => t.id), { min: 0, max: 3 }),
        index: i,
      });
    }
  }

  const { data, error } = await supabase.from("opportunities").insert(opportunities).select();

  if (error) {
    console.error("❌ Error creating opportunities:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} F&B opportunities`);
  return data;
}

async function createOpportunityContacts(opportunities: any[], contacts: any[]) {
  console.log("🤝 Creating opportunity contacts...");

  const relationships = [];

  // Add 2-4 contacts to each opportunity
  for (const opp of opportunities.slice(0, 30)) { // Limit to avoid too many relationships
    const contactCount = faker.number.int({ min: 2, max: 4 });
    const selectedContacts = faker.helpers.arrayElements(contacts, contactCount);

    for (const contact of selectedContacts) {
      relationships.push({
        opportunity_id: opp.id,
        contact_id: contact.id,
        role: faker.helpers.arrayElement([
          "decision_maker", "influencer", "champion",
          "technical_evaluator", "budget_holder"
        ]),
      });
    }
  }

  const { data, error } = await supabase.from("opportunity_contacts").insert(relationships).select();

  if (error) {
    console.error("❌ Error creating opportunity contacts:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} opportunity-contact relationships`);
  return data;
}

async function createTasks(opportunities: any[], contacts: any[]) {
  console.log("✅ Creating F&B tasks...");

  const tasks = [];

  // Create tasks for opportunities
  for (const opp of opportunities.slice(0, 20)) {
    tasks.push({
      title: faker.helpers.arrayElement([
        `Schedule demo at ${opp.name.split(' - ')[0]} location`,
        `Follow up on ${opp.name.split(' - ')[1]} trial`,
        `Send ROI analysis for ${opp.name.split(' - ')[0]}`,
        `Review menu integration requirements`,
        `Prepare case study for restaurant chain`,
        `Discuss multi-location rollout plan`
      ]),
      description: faker.helpers.arrayElement([
        "Need to show how our solution reduces food waste by 25%",
        "Prepare demo of inventory management features",
        "Walk through kitchen staff training process",
        "Review integration with current POS system",
        "Discuss implementation timeline during busy season",
        "Show how reporting helps with health inspections"
      ]),
      type: faker.helpers.arrayElement(["follow_up", "meeting", "email", "call", "demo"]),
      status: faker.helpers.arrayElement(["pending", "in_progress", "completed", "cancelled"]),
      priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
      due_date: faker.date.future({ years: 0.25 }),
      reminder_date: faker.date.future({ years: 0.2 }),
      opportunity_id: opp.id,
      completed: faker.datatype.boolean(0.3),
    });
  }

  // Create tasks for contacts
  for (const contact of contacts.slice(0, 15)) {
    tasks.push({
      title: `Connect with ${contact.first_name} ${contact.last_name} about ${faker.helpers.arrayElement([
        'kitchen efficiency', 'inventory needs', 'compliance tracking', 'staff scheduling'
      ])}`,
      description: faker.helpers.arrayElement([
        "Discuss pain points with current kitchen workflow",
        "Learn about seasonal menu changes and planning needs",
        "Understand food cost tracking requirements",
        "Review delivery integration challenges",
        "Explore multi-location management needs"
      ]),
      type: faker.helpers.arrayElement(["follow_up", "meeting", "email", "call"]),
      status: faker.helpers.arrayElement(["pending", "in_progress", "completed"]),
      priority: faker.helpers.arrayElement(["low", "medium", "high"]),
      due_date: faker.date.future({ years: 0.25 }),
      contact_id: contact.id,
      completed: faker.datatype.boolean(0.2),
    });
  }

  const { data, error } = await supabase.from("tasks").insert(tasks).select();

  if (error) {
    console.error("❌ Error creating tasks:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} F&B tasks`);
  return data;
}

async function createNotes(opportunities: any[], contacts: any[]) {
  console.log("📝 Creating F&B notes...");

  const opportunityNotes = [];
  const contactNotes = [];

  const fbOpportunityNotes = [
    "Discussed their current kitchen workflow bottlenecks. Main pain point is manual inventory counting taking 4+ hours daily. Very interested in automated tracking.",
    "Chef expressed frustration with current POS system not integrating with their recipe costing. Losing visibility on actual food costs vs theoretical costs.",
    "Operations manager mentioned they're opening 3 new locations next quarter. Timeline is tight but they need consistent systems across all sites.",
    "Demo went well. Kitchen staff loved the tablet interface. Main concern is training during busy season. Suggested pilot at slower location first.",
    "Budget approved! Legal review of contract underway. Want to start with inventory module, then add recipe management in phase 2.",
    "Competitor (Toast) is already embedded in their new locations. Need to show clear ROI advantage and migration path. Sending case study from similar chain.",
    "Food safety compliance is top priority after recent health inspection. Our HACCP tracking features really resonated with QA team.",
    "Discussed integration with their current suppliers. They use 3 main distributors - need to verify our order system supports all their vendors."
  ];

  const fbContactNotes = [
    "Very knowledgeable about kitchen operations. Been in F&B for 15+ years. Appreciates solutions that work in high-pressure environments.",
    "Prefers morning calls before lunch rush. Best time is 9-10am EST. Mentioned they're evaluating 2-3 other solutions but price is a major factor.",
    "Strong advocate for technology in the kitchen. Successfully championed their current POS adoption 3 years ago. Good internal champion.",
    "Concerned about staff adoption. High turnover in kitchen means training needs to be simple and fast. Asked for video tutorials.",
    "Budget owner for all tech purchases. Needs board approval for anything over $50K. Fiscal year ends in March - good timing.",
    "Reached out via LinkedIn after seeing our restaurant tech webinar. Interested in waste reduction features specifically.",
    "Mentioned competitor Toast quoted them $35K for similar setup. Need to stay competitive but show superior customer support.",
    "Frustrated with current vendor's support response times. Kitchen down = revenue lost. 24/7 support is non-negotiable for them."
  ];

  // Create notes for opportunities
  for (const opp of opportunities.slice(0, 25)) {
    const noteCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < noteCount; i++) {
      opportunityNotes.push({
        opportunity_id: opp.id,
        content: faker.helpers.arrayElement(fbOpportunityNotes),
        type: faker.helpers.arrayElement(["meeting", "call", "email", "internal"]),
        is_private: faker.datatype.boolean(0.2),
      });
    }
  }

  // Create notes for contacts
  for (const contact of contacts.slice(0, 20)) {
    contactNotes.push({
      contact_id: contact.id,
      content: faker.helpers.arrayElement(fbContactNotes),
      type: faker.helpers.arrayElement(["meeting", "call", "email", "general"]),
      is_private: faker.datatype.boolean(0.1),
    });
  }

  const { data: oppNotes, error: oppError } = await supabase
    .from("opportunityNotes")
    .insert(opportunityNotes)
    .select();

  const { data: contNotes, error: contError } = await supabase
    .from("contactNotes")
    .insert(contactNotes)
    .select();

  if (oppError) console.error("❌ Error creating opportunity notes:", oppError);
  if (contError) console.error("❌ Error creating contact notes:", contError);

  const totalNotes = (oppNotes?.length || 0) + (contNotes?.length || 0);
  console.log(`✅ Created ${totalNotes} notes`);

  return { opportunityNotes: oppNotes || [], contactNotes: contNotes || [] };
}

async function main() {
  console.log("🚀 Starting fake data generation for Atomic CRM\n");

  try {
    // Optional: Clear existing data first
    const shouldClear = process.argv.includes("--clear");
    if (shouldClear) {
      await clearExistingData();
    }

    // Create data in dependency order
    const tags = await createTags();
    const companies = await createCompanies();
    const contacts = await createContacts(companies);
    await createContactOrganizationRelationships(contacts, companies);
    const opportunities = await createOpportunities(companies, tags);
    await createOpportunityContacts(opportunities, contacts);
    await createTasks(opportunities, contacts);
    await createNotes(opportunities, contacts);

    console.log("\n✨ Food & Beverage data generation complete!");
    console.log("\n📊 Summary:");
    console.log(`- ${tags.length} tags`);
    console.log(`- ${companies.length} F&B companies (restaurants, manufacturers, distributors)`);
    console.log(`- ${contacts.length} F&B contacts (chefs, managers, owners)`);
    console.log(`- ${opportunities.length} F&B opportunities (software solutions)`);
    console.log(`- F&B-specific tasks and notes created`);
    console.log("\n🎯 Your CRM is now populated with realistic Food & Beverage industry data!");

  } catch (error) {
    console.error("\n❌ Error during data generation:", error);
    process.exit(1);
  }
}

// Run the script
main();