# Crispy CRM List-Specific Recommendations

> **Purpose:** Tailored recommendations for each list type in Crispy CRM based on UX research
> **Context:** Desktop-first (1440px+) with iPad support, 6 account managers, food distribution broker CRM

---

## Design Principles Applied

All recommendations follow these Crispy CRM principles:
- **<2 Second Answer:** Users must immediately see their next action per principal
- **44px Touch Targets:** Required for iPad field use
- **Semantic Colors:** Use Tailwind v4 tokens only (text-muted-foreground, bg-primary, etc.)
- **Slide-Over Pattern:** 40vw right panel for record details (URL: `?view={id}`)

---

## Contacts List

### Purpose
Display people associated with distributors and operators for quick access and communication tracking.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | Name | 180px min | Always | Primary identifier, clickable to slide-over |
| 2 | Organization | 160px min | Always | Distributor/Operator name, linked |
| 3 | Role | 100px | Always | Job title/position |
| 4 | Phone | 120px | Desktop | Click-to-call on mobile |
| 5 | Email | 180px | Desktop | Truncate with tooltip |
| 6 | Last Activity | 100px | Desktop | Relative date ("2 days ago") |
| 7 | Tags | 120px | Hidden | Show in column config |

### Filter Configuration

**Sidebar Filters (Always Visible):**
- Organization Type: Distributor / Operator / Principal
- Tags: Multi-select cumulative filter
- Has Recent Activity: Yes / No (last 30 days)

**Quick Search:** FilterLiveSearch on name + email

### Specific Patterns to Apply

1. **Ellipsis + Tooltip** on email column (emails often long)
2. **Row Click → Slide-over** for contact details
3. **Conditional Row Styling:** Highlight contacts with no activity in 30+ days
4. **Empty State:** "No contacts yet. Import from Excel or add your first contact."

### Rationale
Contacts are looked up by organization context. Prioritizing organization column and filtering by organization type supports the distributor→operator relationship model.

---

## Organizations List

### Purpose
View and manage distributors, operators, and principals with their key business information.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | Name | 200px min | Always | Company name, clickable |
| 2 | Type | 100px | Always | Badge: Distributor/Operator/Principal |
| 3 | Primary Contact | 150px | Always | Contact name, linked |
| 4 | Territory | 120px | Desktop | City/region |
| 5 | Active Opportunities | 80px | Desktop | Count badge |
| 6 | Last Activity | 100px | Hidden | Column config |
| 7 | Created | 100px | Hidden | Column config |

### Filter Configuration

**Sidebar Filters:**
- Type: Distributor / Operator / Principal (single select)
- Territory: Multi-select by region
- Has Opportunities: Yes / No

**Saved Views:**
- "My Distributors" (user's assigned distributors)
- "Active Principals" (principals with recent opportunities)

### Specific Patterns to Apply

1. **Type Badge Column** with semantic colors:
   - Distributor: `bg-primary/10 text-primary`
   - Operator: `bg-secondary/10 text-secondary`
   - Principal: `bg-accent/10 text-accent`
2. **Organization Type Icons** in filter sidebar
3. **Row Click → Slide-over** showing organization details + related contacts
4. **Empty State:** "No organizations found. Add distributors and operators to start tracking."

### Rationale
Organization type is critical context for MFB's broker model. Visual type badges enable instant recognition of the entity's role in the supply chain.

---

## Opportunities List

### Purpose
**Primary view for account managers** — Answer "What's the ONE thing I need to do this week for each principal?" in <2 seconds.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | Name/Title | 200px min | Always | Opportunity name, clickable |
| 2 | Principal | 140px | Always | **Critical for filtering** |
| 3 | Stage | 130px | Always | Badge with stage color |
| 4 | Distributor | 140px | Always | Related distributor |
| 5 | Next Task | 180px | Always | **Key for <2s answer goal** |
| 6 | Owner | 100px | Desktop | Assigned rep |
| 7 | Last Activity | 100px | Desktop | Relative date |
| 8 | Created | 100px | Hidden | Column config |

### Filter Configuration

**Sidebar Filters (Critical for Principal-First Views):**
```
Principal: [All principals as FilterListItems]
  ○ Acme Foods
  ○ Better Brands
  ○ Chef's Choice
  ...

Stage: [Pipeline stages]
  ○ New Lead
  ○ Initial Outreach
  ○ Sample/Visit Offered
  ○ Feedback Logged
  ○ Demo Scheduled
  ○ Closed Won
  ○ Closed Lost

Owner: [Account managers]
  ○ My Opportunities (current user)
  ○ [Other reps...]
```

**Saved Views:**
- "My Open Opportunities" (owner = current user, stage ≠ closed)
- "Needs Attention" (no activity in 7+ days, not closed)
- "[Principal] Pipeline" (one per principal)

### Specific Patterns to Apply

1. **Stage Badge Colors** (7 pipeline stages):
   ```
   new_lead:          bg-blue-100 text-blue-800
   initial_outreach:  bg-indigo-100 text-indigo-800
   sample_visit:      bg-purple-100 text-purple-800
   feedback_logged:   bg-yellow-100 text-yellow-800
   demo_scheduled:    bg-orange-100 text-orange-800
   closed_won:        bg-green-100 text-green-800
   closed_lost:       bg-gray-100 text-gray-500
   ```

2. **Next Task Column** - Most important column for UX goal:
   - Show task title + due date
   - Red text if overdue
   - Green checkmark if task due today
   - "No tasks" with muted styling if none

3. **Conditional Row Styling:**
   ```tsx
   const rowSx = (record) => ({
     backgroundColor: record.next_task_overdue ? 'var(--destructive-50)' : undefined,
     borderLeft: record.is_hot_lead ? '4px solid var(--primary)' : undefined,
   });
   ```

4. **Principal Filter Persistence:** Save last-selected principal filter per user

5. **Default Sort:** By next task due date (ascending) to surface urgent items

6. **Empty State:**
   - No opportunities: "No opportunities yet. Create your first opportunity to start tracking deals."
   - No results with filter: "No opportunities for [Principal]. Clear filters or create new."

### Rationale
This is THE critical list for Crispy CRM. The "Next Task" column directly addresses the <2 second goal. Principal-based filtering is mandatory for the account manager workflow. Stage visualization provides instant pipeline understanding.

---

## Tasks List

### Purpose
Centralized task management for follow-ups, calls, and action items across all opportunities.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | ☐ | 48px | Always | Checkbox to complete |
| 2 | Title | 200px min | Always | Task description |
| 3 | Due Date | 100px | Always | Color-coded by urgency |
| 4 | Related To | 150px | Always | Opportunity/Contact link |
| 5 | Principal | 120px | Desktop | For context |
| 6 | Type | 80px | Desktop | Call/Email/Meeting/Sample |
| 7 | Assigned | 100px | Hidden | Column config |

### Filter Configuration

**Sidebar Filters:**
```
Status:
  ○ Open (default)
  ○ Completed
  ○ All

Due:
  ○ Overdue
  ○ Today
  ○ This Week
  ○ Upcoming

Type:
  ○ Call
  ○ Email
  ○ Meeting
  ○ Sample Follow-up

Principal: [Same as opportunities]
```

**Quick Actions:**
- "Snooze" button on each row (defer 1 day, 1 week, custom)
- Bulk complete selected tasks

### Specific Patterns to Apply

1. **Due Date Urgency Colors:**
   ```
   Overdue:     text-destructive font-semibold
   Today:       text-warning font-medium
   Tomorrow:    text-foreground
   This Week:   text-muted-foreground
   Future:      text-muted-foreground/70
   ```

2. **Inline Completion:** Checkbox click completes task inline with undo toast

3. **Row Click → Related Record:** Opens related opportunity/contact slide-over

4. **Conditional Row Styling:**
   - Strikethrough for completed tasks
   - Red left border for overdue

5. **Default View:** "Open" status + sorted by due date ascending

6. **Empty State:**
   - All caught up: "All tasks complete! Time for a coffee break. ☕"
   - With filters: "No tasks match your filters."

### Rationale
Task list optimized for daily workflow. Quick completion and snooze support the "10+ activities per week per principal" goal. Due date urgency visualization enables instant prioritization.

---

## Products List

### Purpose
Manage product catalog for principals with pricing and availability information.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | Name | 200px min | Always | Product name |
| 2 | Principal | 140px | Always | Manufacturer/brand |
| 3 | SKU | 100px | Desktop | Product code |
| 4 | Category | 120px | Desktop | Product category |
| 5 | Status | 100px | Always | Active/Discontinued badge |
| 6 | Created | 100px | Hidden | Column config |

### Filter Configuration

**Sidebar Filters:**
- Principal: Filter by manufacturer
- Category: Product categories
- Status: Active / Discontinued

### Specific Patterns to Apply

1. **Status Badges:**
   - Active: `bg-green-100 text-green-800`
   - Discontinued: `bg-gray-100 text-gray-500 line-through`

2. **Search-First:** Products are often looked up by SKU, so prioritize search

3. **Row Click → Slide-over** with full product details + related samples

4. **Empty State:** "No products found. Add products to track samples and orders."

### Rationale
Products are reference data primarily filtered by principal. Simple list with strong search/filter capabilities.

---

## Campaigns List

### Purpose
Track marketing campaigns and outreach efforts across principals and territories.

### Recommended Columns (Priority Order)

| Priority | Column | Width | Visible | Notes |
|----------|--------|-------|---------|-------|
| 1 | Name | 200px min | Always | Campaign name |
| 2 | Principal | 140px | Always | Associated principal |
| 3 | Status | 100px | Always | Draft/Active/Completed |
| 4 | Start Date | 100px | Desktop | Campaign start |
| 5 | End Date | 100px | Desktop | Campaign end |
| 6 | Opportunities | 80px | Desktop | Count of generated opps |
| 7 | Created By | 100px | Hidden | Column config |

### Filter Configuration

**Sidebar Filters:**
- Principal: Filter by manufacturer
- Status: Draft / Active / Completed
- Date Range: This Month / This Quarter / This Year

### Specific Patterns to Apply

1. **Status Timeline Colors:**
   - Draft: `bg-gray-100 text-gray-600`
   - Active: `bg-green-100 text-green-800`
   - Completed: `bg-blue-100 text-blue-800`

2. **Date Range Indication:** Show visual indicator if campaign is active now

3. **Opportunity Count Badge:** Clickable to filter opportunities by campaign

4. **Empty State:** "No campaigns yet. Create a campaign to track outreach efforts."

### Rationale
Campaigns provide context for opportunities and activities. Status and date filtering support campaign management workflow.

---

## Cross-List Patterns

### Mobile/iPad Adaptations

For all lists on iPad (< 1024px):

1. **Reduce to Essential Columns:**
   - Always: Name + Primary Context + Status
   - Hide: Dates, Secondary Info, Counts

2. **Enable Card View Option:**
   - Stack key-value pairs vertically
   - Touch-friendly action buttons (44px)
   - Swipe actions for quick operations

3. **Bottom Sheet Filters:**
   - Replace sidebar with bottom sheet on tablet
   - Full-width filter selection

### Keyboard Navigation

All lists should support:
- `↑/↓` Row navigation
- `Enter` Open selected record
- `Space` Toggle row selection
- `Shift+Click` Range selection
- `/` Focus search

### Consistent Empty State Structure

```
┌─────────────────────────────────────┐
│         [Illustration/Icon]         │
│                                     │
│      [Clear Explanation Text]       │
│                                     │
│      [Primary CTA Button]           │
│      [Secondary Link (optional)]    │
└─────────────────────────────────────┘
```

---

*Recommendations based on UX research for Crispy CRM project*
