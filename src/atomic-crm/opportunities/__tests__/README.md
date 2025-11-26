# Opportunities Module Test Organization

This document explains the test file conventions for the opportunities module.

## Test File Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*.test.tsx` | Unit tests using shared test utilities (`renderWithAdminContext`) | `OpportunityCard.test.tsx` |
| `*.spec.tsx` | Integration tests with inline mocks (legacy style, unique coverage) | `OpportunityShow.spec.tsx` |
| `*.unit.test.tsx` | Focused unit tests for form/input components | `OpportunityCreate.unit.test.tsx` |
| `*.integration.test.tsx` | E2E-style integration tests | `QuickAdd.integration.test.tsx` |

## Directory Structure

```
opportunities/
├── __tests__/                    # ALL tests consolidated here
│   ├── *.test.tsx                # Unit tests (modern style)
│   ├── *.spec.tsx                # Integration tests (legacy style)
│   └── README.md                 # This file
├── hooks/__tests__/              # Hook-specific tests
├── kanban/                       # Kanban board components
├── forms/                        # Form components
├── quick-add/                    # Quick add feature
└── slideOverTabs/                # Slide-over tab components
```

## Why Both `.test.tsx` and `.spec.tsx`?

**They are NOT duplicates!** Each style provides different coverage:

- **`.test.tsx`**: Uses shared utilities like `renderWithAdminContext` and `createMockOpportunity` for consistent, maintainable tests
- **`.spec.tsx`**: Uses inline mock data with more comprehensive scenario coverage (participants, influence levels, activity tracking)

Both are run by Vitest and provide complementary coverage.

## Mock Path Conventions

When mocking modules, the path is relative to the **component being tested**, not the test file:

```typescript
// Testing kanban/OpportunityListContent.tsx from __tests__/
// The component imports from ./OpportunityColumn
// So mock path is relative to the component: ../kanban/OpportunityColumn
vi.mock("../kanban/OpportunityColumn", () => ({ ... }));
```

## Running Tests

```bash
# Run all opportunities tests
npm test -- --run src/atomic-crm/opportunities/

# Run specific test file
npm test -- --run src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx

# Run with coverage
npm run test:coverage -- src/atomic-crm/opportunities/
```

## Adding New Tests

1. Place all new tests in `__tests__/` directory
2. Use `.test.tsx` suffix and shared utilities from `@/tests/utils/`
3. Follow existing patterns for mock setup and assertions
4. Ensure required props are passed (e.g., `openSlideOver` for list components)
