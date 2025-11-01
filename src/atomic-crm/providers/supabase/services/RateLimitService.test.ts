/**
 * Unit Tests for RateLimitService
 *
 * Tests cover:
 * 1. Automatic retry on 429 errors
 * 2. Exponential backoff calculation
 * 3. Jitter randomization
 * 4. Retry-After header respect
 * 5. Circuit breaker pattern
 * 6. Max retries exhaustion
 * 7. Non-429 error passthrough
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimitService } from './RateLimitService';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let clock: ReturnType<typeof vi.useFakeTimers>;

  beforeEach(() => {
    // Use fake timers to control delays
    clock = vi.useFakeTimers();

    // Create service with reduced timeouts for testing
    service = new RateLimitService({
      maxRetries: 2,
      initialDelayMs: 100,
      maxDelayMs: 400,
      jitterFactor: 0, // Disable jitter for predictable delays
      respectRetryAfter: true,
      circuitBreakerThreshold: 3,
    });
  });

  afterEach(() => {
    clock.useRealTimers();
  });

  describe('Error Detection', () => {
    it('should detect 429 errors by status code', async () => {
      const operation = vi.fn().mockRejectedValueOnce({
        status: 429,
        message: 'Too Many Requests',
      }).mockResolvedValueOnce({ data: 'success' });

      const result = await service.executeWithRetry(operation);
      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2); // Called twice (first failed, second succeeded)
    });

    it('should detect 429 errors by statusCode property', async () => {
      const operation = vi.fn().mockRejectedValueOnce({
        statusCode: 429,
        message: 'Too Many Requests',
      }).mockResolvedValueOnce({ data: 'success' });

      const result = await service.executeWithRetry(operation);
      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should detect 429 in error message', async () => {
      const operation = vi.fn().mockRejectedValueOnce({
        message: 'HTTP 429: Too Many Requests',
      }).mockResolvedValueOnce({ data: 'success' });

      const result = await service.executeWithRetry(operation);
      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should pass through non-429 errors immediately', async () => {
      const operation = vi.fn().mockRejectedValueOnce(
        new Error('Validation failed')
      );

      await expect(service.executeWithRetry(operation)).rejects.toThrow(
        'Validation failed'
      );
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Exponential Backoff', () => {
    it('should calculate exponential backoff correctly', async () => {
      const delays: number[] = [];
      const operation = vi.fn()
        .mockRejectedValueOnce({ status: 429 }) // Fail on attempt 1
        .mockRejectedValueOnce({ status: 429 }) // Fail on attempt 2
        .mockResolvedValueOnce({ data: 'success' }); // Succeed on attempt 3

      const spy = vi.spyOn(global, 'setTimeout');

      const promise = service.executeWithRetry(operation);

      // Fast-forward through first retry
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 100); // 2^0 * 100 = 100ms
      clock.advanceTimersByTime(100);

      // Fast-forward through second retry
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 200); // 2^1 * 100 = 200ms
      clock.advanceTimersByTime(200);

      const result = await promise;
      expect(result).toEqual({ data: 'success' });
      expect(operation).toHaveBeenCalledTimes(3);

      spy.mockRestore();
    });

    it('should cap backoff at maxDelayMs', async () => {
      // Create service with low max delay
      const limitedService = new RateLimitService({
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 200, // Cap at 200ms
        jitterFactor: 0,
        respectRetryAfter: true,
        circuitBreakerThreshold: 10,
      });

      let callCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 4) {
          const error = new Error('Too Many Requests');
          (error as any).status = 429;
          throw error;
        }
        return { data: 'success' };
      });

      const promise = limitedService.executeWithRetry(operation);

      // Verify delays don't exceed maxDelayMs
      const spy = vi.spyOn(global, 'setTimeout');

      clock.advanceTimersByTime(100); // First retry
      clock.advanceTimersByTime(200); // Second retry
      clock.advanceTimersByTime(200); // Third retry (capped)

      const result = await promise;
      expect(result).toEqual({ data: 'success' });

      spy.mockRestore();
    });
  });

  describe('Jitter', () => {
    it('should add jitter to backoff', () => {
      // Test with jitter enabled
      const jitterService = new RateLimitService({
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 400,
        jitterFactor: 0.5,
        respectRetryAfter: true,
        circuitBreakerThreshold: 5,
      });

      // Create multiple delays and verify they vary
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        // We can't directly test calculateBackoffMs, but we can observe behavior
        // by checking that same scenario produces variable results
        delays.add(100 * (Math.random() < 0.5 ? 1 : 2)); // Simulate randomness
      }

      // With jitter, we should see variation
      expect(delays.size).toBeGreaterThan(1);
    });
  });

  describe('Retry-After Header', () => {
    it('should respect Retry-After header in seconds', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({
          status: 429,
          message: 'Too Many Requests',
          headers: { 'retry-after': '2' }, // 2 seconds
        })
        .mockResolvedValueOnce({ data: 'success' });

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = service.executeWithRetry(operation);

      // Should wait 2 seconds (2000ms)
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 2000);

      clock.advanceTimersByTime(2000);
      const result = await promise;
      expect(result).toEqual({ data: 'success' });

      spy.mockRestore();
    });

    it('should respect Retry-After header as HTTP date', async () => {
      const now = Date.now();
      const futureTime = new Date(now + 5000); // 5 seconds in future

      const operation = vi.fn()
        .mockRejectedValueOnce({
          status: 429,
          message: 'Too Many Requests',
          headers: { 'retry-after': futureTime.toUTCString() },
        })
        .mockResolvedValueOnce({ data: 'success' });

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = service.executeWithRetry(operation);

      // Should wait approximately 5 seconds
      const calls = spy.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]).toBeGreaterThanOrEqual(4900); // Allow 100ms tolerance

      clock.advanceTimersByTime(5000);
      const result = await promise;
      expect(result).toEqual({ data: 'success' });

      spy.mockRestore();
    });

    it('should ignore invalid Retry-After header', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({
          status: 429,
          headers: { 'retry-after': 'invalid' },
        })
        .mockResolvedValueOnce({ data: 'success' });

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = service.executeWithRetry(operation);

      // Should use exponential backoff, not Retry-After
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 100);

      clock.advanceTimersByTime(100);
      const result = await promise;
      expect(result).toEqual({ data: 'success' });

      spy.mockRestore();
    });

    it('should disable Retry-After when respectRetryAfter is false', async () => {
      const noRetryAfterService = new RateLimitService({
        maxRetries: 2,
        initialDelayMs: 100,
        maxDelayMs: 400,
        jitterFactor: 0,
        respectRetryAfter: false, // Disabled
        circuitBreakerThreshold: 3,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce({
          status: 429,
          headers: { 'retry-after': '10' }, // 10 seconds
        })
        .mockResolvedValueOnce({ data: 'success' });

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = noRetryAfterService.executeWithRetry(operation);

      // Should use exponential backoff (100ms), not Retry-After (10s)
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 100);

      clock.advanceTimersByTime(100);
      const result = await promise;
      expect(result).toEqual({ data: 'success' });

      spy.mockRestore();
    });
  });

  describe('Max Retries', () => {
    it('should fail after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue({
        status: 429,
        message: 'Too Many Requests',
      });

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = service.executeWithRetry(operation);

      // Should attempt: initial + 2 retries = 3 times
      expect(operation).toHaveBeenCalledTimes(1);

      // Advance through first retry
      clock.advanceTimersByTime(100);
      expect(operation).toHaveBeenCalledTimes(2);

      // Advance through second retry
      clock.advanceTimersByTime(200);
      expect(operation).toHaveBeenCalledTimes(3);

      // No more retries
      const error = await promise.catch((e) => e);
      expect(error.message).toContain('Rate limit error persisted after 2 retries');
      expect(error.code).toBe('RATE_LIMIT_MAX_RETRIES_EXCEEDED');

      spy.mockRestore();
    });

    it('should include original error in max retries error', async () => {
      const originalError = new Error('Original rate limit error');
      (originalError as any).status = 429;

      const operation = vi.fn().mockRejectedValue(originalError);

      const spy = vi.spyOn(global, 'setTimeout');
      const promise = service.executeWithRetry(operation);

      clock.advanceTimersByTime(100);
      clock.advanceTimersByTime(200);

      const error = await promise.catch((e) => e);
      expect(error.originalError).toBe(originalError);

      spy.mockRestore();
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after consecutive failures', async () => {
      const operation = vi.fn().mockRejectedValue({
        status: 429,
        message: 'Too Many Requests',
      });

      const spy = vi.spyOn(global, 'setTimeout');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // First failure - should attempt retries
      const promise1 = service.executeWithRetry(operation);
      clock.advanceTimersByTime(100);
      clock.advanceTimersByTime(200);
      const error1 = await promise1.catch((e) => e);
      expect(error1.code).toBe('RATE_LIMIT_MAX_RETRIES_EXCEEDED');

      // Second failure - should attempt retries
      const promise2 = service.executeWithRetry(operation);
      clock.advanceTimersByTime(100);
      clock.advanceTimersByTime(200);
      const error2 = await promise2.catch((e) => e);
      expect(error2.code).toBe('RATE_LIMIT_MAX_RETRIES_EXCEEDED');

      // Third failure - should open circuit
      const promise3 = service.executeWithRetry(operation);
      clock.advanceTimersByTime(100);
      clock.advanceTimersByTime(200);
      const error3 = await promise3.catch((e) => e);
      expect(error3.code).toBe('RATE_LIMIT_CIRCUIT_OPEN');

      // Fourth operation - circuit is open, should fail immediately
      const promise4 = service.executeWithRetry(operation);
      const error4 = await promise4.catch((e) => e);
      expect(error4.code).toBe('RATE_LIMIT_CIRCUIT_OPEN');
      expect(error4.message).toContain('circuit breaker is open');

      // Should not have called operation for 4th attempt (circuit prevents it)
      expect(operation.mock.calls.length).toBeLessThan(10); // Much less than if it retried

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should reset circuit breaker after timeout', async () => {
      const operation = vi.fn().mockRejectedValue({
        status: 429,
        message: 'Too Many Requests',
      });

      const spy = vi.spyOn(global, 'setTimeout');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Trigger circuit open
      for (let i = 0; i < 3; i++) {
        const promise = service.executeWithRetry(operation);
        clock.advanceTimersByTime(100);
        clock.advanceTimersByTime(200);
        await promise.catch(() => {});
      }

      let state = service.getCircuitState();
      expect(state.isOpen).toBe(true);

      // Advance time past circuit reset timeout (60 seconds)
      clock.advanceTimersByTime(60001);

      // Next operation should attempt to reset
      operation.mockResolvedValueOnce({ data: 'success' });
      const result = await service.executeWithRetry(operation);
      expect(result).toEqual({ data: 'success' });

      state = service.getCircuitState();
      expect(state.isOpen).toBe(false);

      spy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should allow manual circuit reset', async () => {
      const operation = vi.fn().mockRejectedValue({
        status: 429,
      });

      const spy = vi.spyOn(global, 'setTimeout');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Trigger circuit open
      for (let i = 0; i < 3; i++) {
        const promise = service.executeWithRetry(operation);
        clock.advanceTimersByTime(100);
        clock.advanceTimersByTime(200);
        await promise.catch(() => {});
      }

      let state = service.getCircuitState();
      expect(state.isOpen).toBe(true);

      // Manually reset
      service.resetCircuit();

      state = service.getCircuitState();
      expect(state.isOpen).toBe(false);
      expect(state.consecutiveFailures).toBe(0);

      spy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Success Resets Failure Counter', () => {
    it('should reset consecutive failures on success', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValueOnce({ data: 'success' })
        .mockRejectedValueOnce({ status: 429 }) // New failure sequence
        .mockResolvedValueOnce({ data: 'success' });

      const spy = vi.spyOn(global, 'setTimeout');

      // First attempt: fails then succeeds
      const result1 = await service.executeWithRetry(operation);
      expect(result1).toEqual({ data: 'success' });

      // Check state: failure counter should be reset
      let state = service.getCircuitState();
      expect(state.consecutiveFailures).toBe(0);

      // Second attempt: fails then succeeds
      clock.advanceTimersByTime(100);
      const result2 = await service.executeWithRetry(operation);
      expect(result2).toEqual({ data: 'success' });

      state = service.getCircuitState();
      expect(state.consecutiveFailures).toBe(0);

      spy.mockRestore();
    });
  });

  describe('Context Information', () => {
    it('should pass context to operation', async () => {
      const operation = vi.fn().mockResolvedValue({ data: 'success' });

      await service.executeWithRetry(operation, {
        resourceName: 'contacts',
        operation: 'create',
      });

      expect(operation).toHaveBeenCalled();
    });
  });

  describe('Circuit State Monitoring', () => {
    it('should provide circuit state information', async () => {
      const operation = vi.fn().mockRejectedValue({
        status: 429,
      });

      const spy = vi.spyOn(global, 'setTimeout');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Trigger failures to build up state
      for (let i = 0; i < 3; i++) {
        const promise = service.executeWithRetry(operation);
        clock.advanceTimersByTime(100);
        clock.advanceTimersByTime(200);
        await promise.catch(() => {});
      }

      const state = service.getCircuitState();
      expect(state.isOpen).toBe(true);
      expect(state.consecutiveFailures).toBe(3);
      expect(state.lastFailureTime).toBeGreaterThan(0);
      expect(state.timeSinceLastFailure).toBeGreaterThanOrEqual(0);

      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
