# ADR-003: Three-Tier UI Architecture

**Status:** Accepted
**Date:** 2025-10-01
**Deciders:** Engineering team

## Context

The CRM uses both shadcn/ui primitives and React Admin components. Without clear boundaries, feature code mixes presentational markup, RA hook wiring, and business logic in the same files. This creates testing friction (RA context required for visual-only components) and makes it hard to swap or upgrade either library independently.

## Decision

Adopt a **three-tier component architecture** with strict import boundaries:

### Tier 1: Atoms (`src/components/ui/`)

- Pure presentational components (shadcn/ui primitives + custom atoms)
- **No** `react-admin` or `@supabase` imports
- **No** business logic — only visual rendering, accessibility attributes, and semantic tokens
- Testable with plain React Testing Library (no RA context needed)

### Tier 2: Molecules (`src/components/ra-wrappers/`)

- React Admin integration layer — wires `useInput`, form context, and RA prop contracts
- Wraps Tier 1 atoms with RA-specific behavior (validation display, record binding)
- Owns `PremiumDatagrid`, `SimpleForm`, `SectionCard`, and other RA-aware composites
- Custom library props are destructured before spreading to DOM elements

### Tier 3: Features (`src/atomic-crm/{resource}/`)

- Resource-specific pages (List, Create, Edit, Show, SlideOver)
- Consumes Tier 2 wrappers — should not rebuild raw Tier 1 compositions
- Business logic lives in hooks and services, not inline in JSX

### Import rules:

```
Tier 3 → Tier 2 → Tier 1   (allowed)
Tier 1 → Tier 2             (forbidden)
Tier 1 → Tier 3             (forbidden)
Tier 2 → Tier 3             (forbidden)
```

## Consequences

### Positive

- Tier 1 components are reusable outside React Admin (marketing pages, standalone tools)
- Testing Tier 1 requires no RA mocking — faster, simpler unit tests
- Upgrading React Admin or shadcn/ui is isolated to the relevant tier
- Accessibility concerns (ARIA attributes, semantic tokens) are handled consistently at Tier 1

### Negative

- More indirection for simple features (feature → wrapper → atom)
- Developers must know which tier a component belongs to before importing
- Wrapper proliferation if every atom gets a Tier 2 variant

### Neutral

- `PremiumDatagrid` replaces raw `Datagrid` imports — enforced by `CMD-007` audit

## Alternatives Considered

### Option A: Flat Component Library

Single `components/` directory with no tier separation. Rejected: RA imports leaked into primitive components, making them untestable without full RA context and impossible to reuse outside RA.

### Option B: Feature-Colocated Components

Each feature owns its own UI components. Rejected: led to duplicate implementations of identical patterns (cards, forms, tables) across resources.

## References

- `src/components/ui/` (Tier 1)
- `src/components/ra-wrappers/` (Tier 2)
- `src/atomic-crm/` (Tier 3 features)
- `.claude/rules/UI_STANDARDS.md` (UI-001, UI-002, UI-007)
- `.claude/rules/MODULE_CHECKLIST.md` (MOD-007)
