import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { getTutorialSteps } from "./steps";
import { clearPersistedState, loadPersistedState, savePersistedState, shouldAutoStart } from "./storage";
import type { TutorialStep, TutorialStatus, TutorialVariant } from "./types";

interface TutorialState {
  status: TutorialStatus;
  currentStepIndex: number;
  variant: TutorialVariant;
  steps: TutorialStep[];
}

type TutorialAction =
  | { type: "START"; variant: TutorialVariant; steps: TutorialStep[] }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GOTO"; index: number }
  | { type: "SKIP" }
  | { type: "COMPLETE" };

const TutorialContext = createContext<{
  state: TutorialState;
  startTutorial: (opts?: { replay?: boolean }) => void;
  skipTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  markActionComplete: (actionType: TutorialStep["actionType"]) => void;
  resumeFromLast: () => void;
} | null>(null);

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case "START":
      return {
        status: "active",
        currentStepIndex: 0,
        variant: action.variant,
        steps: action.steps,
      };
    case "NEXT": {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.steps.length - 1);
      const isComplete = nextIndex === state.steps.length - 1 && state.currentStepIndex === nextIndex;
      return {
        ...state,
        status: isComplete ? "completed" : "active",
        currentStepIndex: isComplete ? nextIndex : nextIndex,
      };
    }
    case "PREV":
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1) };
    case "GOTO":
      return { ...state, currentStepIndex: Math.min(action.index, state.steps.length - 1) };
    case "SKIP":
      return { ...state, status: "skipped" };
    case "COMPLETE":
      return { ...state, status: "completed" };
    default:
      return state;
  }
}

function detectVariant(): TutorialVariant {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 1023px)").matches ? "mobile" : "desktop";
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<TutorialVariant>(detectVariant);
  const steps = useMemo(() => getTutorialSteps(variant), [variant]);

  const [state, dispatch] = useReducer(tutorialReducer, {
    status: "idle",
    currentStepIndex: 0,
    variant,
    steps,
  });

  // Keep variant in sync on resize
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const listener = () => setVariant(media.matches ? "mobile" : "desktop");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (state.status === "idle") return;
    const currentStep = state.steps[state.currentStepIndex];
    savePersistedState({
      status: state.status === "active" ? "started" : state.status,
      lastStep: currentStep?.id ?? null,
      lastActionStep: currentStep?.actionType ?? null,
      variant: state.variant,
      updatedAt: Date.now(),
    });
  }, [state]);

  const startTutorial = useCallback(
    (opts?: { replay?: boolean }) => {
      const replay = opts?.replay === true;
      if (!replay && !shouldAutoStart(variant)) {
        return;
      }
      if (replay) {
        clearPersistedState();
      }
      dispatch({ type: "START", variant, steps });
    },
    [steps, variant]
  );

  const skipTutorial = useCallback(() => {
    dispatch({ type: "SKIP" });
  }, []);

  const nextStep = useCallback(() => {
    const isLast = state.currentStepIndex >= state.steps.length - 1;
    dispatch({ type: isLast ? "COMPLETE" : "NEXT" });
  }, [state.currentStepIndex, state.steps.length]);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV" });
  }, []);

  const markActionComplete = useCallback(
    (actionType: TutorialStep["actionType"]) => {
      const currentStep = state.steps[state.currentStepIndex];
      if (!currentStep || !actionType || currentStep.actionType !== actionType) {
        return;
      }
      nextStep();
    },
    [nextStep, state.steps, state.currentStepIndex]
  );

  const resumeFromLast = useCallback(() => {
    const persisted = loadPersistedState();
    if (!persisted) return;
    const stepIndex = steps.findIndex((s) => s.id === persisted.lastStep);
    dispatch({
      type: "START",
      variant,
      steps,
    });
    if (stepIndex > 0) {
      dispatch({ type: "GOTO", index: stepIndex });
    }
  }, [steps, variant]);

  // Auto-start on mount if allowed
  useEffect(() => {
    if (shouldAutoStart(variant)) {
      startTutorial();
    }
  }, [startTutorial, variant]);

  return (
    <TutorialContext.Provider
      value={{
        state: { ...state, variant, steps },
        startTutorial,
        skipTutorial,
        nextStep,
        prevStep,
        markActionComplete,
        resumeFromLast,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return ctx;
}
