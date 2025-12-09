import type { TutorialStep } from "../types";

export const taskSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-tasks"]',
    popover: {
      title: "Tasks",
      description: "Manage your to-do list and follow-ups here.",
      side: "bottom",
    },
  },
  {
    element: '[data-tutorial="tasks-list"]',
    popover: {
      title: "Task List",
      description: "See all your tasks. Overdue tasks are highlighted in red.",
      side: "left",
    },
    navigateTo: "/tasks",
  },
  {
    element: '[data-tutorial="create-task-btn"]',
    popover: {
      title: "Add New Task",
      description: "Let's create a follow-up task.",
      side: "bottom",
    },
  },
  {
    element: '[data-tutorial="task-title"]',
    popover: {
      title: "Task Title",
      description: "What needs to be done? Be specific.",
      side: "right",
    },
    navigateTo: "/tasks/create",
  },
  {
    element: '[data-tutorial="task-due-date"]',
    popover: {
      title: "Due Date",
      description: "When should this be completed? Defaults to today.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="task-save-btn"]',
    popover: {
      title: "Save Task",
      description: "Click Save to create the task.",
      side: "top",
    },
  },
  {
    popover: {
      title: "✅ Tasks Complete!",
      description: "Task management done! Now let's look at Products.",
    },
  },
];
