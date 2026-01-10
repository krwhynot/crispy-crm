# CLAUDE.md - Crispy CRM (Atomic CRM)
**Stack:** React 19 + TypeScript + React Admin + Supabase | **Device:** Desktop (1440px+) & iPad
**Goals:** Centralize sales data (kill Excel), <2s Principal answers, 10+ activities/week/principal, 100% adoption in 30 days.

## 🛠 Tooling & Discovery
**Discovery:** `just discover` (full) | `just discover --incremental` | `just mcp-test`
- **JSON Inventories:** Component/hook/type metadata.
- **Search:** `search.db` (FTS5+SCIP) for definitions/refs; `vectors.lance` for semantic search.
- **MCP Tools:** `search_code` (hybrid), `go_to_definition`, `find_references`.
- **LSP:** `typescript-lsp` enabled. **Wildcards:** 36 patterns pre-approved (see `.claude/docs/lsp-wildcard-setup.md`).

**Preferred CLI (Use these over defaults):**
- **Task Runner:** `just <command>` (see `just --list`)
- **Search:** `rg "pattern" --type ts` | `fd -e tsx "name"`
- **Read:** `bat --plain --line-range=N:M file`
- **Git:** `gh` CLI with `--json`

## 🏗 Architecture & Structure
**Critical:** All DB access via `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`.
- **NEVER** import Supabase directly in components.
- **Validation:** Zod schemas at API boundary (in provider), NOT in forms.

**Directory Map:**
- `src/atomic-crm/` (Features: contacts, organizations, opportunities)
- `src/atomic-crm/validation/` (Zod schemas)
- `src/components/admin/` (RA wrappers)
- `supabase/migrations/` (SQL) | `supabase/functions/` (Edge/Deno)

**Feature Pattern:** `index.tsx` (Entry), `FeatureList.tsx`, `FeatureCreate.tsx`, `FeatureEdit.tsx`, `FeatureSlideOver.tsx` (40vw).

## 📐 Engineering Principles
**Philosophy:** Fail Fast (no retries/fallbacks). Single Source of Truth (Provider).
**TypeScript:** `interface` for shapes, `type` for unions/intersections.
**Forms:** `onSubmit`/`onBlur` mode (never `onChange`). Use `useWatch()` (isolated), not `watch()`.

**Zod Rules:**
- `z.coerce` for non-strings.
- Strings must have `.max()`.
- `z.strictObject()` at API boundary.
- `z.enum()` allowlists (no denylists).

**deprecated_patterns** (Strict Ban):
- `Contact.company_id` → Use `contact_organizations` junction.
- `Opportunity.archived_at` → Use `deleted_at`.
- Direct Supabase imports → Use `unifiedDataProvider`.
- Form-level validation → Move to API boundary.

**Accessibility (A11y):**
- `aria-invalid={!!error}`, `aria-describedby={errorId}`.
- `role="alert"` for errors. Touch targets ≥44px (`h-11 w-11`).

## 🎨 Design System
**Tailwind v4 Semantic Only:**
- ✅ `text-muted-foreground`, `bg-primary`, `text-destructive`.
- ❌ `text-gray-500`, `bg-green-600`, `hex/oklch`.

**Components:**
- **Layouts:** List Shell, Slide-Over (40vw), Tabbed Create Forms.
- **Column Filters:** `src/components/admin/column-filters/`. Debounced text (300ms), Checkbox popovers. Use `useListContext`.

## 🧪 Testing & Database
- **Unit:** Vitest (`renderWithAdminContext` from `src/tests/utils/render-admin.tsx`). Mock Supabase via `src/tests/setup.ts`.
- **E2E:** Manual via Claude Chrome (`docs/tests/e2e/`). Seed: `just seed-e2e`.
- **DB:** Postgres 17, RLS enabled (100%), Soft deletes (`deleted_at`), Edge functions (digest/overdue).
- **DB Test:** pgTAP for unit testing/security validation.

## 💼 Business Domain (MFB)
**Role:** Broker between Principal (Manufacturer) → Distributor → Operator (Restaurant).
**Entities:**
- **Principal:** Manufacturer (9 total).
- **Distributor:** Buys from Principal, sells to Operator (50+). Has `Authorizations` & `Territory`.
- **Operator:** End customer.
- **Opportunity:** Deal per principal. Has Activities, Samples.

**Pipeline Stages (7):** `new_lead` → `initial_outreach` → `sample_visit_offered` → `feedback_logged` → `demo_scheduled` → `closed_won` | `closed_lost`.

**Key Logic:**
- **MVP Musts:** Principal views, Quick logging (<30s), Excel export, Sample tracking, Tablet/Mobile, Task snooze/digest.
- **Not MVP:** PDF export, Volume/Price, Ext. Integrations, Territory mgmt.
- **Activities:** Calls, Emails, Samples (require follow-up).
- **Win/Loss:** Relationship, Quality vs Price, Auth, Competitor.
- **Users:** Admin, Manager (All data), Rep (Own data).

**Protocol:** Use `ref` MCP tool for industry standards. Ask multiple-choice questions if context is missing.