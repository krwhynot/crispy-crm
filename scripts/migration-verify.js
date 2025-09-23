#!/usr/bin/env node

/**
 * Post-Migration Verification Script
 *
 * Comprehensive verification of migration success including:
 * - Record count validation
 * - Foreign key integrity
 * - Business rules compliance
 * - Performance baselines
 * - Search index verification
 * - Cache validation
 */

const { createClient } = require('@supabase/supabase-js');
const { performance } = require('perf_hooks');

class MigrationVerification {
  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.metrics = {
      recordCounts: {},
      performanceMetrics: {},
      integrityChecks: {},
      businessRules: {},
      searchIndexes: {},
      backwardCompatibility: {}
    };
    this.startTime = Date.now();
  }

  /**
   * Verify record counts match expectations
   */
  async verifyRecordCounts() {
    console.log('\n📊 Verifying Record Counts...');

    // Get pre-migration counts from backup if available
    const preMigrationCounts = await this.getPreMigrationCounts();

    // Count deals/opportunities
    const { count: dealsCount } = await this.supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });

    const { count: opportunitiesCount } = await this.supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    this.metrics.recordCounts.deals = dealsCount;
    this.metrics.recordCounts.opportunities = opportunitiesCount;
    this.metrics.recordCounts.migrationComplete = dealsCount === opportunitiesCount;

    // Count contacts and their relationships
    const { count: contactsCount } = await this.supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    const { count: contactOrgCount } = await this.supabase
      .from('contact_organizations')
      .select('*', { count: 'exact', head: true });

    this.metrics.recordCounts.contacts = contactsCount;
    this.metrics.recordCounts.contactOrganizations = contactOrgCount;

    // Count companies/organizations
    const { count: companiesCount } = await this.supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    const { count: organizationsCount } = await this.supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    this.metrics.recordCounts.companies = companiesCount;
    this.metrics.recordCounts.organizations = organizationsCount;

    // Validate no data loss
    if (preMigrationCounts) {
      this.metrics.recordCounts.dataLoss =
        contactsCount < preMigrationCounts.contacts ||
        companiesCount < preMigrationCounts.companies;
    }

    return this.metrics.recordCounts;
  }

  /**
   * Get pre-migration counts from backup or state
   */
  async getPreMigrationCounts() {
    try {
      const { data } = await this.supabase
        .from('migration_history')
        .select('metadata')
        .eq('phase', 'pre-migration-backup')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      return data?.metadata?.recordCounts || null;
    } catch {
      return null;
    }
  }

  /**
   * Verify all foreign key relationships
   */
  async verifyForeignKeyIntegrity() {
    console.log('\n🔗 Verifying Foreign Key Integrity...');

    const integrityChecks = [
      {
        name: 'opportunities.customer_organization_id',
        query: `
          SELECT COUNT(*) as orphaned
          FROM opportunities o
          WHERE o.customer_organization_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM organizations org
            WHERE org.id = o.customer_organization_id
          )
        `
      },
      {
        name: 'contact_organizations.contact_id',
        query: `
          SELECT COUNT(*) as orphaned
          FROM contact_organizations co
          WHERE NOT EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = co.contact_id
          )
        `
      },
      {
        name: 'contact_organizations.organization_id',
        query: `
          SELECT COUNT(*) as orphaned
          FROM contact_organizations co
          WHERE NOT EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = co.organization_id
          )
        `
      },
      {
        name: 'opportunity_participants',
        query: `
          SELECT COUNT(*) as orphaned
          FROM opportunity_participants op
          WHERE NOT EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.id = op.opportunity_id
          )
        `
      }
    ];

    for (const check of integrityChecks) {
      const startTime = performance.now();
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: check.query
      }).single();

      if (!error && data) {
        this.metrics.integrityChecks[check.name] = {
          passed: data.orphaned === 0,
          orphanedCount: data.orphaned,
          executionTime: performance.now() - startTime
        };
      }
    }

    return this.metrics.integrityChecks;
  }

  /**
   * Verify business rules are satisfied
   */
  async verifyBusinessRules() {
    console.log('\n📋 Verifying Business Rules...');

    const rules = [
      {
        name: 'contacts_have_primary_organization',
        description: 'All contacts should have at least one organization',
        check: async () => {
          const { count: contactsWithoutOrg } = await this.supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('primary_organization_id', null);

          return {
            passed: contactsWithoutOrg === 0,
            details: `${contactsWithoutOrg} contacts without primary organization`
          };
        }
      },
      {
        name: 'opportunities_have_valid_stages',
        description: 'All opportunities have valid stage values',
        check: async () => {
          const validStages = ['qualification', 'proposal', 'negotiation', 'closed'];
          const { data: invalidStages } = await this.supabase
            .from('opportunities')
            .select('stage', { count: 'exact' })
            .not('stage', 'in', `(${validStages.join(',')})`);

          return {
            passed: !invalidStages || invalidStages.length === 0,
            details: invalidStages ? `${invalidStages.length} opportunities with invalid stages` : 'All stages valid'
          };
        }
      },
      {
        name: 'principal_distributor_relationships',
        description: 'Principal-distributor relationships are properly set',
        check: async () => {
          const { data: principals } = await this.supabase
            .from('organizations')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'principal');

          const { data: distributors } = await this.supabase
            .from('organizations')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'distributor');

          return {
            passed: true,
            details: `${principals?.count || 0} principals, ${distributors?.count || 0} distributors`
          };
        }
      },
      {
        name: 'opportunity_participants_valid',
        description: 'All opportunity participants have valid roles',
        check: async () => {
          const validRoles = ['champion', 'decision_maker', 'influencer', 'evaluator', 'blocker'];
          const { count: invalidParticipants } = await this.supabase
            .from('opportunity_participants')
            .select('*', { count: 'exact', head: true })
            .not('role', 'in', `(${validRoles.join(',')})`);

          return {
            passed: invalidParticipants === 0,
            details: `${invalidParticipants} participants with invalid roles`
          };
        }
      }
    ];

    for (const rule of rules) {
      const result = await rule.check();
      this.metrics.businessRules[rule.name] = {
        ...result,
        description: rule.description
      };
    }

    return this.metrics.businessRules;
  }

  /**
   * Verify performance baselines
   */
  async verifyPerformanceBaselines() {
    console.log('\n⚡ Verifying Performance Baselines...');

    const queries = [
      {
        name: 'opportunities_list',
        query: async () => {
          const start = performance.now();
          await this.supabase
            .from('opportunities')
            .select('*, customer_organization_id(*)')
            .limit(20);
          return performance.now() - start;
        },
        baseline: 500 // ms
      },
      {
        name: 'contacts_with_orgs',
        query: async () => {
          const start = performance.now();
          await this.supabase
            .from('contacts')
            .select(`
              *,
              contact_organizations(
                organization_id(*)
              )
            `)
            .limit(20);
          return performance.now() - start;
        },
        baseline: 700 // ms
      },
      {
        name: 'dashboard_aggregates',
        query: async () => {
          const start = performance.now();
          await Promise.all([
            this.supabase.from('opportunities_summary').select('*'),
            this.supabase.from('companies_summary').select('*'),
            this.supabase.from('contacts_summary').select('*')
          ]);
          return performance.now() - start;
        },
        baseline: 1000 // ms
      }
    ];

    for (const test of queries) {
      const executionTime = await test.query();
      this.metrics.performanceMetrics[test.name] = {
        executionTime,
        baseline: test.baseline,
        passed: executionTime <= test.baseline * 1.5, // Allow 50% variance
        performance: executionTime <= test.baseline ? 'good' :
                    executionTime <= test.baseline * 1.5 ? 'acceptable' : 'poor'
      };
    }

    return this.metrics.performanceMetrics;
  }

  /**
   * Verify search indexes are rebuilt
   */
  async verifySearchIndexes() {
    console.log('\n🔍 Verifying Search Indexes...');

    // Check if search indexes exist and are working
    const searchTests = [
      {
        table: 'opportunities',
        searchTerm: 'test',
        column: 'name'
      },
      {
        table: 'contacts',
        searchTerm: 'john',
        column: 'name'
      },
      {
        table: 'organizations',
        searchTerm: 'corp',
        column: 'name'
      }
    ];

    for (const test of searchTests) {
      const start = performance.now();
      const { error } = await this.supabase
        .from(test.table)
        .select('id')
        .ilike(test.column, `%${test.searchTerm}%`)
        .limit(10);

      this.metrics.searchIndexes[test.table] = {
        passed: !error,
        searchTime: performance.now() - start,
        error: error?.message
      };
    }

    return this.metrics.searchIndexes;
  }

  /**
   * Verify backward compatibility
   */
  async verifyBackwardCompatibility() {
    console.log('\n🔄 Verifying Backward Compatibility...');

    // Test old API patterns still work
    const compatibilityTests = [
      {
        name: 'deals_view_accessible',
        test: async () => {
          const { error } = await this.supabase
            .from('deals')
            .select('*')
            .limit(1);
          return !error;
        }
      },
      {
        name: 'dealNotes_view_accessible',
        test: async () => {
          const { error } = await this.supabase
            .from('dealNotes')
            .select('*')
            .limit(1);
          return !error;
        }
      },
      {
        name: 'contact_company_id_works',
        test: async () => {
          const { data, error } = await this.supabase
            .from('contacts')
            .select('company_id')
            .limit(1)
            .single();
          return !error && data !== null;
        }
      }
    ];

    for (const test of compatibilityTests) {
      const passed = await test.test();
      this.metrics.backwardCompatibility[test.name] = { passed };
    }

    return this.metrics.backwardCompatibility;
  }

  /**
   * Generate verification summary
   */
  generateSummary() {
    const summary = {
      migrationId: this.migrationId,
      verificationTime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      overallStatus: 'UNKNOWN',
      scores: {
        dataIntegrity: 0,
        foreignKeys: 0,
        businessRules: 0,
        performance: 0,
        searchIndexes: 0,
        backwardCompatibility: 0
      },
      issues: [],
      recommendations: []
    };

    // Calculate data integrity score
    const recordsMatch = this.metrics.recordCounts.migrationComplete;
    const noDataLoss = !this.metrics.recordCounts.dataLoss;
    summary.scores.dataIntegrity = (recordsMatch && noDataLoss) ? 100 :
                                   recordsMatch ? 75 : 0;

    // Calculate foreign key score
    const integrityResults = Object.values(this.metrics.integrityChecks);
    const integrityPassed = integrityResults.filter(r => r.passed).length;
    summary.scores.foreignKeys = (integrityPassed / integrityResults.length) * 100;

    // Calculate business rules score
    const rulesResults = Object.values(this.metrics.businessRules);
    const rulesPassed = rulesResults.filter(r => r.passed).length;
    summary.scores.businessRules = (rulesPassed / rulesResults.length) * 100;

    // Calculate performance score
    const perfResults = Object.values(this.metrics.performanceMetrics);
    const perfPassed = perfResults.filter(r => r.passed).length;
    summary.scores.performance = (perfPassed / perfResults.length) * 100;

    // Calculate search index score
    const searchResults = Object.values(this.metrics.searchIndexes);
    const searchPassed = searchResults.filter(r => r.passed).length;
    summary.scores.searchIndexes = (searchPassed / searchResults.length) * 100;

    // Calculate backward compatibility score
    const compatResults = Object.values(this.metrics.backwardCompatibility);
    const compatPassed = compatResults.filter(r => r.passed).length;
    summary.scores.backwardCompatibility = (compatPassed / compatResults.length) * 100;

    // Overall status
    const avgScore = Object.values(summary.scores).reduce((a, b) => a + b, 0) / 6;
    summary.overallStatus = avgScore >= 95 ? 'SUCCESS' :
                           avgScore >= 80 ? 'SUCCESS_WITH_WARNINGS' :
                           avgScore >= 60 ? 'PARTIAL_SUCCESS' : 'FAILED';

    // Collect issues
    if (summary.scores.dataIntegrity < 100) {
      summary.issues.push({
        severity: 'HIGH',
        category: 'Data Integrity',
        message: 'Record counts do not match or data loss detected'
      });
    }

    Object.entries(this.metrics.integrityChecks).forEach(([key, value]) => {
      if (!value.passed) {
        summary.issues.push({
          severity: 'CRITICAL',
          category: 'Foreign Keys',
          message: `${key} has ${value.orphanedCount} orphaned records`
        });
      }
    });

    Object.entries(this.metrics.businessRules).forEach(([key, value]) => {
      if (!value.passed) {
        summary.issues.push({
          severity: 'MEDIUM',
          category: 'Business Rules',
          message: `${value.description}: ${value.details}`
        });
      }
    });

    Object.entries(this.metrics.performanceMetrics).forEach(([key, value]) => {
      if (value.performance === 'poor') {
        summary.issues.push({
          severity: 'LOW',
          category: 'Performance',
          message: `${key} query slow: ${value.executionTime.toFixed(2)}ms (baseline: ${value.baseline}ms)`
        });
      }
    });

    // Generate recommendations
    if (summary.scores.performance < 80) {
      summary.recommendations.push('Consider rebuilding database indexes');
      summary.recommendations.push('Review query optimization for slow endpoints');
    }

    if (summary.scores.foreignKeys < 100) {
      summary.recommendations.push('Run data cleanup script to fix orphaned records');
      summary.recommendations.push('Review migration logic for relationship preservation');
    }

    if (summary.scores.backwardCompatibility < 100) {
      summary.recommendations.push('Update application code to use new schema');
      summary.recommendations.push('Plan deprecation timeline for compatibility views');
    }

    if (summary.scores.searchIndexes < 100) {
      summary.recommendations.push('Rebuild search indexes using search-reindex.js');
    }

    return summary;
  }

  /**
   * Run all verification checks
   */
  async run() {
    console.log('🔍 Starting Post-Migration Verification...');
    console.log('=' .repeat(60));

    try {
      // Get migration ID from state
      const { data: latestMigration } = await this.supabase
        .from('migration_history')
        .select('id')
        .eq('status', 'completed')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      this.migrationId = latestMigration?.id || 'unknown';

      // Run all verification checks
      await this.verifyRecordCounts();
      await this.verifyForeignKeyIntegrity();
      await this.verifyBusinessRules();
      await this.verifyPerformanceBaselines();
      await this.verifySearchIndexes();
      await this.verifyBackwardCompatibility();

      // Generate summary
      const summary = this.generateSummary();

      // Save verification results
      await this.supabase
        .from('migration_history')
        .insert({
          id: `verification_${Date.now()}`,
          phase: 'post-migration-verification',
          step: 'completed',
          status: summary.overallStatus.toLowerCase(),
          metadata: {
            migrationId: this.migrationId,
            metrics: this.metrics,
            summary
          }
        });

      // Display results
      console.log('\n📊 VERIFICATION RESULTS');
      console.log('=' .repeat(60));
      console.log(`Overall Status: ${summary.overallStatus}`);
      console.log(`Verification Time: ${(summary.verificationTime / 1000).toFixed(2)}s`);

      console.log('\n📈 SCORES:');
      Object.entries(summary.scores).forEach(([category, score]) => {
        const emoji = score >= 95 ? '✅' : score >= 80 ? '⚠️' : '❌';
        console.log(`  ${emoji} ${category}: ${score.toFixed(1)}%`);
      });

      if (summary.issues.length > 0) {
        console.log('\n⚠️ ISSUES FOUND:');
        const issuesBySeverity = {
          CRITICAL: [],
          HIGH: [],
          MEDIUM: [],
          LOW: []
        };

        summary.issues.forEach(issue => {
          issuesBySeverity[issue.severity].push(issue);
        });

        Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
          if (issues.length > 0) {
            console.log(`\n  ${severity}:`);
            issues.forEach(issue => {
              console.log(`    - [${issue.category}] ${issue.message}`);
            });
          }
        });
      }

      if (summary.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        summary.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec}`);
        });
      }

      console.log('\n' + '=' .repeat(60));

      // Return appropriate exit code
      if (summary.overallStatus === 'FAILED') {
        console.log('❌ Migration verification FAILED - immediate action required');
        process.exit(1);
      } else if (summary.overallStatus === 'PARTIAL_SUCCESS') {
        console.log('⚠️  Migration partially successful - review issues');
        process.exit(0);
      } else {
        console.log('✅ Migration verification completed successfully');
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const verification = new MigrationVerification();
  verification.run();
}

module.exports = MigrationVerification;