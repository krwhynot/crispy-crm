# CRM Utility Patterns

Standard patterns for utility functions in Crispy CRM.

## Utility Category Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CRM Utility Categories                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  Text Formatting         │    │  Data Processing                     │  │
│  │  ├─ formatters.ts        │    │  ├─ csvUploadValidator.ts            │  │
│  │  ├─ formatName.ts        │    │  ├─ exportHelpers.ts                 │  │
│  │  └─ formatRelativeTime.ts│    │  └─ levenshtein.ts                   │  │
│  └──────────────────────────┘    └──────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  Business Logic          │    │  Security & Storage                  │  │
│  │  ├─ stalenessCalculation │    │  ├─ secureStorage.ts                 │  │
│  │  ├─ getActivityIcon.tsx* │    │  ├─ rateLimiter.ts                   │  │
│  │  └─ saleOptionRenderer   │    │  └─ safeJsonParse.ts                 │  │
│  └──────────────────────────┘    └──────────────────────────────────────┘  │
│                                                                             │
│  * getActivityIcon.tsx: Returns LucideIcon type (not JSX). Uses .tsx       │
│    extension for TypeScript compatibility with Lucide imports only.        │
│                                                                             │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  List Configuration      │    │  Avatar Processing                   │  │
│  │  └─ listPatterns.ts      │    │  └─ avatar.utils.ts                  │  │
│  └──────────────────────────┘    └──────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                Entry Point
                                    ↓
                              index.ts (barrel)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            CRM Components                  Data Provider
            (List, Edit, Create)           (unifiedDataProvider)
```

---

## Pattern A: Domain Formatters (Name/Text)

For consistent name and text formatting across list views, exports, and displays.

### formatFullName (First + Last)

Use when you have separate first and last name fields:

```tsx
import { formatFullName, EMPTY_PLACEHOLDER } from "@/atomic-crm/utils";

// In a list column or display component
<FunctionField
  source="first_name"
  render={(record) => formatFullName(record.first_name, record.last_name)}
/>

// Returns: "John Doe", "John", "Doe", or "--" if both empty
```

From `formatters.ts:8-15`:
```typescript
export function formatFullName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (!first && !last) return EMPTY_PLACEHOLDER;
  if (first && last) return `${first} ${last}`;
  return first || last || EMPTY_PLACEHOLDER;
}
```

### formatRoleAndDept (Title + Department)

Use for contact role displays:

```tsx
import { formatRoleAndDept } from "@/atomic-crm/utils";

// Returns: "Manager, Sales", "Manager", "Sales", or "--"
formatRoleAndDept(contact.title, contact.department)
```

### formatRelativeTime (Compact Time Display)

Use for table columns showing "last seen" or activity timestamps:

```tsx
import { formatRelativeTime } from "@/atomic-crm/utils";

// Compact output: "now", "5m ago", "2h ago", "3d ago", "Dec 15"
<FunctionField
  source="last_activity_at"
  render={(record) => formatRelativeTime(record.last_activity_at)}
/>
```

From `formatRelativeTime.ts:18-67`:
```typescript
export function formatRelativeTime(date: Date | string | null | undefined): string {
  const locale = getUserLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  // ... progressive time units: seconds → minutes → hours → days → date
}
```

**When to use**: List views, table columns, activity feeds, anywhere compact timestamps are needed.

### ucFirst (Capitalize First Letter)

Use when you need to capitalize the first character of a string:

```tsx
import { ucFirst } from "@/atomic-crm/utils";

// Capitalize first letter
ucFirst("hello")       // "Hello"
ucFirst("HELLO")       // "HELLO"  (only first char affected)
ucFirst("")            // ""
```

From `formatters.ts:51-53`:
```typescript
export function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**When to use**: Formatting relative time strings, display labels, any case normalization where only the first character needs capitalization.

### formatFieldLabel (Snake Case to Title Case)

Use for converting database field names to human-readable labels:

```tsx
import { formatFieldLabel } from "@/atomic-crm/utils";

// Convert snake_case field names to Title Case
formatFieldLabel("first_name")      // "First Name"
formatFieldLabel("last_activity_at") // "Last Activity At"
formatFieldLabel("email")           // "Email"
formatFieldLabel("")                // ""
```

From `formatters.ts:59-62`:
```typescript
export function formatFieldLabel(fieldName: string): string {
  if (!fieldName) return "";
  return fieldName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
```

**When to use**: Dynamic form labels, error message formatting, auto-generated column headers, any UI that displays database field names.

### getInitials (Extract Name Initials)

Use for avatar placeholders when no image is available:

```tsx
import { getInitials } from "@/atomic-crm/utils";

// Extract initials from first and last name
getInitials("John", "Doe")     // "JD"
getInitials("John", null)      // "J"
getInitials(null, "Doe")       // "D"
getInitials(null, null)        // "?"
getInitials("  John  ", "Doe") // "JD" (handles whitespace)
```

From `formatters.ts:69-73`:
```typescript
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim().charAt(0)?.toUpperCase() || "";
  const last = lastName?.trim().charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}
```

**When to use**: Avatar fallbacks, contact list thumbnails, user initials display, anywhere you need compact name representation.

---

## Pattern B: Activity Visualization

For consistent icon mapping of the 13 activity types defined in the CRM domain.

```tsx
import { getActivityIcon } from "@/atomic-crm/utils";

// In an activity list or timeline
const Icon = getActivityIcon(activity.type);
<Icon className="h-4 w-4 text-muted-foreground" />
```

From `getActivityIcon.tsx:43-66`:
```typescript
export function getActivityIcon(activityType: string): LucideIcon {
  const normalizedType = activityType.trim().toLowerCase();

  const iconMap: Record<string, LucideIcon> = {
    call: Phone,
    email: Mail,
    meeting: Users,
    demo: Presentation,
    proposal: FileCheck,
    follow_up: RefreshCw,
    trade_show: Store,
    site_visit: MapPin,
    contract_review: FileSignature,
    check_in: MessageCircle,
    social: Share2,
    note: FileText,
    sample: Package,
  };

  return iconMap[normalizedType] ?? FileText;
}
```

### Activity Type to Icon Mapping

| Activity Type | Icon | Use Case |
|---------------|------|----------|
| `call` | Phone | Phone conversations |
| `email` | Mail | Email correspondence |
| `meeting` | Users | In-person meetings |
| `demo` | Presentation | Product demonstrations |
| `proposal` | FileCheck | Proposal submissions |
| `follow_up` | RefreshCw | Follow-up contacts |
| `trade_show` | Store | Trade show events |
| `site_visit` | MapPin | On-site visits |
| `contract_review` | FileSignature | Contract negotiations |
| `check_in` | MessageCircle | Quick check-ins |
| `social` | Share2 | Social interactions |
| `note` | FileText | General notes |
| `sample` | Package | Sample deliveries |

**When to use**: Activity lists, timelines, opportunity detail views, anywhere activity types are displayed.

---

## Pattern C: CSV/Export Utilities

For flattening complex data structures for CSV export.

### Email/Phone Extraction

```tsx
import { flattenEmailsForExport, flattenPhonesForExport } from "@/atomic-crm/utils";

// Transform nested email/phone arrays for CSV columns
const exportData = contacts.map(contact => ({
  ...contact,
  ...flattenEmailsForExport(contact.email),   // { email_work, email_home, email_other }
  ...flattenPhonesForExport(contact.phone),   // { phone_work, phone_home, phone_other }
}));
```

From `exportHelpers.ts:24-46`:
```typescript
export function flattenEmailsForExport(emails: EmailAndType[] | undefined): {
  email_work?: string;
  email_home?: string;
  email_other?: string;
} {
  return {
    email_work: extractEmailByType(emails, "work"),
    email_home: extractEmailByType(emails, "home"),
    email_other: extractEmailByType(emails, "other"),
  };
}
```

### Tags Export

```tsx
import { formatTagsForExport } from "@/atomic-crm/utils";

// Convert tag IDs to comma-separated names
formatTagsForExport(contact.tag_ids, tagsMap)
// Returns: "VIP, Priority, Hot Lead"
```

**When to use**: CSV export functionality, data transformation for external systems.

---

## Pattern D: Fuzzy Matching (Duplicate Detection) - Types Only

> **⚠️ MIGRATION NOTE**: Levenshtein distance functions (`levenshteinDistance`, `findSimilarOpportunities`) were **moved to PostgreSQL** using the `pg_trgm` extension for better performance on large datasets. Only **type definitions** are now exported from the client-side module.

### Client-Side Types (For PostgreSQL Integration)

```tsx
import type {
  SimilarOpportunity,
  FindSimilarParams,
  SimilarityCheckResult,
} from "@/atomic-crm/utils";

// Types for handling PostgreSQL similarity search results
interface SimilarOpportunity {
  id: string | number;
  name: string;
  stage: string;
  similarity: number;
}

interface FindSimilarParams {
  name: string;
  threshold?: number;
  excludeId?: string | number;
}

interface SimilarityCheckResult {
  hasSimilar: boolean;
  matches: SimilarOpportunity[];
}
```

### PostgreSQL Implementation

Similarity matching now uses `pg_trgm` in Supabase:

```sql
-- Enable extension (one-time)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for fast similarity search
CREATE INDEX idx_opportunities_name_trgm
  ON opportunities USING gin (name gin_trgm_ops);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION find_similar_opportunities(
  search_name TEXT,
  threshold FLOAT DEFAULT 0.3,
  exclude_id UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  name TEXT,
  stage TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.stage,
         similarity(o.name, search_name) AS similarity
  FROM opportunities o
  WHERE o.deleted_at IS NULL
    AND (exclude_id IS NULL OR o.id != exclude_id)
    AND similarity(o.name, search_name) > threshold
  ORDER BY similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### Why PostgreSQL?

| Aspect | Client-Side (Old) | PostgreSQL (New) |
|--------|-------------------|------------------|
| **Performance** | O(n*m) per comparison, all records fetched | Index-based, server-side filtering |
| **Scale** | Slow at 1000+ records | Fast at 100k+ records |
| **Network** | Transfers all records | Returns only matches |
| **Accuracy** | Levenshtein edit distance | Trigram similarity (better for typos) |

**When to use**: Call `supabase.rpc('find_similar_opportunities', ...)` during opportunity create/edit forms.

---

## Pattern E: Rate Limiting

Client-side rate limiting for import operations to prevent abuse.

```tsx
import { contactImportLimiter, organizationImportLimiter } from "@/atomic-crm/utils";

// Before CSV import
if (!contactImportLimiter.canProceed()) {
  notify(`Rate limit exceeded. Try again in ${contactImportLimiter.getResetTimeFormatted()}`, {
    type: "warning"
  });
  return;
}

// Proceed with import...
```

From `rateLimiter.ts:52-82`:
```typescript
export class ClientRateLimiter {
  canProceed(): boolean {
    const state = this.getState();
    const now = Date.now();
    const validRequests = state.requests.filter((time) => now - time < this.config.windowMs);

    if (validRequests.length < this.config.maxRequests) {
      validRequests.push(now);
      this.setState({ requests: validRequests, firstRequest: validRequests[0] });
      return true;
    }
    return false;
  }
}
```

### Pre-configured Limiters

| Limiter | Limit | Window | Storage Key |
|---------|-------|--------|-------------|
| `contactImportLimiter` | 10 imports | 24 hours | `rate_limit_contact_import` |
| `organizationImportLimiter` | 10 imports | 24 hours | `rate_limit_organization_import` |

**When to use**: CSV import operations, bulk data operations, any action vulnerable to abuse.

---

## Pattern F: Secure Storage

Session-first storage with Zod validation for browser persistence.

### Basic Usage

```tsx
import { getStorageItem, setStorageItem, removeStorageItem } from "@/atomic-crm/utils";

// Store filter state (defaults to sessionStorage)
setStorageItem("filter.opportunity_stages", ["new_lead", "initial_outreach"]);

// Retrieve with type safety
const stages = getStorageItem<string[]>("filter.opportunity_stages");

// Clear
removeStorageItem("filter.opportunity_stages");
```

### With Zod Validation

```tsx
import { getStorageItem } from "@/atomic-crm/utils";
import { z } from "zod";

const filterSchema = z.array(z.string()).max(10);
const stages = getStorageItem("filter.stages", { schema: filterSchema });
// Returns null if validation fails (fail-fast principle)
```

From `secureStorage.ts:54-106`:
```typescript
export function getStorageItem<T = unknown>(key: string, options: StorageOptions<T> = {}): T | null {
  const storageType = options.type || "session";
  // ... Tries sessionStorage first, falls back to localStorage for migration
  // ... Validates with Zod schema if provided
}
```

### safeJsonParse (Defense-in-Depth)

```tsx
import { safeJsonParse } from "@/atomic-crm/utils/safeJsonParse";
import { z } from "zod";

const schema = z.array(z.number());
const data = safeJsonParse(localStorage.getItem("key"), schema);
// Returns typed data or null on parse/validation failure
```

**When to use**: Filter persistence, user preferences, any client-side state that needs browser storage.

---

## Pattern G: Staleness Calculation

For determining when opportunities need attention based on PRD-defined thresholds.

```tsx
import {
  isOpportunityStale,
  getDaysSinceActivity,
  countStaleOpportunities,
  filterStaleOpportunities,
  STAGE_STALE_THRESHOLDS,
} from "@/atomic-crm/utils";

// Check single opportunity
const stale = isOpportunityStale(opp.stage, opp.last_activity_at);

// Get days since last touch
const days = getDaysSinceActivity(opp.last_activity_at);

// Dashboard KPIs
const staleCount = countStaleOpportunities(opportunities);

// Filter for stale deals list
const staleDeals = filterStaleOpportunities(opportunities);
```

### Stage-Specific Thresholds (PRD Section 6.3)

From `stalenessCalculation.ts:45-51`:
```typescript
export const STAGE_STALE_THRESHOLDS: Record<ActivePipelineStage, number> = {
  new_lead: 7,          // New leads need quick follow-up
  initial_outreach: 14, // Standard engagement cycle
  sample_visit_offered: 14, // Critical stage where deals stall
  feedback_logged: 21,  // Allow time for evaluation
  demo_scheduled: 14,   // Standard engagement cycle
};
// Closed stages (closed_won, closed_lost) are never stale
```

**When to use**: Dashboard metrics, stale opportunity lists, KPI calculations, alert triggers.

---

## Pattern H: CSV Upload Security

Multi-layer validation for CSV file uploads preventing DoS and injection attacks.

### File Validation (First Layer)

```tsx
import { validateCsvFile, CSV_UPLOAD_LIMITS } from "@/atomic-crm/utils";

const handleFileSelect = async (file: File) => {
  const result = await validateCsvFile(file);

  if (!result.valid) {
    notify(result.errors.map(e => e.message).join("\n"), { type: "error" });
    return;
  }

  if (result.warnings?.length) {
    console.warn("CSV warnings:", result.warnings);
  }

  // Proceed with parsing...
};
```

### PapaParse Security Config (Second Layer)

```tsx
import { getSecurePapaParseConfig, sanitizeCsvValue } from "@/atomic-crm/utils";

Papa.parse(file, {
  ...getSecurePapaParseConfig(),
  complete: (results) => {
    // Data is already sanitized via transform function
  },
});
```

From `csvUploadValidator.ts:166-208`:
```typescript
export function getSecurePapaParseConfig() {
  return {
    header: true,
    dynamicTyping: false, // CRITICAL: Prevent automatic type conversion
    preview: CSV_UPLOAD_LIMITS.MAX_ROWS,
    transform: (value: string) => {
      // Formula injection prevention - prepend single quote
      if (/^[=+\-@\t\r]/.test(trimmed)) {
        return "'" + trimmed;  // Prefix neutralizes formula execution
      }
      // ... length limits, sanitization
    },
  };
}
```

### Formula Injection Prevention (Security Detail)

Spreadsheet applications (Excel, Google Sheets) interpret cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` as formulas. Malicious actors exploit this via:

```csv
first_name,email
=cmd|'/c calc'!A0,hacker@example.com
+1+cmd|'/c calc'!A0,innocent@example.com
```

**Mitigation**: Prefix dangerous values with single quote (`'`):
- `=cmd|'/c calc'!A0` becomes `'=cmd|'/c calc'!A0`
- The single quote is a standard Excel escape that displays the value as literal text

This protection is applied in TWO locations:
1. `getSecurePapaParseConfig().transform` - During PapaParse parsing
2. `sanitizeCsvValue()` - Additional sanitization layer for manual processing

### Duplicate Detection (Third Layer)

```tsx
import { detectDuplicates, formatDuplicateSummary } from "@/atomic-crm/utils";

const result = detectDuplicates(csvContacts, existingContacts);

console.log(formatDuplicateSummary(result));
// Duplicate Detection Summary:
// - Total contacts in file: 100
// - Clean (ready to import): 85
// - Exact duplicates (will skip): 10
// - Possible duplicates (need review): 5
```

### CSV Security Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| `MAX_FILE_SIZE` | 10 MB | DoS prevention |
| `MAX_ROWS` | 10,000 | Memory exhaustion |
| `MAX_CELL_LENGTH` | 1,000 | Field overflow |
| `ALLOWED_EXTENSIONS` | `.csv` | MIME spoofing |

**When to use**: Any CSV import functionality.

---

## Pattern I: Sale Option Renderer

For dropdown display of sales rep records.

```tsx
import { saleOptionRenderer } from "@/atomic-crm/utils";

<SelectInput
  source="assigned_to"
  choices={salesReps}
  optionText={saleOptionRenderer}
/>
```

From `saleOptionRenderer.ts:7-10`:
```typescript
export const saleOptionRenderer = (choice: Sale): string =>
  choice?.first_name || choice?.last_name
    ? `${choice.first_name || ""} ${choice.last_name || ""}`.trim()
    : choice?.email || "--";
```

**Display Priority**: Name → Email → "--"

**When to use**: Sales rep dropdowns, owner fields, any `Sale` type selection.

---

## Pattern J: List Configuration

Semantic utilities for responsive list pages.

### Column Visibility

```tsx
import { COLUMN_VISIBILITY } from "@/atomic-crm/utils";

// Spread directly for type inference
<TextField source="organization" {...COLUMN_VISIBILITY.largeDesktopOnly} />
<TextField source="email" {...COLUMN_VISIBILITY.desktopOnly} />
<TextField source="phone" {...COLUMN_VISIBILITY.tabletUp} />
<TextField source="name" {...COLUMN_VISIBILITY.alwaysVisible} />
```

From `listPatterns.ts:21-42`:
```typescript
export const COLUMN_VISIBILITY = {
  largeDesktopOnly: {
    cellClassName: "hidden xl:table-cell",
    headerClassName: "hidden xl:table-cell",
  },
  desktopOnly: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  tabletUp: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;
```

### Visibility Decision Guide

| Breakpoint | Screen | Visible Columns |
|------------|--------|-----------------|
| < 768px (md) | Mobile | `alwaysVisible` only |
| 768px - 1024px | Tablet | `alwaysVisible` + `tabletUp` |
| 1024px - 1280px | Desktop | `alwaysVisible` + `tabletUp` + `desktopOnly` |
| > 1280px (xl) | Large Desktop | All columns including `largeDesktopOnly` |

### Pagination Defaults

```tsx
import { DEFAULT_PER_PAGE, SORT_FIELDS } from "@/atomic-crm/utils";

<List
  perPage={DEFAULT_PER_PAGE.opportunities} // 100
  sort={{ field: SORT_FIELDS.opportunities[0], order: "DESC" }}
>
```

**When to use**: List page configuration, responsive table design.

---

## Pattern K: Avatar Processing

For generating avatars from email addresses and organization websites.

### Contact Avatar

```tsx
import { getContactAvatar, getGravatarUrl } from "@/atomic-crm/utils/avatar.utils";

// Full strategy: Gravatar → Domain Favicon → null
const avatarUrl = await getContactAvatar(contact);

// Direct Gravatar lookup
const gravatarUrl = await getGravatarUrl(contact.email[0].value);
```

From `avatar.utils.ts:72-103`:
```typescript
export async function getContactAvatar(record: Partial<Contact>): Promise<string | null> {
  for (const { value: email } of record.email) {
    // Step 1: Try Gravatar
    const gravatarUrl = await getGravatarUrl(email);
    // ... check if exists

    // Step 2: Try domain favicon
    const domain = email.split("@")[1];
    const faviconUrl = await getFaviconUrl(domain);
    if (faviconUrl) return faviconUrl;
  }
  return null;
}
```

### Organization Avatar

```tsx
import { getOrganizationAvatar } from "@/atomic-crm/utils/avatar.utils";

// Uses favicon.show service for organization websites
const logo = await getOrganizationAvatar(organization);
// Returns: { src: "https://favicon.show/example.com", title: "Organization favicon" }
```

**When to use**: Contact/organization list avatars, detail page headers, data provider transformations.

---

## Comparison: src/lib vs src/atomic-crm/utils

| Aspect | src/lib/ (Generic) | src/atomic-crm/utils/ (CRM-Specific) |
|--------|-------------------|--------------------------------------|
| **Purpose** | Reusable across any project | Crispy CRM domain logic |
| **Dependencies** | External libs only (clsx, date-fns, DOMPurify) | Domain types, Zod schemas, React Admin hooks |
| **Examples** | `cn()`, `parseDateSafely()`, `sanitizeHtml()` | `formatSalesName()`, `isOpportunityStale()` |
| **Type imports** | None from CRM | `Sale`, `Contact`, `Organization`, etc. |
| **Business rules** | None | PRD thresholds, stage definitions |

### Decision Tree

```
Need a utility?
    │
    ├─ Uses CRM domain types (Sale, Contact, etc.)?
    │   └─ YES → src/atomic-crm/utils/
    │
    ├─ Implements business rules (stages, thresholds)?
    │   └─ YES → src/atomic-crm/utils/
    │
    ├─ Uses React Admin hooks (useNotify, useGetList)?
    │   └─ YES → src/atomic-crm/utils/
    │
    └─ Pure utility, no CRM knowledge needed?
        └─ YES → src/lib/
```

---

## Anti-Patterns

### 1. Duplicate Function Names (RESOLVED)

**Status**: RESOLVED - The naming conflict has been eliminated.

**Previous Problem**: `formatFullName` existed in TWO files with different signatures.

**Resolution Applied**:
- `formatName.ts` function was renamed to `formatSingleName` (with deprecation notice)
- `formatters.ts` retains the canonical `formatFullName(firstName, lastName)` signature
- Barrel export (`index.ts`) now exports only one `formatFullName` from `formatters.ts`

**Current Usage**:

| Scenario | Function | Import From |
|----------|----------|-------------|
| Contact/Sale with `first_name` + `last_name` fields | `formatFullName` | `@/atomic-crm/utils` or `@/atomic-crm/utils/formatters` |
| Organization/Entity with single `name` field | `formatSingleName` | `@/atomic-crm/utils` or `@/atomic-crm/utils/formatName` |

```typescript
// For contacts/sales with separate name fields (CANONICAL)
import { formatFullName } from "@/atomic-crm/utils";

// For single name strings (deprecated but available)
import { formatSingleName } from "@/atomic-crm/utils";
```

### 2. Barrel Export Shadowing (RESOLVED)

**Status**: RESOLVED - No longer an issue.

**Previous Problem**: `index.ts` exported `formatFullName` from both files causing shadowing.

**Resolution Applied**: The `formatName.ts` function was renamed to `formatSingleName`, eliminating the conflict. The barrel now cleanly exports:
- `formatSingleName` from `formatName.ts`
- `formatFullName` from `formatters.ts`

### 3. Mixed File Naming Conventions

**Problem**: Inconsistent naming patterns:
- `formatRelativeTime.ts` - Single function file
- `formatters.ts` - Multiple related functions
- `avatar.utils.ts` - `.utils` suffix

**Resolution**: Follow the majority pattern when adding new files:
- Single-purpose files: `{functionName}.ts` (e.g., `levenshtein.ts`)
- Multi-function files: `{domain}Helpers.ts` or `{domain}Utils.ts`

### 4. Avoid Re-implementing Generic Utilities

**Problem**: Creating CRM-specific versions of generic utilities.

**Wrong**:
```typescript
// Don't create CRM-specific date parsing
function parseCrmDate(date: string): Date { ... }
```

**Right**:
```typescript
// Use the generic utility from src/lib
import { parseDateSafely } from "@/lib/date-utils";
```

---

## Migration Checklist

When adding a new CRM utility:

- [ ] **Location Decision**
  - Uses CRM domain types? → `src/atomic-crm/utils/`
  - Pure/generic utility? → `src/lib/`

- [ ] **File Naming**
  - Single function: `{functionName}.ts`
  - Multiple related: `{domain}Helpers.ts`
  - Avoid `.utils` suffix for new files

- [ ] **Exports**
  - Add to `index.ts` barrel export
  - Check for name conflicts with existing exports
  - Export types alongside functions

- [ ] **Documentation**
  - JSDoc with `@param`, `@returns`, `@example`
  - Include usage context in comments

- [ ] **Testing**
  - Create `__tests__/{filename}.test.ts`
  - Test edge cases: null, undefined, empty strings
  - Test type coercion if applicable

- [ ] **Type Safety**
  - Use Zod for runtime validation at API boundaries
  - Prefer `unknown` over `any` for parsed data
  - Export interfaces for complex return types

- [ ] **Security Review**
  - User input? → Sanitize with Zod or DOMPurify
  - Storage? → Use `secureStorage` with validation
  - External data? → Validate before use

---

## Quick Reference

| Need | Pattern | Import |
|------|---------|--------|
| Format contact name | A | `formatFullName` from `formatters` |
| Format relative time | A | `formatRelativeTime` |
| Capitalize first letter | A | `ucFirst` |
| Snake_case to Title Case | A | `formatFieldLabel` |
| Extract name initials | A | `getInitials` |
| Activity type icon | B | `getActivityIcon` |
| CSV export flattening | C | `flattenEmailsForExport` |
| Duplicate detection types | D | `type SimilarOpportunity` (functions in PostgreSQL) |
| Import rate limiting | E | `contactImportLimiter` |
| Browser storage | F | `getStorageItem`, `setStorageItem` |
| Staleness check | G | `isOpportunityStale` |
| CSV upload security | H | `validateCsvFile` |
| Sales rep display | I | `saleOptionRenderer` |
| Column visibility | J | `COLUMN_VISIBILITY` |
| Avatar generation | K | `getContactAvatar` |
