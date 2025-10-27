#!/usr/bin/env tsx
/**
 * Import organizations from CSV with csv_line_number mapping
 *
 * Usage:
 *   npm run import:orgs
 *   tsx scripts/import-organizations-csv.ts
 *
 * This script:
 * 1. Reads data/csv-files/organizations_standardized.csv
 * 2. Inserts each organization with csv_line_number = row position
 * 3. Fails fast on first error (NO OVER-ENGINEERING)
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

async function importOrganizations() {
  console.log('📦 Starting organization import...\n');

  // Read and parse CSV file
  const csvPath = resolve(__dirname, '../data/csv-files/organizations_standardized.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV with PapaParse
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const rows = parsed.data;

  console.log(`   Found ${rows.length} organizations in CSV\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const csvLine = i + 1; // 1-indexed (excluding header)

    // Skip rows with empty names
    if (!row.name || row.name.trim() === '') {
      console.log(`⚠️  Line ${csvLine}: Skipping - no name`);
      skipped++;
      continue;
    }

    // Prepare organization data
    const orgData = {
      name: row.name.trim(),
      organization_type: row.organization_type || 'unknown',
      priority: row.priority || 'C',
      csv_line_number: csvLine,
      phone: row.phone || null,
      linkedin_url: row.linkedin_url || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      postal_code: row.postal_code || null,
      notes: row.notes || null,
    };

    // Insert organization
    const { error } = await supabase
      .from('organizations')
      .insert(orgData);

    if (error) {
      // Check if it's a duplicate name error (we expect some from seed.sql)
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log(`⏭️  Line ${csvLine}: Skipping duplicate "${row.name}"`);
        skipped++;
        continue;
      }

      // Other errors - FAIL FAST
      console.error(`\n❌ Failed at CSV line ${csvLine}: ${row.name}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      process.exit(1);
    }

    inserted++;

    // Progress indicator every 100 rows
    if (inserted % 100 === 0) {
      console.log(`   Processed ${inserted} organizations...`);
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped:  ${skipped} (duplicates or empty names)`);
  console.log(`   Total:    ${rows.length}`);
}

// Run import
importOrganizations()
  .then(() => {
    console.log('\n🎉 Organization import finished successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Import failed:', err.message);
    console.error(err);
    process.exit(1);
  });
