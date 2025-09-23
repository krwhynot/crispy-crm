#!/usr/bin/env node

/**
 * Migration Report Generator
 *
 * Generates comprehensive HTML reports for migration status and results.
 * Includes statistics, performance metrics, data quality scores, and recommendations.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class MigrationReportGenerator {
  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.reportData = {
      migration: null,
      verification: null,
      statistics: {},
      performance: {},
      issues: [],
      timeline: []
    };
  }

  /**
   * Gather all migration data
   */
  async gatherMigrationData() {
    console.log('📊 Gathering migration data...');

    // Get latest migration
    const { data: migrations } = await this.supabase
      .from('migration_history')
      .select('*')
      .eq('phase', 'migration-complete')
      .order('executed_at', { ascending: false })
      .limit(1);

    if (migrations && migrations.length > 0) {
      this.reportData.migration = migrations[0];
    }

    // Get verification results
    const { data: verifications } = await this.supabase
      .from('migration_history')
      .select('*')
      .eq('phase', 'post-migration-verification')
      .order('executed_at', { ascending: false })
      .limit(1);

    if (verifications && verifications.length > 0) {
      this.reportData.verification = verifications[0];
    }

    // Get migration timeline
    const { data: timeline } = await this.supabase
      .from('migration_history')
      .select('phase, step, status, executed_at, metadata')
      .order('executed_at', { ascending: true });

    this.reportData.timeline = timeline || [];

    // Calculate statistics
    await this.calculateStatistics();

    // Extract performance metrics
    this.extractPerformanceMetrics();

    // Collect issues
    this.collectIssues();
  }

  /**
   * Calculate migration statistics
   */
  async calculateStatistics() {
    console.log('📈 Calculating statistics...');

    // Get record counts
    const tables = [
      'companies', 'organizations', 'contacts', 'contact_organizations',
      'opportunities', 'opportunity_participants', 'opportunityNotes',
      'tasks', 'tags'
    ];

    for (const table of tables) {
      try {
        const { count } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        this.reportData.statistics[table] = count || 0;
      } catch (error) {
        this.reportData.statistics[table] = 'N/A';
      }
    }

    // Calculate migration duration
    if (this.reportData.timeline.length > 0) {
      const start = new Date(this.reportData.timeline[0].executed_at);
      const end = new Date(this.reportData.timeline[this.reportData.timeline.length - 1].executed_at);
      const duration = (end - start) / 1000; // seconds

      this.reportData.statistics.migrationDuration = {
        seconds: duration,
        formatted: this.formatDuration(duration)
      };
    }

    // Calculate success rate
    const totalSteps = this.reportData.timeline.length;
    const successfulSteps = this.reportData.timeline.filter(t => t.status === 'completed').length;
    this.reportData.statistics.successRate = ((successfulSteps / totalSteps) * 100).toFixed(1);

    // Data transformation metrics
    if (this.reportData.migration?.metadata) {
      const metadata = this.reportData.migration.metadata;
      this.reportData.statistics.transformations = {
        dealsToOpportunities: metadata.dealsTransformed || 0,
        contactRelationships: metadata.contactRelationshipsCreated || 0,
        backupRecords: metadata.backupRecordsCreated || 0
      };
    }
  }

  /**
   * Extract performance metrics
   */
  extractPerformanceMetrics() {
    if (!this.reportData.verification?.metadata?.metrics) return;

    const metrics = this.reportData.verification.metadata.metrics;

    if (metrics.performanceMetrics) {
      this.reportData.performance = {
        queries: metrics.performanceMetrics,
        summary: {
          fastQueries: Object.values(metrics.performanceMetrics).filter(m => m.performance === 'good').length,
          acceptableQueries: Object.values(metrics.performanceMetrics).filter(m => m.performance === 'acceptable').length,
          slowQueries: Object.values(metrics.performanceMetrics).filter(m => m.performance === 'poor').length
        }
      };
    }
  }

  /**
   * Collect issues from verification
   */
  collectIssues() {
    if (!this.reportData.verification?.metadata?.summary?.issues) return;

    this.reportData.issues = this.reportData.verification.metadata.summary.issues;

    // Categorize issues
    this.reportData.issueSummary = {
      critical: this.reportData.issues.filter(i => i.severity === 'CRITICAL').length,
      high: this.reportData.issues.filter(i => i.severity === 'HIGH').length,
      medium: this.reportData.issues.filter(i => i.severity === 'MEDIUM').length,
      low: this.reportData.issues.filter(i => i.severity === 'LOW').length
    };
  }

  /**
   * Format duration from seconds
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const timestamp = new Date().toISOString();
    const status = this.reportData.verification?.metadata?.summary?.overallStatus || 'UNKNOWN';
    const scores = this.reportData.verification?.metadata?.summary?.scores || {};

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Migration Report - ${timestamp}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header .subtitle {
      opacity: 0.9;
      font-size: 1.1em;
    }

    .status-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: bold;
      margin-top: 20px;
      font-size: 1.2em;
    }

    .status-success { background: #10b981; color: white; }
    .status-warning { background: #f59e0b; color: white; }
    .status-error { background: #ef4444; color: white; }
    .status-unknown { background: #6b7280; color: white; }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section h2 {
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }

    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }

    .stat-card .label {
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 5px;
    }

    .score-bar {
      background: #e5e7eb;
      height: 30px;
      border-radius: 15px;
      overflow: hidden;
      margin: 10px 0;
      position: relative;
    }

    .score-fill {
      height: 100%;
      border-radius: 15px;
      display: flex;
      align-items: center;
      padding: 0 15px;
      color: white;
      font-weight: bold;
      transition: width 0.3s ease;
    }

    .score-good { background: #10b981; }
    .score-warning { background: #f59e0b; }
    .score-error { background: #ef4444; }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .table th,
    .table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .table th {
      background: #f9fafb;
      font-weight: bold;
      color: #667eea;
    }

    .table tr:hover {
      background: #f9fafb;
    }

    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 20px;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -35px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #667eea;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .timeline-item.error::before {
      background: #ef4444;
    }

    .timeline-item .time {
      color: #6b7280;
      font-size: 0.9em;
    }

    .timeline-item .phase {
      font-weight: bold;
      color: #333;
    }

    .issues {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .issues h3 {
      color: #ef4444;
      margin-bottom: 15px;
    }

    .issue-item {
      background: white;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      border-left: 4px solid #ef4444;
    }

    .issue-item.medium {
      border-left-color: #f59e0b;
    }

    .issue-item.low {
      border-left-color: #3b82f6;
    }

    .recommendations {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .recommendations h3 {
      color: #10b981;
      margin-bottom: 15px;
    }

    .recommendations ul {
      list-style: none;
      padding-left: 0;
    }

    .recommendations li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }

    .recommendations li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .footer {
      background: #f9fafb;
      padding: 20px 40px;
      text-align: center;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CRM Migration Report</h1>
      <div class="subtitle">${timestamp}</div>
      <div class="status-badge status-${status.toLowerCase().includes('success') ? 'success' :
                                       status.toLowerCase().includes('warning') ? 'warning' :
                                       status.toLowerCase().includes('fail') ? 'error' : 'unknown'}">
        ${status.replace(/_/g, ' ')}
      </div>
    </div>

    <div class="content">
      <!-- Summary Section -->
      <div class="section">
        <h2>📊 Migration Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${this.reportData.statistics.migrationDuration?.formatted || 'N/A'}</div>
            <div class="label">Migration Duration</div>
          </div>
          <div class="stat-card">
            <div class="value">${this.reportData.statistics.successRate || '0'}%</div>
            <div class="label">Success Rate</div>
          </div>
          <div class="stat-card">
            <div class="value">${this.reportData.statistics.opportunities || '0'}</div>
            <div class="label">Opportunities</div>
          </div>
          <div class="stat-card">
            <div class="value">${this.reportData.statistics.contacts || '0'}</div>
            <div class="label">Contacts</div>
          </div>
        </div>
      </div>

      <!-- Quality Scores Section -->
      <div class="section">
        <h2>📈 Quality Scores</h2>
        ${Object.entries(scores).map(([category, score]) => `
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${category.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span>${score.toFixed(1)}%</span>
            </div>
            <div class="score-bar">
              <div class="score-fill score-${score >= 95 ? 'good' : score >= 80 ? 'warning' : 'error'}"
                   style="width: ${score}%">
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Record Counts Section -->
      <div class="section">
        <h2>📋 Record Counts</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Record Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(this.reportData.statistics)
              .filter(([key]) => !['migrationDuration', 'successRate', 'transformations'].includes(key))
              .map(([table, count]) => `
                <tr>
                  <td>${table}</td>
                  <td>${count}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Performance Metrics Section -->
      ${this.reportData.performance.queries ? `
      <div class="section">
        <h2>⚡ Performance Metrics</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Query</th>
              <th>Execution Time</th>
              <th>Baseline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(this.reportData.performance.queries).map(([name, metric]) => `
              <tr>
                <td>${name}</td>
                <td>${metric.executionTime.toFixed(2)}ms</td>
                <td>${metric.baseline}ms</td>
                <td>
                  <span style="color: ${metric.performance === 'good' ? '#10b981' :
                                       metric.performance === 'acceptable' ? '#f59e0b' : '#ef4444'}">
                    ${metric.performance.toUpperCase()}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Issues Section -->
      ${this.reportData.issues.length > 0 ? `
      <div class="section">
        <div class="issues">
          <h3>⚠️ Issues Found (${this.reportData.issues.length})</h3>
          ${this.reportData.issues.map(issue => `
            <div class="issue-item ${issue.severity.toLowerCase()}">
              <strong>[${issue.severity}]</strong> ${issue.category}: ${issue.message}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Recommendations Section -->
      ${this.reportData.verification?.metadata?.summary?.recommendations?.length > 0 ? `
      <div class="section">
        <div class="recommendations">
          <h3>💡 Recommendations</h3>
          <ul>
            ${this.reportData.verification.metadata.summary.recommendations.map(rec => `
              <li>${rec}</li>
            `).join('')}
          </ul>
        </div>
      </div>
      ` : ''}

      <!-- Timeline Section -->
      <div class="section">
        <h2>🕐 Migration Timeline</h2>
        <div class="timeline">
          ${this.reportData.timeline.slice(-10).map(item => `
            <div class="timeline-item ${item.status === 'failed' ? 'error' : ''}">
              <div class="time">${new Date(item.executed_at).toLocaleString()}</div>
              <div class="phase">${item.phase} - ${item.step}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Generated by CRM Migration Report Generator</p>
      <p>Migration ID: ${this.reportData.migration?.id || 'Unknown'}</p>
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Save report to file
   */
  async saveReport(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportName = filename || `migration-report-${timestamp}.html`;
    const reportPath = path.join(__dirname, '..', 'logs', reportName);

    // Ensure logs directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    // Generate and save report
    const html = this.generateHTMLReport();
    await fs.writeFile(reportPath, html, 'utf-8');

    console.log(`\n✅ Report saved to: ${reportPath}`);
    return reportPath;
  }

  /**
   * Run report generation
   */
  async run() {
    console.log('📝 Generating Migration Report...');
    console.log('=' .repeat(60));

    try {
      // Gather all data
      await this.gatherMigrationData();

      // Generate and save report
      const reportPath = await this.saveReport();

      // Display summary
      console.log('\n📊 REPORT SUMMARY:');
      console.log(`  Status: ${this.reportData.verification?.metadata?.summary?.overallStatus || 'UNKNOWN'}`);
      console.log(`  Duration: ${this.reportData.statistics.migrationDuration?.formatted || 'N/A'}`);
      console.log(`  Success Rate: ${this.reportData.statistics.successRate || '0'}%`);

      if (this.reportData.issueSummary) {
        console.log('\n  Issues Found:');
        console.log(`    Critical: ${this.reportData.issueSummary.critical}`);
        console.log(`    High: ${this.reportData.issueSummary.high}`);
        console.log(`    Medium: ${this.reportData.issueSummary.medium}`);
        console.log(`    Low: ${this.reportData.issueSummary.low}`);
      }

      console.log('\n' + '=' .repeat(60));
      console.log('✅ Report generation complete');

      // Open report in browser if possible
      if (process.platform === 'darwin') {
        require('child_process').exec(`open ${reportPath}`);
      } else if (process.platform === 'win32') {
        require('child_process').exec(`start ${reportPath}`);
      }

    } catch (error) {
      console.error('❌ Report generation failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const generator = new MigrationReportGenerator();
  generator.run();
}

module.exports = MigrationReportGenerator;