# CLAUDE.md - Crispy CRM (Atomic CRM)
**Stack:** React 19 + TypeScript + React Admin + Supabase | **Device:** Desktop (1440px+) & iPad
**Goals:** Centralize sales data (kill Excel), <2s Principal answers, 10+ activities/week/principal, 100% adoption (30 days).

## 📊 Output Requirements (Confidence MANDATORY)
**Rule:** Display `[Confidence: XX%]` on **ALL** tasks, plans, and technical assessments. **NEVER OMIT.**
**Factors (+/-):** Code presence, docs, test coverage, known patterns (++) vs assumptions, complexity, missing context (--).

**Scale:**
- **High (85-100%):** Verified via code/docs, proven pattern.
- **Medium (60-84%):** Based on experience, likely correct.
- **Low (30-59%):** Educated guess, needs verification.
- **Speculative (<30%):** Hypothesis only, requires investigation.
- **<70% Items:** Include `To Increase: [verification steps]` field.
- **<50% Protocol:** State what would increase confidence, suggest verification, flag for human review.

**Required Contexts:**
- **Plans:** Task-level confidence + Rationale/Risk/Effort.
- **Debug:** `Root cause: stale cache [60%]`.
- **Arch/Est/Risk:** `Recommend handler [90%]`, `~2 hours [65%]`, `Breaking risk [40%]`.

**<50% Protocol:** State what would increase confidence, suggest verification, flag for human review.
**Plan Summary:** Provide an **Aggregate Confidence Score** at the end of every multi-step plan.

## 🛠 Tooling & Discovery
**Discovery:** `just discover` (full) | `just discover --incremental` | `just mcp-test`
**Intel:** JSON Inventories (metadata) | `search.db` (FTS5+SCIP) | `vectors.lance` (semantic) | LSP (36 wildcard patterns).
**MCP Tools:** `search_code` (hybrid), `go_to_definition`, `find_references`.
**CLI Prefs:** `just` (runner), `rg --type ts` (search), `fd -e tsx` (find), `bat` (read), `gh --json` (git).

## 🏗 Architecture & Structure
**Critical:** All DB access via `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`.
- **Rules:** NO direct Supabase imports. Zod schemas at API boundary (provider), NOT forms.

**Directory Map:**
- `src/atomic-crm/` (Features: contacts, organizations, opportunities)
- `src/atomic-crm/validation/` (Zod schemas)
- `src/components/admin/` (RA wrappers)
- `supabase/migrations/` (SQL) | `supabase/functions/` (Edge/Deno)

**Feature Pattern:** `index.tsx`, `Feature{List,Create,Edit}.tsx`, `FeatureSlideOver.tsx` (40vw).

## 📐 Engineering Principles
**Core:** Fail Fast (no retries). Single Source of Truth (Provider). TS: `interface` (shapes), `type` (unions).
**Forms:** `onSubmit`/`onBlur` (no `onChange`). Use `useWatch()` (isolated), not `watch()`.
**Zod:** `z.coerce` (non-strings), `.max()` (strings), `z.strictObject()` (API), `z.enum()` (allowlists).

**Strict Bans (Deprecated):**
- `Contact.company_id` → Use `contact_organizations` junction.
- `Opportunity.archived_at` → Use `deleted_at`.
- Direct Supabase imports → Use `unifiedDataProvider`.
- Form-level validation → Move to API boundary.

**Accessibility (A11y):** `aria-invalid`, `aria-describedby`, `role="alert"`. Targets ≥44px (`h-11 w-11`).

## 🎨 Design System
**Tailwind v4 Semantic:** ✅ `text-muted-foreground`, `bg-primary` | ❌ `text-gray-500`, `hex/oklch`.
**Components:** List Shell, Slide-Over, Tabbed Forms.
**Filters:** `src/components/admin/column-filters/`. Debounced text (300ms), Checkbox popovers. Use `useListContext`.

## 🧪 Testing & Database
**Test:** Vitest (`renderWithAdminContext`). Mock Supabase (`setup.ts`). E2E: Manual via Claude Chrome. Seed: `just seed-e2e`.
**DB:** Postgres 17, RLS (100%), Soft deletes (`deleted_at`), Edge functions (digest/overdue).
**Security:** pgTAP for unit testing/security validation.

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