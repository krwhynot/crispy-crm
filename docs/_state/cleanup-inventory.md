# Documentation Cleanup Inventory

> **Generated:** 2025-12-26
> **Total Files:** 118
> **Categories:** Keep (45) | Consolidate (3) | Archive (67) | Delete (3)

## Category Legend

| Category | Description |
|----------|-------------|
| **keep** | Active, referenced in CLAUDE.md, or needed for development |
| **consolidate** | Similar content exists elsewhere; merge then archive |
| **archive** | Completed audits, old plans, research notes - preserve for reference |
| **delete** | Obsolete, duplicated, or empty files |

---

## Inventory by Directory

### _state/ (Auto-Generated - DO NOT MOVE)

> **Note:** These files are CI-enforced and referenced in CLAUDE.md. Leave in place.

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `_state/business-logic-discovery.json` | 22K | keep | _(no change)_ |
| `_state/data-provider-discovery.json` | 34K | keep | _(no change)_ |
| `_state/forms-inventory.json` | 30K | keep | _(no change)_ |
| `_state/hooks-inventory.json` | 87K | keep | _(no change)_ |
| `_state/schema-discovery.json` | 61K | keep | _(no change)_ |
| `_state/spec-review.json` | 12K | keep | _(no change)_ |
| `_state/test-discovery.json` | 93K | keep | _(no change)_ |
| `_state/component-inventory/*.json` | 26 files | keep | _(no change)_ |
| `_state/schemas-inventory/*.json` | 18 files | keep | _(no change)_ |
| `_state/types-inventory/*.json` | 10 files | keep | _(no change)_ |
| `_state/validation-services-inventory/*.json` | 17 files | keep | _(no change)_ |

### api/ (API Documentation)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `api/data-provider.md` | 24K | keep | `architecture/data-provider.md` |
| `api/integration-patterns.md` | 22K | keep | `architecture/integration-patterns.md` |
| `api/resource-matrix.md` | 21K | keep | `architecture/resource-matrix.md` |
| `api/validation-layer.md` | 28K | keep | `architecture/validation-layer.md` |

### architecture/ (Already Exists)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `architecture/data-model.md` | 49K | keep | _(no change)_ |
| `architecture/rls-policies.md` | 26K | keep | _(no change)_ |

### audits/ (Point-in-Time Snapshots)

> **Note:** Completed Dec 2025. Contains 156 code quality findings, 93 UI/UX findings. Archive for reference.

#### audits/code-quality/FINAL-DELIVERABLES/

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `audits/code-quality/FINAL-DELIVERABLES/01-PRIORITIZED-FIX-LIST.md` | 25K | archive | `archive/audits/code-quality/01-PRIORITIZED-FIX-LIST.md` |
| `audits/code-quality/FINAL-DELIVERABLES/02-PATTERN-DOCUMENTATION.md` | 24K | archive | `archive/audits/code-quality/02-PATTERN-DOCUMENTATION.md` |
| `audits/code-quality/FINAL-DELIVERABLES/03-RISK-ASSESSMENT.md` | 19K | archive | `archive/audits/code-quality/03-RISK-ASSESSMENT.md` |
| `audits/code-quality/FINAL-DELIVERABLES/04-COMPLIANCE-SCORECARD.md` | 12K | archive | `archive/audits/code-quality/04-COMPLIANCE-SCORECARD.md` |
| `audits/code-quality/FINAL-DELIVERABLES/05-DEAD-CODE-REPORT.md` | 11K | archive | `archive/audits/code-quality/05-DEAD-CODE-REPORT.md` |

#### audits/code-quality/tier-1/

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `audits/code-quality/tier-1/01-data-provider-audit.md` | 11K | archive | `archive/audits/code-quality/tier-1/01-data-provider-audit.md` |
| `audits/code-quality/tier-1/02-zod-schemas-audit.md` | 13K | archive | `archive/audits/code-quality/tier-1/02-zod-schemas-audit.md` |
| `audits/code-quality/tier-1/03-resource-patterns-audit.md` | 14K | archive | `archive/audits/code-quality/tier-1/03-resource-patterns-audit.md` |
| `audits/code-quality/tier-1/04-supabase-integration-audit.md` | 13K | archive | `archive/audits/code-quality/tier-1/04-supabase-integration-audit.md` |
| `audits/code-quality/tier-1/05-boundary-types-audit.md` | 13K | archive | `archive/audits/code-quality/tier-1/05-boundary-types-audit.md` |
| `audits/code-quality/tier-1/06-react-rendering-audit.md` | 9.5K | archive | `archive/audits/code-quality/tier-1/06-react-rendering-audit.md` |
| `audits/code-quality/tier-1/07-query-efficiency-audit.md` | 9.9K | archive | `archive/audits/code-quality/tier-1/07-query-efficiency-audit.md` |
| `audits/code-quality/tier-1/08-bundle-analysis-audit.md` | 9.9K | archive | `archive/audits/code-quality/tier-1/08-bundle-analysis-audit.md` |
| `audits/code-quality/tier-1/09-state-context-audit.md` | 11K | archive | `archive/audits/code-quality/tier-1/09-state-context-audit.md` |
| `audits/code-quality/tier-1/10-module-structure-audit.md` | 12K | archive | `archive/audits/code-quality/tier-1/10-module-structure-audit.md` |
| `audits/code-quality/tier-1/11-constitution-core-audit.md` | 15K | archive | `archive/audits/code-quality/tier-1/11-constitution-core-audit.md` |
| `audits/code-quality/tier-1/12-constitution-conventions-audit.md` | 14K | archive | `archive/audits/code-quality/tier-1/12-constitution-conventions-audit.md` |
| `audits/code-quality/tier-1/13-error-handling-audit.md` | 12K | archive | `archive/audits/code-quality/tier-1/13-error-handling-audit.md` |
| `audits/code-quality/tier-1/14-import-graph-audit.md` | 12K | archive | `archive/audits/code-quality/tier-1/14-import-graph-audit.md` |
| `audits/code-quality/tier-1/15-composition-audit.md` | 13K | archive | `archive/audits/code-quality/tier-1/15-composition-audit.md` |

#### audits/code-quality/tier-2/

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `audits/code-quality/tier-2/16-typescript-strictness-audit.md` | 15K | archive | `archive/audits/code-quality/tier-2/16-typescript-strictness-audit.md` |
| `audits/code-quality/tier-2/17-pattern-drift-audit.md` | 16K | archive | `archive/audits/code-quality/tier-2/17-pattern-drift-audit.md` |
| `audits/code-quality/tier-2/18-dead-exports-audit.md` | 7.4K | archive | `archive/audits/code-quality/tier-2/18-dead-exports-audit.md` |
| `audits/code-quality/tier-2/19-dead-dependencies-audit.md` | 8.7K | archive | `archive/audits/code-quality/tier-2/19-dead-dependencies-audit.md` |

#### audits/code-quality/tier-3/

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `audits/code-quality/tier-3/20-false-negatives-audit.md` | 10K | archive | `archive/audits/code-quality/tier-3/20-false-negatives-audit.md` |
| `audits/code-quality/tier-3/20a-1-agents-1-7.md` | 14K | archive | `archive/audits/code-quality/tier-3/20a-1-agents-1-7.md` |
| `audits/code-quality/tier-3/20a-2-agents-8-15.md` | 17K | archive | `archive/audits/code-quality/tier-3/20a-2-agents-8-15.md` |
| `audits/code-quality/tier-3/20b-1-tier2-verification.md` | 12K | archive | `archive/audits/code-quality/tier-3/20b-1-tier2-verification.md` |
| `audits/code-quality/tier-3/20b-2-synthesis.md` | 15K | archive | `archive/audits/code-quality/tier-3/20b-2-synthesis.md` |
| `audits/code-quality/tier-3/21-edge-cases-forms-audit.md` | 15K | archive | `archive/audits/code-quality/tier-3/21-edge-cases-forms-audit.md` |
| `audits/code-quality/tier-3/22-edge-cases-data-audit.md` | 21K | archive | `archive/audits/code-quality/tier-3/22-edge-cases-data-audit.md` |
| `audits/code-quality/tier-3/23-edge-cases-async-audit.md` | 15K | archive | `archive/audits/code-quality/tier-3/23-edge-cases-async-audit.md` |
| `audits/code-quality/tier-3/24-devils-advocate-audit.md` | 18K | archive | `archive/audits/code-quality/tier-3/24-devils-advocate-audit.md` |
| `audits/code-quality/tier-3/25a-master-findings.md` | 22K | archive | `archive/audits/code-quality/tier-3/25a-master-findings.md` |

#### audits/ (Root Level)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `audits/color-contrast-report.json` | 3.3K | archive | `archive/audits/color-contrast-report.json` |
| `audits/import-health-audit-report.md` | 13K | archive | `archive/audits/import-health-audit-report.md` |
| `audits/org-forms-investigation.md` | 7.0K | archive | `archive/audits/org-forms-investigation.md` |
| `audits/organizations-architecture-audit.md` | 17K | archive | `archive/audits/organizations-architecture-audit.md` |
| `audits/orgs-database-layer.md` | 15K | archive | `archive/audits/orgs-database-layer.md` |
| `audits/orgs-relationships.md` | 15K | archive | `archive/audits/orgs-relationships.md` |
| `audits/orgs-ui-consistency.md` | 12K | archive | `archive/audits/orgs-ui-consistency.md` |

### discovery-notes/ (Research Artifacts)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `discovery-notes/audit` | 17K | delete | _(appears to be incomplete file)_ |

### domain/ (Business Domain Docs)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `domain/business-workflows.md` | 15K | keep | `features/business-workflows.md` |
| `domain/dashboard-reference.md` | 17K | keep | `features/dashboard-reference.md` |
| `domain/pipeline-lifecycle.md` | 12K | keep | `features/pipeline-lifecycle.md` |

### plans/ (Implementation Plans)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `plans/2025-12-20-kanban-density-principal-view.md` | 23K | archive | `archive/plans/2025-12-20-kanban-density-principal-view.md` |

### testing/ (Test Documentation)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `testing/MANUAL-TEST-hierarchy-branches.md` | 17K | keep | `guides/testing/MANUAL-TEST-hierarchy-branches.md` |
| `testing/coverage-analysis.md` | 5.2K | keep | `guides/testing/coverage-analysis.md` |
| `testing/e2e-contact-forms-workflow.md` | 25K | consolidate | `guides/testing/e2e-workflows.md` (merge all e2e-*-workflow.md) |
| `testing/e2e-dashboard-forms-workflow.md` | 25K | consolidate | _(merge into e2e-workflows.md)_ |
| `testing/e2e-opportunity-creation-workflow.md` | 20K | consolidate | _(merge into e2e-workflows.md)_ |
| `testing/e2e-organization-forms-workflow.md` | 24K | consolidate | _(merge into e2e-workflows.md)_ |
| `testing/e2e-products-forms-workflow.md` | 33K | consolidate | _(merge into e2e-workflows.md)_ |
| `testing/e2e-task-forms-workflow.md` | 27K | consolidate | _(merge into e2e-workflows.md)_ |
| `testing/pattern-catalog.md` | 52K | keep | `guides/testing/pattern-catalog.md` |
| `testing/test-architecture.md` | 6.7K | keep | `guides/testing/test-architecture.md` |
| `testing/test-authoring-guide.md` | 15K | keep | `guides/testing/test-authoring-guide.md` |

### tests/e2e/ (E2E Test Checklists)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `tests/e2e/README.md` | 3.9K | keep | _(no change)_ |
| `tests/e2e/SETUP.md` | 5.4K | keep | _(no change)_ |
| `tests/e2e/01-smoke-tests.md` | 3.9K | keep | _(no change)_ |
| `tests/e2e/03-dashboard-tests.md` | 28K | keep | _(no change)_ |
| `tests/e2e/04-form-tests.md` | 13K | keep | _(no change)_ |
| `tests/e2e/05-accessibility-tests.md` | 28K | keep | _(no change)_ |
| `tests/e2e/06-auth-foundation.md` | 31K | keep | _(no change)_ |
| `tests/e2e/07-team-management.md` | 46K | keep | _(no change)_ |
| `tests/e2e/08-rbac-crud-operations.md` | 36K | keep | _(no change)_ |
| `tests/e2e/09-ui-role-visibility.md` | 22K | keep | _(no change)_ |
| `tests/e2e/10-edge-cases.md` | 29K | keep | _(no change)_ |
| `tests/e2e/11-performance-ux.md` | 25K | keep | _(no change)_ |

### ui-ux/ (UI/UX Documentation)

#### ui-ux/audits/

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `ui-ux/audits/FINAL-AUDIT-REPORT.md` | 30K | archive | `archive/audits/ui-ux/FINAL-AUDIT-REPORT.md` |
| `ui-ux/audits/base-ui-audit.md` | 16K | archive | `archive/audits/ui-ux/base-ui-audit.md` |
| `ui-ux/audits/composition-audit.md` | 19K | archive | `archive/audits/ui-ux/composition-audit.md` |
| `ui-ux/audits/conditional-rendering-audit.md` | 20K | archive | `archive/audits/ui-ux/conditional-rendering-audit.md` |
| `ui-ux/audits/dashboard-audit.md` | 13K | archive | `archive/audits/ui-ux/dashboard-audit.md` |
| `ui-ux/audits/dynamic-styles-audit.md` | 14K | archive | `archive/audits/ui-ux/dynamic-styles-audit.md` |
| `ui-ux/audits/edge-cases-audit.md` | 17K | archive | `archive/audits/ui-ux/edge-cases-audit.md` |
| `ui-ux/audits/false-negatives-audit.md` | 13K | archive | `archive/audits/ui-ux/false-negatives-audit.md` |
| `ui-ux/audits/forms-audit.md` | 14K | archive | `archive/audits/ui-ux/forms-audit.md` |
| `ui-ux/audits/interactive-elements-adversarial-audit.md` | 8.7K | archive | `archive/audits/ui-ux/interactive-elements-adversarial-audit.md` |
| `ui-ux/audits/lists-tables-audit.md` | 24K | archive | `archive/audits/ui-ux/lists-tables-audit.md` |
| `ui-ux/audits/modals-slideovers-audit.md` | 19K | archive | `archive/audits/ui-ux/modals-slideovers-audit.md` |
| `ui-ux/audits/navigation-audit.md` | 21K | archive | `archive/audits/ui-ux/navigation-audit.md` |
| `ui-ux/audits/third-party-audit.md` | 17K | archive | `archive/audits/ui-ux/third-party-audit.md` |
| `ui-ux/audits/ui-ux-audit-executive-summary.md` | 11K | archive | `archive/audits/ui-ux/ui-ux-audit-executive-summary.md` |

#### ui-ux/ (Root Level)

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `ui-ux/shadcn-mcp-fix-guide.md` | 24K | keep | `guides/shadcn-mcp-fix-guide.md` |

### Root Level Files

| Path | Size | Category | Target Path |
|------|------|----------|-------------|
| `blog-notes-discovery-system.md` | 16K | archive | `archive/research/blog-notes-discovery-system.md` |
| `known-issues.md` | 8.8K | keep | _(no change)_ |
| `spec-updates-2025-12.md` | 14K | keep | _(no change - active pending changes)_ |

---

## Target Directory Structure

```
docs/
├── _state/                    # Auto-generated (unchanged)
├── architecture/              # Technical architecture
│   ├── data-model.md
│   ├── rls-policies.md
│   ├── data-provider.md       # (from api/)
│   ├── integration-patterns.md
│   ├── resource-matrix.md
│   └── validation-layer.md
├── features/                  # Business domain & features
│   ├── business-workflows.md
│   ├── dashboard-reference.md
│   └── pipeline-lifecycle.md
├── guides/                    # How-to guides
│   ├── shadcn-mcp-fix-guide.md
│   └── testing/
│       ├── coverage-analysis.md
│       ├── MANUAL-TEST-hierarchy-branches.md
│       ├── pattern-catalog.md
│       ├── test-architecture.md
│       └── test-authoring-guide.md
├── tests/                     # Test checklists (unchanged)
│   └── e2e/
├── archive/                   # Historical reference
│   ├── audits/
│   │   ├── code-quality/
│   │   │   ├── tier-1/
│   │   │   ├── tier-2/
│   │   │   └── tier-3/
│   │   └── ui-ux/
│   ├── plans/
│   └── research/
├── known-issues.md            # Active issues
└── spec-updates-2025-12.md    # Pending spec changes
```

---

## Summary Statistics

| Category | Count | Total Size |
|----------|-------|------------|
| keep | 45 | ~750K |
| consolidate | 6 | ~154K |
| archive | 64 | ~900K |
| delete | 3 | ~17K |
| **Total** | **118** | **~1.8MB** |

## Next Steps

1. **Create target directories** (architecture, features, guides, archive/*)
2. **Review consolidation candidates** - decide if merging e2e workflow docs is worthwhile
3. **Execute moves** - use `git mv` to preserve history
4. **Update CLAUDE.md** - if any referenced paths change
5. **Update cross-references** - fix any broken links in moved docs
