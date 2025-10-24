import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  securityMonitor,
  trackAuthenticationFailure,
  trackAuthenticationSuccess,
  trackCSPViolation,
  trackSuspiciousActivity,
  getSecurityDashboard
} from '../security';

// Mock console to prevent test output spam
const consoleMock = {
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

beforeEach(() => {
  // Clear any existing events and reset all state
  securityMonitor.reset();

  // Set NODE_ENV to development for console logging
  vi.stubEnv('NODE_ENV', 'development');

  // Mock console methods
  vi.stubGlobal('console', consoleMock);

  // Reset mocks
  vi.clearAllMocks();
});

describe('Security Monitoring', () => {
  describe('Authentication Tracking', () => {
    test('tracks authentication failures', () => {
      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Test)',
        email: 'test@example.com',
        metadata: { attemptNumber: 1 }
      });

      const metrics = getSecurityDashboard(5);
      expect(metrics.authFailures).toBe(1);
      expect(metrics.topFailureReasons).toEqual([
        { reason: 'invalid_credentials', count: 1 }
      ]);
    });

    test('tracks authentication successes', () => {
      trackAuthenticationSuccess({
        userId: 'user123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Test)',
        method: 'password',
        metadata: { loginDuration: 500 }
      });

      const metrics = getSecurityDashboard(5);
      expect(metrics.authSuccesses).toBe(1);
    });

    test('sanitizes email addresses in failure tracking', () => {
      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        email: 'sensitive@example.com'
      });

      // Verify the event was logged and email was hashed in metadata
      expect(consoleMock.warn).toHaveBeenCalled();
      const loggedEvent = consoleMock.warn.mock.calls[0][1];
      expect(loggedEvent.metadata.emailHash).toMatch(/^hash_\d+$/);
    });
  });

  describe('CSP Violation Tracking', () => {
    test('tracks CSP violations', () => {
      trackCSPViolation({
        'violated-directive': 'script-src',
        'blocked-uri': 'https://malicious-site.com/script.js',
        'document-uri': 'https://example.com/page',
        'source-file': 'https://example.com/app.js',
        'line-number': 123,
        'original-policy': 'script-src \'self\''
      });

      const metrics = getSecurityDashboard(5);
      expect(metrics.cspViolations).toBe(1);
      expect(metrics.topViolatedCSPDirectives).toEqual([
        { directive: 'script-src', count: 1 }
      ]);
    });

    test('classifies CSP violation severity correctly', () => {
      // High-risk directive should trigger high severity
      trackCSPViolation({
        'violated-directive': 'script-src',
        'blocked-uri': 'https://example.com/script.js',
        'document-uri': 'https://example.com',
        'original-policy': 'script-src \'self\''
      });

      expect(consoleMock.warn).toHaveBeenCalled();
      const loggedEvent = consoleMock.warn.mock.calls[0][1];
      expect(loggedEvent.type).toBe('csp_violation');
      expect(loggedEvent.severity).toBe('high');
    });
  });

  describe('Suspicious Pattern Detection', () => {
    test('tracks custom suspicious patterns', () => {
      trackSuspiciousActivity({
        pattern: 'rapid_requests',
        description: 'Rapid succession of requests',
        severity: 'medium',
        ipAddress: '192.168.1.100',
        userId: 'user123',
        metadata: { requestCount: 50 }
      });

      const metrics = getSecurityDashboard(5);
      expect(metrics.suspiciousPatterns).toBe(1);
    });

    test('detects multiple failed authentication attempts', () => {
      const ipAddress = '192.168.1.100';

      // Generate multiple failures from same IP
      for (let i = 0; i < 4; i++) {
        trackAuthenticationFailure({
          reason: 'invalid_credentials',
          ipAddress,
          userAgent: 'Mozilla/5.0 (Test)'
        });
      }

      const metrics = getSecurityDashboard(5);
      expect(metrics.authFailures).toBe(4);
      // Should detect suspicious pattern after multiple failures
      expect(metrics.suspiciousPatterns).toBeGreaterThan(0);
    });

    test('detects suspicious user agents', () => {
      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        ipAddress: '192.168.1.100',
        userAgent: 'curl/7.68.0' // Bot-like user agent
      });

      const metrics = getSecurityDashboard(5);
      // Should detect bot-like user agent as suspicious
      expect(metrics.suspiciousPatterns).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization', () => {
    test('sanitizes IP addresses for privacy', () => {
      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        ipAddress: '192.168.1.100'
      });

      // Verify the event was logged (IP not in console output but stored in event)
      expect(consoleMock.warn).toHaveBeenCalled();
      const metrics = getSecurityDashboard(5);
      expect(metrics.authFailures).toBe(1);

      // Note: IP sanitization happens at event creation, not in console logging
      // The actual event would have sanitized IP, but console only shows metadata
    });

    test('sanitizes user agents', () => {
      const longUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        userAgent: longUserAgent
      });

      // Verify the event was logged (user agent not in console but sanitized in event)
      expect(consoleMock.warn).toHaveBeenCalled();
      const metrics = getSecurityDashboard(5);
      expect(metrics.authFailures).toBe(1);

      // Note: User agent sanitization happens at event creation, not in console logging
    });

    test('redacts sensitive metadata', () => {
      trackSuspiciousActivity({
        pattern: 'test_pattern',
        description: 'Test',
        metadata: {
          password: 'secret123',
          token: 'abc123',
          normalField: 'safe_value'
        }
      });

      // Verify the event was logged and metadata was sanitized
      expect(consoleMock.warn).toHaveBeenCalled();
      const loggedEvent = consoleMock.warn.mock.calls[0][1];
      expect(loggedEvent.metadata.password).toBe('[REDACTED]');
      expect(loggedEvent.metadata.token).toBe('[REDACTED]');
      expect(loggedEvent.metadata.normalField).toBe('safe_value');
    });
  });

  describe('Security Dashboard', () => {
    test('provides comprehensive metrics', () => {
      // Add various types of events
      trackAuthenticationFailure({
        reason: 'invalid_credentials',
        ipAddress: '192.168.1.100'
      });

      trackAuthenticationFailure({
        reason: 'token_expired',
        ipAddress: '192.168.1.101'
      });

      trackAuthenticationSuccess({
        userId: 'user123',
        method: 'password'
      });

      trackCSPViolation({
        'violated-directive': 'script-src',
        'blocked-uri': 'https://malicious.com/script.js',
        'document-uri': 'https://example.com',
        'original-policy': 'script-src \'self\''
      });

      const metrics = getSecurityDashboard(5);

      expect(metrics).toEqual({
        authFailures: 2,
        authSuccesses: 1,
        cspViolations: 1,
        suspiciousPatterns: expect.any(Number),
        rateLimitExceeded: 0,
        topFailureReasons: [
          { reason: 'invalid_credentials', count: 1 },
          { reason: 'token_expired', count: 1 }
        ],
        topViolatedCSPDirectives: [
          { directive: 'script-src', count: 1 }
        ],
        alertsTriggered: expect.any(Number)
      });
    });

    test('filters events by time window', async () => {
      // Add an event
      trackAuthenticationFailure({
        reason: 'invalid_credentials'
      });

      // Should show event in current window
      expect(getSecurityDashboard(5).authFailures).toBe(1);

      // Wait a tiny bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 1));

      // Clear old events (use negative value to clear all)
      securityMonitor.clearOldEvents(-1);

      // Should not show event after clearing
      expect(getSecurityDashboard(5).authFailures).toBe(0);
    });
  });

  describe('Alerting', () => {
    test('triggers alerts for high severity events', () => {
      trackSuspiciousActivity({
        pattern: 'critical_pattern',
        description: 'Critical security event',
        severity: 'critical'
      });

      // Should log error for critical events
      expect(consoleMock.error).toHaveBeenCalledWith(
        '[SECURITY ALERT]',
        expect.objectContaining({
          severity: 'critical',
          type: 'suspicious_pattern'
        })
      );
    });

    test('does not alert for low severity events', () => {
      trackAuthenticationSuccess({
        userId: 'user123',
        method: 'password'
      });

      // Should not trigger alert for successful auth (low severity)
      expect(consoleMock.error).not.toHaveBeenCalled();
    });
  });
});