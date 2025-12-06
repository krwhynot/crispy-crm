import type { TutorialStep, TutorialChapter } from '../types';

// Stub implementations - will be filled in Phase 3
const CHAPTER_STEPS: Record<TutorialChapter, TutorialStep[]> = {
  organizations: [],
  contacts: [],
  opportunities: [],
  activities: [],
  tasks: [],
  products: [],
  notes: [],
  users: [],
};

const CHAPTER_ORDER: TutorialChapter[] = [
  'organizations',
  'contacts',
  'opportunities',
  'activities',
  'tasks',
  'products',
  'notes',
  'users',
];

/**
 * Get steps for a specific chapter
 */
export function getChapterSteps(chapter: TutorialChapter): TutorialStep[] {
  return CHAPTER_STEPS[chapter] ?? [];
}

/**
 * Get all steps for full tutorial (all chapters in order)
 */
export function getAllSteps(): TutorialStep[] {
  return CHAPTER_ORDER.flatMap((chapter) => CHAPTER_STEPS[chapter]);
}

/**
 * Get ordered list of chapters
 */
export function getChapterOrder(): TutorialChapter[] {
  return [...CHAPTER_ORDER];
}
