# Tasks Resource Feature & CRUD Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (AI-assisted)
**Status:** Validated with user decisions
**Industry Research:** Salesforce Task Object, HubSpot Tasks

---

## Overview

This document captures the complete feature inventory for the Tasks resource, comparing implemented code against PRD requirements and industry best practices (Salesforce, HubSpot). It includes user-validated decisions on implementation gaps.

---

## Industry Best Practices Research

### Salesforce Task Model
- **Fields**: Subject (freeform + picklist), Priority (High/Normal/Low), Status, Due Date, Assigned To
- **Entity Linking**: WhoId (Contact/Lead) + WhatId (Account/Opportunity/Case/Custom)
- **Recurring**: Full recurrence support (daily, weekly, monthly patterns)
- **Follow-up**: Auto-create next task when recurring task completes

### HubSpot Task Model
- **Types**: Call, Email, To-do (3 core types)
- **Queues**: Up to 20 task queues per user for grouping
- **Priority**: Low, Medium, High (3 levels)
- **Sequences**: Tasks can be part of automated sequences with manual pause

### Sources
- [Salesforce Task Fields](https://help.salesforce.com/s/articleView?id=sales.task_fields.htm&language=en_US&type=5)
- [Salesforce Task Object Reference](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_task.htm)
- [HubSpot: Create Tasks](https://knowledge.hubspot.com/tasks/create-tasks)
- [HubSpot: Task Queues](https://knowledge.hubspot.com/tasks/use-task-queues)
- [CRM Task Best Practices](https://expandable.com/crm-implementations-tasks-best-practices/)

---

## Feature Matrix (Component-Level)

### TaskList (`/tasks`)

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| View tasks in data grid | ✅ Implemented | ✅ Required | Standard | PremiumDatagrid with 8 columns |
| Search tasks (q filter) | ✅ Implemented | ✅ Required | Standard | Full-text search via SearchInput |
| Filter by Due Date | ✅ Implemented | ✅ Required | Standard | Today, This Week, Overdue |
| Filter by Status (Complete/Incomplete) | ✅ Implemented | ✅ Required | Standard | ToggleFilterButton |
| Filter by Priority | ✅ Implemented | ✅ Required | Standard | Multi-select (low/medium/high/critical) |
| Filter by Type | ✅ Implemented | ✅ Required | Standard | Multi-select task types |
| Filter by Assigned To | ✅ Implemented | ✅ Required | Standard | "Me" filter button |
| Inline completion checkbox | ✅ Implemented | ✅ Required | Salesforce pattern | CompletionCheckbox with stopPropagation |
| Sort by due_date | ✅ Implemented | ✅ Required | Standard | Default sort ASC |
| Export to CSV | ✅ Implemented | ✅ Required | Standard | jsonexport with principal lookup |
| Click row → SlideOver view | ✅ Implemented | ✅ Required | HubSpot pattern | useSlideOverState hook |

### TaskSlideOver (Quick View/Edit Panel)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| View mode | ✅ Implemented | ✅ Required | ResourceSlideOver wrapper |
| Edit mode toggle | ✅ Implemented | ✅ Required | onModeToggle callback |
| Details tab | ✅ Implemented | ✅ Required | TaskSlideOverDetailsTab |
| Related Items tab | ✅ Implemented | ✅ Required | TaskRelatedItemsTab (Contact, Opportunity) |
| Inline completion in view mode | ✅ Implemented | ✅ Required | Interactive checkbox even in view |

### TaskCreate (`/tasks/create`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Create new task | ✅ Implemented | ✅ Required | CreateBase with Form |
| Title field (required) | ✅ Implemented | ✅ Required | min 1, max 500 chars |
| Description field | ✅ Implemented | ✅ Required | multiline, max 2000 chars |
| Due Date (required) | ✅ Implemented | ✅ Required | date input, defaults to today |
| Type selection | ✅ Implemented | ✅ Required | SelectInput from taskTypes config |
| Priority selection | ✅ Implemented | ✅ Required | low/medium/high/critical |
| Opportunity link | ✅ Implemented | ✅ Required | ReferenceInput autocomplete |
| Contact link | ✅ Implemented | ✅ Required | ReferenceInput autocomplete |
| **Organization link** | ❌ Missing | ✅ Required | **NEW DECISION: Add organization_id** |
| Cancel with unsaved warning | ✅ Implemented | ✅ Required | window.confirm on dirty |
| Save & Close | ✅ Implemented | ✅ Required | Redirect to /tasks |
| Save & Add Another | ✅ Implemented | ✅ Required | Form reset after save |
| Default assigned to current user | ✅ Implemented | ✅ Required | useGetIdentity() |

### TaskEdit (`/tasks/:id`)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Edit existing task | ✅ Implemented | ✅ Required | Edit component with SimpleForm |
| Tabbed form (General + Details) | ✅ Implemented | ✅ Required | TabbedFormInputs component |
| All fields editable | ✅ Implemented | ✅ Required | Including completion status |

### TasksPanel (Dashboard Widget)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Overdue tasks section | ✅ Implemented | ✅ Required (§9.2.4) | Red "destructive" styling |
| Today tasks section | ✅ Implemented | ✅ Required (§9.2.4) | Amber "warning" styling |
| Tomorrow tasks section | ✅ Implemented | ✅ Required (§9.2.4) | Blue "info" styling |
| 3+ days NOT shown | ✅ Implemented | ✅ Required (§9.2.4) | Dashboard = immediate execution |
| Overdue count badge | ✅ Implemented | ✅ Required | Badge in header |
| New Task button | ✅ Implemented | ✅ Required | Links to /tasks/create |
| Completion checkbox | ✅ Implemented | ✅ Required | Inline checkbox per task |
| **Snooze button** | ⚠️ Partial | ✅ Required (MVP #37) | **Currently +1 day only, needs popover** |
| Task dropdown menu | ✅ Implemented | ✅ Required | View, Edit, Delete options |
| Priority badge | ✅ Implemented | ✅ Required | Color-coded badge |
| Task type icon | ✅ Implemented | ✅ Required | Phone/Mail/Users/FileText icons |

### AddTask (Quick Create Dialog)

| Feature | Code Status | PRD Requirement | Notes |
|---------|-------------|-----------------|-------|
| Quick add from Contact context | ✅ Implemented | ✅ Required | Dialog with pre-filled contact_id |
| Quick add from Opportunity context | ✅ Implemented | ✅ Required | Can be used with selectContact=true |
| Chip display mode | ✅ Implemented | ✅ Required | "Add task" button |
| Icon display mode | ✅ Implemented | ✅ Required | Plus icon button |
| Updates contact.last_seen | ✅ Implemented | ✅ Required | On successful task creation |

---

## CRUD Matrix

### Operation-Level

| Operation | Component | Route/Action | Status | Gap | Required Action |
|-----------|-----------|--------------|--------|-----|-----------------|
| **CREATE** | TaskCreate | `/tasks/create` | ✅ Works | Missing org link | Add organization_id field |
| **CREATE (Quick)** | AddTask | Dialog modal | ✅ Works | — | None |
| **READ (List)** | TaskList | `/tasks` | ✅ Works | — | None |
| **READ (Single)** | TaskShow | `/tasks/:id/show` | ✅ Works | — | None |
| **READ (SlideOver)** | TaskSlideOver | `?view=:id` | ✅ Works | — | None |
| **UPDATE** | TaskEdit | `/tasks/:id` | ✅ Works | — | None |
| **UPDATE (Inline)** | CompletionCheckbox | Inline in list | ✅ Works | No follow-up prompt | **MVP #32**: Add toast |
| **UPDATE (Snooze)** | TasksPanel | Dashboard action | ⚠️ Partial | +1 day only | **MVP #37**: Add popover |
| **DELETE** | TasksPanel | Dashboard dropdown | ✅ Works | Soft delete | Verified working |
| **SEARCH** | TaskListFilter | SearchInput | ✅ Works | — | None |
| **FILTER** | TaskListFilter | 5 filter categories | ✅ Works | — | None |
| **SORT** | TaskList | due_date ASC | ✅ Works | — | None |
| **EXPORT** | TaskList | CSV download | ✅ Works | — | None |

### Field-Level CRUD

| Field | Create | Read | Update | Required | Validation | Notes |
|-------|--------|------|--------|----------|------------|-------|
| `id` | Auto | ✅ | ❌ | Auto | BIGINT | Generated always |
| `title` | ✅ | ✅ | ✅ | **Yes** | 1-500 chars | Primary identifier |
| `description` | ✅ | ✅ | ✅ | No | max 2000, nullable | Optional details |
| `due_date` | ✅ | ✅ | ✅ | **Yes** | ISO date | Defaults to today |
| `reminder_date` | ✅ | ✅ | ✅ | No | ISO date, nullable | Optional reminder |
| `completed` | ✅ | ✅ | ✅ | No | boolean | Default false |
| `completed_at` | Auto | ✅ | ✅ | No | timestamp | Set on completion |
| `priority` | ✅ | ✅ | ✅ | No | enum | Default "medium" |
| `type` | ✅ | ✅ | ✅ | **Yes** | enum | **See type decision below** |
| `sales_id` | ✅ | ✅ | ✅ | **Yes** | FK | Assigned user |
| `contact_id` | ✅ | ✅ | ✅ | No | FK, nullable | Link to contact |
| `opportunity_id` | ✅ | ✅ | ✅ | No | FK, nullable | Link to opportunity |
| `organization_id` | ❌ | ❌ | ❌ | No | FK, nullable | **NEW: To be added** |
| `created_by` | Auto | ✅ | ❌ | Auto | trigger | Creator tracking |
| `created_at` | Auto | ✅ | ❌ | Auto | timestamp | — |
| `updated_at` | Auto | ✅ | Auto | Auto | trigger | — |
| `deleted_at` | ❌ | ✅ | ✅ | No | timestamp | Soft delete |

---

## User-Validated Decisions

### Decision 1: Task Types Alignment

**Question:** PRD specifies 7 types vs Code has 8 different types. Which is source of truth?

**User Decision:** Use PRD types (7)

| PRD Types (Approved) | Code Types (Current) | Action |
|---------------------|----------------------|--------|
| Call | Call | Keep |
| Email | Email | Keep |
| Meeting | Meeting | Keep |
| Follow-up | Follow-up | Keep |
| Demo | ❌ Missing | **Add** |
| Proposal | Proposal | Keep |
| Other | ❌ Missing | **Add** |
| — | None | **Remove** |
| — | Discovery | **Remove** |
| — | Administrative | **Remove** |

**Files to Update:**
- `src/atomic-crm/validation/task.ts:16-25` - Update taskTypeSchema enum
- `src/atomic-crm/root/defaultConfiguration.ts` - Update taskTypes array

### Decision 2: Entity Linking

**Question:** Should tasks link to Organizations directly (like Salesforce WhatId)?

**User Decision:** Add Organization link

**Rationale:** Allows org-level tasks without requiring an opportunity (e.g., "Prepare for Sysco annual review")

**Implementation:**
1. Add `organization_id` field to tasks table (FK to organizations, nullable)
2. Update `taskSchema` in validation/task.ts
3. Add ReferenceInput to TaskCreate.tsx and TaskSlideOverDetailsTab.tsx
4. Update TaskRelatedItemsTab to show organization

### Decision 3: Snooze UX

**Question:** PRD requires popover with options. Code does +1 day. Which UX?

**User Decision:** Popover with options (PRD spec)

**Implementation:**
```
[Click ⏰] → Popover opens with options:
            ┌─────────────────────────┐
            │ Snooze until...         │
            ├─────────────────────────┤
            │ ○ Tomorrow (9:00 AM)    │
            │ ○ Next Week (Mon 9AM)   │
            │ ○ Custom Date... [📅]   │
            └─────────────────────────┘
```

**Files to Update:**
- `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx:182-191`
- Create new `SnoozePopover.tsx` component

### Decision 4: Follow-up Task Prompt

**Question:** When marking task complete, prompt to create follow-up?

**User Decision:** Yes - Inline toast (less intrusive than modal)

**Implementation:**
- On task completion, show toast: "Task completed! [Create follow-up →]"
- Link opens pre-filled task form with same contact/opportunity
- Toast auto-dismisses after 5 seconds

**Files to Update:**
- `src/atomic-crm/tasks/TaskList.tsx` - CompletionCheckbox
- `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx` - handleCompletionToggle

---

## Implementation Gaps (MVP Blockers)

| # | Gap | PRD Reference | Priority | Est. Effort | Status |
|---|-----|---------------|----------|-------------|--------|
| 1 | Task type enum mismatch | §12, Appendix E | High | 2h | **NEW** |
| 2 | Missing organization_id field | User decision | Medium | 3h | **NEW** |
| 3 | Snooze popover not implemented | MVP #37 | High | 4h | Existing |
| 4 | Follow-up toast not implemented | MVP #32 | Medium | 2h | Existing |

**Total Estimated Effort:** 11 hours

---

## Filter Matrix

| Filter | Source | Type | Multi-select | Component |
|--------|--------|------|--------------|-----------|
| Search | `q` | Text | N/A | SearchInput |
| Due Today | `due_date@gte/lte` | Date range | No | ToggleFilterButton |
| This Week | `due_date@gte/lte` | Date range | No | ToggleFilterButton |
| Overdue | `due_date@lte` + `completed=false` | Compound | No | ToggleFilterButton |
| Incomplete | `completed=false` | Boolean | No | ToggleFilterButton |
| Completed | `completed=true` | Boolean | No | ToggleFilterButton |
| Priority | `priority` | Enum | **Yes** | ToggleFilterButton |
| Type | `type` | Enum | **Yes** | ToggleFilterButton |
| Assigned To Me | `sales_id` | FK | No | ToggleFilterButton |

---

## Alignment Summary

| Category | PRD | Code | Industry | Alignment |
|----------|-----|------|----------|-----------|
| Task Types | 7 types | 8 types | HubSpot: 3, SF: freeform | ⚠️ To align with PRD |
| Priority Levels | 4 levels | 4 levels | HubSpot: 3, SF: 3 | ✅ Exceeds industry |
| Entity Linking | Contact + Opp | Contact + Opp | SF: Who + What | ⚠️ Adding Org |
| Snooze | Popover | +1 day | N/A | ⚠️ To implement |
| Follow-up | Prompt | None | SF: Recurring | ⚠️ To implement |
| Dashboard Widget | Time-bucketed | Time-bucketed | Standard | ✅ Aligned |
| Completion | Inline + timestamp | Inline + timestamp | Standard | ✅ Aligned |

---

## PRD Updates Required

Add to PRD Section 16.2 (Resolved Questions):

| # | Question | Decision | Date |
|---|----------|----------|------|
| 79 | Task types alignment | Use PRD 7 types (Call, Email, Meeting, Follow-up, Demo, Proposal, Other). Remove None/Discovery/Administrative from code | 2025-11-28 |
| 80 | Task organization linking | Add optional organization_id field. Enables org-level tasks without opportunity | 2025-11-28 |
| 81 | Task snooze UX | Popover with Tomorrow/Next Week/Custom options per PRD §9.2.3 | 2025-11-28 |
| 82 | Task completion follow-up | Inline toast with "Create follow-up" link (less intrusive than modal) | 2025-11-28 |

Add to PRD Section 15.1 (MVP Features):

| # | Feature | Status | Acceptance Criteria |
|---|---------|--------|---------------------|
| 44 | Task type enum fix | TODO | Align code with PRD 7 types |
| 45 | Task organization link | TODO | Add organization_id FK to tasks |

---

*Last updated: 2025-11-28 (Tasks Feature Matrix audit)*
