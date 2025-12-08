import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useTutorialProgress } from './useTutorialProgress';
import { waitForElement } from './waitForElement';
import { getChapterSteps } from './steps';
import type { TutorialChapter, TutorialProgress, TutorialStep } from './types';

interface TutorialContextType {
  startTutorial: (chapter: TutorialChapter) => void;
  stopTutorial: () => void;
  isActive: boolean;
  progress: TutorialProgress;
  hasVisitedPage: (chapter: TutorialChapter) => boolean;
  markPageVisited: (chapter: TutorialChapter) => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const navigate = useNavigate();
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);
  const currentStepIndexRef = useRef(0);
  const totalStepsRef = useRef(0);
  const stepsRef = useRef<TutorialStep[]>([]);

  const {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    hasVisitedPage,
    markPageVisited,
  } = useTutorialProgress();

  const stopTutorial = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsActive(false);
    setCurrentChapter(null);
  }, [setCurrentChapter]);

  /**
   * Navigate to a step's target page and wait for its element to appear.
   * Returns true if element is ready, false if not found.
   */
  const prepareStep = useCallback(
    async (step: TutorialStep): Promise<boolean> => {
      const currentPath = window.location.pathname;

      // Navigate if needed
      if (step.navigateTo && currentPath !== step.navigateTo) {
        navigate(step.navigateTo);
        // Give React Router time to start the transition
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Wait for the element if this step has one
      if (step.element) {
        try {
          await waitForElement(step.element, 8000); // 8 second timeout
          return true;
        } catch (_error) {
          console.warn(`Tutorial: Element not found: ${step.element}`);
          return false;
        }
      }

      return true; // Steps without elements (like completion screens) are always ready
    },
    [navigate]
  );

  const startTutorial = useCallback(
    async (chapter: TutorialChapter) => {
      // Stop any existing tour
      stopTutorial();

      // Get steps for the specified chapter
      const steps = getChapterSteps(chapter);

      if (steps.length === 0) {
        console.warn('No tutorial steps found');
        return;
      }

      totalStepsRef.current = steps.length;
      currentStepIndexRef.current = 0;
      stepsRef.current = steps;

      // Set current chapter in progress
      setCurrentChapter(chapter);

      // Prepare the FIRST step before starting (navigate + wait for element)
      const firstStepReady = await prepareStep(steps[0]);
      if (!firstStepReady) {
        console.warn('Tutorial: First step element not found, aborting');
        return;
      }

      // Configure Driver.js
      const config: Config = {
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        popoverClass: 'tutorial-popover',
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done ✓',

        // Handle navigation BEFORE step advances
        onNextClick: async () => {
          const currentIndex = currentStepIndexRef.current;
          const nextIndex = currentIndex + 1;

          // If we're on the last step, destroy the tour
          if (nextIndex >= steps.length) {
            if (driverRef.current) {
              driverRef.current.destroy();
            }
            return;
          }

          const nextStep = steps[nextIndex];

          // Prepare the next step (navigate + wait for element)
          const stepReady = await prepareStep(nextStep);

          if (stepReady && driverRef.current) {
            // Update tracking
            currentStepIndexRef.current = nextIndex;
            setCurrentStep(nextIndex);

            // Now move to the next step - element should be ready
            driverRef.current.moveNext();
          } else {
            // Element not found - skip this step and try the next
            console.warn(`Skipping step ${nextIndex}: element not ready`);
            currentStepIndexRef.current = nextIndex;
            if (driverRef.current) {
              driverRef.current.moveNext();
            }
          }
        },

        // Handle back button similarly
        onPrevClick: async () => {
          const currentIndex = currentStepIndexRef.current;
          const prevIndex = currentIndex - 1;

          if (prevIndex < 0) return;

          const prevStep = steps[prevIndex];
          await prepareStep(prevStep);

          currentStepIndexRef.current = prevIndex;
          setCurrentStep(prevIndex);

          if (driverRef.current) {
            driverRef.current.movePrevious();
          }
        },

        // Handle close button - required when custom handlers are defined
        onCloseClick: () => {
          if (driverRef.current) {
            driverRef.current.destroy();
          }
        },

        // Customize popover for last step
        onPopoverRender: (popover, { state }) => {
          const isLastStep = state.activeIndex === steps.length - 1;
          if (isLastStep) {
            const nextBtn = popover.wrapper.querySelector('.driver-popover-next-btn');
            if (nextBtn) {
              nextBtn.textContent = 'Done ✓';
              (nextBtn as HTMLButtonElement).onclick = () => {
                if (driverRef.current) {
                  driverRef.current.destroy();
                }
              };
            }
          }
        },

        steps: steps.map((step) => ({
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side,
            align: step.popover.align,
          },
        })),

        onDestroyStarted: () => {
          const reachedFinalStep = currentStepIndexRef.current >= totalStepsRef.current - 1;
          if (driverRef.current && reachedFinalStep) {
            markChapterComplete(chapter);
          }
        },

        onDestroyed: () => {
          setIsActive(false);
          driverRef.current = null;
        },
      };

      // Create and start driver
      try {
        driverRef.current = driver(config);
        setIsActive(true);
        driverRef.current.drive();
      } catch (error) {
        console.error('Failed to initialize tutorial:', error);
        setIsActive(false);
        driverRef.current = null;
      }
    },
    [stopTutorial, setCurrentChapter, setCurrentStep, markChapterComplete, prepareStep]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        startTutorial,
        stopTutorial,
        isActive,
        progress,
        hasVisitedPage,
        markPageVisited,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextType {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
