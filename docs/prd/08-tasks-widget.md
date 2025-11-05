---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Tasks Widget (Dashboard Component)
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Tasks table schema
- 🎨 [Design System](./15-design-tokens.md) - Dashboard widgets and modals
- 🔗 [Dashboard](./14-dashboard.md) - Main dashboard integration
- 🔔 [Notifications](./12-notifications.md) - Overdue task notifications
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ⚠️ **65%** |
| **Confidence** | 🟡 **MEDIUM** - Embedded only, needs standalone views |
| **Files** | 4 total (no tests) |
| **CRUD Operations** | 🚧 Partial - Add/Edit/Delete in embedded context only |
| **Database Schema** | ✅ Full schema with priorities, types, associations |
| **Validation** | ✅ Comprehensive Zod schemas (148 lines) |
| **Advanced Features** | 🚧 Partial - Embedded in contacts, missing standalone |

**Completed Requirements:**
- ✅ Database schema complete (due_date, priority enum, type enum, entity associations)
- ✅ Validation layer (src/atomic-crm/validation/tasks.ts with create/update/reminder schemas)
- ✅ Embedded task creation from contact view (AddTask.tsx - 193 lines)
- ✅ Task editing via inline dialog (TaskEdit.tsx - 101 lines)
- ✅ Mark complete/incomplete with checkbox (Task.tsx - 218 lines)
- ✅ Intelligent postpone (tomorrow/next week based on due date)
- ✅ Delete tasks with undo support
- ✅ Task type selection (8 types: Call, Email, Meeting, Follow-up, Proposal, Discovery, Administrative, None)
- ✅ Contact association (required)
- ✅ TasksIterator component (762 bytes)

**Missing Requirements (35%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Create standalone TaskList view | ❌ Missing | 🟢 HIGH | 2 days |
| Create standalone TaskShow detail page | ❌ Missing | 🟢 HIGH | 1 day |
| Create standalone TaskCreate page | ❌ Missing | 🟢 HIGH | 1 day |
| Add `index.ts` module exports | ❌ Missing | 🟢 HIGH | 30 min |
| Expose priority selection in UI | ❌ Missing | 🟢 HIGH | 2 hours |
| Expose opportunity association in UI | ❌ Missing | 🟡 MEDIUM | 4 hours |
| Implement reminder date functionality | ❌ Missing | 🟡 MEDIUM | 1 day |
| Add task filtering/sorting UI | ❌ Missing | 🟢 HIGH | 1 day |
| Add test coverage | ❌ Missing | 🟢 HIGH | 2 days |

**Details:**
- **Architecture Gap:** Tasks module uses embedded widgets instead of standard resource pattern (List/Show/Edit/Create) that Organizations, Contacts, and Opportunities use
- **UI Gaps:** Priority (low/medium/high/critical) and opportunity associations exist in database schema but not exposed in UI
- **Feature Gaps:** Reminder dates (`reminder_date` column) supported in schema but no UI to set/manage them
- **Pattern Inconsistency:** Unlike other core resources, Tasks lacks full resource implementation and is not properly registered in CRM.tsx
- **No Tests:** Zero test files found for task components

**Blockers:** None - Just needs dedicated implementation time

**Recommendation:** Elevate Tasks to full resource module following established patterns from Organizations, Contacts, and Opportunities modules. Add index.ts exports, create standalone views, and register as proper resource in CRM.tsx.

---

# 3.6 Tasks Widget (Dashboard Component)

**Purpose:** Lightweight task tracking for follow-ups and reminders, integrated into the main dashboard for quick access.

**Implementation Approach:** Dashboard-only widget following minimal design pattern. No standalone module or dedicated pages.

## Dashboard Tasks Widget

**Location:** Main Dashboard page (not a separate module)

**Widget Layout:**
```
┌─────────────────────────────────────────────┐
│ My Tasks                              [Add] │
├─────────────────────────────────────────────┤
│ □ Call Restaurant ABC           Due Today   │
│ □ Follow up on quote           Due Tomorrow │
│ ☑ Send pricing sheet              Complete  │
│ □ Schedule demo               Due Next Week │
├─────────────────────────────────────────────┤
│              View All Tasks (5)             │
└─────────────────────────────────────────────┘
```

**Features:**
- Shows user's incomplete tasks sorted by due date
- Quick checkbox to mark tasks complete
- Inline editing on click
- "Add Task" button opens modal
- Shows max 5 tasks, with "View All" expanding inline

## Quick Add Task Modal

**Form Fields (Simplified):**
- **Title*** (text input, required)
- **Due Date*** (date picker, defaults to +3 days)
- **Priority** (select: High/Medium/Low, default Medium)
- **Related To** (optional):
  - Contact (searchable dropdown)
  - Opportunity (searchable dropdown)
  - Organization (searchable dropdown)
- **Description** (textarea, optional)

**Note:** Tasks are automatically assigned to current user. No complex assignment or delegation features.

## Implementation Notes

**Dashboard Integration:**
- Tasks widget is part of main Dashboard component
- No separate Tasks module or resource registration
- Simple CRUD operations through dashboard interface
- No email notifications (decision: users check tasks when logged in)
- Uses HubSpot pattern with separate FKs for database integrity
