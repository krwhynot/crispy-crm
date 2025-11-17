# Unified Design System Rollout - Parallel Implementation Plan

This plan breaks down the unified design system rollout into parallelizable tasks optimized for multiple developers working concurrently. The rollout transforms 6 resources (Contacts, Organizations, Opportunities, Tasks, Sales, Products) from mixed patterns (card grids, custom layouts, Kanban boards) into a cohesive system using `StandardListLayout`, `ResourceSlideOver`, and `PremiumDatagrid` with premium interactive effects.

## Critically Relevant Files and Documentation

**Foundation Components (Phase 1)**:
- `/src/index.css` - Add `@layer components` with 7 utility classes (lines 632-680 in rollout plan)
- `/src/components/layouts/StandardListLayout.tsx` - List shell with sidebar + main content (CREATE)
- `/src/components/layouts/ResourceSlideOver.tsx` - Slide-over panel wrapper (CREATE)
- `/src/hooks/useSlideOverState.ts` - URL sync + ESC handling (CREATE)
- `/src/components/admin/PremiumDatagrid.tsx` - Datagrid wrapper with premium styles (CREATE)

**Reference Implementations**:
- `/src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx` - Slide-over pattern reference (40vw width, Sheet component, tabs)
- `/src/atomic-crm/contacts/ContactListFilter.tsx` - Filter sidebar pattern (collapsible categories, active filters)
- `/src/components/ui/card-elevation.stories.tsx` - Premium hover effects pattern (lines 18-32)

**Current Resource Files** (Read before migrating):
- Contacts: `/src/atomic-crm/contacts/ContactList.tsx`, `ContactListContent.tsx`, `ContactShow.tsx`
- Organizations: `/src/atomic-crm/organizations/OrganizationList.tsx`, `GridList.tsx`, `OrganizationCard.tsx`
- Opportunities: `/src/atomic-crm/opportunities/OpportunityList.tsx`, `OpportunityListContent.tsx` (Kanban)
- Tasks: `/src/atomic-crm/tasks/TaskList.tsx` (grouped accordion pattern)
- Sales: `/src/atomic-crm/sales/SalesList.tsx` (simple DataTable)
- Products: `/src/atomic-crm/products/ProductList.tsx`, `ProductGridList.tsx`

**Documentation**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` - Complete specification (1,682 lines)
- `/docs/plans/2025-11-16-unified-design-system-cleanup-strategy.md` - Phase-locked cleanup targets
- `/.docs/plans/unified-design-system-rollout/shared.md` - Architecture reference
- `/.docs/plans/unified-design-system-rollout/phase1-validation.md` - Foundation prerequisites validation
- `/.docs/plans/unified-design-system-rollout/contacts-current-state.md` - Contacts migration guide
- `/docs/claude/engineering-constitution.md` - Breaking changes allowed, no backward compatibility

## Implementation Plan

### Phase 1: Foundation Components (Parallel Tasks)

**Goal**: Build reusable components for all 6 resources. All tasks are independent and can run in parallel.

---

#### Task 1.1: Add CSS Utility Classes **Depends on [none]**

**READ THESE BEFORE TASK**:
- `/src/index.css` (lines 88-194 for existing patterns)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 572-680 for utility class specs)
- `/src/components/ui/card-elevation.stories.tsx` (lines 18-32 for premium hover pattern)

**Instructions**:

Files to Modify:
- `/src/index.css`

Add `@layer components` section after line 194 (after `@layer utilities`) with 7 utility classes:

1. **`.interactive-card, .table-row-premium`** (comma-separated, NO @extend):
   - Rounded corners, transparent border, bg-card, px-3 py-1.5
   - transition-all duration-150
   - Hover: border-border, shadow-md, motion-safe:-translate-y-0.5
   - Active: scale-[0.98]
   - Focus: ring-2 ring-ring ring-offset-2

2. **`.card-container`**:
   - bg-card border border-border shadow-sm rounded-xl p-6

3. **`.create-form-card`**:
   - bg-card border border-border shadow-lg rounded-xl p-6

4. **`.filter-sidebar`**:
   - w-64 shrink-0 space-y-4

5. **`.btn-premium`**:
   - transition-all duration-150
   - hover:shadow-md hover:-translate-y-0.5
   - active:scale-[0.98]

6. **`.focus-ring`**:
   - focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2

**CRITICAL**: Use comma-separated selectors for `.interactive-card, .table-row-premium` (PostCSS doesn't support @extend). Duplicate all @apply statements for both classes.

**Acceptance Criteria**:
- Build succeeds: `npm run build`
- No PostCSS errors in console
- Classes visible in dist: `grep "table-row-premium" dist/assets/*.css`
- All 7 classes use @apply with Tailwind utilities only (no raw CSS properties)

---

#### Task 1.2: Create StandardListLayout Component **Depends on [1.1]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 68-85, 728-778)
- `/src/atomic-crm/contacts/ContactListFilter.tsx` (filter sidebar reference)
- `/src/lib/design-system/accessibility.ts` (ARIA patterns)

**Instructions**:

Files to Create:
- `/src/components/layouts/StandardListLayout.tsx`

Create layout shell with:
- **Props**: `filterComponent: React.ReactNode`, `children: React.ReactNode`, `resource: string`
- **Structure**: `flex flex-row gap-6` container
- **Aside**: `aria-label="Filter {resource}"`, `.filter-sidebar`, `sticky top-[var(--spacing-section)] h-fit`
- **Aside wrapper**: `.card-container p-2` wrapping `filterComponent`
- **Main**: `role="main"`, `aria-label="{resource} list"`, `flex-1 min-w-0`
- **Main wrapper**: `.card-container` wrapping `children`

**TypeScript Interface**:
```typescript
interface StandardListLayoutProps {
  filterComponent: React.ReactNode;
  children: React.ReactNode;
  resource: string;
}
```

**Acceptance Criteria**:
- Component created at exact path
- Semantic HTML: `<aside>`, `<main>` with ARIA labels
- Uses `.filter-sidebar` and `.card-container` classes from Task 1.1
- No React Admin imports (pure layout component)
- TypeScript compiles without errors
- Exports named function: `export function StandardListLayout(...)`

---

#### Task 1.3: Create useSlideOverState Hook **Depends on [none]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 136-238 - **COPY EXACTLY**)
- `/src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx` (URL sync reference)

**Instructions**:

Files to Create:
- `/src/hooks/useSlideOverState.ts`

Implement hook with URL synchronization:

**State Management**:
- `slideOverId: number | null` - Record being viewed
- `isOpen: boolean` - Slide-over visibility
- `mode: 'view' | 'edit'` - Current mode

**URL Sync** (5 scenarios):
1. **Mount effect**: Read `?view=123` or `?edit=123` from URL, set initial state
2. **Popstate listener**: Handle browser back/forward buttons
3. **ESC key listener**: Close slide-over on ESC press
4. **openSlideOver**: Push new URL param (`?view=id` or `?edit=id`)
5. **closeSlideOver**: Remove URL params, preserve other query params
6. **toggleMode**: Replace URL param when switching view ↔ edit

**Return Object**:
```typescript
{ slideOverId, isOpen, mode, openSlideOver, closeSlideOver, setMode, toggleMode }
```

**COPY IMPLEMENTATION** from rollout plan lines 136-238 (fully specified with all edge cases).

**Acceptance Criteria**:
- Hook created with exact implementation from spec
- URL params update on open/close/mode toggle
- Browser back/forward works (popstate listener)
- ESC key closes slide-over
- Other query params preserved when adding/removing view/edit params
- TypeScript types exported for return object

---

#### Task 1.4: Create ResourceSlideOver Component **Depends on [1.1, 1.3]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 108-415 for complete spec)
- `/src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx` (reference implementation)
- `/src/components/ui/sheet.tsx` (shadcn Sheet component)
- `/src/lib/design-system/accessibility.ts` (focus trap patterns)

**Instructions**:

Files to Create:
- `/src/components/layouts/ResourceSlideOver.tsx`

Create slide-over wrapper using Sheet component from shadcn/ui:

**Props Interface**:
```typescript
interface ResourceSlideOverProps {
  resource: string;
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'view' | 'edit';
  onModeToggle?: () => void;
  tabs: TabConfig[];
}

interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<{ record: any; mode: 'view' | 'edit' }>;
  icon?: React.ComponentType;
}
```

**Structure**:
- **Sheet root**: `<Sheet open={isOpen} onOpenChange={onClose}>`
- **SheetContent**: `side="right"`, width: `w-[40vw] min-w-[480px] max-w-[720px]`
- **Header**: Record title/name, Edit mode toggle button, Close button (X)
- **Tabs**: Horizontal tabs from TabConfig array
- **Tab Content**: Scrollable area rendering active tab's component
- **Footer** (edit mode only): Cancel + Save Changes buttons

**Accessibility**:
- `role="dialog"` and `aria-modal="true"` (handled by Sheet)
- `aria-labelledby` pointing to header title
- Focus trap using Sheet's built-in focus management
- Initial focus to close button

**Data Fetching**:
- Use `useGetOne(resource, { id: recordId })` to fetch record
- Pass `record` and `mode` props to tab components
- Show loading state while fetching

**Acceptance Criteria**:
- Component uses shadcn Sheet (not custom modal)
- Width constraints: 40vw, min 480px, max 720px
- Slide-in animation: 200ms ease-out (Sheet default)
- All ARIA attributes present
- Focus trap works (Tab/Shift+Tab stays in dialog)
- ESC key closes (via useSlideOverState hook)
- Mode toggle button switches between view/edit
- Tabs render correctly with icons
- TypeScript compiles without errors

---

#### Task 1.5: Create PremiumDatagrid Wrapper **Depends on [1.1]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 826-865)
- `/src/components/admin/data-table.tsx` (existing DataTable component)
- `react-admin` docs for Datagrid props

**Instructions**:

Files to Create:
- `/src/components/admin/PremiumDatagrid.tsx`

Create React Admin Datagrid wrapper:

**Component Structure**:
```typescript
import { Datagrid, DatagridProps } from 'react-admin';

interface PremiumDatagridProps extends DatagridProps {
  onRowClick?: (id: number | string) => void; // Custom handler
}

export function PremiumDatagrid({ onRowClick, ...props }: PremiumDatagridProps) {
  return (
    <Datagrid
      {...props}
      rowClassName="table-row-premium"
      rowClick={onRowClick ? (id) => { onRowClick(id); return false; } : props.rowClick}
    />
  );
}
```

**Key Features**:
- **MUST spread `{...props}`** to inherit all Datagrid features (sorting, bulk actions, pagination)
- **rowClassName**: Always `"table-row-premium"` (applies CSS from Task 1.1)
- **rowClick**: Custom handler OR fallback to props.rowClick
- Return `false` from rowClick to prevent default navigation

**Acceptance Criteria**:
- Extends `DatagridProps` interface
- All React Admin Datagrid features work (sorting, filters, bulk select)
- Premium hover effects visible (border reveal, shadow, lift)
- Custom onRowClick handler works
- Falls back to props.rowClick if no custom handler
- TypeScript compiles without errors
- Exports named function: `export function PremiumDatagrid(...)`

---

#### Phase 1 Deliverables Checklist

- [ ] `src/index.css` updated with 7 utility classes in `@layer components`
- [ ] `src/components/layouts/StandardListLayout.tsx` created
- [ ] `src/components/layouts/ResourceSlideOver.tsx` created
- [ ] `src/hooks/useSlideOverState.ts` created
- [ ] `src/components/admin/PremiumDatagrid.tsx` created
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors when importing components
- [ ] JSDoc comments added to all exported components
- [ ] All components use semantic colors (no hex values)
- [ ] All spacing uses CSS variables (`var(--spacing-*)`)

---

### Phase 2: Contacts Pilot (Sequential Tasks with Dependencies)

**Goal**: Prove the pattern with Contacts resource. Tasks have dependencies but some can run in parallel.

---

#### Task 2.1: Update ContactCreate Styling **Depends on [1.1]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/contacts/ContactCreate.tsx` (current implementation)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1008-1039)
- `/.docs/plans/unified-design-system-rollout/contacts-current-state.md` (Task 2.4 section)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/contacts/ContactCreate.tsx`

**Changes**:
1. Wrap entire form in `bg-muted` page container with edge padding:
   ```tsx
   <div className="bg-muted px-[var(--spacing-edge-desktop)] py-6">
   ```

2. Replace `<Card>` wrapper with `.create-form-card` class:
   ```tsx
   <div className="max-w-4xl mx-auto create-form-card">
   ```

3. Keep existing `<ContactInputs />` (tabbed form - already matches pattern)

4. Replace `<FormToolbar />` with custom sticky footer:
   ```tsx
   <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-between mt-6">
     <Button variant="outline" onClick={handleCancel}>Cancel</Button>
     <div className="flex gap-2">
       <Button onClick={handleSaveAndClose}>Save & Close</Button>
       <Button onClick={handleSaveAndAddAnother}>Save & Add Another</Button>
     </div>
   </div>
   ```

5. Change redirect from "show" → "list"

6. Implement save handlers (Save & Close, Save & Add Another, Cancel with dirty check)

**Acceptance Criteria**:
- Page uses `bg-muted` background
- Form card uses `.create-form-card` class (shadow-lg elevation)
- Card centered: `max-w-4xl mx-auto`
- Sticky footer remains visible when scrolling
- Save & Close redirects to list with success toast
- Save & Add Another clears form, stays on create page
- Cancel shows confirmation if form dirty
- No changes to ContactInputs component (already tabbed)

---

#### Task 2.2: Build ContactSlideOver Component **Depends on [1.3, 1.4]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/contacts/ContactShow.tsx` (current show page - reuse fields)
- `/src/atomic-crm/contacts/ContactAside.tsx` (sidebar fields to redistribute)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 929-980)
- `/.docs/plans/unified-design-system-rollout/contacts-current-state.md` (Task 2.2 section)

**Instructions**:

Files to Create:
- `/src/atomic-crm/contacts/ContactSlideOver.tsx`
- `/src/atomic-crm/contacts/ContactDetailsTab.tsx`
- `/src/atomic-crm/contacts/ContactNotesTab.tsx`
- `/src/atomic-crm/contacts/ContactFilesTab.tsx`

**ContactSlideOver.tsx** (50 lines):
- Use `ResourceSlideOver` wrapper from Task 1.4
- Configure 4 tabs: Details, Activities, Notes, Files
- Fetch contact via `useGetOne("contacts", { id: recordId })`

**ContactDetailsTab.tsx** (200 lines):
- **View Mode**: Display contact fields from ContactShow + ContactAside:
  - Identity section: Avatar, Name, Gender, Title
  - Position section: Organization (link), Department, Title
  - Contact Info section: Email array, Phone array, LinkedIn
  - Account section: Sales rep, First seen, Last seen
  - Tags section: Tag badges (read-only)
  - Notes section: Free text notes field
- **Edit Mode**: Render existing `<ContactInputs />` component inline
- Save/Cancel buttons at bottom in edit mode

**ContactNotesTab.tsx** (50 lines):
- Wrapper around existing `NotesIterator` component (from ContactShow lines 116-124)
- Use `<ReferenceManyField reference="contactNotes" target="contact_id">`
- Include `<NoteCreate>` form at top
- Handle view vs edit mode (both allow note creation)

**ContactFilesTab.tsx** (20 lines):
- Placeholder component: "File attachments coming soon"
- Use `<Card>` with centered message

**ContactActivitiesTab** - REUSE existing `ActivitiesTab.tsx` from ContactShow (no new file needed)

**Tab Configuration**:
```typescript
const contactTabs: TabConfig[] = [
  { key: 'details', label: 'Details', component: ContactDetailsTab, icon: UserIcon },
  { key: 'activities', label: 'Activities', component: ContactActivitiesTab, icon: ActivityIcon },
  { key: 'notes', label: 'Notes', component: ContactNotesTab, icon: NoteIcon },
  { key: 'files', label: 'Files', component: ContactFilesTab, icon: FileIcon }
];
```

**Acceptance Criteria**:
- All 4 tabs render without errors
- Details tab shows all contact fields from ContactShow + ContactAside
- Activities tab reuses existing ActivitiesTab component
- Notes tab allows create/edit/delete notes
- Files tab shows placeholder
- Tab switching works smoothly (no flicker)
- View/Edit mode toggle in header works
- Edit mode shows ContactInputs inline
- Save persists changes, returns to view mode
- Cancel discards changes, returns to view mode
- Validation errors display inline in edit mode

---

#### Task 2.3: Refactor ContactList to Use StandardListLayout **Depends on [1.2, 1.5, 2.2]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/contacts/ContactList.tsx` (current list)
- `/src/atomic-crm/contacts/ContactListContent.tsx` (card layout to replace)
- `/src/atomic-crm/contacts/ContactListFilter.tsx` (filter sidebar - reuse)
- `/.docs/plans/unified-design-system-rollout/contacts-current-state.md` (Task 2.1 section)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/contacts/ContactList.tsx`

Files to Delete:
- `/src/atomic-crm/contacts/ContactListContent.tsx`

**Changes**:
1. Import new components:
   ```typescript
   import { StandardListLayout } from '@/components/layouts/StandardListLayout';
   import { PremiumDatagrid } from '@/components/admin/PremiumDatagrid';
   import { useSlideOverState } from '@/hooks/useSlideOverState';
   import { ContactSlideOver } from './ContactSlideOver';
   ```

2. Add slide-over state to ContactList:
   ```typescript
   const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } = useSlideOverState();
   ```

3. Replace ContactListLayout component (delete lines 44-67) with:
   ```tsx
   <StandardListLayout
     resource="contacts"
     filterComponent={<ContactListFilter />}
   >
     <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), 'view')}>
       {/* Table columns */}
     </PremiumDatagrid>
   </StandardListLayout>
   ```

4. Add ContactSlideOver after StandardListLayout:
   ```tsx
   <ContactSlideOver
     recordId={slideOverId}
     isOpen={isOpen}
     mode={mode}
     onClose={closeSlideOver}
     onModeToggle={toggleMode}
   />
   ```

5. Map card fields to table columns (10 columns):
   - Avatar (first column, non-sortable)
   - Name (combine first_name + last_name, sortable)
   - Title (sortable)
   - Department (sortable)
   - Organization (ReferenceField, sortable)
   - Tags (inline badges, non-sortable)
   - Last Activity (DateField, sortable)
   - Status (badge, non-sortable)
   - Bulk select checkbox (built-in)
   - Actions (EditButton, non-sortable)

6. Update ContactListFilter width from `w-52` to use `.filter-sidebar` class

**Acceptance Criteria**:
- ContactListContent.tsx deleted
- Table displays all 10 fields from card layout
- Row click opens slide-over (not full page)
- Premium hover effects visible (border, shadow, lift)
- All filters functional (search, tags, activity, manager)
- Filter sidebar width: 256px (via `.filter-sidebar`)
- Bulk selection works
- Sorting works on sortable columns
- FloatingCreateButton still visible
- Empty state renders when no contacts

---

#### Task 2.4: Update Routing for Slide-Over **Depends on [2.2, 2.3]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/contacts/index.ts` (module exports)
- `/src/atomic-crm/root/CRM.tsx` (resource registration)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 981-1006)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/contacts/index.ts`
- `/src/atomic-crm/root/CRM.tsx` (optional redirect)

**Changes to index.ts**:
```typescript
// OLD
export default {
  list: ContactList,
  show: ContactShow,  // ← REMOVE
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (r) => `${r.first_name} ${r.last_name}`
};

// NEW
export default {
  list: ContactList,
  // show removed - handled by slide-over
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (r) => `${r.first_name} ${r.last_name}`
};
```

**Optional Redirect** (for bookmarked URLs):
Add to CRM.tsx:
```tsx
<Route path="/contacts/:id/show" element={
  <Navigate to={`/contacts?view=${useParams().id}`} replace />
} />
```

**Acceptance Criteria**:
- ContactShow removed from exports
- `/contacts/:id/show` route removed or redirects
- Table row clicks open slide-over (not full page)
- Deep links work: `/contacts?view=123` opens slide-over on mount
- Browser back closes slide-over
- URL updates when toggling view/edit: `?view=123` ↔ `?edit=123`
- Closing slide-over removes query params

---

#### Task 2.5: Add Tests for Contacts Migration **Depends on [2.1, 2.2, 2.3, 2.4]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/contacts/ContactList.test.tsx` (existing tests to update)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1041-1094)
- `/.docs/plans/unified-design-system-rollout/contacts-current-state.md` (Task 2.5 section)

**Instructions**:

Files to Create:
- `/src/atomic-crm/contacts/ContactSlideOver.test.tsx`
- `/tests/e2e/contacts/slide-over.spec.ts`

Files to Modify:
- `/src/atomic-crm/contacts/ContactList.test.tsx`

**ContactSlideOver.test.tsx** (150 lines):
- Test tab switching (4 tabs)
- Test view/edit mode toggle
- Test save/cancel in edit mode
- Test validation errors display
- Test record fetching (useGetOne)
- Coverage ≥70%

**slide-over.spec.ts** (200 lines E2E tests):
- Row click opens slide-over
- ESC key closes slide-over
- Tab/Shift+Tab focus trap works
- Deep link opens: `/contacts?view=123`
- Browser back closes slide-over
- Form validation in edit mode
- All 4 tabs load correctly

**ContactList.test.tsx Updates** (170 lines):
- Remove card-based list tests
- Add table column rendering tests
- Update filter tests (sidebar width)
- Test row click behavior (opens slide-over)
- Test empty state

**Acceptance Criteria**:
- All unit tests pass: `npm test -- contacts`
- All E2E tests pass: `npm run test:e2e -- contacts/slide-over`
- Coverage ≥70% for ContactSlideOver
- Accessibility tests pass (axe DevTools, 0 violations)
- Lighthouse score ≥95 on list page

---

### Phase 3: Resource Migrations (Parallel Tracks)

**Goal**: Migrate remaining 5 resources in parallel. Resources grouped by complexity.

**PARALLEL TRACK 1: Simple Resources (Week 3)**

---

#### Task 3.1: Migrate Sales Resource **Depends on [1.1, 1.2, 1.5]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/sales/SalesList.tsx` (simple DataTable)
- `/.docs/plans/unified-design-system-rollout/resource-complexities.md` (Sales section)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1147-1167)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/sales/SalesList.tsx`

Files to Create:
- `/src/atomic-crm/sales/SalesSlideOver.tsx`
- `/src/atomic-crm/sales/SalesProfileTab.tsx`
- `/src/atomic-crm/sales/SalesPermissionsTab.tsx`

**Migration Steps**:
1. Wrap existing DataTable in StandardListLayout (no filter component - Sales has no filters)
2. Replace DataTable with PremiumDatagrid
3. Create SalesSlideOver with 2 tabs:
   - **Profile**: Name, Email, Phone, Avatar (view/edit)
   - **Permissions**: Role dropdown, Administrator toggle (edit only)
4. Update routing (remove show from exports)

**Unique Features to Preserve**:
- Role badges (admin/manager/rep) via `OptionsField`
- Administrator toggle in Permissions tab
- Disabled state indicator (gray out)

**Acceptance Criteria**:
- Table shows: Name, Email, Role badge, Status indicator
- No filter sidebar (inline search only)
- Slide-over has Profile + Permissions tabs
- Administrator toggle functional
- Row click opens slide-over

**Estimated Effort**: 1 day

---

**PARALLEL TRACK 2: Moderate Resources (Week 4)**

---

#### Task 3.2: Migrate Tasks Resource **Depends on [1.1, 1.2, 1.5]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/tasks/TaskList.tsx` (grouped accordion pattern)
- `/src/atomic-crm/tasks/TaskListFilter.tsx` (filter sidebar)
- `/.docs/plans/unified-design-system-rollout/resource-complexities.md` (Tasks section)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1116-1141)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/tasks/TaskList.tsx`
- `/src/atomic-crm/tasks/TaskListFilter.tsx`

Files to Create:
- `/src/atomic-crm/tasks/TaskSlideOver.tsx`
- `/src/atomic-crm/tasks/TaskDetailsTab.tsx`
- `/src/atomic-crm/tasks/TaskRelatedItemsTab.tsx`

**Migration Steps**:
1. Replace grouped accordion with StandardListLayout + PremiumDatagrid
2. Move principal filter to sidebar (already has sidebar filters)
3. Add "Show Completed" toggle to filter sidebar
4. Create TaskSlideOver with 2 tabs:
   - **Details**: Title, Description, Due Date, Priority, Type, Status
   - **Related Items**: Opportunity link, Contact link
5. Preserve inline completion checkbox in table rows

**Unique Features to Preserve**:
- Inline task completion checkboxes (add to table column)
- Due date color coding (overdue=red, today=yellow)
- Principal filter dropdown
- "Show completed" toggle
- Quick-add modal from dashboard widgets

**Breaking Changes**:
- Grouped accordion view removed (becomes table)
- Principal grouping becomes filter instead

**Acceptance Criteria**:
- Table as default view (no grouped accordion)
- Inline completion checkbox in table
- All filters functional (principal, due date, status, priority, type)
- Quick-add modal still works from dashboard
- Slide-over opens on row click

**Estimated Effort**: 2 days

---

#### Task 3.3: Migrate Products Resource **Depends on [1.1, 1.2, 1.5]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/products/ProductList.tsx`
- `/src/atomic-crm/products/ProductGridList.tsx` (grid cards)
- `/src/atomic-crm/products/ProductListFilter.tsx` (filter sidebar)
- `/.docs/plans/unified-design-system-rollout/resource-complexities.md` (Products section)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1200-1222)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/products/ProductList.tsx`
- `/src/atomic-crm/products/ProductListFilter.tsx`

Files to Create:
- `/src/atomic-crm/products/ProductSlideOver.tsx`
- `/src/atomic-crm/products/ProductDetailsTab.tsx`
- `/src/atomic-crm/products/ProductRelationshipsTab.tsx`

**Migration Steps**:
1. Replace grid view with StandardListLayout + PremiumDatagrid
2. Keep filter sidebar (already follows pattern)
3. Create ProductSlideOver with 2 tabs:
   - **Details**: Name, SKU, Category, Status, Principal
   - **Relationships**: Substitute products, Paired products
4. Update routing (remove show from exports)

**Unique Features to Preserve**:
- Product type badges (flavor, ingredient, packaging, etc.)
- Dynamic category filter (fetches from `distinct_product_categories` view)
- Principal relationship display

**Acceptance Criteria**:
- Table shows: Name, SKU, Type, Classification, Principal
- Filter sidebar uses `.filter-sidebar` class
- Slide-over has Details + Relationships tabs
- Type and classification filters functional
- Row click opens slide-over

**Estimated Effort**: 2 days

---

**PARALLEL TRACK 3: Complex Resources (Week 5)**

---

#### Task 3.4: Migrate Organizations Resource **Depends on [1.1, 1.2, 1.5]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/organizations/OrganizationList.tsx` (dual view with switcher)
- `/src/atomic-crm/organizations/GridList.tsx` (grid cards)
- `/src/atomic-crm/organizations/OrganizationCard.tsx` (card component)
- `/src/atomic-crm/organizations/OrganizationListFilter.tsx`
- `/.docs/plans/unified-design-system-rollout/resource-complexities.md` (Organizations section)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1169-1197)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/organizations/OrganizationList.tsx`
- `/src/atomic-crm/organizations/OrganizationListFilter.tsx`

Files to Create:
- `/src/atomic-crm/organizations/OrganizationSlideOver.tsx`
- `/src/atomic-crm/organizations/OrganizationDetailsTab.tsx`
- `/src/atomic-crm/organizations/OrganizationContactsTab.tsx`
- `/src/atomic-crm/organizations/OrganizationOpportunitiesTab.tsx`
- `/src/atomic-crm/organizations/OrganizationNotesTab.tsx`

Files to Delete:
- `/src/atomic-crm/organizations/GridList.tsx`
- `/src/atomic-crm/organizations/OrganizationCard.tsx`
- `/src/atomic-crm/organizations/OrganizationViewSwitcher.tsx`

**Migration Steps**:
1. **BREAKING**: Remove grid view toggle (direct migration per constitution)
2. Replace with StandardListLayout + PremiumDatagrid only
3. Delete GridList, OrganizationCard, OrganizationViewSwitcher
4. Create OrganizationSlideOver with 4 tabs:
   - **Details**: Name, Type, Parent, Priority, Hierarchy relationships
   - **Contacts**: All related contacts
   - **Opportunities**: All linked opportunities
   - **Notes**: Note creation + list
5. Update filter sidebar width to `.filter-sidebar`

**Unique Features to Preserve**:
- Parent/child hierarchy display (show in Details tab with breadcrumbs)
- Organization type badges (customer, distributor, principal)
- Contact count display
- Sister branches display (in Details tab)

**Breaking Changes**:
- Grid view toggle REMOVED
- No dual view (table only)
- Document in PR as breaking change

**Acceptance Criteria**:
- Table shows: Name, Type badge, Parent name (if exists), Contact count
- Grid view toggle removed
- Hierarchy relationships display in Details tab
- Contacts tab shows all related contacts
- Opportunities tab shows all linked opportunities
- Type filter multi-select works
- No localStorage view preference (removed)

**Estimated Effort**: 2 days

---

#### Task 3.5: Migrate Opportunities Resource **Depends on [1.1, 1.2, 1.5]**

**READ THESE BEFORE TASK**:
- `/src/atomic-crm/opportunities/OpportunityList.tsx` (triple view)
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx` (Kanban)
- `/src/atomic-crm/opportunities/OpportunityRowListView.tsx` (row list)
- `/src/atomic-crm/opportunities/CampaignView.tsx` (campaign grouped)
- `/.docs/plans/unified-design-system-rollout/resource-complexities.md` (Opportunities section)
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1224-1283)

**Instructions**:

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityList.tsx`

Files to Create:
- `/src/atomic-crm/opportunities/OpportunitySlideOver.tsx`
- `/src/atomic-crm/opportunities/OpportunityDetailsTab.tsx`
- `/src/atomic-crm/opportunities/OpportunityHistoryTab.tsx`
- `/src/atomic-crm/opportunities/OpportunityFilesTab.tsx`
- `/src/atomic-crm/opportunities/OpportunityActivitiesTab.tsx`

**Migration Steps**:
1. Make table PRIMARY view (default when visiting `/opportunities`)
2. Keep Kanban as SECONDARY view (toggle button in toolbar)
3. Add view toggle: "Table View" ↔ "Kanban View"
4. Save preference to localStorage: `opportunity.view_mode`
5. Create OpportunitySlideOver with 4 tabs:
   - **Details**: Name, Customer, Principal, Stage, Health, Amount, Close Date
   - **History**: Activity timeline, stage changes
   - **Files**: File attachments
   - **Activities**: Activity log
6. Slide-over works from BOTH table and Kanban views

**Unique Features to Preserve**:
- **Kanban board** (keep all existing features: drag-drop, quick-add, column collapse)
- Health status indicators (active/cooling/at_risk)
- Days-in-stage metrics
- Priority badges
- Campaign view (keep as option, hidden behind Kanban toggle)

**View Toggle Implementation**:
```typescript
const [viewMode, setViewMode] = useLocalStorage('opportunity.view_mode', 'table');

<TopToolbar>
  <Button onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}>
    {viewMode === 'table' ? 'Switch to Kanban' : 'Switch to Table'}
  </Button>
</TopToolbar>

{viewMode === 'table' ? (
  <StandardListLayout ...><PremiumDatagrid /></StandardListLayout>
) : (
  <OpportunityListContent /> // Existing Kanban
)}
```

**Acceptance Criteria**:
- Table view is default when visiting `/opportunities`
- Toggle button switches between table and Kanban
- Kanban preserves all features (drag-drop, column collapse, etc.)
- View preference persists (localStorage)
- Slide-over works from BOTH table and Kanban
- All filters work in both views
- Health status displays in table
- Days-in-stage calculated correctly
- Existing Kanban tests still pass

**Estimated Effort**: 3 days (most complex migration)

---

### Phase 4: Polish & Optimization (Parallel Tasks)

**Goal**: Refinement, accessibility, performance, documentation.

---

#### Task 4.1: Run Accessibility Audit **Depends on [All Phase 2-3 tasks]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1305-1331)
- Chrome DevTools Lighthouse documentation
- axe DevTools browser extension documentation

**Instructions**:

Tools to Use:
- **axe DevTools** (browser extension)
- **Lighthouse** (Chrome DevTools)
- **Manual keyboard testing** (Tab, Shift+Tab, Enter, Space, ESC)

**Pages to Audit** (18 pages):
- All 6 list views (Contacts, Organizations, Opportunities, Tasks, Sales, Products)
- All 6 slide-over dialogs (view mode)
- All 6 slide-over dialogs (edit mode)

**Target Metrics**:
- Lighthouse Accessibility: ≥95
- axe DevTools: 0 critical/serious violations
- Keyboard navigation: Logical tab order, visible focus, no traps
- Screen reader: Correct announcements (NVDA or VoiceOver)
- Color contrast: WCAG AA (4.5:1 text, 3:1 UI)
- Touch targets: ≥44px (WCAG 2.5.5)

**Create Report**:
Write findings to `docs/reports/accessibility-audit-YYYY-MM-DD.md` with:
- Lighthouse scores per page
- axe violations found (with fix PRs linked)
- Keyboard navigation issues
- Screen reader issues
- Recommendations for fixes

**Acceptance Criteria**:
- Lighthouse ≥95 on all 18 pages
- axe shows 0 critical/serious violations
- All form inputs have labels
- All interactive elements have focus indicators (2px ring)
- ARIA attributes correct (role, aria-modal, aria-labelledby)
- Report created with all findings

**Estimated Effort**: 1 day

---

#### Task 4.2: Run Performance Optimization **Depends on [All Phase 2-3 tasks]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1332-1377)
- React DevTools Profiler documentation
- Vite bundle analyzer documentation

**Instructions**:

**Metrics to Track**:
- Bundle size (total JS gzipped)
- Initial load time (Time to Interactive)
- Slide-over open time
- Table render time (500 rows)

**Thresholds**:
- Total bundle: <850KB gzipped
- Initial load (TTI): <3s
- Slide-over open: <150ms
- Table render (500 rows): <400ms

**Optimization Strategies**:
1. **Code splitting**: Lazy load slide-over components
   ```typescript
   const ContactSlideOver = lazy(() => import('./ContactSlideOver'));
   ```

2. **Tab lazy loading**: Load tab content only when activated
   ```typescript
   {activeTab === 'activities' && <Suspense><ActivitiesTab /></Suspense>}
   ```

3. **Virtual scrolling** (if tables exceed 500 rows):
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

4. **Image lazy loading**: Already handled by React Admin Avatar

**Create Report**:
Write findings to `docs/reports/performance-audit-YYYY-MM-DD.md` with:
- Bundle size before/after
- Lighthouse Performance scores
- React Profiler measurements
- Lazy loading implementation status
- Recommendations

**Acceptance Criteria**:
- Bundle size <850KB gzipped
- Lighthouse Performance ≥85
- Slide-over components lazy-loaded
- Tab content loads on-demand
- No unnecessary re-renders (<5 renders per interaction)
- Virtual scrolling implemented if needed
- Report created with measurements

**Estimated Effort**: 2 days

---

#### Task 4.3: Visual Consistency Pass **Depends on [All Phase 2-3 tasks]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1378-1406)
- Before/after screenshots from Phase 1-3 (should be in `docs/screenshots/before-after/`)

**Instructions**:

**Comparison Checklist** (for each of 6 resources):
- [ ] Filter sidebar: 256px width, same spacing (`gap-4`)
- [ ] Card containers: Same shadow (`shadow-sm`), radius (`rounded-xl`)
- [ ] Table rows: Premium hover effects consistent
- [ ] Slide-over: Same width (40vw, 480-720px), animation (200ms)
- [ ] Create forms: Same max-width (4xl), shadow (shadow-lg)
- [ ] Colors: All semantic tokens (verify no hex codes)
- [ ] Spacing: All CSS variables (verify no hardcoded px)
- [ ] Typography: Font sizes consistent (text-sm, text-base, text-lg)

**Verification Script**:
```bash
# Check for hardcoded hex colors
grep -r "#[0-9a-fA-F]\{6\}" src/atomic-crm/*/[A-Z]*.tsx

# Check for hardcoded pixel values in className
grep -r "className.*[0-9]\+px" src/atomic-crm/*/[A-Z]*.tsx

# Both should return minimal results (only in comments/strings)
```

**Screenshot Comparison**:
Use before/after screenshots in `docs/screenshots/before-after/`:
- `{resource}-list-before.png` vs `{resource}-list-after.png`
- `{resource}-slideover-after.png` (new)
- `{resource}-create-before.png` vs `{resource}-create-after.png`

**Create Report**:
Write findings to `docs/reports/visual-consistency-YYYY-MM-DD.md` with:
- Consistency checklist results
- Hardcoded value violations found
- Screenshot comparisons
- Recommendations for fixes

**Acceptance Criteria**:
- All 6 resources follow same layout structure
- No hardcoded hex colors in className props
- No hardcoded pixel values in className props
- All spacing uses CSS variables
- Screenshots stored in `docs/screenshots/before-after/`
- Report created with findings

**Estimated Effort**: 1 day

---

#### Task 4.4: Update Documentation **Depends on [All Phase 2-3 tasks]**

**READ THESE BEFORE TASK**:
- `/docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1407-1443)
- `/CLAUDE.md` (project documentation)
- `/docs/architecture/design-system.md`
- `/docs/architecture/component-library.md`

**Instructions**:

Files to Update:
- `/CLAUDE.md`
- `/docs/architecture/design-system.md`
- `/docs/architecture/component-library.md`
- `/.claude/skills/crispy-design-system/SKILL.md`

**CLAUDE.md Updates**:
1. Add "Design System Patterns" section
2. Link to unified design system rollout plan
3. Update "Architecture" section with StandardListLayout pattern
4. Document slide-over navigation pattern
5. Update "Essential Commands" if needed

**design-system.md Updates**:
1. Add StandardListLayout specification
2. Add ResourceSlideOver specification
3. Add PremiumDatagrid specification
4. Update color system (if changes made)
5. Update spacing system (if changes made)

**component-library.md Updates**:
1. Add to component inventory:
   - `StandardListLayout` (layouts)
   - `ResourceSlideOver` (layouts)
   - `PremiumDatagrid` (admin wrappers)
   - `useSlideOverState` (hooks)
2. Update usage examples
3. Add props interfaces

**crispy-design-system/SKILL.md Updates**:
1. Add StandardListLayout usage pattern
2. Add ResourceSlideOver pattern
3. Add acceptance criteria templates for future resources
4. Update with any new design tokens

**Acceptance Criteria**:
- All 4 files updated with new components
- Links tested (no broken references)
- Code examples tested (copy-paste ready)
- Component props documented with TypeScript interfaces
- Usage examples for each new component

**Estimated Effort**: 1 day

---

## Advice

**Critical Implementation Principles**:

1. **PostCSS Limitations**: The project uses plain PostCSS with Tailwind v4, which does NOT support Sass features like `@extend` or `@mixin`. To share styles between classes (`.interactive-card` and `.table-row-premium`), you MUST use comma-separated selectors and duplicate all `@apply` statements. Do not attempt to use `@extend` - it will fail at build time.

2. **Spacing Token Authority**: The spacing values in `src/index.css` lines 88-112 are the **authoritative source of truth** and are already desktop-optimized for data density. Comments showing "Reduced from X" are historical references only - DO NOT restore larger values as this will break the design system. Use these values via Tailwind's arbitrary value syntax: `px-[var(--spacing-edge-desktop)]`.

3. **URL Sync Implementation**: The `useSlideOverState` hook implementation in lines 136-238 of the rollout plan is **complete and tested**. Copy it exactly as specified - it handles all 5 URL sync scenarios (mount, popstate, ESC, open, close, toggle) with proper cleanup and edge case handling. Do not attempt to "improve" or simplify this implementation.

4. **Breaking Changes Are Expected**: Per Engineering Constitution, breaking changes are allowed and encouraged. Direct migration (no feature flags, no backward compatibility) is the approved approach. Document breaking changes clearly in PRs (grid view removal, URL navigation changes, etc.) but proceed with full replacement, not gradual rollout.

5. **Component Dependency Order Matters**: Phase 1 tasks build foundation components that Phase 2-3 depend on. Within Phase 1, Task 1.1 (CSS classes) must complete before Tasks 1.2, 1.4, 1.5 can use those classes. Task 1.3 (hook) is independent. Within Phase 2, Task 2.2 (ContactSlideOver) can develop in parallel with Task 2.1 (list refactor) - build slide-over first to enable testing before the navigation switchover.

6. **Resource Migration Complexity**: Sales (1 day) and Contacts (already done in Phase 2) are simplest. Tasks (2 days) and Products (2 days) are moderate - they require replacing unique views (grouped accordion, grid cards) with tables. Organizations (2 days) is complex due to hierarchy display but has clean deletion of grid toggle. Opportunities (3 days) is most complex - preserve Kanban as secondary view, handle triple view mode, ensure slide-over works from both table and Kanban.

7. **Testing Is Not Optional**: Each resource migration MUST include unit tests (≥70% coverage) and E2E tests for critical flows (row click → slide-over, ESC close, browser back, form validation). Accessibility audits (Lighthouse ≥95, axe 0 violations) are required before considering a migration complete. Budget 30-40% of implementation time for testing.

8. **Reuse Over Rewrite**: Many slide-over tab components can reuse existing Show page components. ContactSlideOver reuses `ActivitiesTab`, `NotesIterator`, and all `ContactInputs` tabs. Look for opportunities to extract and reuse rather than rewriting - this reduces risk and maintains consistency with existing tested code.

9. **Filter Sidebar Width Standard**: All resources must use `.filter-sidebar` class (256px width) for consistency. The current Contacts filter is 208px (`w-52`) and needs adjustment. Do not mix hardcoded widths - always use the utility class.

10. **Slide-Over Width Constraints**: All slide-over panels must use the same width formula: `w-[40vw] min-w-[480px] max-w-[720px]`. This ensures consistency across resources and responsive behavior. Do not use fixed widths or different viewport percentages.

11. **Premium Hover Effects Pattern**: The `.table-row-premium` class applies the full premium effect pattern (border transparent → visible, shadow-sm → shadow-md, -translate-y-0.5 lift, scale-[0.98] press, focus ring). Apply this class via PremiumDatagrid's `rowClassName` prop - do not duplicate these styles inline in components.

12. **Semantic Color Enforcement**: All color usage must be via CSS custom properties (e.g., `bg-primary`, `text-foreground`, `border-border`). The design system has 150+ OKLCH tokens covering all use cases. Never use hex codes, never use direct OKLCH values - only semantic tokens. Validate with: `grep -r "#[0-9a-fA-F]\{6\}" src/` (should find nothing except comments).

13. **View Toggle Pattern for Opportunities**: When preserving Kanban as secondary view, use localStorage with key `opportunity.view_mode` and values `'table'` or `'kanban'`. Default to `'table'` for new users. Render conditionally but ensure both views use the same slide-over component for consistency.

14. **Error Badge Behavior**: In tabbed forms (create/edit), error count badges should only display when count > 0. The `TabTriggerWithErrors` component already implements this pattern. In slide-over edit mode, reuse existing tabbed form components rather than rebuilding validation UI.

15. **Phase 4 Cannot Start Until Phase 3 Complete**: Accessibility audits, performance optimization, and visual consistency checks require all resources to be migrated first. Do not attempt these tasks prematurely - measurements taken on partially migrated resources will be invalid and waste time.

**Common Pitfalls to Avoid**:

- **Mixing widths**: Filter sidebar must always be 256px (`.filter-sidebar`), not 208px or 240px or custom values
- **Hardcoded colors**: Using `#336600` instead of `bg-brand-500` breaks light/dark mode switching
- **Forgetting URL sync**: Slide-over MUST update URL params and handle browser back/forward via useSlideOverState hook
- **Breaking accessibility**: Every slide-over needs `role="dialog"`, `aria-modal="true"`, focus trap, ESC handling
- **Skipping cleanup**: When removing Show components, also remove from index.ts exports and update routing
- **Incomplete testing**: E2E tests must cover keyboard navigation (Tab/Shift+Tab/ESC) and URL deep linking
- **Premature optimization**: Don't lazy load components in Phase 2-3 - wait for Phase 4 performance task
- **Grid view nostalgia**: Organizations grid toggle is BREAKING CHANGE - delete it, don't preserve as hidden option

**Success Indicators**:

- Build passes: `npm run build` (no PostCSS errors, no TypeScript errors)
- Tests pass: `npm test` and `npm run test:e2e` (≥70% coverage on new components)
- Visual consistency: All 6 resources look like variations of the same application, not 6 different apps
- Accessibility: Lighthouse ≥95, axe 0 critical/serious violations, keyboard navigation smooth
- Performance: Bundle <850KB, table render <400ms, slide-over open <150ms
- Documentation: Other developers can implement new resources using the pattern without asking questions
