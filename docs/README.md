# Crispy CRM Documentation

## Structure

```
docs/
├── architecture/     # System design and patterns
├── features/         # Feature specifications
├── testing/          # Test strategy and guides
├── guides/           # Developer how-to docs
├── archive/          # Historical reference
├── technical-debt.md # Open issues tracker
├── decisions.md      # Architecture decisions
└── PRD.md           # Product requirements
```

## Auto-Generated Docs

- `architecture/data-model.md` - Run `npx tsx scripts/generate-schema-docs.ts`
- `_state/` - Component/schema inventories (run `just discover`)

## Adding Documentation

| What? | Where? |
|-------|--------|
| New feature | `features/[feature-name].md` |
| Architecture decision | Add to `decisions.md` |
| Technical debt | Add to `technical-debt.md` |
| Historical record | `archive/` |

## Archive Structure

```
archive/
├── audits/     # Code quality & UI/UX audits
├── plans/      # Completed implementation plans
└── research/   # Discovery notes and investigations
```
