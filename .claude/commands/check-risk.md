---
description: "Check the risk level of a module or project before making changes. Returns risk rating, phase assignment, LOC, dependents, test requirements, and integration warnings from the audit baseline."
argument-hint: <project or module name>
allowed-tools: Read, Grep, Glob
---

Look up the risk profile for "$1" from the audit baselines.

**Step 0: Disambiguate**

Search `docs/audit/baseline/risk-assessment.json` for modules matching "$1".
If multiple modules match (e.g., "data" matches composedDataProvider, validation,
dashboard), present a numbered list with risk levels and ask the developer
to choose. Never assume which one they meant.

If exactly one module matches, proceed directly to Step 1.

If zero modules match, search `docs/audit/baseline/feature-inventory.json`
for features matching "$1". If still no match, search project files live (package.json, tsconfig.json).

**Step 1: Load data**

Read these JSON files (summary sections first, drill into records for "$1"):
1. `docs/audit/baseline/risk-assessment.json` - primary risk data
2. `docs/audit/baseline/dependency-map.json` - coupling context
3. `docs/audit/baseline/integration-map.json` - external integration warnings
4. `docs/audit/baseline/feature-inventory.json` - features in this module

If no baselines exist, tell the developer: "No audit baseline found.
Run /audit first to generate risk data."

**Step 2: Present risk profile**

Format the response as a concise reference card:

**Module:** [name]
**Risk Level:** [Low / Medium / High]
**Phase:** [1 / 2 / 3]
**LOC:** [from risk matrix]
**Dependents:** [count and names]
**Dependencies:** [count and names]
**Test Coverage:** [what exists]

**Before You Change This:**
[Pull entry/exit criteria from the phase_boundaries in risk-assessment.json.
Be specific:]
- Run these tests: [test names/commands if known]
- Get review from: [who, based on domain and risk level]
- Validate against: [database, staging environment, etc.]
- Check these feature flags: [if applicable from feature-inventory.json]

**Integration Warnings:**
[If the module touches external systems from integration-map.json, list them
with security notes and guardrail recommendations]

**Related Audit Findings:**
[Any security_observations from integration-map.json that affect this module]
[Any high-priority items from risk-assessment.json regression_priorities]

**Document Coverage:**
[Does this module have: BRD? PRD? ADR? From feature-inventory.json linked_docs]

Keep the response short and action-oriented. The developer is about to make
changes and needs to know what's safe and what's not.
