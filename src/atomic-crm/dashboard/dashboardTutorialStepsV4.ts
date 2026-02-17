import type { DriveStep } from "driver.js";

/**
 * Dashboard V4 tutorial steps for the 3-column scrollable layout.
 *
 * Step order follows left-to-right, top-to-bottom visual scan:
 *   Row 1: KPIs (left) → Pipeline (center) → Tasks (right)
 *   Row 2: Performance (left) → Activity (center)
 *
 * V4 differences from V3:
 * - No tabs (removed dashboard-tabs, dashboard-tab-pipeline, dashboard-tab-tasks)
 * - No widget row (removed dashboard-widget-row)
 * - No kanban (replaced dashboard-tasks-kanban with dashboard-tasks-list)
 * - No FAB (removed dashboard-log-activity — never existed)
 * - Added dashboard-tasks-list selector
 *
 * Uses Driver.js DriveStep format with data-tutorial selectors
 */
export const DASHBOARD_TUTORIAL_STEPS_V4: DriveStep[] = [
  // 1. Welcome/Intro (no element target)
  {
    popover: {
      title: "Welcome to Your Dashboard",
      description:
        "This is your command center for tracking sales performance. Let's walk through each section so you can make the most of it.",
    },
  },

  // === Row 1, Left: KPI Summary Row ===

  // 2. KPI overview
  {
    element: '[data-tutorial="dashboard-kpi-row"]',
    popover: {
      title: "Key Metrics at a Glance",
      description:
        "These four cards show your most important metrics: Open Opportunities, Overdue Tasks, Team Activities, and Stale Deals. Click any card to see the filtered list.",
      side: "right",
      align: "center",
    },
  },
  // 3. Open Opportunities KPI
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
  // 4. Overdue Tasks KPI
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
  // 5. Team Activities KPI
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
  // 6. Stale Deals KPI
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

  // === Row 1, Center: Pipeline Table ===

  // 7. Pipeline table
  {
    element: '[data-tutorial="dashboard-pipeline-table"]',
    popover: {
      title: "Pipeline by Principal",
      description:
        "Each row shows a principal with their pipeline count, weekly activity, and momentum indicator. Click any row to drill down into specific opportunities.",
      side: "left",
      align: "center",
    },
  },

  // === Row 1, Right: Tasks List ===

  // 8. My Tasks
  {
    element: '[data-tutorial="dashboard-tasks-list"]',
    popover: {
      title: "My Tasks",
      description:
        "Your personal task list organized by urgency: Overdue, Today, and This Week. Check tasks off, postpone them, or click to view details.",
      side: "left",
      align: "center",
    },
  },

  // === Row 2, Left: Performance ===

  // 9. My Performance
  {
    element: '[data-tutorial="dashboard-compact-performance"]',
    popover: {
      title: "My Performance",
      description:
        "Your personal metrics: activities logged, deals moved, tasks completed, and open opportunities — with trend arrows vs. last week.",
      side: "right",
      align: "center",
    },
  },

  // === Row 2, Center: Activity Feed ===

  // 10. Team Activity
  {
    element: '[data-tutorial="dashboard-compact-activity"]',
    popover: {
      title: "Team Activity",
      description:
        "A live feed of recent team activities. See what your colleagues are working on and stay in sync.",
      side: "top",
      align: "center",
    },
  },

  // 11. Outro (no element target)
  {
    popover: {
      title: "You're Ready!",
      description:
        "That's the dashboard tour! Remember: check your KPIs daily, keep tasks current, and log activities regularly. Happy selling!",
    },
  },
];
