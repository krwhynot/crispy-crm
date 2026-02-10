# Phase 1 Prompt: Discovery & Inventory

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 1 of a 4-phase database audit for a food service CRM
called Crispy-CRM. This is a Supabase-backed React Admin application.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only audit, no migrations, no data writes, no app code)
Required tools:
- Local DB: Docker (inspect local Supabase/Postgres containers and query local DB)
- Cloud DB: Supabase MCP
Audit lens: supabase-postgres-best-practices skill
Business logic source of truth:
- docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md

This audit exists because:
- The codebase recently migrated tasks into an STI model (activities table)
- Legacy objects may still exist in one or both environments
- Local and cloud schemas have diverged significantly
- Edge Functions and cron jobs may be broken or pointing at removed objects
- The owner needs a clear, evidence-based picture before any cleanup
- The product is in beta with real data, so preservation and reconciliation
  evidence are required before any destructive recommendation
- Revisiting FULL business logic is equal priority to database changes in this audit
</context>

<instructions>
Work through these steps in order. For each step, show your reasoning
about what you find and why it matters, not just raw data.

PRE-STEP: Load business-logic-policy.md
- Apply the current owner-approved rules while auditing
- If any finding conflicts policy, flag it as BUSINESS_LOGIC_CONFLICT
- If policy is unclear, STOP and ask for immediate clarification

STEP 1: Environment Access
- Confirm Supabase MCP access to cloud project
- Confirm local database access via Docker (container status + query access)
- Record access method and version for each
- If either environment is inaccessible, document the blocker and continue
  with what is available

STEP 2: Full Object Inventory (both environments)
For local AND cloud, collect:
- Tables (with row counts for all core tables, including 0-row tables)
- Views (noting which are materialized)
- Functions (with signature: name, args, return type)
- Triggers (with target table and timing)
- Indexes (noting any duplicates or unused)
- Foreign keys and constraints
- RLS policies (name, table, command, USING expression summary)
- Scheduled jobs (pg_cron entries)
- Migration count and latest migration name

STEP 3: Side-by-Side Comparison
Build a drift matrix comparing local vs cloud for every object type.
For each difference, classify as:
- EXPECTED (development ahead of production, known divergence)
- SUSPICIOUS (unclear why it differs, needs investigation)
- DANGEROUS (could cause failures if deployed or if environments are swapped)

Think carefully about WHY each difference exists. Do not just list counts.
Hypothesize root causes based on migration history, object names, and
timestamps.

STEP 4: Data Structure Confirmation
Answer these specific questions with evidence:
- Where are tasks stored? (table name, discriminator column, key columns)
- Does tasks_deprecated still exist? In which environment(s)?
- What is entity_timeline? (view or table, source query, which tables feed it)
- What is the role of exec_sql? (who calls it, what permissions does it have,
  and whether there are active code/script references)
- Are there orphaned junction tables with 0 rows?

STEP 5: Edge Function & Cron Reconnaissance
- List all deployed Edge Functions with health status
- Check each cron job: what function does it call, does that function exist,
  does the HTTP call succeed or fail?
- Record latest run/last error evidence where available
- Identify any cron jobs pointing at legacy/removed objects

STEP 6: Risk Identification
Classify every finding as P0 (critical), P1 (high), P2 (medium), P3 (low).
For each risk:
- State the impact in user-facing terms (what breaks for the end user?)
- State the technical mechanism (what exactly fails and why?)
- Suggest severity with reasoning
- Include business-logic impact (what rule/process the business expects that could break)
</instructions>

<constraints>
- Do NOT apply any migrations
- Do NOT modify any database data
- Do NOT write application code
- Do NOT recommend fixes yet (that is Phase 3)
- Every claim must include [Confidence: XX%] and the evidence source
- If you cannot verify something, say so explicitly and add it to Unknowns
- Treat beta data as production-like: highlight any data-loss risk candidates
  even if they are not fixed in this phase
- Do not treat business-logic review as secondary; verify it alongside schema findings
- If logic is unclear or stale, do not infer intent; ask for owner clarification
</constraints>

<output_format>
Create/update file: docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-1-report.md

Structure the report as:

1) Environment Coverage (access status, versions, methods)
2) Object Inventory Tables (local and cloud, side by side where helpful)
3) Drift Matrix (object, local state, cloud state, classification, root cause hypothesis)
4) Data Structure Confirmation (answer each question with evidence)
5) Edge Function & Cron Health (status table + failing path analysis)
6) Risk Register (P0/P1/P2/P3 with impact and mechanism)
7) Unknowns (things you could not verify and what would resolve them)
8) Multiple-Choice Questions

For tables with many rows of data, use markdown tables.
For analytical findings, write prose paragraphs that explain your reasoning.
Do not just list facts without interpretation.
</output_format>

<reasoning_guidance>
You are Opus 4.6. Use your reasoning depth to:
- Look for PATTERNS across findings, not just individual issues
- When you find a count mismatch, investigate WHY before reporting it
- Cross-reference: if a function references a table, verify the table exists
- Think about temporal ordering: which migrations came first, what depends on what
- Consider blast radius: if object X is removed, what chain of failures results
- Flag contradictions: if Phase 1 data conflicts with repo code, call it out
- Validate that current business rules still match database behavior
</reasoning_guidance>

<question_rules>
Ask 2-3 multiple-choice questions at the end.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact statement>
B) <option> - <one-line impact statement>
C) <option> - <one-line impact statement>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
- Each option must describe a concrete action, not a vague direction
- Questions should address genuine ambiguities, not obvious choices
</question_rules>
```
