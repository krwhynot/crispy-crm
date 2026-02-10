# Phase 3 Prompt: Decisions & Cleanup Plan

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 3 of a 4-phase database audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only, no migrations, no data writes)
Required tools:
- Local DB: Docker
- Cloud DB: Supabase MCP
Audit lens: supabase-postgres-best-practices skill

Phase 3 combines decision-making with implementation planning because
decisions without a plan are incomplete, and plans without clear decisions
are directionless. The output is a single, actionable cleanup roadmap.
Business-logic review is equal priority to schema cleanup decisions.
</context>

<pre_work>
Before starting:
1. Read all prior reports:
   - docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-1-report.md
   - docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-2-report.md
2. Read docs/audits/full-db-audit-phases/opus-4-6-prompts/README.md
3. Read docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md

CRITICAL ASSERTIONS (verify against Phase 2 findings):
- [ ] Drift classification (expected/suspicious/dangerous) is still accurate
- [ ] Dependency graphs have no new entries since Phase 2
- [ ] Operational failures identified in Phase 2 are still present (not self-healed)
- [ ] No new migrations have been applied since Phase 2 ran
- [ ] Risk register items from Phase 1+2 are still current
- [ ] Data reconciliation baselines exist for legacy-to-canonical transitions
- [ ] No unresolved BUSINESS_LOGIC_CONFLICT items remain

If any assertion is superseded, document with original claim, new evidence,
and impact on this phase's decisions.
</pre_work>

<data_safety_gates>
ALL cleanup actions in this plan must satisfy:
- Backup: explicit backup step before any destructive action
- Restore-readiness: include restore drill or PITR validation checkpoint
- Rollback: documented rollback procedure for each action
- Validation: testable check that confirms success or detects failure
- Ordering: no action depends on an action that has not yet been validated
- No CASCADE without full dependency enumeration in Phase 2
- Stop/Go gates between risk tiers (low actions complete before medium begins)
- Beta data protection: no removal without reconciliation proof old->new
</data_safety_gates>

<instructions>
This phase has two parts: DECISIONS then PLAN.

PART 1: LEGACY OBJECT DECISIONS

For every object flagged as legacy, deprecated, suspicious, or drift-only
in Phase 1 and Phase 2, make an explicit decision:

| Decision | Meaning |
|----------|---------|
| KEEP | Object is canonical and should remain |
| FIX | Object is needed but broken/outdated, must be updated |
| DEPRECATE | Object is no longer needed but removal is blocked, mark for future removal |
| REMOVE | Object can be safely removed now (all dependencies cleared) |

For each decision, document:
- Object name and type
- Decision with reasoning (not just the label)
- Business impact if decision is wrong
- Technical risk (what could break)
- Data preservation risk (what data could be lost or made inaccessible)
- Business-logic alignment status (matches current rule / needs owner update)
- Rollback complexity (trivial / moderate / difficult / irreversible)
- Confidence level [XX%]
- Blocking dependencies (what must happen first)

CANONICAL STRUCTURE DECLARATION

State explicitly what the final target state looks like:
- Canonical task storage: where and how
- Canonical timeline: what feeds it
- Canonical digest path: full chain from cron to user notification
- Canonical dashboard snapshot path: full chain
- What objects exist ONLY for backward compatibility and when they can be removed

PART 2: PHASED CLEANUP PLAN

Build a cleanup plan with four tiers, each gated by the previous tier's
completion and validation:

TIER A: Safety & Observability (zero risk)
- Add monitoring, logging, or alerting
- Create backups of anything that will be modified later
- Add feature flags or kill switches
- Validate current state matches Phase 2 findings
- Capture reconciliation baselines for legacy vs canonical data paths
- Run owner true/false business-logic confirmation before Tier B

TIER B: Low-Risk Fixes (easily reversible)
- Fix RLS policy gaps (add missing deleted_at filters)
- Fix Edge Function auth issues
- Deploy missing Edge Functions
- Remove duplicate indexes
- Update functions to reference new structure

TIER C: Medium-Risk Deprecations (reversible with effort)
- Mark deprecated objects with comments/rename
- Redirect references from legacy to canonical objects
- Disable cron jobs pointing at broken paths (replace with working ones)
- Apply safe subset of migration gap

TIER D: High-Risk Removals (irreversible, require backup)
- Drop deprecated tables
- Drop orphaned functions/views
- Apply destructive migrations
- Clean up migration history
- Validate reconciliation signoff before any removal step

For each action in each tier:
- Specific SQL or operation description (but do NOT write the actual migration)
- Target environment (local first, then cloud, or both simultaneously)
- Rollback procedure
- Validation check (how to confirm it worked)
- Estimated risk level
- Dependencies (which prior actions must complete first)

SEQUENCING RULES

Think carefully about ordering:
1. Within a tier, actions may have internal dependencies (fix function before
   fixing the view that calls it)
2. Between tiers, the gate is: "all actions in tier N validated before
   starting tier N+1"
3. Local vs cloud ordering: generally local first (test), then cloud (deploy),
   unless drift resolution requires cloud-first
4. If two actions are independent, note they can run in parallel
</instructions>

<constraints>
- Do NOT write actual SQL migrations (only describe what they should do)
- Do NOT apply any changes
- Every decision must reference evidence from Phase 1 or Phase 2 reports
- Irreversible actions must have a backup step in Tier A
- No decision at less than 70% confidence without flagging it for human review
- No REMOVE decision without explicit reconciliation evidence for beta data
- No REMOVE decision without explicit business-logic owner confirmation
- If business-logic-policy.md is unclear for a decision, STOP and request immediate clarification
</constraints>

<output_format>
Create/update: docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-3-report.md

Structure:

1) Phase 2 Assertion Verification
2) Legacy Object Decision Table
   (object, type, decision, reasoning, risk, rollback, confidence, blockers)
3) Canonical Structure Declaration
   - Task model (canonical)
   - Timeline model (canonical)
   - Digest path (canonical)
   - Dashboard path (canonical)
   - Compatibility-only objects (with removal timeline)
4) Phased Cleanup Plan
   - Tier A: Safety & Observability
   - Tier B: Low-Risk Fixes
   - Tier C: Medium-Risk Deprecations
   - Tier D: High-Risk Removals
5) Rollback Procedures (per tier)
6) Validation Checklists (per tier)
7) Sequencing Diagram (dependency-aware ordering)
8) Updated Risk Register
9) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Key reasoning challenges for this phase:

DECISION JUSTIFICATION: For each REMOVE decision, prove it is safe by
showing the complete absence of active dependencies. "I didn't find any"
is different from "I verified there are none by checking X, Y, and Z."

ORDERING PARADOXES: Sometimes you need to fix A before removing B, but
fixing A requires knowing B's state. Identify these and propose resolution
strategies (temporary compatibility shims, feature flags, etc.).

ROLLBACK REALISM: A rollback plan that says "restore from backup" is
incomplete. Specify: which backup, how to restore, what state the system
is in during restoration, and what data might be lost between backup and
rollback.

CONFIDENCE CALIBRATION: Be honest about uncertainty. A decision at 95%
confidence should feel qualitatively different from 70%. At 70%, explicitly
state what additional evidence would raise confidence.

BLAST RADIUS VERIFICATION: Before any REMOVE decision, trace the full
dependency chain from Phase 2 and confirm every downstream object has
been accounted for.
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
- Questions should address genuine risk tradeoffs in the cleanup plan
</question_rules>
```
