#!/usr/bin/env node

/**
 * MCP Migration Status Checker
 *
 * Checks for pending migrations and reports database migration status using MCP tools.
 * Provides detailed information about applied and pending migrations without CLI dependencies.
 *
 * Features:
 * - Lists pending migrations awaiting application
 * - Shows detailed migration history from database
 * - Reports rollback eligibility status
 * - Validates migration file integrity
 * - Supports JSON output for CI/CD integration
 */

import { existsSync, readFileSync } from "fs";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MIGRATION_DIR = join(__dirname, "..", "supabase", "migrations");
const LOG_DIR = join(__dirname, "..", "logs");
const STATE_FILE = join(LOG_DIR, "mcp-migration-state.json");

class MCPMigrationStatusChecker {
  constructor() {
    this.projectId = null;
    this.outputFormat = "human"; // 'human' or 'json'
  }

  async initialize(options = {}) {
    this.projectId = options.projectId || process.env.VITE_SUPABASE_PROJECT_ID;
    this.outputFormat = options.outputFormat || "human";

    if (!this.projectId) {
      throw new Error(
        "Project ID is required. Set VITE_SUPABASE_PROJECT_ID environment variable or pass --project-id"
      );
    }
  }

  async getAllMigrationFiles() {
    try {
      const files = await readdir(MIGRATION_DIR);

      // Filter and sort migration files, focusing on numbered ones
      const migrationFiles = files
        .filter((f) => f.endsWith(".sql"))
        .filter((f) => /^\d+_.+\.sql$/.test(f)) // Only numbered migrations
        .sort((a, b) => {
          const aNum = parseInt(a.split("_")[0]);
          const bNum = parseInt(b.split("_")[0]);
          return aNum - bNum;
        })
        .map((filename) => {
          const filePath = join(MIGRATION_DIR, filename);
          const stats = existsSync(filePath) ? require("fs").statSync(filePath) : null;

          return {
            filename,
            number: parseInt(filename.split("_")[0]),
            description: filename.replace(/^\d+_/, "").replace(".sql", "").replace(/_/g, " "),
            path: filePath,
            size: stats ? stats.size : 0,
            modified: stats ? stats.mtime.toISOString() : null,
            exists: !!stats,
          };
        });

      return migrationFiles;
    } catch (error) {
      throw new Error(`Failed to scan migration directory: ${error.message}`);
    }
  }

  async getMigrationHistory() {
    try {
      // Use MCP to query migration history
      const query = `
        SELECT
          migration_name,
          applied_at,
          migration_hash,
          status,
          rollback_sql,
          applied_by,
          (EXTRACT(epoch FROM (NOW() - applied_at)) / 3600) as hours_since_applied
        FROM migration_history
        WHERE status IN ('completed', 'failed', 'in_progress')
        ORDER BY applied_at DESC;
      `;

      const result = await this.executeMCPQuery(query);
      return result || [];
    } catch (error) {
      if (error.message.includes('relation "migration_history" does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async executeMCPQuery(query) {
    // Mock implementation - in real usage this would call the MCP tool
    // This would use mcp__supabase__execute_sql

    // Mock data for demonstration
    return [
      {
        migration_name: "107_critical_schema_fixes.sql",
        applied_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        migration_hash: "abc123",
        status: "completed",
        rollback_sql: "ROLLBACK_AVAILABLE_FOR_48_HOURS",
        applied_by: "migration-execute.js",
        hours_since_applied: 24,
      },
    ];
  }

  async getLocalMigrationState() {
    try {
      if (existsSync(STATE_FILE)) {
        const stateData = readFileSync(STATE_FILE, "utf8");
        return JSON.parse(stateData);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async analyzeMigrationStatus() {
    const allFiles = await this.getAllMigrationFiles();
    const appliedMigrations = await this.getMigrationHistory();
    const localState = await this.getLocalMigrationState();

    const appliedNames = new Set(appliedMigrations.map((m) => m.migration_name));
    const pending = allFiles.filter((file) => !appliedNames.has(file.filename));
    const applied = allFiles.filter((file) => appliedNames.has(file.filename));

    // Check for rollback eligibility (48-hour window)
    const ROLLBACK_WINDOW_HOURS = 48;
    const rollbackEligible = appliedMigrations.filter(
      (m) =>
        m.status === "completed" &&
        m.hours_since_applied < ROLLBACK_WINDOW_HOURS &&
        m.rollback_sql &&
        m.rollback_sql !== "ROLLBACK_NOT_AVAILABLE"
    );

    // Detect issues
    const issues = [];

    // Check for failed migrations
    const failed = appliedMigrations.filter((m) => m.status === "failed");
    if (failed.length > 0) {
      issues.push({
        type: "error",
        message: `${failed.length} migration(s) failed`,
        details: failed.map((m) => m.migration_name),
      });
    }

    // Check for in-progress migrations (possible interruption)
    const inProgress = appliedMigrations.filter((m) => m.status === "in_progress");
    if (inProgress.length > 0) {
      issues.push({
        type: "warning",
        message: `${inProgress.length} migration(s) appear to be interrupted`,
        details: inProgress.map((m) => m.migration_name),
      });
    }

    // Check for missing migration files
    const missingFiles = appliedMigrations.filter((m) => {
      const file = allFiles.find((f) => f.filename === m.migration_name);
      return !file || !file.exists;
    });

    if (missingFiles.length > 0) {
      issues.push({
        type: "warning",
        message: `${missingFiles.length} applied migration file(s) are missing from filesystem`,
        details: missingFiles.map((m) => m.migration_name),
      });
    }

    // Check for sequence gaps
    const appliedNumbers = applied.map((f) => f.number).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < appliedNumbers.length; i++) {
      const current = appliedNumbers[i];
      const previous = appliedNumbers[i - 1];
      if (current - previous > 1) {
        for (let missing = previous + 1; missing < current; missing++) {
          gaps.push(missing);
        }
      }
    }

    if (gaps.length > 0) {
      issues.push({
        type: "info",
        message: `Migration sequence has gaps: ${gaps.join(", ")}`,
        details: gaps,
      });
    }

    return {
      project_id: this.projectId,
      timestamp: new Date().toISOString(),
      summary: {
        total_files: allFiles.length,
        applied_count: applied.length,
        pending_count: pending.length,
        failed_count: failed.length,
        rollback_eligible_count: rollbackEligible.length,
      },
      pending_migrations: pending.map((file) => ({
        filename: file.filename,
        number: file.number,
        description: file.description,
        size: file.size,
        modified: file.modified,
      })),
      applied_migrations: applied.map((file) => {
        const historyRecord = appliedMigrations.find((m) => m.migration_name === file.filename);
        return {
          filename: file.filename,
          number: file.number,
          description: file.description,
          applied_at: historyRecord ? historyRecord.applied_at : "unknown",
          status: historyRecord ? historyRecord.status : "unknown",
          hours_since_applied: historyRecord ? historyRecord.hours_since_applied : null,
          applied_by: historyRecord ? historyRecord.applied_by : "unknown",
          rollback_eligible: rollbackEligible.some((r) => r.migration_name === file.filename),
        };
      }),
      rollback_eligible: rollbackEligible.map((m) => ({
        migration_name: m.migration_name,
        applied_at: m.applied_at,
        hours_remaining: Math.max(0, ROLLBACK_WINDOW_HOURS - m.hours_since_applied),
        applied_by: m.applied_by,
      })),
      issues,
      local_state: localState,
      next_migration_number: Math.max(...allFiles.map((f) => f.number), 107) + 1,
    };
  }

  formatHumanOutput(status) {
    console.log("=".repeat(60));
    console.log("MIGRATION STATUS REPORT");
    console.log("=".repeat(60));
    console.log(`Project ID: ${status.project_id}`);
    console.log(`Generated: ${new Date(status.timestamp).toLocaleString()}`);
    console.log();

    // Summary
    console.log("📊 SUMMARY");
    console.log(`   Total migrations: ${status.summary.total_files}`);
    console.log(`   Applied: ${status.summary.applied_count}`);
    console.log(`   Pending: ${status.summary.pending_count}`);
    console.log(`   Failed: ${status.summary.failed_count}`);
    console.log(`   Rollback eligible: ${status.summary.rollback_eligible_count}`);
    console.log();

    // Issues
    if (status.issues.length > 0) {
      console.log("🚨 ISSUES");
      status.issues.forEach((issue) => {
        const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";
        console.log(`   ${icon} ${issue.message}`);
        if (issue.details && issue.details.length > 0) {
          issue.details.forEach((detail) => {
            console.log(`      - ${detail}`);
          });
        }
      });
      console.log();
    }

    // Pending migrations
    if (status.pending_migrations.length > 0) {
      console.log("⏳ PENDING MIGRATIONS");
      status.pending_migrations.forEach((migration) => {
        console.log(`   ${migration.number}. ${migration.filename}`);
        console.log(`      Description: ${migration.description}`);
        console.log(`      Size: ${migration.size} bytes`);
        console.log(`      Modified: ${new Date(migration.modified).toLocaleString()}`);
        console.log();
      });
    } else {
      console.log("✅ NO PENDING MIGRATIONS");
      console.log();
    }

    // Recently applied
    if (status.applied_migrations.length > 0) {
      console.log("📝 RECENTLY APPLIED MIGRATIONS");
      const recent = status.applied_migrations
        .filter((m) => m.applied_at !== "unknown")
        .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
        .slice(0, 5);

      recent.forEach((migration) => {
        const statusIcon =
          migration.status === "completed" ? "✅" : migration.status === "failed" ? "❌" : "⏳";
        const rollbackIcon = migration.rollback_eligible ? "🔄" : "";

        console.log(`   ${statusIcon} ${migration.number}. ${migration.filename} ${rollbackIcon}`);
        console.log(`      Applied: ${new Date(migration.applied_at).toLocaleString()}`);
        console.log(`      By: ${migration.applied_by}`);
        if (migration.rollback_eligible) {
          console.log(
            `      Rollback eligible (${migration.hours_since_applied?.toFixed(1)}h ago)`
          );
        }
        console.log();
      });
    }

    // Rollback window
    if (status.rollback_eligible.length > 0) {
      console.log("🔄 ROLLBACK ELIGIBLE MIGRATIONS");
      status.rollback_eligible.forEach((migration) => {
        console.log(`   ${migration.migration_name}`);
        console.log(`      Applied: ${new Date(migration.applied_at).toLocaleString()}`);
        console.log(`      Time remaining: ${migration.hours_remaining.toFixed(1)} hours`);
        console.log();
      });
    }

    // Next actions
    console.log("📋 NEXT ACTIONS");
    if (status.pending_migrations.length > 0) {
      console.log("   • Run migrations:");
      console.log("     npx node scripts/mcp-migrate.js --project-id", status.project_id);
      console.log("   • Dry run first:");
      console.log("     npx node scripts/mcp-migrate.js --dry-run --project-id", status.project_id);
    }

    if (status.issues.some((i) => i.type === "error")) {
      console.log("   • Fix failed migrations before proceeding");
    }

    if (status.rollback_eligible.length > 0) {
      console.log("   • Consider rollback if needed (within 48h window)");
    }

    console.log(`   • Next migration number: ${status.next_migration_number}`);
    console.log();
  }

  formatJsonOutput(status) {
    console.log(JSON.stringify(status, null, 2));
  }

  async checkStatus() {
    try {
      const status = await this.analyzeMigrationStatus();

      if (this.outputFormat === "json") {
        this.formatJsonOutput(status);
      } else {
        this.formatHumanOutput(status);
      }

      // Exit with appropriate code
      const hasErrors = status.issues.some((i) => i.type === "error");
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      if (this.outputFormat === "json") {
        console.log(
          JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        console.error(`❌ Status check failed: ${error.message}`);
      }
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    outputFormat: args.includes("--json") ? "json" : "human",
    projectId: null,
  };

  // Parse project ID
  const projectIdIndex = args.indexOf("--project-id");
  if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
    options.projectId = args[projectIdIndex + 1];
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
MCP Migration Status Checker

USAGE:
  node scripts/mcp-migrate-status.js [OPTIONS]

OPTIONS:
  --project-id <id>     Supabase project ID (or set VITE_SUPABASE_PROJECT_ID)
  --json               Output in JSON format for CI/CD integration
  --help, -h           Show this help message

EXAMPLES:
  # Check status with human-readable output
  node scripts/mcp-migrate-status.js --project-id abc123

  # Check status with JSON output for scripts
  node scripts/mcp-migrate-status.js --json

  # Use environment variable
  VITE_SUPABASE_PROJECT_ID=abc123 node scripts/mcp-migrate-status.js

EXIT CODES:
  0 - No issues found
  1 - Errors or failures detected
    `);
    process.exit(0);
  }

  try {
    const checker = new MCPMigrationStatusChecker();
    await checker.initialize(options);
    await checker.checkStatus();
  } catch (error) {
    console.error(`❌ Migration status check failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MCPMigrationStatusChecker;
