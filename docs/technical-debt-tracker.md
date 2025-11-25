# Technical Debt Tracker

> **Purpose:** Track and prioritize technical debt items discovered through code analysis, TODO/FIXME comments, and architectural reviews.
>
> **Governance:** Follows the [Engineering Constitution](claude/engineering-constitution.md) principles. Items should be resolved following the **Boy Scout Rule** (Principle #3) when working in affected files.

---

## Quick Stats

| Priority | Open | In Progress | Resolved |
|----------|------|-------------|----------|
| P1 (Critical) | 1 | 0 | 0 |
| P2 (High) | 3 | 0 | 0 |
| P3 (Low) | 1 | 0 | 0 |
| **Total** | **5** | **0** | **0** |

**Last Updated:** 2024-11-24

---

## Active Items

### P1 - Critical (Fix Immediately)

| ID | Type | File | Line | Description | Effort | Status | Assignee |
|----|------|------|------|-------------|--------|--------|----------|
| TD-001 | TEST | `providers/supabase/unifiedDataProvider.errors.test.ts` | 154 | **Mock isolation bug** - `vi.clearAllMocks()` doesn't reset mockDelete implementation between tests, causing test pollution. Test is currently skipped with `expect(true).toBe(true)`. | 2-4h | Open | - |

**TD-001 Details:**
- **Root Cause:** `vi.clearAllMocks()` clears call history but not mock implementations
- **Impact:** Hidden test failures, CI unreliability, potential regression masking
- **Fix:** Replace with `vi.resetAllMocks()` in `beforeEach` hook
- **Constitution Reference:** Violates fail-fast principle by silently skipping tests

---

### P2 - High (Address This Sprint)

| ID | Type | File | Line | Description | Effort | Status | Assignee |
|----|------|------|------|-------------|--------|--------|----------|
| TD-002 | DRY | `providers/commons/getContactAvatar.ts`, `utils/avatar.utils.ts` | - | **Code duplication** - Avatar logic duplicated between `providers/commons/` and `utils/`. `TransformService` correctly imports from `utils/`, but duplicates remain. | 1d | Open | - |
| TD-003 | TEST | `opportunities/__tests__/QuickAddForm.test.tsx` | 242 | **Missing test coverage** - Principal selection and product filtering interaction not tested. Test renders UI but skips interaction validation. | 4-6h | Open | - |
| TD-004 | FEATURE | `utils/avatar.utils.ts` | 96, 116 | **LinkedIn avatar integration** - TODO comments for LinkedIn profile/company logo retrieval. Requires product decision (Direct API vs third-party service). | 2-3d | Open | - |

**TD-002 Details:**
- **Files to Remove:** `providers/commons/getContactAvatar.ts`, `providers/commons/getOrganizationAvatar.ts`
- **Canonical Location:** `src/atomic-crm/utils/avatar.utils.ts`
- **Impact:** Maintenance burden, risk of divergent implementations
- **Constitution Reference:** Violates Single Composable Entry Point (Principle #2)

**TD-003 Details:**
- **Missing Coverage:** Select component open/select/close cycle for principal → product filtering
- **Testing Approach:** Use `@testing-library/user-event` with `selectOptions` helper
- **Impact:** Product filtering logic unverified, potential UX regressions

**TD-004 Details:**
- **Options:**
  | Approach | Effort | Monthly Cost | Complexity |
  |----------|--------|--------------|------------|
  | Direct LinkedIn API | 3+ days | $0 | Very High (OAuth, rate limits) |
  | Third-party (Clearbit) | 1 day | $50-200 | Low |
  | Defer to post-MVP | 0 | $0 | None |
- **Dependencies:** `linkedin_url` field exists in schema
- **Prerequisite:** Complete TD-002 (DRY cleanup) first

---

### P3 - Low (Address When Convenient)

| ID | Type | File | Line | Description | Effort | Status | Assignee |
|----|------|------|------|-------------|--------|--------|----------|
| TD-005 | TYPE | `providers/commons/canAccess.ts` | 1 | **Missing export from ra-core** - `CanAccessParams` interface locally duplicated because `ra-core` doesn't export it. | 1-2h | Open | - |

**TD-005 Details:**
- **Options:**
  1. Keep local definition with version comment (recommended)
  2. Submit PR to ra-core (high coordination cost)
- **Impact:** Minor - type may drift from upstream
- **Recommendation:** Document the ra-core version verified against

---

## Resolved Items

| ID | Type | File | Description | Resolved Date | Resolution |
|----|------|------|-------------|---------------|------------|
| - | - | - | *No items resolved yet* | - | - |

---

## Item Template

Use this template when adding new technical debt items:

```markdown
### TD-XXX: [Brief Title]

| Field | Value |
|-------|-------|
| **ID** | TD-XXX |
| **Type** | BUG / TEST / DRY / FEATURE / TYPE / SECURITY / PERF |
| **Priority** | P1 / P2 / P3 |
| **File(s)** | `path/to/file.ts` |
| **Line(s)** | Line numbers or range |
| **Effort** | Estimate (e.g., 2-4h, 1d, 1w) |
| **Status** | Open / In Progress / Blocked / Resolved |
| **Assignee** | Name or `-` |
| **Created** | YYYY-MM-DD |
| **Constitution** | Which principle(s) this relates to |

**Description:**
[Detailed description of the issue]

**Root Cause:**
[Why this technical debt exists]

**Impact:**
[What problems this causes]

**Proposed Fix:**
[How to resolve this]

**Dependencies:**
[Other items that must be completed first, or items blocked by this]
```

---

## Type Definitions

| Type | Description | Examples |
|------|-------------|----------|
| **BUG** | Incorrect behavior that needs fixing | Logic errors, edge cases |
| **TEST** | Testing infrastructure or coverage issues | Flaky tests, missing coverage |
| **DRY** | Code duplication violating Don't Repeat Yourself | Duplicate functions, copy-paste code |
| **FEATURE** | Incomplete feature marked with TODO | Placeholder implementations |
| **TYPE** | TypeScript type safety issues | Missing types, `any` usage |
| **SECURITY** | Security vulnerabilities or concerns | Input validation, auth issues |
| **PERF** | Performance issues or optimization opportunities | Slow queries, memory leaks |
| **DOCS** | Documentation gaps or inaccuracies | Missing JSDoc, outdated README |

---

## Priority Definitions

| Priority | Response Time | Description |
|----------|---------------|-------------|
| **P1 - Critical** | This sprint | Blocks development, hides bugs, or affects production stability |
| **P2 - High** | Next 2 sprints | Significant maintenance burden or feature blocker |
| **P3 - Low** | Opportunistic | Nice-to-have, address when working in the area |

---

## Process

### Adding Items
1. Discover debt through code review, TODO comments, or analysis
2. Create entry using template above
3. Assign priority based on impact
4. Link to Constitution principle if applicable

### Working Items
1. Move status to "In Progress"
2. Assign to yourself
3. Follow [Boy Scout Rule](claude/engineering-constitution.md#3-boy-scout-rule) - fix related issues in touched files
4. Update this tracker when complete

### Resolving Items
1. Move item to Resolved section
2. Add resolution date and summary
3. Update Quick Stats counts
4. Consider if fix creates new items

---

## Related Documentation

- [Engineering Constitution](claude/engineering-constitution.md) - Core principles
- [Common Tasks](development/common-tasks.md) - Step-by-step guides
- [Testing Guide](testing/) - Test infrastructure documentation
- [Architecture Overview](architecture/) - System design documentation

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-11-24 | Initial creation with 5 items from TODO/FIXME analysis | Claude |
