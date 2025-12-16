import { differenceInDays, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Row styling utilities for Opportunity list
 * Follows existing pattern from OpportunityCard.tsx
 */

// Use 'type' for unions per Engineering Constitution
type CloseDateStatus = "overdue" | "today" | "soon" | "normal" | "no-date";

type OpportunityStage =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";

interface OpportunityRowData {
  estimated_close_date?: string | null;
  stage?: string | null;
}

/**
 * Determine close date status for styling
 * Reuses logic from OpportunityCard.tsx
 */
export const getCloseDateStatus = (
  closeDate: string | null | undefined
): CloseDateStatus => {
  if (!closeDate) return "no-date";

  const date = new Date(closeDate);

  // Check if date is valid
  if (isNaN(date.getTime())) return "no-date";

  if (isPast(date) && !isToday(date)) return "overdue";
  if (isToday(date)) return "today";
  if (differenceInDays(date, new Date()) <= 7) return "soon";
  return "normal";
};

/**
 * Check if opportunity is in a closed stage
 */
export const isClosedStage = (stage: string | null | undefined): boolean => {
  return stage === "closed_won" || stage === "closed_lost";
};

/**
 * Check if opportunity is a hot lead (new_lead stage)
 */
export const isHotLead = (stage: string | null | undefined): boolean => {
  return stage === "new_lead";
};

/**
 * Semantic color classes for row styling
 * Uses design system tokens only - no hardcoded colors
 */
const ROW_STYLE_CLASSES = {
  overdue: "bg-error-subtle",
  hotLead: "border-l-4 border-l-primary",
  closedWon: "bg-success-subtle/50 opacity-75",
  closedLost: "opacity-50",
} as const;

/**
 * Get conditional row className for an opportunity
 *
 * Styling priority (highest to lowest):
 * 1. Closed stages (muted appearance)
 * 2. Overdue (red background) - only if NOT closed
 * 3. Hot lead (left border) - can combine with others
 *
 * @param record - Opportunity record with stage and estimated_close_date
 * @returns Tailwind class string for row styling
 */
export const getOpportunityRowClassName = (
  record: OpportunityRowData
): string => {
  const { estimated_close_date, stage } = record;

  const closeDateStatus = getCloseDateStatus(estimated_close_date);
  const isClosed = isClosedStage(stage);
  const isHot = isHotLead(stage);

  return cn(
    // Closed stages get muted styling (takes precedence)
    stage === "closed_won" && ROW_STYLE_CLASSES.closedWon,
    stage === "closed_lost" && ROW_STYLE_CLASSES.closedLost,

    // Overdue styling - only for non-closed opportunities
    !isClosed && closeDateStatus === "overdue" && ROW_STYLE_CLASSES.overdue,

    // Hot lead border - can combine with overdue
    isHot && ROW_STYLE_CLASSES.hotLead
  );
};

/**
 * Type-safe wrapper for use with PremiumDatagrid rowClassName prop
 */
export const opportunityRowClassName = (
  record: unknown,
  _index: number
): string => {
  // Type guard - ensure record has expected shape
  if (!record || typeof record !== "object") return "";

  const opp = record as OpportunityRowData;
  return getOpportunityRowClassName(opp);
};
