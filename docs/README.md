# Crispy CRM Documentation

## Structure

```
docs/
├── architecture/        # System design, component tiers, data consolidation
├── audits/              # Active audit summaries and reports
│   ├── archive/         # Historical snapshots, phase artifacts
│   └── .baseline/       # Audit baselines
├── blog/                # Engineering blog posts
├── component-inventory/ # Component documentation
├── design/              # UI/UX design philosophy and patterns
├── design-system/       # Developer implementation specs
├── development/         # Development guides
├── features/            # Feature specifications (pipeline, dashboard, reports)
├── migrations/          # Migration documentation
├── patterns/            # Code patterns
├── performance/         # Performance documentation
├── testing/             # Test patterns and utilities
├── tests/               # E2E test checklists
│   ├── e2e/             # Manual E2E testing (40+ checklists)
│   └── ui/              # UI-specific tests
├── technical-debt.md    # Tracked debt items (consolidated from audits)
├── decisions.md         # Architecture Decision Records
└── ERD.md               # Entity-Relationship Diagram
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `architecture/COMPONENT_TIERS.md` | Three-tier component hierarchy (shadcn -> RA wrappers -> Features) |
| `architecture/TEST_PATTERNS.md` | Testing patterns and mock utilities |
| `design/INDEX.md` | Design system navigation hub |
| `design/ACCESSIBILITY.md` | WCAG 2.1 AA compliance guide |
| `design-system/touch-targets.md` | 44px minimum touch target standards |
| `ERD.md` | Database schema reference (auto-generated from live Supabase) |
| `decisions.md` | Architecture Decision Records |
| `technical-debt.md` | Tracked technical debt items |

**Engineering Constitution:** Core principles are documented in [`/CLAUDE.md`](../CLAUDE.md) at project root.

## Canonical Docs Map

| Section | Entry Point | Contains |
|---------|-------------|----------|
| Architecture | `architecture/` | Component tiers, data model (`ERD.md`), access model |
| Audits | `audits/INDEX.md` | Active summaries; historical in `archive/` |
| Design | `design/INDEX.md` | UX philosophy, a11y, responsive specs |
| Design System | `design-system/INDEX.md` | Forms, filters, badges, typography |
| Features | `features/` | Dashboard, pipeline, workflows, reports |
| Testing | `tests/e2e/SETUP.md` | Canonical credentials, E2E checklists |

## Auto-Generated Docs

These files are auto-generated and CI-enforced fresh:

| Path | Generate With | Contains |
|------|---------------|----------|
| `.claude/state/component-inventory/` | `just discover` | 484 React components |
| `.claude/state/hooks-inventory.json` | `just discover` | 77 custom hooks |
| `.claude/state/schemas-inventory/` | `just discover` | 82 Zod schemas |
| `.claude/state/forms-inventory.json` | `just discover` | 39 form components |

## Adding Documentation

| What? | Where? |
|-------|--------|
| New feature spec | `features/[feature-name].md` |
| Architecture decision | Add to `decisions.md` |
| Technical debt | Add to `technical-debt.md` |
| UI/UX patterns | `design/` (see `design/INDEX.md`) |
| Completed audit | `audits/archive/` |

## Archive Policy

Date-stamped audit snapshots and phase artifacts are archived in `audits/archive/`:
- **Snapshots**: Date-stamped audit reports (`YYYY-MM-DD-*.md`) moved after actionable items are extracted to `technical-debt.md`
- **Phase artifacts**: Audit prompt/runbook directories (e.g., `full-db-audit-phases/`, `reporting-audit-phases/`)
- **Active summaries**: Current INDEX, summary reports, and recent audits remain in `audits/`

Do not delete archived documents - they provide context for decisions made.
