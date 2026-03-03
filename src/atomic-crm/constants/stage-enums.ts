/**
 * Core stage enumerations and predicates
 * Foundation layer - no dependencies on other constant modules
 *
 * NOTE: OpportunityStageValue is inlined here (not imported from validation/)
 * to keep constants/ at a lower layer than validation/. Both this type and
 * opportunityStageSchema enumerate the same 7 values; tsc catches mismatches.
 */

/**
 * All valid opportunity stage values.
 * Must stay in sync with opportunityStageSchema in validation/opportunities/opportunities-core.ts
 */
export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";

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

// ============================================================================
// STAGE PREDICATES
// ============================================================================

export function isActiveStage(stageValue: string): boolean {
  return !(CLOSED_STAGES as readonly string[]).includes(stageValue);
}

export function isClosedStage(stageValue: string): boolean {
  return (CLOSED_STAGES as readonly string[]).includes(stageValue);
}

/**
 * Check if stage is specifically closed_won
 * Use this instead of direct string comparison: stage === "closed_won"
 */
export function isWonStage(stageValue: string): boolean {
  return stageValue === STAGE.CLOSED_WON;
}

/**
 * Check if stage is specifically closed_lost
 * Use this instead of direct string comparison: stage === "closed_lost"
 */
export function isLostStage(stageValue: string): boolean {
  return stageValue === STAGE.CLOSED_LOST;
}
