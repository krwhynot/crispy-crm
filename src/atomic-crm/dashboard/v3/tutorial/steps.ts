import type { TutorialStep, TutorialVariant } from "./types";

/**
 * Step definitions for desktop and mobile variants.
 * Anchors map to elements tagged with data-tutorial attributes.
 */
export function getTutorialSteps(variant: TutorialVariant): TutorialStep[] {
  if (variant === "mobile") {
    return [
      {
        id: "welcome",
        targetId: "header",
        title: "Learn your dashboard",
        body: "Quick tour of the essentials. You can skip anytime.",
        ctaLabel: "Start",
        secondaryCtaLabel: "Skip",
      },
      {
        id: "kpis",
        targetId: "kpi-row",
        title: "Top health signals",
        body: "Open Opps, Overdue Tasks, Activities This Week, Stale Deals. Tap to jump to each list.",
        ctaLabel: "Next",
      },
      {
        id: "pipeline",
        targetId: "pipeline-table",
        title: "Pipeline by principal",
        body: "Search by name, sort columns, filter momentum. Tap a principal row to see its deals.",
        ctaLabel: "Next",
      },
      {
        id: "tasks-kanban",
        targetId: "tasks-kanban",
        title: "Move tasks fast",
        body: "Drag cards to Today/This Week to reschedule. Red badge shows overdue. Use New Task to add one.",
        ctaLabel: "Next",
      },
      {
        id: "performance",
        targetId: "my-performance",
        title: "Your week at a glance",
        body: "Trend arrows compare to last week: activities, deals moved, tasks done, open opps.",
        ctaLabel: "Next",
      },
      {
        id: "activity-feed",
        targetId: "activity-feed",
        title: "Team activity",
        body: "Recent calls, meetings, notes with who and when. Use View All for the full feed.",
        ctaLabel: "Next",
      },
      {
        id: "quick-bar",
        targetId: "quick-bar",
        title: "Log in one tap",
        body: "Use Check-In/Call/Meeting/Note to open the log sheet prefilled. Drafts auto-save.",
        ctaLabel: "Open log sheet",
        actionType: "log-activity",
      },
      {
        id: "task-sheet",
        targetId: "task-sheet",
        title: "Complete tasks here",
        body: "Use the sheet to mark tasks done quickly; overdue badge highlights urgent ones.",
        ctaLabel: "Finish",
      },
    ];
  }

  // Desktop/tablet default
  return [
    {
      id: "welcome",
      targetId: "header",
      title: "Learn your dashboard",
      body: "Fast tour of the essentials. You can skip anytime.",
      ctaLabel: "Start",
      secondaryCtaLabel: "Skip",
    },
    {
      id: "kpis",
      targetId: "kpi-row",
      title: "Top health signals",
      body: "Open Opps, Overdue Tasks, Activities This Week, Stale Deals. Click a card to jump to details.",
      ctaLabel: "Next",
    },
    {
      id: "pipeline",
      targetId: "pipeline-table",
      title: "Pipeline by principal",
      body: "Search principals, sort columns, filter by momentum. Click a row to drill into its deals.",
      ctaLabel: "Next",
    },
    {
      id: "drill-down",
      targetId: "pipeline-row",
      title: "See deals per principal",
      body: "Drill-down shows stage, amount, probability, and last activity. Open details to act.",
      ctaLabel: "Next",
      actionType: "drill-down",
    },
    {
      id: "tasks-kanban",
      targetId: "tasks-kanban",
      title: "Move tasks fast",
      body: "Drag tasks to Today/This Week to reschedule. Red badge = overdue. Use New Task to add one.",
      ctaLabel: "Next",
      actionType: "task-move",
    },
    {
      id: "performance",
      targetId: "my-performance",
      title: "Your week at a glance",
      body: "Trend arrows show change vs last week for activities, deals moved, tasks done, open opps.",
      ctaLabel: "Next",
    },
    {
      id: "activity-feed",
      targetId: "activity-feed",
      title: "Team activity",
      body: "Recent calls, meetings, notes, who logged them, and when. Click to view the full feed.",
      ctaLabel: "Next",
    },
    {
      id: "log-activity",
      targetId: "fab-log",
      title: "Log an activity quickly",
      body: "Open the sheet to log calls, meetings, samples. Drafts auto-save; Save & New logs in sequence.",
      ctaLabel: "Open log sheet",
      actionType: "log-activity",
    },
    {
      id: "finish",
      targetId: "header",
      title: "You’re set",
      body: "Replay anytime from Help. See Dashboard Usage guide for deeper tips.",
      ctaLabel: "Done",
    },
  ];
}
