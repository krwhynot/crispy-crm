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
