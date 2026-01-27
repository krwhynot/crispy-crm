# CLAUDE.md - Crispy CRM (Atomic CRM)
**Stack:** React 19 + TypeScript + React Admin + Supabase | **Device:** Desktop (1440px+) & iPad
**Goals:** Centralize sales data (kill Excel), <2s Principal answers, 10+ activities/week/principal, 100% adoption (30 days).

## 📊 Output Requirements (Confidence MANDATORY)
**Rule:** Display `[Confidence: XX%]` on **ALL** tasks, plans, and assessments. **NEVER OMIT.**
**Factors:** Code/docs/tests (++) vs assumptions/missing context (--).
**Scale:** **High (85-100%)** Verified; **Med (60-84%)** Likely; **Low (30-59%)** Guess; **Spec (<30%)** Hypothesis.
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

## 🛠 Tooling & Discovery
**Discovery:** `just discover` (full) | `just discover --incremental` | `just mcp-test`
**Intel:** JSON Inventories (metadata) | `search.db` (FTS5+SCIP) | `vectors.lance` (semantic) | LSP (36 wildcard patterns).
**MCP Tools:** `search_code` (hybrid), `go_to_definition`, `find_references`.
**CLI Prefs:** `just` (runner), `rg --type ts` (search), `fd -e tsx` (find), `bat` (read), `gh --json` (git).

## 🔄 State Management & Discovery

**Rebuild Triggers:** After major refactoring, deleting files, or if search/intelligence seems stale.

| State Source | Purpose | Rebuild Command | Frequency |
|-------------|---------|-----------------|-----------|
| search.db (77MB) | Full-text search | `just discover` | Weekly or after bulk changes |
| index.scip (27MB) | LSP/SCIP code intel | `just discover-scip` | After TS changes |
| vectors.lance (7.6MB) | Semantic search | `just discover` | Weekly |
| *-inventory/*.json | Component metadata | `just discover` | After file creation/deletion |

**Quick Check:** `ls -lh .claude/state/search.db` - if older than 7 days, consider rebuild.
**MCP Tools:** Verify connectivity with `just mcp-test` after server restarts.

**Architecture Note (Best Practice):**
Per official Claude Code guidance, large state databases (search.db, vectors.lance) should ideally be stored OUTSIDE the `.claude/` folder in gitignored project-local directories like `.indexes/` or `.vscode/.search/`. This separates configuration (tracked in `.claude/settings.json`) from state (gitignored elsewhere). Current setup works but doesn't follow recommended pattern. Consider migration in future if state management becomes complex.

**State Drift Prevention:**
- No PostToolUse hooks currently update these sources incrementally
- Manual rebuild required after significant codebase changes
- Watch for stale search results as a signal to rebuild

**Orphan Cleanup:** If deletion hook flags `.prune-needed`:
- Dry run: `./.claude/hooks/prune-stale-inventory.sh ".claude/state/component-inventory" true`
- Execute: `./.claude/hooks/prune-stale-inventory.sh ".claude/state/component-inventory" false`
- Archived to: `.claude/state/archive/YYYYMMDD-HHMMSS/`

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

 The Correct Workflow Should Be:                                                                                                               
  1. Write migration SQL to supabase/migrations/ folder                                                                                         
  2. Run supabase db reset or supabase migration up locally                                                                                     
  3. Test locally to verify behavior                                                                                                            
  4. Only then push to cloud via supabase db push or MCP      