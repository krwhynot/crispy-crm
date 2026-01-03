/**
 * MCP Usage Logger
 *
 * Logs all MCP tool calls to .claude/state/usage.log for visibility.
 * Shows when discovery files are actually being used by Claude.
 */

import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const LOG_FILE = join(process.cwd(), ".claude", "state", "usage.log");

// Ensure directory exists
const logDir = dirname(LOG_FILE);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

interface LogEntry {
  tool: string;
  query?: string;
  params?: Record<string, unknown>;
  resultCount?: number;
  duration?: number;
  error?: string;
}

/**
 * Log an MCP tool invocation to usage.log
 */
export function logToolCall(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const icon = entry.error ? "❌" : "✓";

  let line = `[${timestamp}] ${icon} ${entry.tool}`;

  if (entry.query) {
    line += ` | query: "${entry.query}"`;
  }

  if (entry.params && Object.keys(entry.params).length > 0) {
    const params = Object.entries(entry.params)
      .filter(([k]) => k !== "query") // Don't duplicate query
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(", ");
    if (params) {
      line += ` | ${params}`;
    }
  }

  if (entry.resultCount !== undefined) {
    line += ` | results: ${entry.resultCount}`;
  }

  if (entry.duration !== undefined) {
    line += ` | ${entry.duration}ms`;
  }

  if (entry.error) {
    line += ` | error: ${entry.error}`;
  }

  line += "\n";

  try {
    appendFileSync(LOG_FILE, line);
  } catch {
    // Silent fail - logging shouldn't break the MCP server
  }
}

/**
 * Create a wrapped tool executor with automatic logging
 */
export function withLogging<T>(
  toolName: string,
  fn: (args: T) => Promise<string>
): (args: T) => Promise<string> {
  return async (args: T) => {
    const start = Date.now();

    try {
      const result = await fn(args);
      const duration = Date.now() - start;

      // Parse result to get count
      let resultCount: number | undefined;
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          resultCount = parsed.length;
        } else if (parsed.results && Array.isArray(parsed.results)) {
          resultCount = parsed.results.length;
        } else if (parsed.references && Array.isArray(parsed.references)) {
          resultCount = parsed.references.length;
        }
      } catch {
        // Not JSON or unexpected format
      }

      logToolCall({
        tool: toolName,
        query: (args as Record<string, unknown>).query as string | undefined,
        params: args as Record<string, unknown>,
        resultCount,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logToolCall({
        tool: toolName,
        query: (args as Record<string, unknown>).query as string | undefined,
        params: args as Record<string, unknown>,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };
}
