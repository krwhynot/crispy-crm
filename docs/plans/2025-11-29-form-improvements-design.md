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

## High-Impact UX Improvements (MVP)

### 1. Smart Defaults — Auto-populate Sales Rep

**Problem:** User manually selects Sales Rep on every record.
**Solution:** Pre-fill Sales Rep with the logged-in user.

```typescript
// src/atomic-crm/hooks/useSmartDefaults.ts

import { useGetIdentity } from "ra-core";

export const useSmartDefaults = () => {
  const { identity } = useGetIdentity();

  return {
    sales_id: identity?.id, // Pre-filled with current user
  };
};

// Usage in form
const { sales_id } = useSmartDefaults();
const defaultValues = {
  ...schema.partial().parse({}),
  sales_id, // Override with smart default
};
```

**Rationale:** 90% of the time, the person creating the record is the owner. Let them override when needed.

**Apply to:**
- Contacts → `sales_id`
- Organizations → `sales_id`
- Tasks → `sales_id`
- Activities → Implicit via `auth.uid()`

---

### 2. Save + Create Another — Split Button

**Problem:** User logs 5 activities from a trade show—returns to list view between each one.
**Solution:** Split button with dropdown for batch entry workflows.

```
┌─────────────────────────────────────────────────────┐
│                              [Cancel] [Save ▼]      │
│                                       ┌───────────┐ │
│                                       │ Save      │ │
│                                       │ Save + New│ │
│                                       └───────────┘ │
└─────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/components/admin/form/SaveButtonGroup.tsx

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface SaveButtonGroupProps {
  onSave: () => void;
  onSaveAndNew: () => void;
  isSubmitting: boolean;
}

export const SaveButtonGroup = ({ onSave, onSaveAndNew, isSubmitting }: SaveButtonGroupProps) => (
  <div className="flex">
    <Button
      type="submit"
      onClick={onSave}
      disabled={isSubmitting}
      className="rounded-r-none"
    >
      Save
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={isSubmitting}
          className="rounded-l-none border-l px-2"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onSave}>
          Save
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSaveAndNew}>
          Save + Create Another
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
```

**Behavior:**
- **Save:** Submit form, redirect to list/show (current behavior)
- **Save + New:** Submit form, reset to empty form with smart defaults, stay on create page

**Apply to:** All Create forms (Contacts, Organizations, Activities, Tasks)

---

### 3. Keyboard Shortcuts — Power User Workflow

**Problem:** AMs entering data rapidly need keyboard-first navigation.
**Solution:** Form-level keyboard shortcuts.

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Tab` | Next field | Native |
| `Shift+Tab` | Previous field | Native |
| `Cmd/Ctrl+Enter` | Save and close | Custom |
| `Cmd/Ctrl+Shift+Enter` | Save and create another | Custom |
| `Escape` | Close form (no confirmation) | Custom |

**Implementation:**

```typescript
// src/components/admin/form/useFormShortcuts.ts

import { useEffect } from "react";

interface UseFormShortcutsProps {
  onSave: () => void;
  onSaveAndNew: () => void;
  onCancel: () => void;
}

export const useFormShortcuts = ({ onSave, onSaveAndNew, onCancel }: UseFormShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter = Save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSave();
      }
      // Cmd/Ctrl + Shift + Enter = Save + New
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        onSaveAndNew();
      }
      // Escape = Cancel
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onSaveAndNew, onCancel]);
};
```

**Visual hint:** Show shortcuts in tooltip on Save button: `"Save (⌘+Enter)"`

---

### 4. Recent Selections — Autocomplete Memory

**Problem:** User frequently selects the same organizations/contacts. Autocomplete shows all options.
**Solution:** Show last 5 used options at top of dropdown.

```
┌─────────────────────────────────────────┐
│ Organization *                          │
│ ┌─────────────────────────────────────┐ │
│ │                                 ▼   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ RECENT                              │ │
│ │   🕐 Sysco Foods                    │ │
│ │   🕐 US Foods                       │ │
│ │ ─────────────────────────────────── │ │
│ │ ALL ORGANIZATIONS                   │ │
│ │   Acme Corp                         │ │
│ │   ...                               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/atomic-crm/hooks/useRecentSelections.ts

const STORAGE_KEY_PREFIX = "crm_recent_";
const MAX_RECENT = 5;

export const useRecentSelections = (fieldType: "organization" | "contact" | "opportunity") => {
  const storageKey = `${STORAGE_KEY_PREFIX}${fieldType}`;

  const getRecent = (): Array<{ id: string; name: string }> => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addRecent = (selection: { id: string; name: string }) => {
    const recent = getRecent().filter((item) => item.id !== selection.id);
    const updated = [selection, ...recent].slice(0, MAX_RECENT);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return { getRecent, addRecent };
};
```

**Integration with AutocompleteInput:**

```typescript
// Enhanced autocomplete that shows recent first
const { getRecent, addRecent } = useRecentSelections("organization");

// In render, prepend recent to choices
const choicesWithRecent = [
  ...getRecent().map(r => ({ ...r, _isRecent: true })),
  ...allChoices.filter(c => !getRecent().some(r => r.id === c.id)),
];

// On selection, save to recent
const handleSelect = (value) => {
  addRecent({ id: value.id, name: value.name });
  onChange(value);
};
```

**Apply to:**
- `OrganizationAutocomplete`
- `ContactAutocomplete`
- `OpportunityAutocomplete`

---

## Phase 2 UX Improvements (Post-MVP)

The following improvements are documented for future implementation:

| Feature | Description | Effort |
|---------|-------------|--------|
| **Inline Record Creation** | "Create New" option in autocompletes with modal | High |
| **Relationship Preview** | Show stage, value, parties on hover in opportunity dropdown | Medium |
| **Contextual Field Visibility** | Show/hide fields based on org type (Principal vs Customer) | Medium |
| **Sticky Action Bar** | Keep Save/Cancel visible while scrolling long forms | Low |
| **Empty State Guidance** | First-time user tips (dismissible, stored in localStorage) | Low |

See `docs/plans/future/form-ux-phase2.md` for detailed specs.

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
- `src/atomic-crm/organizations/OrganizationDetailsTab.tsx` - Merge to Main (address fields)
- `src/atomic-crm/organizations/OrganizationOtherTab.tsx` - Becomes More
- `src/atomic-crm/organizations/OrganizationHierarchyTab.tsx` - Merge to More
- NEW: `AddressFields.tsx` - Manual address entry component (street, city, state, zip)

**Activities:**
- `src/atomic-crm/activities/ActivityCreate.tsx` - Replace tabs with sections
- Use existing shadcn/ui `Accordion` component for collapsible sections

**Shared Components:**
- `src/components/admin/form/FormField.tsx` - Wrapper with label, required indicator, helper text, error
- `src/atomic-crm/constants/formCopy.ts` - Centralized labels/errors/helpers
- Update existing input components to support `isRequired` and `helperText` props

**High-Impact UX (new files):**
- `src/atomic-crm/hooks/useSmartDefaults.ts` - Auto-populate sales_id with current user
- `src/components/admin/form/SaveButtonGroup.tsx` - Split button with Save + Create Another
- `src/components/admin/form/useFormShortcuts.ts` - Keyboard shortcuts hook (Cmd+Enter, etc.)
- `src/atomic-crm/hooks/useRecentSelections.ts` - localStorage-backed recent selections

### Dependencies

**No new external dependencies for MVP.**

- shadcn/ui `Accordion` already installed
- shadcn/ui `DropdownMenu` already installed (for Save split button)
- React Admin validation infrastructure already in place
- Zod schemas already used for form validation
- localStorage API (native browser)

**Deferred to post-MVP:**
- Google Places API (address autocomplete)
- Client-side async duplicate validation

### Testing Considerations

- Test tab navigation with keyboard (Main/More tabs)
- Test validation error states (blur, submit, tab switch)
- Test on iPad (44px touch targets)
- Test collapsible sections in Activities (desktop + mobile accordion)
- Test conditional required fields (e.g., address required for customers)
- Test state dropdown selection
- Test keyboard shortcuts (Cmd+Enter, Cmd+Shift+Enter, Escape)
- Test Save + Create Another workflow (form resets with smart defaults)
- Test recent selections persistence across browser sessions

---

## Success Criteria

### MVP (Must Ship)

**Form Layout (6 items):**
1. Contacts and Organizations reduced from 4 tabs to 2 (Main / More)
2. Activities form loads as single page with collapsible sections
3. All required fields marked with asterisk (`*`)
4. All optional fields marked with "(optional)" suffix
5. All fields have helper text (from centralized `formCopy.ts`)
6. 44px touch targets on all interactive elements

**Validation (3 items):**
7. Inline validation shows errors on blur
8. Conditional required fields work (e.g., address for customers, follow-up date when follow-up enabled)
9. Form state management uses React Admin `validate` prop with Zod schemas

**Address (1 item):**
10. Manual address fields in Organizations (street, city, state dropdown, zip)

**High-Impact UX (4 items):**
11. Smart defaults: Sales Rep auto-populated with current user
12. Save + Create Another: Split button dropdown on all Create forms
13. Keyboard shortcuts: Cmd+Enter (save), Cmd+Shift+Enter (save+new), Escape (cancel)
14. Recent selections: Last 5 used orgs/contacts/opportunities shown first in autocompletes

### Deferred to Post-MVP

- Google Places address autocomplete
- Client-side async duplicate validation
- Auto-save drafts to localStorage
- Inline record creation ("Create New" in autocompletes)
- Relationship preview on hover
- Contextual field visibility by org type

---

## Acceptance Criteria: Conditional Required Rules

### Contacts Form

| Field | Condition | Required When |
|-------|-----------|---------------|
| First Name | Always | — |
| Last Name | Always | — |
| Organization | Always | Contact must belong to an organization (PRD rule) |
| Sales Rep | Always | — |
| Primary Email | Never | Optional |
| Primary Phone | Never | Optional |

**Validation Rules:**
- At least one contact method (email OR phone) should trigger a warning (not block) if both empty
- LinkedIn URL must be valid LinkedIn profile URL pattern: `https://linkedin.com/in/*` or `https://www.linkedin.com/in/*`

### Organizations Form

| Field | Condition | Required When |
|-------|-----------|---------------|
| Name | Always | — |
| Organization Type | Always | — |
| Sales Rep | Always | — |
| Address | Conditional | Required when `organization_type === 'customer'` (delivery logistics) |
| Segment | Never | Optional |
| Priority | Never | Optional |

**Validation Rules:**
- Website must be valid URL (with or without protocol - auto-prepend `https://`)
- Parent Organization cannot be self-referential (org cannot be its own parent)

### Activities Form

| Field | Condition | Required When |
|-------|-----------|---------------|
| Type | Always | — |
| Subject | Always | — |
| Date | Always | — |
| Opportunity | Conditional | Required when `activity_type === 'interaction'` |
| Follow-up Date | Conditional | Required when `follow_up_required === true` |
| Sentiment | Conditional | Required when `follow_up_required === true` |
| Duration | Never | Optional |
| Contact | Never | Optional |
| Organization | Never | Optional |

**Validation Rules:**
- Follow-up Date must be >= Activity Date (can't follow up before the activity)
- Duration must be positive integer (0-480 minutes max)

### Tasks Form (unchanged, for reference)

| Field | Condition | Required When |
|-------|-----------|---------------|
| Title | Always | — |
| Due Date | Always | — |
| Priority | Never | Optional |
| Related Entity | Never | Optional |

---

## Helper Text & Error Copy Dictionary

### Internationalization Plan

**English-only for MVP.** All strings defined in a central location for future i18n extraction.

**String location:** `src/atomic-crm/constants/formCopy.ts`

### Contacts Form Copy

```typescript
export const CONTACT_FORM_COPY = {
  // Field labels
  labels: {
    first_name: "First Name",
    last_name: "Last Name",
    organization_id: "Organization",
    email: "Primary Email",
    phone: "Primary Phone",
    sales_id: "Sales Rep",
    title: "Title",
    department: "Department",
    linkedin_url: "LinkedIn URL",
    notes: "Notes",
    tags: "Tags",
  },

  // Helper text (shown below field)
  helper: {
    first_name: null, // No helper needed for obvious fields
    last_name: null,
    organization_id: "Contact must belong to an organization",
    email: "Main business email",
    phone: "Main contact number",
    sales_id: "Who owns this contact?",
    title: "Job title or role",
    department: "Department or team",
    linkedin_url: "LinkedIn profile link",
    notes: "Internal notes about this contact",
    tags: "Categories for filtering",
  },

  // Error messages (replaces helper when invalid)
  errors: {
    first_name: {
      required: "First name is required",
      maxLength: "First name cannot exceed 100 characters",
    },
    last_name: {
      required: "Last name is required",
      maxLength: "Last name cannot exceed 100 characters",
    },
    organization_id: {
      required: "Please select an organization",
    },
    email: {
      invalid: "Please enter a valid email address",
      duplicate: "This email is already in use",
    },
    phone: {
      invalid: "Please enter a valid phone number",
    },
    sales_id: {
      required: "Please assign a sales rep",
    },
    linkedin_url: {
      invalid: "Please enter a valid LinkedIn profile URL",
      pattern: "URL must be a LinkedIn profile (linkedin.com/in/...)",
    },
  },

  // Warnings (non-blocking)
  warnings: {
    no_contact_method: "Consider adding an email or phone number",
  },
} as const;
```

### Organizations Form Copy

```typescript
export const ORGANIZATION_FORM_COPY = {
  labels: {
    name: "Organization Name",
    organization_type: "Type",
    sales_id: "Sales Rep",
    segment_id: "Segment",
    priority: "Priority",
    address: "Address",
    website: "Website",
    linkedin_url: "LinkedIn URL",
    context_links: "Reference Links",
    description: "Description",
    logo: "Logo",
    parent_organization_id: "Parent Organization",
  },

  helper: {
    name: null,
    organization_type: "Principal, Distributor, or Customer",
    sales_id: "Who owns this account?",
    segment_id: "Customer segment for targeting",
    priority: "Account priority level",
    address: "Start typing to search addresses",
    website: "Company website",
    linkedin_url: "Company LinkedIn page",
    context_links: "Additional reference links",
    description: "Notes about this organization",
    logo: "Company logo (PNG, JPG, max 2MB)",
    parent_organization_id: "If this is a subsidiary or branch",
  },

  errors: {
    name: {
      required: "Organization name is required",
      maxLength: "Name cannot exceed 200 characters",
      duplicate: "An organization with this name already exists",
    },
    organization_type: {
      required: "Please select an organization type",
    },
    sales_id: {
      required: "Please assign a sales rep",
    },
    address: {
      required: "Address is required for customer organizations",
      invalid: "Please select a valid address from the suggestions",
    },
    website: {
      invalid: "Please enter a valid URL",
    },
    linkedin_url: {
      invalid: "Please enter a valid LinkedIn company URL",
    },
    parent_organization_id: {
      self_reference: "Organization cannot be its own parent",
    },
    logo: {
      size: "Logo must be under 2MB",
      format: "Logo must be PNG or JPG format",
    },
  },
} as const;
```

### Activities Form Copy

```typescript
export const ACTIVITY_FORM_COPY = {
  labels: {
    type: "Interaction Type",
    subject: "Subject",
    activity_date: "Date",
    duration_minutes: "Duration (minutes)",
    description: "Notes",
    opportunity_id: "Opportunity",
    contact_id: "Contact",
    organization_id: "Organization",
    follow_up_required: "Requires follow-up",
    follow_up_date: "Follow-up Date",
    sentiment: "Sentiment",
    follow_up_notes: "Follow-up Notes",
    location: "Location",
    outcome: "Outcome",
  },

  helper: {
    type: "How did this interaction occur?",
    subject: "Summarize the outcome or topic",
    activity_date: null,
    duration_minutes: "Length of activity in minutes",
    description: "Detailed notes about this interaction",
    opportunity_id: "Link to an opportunity",
    contact_id: "Person you interacted with",
    organization_id: "Company context",
    follow_up_required: "Check to schedule a follow-up",
    follow_up_date: "When to follow up",
    sentiment: "How did the contact respond?",
    follow_up_notes: "What to do next",
    location: "Where did this occur?",
    outcome: "Result or next steps",
  },

  errors: {
    type: {
      required: "Please select an interaction type",
    },
    subject: {
      required: "Subject is required",
      maxLength: "Subject cannot exceed 200 characters",
    },
    activity_date: {
      required: "Date is required",
      future: "Activity date cannot be in the future",
    },
    duration_minutes: {
      invalid: "Duration must be a positive number",
      max: "Duration cannot exceed 480 minutes (8 hours)",
    },
    opportunity_id: {
      required: "Opportunity is required for interaction activities",
    },
    follow_up_date: {
      required: "Follow-up date is required when follow-up is enabled",
      before_activity: "Follow-up date must be on or after activity date",
    },
    sentiment: {
      required: "Sentiment is required when follow-up is enabled",
    },
  },

  // Section headers for collapsible sections
  sections: {
    details: "Activity Details",
    relationships: "Relationships",
    followup: "Follow-up",
    outcome: "Outcome",
  },
} as const;
```

---

## Address Fields Specification

### MVP Approach: Manual Entry

**Decision:** Ship manual address fields for MVP. Defer Google Places API autocomplete to post-launch.

**Rationale:**
- Reduces external dependencies for launch
- Avoids API key management and billing setup
- Manual fields are sufficient for initial user base
- Can add autocomplete as enhancement later

### MVP Implementation

**Address fields (always visible, no autocomplete):**

| Field | Type | Required | Helper Text |
|-------|------|----------|-------------|
| Street Address | Text | Conditional* | "Street address or PO Box" |
| City | Text | Conditional* | — |
| State | Select (US states) | Conditional* | — |
| Postal Code | Text | Conditional* | "5 or 9 digit ZIP code" |

*Required when `organization_type === 'customer'` (per acceptance criteria)

```typescript
// src/atomic-crm/organizations/AddressFields.tsx

const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  // ... all 50 states + DC + territories
  { id: "WY", name: "Wyoming" },
];

export const AddressFields = () => (
  <div className="space-y-field">
    <TextInput source="street" label="Street Address" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-content">
      <TextInput source="city" label="City" className="col-span-2" />
      <SelectInput source="state" label="State" choices={US_STATES} />
      <TextInput source="postal_code" label="ZIP Code" />
    </div>
  </div>
);
```

### Future Enhancement: Google Places Autocomplete

**Deferred to post-MVP.** When implemented:
- Single autocomplete field that populates hidden street/city/state/postal_code
- Fallback to manual fields on API failure
- See `docs/plans/future/address-autocomplete.md` for full spec

---

## Validation Model

### Form State Management Decision

**Approach:** Use React Admin's built-in `validate` prop with Zod schemas.

**Rationale:**
- React Admin already provides validation infrastructure
- Zod schemas are single source of truth (Engineering Constitution #4)
- No additional state management library needed
- Consistent with existing codebase patterns

```typescript
// Pattern: Zod schema → React Admin validate prop

import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "../validation/contacts";

// In form component
<Form
  validate={zodResolver(contactSchema)}
  defaultValues={contactSchema.partial().parse({})}
>
  <ContactInputs />
</Form>
```

### Validation Timing

| Trigger | Behavior |
|---------|----------|
| **On blur** | Validate field when user leaves it. Show error immediately. |
| **On change** | Clear error as soon as input becomes valid. No new errors on change. |
| **On submit** | Validate all fields. Focus first invalid field. Block submission. |
| **On tab switch** | Validate current tab's fields. Show error badge on tab if invalid. |

### Duplicate Validation

**MVP Approach:** Rely on server-side database constraints. Defer client-side async validation to post-launch.

**Rationale:**
- Database UNIQUE constraints already catch duplicates
- Server errors surface through React Admin's error handling
- Reduces client complexity for MVP
- Async validation adds latency and complexity

**Database constraints (already in place):**
```sql
-- contacts.email has UNIQUE constraint
-- organizations.name has UNIQUE constraint
-- Circular parent reference prevented by CHECK constraint
```

**Error handling pattern:**
```typescript
// React Admin surfaces constraint violations automatically
// Customize error messages in dataProvider if needed:

const handleError = (error: Error) => {
  if (error.message.includes("duplicate key")) {
    if (error.message.includes("email")) {
      return "This email is already in use";
    }
    if (error.message.includes("name")) {
      return "An organization with this name already exists";
    }
  }
  return error.message;
};
```

**Future Enhancement:** Client-side async validation for better UX. See `docs/plans/future/async-validation.md`.

### Error Pattern by Input Type

| Input Type | Error Display |
|------------|---------------|
| **Text/Email/URL** | Red border + error message below (replaces helper text) |
| **Select** | Red border + error message below |
| **Autocomplete** | Red border + error message below + dropdown remains functional |
| **Textarea** | Red border + error message below |
| **Checkbox** | Error message below (no red border on checkbox itself) |
| **Date picker** | Red border on input + error message below |
| **File upload** | Red border on drop zone + error message below |
| **JSONB Array (emails, phones)** | Red border on specific array item + error below item |

### Error Message Component

```typescript
// src/components/admin/form/FormFieldError.tsx

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

export const FormFieldError = ({ error, className }: FormFieldErrorProps) => {
  if (!error) return null;

  return (
    <p
      className={cn(
        "text-sm text-destructive mt-1",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {error}
    </p>
  );
};
```

---

## Required Field Indicator Visual Spec

### Visual Design

```
┌─────────────────────────────────────┐
│ First Name *                        │  ← Required (red asterisk)
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Title (optional)                    │  ← Optional (suffix text)
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ Job title or role                   │  ← Helper text
└─────────────────────────────────────┘
```

### Design Tokens

```typescript
// Required asterisk
const requiredIndicator = {
  content: " *",
  color: "text-destructive",        // var(--destructive) - red
  fontSize: "text-sm",              // 14px, same as label
  fontWeight: "font-medium",        // 500
  marginLeft: "ml-0.5",             // 2px gap from label text
};

// Optional suffix
const optionalIndicator = {
  content: " (optional)",
  color: "text-muted-foreground",   // var(--muted-foreground) - gray
  fontSize: "text-sm",
  fontWeight: "font-normal",        // 400
  marginLeft: "ml-1",               // 4px gap
};

// Label styling
const labelStyles = {
  color: "text-foreground",
  fontSize: "text-sm",
  fontWeight: "font-medium",
  marginBottom: "mb-1.5",           // 6px gap to input
};
```

### Accessibility Requirements

```typescript
// src/components/admin/form/FormField.tsx

interface FormFieldProps {
  source: string;
  label: string;
  isRequired?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField = ({
  source,
  label,
  isRequired,
  helperText,
  error,
  children
}: FormFieldProps) => {
  const inputId = `field-${source}`;
  const helperId = `helper-${source}`;
  const errorId = `error-${source}`;

  return (
    <div className="space-y-1.5">
      {/* Label with required/optional indicator */}
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {isRequired ? (
          <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>
        ) : (
          <span className="text-muted-foreground font-normal ml-1">(optional)</span>
        )}
      </label>

      {/* Input with ARIA attributes */}
      {React.cloneElement(children as React.ReactElement, {
        id: inputId,
        "aria-required": isRequired,
        "aria-invalid": !!error,
        "aria-describedby": cn(
          helperText && !error && helperId,
          error && errorId
        ),
      })}

      {/* Helper text (hidden when error shown) */}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Screen Reader Announcements

- Required fields announced as "required" by screen reader (via `aria-required`)
- Invalid fields announced as "invalid" (via `aria-invalid`)
- Error messages read automatically when focused (via `aria-describedby`)
- Helper text read when no error (via `aria-describedby`)

---

## Responsive Layout Specification

### Tab Behavior on Mobile

**Desktop (≥1024px / `lg:` breakpoint):**
- Standard horizontal tab bar
- Tab content displays below tabs
- Full padding and spacing

**Tablet/Mobile (<1024px):**
- Tabs transform to **segmented control** (pill-style buttons)
- Horizontal scroll if more than 2 tabs
- Reduced padding

```typescript
// src/components/admin/tabbed-form/TabbedFormInputs.tsx

<div className="flex flex-col gap-section">
  {/* Tab navigation */}
  <div
    className={cn(
      // Mobile: segmented control style
      "flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto",
      // Desktop: traditional tab bar
      "lg:gap-0 lg:p-0 lg:bg-transparent lg:rounded-none lg:border-b lg:border-border"
    )}
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        role="tab"
        aria-selected={activeTab === tab.key}
        className={cn(
          // Mobile: pill button
          "flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors",
          "min-h-[44px]", // Touch target
          activeTab === tab.key
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          // Desktop: underline style
          "lg:rounded-none lg:shadow-none lg:px-6 lg:py-3",
          "lg:border-b-2 lg:-mb-px",
          activeTab === tab.key
            ? "lg:border-primary"
            : "lg:border-transparent"
        )}
        onClick={() => setActiveTab(tab.key)}
      >
        {tab.label}
        {tabErrors[tab.key] && (
          <span className="ml-2 w-2 h-2 rounded-full bg-destructive" aria-label="has errors" />
        )}
      </button>
    ))}
  </div>

  {/* Tab content */}
  <div role="tabpanel" className="p-content lg:p-0">
    {tabs.find(t => t.key === activeTab)?.content}
  </div>
</div>
```

### Collapsible Sections on Mobile (Activities)

**Desktop:** Sections displayed with visual dividers, optional expand/collapse
**Mobile:** Accordion-style collapsible sections

```typescript
// Use shadcn/ui Accordion for mobile, simple dividers for desktop

<div className="space-y-section">
  {/* Desktop: Always expanded with dividers */}
  <div className="hidden lg:block space-y-section">
    <section>
      <h3 className="text-lg font-semibold mb-content">Activity Details</h3>
      <ActivityDetailsFields />
    </section>
    <Separator />
    <section>
      <h3 className="text-lg font-semibold mb-content">Relationships</h3>
      <RelationshipsFields />
    </section>
    {/* Optional sections */}
    <Separator />
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <h3 className="text-lg font-semibold">Follow-up</h3>
        <ChevronDown className="h-5 w-5 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FollowUpFields />
      </CollapsibleContent>
    </Collapsible>
  </div>

  {/* Mobile: Accordion */}
  <Accordion type="multiple" defaultValue={["details", "relationships"]} className="lg:hidden">
    <AccordionItem value="details">
      <AccordionTrigger>Activity Details</AccordionTrigger>
      <AccordionContent><ActivityDetailsFields /></AccordionContent>
    </AccordionItem>
    <AccordionItem value="relationships">
      <AccordionTrigger>Relationships</AccordionTrigger>
      <AccordionContent><RelationshipsFields /></AccordionContent>
    </AccordionItem>
    <AccordionItem value="followup">
      <AccordionTrigger>Follow-up</AccordionTrigger>
      <AccordionContent><FollowUpFields /></AccordionContent>
    </AccordionItem>
    <AccordionItem value="outcome">
      <AccordionTrigger>Outcome</AccordionTrigger>
      <AccordionContent><OutcomeFields /></AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

### Spacing Tokens for 44px Touch Targets

```css
/* src/index.css - ensure these exist */

:root {
  /* Touch target minimum (WCAG AA) */
  --touch-target-min: 44px;  /* 2.75rem */

  /* Spacing scale */
  --spacing-compact: 12px;   /* 0.75rem - tight gaps */
  --spacing-content: 16px;   /* 1rem - standard content padding */
  --spacing-section: 32px;   /* 2rem - between major sections */
  --spacing-widget: 20px;    /* 1.25rem - widget internal padding */

  /* Form-specific */
  --form-field-gap: 24px;    /* 1.5rem - between form fields */
  --form-row-gap: 16px;      /* 1rem - between fields in same row */
}
```

### Tailwind Utility Mapping

```typescript
// Semantic spacing classes (define in tailwind.config.ts if not present)

// Touch target utilities
"min-h-touch"     // min-height: 44px
"min-w-touch"     // min-width: 44px
"h-11 w-11"       // 44px x 44px (Tailwind default)

// Spacing utilities
"gap-compact"     // gap: 12px
"gap-content"     // gap: 16px
"gap-section"     // gap: 32px
"p-content"       // padding: 16px
"p-widget"        // padding: 20px
"space-y-field"   // space-y: 24px (form fields)

// Form field layout
"grid grid-cols-1 lg:grid-cols-2 gap-content"  // Single col mobile, 2-col desktop
```

### Input Component Height Standards

| Component | Height | Tailwind Class |
|-----------|--------|----------------|
| Text Input | 44px | `h-11` |
| Select | 44px | `h-11` |
| Autocomplete | 44px | `h-11` |
| Button (primary) | 44px | `h-11` |
| Button (icon) | 44px | `h-11 w-11` |
| Checkbox | 20px (centered in 44px hit area) | `h-5 w-5` with padding |
| Radio | 20px (centered in 44px hit area) | `h-5 w-5` with padding |
| Date picker trigger | 44px | `h-11` |

---

## Visual Layout Specification

This section defines precise field widths, grid systems, and button placement to create polished, professional forms that exceed typical CRM quality.

### Design Philosophy

Most CRMs stack fields vertically with uniform widths, creating wasted space and poor visual hierarchy. Our approach:

1. **Field width matches content length** — Short fields like "Duration" don't stretch full-width
2. **Logical field pairing** — Related fields share a row (first name + last name, date + duration)
3. **Consistent grid system** — 2-column base with semantic span classes
4. **Clear action hierarchy** — Primary actions right-aligned, destructive actions isolated

### Field Width Recommendations

| Field Type | Width | Tailwind Class | Rationale |
|------------|-------|----------------|-----------|
| **Names** | 50% | `col-span-1` | First + Last pair naturally |
| **Email** | 50% | `col-span-1` | Pairs with phone |
| **Phone** | 50% | `col-span-1` | Pairs with email |
| **URL** | 100% | `col-span-2` | URLs can be long |
| **Textarea** | 100% | `col-span-2` | Needs full width |
| **Date** | 25% | `col-span-1` (in 4-col) | Short fixed format |
| **Duration** | 25% | `col-span-1` (in 4-col) | Short number |
| **Select** | 50% | `col-span-1` | Standard dropdown |
| **Autocomplete** | 50% | `col-span-1` | Dropdown + search |
| **Address (city)** | 50% | `col-span-2` (in 4-col) | Longer city names |
| **Address (state)** | 25% | `col-span-1` (in 4-col) | Abbreviation |
| **Address (zip)** | 25% | `col-span-1` (in 4-col) | Fixed 5-9 digits |

### Grid System Specification

**Base Grid:** `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5`

- **Mobile (<768px):** Single column, all fields stack
- **Desktop (≥768px):** 2-column grid with 24px horizontal gap, 20px vertical gap
- **4-column subsections:** `grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5` (for date+duration, address line 2)

```typescript
// src/components/admin/form/FormGrid.tsx

interface FormGridProps {
  children: React.ReactNode;
  columns?: 2 | 4;
  className?: string;
}

export const FormGrid = ({ children, columns = 2, className }: FormGridProps) => (
  <div
    className={cn(
      "grid gap-x-6 gap-y-5",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 4 && "grid-cols-2 md:grid-cols-4",
      className
    )}
  >
    {children}
  </div>
);

// Usage
<FormGrid>
  <TextInput source="first_name" /> {/* col 1 */}
  <TextInput source="last_name" />  {/* col 2 */}
  <TextInput source="email" />      {/* col 1 */}
  <TextInput source="phone" />      {/* col 2 */}
  <TextInput source="linkedin_url" className="col-span-2" /> {/* full width */}
</FormGrid>
```

### Field Span Classes

| Class | Width | Use For |
|-------|-------|---------|
| `col-span-1` | 50% (default) | Most fields |
| `col-span-2` | 100% | URLs, textareas, full-width inputs |
| `md:col-span-1` | 50% on desktop, 100% on mobile | Responsive pairing |

### Logical Field Pairing Rules

**Always pair these fields:**

| Row | Field 1 | Field 2 | Rationale |
|-----|---------|---------|-----------|
| 1 | First Name | Last Name | Full name entry |
| 2 | Email | Phone | Contact methods |
| 3 | Date | Duration | Time context |
| 4 | City | State + Zip (4-col) | Address line 2 |
| 5 | Opportunity | Contact | Relationships |

**Never pair these:**
- Textarea with anything (always full width)
- URL fields with short inputs
- Unrelated fields (e.g., "Priority" + "LinkedIn URL")

### Button Layout Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ [🗑️ Delete]                              [Cancel]   [Save ▼]    │
│     ↑                                        ↑          ↑       │
│   Far left                                Secondary  Primary    │
│   (destructive)                           (ghost)    (solid)    │
└─────────────────────────────────────────────────────────────────┘
```

**Button Placement Rules:**
1. **Primary action (Save):** Right-most position
2. **Secondary action (Cancel):** Left of primary
3. **Destructive action (Delete):** Far left, visually separated
4. **Split button dropdown:** Attached to primary save

```typescript
// src/components/admin/form/FormActions.tsx

interface FormActionsProps {
  onSave: () => void;
  onSaveAndNew?: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  showSaveAndNew?: boolean;
}

export const FormActions = ({
  onSave,
  onSaveAndNew,
  onCancel,
  onDelete,
  isSubmitting,
  showSaveAndNew = true,
}: FormActionsProps) => (
  <div className="flex items-center justify-between pt-6 border-t border-border">
    {/* Destructive action - far left */}
    <div>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>

    {/* Primary actions - right aligned */}
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="min-w-[100px]"
      >
        Cancel
      </Button>

      {showSaveAndNew && onSaveAndNew ? (
        <SaveButtonGroup
          onSave={onSave}
          onSaveAndNew={onSaveAndNew}
          isSubmitting={isSubmitting}
        />
      ) : (
        <Button
          type="submit"
          onClick={onSave}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          Save
        </Button>
      )}
    </div>
  </div>
);
```

**Button Sizing:**
- Primary buttons: `h-11 min-w-[100px]` (44px height, 100px min width)
- Icon buttons: `h-11 w-11` (44px square)
- Ghost buttons: Same height, natural width

### Section Headers Pattern

For forms with distinct sections (like Activities single-page layout):

```
SECTION NAME ──────────────────────────────────────────
[fields]
```

```typescript
// src/components/admin/form/FormSection.tsx

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ title, children, className }: FormSectionProps) => (
  <section className={cn("space-y-5", className)}>
    {/* Section header with divider */}
    <div className="flex items-center gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {title}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>

    {/* Section content */}
    <div className="space-y-5">
      {children}
    </div>
  </section>
);

// Usage
<FormSection title="Activity Details">
  <FormGrid>
    <SelectInput source="type" />
    <TextInput source="subject" className="col-span-2" />
  </FormGrid>
</FormSection>
```

### Contact Form Layout (Reference Mockup)

```
┌─────────────────────────────────────────────────────────────────┐
│ MAIN                                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  First Name *               Last Name *                         │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │ John                 │   │ Smith                │           │
│  └──────────────────────┘   └──────────────────────┘           │
│                                                                 │
│  Organization *             Sales Rep *                         │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │ Sysco Foods       ▼  │   │ Jane Doe          ▼  │           │
│  └──────────────────────┘   └──────────────────────┘           │
│  Contact must belong to an organization                         │
│                                                                 │
│  Primary Email (optional)   Primary Phone (optional)            │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │ john@sysco.com       │   │ (555) 123-4567       │           │
│  └──────────────────────┘   └──────────────────────┘           │
│  Main business email        Main contact number                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ MORE                                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Title (optional)           Department (optional)               │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │ VP of Procurement    │   │ Purchasing           │           │
│  └──────────────────────┘   └──────────────────────┘           │
│                                                                 │
│  LinkedIn URL (optional)                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://linkedin.com/in/johnsmith                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  LinkedIn profile link                                          │
│                                                                 │
│  Notes (optional)                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Key decision maker for seafood category.                │   │
│  │ Prefers email over phone.                               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Internal notes about this contact                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [🗑️ Delete]                              [Cancel]   [Save ▼]    │
└─────────────────────────────────────────────────────────────────┘
```

### Edit Mode Header Pattern

For edit forms, show record context above the form:

```
┌─────────────────────────────────────────────────────────────────┐
│  👤  John Smith                                                 │
│      VP of Procurement · Sysco Foods                            │
├─────────────────────────────────────────────────────────────────┤
│  [MAIN]  [MORE]                                                 │
│  ...                                                            │
```

```typescript
// src/components/admin/form/FormHeader.tsx

interface FormHeaderProps {
  avatar?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const FormHeader = ({ avatar, title, subtitle, icon }: FormHeaderProps) => (
  <div className="flex items-center gap-4 pb-6 border-b border-border">
    {/* Avatar or icon */}
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        icon || <User className="h-6 w-6 text-muted-foreground" />
      )}
    </div>

    {/* Title and subtitle */}
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  </div>
);
```

### Layout Rules Summary Table

| Rule | Implementation | Rationale |
|------|----------------|-----------|
| 2-column grid base | `grid-cols-1 md:grid-cols-2` | Balanced, not cramped |
| 24px column gap | `gap-x-6` | Room to breathe |
| 20px row gap | `gap-y-5` | Clear field separation |
| Full-width URLs | `col-span-2` | Accommodate long URLs |
| Full-width textareas | `col-span-2` | Wrapping text needs width |
| Pair names | First + Last in same row | Natural grouping |
| Pair contact methods | Email + Phone in same row | Contact info block |
| Destructive left | Delete button far left | Visual isolation |
| Primary right | Save button far right | Consistent action position |
| 44px touch targets | `h-11`, `min-h-[44px]` | WCAG AA compliance |
| Section dividers | Uppercase label + `h-px bg-border` | Clear visual hierarchy |

---

## Research References

Based on CRM industry best practices research:

- **Copper CRM:** Required fields = Name, Company, Email, Phone, Owner, Location
- **Insightly:** Contact type, organization details, company size as key fields
- **Form Design Best Practices:** Single column, easy-to-hard field order, inline validation
- **CXL Research:** Remove useless fields, consolidate address to single field
- **Adobe:** Order fields easiest to hardest, validate inline, indicate required vs optional
