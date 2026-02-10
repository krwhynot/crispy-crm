# Phase 2 Prompt: Deep Analysis (Drift + Dependencies + Operations)

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 2 of a 4-phase database audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only, no migrations, no data writes)
Required tools:
- Local DB: Docker
- Cloud DB: Supabase MCP
Audit lens: supabase-postgres-best-practices skill

Phase 2 combines three analysis tracks into one deep pass:
Track A: Schema drift analysis (local vs cloud differences)
Track B: Dependency mapping (what depends on what)
Track C: Operations health (cron jobs, Edge Functions, runtime paths)

These tracks are combined because drift causes dependency breaks which
cause operational failures. Analyzing them separately misses the causal chains.
Business-logic verification is equal priority to database drift analysis.
</context>

<pre_work>
Before starting analysis:
1. Read docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-1-report.md completely
2. Read docs/audits/full-db-audit-phases/opus-4-6-prompts/README.md
3. Read docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md
4. Verify these critical assertions from Phase 1 (mark Confirmed or Superseded):

CRITICAL ASSERTIONS (must verify against live databases):
- [ ] Tasks are stored in `activities` table using STI (activity_type = 'task')
- [ ] `tasks_deprecated` table has been dropped in cloud
- [ ] `entity_timeline` is a VIEW fed only by the `activities` table
- [ ] Timeline includes owner-connected actions (tasks, notes, opportunity updates, activities)
- [ ] Task owner requirement is enforced; ownerless tasks are blocked
- [ ] Tasks without due date are allowed (due date optional)
- [ ] Duplicate detection is warning-only (non-blocking)
- [ ] Migration parity/drift status between local and cloud is verified (do not assume a gap)
- [ ] `capture-dashboard-snapshots` Edge Function deployment and runtime health are verified
- [ ] `daily-digest` status is verified against business logic scope (deferred for MVP unless owner changes scope)
- [ ] In-app notifications are validated against business logic scope (deferred for MVP unless owner changes scope)
- [ ] RLS soft-delete gap claims are validated; mark N/A where target tables do not have `deleted_at`
- [ ] Cron jobs are verified end-to-end with current scope labels (healthy / failing / deferred)
- [ ] Data preservation risks are identified for any legacy object candidates
- [ ] Business-logic-policy.md is current and owner-reviewed this month

If any assertion is superseded by new evidence, document the change with:
- Original claim (Phase 1, date)
- New evidence (what you found now)
- Impact on downstream analysis
</pre_work>

<data_safety_gates>
Before recommending ANY change that could affect data:
- Confirm backup exists or recommend creating one
- Confirm backup restore path is testable (restore drill or PITR checkpoint)
- Confirm rollback path is documented
- No CASCADE operations without explicit dependency enumeration
- No DROP recommendations without verifying 0 active references
- Require reconciliation evidence for beta data (old vs new structure counts)
</data_safety_gates>

<instructions>
Work through all three tracks, cross-referencing between them.

TRACK A: DRIFT ANALYSIS

For every object type (tables, views, functions, triggers, indexes, RLS, cron):
1. List objects that exist in BOTH environments (match by name)
2. List objects that exist ONLY in local
3. List objects that exist ONLY in cloud
4. For matched objects, compare signatures/definitions where possible

Matching rules:
- Functions: compare by schema + name + argument types (identity), not name only
- Triggers: compare by schema + table + trigger name + timing/event + function

For each drift finding:
- Classify: EXPECTED / SUSPICIOUS / DANGEROUS
- Hypothesize root cause (which migration, when, why)
- Assess deployment risk (what happens if local is pushed to cloud as-is?)
- Assess rollback risk (what happens if we need to revert?)
- Assess data preservation risk (what data could be lost, hidden, or orphaned?)
- Assess business-logic risk (what expected workflow/rule may behave differently)

Think about migration drift specifically (if any):
- What migrations or runtime-only changes are out of sync?
- Are they safe to apply to cloud in sequence?
- Are there migrations that conflict or depend on manual steps?
- Is there a "point of no return" migration in the sequence?

TRACK B: DEPENDENCY MAPPING

For each of these categories, build a dependency graph:
1. Legacy objects (tasks_deprecated, any *_deprecated, any *_old)
2. STI migration artifacts (functions/views that reference both old and new structure)
3. exec_sql and any dynamic SQL functions
4. Digest system (functions, cron, Edge Functions, views)
5. Entity timeline chain (view, source tables, dependent queries)
6. Dashboard snapshot chain (cron, function, Edge Function, table)

For each object in the graph:
- Upstream: what does it depend on?
- Downstream: what depends on it?
- Code references: grep app code, scripts, edge functions, tests, and migrations
- If removed, what is the blast radius? (list every object that breaks)
- Replacement target: what should replace it in the new structure?

TRACK C: OPERATIONS HEALTH

For each scheduled job and Edge Function:
1. Current status (running/failing/not deployed)
2. Execution path: cron -> SQL function -> Edge Function -> target
3. Where in the path does it break? (be specific: HTTP 401 vs 404 vs timeout)
4. Is the job pointing at legacy objects or current structure?
5. Is the failure silent? (fire-and-forget via pg_net = silent failure)

Build a "runtime path diagram" showing:
- Happy path (what should happen)
- Actual path (what actually happens today)
- Where the break occurs and why

CROSS-REFERENCE ANALYSIS

After completing all three tracks, synthesize:
- Which drift items CAUSE operational failures?
- Which dependencies are blocking safe drift resolution?
- What is the correct ORDER of fixes? (dependency-aware sequencing)
- Are there circular dependencies that require a coordinated migration?
- Which findings are blockers for safe beta-data cleanup?
- Which findings contradict expected business logic and require owner confirmation?
</instructions>

<constraints>
- No migrations, no data writes, no code changes
- Every finding needs [Confidence: XX%] and evidence source
- Do not recommend implementations yet (that is Phase 3)
- If you find a new risk not in Phase 1, add it to the risk register
  with a note: "NEW - discovered in Phase 2"
- If a Phase 1 finding was wrong, mark it SUPERSEDED with explanation
- Keep business-logic validation at parity with technical validation
- If a finding conflicts business-logic-policy.md, label it BUSINESS_LOGIC_CONFLICT and request owner confirmation
</constraints>

<output_format>
Create/update: docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-2-report.md

Structure:

1) Phase 1 Assertion Verification (confirmed/superseded table)
2) Track A: Drift Matrix
   - Object-level drift table (object, local, cloud, classification, root cause)
   - Migration gap analysis (what the 67 migrations contain, safe to apply?)
   - Deployment risk assessment
3) Track B: Dependency Graphs
   - Legacy object dependency table
   - Digest system path diagram
   - Dashboard snapshot path diagram
   - Entity timeline dependency chain
   - Blast radius table (if object X removed, Y and Z break)
4) Track C: Operations Health
   - Job inventory with health status
   - Failing path analysis (where each path breaks and why)
   - Silent failure identification
5) Cross-Reference Synthesis
   - Drift items causing operational failures
   - Dependency-aware fix ordering
   - Circular dependency identification
6) Updated Risk Register (new + carried from Phase 1)
7) Unknowns
8) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
This is the highest-value phase for Opus 4.6 reasoning. Invest heavily in:

CAUSAL CHAINS: Don't just say "X is broken." Trace the full chain:
  Migration M was applied to local but not cloud ->
  Function F was updated in M to reference table T ->
  Cloud still has old Function F referencing dropped table T_old ->
  Cron job J calls Function F -> HTTP 404 -> silent failure

CONTRADICTIONS: If the code says one thing and the database says another,
that is the most important finding. Call it out prominently.

TEMPORAL REASONING: Order matters. Migration 20260210000004 drops tables
that migration 20260210000002 references. Is the ordering safe? What if
migration 3 fails partway through?

BLAST RADIUS: For every removal candidate, think 3 levels deep:
  Level 1: Direct dependents
  Level 2: Dependents of dependents
  Level 3: Application code that queries any of the above

PATTERN RECOGNITION: Look for systemic issues, not just individual bugs.
If multiple RLS policies share the same gap, treat that as a template-level
pattern and explain why it happened.
</reasoning_guidance>

<question_rules>
Ask 2-3 multiple-choice questions.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
- Questions should focus on genuine tradeoffs discovered during analysis
</question_rules>
```
