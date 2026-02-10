# Phase 4 Prompt: Final Signoff & Decision Pack

Copy/paste into Claude Code (Opus 4.6):

```text
<context>
You are running Phase 4 (final) of a 4-phase database audit for Crispy-CRM.

Repo root: c:\Users\NewAdmin\Projects\crispy-crm
Mode: PLAN MODE (read-only, no migrations, no data writes)
Required tools:
- Local DB: Docker
- Cloud DB: Supabase MCP
Audit lens: supabase-postgres-best-practices skill

Phase 4 is a verification and signoff phase. You are not discovering new
findings. You are validating that the full picture is coherent, complete,
and actionable. Think of this as a code review of the audit itself.
Business-logic signoff is equal priority to database signoff.
</context>

<pre_work>
Read ALL prior reports in order:
1. docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-1-report.md
2. docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-2-report.md
3. docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-3-report.md
4. docs/audits/full-db-audit-phases/opus-4-6-prompts/business-logic-policy.md

CRITICAL ASSERTIONS (verify ALL of these):
- [ ] Phase 1 environment access is still working
- [ ] Phase 2 drift classifications have not changed
- [ ] Phase 2 dependency graphs are complete (no orphaned references)
- [ ] Phase 3 decisions are internally consistent (no KEEP that contradicts REMOVE)
- [ ] Phase 3 cleanup plan ordering respects dependency graph
- [ ] Phase 3 rollback procedures are complete (not just "restore backup")
- [ ] No new migrations applied since Phase 3
- [ ] Risk register is cumulative (no items dropped between phases)
- [ ] All SUPERSEDED findings are documented with reasoning
- [ ] Data reconciliation evidence exists for any Tier D removal candidate
- [ ] Full business-logic review is completed and owner-confirmed this month
- [ ] business-logic-policy.md is up to date with latest owner answers and timestamped this month
- [ ] Approved owner Q1-Q12 confirmation set is fully reflected in findings and final queue

Mark each Confirmed or Failed. If any fail, document the gap.
</pre_work>

<data_safety_gates>
Final verification that all safety gates from Phase 3 are present:
- Every Tier D action has a backup step in Tier A
- Every action has a rollback procedure
- Every action has a validation check
- Stop/Go gates exist between tiers
- No CASCADE without enumerated dependencies
- Restore readiness is tested or explicitly staged before Tier D
</data_safety_gates>

<instructions>
This phase has four verification tasks:

TASK 1: AUDIT INTEGRITY CHECK

Review the full audit chain for:
- CONSISTENCY: Do Phase 1 findings, Phase 2 analysis, and Phase 3 decisions
  tell a coherent story? Flag any contradictions.
- COMPLETENESS: Is there any object, risk, or dependency that was discovered
  but never resolved or decided upon? Check every Unknown from each phase.
- TRACEABILITY: Can every Phase 3 decision be traced back to specific
  Phase 1/2 findings? Flag any decision without evidence.
- SUPERSESSION CHAIN: Are all superseded findings properly documented?
  Did any supersession create downstream inconsistencies?

TASK 2: FINAL DATA STRUCTURE STATEMENT

Write the definitive statement of:
- What is the canonical data model right now (not aspirational, actual)
- What the canonical data model will be after cleanup
- What compatibility layers exist and when they expire
- What the migration path is from current to target state

This should be a reference document someone could read in isolation
and understand the full data architecture.

TASK 3: GO/NO-GO ASSESSMENT

Evaluate readiness to begin Tier A of the cleanup plan:

Go Conditions (all must be true):
- All P0 risks have mitigation plans
- Backup procedures are documented and tested
- Rollback procedures are documented for every tier
- Dependency graph is complete (no known gaps)
- All decisions are at >= 70% confidence
- Tier D candidates have explicit data reconciliation signoff
- Business-logic true/false checklist is completed and signed off this month

No-Go Conditions (any one blocks):
- Any P0 risk without a mitigation plan
- Any REMOVE decision at < 70% confidence
- Any dependency chain with unknown links
- Any Tier D action without a corresponding Tier A backup

Provide: GO, CONDITIONAL GO (with conditions), or NO-GO (with blockers)

TASK 4: PRIORITIZED IMPLEMENTATION QUEUE

Take the Phase 3 cleanup plan and produce a numbered, ordered queue of
every action that needs to happen, in the exact sequence they should
be executed. This is the "hand this to an engineer" artifact.

For each item:
- Sequence number
- Action description (one sentence)
- Tier (A/B/C/D)
- Target environment
- Depends on (sequence numbers)
- Estimated effort (small/medium/large)
- Risk level
</instructions>

<constraints>
- No new exploratory analysis. Only verify listed assertions, synthesize, and package.
- Do NOT apply any changes
- If you discover a gap, document it but do not attempt to fill it.
  Recommend re-running the relevant phase.
- The final report should be self-contained enough that someone who
  has not read Phase 1-3 can understand the recommendations
- Do not issue GO if business-logic signoff is missing or stale
- If policy conflicts remain unresolved, issue NO-GO
</constraints>

<output_format>
Create/update: docs/audits/full-db-audit-phases/opus-4-6-prompts/phase-4-report.md

Structure:

1) Executive Summary (3-5 sentences covering the entire audit)
2) Audit Integrity Check
   - Consistency findings
   - Completeness gaps (if any)
   - Traceability verification
   - Supersession chain review
3) Phase Assertion Verification Table (all phases, confirmed/failed)
4) Final Data Structure Statement
   - Current canonical model
   - Target canonical model (after cleanup)
   - Compatibility layers and expiry
   - Migration path summary
5) Go/No-Go Decision
   - Decision: GO / CONDITIONAL GO / NO-GO
   - Go conditions status
   - No-Go blockers (if any)
   - Required pre-work before starting
6) Prioritized Implementation Queue
   (sequence, action, tier, environment, dependencies, effort, risk)
7) Final Risk Register (cumulative from all phases)
8) Lessons Learned (patterns found that should inform future development)
9) Multiple-Choice Questions
</output_format>

<reasoning_guidance>
Phase 4 reasoning is about COHERENCE and COMPLETENESS, not discovery.

COHERENCE: Read the three reports as a narrative. Does the story make sense?
Phase 1 says X, Phase 2 explains why X matters, Phase 3 decides what to do
about X. If any link in that chain is broken, flag it.

COMPLETENESS: Check that every entity mentioned in Phase 1's inventory
appears somewhere in Phase 2's analysis and Phase 3's decision table.
An object that was inventoried but never analyzed or decided on is a gap.

SECOND-ORDER EFFECTS: Phase 3's cleanup plan changes the system. After
those changes, will anything else break that was not anticipated? Think
about: application code that queries views, frontend components that
expect certain API shapes, integration tests that reference specific tables.

CONFIDENCE AGGREGATION: If Phase 2 says dependency X exists at 80%
confidence, and Phase 3 says "safe to remove because no dependencies"
at 90% confidence, there is a conflict. The combined confidence should
be lower than either individual number.
</reasoning_guidance>

<question_rules>
Ask 2-3 FINAL multiple-choice questions.
These should be strategic decisions that the audit cannot answer alone:

[Q1] <clear question>
A) <option> (Recommended) - <one-line impact>
B) <option> - <one-line impact>
C) <option> - <one-line impact>

Rules:
- Recommended option is always A
- No "Other" or "Skip" options
- Questions should be about implementation timing, resource allocation,
  or strategic tradeoffs, not technical facts
</question_rules>
```
