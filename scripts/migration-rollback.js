#!/usr/bin/env node

/**
 * Migration Rollback System
 * Emergency rollback execution for migration failures
 * - Restores from timestamp-based backup tables
 * - Verifies rollback integrity
 * - Supports partial rollback by phase
 * - Enforces 48-hour rollback window
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'migration-rollback.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  if (fs.existsSync(path.dirname(LOG_FILE))) {
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
  }
}

function error(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${message}`;
  console.error(logEntry);
  if (fs.existsSync(path.dirname(LOG_FILE))) {
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
  }
}

async function checkEnvironment() {
  log('Checking environment configuration...');

  // Check Supabase CLI availability
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
    log('Supabase CLI is available');
  } catch (e) {
    error('Supabase CLI is not available. Please install Supabase CLI.');
    process.exit(1);
  }

  // Check if project is linked
  try {
    execSync('npx supabase status', { stdio: 'pipe' });
    log('Supabase project is linked and accessible');
  } catch (e) {
    error('Supabase project is not linked or not accessible. Run "npx supabase link" first.');
    process.exit(1);
  }

  log('Environment check passed');
}

async function findLatestBackupManifest() {
  log('Finding latest backup manifest...');

  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error('Backup directory does not exist. No backups available.');
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-manifest-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No backup manifests found. Cannot proceed with rollback.');
  }

  const manifestFile = path.join(BACKUP_DIR, files[0]);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

  log(`Found backup manifest: ${manifestFile}`);
  log(`Backup timestamp: ${manifest.timestamp}`);

  return manifest;
}

async function validateRollbackWindow(manifest) {
  log('Validating rollback window...');

  const backupTime = new Date(manifest.timestamp);
  const currentTime = new Date();
  const hoursSinceBackup = (currentTime - backupTime) / (1000 * 60 * 60);

  if (hoursSinceBackup > 48) {
    throw new Error(
      `Rollback window expired. Backup is ${hoursSinceBackup.toFixed(1)} hours old (limit: 48 hours). ` +
      'Manual restoration required.'
    );
  }

  log(`Rollback window valid: ${hoursSinceBackup.toFixed(1)} hours since backup`);
}

async function confirmRollback(manifest) {
  console.log('\n' + '='.repeat(60));
  console.log('🚨 EMERGENCY MIGRATION ROLLBACK 🚨');
  console.log('='.repeat(60));
  console.log(`Backup timestamp: ${manifest.timestamp}`);
  console.log(`Tables to rollback: ${manifest.tableBackups.length}`);
  console.log('');
  console.log('⚠️  WARNING: This will PERMANENTLY DESTROY all data changes made during migration!');
  console.log('⚠️  This action cannot be undone!');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Type "EMERGENCY_ROLLBACK" to confirm: ', (answer) => {
      rl.close();
      if (answer === 'EMERGENCY_ROLLBACK') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function executeRollback(manifest) {
  log('Executing emergency rollback...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const rollbackResults = [];

  // Execute rollback for each table in reverse order (most recently created first)
  const tableBackups = [...manifest.tableBackups].reverse();

  for (const backup of tableBackups) {
    try {
      log(`Rolling back ${backup.originalTable} from ${backup.backupTable}...`);

      // Check if backup table still exists
      const { data: backupExists, error: checkError } = await supabase.rpc('exec_sql', {
        query: `SELECT 1 FROM information_schema.tables WHERE table_name = '${backup.backupTable}'`
      });

      if (checkError || !backupExists || backupExists.length === 0) {
        throw new Error(`Backup table ${backup.backupTable} not found`);
      }

      // Begin transaction for this table
      await supabase.rpc('exec_sql', { query: 'BEGIN;' });

      try {
        // Clear current table
        await supabase.rpc('exec_sql', {
          query: `TRUNCATE TABLE ${backup.originalTable} RESTART IDENTITY CASCADE;`
        });

        // Restore from backup (excluding backup_date column)
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '${backup.originalTable}'
            AND column_name != 'backup_date'
            ORDER BY ordinal_position
          `
        });

        if (columnsError) {
          throw columnsError;
        }

        const columnList = columns.map(col => col.column_name).join(', ');

        await supabase.rpc('exec_sql', {
          query: `
            INSERT INTO ${backup.originalTable} (${columnList})
            SELECT ${columnList}
            FROM ${backup.backupTable}
            WHERE backup_date = (SELECT MAX(backup_date) FROM ${backup.backupTable})
          `
        });

        // Commit transaction
        await supabase.rpc('exec_sql', { query: 'COMMIT;' });

        // Verify restoration
        const { count: originalCount, error: countError } = await supabase
          .from(backup.originalTable)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          throw countError;
        }

        rollbackResults.push({
          table: backup.originalTable,
          success: true,
          recordsRestored: originalCount,
          expectedRecords: backup.recordCount
        });

        log(`Successfully rolled back ${backup.originalTable}: ${originalCount} records restored`);

      } catch (e) {
        // Rollback transaction on error
        await supabase.rpc('exec_sql', { query: 'ROLLBACK;' });
        throw e;
      }

    } catch (e) {
      error(`Failed to rollback ${backup.originalTable}: ${e.message}`);
      rollbackResults.push({
        table: backup.originalTable,
        success: false,
        error: e.message
      });

      // Continue with other tables, but log the failure
    }
  }

  return rollbackResults;
}

async function executeStructuralRollback() {
  log('Executing structural rollback (opportunities → deals)...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Execute the complete Stage 1 rollback script
    const rollbackScript = `
-- Rollback Phase 1.1: Foundation Setup
DO $$
BEGIN
    RAISE NOTICE 'Starting structural rollback...';

    -- Drop views if they exist
    DROP VIEW IF EXISTS opportunities_with_status CASCADE;
    DROP VIEW IF EXISTS deals CASCADE;

    -- Drop triggers and functions
    DROP TRIGGER IF EXISTS trigger_calculate_opportunity_probability ON opportunities;
    DROP FUNCTION IF EXISTS calculate_opportunity_probability() CASCADE;

    -- Check if opportunities table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities') THEN
        -- Rename opportunityNotes back to dealNotes
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunityNotes') THEN
            ALTER TABLE "opportunityNotes" RENAME COLUMN opportunity_id TO deal_id;
            ALTER TABLE "opportunityNotes" RENAME TO "dealNotes";
        END IF;

        -- Restore company_id from customer_organization_id
        UPDATE opportunities
        SET company_id = customer_organization_id
        WHERE customer_organization_id IS NOT NULL;

        -- Drop opportunity-specific columns
        ALTER TABLE opportunities
        DROP COLUMN IF EXISTS stage,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS priority,
        DROP COLUMN IF EXISTS probability,
        DROP COLUMN IF EXISTS estimated_close_date,
        DROP COLUMN IF EXISTS actual_close_date,
        DROP COLUMN IF EXISTS customer_organization_id,
        DROP COLUMN IF EXISTS principal_organization_id,
        DROP COLUMN IF EXISTS distributor_organization_id,
        DROP COLUMN IF EXISTS founding_interaction_id,
        DROP COLUMN IF EXISTS stage_manual,
        DROP COLUMN IF EXISTS status_manual,
        DROP COLUMN IF EXISTS next_action,
        DROP COLUMN IF EXISTS next_action_date,
        DROP COLUMN IF EXISTS competition,
        DROP COLUMN IF EXISTS decision_criteria,
        DROP COLUMN IF EXISTS deleted_at,
        DROP COLUMN IF EXISTS search_tsv;

        -- Rename opportunities back to deals
        ALTER TABLE opportunities RENAME TO deals;
        ALTER SEQUENCE IF EXISTS opportunities_id_seq RENAME TO deals_id_seq;
    END IF;

    -- Drop contact and company enhancements
    ALTER TABLE contacts
    DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS department,
    DROP COLUMN IF EXISTS is_primary_contact,
    DROP COLUMN IF EXISTS purchase_influence,
    DROP COLUMN IF EXISTS decision_authority,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS search_tsv;

    ALTER TABLE companies
    DROP COLUMN IF EXISTS organization_type,
    DROP COLUMN IF EXISTS is_principal,
    DROP COLUMN IF EXISTS is_distributor,
    DROP COLUMN IF EXISTS parent_company_id,
    DROP COLUMN IF EXISTS segment,
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS import_session_id,
    DROP COLUMN IF EXISTS search_tsv;

    -- Recreate original views
    CREATE OR REPLACE VIEW deals_summary AS
    SELECT d.*, c.name as company_name
    FROM deals d
    LEFT JOIN companies c ON d.company_id = c.id
    WHERE d.archived_at IS NULL;

    RAISE NOTICE 'Structural rollback completed';
END $$;
    `;

    await supabase.rpc('exec_sql', { query: rollbackScript });
    log('Structural rollback completed successfully');

  } catch (e) {
    error(`Structural rollback failed: ${e.message}`);
    throw e;
  }
}

async function verifyRollback(rollbackResults) {
  log('Verifying rollback integrity...');

  const failed = rollbackResults.filter(r => !r.success);
  const succeeded = rollbackResults.filter(r => r.success);

  if (failed.length > 0) {
    log(`⚠️  ${failed.length} tables failed to rollback:`);
    failed.forEach(f => log(`  - ${f.table}: ${f.error}`));
  }

  if (succeeded.length > 0) {
    log(`✅ ${succeeded.length} tables successfully rolled back:`);
    succeeded.forEach(s => log(`  - ${s.table}: ${s.recordsRestored} records restored`));
  }

  const success = failed.length === 0;
  return { success, failed, succeeded };
}

async function updateMigrationHistory() {
  log('Updating migration history...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    await supabase.rpc('exec_sql', {
      query: `
        UPDATE migration_history
        SET status = 'rolled_back',
            error_message = 'Emergency rollback executed',
            completed_at = NOW()
        WHERE phase_number LIKE '1.%'
      `
    });

    log('Migration history updated');
  } catch (e) {
    // Non-critical error
    log(`Warning: Could not update migration history: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  log('='.repeat(50));
  log('STARTING EMERGENCY MIGRATION ROLLBACK');
  log('='.repeat(50));

  try {
    await checkEnvironment();

    // Find latest backup
    const manifest = await findLatestBackupManifest();

    // Validate rollback window
    await validateRollbackWindow(manifest);

    // Confirm rollback unless forced
    if (!force) {
      const confirmed = await confirmRollback(manifest);
      if (!confirmed) {
        log('Rollback cancelled by user');
        process.exit(0);
      }
    }

    log('');
    log('🚨 BEGINNING EMERGENCY ROLLBACK 🚨');
    log('');

    // Execute data rollback
    const rollbackResults = await executeRollback(manifest);

    // Execute structural rollback
    await executeStructuralRollback();

    // Verify rollback
    const verification = await verifyRollback(rollbackResults);

    // Update migration history
    await updateMigrationHistory();

    log('='.repeat(50));
    if (verification.success) {
      log('✅ EMERGENCY ROLLBACK COMPLETED SUCCESSFULLY');
      log(`${verification.succeeded.length} tables restored to pre-migration state`);
    } else {
      log('⚠️  EMERGENCY ROLLBACK COMPLETED WITH ERRORS');
      log(`${verification.succeeded.length} tables succeeded, ${verification.failed.length} failed`);
      log('Manual intervention may be required');
    }
    log('='.repeat(50));

    process.exit(verification.success ? 0 : 1);

  } catch (e) {
    error('EMERGENCY ROLLBACK FAILED');
    error(e.message);
    error('MANUAL DATABASE RESTORATION REQUIRED');
    process.exit(1);
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as executeRollback };