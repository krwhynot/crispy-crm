#!/usr/bin/env tsx
/**
 * Import contacts from CSV with organization mapping
 *
 * Usage:
 *   npm run import:contacts
 *   tsx scripts/import-contacts-csv.ts
 *
 * This script:
 * 1. Reads data/csv-files/cleaned/contacts_db_ready.csv
 * 2. Maps CSV org_id (line numbers) to real database IDs via csv_line_number
 * 3. Parses JSON email/phone arrays
 * 4. Fails fast on first error (NO OVER-ENGINEERING)
 */

import { readFileSync } from 'fs';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Parse JSON field from CSV (handles email/phone arrays)
 */
function parseJSONField(value: string): any {
  if (!value || value.trim() === '' || value === '[]') {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`⚠️  Invalid JSON, using empty array: ${value.substring(0, 50)}`);
    return [];
  }
}

/**
 * Parse organization_id from CSV (converts "25.0" to 25)
 */
function parseOrgId(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    return null;
  }

  return Math.floor(parsed);
}

async function importContacts() {
  console.log('📦 Starting contact import...\n');

  // Step 1: Build organization mapping (csv_line_number -> database id)
  console.log('   Building organization mapping...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, csv_line_number, name')
    .not('csv_line_number', 'is', null);

  if (orgError) {
    console.error('❌ Failed to load organizations:', orgError.message);
    process.exit(1);
  }

  const orgMap = new Map<number, number>();
  orgs.forEach((org) => {
    orgMap.set(org.csv_line_number, org.id);
  });

  console.log(`   Loaded ${orgMap.size} organization mappings\n`);

  // Step 2: Read and parse contacts CSV
  const csvPath = resolve(__dirname, '../data/csv-files/cleaned/contacts_db_ready.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const rows = parsed.data;

  console.log(`   Found ${rows.length} contacts in CSV\n`);

  let inserted = 0;
  let skipped = 0;
  let withoutOrg = 0;
  let invalidOrgRef = 0;

  // Step 3: Import each contact
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const csvLineNum = i + 2; // Account for header row

    // Parse organization reference
    const csvOrgLine = parseOrgId(row.organization_id);
    let realOrgId: number | null = null;

    if (csvOrgLine !== null) {
      realOrgId = orgMap.get(csvOrgLine) || null;

      if (realOrgId === null) {
        console.warn(`⚠️  Line ${csvLineNum}: Invalid org reference ${csvOrgLine} - organization not found`);
        invalidOrgRef++;
      }
    } else {
      withoutOrg++;
    }

    // Parse JSON fields
    const emails = parseJSONField(row.email);
    const phones = parseJSONField(row.phone);

    // Construct name field (required, not-null)
    const name = row.name ||
                 (row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null) ||
                 row.first_name ||
                 row.last_name ||
                 'Unknown';

    // Prepare contact data
    const contactData = {
      name: name,
      first_name: row.first_name || null,
      last_name: row.last_name || null,
      email: emails,
      phone: phones,
      title: row.title || null,
      department: row.department || null,
      organization_id: realOrgId,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      postal_code: row.postal_code || null,
      country: row.country || 'USA',
      linkedin_url: row.linkedin_url || null,
      notes: row.notes || null,
    };

    // Insert contact
    const { error } = await supabase
      .from('contacts')
      .insert(contactData);

    if (error) {
      // FAIL FAST - no retry logic
      console.error(`\n❌ Failed at CSV line ${csvLineNum}`);
      console.error(`   Contact: ${row.first_name} ${row.last_name}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      console.error(`   Data:`, contactData);
      process.exit(1);
    }

    inserted++;

    // Progress indicator every 100 rows
    if (inserted % 100 === 0) {
      console.log(`   Processed ${inserted} contacts...`);
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   Inserted:           ${inserted}`);
  console.log(`   Without org:        ${withoutOrg} (null organization_id)`);
  console.log(`   Invalid org ref:    ${invalidOrgRef} (org not found, set to null)`);
  console.log(`   Total:              ${rows.length}`);
}

// Run import
importContacts()
  .then(() => {
    console.log('\n🎉 Contact import finished successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Import failed:', err.message);
    console.error(err);
    process.exit(1);
  });
