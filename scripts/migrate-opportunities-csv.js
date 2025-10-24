#!/usr/bin/env node

/**
 * CSV Opportunity Migration Script
 *
 * Engineering Constitution Compliance:
 * - NO OVER-ENGINEERING: Simple fs.readFileSync + manual parsing (no csv-parse dependency)
 * - FAIL FAST: Stops on first unmapped stage with clear error
 * - SINGLE SOURCE OF TRUTH: Uses stage_mapping.json as canonical mapping
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Get it from: npx supabase status');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load stage mapping
const stageMappingPath = path.join(__dirname, '..', 'data', 'stage_mapping.json');
let CSV_STAGE_MAP;

try {
  const mappingContent = fs.readFileSync(stageMappingPath, 'utf-8');
  CSV_STAGE_MAP = JSON.parse(mappingContent);
  console.log(`📖 Loaded ${Object.keys(CSV_STAGE_MAP).length} stage mappings`);
} catch (error) {
  console.error(`❌ Failed to load ${stageMappingPath}`);
  process.exit(1);
}

/**
 * Simple CSV parser for our specific use case
 * NO OVER-ENGINEERING: Parse only what we need
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');

  // Skip first 15 rows (headers/instructions), start from row 16
  const dataLines = lines.slice(15);

  const rows = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    // Simple comma split (good enough for our CSV structure)
    const fields = line.split(',');

    // Skip if not enough columns
    if (fields.length < 16) continue;

    const row = {
      rowNumber: i + 16, // Actual row number in CSV
      priority: fields[1]?.trim() || '',
      customerOrg: fields[2]?.trim() || '',
      name: fields[3]?.trim() || '',
      startDate: fields[4]?.trim() || '',
      startOfWeek: fields[5]?.trim() || '',
      status: fields[6]?.trim() || '',
      stage: fields[7]?.trim() || '',
      expectedCloseDate: fields[8]?.trim() || '',
      probability: fields[9]?.trim() || '',
      principal: fields[10]?.trim() || '',
      product: fields[11]?.trim() || '',
      volume: fields[12]?.trim() || '',
      dealOwner: fields[13]?.trim() || '',
      source: fields[14]?.trim() || '',
      lossReason: fields[15]?.trim() || '',
      notes: fields[16]?.trim() || '',
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Filter out invalid rows
 * FAIL FAST: Clear validation rules
 */
function filterValidRows(rows) {
  return rows.filter(row => {
    // Skip if no stage
    if (!row.stage) return false;

    // Skip if stage is a date (wrong column data)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(row.stage)) return false;

    // Skip if stage is a text fragment or organization name (data errors)
    if (row.stage.length > 50 || row.stage.includes(' and ') || row.stage.includes('?')) {
      return false;
    }

    // Skip if stage looks like an organization name (no hyphens/numbers, capitalized)
    if (!row.stage.includes('-') && !row.stage.includes('_') && !/\d/.test(row.stage) && row.stage.length < 20) {
      // Likely an org name like "Kaufholds", "VAF", etc. in wrong column
      // But allow our valid stages like "Open", "Swap", "Phone"
      const validSingleWords = ['Open', 'open', 'Swap', 'Phone'];
      if (!validSingleWords.includes(row.stage)) {
        return false;
      }
    }

    // Skip if no opportunity name
    if (!row.name) return false;

    return true;
  });
}

/**
 * Validate ALL stages are mapped
 * FAIL FAST: Stop before import if any unmapped stage
 */
function validateStages(rows) {
  const errors = [];

  for (const row of rows) {
    if (!CSV_STAGE_MAP[row.stage]) {
      errors.push({
        row: row.rowNumber,
        stage: row.stage,
      });
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ CSV VALIDATION FAILED - Unmapped stages found:\n');
    errors.slice(0, 10).forEach(err => {
      console.error(`   Row ${err.row}: "${err.stage}"`);
    });

    if (errors.length > 10) {
      console.error(`   ... and ${errors.length - 10} more`);
    }

    console.error('\n   Update data/stage_mapping.json with these stages\n');
    throw new Error(`Validation failed: ${errors.length} unmapped stages`);
  }

  console.log('✅ All stages validated');
}

/**
 * Lookup organization ID by name
 */
async function lookupOrganizationId(orgName) {
  if (!orgName) return null;

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', orgName)
    .maybeSingle();

  if (error) {
    console.error(`   ⚠️  Error looking up "${orgName}":`, error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CSV Opportunity Migration');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Read CSV
    const csvPath = path.join(__dirname, '..', 'data', 'Opportunity.csv');
    console.log(`📂 Reading ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const allRows = parseCSV(csvContent);
    console.log(`📊 Parsed ${allRows.length} total rows`);

    // Filter valid rows
    const validRows = filterValidRows(allRows);
    console.log(`📊 Found ${validRows.length} valid rows to import`);
    console.log(`   (Skipped ${allRows.length - validRows.length} invalid rows)\n`);

    // Validate stages (FAIL FAST)
    console.log('🔍 Validating stage mappings...');
    validateStages(validRows);

    // Import opportunities
    console.log('\n🚀 Starting import...\n');

    let imported = 0;
    let skipped = 0;

    for (const row of validRows) {
      const mappedStage = CSV_STAGE_MAP[row.stage];

      // Lookup organizations
      const customerOrgId = await lookupOrganizationId(row.customerOrg);
      const principalOrgId = await lookupOrganizationId(row.principal);

      if (!customerOrgId) {
        console.log(`   ⚠️  Row ${row.rowNumber}: Skipping "${row.name}" - customer org "${row.customerOrg}" not found`);
        skipped++;
        continue;
      }

      // Create opportunity
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          name: row.name,
          stage: mappedStage,
          customer_organization_id: customerOrgId,
          principal_organization_id: principalOrgId,
          estimated_close_date: row.expectedCloseDate || null,
          description: row.notes || null,
          // Priority auto-set by trigger
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Row ${row.rowNumber}: Failed to import "${row.name}":`, error.message);
        skipped++;
        continue;
      }

      // Backfill contacts from interactions
      if (opportunity) {
        await supabase.rpc('backfill_opportunity_contacts', {
          p_opportunity_id: opportunity.id,
        });
      }

      imported++;

      if (imported % 50 === 0) {
        console.log(`   Progress: ${imported}/${validRows.length} imported...`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   ${imported} opportunities imported`);
    console.log(`   ${skipped} rows skipped\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => process.exit(0));
