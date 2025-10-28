#!/usr/bin/env npx tsx
/**
 * PRODUCTION: Generate seed.sql from CSV files (FULL DATASET)
 *
 * This script processes ALL data from CSV files:
 * - All organizations from organizations_standardized.csv
 * - All contacts from contacts_db_ready.csv
 *
 * Output: supabase/seed.sql (production seed file)
 *
 * Usage: npm run generate:seed
 *
 * Industry Standards Applied:
 * - Name-based deduplication (case-insensitive)
 * - Sequential database IDs (not CSV line numbers)
 * - Phone format: plain digits without .0 suffix
 * - Email/phone: JSONB arrays with type metadata
 */

import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📦 Generating FULL seed data from CSVs...\n');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeSQLString(str: string | null | undefined): string {
  if (str === null || str === undefined || str === '') return 'NULL';
  // Clean invalid UTF-8 characters and escape single quotes
  const cleaned = String(str)
    .replace(/�/g, '') // Remove replacement character
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  return `'${cleaned.replace(/'/g, "''")}'`;
}

function parseOrgId(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : Math.floor(parsed);
}

function toPostgresJSON(value: string, fieldType: 'email' | 'phone' = 'email'): string {
  if (!value || value === '[]' || value.trim() === '') {
    return `'[]'::jsonb`;
  }

  try {
    const parsed = JSON.parse(value);

    // Clean up phone numbers: remove .0 suffix from numeric strings
    if (fieldType === 'phone' && Array.isArray(parsed)) {
      parsed.forEach((item: any) => {
        if (item.number) {
          // Convert "12247352450.0" to "12247352450"
          const numStr = String(item.number);
          if (numStr.endsWith('.0')) {
            item.number = numStr.slice(0, -2);
          }
        }
      });
    }

    const jsonStr = JSON.stringify(parsed).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  } catch {
    console.warn(`   ⚠️  Invalid JSON, using empty array: ${value.substring(0, 50)}`);
    return `'[]'::jsonb`;
  }
}

// ============================================================================
// READ CSV FILES
// ============================================================================

console.log('1️⃣  Reading CSV files...');

const orgsPath = resolve(__dirname, '../data/csv-files/organizations_standardized.csv');
const contactsPath = resolve(__dirname, '../data/csv-files/cleaned/contacts_db_ready.csv');

const orgsCSV = readFileSync(orgsPath, 'utf-8');
const contactsCSV = readFileSync(contactsPath, 'utf-8');

const orgsParsed = Papa.parse(orgsCSV, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim(),
});

const contactsParsed = Papa.parse(contactsCSV, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim(),
});

const orgsArray: any[] = orgsParsed.data;
const contactsArray: any[] = contactsParsed.data;

console.log(`   Organizations CSV: ${orgsArray.length} rows`);
console.log(`   Contacts CSV: ${contactsArray.length} rows\n`);

// ============================================================================
// PROCESS ORGANIZATIONS (ALL)
// ============================================================================

console.log('2️⃣  Processing ALL organizations...');

// Deduplicate by lowercase name
const uniqueOrgs = new Map();
orgsArray.forEach((org, index) => {
  const key = (org.name || '').trim().toLowerCase();
  if (key && !uniqueOrgs.has(key)) {
    uniqueOrgs.set(key, {
      ...org,
      csvLineNumber: index + 1,  // Used only for contact mapping, not stored in DB
    });
  }
});

// Assign sequential IDs
let nextOrgId = 1;
const orgNameToId = new Map();
const orgsForSQL: any[] = [];

uniqueOrgs.forEach((org, nameKey) => {
  const orgId = nextOrgId++;
  org.id = orgId;
  orgNameToId.set(nameKey, orgId);
  orgsForSQL.push(org);
});

console.log(`   Unique organizations: ${orgsForSQL.length}\n`);

// ============================================================================
// PROCESS CONTACTS (ALL)
// ============================================================================

console.log('3️⃣  Processing ALL contacts...');

const contactsForSQL: any[] = [];
let contactId = 1;
let matchedCount = 0;
let unmatchedCount = 0;
let withoutOrgCount = 0;

contactsArray.forEach((contact) => {
  const csvLine = parseOrgId(contact.organization_id);

  // Map CSV line number to actual org ID (if present)
  let orgId: number | null = null;
  if (csvLine) {
    const orgName = orgsArray[csvLine - 1]?.name;
    if (orgName) {
      orgId = orgNameToId.get(orgName.trim().toLowerCase()) || null;
      if (orgId) {
        matchedCount++;
      } else {
        unmatchedCount++;
      }
    }
  } else {
    withoutOrgCount++;
  }

  // Construct name field (required, not-null)
  const name = contact.name ||
               (contact.first_name && contact.last_name ? `${contact.first_name} ${contact.last_name}` : null) ||
               contact.first_name ||
               contact.last_name ||
               'Unknown';

  contactsForSQL.push({
    id: contactId++,
    name,
    first_name: contact.first_name || null,
    last_name: contact.last_name || null,
    organization_id: orgId,
    email: contact.email || '[]',
    phone: contact.phone || '[]',
    title: contact.title || null,
    department: contact.department || null,
    address: contact.address || null,
    city: contact.city || null,
    state: contact.state || null,
    postal_code: contact.postal_code || null,
    country: contact.country || 'USA',
    linkedin_url: contact.linkedin_url || null,
    notes: contact.notes || null,
  });
});

console.log(`   With organization: ${matchedCount}`);
console.log(`   Without organization: ${withoutOrgCount}`);
console.log(`   Invalid org reference: ${unmatchedCount}\n`);

// ============================================================================
// GENERATE SQL
// ============================================================================

console.log('4️⃣  Generating SQL...\n');

let sql = `-- ============================================================================
-- PRODUCTION SEED DATA - Generated from CSV files
-- ============================================================================
-- Generated: ${new Date().toISOString()}
-- Organizations: ${orgsForSQL.length} (deduplicated)
-- Contacts: ${contactsForSQL.length}
--
-- Source Files:
--   - data/csv-files/organizations_standardized.csv
--   - data/csv-files/cleaned/contacts_db_ready.csv
--
-- Generation Method:
--   - Name-based deduplication (case-insensitive)
--   - Sequential database IDs (line numbers used only during generation)
--   - Industry-standard JSONB format for email/phone arrays
--
-- Run with: npx supabase db reset (runs automatically)
-- Or manually: psql <connection> -f supabase/seed.sql
-- ============================================================================

-- ============================================================================
-- TEST USER (for local development)
-- ============================================================================
-- Login: admin@test.com / password123

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
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
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
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at;

-- Note: Sales record is auto-created by database trigger when auth.users is inserted

-- ============================================================================
-- ORGANIZATIONS (${orgsForSQL.length} unique)
-- ============================================================================

INSERT INTO organizations (id, name, organization_type, priority, phone, linkedin_url, address, city, state, postal_code, notes) VALUES\n`;

const orgValues = orgsForSQL.map((org, idx) => {
  const values = [
    org.id,
    escapeSQLString(org.name),
    escapeSQLString(org.organization_type || 'unknown'),
    escapeSQLString(org.priority || 'C'),
    escapeSQLString(org.phone),
    escapeSQLString(org.linkedin_url),
    escapeSQLString(org.address),
    escapeSQLString(org.city),
    escapeSQLString(org.state),
    escapeSQLString(org.postal_code),
    escapeSQLString(org.notes),
  ].join(', ');

  return `  (${values})${idx < orgsForSQL.length - 1 ? ',' : ';'}`;
});

sql += orgValues.join('\n') + '\n\n';

// ============================================================================
// CONTACTS
// ============================================================================

sql += `-- ============================================================================
-- CONTACTS (${contactsForSQL.length} total)
-- ============================================================================

INSERT INTO contacts (id, name, first_name, last_name, organization_id, email, phone, title, department, address, city, state, postal_code, country, linkedin_url, notes) VALUES\n`;

const contactValues = contactsForSQL.map((contact, idx) => {
  const values = [
    contact.id,
    escapeSQLString(contact.name),
    escapeSQLString(contact.first_name),
    escapeSQLString(contact.last_name),
    contact.organization_id === null ? 'NULL' : contact.organization_id,
    toPostgresJSON(contact.email, 'email'),
    toPostgresJSON(contact.phone, 'phone'),
    escapeSQLString(contact.title),
    escapeSQLString(contact.department),
    escapeSQLString(contact.address),
    escapeSQLString(contact.city),
    escapeSQLString(contact.state),
    escapeSQLString(contact.postal_code),
    escapeSQLString(contact.country),
    escapeSQLString(contact.linkedin_url),
    escapeSQLString(contact.notes),
  ].join(', ');

  return `  (${values})${idx < contactsForSQL.length - 1 ? ',' : ';'}`;
});

sql += contactValues.join('\n') + '\n\n';

// ============================================================================
// VALIDATION QUERIES
// ============================================================================

sql += `-- ============================================================================
-- VALIDATION QUERIES (run these to verify)
-- ============================================================================

-- Check counts
-- SELECT COUNT(*) as org_count FROM organizations;
-- SELECT COUNT(*) as contact_count FROM contacts;

-- Check no orphaned contacts
-- SELECT COUNT(*) as orphaned FROM contacts
-- WHERE organization_id IS NOT NULL
--   AND organization_id NOT IN (SELECT id FROM organizations);

-- Sample relationships
-- SELECT c.name as contact, o.name as organization
-- FROM contacts c
-- JOIN organizations o ON c.organization_id = o.id
-- LIMIT 5;
`;

// ============================================================================
// WRITE OUTPUT
// ============================================================================

const outputPath = resolve(__dirname, '../supabase/seed.sql');
writeFileSync(outputPath, sql, 'utf-8');

console.log('✅ Production seed file generated!');
console.log(`   Output: supabase/seed.sql`);
console.log(`   Organizations: ${orgsForSQL.length} (deduplicated)`);
console.log(`   Contacts: ${contactsForSQL.length}`);
console.log(`   - With organization: ${matchedCount}`);
console.log(`   - Without organization: ${withoutOrgCount}`);
console.log(`   - Invalid org reference: ${unmatchedCount}\n`);
console.log('📋 Next steps:');
console.log('   1. Review: head -100 supabase/seed.sql');
console.log('   2. Test: npm run db:local:reset (runs seed.sql automatically)');
console.log('   3. Validate with the queries at the end of the file\n');
