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
import type { PostgRestSortOrder } from "@raphiniert/ra-data-postgrest";
import { HttpError } from "react-admin";
import type { FileObject } from "@supabase/storage-js";
import type { QuickAddInput } from "../../validation/quickAdd";
import { quickAddSchema } from "../../validation/quickAdd";

import { supabase } from "./supabase";
import { getResourceName, supportsSoftDelete } from "./resources";
import { getDatabaseResource, applySearchParams, normalizeResponseData } from "./dataProviderUtils";
import { parseCompositeId, createCompositeId } from "../../validation/productDistributors";

// Import decomposed services
import { ValidationService, TransformService, StorageService } from "./services";

// Import structured logger for Sentry integration
import { logger } from "@/lib/logger";

// Import development-only logger
import { devLog, devWarn, DEV } from "@/lib/devLogger";

// Import deep equality check for update verification
import { dequal as isEqual } from "dequal";

// Import service classes
import {
  SalesService,
  OpportunitiesService,
  ActivitiesService,
  JunctionsService,
  SegmentsService,
  type OpportunityCreateInput,
  type OpportunityUpdateInput,
} from "../../services";

// Import RPC validation schemas
import {
  RPC_SCHEMAS,
  type RPCFunctionName,
  type CheckAuthorizationParams,
  type CheckAuthorizationResponse,
  type CheckAuthorizationBatchParams,
  type CheckAuthorizationBatchResponse,
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

import type { UserInvite, UserUpdate } from "../../validation/sales";

// Type for potentially wrapped RPC responses
type _RpcWrappedResponse<T> = T | { data: T };

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
    sortOrder: "asc,desc.nullslast" as PostgRestSortOrder,
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
 * Get current auth token for Edge Function calls
 * Used by inviteUser and updateUser methods
 */
const getAuthToken = async (): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
};

/**
 * Log error with context for debugging
 * Integrated from resilientDataProvider for consolidated error logging
 * Now also sends to Sentry via structured logger with rich tags for filtering
 */
function logError(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  error: unknown
): void {
  const extendedError = error as ExtendedError | undefined;

  // Build context with Sentry-friendly tag fields
  // Fields named 'method', 'resource', 'operation', 'feature', 'service' get promoted to tags
  const context = {
    // These become Sentry tags for filtering
    method,
    resource,
    operation: method, // Duplicate for clarity in Sentry UI
    service: "dataProvider",
    // These become Sentry extras for detail
    params: {
      id: params?.id,
      ids: params?.ids ? `[${params.ids.length} items]` : undefined,
      // Expanded from 200 to 1000 chars for pagination debugging
      filter: params?.filter ? JSON.stringify(params.filter).slice(0, 1000) : undefined,
      sort: params?.sort,
      pagination: params?.pagination,
      target: params?.target,
      hasData: !!params?.data,
    },
    timestamp: new Date().toISOString(),
    // Include validation errors for debugging
    validationErrors: extendedError?.body?.errors || extendedError?.errors || undefined,
    // Supabase/PostgREST error details
    supabaseCode: extendedError?.code,
    supabaseDetails: extendedError?.details,
    supabaseHint: extendedError?.hint,
  };

  // Track request failure for error rate calculation
  logger.trackRequest(`${method}:${resource}`, false);

  // Use structured logger to send to Sentry
  // The logger.error will automatically:
  // 1. Forward to Sentry.captureException with tags
  // 2. Promote 'method', 'resource', 'service' to Sentry tags
  // 3. Put remaining context into Sentry extras
  logger.error(
    `DataProvider error: ${method} ${resource}`,
    error instanceof Error ? error : new Error(String(error)),
    context
  );

  // Keep console.error for development debugging
  if (DEV) {
    console.error(`[DataProvider Error]`, context, {
      error:
        error instanceof Error
          ? error.message
          : extendedError?.message
            ? extendedError.message
            : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });
  }

  // Log validation errors in detail for debugging
  if (DEV) {
    if (extendedError?.body?.errors) {
      console.error(
        "[DataProvider Error] Validation Errors Detail",
        JSON.stringify(extendedError.body.errors, null, 2)
      );
    } else if (extendedError?.errors) {
      console.error(
        "[DataProvider Error] Validation Errors Detail",
        JSON.stringify(extendedError.errors, null, 2)
      );
    }
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
  // Strip non-schema fields BEFORE validation (view fields, React Admin internal IDs)
  // This handles: view JOIN fields, computed aggregations, SimpleFormIterator tracking IDs
  let dataToValidate = transformService.transformForValidation(resource, data);

  // For opportunities, merge defaults for fields that React Hook Form might not include
  // when they haven't been touched (even though defaultValues were set)
  if (resource === "opportunities" && operation === "create") {
    // Merge with defaults - ensures validation receives proper types even for untouched fields
    dataToValidate = {
      contact_ids: [], // Default to empty array (will fail min(1) validation with proper message)
      ...dataToValidate, // User's data overwrites defaults
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

    // If already in React Admin format (has errors nested in body)
    // This handles errors thrown by validation functions like validateContactForm()
    // Pass through unchanged - React Admin expects { message, body: { errors } }
    if (extendedError?.body?.errors && typeof extendedError.body.errors === "object") {
      throw error;
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
 * @template T - Record type with string keys and unknown values
 */
async function transformData<T extends Record<string, unknown>>(
  resource: string,
  data: Partial<T>,
  _operation: "create" | "update" = "create"
): Promise<Partial<T>> {
  // Use the TransformService
  return (await transformService.transform(resource, data)) as Partial<T>;
}

/**
 * Process data for database operations
 * CRITICAL: Validate FIRST, Transform SECOND (Issue 0.4)
 * This allows validation of original field names (e.g., 'products')
 * before transformation renames them (e.g., 'products_to_sync')
 * @template T - Record type with string keys and unknown values
 */
async function processForDatabase<T extends Record<string, unknown>>(
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
 * Tracks request success/failure for health monitoring
 */
async function wrapMethod<T>(
  method: string,
  resource: string,
  params: DataProviderLogParams & { previousData?: RaRecord },
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await operation();
    // Track successful request for error rate calculation
    const latency = Date.now() - startTime;
    logger.trackRequest(`${method}:${resource}`, true, latency);
    return result;
  } catch (error: unknown) {
    logError(method, resource, params, error);
    const extendedError = error as ExtendedError | undefined;

    /**
     * INTENTIONAL EXCEPTION TO FAIL-FAST PRINCIPLE
     *
     * Handle idempotent delete: if resource doesn't exist, treat as success.
     *
     * This supports React Admin's undoable mode where:
     * 1. User clicks delete → UI updates immediately (optimistic)
     * 2. Undo window appears (5 seconds)
     * 3. If no undo, API call fires
     * 4. If resource was already deleted (e.g., by another user), treat as success
     *
     * Without this, users would see confusing error messages for successful deletes.
     *
     * @see Engineering Constitution - documented UX exception to fail-fast
     */
    if (
      method === "delete" &&
      extendedError?.message?.includes("Cannot coerce the result to a single JSON object")
    ) {
      return { data: params.previousData } as T;
    }

    /**
     * SEARCH ERROR TRANSFORMATION
     *
     * PostgREST returns technical errors like "failed to parse logic tree"
     * when search queries contain special characters that break the filter parsing.
     * Transform these into user-friendly messages while preserving full details
     * in development for debugging.
     */
    if (
      method === "getList" &&
      (extendedError?.message?.includes("parse logic tree") ||
        extendedError?.message?.includes("syntax error") ||
        extendedError?.message?.includes("invalid input") ||
        extendedError?.details?.includes("parse") ||
        extendedError?.code === "PGRST100")
    ) {
      const friendlyMessage =
        "Search couldn't process your query. Try simpler terms or check for special characters.";

      // In development, include technical details for debugging
      if (DEV) {
        devWarn("DataProvider", "Search parsing error:", {
          originalMessage: extendedError?.message,
          details: extendedError?.details,
          code: extendedError?.code,
        });
      }

      throw new HttpError(friendlyMessage, 400);
    }

    /**
     * FOREIGN KEY CONSTRAINT ERROR TRANSFORMATION
     *
     * PostgreSQL returns technical errors like "violates foreign key constraint"
     * when a referenced record doesn't exist. Transform these into user-friendly
     * messages that explain what went wrong.
     */
    const message = extendedError?.message || '';
    const fkMatch = message.match(/violates foreign key constraint.*"(\w+)"/i);
    if (fkMatch) {
      const constraint = fkMatch[1];

      // Map constraint names to user-friendly messages
      const fkMessages: Record<string, string> = {
        'contacts_organization_id_fkey': "The selected organization doesn't exist or was deleted.",
        'contacts_sales_id_fkey': "The selected account manager doesn't exist.",
        'contacts_manager_id_fkey': "The selected manager doesn't exist.",
        'opportunities_principal_id_fkey': "The selected principal doesn't exist or was deleted.",
        'opportunities_organization_id_fkey': "The selected organization doesn't exist or was deleted.",
        'opportunities_sales_id_fkey': "The selected account manager doesn't exist.",
      };

      const friendlyMessage = fkMessages[constraint] || "A referenced record doesn't exist or was deleted.";

      if (DEV) {
        devWarn("DataProvider", "FK constraint error:", {
          constraint,
          originalMessage: message,
        });
      }

      throw new HttpError(friendlyMessage, 400);
    }

    /**
     * RLS POLICY VIOLATION HANDLING
     *
     * 403 from RLS policy violations should NOT trigger logout.
     * ra-supabase-core treats 403 as auth failure and calls logout,
     * but RLS violations are permission errors, not authentication failures.
     *
     * Transform into a 400 error so React Admin displays it as a
     * notification instead of triggering the auth flow.
     */
    if (
      extendedError?.status === 403 ||
      (typeof message === "string" && (
        message.includes("row-level security") ||
        message.includes("policy") ||
        message.includes("permission denied")
      ))
    ) {
      const friendlyMessage = "You don't have permission to modify this item.";

      if (DEV) {
        devWarn("DataProvider", "RLS policy violation (403→400):", {
          method,
          resource,
          originalMessage: message,
          status: extendedError?.status,
        });
      }

      // Throw HttpError with 400 (not 403) to prevent logout trigger
      throw new HttpError(friendlyMessage, 400);
    }

    // For validation errors, ensure React Admin format
    // This allows errors to be displayed inline next to form fields
    if (extendedError?.body?.errors && typeof extendedError.body.errors === "object") {
      // Already in correct format { message, body: { errors: { field: message } } }
      throw error;
    }

    // Handle { message, errors } format from validateData()
    // The !extendedError.code check prevents matching Supabase database errors
    if (
      extendedError?.errors &&
      typeof extendedError.errors === "object" &&
      !extendedError.code
    ) {
      throw {
        message: extendedError.message || "Validation failed",
        body: { errors: extendedError.errors },
      };
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
    // VERY VISIBLE DEBUG - should appear for EVERY getList call
    devWarn("DataProvider", "🔍 getList called for:", resource);

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

      // DEBUG: Check auth state before API call
      if (DEV) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        devLog("DataProvider", "Auth state", { authenticated: !!session });

        // DEBUG: Log full request params for pagination debugging
        console.log("[DataProvider] DEBUG REQUEST PARAMS", {
          originalResource: resource,
          dbResource,
          originalFilter: processedParams.filter,
          transformedFilter: searchParams.filter,
          pagination: searchParams.pagination,
          sort: searchParams.sort,
          // Compute range for debugging pagination issues
          computedRange: searchParams.pagination
            ? {
                offset:
                  (searchParams.pagination.page - 1) *
                  searchParams.pagination.perPage,
                limit: searchParams.pagination.perPage,
              }
            : null,
        });
      }

      // Execute query with diagnostic error capture
      let result;
      try {
        result = await baseDataProvider.getList(dbResource, searchParams);
      } catch (apiError) {
        // Log full diagnostic context BEFORE error transformation
        console.error("[DataProvider] PAGINATION DIAGNOSTIC", {
          resource,
          dbResource,
          searchParams: {
            filter: searchParams.filter,
            pagination: searchParams.pagination,
            sort: searchParams.sort,
          },
          error: {
            message: (apiError as ExtendedError)?.message,
            code: (apiError as ExtendedError)?.code,
            details: (apiError as ExtendedError)?.details,
            hint: (apiError as ExtendedError)?.hint,
            status: (apiError as ExtendedError)?.status,
          },
        });
        throw apiError; // Re-throw to let wrapMethod handle it
      }

      // DEBUG: Log result with customer_organization_name check for opportunities
      if (DEV) {
        if (resource === "opportunities" && result.data?.length > 0) {
          const sample = result.data[0] as Record<string, unknown>;
          console.log("[DataProvider] DEBUG OPPORTUNITIES First record fields:", {
            hasCustomerOrgName: "customer_organization_name" in sample,
            customerOrgNameValue: sample.customer_organization_name,
            hasCustomerOrgId: "customer_organization_id" in sample,
            customerOrgIdValue: sample.customer_organization_id,
            allKeys: Object.keys(sample).filter(
              (k) => k.includes("customer") || k.includes("organization")
            ),
          });
        }

        console.log("[DataProvider] DEBUG RESULT getList completed", {
          dataCount: result.data?.length,
          total: result.total,
        });
      }

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

      // Handle product_distributors composite key
      if (resource === "product_distributors") {
        const { product_id, distributor_id } = parseCompositeId(String(params.id));

        const { data, error } = await supabase
          .from("product_distributors")
          .select("*, product:products(id, name), distributor:organizations(id, name)")
          .eq("product_id", product_id)
          .eq("distributor_id", distributor_id)
          .single();

        if (error) throw error;

        return {
          data: {
            ...data,
            id: createCompositeId(data.product_id, data.distributor_id),
          },
        } as GetOneResult<RecordType>;
      }

      // Handle products - include distributors
      if (resource === "products") {
        const { data: product, error } = await supabase
          .from("products")
          .select("*, product_distributors(distributor_id, vendor_item_number)")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        // Transform for form consumption
        const distributor_ids =
          product.product_distributors?.map(
            (pd: { distributor_id: number }) => pd.distributor_id
          ) || [];
        const product_distributors: Record<number, { vendor_item_number: string | null }> = {};
        product.product_distributors?.forEach(
          (pd: { distributor_id: number; vendor_item_number: string | null }) => {
            product_distributors[pd.distributor_id] = { vendor_item_number: pd.vendor_item_number };
          }
        );

        return {
          data: {
            ...product,
            distributor_ids,
            product_distributors,
          } as RecordType,
        };
      }

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

      // Merge original params (target, id) with transformed filter (or, soft delete)
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
      let processedData = await processForDatabase(resource, params.data, "create");

      // Belt-and-suspenders: Explicitly strip quickCreate for contacts
      // TransformService should do this, but adding explicit stripping per React Admin patterns
      if (resource === "contacts") {
        const { quickCreate: _quickCreate, ...contactDataWithoutFlag } = processedData as Record<
          string,
          unknown
        >;
        processedData = contactDataWithoutFlag as typeof processedData;
      }

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
        // LIBRARY-BOUNDARY: Service returns Segment, but DataProvider generic expects RecordType.
        // Type-safe because caller uses dataProvider.create<Segment>("segments", {...})
        return { data: result as unknown as RecordType };
      }

      // Delegate opportunity creation to service (handles products sync)
      if (resource === "opportunities") {
        const result = await opportunitiesService.createWithProducts(
          processedData as Partial<OpportunityCreateInput>
        );
        // LIBRARY-BOUNDARY: Service returns Opportunity, but DataProvider generic expects RecordType.
        // Type-safe because caller uses dataProvider.create<Opportunity>("opportunities", {...})
        return { data: result as unknown as RecordType };
      }

      // Handle product creation with distributors
      if (resource === "products") {
        const { distributor_ids, product_distributors, ...productData } = processedData as Record<
          string,
          unknown
        >;

        // Create the product first
        const { data: product, error: productError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (productError) throw productError;

        // If distributors selected, create junction records
        if (Array.isArray(distributor_ids) && distributor_ids.length > 0) {
          const distributorRecords = distributor_ids.map((distId: number) => ({
            product_id: product.id,
            distributor_id: distId,
            vendor_item_number:
              (product_distributors as Record<string, { vendor_item_number?: string }>)?.[distId]
                ?.vendor_item_number || null,
            status: "active",
            valid_from: new Date().toISOString(),
          }));

          const { error: junctionError } = await supabase
            .from("product_distributors")
            .insert(distributorRecords);

          if (junctionError) throw junctionError;
        }

        return { data: product as RecordType };
      }

      // Handle product_distributors composite key
      if (resource === "product_distributors") {
        const dbResource = getResourceName(resource);
        const result = await baseDataProvider.create(dbResource, {
          ...params,
          data: processedData as Partial<RecordType>,
        });

        // Add composite ID for React Admin
        const data = result.data as Record<string, unknown>;
        return {
          data: {
            ...data,
            id: createCompositeId(Number(data.product_id), Number(data.distributor_id)),
          } as RecordType,
        };
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

      // Delegate opportunity update to service (handles products sync + optimistic locking)
      if (resource === "opportunities") {
        const previousProducts = params.previousData?.products || [];
        const previousVersion = params.previousData?.version as number | undefined;
        const result = await opportunitiesService.updateWithProducts(
          params.id,
          processedData as Partial<OpportunityUpdateInput>,
          previousProducts,
          previousVersion
        );
        // LIBRARY-BOUNDARY: Service returns Opportunity, but DataProvider generic expects RecordType.
        // Type-safe because caller uses dataProvider.update<Opportunity>("opportunities", {...})
        return { data: result as unknown as RecordType };
      }

      // Delegate sales update to Edge Function (RLS prevents direct PostgREST updates)
      // The sales table is protected - updates must go through /functions/v1/users
      if (resource === "sales") {
        const result = await salesService.salesUpdate(
          params.id,
          processedData as Partial<Omit<SalesFormData, "password">> & { deleted_at?: string }
        );
        return { data: { ...params.previousData, ...result, id: params.id } as RecordType };
      }

      // Handle product update with distributors
      if (resource === "products") {
        const { id } = params;
        const { distributor_ids, product_distributors, ...productData } = processedData as Record<
          string,
          unknown
        >;

        // Update the product
        const { data: product, error: productError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id)
          .select()
          .single();

        if (productError) throw productError;

        // Sync distributors if provided
        if (distributor_ids !== undefined) {
          // Delete existing junction records
          await supabase.from("product_distributors").delete().eq("product_id", id);

          // Insert new junction records
          if (Array.isArray(distributor_ids) && distributor_ids.length > 0) {
            const distributorRecords = distributor_ids.map((distId: number) => ({
              product_id: id,
              distributor_id: distId,
              vendor_item_number:
                (product_distributors as Record<string, { vendor_item_number?: string }>)?.[distId]
                  ?.vendor_item_number || null,
              status: "active",
              valid_from: new Date().toISOString(),
            }));

            await supabase.from("product_distributors").insert(distributorRecords);
          }
        }

        return { data: product as RecordType };
      }

      // Handle product_distributors composite key
      if (resource === "product_distributors") {
        const { product_id, distributor_id } = parseCompositeId(String(params.id));
        const dbResource = getResourceName(resource);

        // Update using composite key
        const { data, error } = await supabase
          .from(dbResource)
          .update({ ...processedData, updated_at: new Date().toISOString() })
          .eq("product_id", product_id)
          .eq("distributor_id", distributor_id)
          .select()
          .single();

        if (error) throw error;

        return {
          data: {
            ...data,
            id: createCompositeId(data.product_id, data.distributor_id),
          } as RecordType,
        };
      }

      // DEV: Log update payload for debugging silent save failures
      devWarn("DataProvider", "🔄 update() - payload:", {
        resource: dbResource,
        id: params.id,
        processedDataKeys: Object.keys(processedData),
        previousDataKeys: Object.keys(params.previousData || {}),
        processedData: DEV ? processedData : "[hidden in prod]",
      });

      // Execute update
      const result = await baseDataProvider.update(dbResource, {
        ...params,
        data: {
          ...processedData,
          id: params.id, // Preserve ID
        } as Partial<RecordType>,
      });

      // FAIL-FAST: Verify update actually occurred
      // ra-data-postgrest may return previousData without API call if no changes detected
      if (result.data && params.previousData) {
        const submittedKeys = Object.keys(params.data || {});
        const readonlyFields = ["id", "created_at", "updated_at", "deleted_at", "search_tsv"];

        // Check if any user-submitted fields actually changed in response
        const hasActualChange = submittedKeys.some((key) => {
          if (readonlyFields.includes(key)) return false;
          const resultData = result.data as Record<string, unknown>;
          const prevData = params.previousData as Record<string, unknown>;
          return !isEqual(resultData[key], prevData[key]);
        });

        // If response matches previousData, check if user actually submitted changes
        if (!hasActualChange && submittedKeys.length > 0) {
          // Determine which fields the user actually changed (not readonly, different from previous)
          const userChangedFields = submittedKeys.filter((key) => {
            if (readonlyFields.includes(key)) return false;
            const submittedData = params.data as Record<string, unknown>;
            const prevData = params.previousData as Record<string, unknown>;
            return !isEqual(submittedData[key], prevData[key]);
          });

          if (userChangedFields.length > 0) {
            // FAIL-FAST: User made real changes that weren't persisted - this is a failure
            const errorMessage = `Update failed: Changes to [${userChangedFields.join(", ")}] were not saved. The database returned unchanged data.`;

            if (DEV) {
              console.error("[DataProvider] Silent update failure detected:", {
                resource,
                id: params.id,
                changedFields: userChangedFields,
                submitted: params.data,
                returned: result.data,
                previousData: params.previousData,
              });
            }

            throw new HttpError(errorMessage, 500, {
              resource,
              id: params.id,
              changedFields: userChangedFields,
            });
          }
          // If no user-changed fields, it's a no-op (user clicked save without editing)
          // This is fine - return success silently
        }
      }

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
    console.log("🔴 [unifiedDataProvider.delete] ENTRY - resource:", resource, "id:", params.id);
    return wrapMethod("delete", resource, params, async () => {
      const dbResource = getResourceName(resource);
      console.log("🔴 [unifiedDataProvider.delete] Inside wrapMethod - dbResource:", dbResource);

      // Handle product_distributors composite key (hard delete, no soft delete)
      if (resource === "product_distributors") {
        const { product_id, distributor_id } = parseCompositeId(String(params.id));

        const { data, error } = await supabase
          .from("product_distributors")
          .delete()
          .eq("product_id", product_id)
          .eq("distributor_id", distributor_id)
          .select()
          .single();

        if (error) throw error;
        return { data: data as RecordType };
      }

      // P0 FIX: Opportunities require cascade soft-delete to related records
      // Uses archive_opportunity_with_relations RPC to soft-delete:
      // - The opportunity itself
      // - Related activities, opportunityNotes, opportunity_participants, tasks
      // Engineering Constitution: Fail-fast - if RPC fails, the whole delete fails
      if (resource === "opportunities") {
        console.log(
          "🔴 [delete] Starting delete for opportunity:",
          params.id,
          "type:",
          typeof params.id
        );

        // Coerce ID to number - React Admin Identifier can be string | number
        // RPC requires BIGINT, so we must ensure it's a valid integer
        const numericId = Number(params.id);
        console.log(
          "🔴 [delete] Coerced numericId:",
          numericId,
          "isInteger:",
          Number.isInteger(numericId)
        );

        if (!Number.isInteger(numericId) || numericId <= 0) {
          console.log("🔴 [delete] INVALID ID - throwing error");
          throw new Error(`Invalid opportunity ID: ${params.id}`);
        }

        console.log(
          '🔴 [delete] Calling supabase.rpc("archive_opportunity_with_relations", { opp_id:',
          numericId,
          "})"
        );
        const { error: rpcError } = await supabase.rpc("archive_opportunity_with_relations", {
          opp_id: numericId,
        });
        console.log("🔴 [delete] RPC returned, error:", rpcError);

        if (rpcError) {
          console.error("🔴 [delete] RPC FAILED:", rpcError);
          throw new Error(`Failed to delete opportunity: ${rpcError.message}`);
        }

        console.log("🔴 [delete] RPC SUCCESS - opportunity archived");
        // Return the previousData as the deleted record
        // React Admin expects the deleted record to be returned
        return { data: (params.previousData || { id: params.id }) as RecordType };
      }

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

      // P0 FIX: Opportunities require cascade soft-delete to related records
      // Must call RPC for each opportunity to cascade to activities, notes, tasks, participants
      if (resource === "opportunities") {
        // Call cascade RPC for each opportunity (fail-fast: stop on first error)
        for (const id of params.ids) {
          // Coerce ID to number - React Admin Identifier can be string | number
          // RPC requires BIGINT, so we must ensure it's a valid integer
          const numericId = Number(id);
          if (!Number.isInteger(numericId) || numericId <= 0) {
            throw new Error(`Invalid opportunity ID: ${id}`);
          }

          const { error: rpcError } = await supabase.rpc("archive_opportunity_with_relations", {
            opp_id: numericId,
          });

          if (rpcError) {
            console.error(`Failed to archive opportunity ${id} with relations:`, rpcError);
            throw new Error(`Failed to delete opportunity ${id}: ${rpcError.message}`);
          }
        }

        return { data: params.ids };
      }

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
      if (DEV) {
        console.error(`[DataProvider] Failed to remove opportunity contact via junction`, {
          junctionId,
          error,
        });
      }
      throw new HttpError(`Remove opportunity contact failed: ${errorMessage}`, 500);
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
    console.log(
      "🔴 [unifiedDataProvider.rpc] ENTRY - function:",
      functionName,
      "params:",
      JSON.stringify(params)
    );
    let validatedParams = params;
    try {
      // Log the operation for debugging
      devLog("DataProvider RPC", `Calling ${functionName}`, params);

      // Validate params if schema exists for this RPC function
      if (functionName in RPC_SCHEMAS) {
        const schema = RPC_SCHEMAS[functionName as RPCFunctionName];
        const validationResult = schema.safeParse(params);

        if (!validationResult.success) {
          throw new HttpError(
            `Invalid RPC parameters for ${functionName}: ${validationResult.error.message}`,
            400
          );
        }

        // Use validated params
        validatedParams = validationResult.data as Record<string, unknown>;
      }

      const { data, error } = await supabase.rpc(functionName, validatedParams);
      console.log(
        "🔴 [unifiedDataProvider.rpc] supabase.rpc returned - error:",
        error,
        "data:",
        data
      );

      if (error) {
        console.log("🔴 [unifiedDataProvider.rpc] FAILED:", error.message);
        logError("rpc", functionName, { data: validatedParams }, error);
        throw new HttpError(`RPC ${functionName} failed: ${error.message}`, 500);
      }

      console.log("🔴 [unifiedDataProvider.rpc] SUCCESS");
      devLog("DataProvider RPC", `${functionName} succeeded`, data);
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
        if (DEV) {
          console.log(`[DataProvider Storage] Uploading to ${bucket}/${path}`, {
            size: file.size,
            type: file.type,
          });
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new HttpError("File size exceeds 10MB limit", 413);
        }

        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

        if (error) {
          logError("storage.upload", bucket, { data: { path, size: file.size } }, error);
          throw new HttpError(`Upload failed: ${error.message}`, 500);
        }

        devLog("DataProvider Storage", "Upload succeeded", data);
        return data;
      } catch (error) {
        logError("storage.upload", bucket, { data: { path } }, error);
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
      devLog("DataProvider Storage", `Generated public URL for ${bucket}/${path}`);
      return data.publicUrl;
    },

    /**
     * Remove files from storage
     * @param bucket The storage bucket name
     * @param paths Array of file paths to remove
     */
    async remove(bucket: string, paths: string[]): Promise<void> {
      try {
        devLog("DataProvider Storage", `Removing from ${bucket}`, paths);

        const { error } = await supabase.storage.from(bucket).remove(paths);

        if (error) {
          logError("storage.remove", bucket, { data: { paths } }, error);
          throw new HttpError(`Remove failed: ${error.message}`, 500);
        }

        devLog("DataProvider Storage", "Remove succeeded");
      } catch (error) {
        logError("storage.remove", bucket, { data: { paths } }, error);
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
        devLog("DataProvider Storage", `Listing ${bucket}/${path || ""}`);

        const { data, error } = await supabase.storage.from(bucket).list(path);

        if (error) {
          logError("storage.list", bucket, { data: { path } }, error);
          throw new HttpError(`List failed: ${error.message}`, 500);
        }

        devLog("DataProvider Storage", `Listed ${data?.length || 0} files`);
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
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const processedOptions = { ...options };
    try {
      devLog("DataProvider Edge", `Invoking ${functionName}`, options);

      // EXPLICIT: Get auth token and add Authorization header
      // Supabase SDK auto-auth doesn't work reliably in browser context
      const token = await getAuthToken();
      const headers = {
        ...processedOptions.headers,
        Authorization: `Bearer ${token}`,
      };

      devLog("DataProvider Edge", `Auth header added for ${functionName}`);

      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        method: processedOptions.method || "POST",
        body: processedOptions.body,
        headers,
      });

      if (error) {
        logError("invoke", functionName, { data: processedOptions }, error);
        throw new HttpError(`Edge function ${functionName} failed: ${error.message}`, 500);
      }

      if (!data) {
        throw new HttpError(`Edge function ${functionName} returned no data`, 500);
      }

      devLog("DataProvider Edge", `${functionName} succeeded`, data);
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
      devLog("DataProvider", "Creating booth visitor", data);

      const validationResult = quickAddSchema.safeParse(data);
      if (!validationResult.success) {
        throw new HttpError(`Invalid booth visitor data: ${validationResult.error.message}`, 400);
      }

      const { data: result, error } = await supabase.rpc("create_booth_visitor_opportunity", {
        _data: validationResult.data,
      });

      if (error) {
        logError("createBoothVisitor", "booth_visitor", { data }, error);
        throw new HttpError(`Create booth visitor failed: ${error.message}`, 500);
      }

      devLog("DataProvider", "Booth visitor created successfully", result);
      return { data: result as BoothVisitorResult };
    } catch (error) {
      logError("createBoothVisitor", "booth_visitor", { data }, error);
      throw error;
    }
  },

  // =====================================================
  // Authorization Methods
  // =====================================================

  /**
   * Check Authorization (Single)
   * Verifies if a principal is authorized to sell through a distributor.
   * Supports Product→Org fallback: if productId provided, looks up principal from product.
   *
   * @param distributorId - The distributor to check authorization for
   * @param principalId - Optional direct principal ID to check
   * @param productId - Optional product ID (principal will be resolved from product)
   * @returns Authorization status with details
   *
   * @example
   * // Check direct principal authorization
   * const result = await dataProvider.checkAuthorization(distributorId, principalId);
   *
   * // Check via product (Product→Org fallback)
   * const result = await dataProvider.checkAuthorization(distributorId, undefined, productId);
   */
  async checkAuthorization(
    distributorId: number,
    principalId?: number | null,
    productId?: number | null
  ): Promise<CheckAuthorizationResponse> {
    const params: CheckAuthorizationParams = {
      _distributor_id: distributorId,
      _principal_id: principalId ?? null,
      _product_id: productId ?? null,
    };

    try {
      devLog("DataProvider", "Checking authorization", params);

      const result = await this.rpc<CheckAuthorizationResponse>("check_authorization", params);

      devLog("DataProvider", "Authorization check result", result);
      return result;
    } catch (error) {
      logError("checkAuthorization", "authorization", { data: params }, error);
      throw error;
    }
  },

  /**
   * Check Authorization (Batch)
   * Batch authorization check for multiple products or principals.
   * Useful for validating entire opportunity line item lists at once.
   *
   * @param distributorId - The distributor to check authorization for
   * @param productIds - Optional array of product IDs to check
   * @param principalIds - Optional array of principal IDs to check
   * @returns Batch result with individual authorization statuses
   *
   * @example
   * // Check multiple products
   * const result = await dataProvider.checkAuthorizationBatch(distributorId, [1, 2, 3]);
   *
   * // Check multiple principals
   * const result = await dataProvider.checkAuthorizationBatch(distributorId, undefined, [4, 5]);
   */
  async checkAuthorizationBatch(
    distributorId: number,
    productIds?: number[] | null,
    principalIds?: number[] | null
  ): Promise<CheckAuthorizationBatchResponse> {
    const params: CheckAuthorizationBatchParams = {
      _distributor_id: distributorId,
      _product_ids: productIds ?? null,
      _principal_ids: principalIds ?? null,
    };

    try {
      devLog("DataProvider", "Checking authorization batch", params);

      const result = await this.rpc<CheckAuthorizationBatchResponse>(
        "check_authorization_batch",
        params
      );

      devLog("DataProvider", "Authorization batch result", result);
      return result;
    } catch (error) {
      logError("checkAuthorizationBatch", "authorization", { data: params }, error);
      throw error;
    }
  },

  // =====================================================
  // User Management Methods
  // =====================================================

  /**
   * Invite a new user via Edge Function
   * Creates user account and sends invitation email
   * @param data UserInvite data with email, password, name, and role
   * @returns The created sales record
   */
  async inviteUser(data: UserInvite): Promise<{ data: Sale }> {
    try {
      devLog("DataProvider", "Inviting user", { email: data.email, role: data.role });

      const token = await getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Handle multiple error formats: { message }, { error: { message } }, or text
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.message || errorData?.error?.message || `Invite failed (${response.status})`;
        throw new Error(message);
      }

      const result = await response.json();
      devLog("DataProvider", "User invited successfully", result);
      return result;
    } catch (error) {
      logError("inviteUser", "users", { data }, error);
      throw error;
    }
  },

  /**
   * Update an existing user via Edge Function
   * @param data UserUpdate data with sales_id and fields to update
   * @returns The updated sales record
   */
  async updateUser(data: UserUpdate): Promise<{ data: Sale }> {
    try {
      devLog("DataProvider", "Updating user", { sales_id: data.sales_id, role: data.role });

      const token = await getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Handle multiple error formats: { message }, { error: { message } }, or text
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.message || errorData?.error?.message || `Update failed (${response.status})`;
        throw new Error(message);
      }

      const result = await response.json();
      devLog("DataProvider", "User updated successfully", result);
      return result;
    } catch (error) {
      logError("updateUser", "users", { data }, error);
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
