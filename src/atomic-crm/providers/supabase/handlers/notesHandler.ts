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
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createContactNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(withLifecycleCallbacks(baseProvider, [contactNotesCallbacks]))
  );
}

/**
 * Create a fully composed DataProvider for opportunity_notes
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createOpportunityNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(withLifecycleCallbacks(baseProvider, [opportunityNotesCallbacks]))
  );
}

/**
 * Create a fully composed DataProvider for organization_notes
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete and validation
 */
export function createOrganizationNotesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(withLifecycleCallbacks(baseProvider, [organizationNotesCallbacks]))
  );
}
