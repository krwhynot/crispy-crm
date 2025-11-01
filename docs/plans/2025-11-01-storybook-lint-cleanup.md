# Storybook & Test File Linting Cleanup

> **Created:** 2025-11-01
> **Type:** Technical Debt / Code Quality
> **Priority:** Low (Development tooling only)
> **Estimated Effort:** 4-6 hours

**Goal:** Clean up 244 ESLint errors in Storybook stories and test files to achieve clean linting across the entire codebase.

**Context:** These issues are pre-existing in development/documentation code (Storybook stories and test files). They do not affect production runtime but create noise in CI/CD and violate coding standards.

---

## 📊 Issue Summary

**Total Issues:** 244 errors, 19 warnings
**Affected File Types:**
- Storybook stories (`*.stories.tsx`): 17 files
- Test files (`*.test.ts`, `*.test.tsx`): Multiple files
- UI sidebar component: 1 warning

**Issue Categories:**

| Category | Count | Rule | Severity |
|----------|-------|------|----------|
| Unused variables/imports | ~180 | `@typescript-eslint/no-unused-vars` | Error |
| React Hooks violations | ~35 | `react-hooks/rules-of-hooks` | Error |
| Accessibility (invalid hrefs) | ~20 | `jsx-a11y/anchor-is-valid` | Error |
| Accessibility (autoFocus) | ~5 | `jsx-a11y/no-autofocus` | Error |
| Non-interactive tabindex | ~2 | `jsx-a11y/no-noninteractive-tabindex` | Error |
| Fast refresh exports | 1 | `react-refresh/only-export-components` | Warning |

---

## 🎯 Task Breakdown

### Task 1: Remove Unused Imports (Batch Operation)

**Priority:** 🟢 Low
**Effort:** S (30 minutes)
**Files:** All Storybook and test files

**Strategy:** Use ESLint auto-fix for simple unused import removal.

**Step 1: Auto-fix unused imports**

```bash
# Dry run to see what would be fixed
npx eslint src/**/*.stories.tsx src/**/*.test.{ts,tsx} --fix-dry-run --rule '@typescript-eslint/no-unused-vars: error'

# Apply fixes
npx eslint src/**/*.stories.tsx src/**/*.test.{ts,tsx} --fix --rule '@typescript-eslint/no-unused-vars: error'
```

**Step 2: Manual cleanup for complex cases**

Some unused vars are in function parameters and need manual fixes:

```typescript
// Before:
function onChange(value, multiselect) {
  // multiselect never used
}

// After (option 1 - remove parameter):
function onChange(value) {
  // Implementation
}

// After (option 2 - prefix with underscore):
function onChange(value, _multiselect) {
  // Indicates intentionally unused
}
```

**Files needing manual review:**
- `src/components/admin/__tests__/select-input.test.tsx:55`
- `src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx:424`
- `src/atomic-crm/opportunities/__tests__/OpportunityEdit.unit.test.tsx:496`

**Step 3: Verify no regressions**

```bash
npm test -- --run
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/**/*.stories.tsx src/**/*.test.{ts,tsx}
git commit -m "chore(lint): remove unused imports and variables

- Auto-fix @typescript-eslint/no-unused-vars in Storybook stories
- Prefix intentionally unused parameters with underscore
- 180+ linting errors resolved
- No functional changes to development tooling"
```

---

### Task 2: Fix React Hooks Violations in Storybook

**Priority:** 🟢 Low
**Effort:** M (1-2 hours)
**Files:** Storybook stories with stateful examples

**Context:** Storybook's `render` function pattern conflicts with React Hooks rules. Hooks cannot be called in regular functions.

**Affected Files:**
- `src/components/ui/popover.stories.tsx` (lines 175, 332, 377, 410)
- `src/components/ui/sheet.stories.tsx` (lines 161, 162)
- `src/components/ui/dropdown-menu.stories.tsx` (lines 68, 108, 136, 263)

**Strategy:** Wrap stateful examples in functional components.

**Step 1: Refactor render functions to components**

```typescript
// ❌ BEFORE (violates React Hooks rules):
export const WithState = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false); // ERROR: Hook in non-component
    return <Popover open={isOpen} onOpenChange={setIsOpen}>...</Popover>;
  }
};

// ✅ AFTER (extract to component):
const PopoverWithState = () => {
  const [isOpen, setIsOpen] = React.useState(false); // OK: Hook in component
  return <Popover open={isOpen} onOpenChange={setIsOpen}>...</Popover>;
};

export const WithState = {
  render: () => <PopoverWithState />
};
```

**Step 2: Test in Storybook UI**

```bash
npm run storybook

# Manually verify affected stories:
# - Popover > WithState
# - Sheet > WithState
# - DropdownMenu > Controlled
```

**Step 3: Commit**

```bash
git add src/components/ui/*.stories.tsx
git commit -m "fix(storybook): extract stateful examples to components

- Wrap useState hooks in functional components
- Fixes react-hooks/rules-of-hooks violations in Storybook render functions
- Pattern: render: () => <ComponentWithState />
- No visual changes to Storybook documentation"
```

---

### Task 3: Fix Accessibility Issues (Invalid Anchors)

**Priority:** 🟡 Medium (A11y best practices)
**Effort:** S (30 minutes)
**Files:** Storybook navigation examples

**Context:** Example code uses `<a href="#">` which is not accessible. Should use `<button>` or valid hrefs.

**Affected Files:**
- `src/components/ui/navigation-menu.stories.tsx` (lines 70, 103, 174, 245)
- `src/components/ui/separator.stories.tsx` (lines 116, 120, 124, 128, 132)
- `src/components/ui/popover.stories.tsx` (lines 310, 313, 316, 319)

**Strategy:** Replace dummy anchors with semantic buttons or valid hrefs.

**Step 1: Replace placeholder anchors**

```typescript
// ❌ BEFORE (not accessible):
<NavigationMenuLink href="#">
  <a href="#" className="menu-link">
    Getting Started
  </a>
</NavigationMenuLink>

// ✅ AFTER (option 1 - valid href):
<NavigationMenuLink href="#getting-started">
  <a href="#getting-started" className="menu-link">
    Getting Started
  </a>
</NavigationMenuLink>

// ✅ AFTER (option 2 - use button):
<NavigationMenuLink asChild>
  <button className="menu-link" onClick={() => console.log('Navigate')}>
    Getting Started
  </button>
</NavigationMenuLink>
```

**Step 2: Test navigation examples**

```bash
npm run storybook
# Verify: NavigationMenu > Default still renders correctly
```

**Step 3: Commit**

```bash
git add src/components/ui/*.stories.tsx
git commit -m "fix(a11y): replace placeholder anchors with valid hrefs

- Replace href='#' with semantic anchors or buttons
- Fixes jsx-a11y/anchor-is-valid violations
- Improves accessibility of Storybook examples
- No visual changes to documentation"
```

---

### Task 4: Fix Accessibility Issues (autoFocus)

**Priority:** 🟡 Medium (A11y best practices)
**Effort:** XS (15 minutes)
**Files:** Form component examples

**Context:** `autoFocus` reduces usability and accessibility. Use only when essential for UX.

**Affected Files:**
- `src/components/ui/input.stories.tsx:254`
- `src/components/ui/radio-group.stories.tsx:328`
- `src/components/ui/switch.stories.tsx:283`

**Strategy:** Remove `autoFocus` from examples or add JSX comment explaining why needed.

**Step 1: Remove unnecessary autoFocus**

```typescript
// ❌ BEFORE:
<Input autoFocus placeholder="Enter email" />

// ✅ AFTER:
<Input placeholder="Enter email" />

// ✅ AFTER (if autoFocus is essential for demo):
{/* eslint-disable-next-line jsx-a11y/no-autofocus */}
<Input autoFocus placeholder="Enter email" />
```

**Step 2: Test form examples**

```bash
npm run storybook
# Verify: Input, RadioGroup, Switch stories render correctly
```

**Step 3: Commit**

```bash
git add src/components/ui/*.stories.tsx
git commit -m "fix(a11y): remove autoFocus from Storybook examples

- Remove autoFocus prop from input components
- Fixes jsx-a11y/no-autofocus violations
- Improves accessibility of example code
- No functional impact on production components"
```

---

### Task 5: Fix Tooltip Story (tabIndex on non-interactive)

**Priority:** 🟢 Low
**Effort:** XS (10 minutes)
**File:** `src/components/ui/tooltip.stories.tsx:306`

**Context:** `tabIndex` should only be on interactive elements.

**Step 1: Make element interactive or remove tabIndex**

```typescript
// ❌ BEFORE:
<div tabIndex={0}>
  <TooltipTrigger>Hover me</TooltipTrigger>
</div>

// ✅ AFTER (option 1 - use button):
<button>
  <TooltipTrigger>Hover me</TooltipTrigger>
</button>

// ✅ AFTER (option 2 - add role):
<div role="button" tabIndex={0}>
  <TooltipTrigger>Hover me</TooltipTrigger>
</div>
```

**Step 2: Test tooltip**

```bash
npm run storybook
# Verify: Tooltip > Custom Trigger works
```

**Step 3: Commit**

```bash
git add src/components/ui/tooltip.stories.tsx
git commit -m "fix(a11y): add role to focusable tooltip trigger

- Add role='button' to div with tabIndex
- Fixes jsx-a11y/no-noninteractive-tabindex
- Maintains keyboard accessibility"
```

---

### Task 6: Fix Unused Variable in Sidebar Component

**Priority:** 🟢 Low
**Effort:** XS (5 minutes)
**File:** `src/components/ui/sidebar.tsx:724`

**Context:** Component exports both JSX and constants. Fast refresh prefers component-only exports.

**Warning:**
```
Fast refresh only works when a file only exports components.
Use a new file to share constants or functions between components.
```

**Step 1: Check what's being exported**

```bash
grep -n "export" src/components/ui/sidebar.tsx | tail -5
```

**Step 2: Move constants to separate file (if needed)**

```typescript
// Option 1: Keep as-is, suppress warning
/* eslint-disable react-refresh/only-export-components */
export const SIDEBAR_WIDTH = 280;

// Option 2: Extract to sidebar.constants.ts
// Create: src/components/ui/sidebar.constants.ts
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 60;
```

**Step 3: Commit**

```bash
git add src/components/ui/sidebar.tsx
git commit -m "refactor(sidebar): extract constants to separate file

- Move SIDEBAR_* constants to sidebar.constants.ts
- Fixes react-refresh/only-export-components warning
- Improves Fast Refresh development experience"
```

---

### Task 7: Fix Test File Unused Variables

**Priority:** 🟢 Low
**Effort:** S (30 minutes)
**Files:** Test files with unused mocks/imports

**Context:** Test files have unused mock functions, imports, and error variables.

**Common Patterns:**

1. **Unused error variables in catch blocks:**
   ```typescript
   // ❌ BEFORE:
   try {
     await doSomething();
   } catch (error) {
     // error not used
   }

   // ✅ AFTER:
   try {
     await doSomething();
   } catch (_error) {
     // Intentionally ignored
   }
   ```

2. **Unused mock setup:**
   ```typescript
   // ❌ BEFORE:
   const mockDataProvider = vi.fn();
   // Never used in test

   // ✅ AFTER:
   // Remove if truly unused
   ```

**Step 1: Auto-fix where possible**

```bash
npx eslint src/**/*.test.{ts,tsx} --fix
```

**Step 2: Manual review for complex cases**

Review test files with unused setup:
- `src/tests/integration/auth-flow.test.ts:468`
- `src/atomic-crm/opportunities/__tests__/OpportunityEdit.unit.test.tsx`

**Step 3: Verify tests still pass**

```bash
npm test -- --run
```

**Step 4: Commit**

```bash
git add src/**/*.test.{ts,tsx}
git commit -m "chore(test): remove unused variables and imports

- Prefix unused error variables with underscore
- Remove unused mock setup
- Clean up test file imports
- No test behavior changes"
```

---

## ✅ Verification Steps

After completing all tasks:

### Step 1: Run full lint check

```bash
npm run lint:check
```

**Expected:** 0 errors in Storybook and test files (may still have other pre-existing issues)

### Step 2: Verify Storybook builds

```bash
npm run build-storybook
```

**Expected:** Clean build with no errors

### Step 3: Run test suite

```bash
npm test -- --run
```

**Expected:** All tests pass (660+ tests)

### Step 4: Run type checking

```bash
npm run typecheck
```

**Expected:** No type errors

---

## 📈 Success Metrics

- **Before:** 244 errors, 19 warnings
- **After:** 0 errors in development tooling files
- **Impact:** Clean CI/CD linting pipeline, better code review experience

---

## 🚀 Execution Order

**Recommended batch approach:**

1. **Quick wins (1 hour):**
   - Task 1: Auto-fix unused imports
   - Task 4: Remove autoFocus
   - Task 5: Fix tooltip tabIndex
   - Task 6: Sidebar warning

2. **Moderate effort (1-2 hours):**
   - Task 3: Fix anchor accessibility
   - Task 7: Clean test files

3. **Complex (1-2 hours):**
   - Task 2: Refactor React Hooks in Storybook

**Total estimated time:** 4-6 hours (can be done incrementally)

---

## 📝 Notes

- **Impact on production:** None (all changes are in development/documentation code)
- **Breaking changes:** None
- **Testing required:** Storybook visual verification + test suite
- **Can be done incrementally:** Yes (commit after each task)
- **Blocking issues:** None (low priority, technical debt)

---

## 🔗 Related Documentation

- [ESLint Configuration](../../.eslintrc.js)
- [Storybook Documentation](.storybook/main.ts)
- [Accessibility Guidelines](../internal-docs/accessibility.md)
- [Engineering Constitution](../claude/engineering-constitution.md) - Boy Scout Rule (#4)
