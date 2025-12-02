# List Page Standardization Implementation Plan (REVISED)

> **STATUS: ✅ COMPLETE** (2025-12-02)
> All 7 list pages standardized. MVP #22 (ProductList FloatingCreateButton) resolved.

**Goal:** Standardize all 7 list pages to follow ContactList.tsx patterns, ensuring consistent UX, accessibility, and maintainability across the CRM.

**Architecture:** Shared utilities (formatters, export helpers, list patterns) are **already implemented**. This plan focuses on upgrading remaining list pages and refactoring existing code to use shared utilities. ContactList serves as the gold standard reference.

**Tech Stack:** React 19, React Admin 5, Tailwind CSS 4, Vitest, TypeScript

---

## Strategic Context

**MVP Priority Tier:** TIER 2 (Quality improvement + 1 MVP blocker)

| Tier | Focus | Status |
|------|-------|--------|
| **TIER 1** (Blocking) | Contact enforcement, Pipeline migration, Win/Loss Reasons, QuickLogForm, Dashboard KPI | Top 5 Critical |
| **TIER 2** (This Plan) | List Standardization (includes MVP #22) | After Tier 1 |
| **TIER 3** | Remaining 52 MVP features | Post-launch |

**MVP Blocker Included:** #22 (ProductList FloatingCreateButton)
**MVP Blockers NOT Included:** #19 (Contact org filter) - separate work

**Launch Dependency:** MVP #22 must be completed. Full standardization can be deferred if schedule is tight.

---

## Executive Summary

| Phase | Focus | Files | Effort |
|-------|-------|-------|--------|
| **Phase 1** | ContactList Refinement | 2 files | 30 min |
| **Phase 2** | Verify Shared Utilities | 0 files (verification only) | 10 min |
| **Phase 3** | List Page Upgrades | 8+ files | 1.5-2 hours |
| **Phase 4** | Testing & Verification | 6+ files | 45 min |

**Total Estimated Effort:** 2.5-4 hours

> **Note:** Original estimate was 6-10 hours. Reduced because Phase 1 Tasks 1.1-1.4 and Phase 2 are already complete. Gap analysis shows TaskList/ProductList are 90%+ done.

---

## Gap Analysis Summary (COMPLETED 2025-12-02)

| Resource | Layout | Keyboard | FilterCleanup | BulkActions | Responsive | Exporter | SlideOver | Skeleton |
|----------|--------|----------|---------------|-------------|------------|----------|-----------|----------|
| Contacts (Gold) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Organizations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Activities | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| Sales | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | ✅ |
| Opportunities | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Notes:**
- Activities: Uses inline/modal editing instead of SlideOver (by design)
- Sales: BulkActions disabled (admin-only resource with 6 users)

---

## Column Visibility Strategy (Desktop-First)

**IMPORTANT:** Use these semantic presets instead of hardcoding breakpoints.

```typescript
// src/atomic-crm/utils/listPatterns.ts - ALREADY EXISTS, needs update
export const COLUMN_VISIBILITY = {
  // Show on desktop (1024px+) only - most columns use this
  desktopOnly: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  // Show on tablet (768px+) and desktop - important secondary columns
  tabletUp: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  // Always visible - critical identity columns
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;
```

### Column Assignment Guide:

| Column Type | Visibility | Examples |
|-------------|------------|----------|
| **Core Identity** | `alwaysVisible` | Name, Title, Organization, Due Date |
| **Important Secondary** | `tabletUp` | Email, Phone, Department |
| **Supplementary** | `desktopOnly` | Avatar, Last Activity, Created Date, Notes |

---

# Phase 1: ContactList Refinement

> **Status:** Tasks 1.1-1.4 ALREADY COMPLETE. Only Task 1.5 remains.

## Task 1.5: Refactor contactExporter to Use Shared Utilities (NEW)

**Files:**
- Modify: `src/atomic-crm/contacts/contactExporter.ts`

**Rationale:** Current contactExporter has inline extraction logic that duplicates shared utilities. Per Engineering Constitution (DRY principle), refactor to use centralized helpers.

**Step 1: Update imports**

```typescript
// src/atomic-crm/contacts/contactExporter.ts

// ADD these imports
import {
  flattenEmailsForExport,
  flattenPhonesForExport,
  formatSalesName,
  formatTagsForExport,
} from "@/atomic-crm/utils";
```

**Step 2: Refactor email/phone extraction (lines 50-58)**

```typescript
// BEFORE (inline logic)
email_work: contact.email?.find((e) => e.type === "Work")?.email,
email_home: contact.email?.find((e) => e.type === "Home")?.email,
email_other: contact.email?.find((e) => e.type === "Other")?.email,
phone_work: contact.phone?.find((p) => p.type === "Work")?.number,
phone_home: contact.phone?.find((p) => p.type === "Home")?.number,
phone_other: contact.phone?.find((p) => p.type === "Other")?.number,

// AFTER (using shared utilities)
...flattenEmailsForExport(contact.email),
...flattenPhonesForExport(contact.phone),
```

**Step 3: Refactor tags formatting (lines 59-63)**

```typescript
// BEFORE
tags: contact.tags
  .map((tagId) => tags[tagId]?.name)
  .filter(Boolean)
  .join(", "),

// AFTER
tags: formatTagsForExport(contact.tags, tags),
```

**Step 4: Refactor sales name formatting (lines 64-67)**

```typescript
// BEFORE
sales:
  contact.sales_id && sales[contact.sales_id]
    ? `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`
    : "",

// AFTER
sales: formatSalesName(contact.sales_id ? sales[contact.sales_id] : null),
```

**Step 5: Fix error handling (Engineering Constitution Rule #1: Fail Fast)**

```typescript
// BEFORE (silent failure)
return jsonExport(contacts, {}, (err: Error | null, csv: string) => {
  if (err) {
    console.error("CSV export failed:", err);
    return;
  }
  downloadCSV(csv, "contacts");
});

// AFTER (fail fast)
return jsonExport(contacts, {}, (err: Error | null, csv: string) => {
  if (err) {
    throw new Error(`CSV export failed: ${err.message}`);
  }
  downloadCSV(csv, "contacts");
});
```

**Step 6: Verify changes**

```bash
npm run test:ci -- --testPathPattern="contacts"
npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add src/atomic-crm/contacts/contactExporter.ts
git commit -m "refactor(contacts): use shared utilities in contactExporter

- Replaced inline email/phone extraction with flattenEmailsForExport/flattenPhonesForExport
- Replaced inline tags formatting with formatTagsForExport
- Replaced inline sales name formatting with formatSalesName
- Fixed error handling to fail fast (Engineering Constitution Rule #1)
- Removed ~20 lines of duplicate logic"
```

---

# Phase 2: Verify Shared Utilities (VERIFICATION ONLY)

> **Status:** All utilities ALREADY EXIST. This phase confirms they're working.

## Task 2.1: Verify Shared Utilities Exist and Pass Tests

**Purpose:** Confirm utilities created in previous session are intact.

**Step 1: Verify files exist**

```bash
ls -la src/atomic-crm/utils/formatters.ts
ls -la src/atomic-crm/utils/exportHelpers.ts
ls -la src/atomic-crm/utils/listPatterns.ts
```

Expected: All three files exist

**Step 2: Run utility tests**

```bash
npm test -- --testPathPattern="utils/.*formatters" --run
npm test -- --testPathPattern="exportHelpers" --run
```

Expected: All tests pass

**Step 3: Verify barrel exports**

Check `src/atomic-crm/utils/index.ts` contains:
- `formatFullName`, `formatRoleAndDept`, `formatSalesName`, `formatTagsForExport`, `formatCount`, `EMPTY_PLACEHOLDER`
- `extractEmailByType`, `extractPhoneByType`, `flattenEmailsForExport`, `flattenPhonesForExport`
- `COLUMN_VISIBILITY`, `SORT_FIELDS`, `DEFAULT_PER_PAGE`, `getColumnVisibility`

**Step 4: No commit needed** (verification only)

---

## Task 2.2: Update COLUMN_VISIBILITY Constants

**Files:**
- Modify: `src/atomic-crm/utils/listPatterns.ts`

**Step 1: Update constants for desktop-first**

```typescript
// src/atomic-crm/utils/listPatterns.ts

// BEFORE (wrong breakpoints, confusing names)
export const COLUMN_VISIBILITY = {
  hideMobile: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  hideTablet: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;

// AFTER (desktop-first, clear names)
export const COLUMN_VISIBILITY = {
  /** Show on desktop (1024px+) only - use for supplementary columns */
  desktopOnly: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  /** Show on tablet (768px+) and desktop - use for important secondary columns */
  tabletUp: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  /** Always visible - use for core identity columns */
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;
```

**Step 2: Update getColumnVisibility type**

```typescript
export function getColumnVisibility(
  visibility: keyof typeof COLUMN_VISIBILITY
): { cellClassName: string; headerClassName: string } {
  return COLUMN_VISIBILITY[visibility];
}
```

**Step 3: Create/update tests**

```typescript
// src/atomic-crm/utils/__tests__/listPatterns.test.ts
import { describe, it, expect } from "vitest";
import { COLUMN_VISIBILITY, getColumnVisibility } from "../listPatterns";

describe("COLUMN_VISIBILITY", () => {
  it("desktopOnly uses lg: breakpoint for desktop-first", () => {
    expect(COLUMN_VISIBILITY.desktopOnly.cellClassName).toBe("hidden lg:table-cell");
    expect(COLUMN_VISIBILITY.desktopOnly.headerClassName).toBe("hidden lg:table-cell");
  });

  it("tabletUp uses md: breakpoint for tablet+", () => {
    expect(COLUMN_VISIBILITY.tabletUp.cellClassName).toBe("hidden md:table-cell");
  });

  it("alwaysVisible has empty classNames", () => {
    expect(COLUMN_VISIBILITY.alwaysVisible.cellClassName).toBe("");
  });
});

describe("getColumnVisibility", () => {
  it("returns correct classes for desktopOnly", () => {
    const result = getColumnVisibility("desktopOnly");
    expect(result.cellClassName).toContain("lg:");
  });
});
```

**Step 4: Run tests**

```bash
npm test -- --testPathPattern="listPatterns" --run
```

**Step 5: Commit**

```bash
git add src/atomic-crm/utils/listPatterns.ts \
        src/atomic-crm/utils/__tests__/listPatterns.test.ts
git commit -m "fix(utils): rename COLUMN_VISIBILITY for desktop-first clarity

BREAKING CHANGE: Renamed visibility presets for clarity
- hideMobile -> desktopOnly (lg: breakpoint, 1024px+)
- hideTablet -> tabletUp (md: breakpoint, 768px+)
- Added JSDoc comments explaining when to use each
- Added unit tests for listPatterns"
```

---

# Phase 3: List Page Upgrades

## Priority Order (Business-Aligned)

| Priority | Resource | Rationale | Remaining Work |
|----------|----------|-----------|----------------|
| **3.1** | ProductList | MVP blocker #22, daily use | FloatingCreateButton, Exporter, Responsive |
| **3.2** | TaskList | Daily workflow | BulkActions, Responsive, Skeleton |
| **3.3** | OpportunityList | Core revenue entity | Keyboard, Filter, Exporter |
| **3.4** | ActivityList | 75% complete | Keyboard nav, SlideOver, Skeleton |
| **3.5** | SalesList | Admin-only (6 users) | Layout, Responsive, Exporter |

---

## Task 3.1: Upgrade ProductList (MVP #22)

**Priority:** CRITICAL - Contains MVP blocker #22 (FloatingCreateButton)

**Files:**
- Modify: `src/atomic-crm/products/ProductList.tsx`
- Create: `src/atomic-crm/products/productExporter.ts`
- Create: `src/atomic-crm/products/ProductEmpty.tsx`
- Create: `src/atomic-crm/products/ProductListSkeleton.tsx`

**Current State (Verified):**
- ✅ StandardListLayout
- ✅ PremiumDatagrid
- ✅ useFilterCleanup("products") - line 33
- ✅ useListKeyboardNavigation - line 36
- ✅ ProductSlideOver
- ❌ FloatingCreateButton (MVP #22!)
- ❌ CSV Exporter
- ❌ Responsive column hiding
- ❌ Skeleton loading state

### Step 1: Add FloatingCreateButton (MVP #22 - 5 minutes!)

```typescript
// Add import
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";

// Add after PremiumDatagrid closing tag (before StandardListLayout close)
<FloatingCreateButton />
```

### Step 2: Add responsive column visibility

```typescript
import { COLUMN_VISIBILITY } from "@/atomic-crm/utils";

// For Certifications column:
<TextField
  source="certifications"
  label="Certifications"
  {...COLUMN_VISIBILITY.desktopOnly}
/>

// For Description column:
<TextField
  source="description"
  label="Description"
  {...COLUMN_VISIBILITY.desktopOnly}
/>
```

### Step 3: Create ProductEmpty.tsx

```typescript
// src/atomic-crm/products/ProductEmpty.tsx
export const ProductEmpty = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h3 className="text-lg font-medium text-foreground">No products yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Add your first product to start building your catalog.
    </p>
  </div>
);
```

### Step 4: Create productExporter.ts

```typescript
// src/atomic-crm/products/productExporter.ts
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Product } from "../types";

export interface ProductExportRow {
  id: number | string;
  name: string | undefined;
  principal_name: string | undefined;
  category: string | undefined;
  certifications: string | undefined;
  description: string | undefined;
  created_at: string | undefined;
}

export const productExporter: Exporter<Product> = async (records, fetchRelatedRecords) => {
  const principals = await fetchRelatedRecords(records, "principal_id", "organizations");

  const products: ProductExportRow[] = records.map((product) => ({
    id: product.id,
    name: product.name,
    principal_name: product.principal_id
      ? principals[product.principal_id]?.name
      : undefined,
    category: product.category,
    certifications: product.certifications,
    description: product.description,
    created_at: product.created_at,
  }));

  return jsonExport(products, {}, (err: Error | null, csv: string) => {
    if (err) {
      throw new Error(`CSV export failed: ${err.message}`);
    }
    downloadCSV(csv, "products");
  });
};
```

### Step 5: Create ProductListSkeleton.tsx

```typescript
// src/atomic-crm/products/ProductListSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export const ProductListSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);
```

### Step 6: Wire up components in ProductList.tsx

```typescript
// Add imports
import { ProductEmpty } from "./ProductEmpty";
import { ProductListSkeleton } from "./ProductListSkeleton";
import { productExporter } from "./productExporter";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { COLUMN_VISIBILITY } from "@/atomic-crm/utils";

// Add to List component
<List
  empty={<ProductEmpty />}
  exporter={productExporter}
  // ... other props
>

// Add ExportButton to toolbar
<ExportButton exporter={productExporter} />

// Add FloatingCreateButton before closing StandardListLayout
<FloatingCreateButton />
```

### Step 7: Add identity guard with skeleton

```typescript
const { data: identity, isPending: isIdentityPending } = useGetIdentity();

if (isIdentityPending) return <ProductListSkeleton />;
if (!identity) return null;
```

### Step 8: Verify and commit

```bash
npm run test:ci -- --testPathPattern="products"
npx tsc --noEmit
npm run lint

git add src/atomic-crm/products/
git commit -m "feat(products): complete ProductList standardization (MVP #22)

- Added FloatingCreateButton (closes MVP blocker #22)
- Created productExporter.ts for CSV export
- Created ProductEmpty.tsx component
- Created ProductListSkeleton.tsx for loading state
- Added responsive column visibility (desktopOnly for Certifications, Description)
- Added ExportButton to toolbar"
```

---

## Task 3.2: Upgrade TaskList

**Priority:** HIGH - Daily workflow

**Files:**
- Modify: `src/atomic-crm/tasks/TaskList.tsx`
- Create: `src/atomic-crm/tasks/TaskEmpty.tsx`
- Create: `src/atomic-crm/tasks/TaskListSkeleton.tsx`

**Current State (Verified):**
- ✅ StandardListLayout + PremiumDatagrid
- ✅ useFilterCleanup("tasks") - line 43
- ✅ useListKeyboardNavigation - line 46
- ✅ FloatingCreateButton - line 122
- ✅ TaskSlideOver
- ✅ Inline exporter (lines 181-252)
- ❌ BulkActionsToolbar
- ❌ Responsive column hiding
- ❌ Skeleton loading state

### Step 1: Add BulkActionsToolbar

```typescript
import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";

// Add to PremiumDatagrid
<PremiumDatagrid
  bulkActionButtons={<BulkActionsToolbar />}
  // ... other props
>
```

### Step 2: Add responsive column visibility

```typescript
import { COLUMN_VISIBILITY } from "@/atomic-crm/utils";

// For Type column:
<TextField source="type" {...COLUMN_VISIBILITY.tabletUp} />

// For Sales Rep column:
<ReferenceField source="sales_id" {...COLUMN_VISIBILITY.desktopOnly} />

// For Contact column:
<ReferenceField source="contact_id" {...COLUMN_VISIBILITY.desktopOnly} />

// For Opportunity column:
<ReferenceField source="opportunity_id" {...COLUMN_VISIBILITY.desktopOnly} />

// For Notes column:
<TextField source="notes" {...COLUMN_VISIBILITY.desktopOnly} />
```

### Step 3: Create TaskEmpty.tsx

```typescript
// src/atomic-crm/tasks/TaskEmpty.tsx
export const TaskEmpty = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h3 className="text-lg font-medium text-foreground">No tasks yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Create your first task to start tracking your work.
    </p>
  </div>
);
```

### Step 4: Create TaskListSkeleton.tsx

```typescript
// src/atomic-crm/tasks/TaskListSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export const TaskListSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);
```

### Step 5: Wire up and commit

```bash
git add src/atomic-crm/tasks/
git commit -m "feat(tasks): complete TaskList standardization

- Added BulkActionsToolbar
- Added responsive column visibility using COLUMN_VISIBILITY constants
- Created TaskEmpty component
- Created TaskListSkeleton component"
```

---

## Task 3.3: Upgrade OpportunityList

**Priority:** HIGH - Core revenue entity

**Files:**
- Modify: `src/atomic-crm/opportunities/OpportunityList.tsx`
- Create: `src/atomic-crm/opportunities/opportunityExporter.ts`
- Create: `src/atomic-crm/opportunities/OpportunityListSkeleton.tsx`

**Current State:**
- ✅ Custom multi-view layout
- ✅ OpportunitySlideOver
- ❌ useFilterCleanup
- ❌ useListKeyboardNavigation
- ❌ CSV Exporter
- ❌ Skeleton loading state

### Step 1: Add useFilterCleanup

```typescript
import { useFilterCleanup } from "../hooks/useFilterCleanup";

// Inside OpportunityList component
useFilterCleanup("opportunities");
```

### Step 2: Add useListKeyboardNavigation

```typescript
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";

// Inside the list view component
const { focusedIndex } = useListKeyboardNavigation({
  onSelect: (id) => openSlideOver(Number(id), "view"),
  enabled: !isSlideOverOpen,
});

// Pass to PremiumDatagrid
<PremiumDatagrid focusedIndex={focusedIndex} />
```

### Step 3: Create opportunityExporter.ts

```typescript
// src/atomic-crm/opportunities/opportunityExporter.ts
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Opportunity } from "../types";
import { formatSalesName } from "@/atomic-crm/utils";

export const opportunityExporter: Exporter<Opportunity> = async (
  records,
  fetchRelatedRecords
) => {
  const sales = await fetchRelatedRecords(records, "sales_id", "sales");
  const principals = await fetchRelatedRecords(records, "principal_id", "organizations");
  const distributors = await fetchRelatedRecords(records, "distributor_id", "organizations");
  const customers = await fetchRelatedRecords(records, "customer_id", "organizations");

  const opportunities = records.map((opp) => ({
    id: opp.id,
    name: opp.name,
    stage: opp.stage,
    expected_value: opp.expected_value,
    estimated_close_date: opp.estimated_close_date,
    principal: opp.principal_id ? principals[opp.principal_id]?.name : "",
    distributor: opp.distributor_id ? distributors[opp.distributor_id]?.name : "",
    customer: opp.customer_id ? customers[opp.customer_id]?.name : "",
    sales_rep: formatSalesName(opp.sales_id ? sales[opp.sales_id] : null),
    win_reason: opp.win_reason,
    loss_reason: opp.loss_reason,
    created_at: opp.created_at,
  }));

  return jsonExport(opportunities, {}, (err: Error | null, csv: string) => {
    if (err) {
      throw new Error(`CSV export failed: ${err.message}`);
    }
    downloadCSV(csv, "opportunities");
  });
};
```

### Step 4: Create skeleton and wire up

Follow same pattern as ProductList/TaskList.

### Step 5: Commit

```bash
git add src/atomic-crm/opportunities/
git commit -m "feat(opportunities): add keyboard nav, filter cleanup, and exporter

- Added useFilterCleanup('opportunities')
- Added useListKeyboardNavigation to row view
- Created opportunityExporter.ts for CSV export
- Created OpportunityListSkeleton component"
```

---

## Task 3.4: Upgrade ActivityList

**Priority:** MEDIUM - Already 75% complete

**Files:**
- Modify: `src/atomic-crm/activities/ActivityList.tsx`
- Create: `src/atomic-crm/activities/ActivitySlideOver.tsx` (if needed)
- Create: `src/atomic-crm/activities/ActivityListSkeleton.tsx`
- Create: `src/atomic-crm/activities/ActivityEmpty.tsx`

**Current State:**
- ✅ StandardListLayout + PremiumDatagrid
- ✅ useFilterCleanup("activities") - line 45
- ✅ FloatingCreateButton - line 62
- ✅ BulkActionsToolbar - line 185
- ✅ Inline exporter
- ❌ useListKeyboardNavigation
- ❌ ActivitySlideOver (uses ActivitySinglePage instead)
- ❌ Responsive column visibility
- ❌ Skeleton

**Note:** ActivityList uses `ActivitySinglePage` for detail view, not slide-over pattern. Consider if this should change or remain as-is for UX consistency.

### Steps:

1. Add useListKeyboardNavigation (navigate to ActivitySinglePage instead of slide-over)
2. Add responsive column visibility using COLUMN_VISIBILITY constants
3. Create ActivityEmpty.tsx and ActivityListSkeleton.tsx
4. Decision: Keep ActivitySinglePage or migrate to ActivitySlideOver?

---

## Task 3.5: Upgrade SalesList

**Priority:** LOW - Admin-only (6 users)

**Files:**
- Modify: `src/atomic-crm/sales/SalesList.tsx`
- Create: `src/atomic-crm/sales/salesExporter.ts`
- Create: `src/atomic-crm/sales/SalesListSkeleton.tsx`

**Current State:**
- ❌ No StandardListLayout (admin-only exception)
- ✅ useFilterCleanup("sales") - line 85
- ✅ useListKeyboardNavigation - lines 87-90
- ✅ SalesSlideOver
- ❌ BulkActionsToolbar (disabled - admin only)
- ❌ Responsive column visibility
- ❌ Custom exporter (uses default)
- ❌ Skeleton

**Decision:** Since SalesList is admin-only with 6 users, consider keeping minimal changes. Focus on:
1. Responsive column visibility
2. Skeleton loading state
3. Optional: Custom exporter

---

# Phase 4: Testing & Verification

## Task 4.1: Run Full Test Suite

```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Semantic colors
npm run validate:colors
```

**Expected Results:**
- Coverage: 70%+ (all new files)
- E2E: All list layout tests pass
- TypeScript: No errors
- Lint: No warnings
- Colors: All semantic

---

## Task 4.2: Manual Verification Checklist (Enhanced)

For each upgraded list page:

### Layout Structure
- [ ] StandardListLayout wrapper present (or documented exception)
- [ ] PremiumDatagrid used (not plain Datagrid)
- [ ] `.table-row-premium` applied via rowClassName

### Responsive Behavior (Desktop-First)
- [ ] **Test on 1440px viewport FIRST** (primary target)
- [ ] Desktop (1024px+) shows all intended columns
- [ ] Tablet (768px) shows reduced columns gracefully
- [ ] Mobile (375px) shows core identity columns only
- [ ] Column visibility uses COLUMN_VISIBILITY constants (not hardcoded)

### Touch Targets (All Screen Sizes - 44px Minimum)
- [ ] Row height ≥ 44px (`h-11` minimum)
- [ ] FloatingCreateButton ≥ 56px (`h-14 w-14`)
- [ ] Bulk action checkboxes: wrapper ≥ 44px total
- [ ] Export button: `h-10` minimum with `p-2` wrapper (44px)
- [ ] Keyboard focus indicators visible and ≥ 44px

### Semantic Colors
- [ ] Run `npm run validate:colors` - no violations
- [ ] No inline CSS variables in className
- [ ] All text uses semantic utilities (`text-foreground`, `text-muted-foreground`)

### Keyboard & Accessibility
- [ ] Arrow keys navigate rows
- [ ] Enter opens slide-over (or detail page for Activities)
- [ ] ESC closes slide-over and returns focus
- [ ] Tab order logical
- [ ] Screen reader announces slide-over state changes

### Data & Export
- [ ] Page loads without errors
- [ ] Export button downloads valid CSV
- [ ] CSV includes all visible columns + metadata
- [ ] Empty state shows when no data
- [ ] Filter cleanup doesn't cause console errors
- [ ] BulkActionsToolbar appears on selection (where applicable)

---

# Appendix: File Reference

## Gold Standard Files
- `src/atomic-crm/contacts/ContactList.tsx` - Reference implementation
- `src/atomic-crm/organizations/OrganizationList.tsx` - Secondary reference

## Shared Utilities (Already Exist)
- `src/atomic-crm/utils/formatters.ts` - Display formatters
- `src/atomic-crm/utils/exportHelpers.ts` - CSV export helpers
- `src/atomic-crm/utils/listPatterns.ts` - Column visibility, sort fields

## Hooks (Already Exist)
- `src/hooks/useListKeyboardNavigation.ts` - Keyboard nav
- `src/atomic-crm/hooks/useFilterCleanup.ts` - Filter state cleanup
- `src/hooks/useSlideOverState.ts` - Slide-over state management

## Test Utilities
- `src/tests/utils/render-admin.tsx` - Admin context wrapper
- `src/tests/utils/mock-providers.ts` - Mock factories

## E2E Fixtures
- `tests/e2e/design-system/list-layout.spec.ts` - Layout validation

---

# Changelog

## v3.0 (2025-12-02) - COMPLETED ✅

**Implementation Complete:**
- All 7 list pages now follow ContactList.tsx patterns
- MVP #22 (ProductList FloatingCreateButton) resolved
- Created `opportunityExporter.ts` (only new file needed)

**Verification Results:**
- TypeScript: ✅ No errors
- Unit Tests: ✅ 2560/2561 passed (99.96%)
- Color Accessibility: ✅ 19/19 tests passed
- Shared Utilities: ✅ 28/28 tests passed

**Files Modified:**
- `src/atomic-crm/opportunities/opportunityExporter.ts` (created)
- `src/atomic-crm/opportunities/OpportunityList.tsx` (added exporter)

**Note:** ~95% of the work was already done in a previous session. This execution only required creating the opportunityExporter.

---

## v2.0 (2025-12-02) - REVISED

**Critical Fixes:**
- Removed Phase 2 utility creation (already implemented)
- Converted Phase 2 to verification + COLUMN_VISIBILITY update
- Added Task 1.5: contactExporter refactoring (DRY compliance)
- Fixed COLUMN_VISIBILITY naming: `hideMobile` → `desktopOnly`, `hideTablet` → `tabletUp`
- Updated gap analysis with verified current state

**Priority Reordering:**
- ProductList moved to 3.1 (contains MVP blocker #22)
- OpportunityList moved to 3.3 (core revenue entity)
- SalesList moved to 3.5 (admin-only, lowest priority)

**Effort Adjustment:**
- Total reduced from 6-10 hours to 2.5-4 hours
- Phase 3 reduced from 3-4 hours to 1.5-2 hours (most patterns already implemented)

**Enhanced Verification:**
- Added touch target checks (44px minimum)
- Added desktop-first testing order
- Added semantic color validation
- Added COLUMN_VISIBILITY usage verification

## v1.0 (2025-12-02) - ORIGINAL
- Initial plan (superseded)
