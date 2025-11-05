# Implementation Tasks: Tasks Module

**Created:** 2025-11-05
**Total Estimate:** 8-9 days
**Dependencies:** Tasks can be parallelized except database migration (must be first)

---

## Task Breakdown

### Phase 1: Database Migration (MUST BE FIRST)
**Estimate:** 4 hours
**Dependencies:** None
**Assignable to:** Backend/Database specialist

#### Task 1.1: Create Migration File
- [ ] Create `supabase/migrations/YYYYMMDDHHMMSS_add_tasks_multi_assignment.sql`
- [ ] Add multi-assignment columns (primary/secondary/tertiary_account_manager_id)
- [ ] Add organization_id column
- [ ] Migrate existing data (sales_id → primary_account_manager_id)
- [ ] Add foreign key constraints
- [ ] Add check constraint (primary Account Manager required)
- [ ] Create indexes (primary_account_manager_id, organization_id)
- [ ] Drop old sales_id column
- [ ] **Verification:** Run `npx supabase db reset` locally, confirm no errors

#### Task 1.2: Update RLS Policies
- [ ] Review existing RLS policies for tasks table
- [ ] Update SELECT policy to check all 3 Account Manager columns
- [ ] Update INSERT policy for primary Account Manager
- [ ] Update UPDATE policy for any assigned Account Manager
- [ ] Update DELETE policy for primary Account Manager
- [ ] **Verification:** Test with different users, confirm proper access control

#### Task 1.3: Test Migration
- [ ] Run migration on local database
- [ ] Verify existing task data migrated correctly
- [ ] Test foreign key constraints work
- [ ] Test RLS policies with different users
- [ ] Run EXPLAIN ANALYZE on common queries, confirm indexes used
- [ ] **Verification:** All existing tasks visible, no data loss

**Acceptance Criteria:**
- Migration runs without errors
- All existing tasks have primary_account_manager_id populated
- RLS policies enforce proper access control
- Indexes improve query performance

---

### Phase 2: Update Validation Layer
**Estimate:** 2 hours
**Dependencies:** Task 1 complete (need new schema)
**Assignable to:** Any developer

#### Task 2.1: Update Zod Schemas
- [ ] Open `src/atomic-crm/validation/tasks.ts`
- [ ] Update `taskCreateSchema`:
  - Replace `sales_id` with `primary_account_manager_id` (required)
  - Add `secondary_account_manager_id` (optional)
  - Add `tertiary_account_manager_id` (optional)
  - Add `organization_id` (optional)
- [ ] Update `taskUpdateSchema` (partial version)
- [ ] **Verification:** Import schemas in test file, confirm types correct

#### Task 2.2: Test Validation
- [ ] Create test file `src/atomic-crm/validation/tasks.test.ts`
- [ ] Test valid task creation with multi-assignment
- [ ] Test invalid cases (missing primary, invalid IDs)
- [ ] Test partial updates
- [ ] **Verification:** All tests pass

**Acceptance Criteria:**
- Zod schemas accept new multi-assignment fields
- TypeScript types correctly inferred
- Validation errors for missing primary Account Manager

---

### Phase 3: Create TaskList Page
**Estimate:** 2 days
**Dependencies:** Tasks 1 & 2 complete
**Assignable to:** Frontend developer

#### Task 3.1: Create TaskList Component
- [ ] Create `src/atomic-crm/tasks/TaskList.tsx`
- [ ] Use React Admin `<List>` component
- [ ] Define columns:
  - Title (clickable to Show)
  - Due Date (default sort: ASC)
  - Primary Account Manager name (join with sales table)
  - Related To (Contact/Opportunity/Organization with link)
  - Task Type
  - Completed (checkbox with inline toggle)
- [ ] Set default filter: `{ completed: false, primary_account_manager_id: currentUser }`
- [ ] Set default sort: `{ field: 'due_date', order: 'ASC' }`
- [ ] Pagination: 25 per page
- [ ] **Verification:** List renders, columns display correctly

#### Task 3.2: Add Filters
- [ ] Add filter sidebar with:
  - Completed (boolean select: All/Yes/No)
  - Due Date range (date picker)
  - Primary Account Manager (multi-select, searchable)
  - Task Type (multi-select)
  - Related Entity Type (Contact/Opportunity/Organization)
- [ ] Test each filter independently
- [ ] Test filter combinations
- [ ] **Verification:** All filters work, results update correctly

#### Task 3.3: Add Bulk Actions
- [ ] Add bulk action: Mark Complete
- [ ] Add bulk action: Delete (with confirmation)
- [ ] Add bulk action: Reassign Primary Account Manager
- [ ] Test with 0, 1, and multiple selected tasks
- [ ] **Verification:** Bulk actions work, UI updates correctly

#### Task 3.4: Add Empty/Error States
- [ ] Loading state: Skeleton rows
- [ ] Empty state: "No tasks found. Create your first task!"
- [ ] Error state: "Failed to load tasks. [Retry]"
- [ ] **Verification:** All states render correctly

**Acceptance Criteria:**
- Task list displays with all columns
- Filters work correctly
- Bulk actions functional
- Empty/error states display properly

---

### Phase 4: Create TaskShow Page
**Estimate:** 1.5 days
**Dependencies:** Tasks 1 & 2 complete
**Assignable to:** Frontend developer

#### Task 4.1: Create TaskShow Component
- [ ] Create `src/atomic-crm/tasks/TaskShow.tsx`
- [ ] Use React Admin `<Show>` component
- [ ] Display all fields (title, description, due date, completion status, Account Managers, associations, type)
- [ ] Show timestamps (created_at, updated_at, completed_at)
- [ ] **Verification:** All fields display correctly

#### Task 4.2: Add Actions
- [ ] Edit button (navigates to /tasks/:id/edit)
- [ ] Delete button (confirmation dialog)
- [ ] Mark Complete/Incomplete toggle (checkbox with confirmation)
- [ ] Postpone buttons (tomorrow / next week)
- [ ] Clone Task button (creates copy with new due date)
- [ ] **Verification:** All actions work correctly

#### Task 4.3: Add Activity Integration Dialog
- [ ] When task marked complete, show dialog:
  - "Log this as an activity? [Yes] [No]"
  - If Yes: Pre-fill activity form (type, description, related entity)
  - If No: Just mark complete
- [ ] Use existing activity creation API
- [ ] **Verification:** Dialog appears, activity created correctly

#### Task 4.4: Add Inline Editing
- [ ] Make title editable inline (click to edit)
- [ ] Make due date editable inline (date picker)
- [ ] Save on blur or Enter key
- [ ] **Verification:** Inline edits save correctly

**Acceptance Criteria:**
- Task details display fully
- All actions functional
- Activity integration dialog appears and works
- Inline editing saves correctly

---

### Phase 5: Create TaskCreate Page
**Estimate:** 1 day
**Dependencies:** Tasks 1 & 2 complete
**Assignable to:** Frontend developer

#### Task 5.1: Create TaskCreate Component
- [ ] Create `src/atomic-crm/tasks/TaskCreate.tsx`
- [ ] Use React Admin `<Create>` component with `<SimpleForm>`
- [ ] Add required fields:
  - Title (text input, max 200 chars)
  - Due Date (date picker, default: +3 days)
  - Primary Account Manager (searchable select, default: current user)
- [ ] Add optional fields:
  - Description (textarea, max 2000 chars)
  - Secondary Account Manager (searchable select)
  - Tertiary Account Manager (searchable select)
  - Related To (tab interface: Contact/Opportunity/Organization/None)
  - Task Type (select dropdown)
- [ ] **Verification:** Form renders, all fields present

#### Task 5.2: Add Form Validation
- [ ] Wire up Zod schema validation
- [ ] Show validation errors inline
- [ ] Disable Save button while invalid
- [ ] **Verification:** Validation errors display correctly

#### Task 5.3: Add Form Behavior
- [ ] Save button: Creates task, navigates to TaskShow
- [ ] Cancel button: Returns to TaskList
- [ ] Loading state while saving
- [ ] Error handling with toast notifications
- [ ] **Verification:** Task creation works end-to-end

**Acceptance Criteria:**
- Create form functional
- Validation works correctly
- Task created successfully
- Navigation works (Cancel → List, Save → Show)

---

### Phase 6: Create TaskEdit Page
**Estimate:** 1 day
**Dependencies:** Task 5 complete (reuse form)
**Assignable to:** Frontend developer

#### Task 6.1: Create TaskEdit Component
- [ ] Create `src/atomic-crm/tasks/TaskEdit.tsx`
- [ ] Use React Admin `<Edit>` component with `<SimpleForm>`
- [ ] Reuse form fields from TaskCreate
- [ ] Pre-populate with existing task data
- [ ] **Verification:** Form renders with existing data

#### Task 6.2: Add Edit Actions
- [ ] Save button: Updates task, returns to Show
- [ ] Cancel button: Returns to Show without saving
- [ ] Delete button: Confirmation dialog, then delete
- [ ] **Verification:** All actions work correctly

**Acceptance Criteria:**
- Edit form functional
- Task updates successfully
- Delete works with confirmation
- Navigation works (Cancel/Save → Show)

---

### Phase 7: Module Registration & Integration
**Estimate:** 4 hours
**Dependencies:** Tasks 3-6 complete
**Assignable to:** Any developer

#### Task 7.1: Create Module Exports
- [ ] Create `src/atomic-crm/tasks/index.ts`
- [ ] Export lazy-loaded components (List, Show, Edit, Create)
- [ ] Export `recordRepresentation` function
- [ ] **Verification:** Imports work correctly

#### Task 7.2: Register Resource in CRM.tsx
- [ ] Open `src/atomic-crm/root/CRM.tsx`
- [ ] Import Tasks module
- [ ] Add `<Resource name="tasks" {...Tasks} icon={TasksIcon} />`
- [ ] **Verification:** Tasks appears in navigation menu

#### Task 7.3: Add Navigation Menu Item
- [ ] Verify Tasks appears in main navigation
- [ ] Test navigation to /tasks route
- [ ] Test navigation to /tasks/create
- [ ] **Verification:** All routes work

**Acceptance Criteria:**
- Tasks module properly registered
- Navigation menu includes Tasks
- All routes functional (/tasks, /tasks/:id, /tasks/:id/edit, /tasks/create)

---

### Phase 8: Dashboard Integration
**Estimate:** 4 hours
**Dependencies:** Phase 7 complete
**Assignable to:** Frontend developer

#### Task 8.1: Add "Next Action" Link
- [ ] Open dashboard principal table component
- [ ] Make "Next Action" column clickable
- [ ] Link to `/tasks/:id` (TaskShow)
- [ ] **Verification:** Click opens correct task

#### Task 8.2: Add "View Tasks" Button
- [ ] In Opportunities view, add "View Tasks" button
- [ ] Filter tasks by `opportunity_id IN (opportunities for principal)`
- [ ] Navigate to TaskList with filter applied
- [ ] **Verification:** Filtered task list displays correctly

**Acceptance Criteria:**
- Dashboard links to tasks work
- Filtered task lists display correctly

---

### Phase 9: Testing
**Estimate:** 2 days
**Dependencies:** All phases complete
**Assignable to:** QA or any developer

#### Task 9.1: Unit Tests
- [ ] Test TaskList rendering
- [ ] Test TaskShow rendering
- [ ] Test TaskCreate form submission
- [ ] Test TaskEdit form submission
- [ ] Test filter logic
- [ ] Test bulk actions
- [ ] **Target:** 70% code coverage

#### Task 9.2: Integration Tests
- [ ] Test full CRUD cycle (Create → Show → Edit → Delete)
- [ ] Test multi-assignment workflow
- [ ] Test activity integration dialog
- [ ] Test dashboard integration
- [ ] **Verification:** All workflows work end-to-end

#### Task 9.3: Manual Testing
- [ ] Test with different user roles
- [ ] Test RLS policies (can only see assigned tasks)
- [ ] Test error handling (network errors, validation errors)
- [ ] Test performance with 100+ tasks
- [ ] **Verification:** No critical bugs found

**Acceptance Criteria:**
- 70% test coverage achieved
- All integration tests pass
- Manual testing finds no critical bugs

---

## Parallelization Strategy

**Can run in parallel:**
- After Phase 1 complete:
  - Phase 2 (Validation)
  - Phase 3 (TaskList) **← Worktree 1**
  - Phase 4 (TaskShow) **← Worktree 1**
  - Phase 5 (TaskCreate) **← Worktree 1**
  - Phase 6 (TaskEdit) **← Worktree 1**

**Must run sequentially:**
- Phase 1 (Database) → Phase 2-6
- Phases 2-6 → Phase 7 (Registration)
- Phase 7 → Phase 8 (Integration)
- Phase 8 → Phase 9 (Testing)

**Optimal approach:**
1. Complete Phase 1 (Database) first - **4 hours**
2. Run Phases 2-6 in parallel - **2 days** (longest task is TaskList at 2 days)
3. Complete Phase 7 (Registration) - **4 hours**
4. Complete Phase 8 (Integration) - **4 hours**
5. Complete Phase 9 (Testing) - **2 days**

**Total: 5-6 days** with parallelization (vs 8-9 days sequential)

---

## Definition of Done

- [ ] All 9 phases complete
- [ ] All acceptance criteria met
- [ ] 70% test coverage achieved
- [ ] No critical bugs found in manual testing
- [ ] Documentation updated (if needed)
- [ ] Code reviewed and approved
- [ ] Deployed to staging for QA testing

---

## Related Documentation

- **SRS:** `docs/planning/tasks-module/SRS.md`
- **Data Model:** `docs/planning/tasks-module/DATA-MODEL.md`
- **PRD:** `docs/prd/08-tasks-module.md`
