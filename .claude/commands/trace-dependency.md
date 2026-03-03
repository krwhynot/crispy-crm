---
description: "Trace a module or npm package through the dependency graph. Shows upstream and downstream impact, risk levels of affected projects, CVE warnings, and a change checklist based on risk level."
argument-hint: <project name or package name>
allowed-tools: Read, Grep, Glob
---

Trace "$1" through the dependency graph from the audit baselines.

**Step 0: Disambiguate**

Search `docs/audit/baseline/dependency-map.json` for projects and packages
matching "$1". If multiple items match (e.g., "date" matches date-fns,
react-day-picker, date utility files), present a numbered list and ask the
developer to choose. Never assume which one they meant.

If exactly one item matches, proceed directly to Step 1.

**Step 1: Load data**

Read these JSON files:
1. `docs/audit/baseline/dependency-map.json` - primary dependency data
2. `docs/audit/baseline/risk-assessment.json` - risk levels of affected projects
3. `docs/audit/baseline/feature-inventory.json` - features in affected projects

If no baselines exist, tell the developer: "No audit baseline found.
Run /audit first to generate dependency data."

**Step 2: Determine if target is a module or npm package**

Search dependency-map.json:
- Check `projects[].name` for a project match
- Check `modules[].npm_dependencies[].name` for a package match
- If both match, present both

**Step 3: Present trace results**

For a PROJECT:

**Target:** [project name]
**Risk Level:** [from risk-assessment.json]
**Phase:** [from risk-assessment.json phase_boundaries]

**Depends On (upstream):**
[List projects this one references, with their risk levels]

**Depended On By (downstream):**
[List projects that reference this one, with their risk levels]

**Impact Radius:**
[Total count: "If you change this, N projects are affected"]

**Features in This Module:**
[List features from feature-inventory.json in this namespace, with confidence]

**Change Checklist:**
[Based on phase assignment from risk-assessment.json:]
- Which tests to run
- Which projects to rebuild
- Whether senior review is required
- Entry/exit criteria from phase_boundaries

For an NPM PACKAGE:

**Package:** [name] [version]
**CVE Status:** [if any security_observations reference this package]

**Used By:**
[List all projects that reference this package, with their risk levels]

**Impact Radius:**
[Total projects affected by an upgrade]

**Upgrade Checklist:**
- Projects to rebuild after upgrade
- Risk level of each affected project
- Phase assignment for the highest-risk affected project
- Whether this package has known CVEs (from integration-map security_observations)

If the target is not found in the baseline, search project files directly
(package.json, tsconfig.json) with Grep to trace it live. Note that results are from live scan, not baseline.

Keep responses concise and actionable.
