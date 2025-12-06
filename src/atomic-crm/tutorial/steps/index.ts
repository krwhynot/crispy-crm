import type { TutorialStep, TutorialChapter } from '../types';
import { organizationSteps } from './organizationSteps';
import { contactSteps } from './contactSteps';
import { opportunitySteps } from './opportunitySteps';
import { activitySteps } from './activitySteps';
import { taskSteps } from './taskSteps';
import { productSteps } from './productSteps';
import { noteSteps } from './noteSteps';
import { userSteps } from './userSteps';

const CHAPTER_STEPS: Record<TutorialChapter, TutorialStep[]> = {
  organizations: organizationSteps,
  contacts: contactSteps,
  opportunities: opportunitySteps,
  activities: activitySteps,
  tasks: taskSteps,
  products: productSteps,
  notes: noteSteps,
  users: userSteps,
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
