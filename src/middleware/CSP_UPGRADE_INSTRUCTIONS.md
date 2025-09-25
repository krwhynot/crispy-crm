# Content Security Policy (CSP) Upgrade Instructions

## Current State: Report-Only Mode

The application is currently configured with `Content-Security-Policy-Report-Only` headers, which means:
- CSP violations are reported but not blocked
- The application continues to function normally
- Violations can be monitored to identify required changes

## Before Upgrading to Enforced CSP

1. **Monitor CSP Reports**: Set up a CSP reporting endpoint to collect violation reports
2. **Test Thoroughly**: Use development and staging environments to identify all violations
3. **Fix Violations**: Address any inline scripts, styles, or external resources that violate the policy

## Upgrading to Enforced CSP

### Step 1: Enable Enforcement in Development

In `/src/middleware/securityHeaders.ts`, modify the `getSecurityHeaders` function:

```typescript
// Replace report-only with enforced CSP
delete headers['Content-Security-Policy-Report-Only'];
headers['Content-Security-Policy'] = generateCSP(config);
```

### Step 2: Update Production Configurations

**Vercel (`vercel.json`):**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E='; ..."
}
```

**Netlify (`netlify.toml`):**
```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E='; ..."
```

### Step 3: Update HTML Meta Tags

In `/index.html`, change from:
```html
<meta http-equiv="Content-Security-Policy-Report-Only" content="..." />
```

To:
```html
<meta http-equiv="Content-Security-Policy" content="..." />
```

## Common Issues and Solutions

### Inline Styles
- **Problem**: CSP blocks `style` attributes and inline `<style>` tags
- **Solution**: Use CSS classes or styled-components with nonce/hash

### Inline Scripts
- **Problem**: CSP blocks `onclick` handlers and inline `<script>` tags
- **Solution**: Use event listeners and external script files

### External Resources
- **Problem**: CSP blocks resources from non-allowlisted domains
- **Solution**: Add trusted domains to the appropriate CSP directive

### Dynamic Content
- **Problem**: User-generated content may include blocked elements
- **Solution**: Sanitize content server-side before rendering

## Testing Checklist

- [ ] All pages load without CSP violations
- [ ] User authentication flows work correctly
- [ ] File uploads and image displays function properly
- [ ] External integrations (Supabase) work correctly
- [ ] Dynamic content renders without violations
- [ ] Mobile and desktop views work consistently

## Rollback Plan

If issues arise after enabling enforcement:

1. Quickly revert to report-only mode
2. Identify specific violations from error logs
3. Fix violations in staging environment
4. Re-enable enforcement after validation

This ensures security hardening without breaking functionality.