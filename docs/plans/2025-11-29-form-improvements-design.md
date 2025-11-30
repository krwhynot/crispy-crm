# Form Improvements Design

**Date:** 2025-11-29
**Status:** Approved
**Author:** Brainstorming session with user

## Problem Statement

Current forms have **too many tabs** and **confusing layouts**:
- Contacts: 4 tabs (Identity, Position, Contact Info, Account)
- Organizations: 4 tabs (General, Details, Other, Hierarchy)
- Activities: 3 tabs (Details, Relationships, Follow-up)

Users must click through multiple tabs to find fields, increasing cognitive load and reducing form completion efficiency.

## Design Goals

1. **Reduce clicks** - Fewer tabs, smarter field grouping
2. **Clear hierarchy** - Essential fields prominent, optional fields accessible but not in the way
3. **Consistent UX** - Same patterns across all forms
4. **Industry standard** - Follow CRM best practices from Salesforce, HubSpot, Pipedrive research

## Solution Overview

| Resource | Current State | New Design |
|----------|---------------|------------|
| **Contacts** | 4 tabs | **2 tabs**: Main / More |
| **Organizations** | 4 tabs | **2 tabs**: Main / More |
| **Tasks** | 2 tabs | Keep as-is (already optimal) |
| **Activities** | 3 tabs | **Single page** with collapsible sections |

### Tab Naming Convention

All tabbed forms use consistent labels:
- **"Main"** - Fields needed 90% of the time
- **"More"** - Supplementary/optional information

---

## Contacts Form

### Main Tab

| Field | Type | Required | Helper Text |
|-------|------|----------|-------------|
| First Name | Text | Yes | — |
| Last Name | Text | Yes | — |
| Organization | Autocomplete reference | Yes | "Contact must belong to an organization" |
| Primary Email | Email | No | "Main business email" |
| Primary Phone | Phone | No | "Main contact number" |
| Sales Rep | Select/Autocomplete | Yes | "Who owns this contact?" |

### More Tab

| Field | Type | Required | Helper Text |
|-------|------|----------|-------------|
| Title | Text | No | "Job title or role" |
| Department | Text | No | "Department or team" |
| LinkedIn URL | URL | No | "LinkedIn profile link" |
| Notes | Textarea | No | "Internal notes about this contact" |
| Tags | Tag selector | No | "Categories for filtering" |

---

## Organizations Form

### Main Tab

| Field | Type | Required | Helper Text |
|-------|------|----------|-------------|
| Name | Text | Yes | — |
| Organization Type | Select | Yes | "Principal, Distributor, or Customer" |
| Sales Rep | Autocomplete | Yes | "Who owns this account?" |
| Segment | Select | No | "Customer segment for targeting" |
| Priority | Select | No | "Account priority level" |
| Address | Smart Autocomplete | No | "Start typing to search addresses" |

**Address Implementation:** Uses Google Places API (or similar) for autocomplete. User types in single field, system populates hidden fields (street, city, state, postal_code) for reporting/filtering.

### More Tab

| Field | Type | Required | Helper Text |
|-------|------|----------|-------------|
| Website | URL | No | "Company website" |
| LinkedIn URL | URL | No | "Company LinkedIn page" |
| Context Links | URL array | No | "Additional reference links" |
| Description | Textarea | No | "Notes about this organization" |
| Logo | Image upload | No | "Company logo" |
| Parent Organization | Autocomplete | No | "If this is a subsidiary or branch" |

---

## Activities Form (Single Page)

Remove tabs entirely. Use a **single scrollable page** with section headers:

### Section: Activity Details (always expanded)
- Type (Select, required)
- Subject (Text, required)
- Date (Date picker, required)
- Duration (Number, optional)
- Notes (Textarea, optional)

### Section: Relationships (always expanded)
- Opportunity (Autocomplete, required for interactions)
- Contact (Autocomplete, optional)
- Organization (Autocomplete, optional)

### Section: Follow-up (collapsed by default)
- Requires follow-up (Checkbox)
- Follow-up Date (Date picker)
- Sentiment (Select: Positive/Neutral/Negative)
- Follow-up Notes (Textarea)

### Section: Outcome (collapsed by default)
- Location (Text)
- Outcome (Text)

---

## UX Enhancements (All Forms)

### 1. Inline Validation

- Validate on blur (when user leaves field)
- Valid fields: subtle green checkmark icon
- Invalid fields: red border + error message immediately
- Errors clear when user corrects input

### 2. Required Field Indicators

- Required fields: red asterisk after label (`Label *`)
- Optional fields: "(optional)" suffix on label
- Form blocks submit until all required fields valid

### 3. Helper Text

- Every field has contextual helper text
- Uses `text-muted-foreground` color
- Error messages replace helper text (red color)

### 4. Layout Principles

- **Single column** by default (better completion rates)
- **Two-column grid** only for related pairs (Date + Duration)
- **44px minimum touch targets** (iPad, WCAG AA)
- **Field order:** Easy first (name), complex last (relationships)

### 5. No Unsaved Changes Protection

Per user preference, forms do not warn about unsaved changes. Keep it simple.

---

## Implementation Notes

### Files to Modify

**Contacts:**
- `src/atomic-crm/contacts/ContactInputs.tsx` - Consolidate to 2 tabs
- `src/atomic-crm/contacts/ContactIdentityTab.tsx` - Merge content
- `src/atomic-crm/contacts/ContactPositionTab.tsx` - Merge to More
- `src/atomic-crm/contacts/ContactInfoTab.tsx` - Merge to Main
- `src/atomic-crm/contacts/ContactAccountTab.tsx` - Merge appropriately

**Organizations:**
- `src/atomic-crm/organizations/OrganizationInputs.tsx` - Consolidate to 2 tabs
- `src/atomic-crm/organizations/OrganizationGeneralTab.tsx` - Becomes Main
- `src/atomic-crm/organizations/OrganizationDetailsTab.tsx` - Merge to Main (address)
- `src/atomic-crm/organizations/OrganizationOtherTab.tsx` - Becomes More
- `src/atomic-crm/organizations/OrganizationHierarchyTab.tsx` - Merge to More
- NEW: Smart address autocomplete component

**Activities:**
- `src/atomic-crm/activities/ActivityCreate.tsx` - Replace tabs with sections
- NEW: Collapsible section component (or use existing Accordion from shadcn/ui)

**Shared Components:**
- Form input components - Add inline validation support
- Add required field indicator styling
- Ensure all inputs have helper text prop

### Dependencies

- Google Places API key (for smart address autocomplete)
- May need `@react-google-maps/api` or similar package

### Testing Considerations

- Test tab navigation with keyboard
- Test validation error states
- Test on iPad (44px touch targets)
- Test collapsible sections in Activities

---

## Success Criteria

1. Contacts and Organizations reduced from 4 tabs to 2
2. Activities form loads as single page (no tabs)
3. All required fields marked with asterisk
4. All fields have helper text
5. Inline validation shows errors on blur
6. Address autocomplete works in Organizations

---

## Research References

Based on CRM industry best practices research:

- **Copper CRM:** Required fields = Name, Company, Email, Phone, Owner, Location
- **Insightly:** Contact type, organization details, company size as key fields
- **Form Design Best Practices:** Single column, easy-to-hard field order, inline validation
- **CXL Research:** Remove useless fields, consolidate address to single field
- **Adobe:** Order fields easiest to hardest, validate inline, indicate required vs optional
