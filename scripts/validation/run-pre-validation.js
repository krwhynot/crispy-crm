#!/usr/bin/env node

/**
 * Pre-Migration Validation Runner
 * Task 5.1a: Executes pre-migration validation queries and generates Go/No-Go assessment
 *
 * Usage:
 *   npm run validate:pre-migration
 *   node scripts/validation/run-pre-validation.js
 *   node scripts/validation/run-pre-validation.js --dry-run
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Get __dirname for ES modules
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console color helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}\n${colors.bright}${msg}${colors.reset}\n${colors.cyan}${"=".repeat(60)}${colors.reset}`
    ),
};

class PreMigrationValidator {
  constructor(options = {}) {
    this.isDryRun = options.dryRun || false;
    this.connectionString = this.getConnectionString();
    this.validationRunId = null;
    this.captureRunId = null;
    this.results = {
      checks: [],
      failCount: 0,
      warnCount: 0,
      passCount: 0,
      goNoGo: null,
    };
  }

  /**
   * Get database connection string from environment
   */
  getConnectionString() {
    // Check for direct DATABASE_URL first
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    // Build from Supabase environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing database configuration. Set DATABASE_URL or VITE_SUPABASE_URL");
    }

    // Extract project ID from Supabase URL
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectId) {
      throw new Error("Invalid VITE_SUPABASE_URL format");
    }

    // Construct database URL for Supabase
    // Format: postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || "postgres";
    return `postgresql://postgres.${projectId}:${dbPassword}@db.${projectId}.supabase.co:5432/postgres`;
  }

  /**
   * Create database client
   */
  async createClient() {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: this.connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    return client;
  }

  /**
   * Execute SQL file
   */
  async executeSQLFile(client, filePath, description) {
    log.info(`Running ${description}...`);

    const sqlContent = fs.readFileSync(filePath, "utf8");

    try {
      if (this.isDryRun) {
        log.warning("DRY RUN - Would execute SQL file");
        return null;
      }

      const result = await client.query(sqlContent);
      log.success(`${description} completed`);
      return result;
    } catch (error) {
      log.error(`Failed to execute ${description}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run pre-migration validation checks
   */
  async runValidation(client) {
    const validationFile = path.join(__dirname, "pre-migration-validation.sql");

    if (!fs.existsSync(validationFile)) {
      throw new Error(`Validation file not found: ${validationFile}`);
    }

    // Execute validation SQL
    await this.executeSQLFile(client, validationFile, "Pre-migration validation");

    // Retrieve results
    if (!this.isDryRun) {
      const results = await client.query(`
        SELECT
          validation_run_id,
          check_type,
          entity_name,
          count_value,
          percentage,
          status,
          message
        FROM migration_validation_results
        WHERE validation_run_id = (
          SELECT validation_run_id
          FROM migration_validation_results
          ORDER BY created_at DESC
          LIMIT 1
        )
        ORDER BY
          CASE check_type
            WHEN 'entity_count' THEN 1
            WHEN 'orphaned_records' THEN 2
            WHEN 'foreign_key_integrity' THEN 3
            WHEN 'required_fields' THEN 4
            WHEN 'data_quality' THEN 5
            WHEN 'disk_space' THEN 6
            WHEN 'backup_creation' THEN 7
            WHEN 'go_no_go_decision' THEN 8
          END,
          entity_name
      `);

      this.validationRunId = results.rows[0]?.validation_run_id;
      this.processResults(results.rows);
    }
  }

  /**
   * Capture current database state
   */
  async captureState(client) {
    const captureFile = path.join(__dirname, "capture-current-state.sql");

    if (!fs.existsSync(captureFile)) {
      throw new Error(`State capture file not found: ${captureFile}`);
    }

    // Execute state capture SQL
    await this.executeSQLFile(client, captureFile, "State capture");

    // Retrieve capture ID
    if (!this.isDryRun) {
      const result = await client.query(`
        SELECT capture_run_id
        FROM migration_state_capture
        ORDER BY created_at DESC
        LIMIT 1
      `);

      this.captureRunId = result.rows[0]?.capture_run_id;
      log.success(`State captured with ID: ${this.captureRunId}`);
    }
  }

  /**
   * Process validation results
   */
  processResults(rows) {
    rows.forEach((row) => {
      if (row.check_type === "go_no_go_decision") {
        this.results.goNoGo = row;
      } else {
        this.results.checks.push(row);

        switch (row.status) {
          case "FAIL":
            this.results.failCount++;
            break;
          case "WARN":
            this.results.warnCount++;
            break;
          case "PASS":
            this.results.passCount++;
            break;
        }
      }
    });
  }

  /**
   * Display validation results
   */
  displayResults() {
    log.header("PRE-MIGRATION VALIDATION RESULTS");

    if (this.isDryRun) {
      log.warning("DRY RUN MODE - No actual validation performed");
      return;
    }

    // Group results by check type
    const checkTypes = [
      { type: "entity_count", label: "Entity Counts" },
      { type: "orphaned_records", label: "Orphaned Records" },
      { type: "foreign_key_integrity", label: "Foreign Key Integrity" },
      { type: "required_fields", label: "Required Fields" },
      { type: "data_quality", label: "Data Quality" },
      { type: "disk_space", label: "Disk Space" },
      { type: "backup_creation", label: "Backup Creation" },
    ];

    checkTypes.forEach(({ type, label }) => {
      const checks = this.results.checks.filter((c) => c.check_type === type);
      if (checks.length > 0) {
        console.log(`\n${colors.bright}${label}:${colors.reset}`);

        checks.forEach((check) => {
          const statusColor =
            check.status === "PASS"
              ? colors.green
              : check.status === "WARN"
                ? colors.yellow
                : colors.red;
          const statusIcon = check.status === "PASS" ? "✔" : check.status === "WARN" ? "⚠" : "✖";

          let message = `  ${statusColor}${statusIcon}${colors.reset} ${check.message}`;
          if (check.percentage !== null) {
            message += ` (${check.percentage}%)`;
          }
          console.log(message);
        });
      }
    });

    // Display summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`  ${colors.green}Passed:${colors.reset} ${this.results.passCount}`);
    console.log(`  ${colors.yellow}Warnings:${colors.reset} ${this.results.warnCount}`);
    console.log(`  ${colors.red}Failed:${colors.reset} ${this.results.failCount}`);

    // Display Go/No-Go decision
    if (this.results.goNoGo) {
      const decision = this.results.goNoGo;
      const decisionColor =
        decision.status === "PASS"
          ? colors.green
          : decision.status === "WARN"
            ? colors.yellow
            : colors.red;

      log.header("GO/NO-GO DECISION");
      console.log(`${decisionColor}${colors.bright}${decision.message}${colors.reset}`);

      if (decision.status === "FAIL") {
        console.log(
          `\n${colors.red}${colors.bright}⚠ CRITICAL: Do not proceed with migration until all failures are resolved.${colors.reset}`
        );
      } else if (decision.status === "WARN") {
        console.log(
          `\n${colors.yellow}${colors.bright}⚠ WARNING: Review all warnings and confirm they are acceptable before proceeding.${colors.reset}`
        );
      } else {
        console.log(
          `\n${colors.green}${colors.bright}✔ SUCCESS: Migration validation passed. You may proceed with migration.${colors.reset}`
        );
      }
    }

    // Display IDs for reference
    console.log(
      `\n${colors.cyan}Validation Run ID:${colors.reset} ${this.validationRunId || "N/A"}`
    );
    console.log(`${colors.cyan}State Capture ID:${colors.reset} ${this.captureRunId || "N/A"}`);
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const reportPath = path.join(__dirname, "..", "..", "logs", "pre-migration-validation.json");
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      validationRunId: this.validationRunId,
      captureRunId: this.captureRunId,
      isDryRun: this.isDryRun,
      summary: {
        passed: this.results.passCount,
        warnings: this.results.warnCount,
        failed: this.results.failCount,
        goNoGo: this.results.goNoGo?.status || "UNKNOWN",
      },
      checks: this.results.checks,
      decision: this.results.goNoGo,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.info(`Validation report saved to: ${reportPath}`);
  }

  /**
   * Main execution
   */
  async run() {
    let client = null;

    try {
      log.header("CRM MIGRATION PRE-VALIDATION");
      log.info(`Starting pre-migration validation${this.isDryRun ? " (DRY RUN)" : ""}...`);

      // Create database connection
      client = await this.createClient();
      log.success("Database connection established");

      // Run validation checks
      await this.runValidation(client);

      // Capture current state
      await this.captureState(client);

      // Display results
      this.displayResults();

      // Generate report
      this.generateReport();

      // Exit with appropriate code
      if (this.results.goNoGo?.status === "FAIL") {
        process.exit(1); // Exit with error if validation failed
      }
    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    } finally {
      if (client) {
        await client.end();
        log.info("Database connection closed");
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes("--dry-run"),
};

// Run validation
const validator = new PreMigrationValidator(options);
validator.run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { PreMigrationValidator };
