/**
 * Centralized constants for food service opportunity pipeline stages
 * Replaces hardcoded stage definitions across components
 *
 * MFB Sales Process Mapping (PRD Section 7.4):
 * The CRM pipeline stages align with MFB's established 7-phase sales process.
 * This mapping provides contextual guidance for reps transitioning from Excel.
 */

// P1 consolidation: Import type from canonical validation schema
import type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

// Re-export for backward compatibility with existing imports
export type { OpportunityStageValue } from "@/atomic-crm/validation/opportunities";

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
  color: string;
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
  opportunityStages: { value: string; label: string }[],
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
