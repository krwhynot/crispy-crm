# Research Findings: Admin OTP User Creation

## Track 1: Supabase OTP Mechanics

### Key Discovery: `generate_link` Already Returns the OTP

The GoTrue `/admin/generate_link` API response includes BOTH:
- `action_link` — the full recovery URL (what we currently use)
- `email_otp` — the raw **6-digit OTP code** (what we want)
- `hashed_token` — the hashed version for server-side verification

**Source:** [Supabase Self-Hosting Auth API Reference](https://supabase.com/docs/reference/self-hosting-auth/introduction#generates-an-email-action-link)

**Current code gap:** The existing Edge Function (`supabase/functions/users/index.ts:297-316`)
already calls `generate_link` with `type: "recovery"` but only extracts `action_link` (line 316).
The `email_otp` field is returned but **ignored**. Minimal change needed.

### OTP Verification Types

`verifyOtp()` supports these email types:
| Type | Use Case |
|------|----------|
| `email` | Signup/signin OTP |
| `recovery` | Password recovery OTP |
| `invite` | Invitation OTP |
| `email_change` | Email change OTP |

Since our Edge Function uses `type: "recovery"` for `generate_link`, the user
verifies with `verifyOtp({ email, token, type: 'recovery' })`.

**Existing support:** `SetPasswordPage` (line 162-166) already calls `verifyOtp()` with
dynamic `otpType` based on URL params. The OTP verification path is fully functional.

### OTP Expiry

- Configurable via `Auth > Providers > Email > Email OTP Expiration`
- Max allowed: 86400 seconds (24 hours) — enforced to prevent brute force
- Default: ~1 hour (3600 seconds)
- **Source:** [Supabase Email OTP Guide](https://supabase.com/docs/guides/auth/auth-email-passwordless)

### Format

- 6-digit numeric code (Supabase standard)
- Industry standard for OTPs (matches TOTP/SMS patterns users are familiar with)

## Track 2: Email Prefetching Problem (Supabase Official Guidance)

**Supabase's own documentation explicitly recommends OTP over links** to avoid prefetching:

> Certain email providers may have spam detection or other security features that
> prefetch URL links from incoming emails (e.g. Safe Links in Microsoft Defender
> for Office 365). In this scenario, the {{ .ConfirmationURL }} sent will be
> consumed instantly which leads to a "Token has expired or is invalid" error.

**Supabase's recommended Option 1:**
- Use `{{ .Token }}` (the 6-digit OTP) instead of `{{ .ConfirmationURL }}`
- Create a custom page where users enter email + OTP to verify
- Call `verifyOtp()` with the token

**Source:** [Supabase Email Templates - Limitations](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-email-templates.mdx#limitations)

**Verdict:** This validates the user's request. OTP-first is Supabase's own recommendation
for enterprise environments with email security tools.

## Track 3: UX Best Practices for First-Time Password Setup

### Visual Differentiation from Login

Research-based recommendations for making a password setup page distinct from login:

1. **Different heading/messaging:**
   - Login: "Sign in" / "Welcome back"
   - Setup: "Welcome to [App]" / "Set Up Your Account" / "Complete Your Account Setup"
   - Include context: "Your administrator has created an account for you"

2. **Visual cues:**
   - Different accent color or hero banner (e.g., a welcome illustration or success checkmark)
   - Progress stepper (Step 1: Verify Code → Step 2: Create Password)
   - No "Forgot password?" or "Sign up" links that imply an existing account

3. **Flow structure:**
   - Two clear phases: OTP verification, then password creation
   - Show email pre-filled or as read-only after OTP verification
   - Success state with clear "Go to Login" call-to-action

4. **Entry points:**
   - Dedicated URL (e.g., `/welcome` or `/setup-account`)
   - Small "First time? Set up your account" link on login page
   - Admin shares the URL alongside the OTP code

## Track 4: What Already Exists in Crispy CRM

### Files involved in current flow:

| File | Role | Change Needed |
|------|------|---------------|
| `supabase/functions/users/index.ts` | Edge Function: creates user, generates link | Extract `email_otp` from response |
| `src/atomic-crm/sales/SalesCreate.tsx` | Admin create form + recovery URL dialog | Show OTP code instead of URL |
| `src/components/supabase/set-password-page.tsx` | User-facing set password page | Redesign with distinct welcome look |
| `src/components/supabase/layout.tsx` | Shared layout for auth pages | May need variant or new layout |
| `src/components/ra-wrappers/login-page.tsx` | Login page | Add "First time?" link |
| `src/atomic-crm/services/sales.service.ts` | Service layer wrapping Edge Function calls | Handle new `emailOtp` field |
| `src/atomic-crm/providers/supabase/extensions/types.ts` | Type definitions | Add `emailOtp` to `SalesCreateResult` |
| `src/constants/routes.ts` | Route constants | Add `WELCOME` route |
| `src/atomic-crm/root/CRM.tsx` | App routing | Register new route |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Auth provider | Allow new route as public |

### What's already working:
- OTP verification via `verifyOtp()` in SetPasswordPage (lines 154-184)
- Password setting after OTP verification (lines 188-221)
- Password strength validation (lines 29-46)
- The `PasswordFields` shared component (lines 376-394)

### What needs to change:
- Edge Function: also return `email_otp` from `generate_link` response
- SalesCreate dialog: show OTP code prominently instead of URL
- New welcome page or restyled SetPasswordPage with distinct visual identity
- Login page: add "First time?" link
- Routing: register new route and allow unauthenticated access

## Recommendations (Evidence-Based)

### Q1: OTP delivery method
**Recommendation: Admin receives OTP in the success dialog and manually shares it.**
- `generate_link` already returns `email_otp` — zero new API calls needed
- Manual sharing (Slack, email, in-person) avoids automated emails getting caught in spam
- Matches current UX pattern (dialog with copy button)
- Admin shares both the OTP and the setup URL

### Q2: OTP format
**Recommendation: Use Supabase's native 6-digit numeric code.**
- It's what `generate_link` returns as `email_otp`
- It's what `verifyOtp()` expects
- Industry standard, familiar to users

### Q3: Entry point for the "Welcome" page
**Recommendation: Both — a `/welcome` route AND a link on the login page.**
- New route `/welcome` with distinct visual design
- "First time? Set up your account" link on login page
- Admin shares: "Go to [app-url]/welcome and enter code 123456"

### Q4: Recovery link
**Recommendation: Keep as secondary fallback, OTP is primary.**
- Still generate the recovery link (for "Reset Password" on existing user profiles)
- Return both `emailOtp` and `recoveryUrl` from Edge Function
- Admin dialog shows OTP prominently; recovery URL available as collapsible fallback
