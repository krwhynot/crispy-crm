/**
 * Go/No-Go Migration Decision Logic
 *
 * Automated decision system that evaluates all validation results
 * and determines if migration should proceed, be delayed, or blocked.
 */

import { createClient } from "@supabase/supabase-js";
import { ReferentialIntegrityValidator } from "./referential-integrity.js";
import { UniqueConstraintValidator } from "./unique-constraints.js";
import { RequiredFieldsValidator } from "./required-fields.js";
import { DataQualityAssessor } from "./data-quality.js";

export class MigrationGoNoGoDecision {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.validators = {
      referentialIntegrity: new ReferentialIntegrityValidator(
        supabaseUrl,
        supabaseKey,
      ),
      uniqueConstraints: new UniqueConstraintValidator(
        supabaseUrl,
        supabaseKey,
      ),
      requiredFields: new RequiredFieldsValidator(supabaseUrl, supabaseKey),
      dataQuality: new DataQualityAssessor(supabaseUrl, supabaseKey),
    };
    this.criteria = {
      // Critical blocking criteria
      criticalBlockers: {
        referentialIntegrity: { maxCritical: 0, maxHigh: 0 },
        uniqueConstraints: { maxCritical: 0, maxHigh: 5 },
        requiredFields: { maxCritical: 0, maxHigh: 10 },
      },
      // Warning thresholds
      warningThresholds: {
        dataQuality: { minScore: 99.0 }, // <1% warning threshold
        totalViolations: { max: 20 },
        fixableViolations: { minPercentage: 80 },
      },
      // System readiness criteria
      systemReadiness: {
        diskSpaceMinimum: 10 * 1024 * 1024 * 1024, // 10GB
        backupRequired: true,
        maintenanceWindow: true,
      },
    };
  }

  /**
   * Run complete validation and make go/no-go decision
   */
  async evaluateMigrationReadiness() {
    console.log(
      "🎯 Starting comprehensive migration readiness evaluation...\n",
    );

    const startTime = Date.now();
    const results = {};
    const decision = {
      recommendation: "UNKNOWN",
      confidence: 0,
      blockers: [],
      warnings: [],
      fixes: [],
      systemChecks: {},
      summary: {},
      executedAt: new Date().toISOString(),
    };

    // Run all validators
    try {
      console.log("🔍 Running validation suite...");
      results.referentialIntegrity =
        await this.validators.referentialIntegrity.validateAll();
      results.uniqueConstraints =
        await this.validators.uniqueConstraints.validateAll();
      results.requiredFields =
        await this.validators.requiredFields.validateAll();
      results.dataQuality = await this.validators.dataQuality.assessAll();

      // System readiness checks
      console.log("🖥️ Checking system readiness...");
      results.systemReadiness = await this.checkSystemReadiness();
    } catch (error) {
      decision.blockers.push({
        type: "VALIDATION_FAILURE",
        severity: "CRITICAL",
        message: `Validation suite failed: ${error.message}`,
        category: "system",
      });
      decision.recommendation = "BLOCK";
      decision.confidence = 100;
      return this.generateFinalReport(results, decision, startTime);
    }

    // Evaluate criteria
    this.evaluateCriticalBlockers(results, decision);
    this.evaluateWarningThresholds(results, decision);
    this.evaluateSystemReadiness(results, decision);
    this.calculateConfidence(results, decision);
    this.generateRecommendations(results, decision);

    // Make final decision
    this.makeFinalDecision(decision);

    const endTime = Date.now();
    console.log(
      `\n⏱️ Evaluation completed in ${(endTime - startTime) / 1000}s`,
    );

    return this.generateFinalReport(results, decision, startTime);
  }

  /**
   * Evaluate critical blocking criteria
   */
  evaluateCriticalBlockers(results, decision) {
    console.log("🚫 Evaluating critical blocking criteria...");

    // Referential integrity blockers
    const riResult = results.referentialIntegrity;
    if (
      riResult.summary.criticalCount >
      this.criteria.criticalBlockers.referentialIntegrity.maxCritical
    ) {
      decision.blockers.push({
        type: "REFERENTIAL_INTEGRITY",
        severity: "CRITICAL",
        message: `${riResult.summary.criticalCount} critical referential integrity violations found`,
        details: riResult.violations.filter((v) => v.severity === "CRITICAL"),
        category: "data",
      });
    }

    if (
      riResult.summary.highCount >
      this.criteria.criticalBlockers.referentialIntegrity.maxHigh
    ) {
      decision.blockers.push({
        type: "REFERENTIAL_INTEGRITY",
        severity: "HIGH",
        message: `${riResult.summary.highCount} high-severity referential integrity violations found`,
        details: riResult.violations.filter((v) => v.severity === "HIGH"),
        category: "data",
      });
    }

    // Unique constraint blockers
    const ucResult = results.uniqueConstraints;
    if (
      ucResult.summary.criticalCount >
      this.criteria.criticalBlockers.uniqueConstraints.maxCritical
    ) {
      decision.blockers.push({
        type: "UNIQUE_CONSTRAINTS",
        severity: "CRITICAL",
        message: `${ucResult.summary.criticalCount} critical unique constraint violations found`,
        details: ucResult.conflicts.filter((c) => c.severity === "CRITICAL"),
        category: "data",
      });
    }

    if (
      ucResult.summary.highCount >
      this.criteria.criticalBlockers.uniqueConstraints.maxHigh
    ) {
      decision.blockers.push({
        type: "UNIQUE_CONSTRAINTS",
        severity: "HIGH",
        message: `${ucResult.summary.highCount} high-severity unique constraint conflicts found (max: ${this.criteria.criticalBlockers.uniqueConstraints.maxHigh})`,
        details: ucResult.conflicts.filter((c) => c.severity === "HIGH"),
        category: "data",
      });
    }

    // Required fields blockers
    const rfResult = results.requiredFields;
    if (
      rfResult.summary.criticalCount >
      this.criteria.criticalBlockers.requiredFields.maxCritical
    ) {
      decision.blockers.push({
        type: "REQUIRED_FIELDS",
        severity: "CRITICAL",
        message: `${rfResult.summary.criticalCount} critical required field violations found`,
        details: rfResult.violations.filter((v) => v.severity === "CRITICAL"),
        category: "data",
      });
    }

    if (
      rfResult.summary.highCount >
      this.criteria.criticalBlockers.requiredFields.maxHigh
    ) {
      decision.blockers.push({
        type: "REQUIRED_FIELDS",
        severity: "HIGH",
        message: `${rfResult.summary.highCount} high-severity required field violations found (max: ${this.criteria.criticalBlockers.requiredFields.maxHigh})`,
        details: rfResult.violations.filter((v) => v.severity === "HIGH"),
        category: "data",
      });
    }

    console.log(`Found ${decision.blockers.length} critical blockers`);
  }

  /**
   * Evaluate warning thresholds
   */
  evaluateWarningThresholds(results, decision) {
    console.log("⚠️ Evaluating warning thresholds...");

    // Data quality threshold
    const dqResult = results.dataQuality;
    if (
      dqResult.overallScore <
      this.criteria.warningThresholds.dataQuality.minScore
    ) {
      decision.warnings.push({
        type: "DATA_QUALITY",
        severity: "WARNING",
        message: `Data quality score ${dqResult.overallScore.toFixed(1)}% below ${this.criteria.warningThresholds.dataQuality.minScore}% threshold`,
        impact: "Migration may succeed but data quality issues will persist",
        category: "quality",
      });
    }

    // Total violations threshold
    const totalViolations =
      results.referentialIntegrity.summary.totalViolations +
      results.uniqueConstraints.summary.totalConflicts +
      results.requiredFields.summary.totalViolations;

    if (totalViolations > this.criteria.warningThresholds.totalViolations.max) {
      decision.warnings.push({
        type: "HIGH_VIOLATION_COUNT",
        severity: "WARNING",
        message: `Total violations (${totalViolations}) exceed threshold (${this.criteria.warningThresholds.totalViolations.max})`,
        impact:
          "High number of data issues may require extensive post-migration cleanup",
        category: "volume",
      });
    }

    // Fixable violations percentage
    const totalFixable =
      (results.uniqueConstraints.summary.fixableCount || 0) +
      (results.requiredFields.summary.fixableCount || 0);

    const fixablePercentage =
      totalViolations === 0 ? 100 : (totalFixable / totalViolations) * 100;

    if (
      fixablePercentage <
      this.criteria.warningThresholds.fixableViolations.minPercentage
    ) {
      decision.warnings.push({
        type: "LOW_FIXABLE_PERCENTAGE",
        severity: "WARNING",
        message: `Only ${fixablePercentage.toFixed(1)}% of violations are fixable (target: ${this.criteria.warningThresholds.fixableViolations.minPercentage}%)`,
        impact: "Many data issues cannot be automatically resolved",
        category: "fixability",
      });
    }

    console.log(`Generated ${decision.warnings.length} warnings`);
  }

  /**
   * Check system readiness
   */
  async checkSystemReadiness() {
    console.log("🖥️ Checking system readiness...");

    const checks = {
      databaseConnection: false,
      diskSpace: false,
      backupStatus: false,
      migrationScripts: false,
      permissions: false,
    };

    try {
      // Database connection check
      const { data, error } = await this.supabase
        .from("companies")
        .select("id")
        .limit(1);
      checks.databaseConnection = !error;

      // Disk space check (estimated)
      // In real implementation, this would check actual disk space
      checks.diskSpace = true; // Placeholder

      // Backup status check
      // In real implementation, verify recent backup exists
      checks.backupStatus = true; // Placeholder

      // Migration scripts check
      // In real implementation, verify all required migration files exist
      checks.migrationScripts = true; // Placeholder

      // Permissions check
      // In real implementation, verify user has required database permissions
      checks.permissions = true; // Placeholder
    } catch (error) {
      console.error("System readiness check failed:", error.message);
    }

    return checks;
  }

  /**
   * Evaluate system readiness
   */
  evaluateSystemReadiness(results, decision) {
    const systemChecks = results.systemReadiness;

    if (!systemChecks.databaseConnection) {
      decision.blockers.push({
        type: "DATABASE_CONNECTION",
        severity: "CRITICAL",
        message: "Cannot connect to database",
        category: "system",
      });
    }

    if (!systemChecks.diskSpace) {
      decision.blockers.push({
        type: "INSUFFICIENT_DISK_SPACE",
        severity: "CRITICAL",
        message: "Insufficient disk space for migration",
        category: "system",
      });
    }

    if (!systemChecks.backupStatus) {
      decision.warnings.push({
        type: "BACKUP_STATUS",
        severity: "WARNING",
        message: "Backup status could not be verified",
        category: "system",
      });
    }

    decision.systemChecks = systemChecks;
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(results, decision) {
    let confidence = 100;

    // Reduce confidence for each blocker
    confidence -= decision.blockers.length * 25;

    // Reduce confidence for warnings
    confidence -= decision.warnings.length * 5;

    // Adjust based on data quality score
    const dqScore = results.dataQuality.overallScore;
    if (dqScore < 95) {
      confidence -= (95 - dqScore) * 2;
    }

    // Ensure confidence is within bounds
    confidence = Math.max(0, Math.min(100, confidence));

    decision.confidence = Math.round(confidence);
  }

  /**
   * Generate recommendations for fixes
   */
  generateRecommendations(results, decision) {
    const fixes = [];

    // Collect all recommendations from validators
    [
      ...(results.referentialIntegrity.recommendations || []),
      ...(results.uniqueConstraints.recommendations || []),
      ...(results.requiredFields.recommendations || []),
      ...(results.dataQuality.recommendations || []),
    ].forEach((rec) => {
      fixes.push({
        type: rec.type,
        priority: rec.priority,
        action: rec.action,
        category: rec.category || "data",
        automated: rec.sql ? true : false,
        sql: rec.sql,
      });
    });

    // Sort by priority
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    fixes.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    decision.fixes = fixes;
  }

  /**
   * Make final decision
   */
  makeFinalDecision(decision) {
    if (decision.blockers.length > 0) {
      const criticalBlockers = decision.blockers.filter(
        (b) => b.severity === "CRITICAL",
      );
      if (criticalBlockers.length > 0) {
        decision.recommendation = "BLOCK";
      } else {
        decision.recommendation = "DELAY";
      }
    } else if (decision.warnings.length > 0) {
      decision.recommendation = "PROCEED_WITH_CAUTION";
    } else {
      decision.recommendation = "GO";
    }

    // Generate summary
    decision.summary = {
      totalBlockers: decision.blockers.length,
      totalWarnings: decision.warnings.length,
      totalFixes: decision.fixes.length,
      automatedFixes: decision.fixes.filter((f) => f.automated).length,
      recommendation: decision.recommendation,
      confidence: decision.confidence,
    };
  }

  /**
   * Generate final comprehensive report
   */
  generateFinalReport(results, decision, startTime) {
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      decision: decision.recommendation,
      confidence: decision.confidence,
      summary: decision.summary,
      validationResults: {
        referentialIntegrity: results.referentialIntegrity?.summary || {},
        uniqueConstraints: results.uniqueConstraints?.summary || {},
        requiredFields: results.requiredFields?.summary || {},
        dataQuality: {
          overallScore: results.dataQuality?.overallScore || 0,
          qualityLevel: results.dataQuality?.qualityLevel || "UNKNOWN",
        },
      },
      blockers: decision.blockers,
      warnings: decision.warnings,
      recommendations: decision.fixes,
      systemReadiness: decision.systemChecks,
      detailedResults: results,
    };

    // Print decision summary
    this.printDecisionSummary(report);

    return report;
  }

  /**
   * Print decision summary to console
   */
  printDecisionSummary(report) {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 MIGRATION GO/NO-GO DECISION REPORT");
    console.log("=".repeat(60));

    const decision = report.decision;
    const emoji = {
      GO: "✅",
      PROCEED_WITH_CAUTION: "⚠️",
      DELAY: "⏸️",
      BLOCK: "🚫",
    }[decision];

    console.log(`\n${emoji} RECOMMENDATION: ${decision}`);
    console.log(`🎯 CONFIDENCE: ${report.confidence}%`);
    console.log(
      `⏱️ EVALUATION TIME: ${(report.executionTime / 1000).toFixed(1)}s`,
    );

    console.log("\n📊 VALIDATION SUMMARY:");
    console.log(`   Blockers: ${report.summary.totalBlockers}`);
    console.log(`   Warnings: ${report.summary.totalWarnings}`);
    console.log(
      `   Fixes Available: ${report.summary.automatedFixes}/${report.summary.totalFixes}`,
    );
    console.log(
      `   Data Quality: ${report.validationResults.dataQuality.overallScore.toFixed(1)}%`,
    );

    if (report.blockers.length > 0) {
      console.log("\n🚫 CRITICAL BLOCKERS:");
      report.blockers.forEach((blocker, i) => {
        console.log(`   ${i + 1}. ${blocker.message}`);
      });
    }

    if (report.warnings.length > 0) {
      console.log("\n⚠️ WARNINGS:");
      report.warnings.slice(0, 3).forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.message}`);
      });
      if (report.warnings.length > 3) {
        console.log(`   ... and ${report.warnings.length - 3} more warnings`);
      }
    }

    const nextSteps = this.getNextSteps(decision);
    console.log("\n📋 NEXT STEPS:");
    nextSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });

    console.log("\n" + "=".repeat(60));
  }

  /**
   * Get next steps based on decision
   */
  getNextSteps(decision) {
    switch (decision) {
      case "GO":
        return [
          "Proceed with migration execution",
          "Ensure backup is created",
          "Monitor migration progress",
          "Validate results post-migration",
        ];
      case "PROCEED_WITH_CAUTION":
        return [
          "Review warnings and assess risk tolerance",
          "Apply automated fixes if available",
          "Create backup and prepare rollback plan",
          "Proceed with migration if risks are acceptable",
        ];
      case "DELAY":
        return [
          "Fix high-severity data issues",
          "Apply automated fixes from recommendations",
          "Re-run validation after fixes",
          "Schedule new migration window",
        ];
      case "BLOCK":
        return [
          "Fix critical blockers before proceeding",
          "Review system readiness issues",
          "Apply all available automated fixes",
          "Consider manual data cleanup",
          "Re-run complete validation",
        ];
      default:
        return ["Review validation results and try again"];
    }
  }
}

// CLI execution
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables",
    );
    process.exit(1);
  }

  const decision = new MigrationGoNoGoDecision(supabaseUrl, supabaseKey);

  try {
    const report = await decision.evaluateMigrationReadiness();

    // Write detailed report to file
    const fs = await import("fs");
    const reportPath = `/tmp/migration-go-no-go-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    const exitCodes = {
      GO: 0,
      PROCEED_WITH_CAUTION: 0,
      DELAY: 1,
      BLOCK: 2,
    };

    process.exit(exitCodes[report.decision] || 3);
  } catch (error) {
    console.error("❌ Go/No-Go evaluation failed:", error.message);
    process.exit(3);
  }
}
