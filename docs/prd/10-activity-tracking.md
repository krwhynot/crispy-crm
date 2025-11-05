---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Activity Tracking
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Activities table schema
- 🎨 [Design System](./15-design-tokens.md) - Activity feeds and timeline components
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Activity logging on stage changes
- 🔗 [Organizations Module](./04-organizations-module.md) - Activity feed tab
- 🔗 [Contacts Module](./05-contacts-module.md) - Activity feed section
- 📊 [Reports](./09-reports.md) - Weekly activity summary
---

# 3.8 Activity Tracking

## Activity Types & Icons

| Activity Type | Icon | Color | Auto-Generated |
|--------------|------|-------|----------------|
| **Call** | 📞 Phone | Blue | No (Manual) |
| **Email** | ✉️ Envelope | Teal | No (Manual) |
| **Meeting** | 📅 Calendar | Purple | No (Manual) |
| **Sample Delivered** | 📦 Box | Orange | No (Manual) |
| **Demo/Cookup** | 👨‍🍳 Chef Hat | Red | No (Manual) |
| **Note** | 📝 Note | Gray | No (Manual) |
| **Status Change** | ➡️ Arrow | Green | Yes (Auto) |
| **Stage Change** | 📶 Ladder | Yellow | Yes (Auto) |

## Quick Log Activity (Basic Structured Logging)

**Access Points:**
- Opportunity detail page (inline form at top of Activity Timeline)
- Organization detail page (Activity Feed tab)
- Contact detail page (Activity Feed section)

**Form Fields (Simple):**
- **Activity Type*** (dropdown with icons)
  - Call, Email, Meeting, Note
- **Date*** (date picker, default: today)
- **Description*** (textarea, 500 char limit)
  - Placeholder: "What happened? (e.g., 'Called chef about pricing, will follow up next week')"

**Note:** Activity is automatically linked to the entity (opportunity/organization/contact) where the form is opened.

**Submit:**
- **Log Activity** button (primary)
- Form clears after submission, ready for next entry

**Success Feedback:**
- Toast notification: "Activity logged"
- Activity immediately appears at top of activity feed (reverse chronological)

## Activity Feed Display

**Layout:**
- Reverse chronological list (newest first)
- Each activity entry:

```
┌────────────────────────────────────────────────────┐
│ [Avatar] John Doe  📞 Call                         │
│ 2 hours ago                                        │
│ ──────────────────────────────────────────────────│
│ Called Ballyhoo - spoke with Chef Mike. Discussed │
│ poke pricing. He's interested but needs to check  │
│ with owner. Follow-up scheduled for Friday.        │
│ ──────────────────────────────────────────────────│
│ Related: Ballyhoo Poke Deal (Opportunity)          │
│ Participants: Mike Johnson (Chef)                  │
│ Outcome: Interested - Follow-up needed             │
│                                         [Edit] [⋯] │
└────────────────────────────────────────────────────┘
```

**Interaction:**
- **Click activity** → Expand for full description (if truncated)
- **Hover** → Show edit/delete actions (if user created activity)
- **Click related entity link** → Navigate to that entity's detail page
- **Click participant** → Navigate to contact detail page

**Filtering:**
- Filter dropdown above feed:
  - **Activity Type** (multi-select with icons: Call, Email, Meeting, etc.)
  - **User** (multi-select: All, Me, Specific users)
  - **Date Range** (presets: Today, This Week, This Month, Custom)
- Applied filters shown as chips
- "Clear filters" button

**Search within Activities:**
- Search box above feed
- Searches: Description, Participant names, Related entity names
- Real-time filtering

**Pagination:**
- **Option 1**: "Load More" button (loads next 20 activities)
- **Option 2**: Infinite scroll (auto-loads on scroll to bottom)
- Performance: Lazy load, virtualize long lists (react-window or similar)

**Export:**
- "Export Activity Feed" button
- Exports to CSV with columns: Date, Time, User, Type, Description, Related Entity, Outcome
- Respects current filters

## Automated Activity Logging

**System Automatically Creates Activities For:**

1. **Opportunity Stage Changes**
   - Type: "Stage Change"
   - Description: "Stage changed from [Old Stage] to [New Stage] by [User]"
   - Optional user note appended if provided during drag-and-drop

2. **Opportunity Status Changes**
   - Type: "Status Change"
   - Description: "Status changed from [Old Status] to [New Status] by [User]"

3. **Organization Priority Changes**
   - Type: "Note" (system-generated)
   - Description: "Priority updated from [Old] to [New] by [User]"

4. **Assignment Changes**
   - Type: "Note"
   - Description: "Deal Owner changed from [Old User] to [New User] by [Admin]"
   - Description: "Account Manager changed from [Old User] to [New User]"

5. **Opportunity Conversion**
   - Type: "Note"
   - Description: "Opportunity converted to Order by [User]. Volume: [X] cases/week"

**Automated Activity Appearance:**
- Different styling: Lighter background, system icon (gear/cog)
- Cannot be edited or deleted
- Labeled: "System Activity" badge
