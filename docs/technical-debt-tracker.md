# Technical Debt Tracker

> **Purpose:** Track and prioritize technical debt items discovered through code analysis, TODO/FIXME comments, and architectural reviews.
>
> **Governance:** Follows the [Engineering Constitution](claude/engineering-constitution.md) principles. Items should be resolved following the **Boy Scout Rule** (Principle #3) when working in affected files.

---

## Quick Stats

| Priority | Open | In Progress | Resolved |
|----------|------|-------------|----------|
| P1 (Critical) | 0 | 0 | 1 |
| P2 (High) | 1 | 0 | 2 |
| P3 (Low) | 0 | 0 | 1 |
| **Total** | **1** | **0** | **4** |

**Last Updated:** 2025-11-25

---

## Active Items

### P1 - Critical (Fix Immediately)

*No open P1 items* ✅

---

### P2 - High (Address This Sprint)

| ID | Type | File | Line | Description | Effort | Status | Assignee |
|----|------|------|------|-------------|--------|--------|----------|
| TD-004 | FEATURE | `utils/avatar.utils.ts` | 96, 116 | **LinkedIn avatar integration** - TODO comments for LinkedIn profile/company logo retrieval. Requires product decision (Direct API vs third-party service). | 2-3d | Open | - |

**TD-004 Details:**
- **Options:**
  | Approach | Effort | Monthly Cost | Complexity |
  |----------|--------|--------------|------------|
  | Direct LinkedIn API | 3+ days | $0 | Very High (OAuth, rate limits) |
  | Third-party (Clearbit) | 1 day | $50-200 | Low |
  | Defer to post-MVP | 0 | $0 | None |
- **Dependencies:** `linkedin_url` field exists in schema
- **Prerequisite:** ~~Complete TD-002 (DRY cleanup) first~~ ✅ Resolved - avatar.utils.ts is now canonical

---

### P3 - Low (Address When Convenient)

*No open P3 items* ✅

---

## Resolved Items

| ID | Type | File | Description | Resolved Date | Resolution |
|----|------|------|-------------|---------------|------------|
| TD-005 | TYPE | `providers/commons/canAccess.ts` | Missing export from ra-core - `CanAccessParams` interface locally duplicated | 2025-11-25 | Comprehensive JSDoc added with: version verification (ra-core@5.10.0), source reference link, resolution options documented, maintenance notes. Local definition is correct approach - low maintenance, avoids upstream PR coordination. |
| TD-003 | TEST | `QuickAddForm.test.tsx`, `useFilteredProducts.test.tsx` | Missing test coverage - Principal selection and product filtering interaction | 2025-11-25 | Added 17 QuickAddForm tests (8 for principal/product flow) + 24 useFilteredProducts hook tests. Full coverage: dropdown display, selection state, filter params, principal switching, empty products edge case, persistence after form reset. |
| TD-002 | DRY | `providers/commons/getContactAvatar.ts`, `utils/avatar.utils.ts` | Code duplication - Avatar logic duplicated between `providers/commons/` and `utils/` | 2025-11-24 | Test coverage added (29 tests for avatar.utils.ts), duplicate files deleted (`getContactAvatar.ts`, `getOrganizationAvatar.ts` + specs), single source of truth established in `utils/avatar.utils.ts` |
| TD-001 | TEST | `unifiedDataProvider.errors.test.ts` | Mock isolation bug - vi.clearAllMocks() preserving implementations | 2025-11-24 | Changed to `vi.resetAllMocks()` in beforeEach; fixed delete tests to use `mockUpdate` (soft delete path) |

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
| 2025-11-25 | Resolved TD-005: canAccess.ts documentation - comprehensive JSDoc with version info, source reference, maintenance notes | Claude |
| 2025-11-25 | Resolved TD-003: Principal/product filtering tests - 17 QuickAddForm + 24 useFilteredProducts tests | Claude |
| 2025-11-24 | Resolved TD-002: Avatar code duplication - added 29 tests, deleted duplicates, single source of truth | Claude |
| 2025-11-24 | Resolved TD-001: Mock isolation bug fixed with vi.resetAllMocks() | Claude |
| 2024-11-24 | Initial creation with 5 items from TODO/FIXME analysis | Claude |
