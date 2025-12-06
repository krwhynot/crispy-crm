import { useState, useEffect, useCallback } from 'react';
import type { TutorialChapter, TutorialProgress } from './types';

const STORAGE_KEY = 'tutorial-progress';

const DEFAULT_PROGRESS: TutorialProgress = {
  currentChapter: null,
  currentStepIndex: 0,
  completedChapters: [],
  lastUpdated: new Date().toISOString(),
};

function loadProgress(): TutorialProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TutorialProgress;
    }
  } catch {
    // Fail silently, return default
  }
  return { ...DEFAULT_PROGRESS, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress: TutorialProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useTutorialProgress() {
  const [progress, setProgress] = useState<TutorialProgress>(loadProgress);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const setCurrentChapter = useCallback((chapter: TutorialChapter | null) => {
    setProgress((prev) => ({
      ...prev,
      currentChapter: chapter,
      currentStepIndex: 0,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const setCurrentStep = useCallback((stepIndex: number) => {
    setProgress((prev) => ({
      ...prev,
      currentStepIndex: stepIndex,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const markChapterComplete = useCallback((chapter: TutorialChapter) => {
    setProgress((prev) => {
      // Prevent duplicates
      if (prev.completedChapters.includes(chapter)) {
        return prev;
      }
      return {
        ...prev,
        completedChapters: [...prev.completedChapters, chapter],
        currentChapter: null,
        currentStepIndex: 0,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      ...DEFAULT_PROGRESS,
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  return {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    resetProgress,
  };
}
