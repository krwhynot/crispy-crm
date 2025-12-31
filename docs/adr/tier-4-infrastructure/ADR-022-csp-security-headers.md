# ADR-022: Content Security Policy Configuration

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM is a React 19 SPA deployed to static hosting providers (Vercel, GitHub Pages). Content Security Policy (CSP) is essential for mitigating XSS attacks, but implementation must balance security with application functionality.

### Problem Statement

1. **XSS Prevention** - Without CSP, injected scripts can execute freely, compromising user data
2. **Static Hosting Constraints** - Vercel and similar platforms don't provide easy HTTP header configuration for SPAs
3. **Development vs Production** - Vite's Hot Module Replacement (HMR) requires `unsafe-inline` and `unsafe-eval`, which are unacceptable in production
4. **Third-Party Dependencies** - Supabase realtime (WebSockets), Sentry (blob workers), and Google Fonts require specific allowlist entries
5. **Code Splitting** - Vite's dynamic `import()` for React.lazy() requires `wasm-unsafe-eval` in production

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **HTTP Headers (server config)** | More secure, nonce support possible | Requires server configuration, not available on static hosts |
| **Meta tag CSP** | Works everywhere, no server needed, Vite integration | Slightly less secure (no nonces), must be in `<head>` |
| **No CSP** | Simplest, no maintenance | Unacceptable security risk, XSS vulnerability |
| **Stricter CSP (no wasm-unsafe-eval)** | Maximum security | Breaks React.lazy() code splitting |
| **Report-only mode** | Non-blocking, monitoring | Doesn't prevent attacks, adds complexity |

---

## Decision

**Use meta tag-based CSP via `vite-plugin-simple-html` with environment-specific policies.**

### Implementation: `vite.config.ts:90-127`

#### Plugin Configuration (lines 90-127)

```typescript
// vite.config.ts:90-127
createHtmlPlugin({
  inject: {
    tags: [
      {
        injectTo: "head",
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content: mode === "production" ? /* production CSP */ : /* development CSP */,
        },
      },
    ],
  },
}),
```

The plugin injects a `<meta>` tag into the HTML `<head>` at build time. The `mode` variable from Vite's config determines which policy applies.

#### Production CSP (lines 97-112)

```typescript
// vite.config.ts:97-112
// Production: Stricter security (includes Sentry + Google Fonts)
// Note: 'wasm-unsafe-eval' required for Vite's dynamic import() used by React.lazy()
// Note: blob: required for Sentry Session Replay worker
"default-src 'self'; " +
"script-src 'self' 'wasm-unsafe-eval' blob:; " +
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
"img-src 'self' data: blob: https:; " +
"font-src 'self' data: https://fonts.gstatic.com; " +
"connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io; " +
"worker-src 'self' blob:; " +
"child-src 'self' blob:; " +
"frame-src 'none'; " +
"object-src 'none'; " +
"base-uri 'none'; " +
"form-action 'self';"
```

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Baseline restriction, only same-origin |
| `script-src` | `'self' 'wasm-unsafe-eval' blob:` | Self-hosted scripts, WASM for code splitting, blob for Sentry worker |
| `style-src` | `'self' 'unsafe-inline' fonts.googleapis.com` | Inline styles required by UI libraries, Google Fonts |
| `img-src` | `'self' data: blob: https:` | Permissive for images (avatars, external content) |
| `font-src` | `'self' data: fonts.gstatic.com` | Google Fonts CDN, base64 embedded fonts |
| `connect-src` | `'self' *.supabase.co *.supabase.in wss://* *.sentry.io` | API + WebSocket realtime + Sentry telemetry |
| `worker-src` | `'self' blob:` | Sentry Session Replay worker |
| `child-src` | `'self' blob:` | Iframe/worker restrictions |
| `frame-src` | `'none'` | **XSS protection**: no iframes allowed |
| `object-src` | `'none'` | **XSS protection**: blocks Flash, Java |
| `base-uri` | `'none'` | **XSS protection**: prevents base tag injection |
| `form-action` | `'self'` | Forms only submit to same origin |

**Key Security Decisions:**

- **No `unsafe-inline` for scripts** - Inline event handlers and `<script>` tags blocked in production
- **`wasm-unsafe-eval` vs `unsafe-eval`** - Narrower scope, only allows WASM compilation (required by Vite's dynamic imports)
- **`blob:` in script-src** - Required for Sentry's Session Replay worker initialization
- **`wss://` WebSocket allowlist** - Explicit Supabase realtime domains, prevents data exfiltration to arbitrary WebSocket servers

#### Development CSP (lines 113-124)

```typescript
// vite.config.ts:113-124
// Development: Allow Vite HMR and inline scripts
"default-src 'self'; " +
"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
"img-src 'self' data: https:; " +
"font-src 'self' data: https://fonts.gstatic.com; " +
"connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in; " +
"child-src 'self' blob:; " +
"frame-src 'none'; " +
"object-src 'none'; " +
"base-uri 'none'; " +
"form-action 'self';"
```

| Directive Difference | Development | Production | Reason |
|---------------------|-------------|------------|--------|
| `script-src` | `'unsafe-inline' 'unsafe-eval'` | `'wasm-unsafe-eval' blob:` | Vite HMR requires eval for hot reloading |
| `connect-src` | Includes `localhost:*`, `127.0.0.1:*`, `ws://` | HTTPS/WSS only | Local dev server communication |
| `worker-src` | Not specified | `'self' blob:` | Sentry not typically running in dev |

---

## Consequences

### Positive

- **XSS Mitigation** - Inline scripts blocked in production, attackers cannot inject executable code
- **Data Exfiltration Prevention** - Strict `connect-src` allowlist prevents unauthorized API calls
- **Static Host Compatible** - Works on Vercel, Netlify, GitHub Pages without server configuration
- **Build-Time Integration** - CSP generated automatically, no manual HTML editing
- **Environment Awareness** - Development retains full Vite functionality, production locks down

### Negative

- **Meta Tag Limitations** - Cannot use nonces (would require server-side rendering)
- **`unsafe-inline` for Styles** - Required by Radix UI and other component libraries; mitigated by script restrictions
- **Maintenance Burden** - Adding new third-party services requires CSP updates
- **No Report-Only Mode** - Direct enforcement means CSP violations break functionality (fail-fast is intentional)

### Neutral

- **`wasm-unsafe-eval` Trade-off** - Less restrictive than pure `'self'`, but required for modern bundler output
- **Google Fonts Dependency** - CDN allowlist required; could self-host fonts to remove

---

## Code Examples

### Correct Pattern - Adding a New Third-Party Service

```typescript
// vite.config.ts - Adding a new analytics service
"connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://api.analytics-service.com; "

// Steps:
// 1. Identify exact domains the service uses (API, CDN, WebSocket)
// 2. Add to connect-src (for API calls) or appropriate directive
// 3. Test in production build (npm run build && npm run preview)
// 4. Verify no CSP errors in browser console
```

### Correct Pattern - Testing CSP Changes

```bash
# Build production bundle with CSP
npm run build

# Preview production build locally
npm run preview

# Check browser console for CSP violations
# Look for: "Refused to load the script..." or "Blocked..."
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Adding unsafe-eval in production
"script-src 'self' 'unsafe-eval'; "
// This defeats CSP's XSS protection entirely

// WRONG: Wildcard connect-src
"connect-src *; "
// Allows data exfiltration to any server

// WRONG: Missing frame-src restriction
// No frame-src directive
// Allows clickjacking attacks via malicious iframes

// WRONG: Hardcoding CSP in index.html
// <meta http-equiv="Content-Security-Policy" content="...">
// Bypasses environment-specific configuration
```

```html
<!-- WRONG: Manual CSP in index.html -->
<!-- This bypasses Vite's environment-aware injection -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

---

## Security Analysis

### Threats Mitigated

| Threat | Mitigation |
|--------|------------|
| **Stored XSS** | `script-src` blocks inline scripts |
| **Reflected XSS** | `script-src` blocks injected script tags |
| **Clickjacking** | `frame-src 'none'` prevents embedding |
| **Data Exfiltration** | `connect-src` allowlist limits outbound requests |
| **Plugin-based Attacks** | `object-src 'none'` blocks Flash, Java |
| **Base Tag Hijacking** | `base-uri 'none'` prevents relative URL attacks |

### Residual Risks

| Risk | Reason | Mitigation |
|------|--------|------------|
| CSS Injection | `style-src 'unsafe-inline'` required | Limited impact (no script execution) |
| Image-based attacks | `img-src https:` is permissive | Content validation at upload |
| WebSocket hijacking | WSS domains allowlisted | TLS ensures server authenticity |

---

## Related ADRs

- **[ADR-021: Multi-Environment Configuration](./ADR-021-multi-environment-config.md)** - Environment switching that triggers different CSP policies
- **[ADR-020: Sentry Error Monitoring](./ADR-020-sentry-error-monitoring.md)** - Sentry integration requiring `blob:` and `connect-src` entries
- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)** - Why CSP violations should break functionality, not be silently reported

---

## References

- CSP configuration: `vite.config.ts:90-127`
- Plugin: `vite-plugin-simple-html` - https://www.npmjs.com/package/vite-plugin-simple-html
- MDN CSP Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- CSP Evaluator: https://csp-evaluator.withgoogle.com/
- OWASP CSP Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
