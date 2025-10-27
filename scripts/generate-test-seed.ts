#!/usr/bin/env npx tsx
/**
 * TEST VERSION: Generate seed.sql from CSV files (SMALL SUBSET)
 *
 * This script processes a SMALL subset of data to validate the approach:
 * - First 20 organizations
 * - All contacts that reference those 20 orgs
 *
 * Output: supabase/test-seed.sql (for manual testing)
 *
 * Usage: npm run generate:test-seed
 */

import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TEST CONFIGURATION
const TEST_ORG_COUNT = 100;  // Process first 100 organizations (to capture contacts)

console.log('📦 Generating TEST seed data from CSVs...\n');
console.log(`   Test size: ${TEST_ORG_COUNT} organizations\n`);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeSQLString(str: string | null | undefined): string {
  if (str === null || str === undefined || str === '') return 'NULL';
  // Escape single quotes by doubling them
  return `'${String(str).replace(/'/g, "''")}'`;
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
// PROCESS ORGANIZATIONS (FIRST 20 ONLY)
// ============================================================================

console.log(`2️⃣  Processing first ${TEST_ORG_COUNT} organizations...`);

const testOrgsArray = orgsArray.slice(0, TEST_ORG_COUNT);

// Deduplicate by lowercase name
const uniqueOrgs = new Map();
testOrgsArray.forEach((org, index) => {
  const key = (org.name || '').trim().toLowerCase();
  if (key && !uniqueOrgs.has(key)) {
    uniqueOrgs.set(key, {
      ...org,
      csvLineNumber: index + 1,  // 1-indexed
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
// PROCESS CONTACTS (ONLY THOSE REFERENCING TEST ORGS)
// ============================================================================

console.log('3️⃣  Processing contacts...');

const testContacts: any[] = [];
let contactId = 1;
let matchedCount = 0;
let unmatchedCount = 0;

contactsArray.forEach((contact) => {
  const csvLine = parseOrgId(contact.organization_id);

  // Only include contacts that reference our test organizations
  if (csvLine && csvLine <= TEST_ORG_COUNT) {
    const orgName = orgsArray[csvLine - 1]?.name;
    if (orgName) {
      const orgId = orgNameToId.get(orgName.trim().toLowerCase());

      if (orgId) {
        // Construct name field
        const name = contact.name ||
                     (contact.first_name && contact.last_name ? `${contact.first_name} ${contact.last_name}` : null) ||
                     contact.first_name ||
                     contact.last_name ||
                     'Unknown';

        testContacts.push({
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
        matchedCount++;
      } else {
        unmatchedCount++;
      }
    }
  }
});

console.log(`   Matched contacts: ${matchedCount}`);
console.log(`   Unmatched: ${unmatchedCount}\n`);

// ============================================================================
// GENERATE SQL
// ============================================================================

console.log('4️⃣  Generating SQL...\n');

let sql = `-- ============================================================================
-- TEST SEED DATA - Generated from CSV files (SUBSET)
-- ============================================================================
-- This is a TEST file with ${TEST_ORG_COUNT} organizations and ${testContacts.length} contacts
-- Generated: ${new Date().toISOString()}
--
-- DO NOT use this in production - this is for testing the approach
-- Run with: psql <connection> -f supabase/test-seed.sql
-- ============================================================================

-- Test user (from original seed.sql)
-- Note: This is simplified - you may need to preserve the full test user setup

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
-- CONTACTS (${testContacts.length} total)
-- ============================================================================

INSERT INTO contacts (id, name, first_name, last_name, organization_id, email, phone, title, department, address, city, state, postal_code, country, linkedin_url, notes) VALUES\n`;

const contactValues = testContacts.map((contact, idx) => {
  const values = [
    contact.id,
    escapeSQLString(contact.name),
    escapeSQLString(contact.first_name),
    escapeSQLString(contact.last_name),
    contact.organization_id,
    toPostgresJSON(contact.email),
    toPostgresJSON(contact.phone),
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

  return `  (${values})${idx < testContacts.length - 1 ? ',' : ';'}`;
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

const outputPath = resolve(__dirname, '../supabase/test-seed.sql');
writeFileSync(outputPath, sql, 'utf-8');

console.log('✅ Test seed file generated!');
console.log(`   Output: supabase/test-seed.sql`);
console.log(`   Organizations: ${orgsForSQL.length}`);
console.log(`   Contacts: ${testContacts.length}\n`);
console.log('📋 Next steps:');
console.log('   1. Review: cat supabase/test-seed.sql');
console.log('   2. Test: psql <connection> -f supabase/test-seed.sql');
console.log('   3. Validate with the queries at the end of the file\n');
