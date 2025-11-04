# ADR-0004: Use JWT Authentication with Refresh Tokens

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM requires secure authentication for multi-user CRM access with role-based permissions:

**Authentication requirements from PRD:**
- **Email/password authentication** (Section 3.1)
- **OAuth integration** (Google, Microsoft SSO) (Section 3.1)
- **Password reset** via email link (Section 3.1)
- **Session management** with 30-day "remember me" option (Section 3.1)
- **Two-factor authentication** (optional, admin-configurable) (Section 3.1)
- **Role-based access control** (Admin, Sales Manager, Sales Rep, Read-Only) (Section 3.1)

**Security requirements:**
- **Secure token storage** (prevent XSS/CSRF attacks)
- **Token expiration** and automatic refresh (user stays logged in without re-authentication)
- **Logout functionality** (invalidate sessions)
- **Concurrent session handling** (user can log in from multiple devices)
- **API request authentication** (every Supabase API call must be authenticated)

**Technical context:**
- Supabase backend (ADR-0001) provides built-in auth with Supabase Auth (GoTrue)
- PRD Section 5.1 specifies: "JWT tokens with refresh token rotation"
- Frontend: React 18 + TypeScript, no server-side rendering (Section 5.1)
- Performance target: Login/auth check <500ms (Section 1)

**Problem:**
Authentication mechanisms have security/UX tradeoffs:
- **Session cookies:** Secure (httpOnly) but require backend session store, CSRF protection needed
- **JWT in localStorage:** Vulnerable to XSS (malicious scripts can steal tokens)
- **JWT in httpOnly cookies:** Secure but difficult in SPA (requires backend proxy for setting cookies)
- **Refresh tokens:** Enable long-lived sessions without keeping access tokens valid forever

## Decision

**Use JWT (JSON Web Tokens) with refresh token rotation for authentication in Crispy-CRM.**

Supabase Auth (GoTrue) will issue:
- **Short-lived access tokens** (1 hour expiration) for API requests
- **Long-lived refresh tokens** (30 days) for renewing access tokens
- Tokens stored in Supabase client (localStorage by default, configurable to in-memory)

## Options Considered

### Option 1: JWT with Refresh Tokens (Supabase Auth Default)
**Pros:**
- **Stateless authentication** - no server-side session store required (scales horizontally)
- **Automatic token refresh** - Supabase client handles refresh token exchange transparently
- **Refresh token rotation** - old refresh token invalidated on use (mitigates stolen token risk)
- **OAuth integration** - Supabase Auth handles Google/Microsoft OAuth flows (no custom implementation)
- **Built-in password reset** - email-based password reset with token expiration
- **Role claims in JWT** - user's role embedded in token (no database lookup on every request)
- **Multi-device support** - each device has independent refresh token (can revoke per-device)
- **Free tier** - Supabase Auth included in free tier (50K monthly active users)
- **Battle-tested** - Go True (Supabase Auth) used by thousands of production apps

**Cons:**
- **XSS vulnerability** - if localStorage used, malicious scripts can steal tokens
  - **Mitigation:** Use Content Security Policy (CSP), sanitize all user inputs, no inline scripts
- **Token size** - JWTs larger than session IDs (~500 bytes vs 20 bytes) - negligible for CRM
- **Can't revoke access tokens** immediately - must wait for expiration (1 hour max)
  - **Mitigation:** 1-hour expiration acceptable for CRM; use refresh token revocation for critical cases
- **Token exposed in network requests** - access token sent in Authorization header
  - **Mitigation:** HTTPS required (prevents man-in-the-middle attacks)

### Option 2: Session Cookies (Backend Session Store)
**Pros:**
- **Secure by default** - httpOnly cookies inaccessible to JavaScript (no XSS risk)
- **Immediate revocation** - destroy session in database, user logged out instantly
- **Smaller cookies** - session ID ~20 bytes vs JWT ~500 bytes

**Cons:**
- **Requires custom backend** - Supabase Auth uses JWT, would need separate auth server
  - **Violates ADR-0001** - chose Supabase to avoid building backend
- **Session storage required** - Redis or database for session store (adds complexity, cost)
- **CSRF protection** needed - must implement CSRF tokens
- **Horizontal scaling complexity** - sessions must be shared across backend instances (sticky sessions or shared Redis)
- **Not compatible with Supabase** - Supabase APIs expect JWT in Authorization header, not session cookies

### Option 3: OAuth-Only (No Password Authentication)
**Pros:**
- **No password storage** - offload security to Google/Microsoft
- **SSO benefits** - single sign-on across apps
- **Reduced attack surface** - no password reset vulnerabilities

**Cons:**
- **User friction** - forces all users to have Google/Microsoft accounts
  - **PRD requires email/password** (Section 3.1) - not all users may have OAuth accounts
- **Vendor dependency** - if Google OAuth down, users can't log in
- **Still need JWT** - OAuth returns JWT tokens anyway (doesn't avoid JWT concerns)

### Option 4: JWT in httpOnly Cookies (Hybrid Approach)
**Pros:**
- **XSS protection** - tokens inaccessible to JavaScript
- **CSRF mitigation** - SameSite cookie attribute prevents cross-site requests

**Cons:**
- **Requires backend proxy** - SPA can't set httpOnly cookies (needs backend to set cookies on login)
  - **Violates ADR-0001** - chose Supabase to avoid backend
- **Complexity** - need custom auth proxy between frontend and Supabase
- **Not standard Supabase pattern** - would be fighting against Supabase Auth design

## Consequences

### Positive Consequences

**Developer Experience:**
- **Zero backend auth code** - Supabase Auth handles registration, login, password reset, OAuth
- **Automatic token refresh** - `@supabase/supabase-js` client refreshes tokens transparently (no manual logic)
- **Simple API** - `supabase.auth.signInWithPassword({ email, password })` handles entire flow
- **OAuth in 5 minutes** - enable Google/Microsoft OAuth in Supabase dashboard, no code changes

**Security:**
- **Refresh token rotation** - old refresh token invalidated on use (prevents replay attacks)
- **Short access token lifetime** (1 hour) - limits damage if access token stolen
- **Role-based access** - JWT claims include user role (no additional database lookup)
- **Supabase RLS integration** - `auth.uid()` function in RLS policies reads JWT claims

**User Experience:**
- **30-day sessions** - users stay logged in for 30 days (via refresh tokens)
- **Seamless token refresh** - no logout/re-login when access token expires
- **Multi-device support** - log in from iPad, desktop, mobile simultaneously

**Specific CRM Use Cases:**
- **Sales rep field access** - stays logged in on iPad for entire workday (no re-authentication)
- **Manager oversight** - can revoke refresh tokens per-device if device lost/stolen
- **Audit trail** - JWT claims include user ID for activity logging

### Negative Consequences

**XSS Risk:**
- **localStorage vulnerable** - malicious script in browser can steal tokens
- **Mitigation strategies:**
  1. **Content Security Policy (CSP):** Prevent inline scripts (`<script>alert()</script>` blocked)
  2. **Input sanitization:** Escape all user inputs (React does this by default, but validate)
  3. **Third-party scripts audit:** Review all npm packages, minimize dependencies
  4. **HTTPS only:** Prevent man-in-the-middle token interception
  5. **Consider in-memory storage:** Supabase client supports in-memory token storage (tokens lost on page refresh)

**Token Revocation Delay:**
- **Access tokens valid until expiration** (up to 1 hour) even after logout
- **Mitigation:** 1-hour window acceptable for CRM (not financial/healthcare); refresh token revoked immediately on logout

**Token Size Overhead:**
- **JWT ~500 bytes** vs session ID ~20 bytes - sent with every API request
- **Impact:** Negligible for CRM (500 bytes = 0.5KB, broadband handles this easily)

### Neutral Consequences

- **Stateless auth** - can't query "all active sessions" easily (acceptable for CRM)
- **JWT claims immutable** - if user role changes, must wait for token expiration or force re-login (acceptable)
- **Supabase Auth magic links** available but not using for MVP (could add later)

## Implementation Notes

**Installation (Already included in Supabase client):**
```bash
npm install @supabase/supabase-js
```

**Configuration:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Automatically refresh access tokens
    persistSession: true,   // Persist session in localStorage
    detectSessionInUrl: true, // Detect OAuth redirect URLs
    storage: window.localStorage, // Default: localStorage (consider in-memory for higher security)
  },
});
```

**Login Flow:**
```typescript
// Email/password login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Access token: data.session.access_token (1-hour expiration)
// Refresh token: data.session.refresh_token (30-day expiration)
// User info: data.user (id, email, role)
```

**OAuth Login:**
```typescript
// Google OAuth (redirects to Google, then back to app)
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://app.crispy-crm.com/auth/callback',
  },
});
```

**Token Refresh (Automatic):**
```typescript
// Supabase client automatically refreshes tokens before expiration
// No manual code needed

// Manual refresh (if needed):
const { data, error } = await supabase.auth.refreshSession();
```

**Logout:**
```typescript
// Revoke refresh token, clear local storage
const { error } = await supabase.auth.signOut();
```

**Check Current Session:**
```typescript
// Get current session (includes access token, user info)
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('User logged in:', session.user.email);
  console.log('Role:', session.user.user_metadata.role);
}
```

**Protected Route Pattern:**
```typescript
// src/components/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });

    // Listen for auth state changes (logout, token expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return <>{children}</>;
}
```

**API Requests (Automatic Authentication):**
```typescript
// Supabase client automatically includes access token in Authorization header
const { data, error } = await supabase
  .from('organizations')
  .select('*');

// Equivalent to:
// fetch('/api/organizations', {
//   headers: { Authorization: `Bearer ${accessToken}` }
// })
```

**Role-Based Access (JWT Claims):**
```typescript
// User role stored in JWT claims (user_metadata or app_metadata)
const { data: { session } } = await supabase.auth.getSession();
const userRole = session?.user?.app_metadata?.role; // 'admin', 'sales_manager', 'sales_rep'

if (userRole === 'admin') {
  // Show admin-only features
}
```

**RLS Policy Using JWT:**
```sql
-- Opportunities RLS: Sales Reps can only edit owned opportunities
CREATE POLICY opportunities_update_owned ON opportunities
  FOR UPDATE TO authenticated
  USING (
    deal_owner_id = auth.uid() OR  -- auth.uid() reads JWT claim
    auth.jwt() ->> 'role' IN ('admin', 'sales_manager')  -- auth.jwt() reads custom claims
  );
```

**Security Checklist:**
- [ ] HTTPS enforced in production (redirect HTTP → HTTPS)
- [ ] Content Security Policy (CSP) configured (no inline scripts)
- [ ] All user inputs sanitized (prevent XSS)
- [ ] Third-party scripts audited (npm packages reviewed)
- [ ] Refresh token rotation enabled (Supabase default)
- [ ] Short access token lifetime (1 hour, Supabase default)
- [ ] OAuth redirect URLs whitelisted in Supabase dashboard

## References

- **PRD Section 3.1:** User Registration & Login - Auth requirements
- **PRD Section 5.1:** Technology Stack - "JWT tokens with refresh token rotation"
- **Supabase Auth Documentation:** https://supabase.com/docs/guides/auth
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Related ADR:** ADR-0001 (Supabase Backend - Auth integration)
- **Related ADR:** ADR-0005 (Soft Delete - audit trail for deleted entities)

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
