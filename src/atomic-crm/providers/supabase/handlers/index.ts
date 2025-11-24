/**
 * Resource Handlers
 *
 * Composed DataProviders for each resource, combining:
 * - Base Supabase operations
 * - withLifecycleCallbacks for resource-specific logic
 * - withValidation for Zod schema validation
 * - withErrorLogging for structured error handling
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

export { createContactsHandler } from "./contactsHandler";
export { createOrganizationsHandler } from "./organizationsHandler";
