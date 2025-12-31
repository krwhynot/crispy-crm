# Crispy CRM Documentation

## Structure

```
docs/
├── architecture/      # System design, data model, component patterns
├── design/            # UI/UX design system documentation
│   ├── INDEX.md       # Design system navigation hub
│   ├── ACCESSIBILITY.md # WCAG 2.1 AA compliance guide
│   ├── USER-FLOWS.md  # MVP user journeys
│   ├── RESPONSIVE-SPECS.md # Viewport breakpoints
│   ├── INTERACTION-PATTERNS.md # Micro-interactions
│   └── COMPONENT-CATALOG.md # Visual component index
├── features/          # Feature specifications (pipeline, dashboard, etc.)
├── guides/            # Developer how-to documentation
│   └── testing/       # Test strategy and workflow guides
├── testing/           # Test patterns and utilities
├── tests/             # E2E test checklists and screenshots
│   ├── e2e/           # Manual E2E testing checklists
│   └── screenshots/   # Reference screenshots
├── archive/           # Historical reference (audits, old plans)
│   ├── audits/        # Code quality & UI/UX audits
│   ├── plans/         # Completed implementation plans
│   └── research/      # Discovery notes and investigations
├── _state/            # Runtime state files (do not edit manually)
├── technical-debt.md  # Open issues tracker (consolidated from audits)
├── decisions.md       # Architecture Decision Records
├── known-issues.md    # Known issues and workarounds
└── PRD.md             # Product Requirements Document
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `architecture/data-model.md` | Complete entity reference |
| `architecture/rls-policies.md` | Row-level security policies |
| `design/INDEX.md` | Design system navigation hub |
| `design/ACCESSIBILITY.md` | WCAG 2.1 AA compliance guide |
| `decisions.md` | Architecture Decision Records |
| `technical-debt.md` | Tracked technical debt items |

## Auto-Generated Docs

These files are auto-generated and CI-enforced fresh:

| Path | Generate With | Contains |
|------|---------------|----------|
| `architecture/data-model.md` | `npx tsx scripts/generate-schema-docs.ts` | Database schema docs |
| `_state/component-inventory/` | `just discover` | 484 React components |
| `_state/hooks-inventory.json` | `just discover` | 77 custom hooks |
| `_state/schemas-inventory/` | `just discover` | 82 Zod schemas |
| `_state/forms-inventory.json` | `just discover` | 39 form components |

## Adding Documentation

| What? | Where? |
|-------|--------|
| New feature spec | `features/[feature-name].md` |
| Architecture decision | Add to `decisions.md` |
| Technical debt | Add to `technical-debt.md` |
| Developer guide | `guides/[topic].md` |
| UI/UX patterns | `design/` (see `design/INDEX.md`) |
| Completed audit | `archive/audits/` |
| Historical record | `archive/` |

## Archive Policy

Documents in `archive/` are historical references:
- **Audits**: Past code quality and UI/UX audits (actionable items moved to `technical-debt.md`)
- **Plans**: Completed implementation plans
- **Research**: Discovery notes and investigations

Do not delete archived documents - they provide context for decisions made.
