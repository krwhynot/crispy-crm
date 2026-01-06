/**
 * Resource Handlers
 *
 * Composed DataProviders for each resource, combining:
 * - Base Supabase operations
 * - withLifecycleCallbacks for resource-specific logic
 * - withValidation for Zod schema validation
 * - withErrorLogging for structured error handling + Sentry
 *
 * Usage:
 * ```typescript
 * import { createContactsHandler } from './handlers';
 *
 * const contactsProvider = createContactsHandler(baseProvider);
 * ```
 *
 * Engineering Constitution: Composition over inheritance
 */

// Core CRM resources
export { createContactsHandler } from "./contactsHandler";
export { createOrganizationsHandler } from "./organizationsHandler";
export { createOpportunitiesHandler } from "./opportunitiesHandler";
export { createActivitiesHandler } from "./activitiesHandler";
export { createProductsHandler } from "./productsHandler";

// Task management
export { createTasksHandler } from "./tasksHandler";

// Notes (3 types)
export {
  createContactNotesHandler,
  createOpportunityNotesHandler,
  createOrganizationNotesHandler,
} from "./notesHandler";

// Supporting resources
export { createTagsHandler } from "./tagsHandler";
export { createSalesHandler } from "./salesHandler";
export { createSegmentsHandler } from "./segmentsHandler";
export { createProductDistributorsHandler } from "./productDistributorsHandler";
