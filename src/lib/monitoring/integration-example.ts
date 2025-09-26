/**
 * Security Monitoring Integration Examples
 *
 * This file demonstrates how to integrate the security monitoring system
 * with existing Atomic CRM components. These examples show the integration
 * patterns without modifying the core authentication flow.
 */

import {
  trackAuthenticationFailure,
  trackAuthenticationSuccess,
  trackSuspiciousActivity,
  initializeCSPReporting,
  setupSecurityMonitoringCleanup
} from './security';

/**
 * Example: Integrate with authentication provider
 *
 * This shows how to add security monitoring to the existing auth flow
 * without breaking existing functionality.
 */
export function enhanceAuthProviderWithMonitoring(originalAuthProvider: any) {
  return {
    ...originalAuthProvider,

    login: async (params: any) => {
      const startTime = Date.now();
      const clientInfo = getClientInfo();

      try {
        const result = await originalAuthProvider.login(params);

        // Track successful authentication
        if (result && !result.redirectTo) {
          trackAuthenticationSuccess({
            userId: 'user-from-result', // Extract from actual result
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            method: params.provider ? 'oauth' : 'password',
            metadata: {
              loginDuration: Date.now() - startTime,
              provider: params.provider
            }
          });
        }

        return result;
      } catch (error: any) {
        // Track authentication failure
        trackAuthenticationFailure({
          reason: getFailureReason(error),
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          email: params.email,
          metadata: {
            error: error.message,
            loginDuration: Date.now() - startTime
          }
        });

        throw error;
      }
    },

    checkAuth: async (params: any) => {
      try {
        return await originalAuthProvider.checkAuth(params);
      } catch (error: any) {
        const clientInfo = getClientInfo();

        // Track session validation failures
        if (error.message && error.message.includes('token')) {
          trackAuthenticationFailure({
            reason: 'token_expired',
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            metadata: {
              path: window.location.pathname,
              error: error.message
            }
          });
        } else if (error.message && error.message.includes('session')) {
          trackAuthenticationFailure({
            reason: 'session_invalid',
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
            metadata: {
              path: window.location.pathname,
              error: error.message
            }
          });
        }

        throw error;
      }
    }
  };
}

/**
 * Example: Monitor form inputs for suspicious patterns
 *
 * This can be integrated with React Admin forms to detect
 * potential XSS or SQL injection attempts.
 */
export function monitorFormInput(fieldName: string, value: string, userId?: string) {
  const clientInfo = getClientInfo();

  // Check for XSS patterns
  if (containsXSSPatterns(value)) {
    trackSuspiciousActivity({
      pattern: 'xss_attempt_in_form',
      description: `Potential XSS attempt detected in ${fieldName} field`,
      severity: 'high',
      ipAddress: clientInfo.ipAddress,
      userId: userId,
      metadata: {
        fieldName,
        inputLength: value.length,
        // Don't log the actual value for security
        suspicious: true
      }
    });
  }

  // Check for SQL injection patterns
  if (containsSQLPatterns(value)) {
    trackSuspiciousActivity({
      pattern: 'sql_injection_attempt',
      description: `Potential SQL injection attempt detected in ${fieldName} field`,
      severity: 'critical',
      ipAddress: clientInfo.ipAddress,
      userId: userId,
      metadata: {
        fieldName,
        inputLength: value.length,
        suspicious: true
      }
    });
  }
}

/**
 * Example: Rate limiting middleware
 *
 * This shows how to integrate rate limiting detection
 * with existing request handling.
 */
export function createRateLimitMonitor() {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 100; // requests per minute
  const WINDOW_MS = 60 * 1000; // 1 minute

  return (endpoint: string, userId?: string, ipAddress?: string) => {
    const key = `${ipAddress || 'unknown'}:${endpoint}`;
    const now = Date.now();

    let entry = requestCounts.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + WINDOW_MS };
      requestCounts.set(key, entry);
    }

    entry.count++;

    if (entry.count > RATE_LIMIT) {
      trackSuspiciousActivity({
        pattern: 'rate_limit_exceeded',
        description: `Rate limit exceeded for endpoint ${endpoint}`,
        severity: 'medium',
        ipAddress: ipAddress,
        userId: userId,
        metadata: {
          endpoint,
          requestCount: entry.count,
          timeWindow: WINDOW_MS
        }
      });

      return false; // Rate limit exceeded
    }

    return true; // Request allowed
  };
}

/**
 * Initialize security monitoring for the entire application
 *
 * Call this once during application bootstrap.
 */
export function initializeSecurityMonitoring() {
  // Set up CSP violation reporting
  initializeCSPReporting();

  // Set up automatic cleanup of old events
  setupSecurityMonitoringCleanup();

  // Monitor for suspicious navigation patterns
  if (typeof window !== 'undefined') {
    let lastNavigationTime = Date.now();
    let navigationCount = 0;

    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      const now = Date.now();
      if (now - lastNavigationTime < 100) { // Very fast navigation
        navigationCount++;
        if (navigationCount > 10) {
          trackSuspiciousActivity({
            pattern: 'rapid_navigation',
            description: 'Rapid navigation pattern detected - possible automation',
            severity: 'medium',
            ipAddress: getClientInfo().ipAddress,
            metadata: {
              navigationCount,
              timeSpan: now - lastNavigationTime
            }
          });
          navigationCount = 0; // Reset counter
        }
      } else {
        navigationCount = 0;
      }
      lastNavigationTime = now;

      return originalPushState.apply(history, args);
    };
  }

  // Monitor for suspicious console access (potential debugging attempts)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const originalConsoleLog = console.log;
    let consoleAccessCount = 0;

    console.log = function(...args) {
      consoleAccessCount++;
      if (consoleAccessCount > 20) { // Excessive console usage
        trackSuspiciousActivity({
          pattern: 'excessive_console_usage',
          description: 'Excessive console usage detected in production',
          severity: 'low',
          ipAddress: getClientInfo().ipAddress,
          metadata: {
            accessCount: consoleAccessCount
          }
        });
        consoleAccessCount = 0; // Reset
      }

      return originalConsoleLog.apply(console, args);
    };
  }
}

// Helper functions

function getClientInfo(): { ipAddress?: string; userAgent?: string } {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    // Note: Getting real IP address requires server-side integration
    ipAddress: undefined, // Would come from server headers in real implementation
    userAgent: window.navigator.userAgent
  };
}

function getFailureReason(error: any): 'invalid_credentials' | 'account_locked' | 'token_expired' | 'session_invalid' {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('invalid') && message.includes('credential')) {
    return 'invalid_credentials';
  } else if (message.includes('locked') || message.includes('disabled')) {
    return 'account_locked';
  } else if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
    return 'token_expired';
  } else if (message.includes('session')) {
    return 'session_invalid';
  }

  return 'invalid_credentials'; // Default
}

function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\s*\(/i
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

function containsSQLPatterns(input: string): boolean {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /\b(DROP|DELETE|INSERT|UPDATE)\b.*\bTABLE\b/i,
    /['"];.*--/,
    /\b1\s*=\s*1\b/
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}