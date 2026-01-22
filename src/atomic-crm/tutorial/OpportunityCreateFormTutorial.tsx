import { useRef, useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { driver, type Driver, type Config } from "driver.js";
import "driver.js/dist/driver.css";
import { AdminButton } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { opportunityCreateFormSteps } from "./steps/opportunityCreateFormSteps";
import { waitForElement, filterValidSteps } from "./waitForElement";

/**
 * Standalone floating tutorial button for the Opportunity Create form.
 *
 * Key differences from PageTutorialTrigger:
 * - Does NOT use TutorialProvider/useTutorial context
 * - No auto-start on first visit (click-only trigger)
 * - Page-specific: Only renders on /opportunities/create
 * - Uses create-form-only steps (no cross-page navigation)
 * - No progress persistence
 */
export function OpportunityCreateFormTutorial() {
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Only render on /opportunities/create
  const isCreatePage = location.pathname === "/opportunities/create";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  const startTutorial = useCallback(async () => {
    // Destroy any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    // Filter to only steps with existing elements
    const validSteps = filterValidSteps(opportunityCreateFormSteps);

    // For the first step with an element, wait for it to be ready
    const firstElementStep = validSteps.find((s) => s.element);
    if (firstElementStep?.element) {
      try {
        await waitForElement(firstElementStep.element, 3000);
      } catch {
        console.warn("Tutorial: First element not found, starting anyway");
      }
    }

    const config: Config = {
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayColor: "var(--overlay)",
      popoverClass: "tutorial-popover",
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Got it!",

      steps: validSteps.map((step) => ({
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.side,
          align: step.popover.align,
        },
      })),

      onDestroyed: () => {
        setIsActive(false);
        driverRef.current = null;
      },
    };

    try {
      driverRef.current = driver(config);
      setIsActive(true);
      driverRef.current.drive();
    } catch (error: unknown) {
      console.error("Failed to start create form tutorial:", error);
      setIsActive(false);
      driverRef.current = null;
    }
  }, []);

  // Don't render if not on create page or if tutorial is active
  if (!isCreatePage || isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={startTutorial}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label="Start form tutorial"
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Learn about this form</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
