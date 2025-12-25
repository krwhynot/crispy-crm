# Testing Architecture

> Updated: 2025-12-25
> Automated Tests: **2,852** | Manual E2E Checklists: **118+ scenarios**

## Testing Philosophy

Crispy CRM follows a **fail-fast** testing philosophy aligned with the engineering constitution:

- **Fail Fast:** Tests should surface errors loudly and immediately - no silent failures
- **Constitution Compliance:** Tests verify engineering principles (Zod at API boundary, single data provider, etc.)
- **Regression Prevention:** Every bug fix includes a test to prevent recurrence
- **Manual E2E:** Claude Chrome for browser-based testing with manual checklists in `docs/tests/e2e/`

## Test Pyramid

```
              ╱╲
             ╱  ╲       Manual E2E (118+ scenarios)
            ╱    ╲      Claude Chrome browser testing
           ╱──────╲
          ╱        ╲    Integration (91 tests)
         ╱          ╲   Component + Provider tests
        ╱────────────╲
       ╱              ╲  Unit (2,761 tests)
      ╱                ╲ Pure functions, hooks, utils
     ╱──────────────────╲
```

| Layer | Tests | Files | Focus |
|-------|-------|-------|-------|
| **Unit** | 2,761 | 213 | Pure functions, hooks, utilities, Zod schemas |
| **Integration** | 91 | 7 | React Admin forms with mocked data provider |
| **Manual E2E** | 118+ | 6 | Manual testing checklists for Claude Chrome |

## Tests by Feature Area

| Feature | Tests | Priority |
|---------|-------|----------|
| data-provider | 512 | Critical - single source of truth |
| e2e | 485 | High - user workflows |
| opportunities | 450 | Critical - core business feature |
| validation | 362 | Critical - Zod at API boundary |
| contacts | 259 | High - core entity |
| dashboard | 240 | High - primary user interface |
| admin-components | 239 | Medium - shared components |
| organizations | 237 | High - core entity |
| utils | 208 | Medium - helper functions |
| reports | 130 | Medium - business reporting |
| services | 122 | High - data layer |
| hooks | 76 | Medium - React hooks |
| filters | 54 | Medium - list filtering |
| activities | 52 | High - activity tracking |
| tasks | 14 | Medium - task management |
| tutorial | 13 | Low - onboarding |

## Directory Structure

```
src/
├── atomic-crm/
│   ├── [feature]/
│   │   ├── __tests__/              ← Feature unit tests
│   │   │   ├── FeatureList.test.tsx
│   │   │   ├── FeatureCreate.test.tsx
│   │   │   └── FeatureCreate.integration.test.tsx
│   │   └── hooks/
│   │       └── __tests__/          ← Hook tests
│   │
│   ├── validation/
│   │   └── __tests__/              ← Zod schema tests
│   │       ├── [resource]/
│   │       │   ├── validation.test.ts
│   │       │   ├── integration.test.ts
│   │       │   └── edge-cases.test.ts
│   │
│   └── providers/
│       └── supabase/
│           └── __tests__/          ← Data provider tests
│               ├── unifiedDataProvider.test.ts
│               └── handlers/
│
├── components/
│   └── admin/
│       └── __tests__/              ← Shared component tests
│
└── tests/
    └── utils/
        └── render-admin.tsx        ← Test utilities

tests/
└── e2e/
    ├── .auth/
    │   └── user.json               ← Saved auth state
    ├── support/
    │   └── poms/                   ← Page Object Models
    ├── specs/
    │   ├── contacts/               ← Contact E2E tests
    │   ├── opportunities/          ← Opportunity E2E tests
    │   ├── organizations/          ← Organization E2E tests
    │   ├── reports/                ← Report E2E tests
    │   ├── rbac/                   ← Role-based access tests
    │   └── ui-ux-changes/          ← UI/UX verification tests
    └── global-setup.ts             ← Auth setup
```

## Configuration

### Vitest (Unit + Integration)

| Setting | Value |
|---------|-------|
| Environment | `jsdom` |
| Coverage Provider | `v8` |
| Setup Files | `@testing-library/jest-dom`, `./src/tests/setup.ts` |
| Include | `src/**/*.test.{ts,tsx}` |
| Exclude | `node_modules/`, `dist/`, `tests/**/*.spec.{ts,tsx}` |

**Run Commands:**
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific feature
npm test -- src/atomic-crm/opportunities

# Watch mode
npm test -- --watch
```

### Playwright (E2E)

| Setting | Value |
|---------|-------|
| Test Directory | `./tests/e2e` |
| Base URL | `http://127.0.0.1:5173` |
| Browsers | `chromium` |
| Retries (CI) | `2` |
| Retries (Local) | `0` |
| Global Setup | `./tests/e2e/global-setup.ts` |
| Auth State | `tests/e2e/.auth/user.json` |

**Viewports:**
- Desktop Chrome (1280x720)
- iPad Portrait (768x1024)
- iPad Landscape (1024x768)

**Run Commands:**
```bash
# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific spec
npx playwright test tests/e2e/specs/opportunities/crud.spec.ts

# Debug mode
npx playwright test --debug
```

## Test Categories

### Unit Tests (`*.test.{ts,tsx}`)

Pure function and component testing with mocked dependencies.

**Characteristics:**
- Fast execution (<100ms per test)
- No network calls
- No database access
- Isolated state

### Integration Tests (`*.integration.test.{ts,tsx}`)

Tests that verify components work with the data provider and React Admin context.

**Current Integration Test Files:**
1. `ActivityCreate.integration.test.tsx`
2. `ContactCreate.integration.test.tsx`
3. `OpportunityCreateWizard.integration.test.tsx`
4. `QuickAdd.integration.test.tsx`
5. `OrganizationCreate.integration.test.tsx`
6. `services.integration.test.ts`
7. `TaskCreate.integration.test.tsx`

### E2E Tests (`*.spec.ts`)

Full browser automation testing user workflows.

**Key Test Areas:**
- CRUD operations for all entities
- Kanban board interactions
- Report generation
- RBAC enforcement
- Accessibility compliance
- Touch target verification

## Test Utilities

### `renderWithAdminContext()`

Located: `src/tests/utils/render-admin.tsx`

Wraps components in React Admin context with mocked data provider.

```typescript
import { renderWithAdminContext } from '@/tests/utils/render-admin';

const { getByRole } = renderWithAdminContext(<MyComponent />);
```

### Test Data Factories

Use consistent test data patterns across tests for maintainability.

## Related Documentation

- [Coverage Analysis](./coverage-analysis.md) - Current coverage metrics
- [Test Authoring Guide](./test-authoring-guide.md) - How to write tests
