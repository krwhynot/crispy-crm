import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import type { TutorialChapter, TutorialProgress } from "./types";
import { getStorageItem, setStorageItem } from "../utils/secureStorage";

const STORAGE_KEY = "tutorial-progress";

const DEFAULT_PROGRESS: TutorialProgress = {
  currentChapter: null,
  currentStepIndex: 0,
  completedChapters: [],
  visitedPages: [],
  lastUpdated: new Date().toISOString(),
};

const tutorialChapterSchema = z.enum([
  "organizations",
  "contacts",
  "opportunities",
  "activities",
  "tasks",
  "products",
  "notes",
  "users",
]);

const tutorialProgressSchema = z
  .object({
    currentChapter: tutorialChapterSchema.nullable(),
    currentStepIndex: z.number(),
    completedChapters: z.array(tutorialChapterSchema),
    visitedPages: z.array(tutorialChapterSchema),
    lastUpdated: z.string().max(50),
  })
  .passthrough();

function loadProgress(): TutorialProgress {
  const parsed = getStorageItem<TutorialProgress>(STORAGE_KEY, {
    type: "local",
    schema: tutorialProgressSchema,
  });

  if (parsed) {
    return {
      ...parsed,
      visitedPages: parsed.visitedPages ?? [],
    } as TutorialProgress;
  }

  return { ...DEFAULT_PROGRESS, lastUpdated: new Date().toISOString() };
}

function saveProgress(progress: TutorialProgress): void {
  setStorageItem(STORAGE_KEY, progress, { type: "local" });
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
