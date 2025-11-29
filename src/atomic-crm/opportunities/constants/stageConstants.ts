/**
 * Centralized constants for food service opportunity pipeline stages
 * Replaces hardcoded stage definitions across components
 */

export interface OpportunityStage {
  value: string;
  label: string;
  color: string;
  description: string;
  elevation: 1 | 2 | 3; // Visual depth: 1=subtle, 2=medium, 3=prominent
}

export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",
    description:
      "New prospect identified. Research the operator's menu, identify which principal products fit, and prepare your pitch.",
    elevation: 3, // Prominent - new opportunities should stand out
  },
  {
    value: "initial_outreach",
    label: "Initial Outreach",
    color: "var(--tag-teal-bg)",
    description:
      "First contact made. Introduce MFB and relevant principals, qualify interest, and schedule a follow-up call or visit.",
    elevation: 2, // Medium - active engagement
  },
  {
    value: "sample_visit_offered",
    label: "Sample/Visit Offered",
    color: "var(--warning-subtle)",
    description:
      "Product sample sent or site visit scheduled. Follow up within 3-5 days to gather feedback—this is a critical stage.",
    elevation: 2, // Medium - active opportunity
  },
  {
    value: "feedback_logged",
    label: "Feedback Logged",
    color: "var(--tag-blue-bg)",
    description:
      "Operator feedback recorded. Evaluate fit, address concerns, and determine if a formal demo or pricing discussion is warranted.",
    elevation: 2, // Medium - active analysis
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    color: "var(--success-subtle)",
    description:
      "Final product demonstration or tasting scheduled. Confirm distributor availability and prepare pricing/terms for close.",
    elevation: 3, // Prominent - important milestone
  },
  {
    value: "closed_won",
    label: "Closed - Won",
    color: "var(--success-strong)",
    description:
      "Deal won! First purchase order placed. Ensure distributor authorization is active and hand off to account management.",
    elevation: 2, // Medium - completed but notable
  },
  {
    value: "closed_lost",
    label: "Closed - Lost",
    color: "var(--error-subtle)",
    description:
      "Opportunity lost. Review the loss reason and consider re-engagement after 90 days if circumstances change.",
    elevation: 1, // Subtle - less emphasis on lost deals
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

export function isActiveStage(stageValue: string): boolean {
  return !["closed_won", "closed_lost"].includes(stageValue);
}

export function isClosedStage(stageValue: string): boolean {
  return ["closed_won", "closed_lost"].includes(stageValue);
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
