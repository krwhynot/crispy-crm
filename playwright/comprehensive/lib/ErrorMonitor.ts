import { Page } from '@playwright/test';

/**
 * ErrorMonitor - Comprehensive error tracking and categorization
 *
 * Captures:
 * - Console errors with stack traces
 * - Network failures with request/response details
 * - Validation errors from form submissions
 * - React Admin and Supabase specific errors
 */

export interface CapturedError {
  timestamp: string;
  type: 'console' | 'network' | 'validation' | 'exception';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  details?: any;
}

export class ErrorMonitor {
  private page: Page;
  private errors: CapturedError[] = [];
  private networkActivity: any[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start monitoring errors on the page
   */
  async startMonitoring(): Promise<void> {
    // Inject error capturing code
    await this.page.addInitScript(() => {
      window.__capturedLogs = [];
      window.__networkActivity = [];

      // Capture console methods
      const originalConsole = { ...console };
      ['log', 'warn', 'error', 'info'].forEach(method => {
        (console as any)[method] = (...args: any[]) => {
          window.__capturedLogs.push({
            level: method,
            message: args.map(a => String(a)).join(' '),
            timestamp: new Date().toISOString(),
            stack: new Error().stack,
          });
          (originalConsole as any)[method](...args);
        };
      });

      // Capture fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args: any[]) => {
        const [url, options] = args;
        const requestId = Date.now();

        window.__networkActivity.push({
          id: requestId,
          type: 'request',
          url: String(url),
          method: options?.method || 'GET',
          timestamp: new Date().toISOString(),
        });

        try {
          const response = await originalFetch(...args);
          window.__networkActivity.push({
            id: requestId,
            type: 'response',
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
          });
          return response;
        } catch (error: any) {
          window.__networkActivity.push({
            id: requestId,
            type: 'error',
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          throw error;
        }
      };
    });

    // Listen for console events
    this.page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        this.errors.push({
          timestamp: new Date().toISOString(),
          type: 'console',
          severity: type === 'error' ? 'high' : 'medium',
          message: msg.text(),
        });
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.errors.push({
        timestamp: new Date().toISOString(),
        type: 'exception',
        severity: 'critical',
        message: error.message,
        stack: error.stack,
      });
    });
  }

  /**
   * Get all captured errors
   */
  getErrors(): CapturedError[] {
    return this.errors;
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): CapturedError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Get console logs from page
   */
  async getConsoleLogs(): Promise<any[]> {
    return await this.page.evaluate(() => window.__capturedLogs || []);
  }

  /**
   * Get network activity from page
   */
  async getNetworkActivity(): Promise<any[]> {
    return await this.page.evaluate(() => window.__networkActivity || []);
  }

  /**
   * Clear captured errors
   */
  clear(): void {
    this.errors = [];
    this.networkActivity = [];
  }

  /**
   * Check if any critical errors occurred
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(e => e.severity === 'critical');
  }
}