# Login Module

Thin authentication entry point for Crispy CRM. Renders the sign-in page, a loading skeleton for deferred loads, and routes users into the React Admin session via Supabase Auth. All credential handling and auth state live in the provider layer — this module contains no auth logic of its own.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Low (risk score: 1 — safest module in codebase) |
| Phase | 1 |
| Test Project | `__tests__/StartPage.test.tsx` |
| Dependents | 1 (`root`) |

## Key Components

| File | Purpose |
|------|---------|
| `StartPage.tsx` | Entry component — delegates to `LoginPage` from `ra-wrappers` |
| `LoginSkeleton.tsx` | Loading placeholder shown while the auth state resolves |
| `index.ts` | Barrel export for `StartPage` and `LoginSkeleton` |

`LoginPage` itself lives in `src/components/ra-wrappers/login-page.tsx` and owns the form UI: email + password inputs, sign-in button, "Forgot your password?" link, and `Notification` for auth errors. `StartPage` is the React Admin-registered login page that wraps it.

## Dependencies

### Internal Modules Referenced
- `src/components/ra-wrappers/login-page` — full login form UI
- `src/components/ui/skeleton` — `LoginSkeleton` placeholder
- `src/atomic-crm/root/ConfigurationContext` — branding (logo, title) via `useAppBranding`

### npm Packages (via `ra-wrappers/login-page`)
- `ra-core` ^5.10.0 — `useLogin`, `useNotify`, `Form`
- `react-router-dom` ^6.30.3 — `Link` to `/forgot-password`
- `react-hook-form` ^7.66.1 — form submission types

### External Integrations
- **Supabase Auth (Client SDK)** — `authProvider.ts` handles the actual sign-in call; this module calls `useLogin()` which delegates there.

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Authentication Login | Login | 0.95 |

Flows covered: sign-in form, forgot-password link routing, set-password (handled by `authProvider.ts` + `supabase/functions/updatepassword`). The login module itself only renders the start page; recovery and set-password flows are wired in the provider and edge function layers.

## Common Modification Patterns

This module is a thin wrapper — most auth changes belong in `src/atomic-crm/providers/supabase/authProvider.ts` (Caution Zone), not here. To change the sign-in form layout or add fields, edit `src/components/ra-wrappers/login-page.tsx`. To change what is shown while auth state loads, edit `LoginSkeleton.tsx`. After any change, run `__tests__/StartPage.test.tsx` via `npm run test` and verify the "Sign in" heading, email/password inputs, submit button, and forgot-password link all render correctly.

## Guardrails

- `src/atomic-crm/providers/supabase/authProvider.ts` — requires human review; mistakes lock out all users (ai_guardrails: `auto_modify: false`).
- `supabase/functions/users/index.ts` — user management with Auth Admin API; requires human review.
- `supabase/functions/updatepassword/index.ts` — password reset edge function; changes must be tested on staging.
- This module itself has no guardrail restrictions and is safe to modify freely.

## Related

- Audit report: `docs/audit/baseline/risk-assessment.json` (`login` entry)
- Auth provider: `src/atomic-crm/providers/supabase/authProvider.ts`
- Login page wrapper: `src/components/ra-wrappers/login-page.tsx`
