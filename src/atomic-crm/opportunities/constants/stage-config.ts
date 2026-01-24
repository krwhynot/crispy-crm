/**
 * Stage display configuration and formatting helpers
 * Depends on: stage-enums
 */

import { STAGE } from "./stage-enums";
import type { OpportunityStageValue } from "./stage-enums";

// ============================================================================
// STAGE CONFIGURATION TYPES
// ============================================================================

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

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

/**
 * Pipeline stage definitions with semantic color tokens.
 *
 * Color classes use CSS custom properties (--stage-*) defined in index.css
 * to support theming (light/dark mode) and maintain design system consistency.
 *
 * Color Token Mapping:
 * - new_lead: Info blue (new/unprocessed)
 * - initial_outreach: Teal (active engagement)
 * - sample_visit_offered: Warning amber (needs follow-up)
 * - feedback_logged: Blue variant (analysis phase)
 * - demo_scheduled: Success subtle (positive progress)
 * - closed_won: Success strong (prominent win)
 * - closed_lost: Error subtle (lost opportunity)
 */
export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    bgClass: "bg-[var(--stage-new-bg)]",
    borderClass: "border-[var(--stage-new-border)]",
    textClass: "text-[var(--stage-new-text)]",
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
    bgClass: "bg-[var(--stage-outreach-bg)]",
    borderClass: "border-[var(--stage-outreach-border)]",
    textClass: "text-[var(--stage-outreach-text)]",
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
    bgClass: "bg-[var(--stage-sample-bg)]",
    borderClass: "border-[var(--stage-sample-border)]",
    textClass: "text-[var(--stage-sample-text)]",
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
    bgClass: "bg-[var(--stage-feedback-bg)]",
    borderClass: "border-[var(--stage-feedback-border)]",
    textClass: "text-[var(--stage-feedback-text)]",
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
    bgClass: "bg-[var(--stage-demo-bg)]",
    borderClass: "border-[var(--stage-demo-border)]",
    textClass: "text-[var(--stage-demo-text)]",
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
    bgClass: "bg-[var(--stage-won-bg)]",
    borderClass: "border-[var(--stage-won-border)]",
    textClass: "text-[var(--stage-won-text)]",
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
    bgClass: "bg-[var(--stage-lost-bg)]",
    borderClass: "border-[var(--stage-lost-border)]",
    textClass: "text-[var(--stage-lost-text)]",
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

// ============================================================================
// STAGE DISPLAY HELPERS
// ============================================================================

export function getOpportunityStageLabel(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.label || stageValue;
}

/**
 * Get the Tailwind background class for an opportunity stage
 * @deprecated Use getOpportunityStageClasses() for full class set
 */
export function getOpportunityStageBgClass(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.bgClass || "bg-muted";
}

/**
 * Get the Tailwind border class for an opportunity stage
 */
export function getOpportunityStageBorderClass(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.borderClass || "border-border";
}

/**
 * Get the Tailwind text class for an opportunity stage
 */
export function getOpportunityStageTextClass(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return stage?.textClass || "text-foreground";
}

/**
 * Get all Tailwind classes for an opportunity stage (bg, border, text)
 * @returns Object with bgClass, borderClass, textClass
 */
export function getOpportunityStageClasses(stageValue: string): {
  bgClass: string;
  borderClass: string;
  textClass: string;
} {
  const stage = OPPORTUNITY_STAGES.find((s) => s.value === stageValue);
  return {
    bgClass: stage?.bgClass || "bg-muted",
    borderClass: stage?.borderClass || "border-border",
    textClass: stage?.textClass || "text-foreground",
  };
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

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy compatibility function for existing components
 */
export function findOpportunityLabel(
  _opportunityStages: { value: string; label: string }[],
  opportunityValue: string
): string {
  return getOpportunityStageLabel(opportunityValue);
}

// ============================================================================
// REACT ADMIN EXPORTS
// ============================================================================

/**
 * Export stages in format compatible with React Admin SelectInput choices
 */
export const OPPORTUNITY_STAGE_CHOICES = OPPORTUNITY_STAGES.map((stage) => ({
  id: stage.value,
  name: stage.label,
}));

/**
 * Export stages in legacy format for backward compatibility
 */
export const OPPORTUNITY_STAGES_LEGACY = OPPORTUNITY_STAGES.map((stage) => ({
  value: stage.value,
  label: stage.label,
}));
