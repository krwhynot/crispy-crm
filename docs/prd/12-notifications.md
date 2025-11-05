---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Notifications
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Notifications table schema
- 🎨 [Design System](./15-design-tokens.md) - Notification bell, dropdown, and badges
- 🔗 [Tasks Widget](./08-tasks-widget.md) - Overdue task notifications source
- ⚙️ [Technical Stack](./18-tech-stack.md) - Notification delivery mechanism
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
