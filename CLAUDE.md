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

## 🧪 Testing & Database
**Test:** Vitest (`renderWithAdminContext`). Mock Supabase (`setup.ts`). E2E: Manual via Claude Chrome. Seed: `npm run seed:e2e:dashboard-v3`.
**DB:** Postgres 17, RLS (100%), Soft deletes (`deleted_at`), Edge functions (digest/overdue).
**Security:** pgTAP for unit testing/security validation.

## ⚠️ Caution & Autonomy Zones

**Caution Zones (confirm before modifying):**
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

 The Correct Workflow (Cloud-Only Dev):
  1. Write migration SQL to supabase/migrations/ folder
  2. Dry-run: `npx supabase db push --dry-run` to verify
  3. Push to cloud: `npx supabase db push`
  4. Verify in Supabase Studio or via the app

## 🤖 Agent Routing

<delegation>
Before selecting a subagent, classify the task:
- SQL/migration/RLS/query/index/view/trigger/schema -> db-specialist
- Scaffolding/boilerplate/conversion/generation/CRUD template -> quick-gen
- Architecture decision/tradeoff/blast radius/performance strategy -> architect
- Dead code/simplify/cleanup/reduce complexity (NO behavior change) -> simplifier
- Find/search/explore/trace/where is/how does -> explorer
- None of the above -> implementor (fallback only)

Overlap tiebreakers:
- RLS security AUDIT (read-only analysis) -> architect
- RLS policy CREATION (writing SQL) -> db-specialist
- Bug fix that changes behavior -> implementor (NOT simplifier)
- Scaffold that needs custom logic -> implementor (NOT quick-gen)
- "Explain this code" (no file search needed) -> direct (NO subagent)
</delegation>

<single_writer_rule>
At most ONE write-capable subagent may be active at a time.
Write-capable agents: db-specialist, quick-gen, simplifier, implementor.
Read-only agents: explorer, architect (can run in parallel with a writer).

If a task requires multiple write agents (e.g., DB migration + UI change),
run them SEQUENTIALLY, not in parallel. The first agent must complete and
return its handoff before the next agent starts.

File ownership: Each subagent owns the files it creates/modifies during
its execution. No other subagent may touch those files until the handoff
is returned to the main agent.
</single_writer_rule>

<multi_domain_split>
When a task spans multiple domains (DB + provider + UI + tests),
decompose in this order:

1. db-specialist — migrations, views, RLS policies
2. implementor — provider handlers, validation schemas, service layer
3. implementor — UI components, forms, styling
4. implementor — run verification (tsc, lint, tests)

Each step receives the previous step's handoff as context.
Do NOT parallelize cross-domain write steps.
Read-only agents (explorer, architect) may run in parallel at any point.
</multi_domain_split>

<spawn_caps>
Subagent spawn limits per task:
- Simple task (single file, <50 lines changed): 0 subagents. Work directly.
- Standard task (2-5 files, single domain): max 1 subagent.
- Complex task (5+ files or multi-domain): max 2 subagents sequentially.
- Justify in thinking before spawning >2 subagents for any task.

</spawn_caps>

<verification_protocol>
Before claiming any task is complete, the main agent (not a subagent) must:
1. Run `npx tsc --noEmit` — zero TypeScript errors
2. Run `npm run lint` — zero lint errors
3. Run relevant tests if they exist
4. Verify zero `any` types added: `rg ": any|as any" src/ --type ts | grep -v " \* \| \*/"`
5. Verify zero console statements added in production code

Subagents do NOT run final verification. They return their handoff,
and the main agent runs verification after all subagent work is integrated.
Exception: db-specialist should verify SQL syntax with a dry-run if possible.
</verification_protocol>