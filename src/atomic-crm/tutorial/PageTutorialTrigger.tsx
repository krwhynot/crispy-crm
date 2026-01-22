import { useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTutorial } from "./TutorialProvider";
import type { TutorialChapter } from "./types";

interface PageTutorialTriggerProps {
  /** Tutorial chapter for this page (e.g., 'organizations', 'contacts') */
  chapter: TutorialChapter;
  /** Position of the help button (default: bottom-right) */
  position?: "bottom-right" | "bottom-left" | "top-right";
}

const POSITION_CLASSES = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-20 right-4", // Below header
} as const;

// Human-readable chapter names
const CHAPTER_LABELS: Record<TutorialChapter, string> = {
  organizations: "Organizations",
  contacts: "Contacts",
  opportunities: "Opportunities",
  activities: "Activities",
  tasks: "Tasks",
  products: "Products",
  notes: "Notes",
  users: "Users",
};

/**
 * Page-specific tutorial trigger component.
 *
 * Behavior:
 * - On first visit: Auto-starts tutorial after 500ms delay
 * - On subsequent visits: Shows a floating "?" help button
 * - Hidden during active tutorial
 */
export function PageTutorialTrigger({
  chapter,
  position = "bottom-left",
}: PageTutorialTriggerProps) {
  const { startTutorial, isActive, hasVisitedPage, markPageVisited } = useTutorial();
  const hasAutoTriggered = useRef(false);

  // First-visit auto-trigger
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    if (isActive) return;

    const alreadyVisited = hasVisitedPage(chapter);
    if (alreadyVisited) return;

    hasAutoTriggered.current = true;

    const timer = window.setTimeout(() => {
      // Mark visited ONLY when tutorial actually starts
      markPageVisited(chapter);
      startTutorial(chapter);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [chapter, hasVisitedPage, isActive, markPageVisited, startTutorial]);

  // Don't show button during active tutorial
  if (isActive) return null;

  return (
    <div className={`fixed ${POSITION_CLASSES[position]} z-50`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AdminButton
            variant="default"
            size="icon"
            onClick={() => startTutorial(chapter)}
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
            aria-label={`Start ${CHAPTER_LABELS[chapter]} tutorial`}
          >
            <HelpCircle className="h-5 w-5" />
          </AdminButton>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Learn about {CHAPTER_LABELS[chapter]}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
