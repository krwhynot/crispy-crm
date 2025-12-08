#!/usr/bin/env npx tsx
/**
 * MasterFoods CSV Data Import Script
 *
 * ONE-TIME SCRIPT - Delete after successful migration.
 *
 * Imports production data from CSV files into Crispy-CRM Supabase database.
 * Supports two modes:
 *   - SQL generation for local development (supabase db reset)
 *   - Direct cloud import for production
 *
 * Usage:
 *   npx tsx scripts/import-masterfoods-data.ts --generate-sql
 *   npx tsx scripts/import-masterfoods-data.ts --generate-sql --dry-run
 *   npx tsx scripts/import-masterfoods-data.ts --import-cloud
 *
 * Required Environment Variables (for --import-cloud):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * CSV Files (in data/production-data/):
 *   - seed_organizations.csv (2,023 records)
 *   - seed_contacts.csv (1,776 records)
 *   - seed_organization_distributors.csv (716 records)
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface ImportConfig {
  mode: "generate-sql" | "import-cloud";
  csvDir: string;
  outputPath: string;
  batchSize: number;
  dryRun: boolean;
}

interface ValidationError {
  file: string;
  row: number;
  field: string;
  value: string;
  message: string;
}

interface OrganizationRow {
  name: string;
  organization_type: string;
  is_distributor: string;
  segment_name: string;
  playbook_category_name: string;
  priority: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  linkedin_url: string;
  notes: string;
  cuisine: string;
  needs_review: string;
}

interface ContactRow {
  name: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  email: string;
  phone: string;
  title: string;
  linkedin_url: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
}

interface DistributorRow {
  organization_name: string;
  distributor_name: string;
  is_primary: string;
}

interface TransformedOrg {
  id: number;
  name: string;
  organization_type: string; // 'distributor', 'prospect', etc.
  playbook_category_id: string | null;
  priority: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  linkedin_url: string | null;
  notes: string | null;
  cuisine: string | null;
  needs_review: string | null;
}

interface TransformedContact {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  organization_id: number;
  email: any[];
  phone: any[];
  title: string | null;
  linkedin_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
}

interface TransformedDistributor {
  id: number;
  organization_id: number;
  distributor_id: number;
  is_primary: boolean;
}

interface OrgMapEntry {
  id: number;
  isDistributor: boolean;
}

// ============================================================================
// SEGMENT MAPPING CONSTANTS
// ============================================================================

/**
 * Fixed playbook category UUIDs (already exist in database)
 * These are seeded in migrations and should NOT be recreated
 */
const PLAYBOOK_CATEGORY_UUIDS = {
  MAJOR_BROADLINE: "22222222-2222-4222-8222-000000000001",
  SPECIALTY_REGIONAL: "22222222-2222-4222-8222-000000000002",
  MANAGEMENT_COMPANY: "22222222-2222-4222-8222-000000000003",
  GPO: "22222222-2222-4222-8222-000000000004",
  UNIVERSITY: "22222222-2222-4222-8222-000000000005",
  RESTAURANT_GROUP: "22222222-2222-4222-8222-000000000006",
  CHAIN_RESTAURANT: "22222222-2222-4222-8222-000000000007",
  HOTEL_AVIATION: "22222222-2222-4222-8222-000000000008",
  UNKNOWN: "22222222-2222-4222-8222-000000000009",
} as const;

/**
 * Direct mapping: playbook_category_name (CSV) -> UUID
 */
const PLAYBOOK_CATEGORY_TO_UUID: Record<string, string> = {
  "Major Broadline": PLAYBOOK_CATEGORY_UUIDS.MAJOR_BROADLINE,
  "Specialty/Regional": PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL,
  "Protein/Seafood": PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL,
  Produce: PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL,
  Dairy: PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL,
  "Bakery/Beverage": PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL,
  "Management Company": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  GPO: PLAYBOOK_CATEGORY_UUIDS.GPO,
  University: PLAYBOOK_CATEGORY_UUIDS.UNIVERSITY,
  "Restaurant Group": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Chain Restaurant": PLAYBOOK_CATEGORY_UUIDS.CHAIN_RESTAURANT,
  "Hotel & Aviation": PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION,
  Unknown: PLAYBOOK_CATEGORY_UUIDS.UNKNOWN,
};

/**
 * Mapping: segment_name (CSV) -> playbook_category_id (UUID)
 * Maps CSV segment values to the 9 playbook categories
 */
const SEGMENT_NAME_TO_UUID: Record<string, string> = {
  // Restaurant Types -> Restaurant Group
  "Fine Dining": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Casual Dining": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  Gastropub: PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Full-Service Restaurant": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Food Truck": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Bars & Lounges": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,
  "Restaurant Group": PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP,

  // Fast Food -> Chain Restaurant
  "Fast Food/QSR": PLAYBOOK_CATEGORY_UUIDS.CHAIN_RESTAURANT,
  Pizza: PLAYBOOK_CATEGORY_UUIDS.CHAIN_RESTAURANT,

  // Hospitality -> Hotel & Aviation
  "Hotels & Lodging": PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION,
  Travel: PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION,
  Entertainment: PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION,
  "Recreation/Clubs": PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION,

  // Education
  "Education - Higher Ed": PLAYBOOK_CATEGORY_UUIDS.UNIVERSITY,

  // Institutional -> Management Company
  Healthcare: PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  "Education - K-12": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  "Business & Industry": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  Catering: PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  "Meal Prep Service": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  "Vending Services": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
  "Military/Government": PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseArgs(): ImportConfig {
  const args = process.argv.slice(2);

  if (args.includes("--generate-sql")) {
    return {
      mode: "generate-sql",
      csvDir: resolve(__dirname, "../data/production-data"),
      outputPath: resolve(__dirname, "../supabase/seed.sql"),
      batchSize: 100,
      dryRun: args.includes("--dry-run"),
    };
  }

  if (args.includes("--import-cloud")) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for cloud import");
      console.error("   Get service role key from: npx supabase status (local) or Supabase dashboard (cloud)");
      process.exit(1);
    }
    return {
      mode: "import-cloud",
      csvDir: resolve(__dirname, "../data/production-data"),
      outputPath: "",
      batchSize: 100,
      dryRun: args.includes("--dry-run"),
    };
  }

  console.error("Usage: npx tsx scripts/import-masterfoods-data.ts [--generate-sql|--import-cloud] [--dry-run]");
  console.error("");
  console.error("Options:");
  console.error("  --generate-sql   Generate supabase/seed.sql for local development");
  console.error("  --import-cloud   Import directly to cloud Supabase instance");
  console.error("  --dry-run        Validate only, no writes");
  process.exit(1);
}

function escapeSQLString(str: string | null | undefined): string {
  if (str === null || str === undefined || str === "") return "NULL";
  const cleaned = String(str)
    .replace(/\x00/g, "") // Remove null bytes
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Remove control characters
  return `'${cleaned.replace(/'/g, "''")}'`;
}

function toPostgresJSONB(value: string): string {
  if (!value || value === "[]" || value.trim() === "") {
    return `'[]'::jsonb`;
  }
  try {
    const parsed = JSON.parse(value);
    const jsonStr = JSON.stringify(parsed).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  } catch {
    return `'[]'::jsonb`;
  }
}

function parseIsDistributor(value: string): boolean {
  const v = (value || "").trim().toLowerCase();
  return v === "true" || v === "distributor";
}

function parsePriority(value: string): string {
  const v = (value || "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(v)) return v;
  return "C"; // Default
}

function resolvePlaybookCategoryId(segmentName: string, playbookCategoryName: string): string | null {
  // Priority: playbook_category_name > segment_name > null (unknown will be handled later)
  const playbookTrimmed = (playbookCategoryName || "").trim();
  const segmentTrimmed = (segmentName || "").trim();

  if (playbookTrimmed && PLAYBOOK_CATEGORY_TO_UUID[playbookTrimmed]) {
    return PLAYBOOK_CATEGORY_TO_UUID[playbookTrimmed];
  }
  if (segmentTrimmed && SEGMENT_NAME_TO_UUID[segmentTrimmed]) {
    return SEGMENT_NAME_TO_UUID[segmentTrimmed];
  }
  // Return null for unknown - don't force a category
  return null;
}

function parseJSONB(value: string): any[] {
  if (!value || value === "[]" || value.trim() === "") {
    return [];
  }
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

// ============================================================================
// CSV LOADING
// ============================================================================

function loadOrganizations(csvDir: string): OrganizationRow[] {
  const csvPath = resolve(csvDir, "seed_organizations.csv");
  const content = readFileSync(csvPath, "utf-8");
  const result = Papa.parse<OrganizationRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

function loadContacts(csvDir: string): ContactRow[] {
  const csvPath = resolve(csvDir, "seed_contacts.csv");
  const content = readFileSync(csvPath, "utf-8");
  const result = Papa.parse<ContactRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

function loadDistributors(csvDir: string): DistributorRow[] {
  const csvPath = resolve(csvDir, "seed_organization_distributors.csv");
  const content = readFileSync(csvPath, "utf-8");
  const result = Papa.parse<DistributorRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

// ============================================================================
// VALIDATION (Fail-Fast)
// ============================================================================

function validateAllData(
  orgs: OrganizationRow[],
  contacts: ContactRow[],
  distributors: DistributorRow[]
): { errors: ValidationError[]; orgMap: Map<string, OrgMapEntry> } {
  const errors: ValidationError[] = [];
  const orgMap = new Map<string, OrgMapEntry>();
  const seenNames = new Set<string>();

  // Phase 1: Validate organizations and build lookup map
  let nextId = 1;
  orgs.forEach((org, idx) => {
    const rowNum = idx + 2; // CSV row (1-indexed + header)
    const name = (org.name || "").trim();
    const normalizedName = name.toLowerCase();

    if (!name) {
      errors.push({
        file: "seed_organizations.csv",
        row: rowNum,
        field: "name",
        value: "",
        message: "Organization name is required",
      });
      return;
    }

    // Skip duplicates (deduplication, not an error)
    if (seenNames.has(normalizedName)) {
      return;
    }

    seenNames.add(normalizedName);
    const isDistributor = parseIsDistributor(org.is_distributor);
    orgMap.set(normalizedName, { id: nextId++, isDistributor });
  });

  // Phase 2: Validate contacts
  contacts.forEach((contact, idx) => {
    const rowNum = idx + 2;
    const orgName = (contact.organization_name || "").trim();
    const normalizedOrgName = orgName.toLowerCase();

    if (!orgName) {
      errors.push({
        file: "seed_contacts.csv",
        row: rowNum,
        field: "organization_name",
        value: "",
        message: "Organization name is required (contacts.organization_id is NOT NULL)",
      });
      return;
    }

    if (!orgMap.has(normalizedOrgName)) {
      errors.push({
        file: "seed_contacts.csv",
        row: rowNum,
        field: "organization_name",
        value: orgName,
        message: `Organization not found: "${orgName}"`,
      });
    }
  });

  // Phase 3: Validate distributors
  const seenDistRelations = new Set<string>();
  distributors.forEach((dist, idx) => {
    const rowNum = idx + 2;
    const orgName = (dist.organization_name || "").trim();
    const distName = (dist.distributor_name || "").trim();
    const orgKey = orgName.toLowerCase();
    const distKey = distName.toLowerCase();

    if (!orgName) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "organization_name",
        value: "",
        message: "Organization name is required",
      });
      return;
    }

    if (!distName) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "distributor_name",
        value: "",
        message: "Distributor name is required",
      });
      return;
    }

    if (!orgMap.has(orgKey)) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "organization_name",
        value: orgName,
        message: `Organization not found: "${orgName}"`,
      });
    }

    if (!orgMap.has(distKey)) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "distributor_name",
        value: distName,
        message: `Distributor organization not found: "${distName}"`,
      });
    } else if (!orgMap.get(distKey)?.isDistributor) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "distributor_name",
        value: distName,
        message: `"${distName}" is not marked as a distributor (is_distributor=false)`,
      });
    }

    // Check self-distribution
    if (orgKey === distKey) {
      errors.push({
        file: "seed_organization_distributors.csv",
        row: rowNum,
        field: "distributor_name",
        value: distName,
        message: "Organization cannot be its own distributor",
      });
    }

    // Track duplicate relationships (silently skip, not an error)
    const relationKey = `${orgKey}:${distKey}`;
    if (seenDistRelations.has(relationKey)) {
      // Skip duplicate - will be deduplicated in transform phase
      return;
    }
    seenDistRelations.add(relationKey);
  });

  return { errors, orgMap };
}

// ============================================================================
// TRANSFORMATION
// ============================================================================

function transformOrganizations(orgs: OrganizationRow[], orgMap: Map<string, OrgMapEntry>): TransformedOrg[] {
  const transformed: TransformedOrg[] = [];
  const seenNames = new Set<string>();

  orgs.forEach((org) => {
    const name = (org.name || "").trim();
    const normalizedName = name.toLowerCase();

    if (!name || seenNames.has(normalizedName)) return;
    seenNames.add(normalizedName);

    const entry = orgMap.get(normalizedName);
    if (!entry) return;

    // Determine organization_type: if is_distributor=true, use 'distributor', otherwise use CSV value or default
    const orgType = entry.isDistributor
      ? "distributor"
      : (org.organization_type || "prospect").trim().toLowerCase();

    transformed.push({
      id: entry.id,
      name: name,
      organization_type: orgType,
      playbook_category_id: resolvePlaybookCategoryId(org.segment_name, org.playbook_category_name),
      priority: parsePriority(org.priority),
      phone: org.phone?.trim() || null,
      address: org.address?.trim() || null,
      city: org.city?.trim() || null,
      state: org.state?.trim() || null,
      postal_code: org.postal_code?.trim() || null,
      linkedin_url: org.linkedin_url?.trim() || null,
      notes: org.notes?.trim() || null,
      cuisine: org.cuisine?.trim() || null,
      needs_review: org.needs_review?.trim() || null,
    });
  });

  return transformed;
}

function transformContacts(contacts: ContactRow[], orgMap: Map<string, OrgMapEntry>): TransformedContact[] {
  const transformed: TransformedContact[] = [];
  let nextId = 1;

  contacts.forEach((contact) => {
    const orgName = (contact.organization_name || "").trim();
    const normalizedOrgName = orgName.toLowerCase();
    const entry = orgMap.get(normalizedOrgName);

    if (!entry) return; // Skip contacts without valid org (validation catches this)

    // Build name from available fields
    const name =
      contact.name?.trim() ||
      [contact.first_name?.trim(), contact.last_name?.trim()].filter(Boolean).join(" ") ||
      "Unknown";

    transformed.push({
      id: nextId++,
      name: name,
      first_name: contact.first_name?.trim() || null,
      last_name: contact.last_name?.trim() || null,
      organization_id: entry.id,
      email: parseJSONB(contact.email),
      phone: parseJSONB(contact.phone),
      title: contact.title?.trim() || null,
      linkedin_url: contact.linkedin_url?.trim() || null,
      address: contact.address?.trim() || null,
      city: contact.city?.trim() || null,
      state: contact.state?.trim() || null,
      postal_code: contact.postal_code?.trim() || null,
      notes: contact.notes?.trim() || null,
    });
  });

  return transformed;
}

function transformDistributors(
  distributors: DistributorRow[],
  orgMap: Map<string, OrgMapEntry>
): TransformedDistributor[] {
  const transformed: TransformedDistributor[] = [];
  const seenRelations = new Set<string>();
  let nextId = 1;

  distributors.forEach((dist) => {
    const orgName = (dist.organization_name || "").trim();
    const distName = (dist.distributor_name || "").trim();
    const orgKey = orgName.toLowerCase();
    const distKey = distName.toLowerCase();

    const orgEntry = orgMap.get(orgKey);
    const distEntry = orgMap.get(distKey);

    if (!orgEntry || !distEntry) return;
    if (orgKey === distKey) return; // Skip self-distribution

    const relationKey = `${orgKey}:${distKey}`;
    if (seenRelations.has(relationKey)) return;
    seenRelations.add(relationKey);

    transformed.push({
      id: nextId++,
      organization_id: orgEntry.id,
      distributor_id: distEntry.id,
      is_primary: (dist.is_primary || "").toLowerCase() === "true",
    });
  });

  return transformed;
}

// ============================================================================
// SQL GENERATION
// ============================================================================

function generateSQL(
  orgs: TransformedOrg[],
  contacts: TransformedContact[],
  distributors: TransformedDistributor[]
): string {
  const timestamp = new Date().toISOString();

  let sql = `-- ============================================================================
-- MASTERFOODS PRODUCTION SEED DATA
-- ============================================================================
-- Generated: ${timestamp}
-- Organizations: ${orgs.length}
-- Contacts: ${contacts.length}
-- Organization-Distributor Relations: ${distributors.length}
--
-- Source Files (data/production-data/):
--   - seed_organizations.csv
--   - seed_contacts.csv
--   - seed_organization_distributors.csv
--
-- Import Order: Organizations -> Contacts -> Organization Distributors
--
-- Run with: npx supabase db reset
-- ============================================================================

-- ============================================================================
-- TEST USER (for local development)
-- ============================================================================
-- Login: admin@test.com / password123

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3129876-b1fe-40eb-9980-64f5f73c64d6',
  'authenticated', 'authenticated', 'admin@test.com',
  crypt('password123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(), NOW(), '', '', '', '', '', '', '', '', false, false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at;

-- ============================================================================
-- PLAYBOOK CATEGORIES (9 fixed segments)
-- ============================================================================
-- These are the 9 playbook categories with fixed UUIDs
-- Insert only if they don't exist (idempotent)

INSERT INTO segments (id, name, segment_type, display_order, created_at) VALUES
  ('22222222-2222-4222-8222-000000000001', 'Major Broadline', 'playbook', 1, NOW()),
  ('22222222-2222-4222-8222-000000000002', 'Specialty/Regional', 'playbook', 2, NOW()),
  ('22222222-2222-4222-8222-000000000003', 'Management Company', 'playbook', 3, NOW()),
  ('22222222-2222-4222-8222-000000000004', 'GPO', 'playbook', 4, NOW()),
  ('22222222-2222-4222-8222-000000000005', 'University', 'playbook', 5, NOW()),
  ('22222222-2222-4222-8222-000000000006', 'Restaurant Group', 'playbook', 6, NOW()),
  ('22222222-2222-4222-8222-000000000007', 'Chain Restaurant', 'playbook', 7, NOW()),
  ('22222222-2222-4222-8222-000000000008', 'Hotel & Aviation', 'playbook', 8, NOW()),
  ('22222222-2222-4222-8222-000000000009', 'Unknown', 'playbook', 9, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS (${orgs.length} records)
-- ============================================================================
-- Uses ON CONFLICT to handle organizations that may exist from migrations
-- Updates existing records with seed data values

`;

  // Generate organization inserts in batches WITH ON CONFLICT
  const orgChunks = chunkArray(orgs, 100);
  orgChunks.forEach((chunk, chunkIdx) => {
    sql += `-- Batch ${chunkIdx + 1}/${orgChunks.length}\n`;
    sql += `INSERT INTO organizations (id, name, organization_type, playbook_category_id, priority, phone, address, city, state, postal_code, linkedin_url, notes, cuisine, needs_review) VALUES\n`;

    const values = chunk.map((org, idx) => {
      const vals = [
        org.id,
        escapeSQLString(org.name),
        escapeSQLString(org.organization_type),
        org.playbook_category_id ? `'${org.playbook_category_id}'` : "NULL",
        escapeSQLString(org.priority),
        escapeSQLString(org.phone),
        escapeSQLString(org.address),
        escapeSQLString(org.city),
        escapeSQLString(org.state),
        escapeSQLString(org.postal_code),
        escapeSQLString(org.linkedin_url),
        escapeSQLString(org.notes),
        escapeSQLString(org.cuisine),
        escapeSQLString(org.needs_review),
      ].join(", ");
      return `  (${vals})${idx < chunk.length - 1 ? "," : ""}`;
    });

    sql += values.join("\n");
    // Add ON CONFLICT clause for unique name constraint
    sql += `\nON CONFLICT ((LOWER(name))) WHERE deleted_at IS NULL DO UPDATE SET
  organization_type = EXCLUDED.organization_type,
  playbook_category_id = EXCLUDED.playbook_category_id,
  priority = EXCLUDED.priority,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code,
  linkedin_url = EXCLUDED.linkedin_url,
  notes = EXCLUDED.notes,
  cuisine = EXCLUDED.cuisine,
  needs_review = EXCLUDED.needs_review;\n\n`;
  });

  // Generate contact inserts
  sql += `-- ============================================================================
-- CONTACTS (${contacts.length} records)
-- ============================================================================

`;

  const contactChunks = chunkArray(contacts, 100);
  contactChunks.forEach((chunk, chunkIdx) => {
    sql += `-- Batch ${chunkIdx + 1}/${contactChunks.length}\n`;
    sql += `INSERT INTO contacts (id, name, first_name, last_name, organization_id, email, phone, title, linkedin_url, address, city, state, postal_code, notes) VALUES\n`;

    const values = chunk.map((contact, idx) => {
      const vals = [
        contact.id,
        escapeSQLString(contact.name),
        escapeSQLString(contact.first_name),
        escapeSQLString(contact.last_name),
        contact.organization_id,
        toPostgresJSONB(JSON.stringify(contact.email)),
        toPostgresJSONB(JSON.stringify(contact.phone)),
        escapeSQLString(contact.title),
        escapeSQLString(contact.linkedin_url),
        escapeSQLString(contact.address),
        escapeSQLString(contact.city),
        escapeSQLString(contact.state),
        escapeSQLString(contact.postal_code),
        escapeSQLString(contact.notes),
      ].join(", ");
      return `  (${vals})${idx < chunk.length - 1 ? "," : ";"}`;
    });

    sql += values.join("\n") + "\n\n";
  });

  // Generate distributor relationship inserts
  sql += `-- ============================================================================
-- ORGANIZATION DISTRIBUTORS (${distributors.length} records)
-- ============================================================================

`;

  const distChunks = chunkArray(distributors, 100);
  distChunks.forEach((chunk, chunkIdx) => {
    sql += `-- Batch ${chunkIdx + 1}/${distChunks.length}\n`;
    // Note: id column is GENERATED ALWAYS AS IDENTITY, so we omit it
    sql += `INSERT INTO organization_distributors (organization_id, distributor_id, is_primary) VALUES\n`;

    const values = chunk.map((dist, idx) => {
      const vals = [dist.organization_id, dist.distributor_id, dist.is_primary].join(", ");
      return `  (${vals})${idx < chunk.length - 1 ? "," : ";"}`;
    });

    sql += values.join("\n") + "\n\n";
  });

  // Sequence resets
  sql += `-- ============================================================================
-- RESET SEQUENCES (critical for new record creation)
-- ============================================================================

SELECT setval('organizations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM organizations));
SELECT setval('contacts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contacts));
-- organization_distributors uses GENERATED ALWAYS AS IDENTITY, sequence is auto-managed

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================
-- Run these to verify import:
--
-- SELECT 'organizations' as tbl, COUNT(*) FROM organizations WHERE deleted_at IS NULL
-- UNION ALL SELECT 'contacts', COUNT(*) FROM contacts WHERE deleted_at IS NULL
-- UNION ALL SELECT 'organization_distributors', COUNT(*) FROM organization_distributors WHERE deleted_at IS NULL;
--
-- SELECT o.name as org, d.name as distributor
-- FROM organization_distributors od
-- JOIN organizations o ON od.organization_id = o.id
-- JOIN organizations d ON od.distributor_id = d.id
-- LIMIT 10;
`;

  return sql;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// CLOUD IMPORT
// ============================================================================

async function importToCloud(
  supabase: SupabaseClient,
  orgs: TransformedOrg[],
  contacts: TransformedContact[],
  distributors: TransformedDistributor[],
  config: ImportConfig
): Promise<void> {
  const errors: string[] = [];

  // Import organizations
  console.log(`\n   Importing ${orgs.length} organizations...`);
  const orgChunks = chunkArray(orgs, config.batchSize);

  for (let i = 0; i < orgChunks.length; i++) {
    const chunk = orgChunks[i];
    const { error } = await supabase.from("organizations").insert(
      chunk.map((org) => ({
        id: org.id,
        name: org.name,
        organization_type: org.organization_type,
        playbook_category_id: org.playbook_category_id,
        priority: org.priority,
        phone: org.phone,
        address: org.address,
        city: org.city,
        state: org.state,
        postal_code: org.postal_code,
        linkedin_url: org.linkedin_url,
        notes: org.notes,
        cuisine: org.cuisine,
        needs_review: org.needs_review,
      }))
    );

    if (error) {
      errors.push(`Organizations batch ${i + 1}: ${error.message}`);
    }

    if ((i + 1) % 5 === 0 || i === orgChunks.length - 1) {
      console.log(`     Batch ${i + 1}/${orgChunks.length} complete`);
    }
  }

  // Import contacts
  console.log(`\n   Importing ${contacts.length} contacts...`);
  const contactChunks = chunkArray(contacts, config.batchSize);

  for (let i = 0; i < contactChunks.length; i++) {
    const chunk = contactChunks[i];
    const { error } = await supabase.from("contacts").insert(
      chunk.map((contact) => ({
        id: contact.id,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        organization_id: contact.organization_id,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        linkedin_url: contact.linkedin_url,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        postal_code: contact.postal_code,
        notes: contact.notes,
      }))
    );

    if (error) {
      errors.push(`Contacts batch ${i + 1}: ${error.message}`);
    }

    if ((i + 1) % 5 === 0 || i === contactChunks.length - 1) {
      console.log(`     Batch ${i + 1}/${contactChunks.length} complete`);
    }
  }

  // Import distributor relationships
  console.log(`\n   Importing ${distributors.length} distributor relationships...`);
  const distChunks = chunkArray(distributors, config.batchSize);

  for (let i = 0; i < distChunks.length; i++) {
    const chunk = distChunks[i];
    // Note: id column is GENERATED ALWAYS AS IDENTITY, so we omit it
    const { error } = await supabase.from("organization_distributors").insert(
      chunk.map((dist) => ({
        organization_id: dist.organization_id,
        distributor_id: dist.distributor_id,
        is_primary: dist.is_primary,
      }))
    );

    if (error) {
      errors.push(`Distributors batch ${i + 1}: ${error.message}`);
    }

    if ((i + 1) % 5 === 0 || i === distChunks.length - 1) {
      console.log(`     Batch ${i + 1}/${distChunks.length} complete`);
    }
  }

  if (errors.length > 0) {
    console.error("\n   Errors during import:");
    errors.forEach((e) => console.error(`     ${e}`));
  }
}

// ============================================================================
// SUMMARY REPORT
// ============================================================================

function printSummary(
  orgs: TransformedOrg[],
  contacts: TransformedContact[],
  distributors: TransformedDistributor[],
  config: ImportConfig
): void {
  // Count by playbook category
  const categoryCount = new Map<string, number>();
  orgs.forEach((org) => {
    const cat = org.playbook_category_id || "unassigned";
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
  });

  // Map UUID to name for display
  const uuidToName: Record<string, string> = {
    [PLAYBOOK_CATEGORY_UUIDS.MAJOR_BROADLINE]: "Major Broadline",
    [PLAYBOOK_CATEGORY_UUIDS.SPECIALTY_REGIONAL]: "Specialty/Regional",
    [PLAYBOOK_CATEGORY_UUIDS.MANAGEMENT_COMPANY]: "Management Company",
    [PLAYBOOK_CATEGORY_UUIDS.GPO]: "GPO",
    [PLAYBOOK_CATEGORY_UUIDS.UNIVERSITY]: "University",
    [PLAYBOOK_CATEGORY_UUIDS.RESTAURANT_GROUP]: "Restaurant Group",
    [PLAYBOOK_CATEGORY_UUIDS.CHAIN_RESTAURANT]: "Chain Restaurant",
    [PLAYBOOK_CATEGORY_UUIDS.HOTEL_AVIATION]: "Hotel & Aviation",
    [PLAYBOOK_CATEGORY_UUIDS.UNKNOWN]: "Unknown",
    unassigned: "Unassigned (NULL)",
  };

  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  IMPORT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log(`  Organizations:     ${orgs.length.toLocaleString()}`);
  console.log(`  Contacts:          ${contacts.length.toLocaleString()}`);
  console.log(`  Distributor Links: ${distributors.length.toLocaleString()}`);
  console.log("");
  console.log("  Playbook Category Distribution:");

  // Sort by count descending
  const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
  sortedCategories.forEach(([uuid, count]) => {
    const name = uuidToName[uuid] || uuid;
    const pct = ((count / orgs.length) * 100).toFixed(1);
    console.log(`    - ${name.padEnd(20)} ${count.toLocaleString().padStart(6)} (${pct}%)`);
  });

  console.log("");
  if (config.mode === "generate-sql") {
    console.log(`  Output: ${config.outputPath}`);
  }
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MasterFoods CSV Data Import");
  console.log(`  Mode: ${config.mode}${config.dryRun ? " (dry-run)" : ""}`);
  console.log("═══════════════════════════════════════════════════════════════");

  // Load CSV files
  console.log("\n1️⃣  Loading CSV files...");
  const orgsRaw = loadOrganizations(config.csvDir);
  const contactsRaw = loadContacts(config.csvDir);
  const distributorsRaw = loadDistributors(config.csvDir);

  console.log(`   Organizations CSV:     ${orgsRaw.length} rows`);
  console.log(`   Contacts CSV:          ${contactsRaw.length} rows`);
  console.log(`   Distributors CSV:      ${distributorsRaw.length} rows`);

  // Validate
  console.log("\n2️⃣  Validating data (fail-fast)...");
  const { errors, orgMap } = validateAllData(orgsRaw, contactsRaw, distributorsRaw);

  if (errors.length > 0) {
    console.error("\n❌ VALIDATION FAILED\n");
    console.error(`   ${errors.length} error(s) found:\n`);
    errors.slice(0, 20).forEach((e) => {
      console.error(`   ${e.file}:${e.row} [${e.field}] ${e.message}`);
      if (e.value) console.error(`      Value: "${e.value}"`);
    });
    if (errors.length > 20) {
      console.error(`\n   ... and ${errors.length - 20} more errors`);
    }
    process.exit(1);
  }

  console.log(`   ✓ All data valid`);
  console.log(`   ✓ ${orgMap.size} unique organizations (deduped)`);

  // Transform
  console.log("\n3️⃣  Transforming data...");
  const orgs = transformOrganizations(orgsRaw, orgMap);
  const contacts = transformContacts(contactsRaw, orgMap);
  const distributors = transformDistributors(distributorsRaw, orgMap);

  console.log(`   Organizations: ${orgs.length}`);
  console.log(`   Contacts:      ${contacts.length}`);
  console.log(`   Distributors:  ${distributors.length}`);

  // Execute
  if (config.dryRun) {
    console.log("\n4️⃣  Dry run - skipping writes");
    printSummary(orgs, contacts, distributors, config);
    console.log("✅ Dry run complete. Use without --dry-run to write output.\n");
    return;
  }

  if (config.mode === "generate-sql") {
    console.log("\n4️⃣  Generating SQL...");
    const sql = generateSQL(orgs, contacts, distributors);
    writeFileSync(config.outputPath, sql, "utf-8");
    console.log(`   Written to: ${config.outputPath}`);
  } else {
    console.log("\n4️⃣  Importing to cloud...");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await importToCloud(supabase, orgs, contacts, distributors, config);
  }

  printSummary(orgs, contacts, distributors, config);

  console.log("✅ Import complete!\n");
  console.log("📋 Next steps:");
  if (config.mode === "generate-sql") {
    console.log("   1. Review: head -100 supabase/seed.sql");
    console.log("   2. Test:   npm run db:local:reset");
    console.log("   3. Verify counts with validation queries at end of seed.sql\n");
  } else {
    console.log("   1. Verify data in Supabase dashboard");
    console.log("   2. Run validation queries to confirm counts\n");
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
