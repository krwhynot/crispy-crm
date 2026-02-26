# Crispy CRM Documentation

## Structure

```
docs/
├── architecture/        # System design, component tiers, data consolidation
├── audits/              # Active audit summaries and baselines
├── blog/                # Engineering blog posts
├── design/              # UI/UX design + implementation specs (merged)
├── development/         # Development guides, finding IDs
├── features/            # Feature specifications (pipeline, dashboard, reports)
├── performance/         # Performance documentation
├── tests/               # Test patterns, E2E checklists
│   ├── e2e/             # Manual E2E testing (numbered suites + Claude Chrome prompts)
│   └── ui/              # UI-specific tests
├── technical-debt.md    # Tracked debt items (consolidated from audits)
├── decisions.md         # Architecture Decision Records
└── ERD.md               # Entity-Relationship Diagram (auto-generated)
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `architecture/COMPONENT_TIERS.md` | Three-tier component hierarchy (shadcn -> RA wrappers -> Features) |
| `design/INDEX.md` | Design system navigation hub (UI philosophy + implementation specs) |
| `design/ACCESSIBILITY.md` | WCAG 2.1 AA compliance guide |
| `ERD.md` | Database schema reference (auto-generated from live Supabase) |
| `decisions.md` | Architecture Decision Records |
| `technical-debt.md` | Tracked technical debt items |

**Engineering Constitution:** Core principles are documented in [`/CLAUDE.md`](../CLAUDE.md) at project root.

## Canonical Docs Map

| Section | Entry Point | Contains |
|---------|-------------|----------|
| Architecture | `architecture/` | Component tiers, data model (`ERD.md`), access model |
| Audits | `audits/INDEX.md` | Active summaries; baselines in `.baseline/` |
| Design | `design/INDEX.md` | UX philosophy, a11y, responsive specs, badges, filters, forms, typography |
| Features | `features/` | Dashboard, pipeline, workflows, reports |
| Testing | `tests/e2e/SETUP.md` | Canonical credentials, E2E checklists |

## Adding Documentation

| What? | Where? |
|-------|--------|
| New feature spec | `features/[feature-name].md` |
| Architecture decision | Add to `decisions.md` |
| Technical debt | Add to `technical-debt.md` |
| UI/UX patterns | `design/` (see `design/INDEX.md`) |
