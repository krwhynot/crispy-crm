/**
 * Notes Handler Factory - Composed DataProvider
 *
 * Factory for creating handlers for contact_notes, opportunity_notes, and organization_notes.
 * All note types share identical composition:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Soft delete only
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling + Sentry
 *
 * Engineering Constitution: DRY - one factory, three handlers
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import {
  contactNotesCallbacks,
  opportunityNotesCallbacks,
  organizationNotesCallbacks,
} from "../callbacks/notesCallbacks";

/**
 * Create a fully composed DataProvider for contact_notes
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createContactNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [contactNotesCallbacks])
  );
}

/**
 * Create a fully composed DataProvider for opportunity_notes
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createOpportunityNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [opportunityNotesCallbacks])
  );
}

/**
 * Create a fully composed DataProvider for organization_notes
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createOrganizationNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [organizationNotesCallbacks])
  );
}
