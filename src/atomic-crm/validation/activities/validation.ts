/**
 * Activity validation functions
 *
 * Functions for validating activities at the API boundary.
 * These are called by the data provider validation service.
 */

import { z } from "zod";
import { activitiesSchema, updateActivitiesSchema } from "./schemas";
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
  try {
    await updateActivitiesSchema.parseAsync(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw zodErrorToReactAdminError(error);
    }
    throw error;
  }
}
