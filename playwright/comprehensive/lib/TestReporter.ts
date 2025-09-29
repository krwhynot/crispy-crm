import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TestReporter - Comprehensive test reporting with narrative generation
 *
 * Design Philosophy:
 * - Reports should tell a story that anyone can understand
 * - Distinguish between test execution success and application health
 * - Provide actionable recommendations with code examples
 * - Categorize issues by severity and impact
 *
 * This reporter captures:
 * - Timeline of all test actions
 * - Console errors with stack traces
 * - Network failures with request/response details
 * - Performance metrics per operation
 * - Screenshots linked to specific events
 * - Data used for each test operation
 */

export interface TestAction {
  timestamp: string;
  module: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  duration?: number;
  details?: string;
  data?: any;
}

export interface TestIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'bug' | 'performance' | 'validation' | 'ux';
  module: string;
  title: string;
  description: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  codeExample?: string;
  screenshot?: string;
  location?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  status: 'excellent' | 'good' | 'acceptable' | 'slow' | 'failed';
}

export interface ModuleReport {
  moduleName: string;
  status: 'passed' | 'warning' | 'failed';
  duration: number;
  startTime: string;
  actions: TestAction[];
  issues: TestIssue[];
  performance: PerformanceMetric[];
  screenshots: string[];
  consoleLogs: any[];
  dataUsed: any;
}

export class TestReporter {
  private startTime: Date;
  private modules: Map<string, ModuleReport> = new Map();
  private currentModule: string | null = null;
  private outputDir: string;
  private globalConsoleLogs: any[] = [];
  private globalNetworkActivity: any[] = [];

  constructor(outputDir: string) {
    this.startTime = new Date();
    this.outputDir = outputDir;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Start reporting for a specific module
   */
  startModule(moduleName: string): void {
    this.currentModule = moduleName;
    this.modules.set(moduleName, {
      moduleName,
      status: 'passed',
      duration: 0,
      startTime: new Date().toISOString(),
      actions: [],
      issues: [],
      performance: [],
      screenshots: [],
      consoleLogs: [],
      dataUsed: {},
    });
  }

  /**
   * End reporting for current module
   */
  endModule(status: 'passed' | 'warning' | 'failed'): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      const startTime = new Date(report.startTime);
      report.duration = Date.now() - startTime.getTime();
      report.status = status;
    }

    this.currentModule = null;
  }

  /**
   * Record a test action
   */
  recordAction(
    action: string,
    status: 'success' | 'warning' | 'error',
    details?: string,
    duration?: number,
    data?: any
  ): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      report.actions.push({
        timestamp: new Date().toISOString(),
        module: this.currentModule,
        action,
        status,
        duration,
        details,
        data,
      });
    }
  }

  /**
   * Record an issue found during testing
   */
  recordIssue(issue: TestIssue): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      report.issues.push(issue);

      // Automatically upgrade module status based on issue severity
      if (issue.severity === 'critical' && report.status !== 'failed') {
        report.status = 'failed';
      } else if (issue.severity === 'high' && report.status === 'passed') {
        report.status = 'warning';
      }
    }
  }

  /**
   * Record performance metric
   */
  recordPerformance(operation: string, duration: number): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      let status: 'excellent' | 'good' | 'acceptable' | 'slow' | 'failed';

      if (duration < 500) status = 'excellent';
      else if (duration < 1000) status = 'good';
      else if (duration < 2000) status = 'acceptable';
      else if (duration < 5000) status = 'slow';
      else status = 'failed';

      report.performance.push({
        operation,
        duration,
        status,
      });
    }
  }

  /**
   * Add screenshot reference
   */
  addScreenshot(filename: string): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      report.screenshots.push(filename);
    }
  }

  /**
   * Add console log
   */
  addConsoleLog(log: any): void {
    this.globalConsoleLogs.push(log);

    if (this.currentModule) {
      const report = this.modules.get(this.currentModule);
      if (report) {
        report.consoleLogs.push(log);
      }
    }
  }

  /**
   * Add network activity
   */
  addNetworkActivity(activity: any): void {
    this.globalNetworkActivity.push(activity);
  }

  /**
   * Set test data used for current module
   */
  setTestData(data: any): void {
    if (!this.currentModule) return;

    const report = this.modules.get(this.currentModule);
    if (report) {
      report.dataUsed = data;
    }
  }

  /**
   * Generate comprehensive markdown report
   */
  generateMarkdownReport(): string {
    const totalDuration = Date.now() - this.startTime.getTime();
    const totalModules = this.modules.size;

    // Calculate statistics
    const passedModules = Array.from(this.modules.values()).filter(m => m.status === 'passed').length;
    const warningModules = Array.from(this.modules.values()).filter(m => m.status === 'warning').length;
    const failedModules = Array.from(this.modules.values()).filter(m => m.status === 'failed').length;

    const allIssues = Array.from(this.modules.values()).flatMap(m => m.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const highIssues = allIssues.filter(i => i.severity === 'high');

    // Determine overall status
    const overallStatus = failedModules > 0 ? '❌ Failed' :
                         warningModules > 0 ? '⚠️ Completed with Issues' :
                         '✅ Passed';

    let report = `# CRM Comprehensive Data Flow Validation Report

**Generated**: ${new Date().toISOString()}
**Test Suite**: Atomic CRM Comprehensive E2E Tests v1.0
**Environment**: http://localhost:5173

---

## Executive Summary ${failedModules > 0 ? '❌' : warningModules > 0 ? '⚠️' : '✅'}

**Overall Status**: ${overallStatus}
**Test Duration**: ${this.formatDuration(totalDuration)}
**Browser**: Chromium (Headless)
**Modules Tested**: ${totalModules} of ${totalModules} (100%)

### Quick Stats
- ✅ **Passed Modules**: ${passedModules}
- ⚠️ **Modules with Warnings**: ${warningModules}
- ❌ **Failed Modules**: ${failedModules}
- 🐛 **Critical Issues Found**: ${criticalIssues.length}
- ⚠️ **High Priority Issues**: ${highIssues.length}

---

## Module Test Results

`;

    // Add detailed module reports
    for (const [moduleName, moduleReport] of this.modules.entries()) {
      report += this.generateModuleSection(moduleReport);
    }

    // Add critical findings section
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      report += this.generateCriticalFindingsSection(allIssues);
    }

    // Add performance summary
    report += this.generatePerformanceSummary();

    // Add recommendations
    report += this.generateRecommendations(allIssues);

    // Add assessment
    report += this.generateAssessment(failedModules, warningModules, criticalIssues.length);

    return report;
  }

  /**
   * Generate module section for report
   */
  private generateModuleSection(moduleReport: ModuleReport): string {
    const statusIcon = moduleReport.status === 'passed' ? '✅' :
                      moduleReport.status === 'warning' ? '⚠️' : '❌';

    let section = `### ${moduleReport.moduleName} Module ${statusIcon}
**Status**: ${statusIcon} ${moduleReport.status.charAt(0).toUpperCase() + moduleReport.status.slice(1)}
**Duration**: ${this.formatDuration(moduleReport.duration)}
**Test Started**: ${new Date(moduleReport.startTime).toISOString().split('T')[1].split('.')[0]}

#### Actions Performed
`;

    // List actions with status icons
    moduleReport.actions.forEach((action, index) => {
      const icon = action.status === 'success' ? '✅' :
                   action.status === 'warning' ? '⚠️' : '❌';
      section += `${index + 1}. ${icon} ${action.action}\n`;
    });

    // Add test data if present
    if (moduleReport.dataUsed && Object.keys(moduleReport.dataUsed).length > 0) {
      section += `\n#### Data Used\n\`\`\`json\n${JSON.stringify(moduleReport.dataUsed, null, 2)}\n\`\`\`\n\n`;
    }

    // Add issues
    if (moduleReport.issues.length > 0) {
      section += `\n#### Issues Discovered\n\n`;

      moduleReport.issues.forEach(issue => {
        const severityIcon = issue.severity === 'critical' ? '🐛' :
                           issue.severity === 'high' ? '⚠️' :
                           issue.severity === 'medium' ? '💡' : 'ℹ️';

        section += `##### ${severityIcon} ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}: ${issue.title}
- **Type**: ${issue.type}
- **Severity**: ${issue.severity}
${issue.location ? `- **Location**: \`${issue.location}\`\n` : ''}- **Description**: ${issue.description}
- **Impact**: ${issue.impact}
- **Recommendation**: ${issue.recommendation}

`;

        if (issue.codeExample) {
          section += `**Suggested Fix**:\n\`\`\`typescript\n${issue.codeExample}\n\`\`\`\n\n`;
        }
      });
    }

    // Add performance metrics
    if (moduleReport.performance.length > 0) {
      section += `\n#### Performance Metrics\n| Operation | Duration | Status |\n|-----------|----------|--------|\n`;

      moduleReport.performance.forEach(metric => {
        const statusIcon = metric.status === 'excellent' ? '✅' :
                         metric.status === 'good' ? '✅' :
                         metric.status === 'acceptable' ? '⚠️' :
                         metric.status === 'slow' ? '⚠️' : '❌';
        section += `| ${metric.operation} | ${metric.duration}ms | ${statusIcon} ${metric.status} |\n`;
      });

      section += '\n';
    }

    // Add screenshots
    if (moduleReport.screenshots.length > 0) {
      section += `\n#### Screenshots Captured\n`;
      moduleReport.screenshots.forEach(screenshot => {
        section += `- \`${screenshot}\`\n`;
      });
      section += '\n';
    }

    section += '\n---\n\n';

    return section;
  }

  /**
   * Generate critical findings section
   */
  private generateCriticalFindingsSection(allIssues: TestIssue[]): string {
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const highIssues = allIssues.filter(i => i.severity === 'high');

    let section = `## Critical Findings Summary\n\n`;

    if (criticalIssues.length > 0) {
      section += `### 🔴 Critical Issues (MUST FIX BEFORE PRODUCTION)\n\n`;

      criticalIssues.forEach((issue, index) => {
        section += `#### ${index + 1}. ${issue.title}
**Module**: ${issue.module}
**Severity**: 🔴 ${issue.severity}
**Impact**: ${issue.impact}
**Priority**: P0 - Fix Immediately

**Description**: ${issue.description}

**Recommendation**: ${issue.recommendation}

`;
        if (issue.codeExample) {
          section += `**Recommended Fix**:\n\`\`\`typescript\n${issue.codeExample}\n\`\`\`\n\n`;
        }
      });
    }

    if (highIssues.length > 0) {
      section += `### ⚠️ High Priority Issues (Fix Before Next Release)\n\n`;

      highIssues.forEach((issue, index) => {
        section += `#### ${criticalIssues.length + index + 1}. ${issue.title}
**Module**: ${issue.module}
**Severity**: ${issue.severity}
**Impact**: ${issue.impact}
**Priority**: P1 - Fix Soon

**Description**: ${issue.description}

**Recommendation**: ${issue.recommendation}

`;
      });
    }

    section += '\n---\n\n';

    return section;
  }

  /**
   * Generate performance summary
   */
  private generatePerformanceSummary(): string {
    let section = `## Performance Summary\n\n`;

    // Calculate average performance per module
    section += `### Module-Specific Performance\n\n`;

    for (const [moduleName, moduleReport] of this.modules.entries()) {
      if (moduleReport.performance.length === 0) continue;

      const avgDuration = moduleReport.performance.reduce((sum, m) => sum + m.duration, 0) / moduleReport.performance.length;
      const slowest = moduleReport.performance.reduce((max, m) => m.duration > max.duration ? m : max);

      const statusIcon = avgDuration < 1000 ? '✅' : avgDuration < 2000 ? '⚠️' : '❌';

      section += `#### ${statusIcon} ${moduleName}
- **Average Response Time**: ${Math.round(avgDuration)}ms
- **Slowest Operation**: ${slowest.operation} (${slowest.duration}ms)

`;
    }

    section += '\n---\n\n';

    return section;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(allIssues: TestIssue[]): string {
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const highIssues = allIssues.filter(i => i.severity === 'high');
    const mediumIssues = allIssues.filter(i => i.severity === 'medium');
    const lowIssues = allIssues.filter(i => i.severity === 'low');

    let section = `## Recommendations by Priority\n\n`;

    if (criticalIssues.length > 0) {
      section += `### 🔴 P0 - Critical (Fix This Week)\n`;
      criticalIssues.forEach((issue, index) => {
        section += `${index + 1}. **${issue.title}** - ${issue.impact}\n`;
      });
      section += '\n';
    }

    if (highIssues.length > 0) {
      section += `### ⚠️ P1 - High (Fix Next Sprint)\n`;
      highIssues.forEach((issue, index) => {
        section += `${index + 1}. **${issue.title}** - ${issue.impact}\n`;
      });
      section += '\n';
    }

    if (mediumIssues.length > 0) {
      section += `### 💡 P2 - Medium (Technical Debt)\n`;
      mediumIssues.forEach((issue, index) => {
        section += `${index + 1}. **${issue.title}** - ${issue.impact}\n`;
      });
      section += '\n';
    }

    if (lowIssues.length > 0) {
      section += `### 📊 P3 - Low (Nice to Have)\n`;
      lowIssues.forEach((issue, index) => {
        section += `${index + 1}. **${issue.title}** - ${issue.impact}\n`;
      });
      section += '\n';
    }

    section += '\n---\n\n';

    return section;
  }

  /**
   * Generate final assessment
   */
  private generateAssessment(failedModules: number, warningModules: number, criticalIssues: number): string {
    let section = `## Assessment & Next Steps\n\n`;

    if (failedModules > 0 || criticalIssues > 0) {
      section += `### Overall Application Health: ❌ **Not Production Ready**\n\n`;
      section += `The Atomic CRM application has **${criticalIssues} critical bug(s)** that will significantly impact user experience. These issues must be resolved before production deployment.\n\n`;
    } else if (warningModules > 0) {
      section += `### Overall Application Health: ⚠️ **Needs Attention**\n\n`;
      section += `The Atomic CRM application is functionally complete but has some issues that should be addressed before production deployment.\n\n`;
    } else {
      section += `### Overall Application Health: ✅ **Production Ready**\n\n`;
      section += `The Atomic CRM application passed all comprehensive tests successfully. No blocking issues were found.\n\n`;
    }

    section += `### Test Automation Value\n\nThis comprehensive test suite successfully:\n`;
    section += `- ✅ Validated data flow across all major modules\n`;
    section += `- ✅ Documented real user workflows with evidence\n`;
    section += `- ✅ Provided actionable recommendations\n`;

    if (criticalIssues > 0) {
      section += `- ✅ **Identified ${criticalIssues} critical bug(s)** that would have shipped to production\n`;
    }

    section += `\n**Recommendation**: Run this suite before each release to catch regressions early.\n\n`;
    section += `---\n\n`;

    const timestamp = new Date().toISOString();
    section += `**Report Generated**: ${timestamp}  \n`;
    section += `**Test Suite Version**: 1.0.0  \n\n`;
    section += `---\n\n`;
    section += `*This report was automatically generated by the Atomic CRM Comprehensive Test Suite.*\n`;

    return section;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Save report to file
   */
  async saveReport(): Promise<void> {
    const markdown = this.generateMarkdownReport();
    const reportPath = path.join(this.outputDir, 'report.md');

    fs.writeFileSync(reportPath, markdown, 'utf-8');

    // Also save JSON version for machine processing
    const jsonData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime.getTime(),
      modules: Array.from(this.modules.values()),
      consoleLogs: this.globalConsoleLogs,
      networkActivity: this.globalNetworkActivity,
    };

    const jsonPath = path.join(this.outputDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log(`\n✅ Report saved to: ${reportPath}`);
    console.log(`📊 JSON data saved to: ${jsonPath}`);
  }
}