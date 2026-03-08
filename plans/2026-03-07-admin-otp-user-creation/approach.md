# Approach: Admin OTP User Creation

## Scope

### IN Scope

1. **Edge Function change** — Extract `email_otp` from `generate_link` response alongside `action_link`
   and return it in the user creation response.

2. **New "Regenerate Code" Edge Function endpoint** — Allow admins to call `generate_link` for an
   existing user's email and get back a fresh `email_otp`. Extend the `users` Edge Function with
   a new route/method or add a dedicated endpoint.

3. **SalesCreate dialog redesign** — Show the 6-digit OTP code prominently (large, monospace, copy
   button) with the setup URL. Keep recovery URL as a collapsible/secondary option.

4. **"Regenerate Setup Code" button on user profile** — New action in `SalesPermissionsTab` that
   calls the regenerate endpoint and shows the OTP in a dialog.

5. **New `/welcome` route** — A visually distinct page for first-time users:
   - Step 1: Enter email + 6-digit code → verifyOtp
   - Step 2: Set password → updateUser
   - Progress stepper, welcome messaging, distinct from login

6. **"First time?" link on login page** — Small link pointing to `/welcome`.

7. **Route registration** — Register `/welcome` in CRM.tsx, authProvider public paths, and routes constants.

8. **Service/type updates** — Add `emailOtp` to `SalesCreateResult` type, update `SalesService`
   to pass it through, add regenerate method.

### OUT of Scope

- Changing the existing "Reset Password" (email-based) flow — kept as-is
- Automated email sending from the system
- Modifying the existing `SetPasswordPage` (kept for recovery link flow, but `/welcome` is primary)
- The forgot-password flow
- Mobile/tablet optimizations beyond what Layout already provides

## Approach / Pattern

**Incremental extension** — not a rewrite. The OTP data already flows through `generate_link`
and `verifyOtp` is already implemented. We're:
1. Plumbing one new field (`email_otp`) through the existing response chain
2. Adding one new Edge Function capability (regenerate code)
3. Creating one new page (`/welcome`) using existing components (PasswordFields, Layout)
4. Updating two existing UIs (SalesCreate dialog, SalesPermissionsTab)

## Top 3 Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | `generate_link` response format differs between local/hosted Supabase | OTP field missing or named differently | Test both environments; the `email_otp` field is documented in GoTrue API schema |
| 2 | OTP expiry too short for admin-to-user handoff (default ~1 hour) | User gets "expired code" on first attempt | Document recommended expiry setting (e.g., 4 hours); add clear error messaging |
| 3 | Protected zone: Edge Function modification | `supabase/functions/` is a protected zone per CLAUDE.md | Requires explicit human approval before modifying |

## Constraints

- **Protected zones:** `supabase/functions/` and `authProvider.ts` require explicit approval
- **No direct Supabase imports** in feature components (CORE-001)
- **Existing tests:** SalesCreate.test.tsx, sales.service.test.ts, authProvider.test.ts must be
  updated to cover new OTP fields and regenerate capability
- **Semantic UI:** Must use Tailwind semantic tokens, 44px touch targets (CORE-017)

## Dependencies

- **Internal:** `generate_link` GoTrue admin API (already called in users Edge Function)
- **External:** Supabase dashboard OTP expiry configuration (deployment prerequisite)
- **Soft:** Supabase project must be on a plan that supports Edge Functions (already true)
