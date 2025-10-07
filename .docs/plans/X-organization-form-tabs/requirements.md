# Organization Form Tabs - Requirements

## Feature Summary

Add tabbed navigation to the Organization Edit and Create forms to reduce vertical scrolling and improve usability on iPad devices. The current single-page form will be reorganized into three logical tabs: "General" (essential info), "Details" (business/address data), and "Other" (less common fields). The implementation will include validation error badges on tabs, responsive layouts for different viewport sizes, and enhanced accessibility features.

## User Stories

### Primary User Story
**As a** CRM user editing organizations on an iPad
**I want** the organization form split into logical tabs
**So that** I can view and edit the form without excessive scrolling and quickly navigate to relevant sections

### Supporting User Stories

**As a** CRM user filling out a form
**I want** to see which tabs contain validation errors with error counts
**So that** I can quickly identify and fix all issues without hunting through tabs

**As a** CRM user on a tablet
**I want** the form layout to adapt to my device orientation
**So that** I have an optimal editing experience in both landscape and portrait modes

**As a** keyboard user
**I want** to navigate between tabs using keyboard controls
**So that** I can efficiently move through the form without using a mouse

**As a** screen reader user
**I want** clear announcements when validation errors occur
**So that** I understand which fields need attention across all tabs

## Technical Approach

### Frontend Components

**Primary Changes:**
- **`src/atomic-crm/organizations/OrganizationInputs.tsx`** - Main refactor location
  - Wrap existing inputs in shadcn/ui `Tabs` component
  - Implement `TAB_DEFINITIONS` constant mapping fields to tabs
  - Add validation error counting logic using `useFormState()` hook
  - Implement responsive grid layout within each tab

**Minimal Changes:**
- **`src/atomic-crm/organizations/OrganizationEdit.tsx`** - No changes needed (uses OrganizationInputs)
- **`src/atomic-crm/organizations/OrganizationCreate.tsx`** - No changes needed (uses OrganizationInputs)

**Existing Components Used:**
- `@/components/ui/tabs` (Tabs, TabsList, TabsTrigger, TabsContent)
- `@/components/ui/badge` (for error count indicators)
- React Admin's `useFormState` hook for validation state

### Tab Structure Definition

```typescript
// In OrganizationInputs.tsx
const TAB_DEFINITIONS = {
  general: {
    name: 'General',
    fields: [
      'name',
      'logo',
      'organization_type_id',
      'parent_organization_id',
      'account_manager_id',
      'description'
    ]
  },
  details: {
    name: 'Details',
    fields: [
      'phone',
      'address',
      'city',
      'postal_code',
      'state',
      'priority',
      'segment',
      'industry'
    ]
  },
  other: {
    name: 'Other',
    fields: [
      'website',
      'linkedin_url',
      'employee_count',
      'annual_revenue',
      'context_links'
    ]
  }
} as const;
```

### Validation Integration

**Error Count Calculation:**
```typescript
const { errors } = useFormState();
const errorKeys = Object.keys(errors);

const errorCounts = Object.entries(TAB_DEFINITIONS).reduce((acc, [tabKey, tabConfig]) => {
  acc[tabKey] = errorKeys.filter(key => tabConfig.fields.includes(key)).length;
  return acc;
}, {} as Record<string, number>);
```

**Tab Badge Rendering:**
```tsx
<TabsTrigger value="general">
  General
  {errorCounts.general > 0 && (
    <Badge variant="destructive" className="ml-2">
      {errorCounts.general}
    </Badge>
  )}
</TabsTrigger>
```

### Responsive Layout Strategy

**Breakpoints:**
- **Mobile/Portrait** (< 1024px): Single-column layout (`grid-cols-1`)
- **iPad Landscape** (≥ 1024px): Two-column layout (`lg:grid-cols-2`)

**Touch Optimization:**
- Minimum touch target size: 44x44px
- Increased vertical spacing between fields (`space-y-4` → `space-y-6`)
- Larger input heights for comfortable tapping

**Implementation:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
  {/* Fields within each tab */}
</div>
```

### Validation Error Flow

**On Save Failure:**
1. Display global error summary at top of form
2. Show error count badges on relevant tab triggers
3. Auto-navigate to first tab containing errors
4. Focus first invalid field in that tab
5. Error summary includes focusable links to each invalid field

**Implementation Approach:**
- Use React Admin's form validation hooks
- Leverage existing Zod schemas in `src/atomic-crm/validation/organizations.ts`
- No changes to validation logic needed - only UI presentation

### API/Database Changes

**None required** - This is purely a frontend UI refactor with no backend impacts.

### Data Flow

```
User enters form data
    ↓
Fields distributed across 3 tabs (but all under single <Form>)
    ↓
react-hook-form maintains unified form state
    ↓
On submit → Zod validation (existing)
    ↓
If validation fails:
  - Calculate error counts per tab
  - Display badges on tabs
  - Show global error summary
  - Navigate to first error tab
    ↓
If validation succeeds → Save to Supabase (existing flow)
```

## UI/UX Flow

### Step-by-Step User Experience

**1. Opening the Form**
- User clicks "Edit" on an organization or "Create Organization"
- Form loads with "General" tab active by default
- All three tabs visible in TabsList: "General", "Details", "Other"
- Form fields displayed in responsive grid (2-col on landscape iPad, 1-col on portrait)

**2. Navigating Between Tabs**
- User clicks tab trigger or uses keyboard (Arrow keys)
- Selected tab content appears
- Other tabs hidden but remain mounted (form state preserved)
- No loading/delay when switching tabs

**3. Filling Out Form**
- User enters data in any tab
- Changes saved to form state immediately
- Can freely switch between tabs without losing data
- Required fields: Name, Organization Type

**4. Validation Success Flow**
- User clicks "Save" button
- All fields validate successfully
- Form submits to backend
- User redirected to organization Show page or List

**5. Validation Error Flow**
- User clicks "Save" with invalid/missing data
- Form does NOT submit
- Global error summary appears at top: "Please fix X errors before saving"
- Error count badges appear on affected tabs (e.g., "General (2)", "Details (1)")
- Form automatically switches to first tab with errors
- Focus moves to first invalid field in that tab
- Field-level error messages display below each invalid field
- User fixes errors and tries again

**6. Responsive Behavior**
- **iPad Landscape (1024x768):**
  - Tabs displayed horizontally
  - Form fields in 2-column grid
  - Save/Cancel buttons always visible

- **iPad Portrait (768x1024):**
  - Tabs displayed horizontally
  - Form fields in single column
  - Vertical scrolling within tab (acceptable)

- **Mobile (< 768px):**
  - Tabs may wrap or scroll horizontally if needed
  - Single-column layout
  - Increased touch targets and spacing

### Accessibility Flow

**Keyboard Navigation:**
- Tab key moves between form fields
- Arrow keys navigate between tabs
- Enter/Space activates tab
- Focus indicators clearly visible

**Screen Reader Experience:**
- Tab role announced ("General tab, 1 of 3")
- Error badges announced ("General tab, 2 errors")
- Global error summary read when validation fails
- Error links in summary are keyboard-focusable

## Success Metrics

### Functional Requirements
✅ All existing organization fields present and functional
✅ Form state preserved when switching tabs
✅ Required field validation works across tabs
✅ Error count badges display correctly on tabs with validation issues
✅ Global error summary appears on validation failure
✅ Auto-navigation to first error tab on save failure
✅ Focus management to first invalid field

### Responsive Requirements
✅ Two-column layout on iPad landscape (≥1024px)
✅ Single-column layout on iPad portrait and mobile (<1024px)
✅ Touch targets minimum 44x44px
✅ Form content fits iPad viewport with minimal scrolling

### Accessibility Requirements
✅ Keyboard navigation works (Tab, Arrow keys, Enter/Space)
✅ Screen reader announces tab states and error counts
✅ Focus indicators visible on all interactive elements
✅ Error summary links are keyboard-accessible

### Performance Requirements
✅ No noticeable lag when switching tabs
✅ Form loads in under 1 second on iPad

### Testing Coverage
✅ E2E tests updated to handle tab navigation
✅ All existing organization CRUD tests still pass
✅ New tests cover validation across multiple tabs

## Out of Scope

### Explicitly NOT Included

❌ **Tab state persistence** - We will NOT remember which tab the user was on if they navigate away
❌ **Field changes** - No adding, removing, or modifying field types/validation
❌ **Backend changes** - No API endpoint modifications or database migrations
❌ **Backward compatibility** - Breaking UI changes are acceptable per Engineering Constitution
❌ **Other entity forms** - Only organizations; contacts, opportunities, etc. remain unchanged
❌ **Desktop optimization** - Primary focus is iPad; desktop continues to work but not specifically optimized
❌ **Tab reordering** - Fixed tab order (General → Details → Other)
❌ **Conditional tab visibility** - All three tabs always visible
❌ **Progressive form saving** - No auto-save between tabs; single save action at end
❌ **Mobile-specific layouts** - Mobile works but is not the primary design target
❌ **Custom tab icons** - Text-only tab labels
❌ **Tab tooltips or help text** - Standard labels only

### Future Enhancements (Not Now)

- Dirty state indicators on tabs (showing unsaved changes)
- Conditional tab visibility based on organization type
- Tab-level progress indicators
- Expandable/collapsible tab content
- Integration with other entity forms (contacts, opportunities)

## Implementation Notes

### Code Quality Standards
- Follow Engineering Constitution (NO OVER-ENGINEERING)
- Use semantic CSS variables (--primary, --destructive) only
- TypeScript: `interface` for objects, `type` for unions
- Follow existing form patterns in admin layer

### Testing Strategy
- Update E2E tests in `OrganizationList.spec.tsx` and similar
- Test tab navigation: `cy.contains('Details').click()`
- Test validation across tabs
- Test responsive breakpoints
- Test keyboard navigation
- Test screen reader announcements

### Deployment
- No database migrations required
- No environment variable changes
- No breaking API changes
- Deploy frontend changes directly

## Questions Resolved

1. ✅ Tab grouping: General (essentials), Details (business data), Other (less common)
2. ✅ Default tab: General
3. ✅ Validation indicators: Count badges on tabs
4. ✅ Form height: Optimized for iPad viewport with minimal scrolling
5. ✅ Applies to: Both Edit and Create modes
6. ✅ Empty states: Standard select/combobox placeholders
7. ✅ No tab state persistence needed
8. ✅ No fields removed or modified
9. ✅ Responsive: 2-col landscape, 1-col portrait
10. ✅ No code-breaking issues identified (reviewed by Zen)
