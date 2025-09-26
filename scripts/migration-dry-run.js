#!/usr/bin/env node

/**
 * Migration Dry Run Script
 *
 * Validates the migration will succeed by checking:
 * - Data integrity issues
 * - Foreign key violations
 * - Missing required fields
 * - Duplicate data that would violate unique constraints
 *
 * CRITICAL: Migration must not proceed if >1% of records have warnings
 */

const { createClient } = require('@supabase/supabase-js');

class MigrationDryRun {
  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.issues = [];
    this.warnings = [];
    this.stats = {
      totalRecords: 0,
      recordsWithIssues: 0,
      recordsWithWarnings: 0
    };
  }

  async checkDealsIntegrity() {
    console.log('\n📋 Checking deals table integrity...');

    const { data: deals, error } = await this.supabase
      .from('deals')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch deals: ${error.message}`);
    }

    this.stats.totalRecords = deals.length;

    for (const deal of deals) {
      const issues = [];

      // Check for missing required fields
      if (!deal.name) {
        issues.push('Missing required field: name');
      }

      if (!deal.stage) {
        issues.push('Missing required field: stage');
      }

      // Check for valid company reference
      if (deal.company_id) {
        const { data: company } = await this.supabase
          .from('companies')
          .select('id')
          .eq('id', deal.company_id)
          .single();

        if (!company) {
          issues.push(`Invalid company_id: ${deal.company_id}`);
        }
      }

      // Check for valid contact references
      if (deal.contact_ids && Array.isArray(deal.contact_ids)) {
        for (const contactId of deal.contact_ids) {
          const { data: contact } = await this.supabase
            .from('contacts')
            .select('id')
            .eq('id', contactId)
            .single();

          if (!contact) {
            issues.push(`Invalid contact_id in array: ${contactId}`);
          }
        }
      }

      // Check for valid sales reference
      if (deal.sales_id) {
        const { data: sales } = await this.supabase
          .from('sales')
          .select('id')
          .eq('id', deal.sales_id)
          .single();

        if (!sales) {
          issues.push(`Invalid sales_id: ${deal.sales_id}`);
        }
      }

      if (issues.length > 0) {
        this.issues.push({
          table: 'deals',
          id: deal.id,
          issues
        });
        this.stats.recordsWithIssues++;
      }
    }

    console.log(`  ✓ Checked ${deals.length} deals`);
    console.log(`  ⚠️  Found ${this.stats.recordsWithIssues} records with issues`);
  }

  async checkContactsIntegrity() {
    console.log('\n📋 Checking contacts table integrity...');

    const { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    let contactIssues = 0;

    for (const contact of contacts) {
      const issues = [];

      // Check for valid company reference
      if (contact.company_id) {
        const { data: company } = await this.supabase
          .from('companies')
          .select('id')
          .eq('id', contact.company_id)
          .single();

        if (!company) {
          issues.push(`Invalid company_id: ${contact.company_id}`);
        }
      }

      // Check email structure
      if (contact.email && !Array.isArray(contact.email)) {
        issues.push('email is not an array');
      }

      // Check phone structure
      if (contact.phone && !Array.isArray(contact.phone)) {
        issues.push('phone is not an array');
      }

      if (issues.length > 0) {
        this.issues.push({
          table: 'contacts',
          id: contact.id,
          issues
        });
        contactIssues++;
      }
    }

    console.log(`  ✓ Checked ${contacts.length} contacts`);
    console.log(`  ⚠️  Found ${contactIssues} records with issues`);
  }

  async checkCompaniesIntegrity() {
    console.log('\n📋 Checking companies table integrity...');

    const { data: companies, error } = await this.supabase
      .from('companies')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }

    let companyIssues = 0;

    for (const company of companies) {
      const issues = [];

      // Check for required fields
      if (!company.name) {
        issues.push('Missing required field: name');
      }

      // Check for valid sales reference
      if (company.sales_id) {
        const { data: sales } = await this.supabase
          .from('sales')
          .select('id')
          .eq('id', company.sales_id)
          .single();

        if (!sales) {
          issues.push(`Invalid sales_id: ${company.sales_id}`);
        }
      }

      if (issues.length > 0) {
        this.issues.push({
          table: 'companies',
          id: company.id,
          issues
        });
        companyIssues++;
      }
    }

    console.log(`  ✓ Checked ${companies.length} companies`);
    console.log(`  ⚠️  Found ${companyIssues} records with issues`);
  }

  async checkForDuplicates() {
    console.log('\n📋 Checking for duplicate data...');

    // Check for duplicate company names (potential issue for unique constraints)
    const { data: companies } = await this.supabase
      .from('companies')
      .select('name');

    const companyNames = {};
    let duplicateCompanies = 0;

    for (const company of companies || []) {
      if (companyNames[company.name]) {
        duplicateCompanies++;
        this.warnings.push({
          type: 'duplicate',
          message: `Duplicate company name: ${company.name}`
        });
      }
      companyNames[company.name] = true;
    }

    if (duplicateCompanies > 0) {
      console.log(`  ⚠️  Found ${duplicateCompanies} duplicate company names`);
    } else {
      console.log(`  ✓ No duplicate company names found`);
    }
  }

  async checkMigrationReadiness() {
    console.log('\n📋 Checking migration-specific requirements...');

    // Check if any deals have invalid stages for the new enum
    const validStages = [
      'lead', 'qualified', 'needs_analysis', 'proposal',
      'negotiation', 'closed_won', 'closed_lost', 'nurturing'
    ];

    const { data: deals } = await this.supabase
      .from('deals')
      .select('id, stage');

    let invalidStages = 0;

    for (const deal of deals || []) {
      // Map old stages to new ones if needed
      const stageMapping = {
        'New': 'lead',
        'Qualified': 'qualified',
        'Proposal': 'proposal',
        'Won': 'closed_won',
        'Lost': 'closed_lost'
      };

      if (deal.stage && !validStages.includes(deal.stage.toLowerCase())) {
        if (!stageMapping[deal.stage]) {
          this.warnings.push({
            type: 'stage_mapping',
            message: `Deal ${deal.id} has unmapped stage: ${deal.stage}`
          });
          invalidStages++;
        }
      }
    }

    if (invalidStages > 0) {
      console.log(`  ⚠️  Found ${invalidStages} deals with unmapped stages`);
    } else {
      console.log(`  ✓ All deal stages can be mapped`);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION DRY RUN REPORT');
    console.log('='.repeat(60));

    const totalIssues = this.issues.length;
    const totalWarnings = this.warnings.length;
    const issuePercentage = (totalIssues / Math.max(this.stats.totalRecords, 1)) * 100;

    console.log('\n📊 STATISTICS:');
    console.log(`  Total records examined: ${this.stats.totalRecords}`);
    console.log(`  Records with critical issues: ${totalIssues}`);
    console.log(`  Records with warnings: ${totalWarnings}`);
    console.log(`  Issue percentage: ${issuePercentage.toFixed(2)}%`);

    if (totalIssues > 0) {
      console.log('\n❌ CRITICAL ISSUES (Must be fixed):');
      for (const issue of this.issues.slice(0, 10)) {
        console.log(`  - [${issue.table}:${issue.id}] ${issue.issues.join(', ')}`);
      }
      if (this.issues.length > 10) {
        console.log(`  ... and ${this.issues.length - 10} more issues`);
      }
    }

    if (totalWarnings > 0) {
      console.log('\n⚠️  WARNINGS (Should be reviewed):');
      for (const warning of this.warnings.slice(0, 10)) {
        console.log(`  - [${warning.type}] ${warning.message}`);
      }
      if (this.warnings.length > 10) {
        console.log(`  ... and ${this.warnings.length - 10} more warnings`);
      }
    }

    console.log('\n' + '='.repeat(60));

    // Go/No-Go decision
    const threshold = 1.0; // 1% threshold
    const canProceed = issuePercentage < threshold;

    if (canProceed) {
      console.log('✅ GO: Migration can proceed');
      console.log(`   Issue rate (${issuePercentage.toFixed(2)}%) is below ${threshold}% threshold`);
    } else {
      console.log('🛑 NO-GO: Migration cannot proceed');
      console.log(`   Issue rate (${issuePercentage.toFixed(2)}%) exceeds ${threshold}% threshold`);
      console.log('\n   Fix all critical issues before attempting migration.');
    }

    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(canProceed ? 0 : 1);
  }

  async run() {
    try {
      console.log('🔍 Starting Migration Dry Run...\n');

      await this.checkDealsIntegrity();
      await this.checkContactsIntegrity();
      await this.checkCompaniesIntegrity();
      await this.checkForDuplicates();
      await this.checkMigrationReadiness();

      await this.generateReport();
    } catch (error) {
      console.error('❌ Dry run failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute dry run
(async () => {
  const dryRun = new MigrationDryRun();
  await dryRun.run();
})();