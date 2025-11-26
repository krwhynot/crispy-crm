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
  GetListResult,
  GetOneParams,
  GetOneResult,
  GetManyParams,
  GetManyResult,
  GetManyReferenceParams,
  GetManyReferenceResult,
  UpdateParams,
  UpdateResult,
  UpdateManyParams,
  UpdateManyResult,
  DeleteParams,
  DeleteResult,
  DeleteManyParams,
  DeleteManyResult,
  CreateResult,
  Identifier,
  RaRecord,
  FilterPayload,
} from "ra-core";
import type { FileObject } from "@supabase/storage-js";
import type { QuickAddInput } from "../validation/quickAdd";

import { supabase } from "./supabase";
import { getResourceName, supportsSoftDelete } from "./resources";
import { getDatabaseResource, applySearchParams, normalizeResponseData } from "./dataProviderUtils";

// Import decomposed services
import { ValidationService, TransformService, StorageService } from "./services";

// Import service classes
import {
  SalesService,
  OpportunitiesService,
  ActivitiesService,
  JunctionsService,
  SegmentsService,
} from "../../services";

// Import RPC validation schemas
import {
  RPC_SCHEMAS,
  type RPCFunctionName,
  edgeFunctionSchemas,
  type EdgeFunctionName,
} from "../../validation/rpc";

// Import types for custom methods
import type {
  SalesFormData,
  Sale,
  Opportunity,
  OpportunityParticipant,
  ContactOrganization,
  OpportunityContact,
  Activity,
} from "../../types";

// Type for potentially wrapped RPC responses
type RpcWrappedResponse<T> = T | { data: T };

/**
 * Interface for data provider method params logging
 * Captures common fields for error context
 */
interface DataProviderLogParams {
  id?: Identifier;
  ids?: Identifier[];
  filter?: FilterPayload;
  sort?: { field: string; order: "ASC" | "DESC" };
  pagination?: { page: number; perPage: number };
  target?: string;
  data?: unknown;
}

/**
 * Interface for validation errors in React Admin format
 */
interface ValidationError {
  message: string;
  errors: Record<string, string>;
}

/**
 * Interface for Supabase errors with detailed field information
 */
interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Extended error type for error handling
 * Captures both standard Error properties and validation/API error structures
 */
interface ExtendedError extends Error {
  body?: { errors?: Record<string, string> };
  errors?: Record<string, string>;
  code?: string;
  details?: string;
  issues?: Array<{ path: (string | number)[]; message: string }>;
}

/**
 * Interface for junction table relationship params
 */
interface JunctionParams {
  is_primary?: boolean;
  role?: string;
  notes?: string;
}

/**
 * Type for booth visitor creation result
 */
interface BoothVisitorResult {
  organization_id: Identifier;
  contact_id: Identifier;
  opportunity_id: Identifier;
}

// Initialize decomposed services
const storageService = new StorageService();
const transformService = new TransformService(storageService);
const validationService = new ValidationService();

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
const segmentsService = new SegmentsService(baseDataProvider);

/**
 * Log error with context for debugging
 * Integrated from resilientDataProvider for consolidated error logging
 */
function logError(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  error: unknown
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

  const extendedError = error as ExtendedError | undefined;

  console.error(`[DataProvider Error]`, context, {
    error:
      error instanceof Error
        ? error.message
        : extendedError?.message
          ? extendedError.message
          : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: extendedError?.body?.errors || extendedError?.errors || undefined,
    fullError: error,
  });

  // Log validation errors in detail for debugging
  if (extendedError?.body?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(extendedError.body.errors, null, 2));
  } else if (extendedError?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(extendedError.errors, null, 2));
  }
}

/**
 * Validate data based on resource configuration
 * Engineering Constitution: Single-point validation at API boundary only
 */
async function validateData(
  resource: string,
  data: Record<string, unknown>,
  operation: "create" | "update" = "create"
): Promise<void> {
  // For opportunities, merge defaults for fields that React Hook Form might not include
  // when they haven't been touched (even though defaultValues were set)
  let dataToValidate = data;
  if (resource === "opportunities" && operation === "create") {
    // Merge with defaults - ensures validation receives proper types even for untouched fields
    dataToValidate = {
      contact_ids: [], // Default to empty array (will fail min(1) validation with proper message)
      ...data, // User's data overwrites defaults
    };
  }

  try {
    // Use the ValidationService
    await validationService.validate(resource, operation, dataToValidate);
  } catch (error: unknown) {
    const extendedError = error as ExtendedError | undefined;

    // Parse Zod validation errors into React Admin format
    // Zod errors have an 'issues' array with field-level errors
    if (extendedError?.issues && Array.isArray(extendedError.issues)) {
      const fieldErrors: Record<string, string> = {};

      // Convert Zod issues to field-error map
      for (const issue of extendedError.issues) {
        const fieldPath = issue.path.join(".");
        const fieldName = fieldPath || "_error";
        fieldErrors[fieldName] = issue.message;
      }

      throw {
        message: "Validation failed",
        errors: fieldErrors,
      } satisfies ValidationError;
    }

    // If already in expected format (has errors object at top level)
    if (extendedError?.errors && typeof extendedError.errors === "object") {
      throw {
        message: extendedError.message || "Validation failed",
        errors: extendedError.errors,
      } satisfies ValidationError;
    }

    // For other Error types, wrap with generic error
    if (error instanceof Error) {
      throw {
        message: error.message || "Validation failed",
        errors: { _error: error.message },
      } satisfies ValidationError;
    }

    // Unknown error format - wrap it
    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    } satisfies ValidationError;
  }
}

/**
 * Transform data based on resource configuration
 */
async function transformData<T>(
  resource: string,
  data: Partial<T>,
  _operation: "create" | "update" = "create"
): Promise<Partial<T>> {
  // Use the TransformService
  return (await transformService.transform(resource, data)) as Partial<T>;
}

/**
 * Type guard to check if an RPC response is wrapped.
 * Checks for the presence of a data property with an id field.
 *
 * @param response The response to check
 * @returns True if the response is wrapped
 */
function isWrappedResponse<T extends { id: Identifier }>(
  response: RpcWrappedResponse<T>
): response is { data: T } {
  return (
    response !== null &&
    response !== undefined &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== null &&
    typeof response.data === "object" &&
    "id" in response.data
  );
}

/**
 * Formats RPC responses to match React Admin's expected structure.
 * Handles potentially double-wrapped responses from Supabase RPC functions.
 *
 * @param rpcData The raw data returned from a Supabase RPC call
 * @returns A React Admin-compatible response object
 */
function formatRpcResponse<T extends { id: Identifier }>(
  rpcData: RpcWrappedResponse<T>
): { data: T } {
  // Use type guard for safer unwrapping
  if (isWrappedResponse(rpcData)) {
    return { data: rpcData.data };
  }
  // Otherwise, wrap the raw response
  return { data: rpcData as T };
}

/**
 * Handles RPC errors by attempting to parse JSON error messages.
 * Many Supabase RPC functions return structured error messages as JSON strings.
 *
 * @param error The error from a Supabase RPC call
 * @throws The parsed error or original error
 */
function handleRpcError(error: SupabaseError | Error): never {
  if (error?.message) {
    try {
      // Attempt to parse a structured error message
      const parsedError = JSON.parse(error.message) as unknown;
      throw parsedError;
    } catch {
      // If parsing fails, it's not JSON, so throw the original error
    }
  }
  throw error;
}

/**
 * Process data for database operations
 * CRITICAL: Validate FIRST, Transform SECOND (Issue 0.4)
 * This allows validation of original field names (e.g., 'products')
 * before transformation renames them (e.g., 'products_to_sync')
 */
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create"
): Promise<Partial<T>> {
  // Validate first (original field names)
  await validateData(resource, data, operation);

  // Then apply transformations (field renames, file uploads, timestamps, etc.)
  const processedData = await transformData(resource, data, operation);

  return processedData;
}

/**
 * Wrap a data provider method with error logging and transformations
 * Ensures validation errors are properly formatted for React Admin's inline display
 */
async function wrapMethod<T>(
  method: string,
  resource: string,
  params: DataProviderLogParams & { previousData?: RaRecord },
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    logError(method, resource, params, error);
    const extendedError = error as ExtendedError | undefined;

    // Handle idempotent delete - if resource doesn't exist, treat as success
    // This happens with React Admin's undoable mode where UI updates before API call
    if (
      method === "delete" &&
      extendedError?.message?.includes("Cannot coerce the result to a single JSON object")
    ) {
      // Return successful delete response - resource was already deleted
      return { data: params.previousData } as T;
    }

    // For validation errors, ensure React Admin format
    // This allows errors to be displayed inline next to form fields
    if (extendedError?.body?.errors && typeof extendedError.body.errors === "object") {
      // Already in correct format { message, body: { errors: { field: message } } }
      throw error;
    }

    // For Supabase errors, try to extract field-specific errors
    if (extendedError?.code && extendedError?.details) {
      const fieldErrors: Record<string, string> = {};

      // Try to parse field from error details
      if (typeof extendedError.details === "string") {
        // Simple heuristic to extract field name from error
        const match = extendedError.details.match(/column "(\w+)"/i);
        if (match) {
          fieldErrors[match[1]] = extendedError.details;
        } else {
          fieldErrors._error = extendedError.details;
        }
      }

      throw {
        message: extendedError.message || "Operation failed",
        errors: fieldErrors,
      } satisfies ValidationError;
    }

    // Pass through other errors
    throw error;
  }
}

/**
 * Create the unified data provider with integrated transformations and error logging
 */
export const unifiedDataProvider: DataProvider = {
  async getList<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    return wrapMethod("getList", resource, params, async () => {
      // Create a mutable copy of params to potentially modify filters
      const processedParams = { ...params };

      // CRITICAL: Validate and clean filters BEFORE applying search parameters
      // This prevents 400 errors from stale cached filters referencing non-existent columns
      if (processedParams.filter) {
        processedParams.filter = validationService.validateFilters(
          resource,
          processedParams.filter
        );
      }

      // Apply search parameters (now uses cleaned filters)
      const searchParams = applySearchParams(resource, processedParams);

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

  async getOne<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetOneParams<RecordType>
  ): Promise<GetOneResult<RecordType>> {
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

  async getMany<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetManyParams<RecordType>
  ): Promise<GetManyResult<RecordType>> {
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

  async getManyReference<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
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
        false // getManyReference doesn't use summary views
      );

      // Use transformed filter (with $or → or conversion) while preserving required GetManyReferenceParams
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

  async create<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<RecordType>> {
    return wrapMethod("create", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Validate and process data
      const processedData = await processForDatabase(resource, params.data, "create");

      // Check for preview/dry-run mode
      if (params.meta?.dryRun === true) {
        // In dry-run mode, return the processed data without database operations
        // This allows validation and transformation without side effects
        return {
          data: {
            ...processedData,
            id: "dry-run-provisional-id",
          },
        };
      }

      // Delegate segment creation to service (handles get_or_create)
      if (resource === "segments") {
        const result = await segmentsService.getOrCreateSegment(processedData.name);
        return { data: result as unknown as RecordType };
      }

      // Delegate opportunity creation to service (handles products sync)
      if (resource === "opportunities") {
        const result = await opportunitiesService.createWithProducts(processedData as any);
        return { data: result as unknown as RecordType };
      }

      // Execute create
      const result = await baseDataProvider.create(dbResource, {
        ...params,
        data: processedData as Partial<RecordType>,
      });

      // No transformation needed yet (will be added in a future task)
      return result;
    });
  },

  async update<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: UpdateParams<RecordType>
  ): Promise<UpdateResult<RecordType>> {
    return wrapMethod("update", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Prepare data for validation
      const dataToProcess = { ...params.data, id: params.id };

      // Validate and process data
      const processedData = await processForDatabase(resource, dataToProcess, "update");

      // Delegate opportunity update to service (handles products sync)
      if (resource === "opportunities") {
        const previousProducts = params.previousData?.products || [];
        const result = await opportunitiesService.updateWithProducts(
          params.id,
          processedData as any,
          previousProducts
        );
        return { data: result as unknown as RecordType };
      }

      // Execute update
      const result = await baseDataProvider.update(dbResource, {
        ...params,
        data: {
          ...processedData,
          id: params.id, // Preserve ID
        } as Partial<RecordType>,
      });

      // No transformation needed yet (will be added in a future task)
      return result;
    });
  },

  async updateMany<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: UpdateManyParams<RecordType>
  ): Promise<UpdateManyResult<RecordType>> {
    return wrapMethod("updateMany", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Validate data for updates
      const processedData = await processForDatabase(
        resource,
        params.data as Record<string, unknown>,
        "update"
      );

      const result = await baseDataProvider.updateMany(dbResource, {
        ...params,
        data: processedData as Partial<RecordType>,
      });

      return result;
    });
  },

  async delete<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    return wrapMethod("delete", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Constitution: soft-deletes rule - check if resource supports soft delete
      if (supportsSoftDelete(dbResource)) {
        // Soft delete: set deleted_at timestamp
        return baseDataProvider.update(dbResource, {
          id: params.id,
          data: { deleted_at: new Date().toISOString() },
          previousData: params.previousData,
        });
      }

      // Hard delete (only for resources without soft-delete support)
      return baseDataProvider.delete(dbResource, params);
    });
  },

  async deleteMany<RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ): Promise<DeleteManyResult<RecordType>> {
    return wrapMethod("deleteMany", resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Constitution: soft-deletes rule - check if resource supports soft delete
      if (supportsSoftDelete(dbResource)) {
        // Soft delete many: set deleted_at timestamp with direct Supabase query
        // Note: DeleteManyParams doesn't include previousData, so we bypass
        // the provider layer to avoid ra-supabase-core's getChanges() needing it
        const { error } = await supabase
          .from(dbResource)
          .update({ deleted_at: new Date().toISOString() })
          .in("id", params.ids);

        if (error) {
          throw error;
        }

        return { data: params.ids };
      }

      // Hard delete (only for resources without soft-delete support)
      return baseDataProvider.deleteMany(dbResource, params);
    });
  },

  // Custom sales methods - delegated to SalesService
  async salesCreate(body: SalesFormData): Promise<Sale> {
    return salesService.salesCreate(body);
  },

  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>
  ): Promise<Partial<Omit<SalesFormData, "password">>> {
    return salesService.salesUpdate(id, data);
  },

  async updatePassword(id: Identifier): Promise<boolean> {
    return salesService.updatePassword(id);
  },

  // Custom opportunities methods - delegated to OpportunitiesService
  async archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    return opportunitiesService.archiveOpportunity(opportunity);
  },

  async unarchiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]> {
    return opportunitiesService.unarchiveOpportunity(opportunity);
  },

  // Custom activities methods - delegated to ActivitiesService
  async getActivityLog(companyId?: Identifier, salesId?: Identifier): Promise<Activity[]> {
    return activitiesService.getActivityLog(companyId, salesId);
  },

  // Junction table methods - delegated to JunctionsService

  // Contact-Organization relationships
  async getContactOrganizations(contactId: Identifier): Promise<{ data: ContactOrganization[] }> {
    return junctionsService.getContactOrganizations(contactId);
  },

  async addContactToOrganization(
    contactId: Identifier,
    organizationId: Identifier,
    params: JunctionParams = {}
  ): Promise<{ data: ContactOrganization }> {
    return junctionsService.addContactToOrganization(contactId, organizationId, params);
  },

  async removeContactFromOrganization(
    contactId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeContactFromOrganization(contactId, organizationId);
  },

  async setPrimaryOrganization(
    contactId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { success: boolean } }> {
    return junctionsService.setPrimaryOrganization(contactId, organizationId);
  },

  // Opportunity participants
  async getOpportunityParticipants(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityParticipant[] }> {
    return junctionsService.getOpportunityParticipants(opportunityId);
  },

  async addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params: Partial<OpportunityParticipant> = {}
  ): Promise<{ data: OpportunityParticipant }> {
    return junctionsService.addOpportunityParticipant(opportunityId, organizationId, params);
  },

  async removeOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeOpportunityParticipant(opportunityId, organizationId);
  },

  // Opportunity contacts
  async getOpportunityContacts(opportunityId: Identifier): Promise<{ data: OpportunityContact[] }> {
    return junctionsService.getOpportunityContacts(opportunityId);
  },

  async addOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
    params: JunctionParams = {}
  ): Promise<{ data: OpportunityContact }> {
    return junctionsService.addOpportunityContact(opportunityId, contactId, params);
  },

  async removeOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier
  ): Promise<{ data: { id: string } }> {
    return junctionsService.removeOpportunityContact(opportunityId, contactId);
  },

  // Opportunity contacts via junction table
  async getOpportunityContactsViaJunction(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityContact[] }> {
    return junctionsService.getOpportunityContacts(opportunityId);
  },

  async addOpportunityContactViaJunction(
    opportunityId: Identifier,
    contactId: Identifier,
    metadata?: { role?: string; is_primary?: boolean; notes?: string }
  ): Promise<{ data: OpportunityContact }> {
    return junctionsService.addOpportunityContact(opportunityId, contactId, metadata);
  },

  async removeOpportunityContactViaJunction(
    junctionId: Identifier
  ): Promise<{ data: { id: string } }> {
    try {
      await this.delete("opportunity_contacts", { id: junctionId });
      return { data: { id: String(junctionId) } };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[DataProvider] Failed to remove opportunity contact via junction`, {
        junctionId,
        error,
      });
      throw new Error(`Remove opportunity contact failed: ${errorMessage}`);
    }
  },

  // Extended capabilities for operations not covered by React Admin's base adapter
  // These ensure all database operations go through the unified provider

  /**
   * Execute RPC (Remote Procedure Call) functions
   * Provides validation, logging, and error handling for database functions
   * @param functionName The name of the RPC function to execute
   * @param params Parameters to pass to the RPC function
   * @returns The data returned by the RPC function
   */
  async rpc<T = unknown>(functionName: string, params: Record<string, unknown> = {}): Promise<T> {
    let validatedParams = params;
    try {
      // Log the operation for debugging
      console.log(`[DataProvider RPC] Calling ${functionName}`, params);

      // Validate params if schema exists for this RPC function
      if (functionName in RPC_SCHEMAS) {
        const schema = RPC_SCHEMAS[functionName as RPCFunctionName];
        const validationResult = schema.safeParse(params);

        if (!validationResult.success) {
          throw new Error(
            `Invalid RPC parameters for ${functionName}: ${validationResult.error.message}`
          );
        }

        // Use validated params
        validatedParams = validationResult.data as Record<string, unknown>;
      }

      const { data, error } = await supabase.rpc(functionName, validatedParams);

      if (error) {
        logError("rpc", functionName, { data: validatedParams }, error);
        throw new Error(`RPC ${functionName} failed: ${error.message}`);
      }

      console.log(`[DataProvider RPC] ${functionName} succeeded`, data);
      return data as T;
    } catch (error) {
      logError("rpc", functionName, { data: validatedParams }, error);
      throw error;
    }
  },

  /**
   * Storage operations for file handling
   * Provides consistent file upload/download with validation and error handling
   */
  storage: {
    /**
     * Upload a file to Supabase storage
     * @param bucket The storage bucket name
     * @param path The file path within the bucket
     * @param file The file to upload
     * @returns Upload result with path information
     */
    async upload(bucket: string, path: string, file: File | Blob): Promise<{ path: string }> {
      try {
        console.log(`[DataProvider Storage] Uploading to ${bucket}/${path}`, {
          size: file.size,
          type: file.type,
        });

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size exceeds 10MB limit");
        }

        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

        if (error) {
          logError("storage.upload", bucket, { path, size: file.size }, error);
          throw new Error(`Upload failed: ${error.message}`);
        }

        console.log(`[DataProvider Storage] Upload succeeded`, data);
        return data;
      } catch (error) {
        logError("storage.upload", bucket, { path }, error);
        throw error;
      }
    },

    /**
     * Get public URL for a file
     * @param bucket The storage bucket name
     * @param path The file path within the bucket
     * @returns The public URL for the file
     */
    getPublicUrl(bucket: string, path: string): string {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      console.log(`[DataProvider Storage] Generated public URL for ${bucket}/${path}`);
      return data.publicUrl;
    },

    /**
     * Remove files from storage
     * @param bucket The storage bucket name
     * @param paths Array of file paths to remove
     */
    async remove(bucket: string, paths: string[]): Promise<void> {
      try {
        console.log(`[DataProvider Storage] Removing from ${bucket}`, paths);

        const { error } = await supabase.storage.from(bucket).remove(paths);

        if (error) {
          logError("storage.remove", bucket, { paths }, error);
          throw new Error(`Remove failed: ${error.message}`);
        }

        console.log(`[DataProvider Storage] Remove succeeded`);
      } catch (error) {
        logError("storage.remove", bucket, { paths }, error);
        throw error;
      }
    },

    /**
     * List files in a storage bucket
     * @param bucket The storage bucket name
     * @param path Optional path prefix to filter files
     * @returns Array of file metadata
     */
    async list(bucket: string, path?: string): Promise<FileObject[]> {
      try {
        console.log(`[DataProvider Storage] Listing ${bucket}/${path || ""}`);

        const { data, error } = await supabase.storage.from(bucket).list(path);

        if (error) {
          logError("storage.list", bucket, { data: { path } }, error);
          throw new Error(`List failed: ${error.message}`);
        }

        console.log(`[DataProvider Storage] Listed ${data?.length || 0} files`);
        return (data as FileObject[]) || [];
      } catch (error) {
        logError("storage.list", bucket, { data: { path } }, error);
        throw error;
      }
    },
  },

  /**
   * Invoke Edge Functions
   * Provides consistent interface for calling Supabase Edge Functions
   * @param functionName The name of the edge function to invoke
   * @param options Options including method and body
   * @returns The data returned by the edge function
   */
  async invoke<T = unknown>(
    functionName: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const processedOptions = { ...options };
    try {
      console.log(`[DataProvider Edge] Invoking ${functionName}`, options);

      // Validate body params if schema exists for this Edge Function
      if (functionName in edgeFunctionSchemas && processedOptions.body) {
        const schema = edgeFunctionSchemas[functionName as EdgeFunctionName];
        const validationResult = schema.safeParse(processedOptions.body);

        if (!validationResult.success) {
          throw new Error(
            `Invalid Edge Function parameters for ${functionName}: ${validationResult.error.message}`
          );
        }

        // Use validated params
        processedOptions.body = validationResult.data as Record<string, unknown>;
      }

      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        method: processedOptions.method || "POST",
        body: processedOptions.body,
        headers: processedOptions.headers,
      });

      if (error) {
        logError("invoke", functionName, { data: processedOptions }, error);
        throw new Error(`Edge function ${functionName} failed: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Edge function ${functionName} returned no data`);
      }

      console.log(`[DataProvider Edge] ${functionName} succeeded`, data);
      return data;
    } catch (error) {
      logError("invoke", functionName, { data: processedOptions }, error);
      throw error;
    }
  },

  /**
   * Create Booth Visitor Opportunity
   * Atomically creates organization, contact, and opportunity records via database function
   * Used by Quick Add dialog for trade show lead capture
   * @param data QuickAddInput data from the form
   * @returns Result containing created record IDs
   */
  async createBoothVisitor(data: QuickAddInput): Promise<{ data: BoothVisitorResult }> {
    try {
      console.log("[DataProvider] Creating booth visitor", data);

      const { data: result, error } = await supabase.rpc("create_booth_visitor_opportunity", {
        _data: data,
      });

      if (error) {
        logError("createBoothVisitor", "booth_visitor", { data }, error);
        throw new Error(`Create booth visitor failed: ${error.message}`);
      }

      console.log("[DataProvider] Booth visitor created successfully", result);
      return { data: result as BoothVisitorResult };
    } catch (error) {
      logError("createBoothVisitor", "booth_visitor", { data }, error);
      throw error;
    }
  },
};

/**
 * Export a helper to check if a resource uses validation
 */
export function resourceUsesValidation(resource: string): boolean {
  return validationService.hasValidation(resource);
}

/**
 * Export a helper to check if a resource uses transformers
 */
export function resourceUsesTransformers(resource: string): boolean {
  return transformService.hasTransform(resource);
}

/**
 * Export services for testing and debugging
 */
export { validationService, transformService, storageService };

/**
 * Export CrmDataProvider type for convenience
 */
export type CrmDataProvider = typeof unifiedDataProvider;
