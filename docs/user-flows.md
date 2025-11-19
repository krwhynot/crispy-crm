# Core User Flows

## Flow 1: Create New Contact

**Trigger:** Sales rep needs to add a new contact to the CRM

**Steps:**
1. User navigates to `/contacts` (Contacts list page)
2. User clicks "Create" button in top toolbar (or floating "+" button bottom-right)
3. Browser navigates to `/contacts/create` (full-page create form)
4. Form displays with tabs: "Identity" | "Position" | "Contact Info" | "Account"
5. User fills required fields:
   - **Identity tab:** Name (required), First Name, Last Name, Gender
   - **Position tab:** Title, Department
   - **Contact Info tab:** Email (JSONB array with type), Phone (JSONB array with type), Social links
   - **Account tab:** Primary Organization (searchable dropdown), Tags (multi-select)
6. User clicks "Save" button in sticky footer
7. Frontend validates via Zod schema (`src/atomic-crm/validation/contacts.ts`)
8. Data Provider sends create request to Supabase with validated data
9. Database inserts record (auto-generates `id`, sets `created_at`, `updated_at`)
10. Success: Browser redirects to `/contacts?view={new-id}` (list with slide-over open)
11. Toast notification: "Contact created successfully"

**Business Rules:**
- **Required fields:** `name` only (first_name and last_name are optional)
- **Email/Phone format:** JSONB array of objects: `[{email: "...", type: "Work"}]`
- **Default values:** Applied by Zod schema (empty arrays for email/phone)
- **Tags:** Optional integer array referencing tags table
- **Organization:** Optional foreign key to organizations.id

**Validation:**
- **Name:** Min 1 character (not empty)
- **Email:** Valid email format (regex validation)
- **Phone:** No format enforcement (allows international formats)
- **All validations in:** `src/atomic-crm/validation/contacts.ts` (Zod schema)

**Permissions:**
- All authenticated users can create contacts (team-wide shared data)
- RLS policy: `authenticated_insert_contacts` allows INSERT with `WITH CHECK (true)`

**Error Cases:**
- Validation fails: Red error messages appear below invalid fields
- Duplicate name: No constraint (system allows duplicate names)
- Database error: Toast notification "Failed to create contact" with error details

**Code Reference:**
- Form: `src/atomic-crm/contacts/ContactCreate.tsx`
- Validation: `src/atomic-crm/validation/contacts.ts`
- Data Provider: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:create()`
- RLS Policy: Migration `20251018203500_update_rls_for_shared_team_access.sql`

---

## Flow 2: View & Edit Contact (Slide-Over Pattern)

**Trigger:** User wants to view or edit an existing contact

**Steps:**
1. User navigates to `/contacts` list
2. User clicks any row in the table
3. URL updates to `/contacts?view={id}` (query parameter, NOT navigation)
4. Slide-over panel opens from right side (40vw width, 480-720px)
5. Slide-over displays tabs: "Details" | "History" | "Files" (resource-specific)
6. **View Mode:**
   - Read-only fields display contact data
   - "Edit" button in slide-over header
7. User clicks "Edit" button
8. URL updates to `/contacts?edit={id}`
9. **Edit Mode:**
   - Form fields become editable
   - "Save" and "Cancel" buttons appear in header
10. User modifies fields (e.g., adds new email, updates title)
11. User clicks "Save"
12. Frontend validates changes via Zod schema
13. Data Provider sends update request with partial data (only changed fields)
14. Database updates record, sets `updated_at` timestamp
15. Slide-over switches back to view mode
16. Toast notification: "Contact updated successfully"

**Business Rules:**
- Only changed fields are sent in update request (React Hook Form tracks dirty fields)
- JSONB arrays (email/phone) are replaced entirely (not merged)
- `updated_at` timestamp auto-updates via database trigger
- Soft delete check: Only contacts with `deleted_at IS NULL` are visible

**Permissions:**
- All authenticated users can update contacts (team-wide)
- Admin-only DELETE policy prevents non-admins from deleting (as of migration `20251108213039_fix_rls_policies_role_based_access.sql`)

**Focus Management (Accessibility):**
- When slide-over opens, focus moves to first interactive element
- ESC key closes slide-over
- Tab key cycles within slide-over only (focus trap)
- When slide-over closes, focus returns to the row that triggered it

**Code Reference:**
- Slide-Over: `src/atomic-crm/contacts/ContactSlideOver.tsx`
- Hook: `src/hooks/useSlideOverState.ts` (manages open/close state)
- View/Edit Toggle: React Admin `<TabbedShowLayout>` and `<TabbedForm>`

---

## Flow 3: Create Opportunity with Participants

**Trigger:** Sales rep identifies a potential deal and wants to track it in the pipeline

**Steps:**
1. User navigates to `/opportunities` (Kanban board or list view)
2. User clicks "Create" button (or "+ New Lead" in Kanban column)
3. Browser navigates to `/opportunities/create` (full-page form)
4. Form displays with tabs: "General" | "Classification" | "Relationships" | "Details"
5. **General tab:**
   - Name (required): "Q1 Widget Deal"
   - Description: "500 units for restaurant chain"
   - Stage: Dropdown (defaults to `new_lead`)
   - Priority: Dropdown (defaults to `medium`)
   - Estimated Close Date: Date picker (defaults to today + 90 days)
6. **Classification tab:**
   - Status: Dropdown (active/on_hold/nurturing/stalled)
   - Lead Source: Dropdown (referral/trade_show/website/cold_call/etc.)
   - Tags: Multi-select text input
7. **Relationships tab:**
   - Customer Organization: Searchable dropdown (required, role="customer")
   - Principal Organization: Searchable dropdown (optional, role="principal")
   - Distributor Organization: Searchable dropdown (optional, role="distributor")
   - Primary Contacts: Multi-select from contacts (stores as `contact_ids` array)
   - Opportunity Owner: Dropdown (sales rep, defaults to current user)
8. **Details tab:**
   - Next Action: Text input
   - Next Action Date: Date picker
   - Competition: Textarea
   - Decision Criteria: Textarea
9. User clicks "Save & Close" or "Save & Add Another"
10. Frontend validates via Zod schema (`src/atomic-crm/validation/opportunity.ts`)
11. **Two operations happen (service layer):**
    a. Create opportunity record in `opportunities` table
    b. Create participant records in `opportunity_participants` junction table (customer/principal/distributor)
12. If using RPC: Single transaction via `create_opportunity_with_participants()` function
13. Success: Redirect to `/opportunities` (Kanban board) with new opportunity in appropriate column
14. Toast notification: "Opportunity created successfully"

**Business Rules:**
- **Required:** `name`, at least one customer organization
- **Participants:** Stored in `opportunity_participants` junction table with `role` field
- **Customer required:** RPC function enforces at least one participant with `role='customer'`
- **Stage progression:** Opportunities move through pipeline stages (new_lead → ... → closed_won/closed_lost)
- **Soft delete:** Setting stage to `closed_lost` does NOT soft-delete (opportunity remains for reporting)

**Validation:**
- **Name:** Min 1 character
- **Stage:** Must be valid `opportunity_stage` enum value
- **Priority:** Must be valid `priority_level` enum value
- **Lead Source:** Must be one of predefined values (constraint in database)
- **Estimated Close Date:** Must be future date (no past dates allowed)

**Permissions:**
- All authenticated users can create opportunities (team-wide)
- RLS policy allows INSERT with `WITH CHECK (true)`

**Error Cases:**
- No customer organization: Error "Opportunity must have at least one customer participant"
- Invalid stage: Zod validation error "Invalid enum value"
- Database constraint violation: Toast with specific error message

**Code Reference:**
- Form: `src/atomic-crm/opportunities/OpportunityCreate.tsx`
- Validation: `src/atomic-crm/validation/opportunity.ts`
- Service: `src/atomic-crm/services/opportunities.service.ts`
- RPC Function: Migration `20251018152315_cloud_schema_fresh.sql` (lines ~284-346)

---

## Flow 4: Move Opportunity Through Pipeline (Kanban)

**Trigger:** User wants to update opportunity stage visually

**Steps:**
1. User navigates to `/opportunities` (default Kanban board view)
2. Kanban displays columns for each stage: New Lead | Initial Outreach | Sample Visit Offered | ... | Closed Won | Closed Lost
3. Each column shows opportunity cards with:
   - Opportunity name
   - Customer organization name
   - Estimated close date
   - Priority badge (color-coded)
   - Days in current stage
   - Warning badge if stuck (>14 days in stage)
4. User drags opportunity card to different column
5. On drop, frontend updates opportunity `stage` field
6. Data Provider sends update request: `{id, data: {stage: 'demo_scheduled'}}`
7. Database updates record and `updated_at` timestamp
8. Kanban re-renders with card in new column
9. **No toast notification** (visual feedback is immediate)

**Business Rules:**
- Opportunities can move to any stage (no stage gate validation)
- `stage_manual` flag set to `true` when manually moved (distinguishes from automated stage changes)
- Cards sorted within column by: priority (critical → high → medium → low) then estimated close date (soonest first)
- Closed Won and Closed Lost opportunities remain visible (not soft-deleted)

**Permissions:**
- All authenticated users can update opportunity stage
- Admin-only policy prevents non-admins from DELETE operations

**Drag-and-Drop Library:**
- `@hello-pangea/dnd` v18.0.1 (fork of react-beautiful-dnd)
- Accessible: Keyboard navigation supported (space to grab, arrows to move, space to drop)

**Code Reference:**
- Kanban: `src/atomic-crm/opportunities/OpportunityKanban.tsx` or similar
- DnD Handler: `onDragEnd()` callback updates stage via `dataProvider.update()`

---

## Flow 5: Create Task & Mark Complete

**Trigger:** Sales rep needs to schedule a follow-up action

**Steps:**
1. **From Anywhere:** User can create task from multiple entry points:
   - `/tasks` list page → "Create" button
   - Opportunity slide-over → "Add Task" button (pre-fills `opportunity_id`)
   - Quick Logger dashboard widget → Task checkbox enabled
2. Browser shows task create form (modal or slide-over)
3. Form fields:
   - **Title** (required): "Follow up on demo feedback"
   - **Description** (optional): Detailed notes
   - **Due Date**: Date picker
   - **Reminder Date**: Date picker (usually 1 day before due date)
   - **Priority**: Dropdown (low/medium/high/critical, defaults to medium)
   - **Type**: Dropdown (Call/Email/Meeting/Follow-up/etc., defaults to None)
   - **Related Contact**: Searchable dropdown (optional, sets `contact_id`)
   - **Related Opportunity**: Searchable dropdown (optional, sets `opportunity_id`)
   - **Assigned To**: Dropdown (sales rep, defaults to current user → `sales_id`)
4. User clicks "Save"
5. Frontend validates via Zod schema (`src/atomic-crm/validation/task.ts`)
6. Data Provider creates task record
7. Task appears in `/tasks` list (grouped by principal if opportunity is linked)
8. **Mark Complete:**
   - User checks checkbox next to task (in list or dashboard widget)
   - Frontend sends update: `{id, data: {completed: true, completed_at: new Date()}}`
   - Task moves to completed section or grays out (depending on view)

**Business Rules:**
- **Required:** `title` only
- **Personal data:** Tasks filtered by `sales_id` (users only see their own tasks, or tasks assigned to them)
- **Completion:** Setting `completed=true` also sets `completed_at` timestamp
- **Overdue:** Tasks with `due_date < today` and `completed=false` show as overdue

**Validation:**
- **Title:** Min 1 character
- **Priority:** Must be valid `priority_level` enum
- **Type:** Must be valid `task_type` enum
- **Dates:** No validation (can create tasks with past due dates)

**Permissions:**
- Users can only view/edit tasks assigned to them (`sales_id = current user's sales.id`)
- RLS policy: `USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))`

**Code Reference:**
- Form: `src/atomic-crm/tasks/TaskCreate.tsx`
- List: `src/atomic-crm/tasks/TaskList.tsx` (or similar)
- Validation: `src/atomic-crm/validation/task.ts` (or `tasks.ts` legacy file)

---

## Flow 6: Log Activity (Interaction)

**Trigger:** Sales rep completes a call/meeting and wants to log it

**Steps:**
1. **From Multiple Entry Points:**
   - Dashboard V3 → "Quick Logger" panel (right side)
   - Opportunity slide-over → "History" tab → "Log Activity" button
   - Contact slide-over → "History" tab → "Log Activity" button
2. Quick Logger form displays:
   - **Interaction Type** (required): Dropdown (Call/Email/Meeting/Demo/Proposal/etc.)
   - **Summary** (optional): Text area for notes
   - **Date Occurred** (required): Date picker (defaults to today)
   - **Related Contact**: Searchable dropdown (optional, sets `contact_id`)
   - **Related Opportunity**: Searchable dropdown (optional, sets `opportunity_id`)
   - **Follow-Up Task** (optional): Checkbox "Create follow-up task"
     - If checked: Task fields appear (title, due date)
3. User fills form and clicks "Save" or "Save & New"
4. Frontend validates via Zod schema (`src/atomic-crm/validation/activitySchema.ts` in dashboard/v3/)
5. **If follow-up task enabled:**
   - Two operations: Create activity + Create task (sequential)
   - Task pre-filled with: opportunity_id, contact_id from activity
6. Activity logged in `activities` table
7. Activity appears in:
   - Opportunity slide-over "History" tab (chronological list)
   - Contact slide-over "History" tab
   - Dashboard "Recent Activities" widget (if present)
8. **Save & New:** Form clears but retains contact/opportunity context

**Business Rules:**
- **Required:** `interaction_type`, `date_occurred`
- **Auto-fill:** `sales_id` set to current user automatically
- **History aggregation:** Activities linked to opportunities and contacts appear in both places
- **Chronological order:** Activities sorted by `date_occurred DESC`

**Validation:**
- **Interaction Type:** Must be valid `interaction_type` enum
- **Date Occurred:** Cannot be future date (validation in schema)
- **Summary:** Optional text (no length limits)

**Permissions:**
- All authenticated users can log activities (team-wide visibility)
- RLS policy: `authenticated_insert_activities` allows INSERT

**Code Reference:**
- Quick Logger: `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx`
- Form: `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`
- Validation: `src/atomic-crm/dashboard/v3/validation/activitySchema.ts`
- Service: `src/atomic-crm/services/activities.service.ts`

---

## Flow 7: Import Contacts from CSV

**Trigger:** User has contacts in spreadsheet and wants to bulk import

**Steps:**
1. User navigates to `/contacts` list
2. User clicks "Import" button in toolbar
3. Modal opens: "Import Contacts from CSV"
4. User clicks "Browse" and selects CSV file from computer
5. **CSV Validation (Security):**
   - File size check (max 10MB)
   - Magic byte detection (prevents binary files like JPEG, ZIP)
   - Formula injection prevention (sanitizes cells starting with =, +, -, @)
6. CSV parsed via Papa Parse library (secure configuration)
7. Preview table shows first 10 rows
8. User maps CSV columns to CRM fields:
   - CSV "Full Name" → CRM "name"
   - CSV "Email Address" → CRM "email"
   - CSV "Company" → CRM "organization_name" (will look up or create organization)
9. User clicks "Import"
10. Frontend processes rows sequentially:
    - For each row:
      a. Look up organization by name (or create if not exists)
      b. Sanitize and validate data via Zod schema
      c. Create contact record via Data Provider
11. Progress bar shows: "Importing 15/100 contacts..."
12. **Partial Success Handling:**
    - Uses `Promise.allSettled()` to handle individual failures
    - Success count: 92/100
    - Failure count: 8/100 (with reasons: "Invalid email", "Missing name")
13. Results modal displays:
    - "Successfully imported 92 contacts"
    - "8 contacts failed: [Download error log]"
14. User can download CSV with failed rows + error reasons

**Business Rules:**
- **Duplicate Detection:** Not automatic (system allows duplicate names/emails)
- **Organization Lookup:** Case-insensitive name matching
- **Tag Creation:** New tags auto-created if referenced in CSV
- **Required Fields:** Name only (email, organization optional)

**Validation:**
- **CSV Format:** Headers required in first row
- **Security:** `csvUploadValidator.ts` validates file before parsing
- **Per-Row:** Zod schema validates each contact before insert

**Permissions:**
- All authenticated users can import contacts
- CSV validation prevents formula injection, DoS, binary upload attacks

**Error Cases:**
- Invalid CSV structure: "CSV must have headers in first row"
- Formula injection detected: Cell sanitized (= prefix escaped)
- Binary file uploaded: "Invalid file type (detected: image/jpeg)"
- Database constraint violation: "Email already exists" (if unique constraint added)

**Code Reference:**
- Import Button: `src/atomic-crm/contacts/ContactImportButton.tsx`
- CSV Validator: `src/atomic-crm/utils/csvUploadValidator.ts` (26 security tests)
- Import Hook: `src/atomic-crm/contacts/useContactImport.tsx`
- Promise.allSettled Pattern: Reference implementation at `:160` and `:372` in hook

---

## Common UI Patterns

### Standard List Layout
- **Pattern:** Filter sidebar (left) + main content area (right)
- **Component:** `StandardListLayout` wraps list views
- **Features:** Collapsible filters, responsive (sidebar stacks on mobile)

### Premium Datagrid
- **Pattern:** Enhanced table with hover effects, row click → slide-over
- **Component:** `PremiumDatagrid` wraps React Admin `<Datagrid>`
- **Styling:** `.table-row-premium` CSS class (hover transitions, subtle shadows)

### Floating Create Button
- **Pattern:** Fixed position bottom-right circular "+" button
- **Usage:** Appears on all list pages for quick record creation
- **Accessibility:** 44px minimum touch target, keyboard accessible

### Slide-Over Panel
- **Pattern:** Right-side panel for view/edit (40vw width, 480-720px)
- **Features:** View mode (read-only) ↔ Edit mode (toggle), URL sync (`?view=` or `?edit=`)
- **Animation:** Slide from right (200ms ease-out), focus trap when open

### Tabbed Forms
- **Pattern:** Multi-section forms with error badges on tabs
- **Component:** `TabbedFormInputs` (custom wrapper around React Admin tabs)
- **Features:** Error count per tab, validation state indicators

---

## Notes on Implementation

**JSONB Array Handling:**
All JSONB array fields (email, phone) follow this pattern:
- Database: `'[]'::jsonb` default value
- Zod: Sub-schema with `.default([])` at array level
- Form: `<ArrayInput>` + `<SimpleFormIterator>` (React Admin)
- No `defaultValue` prop in form components (Zod handles defaults)

**Soft Delete Everywhere:**
All queries include `WHERE deleted_at IS NULL` filter (handled by Data Provider).

**RLS Policy Patterns:**
- **Shared data:** `USING (true)` for INSERT, `USING (deleted_at IS NULL)` for SELECT
- **Personal data:** `USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))`
- **Admin-only modifications:** UPDATE/DELETE require `is_admin = true` check

**Error Handling:**
- **Client-side:** Toast notifications (`sonner` library)
- **Inline validation:** Red error messages below form fields
- **Console:** Detailed error logs with context (method, resource, params)
