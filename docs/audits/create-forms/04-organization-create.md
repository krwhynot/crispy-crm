# OrganizationCreate Form Audit

**Audit Date:** 2025-12-15
**Git Branch:** `feature/distributor-organization-modeling`
**Git Commit:** `1cd3fbd3`
**File Path:** `src/atomic-crm/organizations/OrganizationCreate.tsx`
**Zod Schema:** `src/atomic-crm/validation/organizations.ts`

---

## 1. Form Structure Overview

| Property | Value |
|----------|-------|
| Form Type | `CreateBase+Form` (React Admin) |
| Layout Style | Full-page Card with max-width constraint (max-w-4xl) |
| Number of Tabs | N/A |
| Tab Names | N/A |
| Collapsible Sections | YES - 3 sections: Additional Details, Organization Hierarchy, Address |
| Total Fields | 23 (20 visible + 3 hidden system fields) |
| Required Fields | 1 (name) |
| Optional Fields | 22 |
| Loading State | YES - FormLoadingSkeleton during identity fetch (lines 189-197) |
| Error Summary | YES - FormErrorSummary component in OrganizationInputs.tsx:28-32 |
| Tutorial Integration | YES - 4 data-tutorial attributes (org-name, org-type, org-website, org-save-btn) |

**Background:** `bg-muted` with `px-6 py-6` padding
**Card Container:** shadcn/ui `Card` component
**Sections:** 4 (Main fields, Additional Details, Organization Hierarchy, Address)

---

## 2. Default Values Strategy

| Strategy | Implementation |
|----------|---------------|
| Schema-derived defaults | YES - `organizationSchema.partial().parse({})` (line 205) |
| Identity injection | YES - `smartDefaults.sales_id` from useSmartDefaults hook (line 206) |
| Smart defaults hook | YES - `useSmartDefaults()` at line 114 |
| Router state pre-fill | YES - `location.state?.record?.parent_organization_id` for "Add Branch" flows (line 139, 209) |
| Async segment lookup | YES - `useGetList('segments')` to fetch "Unknown" segment (lines 124-136, 208) |

**Code Example (lines 199-211):**
```typescript
// Generate defaults from schema, then merge with runtime values
// Per Constitution #5: FORM STATE DERIVED FROM TRUTH
// Use .partial() to make all fields optional during default generation
// This extracts fields with .default() (organization_type, priority)
const formDefaults = {
  ...organizationSchema.partial().parse({}),
  sales_id: smartDefaults.sales_id, // Identity-based default
  segment_id: unknownSegmentId ?? null, // Async lookup with null fallback
  ...(parentOrgId ? { parent_organization_id: parentOrgId } : {}), // Router state pre-fill
};
```

**Constitution Compliance:** YES - Follows Constitution #5 exactly. Schema is single source of truth, defaults extracted via `.partial().parse({})`, then augmented with runtime values only.

---

## 3. Special Features

| Feature | Present | Implementation |
|---------|---------|----------------|
| Duplicate Detection | YES | `useDuplicateOrgCheck()` hook - soft warning with confirmation dialog, case-insensitive name search (line 117) |
| Transform on Save | YES | `transformValues()` function adds `https://` prefix to website URLs if missing (lines 142-148, 215) |
| Save & Add Another | NO | Single save button only |
| Dirty State Check | NO | No cancel confirmation for unsaved changes |
| Hidden Fields | YES | 3 fields: status='active', billing_country='US', shipping_country='US' (auto-populated from schema defaults) |
| Custom Save Button | YES | `DuplicateCheckSaveButton` component with hidden submit button pattern (lines 47-105) |

**Duplicate Detection Details:**
- **Trigger:** On save button click, before form submission
- **Behavior:** Shows `DuplicateOrgWarningDialog` if duplicate found
- **User Choice:** Confirm to proceed anyway OR cancel to change name
- **Pattern:** Hidden submit button (`type="submit"`) triggered only after duplicate check passes

**URL Transform Details:**
- Website field: If value doesn't start with "http", prepends `https://`
- Applied via `<CreateBase transform={transformValues}>` at line 215

---

## 4. ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  bg-muted padding (px-6 py-6)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ max-w-4xl mx-auto create-form-card                        │  │
│  │ ┌───────────────────────────────────────────────────────┐ │  │
│  │ │ Card > CardContent                                    │ │  │
│  │ │                                                       │ │  │
│  │ │ [Error Summary - if errors exist]                    │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ Organization Name * │ Type                │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌──────────┬──────────────────┬──────────┐           │ │  │
│  │ │ │ Priority │ Account Manager  │ Segment  │           │ │  │
│  │ │ └──────────┴──────────────────┴──────────┘           │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ Street              │ City                │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌─────────────────────┬─────────────────────┐        │ │  │
│  │ │ │ State               │ Zip Code            │        │ │  │
│  │ │ └─────────────────────┴─────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Additional Details              [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Website                                   │        │ │  │
│  │ │ │ Phone                                     │        │ │  │
│  │ │ │ LinkedIn URL                              │        │ │  │
│  │ │ │ Description [multiline]                   │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Organization Hierarchy          [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Parent Organization [autocomplete]        │        │ │  │
│  │ │ │ ┌──────────┬──────────────────────┐       │        │ │  │
│  │ │ │ │ Scope    │ Operating Entity ☐   │       │        │ │  │
│  │ │ │ └──────────┴──────────────────────┘       │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │ ▼ Address                         [Expand]│        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │ │ Street                                    │        │ │  │
│  │ │ │ ┌──────────────────┬──────────────────┐   │        │ │  │
│  │ │ │ │ City             │ State            │   │        │ │  │
│  │ │ │ └──────────────────┴──────────────────┘   │        │ │  │
│  │ │ │ ZIP Code                                  │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ │                                                       │ │  │
│  │ │ ┌───────────────────────────────────────────┐        │ │  │
│  │ │ │           [Cancel] [Create Organization]  │        │ │  │
│  │ │ └───────────────────────────────────────────┘        │ │  │
│  │ └───────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Field Inventory

### Main Section (OrganizationCompactForm lines 15-32)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 1 | `name` | TextInput | YES | `""` | min(1), max(255) | OrganizationCompactForm.tsx:17-22 |
| 2 | `organization_type` | SelectInput | NO | `"prospect"` | enum: customer, prospect, principal, distributor | OrganizationCompactForm.tsx:25-31 |

### Priority & Assignment Row (lines 35-52)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 3 | `priority` | SelectInput | NO | `"C"` | enum: A, B, C, D | OrganizationCompactForm.tsx:36-42 |
| 4 | `sales_id` | ReferenceInput → SelectInput | NO | `smartDefaults.sales_id` | number, nullable | OrganizationCompactForm.tsx:43-50 |
| 5 | `segment_id` | SegmentComboboxInput | NO | `unknownSegmentId ?? null` | uuid, nullable | OrganizationCompactForm.tsx:51 |

### Primary Address Row 1 (lines 54-57)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 6 | `address` | TextInput | NO | `null` | max(500) | OrganizationCompactForm.tsx:55 |
| 7 | `city` | TextInput | NO | `null` | max(100) | OrganizationCompactForm.tsx:56 |

### Primary Address Row 2 (lines 59-62)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 8 | `state` | StateComboboxInput | NO | `null` | max(100) | OrganizationCompactForm.tsx:60 |
| 9 | `postal_code` | TextInput | NO | `null` | max(20) | OrganizationCompactForm.tsx:61 |

### CollapsibleSection: "Additional Details" (lines 64-83, defaultOpen=false)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 10 | `website` | TextInput | NO | `null` | url or empty, transformed with https:// prefix | OrganizationCompactForm.tsx:67 |
| 11 | `phone` | TextInput | NO | `null` | max(30) | OrganizationCompactForm.tsx:69 |
| 12 | `linkedin_url` | TextInput | NO | `null` | LinkedIn domain regex | OrganizationCompactForm.tsx:70-74 |
| 13 | `description` | TextInput (multiline, 3 rows) | NO | `null` | max(5000), sanitized | OrganizationCompactForm.tsx:75-81 |

### OrganizationHierarchySection (lines 85, CollapsibleSection defaultOpen=false)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 14 | `parent_organization_id` | ReferenceInput → AutocompleteInput | NO | `parentOrgId ?? null` | number, nullable, excludes self | ParentOrganizationInput.tsx:13-25 |
| 15 | `org_scope` | SelectInput | NO | `null` | enum: national, regional, local | OrganizationHierarchySection.tsx:13-19 |
| 16 | `is_operating_entity` | BooleanInput | NO | `true` | boolean | OrganizationHierarchySection.tsx:21-25 |

### OrganizationAddressSection (lines 86, CollapsibleSection defaultOpen=false, Title: "Address")

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 17 | `shipping_street` | TextInput | NO | `null` | max(255) | OrganizationAddressSection.tsx:9 |
| 18 | `shipping_city` | TextInput | NO | `null` | max(100) | OrganizationAddressSection.tsx:11 |
| 19 | `shipping_state` | StateComboboxInput | NO | `null` | max(2) | OrganizationAddressSection.tsx:12 |
| 20 | `shipping_postal_code` | TextInput | NO | `null` | max(20) | OrganizationAddressSection.tsx:14 |

### Hidden System Fields (Auto-populated, not in UI)

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 21 | `status` | Hidden | NO | `"active"` | enum: active, inactive | organizations.ts:120 |
| 22 | `billing_country` | Hidden | NO | `"US"` | max(2) | organizations.ts:128 |
| 23 | `shipping_country` | Hidden | NO | `"US"` | max(2) | organizations.ts:135 |

**Total Field Count:** 23 fields

---

## 6. Form Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| `CreateBase` | `ra-core` | Provides mutation context and redirect handling |
| `Form` | `ra-core` | Form wrapper with React Hook Form integration |
| `SaveButton` | `@/components/admin/form` | Submit button (wrapped in DuplicateCheckSaveButton) |
| `CancelButton` | `@/components/admin/cancel-button` | Navigation back to list view |
| `FormErrorSummary` | `@/components/admin/FormErrorSummary` | Validation error display at form top |
| `FormToolbar` | `@/components/admin/simple-form` | Footer layout container |
| `FormLoadingSkeleton` | `@/components/admin/form` | Loading state during identity fetch |
| `CompactFormRow` | `@/components/admin/form/CompactFormRow` | Responsive 2-column grid layout (4 uses) |
| `CollapsibleSection` | `@/components/admin/form/CollapsibleSection` | Expandable section container (3 uses) |
| `OrganizationInputs` | `./OrganizationInputs` | Wrapper component with error summary |
| `OrganizationCompactForm` | `./OrganizationCompactForm` | All field rendering (23 fields) |
| `OrganizationHierarchySection` | `./OrganizationHierarchySection` | Hierarchy fields section |
| `OrganizationAddressSection` | `./OrganizationAddressSection` | Shipping address fields section |
| `DuplicateOrgWarningDialog` | `./DuplicateOrgWarningDialog` | Confirmation dialog for duplicate names |
| `ParentOrganizationInput` | `./ParentOrganizationInput` | Parent org autocomplete wrapper |
| `SegmentComboboxInput` | Custom | Segment selector with search |
| `StateComboboxInput` | Custom | US state selector with search |
| `Card` / `CardContent` | `@/components/ui/card` | Container card components |
| `useSmartDefaults` | `@/atomic-crm/hooks/useSmartDefaults` | Identity-based default values |
| `useDuplicateOrgCheck` | `./useDuplicateOrgCheck` | Duplicate detection logic |

---

## 7. Validation Schema Analysis

**Schema File:** `src/atomic-crm/validation/organizations.ts`
**Schema Name:** `organizationSchema` (lines 68-146)
**Create Schema:** `createOrganizationSchema` (lines 183-197)

| Rule | Compliant | Notes |
|------|-----------|-------|
| Uses `z.strictObject()` | YES | Line 68: `export const organizationSchema = z.strictObject({` - prevents mass assignment attacks |
| All strings have `.max()` | YES | All string fields have explicit max length constraints (e.g., name:255, phone:30, description:5000) |
| Uses `z.coerce` for non-strings | YES | Applied to: `id`, `sales_id`, `parent_organization_id`, `is_operating_entity`, `employee_count`, `founded_year`, `created_by`, `updated_by`, `credit_limit` |
| Uses `z.enum()` for constrained values | YES | 6 enums: `organizationTypeSchema`, `organizationPrioritySchema`, `orgScopeSchema`, `orgStatusSchema`, `orgStatusReasonSchema`, `paymentTermsSchema` |
| API boundary validation only | YES | All validation in `validateOrganizationForSubmission()` function (lines 158-179), no form-level validation |

**Constitution Compliance Score:** 5/5 - Fully compliant with all Engineering Constitution validation rules.

**Validation Details:**
```typescript
// Required fields
name: z.string().min(1, "Organization name is required").max(255, "Organization name too long")

// Enums with defaults
organization_type: organizationTypeSchema.default("prospect") // enum with allowlist
priority: organizationPrioritySchema.default("C") // enum with allowlist

// Optional UUIDs
segment_id: z.string().uuid().optional().nullable()

// Optional strings with max lengths (DoS prevention)
phone: z.string().max(30, "Phone number too long").nullish()
address: z.string().max(500, "Address too long").nullish()
postal_code: z.string().max(20, "Postal code too long").nullish()

// URL validation
website: isValidUrl.nullish() // z.string().url() or z.literal("")
linkedin_url: isLinkedinUrl.nullish() // Custom LinkedIn domain regex

// Sanitized text fields (XSS prevention)
description: z.string().max(5000).optional().nullable().transform((val) => sanitizeHtml(val))

// Numeric fields with coercion
sales_id: z.coerce.number().nullish()
parent_organization_id: z.coerce.number().optional().nullable()

// Boolean with coercion
is_operating_entity: z.coerce.boolean().default(true)

// Status fields (hidden, system defaults)
status: orgStatusSchema.default('active') // enum: active, inactive

// Address fields (consistent max lengths)
billing_country: z.string().max(2).default('US')
shipping_country: z.string().max(2).default('US')
shipping_state: z.string().max(2).nullable().optional()
```

---

## 8. Accessibility Audit

| Requirement | Compliant | Notes |
|-------------|-----------|-------|
| Explicit labels on all inputs | YES | All 20 visible fields have explicit label props |
| Required field indicators | YES | Name field shows `*` in label text (line 19) |
| `aria-invalid` on error fields | PARTIAL | React Admin TextInput handles this automatically, but not explicitly visible in code |
| `aria-describedby` linking | PARTIAL | React Admin handles error linking, not explicit in audit scope |
| `role="alert"` on errors | YES | FormErrorSummary component provides this |
| Touch targets 44x44px min | YES | All collapsible triggers use `h-11` (44px) - CollapsibleSection.tsx:34 |
| Keyboard navigation | YES | Natural DOM order, collapsible sections keyboard accessible |
| Focus management | YES | Standard React Admin input focus behavior |
| Helper text for complex fields | YES | Present on website, phone, linkedin_url, parent_organization_id, org_scope, is_operating_entity |
| Screen reader support | YES | Collapsible sections use `aria-controls`, FormErrorSummary alerts errors |

**WCAG Compliance:** AA Level - Meets WCAG 2.1 success criterion 2.5.5 (Target Size) with 44px minimum touch targets.

**Accessibility Strengths:**
- All fields have explicit labels
- Collapsible sections are keyboard accessible with `aria-controls`
- Error summary at top for screen reader announcements
- Touch targets meet WCAG AA (44px minimum)
- Helper text provides format guidance for complex fields

---

## 9. Design System Compliance

| Rule | Compliant | Issues |
|------|-----------|--------|
| Semantic colors only | YES | Uses `bg-muted`, `text-muted-foreground`, `border-border`, `hover:bg-muted/50` - no raw hex/oklch values |
| No hardcoded hex/oklch | YES | All colors use Tailwind v4 semantic tokens |
| `bg-muted` page background | YES | Line 191, 216: `<div className="bg-muted px-6 py-6">` |
| `create-form-card` class | YES | Line 192, 217: `<div className="max-w-4xl mx-auto create-form-card">` |
| Touch targets h-11 w-11 | YES | Collapsible triggers use `h-11` (44px) - CollapsibleSection.tsx:34 |
| Semantic color usage | YES | `text-muted-foreground` for section headers, `border-border` for collapsible sections |
| Spacing tokens | YES | `space-y-4` between rows, `gap-2` toolbar, `gap-3` CompactFormRow, `px-6 py-6` outer padding |
| Border radius | YES | `rounded-md` on collapsible sections |
| Grid columns | YES | `grid-cols-1 md:grid-cols-2` responsive layout |

**Design System Compliance Score:** 100% - Fully compliant with crispy-design-system rules.

**Layout Tokens:**
- **Max Width:** `max-w-4xl` (container constraint)
- **Background:** `bg-muted` (page background)
- **Padding:** `px-6 py-6` (outer container)
- **Card Spacing:** `space-y-4` (between form sections)
- **Gap:** `gap-2` (toolbar buttons), `gap-3` (CompactFormRow)
- **Touch Targets:** `h-11` (44px minimum - WCAG AA, Fitts's Law)
- **Grid Columns:** `grid-cols-1 md:grid-cols-2` (responsive 2-column layout)
- **Border Radius:** `rounded-md` (collapsible sections)

---

## 10. Identified Issues / Recommendations

### Critical Issues
- [ ] **State Field Schema Mismatch:** Primary `state` field allows max 100 chars (line 81) but `shipping_state` allows max 2 chars (line 133). Both use StateComboboxInput which expects 2-char postal codes. **Fix:** Change `state` to `max(2)` for consistency.

### Improvements
- [ ] **Duplicate Address Field Confusion:** Form has BOTH primary address fields (address, city, state, postal_code) in main section AND shipping address fields (shipping_street, shipping_city, shipping_state, shipping_postal_code) in collapsible section. Users may not understand which address is which. **Recommendation:** Add clarifying labels like "Primary Address" and "Shipping Address" or merge into single address with type selector.

- [ ] **Section Title Ambiguity:** OrganizationAddressSection title is just "Address" but contains SHIPPING address fields. Could be mistaken for primary address. **Recommendation:** Change title to "Shipping Address" for clarity.

- [ ] **Priority Row Column Layout:** Priority row has 3 fields (priority, sales_id, segment_id) but CompactFormRow defaults to `md:grid-cols-2`, causing awkward wrapping. **Recommendation:** Add explicit `columns="md:grid-cols-3"` prop to that CompactFormRow.

- [ ] **Helper Text Inconsistency:** Some fields have helpful format examples (website, phone, linkedin_url) while most explicitly disable helper text with `helperText={false}`. No helper text on address fields which might benefit from format guidance. **Recommendation:** Add consistent helper text policy or document rationale for selective usage.

### Notes for Standardization
- **Form Key Pattern:** Uses `key={formKey}` to force remount when unknownSegmentId changes (line 211, 218). This ensures defaults apply correctly. **Good pattern for async default dependencies.**

- **Hidden Submit Button Pattern:** DuplicateCheckSaveButton uses hidden `<button type="submit">` triggered after duplicate check passes (lines 87-93). **Clever pattern for deferred submission with pre-submit validation.**

- **Segment Default Logic:** Fetches "Unknown" segment by name. Assumes "Unknown" segment exists in database. If deleted, all new orgs created with null segment. **Consider DB constraint or seed data to ensure Unknown segment exists.**

- **URL Auto-prefixing:** Transform function adds `https://` prefix to website URLs if missing (lines 142-148). **Excellent UX pattern - reduce user burden.**

- **Parent Pre-fill from Router State:** Reads `parent_organization_id` from `location.state.record` to enable "Add Branch" workflow (line 139). **Good cross-feature integration pattern.**

---

## 11. Cross-References

**Primary Files:**
- **Main Form:** `src/atomic-crm/organizations/OrganizationCreate.tsx`
- **Field Layout:** `src/atomic-crm/organizations/OrganizationCompactForm.tsx`
- **Wrapper Component:** `src/atomic-crm/organizations/OrganizationInputs.tsx`
- **Hierarchy Section:** `src/atomic-crm/organizations/OrganizationHierarchySection.tsx`
- **Address Section:** `src/atomic-crm/organizations/OrganizationAddressSection.tsx`
- **Parent Input:** `src/atomic-crm/organizations/ParentOrganizationInput.tsx`

**Validation & Constants:**
- **Zod Schema:** `src/atomic-crm/validation/organizations.ts`
- **Dropdown Choices:** `src/atomic-crm/organizations/constants.ts`

**Shared Components:**
- **Form Components:** `src/components/admin/form/` (CompactFormRow, CollapsibleSection, SaveButton, CancelButton, FormLoadingSkeleton)
- **Form Toolbar:** `src/components/admin/simple-form/FormToolbar.tsx`
- **Error Summary:** `src/components/admin/FormErrorSummary.tsx`

**Hooks:**
- **Smart Defaults:** `src/atomic-crm/hooks/useSmartDefaults.ts`
- **Duplicate Check:** `src/atomic-crm/organizations/useDuplicateOrgCheck.ts`

**Dialogs:**
- **Duplicate Warning:** `src/atomic-crm/organizations/DuplicateOrgWarningDialog.tsx`

**Types:**
- **Organization Types:** `src/atomic-crm/organizations/types.ts`

**Related Forms:**
- **Edit Form:** `src/atomic-crm/organizations/OrganizationEdit.tsx`
- **SlideOver:** `src/atomic-crm/organizations/OrganizationSlideOver.tsx`

**Related Tests:**
- **Test Directory:** `src/atomic-crm/organizations/__tests__/`

---

## Executive Summary

The OrganizationCreate form is a sophisticated, full-page create form for adding new organizations to the CRM. It features soft duplicate detection with user confirmation, smart defaults from identity management, URL auto-prefixing, and a comprehensive field set organized into collapsible sections. The form delegates all field rendering to `OrganizationCompactForm`, which contains 23 total fields across basic information, contact details, hierarchy, and address sections.

**Key Features:**
- Soft duplicate warning dialog (confirmation, not hard block)
- Schema-derived defaults with identity-based smart defaults
- Website URL auto-prefixing (adds `https://` if missing)
- Parent organization pre-fill from router state (for "Add Branch" flows)
- Collapsible sections for additional details, hierarchy, and address
- Custom duplicate-check save button pattern

**Total Fields:** 23 (20 visible + 3 hidden system fields)

**Constitution Compliance:**
- **Validation:** 5/5 - Fully compliant (z.strictObject, all strings have .max(), z.coerce for non-strings, z.enum allowlists, API boundary only)
- **Defaults:** 5/5 - Uses `schema.partial().parse({})` pattern exactly as specified
- **Form Performance:** Excellent - uses `onSubmit` mode, no onChange validation storms

**Design System Compliance:** 100% - Uses semantic colors only, bg-muted background, h-11 touch targets, create-form-card class

**Accessibility:** WCAG AA compliant - explicit labels, 44px touch targets, keyboard navigation, error summary, helper text

**Code Quality:** High - follows project conventions, proper TypeScript typing, no deprecated patterns (no company_id, uses contact_organizations junction table)

**Strengths:**
- Comprehensive field coverage with logical grouping
- Excellent accessibility (WCAG AA compliant)
- Smart defaults reduce user input burden
- Soft duplicate warning (confirmation, not blocking)
- Clean separation of concerns (OrganizationCompactForm handles layout)
- Correct fail-fast pattern (pre-launch velocity priority)

**Areas for Improvement:**
- Clarify duplicate address fields (primary vs shipping)
- Fix state field schema mismatch (max length inconsistency)
- Add explicit column count for 3-field priority row
- Consider renaming "Address" section to "Shipping Address"
- Document Unknown segment dependency or add DB constraint

---

## Component Tree

```
OrganizationCreate (src/atomic-crm/organizations/OrganizationCreate.tsx)
├── CreateBase (react-admin, line 215)
│   └── Form (react-admin, line 218)
│       └── Card (shadcn/ui, line 219)
│           └── CardContent (shadcn/ui, line 220)
│               └── OrganizationFormContent (lines 245-269)
│                   ├── OrganizationInputs (line 256)
│                   │   ├── FormErrorSummary (OrganizationInputs.tsx:28-32)
│                   │   └── OrganizationCompactForm (OrganizationInputs.tsx:34)
│                   │       ├── CompactFormRow (lines 15-23)
│                   │       │   ├── TextInput [name]
│                   │       │   └── SelectInput [organization_type]
│                   │       ├── CompactFormRow (lines 35-52)
│                   │       │   ├── SelectInput [priority]
│                   │       │   ├── ReferenceInput → SelectInput [sales_id]
│                   │       │   └── SegmentComboboxInput [segment_id]
│                   │       ├── CompactFormRow (lines 54-57)
│                   │       │   ├── TextInput [address]
│                   │       │   └── TextInput [city]
│                   │       ├── CompactFormRow (lines 59-62)
│                   │       │   ├── StateComboboxInput [state]
│                   │       │   └── TextInput [postal_code]
│                   │       ├── CollapsibleSection "Additional Details" (lines 64-83)
│                   │       │   ├── TextInput [website]
│                   │       │   ├── TextInput [phone]
│                   │       │   ├── TextInput [linkedin_url]
│                   │       │   └── TextInput [description] (multiline)
│                   │       ├── OrganizationHierarchySection (line 85)
│                   │       │   └── CollapsibleSection "Organization Hierarchy"
│                   │       │       ├── ParentOrganizationInput [parent_organization_id]
│                   │       │       └── CompactFormRow
│                   │       │           ├── SelectInput [org_scope]
│                   │       │           └── BooleanInput [is_operating_entity]
│                   │       └── OrganizationAddressSection (line 86)
│                   │           └── CollapsibleSection "Address"
│                   │               ├── TextInput [shipping_street]
│                   │               ├── CompactFormRow
│                   │               │   ├── TextInput [shipping_city]
│                   │               │   └── StateComboboxInput [shipping_state]
│                   │               └── TextInput [shipping_postal_code]
│                   └── FormToolbar (line 257)
│                       ├── CancelButton (line 259)
│                       └── DuplicateCheckSaveButton (line 260-264)
│                           ├── hidden <button type="submit"> (line 87-93)
│                           └── SaveButton type="button" (line 95-102)
└── DuplicateOrgWarningDialog (lines 234-240, outside CreateBase)
```

---

## Sections & Layout Breakdown

### Section 1: Main Fields (Always Visible)
**Source:** OrganizationCompactForm.tsx:14-62
**Layout:** 4 CompactFormRow containers (grid with md:grid-cols-2)
**Fields:** 9 fields
- Row 1: name, organization_type
- Row 2: priority, sales_id, segment_id (3 columns via grid)
- Row 3: address, city
- Row 4: state, postal_code

**Spacing:** `space-y-4` between rows

### Section 2: Additional Details (Collapsible, defaultOpen=false)
**Source:** OrganizationCompactForm.tsx:64-83
**Component:** CollapsibleSection
**Title:** "Additional Details"
**Layout:** Vertical stack (`space-y-4`)
**Fields:** 4 fields (website, phone, linkedin_url, description)
**Border:** `border border-border rounded-md`
**Trigger Height:** `h-11` (44px touch target)

**Helper Texts:**
- website: "Format: https://example.com"
- phone: "Format: (555) 123-4567"
- linkedin_url: "Format: https://linkedin.com/company/name"

### Section 3: Organization Hierarchy (Collapsible, defaultOpen=false)
**Source:** OrganizationHierarchySection.tsx:7-36
**Component:** CollapsibleSection
**Title:** "Organization Hierarchy"
**Layout:** `space-y-4` with nested CompactFormRow
**Fields:** 3 fields (parent_organization_id, org_scope, is_operating_entity)

**Boolean Input Helper:**
- Inline helper text with formatting for ON/OFF states
- **ON:** Orders and invoices happen here (e.g., Sysco Chicago)
- **OFF:** Corporate brand or holding company only (e.g., Sysco Corporation)

### Section 4: Address (Collapsible, defaultOpen=false)
**Source:** OrganizationAddressSection.tsx:5-18
**Component:** CollapsibleSection
**Title:** "Address"
**Layout:** `space-y-4` with CompactFormRow for city/state
**Fields:** 4 fields (shipping_street, shipping_city, shipping_state, shipping_postal_code)
**Note:** These are shipping address fields, distinct from primary address (address, city, state, postal_code)

### Toolbar Section
**Source:** OrganizationCreate.tsx:257-266
**Component:** FormToolbar
**Layout:** Flex row with gap-2, right-aligned (`justify-end`)
**Buttons:** CancelButton, DuplicateCheckSaveButton

---

## Dropdowns Detail

### 1. Organization Type (organization_type)
**Component:** SelectInput
**Source:** OrganizationCompactForm.tsx:25-31
**Choices Constant:** `ORGANIZATION_TYPE_CHOICES` (constants.ts:26-32)
**Default:** `"prospect"` (schema default, organizations.ts:107)
**Empty Text:** "Select organization type"

**Choices:**
```typescript
{ id: "customer", name: "Customer" }
{ id: "prospect", name: "Prospect" }
{ id: "principal", name: "Principal" }
{ id: "distributor", name: "Distributor" }
```

### 2. Priority (priority)
**Component:** SelectInput
**Source:** OrganizationCompactForm.tsx:36-42
**Choices Constant:** `PRIORITY_CHOICES` (constants.ts:41-46)
**Default:** `"C"` (schema default, organizations.ts:108)
**Empty Text:** "Select priority"

**Choices:**
```typescript
{ id: "A", name: "A - High" }
{ id: "B", name: "B - Medium-High" }
{ id: "C", name: "C - Medium" }
{ id: "D", name: "D - Low" }
```

### 3. Account Manager (sales_id)
**Component:** ReferenceInput → SelectInput
**Source:** OrganizationCompactForm.tsx:43-50
**Reference:** "sales" resource
**Default:** `smartDefaults.sales_id` (from identity hook, OrganizationCreate.tsx:206)
**Sort:** `{ field: "last_name", order: "ASC" }`
**Filter:** `{ "disabled@neq": true, "user_id@not.is": null }`
**Option Renderer:** `saleOptionRenderer` (custom function)

### 4. Segment (segment_id)
**Component:** SegmentComboboxInput
**Source:** OrganizationCompactForm.tsx:51
**Default:** `unknownSegmentId ?? null` (fetched "Unknown" segment, OrganizationCreate.tsx:124-136, 208)
**Type:** Combobox with search/filter capability

### 5. State (state)
**Component:** StateComboboxInput
**Source:** OrganizationCompactForm.tsx:60
**Choices:** US States (constants.ts:142-193)
**Type:** Combobox with search capability

### 6. Scope (org_scope)
**Component:** SelectInput
**Source:** OrganizationHierarchySection.tsx:13-19
**Choices Constant:** `ORG_SCOPE_CHOICES` (constants.ts:86-90)
**Empty Text:** "Select scope"
**Helper Text:** "National = brand/HQ, Regional = operating company"

**Choices:**
```typescript
{ id: "national", name: "National" }
{ id: "regional", name: "Regional" }
{ id: "local", name: "Local" }
```

### 7. Shipping State (shipping_state)
**Component:** StateComboboxInput
**Source:** OrganizationAddressSection.tsx:12
**Choices:** US States (constants.ts:142-193)
**Type:** Combobox with search capability

### 8. Parent Organization (parent_organization_id)
**Component:** ReferenceInput → AutocompleteInput
**Source:** ParentOrganizationInput.tsx:13-25
**Reference:** "organizations" resource
**Default:** `parentOrgId ?? null` (from router state, OrganizationCreate.tsx:139, 209)
**Filter:** Excludes self (`{ "id@neq": record.id }` if editing)
**Search Filter:** `{ "name@ilike": `%${searchText}%` }`
**Empty Text:** "No parent organization"
**Helper Text:** "Select a parent organization if this is a branch location"

---

## Input Types Summary

| Input Type | Count | Fields |
|------------|-------|--------|
| TextInput | 11 | name, address, city, postal_code, website, phone, linkedin_url, description, shipping_street, shipping_city, shipping_postal_code |
| SelectInput | 3 | organization_type, priority, org_scope |
| ReferenceInput → SelectInput | 1 | sales_id |
| ReferenceInput → AutocompleteInput | 1 | parent_organization_id |
| SegmentComboboxInput | 1 | segment_id |
| StateComboboxInput | 2 | state, shipping_state |
| BooleanInput | 1 | is_operating_entity |
| Hidden/System | 3 | status, billing_country, shipping_country |

**Unique Component Types:** 8

---

## Special Features & Logic Details

### 1. Soft Duplicate Detection
**Source:** OrganizationCreate.tsx:25, 117-118
**Hook:** `useDuplicateOrgCheck()`
**Behavior:**
- Before save, checks for existing organization with same name (case-insensitive)
- If duplicate found, shows confirmation dialog instead of blocking
- User can confirm to proceed anyway or cancel to change name
- Uses hidden submit button pattern to defer actual submission

**Implementation:**
```typescript
// DuplicateCheckSaveButton (lines 47-105)
const handleClick = async (event) => {
  const duplicate = await checkForDuplicate(name);
  if (duplicate) {
    onDuplicateFound(duplicate.name, values); // Show dialog
    return;
  }
  hiddenSubmitRef.current?.click(); // Proceed with save
};
```

### 2. Smart Defaults (Identity-based)
**Source:** OrganizationCreate.tsx:114, 206
**Hook:** `useSmartDefaults()`
**Applied To:**
- `sales_id`: Pre-filled with current user's sales_id (if they have one)

**Loading State:** Shows FormLoadingSkeleton while fetching identity (lines 189-197)

### 3. Schema-Derived Defaults
**Source:** OrganizationCreate.tsx:199-210
**Pattern:** `organizationSchema.partial().parse({})`
**Extracted Defaults:**
- `organization_type`: `"prospect"`
- `priority`: `"C"`
- `is_operating_entity`: `true`
- `status`: `"active"` (hidden)
- `billing_country`: `"US"` (hidden)
- `shipping_country`: `"US"` (hidden)

### 4. Unknown Segment Auto-assignment
**Source:** OrganizationCreate.tsx:124-136, 208
**Behavior:**
- Fetches "Unknown" segment on mount
- Pre-fills `segment_id` with Unknown segment's UUID
- Falls back to `null` if not found

### 5. Parent Organization Pre-fill (Router State)
**Source:** OrganizationCreate.tsx:139, 209
**Trigger:** "Add Branch" button from organization list/detail
**Behavior:**
- Reads `parent_organization_id` from `location.state.record`
- Pre-fills parent field if present
- Enables "add branch location" workflow

### 6. Website URL Auto-prefixing
**Source:** OrganizationCreate.tsx:141-148, 215
**Transform Function:** `transformValues()`
**Behavior:**
- Before save, checks if website starts with "http"
- If not, prepends `"https://"` to the value
- Applied via `<CreateBase transform={transformValues}>`

### 7. Form Key Reset
**Source:** OrganizationCreate.tsx:211
**Pattern:** `key={formKey}`
**Purpose:** Forces form remount when unknownSegmentId changes, ensuring defaults apply correctly

---

## Data Tutorial Attributes

**Purpose:** Frontend testing/tutorial hooks

| Attribute | Element | Source Line |
|-----------|---------|-------------|
| `data-tutorial="org-name"` | name field container | OrganizationCompactForm.tsx:16 |
| `data-tutorial="org-type"` | organization_type field container | OrganizationCompactForm.tsx:24 |
| `data-tutorial="org-website"` | website field container | OrganizationCompactForm.tsx:66 |
| `data-tutorial="org-save-btn"` | DuplicateCheckSaveButton | OrganizationCreate.tsx:101 |

---

## Responsive Behavior

### Breakpoints
- **Mobile (< md):** All CompactFormRow fields stack vertically (`grid-cols-1`)
- **Tablet/Desktop (>= md):** CompactFormRow fields display in 2 columns (`md:grid-cols-2`)

### Grid Behavior
- **Priority Row:** Always 2 columns on desktop (priority, sales_id, segment_id uses default grid)
- **Collapsible Sections:** Expand/collapse on all screen sizes

### Touch Optimization
- **Target Size:** 44px minimum height on interactive elements
- **Spacing:** `gap-3` in CompactFormRow for adequate tap spacing

---

## Form Performance Notes

**Mode:** `onSubmit` (default) - Excellent for performance
**Validation Timing:** Only on submit, not onChange (prevents re-render storms)
**Duplicate Check:** Only runs on button click, not on every keystroke
**Constitution Compliance:** Correct pattern per CLAUDE.md form performance guidelines

---

## Notes

1. **Status & Payment Fields Hidden:**
   - Comment on line 87: "Status & Payment fields hidden per user feedback - defaults: status='active'"
   - Fields exist in schema but not exposed in form
   - Defaults applied: status='active', billing_country='US', shipping_country='US'

2. **Deprecated Company Relationship:**
   - Schema does NOT include `company_id` field
   - Per CLAUDE.md: Use `contact_organizations` junction table instead
   - Form correctly avoids deprecated pattern

3. **Segment Default Logic:**
   - Fetches "Unknown" segment by name
   - This assumes an "Unknown" segment exists in the database
   - If not found, defaults to `null` (safe fallback)
   - **Potential Issue:** If Unknown segment deleted, all new orgs created with null segment

4. **Organization Type Operator:**
   - Schema supports "operator" type (not in dropdown but allowed in enum)
   - CLAUDE.md mentions operators as "Restaurant/foodservice (end customer)"
   - May indicate domain model evolution

5. **Create vs Edit Schema:**
   - `createOrganizationSchema` omits system fields (id, created_at, updated_at, etc.)
   - Form uses full `organizationSchema` for defaults, then validation happens at API boundary
   - Correct pattern per Engineering Constitution

6. **Redirect Behavior:**
   - Form redirects to "show" view after creation (line 215, 170)
   - Standard pattern for create forms
