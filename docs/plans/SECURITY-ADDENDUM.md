# Security Addendum - Engineering Constitution Compliance

**Purpose:** Critical security fixes for implementation plans that align with Engineering Constitution principles

**Date:** November 5, 2025
**Status:** REQUIRED before implementing Plans 5, 6, 9, 12, 16

---

## Engineering Constitution Alignment

The security fixes below are **NOT over-engineering**. They comply with:

1. **TWO-LAYER SECURITY (Constitution #7)** - RLS policies are REQUIRED
2. **SINGLE SOURCE OF TRUTH (Constitution #2)** - Validation at API boundary via Zod
3. **FAIL FAST (Constitution #1)** - Using correct APIs (crypto vs Math.random) is not defensive programming
4. **VALIDATION (Constitution #4)** - Input sanitization belongs in Zod schemas

**What we're NOT adding:**
- ❌ Retry logic or circuit breakers
- ❌ Graceful fallbacks or defensive checks
- ❌ Complex error handling
- ❌ Health monitoring or telemetry beyond what's planned

**What we ARE fixing:**
- ✅ Missing RLS policies (Constitution REQUIRES this)
- ✅ Using correct crypto APIs (using wrong API is a bug, not over-engineering)
- ✅ Validation at API boundary (Constitution #4)
- ✅ GDPR compliance (legal requirement, not technical debt)

---

## CRITICAL FIX #1: User Activity Logging RLS (Plan 5)

**Constitution Rule:** TWO-LAYER SECURITY - All tables need BOTH GRANT permissions AND RLS policies

**Add to migration:** `supabase/migrations/*_user_activity_tracking.sql`

```sql
-- Step 1: GRANT permissions (Layer 1)
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activity_log TO authenticated;
GRANT USAGE ON SEQUENCE user_activity_log_id_seq TO authenticated;

-- Step 2: Enable RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS policies (Layer 2)
CREATE POLICY select_own_activity ON user_activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY insert_own_activity ON user_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can see all activity (for adoption metrics)
CREATE POLICY admin_select_all_activity ON user_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes for performance (not defensive, just good practice)
CREATE INDEX idx_user_activity_user_created
  ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_user_activity_type
  ON user_activity_log(activity_type);

-- GDPR compliance: Data retention (legal requirement)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_activity_logs IS 'GDPR compliance: Auto-delete logs after 90 days';
```

---

## CRITICAL FIX #2: 2FA Backup Codes Crypto (Plan 16)

**Constitution Rule:** FAIL FAST - Use correct APIs, not wrong ones

**Problem:** `Math.random()` is the WRONG API for cryptography (not "over-engineered" to fix this)

**Fix:** `src/atomic-crm/auth/TwoFactorSetup.tsx`

```typescript
// ❌ WRONG: Math.random() is NOT cryptographically secure
const codes = Array.from({ length: 10 }, () =>
  Math.random().toString(36).substring(2, 10).toUpperCase()
);

// ✅ CORRECT: Use Web Crypto API (built-in, not a library)
const generateSecureBackupCodes = async (): Promise<string[]> => {
  const codes = await Promise.all(
    Array.from({ length: 10 }, async () => {
      const array = new Uint8Array(8);
      crypto.getRandomValues(array); // Built-in Web API
      return Array.from(array, byte =>
        byte.toString(16).padStart(2, '0')
      ).join('').toUpperCase();
    })
  );

  return codes;
};

// Use in component
const handleVerifyAndEnable = async () => {
  // ... existing verification code ...

  const codes = await generateSecureBackupCodes();
  setBackupCodes(codes);

  notify(`Exported ${codes.length} backup codes`, { type: 'success' });
};
```

**Rationale:** This is not "defensive programming" - it's using the correct API for the job. Math.random() is documented as unsuitable for cryptography.

---

## CRITICAL FIX #3: OAuth Redirect Validation (Plan 9)

**Constitution Rule:** VALIDATION - Validate at API boundary (Zod schemas)

**Add validation schema:** `src/atomic-crm/validation/auth.ts`

```typescript
import { z } from 'zod';

// Define allowed redirect origins (single source of truth)
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Local dev
  'https://app.atomiccrm.com', // Production
  'https://staging.atomiccrm.com', // Staging
] as const;

// Validation schema (Constitution #4: Validate at API boundary)
export const oauthRedirectSchema = z.object({
  redirect: z.string().url().optional().refine(
    (url) => {
      if (!url) return true; // Allow undefined
      try {
        const parsed = new URL(url);
        return ALLOWED_ORIGINS.includes(parsed.origin as any);
      } catch {
        return false;
      }
    },
    { message: 'Redirect URL must be from allowed origins' }
  ),
});

// Helper for runtime use
export function validateRedirectURL(redirect: string | null): string {
  const result = oauthRedirectSchema.safeParse({ redirect });

  if (result.success && result.data.redirect) {
    return result.data.redirect;
  }

  // Fail fast: Return safe default (not defensive, just safe default)
  return window.location.origin;
}
```

**Use in component:** `src/pages/Login.tsx`

```typescript
import { validateRedirectURL } from '../atomic-crm/validation/auth';

// In OAuth click handler
<Button
  onClick={async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = validateRedirectURL(searchParams.get('redirect'));

    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }}
>
  Continue with Google
</Button>
```

---

## CRITICAL FIX #4: GA4 GDPR Compliance (Plan 12)

**Constitution Rule:** Not in Constitution, but LEGAL REQUIREMENT

**Problem:** Loading GA4 without consent violates GDPR (legal liability)

**Fix:** Add consent gate BEFORE loading analytics

**File:** `src/components/CookieConsent.tsx` (new)

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const CookieConsent = () => {
  const [hasConsent, setHasConsent] = useState(
    localStorage.getItem('analytics-consent') === 'true'
  );
  const [showBanner, setShowBanner] = useState(
    !localStorage.getItem('analytics-consent')
  );

  useEffect(() => {
    if (hasConsent) {
      // Dynamically load GA4 AFTER consent
      const script = document.createElement('script');
      const GA_ID = import.meta.env.VITE_GA_ID;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', GA_ID, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure'
        });
      };
    }
  }, [hasConsent]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-card border p-4 rounded-lg shadow-lg z-50">
      <p className="text-sm mb-2">
        We use analytics to improve your experience. Accept cookies?
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            localStorage.setItem('analytics-consent', 'true');
            setHasConsent(true);
            setShowBanner(false);
          }}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            localStorage.setItem('analytics-consent', 'false');
            setShowBanner(false);
          }}
        >
          Decline
        </Button>
      </div>
    </div>
  );
};
```

**Modify:** `src/App.tsx`

```typescript
import { CookieConsent } from './components/CookieConsent';

export const App = () => (
  <>
    <CRM {...config} />
    <CookieConsent />
  </>
);
```

**Remove from:** `index.html` (delete hardcoded gtag script)

```html
<!-- ❌ DELETE: Don't load GA4 unconditionally -->
<!-- <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script> -->
```

---

## CRITICAL FIX #5: Global Search Input Validation (Plan 6)

**Constitution Rule:** VALIDATION - Validate at API boundary (Zod schemas)

**Add validation:** `src/atomic-crm/validation/search.ts`

```typescript
import { z } from 'zod';

// Search query validation (Constitution #4: API boundary)
export const searchQuerySchema = z.object({
  q: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_@.]+$/, 'Invalid characters in search query'),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
```

**Update component:** `src/atomic-crm/layout/GlobalSearch.tsx`

```typescript
import { useDebouncedCallback } from 'use-debounce';
import { searchQuerySchema } from '../validation/search';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const dataProvider = useDataProvider();

  // Debounce to prevent DB hammering (performance, not defensive)
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      // Validate at API boundary (Constitution #4)
      const validation = searchQuerySchema.safeParse({ q: searchQuery });

      if (!validation.success) {
        // Fail fast: Don't search if invalid
        setResults([]);
        return;
      }

      const sanitized = validation.data.q;

      // Parallel queries with limits (performance, not defensive)
      const searches = await Promise.all([
        dataProvider.getList('contacts', {
          filter: { q: sanitized },
          pagination: { page: 1, perPage: 100 }
        }),
        dataProvider.getList('organizations', {
          filter: { q: sanitized },
          pagination: { page: 1, perPage: 100 }
        }),
        dataProvider.getList('opportunities', {
          filter: { q: sanitized },
          pagination: { page: 1, perPage: 100 }
        }),
      ]);

      const combined = searches.flatMap(s => s.data).slice(0, 100);
      setResults(combined);
    },
    500
  );

  return (
    <Autocomplete
      options={results}
      onInputChange={(_, value) => debouncedSearch(value)}
      renderInput={(params) => (
        <TextField {...params} placeholder="Search everywhere..." />
      )}
    />
  );
};
```

---

## Summary: Constitution Compliance

| Fix | Constitution Rule | Type |
|-----|------------------|------|
| RLS Policies | TWO-LAYER SECURITY | Required by Constitution |
| Crypto API | FAIL FAST | Using correct API (not wrong one) |
| OAuth Validation | VALIDATION | Zod schema at API boundary |
| GA4 Consent | N/A | Legal requirement (GDPR) |
| Search Validation | VALIDATION | Zod schema at API boundary |

**What we're NOT doing:**
- Adding retry logic ❌
- Adding circuit breakers ❌
- Adding graceful fallbacks ❌
- Defensive null checks everywhere ❌

**What we ARE doing:**
- Using correct APIs ✅
- Validating at API boundary ✅
- Following TWO-LAYER SECURITY ✅
- Complying with GDPR ✅

---

**Implementation Order:**

1. Apply fixes to Plans 5, 9, 12, 16 BEFORE implementation
2. Run `npm run validate:colors` to ensure color compliance
3. Verify all migrations use `npx supabase migration new <name>` format
4. Ensure all form defaults derived from Zod schemas (Constitution #5)

**Verification:**

```bash
# Check RLS policies exist
psql $DATABASE_URL -c "\d user_activity_log" | grep POLICY

# Verify crypto usage
grep -r "Math.random()" src/atomic-crm/auth/
# Should return NOTHING

# Check Zod validation
grep -r "safeParse" src/atomic-crm/layout/GlobalSearch.tsx
# Should find validation logic
```

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Status:** REQUIRED for Plans 5, 6, 9, 12, 16
