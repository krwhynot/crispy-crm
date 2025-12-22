# Coverage Analysis

> Generated: 2025-12-22
> Coverage Status: **Not Collected** (manual run required)

## Summary

Coverage data is not automatically collected because running the full coverage report with 2,800+ tests takes several minutes.

**To collect coverage:**
```bash
npx vitest run --coverage
```

### Configured Thresholds

| Metric | Target | Status |
|--------|--------|--------|
| Lines | 70% | TBD |
| Statements | 70% | TBD |
| Functions | 70% | TBD |
| Branches | 70% | TBD |

### Coverage Configuration

```typescript
// vitest.config.ts coverage settings
coverage: {
  provider: 'v8',
  reporters: ['text', 'json', 'html', 'lcov'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/tests/**',
    'src/**/__tests__/**',
    'src/**/*.d.ts'
  ],
  all: true
}
```

## Coverage by Feature (Test Count Proxy)

Since coverage data isn't available, we can infer testing depth from test counts:

| Feature | Test Count | Test Files | Coverage Confidence |
|---------|------------|------------|---------------------|
| data-provider | 512 | 35+ | **High** - Critical path well tested |
| opportunities | 450 | 30+ | **High** - Core business logic |
| validation | 362 | 25+ | **High** - Zod schemas at API boundary |
| contacts | 259 | 18+ | **Medium-High** - Entity coverage |
| dashboard | 240 | 18+ | **Medium-High** - UI coverage |
| admin-components | 239 | 15+ | **Medium** - Shared components |
| organizations | 237 | 15+ | **Medium-High** - Entity coverage |
| utils | 208 | 15+ | **High** - Pure function coverage |
| reports | 130 | 12+ | **Medium** - Report components |
| services | 122 | 10+ | **Medium-High** - Service layer |
| hooks | 76 | 10+ | **Medium** - React hooks |
| filters | 54 | 5+ | **Medium** - Filter logic |
| activities | 52 | 5+ | **Medium** - Activity tracking |
| tasks | 14 | 3+ | **Low** - Needs more tests |
| tutorial | 13 | 3+ | **Low** - Onboarding flow |

## High Priority Coverage Gaps

Based on test distribution analysis, these areas need additional testing:

### 1. Tasks Feature (14 tests)

**Current:** Only integration tests for TaskCreate
**Recommended:**
- Unit tests for task utility functions
- Tests for task snooze logic
- Tests for task reminder notifications

### 2. Activities Feature (52 tests)

**Current:** Basic CRUD tests
**Recommended:**
- Activity type-specific validation tests
- Activity aggregation tests for reports
- Sample/follow-up workflow tests

### 3. Tutorial Feature (13 tests)

**Current:** Basic provider tests
**Recommended:**
- Tutorial step completion tests
- Tutorial persistence tests
- Tutorial reset functionality

## Recommended Test Additions

### Critical (Constitution Compliance)

| File/Area | Missing Tests | Priority |
|-----------|--------------|----------|
| `unifiedDataProvider.ts` | Edge cases for all 9 resources | P0 |
| Zod schemas | Boundary value tests for `.max()` constraints | P0 |
| RLS policies | Row-level security verification | P0 |

### High (Core Features)

| File/Area | Missing Tests | Priority |
|-----------|--------------|----------|
| Kanban drag-drop | Stage transition validation | P1 |
| Quick-add flows | All entity quick-add paths | P1 |
| Bulk operations | Multi-select actions | P1 |
| Export functionality | CSV/Excel generation | P1 |

### Medium (User Experience)

| File/Area | Missing Tests | Priority |
|-----------|--------------|----------|
| Form validation feedback | Error message display | P2 |
| Loading states | Skeleton/spinner coverage | P2 |
| Mobile responsiveness | iPad viewport tests | P2 |
| Accessibility | ARIA attribute verification | P2 |

## E2E Coverage by Area

| Area | Spec Files | Test Count | Coverage |
|------|------------|------------|----------|
| Dashboard | 12 | 120+ | **Good** |
| Opportunities | 8 | 80+ | **Good** |
| Contacts | 4 | 40+ | **Good** |
| Organizations | 4 | 35+ | **Good** |
| Reports | 4 | 50+ | **Good** |
| RBAC | 5 | 45+ | **Good** |
| Forms | 6 | 50+ | **Good** |
| Accessibility | 3 | 25+ | **Medium** |
| Design System | 7 | 60+ | **Good** |

## Running Coverage Reports

### Full Coverage Report
```bash
# Generate full coverage (takes ~5-10 minutes)
npx vitest run --coverage

# View HTML report
open coverage/index.html
```

### Feature-Specific Coverage
```bash
# Coverage for single feature
npx vitest run --coverage src/atomic-crm/opportunities

# Coverage for validation
npx vitest run --coverage src/atomic-crm/validation
```

### CI Integration

Coverage should be collected in CI and uploaded to a coverage tracking service:

```yaml
# Example GitHub Actions step
- name: Run Tests with Coverage
  run: npx vitest run --coverage --reporter=json

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Coverage Trends

Track these metrics over time:

1. **Critical Path Coverage** - Data provider, validation, auth
2. **Feature Coverage** - Each CRM feature module
3. **Integration Coverage** - Form submissions, workflows
4. **E2E Coverage** - User journey completion

## Related Documentation

- [Test Architecture](./test-architecture.md) - Testing philosophy and structure
- [Test Authoring Guide](./test-authoring-guide.md) - How to write tests
