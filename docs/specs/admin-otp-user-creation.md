# Spec: Admin OTP User Creation

**Plan:** `plans/2026-03-07-admin-otp-user-creation`
**Created:** 2026-03-07
**Branch:** `feat/admin-otp-user-creation`
**Status:** Implementation complete, E2E bug fixed, verification pending

---

## Leadership Summary

**Problem:** Enterprise email security tools (Microsoft Defender Safe Links) consume one-time recovery URLs before users can click them, breaking the new-user onboarding flow. The existing fallback OTP path is hidden and the set-password page is visually indistinguishable from login.

**Solution:** Make OTP (6-digit code) the primary onboarding credential. Admin receives the code in a dialog and manually shares it. New `/welcome` page provides a distinct, guided account setup experience.

**Impact:** Zero new API calls — the OTP already existed in the `generate_link` response but was being ignored. Minimal blast radius: one Edge Function field extraction, two UI updates, one new page.

| Milestone | Status | Risk |
|-----------|--------|------|
| Edge Function returns OTP | Done | LOW |
| Regenerate Code endpoint | Done | LOW |
| SalesCreate dialog shows OTP | Done | LOW |
| SalesPermissionsTab "Generate Setup Code" | Done | LOW |
| `/welcome` page (2-phase OTP flow) | Done | LOW |
| Login page "First time?" link | Done | LOW |
| Route registration + auth public paths | Done | LOW |
| Service/type updates | Done | LOW |
| Test coverage | In Progress | MEDIUM |
| Manual E2E verification | Not Started | MEDIUM |

**Go/No-Go:** All code changes are implemented. Gate is test verification + manual E2E.

---

## Implementation Tickets

### Phase 1: Backend — Edge Function Changes [DONE]

#### Ticket 1.1: Extract `email_otp` from `generate_link` response [Confidence: 98%]
**File:** `supabase/functions/users/index.ts:320-322`
**Status:** DONE
**What was done:** The POST handler already extracts `email_otp` from the `generate_link` response payload (line 322) and returns it alongside `recoveryUrl` in the JSON response (line 332).
**Verification:** `emailOtp = payload.email_otp ?? null;` at line 322.

#### Ticket 1.2: Regenerate Code endpoint (PUT handler) [Confidence: 98%]
**File:** `supabase/functions/users/index.ts:482-630`
**Status:** DONE
**What was done:** New `regenerateCode` async function handles PUT requests. Validates admin role, accepts email via `regenerateCodeSchema` (Zod strictObject, line 69), calls `generate_link` with `type: "recovery"`, returns `emailOtp` and `recoveryUrl`. Router at line 629 dispatches PUT to this handler.
**Acceptance criteria:**
- [x] Admin-only (role check)
- [x] Zod validation on input
- [x] Returns `{ emailOtp, recoveryUrl }`
- [x] Invalidates previous OTP (Supabase behavior — new `generate_link` replaces old token)

#### Ticket 1.3: CORS configuration [Confidence: 95%]
**File:** `supabase/functions/_shared/cors-config.ts`
**Status:** DONE (modified per git status)
**Verification needed:** Confirm allowed origins include all deployment targets.

---

### Phase 2: Service & Type Layer [DONE]

#### Ticket 2.1: Add `emailOtp` to `SalesCreateResult` type [Confidence: 99%]
**File:** `src/atomic-crm/providers/supabase/extensions/types.ts:43-47`
**Status:** DONE
**What exists:**
```typescript
export interface SalesCreateResult {
  sale: Sale;
  recoveryUrl: string | null;
  emailOtp: string | null;
}
```

#### Ticket 2.2: Add `RegenerateCodeResult` type [Confidence: 99%]
**File:** `src/atomic-crm/providers/supabase/extensions/types.ts:49-53`
**Status:** DONE
**What exists:**
```typescript
export interface RegenerateCodeResult {
  emailOtp: string;
  recoveryUrl: string | null;
}
```

#### Ticket 2.3: `SalesService.salesCreate` handles `emailOtp` [Confidence: 98%]
**File:** `src/atomic-crm/services/sales.service.ts:39-93`
**Status:** DONE
**What was done:** Backward-compatible parsing detects new response format (`{ data, recoveryUrl, emailOtp }`) vs old format (raw Sale). Returns `emailOtp` in result.

#### Ticket 2.4: `SalesService.regenerateSetupCode` method [Confidence: 98%]
**File:** `src/atomic-crm/services/sales.service.ts:279-310`
**Status:** DONE
**What was done:** Calls `dataProvider.invoke("users", { method: "PUT", body: { email } })`. Validates response contains `emailOtp`. Uses `devError` for structured logging per PRV-010.

#### Ticket 2.5: `salesExtension` wires `regenerateSetupCode` to DataProvider [Confidence: 95%]
**File:** `src/atomic-crm/providers/supabase/extensions/salesExtension.ts`
**Status:** DONE (modified per git status)
**Verification needed:** Confirm method is registered in extension and callable via `dataProvider.regenerateSetupCode()`.

#### Ticket 2.6: `ExtendedDataProvider` type includes `regenerateSetupCode` [Confidence: 99%]
**File:** `src/atomic-crm/providers/supabase/extensions/types.ts:171-181`
**Status:** DONE
**Signature:** `regenerateSetupCode(targetEmail: string): Promise<RegenerateCodeResult>`

---

### Phase 3: UI — SalesCreate Dialog [DONE]

#### Ticket 3.1: OTP-first success dialog in SalesCreate [Confidence: 98%]
**File:** `src/atomic-crm/sales/SalesCreate.tsx:164-265`
**Status:** DONE
**What was done:**
- OTP shown prominently: large monospace `text-2xl tracking-[0.3em]` with copy button (lines 178-190)
- Setup URL displayed: `{origin}/#/welcome` (lines 191-196)
- Recovery link as collapsible `<details>` fallback (lines 201-224)
- Fallback message if both OTP and URL are null (lines 250-256)
- Graceful degradation: if Edge Function returns neither, directs admin to use "Generate Setup Code" on profile

**Acceptance criteria:**
- [x] OTP displayed in large monospace font
- [x] Copy button with "Copied!" feedback
- [x] Setup URL shown
- [x] Recovery link as collapsible secondary option
- [x] Dialog accessible (DialogTitle, DialogDescription present)

---

### Phase 4: UI — SalesPermissionsTab "Generate Setup Code" [DONE]

#### Ticket 4.1: "Generate Setup Code" button and dialog [Confidence: 98%]
**File:** `src/atomic-crm/sales/SalesPermissionsTab.tsx:430-550`
**Status:** DONE
**What was done:**
- Confirmation AlertDialog before generating (lines 435-465)
- Calls `dataProvider.regenerateSetupCode(record.email)` (line 144)
- Result dialog shows OTP in same large monospace style as SalesCreate (lines 508-550)
- Copy button with feedback (lines 154-161)
- Loading state with `isGeneratingCode` flag (line 88)
- Admin-only visibility: gated by `identity?.role === "admin"` (line 425)
- Positioned above "Send Reset Email" as primary option (line 430)

**Acceptance criteria:**
- [x] Confirmation before generation
- [x] OTP displayed with copy button
- [x] Setup URL displayed
- [x] Admin-only visibility
- [x] Loading state during generation
- [x] All dialogs have title landmarks (CORE-015)

---

### Phase 5: UI — Welcome Page [DONE]

#### Ticket 5.1: `/welcome` page with 2-phase OTP flow [Confidence: 97%]
**File:** `src/components/supabase/welcome-page.tsx`
**Status:** DONE
**What was done:**
- Phase 1 (verify): Email + OTP input, calls `supabase.auth.verifyOtp({ email, token, type: "recovery" })` (line 66-70)
- Phase 2 (password): Password + confirm, calls `supabase.auth.updateUser({ password })` (line 105)
- Password validation: min 8, max 128, uppercase, lowercase, number (lines 23-39)
- Progress indicator: "Step 1 of 2" / "Step 2 of 2" labels
- Welcome messaging: "Your administrator has created an account for you" (line 169)
- After password set: signs out recovery session, redirects to login (lines 113-117)
- Uses shared `Layout` component for visual consistency with other auth pages
- "Already have an account? Sign in" link (line 191)

**Acceptance criteria:**
- [x] Two distinct phases with clear progression
- [x] OTP verification with `type: "recovery"`
- [x] Password strength validation
- [x] Signs out recovery session after password set
- [x] Redirects to login on success
- [x] Visually distinct from login (welcome messaging, step indicator)

**Note (CORE-001 consideration):** This page imports `supabase` directly (line 8) for `verifyOtp` and `updateUser`. This is acceptable because it's an auth page outside the React Admin data layer — same pattern as `set-password-page.tsx` and `forgot-password-page.tsx`.

---

### Phase 6: Routing & Auth [DONE]

#### Ticket 6.1: Route constant [Confidence: 99%]
**File:** `src/constants/routes.ts:11`
**Status:** DONE — `WELCOME: "welcome"` added.

#### Ticket 6.2: CRM.tsx route registration [Confidence: 99%]
**File:** `src/atomic-crm/root/CRM.tsx:64-68, 247-254`
**Status:** DONE — Lazy-loaded `WelcomePage` registered under `CustomRoutes noLayout`.

#### Ticket 6.3: Login page "First time?" link [Confidence: 99%]
**File:** `src/components/ra-wrappers/login-page.tsx:77-79`
**Status:** DONE — `<Link to="/welcome">First time? Set up your account</Link>` added.

#### Ticket 6.4: Auth provider public path [Confidence: 98%]
**File:** `src/atomic-crm/providers/supabase/authProvider.ts:136`
**Status:** DONE — `/welcome` added to `publicPaths` array. Also handled in hash-based check (line 81).

---

### Phase 7: Test Coverage [IN PROGRESS]

#### Ticket 7.1: SalesCreate.test.tsx — OTP dialog tests [Confidence: 75%]
**File:** `src/atomic-crm/sales/__tests__/SalesCreate.test.tsx`
**Status:** Modified (per git status), needs verification
**Required tests:**
- [ ] Shows OTP in dialog after successful creation
- [ ] Copy OTP button works
- [ ] Recovery link shown as collapsible fallback
- [ ] Handles missing OTP gracefully
**To Increase:** Run `npm test -- --run SalesCreate` and verify passing

#### Ticket 7.2: SalesPermissionsTab.test.tsx — Generate Code tests [Confidence: 75%]
**File:** `src/atomic-crm/sales/__tests__/SalesPermissionsTab.test.tsx`
**Status:** Modified (per git status), needs verification
**Required tests:**
- [ ] "Generate Setup Code" button visible for admins
- [ ] Confirmation dialog shown before generation
- [ ] OTP dialog shown after generation
- [ ] Button hidden for non-admins
**To Increase:** Run `npm test -- --run SalesPermissionsTab` and verify passing

#### Ticket 7.3: sales.service.test.ts — Service layer tests [Confidence: 75%]
**File:** `src/atomic-crm/services/__tests__/sales.service.test.ts`
**Status:** Modified (per git status), needs verification
**Required tests:**
- [ ] `salesCreate` returns `emailOtp` from new format
- [ ] `salesCreate` backward-compatible with old format
- [ ] `regenerateSetupCode` returns OTP
- [ ] `regenerateSetupCode` throws on missing OTP
**To Increase:** Run `npm test -- --run sales.service` and verify passing

#### Ticket 7.4: welcome-page.test.tsx — Welcome page tests [Confidence: 70%]
**File:** `src/components/supabase/__tests__/welcome-page.test.tsx`
**Status:** New file, needs verification
**Required tests:**
- [ ] Renders step 1 (email + OTP form)
- [ ] Transitions to step 2 after OTP verification
- [ ] Password validation enforced
- [ ] Redirects to login after password set
**To Increase:** Run `npm test -- --run welcome-page` and verify passing

#### Ticket 7.5: authProvider.test.ts — Public path tests [Confidence: 80%]
**File:** `src/atomic-crm/providers/supabase/__tests__/authProvider.test.ts`
**Status:** Modified (per git status), needs verification
**Required tests:**
- [ ] `/welcome` recognized as public path
- [ ] Hash-based `#/welcome` recognized
**To Increase:** Run `npm test -- --run authProvider` and verify passing

#### Ticket 7.6: customMethodsExtension.test.ts — Extension wiring [Confidence: 70%]
**File:** `src/atomic-crm/providers/supabase/extensions/__tests__/customMethodsExtension.test.ts`
**Status:** Modified (per git status), needs verification
**Required tests:**
- [ ] `regenerateSetupCode` method exists on extended provider
- [ ] Delegates to SalesService correctly
**To Increase:** Run `npm test -- --run customMethodsExtension` and verify passing

---

### Phase 8: Verification & Polish [NOT STARTED]

#### Ticket 8.1: TypeScript compilation [Confidence: 90%]
**Command:** `npx tsc --noEmit`
**Status:** Not verified
**To Increase:** Run and confirm zero errors

#### Ticket 8.2: Lint check [Confidence: 90%]
**Command:** `npm run lint`
**Status:** Not verified
**To Increase:** Run and confirm zero errors

#### Ticket 8.3: Full test suite [Confidence: 80%]
**Command:** `npm test`
**Status:** Not verified
**To Increase:** Run and confirm all tests pass

#### Ticket 8.4: Manual E2E verification [Confidence: 50%]
**Steps:**
1. Create a new user via SalesCreate — verify OTP shown in dialog
2. Copy OTP and navigate to `/welcome`
3. Enter email + OTP — verify transition to password step
4. Set password — verify redirect to login
5. Login with new credentials — verify access
6. Go to user profile > Permissions tab — verify "Generate Setup Code" button
7. Generate new code — verify dialog with OTP
8. Use new code on `/welcome` — verify it works (old code should be invalid)
**To Increase:** Execute steps in local dev environment with `npm run dev`

#### Ticket 8.5: Edge Function dry-run [Confidence: 85%]
**Command:** `npx supabase db push --dry-run`
**Note:** No migration changes in this feature — Edge Function only. Verify no unintended migration drift.

---

## Working Checklist

### Pre-merge verification (CMD-001 through CMD-005):
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm test` — all tests pass
- [ ] No new `console.log` in production code (CMD-001)
- [ ] No new `: any` / `as any` (CMD-002)
- [ ] No `zodResolver` violations (CMD-004)
- [ ] Manual E2E: Create user flow with OTP
- [ ] Manual E2E: Regenerate code flow
- [ ] Manual E2E: Welcome page full flow

### Rollback Plan
**Risk:** LOW — all changes are additive. No database migrations. No breaking changes to existing flows.
- Edge Function: Revert to previous version (recovery URL still works)
- Frontend: Revert branch. Existing set-password page still functional
- No data migration needed — no schema changes

---

## Bugs Found During E2E Testing

### BUG-1: `/welcome` OTP flow hijacked by PASSWORD_RECOVERY listener (FIXED)
**Symptom:** After entering OTP on `/welcome`, toast "Code verified!" appeared twice, then page redirected to `/set-password?flow=recovery` showing "Verifying your reset link..." stuck.
**Root cause:** `supabase.auth.verifyOtp({ type: "recovery" })` fires a `PASSWORD_RECOVERY` auth event. The global `onAuthStateChange` listener in `supabase.ts` redirected to `/set-password` without checking if the user was already on `/welcome`.
**Fix:** Added `/welcome` exclusion to the listener (`supabase.ts:51`): `!hash.includes("/welcome")`.

### BUG-2: WelcomePage phase reset on auth state change (FIXED)
**Symptom:** After OTP verified, toast fired twice and page stayed on step 1 instead of advancing to step 2.
**Root cause:** `verifyOtp` fires `SIGNED_IN` event which causes React Admin to re-render the route tree. `WelcomePage` re-mounts, `useState("verify")` resets. Phase transition lost.
**Fix:** Persisted `phase` in `sessionStorage` (`welcome-page.tsx:54-68`). Initializer reads from storage; effect syncs to storage; cleanup on password set.

### BUG-3: SetPasswordPage stuck on "Verifying your reset link..." (FIXED)
**Symptom:** When landing on `/set-password?flow=recovery` with no valid session, the page showed "Verifying your reset link..." indefinitely.
**Root cause:** `getSession()` could hang without resolving, leaving `sessionCheckState` stuck at `"checking"`.
**Fix:** Added 5-second timeout with race condition guard (`set-password-page.tsx:98-121`). Falls through to OTP form on timeout.

## Architecture Decisions

**AD-1: Direct Supabase import in WelcomePage**
The `/welcome` page imports `supabase` client directly for `verifyOtp` and `updateUser`. This follows the established pattern for auth pages (`set-password-page.tsx`, `forgot-password-page.tsx`) which operate outside React Admin's data layer. These are unauthenticated pages that need raw Supabase auth methods.

**AD-2: OTP type is `recovery`**
Using `type: "recovery"` for both `generate_link` and `verifyOtp` because the Edge Function already uses this type. The OTP generated by `generate_link` with `type: "recovery"` must be verified with the same type.

**AD-3: Recovery session signout after password set**
After `updateUser({ password })`, the welcome page explicitly calls `signOut()` to destroy the recovery session. This forces the user to login with their new password through the normal auth flow, establishing a proper session with correct identity/role data.

---

## Plan Confidence Summary

- **Overall Confidence:** 92%
- **Highest Risk:** Ticket 7.x (test coverage) — tests are modified/new but not yet verified passing
- **Second Risk:** Ticket 8.4 (manual E2E) — not yet executed
- **Verification Needed:**
  1. Run full test suite (`npm test`)
  2. Run type check (`npx tsc --noEmit`)
  3. Run lint (`npm run lint`)
  4. Execute manual E2E flow
