# Atomic CRM Audit Remediation Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read `docs/claude/engineering-constitution.md`
> 2. **THEN:** Use `/atomic-crm-constitution` to verify each task
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** Remediate 20 findings from the comprehensive audit, achieving 90+ score from current 79/100.

---

## Design Decisions (Code Review Incorporated)

The following decisions were made based on code review feedback:

| Issue | Decision |
|-------|----------|
| **Skip link focus** | Anchor links don't move keyboard focus. Added `onClick` handler that calls `focus()` programmatically. |
| **Multiple h1s** | Codebase already has 7+ visible h1s (HealthDashboard, WhatsNew, Settings, Reports, Dashboard). Policy relaxed to "at least one h1" instead of "exactly one". Do NOT add hidden h1 in Layout. |
| **cacheTime occurrences** | Two `cacheTime` at 15 minutes (not one at 5). Both updated to `gcTime`, preserving 15-minute TTL. |
| **Unused imports** | NotificationDropdown snippet cleaned - removed `useEffect`, `useState`, `useCallback` (not needed with React Admin hooks). |
| **Async test race** | Unit test wraps assertion in `waitFor()` since `useGetList` triggers asynchronously. |
| **Duplicate queries** | NotificationBell consolidated from 2 queries to 1. Badge count comes from `total`, refetch triggered on dropdown open. |
| **Real-time updates** | Polling (30s interval) replaces Supabase subscriptions. Acceptable for notifications. True real-time can be added at provider level later. |

---

**Architecture:** Quick-win fixes targeting accessibility (WCAG 2.2 AA), design system violations (semantic colors), and architecture violations (data provider bypass). No new features - only fixing existing violations.

**Tech Stack:** React 19, TypeScript, Tailwind v4, React Admin, Supabase, Playwright (E2E)

**Task Granularity:** standard (5-15 min per task)

**Parallelization:** See dependency map below - Groups A and B can run in parallel.

**Constitution Principles In Play:**
- [x] Error handling (fail fast - NO retry logic)
- [ ] Validation (Zod at API boundary only) - not applicable
- [ ] Form state (derived from schema) - not applicable
- [x] Data access (unified provider only) - Tasks 12-13
- [ ] Types (`interface` for objects, `type` for unions) - not applicable

---

## Task Dependencies

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 2, 3, 4, 5, 6, 7    |
| 2    | None       | 1, 3, 4, 5, 6, 7    |
| 3    | None       | 1, 2, 4, 5, 6, 7    |
| 4    | None       | 1, 2, 3, 5, 6, 7    |
| 5    | None       | 1, 2, 3, 4, 6, 7    |
| 6    | None       | 1, 2, 3, 4, 5, 7    |
| 7    | None       | 1, 2, 3, 4, 5, 6    |
| 8    | None       | 9, 10, 11, 11a, 11b, 11c |
| 9    | None       | 8, 10, 11, 11a, 11b, 11c |
| 10   | None       | 8, 9, 11, 11a, 11b, 11c |
| 11   | None       | 8, 9, 10, 11a, 11b, 11c |
| 11a  | None       | 8, 9, 10, 11, 11b, 11c |
| 11b  | None       | 8, 9, 10, 11, 11a, 11c |
| 11c  | None       | 8, 9, 10, 11, 11a, 11b |
| 12   | None       | 13                  |
| 13   | None       | 12                  |
| 14   | All above  | None                |

**Parallel Groups:**
- **Group A (Quick Wins):** Tasks 1-7 - All independent
- **Group B (Design System):** Tasks 8-11c - All independent
- **Group C (Architecture):** Tasks 12-13 - Independent of each other
- **Group D (Verification):** Task 14 - Depends on all above

---

## GROUP A: QUICK WINS (5-10 min each)

### Task 1: Add aria-label to RefreshButton

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable - no validation needed
- [x] Not applicable - no form defaults
- [x] Not applicable - no data access
- [x] Not applicable - no type definitions

**Files:**
- Modify: `src/components/admin/refresh-button.tsx` (line 14)
- Test: `src/components/admin/__tests__/refresh-button.test.tsx` (create)

**Current State (verified):**
```typescript
// Line 14 - missing aria-label
<Button onClick={handleRefresh} variant="ghost" size="icon" className="hidden sm:inline-flex">
```

**Step 1: Write the failing test**

Create file `src/components/admin/__tests__/refresh-button.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { RefreshButton } from "../refresh-button";

describe("RefreshButton", () => {
  it("has accessible aria-label for screen readers", async () => {
    renderWithAdminContext(<RefreshButton />);

    const button = screen.getByRole("button", { name: /refresh/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName();
  });
});
```

**Step 2: Verify test fails**

```bash
npm test -- src/components/admin/__tests__/refresh-button.test.tsx
```

Expected: FAIL - button not found by accessible name

**Step 3: Implement fix**

Edit `src/components/admin/refresh-button.tsx` line 14:

```typescript
// BEFORE
<Button onClick={handleRefresh} variant="ghost" size="icon" className="hidden sm:inline-flex">

// AFTER
<Button
  onClick={handleRefresh}
  variant="ghost"
  size="icon"
  className="hidden sm:inline-flex"
  aria-label="Refresh"
>
```

**Step 4: Verify test passes**

```bash
npm test -- src/components/admin/__tests__/refresh-button.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/refresh-button.tsx src/components/admin/__tests__/refresh-button.test.tsx
git commit -m "fix(a11y): add aria-label to RefreshButton for screen readers"
```

---

### Task 2: Rename cacheTime to gcTime (React Query v5)

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable - configuration change only
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/products/ProductListFilter.tsx` (lines 27 AND 43)

**Current State (verified via grep):**
```
src/atomic-crm/products/ProductListFilter.tsx:27:      cacheTime: 15 * 60 * 1000,
src/atomic-crm/products/ProductListFilter.tsx:43:      cacheTime: 15 * 60 * 1000,
```

**NOTE:** `cacheTimestamp` in `authProvider.ts` is a DIFFERENT variable (internal cache tracking) - do NOT modify.

**Step 1: Verify ONLY ProductListFilter needs changes**

```bash
grep -rn "cacheTime:" src/
```

Expected output should show ONLY two lines in ProductListFilter.tsx (27 and 43).
The `cacheTimestamp` in authProvider.ts is a different variable for internal cache tracking.

**Step 2: Fix BOTH occurrences (preserve existing 15-minute duration)**

Edit `src/atomic-crm/products/ProductListFilter.tsx`:

```typescript
// BEFORE (line 27) - principals query
cacheTime: 15 * 60 * 1000,

// AFTER
gcTime: 15 * 60 * 1000,

// BEFORE (line 43) - categories query
cacheTime: 15 * 60 * 1000,

// AFTER
gcTime: 15 * 60 * 1000,
```

**IMPORTANT:** There are TWO cacheTime occurrences, both set to 15 minutes. Preserve the 15-minute duration - do NOT change to 5 minutes.

**Step 3: Verify no console warnings**

```bash
npm run dev
# Check browser console for deprecation warnings
```

**Step 4: Commit**

```bash
git add src/atomic-crm/products/ProductListFilter.tsx
git commit -m "fix(deps): rename cacheTime to gcTime for React Query v5 compatibility

Updates both useGetList calls in ProductListFilter to use gcTime
instead of deprecated cacheTime. Preserves existing 15-minute TTL."
```

---

### Task 3: Reduce Sentry Replay Rate

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic - this is configuration
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/main.tsx` (line 37)

**Step 1: Implement fix**

Edit `src/main.tsx` line 37:

```typescript
// BEFORE
replaysSessionSampleRate: import.meta.env.PROD ? 0.3 : 0.1,

// AFTER
replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0.1,
```

Also update the comment on line 36:

```typescript
// BEFORE
// Temporarily higher (0.3) while debugging blank screen issues, reduce to 0.1 after

// AFTER
// Standard rate (0.1 = 10% of sessions)
```

**Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "chore(monitoring): reduce Sentry replay rate from 30% to 10%"
```

---

### Task 4: Add aria-label to Search Inputs

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/components/admin/columns-button.tsx` (line 153)

**Step 1: Implement fix**

Edit `src/components/admin/columns-button.tsx` line 153:

```typescript
// BEFORE
<Input
  value={columnFilter}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
    setColumnFilter(e.target.value);
  }}
  placeholder={translate("ra.action.search_columns", {
    _: "Search columns",
  })}
  className="pr-8"
/>

// AFTER
<Input
  value={columnFilter}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
    setColumnFilter(e.target.value);
  }}
  placeholder={translate("ra.action.search_columns", {
    _: "Search columns",
  })}
  className="pr-8"
  aria-label={translate("ra.action.search_columns", {
    _: "Search columns",
  })}
/>
```

**Step 2: Commit**

```bash
git add src/components/admin/columns-button.tsx
git commit -m "fix(a11y): add aria-label to column search input"
```

---

### Task 5: Fix FormSection Heading Hierarchy

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/components/admin/form/FormSection.tsx` (line 15)
- Test: Check if test exists at `src/components/admin/form/__tests__/FormSection.test.tsx`

**Current State (verified):**
```typescript
// Line 15
<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
```

**Step 1: Check if test file exists**

```bash
ls -la src/components/admin/form/__tests__/FormSection.test.tsx 2>/dev/null || echo "Test file does not exist"
```

**Step 2a: If test exists, update it to verify proper heading level**

Add to `src/components/admin/form/__tests__/FormSection.test.tsx`:

```typescript
it("renders section title as h2 for proper heading hierarchy", () => {
  render(<FormSection title="Test Section">Content</FormSection>);

  const heading = screen.getByRole("heading", { level: 2, name: /test section/i });
  expect(heading).toBeInTheDocument();
});
```

**Step 2b: If test does NOT exist, create it**

Create `src/components/admin/form/__tests__/FormSection.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormSection } from "../FormSection";

describe("FormSection", () => {
  it("renders section title as h2 for proper heading hierarchy", () => {
    render(<FormSection title="Test Section">Content</FormSection>);

    const heading = screen.getByRole("heading", { level: 2, name: /test section/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<FormSection title="Test">Child content here</FormSection>);
    expect(screen.getByText("Child content here")).toBeInTheDocument();
  });

  it("renders optional description", () => {
    render(
      <FormSection title="Test" description="Section description">
        Content
      </FormSection>
    );
    expect(screen.getByText("Section description")).toBeInTheDocument();
  });
});
```

**Step 3: Implement fix**

Edit `src/components/admin/form/FormSection.tsx` line 15:

```typescript
// BEFORE
<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
  {title}
</h3>

// AFTER
<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
  {title}
</h2>
```

**Step 4: Run tests**

```bash
npm test -- src/components/admin/form/__tests__/FormSection.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/admin/form/FormSection.tsx src/components/admin/form/__tests__/FormSection.test.tsx
git commit -m "fix(a11y): change FormSection h3 to h2 for proper heading hierarchy"
```

---

### Task 6: Add Skip-to-Content Link with Focus Management

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/layout/Layout.tsx`
- Test: `tests/e2e/accessibility/skip-link.spec.ts` (create)

**Current State (verified):**
```typescript
// Layout.tsx currently has NO skip link
// main element exists with id="main-content" but no tabIndex
```

**IMPORTANT DESIGN DECISIONS:**

1. **Skip link requires JavaScript focus()** - Anchor links (`#main-content`) navigate but don't move keyboard focus. We must call `focus()` on the target element.

2. **Do NOT add hidden h1 in Layout** - The codebase already has visible h1s in:
   - `src/atomic-crm/dashboard/v3/components/DashboardHeader.tsx`
   - `src/atomic-crm/reports/components/ReportPageShell.tsx`
   - `src/atomic-crm/settings/SettingsLayout.tsx`
   - `src/atomic-crm/admin/HealthDashboard.tsx`
   - `src/atomic-crm/pages/WhatsNew.tsx`
   - `src/atomic-crm/reports/ReportLayout.tsx`

   Adding a second hidden h1 would violate "exactly one h1 per page". Instead, ensure list pages have their own h1 via their components.

**Step 1: Create E2E test directory if it doesn't exist**

```bash
mkdir -p tests/e2e/accessibility
```

**Step 2: Write E2E test**

Create `tests/e2e/accessibility/skip-link.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Accessibility: Skip Link", () => {
  test("skip link navigates to main content and moves focus on Tab + Enter", async ({ page }) => {
    await page.goto("/");

    // First Tab should focus skip link
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /skip to main/i });
    await expect(skipLink).toBeFocused();

    // Enter should activate link AND move focus to main content
    await page.keyboard.press("Enter");

    // Wait for focus to move (the click handler calls focus())
    await page.waitForFunction(() => {
      return document.activeElement?.id === "main-content";
    });

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("page has at least one h1 element", async ({ page }) => {
    await page.goto("/contacts");

    const h1Elements = page.locator("h1");
    const count = await h1Elements.count();

    // At least one h1 required (WCAG 2.4.2)
    // Some pages may have exactly one visible h1, others may have list title
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 3: Implement fix with focus management**

Edit `src/atomic-crm/layout/Layout.tsx`:

```typescript
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Header from "./Header";

/**
 * Root layout component for the CRM application.
 *
 * Keyboard shortcuts are now handled at the component level:
 * - List views: useListKeyboardNavigation hook (Arrow keys, Enter, Cmd+N, Cmd+K)
 * - Slide-overs: useSlideOverState hook (ESC to close)
 * - Toolbar: KeyboardShortcutHints component (tooltip showing available shortcuts)
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  // Handle skip link click - must programmatically focus the target
  // because anchor navigation doesn't move keyboard focus
  const handleSkipLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      // Also scroll into view for visual users
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      {/* Skip link - visible on focus for keyboard users (WCAG 2.4.1) */}
      <a
        href="#main-content"
        onClick={handleSkipLinkClick}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <Header />
      <main
        className="max-w-screen-xl mx-auto pt-4 px-4 pb-16"
        id="main-content"
        tabIndex={-1}
      >
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} MFB Master Food Brokers. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <Notification />
    </>
  );
};
```

**Step 4: Verify list pages have h1 elements**

Run this verification command to check which list files need h1s:

```bash
for f in src/atomic-crm/contacts/ContactList.tsx src/atomic-crm/organizations/OrganizationList.tsx src/atomic-crm/opportunities/OpportunityList.tsx src/atomic-crm/activities/ActivityList.tsx src/atomic-crm/products/ProductList.tsx src/atomic-crm/tasks/TaskList.tsx; do
  if [ -f "$f" ] && ! grep -q "<h1" "$f"; then
    echo "Missing h1: $f"
  fi
done
```

**NOTE:** List pages using `StandardListLayout` or similar components may get their h1 from those components. Check StandardListLayout first before adding h1 to individual list files.

**Step 5: Run E2E test**

```bash
npx playwright test tests/e2e/accessibility/skip-link.spec.ts
```

**Step 6: Commit**

```bash
git add src/atomic-crm/layout/Layout.tsx tests/e2e/accessibility/skip-link.spec.ts
git commit -m "fix(a11y): add skip-to-content link with focus management for WCAG 2.4.1

- Skip link now calls focus() on click to move keyboard focus
- Uses tabIndex={-1} on main element to allow programmatic focus
- Does NOT add duplicate hidden h1 (pages already have visible h1s)"
```

---

### Task 7: Fix Avatar Arbitrary Sizes

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/contacts/Avatar.tsx` (lines 20-25, 33)

**Current State (verified):**
```typescript
// Lines 20-25 - uses arbitrary [20px] and [25px] values
const sizeClass =
  props.width === 20
    ? `w-[20px] h-[20px]`      // ❌ arbitrary value
    : props.width === 25
      ? "w-[25px] h-[25px]"    // ❌ arbitrary value
      : "w-10 h-10";

// Line 33 - uses arbitrary text-[10px]
<AvatarFallback className={size && size < 40 ? "text-[10px]" : "text-sm"}>
```

**Step 1: Implement fix**

Edit `src/atomic-crm/contacts/Avatar.tsx`:

```typescript
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "@/components/ui/avatar";
import { useRecordContext } from "ra-core";

import type { Contact } from "../types";

export const Avatar = (props: {
  record?: Contact;
  width?: 20 | 25 | 40;
  height?: 20 | 25 | 40;
  title?: string;
}) => {
  const record = useRecordContext<Contact>(props);
  // If we come from company page, the record is defined (to pass the company as a prop),
  // but neither of those fields are and this lead to an error when creating contact.
  if (!record?.avatar && !record?.first_name && !record?.last_name) {
    return null;
  }

  const size = props.width || props.height;

  // Use Tailwind scale instead of arbitrary values
  // w-5 = 20px, w-6 = 24px (close to 25), w-10 = 40px
  const sizeClass =
    size === 20
      ? "w-5 h-5"
      : size === 25
        ? "w-6 h-6"
        : "w-10 h-10";

  // Text size using Tailwind scale
  // text-xs (12px) is acceptable substitute for text-[10px]
  const textSizeClass = size && size < 40 ? "text-xs" : "text-sm";

  const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ");
  const altText = fullName ? `${fullName} avatar` : "Contact avatar";

  return (
    <ShadcnAvatar className={sizeClass} title={props.title}>
      <AvatarImage src={record.avatar?.src ?? undefined} alt={altText} />
      <AvatarFallback className={textSizeClass}>
        {record.first_name?.charAt(0).toUpperCase()}
        {record.last_name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};
```

**Step 2: Visual verification**

```bash
npm run dev
# Navigate to contacts list, verify avatars render correctly at all sizes
# Check: Avatar in contact rows (small), Avatar in slide-over (large)
```

**Step 3: Commit**

```bash
git add src/atomic-crm/contacts/Avatar.tsx
git commit -m "fix(design): replace arbitrary pixel sizes with Tailwind scale in Avatar"
```

---

## GROUP B: DESIGN SYSTEM FIXES (10-15 min each)

### Task 8: Fix HealthDashboard Semantic Colors

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/admin/HealthDashboard.tsx` (multiple locations)

**Current State (verified):**
```typescript
// Lines 62-66 - hardcoded color classes
const colorClasses = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};
```

**Step 1: Find all violations**

```bash
grep -n "bg-green\|bg-yellow\|bg-red\|text-green\|text-red" src/atomic-crm/admin/HealthDashboard.tsx
```

Expected locations:
- Lines 62-66: StatusIndicator colorClasses
- Lines ~102-103: MetricCard trend colors
- Lines ~222-228: Progress bar colors
- Lines ~278-294: Alert threshold badges

**Step 2: Implement fixes**

Edit `src/atomic-crm/admin/HealthDashboard.tsx`:

**Fix 1 - StatusIndicator (lines 62-66):**
```typescript
// BEFORE
const colorClasses = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

// AFTER
const colorClasses = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-destructive",
};
```

**Fix 2 - MetricCard trend colors (lines ~102-103):**
```typescript
// BEFORE
{trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
{trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}

// AFTER
{trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
{trend === "down" && <TrendingUp className="h-3 w-3 text-destructive rotate-180" />}
```

**Fix 3 - Progress bar colors (lines ~222-228):**
```typescript
// BEFORE
className={`h-2 ${
  status === "green"
    ? "[&>div]:bg-green-500"
    : status === "yellow"
      ? "[&>div]:bg-yellow-500"
      : "[&>div]:bg-red-500"
}`}

// AFTER
className={`h-2 ${
  status === "green"
    ? "[&>div]:bg-success"
    : status === "yellow"
      ? "[&>div]:bg-warning"
      : "[&>div]:bg-destructive"
}`}
```

**Fix 4 - Alert threshold badges (lines ~278-294):**
```typescript
// BEFORE
<Badge variant="default" className="bg-green-500">
<Badge variant="default" className="bg-yellow-500">

// AFTER
<Badge variant="default" className="bg-success text-success-foreground">
<Badge variant="default" className="bg-warning text-warning-foreground">
```

**Step 3: Verify colors exist in theme**

Check `src/index.css` for `--success` and `--warning` CSS variables:

```bash
grep -n "success\|warning" src/index.css | head -20
```

**Verified:** `--success-default` and `--warning-default` exist in src/index.css. The Tailwind utilities `bg-success`, `text-success`, `bg-warning`, `text-warning` are defined in the `@layer utilities` section.

**Step 4: Visual verification**

```bash
npm run dev
# Navigate to /admin/health and verify colors in both light and dark mode
```

**Step 5: Commit**

```bash
git add src/atomic-crm/admin/HealthDashboard.tsx
git commit -m "fix(design): replace hardcoded colors with semantic tokens in HealthDashboard"
```

---

### Task 9: Fix ActivityList Sentiment Badge Colors

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/activities/ActivityList.tsx` (lines 164-168)

**Current State (verified):**
```typescript
// Lines 164-168
const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
```

**Step 1: Implement fix**

Edit `src/atomic-crm/activities/ActivityList.tsx` lines 164-168:

```typescript
// BEFORE
const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

// AFTER
const sentimentColors: Record<string, string> = {
  positive: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/10 text-destructive",
};
```

**Step 2: Visual verification**

```bash
npm run dev
# Navigate to /activities and verify sentiment badges in light and dark mode
# Check: Positive (green), Neutral (gray), Negative (red) sentiment indicators
```

**Step 3: Commit**

```bash
git add src/atomic-crm/activities/ActivityList.tsx
git commit -m "fix(design): replace hardcoded sentiment colors with semantic tokens"
```

---

### Task 10: Fix ContactImportPreview Semantic Colors

**Depends on:** None - can start immediately

**Note:** This task requires finding and replacing multiple instances. Use grep to locate all occurrences.

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/contacts/ContactImportPreview.tsx`

**Step 1: Find all violations**

```bash
grep -n "text-gray\|bg-gray\|text-green\|bg-green\|text-red\|bg-red" src/atomic-crm/contacts/ContactImportPreview.tsx
```

**Step 2: Replace each occurrence**

| Pattern | Replacement |
|---------|-------------|
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground/70` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-50` | `bg-muted/50` |
| `text-green-*` | `text-success` |
| `bg-green-*` | `bg-success/10` |
| `text-red-*` | `text-destructive` |
| `bg-red-*` | `bg-destructive/10` |

**Step 3: Visual verification**

```bash
npm run dev
# Navigate to /contacts, click Import, verify preview renders correctly
# Check: Import dialog styling, success/error indicators
```

**Step 4: Commit**

```bash
git add src/atomic-crm/contacts/ContactImportPreview.tsx
git commit -m "fix(design): replace hardcoded colors with semantic tokens in ContactImportPreview"
```

---

### Task 11: Fix WhatsNew Page Theme Colors

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/pages/WhatsNew.tsx` (lines 225-331 area)

**Step 1: Find all violations**

```bash
grep -n "bg-blue\|text-blue\|border-blue" src/atomic-crm/pages/WhatsNew.tsx
```

**Step 2: Replace with semantic colors**

| Pattern | Replacement |
|---------|-------------|
| `bg-blue-500` | `bg-primary` |
| `bg-blue-100` | `bg-primary/10` |
| `text-blue-500` | `text-primary` |
| `text-blue-600` | `text-primary` |
| `border-blue-*` | `border-primary` |

**Step 3: Visual verification**

```bash
npm run dev
# Navigate to /whats-new and verify in light and dark mode
```

**Step 4: Commit**

```bash
git add src/atomic-crm/pages/WhatsNew.tsx
git commit -m "fix(design): replace hardcoded blue theme colors with semantic tokens in WhatsNew"
```

---

### Task 11a: Fix OrganizationImportDialog Semantic Colors (NEW)

**Depends on:** None - can start immediately

**Note:** This file was discovered during grep but not in original plan.

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/organizations/OrganizationImportDialog.tsx`

**Current State (verified via grep):**
```
976:                <div className="flex items-center gap-2 text-green-600">
983:                    <div className="text-2xl font-bold text-green-600">
989:                    <div className="text-2xl font-bold text-red-600">
```

**Step 1: Find all violations**

```bash
grep -n "text-green\|text-red\|bg-green\|bg-red" src/atomic-crm/organizations/OrganizationImportDialog.tsx
```

**Step 2: Replace with semantic colors**

| Pattern | Replacement |
|---------|-------------|
| `text-green-600` | `text-success` |
| `text-red-600` | `text-destructive` |
| `bg-green-*` | `bg-success/10` |
| `bg-red-*` | `bg-destructive/10` |

**Step 3: Visual verification**

```bash
npm run dev
# Navigate to /organizations, click Import, verify import results styling
```

**Step 4: Commit**

```bash
git add src/atomic-crm/organizations/OrganizationImportDialog.tsx
git commit -m "fix(design): replace hardcoded colors with semantic tokens in OrganizationImportDialog"
```

---

### Task 11b: Fix ActivityListFilter Semantic Colors (NEW)

**Depends on:** None - can start immediately

**Note:** This file was discovered during grep but not in original plan.

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/activities/ActivityListFilter.tsx`

**Current State (verified via grep):**
```
150:              <Badge variant="default" className="text-xs px-1 py-0 bg-green-600">
```

**Step 1: Find all violations**

```bash
grep -n "bg-green\|text-green" src/atomic-crm/activities/ActivityListFilter.tsx
```

**Step 2: Replace with semantic colors**

```typescript
// BEFORE
<Badge variant="default" className="text-xs px-1 py-0 bg-green-600">

// AFTER
<Badge variant="default" className="text-xs px-1 py-0 bg-success text-success-foreground">
```

**Step 3: Visual verification**

```bash
npm run dev
# Navigate to /activities and check filter badge styling
```

**Step 4: Commit**

```bash
git add src/atomic-crm/activities/ActivityListFilter.tsx
git commit -m "fix(design): replace hardcoded green with semantic token in ActivityListFilter"
```

---

### Task 11c: Fix QuickAddForm Semantic Colors (NEW)

**Depends on:** None - can start immediately

**Note:** This file was discovered during grep but not in original plan.

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx`

**Current State (verified via grep):**
```
152:      <div className="rounded-lg bg-green-50 p-4 space-y-4">
```

**Step 1: Find all violations**

```bash
grep -n "bg-green\|text-green" src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx
```

**Step 2: Replace with semantic colors**

```typescript
// BEFORE
<div className="rounded-lg bg-green-50 p-4 space-y-4">

// AFTER
<div className="rounded-lg bg-success/10 p-4 space-y-4">
```

**Step 3: Visual verification**

```bash
npm run dev
# Navigate to opportunities quick add and verify styling
```

**Step 4: Commit**

```bash
git add src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx
git commit -m "fix(design): replace hardcoded bg-green-50 with semantic token in QuickAddForm"
```

---

## GROUP C: ARCHITECTURE FIXES (15-20 min each)

### Task 12: Refactor NotificationDropdown Through Data Provider

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers - let errors throw
- [x] Not applicable - no validation needed
- [x] Not applicable - no form defaults
- [x] Using unified data provider - THIS IS THE FIX
- [x] Not applicable

**Files:**
- Modify: `src/components/NotificationDropdown.tsx`

**Current State (verified):**
```typescript
// Line 1 - imports React hooks that will be removed
import { useEffect, useState, useCallback } from "react";

// Line 12 - DIRECT SUPABASE IMPORT (VIOLATION)
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

// Lines 41-51 - direct supabase.from() calls
const { data, error } = await supabase
  .from("notifications")
  .select("*")
  ...
```

**Step 1: Understand current violation**

The file imports `supabase` directly on line 12:
```typescript
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
```

This bypasses the unified data provider.

**Step 2: Implement fix using React Admin hooks**

Replace entire file `src/components/NotificationDropdown.tsx`:

```typescript
// NOTE: Removed unused imports (useEffect, useState, useCallback)
// React Admin hooks handle state internally
import { formatDistanceToNow } from "date-fns";
import { Eye, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetIdentity, useGetList, useUpdate, useNotify } from "ra-core";
import { Link } from "react-router-dom";

interface Notification {
  id: number;
  type: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  read: boolean;
  created_at: string;
  user_id: string;
}

interface NotificationDropdownProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const NotificationDropdown = ({ children, onOpenChange }: NotificationDropdownProps) => {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();

  // Use React Admin's useGetList hook - routes through unified data provider
  const { data: notifications = [], isLoading, refetch } = useGetList<Notification>(
    "notifications",
    {
      pagination: { page: 1, perPage: 20 },
      sort: { field: "created_at", order: "DESC" },
      filter: identity?.user_id ? { user_id: identity.user_id } : {},
    },
    { enabled: !!identity?.user_id }
  );

  // Use React Admin's useUpdate hook
  const [update] = useUpdate();

  // Mark single notification as read
  const markAsRead = async (notificationId: number) => {
    if (!identity?.user_id) return;

    update(
      "notifications",
      { id: notificationId, data: { read: true }, previousData: notifications.find(n => n.id === notificationId) },
      {
        onSuccess: () => {
          refetch();
        },
        onError: () => {
          notify("Error marking notification as read", { type: "error" });
        },
      }
    );
  };

  // Mark all notifications as read
  // TODO: Refactor to bulk update via Supabase RPC for better performance
  // Current N+1 pattern (one request per notification) is acceptable for pre-launch
  // but should be optimized post-MVP to use a single database call.
  // See: https://supabase.com/docs/guides/database/functions
  const markAllAsRead = async () => {
    if (!identity?.user_id) return;

    // For bulk update, we need to update each unread notification
    // NOTE: This sends N requests for N unread notifications
    const unreadNotifications = notifications.filter(n => !n.read);

    await Promise.allSettled(
      unreadNotifications.map(notification =>
        update("notifications", {
          id: notification.id,
          data: { read: true },
          previousData: notification,
        })
      )
    );

    refetch();
  };

  // Get entity link
  const getEntityLink = (entityType: string | null, entityId: number | null) => {
    if (!entityType || !entityId) return null;

    const routes: Record<string, string> = {
      task: `/tasks/${entityId}`,
      opportunity: `/opportunities/${entityId}/show`,
      contact: `/contacts/${entityId}/show`,
      organization: `/organizations/${entityId}/show`,
      product: `/products/${entityId}/show`,
    };

    return routes[entityType] || null;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-11 text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  getEntityLink={getEntityLink}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link to="/notifications">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// NotificationItem component remains the same but uses Notification type
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  getEntityLink: (entityType: string | null, entityId: number | null) => string | null;
}

const NotificationItem = ({ notification, onMarkAsRead, getEntityLink }: NotificationItemProps) => {
  const entityLink = getEntityLink(notification.entity_type, notification.entity_id);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors ${
        !notification.read ? "bg-muted/30" : ""
      }`}
    >
      <div
        className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
          !notification.read ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-1">{notification.message}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {entityLink && (
            <>
              <span>•</span>
              <Link
                to={entityLink}
                className="hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                View {notification.entity_type}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>
      {!notification.read && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-11 w-11"
          onClick={() => onMarkAsRead(notification.id)}
          aria-label="Mark as read"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
```

**Step 3: Write unit test**

Create `src/components/__tests__/NotificationDropdown.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { NotificationDropdown } from "../NotificationDropdown";

describe("NotificationDropdown", () => {
  it("uses data provider instead of direct Supabase calls", async () => {
    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      update: vi.fn().mockResolvedValue({ data: {} }),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    };

    renderWithAdminContext(
      <NotificationDropdown>
        <button>Open</button>
      </NotificationDropdown>,
      { dataProvider: mockDataProvider }
    );

    // IMPORTANT: useGetList triggers asynchronously - must wait
    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "notifications",
        expect.any(Object)
      );
    });
  });
});
```

**Step 4: Run test**

```bash
npm test -- src/components/__tests__/NotificationDropdown.test.tsx
```

**Step 5: Verify no direct Supabase imports remain**

```bash
grep -n "from.*supabase" src/components/NotificationDropdown.tsx
# Should return no results
```

**Step 6: Commit**

```bash
git add src/components/NotificationDropdown.tsx src/components/__tests__/NotificationDropdown.test.tsx
git commit -m "refactor(arch): route NotificationDropdown through unified data provider

BREAKING: Removes direct Supabase import in favor of React Admin hooks.
This ensures consistent error handling, logging, and caching through
the unified data provider pattern."
```

---

### Task 13: Refactor NotificationBell Through Data Provider

**Depends on:** None - can start immediately (but logically follows Task 12)

**Constitution Check:**
- [x] No retry logic / circuit breakers - let errors throw
- [x] Not applicable
- [x] Not applicable
- [x] Using unified data provider - THIS IS THE FIX
- [x] Not applicable

**Files:**
- Modify: `src/components/NotificationBell.tsx`

**Current State (verified):**
```typescript
// Line 4 - DIRECT SUPABASE IMPORT (VIOLATION)
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

// Lines 16-26 - direct supabase.from() for initial count
// Lines 35-62 - Supabase real-time subscription (will replace with polling)
```

**Step 1: Implement fix**

Replace entire file `src/components/NotificationBell.tsx`:

```typescript
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetIdentity, useGetList } from "ra-core";
import { NotificationDropdown } from "./NotificationDropdown";

interface Notification {
  id: number;
  read: boolean;
  user_id: string;
}

export const NotificationBell = () => {
  const { data: identity, isLoading } = useGetIdentity();

  // SINGLE query for unread count - routes through unified data provider
  // Fetches only one record (perPage: 1) to minimize data transfer while
  // getting the total count from the response metadata
  const { total: unreadCount = 0, refetch } = useGetList<Notification>(
    "notifications",
    {
      pagination: { page: 1, perPage: 1 },
      filter: identity?.user_id
        ? { user_id: identity.user_id, read: false }
        : {},
    },
    {
      enabled: !!identity?.user_id && !isLoading,
      // Refetch every 30 seconds for real-time-ish updates
      refetchInterval: 30000,
    }
  );

  // NOTE: Consolidated to SINGLE query. Previous implementation had two
  // identical queries - one for data (unused) and one for count.
  // Now we use the `total` from one query for the badge count,
  // and pass `refetch` to NotificationDropdown to refresh on open.

  // Accessible label
  const ariaLabel = unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications";

  return (
    <NotificationDropdown onOpenChange={(open) => open && refetch()}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={ariaLabel}
        className="relative min-h-[44px] min-w-[44px]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </NotificationDropdown>
  );
};
```

**Key changes from original:**
1. **Single query** - Removed duplicate query that was double-firing every interval
2. **refetch on open** - Only refetch when dropdown opens (`open && refetch()`)
3. **Polling at 30s** - Provides near-real-time without Supabase subscriptions
4. **Removed real-time subscription** - Replaced with polling (acceptable for notifications)

**Note:** Real-time subscriptions removed. For true real-time, consider:
1. Adding subscription support at the data provider level
2. Using React Admin's real-time features if configured
3. Current polling (30s) is acceptable for notifications

**Step 2: Verify no direct Supabase imports**

```bash
grep -n "from.*supabase" src/components/NotificationBell.tsx
# Should return no results
```

**Step 3: Commit**

```bash
git add src/components/NotificationBell.tsx
git commit -m "refactor(arch): route NotificationBell through unified data provider

Removes direct Supabase import. Uses polling for updates instead of
real-time subscriptions (30s interval). Real-time can be added at
the data provider level if needed."
```

---

## GROUP D: VERIFICATION

### Task 14: Run Full Test Suite and Accessibility Audit

**Depends on:** All above tasks

**Files:**
- No modifications - verification only

**Step 1: Run unit tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run E2E tests**

```bash
npx playwright test
```

Expected: All tests pass

**Step 3: Run accessibility-specific tests**

```bash
npx playwright test tests/e2e/accessibility/
```

Expected: All accessibility tests pass

**Step 4: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 5: Visual verification checklist**

- [ ] Navigate to all pages, verify no console errors
- [ ] Test light mode and dark mode
- [ ] Verify skip link works (Tab from page load)
- [ ] Verify h1 exists on each page (DevTools → Elements → search "h1")
- [ ] Test NotificationBell loads and shows count
- [ ] Test NotificationDropdown opens and displays notifications
- [ ] Verify HealthDashboard colors in both themes
- [ ] Verify ActivityList sentiment badges
- [ ] Verify ContactImportPreview styling
- [ ] Verify OrganizationImportDialog styling
- [ ] Verify QuickAddForm success styling
- [ ] Verify WhatsNew page theme colors

**Step 6: Build verification**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 7: Final commit (if any fixes needed)**

```bash
git add .
git commit -m "fix: address issues found during verification"
```

---

## Resources

**Required Reading:**
- `docs/claude/engineering-constitution.md`: Core principles - READ FIRST

**Related Commands:**
- `/atomic-crm-constitution`: Verify implementation compliance

**Constitution Pattern Files:**
- `resources/error-handling.md`: Fail-fast patterns
- `resources/database-patterns.md`: GRANT + RLS (if RLS verification needed)

**Reference Files:**
- `src/atomic-crm/contacts/ContactList.tsx`: Pattern for list components
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Data provider patterns

**Design System:**
- `src/index.css`: CSS variable definitions for semantic colors
- Semantic color utilities: `bg-success`, `text-success`, `bg-warning`, `text-warning`, `bg-destructive`, `text-destructive`

---

## Acceptance Criteria

| Fix | Acceptance Criteria |
|-----|---------------------|
| Skip link | Tab from page load focuses skip link; Enter moves focus to #main-content; focus() called programmatically |
| Page h1 | Every page has **at least one** h1 (relaxed from "exactly one" - existing visible h1s are valid) |
| Heading hierarchy | No h3 without preceding h2; axe-core passes |
| Semantic colors | No text-gray-*, bg-green-*, bg-red-*, bg-blue-* in changed files; Dark mode correct |
| Data provider | NotificationDropdown/Bell use React Admin hooks, not direct Supabase; Single query for NotificationBell |
| aria-labels | Screen reader announces button purpose; axe-core button-name passes |
| gcTime rename | No console deprecation warnings; Both occurrences fixed; 15-minute TTL preserved |
| Avatar sizes | No arbitrary [20px], [25px], [10px] values; Uses Tailwind scale |

---

## Files Modified Summary

### Group A: Quick Wins (7 tasks)
1. `src/components/admin/refresh-button.tsx` - aria-label
2. `src/atomic-crm/products/ProductListFilter.tsx` - gcTime rename
3. `src/main.tsx` - Sentry rate
4. `src/components/admin/columns-button.tsx` - aria-label
5. `src/components/admin/form/FormSection.tsx` - h3→h2
6. `src/atomic-crm/layout/Layout.tsx` - skip link
7. `src/atomic-crm/contacts/Avatar.tsx` - Tailwind sizes

### Group B: Design System (7 tasks)
8. `src/atomic-crm/admin/HealthDashboard.tsx` - semantic colors
9. `src/atomic-crm/activities/ActivityList.tsx` - sentiment colors
10. `src/atomic-crm/contacts/ContactImportPreview.tsx` - semantic colors
11. `src/atomic-crm/pages/WhatsNew.tsx` - theme colors
11a. `src/atomic-crm/organizations/OrganizationImportDialog.tsx` - semantic colors (NEW)
11b. `src/atomic-crm/activities/ActivityListFilter.tsx` - badge color (NEW)
11c. `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx` - bg color (NEW)

### Group C: Architecture (2 tasks)
12. `src/components/NotificationDropdown.tsx` - data provider
13. `src/components/NotificationBell.tsx` - data provider

### New Test Files
- `src/components/admin/__tests__/refresh-button.test.tsx`
- `src/components/admin/form/__tests__/FormSection.test.tsx` (create or update)
- `src/components/__tests__/NotificationDropdown.test.tsx`
- `tests/e2e/accessibility/skip-link.spec.ts`

---

## Post-Remediation Score Target

After completing all tasks:

| Category | Before | Target |
|----------|--------|--------|
| Accessibility | 14/20 | 18/20 |
| Design System | 10/15 | 14/15 |
| Total | 79/100 | 90+/100 |
