---
description: Performance audit (form re-renders, query optimization, bundle size) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), mcp__supabase__get_advisors, TodoWrite, Write
model: sonnet
---

# Performance Audit

Audit the codebase for performance issues including form re-renders, query optimization, and bundle size. Tracks delta from previous audits and generates actionable todos.

> **SKILL ACTIVATION:** Using `performance` audit command for render/query health check.

---

## Phase 0: Mode Detection

Parse `$ARGUMENTS` to determine audit mode:

| Argument | Mode | Description |
|----------|------|-------------|
| `--quick` | Quick | Local rg checks only, skip MCP advisors |
| `--full` | Full | All checks including Supabase performance advisors |
| `src/path` | Scoped | Audit specific directory only |
| *(empty)* | Full | Default to full audit |

```bash
# Get current date for report filename
date +%Y-%m-%d
```

---

## Phase 1: Local rg Checks (Always Run)

Run these checks in parallel using Grep tool:

### Critical Severity (Severe Performance Impact)

#### 1.1 onChange Form Mode
```bash
# Find forms using onChange mode - causes re-render on every keystroke
rg "mode.*['\"]onChange['\"]|mode:\s*['\"]onChange['\"]" --type tsx -n
```

**What to look for:**
- `<SimpleForm mode="onChange">` or `mode: 'onChange'`
- Any form configuration with onChange mode

**Risk:** Re-render storm - form re-renders on EVERY keystroke, destroying performance

**Correct Pattern:**
```tsx
// CORRECT: onSubmit mode (default) - no re-render on each keystroke
<SimpleForm mode="onSubmit">

// CORRECT: onBlur mode for validation feedback
<SimpleForm mode="onBlur">
```

#### 1.2 watch() Instead of useWatch
```bash
# Find watch() calls that should use useWatch (excludes legitimate useWatch)
rg "watch\(" --type ts -n src/atomic-crm/ | grep -v "useWatch"
```

**What to look for:**
- Direct `watch()` calls from react-hook-form
- Should use `useWatch()` hook for isolated subscriptions
- Note: The grep excludes `useWatch` which is the correct pattern

**Risk:** Full form re-render - watch() causes entire form to re-render on field change

**Correct Pattern:**
```tsx
// WRONG: watch() triggers full form re-render
const status = watch('status');

// CORRECT: useWatch for isolated subscriptions
const status = useWatch({ name: 'status' });
```

---

### High Severity (Noticeable Slowdown)

#### 1.3 Form Mode Not Specified (FORM-H001)
```bash
# Check 1: Find forms without mode specified
rg "<(SimpleForm|Form)" src/atomic-crm/ --type tsx -A 3 -n | rg -v "mode="

# Check 2: Find forms explicitly using onChange
rg 'mode="onChange"' src/atomic-crm/ --type tsx -n
```

**What to look for:**
- `<SimpleForm>` or `<Form>` without `mode` prop (defaults to onChange)
- Explicit `mode="onChange"` (aggressive validation)
- Forms validating on every keystroke

**Risk:**
- **onChange mode (or missing mode):** Validates on every keystroke, showing errors before user finishes typing (poor UX)
- **Performance:** Triggers validation and re-renders on every input change
- **User frustration:** Red error messages appear immediately while typing

**Correct Pattern:**
```tsx
// WRONG: Missing mode (defaults to onChange)
<SimpleForm>
  <TextInput source="first_name" />
  <TextInput source="email" />
</SimpleForm>

// WRONG: Explicit onChange mode
<SimpleForm mode="onChange">
  <TextInput source="first_name" />
</SimpleForm>

// CORRECT: onSubmit mode (validate only when user submits)
<SimpleForm mode="onSubmit">
  <TextInput source="first_name" />
  <TextInput source="email" />
</SimpleForm>

// CORRECT: onBlur mode (validate when user leaves field)
<SimpleForm mode="onBlur">
  <TextInput source="first_name" />
  <TextInput source="email" />
</SimpleForm>
```

**Note:** Validation still runs at provider layer via `ValidationService`, so this doesn't skip validation - it just improves timing and UX.

**Related:** See MODULE_CHECKLIST.md - "Forms" section.

#### 1.5 Missing useMemo for Heavy Computations
```bash
# Find array operations without memoization
rg "\.(filter|map|reduce|sort)\(" --type tsx -n
```

**What to look for:**
- `.filter()`, `.map()`, `.reduce()`, `.sort()` on large arrays
- Inside component body without `useMemo` wrapper
- Repeated on every render

**Risk:** Unnecessary re-renders - expensive computations run on every render

**Correct Pattern:**
```tsx
// CORRECT: Memoized expensive computations
const filtered = useMemo(() => items.filter(x => x.active), [items]);
```

#### 1.6 Large Bundle Imports
```bash
# Find full library imports that bloat bundle
rg "import .* from ['\"]lodash['\"]|import .* from ['\"]moment['\"]" --type ts -n
```

**What to look for:**
- `import _ from 'lodash'` (entire library)
- `import moment from 'moment'` (entire library)
- Should use tree-shakeable alternatives or specific imports

**Risk:** Bundle bloat - adds 70KB+ to bundle size unnecessarily

**Correct Pattern:**
```tsx
// WRONG: Import entire lodash
import _ from 'lodash';

// CORRECT: Named imports for tree-shaking
import { debounce, throttle } from 'lodash-es';

// CORRECT: Use date-fns instead of moment
import { format, parseISO } from 'date-fns';
```

#### 1.7 N+1 Query Patterns
```bash
# Find multiple sequential fetches
rg "await.*fetch|useQuery.*\{" --type tsx -n -A 5
```

**What to look for:**
- Multiple sequential `await fetch()` calls
- Multiple `useQuery` hooks fetching related data separately
- Loop with async call inside

**Risk:** Slow page load - N+1 queries multiply request count

#### 1.8 Missing useCallback for Event Handlers
```bash
# Find inline arrow function handlers
rg "onClick=\{\(\)" --type tsx -n
```

**What to look for:**
- `onClick={() => handleClick()}` inline handlers
- Passed to child components (causes re-render)
- In lists/tables (multiplied impact)

**Risk:** Unnecessary child re-renders - new function reference each render

**Correct Pattern:**
```tsx
// CORRECT: Memoized callbacks
const handleClick = useCallback(() => {
  // handler logic
}, [deps]);

<Button onClick={handleClick} />
```

#### 1.10 Non-lazy Resource Components
```bash
# Find Resource components without lazy loading (flag if no lazy())
rg "<Resource" --type tsx -n src/ -A 3
```

**What to look for:**
- `<Resource>` components with direct imports (not lazy loaded)
- Missing `React.lazy()` wrapper for list/edit/create/show components
- All resources loading at initial bundle

**Risk:** Large initial bundle - all resource components load upfront even if not visited

**Correct Pattern:**
```tsx
// WRONG: Direct imports load everything upfront
import { ContactList, ContactEdit, ContactCreate } from './contacts';

<Resource
  name="contacts"
  list={ContactList}
  edit={ContactEdit}
  create={ContactCreate}
/>

// CORRECT: Lazy loading for code splitting
const ContactList = lazy(() => import('./contacts/ContactList'));
const ContactEdit = lazy(() => import('./contacts/ContactEdit'));
const ContactCreate = lazy(() => import('./contacts/ContactCreate'));

<Resource
  name="contacts"
  list={ContactList}
  edit={ContactEdit}
  create={ContactCreate}
/>
```

---

### Medium Severity (Optimization Opportunities)

#### 1.7 Inline Object/Array Props
```bash
# Find inline object styles and props
rg "style=\{\{|className=\{\{|\[\]" --type tsx -n
```

**What to look for:**
- `style={{ color: 'red' }}` - new object each render
- Props with `{{}}` inline objects
- `prop={[]}` empty array as prop

**Risk:** New reference each render - defeats React.memo optimization

**Correct Pattern:**
```tsx
// WRONG: New object every render
<div style={{ marginTop: 8 }} />

// CORRECT: Define outside component or use className
const styles = { marginTop: 8 };
<div style={styles} />

// BEST: Use Tailwind classes
<div className="mt-2" />
```

#### 1.8 Missing React.memo for List Items
```bash
# Find list item components without memo
rg "export (default )?(function|const) \w+Item|Row|Card" --type tsx -n
```

**What to look for:**
- Components named `*Item`, `*Row`, `*Card`
- Used in lists/tables
- Not wrapped in `React.memo()`

**Risk:** Unnecessary child re-renders - all list items re-render on parent change

**Correct Pattern:**
```tsx
// CORRECT: Memoized list item
export const ContactRow = React.memo(function ContactRow({ contact }) {
  return <tr>...</tr>;
});
```

#### 1.9 Console.log in Production Code
```bash
# Find console statements in source
rg "console\.(log|debug|info|warn)" --type ts src/atomic-crm/ -n
```

**What to look for:**
- `console.log()` calls in production code
- Debug statements left in codebase
- Excessive logging

**Risk:** Performance degradation + potential data leakage in logs

---

## Phase 2: MCP Performance Checks (Full Mode Only)

**Skip this phase if `--quick` mode is set.**

### 2.1 Supabase Performance Advisors

```
mcp__supabase__get_advisors type: "performance"
```

Record all findings with:
- Advisory code
- Severity
- Description
- Remediation URL (as clickable link)

**Common Findings:**
- Missing indexes on frequently queried columns
- Slow queries without proper filters
- Large table scans
- Missing foreign key indexes

---

## Phase 3: Load Baseline

Read previous audit baseline:

```
docs/audits/.baseline/performance.json
```

**Expected baseline structure:**
```json
{
  "lastAudit": "2025-01-08",
  "findings": {
    "critical": [
      {
        "id": "PERF-001",
        "check": "onChange-form-mode",
        "file": "src/atomic-crm/contacts/ContactCreate.tsx",
        "line": 45,
        "description": "Form using onChange mode"
      }
    ],
    "high": [],
    "medium": []
  },
  "totals": {
    "critical": 1,
    "high": 0,
    "medium": 0
  }
}
```

**If baseline doesn't exist:** Treat all findings as new.

---

## Phase 4: Generate Report

Save report to: `docs/audits/YYYY-MM-DD-performance.md`

### Report Template

```markdown
# Performance Audit Report

**Date:** YYYY-MM-DD
**Mode:** Quick | Full | Scoped (path)
**Files Scanned:** N

---

## Delta from Last Audit

| Severity | Previous | Current | Change |
|----------|----------|---------|--------|
| Critical | X | Y | +Z / -Z |
| High | X | Y | +Z / -Z |
| Medium | X | Y | +Z / -Z |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

### New Issues
| ID | Severity | File | Issue |
|----|----------|------|-------|
| PERF-XXX | Critical | path/file.tsx:line | Description |

### Fixed Issues
| ID | Severity | File | Issue |
|----|----------|------|-------|
| PERF-XXX | High | path/file.tsx | Was: Description |

---

## Current Findings

### Critical (Severe Performance Impact)

Issues that cause significant performance degradation.

#### PERF-001: onChange Form Mode
**File:** `src/example/Component.tsx:45`
**Pattern Found:**
\`\`\`tsx
<SimpleForm mode="onChange">
  {/* Re-renders on every keystroke */}
</SimpleForm>
\`\`\`
**Fix:**
\`\`\`tsx
// Use onSubmit (default) or onBlur mode
<SimpleForm mode="onSubmit">
  {/* Only validates/renders on submit */}
</SimpleForm>
\`\`\`

#### PERF-002: watch() Instead of useWatch
**File:** `src/example/Form.tsx:23`
**Pattern Found:**
\`\`\`tsx
const status = watch('status'); // Full form re-render
\`\`\`
**Fix:**
\`\`\`tsx
const status = useWatch({ name: 'status' }); // Isolated subscription
\`\`\`

### High (Noticeable Slowdown)

Issues that noticeably slow down the application.

#### PERF-XXX: Large Bundle Import
**File:** `src/example/utils.ts:1`
**Pattern Found:**
\`\`\`tsx
import _ from 'lodash'; // Imports entire 70KB+ library
\`\`\`
**Fix:**
\`\`\`tsx
import { debounce } from 'lodash-es'; // Tree-shakeable
\`\`\`

#### PERF-010: Non-lazy Resource Components
**File:** `src/App.tsx:15`
**Pattern Found:**
\`\`\`tsx
import { ContactList, ContactEdit } from './contacts';
<Resource name="contacts" list={ContactList} edit={ContactEdit} />
\`\`\`
**Fix:**
\`\`\`tsx
const ContactList = lazy(() => import('./contacts/ContactList'));
const ContactEdit = lazy(() => import('./contacts/ContactEdit'));
<Resource name="contacts" list={ContactList} edit={ContactEdit} />
\`\`\`

### Medium (Optimization Opportunities)

Issues that represent optimization opportunities.

---

## Correct Patterns Reference

### Form Mode (CRITICAL)
\`\`\`tsx
// CORRECT: onSubmit mode (default) - no re-render on each keystroke
<SimpleForm mode="onSubmit">

// CORRECT: onBlur mode for validation feedback
<SimpleForm mode="onBlur">

// WRONG: onChange mode - re-renders on every keystroke
<SimpleForm mode="onChange">
\`\`\`

### Field Watching (CRITICAL)
\`\`\`tsx
// CORRECT: useWatch for isolated subscriptions
const status = useWatch({ name: 'status' });

// WRONG: watch() triggers full form re-render
const status = watch('status');
\`\`\`

### Memoization (HIGH)
\`\`\`tsx
// CORRECT: Memoized callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [deps]);

// CORRECT: Memoized expensive computations
const filtered = useMemo(() => items.filter(x => x.active), [items]);
\`\`\`

### Bundle Size (HIGH)
\`\`\`tsx
// CORRECT: Tree-shakeable imports
import { debounce, throttle } from 'lodash-es';
import { format, parseISO } from 'date-fns';

// WRONG: Full library imports
import _ from 'lodash';
import moment from 'moment';
\`\`\`

### Lazy Loading (HIGH)
\`\`\`tsx
// CORRECT: Lazy load Resource components for code splitting
const ContactList = lazy(() => import('./contacts/ContactList'));
const ContactEdit = lazy(() => import('./contacts/ContactEdit'));
const ContactCreate = lazy(() => import('./contacts/ContactCreate'));

<Resource
  name="contacts"
  list={ContactList}
  edit={ContactEdit}
  create={ContactCreate}
/>

// WRONG: Direct imports load everything upfront
import { ContactList, ContactEdit, ContactCreate } from './contacts';

<Resource
  name="contacts"
  list={ContactList}
  edit={ContactEdit}
  create={ContactCreate}
/>
\`\`\`

### List Optimization (MEDIUM)
\`\`\`tsx
// CORRECT: Memoized list item
export const ContactRow = React.memo(function ContactRow({ contact }) {
  return <tr>...</tr>;
});

// CORRECT: Stable references for props
const styles = useMemo(() => ({ marginTop: 8 }), []);
\`\`\`

---

## MCP Performance Advisors

*(Skipped in quick mode)*

### Supabase Query Performance

| Code | Severity | Description | Remediation |
|------|----------|-------------|-------------|
| [code] | [sev] | [desc] | [URL] |

---

## Recommendations

### Immediate Actions (Critical)
1. [Action 1 - fix onChange form mode]
2. [Action 2 - replace watch() with useWatch()]

### Short-Term (High)
1. [Action - optimize bundle imports]
2. [Action - add memoization]

### Technical Debt (Medium)
1. [Action - remove console.log statements]
2. [Action - wrap list items in React.memo]

---

*Generated by /audit/performance command*
```

---

## Phase 5: Update Baseline

Write updated baseline to `docs/audits/.baseline/performance.json`:

```json
{
  "lastAudit": "YYYY-MM-DD",
  "findings": {
    "critical": [...current critical findings...],
    "high": [...current high findings...],
    "medium": [...current medium findings...]
  },
  "totals": {
    "critical": N,
    "high": N,
    "medium": N
  }
}
```

---

## Phase 6: Create TodoWrite Tasks

Create todos for Critical and High severity findings:

```typescript
TodoWrite([
  // Critical findings first
  {
    content: "[Critical] PERF-001: Replace onChange mode with onSubmit in ContactCreate.tsx:45",
    status: "pending",
    activeForm: "Fixing form re-render in ContactCreate"
  },
  {
    content: "[Critical] PERF-002: Replace watch() with useWatch() in ContactForm.tsx:23",
    status: "pending",
    activeForm: "Replacing watch() with useWatch()"
  },
  // High findings next
  {
    content: "[High] PERF-003: Use tree-shakeable lodash import in utils.ts:1",
    status: "pending",
    activeForm: "Optimizing lodash import"
  }
  // Medium findings are NOT added to todos (fix when convenient)
])
```

---

## Output Summary

After all phases complete, display:

```markdown
## Performance Audit Complete

**Report saved:** docs/audits/YYYY-MM-DD-performance.md
**Baseline updated:** docs/audits/.baseline/performance.json

### Summary
| Severity | Count | Delta |
|----------|-------|-------|
| Critical | X | +/-N |
| High | X | +/-N |
| Medium | X | +/-N |

### Todos Created
- X Critical issues added to todo list
- Y High issues added to todo list

### Next Steps
1. Review report at docs/audits/YYYY-MM-DD-performance.md
2. Work through todos in priority order (Critical first)
3. Re-run audit after fixes: `/audit/performance`
```

---

## Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | Severe performance impact - application becomes unusable | onChange form mode, watch() re-renders |
| **High** | Noticeable slowdown - user perceives delay | Bundle bloat, N+1 queries, missing memoization |
| **Medium** | Optimization opportunity - minor improvements | Inline styles, missing React.memo, console.log |

---

## Quick Reference

### Run Full Audit
```
/audit/performance
/audit/performance --full
```

### Run Quick Audit (rg checks only)
```
/audit/performance --quick
```

### Audit Specific Directory
```
/audit/performance src/atomic-crm/contacts
/audit/performance --quick src/atomic-crm/forms
```

---

## Related Skills

- `stale-state` audit - Cache invalidation patterns
- `deep-audit` - Comprehensive full-stack audit
- `verification-before-completion` - Evidence-based completion claims
