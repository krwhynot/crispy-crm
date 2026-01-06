/**
 * Composed Data Provider - Proxy Pattern Router
 *
 * Routes DataProvider method calls to appropriate resource handlers.
 * Each resource handler is composed from:
 * - Base provider → Supabase operations
 * - withLifecycleCallbacks → Resource-specific lifecycle hooks
 * - withValidation → Zod schema validation
 * - withErrorLogging → Structured error handling
 *
 * Resources without explicit handlers fall back to base provider.
 *
 * Engineering Constitution: Proxy pattern for routing, composition over inheritance
 */

import type { DataProvider, RaRecord } from "react-admin";
import {
  createContactsHandler,
  createOrganizationsHandler,
  createOpportunitiesHandler,
  createActivitiesHandler,
  createProductsHandler,
  createTasksHandler,
  createContactNotesHandler,
  createOpportunityNotesHandler,
  createOrganizationNotesHandler,
  createTagsHandler,
  createSalesHandler,
  createSegmentsHandler,
  createProductDistributorsHandler,
} from "./handlers";
import { applySearchParams, getDatabaseResource } from "./dataProviderUtils";

/**
 * List of resources with composed handlers
 * Other resources fall back to base provider
 *
 * Resources use snake_case to match database table names
 */
export const HANDLED_RESOURCES = [
  // Core CRM resources
  "contacts",
  "organizations",
  "opportunities",
  "activities",
  "products",
  // Task management
  "tasks",
  // Notes (3 types)
  "contact_notes",
  "opportunity_notes",
  "organization_notes",
  // Supporting resources
  "tags",
  "sales",
  "segments",
  "product_distributors",
] as const;

export type HandledResource = (typeof HANDLED_RESOURCES)[number];

/**
 * Type guard to check if resource has a composed handler
 */
function isHandledResource(resource: string): resource is HandledResource {
  return HANDLED_RESOURCES.includes(resource as HandledResource);
}

/**
 * Handler registry type
 */
type HandlerRegistry = Record<HandledResource, DataProvider>;

/**
 * Create composed DataProvider with resource routing
 *
 * Uses Proxy pattern to route method calls:
 * - Handled resources → Composed handler (with lifecycle, validation, error logging)
 * - Other resources → Base provider (passthrough)
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with intelligent routing
 *
 * @example
 * ```typescript
 * const composedProvider = createComposedDataProvider(baseSupabaseProvider);
 *
 * // Contacts → goes through contactsHandler (with soft delete, JSONB, etc.)
 * await composedProvider.getList('contacts', params);
 *
 * // Tasks → goes through tasksHandler (with completion timestamp, snooze handling)
 * await composedProvider.getList('tasks', params);
 *
 * // Unknown resources → falls back to base provider
 * await composedProvider.getList('unknown_resource', params);
 * ```
 */
export function createComposedDataProvider(baseProvider: DataProvider): DataProvider {
  // Create composed handlers for each resource
  const handlers: HandlerRegistry = {
    // Core CRM resources
    contacts: createContactsHandler(baseProvider),
    organizations: createOrganizationsHandler(baseProvider),
    opportunities: createOpportunitiesHandler(baseProvider),
    activities: createActivitiesHandler(baseProvider),
    products: createProductsHandler(baseProvider),
    // Task management
    tasks: createTasksHandler(baseProvider),
    // Notes (3 types)
    contact_notes: createContactNotesHandler(baseProvider),
    opportunity_notes: createOpportunityNotesHandler(baseProvider),
    organization_notes: createOrganizationNotesHandler(baseProvider),
    // Supporting resources
    tags: createTagsHandler(baseProvider),
    sales: createSalesHandler(baseProvider),
    segments: createSegmentsHandler(baseProvider),
    product_distributors: createProductDistributorsHandler(baseProvider),
  };

  /**
   * Get the appropriate provider for a resource
   */
  function getProviderForResource(resource: string): DataProvider {
    if (isHandledResource(resource)) {
      return handlers[resource];
    }
    return baseProvider;
  }

  // Create the composed provider with routing logic
  const composedProvider: DataProvider = {
    getList: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getList"]>[1]
    ) => {
      // Map resource to database table/view (e.g., opportunities → opportunities_summary)
      const dbResource = getDatabaseResource(resource, "list");
      const processedParams = applySearchParams(resource, params);
      const provider = getProviderForResource(resource);
      return provider.getList<RecordType>(dbResource, processedParams);
    },

    getOne: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getOne"]>[1]
    ) => {
      // Map resource to database table/view for single record fetch
      const dbResource = getDatabaseResource(resource, "one");
      const provider = getProviderForResource(resource);
      return provider.getOne<RecordType>(dbResource, params);
    },

    getMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getMany"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.getMany<RecordType>(resource, params);
    },

    getManyReference: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getManyReference"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.getManyReference<RecordType>(resource, params);
    },

    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["create"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.create<RecordType>(resource, params);
    },

    update: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["update"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.update<RecordType>(resource, params);
    },

    updateMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["updateMany"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.updateMany<RecordType>(resource, params);
    },

    delete: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["delete"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.delete<RecordType>(resource, params);
    },

    deleteMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["deleteMany"]>[1]
    ) => {
      const provider = getProviderForResource(resource);
      return provider.deleteMany<RecordType>(resource, params);
    },
  };

  return composedProvider;
}
