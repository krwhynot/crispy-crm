/**
 * Client-side rate limiting for import operations
 * Prevents bulk upload abuse and excessive database load
 *
 * Phase 1 Security Remediation - MEDIUM/HIGH
 *
 * Protects against:
 * - Accidental bulk data corruption (user imports wrong file 20 times)
 * - Compromised accounts (attacker abuses CSV imports)
 * - Database overload (too many concurrent large imports)
 *
 * @module rateLimiter
 */

import { z } from "zod";
import { logger } from "@/lib/logger";
import { safeJsonParse } from "./safeJsonParse";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  storageKey: string;
}

interface RateLimitState {
  requests: number[];
  firstRequest: number;
}

const rateLimitStateSchema = z.strictObject({
  requests: z.array(z.number()).max(1000),
  firstRequest: z.number(),
});

/**
 * Client-side rate limiter using sessionStorage
 *
 * Limits number of operations within a time window.
 * Uses sessionStorage (cleared on tab close) for tracking.
 *
 * @example
 * const limiter = new ClientRateLimiter({
 *   maxRequests: 10,
 *   windowMs: 24 * 60 * 60 * 1000, // 24 hours
 *   storageKey: 'rate_limit_csv_import'
 * });
 *
 * if (!limiter.canProceed()) {
 *   alert(`Too many imports. Try again in ${limiter.getResetTimeFormatted()}`);
 *   return;
 * }
 */
export class ClientRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if operation is allowed under rate limit
   *
   * @returns true if operation allowed, false if rate limit exceeded
   */
  canProceed(): boolean {
    const state = this.getState();
    const now = Date.now();

    // Remove requests outside the window
    const validRequests = state.requests.filter((time) => now - time < this.config.windowMs);

    if (validRequests.length < this.config.maxRequests) {
      // Allow operation, record timestamp
      validRequests.push(now);
      this.setState({
        requests: validRequests,
        firstRequest: validRequests[0],
      });
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests in current window
   *
   * @returns Number of operations remaining before rate limit
   */
  getRemaining(): number {
    const state = this.getState();
    const now = Date.now();
    const validRequests = state.requests.filter((time) => now - time < this.config.windowMs);
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Get milliseconds until rate limit resets
   *
   * @returns Milliseconds until oldest request expires
   */
  getResetTime(): number {
    const state = this.getState();
    if (state.requests.length === 0) return 0;

    const now = Date.now();
    const oldestRequest = state.requests[0];
    return Math.max(0, this.config.windowMs - (now - oldestRequest));
  }

  /**
   * Get formatted reset time for display
   *
   * @returns Human-readable time until reset (e.g., "5 minutes", "2 hours")
   */
  getResetTimeFormatted(): string {
    const ms = this.getResetTime();
    if (ms === 0) return "now";

    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""}`;

    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  /**
   * Clear rate limit state (for testing or admin override)
   */
  reset(): void {
    sessionStorage.removeItem(this.config.storageKey);
  }

  /**
   * Get current rate limit state from sessionStorage
   */
  private getState(): RateLimitState {
    const stored = sessionStorage.getItem(this.config.storageKey);
    if (stored) {
      const parsed = safeJsonParse(stored, rateLimitStateSchema);
      if (parsed) {
        return parsed;
      }
    }

    return { requests: [], firstRequest: Date.now() };
  }

  /**
   * Save rate limit state to sessionStorage
   */
  private setState(state: RateLimitState): void {
    try {
      sessionStorage.setItem(this.config.storageKey, JSON.stringify(state));
    } catch (error: unknown) {
      logger.error(
        "Failed to save rate limiter state",
        error instanceof Error ? error : new Error(String(error)),
        { feature: "rateLimiter", storageKey: this.config.storageKey }
      );
    }
  }
}

// ============================================================================
// Singleton Instances for Different Import Types
// ============================================================================

/**
 * Rate limiter for contact CSV imports
 * Limit: 10 imports per 24 hours
 */
export const contactImportLimiter = new ClientRateLimiter({
  maxRequests: 10, // 10 imports per day
  windowMs: 24 * 60 * 60 * 1000,
  storageKey: "rate_limit_contact_import",
});

/**
 * Rate limiter for organization CSV imports
 * Limit: 10 imports per 24 hours
 */
export const organizationImportLimiter = new ClientRateLimiter({
  maxRequests: 10,
  windowMs: 24 * 60 * 60 * 1000,
  storageKey: "rate_limit_organization_import",
});
