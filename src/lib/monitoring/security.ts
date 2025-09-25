/**
 * Security Monitoring and Event Tracking
 *
 * Tracks authentication failures, CSP violations, suspicious patterns, and security events.
 * Implements rate limiting detection and alerting for security incidents.
 *
 * IMPORTANT: Never logs sensitive information like passwords, tokens, or PII.
 * All security events are sanitized before logging to prevent data leaks.
 */

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

type SecurityEventType =
  | 'auth_failure'
  | 'auth_success'
  | 'auth_lockout'
  | 'csp_violation'
  | 'suspicious_pattern'
  | 'rate_limit_exceeded'
  | 'token_expired'
  | 'session_hijack_attempt'
  | 'unauthorized_access_attempt'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'cors_violation';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface SuspiciousPatternDetector {
  pattern: string;
  description: string;
  severity: SecurityEvent['severity'];
  detector: (event: Partial<SecurityEvent>) => boolean;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private rateLimitTracking = new Map<string, RateLimitEntry>();
  private alertThresholds = {
    authFailures: { count: 5, windowMinutes: 15 },
    rateLimitExceeded: { count: 10, windowMinutes: 5 },
    cspViolations: { count: 3, windowMinutes: 10 },
    suspiciousPatterns: { count: 2, windowMinutes: 5 }
  };

  private suspiciousPatterns: SuspiciousPatternDetector[] = [
    {
      pattern: 'multiple_failed_auth',
      description: 'Multiple authentication failures from same IP',
      severity: 'high',
      detector: (event) => this.detectMultipleFailedAuth(event)
    },
    {
      pattern: 'unusual_user_agent',
      description: 'Suspicious or automated user agent detected',
      severity: 'medium',
      detector: (event) => this.detectUnusualUserAgent(event?.userAgent || '')
    },
    {
      pattern: 'rapid_requests',
      description: 'Rapid succession of requests indicating automation',
      severity: 'high',
      detector: (event) => this.detectRapidRequests(event?.ipAddress || '')
    },
    {
      pattern: 'token_reuse',
      description: 'Token reuse across different sessions detected',
      severity: 'critical',
      detector: (event) => this.detectTokenReuse(event)
    },
    {
      pattern: 'sql_patterns',
      description: 'SQL injection patterns detected in input',
      severity: 'critical',
      detector: (event) => this.detectSQLPatterns(event?.metadata?.input || '')
    },
    {
      pattern: 'xss_patterns',
      description: 'XSS patterns detected in input',
      severity: 'high',
      detector: (event) => this.detectXSSPatterns(event?.metadata?.input || '')
    }
  ];

  /**
   * Track authentication failure events with rate limiting
   */
  trackAuthFailure(params: {
    reason: 'invalid_credentials' | 'account_locked' | 'token_expired' | 'session_invalid';
    ipAddress?: string;
    userAgent?: string;
    email?: string; // Will be hashed for privacy
    metadata?: Record<string, any>;
  }) {
    const event: SecurityEvent = {
      type: 'auth_failure',
      timestamp: Date.now(),
      ipAddress: this.sanitizeIP(params.ipAddress),
      userAgent: this.sanitizeUserAgent(params.userAgent),
      metadata: {
        reason: params.reason,
        emailHash: params.email ? this.hashEmail(params.email) : undefined,
        ...this.sanitizeMetadata(params.metadata ?? {})
      },
      severity: this.getAuthFailureSeverity(params.reason)
    };

    this.addEvent(event);
    this.updateRateLimit('auth_failure', params.ipAddress ?? 'unknown');
    this.detectAndAlertSuspiciousPatterns(event);
  }

  /**
   * Track successful authentication events
   */
  trackAuthSuccess(params: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    method: 'password' | 'oauth' | 'token_refresh';
    metadata?: Record<string, any>;
  }) {
    const event: SecurityEvent = {
      type: 'auth_success',
      timestamp: Date.now(),
      userId: params.userId,
      ipAddress: this.sanitizeIP(params.ipAddress),
      userAgent: this.sanitizeUserAgent(params.userAgent),
      metadata: {
        method: params.method,
        ...this.sanitizeMetadata(params.metadata ?? {})
      },
      severity: 'low'
    };

    this.addEvent(event);
  }

  /**
   * Track CSP violations from browser reports
   */
  trackCSPViolation(params: {
    violatedDirective: string;
    blockedURI: string;
    documentURI: string;
    sourceFile?: string;
    lineNumber?: number;
    originalPolicy: string;
  }) {
    const event: SecurityEvent = {
      type: 'csp_violation',
      timestamp: Date.now(),
      metadata: {
        violatedDirective: params.violatedDirective,
        blockedURI: this.sanitizeURI(params.blockedURI),
        documentURI: this.sanitizeURI(params.documentURI),
        sourceFile: params.sourceFile ? this.sanitizeURI(params.sourceFile) : undefined,
        lineNumber: params.lineNumber
        // Note: Not logging full originalPolicy as it may contain sensitive info
      },
      severity: this.getCSPViolationSeverity(params.violatedDirective)
    };

    this.addEvent(event);
    this.detectAndAlertCSPViolations(event);
  }

  /**
   * Track suspicious patterns and potential attacks
   */
  trackSuspiciousPattern(params: {
    pattern: string;
    description: string;
    severity: SecurityEvent['severity'];
    ipAddress?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }) {
    const event: SecurityEvent = {
      type: 'suspicious_pattern',
      timestamp: Date.now(),
      userId: params.userId,
      ipAddress: this.sanitizeIP(params.ipAddress),
      metadata: {
        pattern: params.pattern,
        description: params.description,
        ...this.sanitizeMetadata(params.metadata ?? {})
      },
      severity: params.severity
    };

    this.addEvent(event);
    this.alertSecurityEvent(event);
  }

  /**
   * Track rate limiting violations
   */
  trackRateLimitExceeded(params: {
    endpoint: string;
    ipAddress?: string;
    userId?: string;
    requestCount: number;
    timeWindow: number;
  }) {
    const event: SecurityEvent = {
      type: 'rate_limit_exceeded',
      timestamp: Date.now(),
      userId: params.userId,
      ipAddress: this.sanitizeIP(params.ipAddress),
      metadata: {
        endpoint: params.endpoint,
        requestCount: params.requestCount,
        timeWindowMs: params.timeWindow
      },
      severity: 'medium'
    };

    this.addEvent(event);
    this.alertSecurityEvent(event);
  }

  /**
   * Get security metrics and statistics
   */
  getSecurityMetrics(timeWindowMinutes: number = 60): {
    authFailures: number;
    authSuccesses: number;
    cspViolations: number;
    suspiciousPatterns: number;
    rateLimitExceeded: number;
    topFailureReasons: Array<{ reason: string; count: number }>;
    topViolatedCSPDirectives: Array<{ directive: string; count: number }>;
    alertsTriggered: number;
  } {
    const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp >= cutoff);

    const authFailures = recentEvents.filter(e => e.type === 'auth_failure');
    const cspViolations = recentEvents.filter(e => e.type === 'csp_violation');

    return {
      authFailures: recentEvents.filter(e => e.type === 'auth_failure').length,
      authSuccesses: recentEvents.filter(e => e.type === 'auth_success').length,
      cspViolations: cspViolations.length,
      suspiciousPatterns: recentEvents.filter(e => e.type === 'suspicious_pattern').length,
      rateLimitExceeded: recentEvents.filter(e => e.type === 'rate_limit_exceeded').length,
      topFailureReasons: this.getTopFailureReasons(authFailures),
      topViolatedCSPDirectives: this.getTopCSPDirectives(cspViolations),
      alertsTriggered: recentEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
    };
  }

  /**
   * Clear events older than specified days (for memory management)
   */
  clearOldEvents(retentionDays: number = 7) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= cutoff);
  }

  // Private helper methods

  private addEvent(event: SecurityEvent) {
    this.events.push(event);

    // Log to console for development (in production, this would go to a proper logging service)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SECURITY]', {
        type: event.type,
        severity: event.severity,
        timestamp: new Date(event.timestamp).toISOString(),
        metadata: event.metadata
      });
    }
  }

  private updateRateLimit(eventType: string, identifier: string) {
    const key = `${eventType}:${identifier}`;
    const now = Date.now();
    const existing = this.rateLimitTracking.get(key);

    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.rateLimitTracking.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    }
  }

  private detectAndAlertSuspiciousPatterns(event: SecurityEvent) {
    this.suspiciousPatterns.forEach(detector => {
      if (detector.detector(event)) {
        this.trackSuspiciousPattern({
          pattern: detector.pattern,
          description: detector.description,
          severity: detector.severity,
          ipAddress: event.ipAddress,
          userId: event.userId,
          metadata: { triggeredBy: event.type }
        });
      }
    });
  }

  private detectAndAlertCSPViolations(event: SecurityEvent) {
    const recentViolations = this.getRecentEvents('csp_violation', 10);
    if (recentViolations.length >= this.alertThresholds.cspViolations.count) {
      this.alertSecurityEvent({
        ...event,
        type: 'suspicious_pattern',
        metadata: {
          ...event.metadata,
          pattern: 'frequent_csp_violations',
          description: 'Frequent CSP violations detected - possible XSS attempt'
        },
        severity: 'high'
      });
    }
  }

  private detectMultipleFailedAuth(event: Partial<SecurityEvent>): boolean {
    if (!event.ipAddress) return false;

    const recentFailures = this.getRecentEvents('auth_failure', 15)
      .filter(e => e.ipAddress === event.ipAddress);

    return recentFailures.length >= 3;
  }

  private detectUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private detectRapidRequests(ipAddress: string): boolean {
    const rateLimitData = this.rateLimitTracking.get(`auth_failure:${ipAddress}`);
    if (!rateLimitData) return false;

    const timeDiff = rateLimitData.lastAttempt - rateLimitData.firstAttempt;
    const requestsPerMinute = (rateLimitData.count / timeDiff) * 60 * 1000;

    return requestsPerMinute > 20; // More than 20 requests per minute
  }

  private detectTokenReuse(_event: Partial<SecurityEvent>): boolean {
    // This would need access to token data - placeholder implementation
    // In a real implementation, you'd track token usage patterns
    return false;
  }

  private detectSQLPatterns(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bUNION\b)/i,
      /\b(DROP|DELETE|INSERT|UPDATE|EXEC|EXECUTE|UNION|SELECT)\b.*\b(TABLE|FROM|INTO)\b/i,
      /['";].*(-{2}|\/\*|\*\/)/,
      /\b(OR|AND)\b.*['"]?\s*=\s*['"]?/i,
      /\b1\s*=\s*1\b/,
      /sleep\s*\(\s*\d+\s*\)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private detectXSSPatterns(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
      /on\w+\s*=\s*['"]/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  private getRecentEvents(type: SecurityEventType, windowMinutes: number): SecurityEvent[] {
    const cutoff = Date.now() - (windowMinutes * 60 * 1000);
    return this.events.filter(event =>
      event.type === type && event.timestamp >= cutoff
    );
  }

  private alertSecurityEvent(event: SecurityEvent) {
    if (event.severity === 'high' || event.severity === 'critical') {
      // In production, this would send alerts to monitoring system
      console.error('[SECURITY ALERT]', {
        type: event.type,
        severity: event.severity,
        timestamp: new Date(event.timestamp).toISOString(),
        metadata: event.metadata
      });

      // Could integrate with services like:
      // - Slack/Discord webhooks
      // - PagerDuty
      // - Email notifications
      // - SIEM systems
    }
  }

  private getAuthFailureSeverity(reason: string): SecurityEvent['severity'] {
    switch (reason) {
      case 'invalid_credentials':
        return 'low';
      case 'account_locked':
        return 'medium';
      case 'token_expired':
        return 'low';
      case 'session_invalid':
        return 'medium';
      default:
        return 'medium';
    }
  }

  private getCSPViolationSeverity(directive: string): SecurityEvent['severity'] {
    const highRiskDirectives = ['script-src', 'object-src', 'base-uri'];
    return highRiskDirectives.includes(directive) ? 'high' : 'medium';
  }

  private getTopFailureReasons(failures: SecurityEvent[]): Array<{ reason: string; count: number }> {
    const reasonCounts = new Map<string, number>();

    failures.forEach(event => {
      const reason = event.metadata.reason || 'unknown';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getTopCSPDirectives(violations: SecurityEvent[]): Array<{ directive: string; count: number }> {
    const directiveCounts = new Map<string, number>();

    violations.forEach(event => {
      const directive = event.metadata.violatedDirective || 'unknown';
      directiveCounts.set(directive, (directiveCounts.get(directive) || 0) + 1);
    });

    return Array.from(directiveCounts.entries())
      .map(([directive, count]) => ({ directive, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Data sanitization methods to prevent sensitive info logging

  private sanitizeIP(ip?: string): string | undefined {
    if (!ip) return undefined;
    // Hash last octet for IPv4 to preserve some privacy while maintaining uniqueness
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return 'sanitized-ip';
  }

  private sanitizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    // Keep only the browser family and major version, remove detailed version info
    const simplified = userAgent.replace(/[\d.]+/g, 'X.X').substring(0, 100);
    return simplified;
  }

  private sanitizeURI(uri: string): string {
    try {
      const url = new URL(uri);
      // Remove query parameters and fragments that might contain sensitive data
      return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
      // If not a valid URL, just return sanitized version
      return uri.substring(0, 100).replace(/[?&#].*/, '');
    }
  }

  private hashEmail(email: string): string {
    // Simple hash for privacy (in production, use proper crypto)
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'secret',
      'credential',
      'authorization',
      'ssn',
      'credit',
      'card'
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 200) {
        // Truncate very long strings to prevent log spam
        sanitized[key] = `${value.substring(0, 200)}...`;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Singleton instance for application-wide use
export const securityMonitor = new SecurityMonitor();

// Convenience functions for common usage patterns

export function trackAuthenticationFailure(params: {
  reason: 'invalid_credentials' | 'account_locked' | 'token_expired' | 'session_invalid';
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  metadata?: Record<string, any>;
}) {
  securityMonitor.trackAuthFailure(params);
}

export function trackAuthenticationSuccess(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  method: 'password' | 'oauth' | 'token_refresh';
  metadata?: Record<string, any>;
}) {
  securityMonitor.trackAuthSuccess(params);
}

export function trackCSPViolation(cspReport: any) {
  // Parse CSP violation report from browser
  const report = cspReport?.['csp-report'] || cspReport;

  if (report) {
    securityMonitor.trackCSPViolation({
      violatedDirective: report['violated-directive'],
      blockedURI: report['blocked-uri'],
      documentURI: report['document-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      originalPolicy: report['original-policy']
    });
  }
}

export function trackSuspiciousActivity(params: {
  pattern: string;
  description: string;
  severity?: SecurityEvent['severity'];
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, any>;
}) {
  securityMonitor.trackSuspiciousPattern({
    severity: 'medium',
    ...params
  });
}

export function getSecurityDashboard(timeWindowMinutes: number = 60) {
  return securityMonitor.getSecurityMetrics(timeWindowMinutes);
}

// Initialize CSP violation reporting
export function initializeCSPReporting() {
  // Listen for CSP violations reported by the browser
  if (typeof window !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (event) => {
      trackCSPViolation({
        'violated-directive': event.violatedDirective,
        'blocked-uri': event.blockedURI,
        'document-uri': event.documentURI,
        'source-file': event.sourceFile,
        'line-number': event.lineNumber,
        'original-policy': event.originalPolicy
      });
    });
  }
}

// Cleanup old events periodically (call this in application lifecycle)
export function setupSecurityMonitoringCleanup() {
  if (typeof window !== 'undefined') {
    // Clean up old events every 24 hours
    setInterval(() => {
      securityMonitor.clearOldEvents(7); // Keep 7 days of events
    }, 24 * 60 * 60 * 1000);
  }
}