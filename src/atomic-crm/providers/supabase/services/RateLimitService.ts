/**
 * RateLimitService - Handles 429 rate limit errors with exponential backoff retry logic
 *
 * Strategy:
 * 1. Detects 429 errors from Supabase API
 * 2. Implements exponential backoff with jitter for retries
 * 3. Respects Retry-After header when provided
 * 4. Configurable max retries and timeouts
 * 5. Circuit breaker pattern to fail fast after repeated failures
 */

export interface RateLimitConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
  respectRetryAfter: boolean;
  circuitBreakerThreshold: number; // Consecutive failures before circuit opens
}

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  nextRetryDelayMs: number;
  retryAfterMs?: number;
  resourceName?: string;
  operation?: string;
}

export class RateLimitService {
  private config: RateLimitConfig;
  private consecutiveFailures: number = 0;
  private circuitOpen: boolean = false;
  private lastFailureTime: number = 0;
  private circuitOpenResetMs: number = 60000; // Reset circuit after 1 minute

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 10000,
      jitterFactor: 0.2,
      respectRetryAfter: true,
      circuitBreakerThreshold: 5,
      ...config,
    };
  }

  /**
   * Check if error is a rate limit error (429)
   */
  private isRateLimitError(error: any): boolean {
    return (
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('rate limit') ||
      error?.message?.includes('Too Many Requests')
    );
  }

  /**
   * Extract Retry-After header value in milliseconds
   */
  private getRetryAfterMs(error: any): number | undefined {
    let retryAfter = error?.headers?.['retry-after'] || error?.['retry-after'];

    if (!retryAfter) {
      return undefined;
    }

    // Retry-After can be in seconds (integer) or HTTP date
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }

    // Try parsing as HTTP date
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      return Math.max(0, date.getTime() - Date.now());
    }

    return undefined;
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private calculateBackoffMs(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.initialDelayMs * Math.pow(2, attempt),
      this.config.maxDelayMs
    );

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Check if circuit breaker should open
   */
  private shouldOpenCircuit(): boolean {
    return this.consecutiveFailures >= this.config.circuitBreakerThreshold;
  }

  /**
   * Attempt to reset circuit breaker (after timeout)
   */
  private tryResetCircuit(): void {
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    if (timeSinceLastFailure > this.circuitOpenResetMs) {
      this.circuitOpen = false;
      this.consecutiveFailures = 0;
      console.log('[RateLimit] Circuit breaker reset after timeout');
    }
  }

  /**
   * Execute operation with automatic retry on rate limit
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: { resourceName?: string; operation?: string }
  ): Promise<T> {
    // Try to reset circuit if enough time has passed
    this.tryResetCircuit();

    // Fail fast if circuit is open
    if (this.circuitOpen) {
      const error = new Error(
        'Rate limit circuit breaker is open. Too many consecutive failures. ' +
        'Please wait before retrying.'
      );
      (error as any).code = 'RATE_LIMIT_CIRCUIT_OPEN';
      throw error;
    }

    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        // Success - reset failure counter
        this.consecutiveFailures = 0;
        return result;
      } catch (error: any) {
        lastError = error;

        // Not a rate limit error - fail immediately
        if (!this.isRateLimitError(error)) {
          this.consecutiveFailures = 0;
          throw error;
        }

        // It's a rate limit error - track consecutive failures
        this.consecutiveFailures++;
        this.lastFailureTime = Date.now();

        // Check if we should open circuit
        if (this.shouldOpenCircuit()) {
          this.circuitOpen = true;
          console.error(
            `[RateLimit] Circuit breaker opened after ${this.consecutiveFailures} consecutive failures`
          );
          const circuitError = new Error(
            'Rate limit circuit breaker opened. Too many rate limit errors.'
          );
          (circuitError as any).code = 'RATE_LIMIT_CIRCUIT_OPEN';
          (circuitError as any).originalError = error;
          throw circuitError;
        }

        // Last attempt - don't retry
        if (attempt === this.config.maxRetries) {
          console.error(
            `[RateLimit] Max retries exceeded (${this.config.maxRetries}) for ${context?.operation || 'operation'}`
          );
          const maxRetriesError = new Error(
            `Rate limit error persisted after ${this.config.maxRetries} retries. ` +
            'The system is temporarily overloaded. Please try again in a few moments.'
          );
          (maxRetriesError as any).code = 'RATE_LIMIT_MAX_RETRIES_EXCEEDED';
          (maxRetriesError as any).originalError = error;
          throw maxRetriesError;
        }

        // Calculate delay
        let delayMs = this.calculateBackoffMs(attempt);

        // Respect Retry-After header if present and enabled
        if (this.config.respectRetryAfter) {
          const retryAfterMs = this.getRetryAfterMs(error);
          if (retryAfterMs !== undefined) {
            delayMs = retryAfterMs;
          }
        }

        const retryContext: RetryContext = {
          attempt: attempt + 1,
          totalAttempts: this.config.maxRetries + 1,
          nextRetryDelayMs: delayMs,
          retryAfterMs: this.getRetryAfterMs(error),
          resourceName: context?.resourceName,
          operation: context?.operation,
        };

        console.warn(
          `[RateLimit] Rate limit detected. Retrying in ${delayMs}ms (attempt ${retryContext.attempt}/${retryContext.totalAttempts})`,
          retryContext
        );

        // Wait before retrying
        await this.delay(delayMs);
      }
    }

    // Should never reach here, but fail gracefully
    throw lastError || new Error('Unknown error during retry operation');
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current circuit breaker state (for monitoring)
   */
  getCircuitState() {
    return {
      isOpen: this.circuitOpen,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure: Date.now() - this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker manually (for testing or recovery)
   */
  resetCircuit(): void {
    this.circuitOpen = false;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    console.log('[RateLimit] Circuit breaker manually reset');
  }
}

// Create a singleton instance for application-wide use
export const rateLimitService = new RateLimitService({
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  jitterFactor: 0.2,
  respectRetryAfter: true,
  circuitBreakerThreshold: 5,
});
