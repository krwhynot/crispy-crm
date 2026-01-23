/**
 * Daily Digest Email Types
 *
 * Type definitions for the daily digest email template.
 * Used by the email generator to ensure type-safe template data.
 */

import { STAGE } from "@/atomic-crm/opportunities/constants";

/** Individual overdue task for the digest */
export interface OverdueTask {
  /** Task ID for linking */
  task_id: string;
  /** Task title/description */
  task_title: string;
  /** Due date in ISO format */
  due_date: string;
  /** Formatted due date for display (e.g., "Nov 25") */
  due_date_formatted: string;
  /** Related entity name (contact, organization, or opportunity) */
  related_entity: string;
  /** Number of days overdue */
  days_overdue: number;
  /** Whether to pluralize "day" */
  days_plural: boolean;
  /** Alternating row background color */
  row_bg_color: string;
}

/** Individual at-risk deal for the digest */
export interface AtRiskDeal {
  /** Opportunity ID for linking */
  opportunity_id: string;
  /** Opportunity name */
  opportunity_name: string;
  /** Principal company name */
  principal_name: string;
  /** Customer/operator name */
  customer_name: string;
  /** Current pipeline stage key */
  stage: string;
  /** Human-readable stage label */
  stage_label: string;
  /** Stage badge background color */
  stage_bg_color: string;
  /** Stage badge text color */
  stage_text_color: string;
  /** Days since last activity */
  days_stale: number;
  /** Whether to pluralize "day" */
  days_plural: boolean;
  /** Alternating row background color */
  row_bg_color: string;
}

/** Today's task for the focus section */
export interface TodayTask {
  /** Task ID */
  task_id: string;
  /** Task title */
  task_title: string;
  /** Related entity name (optional) */
  related_entity?: string;
}

/** Complete data structure for the daily digest email template */
export interface DailyDigestData {
  // Header
  /** Email subject/title */
  digest_title: string;
  /** Hidden preheader text shown in email preview */
  preheader_text: string;
  /** Formatted date string (e.g., "Friday, November 29, 2024") */
  formatted_date: string;

  // Greeting
  /** "morning", "afternoon", or "evening" */
  time_of_day: "morning" | "afternoon" | "evening";
  /** User's first name */
  user_first_name: string;

  // Quick stats
  /** Count of open opportunities */
  open_opportunities_count: number;
  /** Count of tasks due today */
  tasks_due_today_count: number;
  /** Count of overdue tasks */
  overdue_count: number;
  /** Whether overdue count should be pluralized */
  overdue_plural: boolean;

  // Overdue tasks section
  /** Whether to show overdue tasks section */
  has_overdue_tasks: boolean;
  /** List of overdue tasks (max 5 recommended) */
  overdue_tasks: OverdueTask[];

  // At-risk deals section
  /** Whether to show at-risk deals section */
  has_at_risk_deals: boolean;
  /** Count of at-risk deals */
  at_risk_count: number;
  /** Whether at-risk count should be pluralized */
  at_risk_plural: boolean;
  /** List of at-risk deals (max 5 recommended) */
  at_risk_deals: AtRiskDeal[];

  // Today's focus section
  /** Whether to show today's focus section */
  has_today_tasks: boolean;
  /** List of today's tasks (max 5 recommended) */
  today_tasks: TodayTask[];

  // Footer & links
  /** Full URL to the dashboard */
  dashboard_url: string;
  /** User's email address */
  user_email: string;
  /** URL to email preferences page */
  preferences_url: string;
  /** URL to unsubscribe */
  unsubscribe_url: string;
  /** Current year for copyright */
  current_year: number;
}

/** Stage configuration for badge styling */
export const STAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  [STAGE.NEW_LEAD]: { bg: "#E0F2FE", text: "#0369A1", label: "New Lead" },
  [STAGE.INITIAL_OUTREACH]: { bg: "#F3E8FF", text: "#7C3AED", label: "Outreach" },
  [STAGE.SAMPLE_VISIT_OFFERED]: { bg: "#FEF3E2", text: "#B8640A", label: "Sample" },
  [STAGE.FEEDBACK_LOGGED]: { bg: "#FEF9C3", text: "#A16207", label: "Feedback" },
  [STAGE.DEMO_SCHEDULED]: { bg: "#DBEAFE", text: "#1D4ED8", label: "Demo" },
  [STAGE.CLOSED_WON]: { bg: "#DCFCE7", text: "#166534", label: "Won" },
  [STAGE.CLOSED_LOST]: { bg: "#FEE2E2", text: "#991B1B", label: "Lost" },
};

/** Stale thresholds by stage (days without activity) */
export const STALE_THRESHOLDS: Record<string, number> = {
  [STAGE.NEW_LEAD]: 3,
  [STAGE.INITIAL_OUTREACH]: 5,
  [STAGE.SAMPLE_VISIT_OFFERED]: 7,
  [STAGE.FEEDBACK_LOGGED]: 5,
  [STAGE.DEMO_SCHEDULED]: 3,
};

/** MFB brand colors for email templates */
export const MFB_EMAIL_COLORS = {
  // Primary brand
  primary: "#336600", // Forest green
  primaryDark: "#2B5600",
  primaryLight: "#3D7A00",

  // Accent
  accent: "#D97E1F", // Clay orange
  accentDark: "#B8640A",

  // Backgrounds
  background: "#FAF9F6", // Paper cream
  card: "#FFFFFF",
  cardAlt: "#F5F9F0", // Light sage tint

  // Text
  textPrimary: "#1E3F00",
  textSecondary: "#5C5C52",
  textMuted: "#8C8C82",

  // Status
  error: "#C53030",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  warning: "#B8640A",
  warningBg: "#FEF3E2",
  warningBorder: "#FED7AA",
  success: "#166534",
  successBg: "#F0FDF4",
  successBorder: "#BBF7D0",

  // Borders
  border: "#E8E8E0",
  borderLight: "#E8F0E0",
} as const;

/** Row alternation colors */
export const ROW_COLORS = {
  even: "#FFFFFF",
  odd: "#FAFAF8",
} as const;
