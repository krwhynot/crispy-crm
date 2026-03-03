---
description: "Regenerate all Markdown reports from current JSON baselines without re-running the audit. Useful after manually editing a JSON baseline, after creating new PRDs/BRDs/ADRs, or after deep scans update confidence."
allowed-tools: Read, Write, Grep, Glob, Bash
---

Regenerate all Markdown reports from the current JSON baselines.

**Step 1: Verify baselines exist**

Check that these files exist in `docs/audit/baseline/`:
- feature-inventory.json
- dependency-map.json
- documentation-coverage.json
- risk-assessment.json
- integration-map.json
- document-linkage.json (optional, may not exist on first run)
- audit-meta.json (optional)

If none exist: "No audit baselines found. Run /audit first."

If some are missing, note which ones and proceed with what's available.

**Step 2: Deploy report-generator**

Deploy the **report-generator** agent with instruction:
"Read all JSON baselines in docs/audit/baseline/ and regenerate all
Markdown reports in docs/audit/reports/. Include the confidence changelog
and document coverage gap summary. Compare against audit-meta.json for
change tracking if available."

**Step 3: Confirmation**

```
Reports regenerated from current baselines:
  - three-pillars-report.md    [updated]
  - feature-inventory.md       [updated]
  - dependency-map.md          [updated]
  - documentation-coverage.md  [updated]
  - risk-assessment.md         [updated]
  - integration-map.md         [updated]
  - confidence-changelog.md    [updated]

Baseline timestamps:
  - Last audit: [from audit-meta.json]
  - Last PRD created: [from document-linkage.json]
  - Last ADR created: [from document-linkage.json]
```
