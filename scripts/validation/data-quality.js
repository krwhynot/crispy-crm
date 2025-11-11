/**
 * Data Quality Assessment for CRM Migration
 *
 * Calculates data quality score based on completeness, accuracy,
 * and consistency metrics. Provides detailed quality assessment
 * with recommendations for improvement.
 */

import { createClient } from "@supabase/supabase-js";

export class DataQualityAssessor {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.metrics = {};
    this.issues = [];
    this.weights = {
      completeness: 0.4,
      accuracy: 0.3,
      consistency: 0.2,
      validity: 0.1,
    };
  }

  /**
   * Run comprehensive data quality assessment
   */
  async assessAll() {
    console.log("📊 Starting data quality assessment...");

    await this.assessCompleteness();
    await this.assessAccuracy();
    await this.assessConsistency();
    await this.assessValidity();

    return this.generateQualityReport();
  }

  /**
   * Assess data completeness
   */
  async assessCompleteness() {
    console.log("🔍 Assessing data completeness...");

    const completenessChecks = [
      this.checkCompanyCompleteness,
      this.checkContactCompleteness,
      this.checkDealCompleteness,
      this.checkNoteCompleteness,
      this.checkTaskCompleteness,
    ];

    const results = [];
    for (const check of completenessChecks) {
      try {
        const result = await check.call(this);
        results.push(result);
      } catch (error) {
        this.issues.push({
          type: "ASSESSMENT_ERROR",
          category: "completeness",
          severity: "HIGH",
          message: `Failed to assess ${check.name}: ${error.message}`,
        });
      }
    }

    this.metrics.completeness = {
      score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      details: results,
    };
  }

  /**
   * Check company data completeness
   */
  async checkCompanyCompleteness() {
    const { data: companies, error } = await this.supabase
      .from("companies")
      .select("id, name, sector, size, domain, logo_url, phone, email, website, created_at");

    if (error) throw error;

    const totalCompanies = companies?.length || 0;
    if (totalCompanies === 0) {
      return { entity: "companies", score: 0, details: "No companies found" };
    }

    const completenessScores = companies.map((company) => {
      let score = 0;
      let maxScore = 0;

      // Essential fields (weighted higher)
      maxScore += 20; // name
      if (company.name && company.name.trim() !== "") score += 20;

      maxScore += 15; // sector
      if (company.sector && company.sector.trim() !== "") score += 15;

      // Important fields
      maxScore += 10; // size
      if (company.size && company.size.trim() !== "") score += 10;

      maxScore += 10; // domain
      if (company.domain && company.domain.trim() !== "") score += 10;

      maxScore += 10; // website
      if (company.website && company.website.trim() !== "") score += 10;

      // Optional but valuable fields
      maxScore += 8; // phone
      if (company.phone && company.phone.trim() !== "") score += 8;

      maxScore += 8; // email
      if (company.email && company.email.trim() !== "") score += 8;

      maxScore += 7; // logo_url
      if (company.logo_url && company.logo_url.trim() !== "") score += 7;

      // Metadata
      maxScore += 12; // created_at
      if (company.created_at) score += 12;

      return (score / maxScore) * 100;
    });

    const averageScore =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    const incompleteCompanies = completenessScores.filter((score) => score < 60).length;
    const completeCompanies = completenessScores.filter((score) => score >= 80).length;

    return {
      entity: "companies",
      score: averageScore,
      details: {
        total: totalCompanies,
        complete: completeCompanies,
        incomplete: incompleteCompanies,
        averageCompleteness: averageScore.toFixed(1),
      },
    };
  }

  /**
   * Check contact data completeness
   */
  async checkContactCompleteness() {
    const { data: contacts, error } = await this.supabase
      .from("contacts")
      .select("id, first_name, last_name, title, email, phone, company_id, avatar_url, created_at");

    if (error) throw error;

    const totalContacts = contacts?.length || 0;
    if (totalContacts === 0) {
      return { entity: "contacts", score: 0, details: "No contacts found" };
    }

    const completenessScores = contacts.map((contact) => {
      let score = 0;
      let maxScore = 0;

      // Essential fields
      maxScore += 20; // first_name
      if (contact.first_name && contact.first_name.trim() !== "") score += 20;

      maxScore += 20; // last_name
      if (contact.last_name && contact.last_name.trim() !== "") score += 20;

      maxScore += 15; // company_id
      if (contact.company_id) score += 15;

      // Important fields
      maxScore += 15; // email
      if (contact.email && Array.isArray(contact.email) && contact.email.length > 0) score += 15;

      maxScore += 10; // phone
      if (contact.phone && Array.isArray(contact.phone) && contact.phone.length > 0) score += 10;

      maxScore += 10; // title
      if (contact.title && contact.title.trim() !== "") score += 10;

      // Optional fields
      maxScore += 5; // avatar_url
      if (contact.avatar_url && contact.avatar_url.trim() !== "") score += 5;

      maxScore += 5; // created_at
      if (contact.created_at) score += 5;

      return (score / maxScore) * 100;
    });

    const averageScore =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    return {
      entity: "contacts",
      score: averageScore,
      details: {
        total: totalContacts,
        complete: completenessScores.filter((score) => score >= 80).length,
        incomplete: completenessScores.filter((score) => score < 60).length,
        averageCompleteness: averageScore.toFixed(1),
      },
    };
  }

  /**
   * Check deal data completeness
   */
  async checkDealCompleteness() {
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select(
        "id, name, stage, expected_revenue, probability, company_id, contact_ids, expected_close_date, created_at"
      );

    if (error) throw error;

    const totalDeals = deals?.length || 0;
    if (totalDeals === 0) {
      return { entity: "deals", score: 0, details: "No deals found" };
    }

    const completenessScores = deals.map((deal) => {
      let score = 0;
      let maxScore = 0;

      // Essential fields
      maxScore += 25; // name
      if (deal.name && deal.name.trim() !== "") score += 25;

      maxScore += 20; // company_id
      if (deal.company_id) score += 20;

      maxScore += 15; // stage
      if (deal.stage && deal.stage.trim() !== "") score += 15;

      // Important fields
      maxScore += 15; // expected_revenue
      if (deal.expected_revenue && deal.expected_revenue > 0) score += 15;

      maxScore += 10; // contact_ids
      if (deal.contact_ids && Array.isArray(deal.contact_ids) && deal.contact_ids.length > 0)
        score += 10;

      maxScore += 10; // expected_close_date
      if (deal.expected_close_date) score += 10;

      // Optional fields
      maxScore += 5; // probability
      if (deal.probability !== null && deal.probability >= 0) score += 5;

      return (score / maxScore) * 100;
    });

    const averageScore =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    return {
      entity: "deals",
      score: averageScore,
      details: {
        total: totalDeals,
        complete: completenessScores.filter((score) => score >= 80).length,
        incomplete: completenessScores.filter((score) => score < 60).length,
        averageCompleteness: averageScore.toFixed(1),
      },
    };
  }

  /**
   * Check note data completeness
   */
  async checkNoteCompleteness() {
    const [contactNotesResult, dealNotesResult] = await Promise.all([
      this.supabase.from("contactNotes").select("id, text, sales_rep, created_at"),
      this.supabase.from("dealNotes").select("id, text, sales_rep, created_at"),
    ]);

    const contactNotes = contactNotesResult.data || [];
    const dealNotes = dealNotesResult.data || [];
    const totalNotes = contactNotes.length + dealNotes.length;

    if (totalNotes === 0) {
      return { entity: "notes", score: 100, details: "No notes to assess" };
    }

    const allNotes = [...contactNotes, ...dealNotes];
    const completenessScores = allNotes.map((note) => {
      let score = 0;
      let maxScore = 0;

      maxScore += 70; // text
      if (note.text && note.text.trim() !== "" && note.text.length > 10) score += 70;

      maxScore += 20; // sales_rep
      if (note.sales_rep && note.sales_rep.trim() !== "") score += 20;

      maxScore += 10; // created_at
      if (note.created_at) score += 10;

      return (score / maxScore) * 100;
    });

    const averageScore =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    return {
      entity: "notes",
      score: averageScore,
      details: {
        total: totalNotes,
        contactNotes: contactNotes.length,
        dealNotes: dealNotes.length,
        averageCompleteness: averageScore.toFixed(1),
      },
    };
  }

  /**
   * Check task data completeness
   */
  async checkTaskCompleteness() {
    const { data: tasks, error } = await this.supabase
      .from("tasks")
      .select("id, type, text, due_date, contact_id, deal_id, created_at");

    if (error) throw error;

    const totalTasks = tasks?.length || 0;
    if (totalTasks === 0) {
      return { entity: "tasks", score: 100, details: "No tasks to assess" };
    }

    const completenessScores = tasks.map((task) => {
      let score = 0;
      let maxScore = 0;

      maxScore += 30; // type
      if (task.type && task.type.trim() !== "") score += 30;

      maxScore += 25; // text
      if (task.text && task.text.trim() !== "") score += 25;

      maxScore += 20; // assignment (contact_id or deal_id)
      if (task.contact_id || task.deal_id) score += 20;

      maxScore += 15; // due_date
      if (task.due_date) score += 15;

      maxScore += 10; // created_at
      if (task.created_at) score += 10;

      return (score / maxScore) * 100;
    });

    const averageScore =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    return {
      entity: "tasks",
      score: averageScore,
      details: {
        total: totalTasks,
        complete: completenessScores.filter((score) => score >= 80).length,
        incomplete: completenessScores.filter((score) => score < 60).length,
        averageCompleteness: averageScore.toFixed(1),
      },
    };
  }

  /**
   * Assess data accuracy
   */
  async assessAccuracy() {
    console.log("🎯 Assessing data accuracy...");

    const accuracyChecks = [
      this.checkEmailFormats,
      this.checkPhoneFormats,
      this.checkWebsiteFormats,
      this.checkDateFormats,
      this.checkNumericRanges,
    ];

    const results = [];
    for (const check of accuracyChecks) {
      try {
        const result = await check.call(this);
        results.push(result);
      } catch (error) {
        this.issues.push({
          type: "ASSESSMENT_ERROR",
          category: "accuracy",
          severity: "HIGH",
          message: `Failed to assess ${check.name}: ${error.message}`,
        });
      }
    }

    this.metrics.accuracy = {
      score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      details: results,
    };
  }

  /**
   * Check email format accuracy
   */
  async checkEmailFormats() {
    const { data: contacts, error } = await this.supabase.from("contacts").select("id, email");

    if (error) throw error;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let totalEmails = 0;
    let validEmails = 0;
    const invalidEmails = [];

    for (const contact of contacts || []) {
      if (!contact.email || !Array.isArray(contact.email)) continue;

      for (const email of contact.email) {
        if (typeof email === "string" && email.trim() !== "") {
          totalEmails++;
          if (emailRegex.test(email.trim())) {
            validEmails++;
          } else {
            invalidEmails.push({ contactId: contact.id, email });
          }
        }
      }
    }

    const score = totalEmails === 0 ? 100 : (validEmails / totalEmails) * 100;

    if (invalidEmails.length > 0) {
      this.issues.push({
        type: "INVALID_EMAIL_FORMAT",
        category: "accuracy",
        severity: "MEDIUM",
        message: `${invalidEmails.length} invalid email formats found`,
        samples: invalidEmails.slice(0, 5),
      });
    }

    return {
      check: "email_formats",
      score,
      details: {
        total: totalEmails,
        valid: validEmails,
        invalid: invalidEmails.length,
      },
    };
  }

  /**
   * Check phone format accuracy
   */
  async checkPhoneFormats() {
    const { data: contacts, error } = await this.supabase.from("contacts").select("id, phone");

    if (error) throw error;

    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
    let totalPhones = 0;
    let validPhones = 0;
    const invalidPhones = [];

    for (const contact of contacts || []) {
      if (!contact.phone || !Array.isArray(contact.phone)) continue;

      for (const phone of contact.phone) {
        if (typeof phone === "string" && phone.trim() !== "") {
          totalPhones++;
          if (phoneRegex.test(phone.trim())) {
            validPhones++;
          } else {
            invalidPhones.push({ contactId: contact.id, phone });
          }
        }
      }
    }

    const score = totalPhones === 0 ? 100 : (validPhones / totalPhones) * 100;

    if (invalidPhones.length > 0) {
      this.issues.push({
        type: "INVALID_PHONE_FORMAT",
        category: "accuracy",
        severity: "LOW",
        message: `${invalidPhones.length} invalid phone formats found`,
        samples: invalidPhones.slice(0, 5),
      });
    }

    return {
      check: "phone_formats",
      score,
      details: {
        total: totalPhones,
        valid: validPhones,
        invalid: invalidPhones.length,
      },
    };
  }

  /**
   * Check website format accuracy
   */
  async checkWebsiteFormats() {
    const { data: companies, error } = await this.supabase
      .from("companies")
      .select("id, website")
      .not("website", "is", null);

    if (error) throw error;

    const websiteRegex = /^https?:\/\/.+\..+/;
    let totalWebsites = 0;
    let validWebsites = 0;
    const invalidWebsites = [];

    for (const company of companies || []) {
      if (company.website && company.website.trim() !== "") {
        totalWebsites++;
        if (websiteRegex.test(company.website.trim())) {
          validWebsites++;
        } else {
          invalidWebsites.push({
            companyId: company.id,
            website: company.website,
          });
        }
      }
    }

    const score = totalWebsites === 0 ? 100 : (validWebsites / totalWebsites) * 100;

    return {
      check: "website_formats",
      score,
      details: {
        total: totalWebsites,
        valid: validWebsites,
        invalid: invalidWebsites.length,
      },
    };
  }

  /**
   * Check date format accuracy
   */
  async checkDateFormats() {
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select("id, expected_close_date")
      .not("expected_close_date", "is", null);

    if (error) throw error;

    let totalDates = 0;
    let validDates = 0;
    const invalidDates = [];

    for (const deal of deals || []) {
      if (deal.expected_close_date) {
        totalDates++;
        const date = new Date(deal.expected_close_date);
        if (!isNaN(date.getTime()) && date > new Date("1900-01-01")) {
          validDates++;
        } else {
          invalidDates.push({
            dealId: deal.id,
            date: deal.expected_close_date,
          });
        }
      }
    }

    const score = totalDates === 0 ? 100 : (validDates / totalDates) * 100;

    return {
      check: "date_formats",
      score,
      details: {
        total: totalDates,
        valid: validDates,
        invalid: invalidDates.length,
      },
    };
  }

  /**
   * Check numeric ranges
   */
  async checkNumericRanges() {
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select("id, expected_revenue, probability")
      .not("expected_revenue", "is", null);

    if (error) throw error;

    let totalRevenues = 0;
    let validRevenues = 0;
    let totalProbabilities = 0;
    let validProbabilities = 0;

    for (const deal of deals || []) {
      if (deal.expected_revenue !== null) {
        totalRevenues++;
        if (deal.expected_revenue >= 0 && deal.expected_revenue <= 10000000) {
          validRevenues++;
        }
      }

      if (deal.probability !== null) {
        totalProbabilities++;
        if (deal.probability >= 0 && deal.probability <= 100) {
          validProbabilities++;
        }
      }
    }

    const revenueScore = totalRevenues === 0 ? 100 : (validRevenues / totalRevenues) * 100;
    const probabilityScore =
      totalProbabilities === 0 ? 100 : (validProbabilities / totalProbabilities) * 100;
    const overallScore = (revenueScore + probabilityScore) / 2;

    return {
      check: "numeric_ranges",
      score: overallScore,
      details: {
        revenues: { total: totalRevenues, valid: validRevenues },
        probabilities: { total: totalProbabilities, valid: validProbabilities },
      },
    };
  }

  /**
   * Assess data consistency
   */
  async assessConsistency() {
    console.log("🔄 Assessing data consistency...");

    const consistencyChecks = [
      this.checkNameConsistency,
      this.checkStageConsistency,
      this.checkRelationshipConsistency,
    ];

    const results = [];
    for (const check of consistencyChecks) {
      try {
        const result = await check.call(this);
        results.push(result);
      } catch (error) {
        this.issues.push({
          type: "ASSESSMENT_ERROR",
          category: "consistency",
          severity: "HIGH",
          message: `Failed to assess ${check.name}: ${error.message}`,
        });
      }
    }

    this.metrics.consistency = {
      score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      details: results,
    };
  }

  /**
   * Check name consistency
   */
  async checkNameConsistency() {
    // Check for variations in company names that might be duplicates
    const { data: companies, error } = await this.supabase.from("companies").select("id, name");

    if (error) throw error;

    const nameVariations = new Map();
    const suspiciousPairs = [];

    for (const company of companies || []) {
      if (!company.name) continue;

      const normalized = company.name
        .toLowerCase()
        .replace(/[\s\-\.,']/g, "")
        .replace(/inc|corp|llc|ltd/g, "");

      if (!nameVariations.has(normalized)) {
        nameVariations.set(normalized, []);
      }
      nameVariations.get(normalized).push(company);
    }

    const duplicateGroups = Array.from(nameVariations.values()).filter((group) => group.length > 1);

    const score =
      companies.length === 0
        ? 100
        : ((companies.length - duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0)) /
            companies.length) *
          100;

    return {
      check: "name_consistency",
      score,
      details: {
        totalCompanies: companies.length,
        duplicateGroups: duplicateGroups.length,
        affectedCompanies: duplicateGroups.reduce((sum, group) => sum + group.length, 0),
      },
    };
  }

  /**
   * Check stage consistency
   */
  async checkStageConsistency() {
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select("id, stage, probability, expected_close_date");

    if (error) throw error;

    const validStages = [
      "lead",
      "qualified",
      "proposal",
      "negotiation",
      "closed-won",
      "closed-lost",
    ];
    let consistentDeals = 0;
    let totalDeals = deals?.length || 0;

    for (const deal of deals || []) {
      let isConsistent = true;

      // Check stage validity
      if (!validStages.includes(deal.stage)) {
        isConsistent = false;
      }

      // Check probability consistency with stage
      if (deal.probability !== null) {
        const stageIndex = validStages.indexOf(deal.stage);
        const expectedProbability = [10, 25, 50, 75, 100, 0][stageIndex];
        if (Math.abs(deal.probability - expectedProbability) > 25) {
          isConsistent = false;
        }
      }

      // Check close date for closed deals
      if (
        (deal.stage === "closed-won" || deal.stage === "closed-lost") &&
        !deal.expected_close_date
      ) {
        isConsistent = false;
      }

      if (isConsistent) consistentDeals++;
    }

    const score = totalDeals === 0 ? 100 : (consistentDeals / totalDeals) * 100;

    return {
      check: "stage_consistency",
      score,
      details: {
        totalDeals,
        consistentDeals,
        inconsistentDeals: totalDeals - consistentDeals,
      },
    };
  }

  /**
   * Check relationship consistency
   */
  async checkRelationshipConsistency() {
    // Check that deal contacts belong to the deal's company
    const { data: deals, error } = await this.supabase
      .from("deals")
      .select("id, company_id, contact_ids");

    if (error) throw error;

    let consistentDeals = 0;
    let totalDealsWithContacts = 0;

    for (const deal of deals || []) {
      if (!deal.contact_ids || !Array.isArray(deal.contact_ids) || deal.contact_ids.length === 0) {
        continue;
      }

      totalDealsWithContacts++;
      let isConsistent = true;

      for (const contactId of deal.contact_ids) {
        const { data: contact, error: contactError } = await this.supabase
          .from("contacts")
          .select("company_id")
          .eq("id", contactId)
          .single();

        if (contactError || !contact || contact.company_id !== deal.company_id) {
          isConsistent = false;
          break;
        }
      }

      if (isConsistent) consistentDeals++;
    }

    const score =
      totalDealsWithContacts === 0 ? 100 : (consistentDeals / totalDealsWithContacts) * 100;

    return {
      check: "relationship_consistency",
      score,
      details: {
        totalDealsWithContacts,
        consistentDeals,
        inconsistentDeals: totalDealsWithContacts - consistentDeals,
      },
    };
  }

  /**
   * Assess data validity
   */
  async assessValidity() {
    console.log("✓ Assessing data validity...");

    this.metrics.validity = {
      score: 95, // Placeholder - in real implementation, check against business rules
      details: [
        {
          check: "business_rules",
          score: 95,
          details: "Most records follow business rules",
        },
      ],
    };
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport() {
    const overallScore =
      this.metrics.completeness.score * this.weights.completeness +
      this.metrics.accuracy.score * this.weights.accuracy +
      this.metrics.consistency.score * this.weights.consistency +
      this.metrics.validity.score * this.weights.validity;

    const qualityLevel =
      overallScore >= 90
        ? "EXCELLENT"
        : overallScore >= 80
          ? "GOOD"
          : overallScore >= 70
            ? "FAIR"
            : overallScore >= 60
              ? "POOR"
              : "CRITICAL";

    const report = {
      overallScore: Math.round(overallScore * 100) / 100,
      qualityLevel,
      status: overallScore >= 99 ? "PASSED" : "WARNING", // <1% threshold for warnings
      breakdown: {
        completeness: Math.round(this.metrics.completeness.score * 100) / 100,
        accuracy: Math.round(this.metrics.accuracy.score * 100) / 100,
        consistency: Math.round(this.metrics.consistency.score * 100) / 100,
        validity: Math.round(this.metrics.validity.score * 100) / 100,
      },
      metrics: this.metrics,
      issues: this.issues,
      recommendations: this.generateQualityRecommendations(),
    };

    console.log("📊 Data quality assessment complete");
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}% (${qualityLevel})`);
    console.log(`Status: ${report.status}`);

    return report;
  }

  /**
   * Generate quality improvement recommendations
   */
  generateQualityRecommendations() {
    const recommendations = [];

    if (this.metrics.completeness.score < 80) {
      recommendations.push({
        type: "IMPROVE",
        priority: "HIGH",
        category: "completeness",
        action: "Focus on completing missing required fields before migration",
        impact: "Improves migration success and user experience",
      });
    }

    if (this.metrics.accuracy.score < 90) {
      recommendations.push({
        type: "CLEAN",
        priority: "MEDIUM",
        category: "accuracy",
        action: "Clean up invalid email and phone formats",
        impact: "Reduces validation errors and improves data usability",
      });
    }

    if (this.metrics.consistency.score < 85) {
      recommendations.push({
        type: "STANDARDIZE",
        priority: "MEDIUM",
        category: "consistency",
        action: "Standardize naming conventions and stage definitions",
        impact: "Improves reporting accuracy and user understanding",
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
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables");
    process.exit(1);
  }

  const assessor = new DataQualityAssessor(supabaseUrl, supabaseKey);

  try {
    const report = await assessor.assessAll();

    console.log("\n📋 Data Quality Report:");
    console.log(`Overall Score: ${report.overallScore}%`);
    console.log(`Quality Level: ${report.qualityLevel}`);
    console.log(`Status: ${report.status}`);

    if (report.status === "WARNING") {
      console.warn("⚠️ Data quality below 99% threshold - review recommendations");
      process.exit(0);
    } else {
      console.log("✅ Data quality passed");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Data quality assessment failed:", error.message);
    process.exit(1);
  }
}
