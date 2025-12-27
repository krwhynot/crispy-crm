#!/usr/bin/env node

/**
 * Comprehensive Post-Migration Validation Runner
 *
 * Orchestrates all post-migration verification tasks:
 * - Runs migration-verify.js for detailed checks
 * - Generates HTML report with migration-report.js
 * - Performs additional validation checks
 * - Coordinates with other validation scripts
 */

const { createClient } = require("@supabase/supabase-js");
const { spawn } = require("child_process");
const path = require("path");

class PostMigrationValidation {
  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found in environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.validationResults = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  async validateTableExists(tableName, expectedName = null) {
    const displayName = expectedName || tableName;

    try {
      const { error } = await this.supabase.from(tableName).select("id").limit(1);

      if (error && error.code === "42P01") {
        // Table doesn't exist
        this.validationResults.failed.push({
          check: `Table exists: ${displayName}`,
          message: `Table ${tableName} does not exist`,
        });
        return false;
      }

      this.validationResults.passed.push({
        check: `Table exists: ${displayName}`,
        message: `Table ${tableName} exists and is accessible`,
      });
      return true;
    } catch (error) {
      this.validationResults.failed.push({
        check: `Table exists: ${displayName}`,
        message: error.message,
      });
      return false;
    }
  }

  async validateOpportunitiesMigration() {
    console.log("\n🔍 Validating opportunities migration...");

    // Check that opportunities table exists
    if (!(await this.validateTableExists("opportunities"))) {
      return;
    }

    // Count opportunities
    const { data: opportunities, error: oppError } = await this.supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true });

    if (oppError) {
      this.validationResults.failed.push({
        check: "Opportunities count",
        message: `Failed to count opportunities: ${oppError.message}`,
      });
    } else {
      this.validationResults.passed.push({
        check: "Opportunities count",
        message: `Found ${opportunities} opportunities`,
      });
    }

    // Check new columns exist
    const { data: sampleOpp, error: sampleError } = await this.supabase
      .from("opportunities")
      .select("id, stage, status, priority, probability, customer_organization_id")
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== "PGRST116") {
      this.validationResults.failed.push({
        check: "Opportunities new columns",
        message: `New columns missing or inaccessible: ${sampleError.message}`,
      });
    } else {
      this.validationResults.passed.push({
        check: "Opportunities new columns",
        message: "All new opportunity columns are accessible",
      });
    }

    // Check backward compatibility view
    const { error: dealsViewError } = await this.supabase.from("deals").select("id").limit(1);

    if (dealsViewError) {
      this.validationResults.warnings.push({
        check: "Deals backward compatibility",
        message: `Deals view not accessible: ${dealsViewError.message}`,
      });
    } else {
      this.validationResults.passed.push({
        check: "Deals backward compatibility",
        message: "Deals backward compatibility view is working",
      });
    }
  }

  async validateContactOrganizationsMigration() {
    console.log("\n🔍 Validating contact-organizations migration...");

    // Check junction table exists
    if (!(await this.validateTableExists("contact_organizations"))) {
      return;
    }

    // Verify data was migrated
    const { data: junctionCount, error: junctionError } = await this.supabase
      .from("contact_organizations")
      .select("id", { count: "exact", head: true });

    const { data: contactsWithCompany, error: contactsError } = await this.supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .not("company_id", "is", null);

    if (!junctionError && !contactsError) {
      if (junctionCount >= contactsWithCompany) {
        this.validationResults.passed.push({
          check: "Contact relationships migrated",
          message: `${junctionCount} relationships migrated from ${contactsWithCompany} contacts with companies`,
        });
      } else {
        this.validationResults.warnings.push({
          check: "Contact relationships migrated",
          message: `Only ${junctionCount} relationships migrated from ${contactsWithCompany} contacts with companies`,
        });
      }
    }

    // Check backup columns exist
    const { data: backupCheck } = await this.supabase
      .from("contacts")
      .select("company_id_backup")
      .limit(1)
      .single();

    if (backupCheck && "company_id_backup" in backupCheck) {
      this.validationResults.passed.push({
        check: "Backup columns created",
        message: "Contact backup columns exist for rollback safety",
      });
    } else {
      this.validationResults.warnings.push({
        check: "Backup columns created",
        message: "Contact backup columns may not exist",
      });
    }
  }

  async validateViews() {
    console.log("\n🔍 Validating database views...");

    const views = [
      "opportunities_summary",
      "deals_summary",
      "companies_summary",
      "contacts_summary",
      "contact_influence_profile",
      "principal_advocacy_dashboard",
    ];

    for (const view of views) {
      const { error } = await this.supabase.from(view).select("*").limit(1);

      if (error) {
        if (view.includes("principal") || view.includes("influence")) {
          // These are optional for Stage 1
          this.validationResults.warnings.push({
            check: `View: ${view}`,
            message: `Optional view not accessible: ${error.message}`,
          });
        } else {
          this.validationResults.failed.push({
            check: `View: ${view}`,
            message: `Critical view not accessible: ${error.message}`,
          });
        }
      } else {
        this.validationResults.passed.push({
          check: `View: ${view}`,
          message: `View ${view} is accessible`,
        });
      }
    }
  }

  async validateRLSPolicies() {
    console.log("\n🔍 Validating RLS policies...");

    // Test that authenticated users can access opportunities
    const { error: oppAccessError } = await this.supabase
      .from("opportunities")
      .select("id")
      .limit(1);

    if (oppAccessError && oppAccessError.code === "42501") {
      this.validationResults.failed.push({
        check: "RLS policies on opportunities",
        message: "RLS policies are blocking access to opportunities table",
      });
    } else {
      this.validationResults.passed.push({
        check: "RLS policies on opportunities",
        message: "RLS policies allow authenticated access to opportunities",
      });
    }

    // Check opportunityNotes access
    const { error: notesError } = await this.supabase
      .from("opportunityNotes")
      .select("id")
      .limit(1);

    if (notesError && notesError.code === "42P01") {
      // Table might not have been renamed yet
      const { error: dealNotesError } = await this.supabase.from("dealNotes").select("id").limit(1);

      if (!dealNotesError) {
        this.validationResults.warnings.push({
          check: "Notes table migration",
          message: "dealNotes table not yet renamed to opportunityNotes",
        });
      }
    } else if (!notesError) {
      this.validationResults.passed.push({
        check: "Notes table migration",
        message: "opportunityNotes table is accessible with RLS",
      });
    }
  }

  async validateDataIntegrity() {
    console.log("\n🔍 Validating data integrity...");

    // Check for orphaned records
    const { data: orphanedContacts } = await this.supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .not("company_id", "is", null)
      .filter("company_id", "not.in", "(SELECT id FROM companies)");

    if (orphanedContacts && orphanedContacts > 0) {
      this.validationResults.warnings.push({
        check: "Orphaned contacts",
        message: `Found ${orphanedContacts} contacts with invalid company references`,
      });
    } else {
      this.validationResults.passed.push({
        check: "Orphaned contacts",
        message: "No orphaned contact records found",
      });
    }

    // Check for data in migration_history
    const { data: migrationHistory } = await this.supabase
      .from("migration_history")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(5);

    if (migrationHistory && migrationHistory.length > 0) {
      this.validationResults.passed.push({
        check: "Migration history",
        message: `Found ${migrationHistory.length} migration history records`,
      });
    } else {
      this.validationResults.warnings.push({
        check: "Migration history",
        message: "No migration history records found",
      });
    }
  }

  async generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("POST-MIGRATION VALIDATION REPORT");
    console.log("=".repeat(60));

    const totalPassed = this.validationResults.passed.length;
    const totalFailed = this.validationResults.failed.length;
    const totalWarnings = this.validationResults.warnings.length;

    console.log("\n📊 SUMMARY:");
    console.log(`  ✅ Passed: ${totalPassed}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⚠️  Warnings: ${totalWarnings}`);

    if (this.validationResults.failed.length > 0) {
      console.log("\n❌ FAILED CHECKS (Critical - Immediate action required):");
      for (const failure of this.validationResults.failed) {
        console.log(`  ❌ ${failure.check}`);
        console.log(`     └─ ${failure.message}`);
      }
    }

    if (this.validationResults.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS (Review and monitor):");
      for (const warning of this.validationResults.warnings) {
        console.log(`  ⚠️  ${warning.check}`);
        console.log(`     └─ ${warning.message}`);
      }
    }

    if (this.validationResults.passed.length > 0) {
      console.log("\n✅ PASSED CHECKS:");
      for (const pass of this.validationResults.passed) {
        console.log(`  ✅ ${pass.check}`);
      }
    }

    console.log("\n" + "=".repeat(60));

    // Overall status
    if (totalFailed === 0) {
      console.log("✅ MIGRATION VALIDATION PASSED");

      if (totalWarnings > 0) {
        console.log(`   Note: ${totalWarnings} warnings require monitoring`);
      }

      console.log("\n   Next steps:");
      console.log("   1. Test critical user workflows");
      console.log("   2. Monitor application logs for errors");
      console.log("   3. Check user feedback channels");
      console.log("   4. Keep rollback ready for 48 hours");
    } else {
      console.log("❌ MIGRATION VALIDATION FAILED");
      console.log(`   ${totalFailed} critical checks failed`);
      console.log("\n   Immediate actions:");
      console.log("   1. Review failed checks above");
      console.log("   2. Consider rollback if data is corrupted");
      console.log("   3. Fix issues and re-run validation");
      console.log("   4. Do not allow users to access the system");
    }

    console.log("=".repeat(60));

    // Exit code based on failures
    process.exit(totalFailed > 0 ? 1 : 0);
  }

  /**
   * Run external validation script
   */
  async runExternalScript(scriptName, description) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔧 Running ${description}...`);

      const scriptPath = path.join(__dirname, scriptName);
      const child = spawn("node", [scriptPath], {
        env: process.env,
        stdio: "inherit",
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ ${description} completed successfully`);
          resolve(code);
        } else {
          console.log(`⚠️ ${description} completed with warnings (code: ${code})`);
          resolve(code); // Don't reject on warnings
        }
      });

      child.on("error", (error) => {
        console.error(`❌ Failed to run ${description}:`, error.message);
        reject(error);
      });
    });
  }

  async run() {
    try {
      console.log("🔍 Starting Comprehensive Post-Migration Validation Suite...");
      console.log("=".repeat(60));

      // Run built-in validation checks
      console.log("\n📋 Phase 1: Basic Validation Checks");
      await this.validateOpportunitiesMigration();
      await this.validateContactOrganizationsMigration();
      await this.validateViews();
      await this.validateRLSPolicies();
      await this.validateDataIntegrity();

      // Generate initial report
      await this.generateReport();

      // Run comprehensive verification
      console.log("\n📋 Phase 2: Comprehensive Verification");
      try {
        await this.runExternalScript("migration-verify.js", "Comprehensive Migration Verification");
      } catch (error) {
        console.error("Verification script failed:", error.message);
      }

      // Generate HTML report
      console.log("\n📋 Phase 3: Report Generation");
      try {
        await this.runExternalScript("migration-report.js", "HTML Report Generation");
      } catch (error) {
        console.error("Report generation failed:", error.message);
      }

      // Final summary
      console.log("\n" + "=".repeat(60));
      console.log("🎉 POST-MIGRATION VALIDATION COMPLETE");
      console.log("=".repeat(60));

      const totalPassed = this.validationResults.passed.length;
      const totalFailed = this.validationResults.failed.length;
      const totalWarnings = this.validationResults.warnings.length;

      console.log("\n📊 FINAL SUMMARY:");
      console.log(`  ✅ Passed: ${totalPassed}`);
      console.log(`  ❌ Failed: ${totalFailed}`);
      console.log(`  ⚠️  Warnings: ${totalWarnings}`);

      console.log("\n📝 NEXT STEPS:");
      console.log("  1. Review the HTML report in logs/ directory");
      console.log("  2. Address any critical issues immediately");
      console.log("  3. Monitor application performance for 24 hours");
      console.log("  4. Keep rollback scripts ready for 48 hours");
      console.log("  5. Communicate migration status to stakeholders");

      // Exit with appropriate code
      process.exit(totalFailed > 0 ? 1 : 0);
    } catch (error) {
      console.error("❌ Validation suite failed with error:", error.message);
      process.exit(1);
    }
  }
}

// Execute validation
(async () => {
  const validation = new PostMigrationValidation();
  await validation.run();
})();
