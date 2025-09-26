/**
 * Unique Constraint Validation for CRM Migration
 *
 * Detects potential unique constraint conflicts that would occur
 * after the migration to the new schema.
 */

import { createClient } from "@supabase/supabase-js";

export class UniqueConstraintValidator {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.conflicts = [];
    this.warnings = [];
  }

  /**
   * Run all unique constraint conflict checks
   */
  async validateAll() {
    console.log("🔍 Starting unique constraint validation...");

    const checks = [
      this.validateCompanyNameUniqueness,
      this.validateContactEmailUniqueness,
      this.validateContactPhoneUniqueness,
      this.validateOpportunityNameWithinCompany,
      this.validateContactOrganizationCombinations,
      this.validateTagNameUniqueness,
      this.validateUserEmailUniqueness,
    ];

    for (const check of checks) {
      try {
        await check.call(this);
      } catch (error) {
        this.conflicts.push({
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
   * Check for duplicate company names (case-insensitive)
   */
  async validateCompanyNameUniqueness() {
    const { data: duplicates, error } = await this.supabase.rpc(
      "find_duplicate_company_names",
      {},
    );

    if (error) throw error;

    if (duplicates?.length > 0) {
      this.conflicts.push({
        type: "DUPLICATE_COMPANY_NAME",
        entity: "companies",
        severity: "HIGH",
        message: `Companies with duplicate names (case-insensitive) will cause unique constraint violations`,
        count: duplicates.length,
        samples: duplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `"${dup.name}" appears ${dup.count} times (IDs: ${dup.ids.join(", ")})`,
          ),
        fixable: true,
      });
    }
  }

  /**
   * Check for duplicate contact emails within organizations
   */
  async validateContactEmailUniqueness() {
    // Check primary emails
    const { data: emailDuplicates, error } = await this.supabase.rpc(
      "find_duplicate_contact_emails",
      {},
    );

    if (error) throw error;

    if (emailDuplicates?.length > 0) {
      this.conflicts.push({
        type: "DUPLICATE_CONTACT_EMAIL",
        entity: "contacts",
        severity: "MEDIUM",
        message: `Contacts with duplicate email addresses within the same organization`,
        count: emailDuplicates.length,
        samples: emailDuplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `Email "${dup.email}" in company ${dup.company_id} (Contact IDs: ${dup.contact_ids.join(", ")})`,
          ),
        fixable: true,
      });
    }

    // Check for emails in JSONB array that might conflict
    const { data: contacts, error: contactsError } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id, email");

    if (contactsError) throw contactsError;

    const emailConflicts = new Map();

    for (const contact of contacts || []) {
      if (!contact.email || !Array.isArray(contact.email)) continue;

      for (const email of contact.email) {
        if (!email || typeof email !== "string") continue;

        const key = `${contact.company_id}:${email.toLowerCase()}`;
        if (!emailConflicts.has(key)) {
          emailConflicts.set(key, []);
        }
        emailConflicts.get(key).push({
          contactId: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: email,
        });
      }
    }

    const jsonbEmailDuplicates = Array.from(emailConflicts.entries())
      .filter(([key, contacts]) => contacts.length > 1)
      .map(([key, contacts]) => {
        const [companyId, email] = key.split(":");
        return {
          email,
          companyId,
          contacts,
        };
      });

    if (jsonbEmailDuplicates.length > 0) {
      this.conflicts.push({
        type: "DUPLICATE_JSONB_EMAIL",
        entity: "contacts.email",
        severity: "MEDIUM",
        message: `Contacts with duplicate emails in JSONB arrays within same organization`,
        count: jsonbEmailDuplicates.length,
        samples: jsonbEmailDuplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `Email "${dup.email}" in company ${dup.companyId} (${dup.contacts.length} contacts)`,
          ),
        fixable: true,
      });
    }
  }

  /**
   * Check for duplicate contact phone numbers within organizations
   */
  async validateContactPhoneUniqueness() {
    const { data: contacts, error } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id, phone");

    if (error) throw error;

    const phoneConflicts = new Map();

    for (const contact of contacts || []) {
      if (!contact.phone || !Array.isArray(contact.phone)) continue;

      for (const phone of contact.phone) {
        if (!phone || typeof phone !== "string") continue;

        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, "");
        if (normalizedPhone.length < 10) continue; // Skip invalid phones

        const key = `${contact.company_id}:${normalizedPhone}`;
        if (!phoneConflicts.has(key)) {
          phoneConflicts.set(key, []);
        }
        phoneConflicts.get(key).push({
          contactId: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          phone: phone,
        });
      }
    }

    const phoneDuplicates = Array.from(phoneConflicts.entries())
      .filter(([key, contacts]) => contacts.length > 1)
      .map(([key, contacts]) => {
        const [companyId, phone] = key.split(":");
        return {
          phone,
          companyId,
          contacts,
        };
      });

    if (phoneDuplicates.length > 0) {
      this.warnings.push({
        type: "DUPLICATE_PHONE",
        entity: "contacts.phone",
        severity: "LOW",
        message: `Contacts with duplicate phone numbers within same organization`,
        count: phoneDuplicates.length,
        samples: phoneDuplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `Phone "${dup.phone}" in company ${dup.companyId} (${dup.contacts.length} contacts)`,
          ),
        fixable: true,
      });
    }
  }

  /**
   * Check for duplicate opportunity names within the same company
   */
  async validateOpportunityNameWithinCompany() {
    const { data: duplicates, error } = await this.supabase.rpc(
      "find_duplicate_deal_names",
      {},
    );

    if (error) throw error;

    if (duplicates?.length > 0) {
      this.conflicts.push({
        type: "DUPLICATE_OPPORTUNITY_NAME",
        entity: "opportunities",
        severity: "MEDIUM",
        message: `Deals/Opportunities with duplicate names within same company`,
        count: duplicates.length,
        samples: duplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `"${dup.name}" in company ${dup.company_id} (${dup.count} occurrences)`,
          ),
        fixable: true,
      });
    }
  }

  /**
   * Check for potential contact-organization relationship conflicts
   */
  async validateContactOrganizationCombinations() {
    // This will be relevant for the new junction table
    // Check if any contacts would have duplicate primary organization relationships

    const { data: contacts, error } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id")
      .not("company_id", "is", null);

    if (error) throw error;

    // Group contacts by company to identify potential primary contact conflicts
    const companyContacts = new Map();

    for (const contact of contacts || []) {
      if (!companyContacts.has(contact.company_id)) {
        companyContacts.set(contact.company_id, []);
      }
      companyContacts.get(contact.company_id).push(contact);
    }

    // Check for companies with many contacts (potential primary contact ambiguity)
    const companiesWithManyContacts = Array.from(companyContacts.entries())
      .filter(([companyId, contacts]) => contacts.length > 10)
      .map(([companyId, contacts]) => ({
        companyId,
        contactCount: contacts.length,
      }));

    if (companiesWithManyContacts.length > 0) {
      this.warnings.push({
        type: "MULTIPLE_CONTACTS_PER_COMPANY",
        entity: "contact_organizations",
        severity: "LOW",
        message: `Companies with many contacts may need primary contact designation review`,
        count: companiesWithManyContacts.length,
        samples: companiesWithManyContacts
          .slice(0, 5)
          .map(
            (item) =>
              `Company ${item.companyId} has ${item.contactCount} contacts`,
          ),
        fixable: false,
      });
    }
  }

  /**
   * Check for duplicate tag names
   */
  async validateTagNameUniqueness() {
    const { data: duplicates, error } = await this.supabase.rpc(
      "find_duplicate_tag_names",
      {},
    );

    if (error) throw error;

    if (duplicates?.length > 0) {
      this.conflicts.push({
        type: "DUPLICATE_TAG_NAME",
        entity: "tags",
        severity: "LOW",
        message: `Tags with duplicate names (case-insensitive)`,
        count: duplicates.length,
        samples: duplicates
          .slice(0, 5)
          .map(
            (dup) =>
              `"${dup.name}" appears ${dup.count} times (IDs: ${dup.ids.join(", ")})`,
          ),
        fixable: true,
      });
    }
  }

  /**
   * Check for duplicate user emails
   */
  async validateUserEmailUniqueness() {
    // This checks the auth.users table if accessible
    try {
      const { data: users, error } = await this.supabase
        .from("auth.users")
        .select("id, email");

      if (error) {
        // If we can't access auth.users, skip this check
        this.warnings.push({
          type: "SKIPPED_CHECK",
          entity: "auth.users",
          severity: "LOW",
          message: `Could not validate user email uniqueness - insufficient permissions`,
          count: 0,
          fixable: false,
        });
        return;
      }

      const emailCounts = new Map();
      for (const user of users || []) {
        if (!user.email) continue;
        const email = user.email.toLowerCase();
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
      }

      const duplicateEmails = Array.from(emailCounts.entries()).filter(
        ([email, count]) => count > 1,
      );

      if (duplicateEmails.length > 0) {
        this.conflicts.push({
          type: "DUPLICATE_USER_EMAIL",
          entity: "auth.users",
          severity: "CRITICAL",
          message: `Users with duplicate email addresses`,
          count: duplicateEmails.length,
          samples: duplicateEmails
            .slice(0, 5)
            .map(([email, count]) => `"${email}" appears ${count} times`),
          fixable: false,
        });
      }
    } catch (error) {
      // Skip if auth table is not accessible
      this.warnings.push({
        type: "SKIPPED_CHECK",
        entity: "auth.users",
        severity: "LOW",
        message: `Could not validate user email uniqueness - ${error.message}`,
        count: 0,
        fixable: false,
      });
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const totalConflicts = this.conflicts.length;
    const totalWarnings = this.warnings.length;
    const criticalCount = this.conflicts.filter(
      (c) => c.severity === "CRITICAL",
    ).length;
    const highCount = this.conflicts.filter(
      (c) => c.severity === "HIGH",
    ).length;
    const fixableCount = this.conflicts.filter((c) => c.fixable).length;

    const report = {
      status:
        criticalCount > 0 ? "FAILED" : highCount > 0 ? "WARNING" : "PASSED",
      summary: {
        totalConflicts,
        totalWarnings,
        criticalCount,
        highCount,
        mediumCount: this.conflicts.filter((c) => c.severity === "MEDIUM")
          .length,
        lowCount: this.conflicts.filter((c) => c.severity === "LOW").length,
        fixableCount,
      },
      conflicts: this.conflicts,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };

    console.log("📊 Unique constraint validation complete");
    console.log(`Status: ${report.status}`);
    console.log(`Conflicts: ${totalConflicts}, Warnings: ${totalWarnings}`);
    console.log(`Fixable conflicts: ${fixableCount}`);

    return report;
  }

  /**
   * Generate fix recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.conflicts.some((c) => c.type === "DUPLICATE_COMPANY_NAME")) {
      recommendations.push({
        type: "FIX",
        priority: "HIGH",
        action: "Merge or rename duplicate companies before migration",
        sql: `-- Review companies with duplicate names and merge or add distinguishing suffixes`,
      });
    }

    if (this.conflicts.some((c) => c.type === "DUPLICATE_CONTACT_EMAIL")) {
      recommendations.push({
        type: "FIX",
        priority: "MEDIUM",
        action: "Clean up duplicate contact emails within organizations",
        sql: `-- Remove duplicate email entries or merge contact records`,
      });
    }

    if (this.conflicts.some((c) => c.type === "DUPLICATE_OPPORTUNITY_NAME")) {
      recommendations.push({
        type: "FIX",
        priority: "MEDIUM",
        action: "Add distinguishing suffixes to duplicate opportunity names",
        sql: `-- UPDATE opportunities with duplicate names to add timestamps or stages`,
      });
    }

    if (this.conflicts.some((c) => c.type === "DUPLICATE_USER_EMAIL")) {
      recommendations.push({
        type: "BLOCK",
        priority: "CRITICAL",
        action:
          "Migration cannot proceed with duplicate user emails in auth system",
        sql: `-- Contact Supabase support to resolve auth.users email duplicates`,
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

  const validator = new UniqueConstraintValidator(supabaseUrl, supabaseKey);

  try {
    const report = await validator.validateAll();

    if (report.status === "FAILED") {
      console.error("❌ Unique constraint validation failed");
      process.exit(1);
    } else if (report.status === "WARNING") {
      console.warn("⚠️ Unique constraint validation passed with warnings");
      process.exit(0);
    } else {
      console.log("✅ Unique constraint validation passed");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}
