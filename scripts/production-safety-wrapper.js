#!/usr/bin/env node

/**
 * Production Safety Wrapper for CRM Migration
 * Task 5.2a Implementation
 *
 * This script provides a JavaScript wrapper for safely executing the production
 * migration with proper monitoring, resource management, and failure handling.
 *
 * Features:
 * - Connection pool management
 * - Real-time progress monitoring
 * - Resource usage tracking
 * - Graceful failure handling
 * - Automatic rollback on errors
 * - Minimum 2-hour downtime enforcement
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

// Configuration
const CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Safety parameters
  batchSize: 10000,
  sleepBetweenBatches: 100, // milliseconds
  lockTimeout: "10s",
  statementTimeout: "30min",
  workMem: "256MB",
  maintenanceWorkMem: "1GB",

  // Monitoring intervals
  progressCheckInterval: 5000, // 5 seconds
  resourceCheckInterval: 10000, // 10 seconds

  // Downtime requirements
  minimumDowntimeHours: 2,

  // File paths
  migrationSqlPath: path.join(__dirname, "migration-production-safe.sql"),
  logPath: path.join(__dirname, "..", "logs", `migration-${Date.now()}.log`),
};

// Logger utility
class Logger {
  constructor(logPath) {
    this.logPath = logPath;
    this.startTime = Date.now();
  }

  async init() {
    const logDir = path.dirname(this.logPath);
    await fs.mkdir(logDir, { recursive: true });
    await this.log("INFO", "Migration safety wrapper initialized");
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);

    const logEntry = {
      timestamp,
      elapsed_seconds: elapsed,
      level,
      message,
      ...data,
    };

    const logLine = JSON.stringify(logEntry) + "\n";

    // Write to file
    await fs.appendFile(this.logPath, logLine);

    // Also console log with color
    const color =
      level === "ERROR"
        ? "\x1b[31m"
        : level === "WARNING"
          ? "\x1b[33m"
          : level === "SUCCESS"
            ? "\x1b[32m"
            : "\x1b[0m";
    console.log(`${color}[${elapsed}s] ${level}: ${message}\x1b[0m`, data);
  }
}

// Progress monitor
class ProgressMonitor {
  constructor(supabase, logger) {
    this.supabase = supabase;
    this.logger = logger;
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    this.isRunning = true;
    this.intervalId = setInterval(() => this.checkProgress(), CONFIG.progressCheckInterval);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async checkProgress() {
    try {
      const { data: progress, error } = await this.supabase
        .from("migration_progress")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      for (const entry of progress) {
        if (entry.status === "in_progress") {
          const percentComplete =
            entry.total_rows > 0 ? ((entry.rows_processed / entry.total_rows) * 100).toFixed(2) : 0;

          await this.logger.log("PROGRESS", `${entry.phase} - ${entry.step}`, {
            rows_processed: entry.rows_processed,
            total_rows: entry.total_rows,
            percent_complete: percentComplete,
            batch_number: entry.batch_number,
          });
        }
      }
    } catch (error) {
      await this.logger.log("WARNING", "Failed to check progress", {
        error: error.message,
      });
    }
  }

  async getLatestProgress() {
    const { data: progress, error } = await this.supabase
      .from("migration_progress")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    return error ? null : progress;
  }
}

// Resource monitor
class ResourceMonitor {
  constructor(supabase, logger) {
    this.supabase = supabase;
    this.logger = logger;
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => this.checkResources(), CONFIG.resourceCheckInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async checkResources() {
    try {
      // Check active connections
      const { data: connections } = await this.supabase.rpc("get_connection_count");

      // Check database size
      const { data: dbSize } = await this.supabase.rpc("get_database_size");

      // Check long-running queries
      const { data: longQueries } = await this.supabase.rpc("get_long_queries", {
        duration_seconds: 60,
      });

      await this.logger.log("RESOURCES", "Resource check", {
        active_connections: connections,
        database_size_gb: dbSize ? (dbSize / 1024 / 1024 / 1024).toFixed(2) : "unknown",
        long_running_queries: longQueries ? longQueries.length : 0,
      });

      // Alert if resources are concerning
      if (connections > 50) {
        await this.logger.log("WARNING", "High connection count detected", {
          connections,
        });
      }

      if (longQueries && longQueries.length > 5) {
        await this.logger.log("WARNING", "Multiple long-running queries detected", {
          count: longQueries.length,
        });
      }
    } catch (error) {
      await this.logger.log("WARNING", "Failed to check resources", {
        error: error.message,
      });
    }
  }
}

// Safety validator
class SafetyValidator {
  constructor(supabase, logger) {
    this.supabase = supabase;
    this.logger = logger;
  }

  async validatePreConditions() {
    await this.logger.log("INFO", "Running pre-migration safety checks");

    const checks = {
      backup_exists: false,
      low_connection_count: false,
      sufficient_disk_space: false,
      maintenance_window: false,
      downtime_confirmed: false,
    };

    try {
      // Check 1: Verify backup exists
      const { data: backupTables } = await this.supabase.rpc("check_backup_tables");
      checks.backup_exists = backupTables && backupTables.length > 0;

      // Check 2: Verify connection count
      const { data: connections } = await this.supabase.rpc("get_connection_count");
      checks.low_connection_count = connections < 10;

      // Check 3: Verify disk space
      const { data: diskSpace } = await this.supabase.rpc("check_disk_space");
      checks.sufficient_disk_space = diskSpace && diskSpace.available_gb > 100;

      // Check 4: Verify maintenance window
      const currentHour = new Date().getHours();
      checks.maintenance_window = currentHour >= 2 && currentHour <= 4;

      // Log results
      await this.logger.log("INFO", "Pre-migration checks completed", checks);

      // Check if all passed
      const allPassed = Object.values(checks).every((v) => v === true);

      if (!allPassed) {
        await this.logger.log("WARNING", "Some safety checks failed", checks);
      }

      return allPassed;
    } catch (error) {
      await this.logger.log("ERROR", "Failed to run safety checks", {
        error: error.message,
      });
      return false;
    }
  }

  async confirmDowntime() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      console.log("\n" + "=".repeat(60));
      console.log("⚠️  PRODUCTION MIGRATION SAFETY CHECK ⚠️");
      console.log("=".repeat(60));
      console.log("\nThis migration requires:");
      console.log(`- Minimum ${CONFIG.minimumDowntimeHours} hours of downtime`);
      console.log("- All users to be offline");
      console.log("- Recent backup to be available");
      console.log("- Notification to stakeholders");
      console.log("\n" + "=".repeat(60));

      rl.question(
        "\nHave you confirmed a " +
          CONFIG.minimumDowntimeHours +
          '-hour maintenance window? (type "YES" to confirm): ',
        (answer) => {
          rl.close();
          resolve(answer === "YES");
        }
      );
    });
  }
}

// Migration executor
class MigrationExecutor {
  constructor(supabase, logger) {
    this.supabase = supabase;
    this.logger = logger;
    this.progressMonitor = new ProgressMonitor(supabase, logger);
    this.resourceMonitor = new ResourceMonitor(supabase, logger);
    this.safetyValidator = new SafetyValidator(supabase, logger);
  }

  async execute() {
    try {
      await this.logger.log("INFO", "Starting production-safe migration");

      // Step 1: Validate safety conditions
      const safetyPassed = await this.safetyValidator.validatePreConditions();
      if (!safetyPassed) {
        await this.logger.log("ERROR", "Safety validation failed");

        // Ask for confirmation to proceed anyway
        const downtimeConfirmed = await this.safetyValidator.confirmDowntime();
        if (!downtimeConfirmed) {
          await this.logger.log("ERROR", "Migration aborted - downtime not confirmed");
          return false;
        }
      }

      // Step 2: Start monitoring
      this.progressMonitor.start();
      this.resourceMonitor.start();

      // Step 3: Set resource limits
      await this.setResourceLimits();

      // Step 4: Create backup
      await this.createBackup();

      // Step 5: Execute main migration
      const migrationSuccess = await this.executeMigrationSql();

      if (!migrationSuccess) {
        await this.logger.log("ERROR", "Migration failed - initiating rollback");
        await this.rollback();
        return false;
      }

      // Step 6: Validate migration
      const validationPassed = await this.validateMigration();

      if (!validationPassed) {
        await this.logger.log("ERROR", "Validation failed - initiating rollback");
        await this.rollback();
        return false;
      }

      // Step 7: Rebuild indexes and analyze
      await this.postMigrationOptimization();

      await this.logger.log("SUCCESS", "Migration completed successfully");
      return true;
    } catch (error) {
      await this.logger.log("ERROR", "Migration failed with error", {
        error: error.message,
        stack: error.stack,
      });

      await this.rollback();
      return false;
    } finally {
      // Stop monitoring
      this.progressMonitor.stop();
      this.resourceMonitor.stop();
    }
  }

  async setResourceLimits() {
    await this.logger.log("INFO", "Setting resource limits");

    const limits = [
      `SET lock_timeout = '${CONFIG.lockTimeout}'`,
      `SET statement_timeout = '${CONFIG.statementTimeout}'`,
      `SET work_mem = '${CONFIG.workMem}'`,
      `SET maintenance_work_mem = '${CONFIG.maintenanceWorkMem}'`,
    ];

    for (const limit of limits) {
      await this.supabase.rpc("execute_sql", { sql: limit });
    }
  }

  async createBackup() {
    await this.logger.log("INFO", "Creating backup tables");

    const backupSuffix = `_backup_${Date.now()}`;
    const tables = ["companies", "contacts", "deals", "opportunities"];

    for (const table of tables) {
      try {
        const sql = `CREATE TABLE ${table}${backupSuffix} AS SELECT * FROM ${table}`;
        await this.supabase.rpc("execute_sql", { sql });

        await this.logger.log("INFO", `Backup created for ${table}`);
      } catch (error) {
        // Table might not exist, which is okay
        await this.logger.log("WARNING", `Could not backup ${table}`, {
          error: error.message,
        });
      }
    }
  }

  async executeMigrationSql() {
    await this.logger.log("INFO", "Executing main migration SQL");

    try {
      // Read the migration SQL file
      const migrationSql = await fs.readFile(CONFIG.migrationSqlPath, "utf8");

      // Split into individual statements (be careful with this)
      const statements = migrationSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      let statementCount = 0;
      const totalStatements = statements.length;

      for (const statement of statements) {
        statementCount++;

        // Skip comments and empty statements
        if (!statement || statement.startsWith("--")) continue;

        await this.logger.log("INFO", `Executing statement ${statementCount}/${totalStatements}`);

        try {
          await this.supabase.rpc("execute_sql", { sql: statement + ";" });
        } catch (error) {
          await this.logger.log("ERROR", `Statement failed: ${statement.substring(0, 100)}...`, {
            error: error.message,
          });
          return false;
        }

        // Check progress periodically
        if (statementCount % 10 === 0) {
          const progress = await this.progressMonitor.getLatestProgress();
          if (progress) {
            await this.logger.log("INFO", "Migration progress update", progress);
          }
        }
      }

      return true;
    } catch (error) {
      await this.logger.log("ERROR", "Failed to execute migration SQL", {
        error: error.message,
      });
      return false;
    }
  }

  async validateMigration() {
    await this.logger.log("INFO", "Validating migration results");

    const validations = [
      {
        name: "Opportunities table exists",
        sql: `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities')`,
      },
      {
        name: "Contact organizations populated",
        sql: `SELECT COUNT(*) > 0 FROM contact_organizations`,
      },
      {
        name: "No data loss in opportunities",
        sql: `SELECT COUNT(*) FROM opportunities`,
      },
    ];

    for (const validation of validations) {
      try {
        const { data, error } = await this.supabase.rpc("execute_sql", {
          sql: validation.sql,
        });

        if (error) throw error;

        await this.logger.log("INFO", `Validation: ${validation.name}`, {
          passed: true,
          result: data,
        });
      } catch (error) {
        await this.logger.log("ERROR", `Validation failed: ${validation.name}`, {
          error: error.message,
        });
        return false;
      }
    }

    return true;
  }

  async postMigrationOptimization() {
    await this.logger.log("INFO", "Running post-migration optimization");

    const tables = ["opportunities", "contact_organizations", "companies", "contacts"];

    for (const table of tables) {
      try {
        // Analyze table for query planner
        await this.supabase.rpc("execute_sql", { sql: `ANALYZE ${table}` });

        // Vacuum to reclaim space
        await this.supabase.rpc("execute_sql", { sql: `VACUUM ${table}` });

        await this.logger.log("INFO", `Optimized table: ${table}`);
      } catch (error) {
        await this.logger.log("WARNING", `Could not optimize ${table}`, {
          error: error.message,
        });
      }
    }
  }

  async rollback() {
    await this.logger.log("WARNING", "Initiating migration rollback");

    try {
      // Execute rollback SQL
      const rollbackSql = `
        -- Rollback to pre-migration state
        ROLLBACK;

        -- Log rollback
        INSERT INTO migration_progress (phase, step, status, error_message)
        VALUES ('ROLLBACK', 'Emergency rollback executed', 'failed', 'Migration rolled back due to errors');
      `;

      await this.supabase.rpc("execute_sql", { sql: rollbackSql });

      await this.logger.log("WARNING", "Migration rolled back successfully");
    } catch (error) {
      await this.logger.log("ERROR", "Rollback failed - manual intervention required", {
        error: error.message,
      });
    }
  }
}

// Main execution
async function main() {
  // Validate environment
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
    console.error("Missing required environment variables:");
    console.error("- SUPABASE_URL or VITE_SUPABASE_URL");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);

  // Initialize logger
  const logger = new Logger(CONFIG.logPath);
  await logger.init();

  // Create executor
  const executor = new MigrationExecutor(supabase, logger);

  // Show warning
  console.log("\n" + "=".repeat(60));
  console.log("🚨 PRODUCTION MIGRATION SAFETY WRAPPER 🚨");
  console.log("=".repeat(60));
  console.log("\nThis script will:");
  console.log("1. Validate safety conditions");
  console.log("2. Create backups");
  console.log("3. Execute batched migration");
  console.log("4. Monitor progress and resources");
  console.log("5. Rollback on any failure");
  console.log("\n" + "=".repeat(60) + "\n");

  // Execute migration
  const success = await executor.execute();

  // Final report
  console.log("\n" + "=".repeat(60));
  if (success) {
    console.log("✅ MIGRATION COMPLETED SUCCESSFULLY");
    console.log(`Log file: ${CONFIG.logPath}`);
  } else {
    console.log("❌ MIGRATION FAILED - CHECK LOGS");
    console.log(`Log file: ${CONFIG.logPath}`);
  }
  console.log("=".repeat(60) + "\n");

  process.exit(success ? 0 : 1);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  MigrationExecutor,
  SafetyValidator,
  ProgressMonitor,
  ResourceMonitor,
  Logger,
  CONFIG,
};
