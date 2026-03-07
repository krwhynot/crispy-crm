# CLAUDE.md - Crispy CRM (Atomic CRM)
**Stack:** React 19 + TypeScript + React Admin + Supabase | **Device:** Desktop (1440px+) & iPad
**Goals:** Centralize sales data (kill Excel), <2s Principal answers, 10+ activities/week/principal, 100% adoption (30 days).

## 📊 Output Requirements (Confidence MANDATORY)
**Rule:** Display `[Confidence: XX%]` on **ALL** tasks, plans, and assessments. **NEVER OMIT.**
**Factors:** Code/docs/tests (++) vs assumptions/missing context (--).
**Scale:** **High (95-100%)** Verified; **Med (60-94%)** Likely; **Low (30-59%)** Guess; **Spec (<30%)** Hypothesis.
**Protocol:** Items <70% require `To Increase: [steps]`. Items <50% require human flag.

**Required Plan Format:**
1. **Task Schema:**
   ### Task X: [Name] [Confidence%]
   **File:** `path/to/file`
   **Basis:** [Rationale/Evidence]
   **Effort:** [Time] [Confidence%]
   **To Increase:** [Verification steps if <70%]

2. **Summary Schema (End of Plan):**
   ## Plan Confidence Summary
   - **Overall Confidence:** [XX%]
   - **Highest Risk:** [Task #]
   - **Verification Needed:** [List key items]

**Contexts:**
- **Debug:** `Root cause: stale cache [60%]`.
- **Arch/Est:** `Recommend handler [90%]`, `~2 hours [65%]`, `Breaking risk [40%]`.

## 🏗 Architecture & Structure
**Critical:** All DB access via `src/atomic-crm/providers/supabase/composedDataProvider.ts`.
- **Rules:** NO direct Supabase imports. Zod schemas at API boundary (provider), NOT forms.

**Directory Map:**
- `src/atomic-crm/` (Features: contacts, organizations, opportunities)
- `src/atomic-crm/validation/` (Zod schemas)
- `src/components/admin/` (RA wrappers)
- `supabase/migrations/` (SQL) | `supabase/functions/` (Edge/Deno)

**Feature Pattern:** `index.tsx`, `Feature{List,Create,Edit}.tsx`, `FeatureSlideOver.tsx` (40vw).

## 📐 Engineering Principles
**Core:** Fail Fast (no retries). Single Source of Truth (Provider). TS: `interface` (shapes), `type` (unions).
**Implementation Protocol:** Explain the solution architecture FIRST before writing code. Earn the right to code by proving understanding of: (1) root cause, (2) why this layer/approach, (3) end-to-end data flow. No band-aids—fix problems at the right layer.
**Forms:** `onSubmit`/`onBlur` (no `onChange`). Use `useWatch()` (isolated), not `watch()`.
**Zod:** `z.coerce` (non-strings), `.max()` (strings), `z.strictObject()` (API), `z.enum()` (allowlists).

**Strict Bans (Deprecated):**
- `Contact.company_id` → Use `contact_organizations` junction.
- `Opportunity.archived_at` → Use `deleted_at`.
- Direct Supabase imports → Use `composedDataProvider`.
- Form-level validation → Move to API boundary.

## 🎨 Design System
**Tailwind v4 Semantic:** ✅ `text-muted-foreground`, `bg-primary` | ❌ `text-gray-500`, `hex/oklch`.
**Components:** List Shell, Slide-Over, Tabbed Forms.
**Filters:** `src/components/admin/column-filters/`. Debounced text (300ms), Checkbox popovers. Use `useListContext`.

## 🔧 Key Commands
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Type check:** `npx tsc --noEmit`
- **DB dry-run:** `npx supabase db push --dry-run`
- **DB push:** `npx supabase db push`

## 🧪 Testing & Database
**Test:** Vitest (`renderWithAdminContext`). Mock Supabase (`setup.ts`). E2E: Manual via Claude Chrome. Seed: `npm run seed:e2e:dashboard-v3`.
**DB:** Postgres 17, RLS (100%), Soft deletes (`deleted_at`), Edge functions (digest/overdue).
**Security:** pgTAP for unit testing/security validation.

## ⚠️ Caution & Autonomy Zones

**Protected Zones (NEVER modify without explicit human approval):**
- `supabase/migrations/` — Production schema; requires `supabase db reset` to validate
- `supabase/functions/` — Edge functions deployed to production
- `src/atomic-crm/providers/supabase/composedDataProvider.ts` — Handler routing hub; change affects all resources
- `src/atomic-crm/providers/supabase/authProvider.ts` — Auth flow; mistakes lock out all users
- `.claude/rules/` — Governance rules; changes affect all future agent behavior
- `CLAUDE.md` — Project instructions; changes affect all future sessions

**Autonomy Zones (safe to modify freely):**
- `src/atomic-crm/{contacts,organizations,opportunities,sales,tasks}/` — Feature UI components
- `src/atomic-crm/validation/` — Zod schemas (type-checked, test-covered)
- `src/**/*.test.ts{,x}` — Test files
- `docs/` — Documentation
- `src/components/ui/` — Tier 1 presentational components
- `src/components/ra-wrappers/` — Tier 2 React Admin wrappers

**Do Not Read (auto-generated, too large for context):**
- `src/types/database.generated.ts` — Supabase generated types (5,919 lines). Use type imports only.

## 💼 Business Domain (MFB)
**Model:** Principal (Manufacturer) → Distributor → Operator (Restaurant). Broker: MFB.
**Entities:** Principal (9), Distributor (50+, Auth/Territory), Operator, Opportunity (Deal/Activities).
**Stages:** `new_lead` → `initial_outreach` → `sample_visit_offered` → `feedback_logged` → `demo_scheduled` → `closed_won` | `closed_lost`.

**Key Logic:**
- **MVP:** Principal views, Quick logging (<30s), Excel export, Sample tracking, Tablet/Mobile, Task snooze.
- **Not MVP:** PDF, Volume/Price, Ext. Integrations, Territory mgmt.
- **Activities:** Call, Email, Sample (follow-up req).
- **Win/Loss:** Rel, Quality, Price, Auth, Competitor.
- **Users:** Admin, Manager (All data), Rep (Own data).

**Protocol:** Use `ref` MCP. Ask multiple-choice if context missing.

**Cloud-Only Dev Workflow:** Write migration SQL → dry-run → push → verify in Studio. (See Key Commands above.)

## 🤖 Agent Routing
See `.claude/rules/AGENT_ROUTING.md` (auto-loaded every session).

## Three Pillars Audit
See `docs/audit/THREE_PILLARS_CONTEXT.md` for baseline files, reports, and audit commands.
Last audit: 2026-03-04 | 22 features | 91.7% avg confidence | 8 high-risk | 8 security issues.