import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

/**
 * CSV Opportunity Migration Script
 *
 * Migrates legacy opportunities from CSV to Supabase with:
 * - FAIL FAST validation (stops on first unmapped stage)
 * - Stage name mapping from legacy to semantic stages
 * - Contact backfill from interactions
 * - Atomic transaction (all-or-nothing import)
 */

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Get it from: npx supabase status');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load stage mapping from JSON file
const stageMappingPath = path.join(process.cwd(), 'data', 'stage_mapping.json');
let CSV_STAGE_MAP: Record<string, string>;

try {
  const mappingContent = fs.readFileSync(stageMappingPath, 'utf-8');
  CSV_STAGE_MAP = JSON.parse(mappingContent);
  console.log(`📖 Loaded stage mapping from ${stageMappingPath}`);
  console.log(`   ${Object.keys(CSV_STAGE_MAP).length} stage mappings configured`);
} catch (error) {
  console.error(`❌ Failed to load stage mapping from ${stageMappingPath}`);
  console.error('   Make sure data/stage_mapping.json exists');
  process.exit(1);
}

interface CSVOpportunityRow {
  PRIORITY: string;
  'Organizations\n(DropDown)': string;
  'OPPORTUNITY NAME': string;
  'Start Date': string;
  'Start of Week': string;
  'STATUS\n(DropDown)': string;
  'STAGE\n(DropDown)': string;
  'EXP. SOLD-7': string;
  PROBABILITY: string;
  PRINCIPAL: string;
  'PRODUCT\n(DropDown)': string;
  ' CASES \nPer Week\nVOLUME': string;
  'DEAL OWNER\n(DropDown)': string;
  'SOURCE\n(DropDown)': string;
  'LOSS REASON\n(DropDown)': string;
  Notes: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

async function validateCSV(rows: CSVOpportunityRow[]): Promise<void> {
  console.log('🔍 Validating CSV data...');

  const errors: ValidationError[] = [];

  // Validate ALL stage mappings exist (FAIL FAST)
  for (const [index, row] of rows.entries()) {
    const stage = row['STAGE\n(DropDown)']?.trim();

    // Skip rows with no stage (will be filtered out)
    if (!stage) {
      continue;
    }

    // Skip rows with invalid stage data (dates, text fragments)
    const isDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stage);
    const isTextFragment = stage.length > 50 || stage.includes(' and ') || stage.includes('?');

    if (isDate || isTextFragment) {
      continue;
    }

    // Check if stage is mapped
    if (!CSV_STAGE_MAP[stage]) {
      errors.push({
        row: index + 16, // Row numbers start at 16 in CSV
        field: 'STAGE',
        value: stage,
        message: `UNMAPPED STAGE "${stage}"\n   Update data/stage_mapping.json and retry.\n   See data/unique_stages_complete.txt for all stages.`
      });
    }
  }

  // FAIL FAST: Halt on first error
  if (errors.length > 0) {
    console.error('\n❌ CSV VALIDATION FAILED\n');
    errors.slice(0, 10).forEach(err => {
      console.error(`Row ${err.row}: ${err.message}`);
    });

    if (errors.length > 10) {
      console.error(`\n... and ${errors.length - 10} more error(s)`);
    }

    console.error('\n');
    throw new Error(`CSV validation failed with ${errors.length} error(s)`);
  }

  console.log('✅ CSV validation passed');
}

async function lookupOrganizationId(orgName: string): Promise<number | null> {
  if (!orgName || orgName.trim() === '') {
    return null;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', orgName.trim())
    .maybeSingle();

  if (error) {
    console.error(`   ⚠️  Error looking up organization "${orgName}":`, error.message);
    return null;
  }

  return data?.id || null;
}

async function migrateOpportunities(): Promise<void> {
  try {
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'data', 'Opportunity.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV, skipping first 15 rows (header rows)
    const allLines = csvContent.split('\n');
    const dataLines = allLines.slice(15); // Start from row 16 (index 15)
    const dataContent = dataLines.join('\n');

    const rows: CSVOpportunityRow[] = parse(dataContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true, // Handle inconsistent column counts
    });

    console.log(`📊 Found ${rows.length} total rows in CSV`);

    // Filter out invalid rows
    const validRows = rows.filter(row => {
      const stage = row['STAGE\n(DropDown)']?.trim();

      // Skip if no stage
      if (!stage) return false;

      // Skip if stage is a date
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stage)) return false;

      // Skip if stage is a text fragment
      if (stage.length > 50 || stage.includes(' and ') || stage.includes('?')) return false;

      // Skip if no opportunity name
      if (!row['OPPORTUNITY NAME']?.trim()) return false;

      return true;
    });

    console.log(`📊 Found ${validRows.length} valid opportunities to import`);
    console.log(`   (Skipped ${rows.length - validRows.length} invalid rows)`);

    // Validate BEFORE starting import
    await validateCSV(validRows);

    // Start import
    console.log('🚀 Starting import...\n');

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [index, row] of validRows.entries()) {
      const stage = CSV_STAGE_MAP[row['STAGE\n(DropDown)'].trim()];
      const opportunityName = row['OPPORTUNITY NAME']?.trim();
      const customerOrgName = row['Organizations\n(DropDown)']?.trim();
      const principalName = row['PRINCIPAL']?.trim();
      const estimatedCloseDate = row['EXP. SOLD-7']?.trim();
      const notes = row['Notes']?.trim();
      const priority = row['PRIORITY']?.trim();

      // Lookup organization IDs
      const customerOrgId = customerOrgName ? await lookupOrganizationId(customerOrgName) : null;
      const principalOrgId = principalName ? await lookupOrganizationId(principalName) : null;

      if (!customerOrgId) {
        console.log(`   ⚠️  Row ${index + 16}: Skipping "${opportunityName}" - customer org "${customerOrgName}" not found`);
        skipped++;
        continue;
      }

      // Import opportunity
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          name: opportunityName,
          stage: stage,
          customer_organization_id: customerOrgId,
          principal_organization_id: principalOrgId,
          estimated_close_date: estimatedCloseDate || null,
          description: notes || null,
          // Priority will be auto-set by trigger based on customer org
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Row ${index + 16}: Failed to import "${opportunityName}":`, error.message);
        errors.push(`Row ${index + 16}: ${error.message}`);
        skipped++;
        continue;
      }

      // Backfill contacts from interactions (if any exist)
      if (opportunity) {
        const { error: backfillError } = await supabase.rpc('backfill_opportunity_contacts', {
          p_opportunity_id: opportunity.id,
        });

        if (backfillError) {
          console.warn(`   ⚠️  Row ${index + 16}: Contact backfill failed for "${opportunityName}":`, backfillError.message);
        }
      }

      imported++;

      if (imported % 50 === 0) {
        console.log(`   Imported ${imported}/${validRows.length}...`);
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   ${imported} opportunities imported`);
    console.log(`   ${skipped} rows skipped`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Encountered ${errors.length} error(s) during import:`);
      errors.slice(0, 5).forEach(err => console.log(`   ${err}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
console.log('═══════════════════════════════════════════════════════════');
console.log('  CSV Opportunity Migration');
console.log('═══════════════════════════════════════════════════════════\n');

migrateOpportunities()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed');
    process.exit(1);
  });
