# Three Pillars Audit Context

This project uses the Three Pillars Developer Toolkit for codebase analysis,
documentation generation, and change planning. Audit baselines are updated
incrementally on each run and should be consulted before making changes.

### Baseline Files (machine-readable, used by agents)
- `docs/audit/baseline/feature-inventory.json` - Feature catalog with confidence scores
- `docs/audit/baseline/dependency-map.json` - Project dependency graph and package catalog
- `docs/audit/baseline/documentation-coverage.json` - Documentation quality ratings
- `docs/audit/baseline/risk-assessment.json` - Module risk scores and phase boundaries
- `docs/audit/baseline/integration-map.json` - External integrations and security findings
- `docs/audit/baseline/document-linkage.json` - BRD/PRD/ADR relationships and gap flags
- `docs/audit/baseline/audit-meta.json` - Audit run history and confidence deltas

### Reports (human-readable, generated from baselines)
- `docs/audit/reports/three-pillars-report.md` - Executive summary and all findings
- `docs/audit/reports/confidence-changelog.md` - Changes since last audit run

### Before Modifying Code
Run these commands to understand impact before making changes:
- `/find-feature <keyword>` - Locate features and understand implementation
- `/analyze risk <module>` - Risk level, phase assignment, and change checklist
- `/analyze trace <name>` - Impact radius for projects or packages

### Last Audit
- **Date:** 2026-03-04
- **Features:** 22
- **Avg Confidence:** 91.7%
- **High Risk Modules:** 8
- **Security Issues:** 8
