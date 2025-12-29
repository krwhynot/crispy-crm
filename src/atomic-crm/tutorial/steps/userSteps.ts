import type { TutorialStep } from "../types";

export const userSteps: TutorialStep[] = [
  {
    popover: {
      title: "Team Management",
      description:
        "Admin users can invite new team members here. New users receive an email to set their password.",
    },
  },
  {
    element: '[data-tutorial="sales-list"]',
    popover: {
      title: "Team Members",
      description: "View all team members and their roles.",
      side: "left",
    },
    navigateTo: "/sales",
  },
  {
    element: '[data-tutorial="create-sales-btn"]',
    popover: {
      title: "Invite User",
      description: "Click to invite a new team member.",
      side: "bottom",
    },
  },
  {
    popover: {
      title: "🎉 Tutorial Complete!",
      description:
        "Congratulations! You've completed the full CRM tutorial. You can replay any chapter from the Tutorial menu anytime.",
    },
  },
];
