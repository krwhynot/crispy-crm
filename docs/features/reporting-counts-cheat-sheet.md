# Reporting Counts Cheat Sheet

Use this as a quick reference for what each dashboard/report number includes.

## Quick Rules (Applies Almost Everywhere)

1. Deleted records are not counted.
2. "Open" or "Stale" deal metrics do not count closed won/lost deals.
3. In this CRM, tasks are stored as a type of activity.  
   That means some "activity" metrics can include task records unless the metric is task-specific.
4. Any filters you apply (date range, rep, principal, campaign, stage) narrow the counts.

## Dashboard

| Widget | Counts | Does Not Count |
|---|---|---|
| Open Opportunities | Deals that are still open | Closed won/lost deals, deleted deals |
| Overdue Tasks | Your incomplete tasks due before today | Completed tasks, deleted tasks, other reps' tasks |
| Activities This Week | Activity records in the current week | Deleted activity records |
| Stale Deals | Open deals with no recent activity based on stage timeout rules | Closed won/lost deals, deals still within threshold |
| Pipeline by Principal | Open pipeline totals by principal, recent activity trend, next action | Deleted records; closed deals excluded from active pipeline totals |
| My Tasks (tab + badge) | Your incomplete tasks | Completed tasks, deleted tasks, other reps' tasks |
| My Performance | Your activities, tasks completed, deal movement, open opps | Other reps' records; closed deals excluded from open-opportunity metric |
| Team Activity Feed | Most recent team activity entries | Deleted entries |

## Reports

| Report | Counts | Does Not Count |
|---|---|---|
| Overview | Opportunity totals, activity trend, stale lead/deal KPIs, principal/rep chart totals | Deleted records; stale KPIs exclude closed deals |
| Opportunities by Principal | Active opportunities grouped by principal (respecting your filters) | Deleted or inactive opportunities; anything outside filters |
| Weekly Activity | Activities in selected date range, grouped by rep and principal | Activities outside range, deleted records |
| Campaign Activity | Activities linked to opportunities in selected campaign (plus filtered breakdowns) | Records outside selected campaign, deleted records, anything outside filters |
| Campaign Stale Leads View | Campaign opportunities past stage-specific inactivity thresholds | Closed won/lost opportunities, opportunities still within threshold |

## Stale Thresholds Used

- New Lead: 7 days without activity
- Initial Outreach: 14 days
- Sample Visit Offered: 14 days
- Feedback Logged: 21 days
- Demo Scheduled: 14 days

