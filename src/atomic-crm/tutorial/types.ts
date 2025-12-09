export type TutorialChapter =
  | "organizations"
  | "contacts"
  | "opportunities"
  | "activities"
  | "tasks"
  | "products"
  | "notes"
  | "users";

export interface TutorialProgress {
  currentChapter: TutorialChapter | null;
  currentStepIndex: number;
  completedChapters: TutorialChapter[];
  visitedPages: TutorialChapter[]; // Pages user has seen (for first-visit detection)
  lastUpdated: string; // ISO date
}

export interface TutorialStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  };
  navigateTo?: string; // Route to navigate before this step
}
