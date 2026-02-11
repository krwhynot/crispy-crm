import type { DriveStep } from "driver.js";

/**
 * Dashboard tutorial steps covering:
 * 1. KPI Summary Row (4 metric cards)
 * 2. Pipeline Tab (Principal pipeline table, drill-down)
 * 3. My Tasks Tab (Kanban board, snooze, complete)
 * 4. Performance Tab (My performance widget)
 * 5. Team Activity Tab (Activity feed)
 * 6. Quick Actions (Log Activity FAB)
 *
 * Uses Driver.js DriveStep format with data-tutorial selectors
 */
export const DASHBOARD_TUTORIAL_STEPS: DriveStep[] = [
  // Welcome/Intro step (no element target)
  {
    popover: {
      title: "Welcome to Your Dashboard",
      description:
        "This is your command center for tracking sales performance. Let's walk through each section so you can make the most of it.",
    },
  },

  // === KPI Summary Row ===
  {
    element: '[data-tutorial="dashboard-kpi-row"]',
    popover: {
      title: "Key Metrics at a Glance",
      description:
        "These four cards show your most important metrics: Open Opportunities, Overdue Tasks, Team Activities, and Stale Deals. Click any card to see the filtered list.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tutorial="dashboard-kpi-open-opportunities"]',
    popover: {
      title: "Open Opportunities",
      description:
        "The total count of active deals in your pipeline. Click to view all opportunities that aren't closed yet.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="dashboard-kpi-overdue-tasks"]',
    popover: {
      title: "Overdue Tasks",
      description:
        "Tasks past their due date show in red. Zero overdue tasks means you're on top of your follow-ups!",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tutorial="dashboard-kpi-activities"]',
    popover: {
      title: "Team Activities",
      description:
        "Team-wide activity count for the week. Aim for 10+ activities per week per principal to keep deals moving.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tutorial="dashboard-kpi-stale-deals"]',
    popover: {
      title: "Stale Deals",
      description:
        "Deals without recent activity show in amber. These need attention to prevent them from going cold.",
      side: "bottom",
      align: "end",
    },
  },

  // === Tab Navigation ===
  {
    element: '[data-tutorial="dashboard-tabs"]',
    popover: {
      title: "Dashboard Sections",
      description:
        "Switch between Pipeline, Tasks, Performance, and Team Activity. Each tab gives you a different view of your sales data.",
      side: "bottom",
      align: "start",
    },
  },

  // === Pipeline Tab ===
  {
    element: '[data-tutorial="dashboard-tab-pipeline"]',
    popover: {
      title: "Pipeline Tab",
      description: "Your default view. See opportunity momentum across all principals at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tutorial="dashboard-pipeline-table"]',
    popover: {
      title: "Pipeline by Principal",
      description:
        "Each row shows a principal with their pipeline count, weekly activity, and momentum indicator. Click any row to drill down into specific opportunities.",
      side: "top",
      align: "center",
    },
  },

  // === My Tasks Tab ===
  {
    element: '[data-tutorial="dashboard-tab-tasks"]',
    popover: {
      title: "My Tasks Tab",
      description:
        "Your personal task manager. The badge shows how many pending tasks need attention.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tutorial="dashboard-tasks-kanban"]',
    popover: {
      title: "Task Kanban Board",
      description:
        "Tasks are organized by urgency: Overdue (red), Today, and This Week. Drag tasks between columns to reschedule them.",
      side: "top",
      align: "center",
    },
  },

  // === Performance Tab ===
  {
    element: '[data-tutorial="dashboard-tab-performance"]',
    popover: {
      title: "Performance Tab",
      description: "Track your personal performance metrics and compare week-over-week progress.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tutorial="dashboard-performance-widget"]',
    popover: {
      title: "My Performance",
      description:
        "See your activities logged, deals moved, tasks completed, and open opportunities. Green arrows mean you're improving!",
      side: "top",
      align: "center",
    },
  },

  // === Team Activity Tab ===
  {
    element: '[data-tutorial="dashboard-tab-activity"]',
    popover: {
      title: "Team Activity Tab",
      description:
        "See what your teammates are working on. Great for staying in sync and learning from each other.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tutorial="dashboard-activity-feed"]',
    popover: {
      title: "Activity Feed",
      description:
        "Recent activities across the team, showing who did what and when. Click 'View All' for the complete history.",
      side: "top",
      align: "center",
    },
  },

  // === Quick Actions ===
  {
    element: '[data-tutorial="dashboard-log-activity"]',
    popover: {
      title: "Log Activity (FAB)",
      description:
        "The floating action button in the bottom-right corner. Click it to quickly log calls, emails, or meetings without leaving the dashboard.",
      side: "left",
      align: "center",
    },
  },

  // Outro step (no element target)
  {
    popover: {
      title: "You're Ready!",
      description:
        "That's the dashboard tour! Remember: check your KPIs daily, keep tasks current, and log activities regularly. Happy selling!",
    },
  },
];
