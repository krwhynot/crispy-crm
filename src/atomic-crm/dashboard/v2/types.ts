/**
 * Type definitions for Principal Dashboard V2
 *
 * V2 Dashboard Features:
 * - 3-column resizable layout (Opportunities | Tasks | Quick Logger)
 * - Collapsible filters sidebar
 * - Opportunities hierarchy tree (Principal → Customer → Opportunity)
 * - Tasks panel with multiple grouping modes (Due/Priority/Principal)
 * - Quick activity logger with follow-up task creation
 * - Right slide-over panel (Details/History/Files tabs)
 * - User preference persistence via localStorage
 *
 * All types support desktop-first responsive design (1440px+, tablet 768px+)
 */

// Re-export core types from parent dashboard types for convenience
export type {
  HealthStatus,
  OpportunityStage,
  TaskPriority,
  TaskType,
  ActivityType,
  PrincipalOpportunity,
  PriorityTask,
} from '../types';

/**
 * Column widths for 3-column layout (Opportunities | Tasks | Quick Logger)
 *
 * - Array of 3 numbers representing percentage widths
 * - Must sum to 100
 * - Each column constrained to min 15%, max 70%
 * - Default: [40, 30, 30]
 */
export type ColWidths = [number, number, number];

/**
 * Task grouping modes for Tasks Panel
 *
 * - 'due': Group by due date buckets (Overdue, Today, Tomorrow, This Week, Later)
 * - 'priority': Group by priority level (Critical, High, Medium, Low)
 * - 'principal': Group by principal organization
 */
export type TaskGrouping = 'due' | 'priority' | 'principal';

/**
 * Tab names for right slide-over panel
 *
 * - 'details': Opportunity details with stage change actions
 * - 'history': Activity history sorted DESC by date
 * - 'files': File attachments (placeholder for MVP)
 */
export type TabName = 'details' | 'history' | 'files';

/**
 * Task buckets for grouping by due date
 *
 * - 'overdue': due_date < TODAY
 * - 'today': due_date === TODAY (same calendar day)
 * - 'tomorrow': due_date === TOMORROW
 * - 'this_week': due_date > TOMORROW && due_date <= END_OF_WEEK (7 days)
 * - 'later': due_date > END_OF_WEEK
 *
 * All date comparisons use startOfDay() to normalize to midnight (America/Chicago)
 */
export type TaskBucket = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later';

/**
 * Filter state for opportunities and tasks
 *
 * Applied client-side after data fetch (acceptable for <500 rows)
 *
 * - health: Array of health statuses to include (empty = all)
 * - stages: Array of opportunity stages to include (empty = all)
 * - assignee: Scope to current user or entire team
 * - lastTouch: Filter by days since last activity
 * - showClosed: Include closed_lost opportunities
 * - groupByCustomer: Group opportunities by customer in hierarchy
 */
export interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | null;
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
  groupByCustomer: boolean;
}

/**
 * Principal context for global principal selection
 *
 * Shared across all 3 columns (Opportunities, Tasks, Quick Logger)
 * Selection updates all data fetches automatically
 */
export interface PrincipalContext {
  selectedPrincipalId: number | null;
  setSelectedPrincipal: (id: number | null) => void;
}

/**
 * Opportunity node for tree hierarchy rendering
 *
 * Supports ARIA tree pattern with nested customer grouping:
 * - Level 1: Principal (implicit, not rendered)
 * - Level 2: Customer (expandable)
 * - Level 3: Opportunity (leaf node)
 *
 * Tree supports keyboard navigation (ArrowRight/Left, ArrowUp/Down, Home/End, Enter)
 */
export interface OpportunityNode {
  /** Unique identifier (opportunity ID or customer ID for group nodes) */
  id: number;

  /** Display name (opportunity name or customer name) */
  name: string;

  /** Opportunity stage (only for opportunity nodes, undefined for customer group nodes) */
  stage?: string;

  /** Health status based on days since last activity */
  health: 'active' | 'cooling' | 'at_risk';

  /** Child opportunities (only for customer group nodes) */
  children?: OpportunityNode[];

  /** Whether customer node is expanded (only for customer group nodes with children) */
  expanded?: boolean;

  /** Estimated close date (ISO date string, only for opportunity nodes) */
  estimated_close_date?: string | null;

  /** Customer organization ID (only for opportunity nodes) */
  customer_organization_id?: number;

  /** Principal organization ID */
  principal_organization_id?: number;

  /** Last activity timestamp (ISO timestamp) */
  last_activity?: string;

  /** Days since last activity (computed) */
  days_since_activity?: number;
}

/**
 * User preferences stored in localStorage via React Admin useStore
 *
 * All keys prefixed with 'pd.' (Principal Dashboard)
 */
export interface UserPreferences {
  /** Column widths [40, 30, 30] - validated on load */
  'pd.colWidths': ColWidths;

  /** Task grouping mode - default 'due' */
  'pd.taskGrouping': TaskGrouping;

  /** Last active tab in right slide-over - default 'details' */
  'pd.rightTab': TabName;

  /** Filters sidebar collapsed state - default true (open) */
  'pd.sidebarOpen': boolean;

  /** V2 promotion banner dismissed - default false */
  'pd.v2.banner.dismissed': boolean;
}

/**
 * Keyboard shortcut mapping
 *
 * Global listeners (active when not in input/textarea)
 */
export interface KeyboardShortcut {
  '/': 'focus-search';
  '1': 'scroll-to-opportunities';
  '2': 'scroll-to-tasks';
  '3': 'scroll-to-quick-logger';
  H: 'open-history-tab';
  Escape: 'close-slide-over';
}

/**
 * Column identifiers for scrollIntoView
 */
export type ColumnId = 'col-opps' | 'col-tasks' | 'col-log';

/**
 * Activity type mapping (Frontend → Backend)
 *
 * Maps user-facing activity types to database interaction_type enum
 */
export const ACTIVITY_TYPE_MAP = {
  call: 'phone_call',
  email: 'email_sent',
  meeting: 'meeting',
  note: 'check_in',
} as const;

/**
 * Default values for user preferences
 */
export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'pd.v2.banner.dismissed'> = {
  'pd.colWidths': [40, 30, 30],
  'pd.taskGrouping': 'due',
  'pd.rightTab': 'details',
  'pd.sidebarOpen': true,
};

/**
 * Column width constraints
 */
export const COLUMN_WIDTH_CONSTRAINTS = {
  MIN: 15,
  MAX: 70,
  SUM: 100,
} as const;
