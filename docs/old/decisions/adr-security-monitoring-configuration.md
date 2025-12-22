# ADR: Security & Monitoring Configuration

**Status:** Accepted
**Date:** 2025-12-03
**Context:** Establishing industry-standard security and monitoring practices for Crispy CRM

## Decision

We adopt a **Defense in Depth** security strategy using three complementary technologies, each configured according to industry best practices and authoritative sources (OWASP, Sentry docs, DOMPurify maintainers).

---

### 1. Sentry Configuration

**Version:** 10.27.0

#### Sample Rates

| Environment | `tracesSampleRate` | `replaysSessionSampleRate` | `replaysOnErrorSampleRate` |
|-------------|-------------------|---------------------------|---------------------------|
| Development | 1.0 (100%) | 1.0 (100%) | 1.0 (100%) |
| Production | 0.1 (10%) | 0.1 (10%) | 1.0 (100%) |

**Rationale:**
- 10% tracing balances observability with cost for medium-traffic applications
- 100% error replay ensures every error has debugging context
- Aligns with [Sentry's recommended production rates](https://docs.sentry.io/platforms/javascript/session-replay/)

#### Required Privacy Settings

```typescript
Sentry.replayIntegration({
  maskAllText: true,      // DEFAULT - do not disable
  blockAllMedia: true,    // DEFAULT - do not disable
})
```

**Rationale:** PII protection is critical for CRM data containing customer information.

#### Smart Sampling for Critical Flows

```typescript
tracesSampler: (samplingContext) => {
  const { name, attributes, inheritOrSampleWith } = samplingContext;

  // Always capture: auth, mutations on critical resources
  if (name.includes('/auth') || name.includes('/login')) return 1.0;
  if (name.includes('/opportunities') && attributes?.method !== 'GET') return 1.0;

  // Reduce noise from high-volume reads
  if (attributes?.method === 'GET') return 0.05;

  return inheritOrSampleWith(0.1);
}
```

**Rationale:** Prioritizes business-critical flows (authentication, pipeline changes) over routine reads.

---

### 2. DOMPurify Configuration

**Version:** 3.2.7

#### Standard Sanitization (User-Generated Content)

```typescript
DOMPurify.sanitize(dirty, {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form'],
  FORBID_ATTR: ['style', 'onerror', 'onload'],
  ALLOW_DATA_ATTR: false,
  SANITIZE_NAMED_PROPS: true,
});
```

**Rationale:**
- `USE_PROFILES: { html: true }` - SVG/MathML not needed, reduces attack surface
- `FORBID_TAGS: ['style', 'form']` - Prevents CSS injection and phishing forms
- `SANITIZE_NAMED_PROPS: true` - Prevents DOM clobbering attacks
- Source: [DOMPurify README](https://github.com/cure53/dompurify)

#### Placement

DOMPurify is called at the **API boundary** in `unifiedDataProvider.ts`, alongside Zod validation, following the Single Source of Truth principle.

---

### 3. Content Security Policy (CSP)

#### Strict CSP Headers (Production)

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
```

**Rationale:**

| Directive | Why |
|-----------|-----|
| `script-src 'nonce-{RANDOM}' 'strict-dynamic'` | Nonce-based strict CSP per [OWASP recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) |
| `style-src 'unsafe-inline'` | Required for Tailwind CSS runtime styles |
| `connect-src ... supabase.co ... sentry.io` | Allow backend API and monitoring |
| `worker-src 'self' blob:` | Required for Sentry Session Replay WebWorker |
| `child-src 'self' blob:` | Safari ≤15.4 fallback for worker-src |
| `object-src 'none'` | Block legacy plugins (Flash/Java) |
| `base-uri 'none'` | Prevent base tag injection |
| `frame-ancestors 'self'` | Clickjacking protection |

---

## Alternatives Considered

### 1. Allowlist-Based CSP (Rejected)

**Why rejected:** Allowlist CSPs are [easily bypassed](https://web.dev/strict-csp/) via JSONP endpoints, open redirects, and CDN-hosted scripts. Nonce-based strict CSP is the current industry standard.

### 2. 100% Session Replay in Production (Rejected)

**Why rejected:** Cost prohibitive and unnecessary. Error replays (100%) provide debugging context when needed; routine sessions (10%) provide UX insights without excessive data volume.

### 3. Client-Side Only Validation (Rejected)

**Why rejected:** Violates fail-fast principle. Validation must occur at API boundary where we have control. DOMPurify at client-side is defense-in-depth, not primary defense.

---

## Consequences

### Positive

- **XSS Prevention:** Three-layer defense (DOMPurify → React JSX escaping → CSP)
- **Debugging Capability:** 100% error replay ensures every production error can be investigated
- **Compliance Ready:** PII masking enabled by default supports data protection requirements
- **Clickjacking Prevention:** `frame-ancestors 'self'` blocks embedding attacks
- **Cost Controlled:** 10% sampling rates balance observability with Sentry billing

### Negative

- **CSP Deployment Complexity:** Requires nonce generation on each request
- **Safari Compatibility:** Requires duplicate `worker-src` and `child-src` directives
- **Style Limitations:** `'unsafe-inline'` for styles is less secure than nonce-based, but required for Tailwind

### Risks

| Risk | Mitigation |
|------|------------|
| DOMPurify bypass discovered | Subscribe to [security mailing list](https://lists.ruhr-uni-bochum.de/mailman/listinfo/dompurify-security), enable automated npm audit |
| CSP blocks legitimate functionality | Deploy in Report-Only mode first, monitor violations |
| Sentry costs exceed budget | Reduce `replaysSessionSampleRate` further if needed |

---

## Implementation Checklist

- [ ] Configure Sentry sample rates in `sentry.client.config.ts`
- [ ] Add `tracesSampler` function for smart sampling
- [ ] Create DOMPurify sanitization utility in `src/lib/sanitize.ts`
- [ ] Integrate sanitization in `unifiedDataProvider.ts`
- [ ] Configure CSP headers in deployment (Vercel/hosting platform)
- [ ] Deploy CSP in Report-Only mode
- [ ] Monitor CSP violations for 1-2 weeks
- [ ] Switch to enforcing CSP mode

---

## References

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Google Strict CSP Guide](https://web.dev/strict-csp/)
- [Sentry Session Replay Docs](https://docs.sentry.io/platforms/javascript/session-replay/)
- [DOMPurify Documentation](https://github.com/cure53/dompurify)
- [CSP Evaluator Tool](https://csp-evaluator.withgoogle.com/)
- [Security Monitoring Standards](../standards/security-monitoring.md)
