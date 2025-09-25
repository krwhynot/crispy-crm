#!/usr/bin/env node

/**
 * MCP Migration Creation Tool
 *
 * Creates new migration files with proper sequential numbering and templates.
 * Integrates with existing migration patterns while supporting MCP workflow.
 *
 * Features:
 * - Maintains sequential numbering from 108 onwards
 * - Provides migration templates for common operations
 * - Validates migration file naming conventions
 * - Generates rollback functions automatically
 * - Creates comprehensive migration metadata
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MIGRATION_DIR = join(__dirname, '..', 'supabase', 'migrations');
const TEMPLATES_DIR = join(__dirname, '..', '.docs', 'migration-templates');

class MCPMigrationCreator {
  constructor() {
    this.nextNumber = 108; // Start from 108 as specified
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    // Determine the next migration number
    this.nextNumber = await this.getNextMigrationNumber();
  }

  async getNextMigrationNumber() {
    try {
      const files = await readdir(MIGRATION_DIR);

      // Find the highest numbered migration
      const numberedMigrations = files
        .filter(f => f.endsWith('.sql'))
        .filter(f => /^\d+_.+\.sql$/.test(f))
        .map(f => parseInt(f.split('_')[0]))
        .filter(n => !isNaN(n));

      if (numberedMigrations.length === 0) {
        return 108; // Start from 108 as specified
      }

      const highestNumber = Math.max(...numberedMigrations);
      return highestNumber + 1;
    } catch (error) {
      console.warn(`Warning: Could not scan migration directory: ${error.message}`);
      return 108;
    }
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  sanitizeFileName(input) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  generateMigrationTemplate(type, description, options = {}) {
    const timestamp = new Date().toISOString();
    const rollbackFunctionName = `rollback_migration_${this.nextNumber}`;

    const templates = {
      table: `-- Migration: Create ${options.tableName || 'New'} Table
-- Description: ${description}
-- Date: ${timestamp.split('T')[0]}
-- Migration Number: ${this.nextNumber}

-- ============================================================================
-- CREATE TABLE: ${options.tableName || 'new_table'}
-- ============================================================================

CREATE TABLE IF NOT EXISTS ${options.tableName || 'new_table'} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Add your columns here
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_${options.tableName || 'new_table'}_name ON ${options.tableName || 'new_table'}(name);
CREATE INDEX IF NOT EXISTS idx_${options.tableName || 'new_table'}_created_at ON ${options.tableName || 'new_table'}(created_at);
CREATE INDEX IF NOT EXISTS idx_${options.tableName || 'new_table'}_deleted_at ON ${options.tableName || 'new_table'}(deleted_at) WHERE deleted_at IS NULL;

-- Add RLS policies
ALTER TABLE ${options.tableName || 'new_table'} ENABLE ROW LEVEL SECURITY;

-- Basic CRUD policies (adjust as needed)
CREATE POLICY "${options.tableName || 'new_table'}_select_policy" ON ${options.tableName || 'new_table'}
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "${options.tableName || 'new_table'}_insert_policy" ON ${options.tableName || 'new_table'}
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "${options.tableName || 'new_table'}_update_policy" ON ${options.tableName || 'new_table'}
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "${options.tableName || 'new_table'}_delete_policy" ON ${options.tableName || 'new_table'}
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add comments
COMMENT ON TABLE ${options.tableName || 'new_table'} IS '${description}';

-- ============================================================================
-- ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION ${rollbackFunctionName}()
RETURNS void AS $$
BEGIN
  -- Drop the table and all associated objects
  DROP TABLE IF EXISTS ${options.tableName || 'new_table'} CASCADE;

  -- Log the rollback
  RAISE NOTICE 'Migration ${this.nextNumber} rolled back: ${options.tableName || 'new_table'} table dropped';
END;
$$ LANGUAGE plpgsql;

-- To rollback this migration, run: SELECT ${rollbackFunctionName}();`,

      column: `-- Migration: Add Column to ${options.tableName || 'Existing'} Table
-- Description: ${description}
-- Date: ${timestamp.split('T')[0]}
-- Migration Number: ${this.nextNumber}

-- ============================================================================
-- ADD COLUMN: ${options.columnName || 'new_column'} TO ${options.tableName || 'existing_table'}
-- ============================================================================

-- Add the new column
ALTER TABLE ${options.tableName || 'existing_table'}
ADD COLUMN IF NOT EXISTS ${options.columnName || 'new_column'} ${options.columnType || 'VARCHAR(255)'} ${options.columnConstraints || 'DEFAULT NULL'};

-- Add index if needed
${options.addIndex ? `CREATE INDEX IF NOT EXISTS idx_${options.tableName || 'existing_table'}_${options.columnName || 'new_column'}
ON ${options.tableName || 'existing_table'}(${options.columnName || 'new_column'});` : '-- No index specified'}

-- Update existing records if needed
${options.updateExisting ? `-- UPDATE ${options.tableName || 'existing_table'} SET ${options.columnName || 'new_column'} = 'default_value' WHERE ${options.columnName || 'new_column'} IS NULL;` : '-- No default update specified'}

-- Add comment
COMMENT ON COLUMN ${options.tableName || 'existing_table'}.${options.columnName || 'new_column'} IS '${description}';

-- ============================================================================
-- ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION ${rollbackFunctionName}()
RETURNS void AS $$
BEGIN
  -- Remove the column
  ALTER TABLE ${options.tableName || 'existing_table'} DROP COLUMN IF EXISTS ${options.columnName || 'new_column'};

  -- Log the rollback
  RAISE NOTICE 'Migration ${this.nextNumber} rolled back: ${options.columnName || 'new_column'} column removed from ${options.tableName || 'existing_table'}';
END;
$$ LANGUAGE plpgsql;

-- To rollback this migration, run: SELECT ${rollbackFunctionName}();`,

      data: `-- Migration: Data Update
-- Description: ${description}
-- Date: ${timestamp.split('T')[0]}
-- Migration Number: ${this.nextNumber}

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Create backup table for rollback
CREATE TABLE IF NOT EXISTS ${options.tableName || 'target_table'}_backup_${this.nextNumber} AS
SELECT * FROM ${options.tableName || 'target_table'} WHERE false; -- Structure only initially

-- Backup affected records
INSERT INTO ${options.tableName || 'target_table'}_backup_${this.nextNumber}
SELECT * FROM ${options.tableName || 'target_table'}
WHERE ${options.backupCondition || 'true'}; -- Adjust condition as needed

-- Perform the data update
-- TODO: Add your data modification SQL here
-- Example:
-- UPDATE ${options.tableName || 'target_table'}
-- SET column_name = 'new_value'
-- WHERE condition;

-- Verify the changes
-- TODO: Add verification queries
-- SELECT COUNT(*) as affected_rows FROM ${options.tableName || 'target_table'} WHERE modified_condition;

-- ============================================================================
-- ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION ${rollbackFunctionName}()
RETURNS void AS $$
DECLARE
  backup_count INTEGER;
  restore_count INTEGER;
BEGIN
  -- Check if backup table exists
  SELECT COUNT(*) INTO backup_count
  FROM ${options.tableName || 'target_table'}_backup_${this.nextNumber};

  IF backup_count > 0 THEN
    -- Restore from backup
    TRUNCATE ${options.tableName || 'target_table'};

    INSERT INTO ${options.tableName || 'target_table'}
    SELECT * FROM ${options.tableName || 'target_table'}_backup_${this.nextNumber};

    GET DIAGNOSTICS restore_count = ROW_COUNT;

    RAISE NOTICE 'Migration ${this.nextNumber} rolled back: % records restored to ${options.tableName || 'target_table'}', restore_count;
  ELSE
    RAISE WARNING 'No backup data found for migration ${this.nextNumber} rollback';
  END IF;

  -- Drop backup table
  DROP TABLE IF EXISTS ${options.tableName || 'target_table'}_backup_${this.nextNumber};
END;
$$ LANGUAGE plpgsql;

-- To rollback this migration, run: SELECT ${rollbackFunctionName}();`,

      index: `-- Migration: Create Index
-- Description: ${description}
-- Date: ${timestamp.split('T')[0]}
-- Migration Number: ${this.nextNumber}

-- ============================================================================
-- CREATE INDEX
-- ============================================================================

-- Create the index
CREATE INDEX ${options.concurrent ? 'CONCURRENTLY ' : ''}IF NOT EXISTS ${options.indexName || `idx_${options.tableName}_${options.columnName}`}
ON ${options.tableName || 'target_table'} ${options.indexType ? `USING ${options.indexType}` : ''}(${options.columns || 'column_name'});

-- Add comment
COMMENT ON INDEX ${options.indexName || `idx_${options.tableName}_${options.columnName}`} IS '${description}';

-- ============================================================================
-- ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION ${rollbackFunctionName}()
RETURNS void AS $$
BEGIN
  -- Drop the index
  DROP INDEX IF EXISTS ${options.indexName || `idx_${options.tableName}_${options.columnName}`};

  -- Log the rollback
  RAISE NOTICE 'Migration ${this.nextNumber} rolled back: Index ${options.indexName || `idx_${options.tableName}_${options.columnName}`} dropped';
END;
$$ LANGUAGE plpgsql;

-- To rollback this migration, run: SELECT ${rollbackFunctionName}();`,

      generic: `-- Migration: ${description}
-- Description: ${description}
-- Date: ${timestamp.split('T')[0]}
-- Migration Number: ${this.nextNumber}

-- ============================================================================
-- MIGRATION CONTENT
-- ============================================================================

-- TODO: Add your migration SQL here

-- Example structure:
-- 1. CREATE/ALTER statements
-- 2. Data modifications
-- 3. Index creation
-- 4. Comments and documentation

-- ============================================================================
-- ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION ${rollbackFunctionName}()
RETURNS void AS $$
BEGIN
  -- TODO: Add rollback logic here
  -- This should reverse all changes made in this migration

  RAISE NOTICE 'Migration ${this.nextNumber} rolled back';
END;
$$ LANGUAGE plpgsql;

-- To rollback this migration, run: SELECT ${rollbackFunctionName}();`
    };

    return templates[type] || templates.generic;
  }

  async collectMigrationDetails(type) {
    const details = { type };

    switch (type) {
      case 'table':
        details.tableName = await this.prompt('Table name: ');
        details.tableName = this.sanitizeFileName(details.tableName);
        break;

      case 'column':
        details.tableName = await this.prompt('Target table name: ');
        details.columnName = await this.prompt('Column name: ');
        details.columnType = await this.prompt('Column type (e.g., VARCHAR(255), INTEGER): ');
        details.columnConstraints = await this.prompt('Column constraints (optional, press Enter to skip): ') || 'DEFAULT NULL';
        details.addIndex = (await this.prompt('Add index for this column? (y/n): ')).toLowerCase() === 'y';
        details.updateExisting = (await this.prompt('Update existing records? (y/n): ')).toLowerCase() === 'y';
        break;

      case 'data':
        details.tableName = await this.prompt('Target table name: ');
        details.backupCondition = await this.prompt('Backup condition (SQL WHERE clause, or "true" for all): ') || 'true';
        break;

      case 'index':
        details.tableName = await this.prompt('Target table name: ');
        details.columnName = await this.prompt('Column name(s) for index: ');
        details.indexType = await this.prompt('Index type (btree, gin, gist, etc., press Enter for default): ') || '';
        details.concurrent = (await this.prompt('Create index concurrently? (y/n): ')).toLowerCase() === 'y';
        details.indexName = await this.prompt('Index name (press Enter for auto-generated): ') || null;
        details.columns = details.columnName;
        break;
    }

    return details;
  }

  async createMigration(description, type = 'generic', options = {}) {
    try {
      // Ensure migration directory exists
      if (!existsSync(MIGRATION_DIR)) {
        mkdirSync(MIGRATION_DIR, { recursive: true });
      }

      // Generate filename
      const sanitizedDescription = this.sanitizeFileName(description);
      const filename = `${this.nextNumber.toString().padStart(3, '0')}_${sanitizedDescription}.sql`;
      const filepath = join(MIGRATION_DIR, filename);

      // Check if file already exists
      if (existsSync(filepath)) {
        throw new Error(`Migration file already exists: ${filename}`);
      }

      // Collect additional details if needed
      let migrationOptions = { ...options };
      if (type !== 'generic' && Object.keys(options).length === 0) {
        migrationOptions = await this.collectMigrationDetails(type);
      }

      // Generate migration content
      const content = this.generateMigrationTemplate(type, description, migrationOptions);

      // Write the migration file
      writeFileSync(filepath, content);

      console.log('✅ Migration created successfully!');
      console.log(`   File: ${filename}`);
      console.log(`   Path: ${filepath}`);
      console.log(`   Number: ${this.nextNumber}`);
      console.log();
      console.log('📋 Next steps:');
      console.log('   1. Edit the migration file to add your specific changes');
      console.log('   2. Test with dry run: npm run migrate:dry-run');
      console.log('   3. Apply migration: npm run migrate:execute');
      console.log();
      console.log('💡 Tips:');
      console.log('   • Always include rollback functions');
      console.log('   • Use IF NOT EXISTS for idempotency');
      console.log('   • Add appropriate comments and documentation');
      console.log('   • Test thoroughly before applying to production');

      return {
        filename,
        filepath,
        number: this.nextNumber,
        description,
        type
      };

    } catch (error) {
      console.error(`❌ Failed to create migration: ${error.message}`);
      throw error;
    } finally {
      this.rl.close();
    }
  }

  async listAvailableTemplates() {
    const templates = {
      table: 'Create a new table with standard audit fields and RLS policies',
      column: 'Add a column to an existing table with proper indexing',
      data: 'Perform data migrations with backup and rollback capability',
      index: 'Create database indexes with proper naming conventions',
      generic: 'Generic migration template for custom operations'
    };

    console.log('📝 Available Migration Templates:\n');
    Object.entries(templates).forEach(([type, description]) => {
      console.log(`   ${type.padEnd(8)} - ${description}`);
    });
    console.log();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
MCP Migration Creation Tool

USAGE:
  node scripts/mcp-migrate-create.js <description> [options]

ARGUMENTS:
  description           Brief description of the migration (required)

OPTIONS:
  --type <type>        Migration type (table, column, data, index, generic)
  --table <name>       Target table name (for column, data, index types)
  --dry-run           Show what would be created without creating files
  --list-templates    Show available migration templates
  --help, -h          Show this help message

EXAMPLES:
  # Create a generic migration
  node scripts/mcp-migrate-create.js "Add user preferences table"

  # Create a table migration
  node scripts/mcp-migrate-create.js "Create user settings table" --type table

  # Create a column migration
  node scripts/mcp-migrate-create.js "Add email verification field" --type column

  # Create a data migration
  node scripts/mcp-migrate-create.js "Migrate legacy user data" --type data

  # Create an index migration
  node scripts/mcp-migrate-create.js "Add performance index on email" --type index

  # List available templates
  node scripts/mcp-migrate-create.js --list-templates

MIGRATION TYPES:
  table     - Creates a new table with audit fields and RLS policies
  column    - Adds a column to an existing table with indexing options
  data      - Performs data migrations with backup and rollback safety
  index     - Creates database indexes with proper naming conventions
  generic   - Basic template for custom migration operations
    `);
    process.exit(0);
  }

  if (args.includes('--list-templates')) {
    const creator = new MCPMigrationCreator();
    await creator.listAvailableTemplates();
    process.exit(0);
  }

  const description = args[0];
  if (!description) {
    console.error('❌ Description is required');
    console.error('   Use --help for usage information');
    process.exit(1);
  }

  const typeIndex = args.indexOf('--type');
  const type = typeIndex !== -1 && args[typeIndex + 1] ? args[typeIndex + 1] : 'generic';

  const dryRun = args.includes('--dry-run');

  const validTypes = ['table', 'column', 'data', 'index', 'generic'];
  if (!validTypes.includes(type)) {
    console.error(`❌ Invalid migration type: ${type}`);
    console.error(`   Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  try {
    const creator = new MCPMigrationCreator();
    await creator.initialize();

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be created');
      console.log();
      const nextNumber = await creator.getNextMigrationNumber();
      const sanitizedDescription = creator.sanitizeFileName(description);
      const filename = `${nextNumber.toString().padStart(3, '0')}_${sanitizedDescription}.sql`;

      console.log('📄 Would create migration:');
      console.log(`   File: ${filename}`);
      console.log(`   Number: ${nextNumber}`);
      console.log(`   Type: ${type}`);
      console.log(`   Description: ${description}`);
      console.log();
    } else {
      const result = await creator.createMigration(description, type);
      process.exit(0);
    }

  } catch (error) {
    console.error(`❌ Migration creation failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MCPMigrationCreator;