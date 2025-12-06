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

      // Set current chapter in progress
      setCurrentChapter(chapter ?? 'organizations');

      // Configure Driver.js
      const config: Config = {
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        popoverClass: 'tutorial-popover',
        steps: steps.map((step, index) => ({
          element: step.element,
          popover: {
            title: step.popover.title,
            description: step.popover.description,
            side: step.popover.side,
            align: step.popover.align,
          },
          onHighlightStarted: async () => {
            // Navigate if needed
            if (step.navigateTo && location.pathname !== step.navigateTo) {
              navigate(step.navigateTo);
              if (step.element) {
                await waitForElement(step.element);
              }
            }
            setCurrentStep(index);
          },
        })),
        onDestroyStarted: () => {
          // Check if tour was completed (last step)
          if (chapter && driverRef.current) {
            markChapterComplete(chapter);
          }
        },
        onDestroyed: () => {
          setIsActive(false);
          driverRef.current = null;
        },
      };

      // Create and start driver
      driverRef.current = driver(config);
      setIsActive(true);
      driverRef.current.drive();
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
