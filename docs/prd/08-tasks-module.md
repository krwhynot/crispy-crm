---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9.2.3 (Tasks Panel) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Tasks (Full Resource Module)
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Tasks table schema with multi-assignment
- 🎨 [Design System](./15-design-tokens.md) - List views and forms
- 🔗 [Dashboard](./14-dashboard.md) - Principal-centric view integration
- 🔗 [Activity Tracking](./10-activity-tracking.md) - Optional activity logging when tasks completed
- 🔔 [Notifications](./12-notifications.md) - Overdue task notifications (deferred)
---

## 📊 Implementation Status

**Last Updated:** November 5, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ⚠️ **35%** |
| **Confidence** | 🟡 **MEDIUM** - Embedded components exist, needs full module upgrade |
| **Files** | 4 total (embedded context only, no standalone pages) |
| **CRUD Operations** | 🚧 Partial - Add/Edit/Delete in embedded context only |
| **Database Schema** | ✅ Full schema with associations |
| **Validation** | ✅ Comprehensive Zod schemas (148 lines) |
| **Advanced Features** | ❌ Multi-assignment model not implemented |

**Completed Requirements (35%):**
- ✅ Database schema complete (due_date, type enum, entity associations)
- ✅ Validation layer (src/atomic-crm/validation/tasks.ts with create/update/reminder schemas)
- ✅ Embedded task creation from contact view (AddTask.tsx - 193 lines)
- ✅ Task editing via inline dialog (TaskEdit.tsx - 101 lines)
- ✅ Mark complete/incomplete with checkbox (Task.tsx - 218 lines)
- ✅ Intelligent postpone (tomorrow/next week based on due date)
- ✅ Delete tasks with undo support
- ✅ Task type selection (8 types: Call, Email, Meeting, Follow-up, Proposal, Discovery, Administrative, None)
- ✅ Contact association (required)
- ✅ TasksIterator component (762 bytes)

**Missing Requirements (65%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Create TaskList view (full resource) | ❌ Missing | 🟢 HIGH | 2 days |
| Create TaskShow detail page | ❌ Missing | 🟢 HIGH | 1 day |
| Create TaskCreate standalone page | ❌ Missing | 🟢 HIGH | 1 day |
| Create TaskEdit standalone page | ❌ Missing | 🟢 HIGH | 1 day |
| Add `index.ts` module exports | ❌ Missing | 🟢 HIGH | 30 min |
| Implement multi-assignment UI | ❌ Missing | 🟢 HIGH | 1 day |
| Add opportunity association UI | ❌ Missing | 🟡 MEDIUM | 4 hours |
| Add activity integration (optional logging) | ❌ Missing | 🟡 MEDIUM | 1 day |
| Add task filtering/sorting UI | ❌ Missing | 🟢 HIGH | 1 day |
| Register as resource in CRM.tsx | ❌ Missing | 🟢 HIGH | 30 min |
| Add test coverage | ❌ Missing | 🟢 HIGH | 2 days |

**Total Estimate:** 8-9 days for full module elevation

**Details:**
- **Architecture Gap:** Tasks module uses embedded widgets instead of standard resource pattern (List/Show/Edit/Create) that Organizations, Contacts, and Opportunities use
- **Multi-Assignment Missing:** Database schema supports primary/secondary/tertiary account managers but UI doesn't expose it
- **Priority Field Deferred:** Exists in database but intentionally excluded from MVP (use due date alone for prioritization)
- **Activity Integration Missing:** When task marked complete, should optionally create activity record
- **Pattern Inconsistency:** Unlike other core resources, Tasks lacks full resource implementation and is not properly registered in CRM.tsx
- **No Tests:** Zero test files found for task components

**Blockers:** None - Just needs dedicated implementation time

**Recommendation:** Elevate Tasks to full resource module following established patterns from Organizations, Contacts, and Opportunities modules. Add index.ts exports, create standalone views, implement multi-assignment, and register as proper resource in CRM.tsx.

---

# 3.6 Tasks Module (Full Resource)

**Purpose:** Track follow-ups, action items, and reminders tied to principals, opportunities, contacts, and organizations. Focus on "What do I need to do next for each principal?"

**Implementation Approach:** Full resource module with List/Show/Edit/Create pages following established patterns from other modules.

---

## Multi-Assignment Model

**Assignment Structure:**
Tasks can be assigned to multiple Account Managers with defined roles:

1. **Primary Account Manager** (required)
   - Main owner of the task
   - Appears first in all lists
   - Default: Current user when creating task

2. **Secondary Account Manager** (optional)
   - Collaborator or backup
   - Receives visibility into task progress
   - Can edit and complete task

3. **Tertiary Account Manager** (optional)
   - Additional team member (e.g., manager oversight)
   - Read/write access
   - Useful for handoffs or training

**Database Schema:**
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Multi-assignment (using sales.id foreign keys)
  primary_account_manager_id BIGINT NOT NULL REFERENCES sales(id),
  secondary_account_manager_id BIGINT REFERENCES sales(id),
  tertiary_account_manager_id BIGINT REFERENCES sales(id),

  -- Entity associations (HubSpot pattern: separate FKs)
  contact_id BIGINT REFERENCES contacts(id),
  opportunity_id BIGINT REFERENCES opportunities(id),
  organization_id BIGINT REFERENCES organizations(id),

  -- Type and metadata
  task_type TEXT CHECK (task_type IN ('Call', 'Email', 'Meeting', 'Follow-up', 'Proposal', 'Discovery', 'Administrative', 'None')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** Priority field (`priority ENUM`) exists in schema but is **deferred from MVP**. Use due_date alone for sorting (like HubSpot). Add priority later if Account Managers request it.

---

## Task List View (TaskList.tsx)

**Location:** /tasks (accessible from main navigation)

**Features:**
- Standard React Admin List component
- Columns:
  - Title (clickable to Show view)
  - Due Date (sorted by default, closest first)
  - Primary Account Manager
  - Related To (Contact/Opportunity/Organization name)
  - Task Type (Call, Email, etc.)
  - Completed (checkbox)
- Filters:
  - Completed (Yes/No)
  - Due Date range
  - Primary Account Manager (multi-select)
  - Task Type (multi-select)
  - Related Entity Type (Contact/Opportunity/Organization)
- Sort options:
  - Due Date (default: soonest first)
  - Created Date
  - Account Manager name
- Bulk actions:
  - Mark Complete
  - Delete
  - Reassign Primary Account Manager
- Pagination: 25 per page

**Default View:**
- Show incomplete tasks only
- Sorted by due date (soonest first)
- Filtered to current user's primary assignments

---

## Task Show View (TaskShow.tsx)

**Location:** /tasks/:id

**Displays:**
- Task title (editable inline)
- Description (full text, editable)
- Due date (editable)
- Completion status (toggle checkbox)
- Completed date/time (if completed)
- Primary Account Manager (editable)
- Secondary Account Manager (editable, optional)
- Tertiary Account Manager (editable, optional)
- Related Entity:
  - Contact (link to contact view)
  - Opportunity (link to opportunity view)
  - Organization (link to organization view)
- Task type (editable)
- Created/updated timestamps

**Actions:**
- Edit (navigates to TaskEdit)
- Delete (with confirmation)
- Mark Complete / Mark Incomplete
- Postpone (tomorrow / next week)
- Clone Task (creates copy with new due date)

**Activity Integration (Optional):**
When task is marked complete, show prompt:
```
✅ Task completed!

Log this as an activity? [Yes] [No]

If Yes:
- Activity Type: [Auto-fill from task type, e.g., "Call"]
- Description: [Auto-fill from task title]
- Related To: [Auto-fill from task association]
```

**Why Optional?** Some tasks (e.g., "Send pricing sheet") are internal actions. Others (e.g., "Call Restaurant A") are customer-facing and should be logged. Give Account Manager the choice.

---

## Task Create View (TaskCreate.tsx)

**Location:** /tasks/create

**Form Fields:**

**Required:**
- **Title*** (text input, max 200 chars)
- **Due Date*** (date picker, default: +3 days from today)
- **Primary Account Manager*** (select, default: current user)

**Optional:**
- **Description** (textarea, max 2000 chars)
- **Secondary Account Manager** (select, searchable)
- **Tertiary Account Manager** (select, searchable)
- **Related To** (tab interface):
  - Contact (searchable dropdown)
  - Opportunity (searchable dropdown)
  - Organization (searchable dropdown)
  - None
- **Task Type** (select):
  - Call
  - Email
  - Meeting
  - Follow-up
  - Proposal
  - Discovery
  - Administrative
  - None (default)

**Behavior:**
- Save button creates task and navigates to TaskShow
- Cancel button returns to TaskList
- Form validation via Zod schema (src/atomic-crm/validation/tasks.ts)

---

## Task Edit View (TaskEdit.tsx)

**Location:** /tasks/:id/edit

**Same form as TaskCreate** but pre-populated with existing task data.

**Additional Actions:**
- Save (updates task, returns to Show)
- Cancel (returns to Show without saving)
- Delete (with confirmation)

---

## Task Filtering by Principal

**Principal Filter (Dashboard Integration):**
When viewing tasks from dashboard principal table:
1. Click "Next Action" → Opens TaskShow for that specific task
2. Click Principal name → Navigates to Opportunities filtered by principal
3. From Opportunities view → "View Tasks" button → Opens TaskList filtered to tasks where `opportunity_id IN (opportunities for this principal)`

**Filter Logic:**
```typescript
// Show tasks for a specific principal
const tasksForPrincipal = tasks.filter(task => {
  return task.opportunity?.principal_id === selectedPrincipalId;
});
```

---

## What We're NOT Building (Tasks MVP)

**Excluded from MVP:**
- ❌ Priority field (high/medium/low/critical) - Use due date only
- ❌ Reminder dates and notifications - Deferred to post-MVP
- ❌ Task templates or recurring tasks
- ❌ Task dependencies (blockers/waiting on)
- ❌ Time tracking or estimated duration
- ❌ Subtasks or checklist items
- ❌ Task comments or collaboration thread
- ❌ Email notifications on assignment/completion
- ❌ Task board view (Kanban/calendar)

**Rationale:** Focus on simple, Excel-like task tracking. Advanced features come after team proves they'll use basic task management consistently.

---

## Implementation Notes

**Resource Registration:**
Add to `src/atomic-crm/root/CRM.tsx`:
```typescript
import Tasks from "../tasks";

<Resource
  name="tasks"
  {...Tasks}
  icon={TasksIcon}
/>
```

**Module Exports (`src/atomic-crm/tasks/index.ts`):**
```typescript
import { lazy } from "react";

const TaskList = lazy(() => import("./TaskList"));
const TaskShow = lazy(() => import("./TaskShow"));
const TaskEdit = lazy(() => import("./TaskEdit"));
const TaskCreate = lazy(() => import("./TaskCreate"));

export default {
  list: TaskList,
  show: TaskShow,
  edit: TaskEdit,
  create: TaskCreate,
  recordRepresentation: (record) => record.title,
};
```

**Validation:**
Reuse existing Zod schemas from `src/atomic-crm/validation/tasks.ts`:
- `taskCreateSchema` for creation
- `taskUpdateSchema` for editing
- Multi-assignment validation: Allow nulls for secondary/tertiary

**Data Provider:**
Tasks use standard Supabase queries via `unifiedDataProvider.ts`:
- List: `GET_LIST` with filters
- Show: `GET_ONE`
- Create: `CREATE`
- Update: `UPDATE`
- Delete: `DELETE`

**Query Optimization:**
- Index on: `primary_account_manager_id`, `due_date`, `completed`
- Join with sales table for Account Manager names
- Join with contacts/opportunities/organizations for "Related To" display

---

## Success Metrics

**Primary Goal:** Account Managers log 10+ tasks/week tied to principals.

**Measurements:**
- Task creation rate: 2-3 new tasks per user per day
- Completion rate: 80%+ of tasks completed within 7 days of due date
- Multi-assignment usage: 20%+ of tasks have secondary Account Manager assigned
- Activity integration: 40%+ of completed tasks logged as activities

---

## Related Features

- **Dashboard:** "Next Action" column shows highest-priority task per principal
- **Opportunities:** Tasks can be associated with opportunities
- **Activity Tracking:** Optional activity logging when task completed
- **Contacts/Organizations:** Tasks can be created from entity views

---

**Future Enhancements (Post-MVP):**
- Priority field (if requested by Account Managers)
- Reminder notifications (email or in-app)
- Task templates for common workflows
- Recurring tasks (e.g., "Monthly check-in with Restaurant A")
- Calendar view of tasks
- Task delegation workflows
