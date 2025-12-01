/**
 * Structured Logging Utility
 *
 * Provides a unified logging interface that:
 * - Adds structured context to all log entries
 * - Tracks metrics for health monitoring
 * - Supports different log levels with appropriate routing
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123', role: 'admin' });
 * logger.error('Failed to save opportunity', new Error('Network error'), { opportunityId: '456' });
 * logger.metric('api_latency', 250, { endpoint: '/opportunities' });
 * ```
 */

/**
 * Log levels in order of severity
 */
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Structured log entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  tags?: Record<string, string>;
}

/**
 * Metric entry for health tracking
 */
interface MetricEntry {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

/**
 * In-memory metrics storage for the health dashboard
 * Uses a circular buffer to limit memory usage
 */
const MAX_METRICS = 1000;
const metricsBuffer: MetricEntry[] = [];
const errorCountByPeriod: Map<string, number> = new Map();
const requestCountByPeriod: Map<string, number> = new Map();

/**
 * Get current period key (minute-level granularity)
 */
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * Clean up old period data (keep last 60 minutes)
 */
function cleanupOldPeriods(): void {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour ago
  const cutoffDate = new Date(cutoff);
  const cutoffPeriod = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}-${String(cutoffDate.getHours()).padStart(2, "0")}-${String(cutoffDate.getMinutes()).padStart(2, "0")}`;

  for (const key of errorCountByPeriod.keys()) {
    if (key < cutoffPeriod) {
      errorCountByPeriod.delete(key);
    }
  }
  for (const key of requestCountByPeriod.keys()) {
    if (key < cutoffPeriod) {
      requestCountByPeriod.delete(key);
    }
  }
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context));
  }

  return parts.join(" ");
}

/**
 * Main logger class with structured logging capabilities
 */
class Logger {
  private isProduction = import.meta.env.PROD;
  private minLevel: LogLevel = this.isProduction ? "info" : "debug";

  private levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelOrder[level] >= this.levelOrder[this.minLevel];
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // Console output
    const formatted = formatLogEntry(entry);
    switch (level) {
      case "debug":
        console.debug(formatted, error || "");
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
      case "fatal":
        console.error(formatted, error || "");
        break;
    }

    // Track error count for metrics
    if (level === "error" || level === "fatal") {
      const period = getCurrentPeriod();
      errorCountByPeriod.set(period, (errorCountByPeriod.get(period) || 0) + 1);
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Error level logging
   */
  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const errorObj = error instanceof Error ? error : undefined;
    const contextWithError =
      error && !(error instanceof Error)
        ? { ...context, errorValue: error }
        : context;
    this.log("error", message, contextWithError, errorObj);
  }

  /**
   * Fatal level logging (critical errors)
   */
  fatal(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const errorObj = error instanceof Error ? error : undefined;
    const contextWithError =
      error && !(error instanceof Error)
        ? { ...context, errorValue: error }
        : context;
    this.log("fatal", message, contextWithError, errorObj);
  }

  /**
   * Track a metric for health monitoring
   */
  metric(name: string, value: number, tags?: Record<string, string>): void {
    const entry: MetricEntry = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
    };

    // Add to circular buffer
    if (metricsBuffer.length >= MAX_METRICS) {
      metricsBuffer.shift();
    }
    metricsBuffer.push(entry);

    // Debug output
    if (!this.isProduction) {
      console.debug(`[METRIC] ${name}: ${value}`, tags || "");
    }
  }

  /**
   * Track an API request (for error rate calculation)
   */
  trackRequest(endpoint: string, success: boolean, latencyMs?: number): void {
    const period = getCurrentPeriod();
    requestCountByPeriod.set(
      period,
      (requestCountByPeriod.get(period) || 0) + 1
    );

    if (!success) {
      errorCountByPeriod.set(period, (errorCountByPeriod.get(period) || 0) + 1);
    }

    if (latencyMs !== undefined) {
      this.metric("api_latency", latencyMs, { endpoint });
    }

    // Periodic cleanup
    if (Math.random() < 0.01) {
      cleanupOldPeriods();
    }
  }

  /**
   * Get current error rate (percentage of failed requests)
   */
  getErrorRate(): number {
    cleanupOldPeriods();

    let totalErrors = 0;
    let totalRequests = 0;

    for (const count of errorCountByPeriod.values()) {
      totalErrors += count;
    }
    for (const count of requestCountByPeriod.values()) {
      totalRequests += count;
    }

    if (totalRequests === 0) return 0;
    return (totalErrors / totalRequests) * 100;
  }

  /**
   * Get metrics for the health dashboard
   */
  getMetrics(): {
    errorRate: number;
    totalRequests: number;
    totalErrors: number;
    recentMetrics: MetricEntry[];
  } {
    cleanupOldPeriods();

    let totalErrors = 0;
    let totalRequests = 0;

    for (const count of errorCountByPeriod.values()) {
      totalErrors += count;
    }
    for (const count of requestCountByPeriod.values()) {
      totalRequests += count;
    }

    return {
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      totalRequests,
      totalErrors,
      recentMetrics: metricsBuffer.slice(-100), // Last 100 metrics
    };
  }

  /**
   * Check if error rate exceeds threshold (for alerting)
   * Default threshold: 1%
   */
  isErrorRateHigh(threshold: number = 1): boolean {
    return this.getErrorRate() > threshold;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for consumers
export type { LogLevel, LogEntry, MetricEntry };
