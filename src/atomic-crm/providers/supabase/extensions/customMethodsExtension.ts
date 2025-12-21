/**
 * Custom Methods Extension Layer
 *
 * Decorator function that extends the composedDataProvider with all 30 custom methods
 * from the original unifiedDataProvider. Breaks circular dependency by receiving
 * pre-initialized services from the ServiceContainer factory.
 *
 * Architecture:
 * - Delegates business logic methods (19) to service layer
 * - Implements infrastructure methods (11) with direct Supabase client access
 * - Preserves exact API compatibility with unifiedDataProvider
 * - Maintains Zod validation for RPC and Edge Function parameters
 *
 * Engineering Constitution:
 * - Service layer orchestration (business logic delegated to services)
 * - Single composable entry point (all methods accessible via provider)
 * - Fail-fast error handling (Zod validation, explicit error logging)
 *
 * @module providers/supabase/extensions/customMethodsExtension
 */

import type { DataProvider, Identifier } from "ra-core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FileObject } from "@supabase/storage-js";

// Import service container types
import type { ServiceContainer } from "../services";

// Import extension types
import type { ExtendedDataProvider, JunctionParams, BoothVisitorResult } from "./types";

// Import validation schemas
import {
  RPC_SCHEMAS,
  type RPCFunctionName,
  edgeFunctionSchemas,
  type EdgeFunctionName,
} from "../../../validation/rpc";

// Import types for custom methods
import type {
  SalesFormData,
  Sale,
  Opportunity,
  OpportunityParticipant,
  ContactOrganization,
  OpportunityContact,
  Activity,
} from "../../../types";
import type { QuickAddInput } from "../../../validation/quickAdd";

/**
 * Configuration for extending DataProvider with custom methods
 */
export interface ExtensionConfig {
  /** Composed DataProvider with handler routing */
  composedProvider: DataProvider;

  /** Pre-initialized service container with all business logic services */
  services: ServiceContainer;

  /** Supabase client for direct RPC/Storage/Edge Function access */
  supabaseClient: SupabaseClient;
}

/**
 * Error logging helper matching unifiedDataProvider pattern
 *
 * @param method - The method name (e.g., "rpc", "storage.upload")
 * @param resource - Resource or function name being accessed
 * @param params - Parameters passed to the method
 * @param error - The error that occurred
 */
function logError(
  method: string,
  resource: string,
  params: Record<string, unknown>,
  error: unknown
): void {
  console.error(`[DataProvider ${method}] Error in ${resource}:`, {
    params,
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Extend DataProvider with custom methods
 *
 * Decorator function that adds all 30 custom methods from unifiedDataProvider
 * to the composedDataProvider. Breaks circular dependency by receiving
 * services as a dependency rather than initializing them inline.
 *
 * @param config - Configuration with provider, services, and Supabase client
 * @returns Extended DataProvider with all CRUD + custom methods
 *
 * @example
 * ```typescript
 * // Stage 1: Create base provider (CRUD only)
 * const baseProvider = supabaseDataProvider({
 *   instanceUrl: import.meta.env.VITE_SUPABASE_URL,
 *   apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
 *   supabaseClient: supabase,
 * });
 *
 * // Stage 2: Initialize services (breaks circular dependency)
 * const services = createServiceContainer(baseProvider);
 *
 * // Stage 3: Create composed provider with handler routing
 * const composedProvider = createComposedDataProvider(baseProvider);
 *
 * // Stage 4: Extend with custom methods
 * export const dataProvider = extendWithCustomMethods({
 *   composedProvider,
 *   services,
 *   supabaseClient: supabase,
 * });
 * ```
 *
 * @remarks
 * **Method Delegation Strategy:**
 * - **Service Methods (19 total):**
 *   - Sales: 3 methods → SalesService
 *   - Opportunities: 2 methods → OpportunitiesService
 *   - Activities: 1 method → ActivitiesService
 *   - Junctions: 13 methods → JunctionsService
 *
 * - **Infrastructure Methods (11 total):**
 *   - RPC: 1 method → Direct Supabase with Zod validation
 *   - Storage: 4 methods → Direct Supabase storage API
 *   - Edge Functions: 1 method → Direct Supabase functions API with Zod validation
 *   - Specialized: 5 methods → Direct Supabase RPC
 *
 * **Validation:**
 * - RPC calls validate against RPC_SCHEMAS
 * - Edge Functions validate against edgeFunctionSchemas
 * - All errors logged with context for debugging
 *
 * **Error Handling:**
 * - Fail-fast approach (no circuit breakers)
 * - Explicit error logging before throwing
 * - Type-safe error messages
 */
export function extendWithCustomMethods(config: ExtensionConfig): ExtendedDataProvider {
  const { composedProvider, services, supabaseClient } = config;

  return {
    // ========================================================================
    // BASE CRUD METHODS (9 methods from React Admin DataProvider interface)
    // ========================================================================
    // All delegated to composedProvider which handles routing to resource-specific handlers
    ...composedProvider,

    // ========================================================================
    // CATEGORY 1: SALES METHODS (3 methods → SalesService)
    // ========================================================================

    /**
     * Create account manager via Edge Function
     * Delegates to SalesService which calls create-sales Edge Function
     *
     * @param body - Sales form data with email, password, profile info
     * @returns Created sale record with user_id
     */
    salesCreate: async (body: SalesFormData): Promise<Sale> => {
      return services.sales.salesCreate(body);
    },

    /**
     * Update account manager profile via Edge Function
     * Delegates to SalesService which calls update-sales Edge Function
     *
     * @param id - Sale record ID
     * @param data - Partial sales data (password excluded)
     * @returns Updated partial sales data
     */
    salesUpdate: async (
      id: Identifier,
      data: Partial<Omit<SalesFormData, "password">>
    ): Promise<Partial<Omit<SalesFormData, "password">>> => {
      return services.sales.salesUpdate(id, data);
    },

    /**
     * Trigger password reset email via Edge Function
     * Delegates to SalesService which calls reset-password Edge Function
     *
     * @param id - Sale record ID
     * @returns Success boolean
     */
    updatePassword: async (id: Identifier): Promise<boolean> => {
      return services.sales.updatePassword(id);
    },

    // ========================================================================
    // CATEGORY 2: OPPORTUNITIES METHODS (2 methods → OpportunitiesService)
    // ========================================================================

    /**
     * Archive opportunity via RPC function
     * Delegates to OpportunitiesService which calls archive_opportunity RPC
     *
     * @param opportunity - Opportunity record to archive
     * @returns Array of updated opportunities (archiving may affect related records)
     */
    archiveOpportunity: async (opportunity: Opportunity): Promise<Opportunity[]> => {
      return services.opportunities.archiveOpportunity(opportunity);
    },

    /**
     * Unarchive opportunity via RPC function
     * Delegates to OpportunitiesService which calls unarchive_opportunity RPC
     *
     * @param opportunity - Opportunity record to unarchive
     * @returns Array of updated opportunities (unarchiving may affect related records)
     */
    unarchiveOpportunity: async (opportunity: Opportunity): Promise<Opportunity[]> => {
      return services.opportunities.unarchiveOpportunity(opportunity);
    },

    // ========================================================================
    // CATEGORY 3: ACTIVITIES METHODS (1 method → ActivitiesService)
    // ========================================================================

    /**
     * Fetch activity log via RPC function
     * Delegates to ActivitiesService which calls get_activity_log RPC
     *
     * @param companyId - Optional organization ID to filter activities
     * @param salesId - Optional sales rep ID to filter activities
     * @returns Array of activity records
     */
    getActivityLog: async (companyId?: Identifier, salesId?: Identifier): Promise<Activity[]> => {
      return services.activities.getActivityLog(companyId, salesId);
    },

    // ========================================================================
    // CATEGORY 4: CONTACT-ORGANIZATION JUNCTION METHODS (4 methods → JunctionsService)
    // ========================================================================

    /**
     * Get all organizations linked to a contact
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @returns Wrapped array of contact-organization junction records
     */
    getContactOrganizations: async (
      contactId: Identifier
    ): Promise<{ data: ContactOrganization[] }> => {
      return services.junctions.getContactOrganizations(contactId);
    },

    /**
     * Link contact to organization
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID
     * @param params - Junction metadata (is_primary, role, notes)
     * @returns Wrapped contact-organization junction record
     */
    addContactToOrganization: async (
      contactId: Identifier,
      organizationId: Identifier,
      params: JunctionParams
    ): Promise<{ data: ContactOrganization }> => {
      return services.junctions.addContactToOrganization(contactId, organizationId, params);
    },

    /**
     * Unlink contact from organization
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID
     * @returns Wrapped success response with junction ID
     */
    removeContactFromOrganization: async (
      contactId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeContactFromOrganization(contactId, organizationId);
    },

    /**
     * Set primary organization for contact via RPC
     * Delegates to JunctionsService which calls set_primary_organization RPC
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID to set as primary
     * @returns Wrapped success response
     */
    setPrimaryOrganization: async (
      contactId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { success: boolean } }> => {
      return services.junctions.setPrimaryOrganization(contactId, organizationId);
    },

    // ========================================================================
    // CATEGORY 5: OPPORTUNITY PARTICIPANT JUNCTION METHODS (3 methods → JunctionsService)
    // ========================================================================

    /**
     * Get all participant organizations for an opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-participant junction records
     */
    getOpportunityParticipants: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityParticipant[] }> => {
      return services.junctions.getOpportunityParticipants(opportunityId);
    },

    /**
     * Add participant organization to opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param organizationId - Organization record ID
     * @param params - Partial opportunity participant data
     * @returns Wrapped opportunity-participant junction record
     */
    addOpportunityParticipant: async (
      opportunityId: Identifier,
      organizationId: Identifier,
      params: Partial<OpportunityParticipant>
    ): Promise<{ data: OpportunityParticipant }> => {
      return services.junctions.addOpportunityParticipant(opportunityId, organizationId, params);
    },

    /**
     * Remove participant organization from opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param organizationId - Organization record ID
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityParticipant: async (
      opportunityId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeOpportunityParticipant(opportunityId, organizationId);
    },

    // ========================================================================
    // CATEGORY 6: OPPORTUNITY CONTACT JUNCTION METHODS (6 methods → JunctionsService)
    // ========================================================================

    /**
     * Get all contacts linked to an opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-contact junction records
     */
    getOpportunityContacts: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityContact[] }> => {
      return services.junctions.getOpportunityContacts(opportunityId);
    },

    /**
     * Link contact to opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @param params - Junction metadata (is_primary, role, notes)
     * @returns Wrapped opportunity-contact junction record
     */
    addOpportunityContact: async (
      opportunityId: Identifier,
      contactId: Identifier,
      params: JunctionParams
    ): Promise<{ data: OpportunityContact }> => {
      return services.junctions.addOpportunityContact(opportunityId, contactId, params);
    },

    /**
     * Unlink contact from opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityContact: async (
      opportunityId: Identifier,
      contactId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeOpportunityContact(opportunityId, contactId);
    },

    /**
     * Alternative getter for opportunity contacts via junction table
     * Legacy compatibility method (identical to getOpportunityContacts)
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-contact junction records
     */
    getOpportunityContactsViaJunction: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityContact[] }> => {
      return services.junctions.getOpportunityContactsViaJunction(opportunityId);
    },

    /**
     * Alternative adder for opportunity contacts with metadata
     * Legacy compatibility method with explicit metadata parameter
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @param metadata - Optional junction metadata
     * @returns Wrapped opportunity-contact junction record
     */
    addOpportunityContactViaJunction: async (
      opportunityId: Identifier,
      contactId: Identifier,
      metadata?: { role?: string; notes?: string }
    ): Promise<{ data: OpportunityContact }> => {
      return services.junctions.addOpportunityContactViaJunction(
        opportunityId,
        contactId,
        metadata
      );
    },

    /**
     * Remove opportunity contact by junction ID
     * Delegates to JunctionsService
     *
     * @param junctionId - Junction record ID to delete
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityContactViaJunction: async (
      junctionId: Identifier
    ): Promise<{ data: { id: string } }> => {
      const result = await services.junctions.removeOpportunityContactViaJunctionId(junctionId);
      return { data: { id: String(result.data.id) } };
    },

    // ========================================================================
    // CATEGORY 7: RPC OPERATIONS (1 method → Direct Supabase with Zod validation)
    // ========================================================================

    /**
     * Execute Supabase RPC function with Zod validation
     *
     * Generic method for calling database functions. Validates parameters
     * against RPC_SCHEMAS if a schema exists for the function.
     *
     * @param functionName - Name of the RPC function to call
     * @param params - Parameters to pass to the function
     * @returns Typed result from the RPC function
     *
     * @example
     * ```typescript
     * // Call with validation (schema exists)
     * const result = await dataProvider.rpc<SegmentData>(
     *   "get_or_create_segment",
     *   { segment_name: "Enterprise" }
     * );
     *
     * // Call without validation (no schema defined)
     * const custom = await dataProvider.rpc<CustomResult>(
     *   "custom_function",
     *   { param: "value" }
     * );
     * ```
     */
    rpc: async <T = unknown>(
      functionName: string,
      params: Record<string, unknown> = {}
    ): Promise<T> => {
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

        const { data, error } = await supabaseClient.rpc(functionName, validatedParams);

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

    // ========================================================================
    // CATEGORY 8: STORAGE OPERATIONS (4 methods → Direct Supabase Storage API)
    // ========================================================================

    /**
     * Storage operations for file handling
     *
     * Provides consistent file upload/download with validation and error handling.
     * All storage methods use the Supabase Storage API directly.
     */
    storage: {
      /**
       * Upload file to Supabase storage with size validation
       *
       * @param bucket - The storage bucket name
       * @param path - The file path within the bucket
       * @param file - The file to upload (File or Blob)
       * @returns Upload result with path information
       *
       * @throws Error if file size exceeds 10MB limit
       * @throws Error if upload fails
       */
      upload: async (
        bucket: string,
        path: string,
        file: File | Blob
      ): Promise<{ path: string }> => {
        try {
          console.log(`[DataProvider Storage] Uploading to ${bucket}/${path}`, {
            size: file.size,
            type: file.type,
          });

          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("File size exceeds 10MB limit");
          }

          const { data, error } = await supabaseClient.storage.from(bucket).upload(path, file, {
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
       * Get public URL for a stored file
       *
       * @param bucket - The storage bucket name
       * @param path - The file path within the bucket
       * @returns The public URL for the file
       */
      getPublicUrl: (bucket: string, path: string): string => {
        const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
        console.log(`[DataProvider Storage] Generated public URL for ${bucket}/${path}`);
        return data.publicUrl;
      },

      /**
       * Remove files from storage
       *
       * @param bucket - The storage bucket name
       * @param paths - Array of file paths to remove
       *
       * @throws Error if removal fails
       */
      remove: async (bucket: string, paths: string[]): Promise<void> => {
        try {
          console.log(`[DataProvider Storage] Removing from ${bucket}`, paths);

          const { error } = await supabaseClient.storage.from(bucket).remove(paths);

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
       *
       * @param bucket - The storage bucket name
       * @param path - Optional path prefix to filter files
       * @returns Array of file metadata
       *
       * @throws Error if listing fails
       */
      list: async (bucket: string, path?: string): Promise<FileObject[]> => {
        try {
          console.log(`[DataProvider Storage] Listing ${bucket}/${path || ""}`);

          const { data, error } = await supabaseClient.storage.from(bucket).list(path);

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

    // ========================================================================
    // CATEGORY 9: EDGE FUNCTION INVOCATION (1 method → Direct Supabase with Zod validation)
    // ========================================================================

    /**
     * Invoke Supabase Edge Function with Zod validation
     *
     * Generic method for calling Edge Functions. Validates body parameters
     * against edgeFunctionSchemas if a schema exists for the function.
     *
     * @param functionName - Name of the Edge Function to invoke
     * @param options - Options including HTTP method, body, and headers
     * @returns Typed result from the Edge Function
     *
     * @example
     * ```typescript
     * // POST with body validation (schema exists)
     * const result = await dataProvider.invoke<Sale>(
     *   "create-sales",
     *   {
     *     method: "POST",
     *     body: { email: "test@example.com", password: "secure123" }
     *   }
     * );
     *
     * // GET without body
     * const data = await dataProvider.invoke<SalesData>(
     *   "get-sales-data",
     *   { method: "GET" }
     * );
     * ```
     */
    invoke: async <T = unknown>(
      functionName: string,
      options: {
        method?: "GET" | "POST" | "PUT" | "DELETE";
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
      } = {}
    ): Promise<T> => {
      const processedOptions = { ...options };
      try {
        console.log(`[DataProvider Edge] Invoking ${functionName}`, options);

        // Validate body params if schema exists for this Edge Function
        // Note: edgeFunctionSchemas is currently empty, validation will be added when Edge Functions are implemented
        const edgeFunctionNames = Object.keys(edgeFunctionSchemas);
        if (
          edgeFunctionNames.length > 0 &&
          edgeFunctionNames.includes(functionName) &&
          processedOptions.body
        ) {
          // Safe to access schema since we've verified the function name exists
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

        const { data, error } = await supabaseClient.functions.invoke<T>(functionName, {
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

    // ========================================================================
    // CATEGORY 10: SPECIALIZED BUSINESS OPERATIONS (1 method → Direct Supabase RPC)
    // ========================================================================

    /**
     * Create Booth Visitor Opportunity (Atomic Operation)
     *
     * Atomically creates organization, contact, and opportunity records via
     * database function. Used for trade show lead capture with transaction
     * guarantees (all-or-nothing creation).
     *
     * @param data - QuickAddInput data from the quick add form
     * @returns Result containing IDs of all created records
     *
     * @example
     * ```typescript
     * const result = await dataProvider.createBoothVisitor({
     *   organization_name: "Acme Corp",
     *   contact_name: "John Doe",
     *   contact_email: "john@acme.com",
     *   opportunity_title: "Q4 Enterprise Deal",
     *   opportunity_value: 50000
     * });
     *
     * // Result: { data: { organization_id, contact_id, opportunity_id } }
     * ```
     */
    createBoothVisitor: async (data: QuickAddInput): Promise<{ data: BoothVisitorResult }> => {
      try {
        console.log("[DataProvider] Creating booth visitor", data);

        const { data: result, error } = await supabaseClient.rpc(
          "create_booth_visitor_opportunity",
          {
            _data: data,
          }
        );

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
  } as ExtendedDataProvider;
}
