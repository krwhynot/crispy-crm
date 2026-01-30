/**
 * Activity validation functions
 *
 * Functions for validating activities at the API boundary.
 * These are called by the data provider validation service.
 */

import { z } from "zod";
import {
  activitiesSchema,
  engagementsSchema,
  interactionsSchema,
  updateActivitiesSchema,
  baseActivitiesSchema,
} from "./schemas";
import { zodErrorToReactAdminError } from "../utils";

/**
 * Validation function matching expected signature from unifiedDataProvider
 * This is the ONLY place where activities validation occurs
 */
export async function validateActivitiesForm(data: unknown): Promise<void> {
  try {
    activitiesSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

/**
 * Create validation function matching expected signature from unifiedDataProvider
 */
export async function validateCreateActivities(data: unknown): Promise<void> {
  return validateActivitiesForm(data);
}

/**
 * Update validation function matching expected signature from unifiedDataProvider
 */
export async function validateUpdateActivities(data: unknown): Promise<void> {
  await updateActivitiesSchema.parseAsync(data);
}

/**
 * Validation function for engagements specifically
 */
export async function validateEngagementsForm(data: unknown): Promise<void> {
  try {
    engagementsSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

/**
 * Create validation function for engagements
 */
export async function validateCreateEngagements(data: unknown): Promise<void> {
  return validateEngagementsForm(data);
}

/**
 * Update validation function for engagements
 */
export async function validateUpdateEngagements(data: unknown): Promise<void> {
  await baseActivitiesSchema
    .partial()
    .extend({
      activity_type: z.literal("engagement").optional(),
    })
    .parseAsync(data);
}

/**
 * Validation function for interactions specifically
 */
export async function validateInteractionsForm(data: unknown): Promise<void> {
  try {
    interactionsSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}

/**
 * Create validation function for interactions
 */
export async function validateCreateInteractions(data: unknown): Promise<void> {
  return validateInteractionsForm(data);
}

/**
 * Update validation function for interactions
 */
export async function validateUpdateInteractions(data: unknown): Promise<void> {
  await baseActivitiesSchema
    .partial()
    .extend({
      activity_type: z.literal("interaction").optional(),
    })
    .parseAsync(data);
}
