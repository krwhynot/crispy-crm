# Dashboard Usage Guide

The Principal Dashboard is your command center for daily sales operations. This guide explains every feature and how to use it effectively.

## Dashboard Layout

The dashboard uses a two-column layout optimized for tablets (iPad) and desktops:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRINCIPAL DASHBOARD                          │
├───────────────────────────────┬─────────────────────────────────┤
│                               │                                  │
│   PIPELINE TABLE              │   TASKS PANEL                   │
│   (40% width)                 │   (60% width)                   │
│                               │                                  │
│   • Principal list            │   • Overdue                     │
│   • Opportunity counts        │   • Today                       │
│   • Momentum indicators       │   • Tomorrow                    │
│   • Click to drill down       │   • This Week                   │
│                               │                                  │
├───────────────────────────────┴─────────────────────────────────┤
│                                                        [+] FAB   │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Table

The left panel shows all principals with their pipeline status.

### What Each Column Means

| Column | Description |
|--------|-------------|
| **Principal** | Manufacturer name |
| **Total Opps** | Count of all active opportunities |
| **By Stage** | Breakdown showing opportunities in each stage |
| **Momentum** | Activity trend indicator |

### Momentum Indicators

The momentum column shows how actively deals are being worked:

| Indicator | Color | Meaning | Action Needed |
|-----------|-------|---------|---------------|
| Increasing | Green | Activity in last 7 days | Keep it up! |
| Steady | Blue | Activity 8-14 days ago | Maintain pace |
| Decreasing | Yellow | Activity declining | Needs attention |
| Stale | Red | No activity past threshold | Urgent follow-up |

### Visual Decay Borders

Opportunities in the **Sample/Visit Offered** stage show colored borders:

- **Green** (0-7 days) - Fresh, recently worked
- **Yellow** (8-14 days) - Getting stale, follow up soon
- **Red** (14+ days) - At risk, needs immediate attention

### Clicking on a Principal

Click any row in the Pipeline Table to:
1. Filter the view to that principal only
2. See detailed opportunities for that principal
3. Quickly assess where to focus your time

## Tasks Panel

The right panel organizes your tasks by urgency.

### Time Buckets

| Bucket | Contents | Display |
|--------|----------|---------|
| **Overdue** | Tasks past due date | Red highlight, count badge |
| **Today** | Tasks due today | Yellow highlight |
| **Tomorrow** | Tasks due tomorrow | Normal |
| **This Week** | Tasks due within 7 days | Normal |

### Task Actions

For each task, you can:
- **Click checkbox** - Mark complete (optionally log an activity)
- **Click task text** - Open the related record
- **Snooze** - Postpone to another date

### Completing Tasks

When you check off a task:
1. A dialog appears asking if you want to log an activity
2. If yes: The activity form opens pre-filled with task details
3. If no: Task is marked complete without logging

> **Pro Tip:** Logging activities when completing tasks builds a rich history of customer interactions.

## Log Activity Button (FAB)

The floating action button in the bottom-right corner is your quickest way to log activities.

### How to Use

1. Click the **+** button
2. Select activity type (Call, Email, Meeting, etc.)
3. Choose the contact and optionally link to an opportunity
4. Add your notes
5. Click **Save**

### Activity Types Available

| Type | When to Use |
|------|-------------|
| Call | Phone conversations |
| Email | Email correspondence |
| Meeting | In-person or virtual meetings |
| Demo | Product demonstrations |
| Sample | Product samples sent |
| Site Visit | On-site customer visits |
| Follow-up | Scheduled follow-up touchpoints |
| Proposal | Formal proposals sent |
| Contract Review | Contract discussions |
| Check-in | Quick check-in calls |
| Trade Show | Trade show interactions |
| Social | Social media interactions |
| Note | Internal notes |

### Quick Features

- **Draft persistence** - If you close the form accidentally, your draft is saved for 24 hours
- **Save & New** - Save current activity and immediately start another
- **Create follow-up task** - Toggle to create a task from the activity

## Using the Dashboard Effectively

### Morning Routine (5 minutes)

1. **Check Overdue Tasks** - Address anything in red immediately
2. **Review Stale Deals** - Look for red/yellow borders in Pipeline Table
3. **Plan Your Day** - Prioritize based on task urgency and deal momentum

### During the Day

- **Log activities immediately** - Use the FAB button right after calls/meetings
- **Complete tasks** - Check them off as you finish them
- **Monitor momentum** - Glance at the dashboard between activities

### End of Day (5 minutes)

- **Clear Today's tasks** - Complete or reschedule anything remaining
- **Update stages** - Move opportunities that progressed
- **Review tomorrow** - Know what's coming

## Dashboard KPIs

The top of the dashboard shows key performance indicators:

| KPI | What It Measures | Good Sign |
|-----|------------------|-----------|
| **Open Opportunities** | Total active deals in pipeline | Growing count |
| **Activities This Week** | Your logged activities | 15+ per week |
| **Overdue Tasks** | Tasks past due date | Zero is the goal |
| **Stale Deals** | Deals needing attention | Zero is the goal |

### Clicking KPIs

Each KPI is clickable:
- **Open Opportunities** → Opens full opportunity list
- **Activities This Week** → Opens weekly activity report
- **Overdue Tasks** → Opens task list filtered to overdue
- **Stale Deals** → Opens opportunity list filtered to stale

## Filtering and Navigation

### Filtering by Principal

1. Click any principal row in the Pipeline Table
2. All views filter to that principal
3. To clear: Click "All Principals" or refresh

### Navigation Shortcuts

| From Dashboard | Navigate To |
|----------------|-------------|
| Click Principal | Principal detail & opportunities |
| Click Task | Related opportunity or contact |
| Click KPI | Relevant list view |

## Mobile/Tablet Usage

The dashboard is optimized for iPad and mobile:

### iPad Landscape (Recommended)
- Full two-column layout
- Tasks panel may collapse to icon rail (click to expand)

### iPad Portrait
- Master-detail navigation
- Click principal to see detail view

### Phone
- Single-column, stacked layout
- FAB remains accessible bottom-right

## Troubleshooting

### Dashboard Not Loading

1. Check your internet connection
2. Try refreshing the page
3. Clear browser cache if issues persist

### Tasks Not Appearing

Tasks only appear if:
- They're assigned to you
- They have a due date within the current week
- They're not marked complete

### Stale Indicators Wrong

Stale detection is based on last activity date:
- Make sure activities are logged
- Verify the opportunity has recent activities

### Activities Not Saving

If the Log Activity form isn't saving:
1. Check all required fields (type, contact, notes)
2. Ensure you have internet connectivity
3. Try the "Save" button again

## Power User Tips

### Tip 1: Use Save & New
When logging multiple activities (like after a day of calls), use "Save & New" to quickly enter them all without returning to the dashboard.

### Tip 2: Create Follow-ups Automatically
Always check "Create follow-up task" when logging activities that need follow-up. It saves the extra step of creating a task manually.

### Tip 3: Work the Colors
Red and yellow borders are your priority signals. Start each day by addressing the hottest items first.

### Tip 4: Keyboard Shortcuts
- Press `Tab` to move between form fields
- Press `Enter` to save (when focused on save button)

### Tip 5: Link Activities to Opportunities
Always link activities to opportunities when relevant - it builds a complete history that helps during manager reviews and principal reporting.

---

*Master the dashboard, master your pipeline. Check it first thing every morning and last thing every evening.*
