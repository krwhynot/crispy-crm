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
**Implementation Protocol:** Explain the solution architecture FIRST before writing code. Earn the right to code by proving understanding of: (1) root cause, (2) why this layer/approach, (3) end-to-end data flow. No band-aids—fix problems at the right layer.
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

## 📊 Code Health Monitoring (CI/CD Enforced)

**Automated Check:** `just health-check` runs in CI/CD pipeline. **Fails build** if any file exceeds churn threshold.

**Churn Thresholds (14 days):**
- 0-10 edits: ✅ Normal (stable file)
- 11-15 edits: ⚠️ Watch (monitor one more week)
- 16+ edits: ❌ **CI/CD FAILS** - Architectural review required

**Response Strategy (Boy Scout Rule):**

1. **Watch State** (11-15 edits):
   - Monitor for one more week
   - If trend accelerates, move to Investigate

2. **Investigate State** (16+ edits - triggers CI/CD failure):
   - Run: `just health-check` to see violating files
   - Identify implicit contracts (run `/health-summary` for analysis)
   - Extract to config file (pattern: `organizationFormConfig.ts`)
   - Submit PR that reduces churn

**Pattern: Implicit Contract Extraction**

When a file cluster churns together (3+ files with 8+ co-changes):
1. Identify what changes together (defaults, required fields, validation rules)
2. Create config file in appropriate layer (validation/ or feature/)
3. Update dependent files to reference config
4. Document the contract in config file comments
5. Verify churn drops in next measurement period

**Example:** Organization form cluster (52 edits → <10 edits after config extraction)

**Why CI/CD Enforcement:**
- Prevents "boiling frog" syndrome (gradual degradation)
- Forces architectural review before code quality degrades
- Makes health thresholds non-negotiable (not optional documentation)
- Implements "Boy Scout Rule" automatically

**Manual Check:**
```bash
# View churn report
just health-check

# Or manually:
git log --name-only --since="14 days ago" --pretty=format: -- 'src/**/*.ts' 'src/**/*.tsx' \
  | grep -v '^$' | sort | uniq -c | sort -rn | head -20
```

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

Never spawn a subagent for:
- Reading a single file (use Read tool directly)
- Running a single command (use Bash directly)
- Making a one-line edit (use Edit directly)
- Answering a question from context already available
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