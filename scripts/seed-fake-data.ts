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
  console.log("🏢 Creating companies...");

  const companies = Array.from({ length: 20 }, () => {
    const companyName = faker.company.name();
    return {
      name: companyName,
      industry: faker.helpers.arrayElement([
        "Technology", "Healthcare", "Finance", "Retail", "Manufacturing",
        "Education", "Real Estate", "Transportation", "Energy", "Media"
      ]),
      size: faker.helpers.arrayElement(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
      website: faker.internet.url(),
      linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      annual_revenue: faker.number.int({ min: 100000, max: 100000000 }),
      employee_count: faker.number.int({ min: 5, max: 5000 }),
      description: faker.company.catchPhrase(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postal_code: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: faker.internet.email({ provider: companyName.toLowerCase().replace(/\s+/g, '') + '.com' }),
    };
  });

  const { data, error } = await supabase.from("companies").insert(companies).select();

  if (error) {
    console.error("❌ Error creating companies:", error);
    return [];
  }

  console.log(`✅ Created ${data.length} companies`);
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
        title: faker.person.jobTitle(),
        department: faker.helpers.arrayElement([
          "Sales", "Marketing", "Engineering", "Product", "Executive",
          "Finance", "Operations", "HR", "Legal", "Customer Success"
        ]),
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
  console.log("💰 Creating opportunities...");

  const opportunities = [];

  // Create 1-3 opportunities per company
  for (const company of companies) {
    const oppCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < oppCount; i++) {
      const stage = faker.helpers.arrayElement(OPPORTUNITY_STAGES);
      const amount = faker.number.int({ min: 10000, max: 500000 });

      opportunities.push({
        name: `${company.name} - ${faker.commerce.productName()}`,
        organization_id: company.id,
        amount: amount,
        stage: stage.stage,
        probability: stage.probability,
        expected_close_date: faker.date.future({ years: 1 }),
        description: faker.lorem.paragraph(),
        next_step: faker.lorem.sentence(),
        competitor: faker.helpers.arrayElement([
          "Competitor A", "Competitor B", "Competitor C", "None", "Unknown"
        ]),
        source: faker.helpers.arrayElement([
          "Website", "Referral", "Cold Call", "Trade Show",
          "Email Campaign", "Social Media", "Partner"
        ]),
        loss_reason: stage.stage === "closed_lost" ? faker.helpers.arrayElement([
          "Price", "Features", "Timing", "Competition", "Budget", "No Decision"
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

  console.log(`✅ Created ${data.length} opportunities`);
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
  console.log("✅ Creating tasks...");

  const tasks = [];

  // Create tasks for opportunities
  for (const opp of opportunities.slice(0, 20)) {
    tasks.push({
      title: `Follow up on ${opp.name}`,
      description: faker.lorem.paragraph(),
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
      title: `Connect with ${contact.first_name} ${contact.last_name}`,
      description: faker.lorem.paragraph(),
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

  console.log(`✅ Created ${data.length} tasks`);
  return data;
}

async function createNotes(opportunities: any[], contacts: any[]) {
  console.log("📝 Creating notes...");

  const opportunityNotes = [];
  const contactNotes = [];

  // Create notes for opportunities
  for (const opp of opportunities.slice(0, 25)) {
    const noteCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < noteCount; i++) {
      opportunityNotes.push({
        opportunity_id: opp.id,
        content: faker.lorem.paragraphs(2),
        type: faker.helpers.arrayElement(["meeting", "call", "email", "internal"]),
        is_private: faker.datatype.boolean(0.2),
      });
    }
  }

  // Create notes for contacts
  for (const contact of contacts.slice(0, 20)) {
    contactNotes.push({
      contact_id: contact.id,
      content: faker.lorem.paragraph(),
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

    console.log("\n✨ Fake data generation complete!");
    console.log("\n📊 Summary:");
    console.log(`- ${tags.length} tags`);
    console.log(`- ${companies.length} companies`);
    console.log(`- ${contacts.length} contacts`);
    console.log(`- ${opportunities.length} opportunities`);
    console.log(`- Tasks and notes created`);
    console.log("\n🎯 You can now test the unified data provider with realistic data!");

  } catch (error) {
    console.error("\n❌ Error during data generation:", error);
    process.exit(1);
  }
}

// Run the script
main();