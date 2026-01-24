/**
 * Stage health monitoring and sorting logic
 * Depends on: stage-enums, stage-config
 */

import { addDays } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";
import type { Opportunity } from "../../types";
import { STAGE, CLOSED_STAGES } from "./stage-enums";
import type { OpportunityStageValue } from "./stage-enums";
import { OPPORTUNITY_STAGES } from "./stage-config";

// ============================================================================
// STAGE THRESHOLDS
// ============================================================================

/**
 * Days before an opportunity is considered "rotting" in each stage.
 * null = no rotting (closed stages)
 *
 * PRD Reference: Pipeline PRD Section "Stage Configuration"
 * - Thresholds define when an opportunity is "stuck" in a stage
 * - Closed stages (won/lost) have no rotting threshold (null)
 *
 * WARNING: Do NOT add retry/backoff logic. These are simple lookups.
 */
export const STAGE_ROTTING_THRESHOLDS: Record<OpportunityStageValue, number | null> = {
  new_lead: 7,
  initial_outreach: 10,
  sample_visit_offered: 14,
  feedback_logged: 7,
  demo_scheduled: 5,
  closed_won: null,
  closed_lost: null,
};

/**
 * Status indicator for stage health
 * Order matters for priority: rotting/expired > warning > healthy > closed
 */
export type StageStatus = "rotting" | "expired" | "warning" | "healthy" | "closed";

// ============================================================================
// HEALTH CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if an opportunity is rotting (over threshold for its stage)
 */
export function isRotting(stage: string, daysInStage: number): boolean {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null && daysInStage > threshold;
}

/**
 * Get warning threshold (75% of rotting threshold)
 */
export function getWarningThreshold(stage: string): number | null {
  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];
  return threshold !== null ? Math.floor(threshold * 0.75) : null;
}

/**
 * Determine stage status for visual indicators
 *
 * Priority order (first match wins):
 * 1. closed - Closed stages never rot
 * 2. expired - Past expected close date (most urgent)
 * 3. rotting - Over stage threshold
 * 4. warning - 75%+ of threshold
 * 5. healthy - Below warning threshold
 */
export function getStageStatus(
  stage: string,
  daysInStage: number,
  expectedCloseDate?: Date | null
): StageStatus {
  if (stage === STAGE.CLOSED_WON || stage === STAGE.CLOSED_LOST) {
    return "closed";
  }

  if (expectedCloseDate && expectedCloseDate < new Date()) {
    return "expired";
  }

  const threshold = STAGE_ROTTING_THRESHOLDS[stage as OpportunityStageValue];

  if (threshold === null) {
    return "healthy";
  }

  if (daysInStage > threshold) {
    return "rotting";
  }

  const warningThreshold = Math.floor(threshold * 0.75);
  if (daysInStage > warningThreshold) {
    return "warning";
  }

  return "healthy";
}

// ============================================================================
// STAGE SORTING AND GROUPING
// ============================================================================

export type OpportunitiesByStage = Record<Opportunity["stage"], Opportunity[]>;

/**
 * Status priority for sorting (lower = higher priority = shown first)
 *
 * PRD Reference: Pipeline PRD "Card Sorting Within Columns"
 */
const STATUS_PRIORITY: Record<StageStatus, number> = {
  expired: 0, // Most urgent - past close date
  rotting: 1, // Over threshold
  warning: 2, // Approaching threshold
  healthy: 3, // On track
  closed: 4, // Completed
};

/**
 * Sort opportunities by status priority, then by days in stage descending
 *
 * PRD Reference: Pipeline PRD "Card Sorting Within Columns"
 * 1. Red (rotting/expired) - top of column
 * 2. Yellow (warning) - middle
 * 3. Green (healthy) - bottom
 * 4. Within each group: Sort by days_in_stage descending (oldest first)
 *
 * @param opportunities - Array of opportunities to sort
 * @returns Sorted array (new array, does not mutate input)
 */
export function sortOpportunitiesByStatus(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    const aCloseDate = a.estimated_close_date ? parseDateSafely(a.estimated_close_date) : null;
    const bCloseDate = b.estimated_close_date ? parseDateSafely(b.estimated_close_date) : null;

    const aStatus = getStageStatus(a.stage, a.days_in_stage || 0, aCloseDate);
    const bStatus = getStageStatus(b.stage, b.days_in_stage || 0, bCloseDate);

    const aPriority = STATUS_PRIORITY[aStatus];
    const bPriority = STATUS_PRIORITY[bStatus];

    // Primary sort: by status priority (red before yellow before green)
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Secondary sort: by days in stage descending (oldest first)
    return (b.days_in_stage || 0) - (a.days_in_stage || 0);
  });
}

/**
 * Get opportunities grouped by stage with status-based sorting
 *
 * CHANGED: Now applies status-based sorting instead of created_at sorting.
 * Red/rotting opportunities appear at top of each column.
 */
export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[]
): OpportunitiesByStage => {
  // Use centralized stages if no stages provided
  const stages =
    opportunityStages ||
    OPPORTUNITY_STAGES.map((stage) => ({
      value: stage.value,
      label: stage.label,
    }));

  if (!stages.length) return {} as OpportunitiesByStage;

  const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> =
    unorderedOpportunities.reduce(
      (acc, opportunity) => {
        if (acc[opportunity.stage]) {
          acc[opportunity.stage].push(opportunity);
        } else {
          // FIX [SF-C04]: Fail fast on invalid stage instead of silent mutation
          // Invalid stages indicate data corruption (bad import, RLS issue, schema drift)
          const validStages = Object.keys(acc).join(", ");
          throw new Error(
            `Invalid opportunity stage: Opportunity ID ${opportunity.id} has stage "${opportunity.stage}", ` +
              `which is not a valid pipeline stage. Expected one of: ${validStages}. ` +
              `This may indicate a data import error or database corruption. Please audit the data and fix manually.`
          );
        }
        return acc;
      },
      stages.reduce(
        (obj, stage) => ({ ...obj, [stage.value]: [] }),
        {} as Record<Opportunity["stage"], Opportunity[]>
      )
    );

  // CHANGED: Sort each column by status priority (red first, then yellow, then green)
  // Previously sorted by created_at DESC
  stages.forEach((stage) => {
    const stageKey = stage.value as Opportunity["stage"];
    if (opportunitiesByStage[stageKey]) {
      opportunitiesByStage[stageKey] = sortOpportunitiesByStatus(opportunitiesByStage[stageKey]);
    }
  });

  return opportunitiesByStage;
};
