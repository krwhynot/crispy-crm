import type { TutorialStep } from "../types";

export const activitySteps: TutorialStep[] = [
  {
    popover: {
      title: "Activity Logging",
      description:
        "Activities track your interactions - calls, emails, meetings, and samples. Aim for 10+ activities per week per Principal!",
    },
  },
  {
    element: '[data-tutorial="activities-list"]',
    popover: {
      title: "Activity History",
      description: "View all logged activities here.",
      side: "left",
    },
    navigateTo: "/activities",
  },
  {
    element: '[data-tutorial="log-activity-fab"]',
    popover: {
      title: "Quick Log Activity",
      description:
        "Use this floating button to log activities from anywhere. Opens a quick dialog for 30-second logging!",
      side: "left",
    },
    navigateTo: "/",
  },
  {
    popover: {
      title: "Activity Dialog",
      description:
        "The quick log dialog lets you select type (Call, Email, Meeting, etc.), add notes, and link to contacts/opportunities.",
    },
  },
  {
    popover: {
      title: "✅ Activities Complete!",
      description: "You've learned quick activity logging. Next, let's look at task management.",
    },
  },
];
