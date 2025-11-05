# Phase 4: User Experience Enhancement - Task Breakdown

**Timeline:** Weeks 7-8 (80 hours)
**Focus:** Dashboard, Advanced Search, Notifications, Activity Tracking, iPad Optimizations, Keyboard Shortcuts

---

## Epic Overview

| Epic ID | Epic Name | Total Hours | Confidence | Status |
|---------|-----------|-------------|------------|--------|
| E1 | Dashboard Implementation | 16h | 90% | ✅ Complete |
| E2 | Advanced Search System | 32h | 60% | ❌ SKIP - Module search already implemented |
| E3 | In-App Notifications | 12h | 85% | ✅ Complete |
| E4 | Activity Tracking Enhancements | 10h | 88% | ⚠️ Partially Complete (filtering done, need search & export) |
| E5 | iPad Touch Optimizations | 6h | 92% | ✅ Complete |
| E6 | Keyboard Shortcuts | 4h | 85% | ✅ Complete |

**Original Estimated Hours:** 80h
**Actual Hours Completed:** ~50h (Dashboard 16h + Notifications 12h + iPad 6h + Keyboard 4h + Activity partial 12h)
**Remaining Hours:** ~6h (Activity: T1 enhancement 1h, T3 search 2h, T4 export 2h, testing 1h)

---

## Epic 1: Dashboard Implementation (16h) - ✅ COMPLETE

**Status:** ✅ Complete (All 8 widgets implemented)
**Actual Hours:** ~8h (under estimate due to existing dashboard base)

**Implementation Files:**
- `src/atomic-crm/dashboard/Dashboard.tsx` - Main dashboard with refresh
- `src/atomic-crm/dashboard/DashboardWidget.tsx` - Reusable widget container
- `src/atomic-crm/dashboard/MyOpenOpportunities.tsx` - Widget (T3)
- `src/atomic-crm/dashboard/OverdueTasks.tsx` - Widget (T4)
- `src/atomic-crm/dashboard/ThisWeeksActivities.tsx` - Widget (T5)
- `src/atomic-crm/dashboard/PipelineByStage.tsx` - Chart widget (T6)
- `src/atomic-crm/dashboard/RecentActivities.tsx` - Feed widget (T7)
- `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx` - ⭐ Priority widget (T8)

**Features Delivered:**
- ✅ Fixed grid layout responsive for iPad/desktop
- ✅ Auto-refresh every 5 minutes with cleanup
- ✅ Manual refresh button with spinner feedback
- ✅ Independent widget loading states (skeleton animations)
- ✅ Error handling with retry per widget
- ✅ Click navigation to filtered lists
- ✅ Recharts integration for Pipeline by Stage
- ✅ All widgets use semantic colors (no hex codes)

Fixed layout dashboard with 6 widgets, auto-refresh, and manual refresh capability.

### Story E1-S1: Dashboard Infrastructure

#### P4-E1-S1-T1: Create Dashboard Route and Base Layout ✅
- **Hours:** 2h (Actual: 0.5h - Dashboard already existed, added refresh functionality)
- **Confidence:** 95%
- **Prerequisites:** None
- **Description:**
  - Create `/dashboard` route in React Router
  - Set up base Dashboard component structure
  - Implement fixed grid layout (responsive for iPad/desktop)
  - Add manual refresh button (circular arrow icon)
  - Add auto-refresh every 5 minutes using interval
- **Acceptance Criteria:**
  - ✅ Dashboard accessible at `/` route (React Admin default dashboard)
  - ✅ Fixed grid layout renders correctly on iPad and desktop (already implemented)
  - ✅ Manual refresh button triggers data reload (added RefreshCw button with spinner)
  - ✅ Auto-refresh runs every 5 minutes (useEffect with 5-minute interval)
  - ✅ Loading state shows while refreshing (button disabled + spinner during refresh)
- **Integration Points:**
  - React Router configuration (handled by React Admin)
  - Base CRM layout (already integrated)
- **Implementation Notes:**
  - Dashboard component already existed at `src/atomic-crm/dashboard/Dashboard.tsx`
  - Already had responsive grid layout for iPad/desktop
  - Added auto-refresh with `setInterval` and cleanup in `useEffect`
  - Added manual refresh button with `RefreshCw` icon from lucide-react
  - Refresh button shows spinner animation during refresh
  - 500ms minimum feedback duration for better UX

#### P4-E1-S1-T2: Create Widget Container Component ✅
- **Hours:** 1h (Actual: 0.5h)
- **Confidence:** 92%
- **Prerequisites:** P4-E1-S1-T1
- **Description:**
  - Create reusable `DashboardWidget` component
  - Support title, loading state, error state
  - Implement error boundary with retry button
  - Add independent loading skeletons per widget
- **Acceptance Criteria:**
  - ✅ Widget container handles loading states (skeleton with pulse animation)
  - ✅ Error state shows "Unable to load" with retry (AlertCircle icon + error message + retry button)
  - ✅ Widget styling matches design system (Card component, semantic colors, responsive padding)
  - ✅ Supports click actions for navigation (onClick prop with hover/active states, keyboard support)
- **Integration Points:**
  - Design system components (Card, Button from shadcn/ui)
  - Error handling patterns
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/DashboardWidget.tsx` (147 lines)
  - Props: title, children, isLoading, error, onRetry, onClick, icon, className
  - Loading state: Two-line skeleton with pulse animation
  - Error state: AlertCircle icon + error message + retry button (stops click propagation)
  - Click support: Full card clickable with hover effects, keyboard navigation (Enter/Space)
  - Responsive: min-height scales 160px (sm) → 176px (md) → 192px (lg)
  - Accessibility: role="button", tabIndex, aria-label when clickable
  - Design system compliant: Uses semantic Tailwind utilities (text-muted-foreground, border-primary, etc.)

### Story E1-S2: Widget Implementation

#### P4-E1-S1-T3: Implement "My Open Opportunities" Widget ✅
- **Hours:** 2h (Actual: 0.5h)
- **Confidence:** 90%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of opportunities where user is owner AND status = active
  - Display count with label
  - Click navigates to opportunities list with pre-applied filter
  - Handle zero state gracefully
- **Acceptance Criteria:**
  - ✅ Displays accurate count of user's open opportunities (useGetList with opportunity_owner_id + status filters)
  - ✅ Click navigates to filtered opportunities list (useNavigate with encoded filter JSON)
  - ✅ Zero state shows "No open opportunities" (conditional text based on count)
  - ✅ Updates on manual/auto refresh (refetch prop passed to DashboardWidget)
- **Integration Points:**
  - Supabase data provider (opportunities table)
  - React Router navigation with filters
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/MyOpenOpportunities.tsx` (56 lines)
  - Uses `useGetIdentity()` to get current user's ID
  - Filters: `{ opportunity_owner_id: identity.id, status: "active" }`
  - Large tabular-nums display (4xl → 5xl → 6xl font size)
  - Pluralization: "No open opportunities" / "1 active opportunity" / "N active opportunities"
  - Briefcase icon from lucide-react
  - Click navigates to `/opportunities?filter=...` with JSON-encoded filters
  - Integrated into Dashboard.tsx in new "Phase 4 Widgets" grid section

#### P4-E1-S1-T4: Implement "Overdue Tasks" Widget ✅
- **Hours:** 2h (Actual: 0.5h)
- **Confidence:** 88%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of tasks where due_date < today
  - Display count with red text if count > 0
  - Show visual indicator (red badge) if overdue exists
- **Acceptance Criteria:**
  - ✅ Displays accurate count of overdue tasks (useGetList with completed_at@is:null + due_date@lt filters)
  - ✅ Red text/badge when count > 0 (text-destructive for count and icon)
  - ✅ Calculates "overdue" correctly based on current date (uses date-fns startOfToday())
  - ✅ Visual indicator shows urgency ("Action Required" badge when hasOverdue)
- **Integration Points:**
  - Tasks table query
  - Date comparison logic (date-fns)
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/OverdueTasks.tsx` (68 lines)
  - Filters: `{ "completed_at@is": null, "due_date@lt": startOfTodayISO }`
  - Red styling when count > 0: text-destructive for number, icon, and badge
  - AlertTriangle icon from lucide-react
  - "Action Required" badge appears only when hasOverdue
  - Pluralization: "No overdue tasks" / "1 overdue task" / "N overdue tasks"
  - Non-clickable widget (tasks are managed in existing TasksList widget)

#### P4-E1-S1-T5: Implement "This Week's Activities" Widget ✅
- **Hours:** 1.5h (Actual: 0.5h)
- **Confidence:** 90%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of activities logged this week (Monday-Sunday)
  - Display count with label
- **Acceptance Criteria:**
  - ✅ Displays accurate count of current week's activities (useGetList with activity_date range filter)
  - ✅ Week defined as Monday-Sunday (date-fns startOfWeek/endOfWeek with weekStartsOn: 1)
  - ✅ Count includes all activity types (filter only by date range and deleted_at)
- **Integration Points:**
  - Activities table query
  - Date range filtering (ISO week)
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/ThisWeeksActivities.tsx` (65 lines)
  - Uses date-fns with `weekStartsOn: 1` for Monday-Sunday ISO 8601 week
  - Filters: `{ "deleted_at@is": null, "activity_date@gte": startOfWeek, "activity_date@lte": endOfWeek }`
  - Memoized week boundaries calculation for performance
  - Activity icon from lucide-react
  - Pluralization: "No activities this week" / "1 activity this week" / "N activities this week"
  - Non-clickable widget (navigation deferred - could add activity feed route in future)

#### P4-E1-S1-T6: Implement "Pipeline by Stage" Chart Widget ✅
- **Hours:** 3h (Actual: 2h)
- **Confidence:** 85%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch opportunity counts grouped by stage
  - Render horizontal bar chart (using Recharts or similar)
  - Click bar navigates to opportunities filtered by that stage
  - Show stage names and counts on bars
- **Acceptance Criteria:**
  - ✅ Chart displays all stages with counts (uses ConfigurationContext opportunityStages)
  - ✅ Bars sized proportionally to counts (Recharts automatic sizing)
  - ✅ Click bar filters opportunities by stage (handleBarClick with encoded JSON filter)
  - ✅ Chart responsive on iPad/desktop (ResponsiveContainer, spans 2 cols on md/lg)
  - ✅ Uses semantic colors from design system (8 semantic CSS variables, no hex codes)
- **Integration Points:**
  - Recharts library integration
  - Opportunity stages from ConfigurationContext
  - Stage filtering logic
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/PipelineByStage.tsx` (181 lines)
  - Installed recharts ^2.15.0
  - Horizontal bar chart with custom tooltip showing percentage
  - Uses Map for efficient grouping by stage
  - Color array with 8 semantic CSS variables (--brand-500, --accent, etc.)
  - Custom tooltip shows stage label, count, percentage, and "Click to filter" hint
  - Spans 2 columns on medium/large screens for better visibility
  - Zero state handling with "No active opportunities" message

#### P4-E1-S1-T7: Implement "Recent Activities" Feed Widget ✅
- **Hours:** 2h (Actual: 1.5h)
- **Confidence:** 88%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch last 10 activities across all users
  - Display as list: User, Type, Description, Time ago
  - Click activity navigates to full activity feed
  - Format "time ago" (e.g., "2 hours ago")
- **Acceptance Criteria:**
  - ✅ Shows last 10 activities reverse chronologically (useGetList with DESC sort on activity_date)
  - ✅ Includes activity type icons (11 interaction types mapped to lucide-react icons)
  - ✅ "Time ago" formatted correctly (date-fns formatDistanceToNow with addSuffix)
  - ✅ Click navigates to full activity feed (redirect to /activities/:id/show on click)
  - ✅ Truncates long descriptions (truncateText utility with 60 char limit)
- **Integration Points:**
  - Activities table query with user joins (separate useGetList for sales users)
  - Date formatting (date-fns formatDistanceToNow)
  - Activity type icons (Phone, Mail, Users, FileText, ClipboardCheck, Calendar, Building, MapPin, FileSignature, MessageCircle, Share2)
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/RecentActivities.tsx` with DashboardWidget wrapper
  - Maps 11 interaction types: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social
  - Fetches sales users separately for name display (created_by foreign key)
  - Each activity item clickable with hover states using semantic colors
  - Scrollable container with max-h-[400px] for many activities
  - Uses semantic colors: --primary, --accent, --border, --foreground, --muted-foreground
  - Full keyboard accessibility with tabIndex and onKeyDown handlers

#### P4-E1-S1-T8: Implement "Opportunities by Principal" Widget ✅
- **Hours:** 2.5h (Actual: 1h)
- **Confidence:** 87%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of active opportunities grouped by principal
  - Display as list: Principal name with count
  - Mark with star icon (most important widget per PRD)
  - Click principal navigates to opportunities filtered by that principal
- **Acceptance Criteria:**
  - ✅ Lists principals with active opportunity counts (useGetList with grouping logic)
  - ✅ Star icon visible to indicate importance (filled star icon from lucide-react)
  - ✅ Click principal filters opportunities (useNavigate with encoded filter JSON)
  - ✅ Sorted by count (descending) (useMemo with Array.sort)
  - ✅ Shows "Other" category if applicable (null principal_organization_id handled)
- **Integration Points:**
  - Opportunities table with principal filtering
  - Principal configuration from ConfigurationContext
- **Implementation Notes:**
  - Created `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx` (145 lines)
  - Uses `useGetList` to fetch all active opportunities (status: "active", deleted_at@is: null)
  - Groups opportunities by `principal_organization_id` in `useMemo` hook
  - Uses `principal_organization_name` from opportunities_summary view
  - Null principals grouped as "Other" category
  - Sorted by count descending (most opportunities first)
  - Star icon with `fill-primary` to emphasize importance (⭐ HIGHEST PRIORITY)
  - Displays as scrollable list (max-height: 300px) with hover effects
  - Each principal row shows name + count with clickable button
  - Navigation includes both null check (`@is` operator) and ID filter
  - Total count displayed at bottom with border separator
  - Comprehensive test suite with 6 passing tests (grouping, sorting, null handling, icons)
  - Integrated into Dashboard.tsx in Phase 4 widgets grid

---

## Epic 2: Advanced Search System (32h) - ❌ SKIPPED

**Status:** SKIPPED - Redundant with existing implementation
**Reason:** Comprehensive module-level search already implemented:
- ✅ SearchInput components in all list views (Organizations, Contacts, Opportunities, Products, Notifications)
- ✅ SEARCHABLE_RESOURCES configuration defines searchable fields per module
- ✅ applyFullTextSearch() function using PostgreSQL ILIKE pattern matching (case-insensitive)
- ✅ Real-time filtering with debouncing
- ✅ Works across all major entity types

**What Exists:** `src/atomic-crm/providers/supabase/resources.ts` (SEARCHABLE_RESOURCES) and `unifiedDataProvider.ts` (applyFullTextSearch implementation)

**Original Plan:** Full-text search with operators, history, saved searches, and fuzzy matching across all modules.

**Decision:** The existing ILIKE-based module search meets current needs. Advanced features (operators, saved searches, fuzzy matching) can be added later if user feedback indicates they're valuable. The 32h investment is not justified for pre-launch MVP.

### Story E2-S1: Research and Architecture

#### P4-E2-S1-T1: Research Spike - Supabase Full-Text Search
- **Hours:** 3h
- **Confidence:** 65%
- **Prerequisites:** None
- **Description:**
  - Research Supabase PostgreSQL full-text search capabilities
  - Investigate `to_tsvector` and `to_tsquery` functions
  - Evaluate pg_trgm extension for fuzzy matching
  - Document setup requirements and limitations
  - Create proof-of-concept query examples
- **Acceptance Criteria:**
  - [ ] Document created with search implementation strategy
  - [ ] POC queries tested in Supabase
  - [ ] Performance implications understood
  - [ ] Migration plan for search indexes identified
- **Integration Points:**
  - PostgreSQL full-text search
  - Supabase database configuration

#### P4-E2-S1-T2: Research Spike - Search Operator Parsing
- **Hours:** 2h
- **Confidence:** 60%
- **Prerequisites:** None
- **Description:**
  - Design parser for search operators:
    - Quoted strings: `"exact match"`
    - Boolean operators: `AND`, `OR`
    - Field-specific: `principal:Fishpeople`
    - Exclusion: `-closed`
  - Evaluate parser libraries or custom implementation
  - Create parsing algorithm design document
- **Acceptance Criteria:**
  - [ ] Parser design documented
  - [ ] Test cases for all operator types
  - [ ] Performance considerations noted
  - [ ] Error handling strategy defined
- **Integration Points:**
  - Search query builder
  - Data provider integration

#### P4-E2-S1-T3: Design Search Database Schema
- **Hours:** 2h
- **Confidence:** 70%
- **Prerequisites:** P4-E2-S1-T1
- **Description:**
  - Design `search_history` table (user_id, query, timestamp)
  - Design `saved_searches` table (user_id, name, query, is_shared)
  - Create migration file with indexes
  - Plan RLS policies for search data
- **Acceptance Criteria:**
  - [ ] Migration file created
  - [ ] Tables include proper indexes
  - [ ] RLS policies drafted
  - [ ] Storage strategy for last 10 recent searches per user
- **Integration Points:**
  - Supabase migrations
  - RLS policies
  - User authentication

### Story E2-S2: Core Search Infrastructure

#### P4-E2-S1-T4: Implement Full-Text Search Database Function
- **Hours:** 4h
- **Confidence:** 60%
- **Prerequisites:** P4-E2-S1-T1, P4-E2-S1-T3
- **Description:**
  - Create PostgreSQL function for full-text search across entities
  - Implement tsvector columns or generated columns
  - Add GIN indexes for performance
  - Support weighted field relevance (name > description > notes)
  - Test with large datasets
- **Acceptance Criteria:**
  - [ ] Database function returns relevant results
  - [ ] Search response time < 500ms (p95)
  - [ ] Supports case-insensitive search
  - [ ] Indexes created and verified
  - [ ] Works across Organizations, Contacts, Opportunities, Products
- **Integration Points:**
  - Supabase migration system
  - PostgreSQL full-text search

#### P4-E2-S1-T5: Implement Search Query Parser
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** P4-E2-S1-T2
- **Description:**
  - Implement simple regex-based parser per spike design (docs/spikes/2024-11-03-search-parser-design.md)
  - Enhance existing ILIKE search with field-specific filters
  - Support operators: field:value, -exclusion, wildcards (*)
  - Keep existing text search using ILIKE
  - Deploy as Edge Function for security
- **Acceptance Criteria:**
  - [ ] Parser extracts field filters and text search
  - [ ] Integrates with existing applyFullTextSearch
  - [ ] Test coverage > 85%
  - [ ] Error messages clear for invalid syntax
  - [ ] Performance: parse time < 5ms
- **Integration Points:**
  - Full-text search database function
  - Frontend search input

#### P4-E2-S1-T6: Implement Fuzzy Matching with pg_trgm
- **Hours:** 3h
- **Confidence:** 60%
- **Prerequisites:** P4-E2-S1-T1
- **Description:**
  - Enable pg_trgm extension in Supabase
  - Implement trigram similarity search (1-2 char tolerance)
  - Fallback to fuzzy search when exact search returns few results
  - Tune similarity threshold (0.3-0.5)
- **Acceptance Criteria:**
  - [ ] Fuzzy search handles typos (1-2 characters)
  - [ ] Similarity threshold tuned for accuracy
  - [ ] Performance acceptable (< 500ms)
  - [ ] Falls back gracefully from exact search
- **Integration Points:**
  - PostgreSQL pg_trgm extension
  - Search database function

### Story E2-S3: Global Search UI

#### P4-E2-S1-T7: Create Global Search Bar Component
- **Hours:** 3h
- **Confidence:** 75%
- **Prerequisites:** None
- **Description:**
  - Add search bar to top navigation (always visible)
  - Implement debounced search (300ms)
  - Minimum 2 characters before activating
  - Show loading indicator while searching
  - Keyboard shortcut: Ctrl/Cmd + K or Ctrl/Cmd + /
- **Acceptance Criteria:**
  - [ ] Search bar visible in top navigation
  - [ ] Debouncing works (300ms delay)
  - [ ] Minimum 2 characters enforced
  - [ ] Loading indicator displays
  - [ ] Keyboard shortcuts work
- **Integration Points:**
  - Top navigation component
  - Keyboard shortcut system

#### P4-E2-S1-T8: Implement Unified Search Results Page
- **Hours:** 4h
- **Confidence:** 70%
- **Prerequisites:** P4-E2-S1-T4, P4-E2-S1-T7
- **Description:**
  - Create results page showing all matching entities
  - Group results by entity type (Organizations, Contacts, Opportunities, Products)
  - Show preview snippets with matched text highlighted
  - Display result count: "23 results for 'Ballyhoo'"
  - Add quick filters to narrow by entity type
- **Acceptance Criteria:**
  - [ ] Results grouped by entity type
  - [ ] Matched text highlighted in snippets
  - [ ] Result count accurate
  - [ ] Quick filters functional
  - [ ] Click result navigates to entity detail
- **Integration Points:**
  - React Router
  - Search data provider
  - Entity detail pages

#### P4-E2-S1-T9: Implement Search Suggestions/Autocomplete
- **Hours:** 3h
- **Confidence:** 65%
- **Prerequisites:** P4-E2-S1-T4
- **Description:**
  - Show dropdown with suggestions as user types
  - Base suggestions on:
    - Indexed entity names
    - Recent search history
    - Popular searches
  - Limit to 8 suggestions
  - Keyboard navigation (arrow keys, Enter)
- **Acceptance Criteria:**
  - [ ] Suggestions appear as user types
  - [ ] Based on index, history, and popularity
  - [ ] Limited to 8 items
  - [ ] Keyboard navigation works
  - [ ] Click suggestion populates search
- **Integration Points:**
  - Global search bar
  - Search history

### Story E2-S4: Search History and Saved Searches

#### P4-E2-S1-T10: Implement Search History Storage
- **Hours:** 2h
- **Confidence:** 70%
- **Prerequisites:** P4-E2-S1-T3
- **Description:**
  - Store last 10 searches per user in database
  - Auto-delete older searches (FIFO)
  - Track: query text, timestamp, results count
  - Implement cleanup function for old history
- **Acceptance Criteria:**
  - [ ] Last 10 searches stored per user
  - [ ] Older searches auto-deleted
  - [ ] Query metadata captured
  - [ ] Privacy: user can only see own history
- **Integration Points:**
  - Search history table
  - RLS policies

#### P4-E2-S1-T11: Implement Search History UI
- **Hours:** 2h
- **Confidence:** 75%
- **Prerequisites:** P4-E2-S1-T10, P4-E2-S1-T7
- **Description:**
  - Show recent searches dropdown when clicking search box
  - Display with timestamp: "Ballyhoo (2 hours ago)"
  - Click history item re-executes search
  - Add "Clear history" button
- **Acceptance Criteria:**
  - [ ] Recent searches dropdown appears on focus
  - [ ] Searches listed with timestamps
  - [ ] Click re-executes search
  - [ ] Clear history button works
- **Integration Points:**
  - Global search bar component
  - Search history API

#### P4-E2-S1-T12: Implement Saved Searches Feature
- **Hours:** 3h
- **Confidence:** 55%
- **Prerequisites:** P4-E2-S1-T3
- **Description:**
  - Add "Save search" button to search results page
  - Prompt for name when saving
  - Store in saved_searches table
  - Support shared searches (admin-created)
  - Display saved searches in dropdown
- **Acceptance Criteria:**
  - [ ] Save button appears after search
  - [ ] User prompted for search name
  - [ ] Saved searches accessible from dropdown
  - [ ] Shared searches visible to all users
  - [ ] Only user can delete their own saved searches
- **Integration Points:**
  - Search results page
  - Saved searches table
  - RLS policies

### Story E2-S5: Module-Level Search

#### P4-E2-S1-T13: Implement Module-Level Search
- **Hours:** 2h
- **Confidence:** 80%
- **Prerequisites:** P4-E2-S1-T4, P4-E2-S1-T5
- **Description:**
  - Add search bar to each list view (Organizations, Contacts, Opportunities, Products)
  - Search scoped to current module only
  - Support same operators as global search
  - Results update list view (no separate results page)
- **Acceptance Criteria:**
  - [ ] Search bar in all list views
  - [ ] Scoped to current module
  - [ ] Operators work (quotes, AND/OR, field-specific)
  - [ ] Updates list view in real-time
- **Integration Points:**
  - List view components
  - Data provider search integration

---

## Epic 3: In-App Notifications (12h) - ✅ COMPLETE

**Status:** ✅ Complete (All 5 tasks finished)
**Implementation Files:**
- `supabase/migrations/20251105001240_add_notifications_table.sql` - Database table with RLS policies
- `supabase/migrations/20251105005940_add_overdue_notification_tracking.sql` - Task tracking column
- `supabase/migrations/20251105010132_setup_overdue_task_cron.sql` - PostgreSQL function for cron
- `supabase/functions/check-overdue-tasks/index.ts` - Edge Function for HTTP webhook
- `src/components/NotificationBell.tsx` - Bell icon with real-time badge
- `src/components/NotificationDropdown.tsx` - Dropdown with last 20 notifications
- `src/atomic-crm/notifications/NotificationsList.tsx` - Full page with filtering
- `src/atomic-crm/providers/supabase/filterRegistry.ts` - Added notifications resource

**Features Delivered:**
- ✅ Notifications database table with auto-delete trigger (30 days)
- ✅ Daily overdue task notifications (PostgreSQL function + Edge Function)
- ✅ Bell icon in header with unread count badge
- ✅ Real-time updates via Supabase subscriptions
- ✅ Notification dropdown showing last 20 items
- ✅ Full notifications page with search and filtering
- ✅ Mark as read functionality (individual and bulk)
- ✅ Entity links from notifications to related records

Bell icon notification system for overdue tasks with dropdown panel.

### Story E3-S1: Notification Infrastructure

#### P4-E3-S1-T1: Create Notifications Database Table and Migration ✅
- **Hours:** 2h (Actual: 1h)
- **Confidence:** 90%
- **Prerequisites:** None
- **Description:**
  - Create `notifications` table (id, user_id, type, message, entity_type, entity_id, read, created_at)
  - Add indexes for user_id and created_at
  - Implement RLS policies (users see only their notifications)
  - Add auto-delete trigger for notifications > 30 days
- **Acceptance Criteria:**
  - ✅ Migration file created: `20251105001240_add_notifications_table.sql`
  - ✅ Table includes all required fields
  - ✅ Indexes created (idx_notifications_user_read, idx_notifications_created_at)
  - ✅ RLS policies enforce user isolation (SELECT/UPDATE own, INSERT/DELETE service_role)
  - ✅ Auto-delete trigger functional (cleanup_old_notifications function)
- **Integration Points:**
  - Supabase migrations
  - RLS policies

#### P4-E3-S1-T2: Implement Overdue Task Notification Job ✅
- **Hours:** 3h (Actual: 2h)
- **Confidence:** 82%
- **Prerequisites:** P4-E3-S1-T1
- **Description:**
  - Create Supabase Edge Function or cron job
  - Run daily at 9 AM server time
  - Query tasks where next_action_date < today AND notification not sent
  - Create notification record for each overdue task
  - Mark tasks as notified to prevent duplicates
- **Acceptance Criteria:**
  - ✅ Job runs daily at 9 AM (pg_cron setup instructions in migration)
  - ✅ Creates notifications for overdue tasks (check_overdue_tasks function)
  - ✅ No duplicate notifications (overdue_notified_at timestamp prevents duplicates)
  - ✅ Logs execution success/failure (RAISE NOTICE + JSON return)
- **Integration Points:**
  - PostgreSQL function: `check_overdue_tasks()` for pg_cron
  - Edge Function: `supabase/functions/check-overdue-tasks/index.ts` for HTTP webhook
  - Tasks table (overdue_notified_at column)
  - Notifications table
- **Implementation Notes:**
  - Created BOTH PostgreSQL function and Edge Function for flexibility
  - PostgreSQL function: Native database execution, works with pg_cron
  - Edge Function: Stateless HTTP, can be triggered via webhook or manually
  - Migration adds overdue_notified_at to tasks table with index

### Story E3-S2: Notification UI

#### P4-E3-S1-T3: Create Bell Icon Component with Badge ✅
- **Hours:** 2h (Actual: 1h)
- **Confidence:** 88%
- **Prerequisites:** None
- **Description:**
  - Add bell icon to top navigation
  - Display unread count as red badge
  - Badge hidden when count = 0
  - Real-time updates using Supabase subscriptions
  - Accessible: aria-label "Notifications (3 unread)"
- **Acceptance Criteria:**
  - ✅ Bell icon visible in top navigation (src/components/NotificationBell.tsx)
  - ✅ Red badge shows unread count (bg-destructive badge with count)
  - ✅ Badge hidden when no unread (conditional rendering when unreadCount > 0)
  - ✅ Updates in real-time (Supabase postgres_changes subscription)
  - ✅ Accessible to screen readers (aria-label with count)
- **Integration Points:**
  - Top navigation component (src/atomic-crm/layout/Header.tsx)
  - Supabase real-time subscriptions (channel with user_id filter)

#### P4-E3-S1-T4: Implement Notification Dropdown Panel ✅
- **Hours:** 3h (Actual: 2h)
- **Confidence:** 85%
- **Prerequisites:** P4-E3-S1-T3
- **Description:**
  - Create dropdown panel (400px wide)
  - Show last 20 notifications
  - Display: Icon, message, related entity link, time ago
  - Mark as read button (eye icon) per notification
  - "Mark all as read" button at bottom
  - "View all notifications" link to full page
- **Acceptance Criteria:**
  - ✅ Dropdown opens on bell icon click (DropdownMenu component)
  - ✅ Shows last 20 notifications (query with limit(20) and DESC sort)
  - ✅ Time ago formatted correctly (date-fns formatDistanceToNow)
  - ✅ Mark as read updates immediately (optimistic UI update with local state)
  - ✅ Mark all as read works (updates all notifications, refetches count)
  - ✅ Links navigate correctly (useNavigate to entity detail pages)
- **Integration Points:**
  - Bell icon component (NotificationDropdown wraps button)
  - Notifications Supabase query (direct supabase.from())
  - Date formatting (date-fns formatDistanceToNow with addSuffix)

#### P4-E3-S1-T5: Create Full Notifications Page ✅
- **Hours:** 2h (Actual: 1.5h)
- **Confidence:** 90%
- **Prerequisites:** P4-E3-S1-T1
- **Description:**
  - Create `/notifications` route
  - Display all notifications (paginated)
  - Filter by read/unread status
  - Search within notifications
  - Bulk mark as read
- **Acceptance Criteria:**
  - ✅ Full page accessible from dropdown (registered as Resource in CRM.tsx)
  - ✅ Pagination works (20 per page via React Admin List perPage prop)
  - ✅ Filter by read/unread (ToggleFilterButton for read: true/false)
  - ✅ Search functional (SearchInput with source="q" in filterRegistry)
  - ✅ Bulk actions work (NotificationsBulkActions with Promise.all updates)
- **Integration Points:**
  - React Router (React Admin <Resource> registration)
  - Notifications data provider (useGetList, useUpdate hooks)
  - List view patterns (List, Card, FilterCategory components)
  - filterRegistry.ts (added notifications resource with searchable fields)

---

## Epic 4: Activity Tracking Enhancements (10h) - ⚠️ PARTIALLY COMPLETE

**Status:** ⚠️ Partially Complete (T2 done, T1 partial, T3-T4 remaining)
**Hours Completed:** ~4h (out of 10h estimated)
**Hours Remaining:** ~6h

**Implementation Files:**
- ✅ `src/atomic-crm/opportunities/ActivityTimelineFilters.tsx` - Full filtering component (T2 complete)
- ⚠️ `src/atomic-crm/activity/ActivityLog*.tsx` - Activity feed components (T1 partially complete)
- ❌ Activity search - Not implemented (T3)
- ❌ Activity export - Not implemented (T4)

**Completed Features:**
- ✅ **T2: Activity Feed Filtering (Complete)**
  - Multi-select activity type filtering with checkboxes
  - Date range filtering (From/To date inputs)
  - User filtering (Created By multi-select)
  - "Stage changes only" toggle
  - Active filter count badge
  - Filter chips with individual remove buttons
  - "Clear all filters" button

**Partially Complete:**
- ⚠️ **T1: Enhanced Activity Feed Component (Partial)**
  - ✅ Avatar display (ActivityLogContactCreated uses Avatar component)
  - ✅ Timestamp (RelativeDate component showing time ago)
  - ✅ Related entity links (Link to entity detail pages)
  - ✅ Text truncation (line-clamp-3 for long descriptions)
  - ❌ Missing: Activity type icons (only has avatars, no Phone/Email/Meeting icons)
  - ❌ Missing: Edit/delete actions for user-created activities
  - ❌ Missing: System activity badge to distinguish automated vs. manual activities

**Not Started:**
- ❌ **T3: Add Activity Feed Search (2h remaining)**
  - Search box above activity feed
  - Search across description, participant names, related entity names
  - Real-time filtering with debouncing

- ❌ **T4: Implement Activity Feed Export (2h remaining)**
  - "Export Activity Feed" CSV button
  - Columns: Date, Time, User, Type, Description, Related Entity, Outcome
  - Respects current filters

Enhance activity feed display and filtering across entity detail pages.

### Story E4-S1: Activity Feed Improvements

#### P4-E4-S1-T1: Enhance Activity Feed Component
- **Hours:** 3h
- **Confidence:** 88%
- **Prerequisites:** None (enhancing existing component)
- **Description:**
  - Improve activity card layout with avatar, icon, and timestamp
  - Add expand/collapse for long descriptions
  - Show related entity and participant links
  - Implement edit/delete actions for user-created activities
  - Add system activity badge for automated activities
- **Acceptance Criteria:**
  - [ ] Activity cards match PRD design
  - [ ] Long descriptions truncate with "Show more"
  - [ ] Related entity links navigate correctly
  - [ ] Edit/delete only visible for user's activities
  - [ ] System activities non-editable
- **Integration Points:**
  - Existing activity feed component
  - Activity data provider
  - Design system

#### P4-E4-S1-T2: Implement Activity Feed Filtering
- **Hours:** 3h
- **Confidence:** 85%
- **Prerequisites:** P4-E4-S1-T1
- **Description:**
  - Add filter dropdown above feed
  - Filter by activity type (multi-select with icons)
  - Filter by user (All, Me, Specific users)
  - Filter by date range (Today, This Week, This Month, Custom)
  - Display applied filters as chips
  - Add "Clear filters" button
- **Acceptance Criteria:**
  - [ ] Filter dropdown functional
  - [ ] Multi-select activity types work
  - [ ] User filter works
  - [ ] Date range presets functional
  - [ ] Custom date range picker works
  - [ ] Applied filters shown as chips
- **Integration Points:**
  - Activity feed component
  - React Admin filter components

#### P4-E4-S1-T3: Add Activity Feed Search
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** P4-E4-S1-T1
- **Description:**
  - Add search box above activity feed
  - Search: Description, Participant names, Related entity names
  - Real-time filtering (debounced)
  - Case-insensitive
- **Acceptance Criteria:**
  - [ ] Search box visible above feed
  - [ ] Searches description, participants, entities
  - [ ] Real-time filtering works
  - [ ] Case-insensitive
- **Integration Points:**
  - Activity feed component
  - Activity data provider

#### P4-E4-S1-T4: Implement Activity Feed Export
- **Hours:** 2h
- **Confidence:** 88%
- **Prerequisites:** None
- **Description:**
  - Add "Export Activity Feed" button
  - Export to CSV format
  - Columns: Date, Time, User, Type, Description, Related Entity, Outcome
  - Respects current filters
- **Acceptance Criteria:**
  - [ ] Export button functional
  - [ ] CSV includes all specified columns
  - [ ] Respects active filters
  - [ ] File naming: `activities_{date}_{time}.csv`
- **Integration Points:**
  - CSV export utility
  - Activity data provider

---

## Epic 5: iPad Touch Optimizations (6h) - ✅ COMPLETE

**Status:** ✅ Complete (All touch targets meet 48px minimum)
**Actual Hours:** ~3h (design system made this easier than estimated)

**Git Commits:**
- `b1850dc` - Update button touch targets to meet 48px minimum (P4-E5-S1-T2)
- `f4711cc` - Update form controls for 48px minimum touch targets
- `4f92948` - Update tables/lists to meet 48px minimum
- `23ebf68` - Complete button touch target compliance (CRITICAL)

**Features Delivered:**
- ✅ All buttons meet 48x48px minimum (min-h-[48px] px-6)
- ✅ Icon buttons have 48x48px tap area
- ✅ Form inputs 48px minimum height
- ✅ Checkboxes/radios have 48px tap area (20x20px with padding)
- ✅ Dropdown items have increased padding (py-3)
- ✅ Table rows meet 56px minimum
- ✅ List items meet 52px minimum
- ✅ 8px minimum spacing between clickable elements
- ✅ Tab bar items 48px height
- ✅ FAB (Floating Action Button) 56x56px

Ensure all interactive elements meet 48x48px minimum touch target requirement.

### Story E5-S1: Touch Target Audit and Implementation

#### P4-E5-S1-T1: Audit Existing Components for Touch Targets
- **Hours:** 2h
- **Confidence:** 95%
- **Prerequisites:** None
- **Description:**
  - Audit all interactive elements across the app
  - Document components not meeting 48x48px minimum
  - Identify: Buttons, icon buttons, checkboxes, radio buttons, dropdowns, table rows, list items
  - Create checklist of components needing updates
- **Acceptance Criteria:**
  - [ ] Complete audit document created
  - [ ] All interactive elements cataloged
  - [ ] Priority list for updates
  - [ ] Test plan for verification
- **Integration Points:**
  - All UI components
  - Design system

#### P4-E5-S1-T2: Update Button Components
- **Hours:** 1.5h
- **Confidence:** 92%
- **Prerequisites:** P4-E5-S1-T1
- **Description:**
  - Update base button components: `min-h-[48px] px-6`
  - Update icon buttons: 48x48px tap area
  - Update FAB (Floating Action Button): 56x56px
  - Test on iPad device or simulator
- **Acceptance Criteria:**
  - [ ] All buttons meet 48x48px minimum
  - [ ] Icon buttons have proper tap area
  - [ ] FAB sized correctly (56x56px)
  - [ ] Visual appearance maintained
  - [ ] Tested on iPad
- **Integration Points:**
  - Button component library
  - Design system tokens

#### P4-E5-S1-T3: Update Form Controls
- **Hours:** 1.5h
- **Confidence:** 90%
- **Prerequisites:** P4-E5-S1-T1
- **Description:**
  - Update form inputs: 48px minimum height
  - Update checkboxes/radios: 20x20px with 48px tap area
  - Update dropdown items: `py-3` for increased padding
  - Update select controls minimum height
- **Acceptance Criteria:**
  - [ ] All form inputs 48px min height
  - [ ] Checkboxes/radios have 48px tap area
  - [ ] Dropdown items comfortably spaced
  - [ ] Forms remain visually balanced
  - [ ] Tested on iPad
- **Integration Points:**
  - Form component library
  - React Admin form components

#### P4-E5-S1-T4: Update Table and List Views
- **Hours:** 1h
- **Confidence:** 92%
- **Prerequisites:** P4-E5-S1-T1
- **Description:**
  - Update table rows: `min-h-[56px]`
  - Update list items: 52px minimum height
  - Ensure 8px minimum spacing between clickable elements
  - Update tab bar items: 48px minimum height
- **Acceptance Criteria:**
  - [ ] Table rows meet 56px minimum
  - [ ] List items meet 52px minimum
  - [ ] Clickable elements properly spaced (8px min)
  - [ ] Tab bar items 48px height
  - [ ] Tested on iPad
- **Integration Points:**
  - Table components
  - List view components
  - Navigation tabs

---

## Epic 6: Keyboard Shortcuts (4h) - ✅ COMPLETE

**Status:** ✅ Complete (Global handler + reference modal implemented)
**Actual Hours:** ~2h (simpler implementation than estimated)

**Implementation Files:**
- `src/providers/KeyboardShortcutsProvider.tsx` - Global keyboard event listener (T1)
- `src/components/KeyboardShortcutsModal.tsx` - Reference modal (T2)

**Git Commits:**
- `cbb1532` - Implement global keyboard shortcut handler
- `fd4ee98` - Add keyboard shortcuts reference modal
- `68aec6a` - Remove unused imports from keyboard shortcut components
- `d45c7a7` - Add keyboard support and ARIA attributes to interactive elements

**Features Delivered:**
- ✅ Global keyboard event listener with platform detection (Ctrl/Cmd)
- ✅ Keyboard shortcuts implemented:
  - Ctrl/Cmd + S: Save form
  - Ctrl/Cmd + N: New record
  - Ctrl/Cmd + K or /: Focus search
  - Escape: Cancel/close modal
  - Enter: Submit form (not in textarea)
  - Tab/Shift+Tab: Field navigation
  - Arrow keys: List navigation
  - Space: Select for bulk actions
  - Delete: Delete selected (with confirmation)
- ✅ Reference modal showing all shortcuts
- ✅ Shortcuts grouped by context (Global, Forms, Lists)
- ✅ Platform-specific key display (Ctrl vs Cmd)
- ✅ "Keyboard shortcuts" link in footer
- ✅ Visual focus indicators on all interactive elements
- ✅ Focus traps working in modals

Basic keyboard shortcuts for global navigation and common actions.

### Story E6-S1: Keyboard Shortcut System

#### P4-E6-S1-T1: Implement Keyboard Shortcut Handler
- **Hours:** 2h
- **Confidence:** 85%
- **Prerequisites:** None
- **Description:**
  - Create global keyboard event listener
  - Detect Ctrl/Cmd modifiers (cross-platform)
  - Prevent conflicts with browser shortcuts
  - Support shortcuts:
    - Ctrl/Cmd + S: Save form
    - Ctrl/Cmd + N: New record
    - Ctrl/Cmd + K or /: Focus search
    - Escape: Cancel/close modal
    - Enter: Submit form (not in textarea)
    - Tab/Shift+Tab: Field navigation
    - Arrow keys: List navigation
    - Space: Select for bulk actions
    - Delete: Delete selected (with confirmation)
- **Acceptance Criteria:**
  - [ ] All specified shortcuts functional
  - [ ] Cross-platform (Windows/Mac)
  - [ ] No conflicts with browser shortcuts
  - [ ] Context-aware (form vs list view)
  - [ ] Accessible (doesn't break screen readers)
- **Integration Points:**
  - Global event handler
  - Form components
  - List views
  - Navigation

#### P4-E6-S1-T2: Create Keyboard Shortcuts Reference Modal
- **Hours:** 1.5h
- **Confidence:** 90%
- **Prerequisites:** P4-E6-S1-T1
- **Description:**
  - Create modal showing all available shortcuts
  - Group by context: Global, Forms, Lists
  - Add "Keyboard shortcuts" link in footer
  - Display shortcut keys with proper formatting
  - Show platform-specific modifiers (Ctrl vs Cmd)
- **Acceptance Criteria:**
  - [ ] Modal accessible from footer link
  - [ ] All shortcuts documented
  - [ ] Grouped by context
  - [ ] Platform-specific keys shown
  - [ ] Design matches app style
- **Integration Points:**
  - Modal component
  - Footer component
  - Design system

#### P4-E6-S1-T3: Add Visual Focus Indicators
- **Hours:** 0.5h
- **Confidence:** 92%
- **Prerequisites:** None
- **Description:**
  - Ensure all interactive elements have visible focus state
  - Style: `focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
  - Test keyboard navigation flow
  - Verify focus trap in modals
- **Acceptance Criteria:**
  - [ ] All interactive elements have focus indicator
  - [ ] Focus indicator uses brand colors
  - [ ] Keyboard navigation logical
  - [ ] Focus traps work in modals
  - [ ] Tested with Tab/Shift+Tab
- **Integration Points:**
  - All interactive components
  - Design system

---

## Cross-Epic Tasks

### Integration and Testing

#### P4-INT-T1: Integration Testing for Dashboard
- **Hours:** 2h
- **Confidence:** 85%
- **Prerequisites:** All E1 tasks complete
- **Description:**
  - Write integration tests for all dashboard widgets
  - Test auto-refresh and manual refresh
  - Test widget click navigation
  - Test error states and retry
- **Acceptance Criteria:**
  - [ ] All widgets covered by tests
  - [ ] Refresh mechanisms tested
  - [ ] Navigation tested
  - [ ] Error handling tested
- **Integration Points:**
  - Vitest + React Testing Library
  - Dashboard components

#### P4-INT-T2: Integration Testing for Search System
- **Hours:** 3h
- **Confidence:** 70%
- **Prerequisites:** All E2 tasks complete
- **Description:**
  - Write integration tests for search functionality
  - Test all operators (quotes, AND/OR, field-specific, exclusion)
  - Test search history and saved searches
  - Test performance (response time < 500ms)
- **Acceptance Criteria:**
  - [ ] All search operators tested
  - [ ] History and saved searches tested
  - [ ] Performance validated
  - [ ] Edge cases covered
- **Integration Points:**
  - Vitest + React Testing Library
  - Search components and APIs

#### P4-INT-T3: End-to-End Testing for Phase 4 Features
- **Hours:** 2h
- **Confidence:** 80%
- **Prerequisites:** All phase tasks complete
- **Description:**
  - Write E2E tests using Playwright
  - Test user workflows:
    - View dashboard and navigate via widgets
    - Perform searches and save searches
    - View notifications and mark as read
    - Use keyboard shortcuts
  - Test on iPad viewport
- **Acceptance Criteria:**
  - [ ] E2E tests for all major workflows
  - [ ] Tests pass on desktop and iPad viewports
  - [ ] Keyboard shortcuts tested
  - [ ] Performance validated
- **Integration Points:**
  - Playwright E2E framework
  - All Phase 4 features

#### P4-INT-T4: iPad Testing and Refinement
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** All E5 tasks complete
- **Description:**
  - Test entire app on physical iPad or simulator
  - Verify touch targets meet 48x48px minimum
  - Test responsive layouts (portrait/landscape)
  - Document and fix any issues
- **Acceptance Criteria:**
  - [ ] All touch targets verified on device
  - [ ] Layouts work in portrait/landscape
  - [ ] No UI issues on iPad
  - [ ] Issues documented and resolved
- **Integration Points:**
  - iPad testing environment
  - All UI components

#### P4-INT-T5: Performance Optimization
- **Hours:** 2h
- **Confidence:** 82%
- **Prerequisites:** All phase tasks complete
- **Description:**
  - Profile dashboard load time (target: < 2 seconds)
  - Profile search response time (target: < 500ms)
  - Optimize slow queries or components
  - Verify auto-refresh doesn't cause performance issues
- **Acceptance Criteria:**
  - [ ] Dashboard loads in < 2 seconds
  - [ ] Search responds in < 500ms
  - [ ] No performance regressions
  - [ ] Lighthouse Performance Score > 85
- **Integration Points:**
  - Browser DevTools
  - Lighthouse
  - Database query optimization

#### P4-INT-T6: Accessibility Audit
- **Hours:** 2h
- **Confidence:** 88%
- **Prerequisites:** All phase tasks complete
- **Description:**
  - Run accessibility audit using axe DevTools
  - Test keyboard navigation across all new features
  - Test screen reader compatibility (NVDA/VoiceOver)
  - Fix any WCAG 2.1 AA violations
- **Acceptance Criteria:**
  - [ ] No critical accessibility issues
  - [ ] Keyboard navigation functional
  - [ ] Screen reader compatibility verified
  - [ ] WCAG 2.1 AA compliant
- **Integration Points:**
  - axe DevTools
  - Screen reader testing
  - All Phase 4 components

---

## Dependencies and Prerequisites

### External Dependencies
- **Database Extensions:** pg_trgm for fuzzy matching (E2)
- **Libraries:**
  - Recharts or Chart.js for dashboard charts (E1)
  - date-fns for date formatting (E1, E3, E4)
  - Search query parser (custom or library) (E2)

### Phase Prerequisites
- **Phase 1-3 Completion:** Core modules (Organizations, Contacts, Opportunities) must be functional
- **Tasks Module:** Dashboard references tasks (must exist or be mocked)
- **Activities System:** Activity tracking must be implemented
- **Authentication:** User context for notifications and search history

---

## Risk Mitigation

### High-Risk Areas

#### Advanced Search System (E2)
- **Risk:** Full-text search with operators is complex and may not meet performance targets
- **Confidence:** 60%
- **Mitigation:**
  - Complete research spikes early (P4-E2-S1-T1, T2)
  - Build proof-of-concept before full implementation
  - Consider simplified operator set if parsing becomes too complex
  - Budget extra time for performance tuning
  - Fallback: Basic search without operators if timeline at risk

#### Search History and Saved Searches (E2-S4)
- **Risk:** Storage strategy and privacy considerations may require additional iteration
- **Confidence:** 55-70%
- **Mitigation:**
  - Design database schema early with review
  - Start with simple implementation (local storage) before moving to database
  - Clear requirements for shared vs personal saved searches

#### Fuzzy Matching (P4-E2-S1-T6)
- **Risk:** Tuning similarity threshold may require trial and error
- **Confidence:** 60%
- **Mitigation:**
  - Test with real data early
  - Make threshold configurable
  - Gather user feedback during testing

### Medium-Risk Areas

#### Pipeline Chart Widget (P4-E1-S1-T6)
- **Risk:** Chart library integration and styling may take longer than estimated
- **Confidence:** 85%
- **Mitigation:**
  - Evaluate Recharts vs Chart.js early
  - Start with basic bar chart, enhance later
  - Budget extra time for responsive design

#### Notification Daily Job (P4-E3-S1-T2)
- **Risk:** Cron job setup in Supabase may have limitations
- **Confidence:** 82%
- **Mitigation:**
  - Research Supabase Edge Functions cron capabilities early
  - Consider pg_cron as alternative
  - Manual trigger option for testing

---

## Success Metrics

### Performance Targets
- **Dashboard Load Time:** < 2 seconds (p95)
- **Search Response Time:** < 500ms (p95)
- **Auto-Refresh Impact:** No noticeable UI lag
- **Widget Independence:** Individual widget failures don't crash dashboard

### Functional Targets
- **Search Accuracy:** > 90% relevant results for test queries
- **Touch Target Compliance:** 100% of interactive elements meet 48x48px minimum
- **Keyboard Shortcuts:** All specified shortcuts functional
- **Notification Delivery:** 100% of overdue tasks trigger notification

### Quality Targets
- **Test Coverage:** > 80% for Phase 4 features
- **Accessibility:** Zero critical WCAG 2.1 AA violations
- **iPad Compatibility:** All features functional on iPad portrait/landscape
- **Browser Support:** Chrome, Safari, Firefox, Edge

---

## Epic 7: Testing & Performance Validation (12h)

### E7-S1: Integration Tests

**P4-E7-S1-T1: Integration test: Dashboard widget loading**
- **Description:** Test dashboard with multiple widgets and data sources
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P4-E1-S3-T3
- **Acceptance Criteria:**
  - Test: All widgets load independently
  - Test: Failed widget doesn't affect others
  - Test: Loading states display correctly
  - Test: Data refreshes on interval
  - Test: Memory usage stays stable over time
- **Files:**
  - `tests/integration/dashboard-widgets.spec.ts`
  - `src/atomic-crm/dashboard/widgets/*.test.tsx`

**P4-E7-S1-T2: E2E test: Advanced search workflow**
- **Description:** Complete search flow with operators and filters
- **Confidence:** 75%
- **Estimate:** 3 hours
- **Prerequisites:** P4-E2-S5-T3
- **Acceptance Criteria:**
  - Test: Search with quotes for exact match
  - Test: Field-specific filters (stage:won)
  - Test: Exclusion operators (-term)
  - Test: AND/OR logic combinations
  - Test: Saved search creation and recall
  - Test: Search result actions (bulk select)
- **Files:**
  - `tests/e2e/search/advanced-search.spec.ts`
  - `tests/e2e/search/saved-searches.spec.ts`

**P4-E7-S1-T3: Integration test: Real-time notifications**
- **Description:** Test notification system with Supabase subscriptions
- **Confidence:** 80%
- **Estimate:** 2 hours
- **Prerequisites:** P4-E3-S2-T2
- **Acceptance Criteria:**
  - Test: Notifications appear in real-time
  - Test: Dismissed notifications stay dismissed
  - Test: Connection recovery after network loss
  - Test: Memory cleanup on component unmount
  - Test: No duplicate notifications
- **Files:**
  - `tests/integration/notifications-realtime.spec.ts`

### E7-S2: Performance Validation

**P4-E7-S2-T1: Performance test: Search with 100K records**
- **Description:** Validate search performance at scale
- **Confidence:** 70%
- **Estimate:** 2 hours
- **Prerequisites:** P4-E2-S2-T3
- **Acceptance Criteria:**
  - Test: Simple search < 20ms (with pg_trgm)
  - Test: Complex queries < 100ms
  - Test: Autocomplete < 10ms
  - Test: Result highlighting < 50ms
  - Test: No query plan regressions
  - Test: Memory usage < 50MB
- **Files:**
  - `tests/performance/search-at-scale.spec.ts`
  - `tests/fixtures/large-dataset-generator.ts`

**P4-E7-S2-T2: Performance test: Dashboard with concurrent widgets**
- **Description:** Test dashboard performance with all widgets active
- **Confidence:** 85%
- **Estimate:** 1.5 hours
- **Prerequisites:** P4-E1-S3-T3
- **Acceptance Criteria:**
  - Test: Initial load < 3 seconds (all widgets)
  - Test: Widget refresh < 500ms each
  - Test: No blocking between widgets
  - Test: Smooth scrolling (60fps)
  - Test: Memory stable after 1 hour
- **Files:**
  - `tests/performance/dashboard-concurrent.spec.ts`

### E7-S3: Accessibility & Mobile Testing

**P4-E7-S3-T1: Accessibility test: Keyboard navigation**
- **Description:** Validate keyboard shortcuts and navigation
- **Confidence:** 90%
- **Estimate:** 1.5 hours
- **Prerequisites:** P4-E6-S2-T3
- **Acceptance Criteria:**
  - Test: All shortcuts work as documented
  - Test: Focus indicators visible
  - Test: Tab order logical
  - Test: Screen reader announces correctly
  - Test: No keyboard traps
- **Files:**
  - `tests/a11y/keyboard-navigation.spec.ts`

**P4-E7-S3-T2: Mobile test: iPad touch interactions**
- **Description:** Test touch-optimized features on iPad
- **Confidence:** 85%
- **Estimate:** 2 hours
- **Prerequisites:** P4-E5-S2-T2
- **Acceptance Criteria:**
  - Test: Touch targets >= 44x44px
  - Test: Long-press context menus work
  - Test: Swipe gestures recognized
  - Test: Pinch-zoom on dashboard charts
  - Test: No accidental triggers
  - Test: Momentum scrolling smooth
- **Files:**
  - `tests/mobile/ipad-interactions.spec.ts`

---

## Post-Phase 4 Considerations

### Future Enhancements (Out of Scope)
- Command palette (advanced keyboard shortcut UI)
- Customizable dashboard layouts
- Email notifications
- Push notifications (desktop/mobile)
- Advanced search filters (date ranges, numeric comparisons)
- Search analytics dashboard
- Notification preferences (granular control)

### Technical Debt
- Search performance optimization (ongoing)
- Search result ranking algorithm refinement
- Fuzzy matching threshold tuning based on usage
- Dashboard widget caching strategy

---

## Timeline Summary

| Week | Focus Areas | Hours |
|------|-------------|-------|
| Week 7 | Dashboard (E1) + Search Infrastructure (E2-S1, E2-S2) | 40h |
| Week 8 | Search UI (E2-S3, E2-S4, E2-S5) + Notifications (E3) + Activity (E4) + iPad (E5) + Keyboard (E6) + Integration | 40h |

**Total: 80 hours**

---

## Notes

1. **Search System Priority:** Advanced search is the most complex epic with lower confidence (60%). Complete research spikes and proof-of-concept in Week 7 to de-risk Week 8.

2. **Dashboard Independence:** Each widget should load independently with its own error handling to prevent cascade failures.

3. **iPad Testing:** Allocate real device testing time throughout the phase, not just at the end.

4. **Performance Monitoring:** Continuously monitor search and dashboard performance during implementation.

5. **Accessibility First:** Implement keyboard shortcuts and focus indicators as features are built, not as an afterthought.

6. **Search Operators:** If full operator parsing proves too complex, prioritize: exact match (quotes) > field-specific > exclusion > AND/OR.

7. **Real-Time Updates:** Notifications use Supabase real-time subscriptions; ensure connection handling is robust.

8. **Touch Targets:** Use design system tokens for consistent touch target sizing across all components.
