# Phase 5 Prompt: Business Logic Progress Validation (Post Tier C)

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 5 of the Crispy-CRM audit after Tier C completion.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only audit, no migrations, no data writes, no app code)
Required tools:
- Local DB: Docker (inspect local Supabase/Postgres containers and query local DB)
- Cloud DB: Supabase MCP
Audit lens: supabase-postgres-best-practices skill
Business logic source of truth:
- docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md

Current state:
- Tier A/B/C are complete
- Tier D is owner-controlled and executable immediately after approval + safety checks
- Goal now is to verify business logic behavior and progress coverage end-to-end
</context>

<instructions>
Work through these steps in order.

PRE-STEP: Load prior artifacts
- Read:
  - phase-1-report.md
  - phase-2-report.md
  - phase-3-report.md
  - phase-4-report.md
  - business-logic-policy.md
- If prior artifacts conflict, flag BUSINESS_LOGIC_CONFLICT and explain.
- Apply the owner-approved Q1-Q12 confirmation set in business-logic-policy.md.

STEP 1: Build a Business Logic Progress Matrix
For each owner-approved logic rule in business-logic-policy.md, assign:
- Status: VERIFIED / PARTIAL / NOT VERIFIED / CONFLICT
- Evidence: exact source (query/file/line)
- Confidence: [Confidence: XX%]
- Progress note: what is complete vs what still needs validation

STEP 2: Validate Core Workflow Progress (MVP-first)
Validate these real workflows using cloud + local evidence:
- Contact and organization lifecycle
- Opportunity lifecycle (create, stage movement, close outcomes)
- Task lifecycle (open, complete, timeline visibility, principal reporting emphasis)
- Timeline lifecycle (tasks + all owner-related actions)
- Notes lifecycle (contact/opportunity/organization notes on timeline)

For each workflow:
- Expected business behavior
- Observed behavior
- Gap (if any)
- User-facing impact

STEP 3: Validate "Progress" Features and Metrics
Specifically assess anything involving progress tracking:
- tutorial_progress behavior and true business relevance
- pipeline/stage progress representations
- completed-task progress in principal reporting
- dashboard progress indicators still in MVP scope vs deferred scope
- immediate timeline visibility for notes
- task owner enforcement and due-date optionality
- duplicate detection behavior (warn-only vs hard-block)
- deferred MVP behavior for digest/notifications

If an item is out of MVP scope, mark as DEFERRED (not broken).

STEP 4: Drift Impact on Business Logic
Re-check whether local/cloud drift creates business-logic mismatch for users.
- Focus on behavior differences, not only schema counts.
- Flag DANGEROUS drift only if user outcomes differ.

STEP 5: Tier D Execution Readiness Review
Evaluate:
- What risk remains if legacy objects are kept temporarily
- Whether any pending Tier D object can cause wrong business behavior now
- Whether Tier D can proceed now with owner approval + safety checks

STEP 6: Decision Questions (Multiple Choice)
Ask 3 multiple-choice questions that unblock next decisions.
- Recommended option must be A.
- No Other/Skip options.
- Each question must target a real unresolved business decision.
</instructions>

<constraints>
- Do NOT apply migrations
- Do NOT modify database data
- Do NOT write app code
- Do NOT execute Tier D
- Every claim must include [Confidence: XX%] and evidence source
- If something cannot be verified, mark UNKNOWN with next verification step
- Treat business-logic validation as equal priority to technical validation
</constraints>

<output_format>
Create/update file:
docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-5-business-logic-progress-report.md

Structure:
1) Executive Summary
2) Business Logic Progress Matrix
3) Core Workflow Validation Results
4) Progress Feature Assessment
5) Drift-to-Behavior Impact
6) Tier D Execution Readiness Assessment
7) Open Unknowns
8) Multiple-Choice Questions
9) Recommended Next Step

Also append a short "Phase 5 status" section to:
docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-4-report.md
</output_format>

<question_rules>
Ask exactly 3 questions.
Format:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

No Other/Skip options.
</question_rules>
```
