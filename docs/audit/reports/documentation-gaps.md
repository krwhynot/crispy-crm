# Documentation Gaps Report

**Generated:** 2026-03-03
**Run type:** Incremental (builds on 2026-03-03T12:00:00Z baseline)
**Sources:** `docs/audit/baseline/documentation-coverage.json`, `docs/audit/baseline/document-linkage.json`, `docs/audit/baseline/feature-inventory.json`
[Confidence: 94%]

---

## Summary

| Metric | Value | Delta vs Previous |
|--------|-------|-------------------|
| Total doc files | 64 | +17 |
| Projects with README | 9 | +4 |
| Projects without README | 5 | -4 |
| BRD coverage | 40% (8/20 features) | +19 pp (was 21%, 4/19) |
| PRD coverage | 0% | no change |
| ADR count | 4 | no change |
| Avg documentation quality score | 3.7 / 5 | +0.3 |
| JSDoc coverage | ~15% | no change |
| TODO/FIXME count | 21 | not tracked previously |

---

## Improvements This Run

The following documentation was added since the 2026-03-03T12:00:00Z baseline:

| Type | File | Quality | Notes |
|------|------|---------|-------|
| BRD | `docs/brd/sales.md` | 4/5 | CRM user profiles, 1:1 Supabase Auth mapping, role model, disable vs delete |
| BRD | `docs/brd/activities.md` | 4/5 | STI pattern, 15 interaction types, KPI connection to 10+ activities/week goal |
| BRD | `docs/brd/tasks.md` | 4/5 | STI storage, tasksHandler translation, priority_tasks view, auto-create activity |
| BRD | `docs/brd/products.md` | 4/5 | F&B product catalog, categories, distributor coverage, opportunity linkage |
| README | `src/atomic-crm/reports/README.md` | 5/5 | 983 lines covering architecture, data flows, CSV security, unused code |
| README | `src/components/ui/README.md` | 3/5 | Brief overview of shadcn/ui origin and update instructions |
| README | `src/atomic-crm/filters/README.md` | 5/5 | All filter types, WCAG 2.1 AA details, troubleshooting guide |
| README | `src/atomic-crm/opportunities/__tests__/README.md` | 3/5 | Test file naming conventions and mock path conventions |
| Storybook | `src/components/ui/` | — | 24 stories added, serving as living documentation |
| Template | `docs/adr/TEMPLATE.md` | 3/5 | ADR authoring template |

---

## BRD Coverage by Feature

| Feature ID | Domain | BRD | PRD | ADR | Risk Level | Priority |
|------------|--------|-----|-----|-----|------------|----------|
| feat-cnt-001 | Contacts | `docs/brd/contacts.md` | — | — | High | — |
| feat-org-001 | Organizations | `docs/brd/organizations.md` | — | — | High | — |
| feat-opp-001 | Opportunities | `docs/brd/opportunities.md` | — | — | High | — |
| feat-sal-001 | Sales | `docs/brd/sales.md` | — | — | High | — |
| feat-tsk-001 | Tasks | `docs/brd/tasks.md` | — | — | Medium | — |
| feat-act-001 | Activities | `docs/brd/activities.md` | — | — | Medium | — |
| feat-prd-001 | Products | `docs/brd/products.md` | — | — | Medium | — |
| feat-dsh-001 | Dashboard | `docs/brd/dashboard.md` | — | — | High | — |
| feat-not-001 | Notes | MISSING | — | — | Medium | ⚠️ P2 |
| feat-pdi-001 | ProductDistributors | MISSING | — | — | Medium | ⚠️ P1 |
| feat-rpt-001 | Reports | MISSING | — | — | High | ⚠️ P1 |
| feat-set-001 | Settings | MISSING | — | — | Low | P3 |
| feat-ntf-001 | Notifications | MISSING | — | — | Medium | ⚠️ P1 |
| feat-tag-001 | Tags | MISSING | — | — | Low | P3 |
| feat-lgn-001 | Login | MISSING | — | — | Low | P3 |
| feat-seg-001 | Segments | MISSING | — | — | Low | P3 |
| feat-tml-001 | Timeline | MISSING | — | — | Medium | P2 |
| feat-flt-001 | Filters | MISSING | — | — | Medium | P2 |
| feat-adm-001 | Admin | MISSING | — | — | Medium | P2 |
| feat-pgs-001 | Onboarding (WhatsNew) | MISSING | — | — | Low | P3 |

**BRD coverage: 8/20 (40%). PRD coverage: 0/20 (0%).**

Priority key: P1 = immediate (high-risk or cross-cutting), P2 = short-term, P3 = medium-term.

---

## Modules Missing READMEs

| Module | Path | Has README | Quality | Gap Description |
|--------|------|-----------|---------|-----------------|
| root | / | No | 5 | CLAUDE.md serves AI sessions. No human onboarding README. |
| contacts | `src/atomic-crm/contacts/` | No | 3 | BRD exists. No JSDoc on public APIs. No README. |
| organizations | `src/atomic-crm/organizations/` | No | 3 | BRD exists. Hierarchy and authorization components undocumented. |
| opportunities | `src/atomic-crm/opportunities/` | No | 3 | BRD exists. Test convention README added. Kanban/close workflows have no JSDoc. |
| dashboard | `src/atomic-crm/dashboard/` | No | 3 | BRD exists. Complex dashboard hooks undocumented. |
| sales | `src/atomic-crm/sales/` | No | 3 | BRD added. No module README or JSDoc. |
| activities | `src/atomic-crm/activities/` | No | 3 | BRD added. No inline JSDoc. |
| tasks | `src/atomic-crm/tasks/` | No | 3 | BRD added. No module README. |
| products | `src/atomic-crm/products/` | No | 3 | BRD added (Draft). No module README or JSDoc. |
| supabase/functions | `supabase/functions/` | No | 2 | 6 edge functions with no documentation. Triggers, env vars, and failure modes undocumented. |
| supabase/migrations | `supabase/migrations/` | No | 3 | No migration index. Uneven comment quality across 14 migration files. |

---

## ADR Coverage

4 ADRs exist. All score 5/5 quality.

| ADR | File | Project Coverage | Quality |
|-----|------|-----------------|---------|
| 001 - Supabase Provider Pattern | `docs/adr/001-supabase-provider-pattern.md` | `src/atomic-crm/providers/supabase` | 5/5 |
| 002 - Soft Delete Convention | `docs/adr/002-soft-delete-convention.md` | `src/atomic-crm/providers/supabase` | 5/5 |
| 003 - Three-Tier UI Architecture | `docs/adr/003-three-tier-ui-architecture.md` | `src/components` | 5/5 |
| 004 - Validation at Provider Boundary | `docs/adr/004-validation-at-provider-boundary.md` | `src/atomic-crm/providers/supabase` | 5/5 |

No ADRs exist for decisions in: state management strategy, query key design, CSV import architecture, or database view strategy. These are all areas with non-obvious implementation patterns that would benefit from documented rationale.

**ADR gaps to consider:**
- State management and stale-time strategy (TanStack Query patterns)
- CSV import bulk-operation approach
- Dashboard dual-version (V3/V4) decision and migration plan
- Edge function scheduling and failure handling
- Self-referential organization hierarchy design

---

## JSDoc Coverage by Module

Overall coverage is approximately 15% of public APIs. No per-module breakdown exists in the current baseline.

Modules with confirmed JSDoc gaps (from `documentation-coverage.json` per_project notes):

| Module | JSDoc Gap |
|--------|-----------|
| contacts | No JSDoc on public APIs |
| organizations | Hierarchy and authorization components undocumented |
| opportunities | Kanban and close workflow components have no JSDoc |
| dashboard | Complex dashboard hooks undocumented |
| providers | Individual handler files have minimal JSDoc |
| ra-wrappers | Custom wrappers lack JSDoc |
| activities | No inline JSDoc |
| products | No JSDoc |
| sales | No JSDoc |

---

## TODO/FIXME Hotspots

21 TODO/FIXME comments found across the codebase. Key items flagged in `documentation-coverage.json`:

| Issue | Description |
|-------|-------------|
| TODO-004a | Win/Loss validation incomplete |
| 5 disabled tests | Awaiting RPC implementation |

> Run `rg "TODO|FIXME" src/ supabase/ --type ts` to get the full list.

---

## Priority Gaps Requiring Immediate Attention

These are sourced from `document-linkage.json` `gaps_priority` and cross-referenced with risk levels:

| Priority | Feature | Domain | Risk | Gap | Rationale |
|----------|---------|--------|------|-----|-----------|
| P1 | feat-rpt-001 | Reports | High | No BRD | High-risk module with complex architecture and no business requirements documented |
| P1 | feat-ntf-001 | Notifications | Medium | No BRD | Cross-cutting; used by daily-digest and check-overdue-tasks edge functions |
| P1 | feat-pdi-001 | ProductDistributors | Medium | No BRD | Junction table with authorization implications; RLS coverage unverified |
| P2 | feat-not-001 | Notes | Medium | No BRD | dompurify XSS boundary undocumented |
| P2 | feat-tml-001 | Timeline | Medium | No BRD | Renders data from activities/notes; cross-entity audit trail |
| P2 | feat-flt-001 | Filters | Medium | No BRD | README exists; BRD business rules undocumented |
| P2 | feat-adm-001 | Admin | Medium | No BRD | React Admin shell routing and layout not documented |

---

## Documentation Quality Scores

| Project | Has README | Quality | Coverage |
|---------|-----------|---------|----------|
| `CLAUDE.md` (root) | — | 5/5 | full |
| `docs/adr/001-004` | — | 5/5 | full |
| `src/atomic-crm/providers/supabase/README.md` | Yes | 5/5 | full |
| `src/components/ra-wrappers/column-filters/README.md` | Yes | 5/5 | full |
| `src/atomic-crm/reports/README.md` | Yes | 5/5 | full |
| `src/atomic-crm/filters/README.md` | Yes | 5/5 | full |
| `eslint-local-rules/README.md` | Yes | 4/5 | full |
| `docs/brd/*.md` (8 files) | — | 4/5 | full |
| `src/components/ra-wrappers/Readme.md` | Yes | 3/5 | partial |
| `src/components/ui/README.md` | Yes | 3/5 | partial |
| `src/atomic-crm/opportunities/__tests__/README.md` | Yes | 3/5 | partial |
| `docs/adr/TEMPLATE.md` | — | 3/5 | full |
| `supabase/functions/` | No | 2/5 | none |
| All other modules | No | 2-3/5 | none-partial |

---

*Source: `docs/audit/baseline/documentation-coverage.json` and `docs/audit/baseline/document-linkage.json`. [Confidence: 94%]*
