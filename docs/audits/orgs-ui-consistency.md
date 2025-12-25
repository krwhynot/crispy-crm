# Organizations UI/UX Consistency Audit
Generated: 2025-12-24
Agent: UI/UX Consistency (2 of 3)

## Executive Summary

The Organizations UI currently treats **all 4 organization types identically** in forms and list views. The only type-specific behaviors are:
1. **Distributors** get an extra "Authorizations" tab in the slide-over
2. **Principals** have type-change protection if products are assigned
3. **Filters** show different segment options based on organization type

This is a **significant finding** - the domain model clearly differentiates these types (per CLAUDE.md), but the UI doesn't expose type-specific fields.

---

## 1. Form Fields by Type

### Create Form (OrganizationCompactForm.tsx)

| Field | Principal | Distributor | Customer | Prospect | Notes |
|-------|-----------|-------------|----------|----------|-------|
| **Basic Information** |||||
| name | ✓ Required | ✓ Required | ✓ Required | ✓ Required | Only required field |
| organization_type | ✓ | ✓ | ✓ | ✓ | Via PrincipalAwareTypeInput |
| priority | ✓ | ✓ | ✓ | ✓ | A-D scale, default C |
| **Account & Segment** |||||
| sales_id | ✓ | ✓ | ✓ | ✓ | Account Manager reference |
| segment_id | ✓ | ✓ | ✓ | ✓ | Segment combobox |
| **Location** |||||
| address | ✓ | ✓ | ✓ | ✓ | |
| city | ✓ | ✓ | ✓ | ✓ | |
| state | ✓ | ✓ | ✓ | ✓ | US states combobox |
| postal_code | ✓ | ✓ | ✓ | ✓ | |
| **Additional Details** (collapsed) |||||
| website | ✓ | ✓ | ✓ | ✓ | Auto-prefixes https:// |
| phone | ✓ | ✓ | ✓ | ✓ | |
| linkedin_url | ✓ | ✓ | ✓ | ✓ | Validates LinkedIn domain |
| description | ✓ | ✓ | ✓ | ✓ | Multiline, sanitized |
| **Organization Hierarchy** (collapsed) |||||
| parent_organization_id | ✓ | ✓ | ✓ | ✓ | Autocomplete |
| org_scope | ✓ | ✓ | ✓ | ✓ | national/regional/local |
| is_operating_entity | ✓ | ✓ | ✓ | ✓ | Boolean toggle |

**Key Finding:** All types show identical fields. No type-specific form customization.

### Edit Form Differences

| Aspect | Create Form | Edit Form |
|--------|-------------|-----------|
| Wrapper | `CreateBase` with `FormProgressProvider` | `EditBase` |
| Defaults | Schema-derived + smart defaults | Record data directly |
| Validation | `zodResolver` on useForm | Server-side only |
| Layout | Full-page card | Responsive grid with aside |
| Components | Uses same `OrganizationInputs` | Uses same `OrganizationInputs` |

**Code Reference:** `OrganizationCreate.tsx:245-249` vs `OrganizationEdit.tsx:51`

### Slide-Over Edit Mode (OrganizationDetailsTab.tsx)

The slide-over edit form shows a **subset** of fields:
- name, organization_type, priority
- email, phone, website
- address, city, state, postal_code
- tags (array input)
- context_links (array input)

**Missing from slide-over edit:** segment_id, sales_id, parent_organization_id, org_scope, is_operating_entity, linkedin_url, description

---

## 2. List View by Type

### Columns Shown (OrganizationList.tsx:153-219)

| Column | Principal | Distributor | Customer | Prospect | Visibility |
|--------|-----------|-------------|----------|----------|------------|
| Name | ✓ | ✓ | ✓ | ✓ | Always visible |
| Type | ✓ | ✓ | ✓ | ✓ | Always visible |
| Priority | ✓ | ✓ | ✓ | ✓ | Always visible |
| Parent | ✓ | ✓ | ✓ | ✓ | Hidden on tablet (`lg:table-cell`) |
| Contacts | ✓ | ✓ | ✓ | ✓ | Hidden on mobile (`md:table-cell`) |
| Opportunities | ✓ | ✓ | ✓ | ✓ | Hidden on mobile (`md:table-cell`) |

**Key Finding:** All types show identical columns. No type-specific column configuration.

### Default Sort
- Field: `name`
- Order: `ASC` (ascending)
- **Code Reference:** `OrganizationList.tsx:247`

### Type Badges (OrganizationBadges.tsx)

| Type | Color Class | Theme Color |
|------|-------------|-------------|
| customer | tag-warm | Clay Orange |
| prospect | tag-sage | Olive Green |
| principal | tag-purple | Eggplant |
| distributor | tag-teal | Teal |
| operator | tag-warm | Clay Orange (same as customer) |

---

## 3. Filter Options

### Filter Chip Bar (organizationFilterConfig.ts)

| Filter | Type | Available For | Notes |
|--------|------|---------------|-------|
| organization_type | multiselect | All | 5 choices (customer, prospect, principal, distributor, operator) |
| priority | multiselect | All | A-D choices |
| segment_id | reference | All | References segments table |
| sales_id | reference | All | References sales table |

### Sidebar Filters (OrganizationListFilter.tsx)

**Type-Aware Segment Display:**

```tsx
// OrganizationListFilter.tsx:27-40
const showPlaybookFilters =
  !typeFilter ||
  (Array.isArray(typeFilter)
    ? typeFilter.includes("distributor") || typeFilter.includes("principal")
    : typeFilter === "distributor" || typeFilter === "principal");

const showOperatorFilters =
  !typeFilter ||
  (Array.isArray(typeFilter)
    ? typeFilter.includes("customer") || typeFilter.includes("prospect")
    : typeFilter === "customer" || typeFilter === "prospect");
```

| Segment Filter | Shown For | Not Shown For |
|----------------|-----------|---------------|
| Playbook Categories | Principal, Distributor | Customer, Prospect |
| Operator Segments | Customer, Prospect | Principal, Distributor |
| Account Manager | All | - |

---

## 4. Slide-Over Tabs by Type (OrganizationSlideOver.tsx)

| Tab | Principal | Distributor | Customer | Prospect | Icon |
|-----|-----------|-------------|----------|----------|------|
| Details | ✓ | ✓ | ✓ | ✓ | BuildingIcon |
| Authorizations | ✗ | ✓ | ✗ | ✗ | ShieldCheck |
| Contacts | ✓ | ✓ | ✓ | ✓ | Users |
| Opportunities | ✓ | ✓ | ✓ | ✓ | Target |
| Notes | ✓ | ✓ | ✓ | ✓ | StickyNote |

**Code Reference:** `OrganizationSlideOver.tsx:46-91`

```tsx
// OrganizationSlideOver.tsx:46
const isDistributor = organization?.organization_type === "distributor";

// Line 79-91: Conditionally add Authorizations tab
const tabs: TabConfig[] = isDistributor
  ? [
      ...baseTabs.slice(0, 1), // Details first
      {
        key: "authorizations",
        label: "Authorizations",
        component: AuthorizationsTab,
        icon: ShieldCheck,
      },
      ...baseTabs.slice(1), // Then Contacts, Opportunities, Notes
    ]
  : baseTabs;
```

---

## 5. Validation Rules (organizations.ts)

### Type-Specific Validation

| Rule | Applies To | Message |
|------|------------|---------|
| name required | All | "Organization name is required" |
| name max length | All | "Organization name too long" (255) |
| website URL format | All | "Must be a valid URL" |
| linkedin_url domain | All | "Must be a valid LinkedIn organization URL" |
| All string max lengths | All | Various (50-5000 chars) |

**Key Finding:** NO type-specific validation. All organization types use identical validation rules.

### Principal Type Change Protection (PrincipalAwareTypeInput.tsx)

Special UI-level validation that **blocks changing organization_type from "principal"** if products are assigned:

```tsx
// PrincipalAwareTypeInput.tsx:66-80
if (
  wasPrincipal &&
  previousType === "principal" &&
  currentType !== "principal" &&
  !productsLoading
) {
  if (hasProducts) {
    // Revert the change and show warning
    setAttemptedType(currentType);
    setShowWarning(true);
    setValue("organization_type", "principal", { shouldDirty: false });
    return;
  }
}
```

---

## 6. Consistency Matrix

| Aspect | Principal | Distributor | Customer | Prospect |
|--------|-----------|-------------|----------|----------|
| **Form Fields** | All same | All same | All same | All same |
| **List Columns** | All same | All same | All same | All same |
| **Validation** | All same | All same | All same | All same |
| **Badge Color** | tag-purple | tag-teal | tag-warm | tag-sage |
| **Slide-Over Tabs** | 4 tabs | 5 tabs (+Auth) | 4 tabs | 4 tabs |
| **Type Change** | Protected | Free | Free | Free |
| **Filter Segments** | Playbook | Playbook | Operator | Operator |

---

## 7. Findings

### Critical Inconsistencies

#### 1. Schema/Constants Type Mismatch
**File:** `constants.ts:14` vs `organizations.ts:11`

```typescript
// constants.ts - 5 types
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor" | "operator";

// organizations.ts (Zod) - 4 types
export const organizationTypeSchema = z.enum(["customer", "prospect", "principal", "distributor"]);
```

**Impact:** "operator" type exists in UI choices but would fail Zod validation at API boundary.

#### 2. Duplicate Badge Components
**Files:** `OrganizationBadges.tsx` vs `OrganizationDetailsTab.tsx:222-240`

Both files define `OrganizationTypeBadge` and `PriorityBadge`. The slide-over tab should import from OrganizationBadges.tsx.

#### 3. Slide-Over Edit Missing Fields
**File:** `OrganizationDetailsTab.tsx:61-91`

Missing from slide-over edit mode:
- segment_id (Account Segment)
- sales_id (Account Manager)
- parent_organization_id (Hierarchy)
- org_scope, is_operating_entity (Hierarchy fields)
- linkedin_url
- description

### Missing Type-Specific Patterns

Based on domain model (CLAUDE.md), these fields SHOULD be type-specific:

| Type | Expected Type-Specific Fields | Current State |
|------|-------------------------------|---------------|
| **Principal** | Product count, Product management | None |
| **Distributor** | Vendor codes, Authorization count, Territory | AuthorizationsTab only |
| **Customer** | Order history, Last order date | None |
| **Prospect** | Conversion potential, Lead source | None |

### Hidden Schema Fields

These fields exist in `organizationSchema` but are NOT exposed in the UI:

```typescript
// organizations.ts - Fields hidden from UI per comment on line 145
status: orgStatusSchema.default('active'),
status_reason: orgStatusReasonSchema.nullable().optional(),
billing_street/city/state/postal_code/country,
shipping_street/city/state/postal_code/country,
payment_terms: paymentTermsSchema.nullable().optional(),
credit_limit: z.coerce.number().nonnegative().nullable().optional(),
territory: z.string().max(100).nullable().optional(),
```

**Note:** Line 145 comment states "Status & Payment fields hidden per user feedback"

---

## 8. Recommendations

### Priority 1 - Fix Critical Issues

1. **Sync Zod schema with constants**
   - Add "operator" to `organizationTypeSchema` in `organizations.ts`
   - Or remove "operator" from `ORGANIZATION_TYPE_CHOICES` in `constants.ts`

2. **Deduplicate badge components**
   - Delete local badge definitions in `OrganizationDetailsTab.tsx:222-240`
   - Import from `OrganizationBadges.tsx`

### Priority 2 - Type-Specific Form Improvements

3. **Add conditional form sections:**
   ```tsx
   // Example pattern for type-specific fields
   {organizationType === 'distributor' && (
     <VendorCodeSection />
   )}
   {organizationType === 'principal' && (
     <ProductLineSection />
   )}
   ```

4. **Expose hidden fields for relevant types:**
   - Distributors: billing/shipping addresses, payment_terms, credit_limit
   - Customers: territory, payment_terms
   - All: status, status_reason (for account health tracking)

### Priority 3 - List View Enhancements

5. **Consider type-specific columns:**
   - Principal: Product count column
   - Distributor: Authorization count column
   - Customer/Prospect: Last activity date

6. **Add column visibility controls** to let users customize per type

---

## Verification Checklist

- [x] All 4 org types documented in form matrix
- [x] List view columns documented
- [x] Filter options listed
- [x] Code snippet showing conditional logic (slide-over tabs)
- [x] Inconsistencies section has specific file references
- [x] Output file saved to /docs/audits/orgs-ui-consistency.md
