# List Page Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize all 7 list pages to follow ContactList.tsx patterns, ensuring consistent UX, accessibility, and maintainability across the CRM.

**Architecture:** Extract shared utilities (formatters, export helpers, list patterns) first, then systematically upgrade each list page. ContactList serves as the gold standard reference. Apply TDD for all new utilities.

**Tech Stack:** React 19, React Admin 5, Tailwind CSS 4, Vitest, TypeScript

---

## Executive Summary

| Phase | Focus | Files | Effort |
|-------|-------|-------|--------|
| **Phase 1** | ContactList Cleanup | 4 files | 1-2 hours |
| **Phase 2** | Shared Utilities | 4 files | 1-2 hours |
| **Phase 3** | List Page Upgrades | 12+ files | 3-4 hours |
| **Phase 4** | Testing & Verification | 6+ files | 1-2 hours |

**Total Estimated Effort:** 6-10 hours

---

## Gap Analysis Summary

| Resource | Layout | Keyboard | FilterCleanup | BulkActions | Responsive | Exporter | SlideOver | Skeleton |
|----------|--------|----------|---------------|-------------|------------|----------|-----------|----------|
| Contacts (Gold) | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Organizations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Activities | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tasks | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Products | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Sales | ❌ | ❌ | ❌ | Disabled | ❌ | ❌ | ✅ | ❌ |
| Opportunities | Custom | ❌ | ❌ | Partial | Partial | ❌ | ✅ | ❌ |

---

# Phase 1: ContactList Cleanup (Gold Standard)

## Task 1.1: Fix Responsive Breakpoints

**Files:**
- Modify: `src/atomic-crm/contacts/ContactList.tsx:118-119, 186-187`

**Step 1: Edit Avatar column breakpoint**

Change line 118-119 from `md:` to `lg:`:

```typescript
// BEFORE (line 118-119)
cellClassName="hidden md:table-cell"
headerClassName="hidden md:table-cell"

// AFTER
cellClassName="hidden lg:table-cell"
headerClassName="hidden lg:table-cell"
```

**Step 2: Edit Last Activity column breakpoint**

Change line 186-187 from `md:` to `lg:`:

```typescript
// BEFORE (line 186-187)
cellClassName="hidden md:table-cell"
headerClassName="hidden md:table-cell"

// AFTER
cellClassName="hidden lg:table-cell"
headerClassName="hidden lg:table-cell"
```

**Step 3: Verify changes**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/contacts/ContactList.tsx
git commit -m "fix(contacts): use lg breakpoint for Avatar and Last Activity columns

Changed responsive visibility from md:table-cell to lg:table-cell for:
- Avatar column (line 118-119)
- Last Activity column (line 186-187)

Aligns with iPad-first design system (lg: 1024px for desktop)."
```

---

## Task 1.2: Remove Redundant Identity Check

**Files:**
- Modify: `src/atomic-crm/contacts/ContactList.tsx:78, 98-100`

**Step 1: Remove useGetIdentity from ContactListLayout**

Delete line 78:
```typescript
// DELETE THIS LINE
const { data: identity } = useGetIdentity();
```

**Step 2: Remove redundant identity guard**

Delete lines 98-100:
```typescript
// DELETE THESE LINES
if (!identity) {
  return null;
}
```

**Step 3: Verify changes**

Run: `npm run test:ci -- --testPathPattern="contacts"`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/atomic-crm/contacts/ContactList.tsx
git commit -m "refactor(contacts): remove redundant identity check from ContactListLayout

Parent ContactList already guards against missing identity (lines 32, 40-45).
Nested check was redundant and added unnecessary hook overhead."
```

---

## Task 1.3: Create Formatters Module

**Files:**
- Create: `src/atomic-crm/contacts/formatters.ts`
- Create: `src/atomic-crm/contacts/__tests__/formatters.test.ts`
- Modify: `src/atomic-crm/contacts/ContactList.tsx`

**Step 1: Write the failing tests**

Create `src/atomic-crm/contacts/__tests__/formatters.test.ts`:

```typescript
/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { formatFullName, formatRoleAndDept } from "../formatters";

describe("formatFullName", () => {
  it("returns full name when both parts present", () => {
    expect(formatFullName("John", "Doe")).toBe("John Doe");
  });

  it("returns first name only when last name missing", () => {
    expect(formatFullName("John", "")).toBe("John");
    expect(formatFullName("John", null)).toBe("John");
    expect(formatFullName("John", undefined)).toBe("John");
  });

  it("returns last name only when first name missing", () => {
    expect(formatFullName("", "Doe")).toBe("Doe");
    expect(formatFullName(null, "Doe")).toBe("Doe");
  });

  it("returns placeholder when both missing", () => {
    expect(formatFullName("", "")).toBe("--");
    expect(formatFullName(null, null)).toBe("--");
    expect(formatFullName("   ", "   ")).toBe("--");
  });

  it("trims whitespace from names", () => {
    expect(formatFullName("  John  ", "  Doe  ")).toBe("John Doe");
  });
});

describe("formatRoleAndDept", () => {
  it("returns title and department when both present", () => {
    expect(formatRoleAndDept("CEO", "Executive")).toBe("CEO, Executive");
  });

  it("returns title only when department missing", () => {
    expect(formatRoleAndDept("CEO", "")).toBe("CEO");
    expect(formatRoleAndDept("CEO", null)).toBe("CEO");
  });

  it("returns department only when title missing", () => {
    expect(formatRoleAndDept("", "Executive")).toBe("Executive");
    expect(formatRoleAndDept(null, "Executive")).toBe("Executive");
  });

  it("returns placeholder when both missing", () => {
    expect(formatRoleAndDept("", "")).toBe("--");
    expect(formatRoleAndDept(null, null)).toBe("--");
  });

  it("trims whitespace from values", () => {
    expect(formatRoleAndDept("  CEO  ", "  Executive  ")).toBe("CEO, Executive");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="formatters" --run`
Expected: FAIL - module not found

**Step 3: Create formatters.ts**

Create `src/atomic-crm/contacts/formatters.ts`:

```typescript
/**
 * Contact display formatters
 *
 * Reusable formatting functions for contact display fields.
 * Handles null/undefined values gracefully with fallback to "--".
 */

/**
 * Formats a contact's full name from first and last name parts.
 */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (!first && !last) return "--";
  if (!first) return last!;
  if (!last) return first;
  return `${first} ${last}`;
}

/**
 * Formats a contact's role display from title and department.
 */
export function formatRoleAndDept(
  title: string | null | undefined,
  department: string | null | undefined
): string {
  const titleTrimmed = title?.trim();
  const deptTrimmed = department?.trim();

  if (!titleTrimmed && !deptTrimmed) return "--";
  if (!titleTrimmed) return deptTrimmed!;
  if (!deptTrimmed) return titleTrimmed;
  return `${titleTrimmed}, ${deptTrimmed}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="formatters" --run`
Expected: PASS (all 10 tests)

**Step 5: Update ContactList.tsx imports**

Add import at top of file:
```typescript
import { formatFullName, formatRoleAndDept } from "./formatters";
```

**Step 6: Update Name column render (lines 122-134)**

```typescript
// BEFORE
<FunctionField
  label="Name"
  sortBy="first_name"
  render={(record: Contact) => {
    const firstName = record.first_name?.trim();
    const lastName = record.last_name?.trim();
    if (!firstName && !lastName) return "--";
    if (!firstName) return lastName;
    if (!lastName) return firstName;
    return `${firstName} ${lastName}`;
  }}
/>

// AFTER
<FunctionField
  label="Name"
  sortBy="first_name"
  render={(record: Contact) => formatFullName(record.first_name, record.last_name)}
/>
```

**Step 7: Update Role column render (lines 137-150)**

```typescript
// BEFORE
<FunctionField
  label="Role"
  sortBy="title"
  render={(record: Contact) => {
    const title = record.title?.trim();
    const department = record.department?.trim();
    if (!title && !department) return "--";
    if (!title) return department;
    if (!department) return title;
    return `${title}, ${department}`;
  }}
  cellClassName="hidden lg:table-cell"
  headerClassName="hidden lg:table-cell"
/>

// AFTER
<FunctionField
  label="Role"
  sortBy="title"
  render={(record: Contact) => formatRoleAndDept(record.title, record.department)}
  cellClassName="hidden lg:table-cell"
  headerClassName="hidden lg:table-cell"
/>
```

**Step 8: Run all contact tests**

Run: `npm run test:ci -- --testPathPattern="contacts"`
Expected: All tests pass

**Step 9: Commit**

```bash
git add src/atomic-crm/contacts/formatters.ts \
        src/atomic-crm/contacts/__tests__/formatters.test.ts \
        src/atomic-crm/contacts/ContactList.tsx
git commit -m "refactor(contacts): extract formatFullName and formatRoleAndDept to formatters.ts

- Created formatters.ts with fully tested formatting functions
- Added comprehensive unit tests (10 test cases)
- Updated ContactList.tsx to use extracted formatters
- Removed 14 lines of inline formatting logic"
```

---

## Task 1.4: Extract CSV Exporter

**Files:**
- Create: `src/atomic-crm/contacts/contactExporter.ts`
- Modify: `src/atomic-crm/contacts/ContactList.tsx`

**Step 1: Create contactExporter.ts**

Create `src/atomic-crm/contacts/contactExporter.ts`:

```typescript
/**
 * CSV Exporter for Contact records
 */
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Contact, Sale, Tag, Organization } from "../types";

export interface ContactExportRow {
  first_name: string | undefined;
  last_name: string | undefined;
  gender: string | undefined;
  title: string | undefined;
  organization_name: string | undefined;
  email_work: string | undefined;
  email_home: string | undefined;
  email_other: string | undefined;
  phone_work: string | undefined;
  phone_home: string | undefined;
  phone_other: string | undefined;
  avatar: string | undefined;
  first_seen: string | undefined;
  last_seen: string | undefined;
  tags: string;
  linkedin_url: string | null | undefined;
  sales: string;
  department: string;
  id: number | string;
  sales_id: number | string | null | undefined;
  organization_id: number | string | null | undefined;
}

export const contactExporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");
  const organizations = await fetchRelatedRecords<Organization>(
    records,
    "organization_id",
    "organizations"
  );

  const contacts: ContactExportRow[] = records.map((contact) => ({
    first_name: contact.first_name,
    last_name: contact.last_name,
    gender: contact.gender,
    title: contact.title,
    organization_name: contact.organization_id
      ? organizations[contact.organization_id]?.name
      : undefined,
    email_work: contact.email?.find((e) => e.type === "Work")?.email,
    email_home: contact.email?.find((e) => e.type === "Home")?.email,
    email_other: contact.email?.find((e) => e.type === "Other")?.email,
    phone_work: contact.phone?.find((p) => p.type === "Work")?.number,
    phone_home: contact.phone?.find((p) => p.type === "Home")?.number,
    phone_other: contact.phone?.find((p) => p.type === "Other")?.number,
    avatar: contact.avatar,
    first_seen: contact.first_seen,
    last_seen: contact.last_seen,
    tags: contact.tags
      .map((tagId) => tags[tagId]?.name)
      .filter(Boolean)
      .join(", "),
    linkedin_url: contact.linkedin_url,
    sales:
      contact.sales_id && sales[contact.sales_id]
        ? `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`
        : "",
    department: contact.department || "",
    id: contact.id,
    sales_id: contact.sales_id,
    organization_id: contact.organization_id,
  }));

  return jsonExport(contacts, {}, (err: Error | null, csv: string) => {
    if (err) {
      console.error("CSV export failed:", err);
      return;
    }
    downloadCSV(csv, "contacts");
  });
};
```

**Step 2: Update ContactList.tsx imports**

```typescript
// REMOVE these imports
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext } from "ra-core";

// REPLACE with
import { useGetIdentity, useListContext } from "ra-core";
import { contactExporter } from "./contactExporter";
```

**Step 3: Update List component usage**

```typescript
// Change exporter={exporter} to exporter={contactExporter}
<List
  title={false}
  actions={<ContactListActions />}
  perPage={25}
  sort={{ field: "last_seen", order: "DESC" }}
  exporter={contactExporter}  // Changed from exporter
>
```

**Step 4: Update ContactListActions**

```typescript
// Change ExportButton exporter prop
<ExportButton exporter={contactExporter} />  // Changed from exporter
```

**Step 5: Delete inline exporter function**

Remove lines 206-265 (the entire `const exporter: Exporter<Contact>` function).

**Step 6: Verify changes**

Run: `npm run test:ci -- --testPathPattern="contacts"`
Run: `npx tsc --noEmit`
Expected: All pass

**Step 7: Commit**

```bash
git add src/atomic-crm/contacts/contactExporter.ts \
        src/atomic-crm/contacts/ContactList.tsx
git commit -m "refactor(contacts): extract CSV exporter to contactExporter.ts

- Created contactExporter.ts with ContactExportRow interface
- Fixed any type on error callback (now Error | null)
- Removed 60 lines of inline exporter code from ContactList.tsx
- ContactList.tsx now ~200 lines (down from 267)"
```

---

# Phase 2: Shared Utilities

## Task 2.1: Create Shared Formatters Module

**Files:**
- Create: `src/atomic-crm/utils/formatters.ts`
- Create: `src/atomic-crm/utils/__tests__/formatters.test.ts`
- Modify: `src/atomic-crm/utils/index.ts`

**Step 1: Write failing tests**

Create `src/atomic-crm/utils/__tests__/formatters.test.ts`:

```typescript
/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  formatFullName,
  formatRoleAndDept,
  formatSalesName,
  formatTagsForExport,
  formatCount,
  EMPTY_PLACEHOLDER,
} from "../formatters";

describe("formatters", () => {
  describe("EMPTY_PLACEHOLDER", () => {
    it("should be '--'", () => {
      expect(EMPTY_PLACEHOLDER).toBe("--");
    });
  });

  describe("formatFullName", () => {
    it("formats both names", () => {
      expect(formatFullName("John", "Doe")).toBe("John Doe");
    });

    it("handles missing last name", () => {
      expect(formatFullName("John", null)).toBe("John");
    });

    it("handles missing first name", () => {
      expect(formatFullName(null, "Doe")).toBe("Doe");
    });

    it("returns placeholder for both missing", () => {
      expect(formatFullName(null, null)).toBe("--");
    });
  });

  describe("formatSalesName", () => {
    it("formats sales record", () => {
      expect(formatSalesName({ first_name: "John", last_name: "Doe" })).toBe("John Doe");
    });

    it("returns empty for null", () => {
      expect(formatSalesName(null)).toBe("");
    });
  });

  describe("formatTagsForExport", () => {
    it("joins tag names", () => {
      const tagsMap = { 1: { name: "VIP" }, 2: { name: "Hot" } };
      expect(formatTagsForExport([1, 2], tagsMap)).toBe("VIP, Hot");
    });

    it("handles empty array", () => {
      expect(formatTagsForExport([], {})).toBe("");
    });

    it("filters missing tags", () => {
      const tagsMap = { 1: { name: "VIP" } };
      expect(formatTagsForExport([1, 999], tagsMap)).toBe("VIP");
    });
  });

  describe("formatCount", () => {
    it("returns count as-is", () => {
      expect(formatCount(5)).toBe(5);
    });

    it("returns 0 for null", () => {
      expect(formatCount(null)).toBe(0);
    });

    it("returns 0 for undefined", () => {
      expect(formatCount(undefined)).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="utils/.*formatters" --run`
Expected: FAIL

**Step 3: Create formatters.ts**

Create `src/atomic-crm/utils/formatters.ts`:

```typescript
/**
 * formatters.ts - Unified text formatting utilities for list pages
 */
import type { Sale, Tag } from "../types";

export const EMPTY_PLACEHOLDER = "--";

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (!first && !last) return EMPTY_PLACEHOLDER;
  if (first && last) return `${first} ${last}`;
  return first || last || EMPTY_PLACEHOLDER;
}

export function formatRoleAndDept(
  title?: string | null,
  department?: string | null
): string {
  const titleTrimmed = title?.trim();
  const deptTrimmed = department?.trim();

  if (!titleTrimmed && !deptTrimmed) return EMPTY_PLACEHOLDER;
  if (!titleTrimmed) return deptTrimmed!;
  if (!deptTrimmed) return titleTrimmed;
  return `${titleTrimmed}, ${deptTrimmed}`;
}

export function formatSalesName(
  sales?: Pick<Sale, "first_name" | "last_name"> | null
): string {
  if (!sales) return "";
  return formatFullName(sales.first_name, sales.last_name);
}

export function formatTagsForExport(
  tagIds: (number | string)[] | undefined,
  tagsMap: Record<number | string, Pick<Tag, "name">>
): string {
  if (!tagIds || tagIds.length === 0) return "";
  return tagIds
    .map((id) => tagsMap[id]?.name)
    .filter(Boolean)
    .join(", ");
}

export function formatCount(count?: number | null): number {
  return count ?? 0;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="utils/.*formatters" --run`
Expected: PASS

**Step 5: Update barrel export**

Add to `src/atomic-crm/utils/index.ts`:

```typescript
export {
  formatFullName,
  formatRoleAndDept,
  formatSalesName,
  formatTagsForExport,
  formatCount,
  EMPTY_PLACEHOLDER,
} from "./formatters";
```

**Step 6: Commit**

```bash
git add src/atomic-crm/utils/formatters.ts \
        src/atomic-crm/utils/__tests__/formatters.test.ts \
        src/atomic-crm/utils/index.ts
git commit -m "feat(utils): add shared formatters module

- formatFullName, formatRoleAndDept for display
- formatSalesName, formatTagsForExport for CSV export
- formatCount for metric columns
- Full test coverage"
```

---

## Task 2.2: Create Export Helpers Module

**Files:**
- Create: `src/atomic-crm/utils/exportHelpers.ts`
- Create: `src/atomic-crm/utils/__tests__/exportHelpers.test.ts`

**Step 1: Write failing tests**

Create `src/atomic-crm/utils/__tests__/exportHelpers.test.ts`:

```typescript
/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  extractEmailByType,
  extractPhoneByType,
  flattenEmailsForExport,
  flattenPhonesForExport,
} from "../exportHelpers";

describe("exportHelpers", () => {
  describe("extractEmailByType", () => {
    const emails = [
      { email: "work@test.com", type: "Work" as const },
      { email: "home@test.com", type: "Home" as const },
    ];

    it("extracts email by type", () => {
      expect(extractEmailByType(emails, "Work")).toBe("work@test.com");
      expect(extractEmailByType(emails, "Home")).toBe("home@test.com");
    });

    it("returns undefined for missing type", () => {
      expect(extractEmailByType(emails, "Other")).toBeUndefined();
    });

    it("handles undefined array", () => {
      expect(extractEmailByType(undefined, "Work")).toBeUndefined();
    });
  });

  describe("flattenEmailsForExport", () => {
    it("flattens emails to separate keys", () => {
      const emails = [{ email: "work@test.com", type: "Work" as const }];
      const result = flattenEmailsForExport(emails);
      expect(result.email_work).toBe("work@test.com");
      expect(result.email_home).toBeUndefined();
    });
  });

  describe("extractPhoneByType", () => {
    const phones = [{ number: "555-1234", type: "Work" as const }];

    it("extracts phone by type", () => {
      expect(extractPhoneByType(phones, "Work")).toBe("555-1234");
    });

    it("returns undefined for missing type", () => {
      expect(extractPhoneByType(phones, "Home")).toBeUndefined();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="exportHelpers" --run`
Expected: FAIL

**Step 3: Create exportHelpers.ts**

Create `src/atomic-crm/utils/exportHelpers.ts`:

```typescript
/**
 * exportHelpers.ts - CSV export utility functions
 */
import type { EmailAndType, PhoneNumberAndType } from "../types";

export type EmailType = "Work" | "Home" | "Other";
export type PhoneType = "Work" | "Home" | "Other" | "Mobile";

export function extractEmailByType(
  emails: EmailAndType[] | undefined,
  type: EmailType
): string | undefined {
  return emails?.find((e) => e.type === type)?.email;
}

export function extractPhoneByType(
  phones: PhoneNumberAndType[] | undefined,
  type: PhoneType
): string | undefined {
  return phones?.find((p) => p.type === type)?.number;
}

export function flattenEmailsForExport(emails: EmailAndType[] | undefined): {
  email_work?: string;
  email_home?: string;
  email_other?: string;
} {
  return {
    email_work: extractEmailByType(emails, "Work"),
    email_home: extractEmailByType(emails, "Home"),
    email_other: extractEmailByType(emails, "Other"),
  };
}

export function flattenPhonesForExport(phones: PhoneNumberAndType[] | undefined): {
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;
} {
  return {
    phone_work: extractPhoneByType(phones, "Work"),
    phone_home: extractPhoneByType(phones, "Home"),
    phone_other: extractPhoneByType(phones, "Other"),
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="exportHelpers" --run`
Expected: PASS

**Step 5: Update barrel export**

Add to `src/atomic-crm/utils/index.ts`:

```typescript
export {
  extractEmailByType,
  extractPhoneByType,
  flattenEmailsForExport,
  flattenPhonesForExport,
} from "./exportHelpers";
```

**Step 6: Commit**

```bash
git add src/atomic-crm/utils/exportHelpers.ts \
        src/atomic-crm/utils/__tests__/exportHelpers.test.ts \
        src/atomic-crm/utils/index.ts
git commit -m "feat(utils): add CSV export helper utilities

- extractEmailByType, extractPhoneByType for JSONB array access
- flattenEmailsForExport, flattenPhonesForExport for CSV columns
- Full test coverage"
```

---

## Task 2.3: Create List Patterns Module

**Files:**
- Create: `src/atomic-crm/utils/listPatterns.ts`

**Step 1: Create listPatterns.ts**

Create `src/atomic-crm/utils/listPatterns.ts`:

```typescript
/**
 * listPatterns.ts - Common patterns for list page configuration
 */

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

export const SORT_FIELDS = {
  contacts: ["first_name", "last_name", "last_seen"],
  organizations: ["name", "organization_type", "priority"],
  opportunities: ["created_at", "stage", "estimated_close_date"],
  activities: ["activity_date", "type"],
  tasks: ["due_date", "priority", "title"],
  sales: ["first_name", "last_name", "role"],
} as const;

export const DEFAULT_PER_PAGE = {
  default: 25,
  opportunities: 100,
  tasks: 100,
  activities: 50,
} as const;

export function getColumnVisibility(
  visibility: keyof typeof COLUMN_VISIBILITY
): { cellClassName: string; headerClassName: string } {
  return COLUMN_VISIBILITY[visibility];
}
```

**Step 2: Update barrel export**

Add to `src/atomic-crm/utils/index.ts`:

```typescript
export {
  COLUMN_VISIBILITY,
  SORT_FIELDS,
  DEFAULT_PER_PAGE,
  getColumnVisibility,
} from "./listPatterns";
```

**Step 3: Commit**

```bash
git add src/atomic-crm/utils/listPatterns.ts src/atomic-crm/utils/index.ts
git commit -m "feat(utils): add list patterns constants

- COLUMN_VISIBILITY for responsive column hiding
- SORT_FIELDS for resource-specific sort options
- DEFAULT_PER_PAGE for pagination defaults
- getColumnVisibility helper function"
```

---

# Phase 3: List Page Upgrades

## Task 3.1: Upgrade TaskList

**Priority:** HIGH (daily usage, missing essential hooks)

**Files:**
- Modify: `src/atomic-crm/tasks/TaskList.tsx`
- Create: `src/atomic-crm/tasks/TaskEmpty.tsx`
- Create: `src/atomic-crm/tasks/__tests__/TaskList.test.tsx`

**Required Changes:**
1. Add `useFilterCleanup("tasks")` hook
2. Add `useListKeyboardNavigation` hook
3. Add responsive column hiding (lg: breakpoints)
4. Create `TaskEmpty.tsx` component
5. Add `FloatingCreateButton`
6. Add identity guard pattern

**Step 1: Add useFilterCleanup import and call**

```typescript
import { useFilterCleanup } from "../hooks/useFilterCleanup";

// Inside TaskList component, before return:
useFilterCleanup("tasks");
```

**Step 2: Add useListKeyboardNavigation**

```typescript
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";

// Inside TaskListLayout:
const { focusedIndex } = useListKeyboardNavigation({
  onSelect: (id) => openSlideOver(Number(id), "view"),
  enabled: !isSlideOverOpen,
});

// Pass to PremiumDatagrid:
<PremiumDatagrid focusedIndex={focusedIndex} onRowClick={...}>
```

**Step 3: Add responsive column classes**

```typescript
// For less critical columns like Notes, Created:
cellClassName="hidden lg:table-cell"
headerClassName="hidden lg:table-cell"
```

**Step 4: Create TaskEmpty.tsx**

```typescript
export const TaskEmpty = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h3 className="text-lg font-medium text-foreground">No tasks yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Create your first task to start tracking your work.
    </p>
  </div>
);
```

**Step 5: Add FloatingCreateButton**

```typescript
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";

// After PremiumDatagrid:
<FloatingCreateButton />
```

**Step 6: Commit**

```bash
git add src/atomic-crm/tasks/
git commit -m "feat(tasks): standardize TaskList to match ContactList patterns

- Added useFilterCleanup hook
- Added useListKeyboardNavigation hook
- Added responsive column hiding
- Created TaskEmpty component
- Added FloatingCreateButton"
```

---

## Task 3.2: Upgrade ProductList

**Priority:** MEDIUM (good foundation, needs patterns)

**Required Changes:**
1. Add `useFilterCleanup("products")` hook
2. Add `useListKeyboardNavigation` hook
3. Add responsive column hiding
4. Wire up existing `ProductEmpty` component
5. Add typed CSV exporter
6. Add `ExportButton` to toolbar

*[Similar detailed steps as Task 3.1]*

---

## Task 3.3: Upgrade ActivityList

**Priority:** HIGH (needs slide-over architecture)

**Required Changes:**
1. Add `useListKeyboardNavigation` hook
2. Add responsive column hiding
3. Create `ActivityEmpty.tsx` (extract inline JSX)
4. Create `ActivityListSkeleton` component
5. Add `BulkActionsToolbar`
6. Add `ActivitySlideOver` component (major work)

*[Detailed steps for slide-over implementation]*

---

## Task 3.4: Upgrade SalesList

**Priority:** MEDIUM (admin-only, consider exceptions)

**Required Changes:**
1. Add `StandardListLayout` wrapper
2. Add `useFilterCleanup("sales")` hook
3. Add `useListKeyboardNavigation` hook
4. Add responsive column hiding
5. Create `SalesEmpty.tsx` component
6. Add typed CSV exporter

*[Detailed steps]*

---

## Task 3.5: Upgrade OpportunityList (Row View)

**Priority:** MEDIUM (complex multi-view)

**Required Changes:**
1. Add `useFilterCleanup("opportunities")` hook to main component
2. Add `useListKeyboardNavigation` to `OpportunityRowListView.tsx`
3. Add typed CSV exporter
4. Create `OpportunityListSkeleton` component

*[Detailed steps - focus on row view only]*

---

# Phase 4: Testing & Verification

## Task 4.1: Create Missing List Tests

**Files to Create:**
- `src/atomic-crm/tasks/__tests__/TaskList.test.tsx`
- `src/atomic-crm/sales/__tests__/SalesList.test.tsx`
- `src/atomic-crm/products/__tests__/ProductList.test.tsx`

Follow pattern from `OrganizationList.test.tsx`:
- Mock `useListContext`, `useGetIdentity`
- Mock `PremiumDatagrid`, `useSlideOverState`
- Test rendering, row clicks, slide-over integration

---

## Task 4.2: Run Full Test Suite

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

## Task 4.3: Manual Verification Checklist

For each upgraded list page:

- [ ] Page loads without errors
- [ ] PremiumDatagrid renders with hover effects
- [ ] Row click opens slide-over
- [ ] Keyboard navigation works (Arrow keys, Enter)
- [ ] Responsive columns hide at correct breakpoints
- [ ] Export button downloads valid CSV
- [ ] Empty state shows when no data
- [ ] Filter cleanup doesn't cause console errors
- [ ] BulkActionsToolbar appears on selection

---

# Appendix: File Reference

## Gold Standard Files
- `src/atomic-crm/contacts/ContactList.tsx` - Reference implementation
- `src/atomic-crm/organizations/OrganizationList.tsx` - Secondary reference

## Test Utilities
- `src/tests/utils/render-admin.tsx` - Admin context wrapper
- `src/tests/utils/mock-providers.ts` - Mock factories

## Hooks
- `src/hooks/useListKeyboardNavigation.ts` - Already universal
- `src/atomic-crm/hooks/useFilterCleanup.ts` - Already universal
- `src/hooks/useSlideOverState.ts` - Slide-over state management

## E2E Fixtures
- `tests/e2e/design-system/list-layout.spec.ts` - Layout validation
