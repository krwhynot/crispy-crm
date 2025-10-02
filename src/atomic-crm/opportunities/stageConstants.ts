/**
 * Centralized constants for food service opportunity pipeline stages
 * Replaces hardcoded stage definitions across components
 */

export interface OpportunityStage {
  value: string;
  label: string;
  color: string;
  description: string;
}

export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "awaiting_response"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",
    description: "Initial prospect identification",
  },
  {
    value: "initial_outreach",
    label: "Initial Outreach",
    color: "var(--teal)",
    description: "First contact and follow-up",
  },
  {
    value: "sample_visit_offered",
    label: "Sample/Visit Offered",
    color: "var(--warning-subtle)",
    description: "Product sampling and visit scheduling",
  },
  {
    value: "awaiting_response",
    label: "Awaiting Response",
    color: "var(--purple)",
    description: "Following up after sample delivery",
  },
  {
    value: "feedback_logged",
    label: "Feedback Logged",
    color: "var(--blue)",
    description: "Recording customer feedback",
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    color: "var(--success-subtle)",
    description: "Planning product demonstrations",
  },
  {
    value: "closed_won",
    label: "Closed - Won",
    color: "var(--success-strong)",
    description: "Successful deal completion",
  },
  {
    value: "closed_lost",
    label: "Closed - Lost",
    color: "var(--error-subtle)",
    description: "Lost opportunity",
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

export function isActiveStage(stageValue: string): boolean {
  return !["closed_won", "closed_lost"].includes(stageValue);
}

export function isClosedStage(stageValue: string): boolean {
  return ["closed_won", "closed_lost"].includes(stageValue);
}

// Legacy compatibility function for existing components
export function findOpportunityLabel(
  opportunityStages: { value: string; label: string }[],
  opportunityValue: string,
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
