# Phase 4: User Experience Enhancement - Task Breakdown

**Timeline:** Weeks 7-8 (80 hours)
**Focus:** Dashboard, Advanced Search, Notifications, Activity Tracking, iPad Optimizations, Keyboard Shortcuts

---

## Epic Overview

| Epic ID | Epic Name | Total Hours | Confidence | Status |
|---------|-----------|-------------|------------|--------|
| E1 | Dashboard Implementation | 16h | 90% | Not Started |
| E2 | Advanced Search System | 32h | 60% | Not Started |
| E3 | In-App Notifications | 12h | 85% | Not Started |
| E4 | Activity Tracking Enhancements | 10h | 88% | Not Started |
| E5 | iPad Touch Optimizations | 6h | 92% | Not Started |
| E6 | Keyboard Shortcuts | 4h | 85% | Not Started |

**Total Estimated Hours:** 80h

---

## Epic 1: Dashboard Implementation (16h)

Fixed layout dashboard with 6 widgets, auto-refresh, and manual refresh capability.

### Story E1-S1: Dashboard Infrastructure

#### P4-E1-S1-T1: Create Dashboard Route and Base Layout
- **Hours:** 2h
- **Confidence:** 95%
- **Prerequisites:** None
- **Description:**
  - Create `/dashboard` route in React Router
  - Set up base Dashboard component structure
  - Implement fixed grid layout (responsive for iPad/desktop)
  - Add manual refresh button (circular arrow icon)
  - Add auto-refresh every 5 minutes using interval
- **Acceptance Criteria:**
  - [ ] Dashboard accessible at `/dashboard` route
  - [ ] Fixed grid layout renders correctly on iPad and desktop
  - [ ] Manual refresh button triggers data reload
  - [ ] Auto-refresh runs every 5 minutes
  - [ ] Loading state shows while refreshing
- **Integration Points:**
  - React Router configuration
  - Base CRM layout

#### P4-E1-S1-T2: Create Widget Container Component
- **Hours:** 1h
- **Confidence:** 92%
- **Prerequisites:** P4-E1-S1-T1
- **Description:**
  - Create reusable `DashboardWidget` component
  - Support title, loading state, error state
  - Implement error boundary with retry button
  - Add independent loading skeletons per widget
- **Acceptance Criteria:**
  - [ ] Widget container handles loading states
  - [ ] Error state shows "Unable to load" with retry
  - [ ] Widget styling matches design system
  - [ ] Supports click actions for navigation
- **Integration Points:**
  - Design system components
  - Error handling patterns

### Story E1-S2: Widget Implementation

#### P4-E1-S1-T3: Implement "My Open Opportunities" Widget
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of opportunities where user is owner AND status = active
  - Display count with label
  - Click navigates to opportunities list with pre-applied filter
  - Handle zero state gracefully
- **Acceptance Criteria:**
  - [ ] Displays accurate count of user's open opportunities
  - [ ] Click navigates to filtered opportunities list
  - [ ] Zero state shows "No open opportunities"
  - [ ] Updates on manual/auto refresh
- **Integration Points:**
  - Supabase data provider (opportunities table)
  - React Router navigation with filters

#### P4-E1-S1-T4: Implement "Overdue Tasks" Widget
- **Hours:** 2h
- **Confidence:** 88%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of tasks where next_action_date < today
  - Display count with red text if count > 0
  - Click navigates to task list (dashboard widget)
  - Show visual indicator (red badge) if overdue exists
- **Acceptance Criteria:**
  - [ ] Displays accurate count of overdue tasks
  - [ ] Red text/badge when count > 0
  - [ ] Click navigates to task list view
  - [ ] Calculates "overdue" correctly based on current date
- **Integration Points:**
  - Tasks table query
  - Date comparison logic

#### P4-E1-S1-T5: Implement "This Week's Activities" Widget
- **Hours:** 1.5h
- **Confidence:** 90%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of activities logged this week (Monday-Sunday)
  - Display count with label
  - Click navigates to activity feed with week filter
- **Acceptance Criteria:**
  - [ ] Displays accurate count of current week's activities
  - [ ] Week defined as Monday-Sunday
  - [ ] Click navigates to filtered activity feed
  - [ ] Count includes all activity types
- **Integration Points:**
  - Activities table query
  - Date range filtering (ISO week)

#### P4-E1-S1-T6: Implement "Pipeline by Stage" Chart Widget
- **Hours:** 3h
- **Confidence:** 85%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch opportunity counts grouped by stage
  - Render horizontal bar chart (using Recharts or similar)
  - Click bar navigates to opportunities filtered by that stage
  - Show stage names and counts on bars
- **Acceptance Criteria:**
  - [ ] Chart displays all stages with counts
  - [ ] Bars sized proportionally to counts
  - [ ] Click bar filters opportunities by stage
  - [ ] Chart responsive on iPad/desktop
  - [ ] Uses semantic colors from design system
- **Integration Points:**
  - Recharts library integration
  - Opportunity stages from ConfigurationContext
  - Stage filtering logic

#### P4-E1-S1-T7: Implement "Recent Activities" Feed Widget
- **Hours:** 2h
- **Confidence:** 88%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch last 10 activities across all users
  - Display as list: User, Type, Description, Time ago
  - Click activity navigates to full activity feed
  - Format "time ago" (e.g., "2 hours ago")
- **Acceptance Criteria:**
  - [ ] Shows last 10 activities reverse chronologically
  - [ ] Includes activity type icons
  - [ ] "Time ago" formatted correctly
  - [ ] Click navigates to full activity feed
  - [ ] Truncates long descriptions
- **Integration Points:**
  - Activities table query with user joins
  - Date formatting (date-fns)
  - Activity type icons

#### P4-E1-S1-T8: Implement "Opportunities by Principal" Widget
- **Hours:** 2.5h
- **Confidence:** 87%
- **Prerequisites:** P4-E1-S1-T2
- **Description:**
  - Fetch count of active opportunities grouped by principal
  - Display as list: Principal name with count
  - Mark with star icon (most important widget per PRD)
  - Click principal navigates to opportunities filtered by that principal
- **Acceptance Criteria:**
  - [ ] Lists principals with active opportunity counts
  - [ ] Star icon visible to indicate importance
  - [ ] Click principal filters opportunities
  - [ ] Sorted by count (descending)
  - [ ] Shows "Other" category if applicable
- **Integration Points:**
  - Opportunities table with principal filtering
  - Principal configuration from ConfigurationContext

---

## Epic 2: Advanced Search System (32h)

Full-text search with operators, history, saved searches, and fuzzy matching across all modules.

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

## Epic 3: In-App Notifications (12h)

Bell icon notification system for overdue tasks with dropdown panel.

### Story E3-S1: Notification Infrastructure

#### P4-E3-S1-T1: Create Notifications Database Table and Migration
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** None
- **Description:**
  - Create `notifications` table (id, user_id, type, message, entity_type, entity_id, read, created_at)
  - Add indexes for user_id and created_at
  - Implement RLS policies (users see only their notifications)
  - Add auto-delete trigger for notifications > 30 days
- **Acceptance Criteria:**
  - [ ] Migration file created
  - [ ] Table includes all required fields
  - [ ] Indexes created
  - [ ] RLS policies enforce user isolation
  - [ ] Auto-delete trigger functional
- **Integration Points:**
  - Supabase migrations
  - RLS policies

#### P4-E3-S1-T2: Implement Overdue Task Notification Job
- **Hours:** 3h
- **Confidence:** 82%
- **Prerequisites:** P4-E3-S1-T1
- **Description:**
  - Create Supabase Edge Function or cron job
  - Run daily at 9 AM server time
  - Query tasks where next_action_date < today AND notification not sent
  - Create notification record for each overdue task
  - Mark tasks as notified to prevent duplicates
- **Acceptance Criteria:**
  - [ ] Job runs daily at 9 AM
  - [ ] Creates notifications for overdue tasks
  - [ ] No duplicate notifications
  - [ ] Logs execution success/failure
- **Integration Points:**
  - Supabase Edge Functions or pg_cron
  - Tasks table
  - Notifications table

### Story E3-S2: Notification UI

#### P4-E3-S1-T3: Create Bell Icon Component with Badge
- **Hours:** 2h
- **Confidence:** 88%
- **Prerequisites:** None
- **Description:**
  - Add bell icon to top navigation
  - Display unread count as red badge
  - Badge hidden when count = 0
  - Real-time updates using Supabase subscriptions
  - Accessible: aria-label "Notifications (3 unread)"
- **Acceptance Criteria:**
  - [ ] Bell icon visible in top navigation
  - [ ] Red badge shows unread count
  - [ ] Badge hidden when no unread
  - [ ] Updates in real-time
  - [ ] Accessible to screen readers
- **Integration Points:**
  - Top navigation component
  - Supabase real-time subscriptions

#### P4-E3-S1-T4: Implement Notification Dropdown Panel
- **Hours:** 3h
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
  - [ ] Dropdown opens on bell icon click
  - [ ] Shows last 20 notifications
  - [ ] Time ago formatted correctly
  - [ ] Mark as read updates immediately
  - [ ] Mark all as read works
  - [ ] Links navigate correctly
- **Integration Points:**
  - Bell icon component
  - Notifications data provider
  - Date formatting (date-fns)

#### P4-E3-S1-T5: Create Full Notifications Page
- **Hours:** 2h
- **Confidence:** 90%
- **Prerequisites:** P4-E3-S1-T1
- **Description:**
  - Create `/notifications` route
  - Display all notifications (paginated)
  - Filter by read/unread status
  - Search within notifications
  - Bulk mark as read
- **Acceptance Criteria:**
  - [ ] Full page accessible from dropdown
  - [ ] Pagination works (20 per page)
  - [ ] Filter by read/unread
  - [ ] Search functional
  - [ ] Bulk actions work
- **Integration Points:**
  - React Router
  - Notifications data provider
  - List view patterns

---

## Epic 4: Activity Tracking Enhancements (10h)

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

## Epic 5: iPad Touch Optimizations (6h)

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

## Epic 6: Keyboard Shortcuts (4h)

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
