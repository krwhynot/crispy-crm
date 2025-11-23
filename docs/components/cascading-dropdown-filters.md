# Cascading Dropdown Filters - Technical Documentation

## Overview

The QuickLogForm component in the Log Activity section implements cascading dropdown filters for Contact, Organization, and Opportunity selection. These dropdowns maintain data relationships where selections in one dropdown affect the available options in others.

## Component Architecture

### Data Relationships

```
Contact (many) ←→ (one) Organization
Organization (one) ←→ (many) Opportunities
Contact ←→ Opportunity (indirect via Organization)
```

### Component Location
- **File:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`
- **Lines:** 360-577 (dropdown implementations)
- **Parent:** `QuickLoggerPanel.tsx`

## Current Implementation

### 1. Contact Dropdown (Lines 360-435)

The Contact dropdown is a searchable combobox that:
- Filters contacts when an Opportunity is selected first
- Auto-fills the Organization field when a contact is selected
- Shows organization context under contact names

```typescript
interface ContactDropdownProps {
  contacts: Array<{
    id: number;
    name: string;
    organization_id?: number;
    company_name?: string;
  }>;
  selectedOpportunity?: { customer_organization_id: number };
  onSelect: (contactId: number) => void;
}
```

**Filtering Logic:**
```typescript
const filteredContacts = useMemo(() => {
  if (selectedOpportunity?.customer_organization_id && !selectedContact) {
    return contacts.filter(
      (c) => c.organization_id === selectedOpportunity.customer_organization_id
    );
  }
  return contacts;
}, [contacts, selectedOpportunity?.customer_organization_id, selectedContact]);
```

### 2. Organization Dropdown (Lines 437-497)

The Organization dropdown currently:
- Re-sorts (but doesn't filter) when a Contact is selected
- Places the contact's organization at the top of the list
- Allows selection of ANY organization regardless of contact

```typescript
interface OrganizationDropdownProps {
  organizations: Array<{
    id: number;
    name: string;
  }>;
  selectedContact?: { organization_id: number };
  onSelect: (orgId: number) => void;
}
```

**Current Sorting Logic (NOT filtering):**
```typescript
const filteredOrganizations = useMemo(() => {
  if (!selectedContact?.organization_id) {
    return organizations;
  }
  const contactOrgId = selectedContact.organization_id;
  return [
    ...organizations.filter((o) => o.id === contactOrgId),
    ...organizations.filter((o) => o.id !== contactOrgId),
  ];
}, [organizations, selectedContact?.organization_id]);
```

### 3. Opportunity Dropdown (Lines 499-577)

The Opportunity dropdown:
- Filters by contact's organization when Contact is selected
- Has a clear button for deselection
- Shows context-aware empty messages

```typescript
interface OpportunityDropdownProps {
  opportunities: Array<{
    id: number;
    name: string;
    customer_organization_id: number;
  }>;
  selectedContact?: { organization_id: number };
  onSelect: (oppId: number) => void;
  onClear: () => void;
}
```

**Filtering Logic:**
```typescript
const filteredOpportunities = useMemo(() => {
  if (selectedContact?.organization_id) {
    return opportunities.filter(
      (o) => o.customer_organization_id === selectedContact.organization_id
    );
  }
  return opportunities;
}, [opportunities, selectedContact?.organization_id]);
```

## Known Issues and Bugs

### Critical Bug #1: Unused Anchor Organization
**Location:** Lines 83-94
```typescript
// This is calculated but NEVER USED!
const anchorOrganizationId = useMemo(() => {
  if (selectedContact?.organization_id) {
    return selectedContact.organization_id;
  }
  if (selectedOpportunity?.customer_organization_id) {
    return selectedOpportunity.customer_organization_id;
  }
  return null;
}, [...]);
```

### Critical Bug #2: Data Inconsistency Allowed

**Scenario:**
1. User selects "John Doe from Acme Corp"
2. Organization auto-fills to "Acme Corp"
3. User can manually change to "Different Corp"
4. System saves inconsistent data

### Issue #3: Asymmetric Filter Behavior

| User Action | Contact Filter | Organization Filter | Opportunity Filter |
|------------|----------------|-------------------|-------------------|
| Select Contact | - | Sorts only ⚠️ | Filters ✅ |
| Select Organization | No change ❌ | - | No change ❌ |
| Select Opportunity | Filters ✅ | Auto-fills ✅ | - |

### Issue #4: Missing Clear Buttons
- Opportunity: ✅ Has clear button
- Contact: ❌ No clear button
- Organization: ❌ No clear button

## Recommended Implementation

### Solution: Centralized Anchor Organization Pattern

```typescript
/**
 * Calculates the anchor organization that should constrain all dropdowns
 * @returns The organization ID that all selections must belong to
 */
const anchorOrganizationId = useMemo(() => {
  // Priority order matters for UX consistency
  if (form.watch("organizationId")) {
    return form.watch("organizationId");
  }
  if (selectedContact?.organization_id) {
    return selectedContact.organization_id;
  }
  if (selectedOpportunity?.customer_organization_id) {
    return selectedOpportunity.customer_organization_id;
  }
  return null;
}, [
  form.watch("organizationId"),
  selectedContact?.organization_id,
  selectedOpportunity?.customer_organization_id
]);

/**
 * Filters contacts to only show those belonging to the anchor organization
 */
const filteredContacts = useMemo(() => {
  if (!anchorOrganizationId) return contacts;
  return contacts.filter(c => c.organization_id === anchorOrganizationId);
}, [contacts, anchorOrganizationId]);

/**
 * Locks organization selection to the anchor organization
 */
const filteredOrganizations = useMemo(() => {
  if (!anchorOrganizationId) return organizations;
  return organizations.filter(o => o.id === anchorOrganizationId);
}, [organizations, anchorOrganizationId]);

/**
 * Filters opportunities to only show those for the anchor organization
 */
const filteredOpportunities = useMemo(() => {
  if (!anchorOrganizationId) return opportunities;
  return opportunities.filter(
    o => o.customer_organization_id === anchorOrganizationId
  );
}, [opportunities, anchorOrganizationId]);
```

### Clear Button Implementation

```typescript
/**
 * Wraps a dropdown with a clear button
 * @param field - The form field being controlled
 * @param label - Accessibility label for the clear button
 * @param onClear - Optional callback for clearing dependent fields
 */
function DropdownWithClear({
  children,
  field,
  label,
  onClear
}: {
  children: React.ReactNode;
  field: { value: any; onChange: (value: any) => void };
  label: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex gap-2">
      {children}
      {field.value && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => {
            field.onChange(undefined);
            onClear?.();
          }}
          aria-label={`Clear ${label} selection`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### Clearing Logic on Selection

```typescript
/**
 * Handles organization selection with dependent field clearing
 */
const handleOrganizationSelect = (orgId: number) => {
  form.setValue("organizationId", orgId);

  // Clear contact if it doesn't belong to this org
  const contactId = form.getValues("contactId");
  if (contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact || contact.organization_id !== orgId) {
      form.setValue("contactId", undefined);
      notify("Contact cleared - doesn't belong to selected organization");
    }
  }

  // Clear opportunity if it doesn't belong to this org
  const oppId = form.getValues("opportunityId");
  if (oppId) {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.customer_organization_id !== orgId) {
      form.setValue("opportunityId", undefined);
    }
  }
};
```

## Testing Strategy

### Unit Tests

```typescript
describe("Cascading Filter Logic", () => {
  describe("anchorOrganizationId", () => {
    it("should prioritize organization selection", () => {
      const { result } = renderHook(() => useAnchorOrganization({
        organizationId: 1,
        contact: { organization_id: 2 },
        opportunity: { customer_organization_id: 3 }
      }));
      expect(result.current).toBe(1);
    });

    it("should use contact org when no org selected", () => {
      const { result } = renderHook(() => useAnchorOrganization({
        organizationId: null,
        contact: { organization_id: 2 },
        opportunity: null
      }));
      expect(result.current).toBe(2);
    });
  });
});
```

### Integration Tests

```typescript
describe("Dropdown Interactions", () => {
  it("should filter contacts when organization selected first", async () => {
    render(<QuickLogForm />);

    // Select organization
    await userEvent.click(screen.getByRole("combobox", { name: /organization/i }));
    await userEvent.click(screen.getByText("Acme Corp"));

    // Open contacts dropdown
    await userEvent.click(screen.getByRole("combobox", { name: /contact/i }));

    // Only Acme contacts visible
    expect(screen.getByText("John from Acme")).toBeInTheDocument();
    expect(screen.queryByText("Jane from Other Corp")).not.toBeInTheDocument();
  });

  it("should clear mismatched selections", async () => {
    render(<QuickLogForm />);

    // Select contact from Acme
    await selectContact("John from Acme");
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    // Select opportunity from Different Corp
    await selectOpportunity("Deal from Different Corp");

    // Contact should be cleared
    expect(screen.queryByText("John from Acme")).not.toBeInTheDocument();
    expect(screen.getByText("Different Corp")).toBeInTheDocument();
  });
});
```

## Migration Guide

### Step 1: Update Filter Logic
Replace the existing `filteredContacts`, `filteredOrganizations`, and `filteredOpportunities` useMemo hooks with the centralized anchor pattern.

### Step 2: Add Clear Buttons
Wrap Contact and Organization dropdowns with the `DropdownWithClear` component.

### Step 3: Implement Clearing Logic
Add `handleOrganizationSelect`, `handleContactSelect`, and `handleOpportunitySelect` functions with dependent field clearing.

### Step 4: Update Form Descriptions
Change misleading "OR" text to accurately describe the relationship requirement.

### Step 5: Add Tests
Implement unit and integration tests to verify the cascading behavior.

## Performance Considerations

### Current Issues
- Loading 5000+ entities on component mount
- All entities rendered in DOM (no virtualization)
- Full list re-render on every filter change

### Recommendations
1. Implement virtualization for lists > 100 items
2. Add server-side search with debouncing
3. Use React.memo for CommandItem components
4. Consider pagination or lazy loading

## Accessibility Requirements

### ARIA Attributes
All combobox dropdowns must include:
- `aria-expanded={isOpen}`
- `aria-controls={listId}`
- `aria-haspopup="listbox"`
- `aria-autocomplete="list"`

### Keyboard Navigation
- Tab: Navigate between dropdowns
- Enter/Space: Open dropdown
- Arrow keys: Navigate options
- Escape: Close dropdown
- Delete/Backspace: Clear selection (when clear button focused)

## API Reference

### useAnchorOrganization Hook

```typescript
/**
 * Custom hook to manage the anchor organization for cascading filters
 * @param form - React Hook Form instance
 * @param contacts - Array of contact entities
 * @param opportunities - Array of opportunity entities
 * @returns Object with anchorOrgId and filtered arrays
 */
function useAnchorOrganization(
  form: UseFormReturn,
  contacts: Contact[],
  organizations: Organization[],
  opportunities: Opportunity[]
) {
  const anchorOrgId = useMemo(() => {
    // Implementation
  }, [/* deps */]);

  return {
    anchorOrgId,
    filteredContacts: useMemo(() => {/* ... */}),
    filteredOrganizations: useMemo(() => {/* ... */}),
    filteredOpportunities: useMemo(() => {/* ... */})
  };
}
```

## Related Documentation
- [QuickLogForm Component](./QuickLogForm.md)
- [Dashboard V3 Architecture](../dashboard/dashboard-v3-architecture.md)
- [Form Validation Patterns](../patterns/form-validation.md)
- [Accessibility Guidelines](../guidelines/accessibility.md)