# Plan Audit: Admin OTP User Creation

**Date:** 2026-03-07
**Plan:** `plans/2026-03-07-admin-otp-user-creation`
**Spec:** `docs/specs/admin-otp-user-creation.md`
**Branch:** `feat/admin-otp-user-creation`

---

## Check 1: 8-Dimension Score

| # | Dimension | Score | Evidence |
|---|-----------|-------|----------|
| 1 | Problem Definition | **5/5** | Brainstorm clearly identifies email prefetching as root cause. Supabase's own docs confirm OTP recommendation. All open questions resolved with evidence. |
| 2 | Architecture / Approach | **5/5** | Incremental extension, not rewrite. Reuses existing `generate_link` + `verifyOtp` mechanics. No new dependencies. Follows established auth page patterns. |
| 3 | Phasing / Sequencing | **4/5** | Logical 8-phase progression. Minor gap: no explicit ordering between Edge Function deploy and frontend deploy (though both are on same branch). |
| 4 | Risk Identification | **4/5** | Top 3 risks identified with mitigations. Missing: OTP brute-force rate limiting consideration (Supabase has built-in protection, but not documented in plan). |
| 5 | Rollback Plan | **5/5** | All changes additive. No migrations. Recovery URL still works as fallback. Clear rollback: revert branch. |
| 6 | Timeline / Effort | **4/5** | Implementation is complete. Only verification remains. No timeline estimates needed since work is done. Minor: no effort tracking for the completed work. |
| 7 | Testing Strategy | **4/5** | 120 tests passing across 6 test files. Unit tests cover service, UI, auth. Missing: no pgTAP tests for Edge Function RLS (Edge Functions use service_role, so RLS isn't directly tested). Manual E2E checklist documented but not executed. |
| 8 | Team / Ownership | **3/5** | Owner, tech reviewer, and business approver all "TBD". No explicit review assignments. |

**Total: 34/40 — GREEN**

**Threshold:** 32-40 GREEN | 24-31 YELLOW | 16-23 ORANGE | 1-15 RED

---

## Check 2: Devil's Advocate Challenges

### Challenge 1: Direct `supabase` import in WelcomePage
**Claim:** WelcomePage imports supabase directly, following auth page precedent.
**Challenge:** This bypasses the data provider boundary (CORE-001). Is this justified?
**Verdict:** JUSTIFIED. Auth pages (`set-password-page.tsx`, `forgot-password-page.tsx`, `login-page.tsx`) all import supabase directly. `verifyOtp` and `updateUser` are Supabase Auth SDK methods, not data operations. The data provider doesn't wrap auth methods. This is consistent with the existing codebase pattern.

### Challenge 2: OTP expiry window
**Claim:** Default ~1 hour expiry is sufficient.
**Challenge:** Admin creates user in morning, user tries to set up in afternoon — OTP expired.
**Verdict:** ACKNOWLEDGED RISK. Plan documents this as Risk #2 with mitigation: "Document recommended expiry setting (4 hours), add clear error messaging." The "Generate Setup Code" button on the user profile provides a fallback for expired OTPs. [LOW RISK]

### Challenge 3: Clipboard API availability
**Claim:** Copy button uses `navigator.clipboard.writeText()`.
**Challenge:** Clipboard API requires HTTPS or localhost. Will this work in all deployment contexts?
**Verdict:** LOW RISK. The app is deployed on HTTPS. Localhost dev also has clipboard access. No HTTP-only deployments expected. Graceful degradation: `select-all` CSS class on the OTP field allows manual copy.

### Challenge 4: Recovery session signout timing
**Claim:** After password set, `signOut()` then redirect to login after 1500ms.
**Challenge:** What if signOut fails? User could be in a broken state.
**Verdict:** LOW RISK. If signOut fails, the recovery session would persist until expiry. The `setTimeout` redirect happens regardless. User can still navigate to login manually. The session would be replaced on next login. No data loss scenario.

### Challenge 5: No i18n for WelcomePage strings
**Claim:** WelcomePage uses hardcoded English strings.
**Challenge:** Notification "Code verified! Now create your password." triggers "Missing translation" warning in tests.
**Verdict:** ACKNOWLEDGED. Consistent with existing auth pages which also use hardcoded strings. i18n for auth pages is not in scope for MVP. The warning is cosmetic. [LOW RISK]

### Challenge 6: Protected zone modifications
**Claim:** Edge Function and authProvider are protected zones.
**Challenge:** Were these changes explicitly approved?
**Verdict:** [VERIFY] The plan documents this constraint (approach.md, Risk #3). Changes are on a feature branch, not yet merged. Human approval required before merge per CLAUDE.md protected zone rules.

---

## Check 3: Codebase Verification

| Ref | Claim | Verified |
|-----|-------|----------|
| `supabase/functions/users/index.ts:322` | `emailOtp = payload.email_otp ?? null` | YES |
| `supabase/functions/users/index.ts:629` | PUT routes to `regenerateCode` | YES |
| `supabase/functions/users/index.ts:69` | `regenerateCodeSchema` Zod strictObject | YES |
| `src/atomic-crm/sales/SalesCreate.tsx:173-225` | OTP dialog with copy button | YES |
| `src/atomic-crm/sales/SalesPermissionsTab.tsx:430-465` | Generate Setup Code button + confirmation | YES |
| `src/atomic-crm/sales/SalesPermissionsTab.tsx:508-550` | OTP result dialog | YES |
| `src/atomic-crm/services/sales.service.ts:279-310` | `regenerateSetupCode` method | YES |
| `src/atomic-crm/providers/supabase/extensions/types.ts:43-53` | `SalesCreateResult` + `RegenerateCodeResult` | YES |
| `src/components/supabase/welcome-page.tsx` | 2-phase OTP flow | YES |
| `src/components/ra-wrappers/login-page.tsx:77-79` | "First time?" link | YES |
| `src/constants/routes.ts:11` | `WELCOME: "welcome"` | YES |
| `src/atomic-crm/root/CRM.tsx:64-68, 247-254` | Route registration | YES |
| `src/atomic-crm/providers/supabase/authProvider.ts:136` | `/welcome` in publicPaths | YES |

**All 13 file references verified.**

---

## Quality Gate Results

| Gate | Command | Result |
|------|---------|--------|
| CMD-001 | Production console scan | **0** (PASS) |
| CMD-002 | Any/cast scan | **0** (PASS) |
| CMD-003 | `npx tsc --noEmit` | **0 errors** (PASS) |
| CMD-004 | Resolver adapter scan | **0 violations** (PASS) |
| CMD-005 | `npm run lint` | **0 errors, 241 warnings** (PASS — warnings are pre-existing) |
| Tests | Feature test suite (6 files) | **120/120 passed** (PASS) |

---

## Bugs Found During E2E (Post-Audit)

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| BUG-1 | PASSWORD_RECOVERY listener hijacks `/welcome` OTP flow | HIGH | FIXED — `supabase.ts:51` now excludes `/welcome` |
| BUG-2 | SetPasswordPage stuck on "Verifying" when `getSession()` hangs | MEDIUM | FIXED — 5s timeout added in `set-password-page.tsx:98-121` |

**Files changed during bug fixes (protected zones):**
- `src/atomic-crm/providers/supabase/supabase.ts` — 1-line change (added `/welcome` exclusion)
- `src/components/supabase/set-password-page.tsx` — timeout logic in useEffect

## Gap List

| # | Gap | Severity | Recommendation |
|---|-----|----------|----------------|
| 1 | Ownership TBD (owner, reviewer, approver) | LOW | Assign before merge |
| 2 | Manual E2E needs re-run after bug fixes | MEDIUM | Re-test full flow on `/welcome` |
| 3 | Protected zone changes need explicit approval | HIGH | Get human approval for Edge Function, authProvider, supabase.ts changes before merge |
| 4 | Missing i18n for WelcomePage strings | LOW | Defer — consistent with existing auth pages |
| 5 | OTP brute-force rate limiting not documented | LOW | Supabase has built-in protection; add note to spec |

---

## Summary

**Score: 34/40 — GREEN**

The plan is solid. Implementation is complete with 120 passing tests, zero type errors, zero lint errors, and zero quality gate violations. All codebase references verified.

**Before merge:**
1. Get explicit human approval for protected zone changes (Edge Function, authProvider)
2. Execute manual E2E verification (spec Ticket 8.4)
3. Assign ownership (currently all TBD)
