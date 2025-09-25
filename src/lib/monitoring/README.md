# Security Monitoring System

This module implements comprehensive security monitoring and event tracking for Atomic CRM. It tracks authentication failures, CSP violations, suspicious patterns, and potential security threats while ensuring sensitive information is never logged.

## Features

### ✅ Authentication Monitoring
- Track login failures with rate limiting detection
- Monitor successful authentications with method tracking
- Detect account lockout patterns and token expiry issues
- Session validation failure tracking

### ✅ CSP Violation Monitoring
- Automatic browser CSP violation reporting
- Severity classification based on directive type
- Pattern detection for potential XSS attempts
- Integration with existing security headers

### ✅ Suspicious Pattern Detection
- Multiple failed authentication attempts
- Unusual user agents (bots, scrapers, automated tools)
- Rapid request patterns indicating automation
- SQL injection attempt detection
- XSS pattern recognition in form inputs
- Token reuse across sessions

### ✅ Rate Limiting Detection
- Per-IP address request counting
- Configurable thresholds and time windows
- Automatic alerting on rate limit violations
- Integration with suspicious pattern detection

### ✅ Data Privacy & Security
- All sensitive data is sanitized before logging
- IP addresses are partially hashed for privacy
- User agents are simplified to remove detailed version info
- Email addresses are hashed for privacy
- Passwords, tokens, and credentials are never logged

## Usage

### Basic Integration

```typescript
import {
  trackAuthenticationFailure,
  trackAuthenticationSuccess,
  trackCSPViolation,
  trackSuspiciousActivity,
  initializeCSPReporting,
  setupSecurityMonitoringCleanup
} from '@/lib/monitoring/security';

// Initialize during app startup
initializeCSPReporting();
setupSecurityMonitoringCleanup();
```

### Authentication Monitoring

```typescript
// Track login failure
trackAuthenticationFailure({
  reason: 'invalid_credentials',
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  email: loginForm.email,
  metadata: {
    loginAttempt: attemptNumber,
    captchaUsed: false
  }
});

// Track successful login
trackAuthenticationSuccess({
  userId: user.id,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  method: 'password',
  metadata: {
    loginDuration: loginTime,
    mfaUsed: user.mfaEnabled
  }
});
```

### CSP Violation Tracking

CSP violations are automatically tracked when `initializeCSPReporting()` is called. For manual reporting:

```typescript
// Manual CSP violation reporting
trackCSPViolation({
  violatedDirective: 'script-src',
  blockedURI: 'https://malicious-site.com/script.js',
  documentURI: 'https://yourdomain.com/dashboard',
  sourceFile: 'https://yourdomain.com/app.js',
  lineNumber: 123,
  originalPolicy: 'script-src \'self\''
});
```

### Suspicious Activity Detection

```typescript
// Track custom suspicious patterns
trackSuspiciousActivity({
  pattern: 'unusual_data_access',
  description: 'User accessing unusual amount of data',
  severity: 'medium',
  userId: user.id,
  ipAddress: request.ip,
  metadata: {
    recordsAccessed: 1000,
    timeWindow: '5 minutes'
  }
});
```

### Security Dashboard

```typescript
import { getSecurityDashboard } from '@/lib/monitoring/security';

// Get security metrics for the last hour
const metrics = getSecurityDashboard(60);
console.log(metrics);

// Output:
{
  authFailures: 12,
  authSuccesses: 45,
  cspViolations: 2,
  suspiciousPatterns: 3,
  rateLimitExceeded: 1,
  topFailureReasons: [
    { reason: 'invalid_credentials', count: 8 },
    { reason: 'token_expired', count: 4 }
  ],
  topViolatedCSPDirectives: [
    { directive: 'script-src', count: 2 }
  ],
  alertsTriggered: 4
}
```

## Integration Examples

See `integration-example.ts` for detailed examples of:
- Enhancing existing auth providers
- Form input monitoring
- Rate limiting middleware
- Application-wide security monitoring setup

## Configuration

### Alert Thresholds

The system uses configurable thresholds for alerting:

- **Authentication failures**: 5 failures in 15 minutes
- **Rate limiting**: 10 requests in 5 minutes
- **CSP violations**: 3 violations in 10 minutes
- **Suspicious patterns**: 2 patterns in 5 minutes

### Event Retention

Events are automatically cleaned up after 7 days to manage memory usage. This can be configured by calling `clearOldEvents()` with a custom retention period.

## Security Considerations

### What is NOT Logged

- Passwords or password hashes
- Authentication tokens or API keys
- Full IP addresses (only partial for privacy)
- Detailed user agent strings (simplified)
- Email addresses (hashed only)
- Full URLs (query parameters stripped)
- Any field containing 'password', 'token', 'secret', etc.

### What IS Logged

- Event types and timestamps
- Sanitized metadata about security events
- Hashed identifiers for privacy-preserving analysis
- Severity levels and pattern descriptions
- Sanitized error messages (no sensitive data)

## Alerting Integration

The system currently logs alerts to the console. In production, integrate with:

- **Monitoring services**: DataDog, New Relic, Sentry
- **Communication**: Slack webhooks, Discord, email
- **Incident management**: PagerDuty, Opsgenie
- **SIEM systems**: Splunk, ELK Stack, Azure Sentinel

## Performance Impact

The security monitoring system is designed to be lightweight:
- Events are stored in memory with automatic cleanup
- Sanitization is done synchronously but efficiently
- No network calls for local event storage
- Minimal computational overhead for pattern detection

## Production Deployment

### Required Setup

1. **CSP Reporting Endpoint**: Create a server endpoint to receive CSP violation reports
2. **Log Aggregation**: Set up proper log collection and analysis
3. **Alerting**: Configure alerts for high/critical severity events
4. **Monitoring Dashboard**: Create dashboards for security metrics
5. **Incident Response**: Establish procedures for security alerts

### Environment Variables

```bash
# Optional: CSP report endpoint
VITE_CSP_REPORT_URI=/api/csp-report

# Optional: Security monitoring level
VITE_SECURITY_MONITORING_LEVEL=production
```

## Testing

Security monitoring can be tested by triggering various events:

```typescript
// Test authentication failure tracking
trackAuthenticationFailure({
  reason: 'invalid_credentials',
  ipAddress: '192.168.1.100',
  userAgent: 'TestAgent/1.0',
  email: 'test@example.com'
});

// Check that event was recorded
const metrics = getSecurityDashboard(5);
expect(metrics.authFailures).toBe(1);
```

## Architecture

The security monitoring system consists of:

1. **SecurityMonitor Class**: Core monitoring logic with event storage
2. **Event Types**: Structured event definitions with metadata
3. **Pattern Detectors**: Configurable suspicious pattern detection
4. **Rate Limiting**: IP-based request counting and threshold monitoring
5. **Sanitization**: Privacy-preserving data sanitization utilities
6. **Integration Helpers**: Convenience functions for common use cases

This provides comprehensive security monitoring while maintaining performance and privacy standards required for production deployment.