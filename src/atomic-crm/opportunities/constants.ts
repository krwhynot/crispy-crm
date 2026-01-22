/**
 * Centralized constants for opportunities module
 *
 * This file consolidates all opportunity-related constants:
 * - UI constants (field widths, touch targets)
 * - Stage definitions and configuration
 * - Stage thresholds for rotting/health indicators
 * - Stage sorting and grouping utilities
 * - Priority and lead source choices
 * - Filter configuration and presets
 */

import { addDays } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";
import type { Opportunity } from "../types";

// P1 consolidation: Import type from canonical validation schema
import type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

// Re-export for backward compatibility with existing imports
export type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

// ============================================================================
// UI CONSTANTS
// ============================================================================

/** Minimum width for detail field columns (150px) */
export const DETAIL_FIELD_MIN_WIDTH = "min-w-[150px]";

/** Touch target minimum height - WCAG AA compliant (44px) */
export const TOUCH_TARGET_MIN_HEIGHT = "min-h-[44px]";

/** Standard action button height (44px) */
export const ACTION_BUTTON_HEIGHT = "h-11";

// ============================================================================
// LEAD SOURCE CHOICES
// ============================================================================

/**
 * Lead source choices
 * Extracted from LeadSourceInput.tsx to support Fast Refresh
 */
export const LEAD_SOURCE_CHOICES = [
  { id: "referral", name: "Referral" },
  { id: "trade_show", name: "Trade Show" },
  { id: "website", name: "Website" },
  { id: "cold_call", name: "Cold Call" },
  { id: "email_campaign", name: "Email Campaign" },
  { id: "social_media", name: "Social Media" },
  { id: "partner", name: "Partner" },
  { id: "existing_customer", name: "Existing Customer" },
];

// ============================================================================
// PRIORITY CHOICES
// ============================================================================

/**
 * Priority choice definitions for opportunities
 * Centralized to maintain single source of truth
 */
export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

export type PriorityLevel = "low" | "medium" | "high" | "critical";

// ============================================================================
// STAGE CONSTANTS
// ============================================================================

/**
 * Type-safe stage constants object for use in code
 * Use STAGE.CLOSED_WON instead of "closed_won" literals
 */
export const STAGE = {
  NEW_LEAD: "new_lead",
  INITIAL_OUTREACH: "initial_outreach",
  SAMPLE_VISIT_OFFERED: "sample_visit_offered",
  FEEDBACK_LOGGED: "feedback_logged",
  DEMO_SCHEDULED: "demo_scheduled",
  CLOSED_WON: "closed_won",
  CLOSED_LOST: "closed_lost",
} as const satisfies Record<string, OpportunityStageValue>;

/**
 * Closed stages array - for filtering and validation
 */
export const CLOSED_STAGES = [STAGE.CLOSED_WON, STAGE.CLOSED_LOST] as const;

/**
 * Active (non-closed) pipeline stages
 */
export const ACTIVE_STAGES = [
  STAGE.NEW_LEAD,
  STAGE.INITIAL_OUTREACH,
  STAGE.SAMPLE_VISIT_OFFERED,
  STAGE.FEEDBACK_LOGGED,
  STAGE.DEMO_SCHEDULED,
] as const;

/**
 * Stage ordering for sorting opportunities in pipeline view
 * Lower numbers appear earlier in the pipeline
 */
export const STAGE_ORDER: Record<OpportunityStageValue, number> = {
  [STAGE.NEW_LEAD]: 0,
  [STAGE.INITIAL_OUTREACH]: 1,
  [STAGE.SAMPLE_VISIT_OFFERED]: 2,
  [STAGE.FEEDBACK_LOGGED]: 3,
  [STAGE.DEMO_SCHEDULED]: 4,
  [STAGE.CLOSED_WON]: 5,
  [STAGE.CLOSED_LOST]: 6,
};

/**
 * MFB Sales Process Phase information
 * Maps pipeline stages to the broader 7-phase methodology
 */
export interface MfbPhaseInfo {
  phase: string; // e.g., "Phase 2", "Phase 3A"
  name: string; // e.g., "Planning", "Target Distributors"
  context: string; // Tooltip text explaining what typically happens
}

export interface OpportunityStage {
  value: OpportunityStageValue; // Now typed to canonical enum
  label: string;
  /** Tailwind background class for stage badges */
  bgClass: string;
  /** Tailwind border class for stage indicators */
  borderClass: string;
  /** Tailwind text class for stage labels on colored backgrounds */
  textClass: string;
  description: string;
  elevation: 1 | 2 | 3; // Visual depth: 1=subtle, 2=medium, 3=prominent
  mfbPhase: MfbPhaseInfo; // MFB 7-phase process mapping (PRD Section 7.4)
}

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",
    description:
      "New prospect identified. Research the operator's menu, identify which principal products fit, and prepare your pitch.",
    elevation: 3, // Prominent - new opportunities should stand out
    mfbPhase: {
      phase: "Phase 2",
      name: "Planning",
      context:
        "Phase 2 activities typically happen here: defining parameters, setting goals, and analyzing distributor landscape.",
    },
  },
  {
    value: "initial_outreach",
    label: "Initial Outreach",
    color: "var(--tag-teal-bg)",
    description:
      "First contact made. Introduce MFB and relevant principals, qualify interest, and schedule a follow-up call or visit.",
    elevation: 2, // Medium - active engagement
    mfbPhase: {
      phase: "Phase 3A",
      name: "Target Distributors",
      context:
        "Phase 3A activities typically happen here: intro emails, presentations, and operator call coordination.",
    },
  },
  {
    value: "sample_visit_offered",
    label: "Sample/Visit Offered",
    color: "var(--warning-subtle)",
    description:
      "Product sample sent or site visit scheduled. Follow up within 3-5 days to gather feedback—this is a critical stage.",
    elevation: 2, // Medium - active opportunity
    mfbPhase: {
      phase: "Phase 3A",
      name: "Target Distributors",
      context:
        "Phase 3A activities typically happen here: sample coordination and site visit scheduling with targeted distributors.",
    },
  },
  {
    value: "feedback_logged",
    label: "Feedback Logged",
    color: "var(--tag-blue-bg)",
    description:
      "Operator feedback recorded. Evaluate fit, address concerns, and determine if a formal demo or pricing discussion is warranted.",
    elevation: 2, // Medium - active analysis
    mfbPhase: {
      phase: "Phase 3B",
      name: "Stocking Distributors",
      context:
        "Phase 3B activities typically happen here: creating stock lists and developing marketing campaigns.",
    },
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    color: "var(--success-subtle)",
    description:
      "Final product demonstration or tasting scheduled. Confirm distributor availability and prepare pricing/terms for close.",
    elevation: 3, // Prominent - important milestone
    mfbPhase: {
      phase: "Phase 3B",
      name: "Stocking Distributors",
      context:
        "Phase 3B activities typically happen here: setting appointments and finalizing stock arrangements.",
    },
  },
  {
    value: "closed_won",
    label: "Closed - Won",
    color: "var(--success-strong)",
    description:
      "Deal won! First purchase order placed. Ensure distributor authorization is active and hand off to account management.",
    elevation: 2, // Medium - completed but notable
    mfbPhase: {
      phase: "Phase 5",
      name: "Ongoing Activities",
      context:
        "Phase 5 activities begin here: annual/quarterly goals, promotions, DSR training, and food show planning.",
    },
  },
  {
    value: "closed_lost",
    label: "Closed - Lost",
    color: "var(--error-subtle)",
    description:
      "Opportunity lost. Review the loss reason and consider re-engagement after 90 days if circumstances change.",
    elevation: 1, // Subtle - less emphasis on lost deals
    mfbPhase: {
      phase: "Phase 4",
      name: "Measuring Results",
      context:
        "Phase 4 review applies here: analyze loss reasons for corrective actions and future opportunity improvement.",
    },
  },
];

// Helper functions for stage management
export function getOpportunityStageLabel(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.label || stageValue;
}

export function getOpportunityStageColor(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.color || "var(--muted)";
}

export function getOpportunityStageDescription(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.description || "";
}

export function getOpportunityStageElevation(stageValue: string): 1 | 2 | 3 {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.elevation || 2; // Default to medium elevation
}

/**
 * Get the MFB 7-phase process mapping for a stage (PRD Section 7.4)
 * Returns null if stage not found
 */
export function getOpportunityMfbPhase(stageValue: string): MfbPhaseInfo | null {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.mfbPhase || null;
}

export function isActiveStage(stageValue: string): boolean {
  return !(CLOSED_STAGES as readonly string[]).includes(stageValue);
}

export function isClosedStage(stageValue: string): boolean {
  return (CLOSED_STAGES as readonly string[]).includes(stageValue);
}

/**
 * Get badge variant for a pipeline stage
 * Used for consistent stage badge styling across the application
 *
 * @param stage - The pipeline stage value
 * @returns Badge variant: 'success' for won, 'destructive' for lost, 'default' for new leads, 'secondary' for others
 */
export function getStageBadgeVariant(
  stage: OpportunityStageValue
): "default" | "success" | "destructive" | "secondary" {
  if (stage === STAGE.CLOSED_WON) return "success";
  if (stage === STAGE.CLOSED_LOST) return "destructive";
  if (stage === STAGE.NEW_LEAD) return "default";
  return "secondary";
}

// Legacy compatibility function for existing components
export function findOpportunityLabel(
  _opportunityStages: { value: string; label: string }[],
  opportunityValue: string
): string {
  return getOpportunityStageLabel(opportunityValue);
}

// Export stages in format compatible with React Admin SelectInput choices
export const OPPORTUNITY_STAGE_CHOICES = OPPORTUNITY_STAGES.map((stage) => ({
  id: stage.value,
  name: stage.label,
}));

// Export stages in legacy format for backward compatibility
export const OPPORTUNITY_STAGES_LEGACY = OPPORTUNITY_STAGES.map((stage) => ({
  value: stage.value,
  label: stage.label,
}));

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

// ============================================================================
// FILTER CHOICES
// ============================================================================

// Re-export for convenience (aliased names for backward compatibility)
export { OPPORTUNITY_STAGE_CHOICES as stageChoices };

/**
 * Filter configuration for opportunities
 * Defines available filters and their properties
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiselect" | "reference" | "search" | "toggle";
  choices?: Array<{ id: string; name: string }>;
  defaultValue?: string | number | boolean | string[];
  dynamicChoices?: boolean;
  reference?: string;
}

/**
 * Complete filter configuration for opportunities
 */
export const opportunityFilters: Record<string, FilterConfig> = {
  search: {
    key: "q",
    label: "Search",
    type: "search",
  },
  customer_organization: {
    key: "customer_organization_id",
    label: "Customer",
    type: "reference",
    reference: "organizations",
  },
  priority: {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: priorityChoices,
  },
  stage: {
    key: "stage",
    label: "Stage",
    type: "multiselect",
    choices: OPPORTUNITY_STAGE_CHOICES,
  },
  only_mine: {
    key: "only_mine",
    label: "Only Mine",
    type: "toggle",
    defaultValue: false,
  },
};

/**
 * Get default visible stages (excludes closed stages)
 */
export const getDefaultVisibleStages = (): string[] => {
  const closedStagesArray = [...CLOSED_STAGES] as string[];
  return OPPORTUNITY_STAGE_CHOICES.filter((stage) => !closedStagesArray.includes(stage.id)).map(
    (stage) => stage.id
  );
};

/**
 * Get choice by ID for a specific filter
 */
export const getFilterChoice = (
  filterKey: string,
  choiceId: string
): { id: string; name: string } | undefined => {
  const filter = opportunityFilters[filterKey];
  if (!filter?.choices) {
    return undefined;
  }
  return filter.choices.find((choice) => choice.id === choiceId);
};

/**
 * Format filter value for display
 */
export const formatFilterValue = (filterKey: string, value: string | number | boolean): string => {
  const choice = getFilterChoice(filterKey, String(value));
  return choice?.name || String(value);
};

// ============================================================================
// FILTER PRESETS
// ============================================================================

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  icon?: string; // lucide-react icon name
  filters: Record<string, unknown>;
}

/**
 * Get filter preset configurations
 * @param userId - Current user ID for "My Opportunities" filter
 */
export const getFilterPresets = (userId?: string): FilterPreset[] => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  return [
    {
      id: "my-opportunities",
      label: "My Opportunities",
      description: "Opportunities I manage",
      icon: "User",
      filters: {
        opportunity_owner_id: userId,
      },
    },
    {
      id: "closing-this-month",
      label: "Closing This Month",
      description: "Opportunities with expected close date within 30 days",
      icon: "Calendar",
      filters: {
        estimated_close_date_gte: today.toISOString().split("T")[0],
        estimated_close_date_lte: thirtyDaysFromNow.toISOString().split("T")[0],
      },
    },
    {
      id: "high-priority",
      label: "High Priority",
      description: "Critical and high priority opportunities",
      icon: "AlertCircle",
      filters: {
        priority: ["high", "critical"],
      },
    },
    {
      id: "needs-action",
      label: "Needs Action",
      description: "Opportunities with overdue or upcoming actions",
      icon: "Flag",
      filters: {
        next_action_date_lte: today.toISOString().split("T")[0],
      },
    },
    {
      id: "recent-wins",
      label: "Recent Wins",
      description: "Opportunities closed won in the last 30 days",
      icon: "Trophy",
      filters: {
        stage: STAGE.CLOSED_WON,
        updated_at_gte: addDays(today, -30).toISOString().split("T")[0],
      },
    },
  ];
};
