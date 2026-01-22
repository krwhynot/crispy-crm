import { useRef, useCallback, useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DASHBOARD_TUTORIAL_STEPS } from "./dashboardTutorialSteps";

/**
 * Standalone floating tutorial button for the Principal Dashboard.
 *
 * Features:
 * - Fixed bottom-left position (44x44px touch target)
 * - Click-only trigger (no auto-start)
 * - No TutorialProvider context dependency
 * - No progress persistence
 * - Covers all dashboard sections via Driver.js tour
 *
 * Follows the same pattern as ContactFormTutorial.tsx
 */
export function DashboardTutorial() {
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  const startTutorial = useCallback(() => {
    // Destroy any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    setIsActive(true);

    // Create new Driver.js instance
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.75,
      popoverClass: "tutorial-popover",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      steps: DASHBOARD_TUTORIAL_STEPS,
      onDestroyStarted: () => {
        // Cleanup on close
        setIsActive(false);
        driverRef.current?.destroy();
        driverRef.current = null;
      },
    });

    driverRef.current.drive();
  }, []);

  // Hide button while tutorial is active
  if (isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label="Start dashboard tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Learn about the dashboard</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
