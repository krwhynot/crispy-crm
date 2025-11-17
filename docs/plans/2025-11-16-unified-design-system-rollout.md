# Unified Design System Rollout

**Date:** 2025-11-16
**Status:** Design Complete
**Author:** Claude (with human refinement)
**Type:** Visual Consistency & UX Modernization

## Executive Summary

Transform Atomic CRM into a visually cohesive, premium-feeling application by applying the polished design patterns from Dashboard V2 and Contacts across all pages. This design standardizes list views with tables, implements slide-over panels for view/edit operations, maintains full-page forms for creation, and applies consistent visual styling throughout.

## Vision

Create a unified, professional CRM experience where every page follows the same design language, interaction patterns, and visual polish - making the application feel cohesive, modern, and premium.

## Core Design Principles

### 1. Visual Consistency
- Single design language across all resources (Contacts, Organizations, Opportunities, Tasks, Sales, Products)
- Unified color palette, spacing, and interaction patterns
- Professional, modern aesthetic with subtle polish

### 2. Layout Standardization
- **List views**: Left sidebar filters + main content area with tables
- **View/Edit**: Slide-over panels from right (keeps context, modern UX)
- **Create**: Full-page forms (clear "new record" experience, more space for complex inputs)

### 3. Premium Interactivity
- Smooth hover transitions on all clickable elements
- Shadow elevation on hover for depth
- Subtle lift animation (`-translate-y-0.5`) for tactile feedback
- Border state changes (transparent → visible) for focus indication

### 4. Information Density
- Moderate spacing (Dashboard V2 pattern: `p-3`, `gap-3`)
- Tables for list views (better information density than cards)
- Clean, breathable layouts that don't feel cramped

### 5. Light & Airy Aesthetic
- More `bg-muted` backgrounds for pages
- White/light cards (`bg-card`) for content containers
- Generous use of border radius (`rounded-lg`, `rounded-xl`)
- Subtle shadows for depth without heaviness

## List View Specification

### Layout Structure

Every list page follows this standardized pattern:

```
┌─────────────────────────────────────────────────────┐
│ Page Title (hidden via title={false})               │
│ TopToolbar (Sort, Export, Create buttons)           │
├────────────┬────────────────────────────────────────┤
│ Filters    │ Main Content Area                      │
│ Sidebar    │                                        │
│ (256px)    │ Card Container (bg-card)               │
│            │ ├─ Table (premium hover effects)       │
│            │ └─ Pagination                          │
│            │                                        │
│            │ FloatingCreateButton (bottom-right)    │
└────────────┴────────────────────────────────────────┘
```

### Component Breakdown

**1. Standardized List Shell** (`StandardListLayout.tsx`)
```tsx
<div className="flex flex-row gap-6">
  <aside aria-label="Filter {resource}" className="w-64 shrink-0">
    {filterComponent}
  </aside>
  <main role="main" aria-label="{Resource} list" className="flex-1 min-w-0">
    <Card className="bg-card border border-border shadow-sm rounded-xl p-2">
      {children} {/* Table content */}
    </Card>
  </main>
</div>
```

**2. Premium Table Row Styling** (`.table-row-premium`)
- Rounded corners with transparent border
- Hover effects: border reveal, shadow, lift animation
- Active state: scale feedback
- Focus state: ring indicator

**3. Filter Sidebar Pattern**
- Fixed width: `w-64` (256px)
- Sticky positioning for long lists
- Consistent filter components
- Active filter count badge
- "Clear all filters" button when filters active

**4. Table Specifications**
- Use React Admin `<Datagrid>` with custom styling
- Checkbox column for bulk actions
- Column headers with sort indicators
- Row click navigates to slide-over (not full page)
- Premium hover effects on every row

## Slide-Over Pattern for View/Edit

### Pattern Overview

Clicking any table row or "View" button opens a right slide-over panel (modeled after Dashboard V2's `RightSlideOver.tsx`). This replaces traditional full-page navigation for viewing and editing records.

### Visual Specifications

**Panel Dimensions**
- Width: `40vw` (min: 480px, max: 720px)
- Height: Full viewport (`h-screen`)
- Slides in from right with smooth transition (200ms ease-out)

**Panel Structure**
```
┌─────────────────────────────────────┐
│ Header                              │
│ ├─ Record title/name                │
│ ├─ Edit mode toggle button          │
│ └─ Close button (X)                 │
├─────────────────────────────────────┤
│ Tabs (horizontal)                   │
│ Details | History | Files | Notes   │
├─────────────────────────────────────┤
│                                     │
│ Tab Content Area                    │
│ (scrollable, padded)                │
│                                     │
│ [View mode: Read-only display]     │
│ [Edit mode: Form fields]            │
│                                     │
├─────────────────────────────────────┤
│ Footer (edit mode only)             │
│ [Cancel] [Save Changes]             │
└─────────────────────────────────────┘
```

### Two Modes

**View Mode** (default when opening)
- Read-only data display
- "Edit" button in header switches to edit mode
- Clean, card-based layout for fields
- Related data sections

**Edit Mode** (toggled from header)
- Inline form fields using existing tabbed form components
- "Cancel" discards changes, returns to view mode
- "Save" persists changes, returns to view mode
- Validation errors display inline

### Navigation Behavior

**Opening**
- Table row click → opens slide-over in view mode
- Edit button in table row → opens slide-over in edit mode directly

**Closing**
- X button in header
- ESC key
- Click backdrop (optional dimmed overlay)
- Save/Cancel in edit mode

**URL Handling**
- Slide-over state syncs with URL query params: `?view=123` or `?edit=123`
- Direct URL navigation works (deep linking)
- Browser back/forward buttons close/open slide-over

### Resource-Specific Tabs

- **Contacts**: Details | Activities | Notes | Files
- **Organizations**: Details | Contacts | Opportunities | Notes
- **Opportunities**: Details | History | Files | Activities
- **Tasks**: Details | Related Items
- **Sales**: Profile | Permissions
- **Products**: Details | Relationships

### Accessibility Requirements

**Focus Management**
- Focus trap when open (focus stays within slide-over)
- Focus moves to first interactive element on open (close button or first tab)
- Focus returns to triggering element when closed
- Tab/Shift+Tab cycles through slide-over elements only

**ARIA Attributes**
- `role="dialog"` on slide-over container
- `aria-modal="true"` to indicate modal behavior
- `aria-labelledby` pointing to header title
- `aria-describedby` for any helper text

**Keyboard Navigation**
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- ESC: Close slide-over
- Enter/Space: Activate buttons and links

**Screen Reader Support**
- Announce slide-over opening
- Read record name and current mode (view/edit)
- Announce tab changes
- Read validation errors in edit mode

## Create Form Patterns

### Pattern Overview

Create operations use full-page forms (not slide-overs) to provide ample space for complex inputs, clear "new record" context, and reduced cognitive load.

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb Navigation                                │
│ Home > Resources > New {Resource}                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│   ┌───────────────────────────────────────────┐    │
│   │ Card Container (centered, max-w-4xl)      │    │
│   │                                            │    │
│   │  Tabs (horizontal)                         │    │
│   │  General | Details | Other                 │    │
│   │  ────────────────────────────────────────  │    │
│   │                                            │    │
│   │  Tab Content (scrollable)                  │    │
│   │  [Form fields with validation]             │    │
│   │                                            │    │
│   │  ────────────────────────────────────────  │    │
│   │  Footer Actions                            │    │
│   │  [Cancel] [Save & Close] [Save & Add]     │    │
│   └───────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Visual Specifications

**Page Container**
- Background: `bg-muted` (light, airy feel)
- Padding: `px-[var(--spacing-edge-desktop)] py-6`

**Form Card**
- Centered: `max-w-4xl mx-auto`
- Card styling: `bg-card border border-border shadow-lg rounded-xl`
- Interior padding: `p-6`

**Footer Actions**
- Sticky footer: `sticky bottom-0 bg-card border-t border-border p-4`
- Button layout: Left (Cancel), Right (Save & Close, Save & Add Another)

### Quick-Add Variants

Some resources offer quick-add modals from list views:

- Modal dialog (not full-page)
- Single card, centered: `max-w-md`
- Minimal fields (name + 1-2 key fields)
- Used for: Tasks, Opportunities, Contacts, Organizations

### Form Behavior

**Validation**
- Zod schema validation (existing pattern: `src/atomic-crm/validation/`)
- Real-time validation on blur for critical fields
- Error display inline below fields with red border
- Error count badges on tabs (show count when > 0)
- Prevent submission until all required fields valid

**Save Actions**
- **Save & Close**: Creates record, redirects to list view with success toast
- **Save & Add Another**: Creates record, clears form, shows success toast, keeps on create page
- **Cancel**: Shows confirmation if form dirty ("You have unsaved changes. Discard?"), returns to list

**Dirty State Management**
- Track form modifications using React Hook Form's `isDirty`
- Warn on navigation attempts with unsaved changes
- Browser beforeunload event: "You have unsaved changes that will be lost"
- Cancel button shows confirmation only when dirty

**Optional Autosave**
- For complex forms (Opportunities, Organizations)
- Save draft to localStorage every 30 seconds when dirty
- Key format: `crm.draft.{resource}.{userId}`
- On form mount: check for draft, offer to restore ("Restore previous draft?")
- Clear draft on successful save
- Draft expiry: 7 days

**Field Defaults**
- Defaults from Zod schema (`.default()` methods)
- Form initialization: `zodSchema.partial().parse({})`
- Never use `defaultValue` prop in form components
- Date fields default to today for due dates, empty for others

## Visual Styling System

### Color Palette

**Strict semantic color usage** (no hex values):

- **Backgrounds**: `bg-muted` (page), `bg-card` (content), `bg-background` (nested)
- **Borders**: `border-border` (default), `border-primary` (focus), `border-destructive` (error)
- **Text**: `text-foreground`, `text-muted-foreground`, `text-primary`
- **Interactive**: `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-accent`

### Spacing System

**Moderate density** (Dashboard V2 pattern):

- Extra tight: `p-1` `gap-1` (4px) - icon spacing
- Tight: `p-2` `gap-2` (8px) - compact lists
- **Standard**: `p-3` `gap-3` (12px) - most UI elements ✓
- Comfortable: `p-4` `gap-4` (16px) - form fields
- Spacious: `p-6` `gap-6` (24px) - cards, sections

### Tokenized Utility Classes

Location: `src/index.css` in `@layer components`

```css
@layer components {
  /* Premium interactive card/row */
  .interactive-card {
    @apply rounded-lg border border-transparent bg-card px-3 py-1.5;
    @apply transition-all duration-150;
    @apply hover:border-border hover:shadow-md;
    @apply motion-safe:hover:-translate-y-0.5;
    @apply active:scale-[0.98];
    @apply focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2;
  }

  /* Premium table row styling (for Datagrid rows) */
  .table-row-premium {
    @apply rounded-lg border border-transparent bg-card px-3 py-1.5;
    @apply transition-all duration-150;
    @apply hover:border-border hover:shadow-md;
    @apply motion-safe:hover:-translate-y-0.5;
    @apply active:scale-[0.98];
    @apply focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2;
  }

  /* Standard card container */
  .card-container {
    @apply bg-card border border-border shadow-sm rounded-xl p-6;
  }

  /* Sidebar filter panel */
  .filter-sidebar {
    @apply w-64 shrink-0 space-y-4;
  }

  /* Premium button hover */
  .btn-premium {
    @apply transition-all duration-150;
    @apply hover:shadow-md hover:-translate-y-0.5;
    @apply active:scale-[0.98];
  }

  /* Focus ring */
  .focus-ring {
    @apply focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
  }
}
```

### Interactive States

- **Hover**: Background shift, border reveal, shadow elevation, subtle lift
- **Focus**: Ring with offset, outline removal (when ring present)
- **Active**: Scale down, brightness adjustment
- **Disabled**: Reduced opacity, cursor change

### Shadows & Borders

- **Shadows**: `shadow-sm` (cards), `shadow-md` (hover), `shadow-lg` (modals)
- **Border Radius**: `rounded-xl` (cards), `rounded-lg` (buttons), `rounded-md` (inputs)
- **Transitions**: Standard 150ms with ease-out, wrapped in `motion-safe:`

## Implementation Approach

### Phase 1: Foundation (Week 1)

**Goal:** Establish reusable components and utilities

1. Add tokenized utility classes to `src/index.css`
2. Create `StandardListLayout.tsx` component
3. Create `ResourceSlideOver.tsx` component
4. Update React Admin Datagrid styling with `PremiumDatagrid.tsx` wrapper

**Deliverables:**
- 3 new reusable components
- Updated CSS with utility classes
- Documentation in component files

### Phase 2: Pilot Resource - Contacts (Week 2)

**Goal:** Prove the pattern with one complete resource

1. Refactor ContactList.tsx with StandardListLayout
2. Build ContactSlideOver.tsx with tabs
3. Update routing for slide-over navigation
4. Update ContactCreate.tsx styling

**Testing:**
- E2E tests for slide-over open/close
- Keyboard navigation (Tab, ESC)
- URL deep linking
- Form validation in edit mode

### Phase 3: Rollout to Other Resources (Weeks 3-5)

**Order of migration** (based on complexity):

- **Week 3**: Tasks & Sales (simpler resources)
- **Week 4**: Organizations & Products
- **Week 5**: Opportunities (most complex, Kanban stays as alternate view)

**Each resource follows:**
1. List view → StandardListLayout + PremiumDatagrid
2. Show/Edit → Resource-specific slide-over
3. Create → Update styling, keep full-page
4. Update routing and navigation
5. Add tests

### Phase 4: Polish & Optimization (Week 6)

**Goal:** Refinement and performance

1. Accessibility audit (WCAG 2.1 AA)
2. Performance optimization (code splitting, lazy loading)
3. Visual consistency pass
4. Documentation updates

### Implementation Guidelines

**Boy Scout Rule**
- Fix inconsistencies when touching files
- Convert `type` to `interface` per ESLint rule (22 files pending)
- Update old color usages to semantic tokens
- Replace hardcoded spacing with semantic variables
- Clean up deprecated patterns while implementing new ones

**Testing Strategy**
- **Unit Tests**: 70% coverage minimum for new components
  - StandardListLayout.tsx
  - ResourceSlideOver.tsx
  - PremiumDatagrid.tsx
  - All utility hooks
- **E2E Tests**: Critical flows for each resource
  - List → View → Edit → Save flow
  - Slide-over open/close with keyboard
  - URL deep linking and browser navigation
  - Form validation and submission
- **Visual Regression** (optional but recommended)
  - Percy or Chromatic for detecting style drift
  - Capture before/after screenshots per phase

**Code Review Checkpoints**
- **After Phase 1**: Review foundation components for reusability
- **After Phase 2**: Validate Contacts implementation as template
- **Mid-Phase 3**: Review Tasks & Sales for pattern consistency
- **Before Phase 4**: Full review before polish phase
- **Final Review**: Complete accessibility and performance audit

**Feature Flags & Rollback Plan**
```typescript
// src/config/featureFlags.ts
export const features = {
  slideOverView: process.env.REACT_APP_SLIDEOVER === 'true',
  premiumTables: process.env.REACT_APP_PREMIUM_TABLES === 'true',
};

// Usage in components
if (features.slideOverView) {
  // New slide-over navigation
} else {
  // Legacy full-page navigation
}
```

**Rollback Strategy**
- Keep old components until migration proven stable (mark as `@deprecated`)
- Feature flags default to false in production initially
- Gradual rollout: Enable per resource or per user group
- URL routing remains backwards compatible
- Quick disable via environment variable if issues arise

### Migration Checklist (Per Resource)

- [ ] List view migrated to StandardListLayout
- [ ] Table styled with PremiumDatagrid
- [ ] Filter sidebar standardized
- [ ] Slide-over component created
- [ ] View mode implemented
- [ ] Edit mode implemented
- [ ] URL routing updated
- [ ] Create form styling updated
- [ ] E2E tests passing
- [ ] Accessibility audit passed
- [ ] Documentation updated

### Risk Mitigation

- **Slide-over breaking workflows**: Keep URL routes functional, test all navigation paths
- **Performance degradation**: Use `motion-safe:` prefix, monitor Core Web Vitals
- **Accessibility regressions**: Automated testing, manual keyboard nav checks
- **Scope creep**: Strict phase boundaries, no feature additions

## Success Metrics

- All 6 resources following unified design
- Lighthouse accessibility score ≥95 on all pages
- E2E test coverage for all critical flows
- Zero visual inconsistencies between resources
- Performance metrics maintained or improved

## Next Steps

1. Review and approve this design document
2. Set up feature branch for Phase 1 implementation
3. Create detailed task tickets for each phase
4. Begin Phase 1: Foundation components

## References

- Dashboard V2 implementation: `src/atomic-crm/dashboard/v2/`
- Contact list patterns: `src/atomic-crm/contacts/`
- Existing tabbed forms: `src/components/admin/tabbed-form/`
- Engineering Constitution: `docs/claude/engineering-constitution.md`
- Design System: `docs/architecture/design-system.md`