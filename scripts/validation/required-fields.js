/**
 * Required Fields Validation for CRM Migration
 *
 * Verifies that all records have the required fields populated
 * for successful migration to the new schema.
 */

import { createClient } from "@supabase/supabase-js";

export class RequiredFieldsValidator {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.violations = [];
    this.warnings = [];
  }

  /**
   * Run all required field checks
   */
  async validateAll() {
    console.log("✅ Starting required fields validation...");

    const checks = [
      this.validateCompanyRequiredFields,
      this.validateContactRequiredFields,
      this.validateDealRequiredFields,
      this.validateContactNoteRequiredFields,
      this.validateDealNoteRequiredFields,
      this.validateTaskRequiredFields,
      this.validateTagRequiredFields,
      this.validateMigrationSpecificRequirements,
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
   * Validate company required fields
   */
  async validateCompanyRequiredFields() {
    // Check for companies without names
    const { data: companiesWithoutNames, error: nameError } =
      await this.supabase
        .from("companies")
        .select("id, name")
        .or("name.is.null,name.eq.");

    if (nameError) throw nameError;

    if (companiesWithoutNames?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "companies",
        field: "name",
        severity: "CRITICAL",
        message: `Companies without names (required for migration)`,
        count: companiesWithoutNames.length,
        samples: companiesWithoutNames
          .slice(0, 5)
          .map(
            (c) =>
              `Company ID: ${c.id} has ${c.name ? `name: "${c.name}"` : "NULL name"}`,
          ),
        fixable: true,
      });
    }

    // Check for companies without valid sectors (required for new schema)
    const validSectors = [
      "Technology",
      "Healthcare",
      "Finance",
      "Manufacturing",
      "Retail",
      "Other",
    ];

    const { data: companiesWithInvalidSectors, error: sectorError } =
      await this.supabase
        .from("companies")
        .select("id, name, sector")
        .or(
          `sector.is.null,sector.eq.,sector.not.in.(${validSectors.map((s) => `"${s}"`).join(",")})`,
        );

    if (sectorError) throw sectorError;

    if (companiesWithInvalidSectors?.length > 0) {
      this.warnings.push({
        type: "INVALID_SECTOR",
        entity: "companies",
        field: "sector",
        severity: "MEDIUM",
        message: `Companies with missing or invalid sectors (will default to 'Other')`,
        count: companiesWithInvalidSectors.length,
        samples: companiesWithInvalidSectors
          .slice(0, 5)
          .map(
            (c) =>
              `Company "${c.name}" (ID: ${c.id}) has sector: ${c.sector || "NULL"}`,
          ),
        fixable: true,
      });
    }

    // Check for companies without created_at timestamps
    const { data: companiesWithoutTimestamp, error: timestampError } =
      await this.supabase
        .from("companies")
        .select("id, name, created_at")
        .is("created_at", null);

    if (timestampError) throw timestampError;

    if (companiesWithoutTimestamp?.length > 0) {
      this.warnings.push({
        type: "MISSING_TIMESTAMP",
        entity: "companies",
        field: "created_at",
        severity: "LOW",
        message: `Companies without created_at timestamps (will use current time)`,
        count: companiesWithoutTimestamp.length,
        samples: companiesWithoutTimestamp
          .slice(0, 5)
          .map((c) => `Company "${c.name}" (ID: ${c.id})`),
        fixable: true,
      });
    }
  }

  /**
   * Validate contact required fields
   */
  async validateContactRequiredFields() {
    // Check for contacts without first_name or last_name
    const { data: contactsWithoutNames, error: nameError } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id")
      .or("first_name.is.null,first_name.eq.,last_name.is.null,last_name.eq.");

    if (nameError) throw nameError;

    if (contactsWithoutNames?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "contacts",
        field: "name",
        severity: "HIGH",
        message: `Contacts without first_name or last_name (required for migration)`,
        count: contactsWithoutNames.length,
        samples: contactsWithoutNames
          .slice(0, 5)
          .map(
            (c) =>
              `Contact ID: ${c.id} - First: "${c.first_name || ""}" Last: "${c.last_name || ""}" (Company: ${c.company_id})`,
          ),
        fixable: true,
      });
    }

    // Check for contacts without any contact information (email or phone)
    const { data: contacts, error: contactsError } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, company_id");

    if (contactsError) throw contactsError;

    const contactsWithoutContactInfo =
      contacts?.filter((contact) => {
        const hasEmail =
          contact.email &&
          Array.isArray(contact.email) &&
          contact.email.length > 0;
        const hasPhone =
          contact.phone &&
          Array.isArray(contact.phone) &&
          contact.phone.length > 0;
        return !hasEmail && !hasPhone;
      }) || [];

    if (contactsWithoutContactInfo.length > 0) {
      this.warnings.push({
        type: "MISSING_CONTACT_INFO",
        entity: "contacts",
        field: "email_or_phone",
        severity: "MEDIUM",
        message: `Contacts without email or phone (reduces data quality)`,
        count: contactsWithoutContactInfo.length,
        samples: contactsWithoutContactInfo
          .slice(0, 5)
          .map((c) => `Contact "${c.first_name} ${c.last_name}" (ID: ${c.id})`),
        fixable: true,
      });
    }

    // Check for contacts without company assignment (critical for new schema)
    const { data: contactsWithoutCompany, error: companyError } =
      await this.supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .is("company_id", null);

    if (companyError) throw companyError;

    if (contactsWithoutCompany?.length > 0) {
      this.violations.push({
        type: "MISSING_COMPANY_ASSIGNMENT",
        entity: "contacts",
        field: "company_id",
        severity: "HIGH",
        message: `Contacts without company assignment (required for new multi-org schema)`,
        count: contactsWithoutCompany.length,
        samples: contactsWithoutCompany
          .slice(0, 5)
          .map((c) => `Contact "${c.first_name} ${c.last_name}" (ID: ${c.id})`),
        fixable: true,
      });
    }
  }

  /**
   * Validate deal required fields
   */
  async validateDealRequiredFields() {
    // Check for deals without names
    const { data: dealsWithoutNames, error: nameError } = await this.supabase
      .from("deals")
      .select("id, name, company_id")
      .or("name.is.null,name.eq.");

    if (nameError) throw nameError;

    if (dealsWithoutNames?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "deals",
        field: "name",
        severity: "CRITICAL",
        message: `Deals without names (required for opportunities)`,
        count: dealsWithoutNames.length,
        samples: dealsWithoutNames
          .slice(0, 5)
          .map((d) => `Deal ID: ${d.id} (Company: ${d.company_id})`),
        fixable: true,
      });
    }

    // Check for deals without company assignment
    const { data: dealsWithoutCompany, error: companyError } =
      await this.supabase
        .from("deals")
        .select("id, name")
        .is("company_id", null);

    if (companyError) throw companyError;

    if (dealsWithoutCompany?.length > 0) {
      this.violations.push({
        type: "MISSING_COMPANY_ASSIGNMENT",
        entity: "deals",
        field: "company_id",
        severity: "CRITICAL",
        message: `Deals without company assignment (required for opportunities)`,
        count: dealsWithoutCompany.length,
        samples: dealsWithoutCompany
          .slice(0, 5)
          .map((d) => `Deal "${d.name}" (ID: ${d.id})`),
        fixable: true,
      });
    }

    // Check for deals with invalid stages
    const validStages = [
      "lead",
      "qualified",
      "proposal",
      "negotiation",
      "closed-won",
      "closed-lost",
    ];

    const { data: dealsWithInvalidStages, error: stageError } =
      await this.supabase
        .from("deals")
        .select("id, name, stage")
        .not("stage", "in", `(${validStages.map((s) => `"${s}"`).join(",")})`);

    if (stageError) throw stageError;

    if (dealsWithInvalidStages?.length > 0) {
      this.warnings.push({
        type: "INVALID_STAGE",
        entity: "deals",
        field: "stage",
        severity: "MEDIUM",
        message: `Deals with invalid stages (will default to 'lead')`,
        count: dealsWithInvalidStages.length,
        samples: dealsWithInvalidStages
          .slice(0, 5)
          .map((d) => `Deal "${d.name}" (ID: ${d.id}) has stage: ${d.stage}`),
        fixable: true,
      });
    }

    // Check for deals with missing expected_revenue
    const { data: dealsWithoutRevenue, error: revenueError } =
      await this.supabase
        .from("deals")
        .select("id, name, expected_revenue")
        .or("expected_revenue.is.null,expected_revenue.lte.0");

    if (revenueError) throw revenueError;

    if (dealsWithoutRevenue?.length > 0) {
      this.warnings.push({
        type: "MISSING_REVENUE",
        entity: "deals",
        field: "expected_revenue",
        severity: "LOW",
        message: `Deals without expected revenue (affects reporting)`,
        count: dealsWithoutRevenue.length,
        samples: dealsWithoutRevenue
          .slice(0, 5)
          .map(
            (d) =>
              `Deal "${d.name}" (ID: ${d.id}) has revenue: ${d.expected_revenue}`,
          ),
        fixable: false,
      });
    }
  }

  /**
   * Validate contact note required fields
   */
  async validateContactNoteRequiredFields() {
    const { data: notesWithoutText, error } = await this.supabase
      .from("contactNotes")
      .select("id, contact_id, text")
      .or("text.is.null,text.eq.");

    if (error) throw error;

    if (notesWithoutText?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "contactNotes",
        field: "text",
        severity: "MEDIUM",
        message: `Contact notes without text content`,
        count: notesWithoutText.length,
        samples: notesWithoutText
          .slice(0, 5)
          .map((n) => `Note ID: ${n.id} for Contact: ${n.contact_id}`),
        fixable: true,
      });
    }
  }

  /**
   * Validate deal note required fields
   */
  async validateDealNoteRequiredFields() {
    const { data: notesWithoutText, error } = await this.supabase
      .from("dealNotes")
      .select("id, deal_id, text")
      .or("text.is.null,text.eq.");

    if (error) throw error;

    if (notesWithoutText?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "dealNotes",
        field: "text",
        severity: "MEDIUM",
        message: `Deal notes without text content`,
        count: notesWithoutText.length,
        samples: notesWithoutText
          .slice(0, 5)
          .map((n) => `Note ID: ${n.id} for Deal: ${n.deal_id}`),
        fixable: true,
      });
    }
  }

  /**
   * Validate task required fields
   */
  async validateTaskRequiredFields() {
    // Check for tasks without type
    const { data: tasksWithoutType, error: typeError } = await this.supabase
      .from("tasks")
      .select("id, type, contact_id, deal_id")
      .or("type.is.null,type.eq.");

    if (typeError) throw typeError;

    if (tasksWithoutType?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "tasks",
        field: "type",
        severity: "MEDIUM",
        message: `Tasks without type (required for activities migration)`,
        count: tasksWithoutType.length,
        samples: tasksWithoutType
          .slice(0, 5)
          .map(
            (t) =>
              `Task ID: ${t.id} (Contact: ${t.contact_id}, Deal: ${t.deal_id})`,
          ),
        fixable: true,
      });
    }

    // Check for tasks without any assignment (contact_id or deal_id)
    const { data: unassignedTasks, error: assignmentError } =
      await this.supabase
        .from("tasks")
        .select("id, type, contact_id, deal_id")
        .is("contact_id", null)
        .is("deal_id", null);

    if (assignmentError) throw assignmentError;

    if (unassignedTasks?.length > 0) {
      this.warnings.push({
        type: "UNASSIGNED_TASK",
        entity: "tasks",
        field: "contact_id_or_deal_id",
        severity: "LOW",
        message: `Tasks without contact or deal assignment`,
        count: unassignedTasks.length,
        samples: unassignedTasks
          .slice(0, 5)
          .map((t) => `Task "${t.type}" (ID: ${t.id})`),
        fixable: true,
      });
    }
  }

  /**
   * Validate tag required fields
   */
  async validateTagRequiredFields() {
    const { data: tagsWithoutName, error } = await this.supabase
      .from("tags")
      .select("id, name, entity_type, entity_id")
      .or("name.is.null,name.eq.");

    if (error) throw error;

    if (tagsWithoutName?.length > 0) {
      this.violations.push({
        type: "MISSING_REQUIRED_FIELD",
        entity: "tags",
        field: "name",
        severity: "LOW",
        message: `Tags without names`,
        count: tagsWithoutName.length,
        samples: tagsWithoutName
          .slice(0, 5)
          .map((t) => `Tag ID: ${t.id} (${t.entity_type}:${t.entity_id})`),
        fixable: true,
      });
    }
  }

  /**
   * Validate migration-specific requirements
   */
  async validateMigrationSpecificRequirements() {
    // Check that all companies have at least one contact for the new schema
    const { data: companiesWithoutContacts, error } = await this.supabase.rpc(
      "find_companies_without_contacts",
      {},
    );

    if (error) throw error;

    if (companiesWithoutContacts?.length > 0) {
      this.warnings.push({
        type: "COMPANY_WITHOUT_CONTACTS",
        entity: "companies",
        field: "contacts_relationship",
        severity: "MEDIUM",
        message: `Companies without any contacts (may affect deal creation post-migration)`,
        count: companiesWithoutContacts.length,
        samples: companiesWithoutContacts
          .slice(0, 5)
          .map((c) => `Company "${c.name}" (ID: ${c.id})`),
        fixable: true,
      });
    }

    // Check for deals without contact assignments that will need opportunity participants
    const { data: deals, error: dealsError } = await this.supabase
      .from("deals")
      .select("id, name, contact_ids");

    if (dealsError) throw dealsError;

    const dealsWithoutContacts =
      deals?.filter(
        (deal) =>
          !deal.contact_ids ||
          !Array.isArray(deal.contact_ids) ||
          deal.contact_ids.length === 0,
      ) || [];

    if (dealsWithoutContacts.length > 0) {
      this.warnings.push({
        type: "DEAL_WITHOUT_CONTACTS",
        entity: "deals",
        field: "contact_ids",
        severity: "MEDIUM",
        message: `Deals without contact assignments (will need opportunity participants post-migration)`,
        count: dealsWithoutContacts.length,
        samples: dealsWithoutContacts
          .slice(0, 5)
          .map((d) => `Deal "${d.name}" (ID: ${d.id})`),
        fixable: true,
      });
    }

    // Check for data consistency between contact.company_id and deal.company_id for shared contacts
    const { data: inconsistentDeals, error: consistencyError } =
      await this.supabase.rpc("find_deal_contact_company_mismatches", {});

    if (consistencyError) throw consistencyError;

    if (inconsistentDeals?.length > 0) {
      this.warnings.push({
        type: "COMPANY_MISMATCH",
        entity: "deals_contacts",
        field: "company_consistency",
        severity: "HIGH",
        message: `Deals with contacts from different companies (may indicate data quality issues)`,
        count: inconsistentDeals.length,
        samples: inconsistentDeals
          .slice(0, 5)
          .map(
            (d) =>
              `Deal "${d.deal_name}" (Company: ${d.deal_company_id}) has contact from Company: ${d.contact_company_id}`,
          ),
        fixable: false,
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
    const fixableCount = this.violations.filter((v) => v.fixable).length;

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
        fixableCount,
      },
      violations: this.violations,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };

    console.log("📊 Required fields validation complete");
    console.log(`Status: ${report.status}`);
    console.log(`Violations: ${totalViolations}, Warnings: ${totalWarnings}`);
    console.log(`Fixable violations: ${fixableCount}`);

    return report;
  }

  /**
   * Generate fix recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (
      this.violations.some(
        (v) => v.field === "name" && v.entity === "companies",
      )
    ) {
      recommendations.push({
        type: "BLOCK",
        priority: "CRITICAL",
        action: "Companies without names must be fixed before migration",
        sql: `UPDATE companies SET name = CONCAT('Company ', id::text) WHERE name IS NULL OR name = '';`,
      });
    }

    if (
      this.violations.some((v) => v.field === "name" && v.entity === "contacts")
    ) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action: "Contacts without names should be fixed or removed",
        sql: `UPDATE contacts SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';`,
      });
    }

    if (this.violations.some((v) => v.field === "company_id")) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action: "Assign unassigned contacts and deals to appropriate companies",
        sql: `-- Manual review needed to assign correct companies`,
      });
    }

    if (this.warnings.some((w) => w.field === "sector")) {
      recommendations.push({
        type: "FIX",
        priority: "MEDIUM",
        action: "Set default sector for companies with missing sectors",
        sql: `UPDATE companies SET sector = 'Other' WHERE sector IS NULL OR sector = '';`,
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

  const validator = new RequiredFieldsValidator(supabaseUrl, supabaseKey);

  try {
    const report = await validator.validateAll();

    if (report.status === "FAILED") {
      console.error("❌ Required fields validation failed");
      process.exit(1);
    } else if (report.status === "WARNING") {
      console.warn("⚠️ Required fields validation passed with warnings");
      process.exit(0);
    } else {
      console.log("✅ Required fields validation passed");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}
