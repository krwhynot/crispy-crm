import { useRef, useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Tutorial steps for the Opportunities Pipeline.
 * Guides users through view options, filters, pipeline stages, and card interactions.
 */
const PIPELINE_TUTORIAL_STEPS: DriveStep[] = [
  // 1. Intro
  {
    popover: {
      title: "🎯 Welcome to the Pipeline",
      description:
        "This is your sales pipeline - track deals from lead to close. Let me show you around!",
    },
  },
  // 2. View Switcher
  {
    element: '[data-tutorial="opp-view-switcher"]',
    popover: {
      title: "View Options",
      description:
        "Switch between Kanban board (drag & drop), List view (table), or Campaign view (grouped).",
      side: "bottom",
      align: "start",
    },
  },
  // 3. Filter Sidebar
  {
    element: '[data-tutorial="opp-filters"]',
    popover: {
      title: "Filter Your Pipeline",
      description:
        "Use Quick Filters for common views, or filter by Stage, Priority, Principal, Customer, Campaign, or Owner.",
      side: "right",
      align: "start",
    },
  },
  // 4. Quick Filters
  {
    element: '[data-tutorial="opp-quick-filters"]',
    popover: {
      title: "Quick Filters",
      description:
        '"My Opportunities", "Closing This Month", "High Priority", "Needs Action", and "Recent Wins" - one click away.',
      side: "right",
      align: "start",
    },
  },
  // 5. Stage Filters
  {
    element: '[data-tutorial="opp-stage-filters"]',
    popover: {
      title: "Filter by Stage",
      description: "Toggle stages on/off to focus on specific parts of your pipeline.",
      side: "right",
      align: "start",
    },
  },
  // 6. Pipeline Columns
  {
    element: '[data-tutorial="opp-kanban-board"]',
    popover: {
      title: "Pipeline Stages",
      description:
        "7 stages from New Lead to Closed. Each column shows count, avg days, and stuck deals.",
      side: "top",
      align: "center",
    },
  },
  // 7. Opportunity Card
  {
    element: '[data-tutorial="opp-card"]',
    popover: {
      title: "Opportunity Cards",
      description:
        "Each card shows deal name, activity status (green/yellow/red dot), and key details. Click to expand.",
      side: "left",
      align: "start",
    },
  },
  // 8. Card Drag Handle
  {
    element: '[data-tutorial="opp-drag-handle"]',
    popover: {
      title: "Drag & Drop",
      description:
        "Grab the handle to drag deals between stages. Moving to Closed stages prompts for win/loss reason.",
      side: "right",
      align: "start",
    },
  },
  // 9. Quick Add Button
  {
    element: '[data-tutorial="opp-quick-add"]',
    popover: {
      title: "Quick Add",
      description: "Rapidly add new opportunities without leaving the pipeline.",
      side: "bottom",
      align: "end",
    },
  },
  // 10. Export Button
  {
    element: '[data-tutorial="opp-export"]',
    popover: {
      title: "Export Data",
      description: "Export your pipeline to CSV for reports or principal reviews.",
      side: "bottom",
      align: "end",
    },
  },
  // 11. Create Button
  {
    element: '[data-tutorial="create-opportunity-btn"]',
    popover: {
      title: "New Opportunity",
      description: "Open the full form to create a detailed opportunity with all fields.",
      side: "bottom",
      align: "end",
    },
  },
  // 12. Completion
  {
    popover: {
      title: "✅ Ready to Sell!",
      description:
        "You now know how to navigate the pipeline. Click the ? button anytime to replay this tour.",
    },
  },
];

/**
 * Standalone tutorial component for the Opportunities List/Pipeline page.
 * Displays a floating help button that triggers a Driver.js tutorial
 * walking users through the pipeline view, filters, and card interactions.
 *
 * Only renders on the /opportunities page (where OpportunityList mounts this).
 * Does NOT integrate with the chapter/progress system - fully standalone.
 */
export function OpportunityListTutorial() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTutorial = useCallback(() => {
    // Clean up any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    // Create new Driver.js instance
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.75,
      popoverClass: "tutorial-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      steps: PIPELINE_TUTORIAL_STEPS,
      onDestroyStarted: () => {
        // Cleanup on close
        driverRef.current?.destroy();
        driverRef.current = null;
      },
    });

    driverRef.current.drive();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label="Start pipeline tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Learn to use the pipeline</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
