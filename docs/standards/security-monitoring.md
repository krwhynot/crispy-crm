# Security & Monitoring Standards

> Industry best practices and configuration standards for Crispy CRM's security and monitoring stack.

**Last Updated:** 2025-12-03
**Status:** Active
**Applies To:** All environments (development, staging, production)

---

## Technology Stack Overview

| Technology              | Version | Purpose                          |
|-------------------------|---------|----------------------------------|
| Sentry                  | 10.27.0 | Error tracking, session replay   |
| DOMPurify               | 3.2.7   | XSS sanitization                 |
| Content Security Policy | -       | Strict CSP headers in production |

**Guiding Principle:** Defense in Depth - each technology provides a distinct layer of protection. Sentry catches runtime issues, DOMPurify prevents XSS at sanitization time, and CSP blocks malicious scripts at the browser level.

---

## 1. Sentry - Error Tracking & Session Replay

### Must-Follow Requirements

| Requirement | Rationale | Source |
|-------------|-----------|--------|
| **Keep `replaysOnErrorSampleRate: 1.0`** | Always capture replays when errors occur - most valuable debugging context | [Sentry Docs](https://docs.sentry.io/platforms/javascript/session-replay/) |
| **Enable privacy defaults** | `maskAllText: true` and `blockAllMedia: true` are ON by default - don't disable in production | Sentry Privacy Guide |
| **Add CSP worker-src directive** | Session Replay requires: `worker-src 'self' blob:` (Safari ≤15.4 also needs `child-src 'self' blob:`) | Sentry CSP Requirements |
| **Use source maps upload via Vite plugin** | Required for meaningful stack traces in minified production code | Sentry Configuration |

### Sample Rate Configuration

#### Current Configuration
```
Browser tracing: 10% prod / 100% dev
Session replay: 30% prod / 100% on errors
```

#### Industry Recommendations by Traffic Volume

| Traffic | `tracesSampleRate` | `replaysSessionSampleRate` | `replaysOnErrorSampleRate` |
|---------|-------------------|---------------------------|---------------------------|
| High (100k+/day) | 0.01-0.05 (1-5%) | 0.01-0.05 (1-5%) | 1.0 (100%) |
| Medium (10k-100k/day) | 0.1 (10%) | 0.1 (10%) | 1.0 (100%) |
| Low (<10k/day) | 0.25 (25%) | 0.25 (25%) | 1.0 (100%) |

> **Recommendation:** Consider reducing session replay to 10% in production to manage costs while keeping 100% error replays.

### Smart Sampling with `tracesSampler`

Prioritize critical user flows for CRM operations:

```typescript
tracesSampler: (samplingContext) => {
  const { name, attributes, inheritOrSampleWith } = samplingContext;

  // Always capture authentication flows
  if (name.includes('/auth') || name.includes('/login')) {
    return 1.0;
  }

  // Capture all opportunity/pipeline changes (critical for MFB)
  if (name.includes('/opportunities') && attributes?.method !== 'GET') {
    return 1.0;
  }

  // Sample less for high-volume read operations
  if (name.includes('/contacts') && attributes?.method === 'GET') {
    return 0.05;
  }

  // Default: inherit parent or use 10%
  return inheritOrSampleWith(0.1);
}
```

### Privacy Considerations

- **Network requests/responses are opt-in** - don't enable for endpoints with PII
- **Canvas recording has NO PII scrubbing** - avoid if displaying sensitive charts
- Session data is masked by default but verify with `DOMPurify.removed` in dev

### Sentry Features Summary

- Browser tracing (10% prod / 100% dev)
- Session replay (30% prod / 100% on errors)
- Source map upload via Vite plugin

---

## 2. DOMPurify - XSS Sanitization

### Must-Follow Requirements

| Requirement | Rationale | Source |
|-------------|-----------|--------|
| **Never modify HTML after sanitization** | Post-sanitization modifications void all protections | [DOMPurify README](https://github.com/cure53/dompurify) |
| **Use `USE_PROFILES: { html: true }` for HTML-only** | Restricts to HTML only (no SVG/MathML) - reduces attack surface | DOMPurify Config |
| **Subscribe to security mailing list** | Get immediate notification of bypasses | [Security List](https://lists.ruhr-uni-bochum.de/mailman/listinfo/dompurify-security) |
| **Keep updated** | DOMPurify releases critical patches when bypasses found | npm audit |

### Recommended Configuration

#### Strict Configuration for User-Generated Content

```typescript
const sanitizeUserContent = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },        // HTML only, no SVG/MathML
    FORBID_TAGS: ['style', 'form'],      // Block style injection & phishing forms
    FORBID_ATTR: ['style', 'onerror', 'onload'], // Block inline styles & handlers
    ALLOW_DATA_ATTR: false,              // Block data-* attributes
    SANITIZE_NAMED_PROPS: true,          // Prevent DOM clobbering (adds user-content- prefix)
  });
};
```

#### Rich Text Editor Configuration (If Used)

```typescript
const sanitizeRichText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_ARIA_ATTR: false,
    ADD_ATTR: ['rel'],  // For noopener on links
  });
};
```

### Trusted Types Integration (Modern Browsers)

```typescript
// Enable Trusted Types for additional browser-level protection
if (window.trustedTypes) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (input) => DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: false }),
  });
}
```

### Common Foot-Guns to Avoid

1. **Don't pass sanitized HTML to libraries that modify it** (e.g., some WYSIWYG editors)
2. **Don't use `SAFE_FOR_TEMPLATES: true` in production** - only for specific template engine needs
3. **Don't rely on `DOMPurify.removed` for security decisions** - it's for debugging only

---

## 3. Content Security Policy (CSP)

### Must-Follow Requirements (OWASP Guidelines)

| Requirement | Rationale | Source |
|-------------|-----------|--------|
| **Use nonce-based or hash-based strict CSP** | Allowlist-based CSPs are easily bypassed | [OWASP CSP Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) |
| **Always include `object-src 'none'`** | Blocks Flash/Java/legacy plugin exploits | Google Strict CSP |
| **Always include `base-uri 'none'`** | Prevents `<base>` tag injection attacks | OWASP |
| **Use `frame-ancestors 'self'`** | Prevents clickjacking (replaces X-Frame-Options) | OWASP |
| **Deploy Report-Only first** | Test before enforcing to avoid breaking functionality | Best Practice |

### Recommended Strict CSP for Crispy CRM

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://*.sentry.io;
  frame-ancestors 'self';
  form-action 'self';
  base-uri 'none';
  object-src 'none';
  worker-src 'self' blob:;
  child-src 'self' blob:;
  upgrade-insecure-requests;
  report-uri https://your-sentry-csp-endpoint;
```

### CSP Directive Reference

| Directive | Purpose | Crispy CRM Setting |
|-----------|---------|-------------------|
| `default-src` | Fallback for all fetch directives | `'self'` |
| `script-src` | JavaScript sources | `'self' 'nonce-{RANDOM}' 'strict-dynamic'` |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` (Tailwind needs this) |
| `connect-src` | XHR/Fetch/WebSocket targets | `'self' https://*.supabase.co https://*.sentry.io` |
| `img-src` | Image sources | `'self' data: https:` |
| `worker-src` | Web Worker sources | `'self' blob:` (required for Sentry Replay) |
| `frame-ancestors` | Who can embed this page | `'self'` (clickjacking protection) |
| `form-action` | Form submission targets | `'self'` (prevents form hijacking) |
| `object-src` | Plugin sources | `'none'` (blocks Flash/Java) |
| `base-uri` | `<base>` tag URLs | `'none'` (prevents base hijacking) |

### Deployment Strategy

1. **Start with Report-Only mode:**
   ```
   Content-Security-Policy-Report-Only: ...
   ```

2. **Monitor violations** via Sentry CSP reporting endpoint

3. **Fix legitimate violations** (add necessary sources)

4. **Switch to enforcing mode** after 1-2 weeks of clean reports

### Common CSP Pitfalls

1. **Don't use `'unsafe-eval'`** - breaks strict CSP and enables XSS via `eval()`
2. **Avoid broad allowlists** like `*.googleapis.com` - attackers can host malicious scripts there
3. **`'strict-dynamic'`** propagates trust to dynamically loaded scripts - use with nonces
4. **Test in Safari** - it has different CSP behavior for `worker-src`

---

## Integration: Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input ──► DOMPurify ──► React Component ──► DOM          │
│       │              │              │              │            │
│       │              │              │              ▼            │
│       │              │              │         CSP Blocks        │
│       │              │              │         Inline Scripts    │
│       │              │              │                           │
│       │              │              ▼                           │
│       │              │         Sentry Captures                  │
│       │              │         Any Errors                       │
│       │              │                                          │
│       ▼              ▼                                          │
│   Zod Validates   Strips XSS                                   │
│   at API Boundary  Payloads                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **API Boundary** | Zod | Schema validation, type safety |
| **Sanitization** | DOMPurify | Strip malicious HTML/XSS payloads |
| **Runtime** | React | Safe rendering with JSX escaping |
| **Browser** | CSP | Block unauthorized script execution |
| **Monitoring** | Sentry | Capture errors, violations, replays |

---

## Authoritative Sources

| Technology | Primary Source |
|------------|----------------|
| Sentry | [docs.sentry.io](https://docs.sentry.io/platforms/javascript/) |
| DOMPurify | [github.com/cure53/DOMPurify](https://github.com/cure53/DOMPurify) |
| CSP | [OWASP CSP Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) |
| CSP Evaluator | [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com/) |
| Strict CSP Guide | [web.dev/strict-csp](https://web.dev/strict-csp/) |

---

## Key Takeaways

1. **Tracing configuration** - 10%/100% tracing split is industry-standard; consider reducing replay to 10% prod
2. **CSP for Sentry** - Requires `worker-src 'self' blob:` for Session Replay to function
3. **DOMPurify placement** - Call at the API boundary alongside Zod validation (in `unifiedDataProvider`)
4. **CSP deployment** - Always test in Report-Only mode before enforcing
5. **Updates** - Keep DOMPurify updated and monitor security mailing list for bypass notifications

---

## Related Documents

- [Forms Validation Standards](./forms-validation.md)
- [ADR: UI Color Exceptions](../decisions/adr-ui-color-exceptions.md)
