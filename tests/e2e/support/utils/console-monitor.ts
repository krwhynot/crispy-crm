import { Page } from '@playwright/test';

/**
 * Console error monitoring utility
 * Captures console errors, warnings, and categorizes them for diagnostic output
 *
 * Required by playwright-e2e-testing skill
 */
export class ConsoleMonitor {
  private errors: Array<{ type: string; message: string; timestamp: number }> = [];

  /**
   * Attach console monitoring to a page
   * Call this in test.beforeEach
   */
  async attach(page: Page): Promise<void> {
    this.errors = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        this.errors.push({
          type,
          message: msg.text(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push({
        type: 'exception',
        message: error.message,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Get all captured errors
   */
  getErrors(): Array<{ type: string; message: string; timestamp: number }> {
    return this.errors;
  }

  /**
   * Check if any RLS (Row Level Security) errors occurred
   */
  hasRLSErrors(): boolean {
    return this.errors.some(
      (e) =>
        e.message.includes('permission denied') ||
        e.message.includes('RLS') ||
        e.message.includes('row-level security')
    );
  }

  /**
   * Check if any React errors occurred
   */
  hasReactErrors(): boolean {
    return this.errors.some(
      (e) =>
        e.message.includes('React') ||
        e.message.includes('Hook') ||
        e.message.includes('component')
    );
  }

  /**
   * Check if any network errors occurred
   */
  hasNetworkErrors(): boolean {
    return this.errors.some(
      (e) =>
        e.message.includes('Failed to fetch') ||
        e.message.includes('Network') ||
        e.message.includes('CORS')
    );
  }

  /**
   * Get a formatted report of all errors
   */
  getReport(): string {
    if (this.errors.length === 0) {
      return 'No console errors detected';
    }

    let report = `\n=== Console Errors Report (${this.errors.length} errors) ===\n`;

    if (this.hasRLSErrors()) {
      report += '\n⚠️  RLS/Permission errors detected!\n';
    }
    if (this.hasReactErrors()) {
      report += '⚠️  React errors detected!\n';
    }
    if (this.hasNetworkErrors()) {
      report += '⚠️  Network errors detected!\n';
    }

    report += '\nErrors:\n';
    this.errors.forEach((error, idx) => {
      report += `\n${idx + 1}. [${error.type.toUpperCase()}] ${error.message}\n`;
    });

    return report;
  }

  /**
   * Clear all captured errors
   */
  clear(): void {
    this.errors = [];
  }
}

// Singleton instance for use across tests
export const consoleMonitor = new ConsoleMonitor();
