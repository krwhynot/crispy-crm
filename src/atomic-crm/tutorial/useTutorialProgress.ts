import { useState, useEffect, useCallback } from 'react';
import type { TutorialChapter, TutorialProgress } from './types';

const STORAGE_KEY = 'tutorial-progress';

const DEFAULT_PROGRESS: TutorialProgress = {
  currentChapter: null,
  currentStepIndex: 0,
  completedChapters: [],
  visitedPages: [],
  lastUpdated: new Date().toISOString(),
};

function loadProgress(): TutorialProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle migration for existing users without visitedPages
      return {
        ...parsed,
        visitedPages: parsed.visitedPages ?? [],
      } as TutorialProgress;
    }
  } catch {
    // Fail silently, return default
  }
  return { ...DEFAULT_PROGRESS, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress: TutorialProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Safari private mode, quota exceeded, or disabled localStorage
    console.warn('Failed to save tutorial progress:', error);
  }
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

  // Check if a page has been visited (for first-visit detection)
  const hasVisitedPage = useCallback(
    (chapter: TutorialChapter) => {
      return progress.visitedPages.includes(chapter);
    },
    [progress.visitedPages]
  );

  // Mark a page as visited (prevents auto-trigger on subsequent visits)
  const markPageVisited = useCallback((chapter: TutorialChapter) => {
    setProgress((prev) => {
      // Prevent duplicates
      if (prev.visitedPages.includes(chapter)) {
        return prev;
      }
      return {
        ...prev,
        visitedPages: [...prev.visitedPages, chapter],
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  return {
    progress,
    setCurrentChapter,
    setCurrentStep,
    markChapterComplete,
    resetProgress,
    hasVisitedPage,
    markPageVisited,
  };
}
