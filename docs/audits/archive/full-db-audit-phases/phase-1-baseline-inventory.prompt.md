# Phase 1 Prompt: Baseline Inventory

Copy/paste into Claude Code:

```text
You are running Phase 1 of a full database audit for this repo:

- Repo root: c:\Users\NewAdmin\Projects\crispy-crm
- Mode: PLAN MODE, read-only audit
- Required tool: Supabase MCP for both local and cloud inspection
- Audit lens: use the supabase-postgres-best-practices skill

Goals:
1) Build baseline inventory for local and cloud databases.
2) Confirm current data structure assumptions (especially task storage model and timeline model).
3) Produce a phase report file.

Do not:
- apply migrations
- modify database data
- write app code

Collect and compare for local + cloud:
- tables
- views
- functions
- triggers
- indexes
- foreign keys
- RLS policies
- scheduled jobs (pg_cron)
- high-level row counts for core tables

Data structure confirmation (required):
- Confirm where tasks are currently stored.
- Confirm role of tasks_deprecated.
- Confirm what entity_timeline is (view/table) and how it is fed.

Output file (create/update):
- docs/audits/full-db-audit-phases/phase-1-report.md

Output structure:
1) Environment coverage (local/cloud access status)
2) Inventory summary tables
3) Data structure confirmation
4) Initial risks discovered
5) Unknowns
6) Multiple-choice questions for me

Question rules:
- Ask 2-3 multiple-choice questions.
- Recommended option must be first and include "(Recommended)".
- No "Other" option.

Question format:
[Q1] <short question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>
```
