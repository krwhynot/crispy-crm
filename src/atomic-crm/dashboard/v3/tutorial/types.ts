export type TutorialVariant = "desktop" | "mobile";

export type TutorialStatus = "idle" | "active" | "completed" | "skipped";

export interface TutorialStep {
  id: string;
  targetId: string; // data-tutorial anchor id
  title: string;
  body: string;
  ctaLabel?: string;
  secondaryCtaLabel?: string;
  // Whether the step can complete via an action (e.g., logging an activity)
  actionType?: "log-activity" | "task-move" | "task-complete" | "drill-down";
}

export interface TutorialPersistedState {
  status: "started" | "completed" | "skipped";
  lastStep: string | null;
  lastActionStep?: string | null;
  variant: TutorialVariant;
  updatedAt: number;
}
