# Troubleshooting Knowledge Base

### Welcome Page OTP Phase Reset (2026-03-07)
**Category:** Timing / Integration
**Symptom:** After entering OTP on `/welcome`, toast "Code verified!" appears twice, page stays on step 1 instead of advancing to step 2 (password).
**Root Cause:** `verifyOtp({ type: "recovery" })` fires `SIGNED_IN` + `PASSWORD_RECOVERY` auth events. The PASSWORD_RECOVERY listener in `supabase.ts` redirected to `/set-password` (fixed by excluding `/welcome`). The SIGNED_IN event causes React Admin's `<Admin requireAuth>` to re-render the route tree, unmounting/remounting `WelcomePage` and resetting `useState` phase back to `"verify"`.
**Fix:** (1) Excluded `/welcome` from PASSWORD_RECOVERY redirect in `supabase.ts`. (2) Persisted `phase` state in `sessionStorage` so it survives auth-triggered re-mounts. (3) Added 5s timeout to `set-password-page.tsx` session check to prevent "Verifying" stuck state.
**Prevention:** Auth pages that call Supabase auth methods which fire auth events should persist critical UI state outside React state (sessionStorage, URL params) to survive React Admin's auth-triggered re-renders.
**Plan:** admin-otp-user-creation
**Log:** docs/specs/admin-otp-user-creation.md (Bugs Found During E2E section)
