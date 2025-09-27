/**
 * Unified Data Provider
 *
 * Consolidates transformation logic and error logging into a single provider layer.
 * This reduces the provider chain from 4+ layers to a maximum of 2 layers while
 * preserving all existing functionality including transformations, validation,
 * error logging, and database operations.
 */

import { supabaseDataProvider } from "ra-supabase-core";
import type {
  CreateParams,
  DataProvider,
  GetListParams,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  DeleteParams,
  DeleteManyParams,
  Identifier,
} from "ra-core";

import { supabase } from "./supabase";
import {
  getResourceName,
  getSearchableFields,
  supportsSoftDelete,
} from "./resources";

// Import validation functions
import { validateOpportunityForm } from "../../validation/opportunities";
import { validateOrganizationForSubmission } from "../../validation/organizations";
import { validateContactForm } from "../../validation/contacts";
import { validateProductForm } from "../../validation/products";
import { validateCreateTag, validateUpdateTag } from "../../validation/tags";
import {
  validateContactNoteForSubmission,
  validateOpportunityNoteForSubmission
} from "../../validation/notes";
import { validateTaskForSubmission } from "../../validation/tasks";

// Import utilities for transformers
import { uploadToBucket } from "../../utils/storage.utils";
import { processContactAvatar, processOrganizationLogo } from "../../utils/avatar.utils";
import type { RAFile } from "../../types";

// Import service classes
import {
  SalesService,
  OpportunitiesService,
  ActivitiesService,
  JunctionsService,
} from "../../services";

// Import types for custom methods
import type { SalesFormData, Sale, Opportunity, OpportunityParticipant } from "../../types";

// Type for validation configuration
interface ValidationConfig {
  validate?: (data: any, isUpdate?: boolean) => Promise<void> | void;
}

// Type for transformer configuration
interface TransformerConfig<T = any> {
  transform?: (data: Partial<T>, operation: 'create' | 'update') => Promise<Partial<T>>;
}

// Validation registry for each resource
const validationRegistry: Record<string, ValidationConfig> = {
  opportunities: {
    validate: validateOpportunityForm,
  },

  organizations: {
    validate: validateOrganizationForSubmission,
  },

  contacts: {
    validate: validateContactForm,
  },

  products: {
    validate: validateProductForm,
  },

  tags: {
    validate: async (data: any, isUpdate?: boolean) => {
      // Use appropriate validator based on operation
      if (isUpdate || data.id) {
        await validateUpdateTag(data);
      } else {
        await validateCreateTag(data);
      }
    },
  },

  contactNotes: {
    validate: validateContactNoteForSubmission,
  },

  opportunityNotes: {
    validate: validateOpportunityNoteForSubmission,
  },

  tasks: {
    validate: validateTaskForSubmission,
  },
};

// Transformer registry for each resource
// Handles pre-save transformations like file uploads, avatar processing, and timestamp injection
const transformerRegistry: Record<string, TransformerConfig> = {
  // Contact notes: Process attachment uploads
  contactNotes: {
    transform: async (data: any) => {
      if (data.attachments && Array.isArray(data.attachments)) {
        // Upload all attachments sequentially to avoid overwhelming storage
        for (const attachment of data.attachments) {
          if (attachment && typeof attachment === 'object') {
            await uploadToBucket(attachment as RAFile);
          }
        }
      }
      return data;
    }
  },

  // Opportunity notes: Process attachment uploads
  opportunityNotes: {
    transform: async (data: any) => {
      if (data.attachments && Array.isArray(data.attachments)) {
        // Upload all attachments sequentially to avoid overwhelming storage
        for (const attachment of data.attachments) {
          if (attachment && typeof attachment === 'object') {
            await uploadToBucket(attachment as RAFile);
          }
        }
      }
      return data;
    }
  },

  // Sales: Process avatar uploads
  sales: {
    transform: async (data: any) => {
      if (data.avatar && typeof data.avatar === 'object') {
        await uploadToBucket(data.avatar as RAFile);
      }
      return data;
    }
  },

  // Contacts: Auto-generate avatars from email addresses
  contacts: {
    transform: async (data: any) => {
      return await processContactAvatar(data);
    }
  },

  // Organizations: Logo processing and timestamp injection
  organizations: {
    transform: async (data: any, operation: 'create' | 'update') => {
      // Process logo first
      const processedData = await processOrganizationLogo(data);

      // If it's a file upload, upload to bucket
      if (processedData.logo &&
          typeof processedData.logo === 'object' &&
          processedData.logo.rawFile instanceof File) {
        await uploadToBucket(processedData.logo as RAFile);
      }

      // Add timestamp for create operations
      if (operation === 'create') {
        processedData.created_at = new Date().toISOString();
      }

      return processedData;
    }
  },

  // Tags: Semantic color validation and mapping - handled by validation layer
  // Color transformation is done in the Zod schema, no additional processing needed
  tags: {
    transform: async (data: any) => {
      // No transformation needed - color mapping handled by validation schema
      return data;
    }
  },
};

// Create a function to get the base provider with current auth
// This ensures the data provider always uses the current authenticated session
const getBaseDataProvider = () => {
  return supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseClient: supabase,
    sortOrder: "asc,desc.nullslast" as any,
  });
};

// Initialize base data provider
const baseDataProvider = getBaseDataProvider();

// Initialize service layer instances
const salesService = new SalesService(baseDataProvider);
const opportunitiesService = new OpportunitiesService(baseDataProvider);
const activitiesService = new ActivitiesService(baseDataProvider);
const junctionsService = new JunctionsService(baseDataProvider);

/**
 * Log error with context for debugging
 * Integrated from resilientDataProvider for consolidated error logging
 */
function logError(
  method: string,
  resource: string,
  params: any,
  error: unknown,
): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      ids: params?.ids,
      filter: params?.filter,
      sort: params?.sort,
      pagination: params?.pagination,
      target: params?.target,
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    fullError: error,
  });
}

/**
 * Apply full-text search to query parameters
 * Replicates the behavior from the original dataProvider's applyFullTextSearch function
 */
function applyFullTextSearch(columns: readonly string[], shouldAddSoftDeleteFilter: boolean = true) {
  return (params: GetListParams): GetListParams => {
    if (!params.filter?.q) {
      return params;
    }

    const { q, ...filter } = params.filter;

    // Apply soft delete filter automatically for supported resources (unless it's a view)
    const softDeleteFilter = params.filter?.includeDeleted || !shouldAddSoftDeleteFilter
      ? {}
      : { deleted_at: null };

    return {
      ...params,
      filter: {
        ...filter,
        ...softDeleteFilter,
        "@or": columns.reduce((acc, column) => {
          if (column === "email")
            return {
              ...acc,
              [`email_fts@ilike`]: q,
            };
          if (column === "phone")
            return {
              ...acc,
              [`phone_fts@ilike`]: q,
            };
          else
            return {
              ...acc,
              [`${column}@ilike`]: q,
            };
        }, {}),
      },
    };
  };
}

/**
 * Escape values for PostgREST according to official documentation
 * PostgREST uses BACKSLASH escaping, NOT doubled quotes!
 */
function escapeForPostgREST(value: any): string {
  const str = String(value);
  // Check for PostgREST reserved characters
  const needsQuoting = /[,."':() ]/.test(str);

  if (!needsQuoting) {
    return str;
  }

  // IMPORTANT: Escape backslashes first, then quotes
  let escaped = str.replace(/\\/g, '\\\\');  // Backslash → \\
  escaped = escaped.replace(/"/g, '\\"');    // Quote → \"
  return `"${escaped}"`;
}

/**
 * Transform array filter values to PostgREST operators
 * Handles conversion of React Admin array filters to appropriate PostgREST syntax
 *
 * @example
 * // JSONB array fields (tags, email, phone)
 * { tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }
 *
 * // Regular enum/text fields
 * { status: ["active", "pending"] } → { "status@in": "(active,pending)" }
 */
function transformArrayFilters(filter: Record<string, any>): Record<string, any> {
  if (!filter || typeof filter !== 'object') {
    return filter;
  }

  const transformed: Record<string, any> = {};

  // Fields that are stored as JSONB arrays in PostgreSQL
  // These use the @cs (contains) operator
  const jsonbArrayFields = ['tags', 'email', 'phone'];

  for (const [key, value] of Object.entries(filter)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Preserve existing PostgREST operators (keys containing @)
    if (key.includes('@')) {
      transformed[key] = value;
      continue;
    }

    // Handle array values
    if (Array.isArray(value)) {
      // Skip empty arrays
      if (value.length === 0) {
        continue;
      }

      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains - format: {1,2,3}
        // This checks if the JSONB array contains any of the specified values
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
      } else {
        // Regular IN operator - format: (val1,val2,val3)
        // This checks if the field value is in the list
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
      }
    } else {
      // Regular non-array value
      transformed[key] = value;
    }
  }

  return transformed;
}

/**
 * Apply search parameters to a query
 * Enhanced version that supports both search and automatic soft delete filtering
 *
 * @param resource - The resource name
 * @param params - The query parameters
 * @param useView - Whether this query will use a summary view (true for getList, false for getManyReference)
 */
function applySearchParams(
  resource: string,
  params: GetListParams,
  useView: boolean = true,
): GetListParams {
  const searchableFields = getSearchableFields(resource);

  // Check if we're using a view (views already handle soft delete filtering internally)
  // Only check for view if the operation will actually use one
  const dbResource = useView ? getDatabaseResource(resource, "list") : getResourceName(resource);
  const isView = dbResource.includes("_summary") || dbResource.includes("_view");

  // Apply soft delete filter for all supported resources, even without search
  // But skip for views as they handle this internally and adding the filter causes PostgREST errors
  const needsSoftDeleteFilter = supportsSoftDelete(resource) &&
    !params.filter?.includeDeleted &&
    !isView;

  // Transform array filters to PostgREST operators
  const transformedFilter = transformArrayFilters(params.filter);

  // If no search query but needs soft delete filter
  if (!transformedFilter?.q && needsSoftDeleteFilter) {
    return {
      ...params,
      filter: {
        ...transformedFilter,
        deleted_at: null,
      },
    };
  }

  // If no search query and no soft delete needed, return params with transformed filters
  if (!transformedFilter?.q) {
    return {
      ...params,
      filter: transformedFilter,
    };
  }

  // Extract search query and apply full-text search
  const { q, ...filterWithoutQ } = transformedFilter;

  // If no searchable fields configured, apply basic soft delete only
  if (searchableFields.length === 0) {
    const softDeleteFilter = needsSoftDeleteFilter ? { deleted_at: null } : {};
    return {
      ...params,
      filter: {
        ...filterWithoutQ,
        ...softDeleteFilter,
      },
    };
  }

  // Use the applyFullTextSearch helper for resources with search configuration
  // Pass the needsSoftDeleteFilter flag to avoid adding deleted_at filter for views
  const searchParams = applyFullTextSearch(searchableFields, needsSoftDeleteFilter)({
    ...params,
    filter: transformedFilter,
  });

  return searchParams;
}

/**
 * Get the appropriate database resource name
 */
function getDatabaseResource(
  resource: string,
  operation: "list" | "one" | "create" | "update" | "delete" = "list",
): string {
  const actualResource = getResourceName(resource);

  // Use summary views for list operations when available
  if (operation === "list" || operation === "one") {
    const summaryResource = `${actualResource}_summary`;
    if (
      resource === "opportunities" ||
      resource === "organizations" ||
      resource === "contacts"
    ) {
      return summaryResource;
    }
  }

  return actualResource;
}

/**
 * Validate data based on resource configuration
 * Engineering Constitution: Single-point validation at API boundary only
 */
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create",
): Promise<void> {
  const config = validationRegistry[resource];

  if (!config || !config.validate) {
    // No validation configured, skip
    return;
  }

  try {
    // Call validation function
    await config.validate(data, operation === "update");
  } catch (error: any) {
    // Ensure errors are properly formatted for React Admin
    // React Admin expects { message: string, errors: { fieldName: string } }

    if (error.errors && typeof error.errors === 'object') {
      // Already properly formatted
      throw error;
    }

    // If it's a generic error, wrap it
    if (error instanceof Error) {
      throw {
        message: error.message || "Validation failed",
        errors: { _error: error.message },
      };
    }

    // Unknown error format
    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    };
  }
}

/**
 * Transform data based on resource configuration
 */
async function transformData<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  const config = transformerRegistry[resource];

  if (!config || !config.transform) {
    // No transformer configured, return data as-is
    return data;
  }

  // Call transformer function
  return await config.transform(data, operation);
}

/**
 * Process data for database operations
 * Applies transformations first, then validation
 * Order matters: transformations may add/modify fields needed for validation
 */
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  // Apply transformations first (file uploads, timestamps, etc.)
  const processedData = await transformData(resource, data, operation);

  // Then validate the transformed data
  await validateData(resource, processedData, operation);

  return processedData;
}

/**
 * Normalize JSONB array fields to ensure they are always arrays
 * This prevents runtime errors when components expect array data
 * Engineering Constitution: BOY SCOUT RULE - fixing data inconsistencies
 */
function normalizeJsonbArrayFields(data: any): any {
  if (!data) return data;

  // Helper to ensure a value is always an array
  const ensureArray = (value: any): any[] => {
    if (value === null || value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      // Log warning for debugging data inconsistencies
      console.warn(`[Data Normalization] Converting non-array JSONB to array:`, value);
      // If it's an object, wrap it in an array, otherwise return empty array
      return typeof value === 'object' ? [value] : [];
    }
    return value;
  };

  // Normalize based on resource type
  // Currently only contacts have JSONB array fields that need normalization
  if (data.email !== undefined || data.phone !== undefined || data.tags !== undefined) {
    return {
      ...data,
      ...(data.email !== undefined && { email: ensureArray(data.email) }),
      ...(data.phone !== undefined && { phone: ensureArray(data.phone) }),
      ...(data.tags !== undefined && { tags: ensureArray(data.tags) }),
    };
  }

  return data;
}

/**
 * Normalize response data from database queries
 * Applies to both single records and arrays of records
 */
function normalizeResponseData(resource: string, data: any): any {
  // Handle array of records (getList, getMany, getManyReference)
  if (Array.isArray(data)) {
    return data.map(record => normalizeJsonbArrayFields(record));
  }

  // Handle single record (getOne)
  return normalizeJsonbArrayFields(data);
}

/**
 * Wrap a data provider method with error logging and transformations
 * Ensures validation errors are properly formatted for React Admin's inline display
 */
async function wrapMethod<T>(
  method: string,
  resource: string,
  params: any,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    logError(method, resource, params, error);

    // For validation errors, ensure React Admin format
    // This allows errors to be displayed inline next to form fields
    if (error.errors && typeof error.errors === 'object') {
      // Already in correct format { message, errors: { field: message } }
      throw error;
    }

    // For Supabase errors, try to extract field-specific errors
    if (error.code && error.details) {
      const fieldErrors: Record<string, string> = {};

      // Try to parse field from error details
      if (typeof error.details === 'string') {
        // Simple heuristic to extract field name from error
        const match = error.details.match(/column "(\w+)"/i);
        if (match) {
          fieldErrors[match[1]] = error.details;
        } else {
          fieldErrors._error = error.details;
        }
      }

      throw {
        message: error.message || "Operation failed",
        errors: fieldErrors,
      };
    }

    // Pass through other errors
    throw error;
  }
}

/**
 * Create the unified data provider with integrated transformations and error logging
 */
export const unifiedDataProvider: DataProvider = {
  async getList(
    resource: string,
    params: GetListParams,
  ): Promise<any> {
    return wrapMethod("getList", resource, params, async () => {
      // Apply search parameters
      const searchParams = applySearchParams(resource, params);

      // Get appropriate database resource
      const dbResource = getDatabaseResource(resource, "list");

      // Execute query
      const result = await baseDataProvider.getList(dbResource, searchParams);

      // Apply data normalization to ensure JSONB fields are arrays
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },

  async getOne(
    resource: string,
    params: GetOneParams,
  ): Promise<any> {
    return wrapMethod("getOne", resource, params, async () => {
      // Get appropriate database resource
      const dbResource = getDatabaseResource(resource, "one");

      // Execute query
      const result = await baseDataProvider.getOne(dbResource, params);

      // Apply data normalization to ensure JSONB fields are arrays
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },

  async getMany(
    resource: string,
    params: GetManyParams,
  ): Promise<any> {
    return wrapMethod("getMany", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Apply soft delete filtering if supported
      let filteredParams = params;
      if (supportsSoftDelete(resource)) {
        filteredParams = {
          ...params,
          // Note: getMany uses ids array, but we may need to filter results
          // This is handled at the database level through RLS policies in most cases
        };
      }

      const result = await baseDataProvider.getMany(dbResource, filteredParams);

      // Apply data normalization to ensure JSONB fields are arrays
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },

  async getManyReference(
    resource: string,
    params: GetManyReferenceParams,
  ): Promise<any> {
    return wrapMethod("getManyReference", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Apply search parameters, array transformation, and soft delete filtering
      // getManyReference uses base tables (not summary views), so pass useView=false
      const searchParams = applySearchParams(
        resource,
        {
          ...params,
          filter: params.filter || {},
        } as GetListParams,
        false, // getManyReference doesn't use summary views
      );

      const result = await baseDataProvider.getManyReference(dbResource, {
        ...params,
        filter: searchParams.filter,
      });

      // Apply data normalization to ensure JSONB fields are arrays
      return {
        ...result,
        data: normalizeResponseData(resource, result.data),
      };
    });
  },

  async create(
    resource: string,
    params: CreateParams,
  ): Promise<any> {
    return wrapMethod("create", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Validate and process data
      const processedData = await processForDatabase(
        resource,
        params.data,
        "create",
      );

      // Execute create
      const result = await baseDataProvider.create(dbResource, {
        ...params,
        data: processedData as any,
      });

      // No transformation needed yet (will be added in a future task)
      return result;
    });
  },

  async update(
    resource: string,
    params: UpdateParams,
  ): Promise<any> {
    return wrapMethod("update", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Validate and process data
      const processedData = await processForDatabase(
        resource,
        params.data,
        "update",
      );

      // Execute update
      const result = await baseDataProvider.update(dbResource, {
        ...params,
        data: {
          ...processedData,
          id: params.id, // Preserve ID
        } as any,
      });

      // No transformation needed yet (will be added in a future task)
      return result;
    });
  },

  async updateMany(resource: string, params: UpdateManyParams): Promise<any> {
    return wrapMethod("updateMany", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Validate data for updates
      const processedData = await processForDatabase(
        resource,
        params.data,
        "update",
      );

      const result = await baseDataProvider.updateMany(dbResource, {
        ...params,
        data: processedData as any,
      });

      return result;
    });
  },

  async delete(
    resource: string,
    params: DeleteParams,
  ): Promise<any> {
    return wrapMethod("delete", resource, params, async () => {
      const dbResource = getResourceName(resource);
      return baseDataProvider.delete(dbResource, params);
    });
  },

  async deleteMany(resource: string, params: DeleteManyParams): Promise<any> {
    return wrapMethod("deleteMany", resource, params, async () => {
      const dbResource = getResourceName(resource);
      return baseDataProvider.deleteMany(dbResource, params);
    });
  },

  // Custom sales methods - delegated to SalesService
  async salesCreate(body: SalesFormData): Promise<Sale> {
    return salesService.salesCreate(body);
  },

  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>,
  ): Promise<Partial<Omit<SalesFormData, "password">>> {
    return salesService.salesUpdate(id, data);
  },

  async updatePassword(id: Identifier): Promise<boolean> {
    return salesService.updatePassword(id);
  },

  // Custom opportunities methods - delegated to OpportunitiesService
  async unarchiveOpportunity(opportunity: Opportunity): Promise<any[]> {
    return opportunitiesService.unarchiveOpportunity(opportunity);
  },

  // Custom activities methods - delegated to ActivitiesService
  async getActivityLog(companyId?: Identifier, salesId?: Identifier): Promise<any[]> {
    return activitiesService.getActivityLog(companyId, salesId);
  },

  // Junction table methods - delegated to JunctionsService

  // Contact-Organization relationships
  async getContactOrganizations(contactId: Identifier): Promise<{ data: any[] }> {
    return junctionsService.getContactOrganizations(contactId);
  },

  async addContactToOrganization(
    contactId: Identifier,
    organizationId: Identifier,
    params: any = {},
  ): Promise<{ data: any }> {
    return junctionsService.addContactToOrganization(contactId, organizationId, params);
  },

  async removeContactFromOrganization(
    contactId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeContactFromOrganization(contactId, organizationId);
  },

  async setPrimaryOrganization(
    contactId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { success: boolean } }> {
    return junctionsService.setPrimaryOrganization(contactId, organizationId);
  },

  // Opportunity participants
  async getOpportunityParticipants(opportunityId: Identifier): Promise<{ data: any[] }> {
    return junctionsService.getOpportunityParticipants(opportunityId);
  },

  async addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params: Partial<OpportunityParticipant> = {},
  ): Promise<{ data: any }> {
    return junctionsService.addOpportunityParticipant(opportunityId, organizationId, params);
  },

  async removeOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeOpportunityParticipant(opportunityId, organizationId);
  },

  // Opportunity contacts
  async getOpportunityContacts(opportunityId: Identifier): Promise<{ data: any[] }> {
    return junctionsService.getOpportunityContacts(opportunityId);
  },

  async addOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
    params: any = {},
  ): Promise<{ data: any }> {
    return junctionsService.addOpportunityContact(opportunityId, contactId, params);
  },

  async removeOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeOpportunityContact(opportunityId, contactId);
  },
};

/**
 * Export a helper to check if a resource uses validation
 */
export function resourceUsesValidation(resource: string): boolean {
  return resource in validationRegistry;
}

/**
 * Export a helper to check if a resource uses transformers
 */
export function resourceUsesTransformers(resource: string): boolean {
  return resource in transformerRegistry;
}

/**
 * Export validation and transformer registries for testing and debugging
 */
export { validationRegistry, transformerRegistry };

/**
 * Export CrmDataProvider type for convenience
 */
export type CrmDataProvider = typeof unifiedDataProvider;
