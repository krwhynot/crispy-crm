# Tabbed Form Standardization Design

**Date:** 2025-11-10
**Status:** Design Complete - Ready for Implementation
**Context:** Standardize form UI across all CRM resources using tabbed pattern from Organizations

## Overview

The Organizations Create/Edit forms use a tabbed interface (General | Details | Other) with error tracking badges. This design extends that pattern to all CRM forms: Contacts, Opportunities, Tasks, Products, and Sales.

### Goals

1. Consistent form UI across all resources
2. Reusable tabbed form components (atomic design)
3. Error tracking with visual badges on all tabs
4. Custom tab structure per resource
5. Zero regressions in existing functionality

### Non-Goals

- Notes forms (inline, embedded component)
- Redesigning form field layouts
- Changing validation logic
- Adding new fields

## Architecture

### Atomic Design Structure

**Atoms** (shadcn/ui - already exist)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge`

**Molecules** (new components)
- `TabTriggerWithErrors` - Tab trigger with error badge and aria-labels
- `TabPanel` - Tab content with consistent padding and borders

**Organisms** (new component)
- `TabbedFormInputs` - Main reusable form container

**Location:** `src/components/admin/tabbed-form/`

### Component Specifications

#### TabbedFormInputs (Organism)

**Purpose:** Main container that renders tabbed form structure with error tracking.

**Interface:**
```typescript
interface TabDefinition {
  key: string;              // Unique tab identifier
  label: string;            // Display label
  fields: string[];         // Field names for error tracking
  content: React.ReactNode; // Tab panel content
}

interface TabbedFormInputsProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  className?: string;
}
```

**Responsibilities:**
1. Render tab list and content for each tab
2. Track form errors via `useFormState()` from React Hook Form
3. Calculate error counts per tab based on `fields` array
4. Pass error counts to `TabTriggerWithErrors`
5. Apply consistent styling to all panels

**Error Calculation:**
```typescript
const { errors } = useFormState();
const errorKeys = Object.keys(errors || {});

// For each tab, count matching errors
const errorCount = errorKeys.filter(key =>
  tab.fields.includes(key)
).length;
```

#### TabTriggerWithErrors (Molecule)

**Purpose:** Tab trigger with error badge and accessibility labels.

**Interface:**
```typescript
interface TabTriggerWithErrorsProps {
  value: string;
  label: string;
  errorCount: number;
}
```

**Responsibilities:**
1. Render `TabsTrigger` with label
2. Show `Badge` with error count when `errorCount > 0`
3. Apply aria-label with error count for screen readers
4. Use `variant="destructive"` for error badges (semantic color)

**Example:**
```tsx
<TabTriggerWithErrors
  value="general"
  label="General"
  errorCount={2}
  // Renders: "General" with red badge showing "2"
  // aria-label: "General tab, 2 errors"
/>
```

#### TabPanel (Molecule)

**Purpose:** Consistent tab content wrapper with design system styles.

**Interface:**
```typescript
interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}
```

**Responsibilities:**
1. Wrap content in `TabsContent`
2. Apply consistent padding: `p-6` (24px)
3. Apply border: `border border-[color:var(--border-subtle)]`
4. Apply background: `bg-[color:var(--bg-secondary)]`
5. Apply border radius: `rounded-lg`

**Pattern:**
```tsx
<TabPanel value="general">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
    {/* Form fields */}
  </div>
</TabPanel>
```

### Usage Pattern

**Example (ContactInputs.tsx):**
```tsx
export const ContactInputs = () => {
  return (
    <TabbedFormInputs
      tabs={[
        {
          key: 'identity',
          label: 'Identity',
          fields: ['first_name', 'last_name'],
          content: <ContactIdentityTab />
        },
        {
          key: 'position',
          label: 'Position',
          fields: ['title', 'department', 'organization_id'],
          content: <ContactPositionTab />
        },
        {
          key: 'contact_info',
          label: 'Contact Info',
          fields: ['email', 'phone', 'linkedin_url'],
          content: <ContactInfoTab />
        },
        {
          key: 'account',
          label: 'Account',
          fields: ['sales_id', 'notes'],
          content: <ContactAccountTab />
        }
      ]}
      defaultTab="identity"
    />
  );
};
```

## Tab Structures Per Resource

### 1. Organizations (Already Tabbed ✅)

**Status:** Reference implementation, will refactor to use shared components

**Tabs:** General | Details | Other

- **General:** name, logo, organization_type, parent_id, description, sales_id
- **Details:** segment_id, priority, address, city, postal_code, state, phone
- **Other:** website, linkedin_url, context_links

### 2. Contacts

**Tabs:** Identity | Position | Contact Info | Account

- **Identity:** Avatar, first_name, last_name
- **Position:** title, department, organization_id (+ "New Organization" button)
- **Contact Info:** email (array), phone (array), linkedin_url
- **Account:** sales_id (account manager), notes

### 3. Opportunities

**Tabs:** General | Classification | Relationships | Details

- **General:** name, description, estimated_close_date
- **Classification:** stage, priority, lead_source, campaign, tags
- **Relationships:** customer_organization_id, principal_organization_id, distributor_organization_id, account_manager_id, contact_ids (array), products_to_sync (array)
- **Details:** related_opportunity_id, notes, next_action, next_action_date, decision_criteria

### 4. Tasks

**Tabs:** General | Details

- **General:** title, description, due_date, reminder_date
- **Details:** priority, type, opportunity_id, contact_id, sales_id

### 5. Products

**Tabs:** General | Relationships | Classification

- **General:** name, sku, description
- **Relationships:** principal_id, distributor_id
- **Classification:** category, status

### 6. Sales (Users)

**Tabs:** General | Permissions

- **General:** first_name, last_name, email
- **Permissions:** administrator, disabled

### 7. Notes

**Status:** Skip - embedded inline form, not standalone page

## Migration Strategy

### Phase 1: Create Shared Components

1. Create `src/components/admin/tabbed-form/` directory
2. Implement `TabTriggerWithErrors.tsx`
3. Implement `TabPanel.tsx`
4. Implement `TabbedFormInputs.tsx`
5. Create `index.ts` with exports
6. Write unit tests

**Acceptance:**
- All tests pass
- TypeScript compiles without errors
- Components follow atomic design principles

### Phase 2: Refactor Organizations (Pilot)

1. Extract sections into separate components:
   - `OrganizationGeneralTab.tsx`
   - `OrganizationDetailsTab.tsx`
   - `OrganizationOtherTab.tsx`
2. Refactor `OrganizationInputs.tsx` to use `TabbedFormInputs`
3. Remove duplicated tab logic
4. Test thoroughly (no visual or functional changes)

**Acceptance:**
- Organizations form looks identical
- Error tracking works as before
- All existing tests pass
- No console errors

### Phase 3: Migrate Remaining Resources

**Order:** Simple → Complex

1. **Sales** (simplest: 2 tabs, 5 fields)
2. **Tasks** (simple: 2 tabs, ~8 fields)
3. **Products** (medium: 3 tabs, ~7 fields)
4. **Contacts** (complex: 4 tabs, many fields including arrays)
5. **Opportunities** (most complex: 4 tabs, deeply nested sections)

**Per-Resource Steps:**
1. Create tab content components (`*{Tab1|Tab2|...}Tab.tsx`)
2. Update `*Inputs.tsx` to use `TabbedFormInputs`
3. Map fields to tabs for error tracking
4. Test visual and functional behavior
5. Verify no regressions

**Acceptance (per resource):**
- Form renders without errors
- All fields accessible
- Validation errors appear in correct tabs
- Error badges update correctly
- Tab switching works
- Existing functionality unchanged
- All tests pass

### Phase 4: Cleanup

1. Remove any duplicated tab logic
2. Update component library documentation
3. Add usage examples
4. Update CLAUDE.md if needed

## Testing Requirements

### Unit Tests

**Location:** `src/components/admin/tabbed-form/__tests__/`

**TabbedFormInputs Tests:**
- Renders all tabs with correct labels
- Calculates error counts correctly per tab
- Shows error badges only when errors > 0
- Applies correct aria-labels with/without errors
- Switches tabs correctly (defaultTab prop)
- Passes className prop through
- Handles empty errors object
- Handles nested field errors (e.g., `email[0].email`)

**TabTriggerWithErrors Tests:**
- Renders label correctly
- Shows badge when errorCount > 0
- Hides badge when errorCount = 0
- Applies correct aria-label based on errors
- Uses destructive variant for error badges

**TabPanel Tests:**
- Renders children correctly
- Applies consistent padding and borders
- Passes className prop through
- Uses semantic color variables

### Integration Tests

**Per Refactored Resource:**
- Form renders without errors
- All fields accessible
- Validation errors appear in correct tabs
- Tab switching works
- Error badges update on validation
- Existing functionality unchanged
- No visual regressions

### Manual Verification

**Per Resource:**
- Tab styling matches Organizations pattern
- Error badges appear correctly
- Responsive behavior (mobile/tablet/desktop)
- Color system compliance (semantic vars only)
- Accessibility (keyboard navigation, screen readers)
- Touch targets 44x44px minimum

## Design System Compliance

### Color System

**Semantic Variables Only:**
- Tab panels: `--border-subtle`, `--bg-secondary`
- Text: `--text-primary`, `--text-subtle`
- Error badges: `variant="destructive"` (already semantic)

**Forbidden:**
- Hardcoded hex values
- Direct OKLCH values
- Non-semantic color references

### Spacing System

**Standard Patterns:**
- Tab panel padding: `p-6` (24px)
- Grid layouts: `gap-4 lg:gap-6`
- Section spacing: Follow existing form patterns
- Apply `--spacing-*` vars where appropriate

### Typography

**Consistent Styles:**
- Tab labels: Default font weight
- Section headers: `text-base font-semibold`
- Match existing form typography

### Responsive Design

**Requirements:**
- iPad-first approach (768px+ breakpoint)
- Tabs stack appropriately on mobile
- Touch targets 44x44px minimum
- Horizontal scroll for overflow content
- Grid layouts collapse to single column on mobile

## Edge Cases

### Error Tracking Edge Cases

1. **Empty errors object**
   - No errors: All badges hidden
   - No crashes or undefined errors

2. **No matching fields**
   - Tab shows 0 errors even if form has errors elsewhere
   - Errors only counted for fields in tab's `fields` array

3. **Nested field errors**
   - Array fields like `email[0].email` should match parent field `email`
   - Consider field prefix matching for nested errors

4. **Dynamic fields**
   - Fields added/removed at runtime (ArrayInput items)
   - Error counts update correctly as fields change

5. **Async validation**
   - Errors appear after initial render
   - Error badges update when async validation completes

6. **Tab switching with errors**
   - User can navigate to any tab regardless of errors
   - No tab should be disabled due to errors

### Performance Considerations

1. **Memoize error calculations**
   - Use `useMemo` for error count calculations
   - Avoid unnecessary re-renders

2. **Lazy render optimization**
   - Only active tab content renders (built into shadcn Tabs)
   - Inactive tabs don't compute until activated

3. **Avoid prop drilling**
   - Use context if component tree gets deep
   - Keep component hierarchy shallow where possible

## Accessibility Requirements

### Keyboard Navigation

- Arrow keys navigate between tabs
- Home key jumps to first tab
- End key jumps to last tab
- Tab key moves focus to next focusable element
- Enter/Space activates selected tab

### Screen Readers

- Proper ARIA attributes on all tabs
- Error counts announced with tab labels
- Tab role="tablist" on container
- Tab role="tab" on triggers
- Tab role="tabpanel" on content

### Visual Indicators

- Color is not the only error indicator
- Error badges provide text (count)
- High contrast for error badges
- Focus indicators on all interactive elements

### WCAG 2.1 AA Compliance

- Contrast ratios meet AA standards
- Touch targets 44x44px minimum
- Focus indicators visible
- Keyboard navigation fully functional

## Implementation Checklist

### Phase 1: Components
- [ ] Create `src/components/admin/tabbed-form/` directory
- [ ] Implement `TabTriggerWithErrors.tsx`
- [ ] Implement `TabPanel.tsx`
- [ ] Implement `TabbedFormInputs.tsx`
- [ ] Create `index.ts` with exports
- [ ] Write unit tests
- [ ] All tests pass

### Phase 2: Organizations Refactor
- [ ] Extract `OrganizationGeneralTab.tsx`
- [ ] Extract `OrganizationDetailsTab.tsx`
- [ ] Extract `OrganizationOtherTab.tsx`
- [ ] Refactor `OrganizationInputs.tsx`
- [ ] Visual verification (no changes)
- [ ] Functional testing (no regressions)
- [ ] All existing tests pass

### Phase 3: Resource Migration
- [ ] Sales forms (Create + Edit)
- [ ] Tasks forms (Create + Edit)
- [ ] Products forms (Create + Edit)
- [ ] Contacts forms (Create + Edit)
- [ ] Opportunities forms (Create + Edit)

### Phase 4: Quality Assurance
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual visual verification complete
- [ ] Accessibility audit complete
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable

### Phase 5: Documentation
- [ ] Update component library docs
- [ ] Add usage examples
- [ ] Update CLAUDE.md if needed
- [ ] Document edge cases and solutions

## Success Criteria

✅ All forms use tabbed interface with consistent styling
✅ Error tracking works on all forms
✅ All existing tests pass
✅ No visual regressions
✅ No functional regressions
✅ Zero console errors or warnings
✅ Keyboard navigation works on all forms
✅ Screen readers announce errors correctly
✅ Touch targets meet 44x44px minimum
✅ Color system compliance verified
✅ Performance metrics acceptable

## References

- [Engineering Constitution](../claude/engineering-constitution.md)
- [Design System](../architecture/design-system.md)
- [Component Library](../architecture/component-library.md)
- [Organization Hierarchies Design](./2025-11-10-organization-hierarchies-design.md)
- [shadcn/ui Tabs Component](https://ui.shadcn.com/docs/components/tabs)

---

**Next Steps:** Ready for implementation. Follow migration phases sequentially. Start with Phase 1 (shared components), then Phase 2 (Organizations refactor as pilot), then Phase 3 (remaining resources).
