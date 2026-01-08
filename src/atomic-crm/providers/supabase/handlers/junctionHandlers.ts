/**
 * Junction Table Handlers - Composed DataProviders
 *
 * Handlers for junction tables that need soft delete support.
 * Without these handlers, junction tables use HARD DELETE causing data loss.
 *
 * Junction tables handled:
 * - opportunity_participants: Links opportunities to sales reps
 * - opportunity_contacts: Links opportunities to contacts
 * - interaction_participants: Links activities to contacts
 * - distributor_principal_authorizations: Links distributors to principals
 * - organization_distributors: Links organizations to distributor records
 * - user_favorites: Links users to favorited records
 *
 * Engineering Constitution: Composition over inheritance, minimal handlers
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { createResourceCallbacks } from "../callbacks/createResourceCallbacks";

if (process.env.NODE_ENV === "development") {
  console.warn(
    "⚠️ Junction table handlers: getMany operations on composite-key tables " +
      "(product_distributors, opportunity_products) require custom implementation. " +
      "These simple handlers only support single-column primary keys."
  );
}

/**
 * Create handler for opportunity_participants junction table
 * Links opportunities to sales representatives
 */
export function createOpportunityParticipantsHandler(baseProvider: DataProvider): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "opportunity_participants",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}

/**
 * Create handler for opportunity_contacts junction table
 * Links opportunities to contacts involved in the deal
 */
export function createOpportunityContactsHandler(baseProvider: DataProvider): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "opportunity_contacts",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}

/**
 * Create handler for interaction_participants junction table
 * Links activities (calls, emails, meetings) to participating contacts
 */
export function createInteractionParticipantsHandler(baseProvider: DataProvider): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "interaction_participants",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}

/**
 * Create handler for distributor_principal_authorizations junction table
 * Tracks which distributors are authorized to carry which principals' products
 */
export function createDistributorPrincipalAuthorizationsHandler(
  baseProvider: DataProvider
): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "distributor_principal_authorizations",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}

/**
 * Create handler for organization_distributors junction table
 * Links organizations to their distributor relationships
 */
export function createOrganizationDistributorsHandler(baseProvider: DataProvider): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "organization_distributors",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}

/**
 * Create handler for user_favorites junction table
 * Tracks user-favorited records (contacts, opportunities, etc.)
 */
export function createUserFavoritesHandler(baseProvider: DataProvider): DataProvider {
  const callbacks = createResourceCallbacks({
    resource: "user_favorites",
    supportsSoftDelete: true,
  });

  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [callbacks]));
}
