import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, type Driver, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useTutorialProgress } from './useTutorialProgress';
import { waitForElement } from './waitForElement';
import { getAllSteps, getChapterSteps } from './steps';
import type { TutorialChapter, TutorialProgress } from './types';

interface TutorialContextType {
  startTutorial: (chapter?: TutorialChapter) => void;
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
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);
  const [isActive, setIsActive] = useState(false);
  const currentStepIndexRef = useRef(0);
  const totalStepsRef = useRef(0);

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

  const startTutorial = useCallback(
    (chapter?: TutorialChapter) => {
      // Stop any existing tour
      stopTutorial();

      // Get steps for chapter or full tour
      const steps = chapter ? getChapterSteps(chapter) : getAllSteps();

      if (steps.length === 0) {
        console.warn('No tutorial steps found');
        return;
      }

      totalStepsRef.current = steps.length;
      currentStepIndexRef.current = 0;

      // Set current chapter in progress
      setCurrentChapter(chapter ?? 'organizations');

      // Configure Driver.js
      const config: Config = {
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        allowKeyboardControl: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        popoverClass: 'tutorial-popover',
        // Explicitly configure buttons - MUST include all button types
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done ✓',
        // Customize popover for last step to ensure Done button is clickable
        onPopoverRender: (popover, { state }) => {
          // On the last step, manually wire up the Done button
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
        steps: steps.map((step, index) => ({
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side,
            align: step.popover.align,
          },
          onHighlightStarted: async () => {
            // Get current path fresh (not stale from closure)
            const currentPath = window.location.pathname;

            // Navigate if needed
            if (step.navigateTo && currentPath !== step.navigateTo) {
              navigate(step.navigateTo);
            }

            // Always wait for the element (handles both navigation and slow React renders)
            if (step.element) {
              try {
                await waitForElement(step.element);
              } catch (error) {
                console.warn(`Tutorial step ${index}: Element not found`, step.element);
              }
            }

            setCurrentStep(index);
            currentStepIndexRef.current = index;
          },
        })),
        onDestroyStarted: () => {
          const reachedFinalStep = currentStepIndexRef.current >= totalStepsRef.current - 1;

          if (chapter && driverRef.current && reachedFinalStep) {
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
    [
      stopTutorial,
      setCurrentChapter,
      setCurrentStep,
      markChapterComplete,
      navigate,
      location.pathname,
    ]
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
