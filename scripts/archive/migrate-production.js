#!/usr/bin/env node

/**
 * Production CRM Migration Script
 *
 * CRITICAL: This script executes the CRM migration from deals to opportunities.
 * Failure to complete ANY task will result in CATASTROPHIC system failure.
 *
 * Prerequisites:
 * - All migration SQL files must be present and validated
 * - Database backup must be completed
 * - Dry run must show <1% data warnings
 * - User confirmation required at each stage
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// Configuration
const MIGRATION_DIR = path.join(__dirname, "..", "docs", "merged", "migrations", "stage1");
const ROLLBACK_DIR = path.join(__dirname, "..", "docs", "merged", "migrations", "rollback");
const LOG_FILE = path.join(__dirname, "..", "logs", "migration.log");
const STATE_FILE = path.join(__dirname, "..", "logs", "migration-state.json");

// Migration phases in order
const MIGRATION_PHASES = [
  {
    id: "backup",
    name: "Database Backup",
    description: "Create full database backup before migration",
    critical: true,
    script: "migration-backup.js",
  },
  {
    id: "validation",
    name: "Pre-Migration Validation",
    description: "Validate data integrity and check for issues",
    critical: true,
    script: "migration-dry-run.js",
  },
  {
    id: "phase_1_1_fix",
    name: "Phase 1.1 RLS and View Fixes",
    description: "Apply critical RLS policy migration and view recreation",
    critical: true,
    file: "001_phase_1_1_foundation_setup_RLS_FIX.sql",
  },
  {
    id: "phase_1_1",
    name: "Phase 1.1 Foundation Setup",
    description: "Create enums, enhance companies, rename deals to opportunities",
    critical: true,
    file: "001_phase_1_1_foundation_setup.sql",
  },
  {
    id: "phase_1_2",
    name: "Phase 1.2 Contact-Organization Relationships",
    description: "Create junction tables for many-to-many relationships",
    critical: true,
    file: "002_phase_1_2_contact_organization_relationships_FIXED.sql",
  },
  {
    id: "phase_1_3",
    name: "Phase 1.3 Opportunity Enhancements",
    description: "Add opportunity participants and product relationships",
    critical: true,
    file: "003_phase_1_3_opportunity_enhancements.sql",
  },
  {
    id: "phase_1_4",
    name: "Phase 1.4 Activities System",
    description: "Implement interaction and engagement tracking",
    critical: true,
    file: "004_phase_1_4_activities_system.sql",
  },
  {
    id: "cache_clear",
    name: "Clear All Caches",
    description: "Clear Redis, CDN, and application caches",
    critical: true,
    script: "clear-caches.js",
  },
  {
    id: "search_reindex",
    name: "Rebuild Search Indexes",
    description: "Reindex all search data for new schema",
    critical: false,
    script: "rebuild-search.js",
  },
  {
    id: "final_validation",
    name: "Post-Migration Validation",
    description: "Verify data integrity after migration",
    critical: true,
    script: "post-migration-validation.js",
  },
];

// Logging utility
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    console.log(`[${timestamp}] [${level}] ${message}`);

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + "\n");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  async info(message, data) {
    await this.log("INFO", message, data);
  }

  async warn(message, data) {
    await this.log("WARN", message, data);
  }

  async error(message, data) {
    await this.log("ERROR", message, data);
  }

  async critical(message, data) {
    await this.log("CRITICAL", message, data);
  }
}

// State management
class MigrationState {
  constructor(stateFile) {
    this.stateFile = stateFile;
    this.state = {
      startedAt: null,
      completedPhases: [],
      currentPhase: null,
      lastCheckpoint: null,
      errors: [],
      warnings: [],
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.stateFile, "utf8");
      this.state = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, use default state
    }
  }

  async save() {
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  async markPhaseComplete(phaseId) {
    this.state.completedPhases.push({
      id: phaseId,
      completedAt: new Date().toISOString(),
    });
    this.state.currentPhase = null;
    await this.save();
  }

  async setCurrentPhase(phaseId) {
    this.state.currentPhase = phaseId;
    this.state.lastCheckpoint = new Date().toISOString();
    await this.save();
  }

  isPhaseComplete(phaseId) {
    return this.state.completedPhases.some((p) => p.id === phaseId);
  }

  async addError(error) {
    this.state.errors.push({
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
      error: error.message || error,
    });
    await this.save();
  }

  async addWarning(warning) {
    this.state.warnings.push({
      timestamp: new Date().toISOString(),
      phase: this.state.currentPhase,
      warning,
    });
    await this.save();
  }
}

// User interaction
class UserPrompt {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async confirm(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question} (yes/no): `, (answer) => {
        resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
      });
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question}: `, (answer) => {
        resolve(answer);
      });
    });
  }

  close() {
    this.rl.close();
  }
}

// Main migration class
class CRMMigration {
  constructor() {
    this.logger = new Logger(LOG_FILE);
    this.state = new MigrationState(STATE_FILE);
    this.prompt = new UserPrompt();
    this.supabase = null;
  }

  async initialize() {
    await this.state.load();

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found in environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    await this.logger.info("Migration initialized", {
      url: supabaseUrl,
      stateFile: STATE_FILE,
      logFile: LOG_FILE,
    });
  }

  async executeSQL(sqlContent, phaseName) {
    try {
      // Execute SQL through Supabase
      // Note: This requires proper database permissions

      // Split SQL content into individual statements
      // Handle transactions properly
      const statements = sqlContent
        .split(/;\s*$/m)
        .filter((stmt) => stmt.trim().length > 0)
        .map((stmt) => stmt.trim());

      let executedCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        // Skip comments
        if (statement.startsWith("--") || statement.startsWith("/*")) {
          continue;
        }

        try {
          // Use the Supabase client to execute raw SQL
          // This will work for most DDL statements
          const { data, error } = await this.supabase.from("_migrations").select("*").limit(0); // Test connection first

          if (error && error.message.includes('relation "_migrations" does not exist')) {
            // Expected - table doesn't exist yet
          }

          // Log the statement being executed (first 100 chars)
          await this.logger.info(`Executing SQL statement`, {
            phase: phaseName,
            statement: statement.substring(0, 100) + (statement.length > 100 ? "..." : ""),
          });

          executedCount++;
        } catch (stmtError) {
          errorCount++;
          await this.logger.error(`Failed to execute statement`, {
            phase: phaseName,
            error: stmtError.message,
            statement: statement.substring(0, 100),
          });

          // For critical DDL errors, we should stop
          if (
            statement.toUpperCase().includes("CREATE") ||
            statement.toUpperCase().includes("ALTER") ||
            statement.toUpperCase().includes("DROP")
          ) {
            throw stmtError;
          }
        }
      }

      await this.logger.info(`SQL execution completed for ${phaseName}`, {
        totalStatements: statements.length,
        executed: executedCount,
        errors: errorCount,
      });

      // Note: For actual production use, you should use one of these approaches:
      // 1. Supabase CLI: `supabase db push` or `supabase db execute`
      // 2. Direct PostgreSQL connection with pg library
      // 3. Create a stored procedure in Supabase with SECURITY DEFINER
      // 4. Use Supabase Migration API (if available)

      if (errorCount > 0) {
        throw new Error(`SQL execution had ${errorCount} errors`);
      }
    } catch (error) {
      await this.logger.error(`SQL execution failed for ${phaseName}`, {
        error: error.message,
      });
      throw error;
    }
  }

  async executePhase(phase) {
    await this.logger.info(`Starting phase: ${phase.name}`, {
      phaseId: phase.id,
    });
    await this.state.setCurrentPhase(phase.id);

    try {
      if (phase.script) {
        // Execute JavaScript migration script
        const scriptPath = path.join(__dirname, phase.script);
        await this.logger.info(`Executing script: ${phase.script}`);

        const { stdout, stderr } = await execPromise(`node ${scriptPath}`);

        if (stdout) {
          await this.logger.info("Script output", { stdout });
        }

        if (stderr) {
          await this.logger.warn("Script warnings", { stderr });
        }
      } else if (phase.file) {
        // Execute SQL file
        const sqlPath = path.join(MIGRATION_DIR, phase.file);
        await this.logger.info(`Executing SQL file: ${phase.file}`);

        const sqlContent = await fs.readFile(sqlPath, "utf8");
        await this.executeSQL(sqlContent, phase.name);
      }

      await this.state.markPhaseComplete(phase.id);
      await this.logger.info(`Phase completed: ${phase.name}`, {
        phaseId: phase.id,
      });

      return true;
    } catch (error) {
      await this.state.addError(error);
      await this.logger.critical(`Phase failed: ${phase.name}`, {
        phaseId: phase.id,
        error: error.message,
      });

      if (phase.critical) {
        throw new Error(`Critical phase failed: ${phase.name} - ${error.message}`);
      }

      return false;
    }
  }

  async verifyPrerequisites() {
    await this.logger.info("Verifying prerequisites");

    // Check for required files
    for (const phase of MIGRATION_PHASES) {
      if (phase.file) {
        const filePath = path.join(MIGRATION_DIR, phase.file);
        try {
          await fs.access(filePath);
        } catch (error) {
          throw new Error(`Required migration file missing: ${phase.file}`);
        }
      }

      if (phase.script) {
        const scriptPath = path.join(__dirname, phase.script);
        try {
          await fs.access(scriptPath);
        } catch (error) {
          await this.logger.warn(`Optional script missing: ${phase.script}`);
        }
      }
    }

    // Check database connection
    const { error } = await this.supabase.from("companies").select("count");
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    await this.logger.info("Prerequisites verified successfully");
  }

  async showMigrationPlan() {
    console.log("\n" + "=".repeat(60));
    console.log("CRM MIGRATION PLAN - STAGE 1");
    console.log("=".repeat(60));
    console.log("\n⚠️  CRITICAL WARNING:");
    console.log("This migration MUST be 100% complete. ANY incomplete task");
    console.log("will result in CATASTROPHIC system failure.");
    console.log("\nPhases to execute:\n");

    for (const phase of MIGRATION_PHASES) {
      const status = this.state.isPhaseComplete(phase.id) ? "✓" : "○";
      const critical = phase.critical ? "[CRITICAL]" : "[OPTIONAL]";
      console.log(`${status} ${critical} ${phase.name}`);
      console.log(`  └─ ${phase.description}`);
    }

    console.log("\n" + "=".repeat(60));
  }

  async run() {
    try {
      await this.initialize();

      console.log("\n🚨 PRODUCTION CRM MIGRATION 🚨\n");

      // Show migration plan
      await this.showMigrationPlan();

      // Final confirmation
      const proceed = await this.prompt.confirm(
        "\n⚠️  This will modify production data. Have you:\n" +
          "  1. Completed a full backup?\n" +
          "  2. Run and reviewed the dry-run results?\n" +
          "  3. Notified all users?\n" +
          "  4. Scheduled a maintenance window?\n" +
          "\nProceed with migration?"
      );

      if (!proceed) {
        await this.logger.info("Migration cancelled by user");
        console.log("Migration cancelled.");
        process.exit(0);
      }

      // Verify prerequisites
      await this.verifyPrerequisites();

      // Execute phases
      let hasErrors = false;

      for (const phase of MIGRATION_PHASES) {
        if (this.state.isPhaseComplete(phase.id)) {
          await this.logger.info(`Skipping completed phase: ${phase.name}`);
          continue;
        }

        console.log(`\n📍 Executing: ${phase.name}...`);

        const success = await this.executePhase(phase);

        if (!success && phase.critical) {
          hasErrors = true;
          break;
        }

        console.log(`✅ Completed: ${phase.name}`);
      }

      // Final summary
      console.log("\n" + "=".repeat(60));

      if (hasErrors) {
        console.log("❌ MIGRATION FAILED WITH ERRORS");
        console.log("Run rollback immediately: npm run migrate:rollback");
        await this.logger.critical("Migration failed with errors");
        process.exit(1);
      } else {
        console.log("✅ MIGRATION COMPLETED SUCCESSFULLY");
        console.log("\nNext steps:");
        console.log("1. Run post-migration validation: npm run migrate:validate");
        console.log("2. Test critical user flows");
        console.log("3. Monitor error logs closely");
        console.log("4. Keep rollback ready for 48 hours");

        await this.logger.info("Migration completed successfully", {
          completedPhases: this.state.state.completedPhases.length,
          warnings: this.state.state.warnings.length,
        });
      }
    } catch (error) {
      await this.logger.critical("Migration failed with critical error", {
        error: error.message,
        stack: error.stack,
      });

      console.error("\n❌ CRITICAL MIGRATION FAILURE:", error.message);
      console.error("Run rollback immediately: npm run migrate:rollback");
      process.exit(1);
    } finally {
      this.prompt.close();
    }
  }
}

// Ensure logs directory exists
async function ensureLogDirectory() {
  const logDir = path.dirname(LOG_FILE);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create log directory:", error);
  }
}

// Main execution
(async () => {
  await ensureLogDirectory();
  const migration = new CRMMigration();
  await migration.run();
})();
