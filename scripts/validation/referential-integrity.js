/**
 * Referential Integrity Validation for CRM Migration
 *
 * Validates all foreign key relationships before migration to ensure
 * no orphaned records or broken references exist.
 */

import { createClient } from "@supabase/supabase-js";

export class ReferentialIntegrityValidator {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.violations = [];
    this.warnings = [];
  }

  /**
   * Run all referential integrity checks
   */
  async validateAll() {
    console.log("🔗 Starting referential integrity validation...");

    const checks = [
      this.validateContactCompanyReferences,
      this.validateDealCompanyReferences,
      this.validateDealContactReferences,
      this.validateContactNoteReferences,
      this.validateDealNoteReferences,
      this.validateTaskReferences,
      this.validateTagReferences,
    ];

    for (const check of checks) {
      try {
        await check.call(this);
      } catch (error) {
        this.violations.push({
          type: "SYSTEM_ERROR",
          entity: check.name,
          severity: "CRITICAL",
          message: `Validation check failed: ${error.message}`,
          count: 1,
        });
      }
    }

    return this.generateReport();
  }

  /**
   * Validate contacts have valid company references
   */
  async validateContactCompanyReferences() {
    const { data: orphanedContacts, error } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id")
      .not("company_id", "is", null)
      .filter("companies.id", "is", null)
      .leftJoin("companies", "company_id", "id");

    if (error) throw error;

    if (orphanedContacts?.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "contacts",
        severity: "HIGH",
        message: `Contacts reference non-existent companies`,
        count: orphanedContacts.length,
        samples: orphanedContacts
          .slice(0, 5)
          .map(
            (c) =>
              `Contact ${c.first_name} ${c.last_name} (ID: ${c.id}) → Company ID: ${c.company_id}`,
          ),
      });
    }

    // Check for contacts without company assignments
    const { data: unassignedContacts, error: unassignedError } =
      await this.supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .is("company_id", null);

    if (unassignedError) throw unassignedError;

    if (unassignedContacts?.length > 0) {
      this.warnings.push({
        type: "MISSING_ASSIGNMENT",
        entity: "contacts",
        severity: "MEDIUM",
        message: `Contacts without company assignment (will need manual assignment post-migration)`,
        count: unassignedContacts.length,
        samples: unassignedContacts
          .slice(0, 5)
          .map((c) => `Contact ${c.first_name} ${c.last_name} (ID: ${c.id})`),
      });
    }
  }

  /**
   * Validate deals have valid company references
   */
  async validateDealCompanyReferences() {
    // Use raw SQL for complex join validation
    const { data: orphanedDeals, error } = await this.supabase.rpc(
      "check_orphaned_deals",
      {},
    );

    if (error) throw error;

    if (orphanedDeals?.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "deals",
        severity: "CRITICAL",
        message: `Deals reference non-existent companies`,
        count: orphanedDeals.length,
        samples: orphanedDeals
          .slice(0, 5)
          .map(
            (d) =>
              `Deal "${d.name}" (ID: ${d.id}) → Company ID: ${d.company_id}`,
          ),
      });
    }
  }

  /**
   * Validate deals have valid contact references in contact_ids array
   */
  async validateDealContactReferences() {
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select("id, name, contact_ids");

    if (error) throw error;

    const invalidContactRefs = [];

    for (const deal of deals || []) {
      if (!deal.contact_ids || !Array.isArray(deal.contact_ids)) continue;

      for (const contactId of deal.contact_ids) {
        const { data: contact, error: contactError } = await this.supabase
          .from("contacts")
          .select("id")
          .eq("id", contactId)
          .single();

        if (contactError || !contact) {
          invalidContactRefs.push({
            dealId: deal.id,
            dealName: deal.name,
            contactId: contactId,
          });
        }
      }
    }

    if (invalidContactRefs.length > 0) {
      this.violations.push({
        type: "INVALID_ARRAY_REFERENCE",
        entity: "deals.contact_ids",
        severity: "HIGH",
        message: `Deals reference non-existent contacts in contact_ids array`,
        count: invalidContactRefs.length,
        samples: invalidContactRefs
          .slice(0, 5)
          .map(
            (ref) =>
              `Deal "${ref.dealName}" (ID: ${ref.dealId}) → Contact ID: ${ref.contactId}`,
          ),
      });
    }
  }

  /**
   * Validate contact notes have valid references
   */
  async validateContactNoteReferences() {
    const { data: orphanedNotes, error } = await this.supabase.rpc(
      "check_orphaned_contact_notes",
      {},
    );

    if (error) throw error;

    if (orphanedNotes?.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "contactNotes",
        severity: "MEDIUM",
        message: `Contact notes reference non-existent contacts`,
        count: orphanedNotes.length,
        samples: orphanedNotes
          .slice(0, 5)
          .map(
            (note) => `Note (ID: ${note.id}) → Contact ID: ${note.contact_id}`,
          ),
      });
    }
  }

  /**
   * Validate deal notes have valid references
   */
  async validateDealNoteReferences() {
    const { data: orphanedNotes, error } = await this.supabase.rpc(
      "check_orphaned_deal_notes",
      {},
    );

    if (error) throw error;

    if (orphanedNotes?.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "dealNotes",
        severity: "MEDIUM",
        message: `Deal notes reference non-existent deals`,
        count: orphanedNotes.length,
        samples: orphanedNotes
          .slice(0, 5)
          .map((note) => `Note (ID: ${note.id}) → Deal ID: ${note.deal_id}`),
      });
    }
  }

  /**
   * Validate tasks have valid references
   */
  async validateTaskReferences() {
    const { data: tasks, error } = await this.supabase
      .from("tasks")
      .select("id, type, contact_id, deal_id");

    if (error) throw error;

    const invalidTasks = [];

    for (const task of tasks || []) {
      if (task.contact_id) {
        const { data: contact, error: contactError } = await this.supabase
          .from("contacts")
          .select("id")
          .eq("id", task.contact_id)
          .single();

        if (contactError || !contact) {
          invalidTasks.push({
            taskId: task.id,
            type: task.type,
            refType: "contact",
            refId: task.contact_id,
          });
        }
      }

      if (task.deal_id) {
        const { data: deal, error: dealError } = await this.supabase
          .from("deals")
          .select("id")
          .eq("id", task.deal_id)
          .single();

        if (dealError || !deal) {
          invalidTasks.push({
            taskId: task.id,
            type: task.type,
            refType: "deal",
            refId: task.deal_id,
          });
        }
      }
    }

    if (invalidTasks.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "tasks",
        severity: "MEDIUM",
        message: `Tasks reference non-existent contacts or deals`,
        count: invalidTasks.length,
        samples: invalidTasks
          .slice(0, 5)
          .map(
            (task) =>
              `Task (ID: ${task.taskId}) → ${task.refType} ID: ${task.refId}`,
          ),
      });
    }
  }

  /**
   * Validate tag relationships
   */
  async validateTagReferences() {
    // Check for tag usage in entities that might not exist
    const { data: tags, error } = await this.supabase
      .from("tags")
      .select("id, name, entity_type, entity_id");

    if (error) throw error;

    const invalidTagRefs = [];

    for (const tag of tags || []) {
      if (!tag.entity_type || !tag.entity_id) continue;

      let exists = false;
      switch (tag.entity_type) {
        case "contact":
          const { data: contact } = await this.supabase
            .from("contacts")
            .select("id")
            .eq("id", tag.entity_id)
            .single();
          exists = !!contact;
          break;
        case "deal":
          const { data: deal } = await this.supabase
            .from("deals")
            .select("id")
            .eq("id", tag.entity_id)
            .single();
          exists = !!deal;
          break;
        case "company":
          const { data: company } = await this.supabase
            .from("companies")
            .select("id")
            .eq("id", tag.entity_id)
            .single();
          exists = !!company;
          break;
      }

      if (!exists) {
        invalidTagRefs.push({
          tagId: tag.id,
          tagName: tag.name,
          entityType: tag.entity_type,
          entityId: tag.entity_id,
        });
      }
    }

    if (invalidTagRefs.length > 0) {
      this.violations.push({
        type: "ORPHANED_RECORD",
        entity: "tags",
        severity: "LOW",
        message: `Tags reference non-existent entities`,
        count: invalidTagRefs.length,
        samples: invalidTagRefs
          .slice(0, 5)
          .map(
            (tag) =>
              `Tag "${tag.tagName}" (ID: ${tag.tagId}) → ${tag.entityType} ID: ${tag.entityId}`,
          ),
      });
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const totalViolations = this.violations.length;
    const totalWarnings = this.warnings.length;
    const criticalCount = this.violations.filter(
      (v) => v.severity === "CRITICAL",
    ).length;
    const highCount = this.violations.filter(
      (v) => v.severity === "HIGH",
    ).length;

    const report = {
      status:
        criticalCount > 0 ? "FAILED" : highCount > 0 ? "WARNING" : "PASSED",
      summary: {
        totalViolations,
        totalWarnings,
        criticalCount,
        highCount,
        mediumCount: this.violations.filter((v) => v.severity === "MEDIUM")
          .length,
        lowCount: this.violations.filter((v) => v.severity === "LOW").length,
      },
      violations: this.violations,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };

    console.log("📊 Referential integrity validation complete");
    console.log(`Status: ${report.status}`);
    console.log(`Violations: ${totalViolations}, Warnings: ${totalWarnings}`);

    return report;
  }

  /**
   * Generate fix recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (
      this.violations.some(
        (v) => v.entity === "contacts" && v.type === "ORPHANED_RECORD",
      )
    ) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action:
          "Remove or reassign contacts with invalid company references before migration",
        sql: `UPDATE contacts SET company_id = NULL WHERE company_id NOT IN (SELECT id FROM companies);`,
      });
    }

    if (
      this.violations.some(
        (v) => v.entity === "deals" && v.type === "ORPHANED_RECORD",
      )
    ) {
      recommendations.push({
        type: "BLOCK",
        priority: "CRITICAL",
        action:
          "Migration cannot proceed with orphaned deals. Fix company references first.",
        sql: `-- Review and fix these deals manually or delete if invalid`,
      });
    }

    if (this.violations.some((v) => v.entity === "deals.contact_ids")) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action:
          "Clean invalid contact references from deals.contact_ids arrays",
        sql: `-- Custom cleanup script needed for JSONB array cleaning`,
      });
    }

    return recommendations;
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

  const validator = new ReferentialIntegrityValidator(supabaseUrl, supabaseKey);

  try {
    const report = await validator.validateAll();

    if (report.status === "FAILED") {
      console.error("❌ Referential integrity validation failed");
      process.exit(1);
    } else if (report.status === "WARNING") {
      console.warn("⚠️ Referential integrity validation passed with warnings");
      process.exit(0);
    } else {
      console.log("✅ Referential integrity validation passed");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}
