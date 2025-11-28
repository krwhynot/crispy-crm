---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Notifications
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Notifications table schema
- 🎨 [Design System](./15-design-tokens.md) - Notification bell, dropdown, and badges
- 🔗 [Tasks Module](./08-tasks-module.md) - Overdue task notifications source
- ⚙️ [Technical Stack](./18-tech-stack.md) - Notification delivery mechanism
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **100%** |
| **Confidence** | 🟢 **HIGH** - Production ready |
| **Files** | 11 total (notification components and provider) |
| **CRUD Operations** | ✅ Create/Read/Update/Delete all complete |
| **Database Schema** | ✅ Full notifications table with types and status |
| **Validation** | ✅ Zod schemas for notification data |
| **Advanced Features** | ✅ Bell icon, badges, dropdown, mark as read |

**Completed Requirements:**
- ✅ Database schema (notifications table with type, status, read_at)
- ✅ Notification bell icon in top navigation (NotificationBell.tsx)
- ✅ Badge with unread count (red circle with number)
- ✅ Dropdown panel (400px wide, NotificationDropdown.tsx)
- ✅ Last 20 notifications display
- ✅ Notification items with icon, message, time ago
- ✅ Mark individual as read (eye icon button)
- ✅ Mark all as read button
- ✅ "View all notifications" link to full page
- ✅ 30-day retention policy (auto-delete)
- ✅ Read/unread status tracking per user
- ✅ Real-time notification updates
- ✅ Notification provider integration (NotificationProvider.tsx)
- ✅ Overdue task notifications (primary trigger)

**Unfinished Tasks:** None

**Blockers:** None

**Status:** Fully functional in-app notification system meeting all PRD requirements. Bell icon displays unread count, dropdown shows recent notifications with mark-as-read functionality, and 30-day retention policy is enforced.

**Note:** Per PRD specification, only in-app notifications are implemented (no email, SMS, or Slack integration in MVP).

---

# 3.10 Notifications

## Notification System (In-App Only)

**Notification Channels:**
- **In-app only** with bell icon in top navigation
- Badge shows unread count (red circle with number)
- No email notifications in MVP
- No SMS or Slack integration in MVP

**Notification Triggers (Minimal):**
- **Overdue tasks only** - no other automatic notifications
- Overdue defined as: Next action date has passed
- Check runs daily at 9 AM server time
- One notification per overdue task

**Notification Display:**
- **Bell icon** in top navigation bar
- Click opens dropdown panel (400px wide)
- Shows last 20 notifications
- Each notification shows:
  - Icon (task type)
  - Message: "Task overdue: {Task Name}"
  - Related entity link
  - Time ago (e.g., "2 hours ago")
  - Mark as read button (eye icon)
- "Mark all as read" button at bottom
- "View all notifications" link to full page

**Notification Persistence:**
- Notifications stored in database
- Keep last 30 days of notifications
- Auto-delete older than 30 days
- Read/unread status tracked per user
