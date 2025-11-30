import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTutorial } from "./TutorialProvider";

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useAnchorRect(targetId: string): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function update(scrollIntoView = false) {
      const el = document.querySelector<HTMLElement>(`[data-tutorial=\"${targetId}\"]`);
      if (!el) {
        setRect(null);
        return;
      }

      if (scrollIntoView) {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }

      const r = el.getBoundingClientRect();
      setRect({
        // Use viewport-relative coordinates for fixed positioning
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    }

    // Initial measure and scroll into view for the first render of a step
    update(true);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [targetId]);

  return rect;
}

function CoachMark({
  rect,
  title,
  body,
  showPrev,
  showNext,
  onPrev,
  onNext,
  onSkip,
  ctaLabel,
  secondaryCtaLabel,
  stepNumber,
  stepCount,
}: {
  rect: AnchorRect | null;
  title: string;
  body: string;
  showPrev: boolean;
  showNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  ctaLabel?: string;
  secondaryCtaLabel?: string;
  stepNumber: number;
  stepCount: number;
}) {
  const position = useMemo(() => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const estimatedCardHeight = 220;
    const margin = 12;

    if (!rect) {
      return { top: 120, left: viewportWidth / 2, translateX: "-50%" } as const;
    }

    // Default position below anchor, centered
    let top = rect.top + rect.height + margin;
    let left = rect.left + rect.width / 2;
    let translateX: "-50%" | 0 = "-50%";

    // If going below would overflow viewport, position above
    if (top + estimatedCardHeight > viewportHeight && rect.top > estimatedCardHeight) {
      top = rect.top - estimatedCardHeight - margin;
    }

    // Clamp left within viewport with padding
    const padding = 16;
    left = Math.min(Math.max(left, padding), viewportWidth - padding);
    // Clamp top within viewport
    top = Math.min(Math.max(top, padding), viewportHeight - estimatedCardHeight - padding);

    return { top, left, translateX };
  }, [rect]);

  return (
    <div
      className="fixed z-[70] max-w-sm rounded-lg border border-border bg-popover shadow-xl"
      style={{
        top: position.top,
        left: position.left,
        transform: position.translateX === "-50%" ? "translateX(-50%)" : undefined,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs text-muted-foreground">
        <span>
          Step {stepNumber} of {stepCount}
        </span>
        {secondaryCtaLabel && (
          <button
            type="button"
            onClick={onSkip}
            className="text-muted-foreground underline underline-offset-4"
          >
            {secondaryCtaLabel}
          </button>
        )}
      </div>
      <div className="px-4 pb-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={!showPrev}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
          <Button size="sm" onClick={onNext}>
            {ctaLabel || (showNext ? "Next" : "Done")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnchorHighlight({ rect }: { rect: AnchorRect | null }) {
  if (!rect) return null;
  return (
    <div
      className="pointer-events-none fixed z-[65] rounded-lg ring-2 ring-primary/80 ring-offset-2 ring-offset-background shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-all"
      style={{
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      }}
      aria-hidden="true"
    />
  );
}

export function TutorialOverlay() {
  const { state, nextStep, prevStep, skipTutorial } = useTutorial();
  const currentStep = state.steps[state.currentStepIndex];
  const rect = useAnchorRect(currentStep?.targetId ?? "");

  if (state.status !== "active" || !currentStep) return null;
  const container = typeof document !== "undefined" ? document.body : null;
  if (!container) return null;

  const isLast = state.currentStepIndex === state.steps.length - 1;

  return createPortal(
    <>
      {/* Backdrop to dim the rest of the UI */}
      <div className="fixed inset-0 z-[60] bg-black/30" aria-hidden="true" />
      <AnchorHighlight rect={rect} />
      <CoachMark
        rect={rect}
        title={currentStep.title}
        body={currentStep.body}
        ctaLabel={currentStep.ctaLabel}
        secondaryCtaLabel={currentStep.secondaryCtaLabel}
        showPrev={state.currentStepIndex > 0}
        showNext={!isLast}
        onPrev={prevStep}
        onNext={nextStep}
        onSkip={skipTutorial}
        stepNumber={state.currentStepIndex + 1}
        stepCount={state.steps.length}
      />
    </>,
    container
  );
}
