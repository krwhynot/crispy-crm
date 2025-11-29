# Frequently Asked Questions (FAQ)

Quick answers to common questions about using Crispy-CRM.

---

## Getting Started

### How do I get a login?

Contact your administrator. Only admins can create new user accounts. You'll receive an email with your credentials.

### I forgot my password. What do I do?

Click "Forgot Password" on the login page and enter your email. You'll receive a password reset link.

### Can I use the CRM on my phone/tablet?

Yes! Crispy-CRM is fully responsive and works on:
- iPad (recommended for field work)
- iPhone/Android phones
- Desktop browsers

The iPad in landscape mode provides the best mobile experience with the full two-column dashboard.

---

## Opportunities

### What's the difference between Principal, Distributor, and Customer?

| Entity | Role | Examples |
|--------|------|----------|
| **Principal** | Manufacturer whose products MFB represents | McCRUM, Rapid Rasoi |
| **Distributor** | Company that buys and distributes products | Sysco, USF, GFS |
| **Customer** | End restaurant/foodservice operator | Local restaurants |

An **Opportunity** links all three: we're selling a Principal's product to a Customer, potentially through a Distributor.

### Do I need a Distributor for every opportunity?

No. Distributor is optional. Some deals are direct to customer without a distributor involved.

### Why can't I create a contact without an organization?

This is by design. Every contact must belong to an organization. For trade show leads where you don't know the company, create a placeholder organization first (like "Unknown - Trade Show Lead"), then add the contact.

### What counts as "Won"?

**Won = First purchase order placed.** A verbal commitment or intent to buy is not yet a win. Wait for the actual PO before marking closed-won.

### Can I reopen a closed opportunity?

Yes! Change the stage from Closed-Won/Lost to any active stage. The win/loss reason will be cleared, and you'll need to select a new reason if it closes again.

### Why is my opportunity showing a red border?

Red borders indicate **stale deals** - opportunities that haven't had activity logged recently. This is a prompt to follow up. Log an activity to clear the warning.

---

## Activities

### What's the fastest way to log an activity?

Use the **floating action button** (FAB) in the bottom-right corner of the dashboard. It's designed for logging activities in under 30 seconds.

### Should I log every email?

Log emails that are significant touchpoints. You don't need to log every automated newsletter or routine correspondence, but do log:
- Initial outreach emails
- Responses to customer questions
- Proposal sends
- Follow-up correspondence

### What activity type should I use for a text message?

Use **Check-in** for quick text messages, or **Follow-up** if it's specifically following up on a prior conversation.

### Can I edit an activity after saving?

Yes. Navigate to the contact or opportunity timeline, find the activity, and click to edit.

### What's the difference between a Note and other activity types?

**Note** is for internal documentation that isn't a customer interaction. Use it for:
- Research findings
- Internal strategy notes
- Information you want to record but didn't involve customer contact

---

## Tasks

### How do I create a task?

1. Go to any Opportunity or Contact
2. Click "Add Task"
3. Enter description, due date, and priority
4. Save

Or, when logging an activity, check "Create follow-up task" to automatically create one.

### What do the task colors mean?

| Color | Meaning |
|-------|---------|
| Red | Overdue - past due date |
| Yellow | Due today |
| Normal | Due tomorrow or later this week |

### How do I snooze a task?

Click the snooze button on the task and select a new date:
- Tomorrow (9 AM)
- Next Week (Monday 9 AM)
- Custom date

### Can I assign tasks to other people?

Yes, if you're a Manager or Admin. When creating/editing a task, select a different assignee.

---

## Samples

### How do I track a product sample?

See the full [Sample Tracking Workflow](./sample-tracking-workflow.md) guide. In brief:
1. Log a **Sample** activity when you send it
2. Include product details and tracking info
3. Create a follow-up task
4. Log feedback when you receive it

### What if the customer never responds about a sample?

After following up 2-3 times with no response:
1. Log your final attempt
2. Select "No Response" as the feedback status
3. Consider closing the opportunity as lost (Timing/Budget) or keep it warm with a long-term follow-up task

---

## Reports

### Where do I find reports?

Click **Reports** in the main navigation. You'll see tabs for:
- Overview (KPIs and charts)
- Opportunities by Principal
- Weekly Activity
- Campaign Activity

### How do I generate a report for a principal?

1. Go to Reports → Opportunities by Principal
2. Select the principal from the filter
3. Choose your date range
4. Export to Excel if needed

### Can I export data to Excel?

Yes! Most list views and reports have an **Export** button that generates an Excel file.

---

## Pipeline & Stages

### What are the pipeline stages?

| # | Stage | Meaning |
|---|-------|---------|
| 1 | New Lead | Initial prospect |
| 2 | Initial Outreach | First contact made |
| 3 | Sample/Visit Offered | Product sampling in progress |
| 4 | Feedback Logged | Customer feedback recorded |
| 5 | Demo Scheduled | Demo planned |
| 6 | Closed - Won | PO placed! |
| 7 | Closed - Lost | Didn't work out |

### How do I move an opportunity to the next stage?

1. Open the opportunity
2. Change the Stage field dropdown
3. Save

If moving to Closed-Won or Closed-Lost, you'll be prompted for a reason.

### What makes a deal "stale"?

Different stages have different thresholds:
- New Lead: 7 days without activity
- Initial Outreach: 14 days
- Sample/Visit Offered: 14 days
- Feedback Logged: 21 days
- Demo Scheduled: 14 days

Closed deals (Won/Lost) never go stale.

---

## Troubleshooting

### The page won't load / shows an error

1. Refresh the page
2. Check your internet connection
3. Try logging out and back in
4. Clear browser cache and cookies
5. If still broken, contact your administrator

### I can't find an opportunity I know exists

Check if:
- It might be closed (filter to include closed opportunities)
- You're filtered to a specific principal (clear filters)
- Try the search function with the customer or principal name

### My changes didn't save

Make sure:
- All required fields are filled (marked with *)
- You clicked Save (not just X to close)
- You have internet connectivity

If the form shows validation errors, fix them before saving.

### Activities I logged aren't showing up

Activities appear on:
- The contact's timeline
- The opportunity's timeline (if linked)
- The organization's timeline

Check that you linked the activity to the right record.

### Someone else's tasks are showing in my view

The task panel shows **your** tasks by default. If you're seeing others' tasks, you may be:
- Viewing a filtered/shared view
- Looking at a report rather than your personal dashboard

---

## Account & Permissions

### What can different roles do?

| Action | Rep | Manager | Admin |
|--------|-----|---------|-------|
| View all opportunities | Yes | Yes | Yes |
| Log activities | Yes | Yes | Yes |
| Create opportunities | Yes | Yes | Yes |
| Reassign opportunities | No | Yes | Yes |
| Delete records | Own | Own + Reports | All |
| Manage users | No | No | Yes |
| System settings | No | No | Yes |

### Why can't I delete something?

Crispy-CRM uses **soft delete** - records are archived, not truly deleted. You can only soft-delete:
- Records you created
- Records assigned to you
- (Managers) Records from your reports
- (Admins) Any record

### Can I see who made changes to a record?

Yes. Every record shows:
- Created by and created date
- Last modified by and modified date
- Full audit trail (visible to admins)

---

## Tips & Best Practices

### How can I be more efficient?

1. **Use the FAB** - Log activities immediately after they happen
2. **Work the colors** - Address red (stale) items first
3. **Save & New** - When logging multiple activities in a row
4. **Create follow-ups** - Always create a follow-up task when logging activities

### What should I do at the start of each day?

1. Check overdue tasks (red) - handle these first
2. Review today's tasks
3. Look at stale deals (red/yellow borders)
4. Plan which opportunities to work

### What should I do at the end of each day?

1. Log any activities you forgot
2. Update opportunity stages that changed
3. Complete or reschedule today's tasks
4. Glance at tomorrow's tasks

---

## Getting More Help

### Where can I learn more?

- [Getting Started Guide](./getting-started.md)
- [Dashboard Usage Guide](./dashboard-usage.md)
- [Sample Tracking Workflow](./sample-tracking-workflow.md)
- [Win/Loss Workflow](./win-loss-workflow.md)

### Who do I contact for help?

Contact your system administrator for:
- Account issues
- Permission problems
- Bug reports
- Feature requests

---

*Can't find your answer? Ask your administrator or check the detailed guides linked above.*
