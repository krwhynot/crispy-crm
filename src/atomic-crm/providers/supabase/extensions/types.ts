/**
 * Extension Layer Types
 *
 * Defines the extended DataProvider interface with all 30 custom methods.
 * Preserves exact API surface from unifiedDataProvider for backward compatibility.
 *
 * Custom Methods Breakdown:
 * - Sales: 3 methods (salesCreate, salesUpdate, updatePassword)
 * - Opportunities: 2 methods (archive, unarchive)
 * - Activities: 1 method (getActivityLog)
 * - Opportunity Participant Junction: 3 methods
 * - Opportunity Contact Junction: 6 methods
 * - RPC: 1 method
 * - Storage: 4 methods (nested object)
 * - Edge Functions: 1 method (invoke)
 * - Specialized: 1 method (createBoothVisitor)
 *
 * Total: 26 custom methods beyond base DataProvider (9 CRUD methods)
 *
 * Engineering Constitution:
 * - Single composable entry point (unified interface)
 * - Type safety (types inferred from Zod schemas where possible)
 * - Explicit contracts (all signatures documented)
 *
 * @module providers/supabase/extensions/types
 */

import type { DataProvider, Identifier } from "ra-core";
import type { FileObject } from "@supabase/storage-js";
import type {
  SalesFormData,
  Sale,
  Opportunity,
  OpportunityParticipant,
  OpportunityContact,
  Activity,
} from "../../../types";
import type { QuickAddInput } from "../../../validation/quickAdd";
import type {
  LogActivityWithTaskParams,
  LogActivityWithTaskResponse,
} from "../../../validation/rpc";

/**
 * Junction operation parameters
 *
 * Used by junction table methods to specify relationship metadata.
 * Fields are optional and resource-specific.
 */
export interface JunctionParams {
  /** Mark this relationship as the primary one (e.g., primary organization for a contact) */
  is_primary?: boolean;
  /** Role description (e.g., "Decision Maker", "Technical Contact") */
  role?: string;
  /** Additional notes about the relationship */
  notes?: string;
}

/**
 * Booth visitor creation result
 *
 * Returned by createBoothVisitor RPC function.
 * Contains IDs of all three atomically created records.
 */
export interface BoothVisitorResult {
  organization_id: Identifier;
  contact_id: Identifier;
  opportunity_id: Identifier;
}

/**
 * Extended DataProvider with all 30 custom methods
 *
 * Extends React Admin's base DataProvider interface with Atomic CRM-specific
 * custom methods. This interface defines the complete API surface including:
 * - 9 base CRUD methods (from React Admin DataProvider)
 * - 30 custom methods (Atomic CRM extensions)
 *
 * @remarks
 * This interface is implemented by both:
 * - unifiedDataProvider (current monolithic implementation)
 * - extendedProvider (new composed architecture with extension layer)
 *
 * Maintaining exact API parity ensures backward compatibility during migration.
 */
export interface ExtendedDataProvider extends DataProvider {
  // ==================== Sales Methods ====================
  // Delegate to SalesService

  /**
   * Create account manager via Edge Function
   *
   * @param body - Sales user form data including email, password, profile
   * @returns Created sales user record
   * @throws Error if Edge Function fails or validation errors
   *
   * @example
   * ```typescript
   * const sale = await dataProvider.salesCreate({
   *   email: "john@example.com",
   *   password: "SecurePass123",
   *   first_name: "John",
   *   last_name: "Doe",
   *   role: "rep",
   *   is_admin: false,
   * });
   * ```
   */
  salesCreate(body: SalesFormData): Promise<Sale>;

  /**
   * Update account manager profile via Edge Function
   *
   * @param id - Sales user ID
   * @param data - Partial sales user data (password excluded)
   * @returns Updated sales user record
   * @throws Error if Edge Function fails or user not found
   *
   * @example
   * ```typescript
   * await dataProvider.salesUpdate(1, {
   *   first_name: "Jane",
   *   role: "manager",
   * });
   * ```
   */
  salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>
  ): Promise<Partial<Omit<SalesFormData, "password">>>;

  /**
   * Trigger password reset email for account manager
   *
   * @param id - Sales user ID
   * @returns True if reset email sent successfully
   * @throws Error if Edge Function fails or user not found
   *
   * @example
   * ```typescript
   * await dataProvider.updatePassword(1);
   * // User receives password reset email
   * ```
   */
  updatePassword(id: Identifier): Promise<boolean>;

  // ==================== Opportunities Methods ====================
  // Delegate to OpportunitiesService

  /**
   * Archive opportunity via RPC
   *
   * Sets opportunity status to archived and updates metadata.
   *
   * @param opportunity - Opportunity to archive
   * @returns Updated opportunity records
   * @throws Error if RPC fails
   *
   * @example
   * ```typescript
   * await dataProvider.archiveOpportunity(opportunity);
   * ```
   */
  archiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]>;

  /**
   * Unarchive opportunity via RPC
   *
   * Restores opportunity from archived status.
   *
   * @param opportunity - Opportunity to unarchive
   * @returns Updated opportunity records
   * @throws Error if RPC fails
   *
   * @example
   * ```typescript
   * await dataProvider.unarchiveOpportunity(opportunity);
   * ```
   */
  unarchiveOpportunity(opportunity: Opportunity): Promise<Opportunity[]>;

  // ==================== Activities Methods ====================
  // Delegate to ActivitiesService

  /**
   * Get activity log via RPC
   *
   * Fetches activity history with optional filtering by company or sales rep.
   *
   * @param companyId - Optional company ID to filter activities
   * @param salesId - Optional sales rep ID to filter activities
   * @returns Array of activity records
   * @throws Error if RPC fails
   *
   * @example
   * ```typescript
   * // Get all activities for a company
   * const activities = await dataProvider.getActivityLog(123);
   *
   * // Get all activities for a sales rep
   * const activities = await dataProvider.getActivityLog(undefined, 456);
   *
   * // Get activities for a sales rep at a specific company
   * const activities = await dataProvider.getActivityLog(123, 456);
   * ```
   */
  getActivityLog(companyId?: Identifier, salesId?: Identifier): Promise<Activity[]>;

  // ==================== Opportunity Participant Junction ====================
  // Delegate to JunctionsService

  /**
   * Get all participant organizations for an opportunity
   *
   * @param opportunityId - Opportunity ID
   * @returns Array of participant organization relationships
   * @throws Error if query fails
   *
   * @example
   * ```typescript
   * const { data } = await dataProvider.getOpportunityParticipants(123);
   * // data: [{ id, opportunity_id, organization_id, role }]
   * ```
   */
  getOpportunityParticipants(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityParticipant[] }>;

  /**
   * Add participant organization to opportunity
   *
   * @param opportunityId - Opportunity ID
   * @param organizationId - Organization ID
   * @param params - Participant metadata
   * @returns Created participant record
   * @throws Error if already participating or constraint violation
   *
   * @example
   * ```typescript
   * const { data } = await dataProvider.addOpportunityParticipant(123, 456, {
   *   role: "Customer",
   * });
   * ```
   */
  addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params?: Partial<OpportunityParticipant>
  ): Promise<{ data: OpportunityParticipant }>;

  /**
   * Remove participant organization from opportunity
   *
   * @param opportunityId - Opportunity ID
   * @param organizationId - Organization ID
   * @returns Deleted participant record ID
   * @throws Error if not participating or constraint violation
   *
   * @example
   * ```typescript
   * await dataProvider.removeOpportunityParticipant(123, 456);
   * ```
   */
  removeOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { id: string } }>;

  // ==================== Opportunity Contact Junction ====================
  // Delegate to JunctionsService

  /**
   * Get all contacts for an opportunity
   *
   * @param opportunityId - Opportunity ID
   * @returns Array of opportunity-contact relationships
   * @throws Error if query fails
   *
   * @example
   * ```typescript
   * const { data } = await dataProvider.getOpportunityContacts(123);
   * // data: [{ id, opportunity_id, contact_id, role, is_primary }]
   * ```
   */
  getOpportunityContacts(opportunityId: Identifier): Promise<{ data: OpportunityContact[] }>;

  /**
   * Link contact to opportunity
   *
   * @param opportunityId - Opportunity ID
   * @param contactId - Contact ID
   * @param params - Junction metadata (role, is_primary, notes)
   * @returns Created junction record
   * @throws Error if already linked or constraint violation
   *
   * @example
   * ```typescript
   * const { data } = await dataProvider.addOpportunityContact(123, 456, {
   *   role: "Primary Contact",
   *   is_primary: true,
   * });
   * ```
   */
  addOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
    params?: JunctionParams
  ): Promise<{ data: OpportunityContact }>;

  /**
   * Unlink contact from opportunity
   *
   * @param opportunityId - Opportunity ID
   * @param contactId - Contact ID
   * @returns Deleted junction record ID
   * @throws Error if not linked or constraint violation
   *
   * @example
   * ```typescript
   * await dataProvider.removeOpportunityContact(123, 456);
   * ```
   */
  removeOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier
  ): Promise<{ data: { id: string } }>;

  /**
   * Get all contacts for an opportunity (via junction)
   *
   * @deprecated Use getOpportunityContacts instead
   * @param opportunityId - Opportunity ID
   * @returns Array of opportunity-contact relationships
   *
   * @remarks
   * Legacy method for backward compatibility.
   * New code should use getOpportunityContacts.
   */
  getOpportunityContactsViaJunction(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityContact[] }>;

  /**
   * Link contact to opportunity (via junction)
   *
   * @deprecated Use addOpportunityContact instead
   * @param opportunityId - Opportunity ID
   * @param contactId - Contact ID
   * @param metadata - Junction metadata
   * @returns Created junction record
   *
   * @remarks
   * Legacy method for backward compatibility.
   * New code should use addOpportunityContact.
   */
  addOpportunityContactViaJunction(
    opportunityId: Identifier,
    contactId: Identifier,
    metadata?: { role?: string; is_primary?: boolean; notes?: string }
  ): Promise<{ data: OpportunityContact }>;

  /**
   * Remove contact from opportunity by junction ID
   *
   * @param junctionId - Junction table record ID
   * @returns Deleted junction record ID
   * @throws Error if junction not found
   *
   * @example
   * ```typescript
   * await dataProvider.removeOpportunityContactViaJunction(789);
   * ```
   *
   * @remarks
   * This method differs from removeOpportunityContact by accepting
   * the junction table ID directly instead of opportunity + contact IDs.
   */
  removeOpportunityContactViaJunction(junctionId: Identifier): Promise<{ data: { id: string } }>;

  // ==================== RPC Operations ====================
  // Direct Supabase client access with Zod validation

  /**
   * Execute RPC (Remote Procedure Call) function
   *
   * Provides validation, logging, and error handling for database functions.
   * Validates params against RPC_SCHEMAS if schema exists for the function.
   *
   * @param functionName - Name of the RPC function to execute
   * @param params - Parameters to pass to the RPC function
   * @returns Data returned by the RPC function (typed via generic)
   * @throws Error if RPC fails or validation errors
   *
   * @example
   * ```typescript
   * // Get or create segment
   * const segment = await dataProvider.rpc<Segment>("get_or_create_segment", {
   *   segment_name: "Enterprise",
   * });
   *
   * // Archive opportunity
   * await dataProvider.rpc("archive_opportunity", {
   *   opportunity_id: 123,
   * });
   * ```
   */
  rpc<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<T>;

  /**
   * Atomically log activity with optional follow-up task
   *
   * Creates an activity and optionally a follow-up task in a single database
   * transaction. Uses the log_activity_with_task RPC function to ensure
   * data consistency. Replaces direct supabase.rpc calls in QuickLogForm.
   *
   * @param params - Activity and optional task data
   * @returns Result with success status, activity_id, and optional task_id
   * @throws HttpError if RPC fails
   *
   * @example
   * ```typescript
   * const result = await dataProvider.logActivityWithTask({
   *   p_activity: {
   *     activity_type: "activity",
   *     type: "call",
   *     outcome: "Connected",
   *     subject: "Follow-up call with customer",
   *     description: "Discussed Q1 order...",
   *     activity_date: new Date().toISOString(),
   *     duration_minutes: 15,
   *     contact_id: 123,
   *     organization_id: 456,
   *     opportunity_id: null,
   *     follow_up_required: true,
   *     follow_up_date: "2026-01-20",
   *   },
   *   p_task: {
   *     title: "Follow-up: Discussed Q1 order...",
   *     due_date: "2026-01-20",
   *     priority: "medium",
   *     contact_id: 123,
   *     opportunity_id: null,
   *   },
   * });
   * // result: { success: true, activity_id: 789, task_id: 101 }
   * ```
   */
  logActivityWithTask(params: LogActivityWithTaskParams): Promise<LogActivityWithTaskResponse>;

  // ==================== Storage Operations ====================
  // Direct Supabase Storage access

  /**
   * Storage operations for file handling
   *
   * Provides consistent file upload/download with validation and error handling.
   * All operations include comprehensive logging.
   */
  storage: {
    /**
     * Upload a file to Supabase storage
     *
     * @param bucket - Storage bucket name
     * @param path - File path within the bucket
     * @param file - File or Blob to upload
     * @returns Upload result with path information
     * @throws Error if upload fails or file exceeds 10MB limit
     *
     * @example
     * ```typescript
     * const result = await dataProvider.storage.upload(
     *   "avatars",
     *   "user-123.jpg",
     *   fileBlob
     * );
     * // result: { path: "user-123.jpg" }
     * ```
     */
    upload(bucket: string, path: string, file: File | Blob): Promise<{ path: string }>;

    /**
     * Get public URL for a file
     *
     * @param bucket - Storage bucket name
     * @param path - File path within the bucket
     * @returns Public URL for the file
     *
     * @example
     * ```typescript
     * const url = dataProvider.storage.getPublicUrl("avatars", "user-123.jpg");
     * // url: "https://....supabase.co/storage/v1/object/public/avatars/user-123.jpg"
     * ```
     */
    getPublicUrl(bucket: string, path: string): string;

    /**
     * Remove files from storage
     *
     * @param bucket - Storage bucket name
     * @param paths - Array of file paths to remove
     * @throws Error if removal fails
     *
     * @example
     * ```typescript
     * await dataProvider.storage.remove("avatars", ["user-123.jpg", "user-456.jpg"]);
     * ```
     */
    remove(bucket: string, paths: string[]): Promise<void>;

    /**
     * List files in a storage bucket
     *
     * @param bucket - Storage bucket name
     * @param path - Optional path prefix to filter files
     * @returns Array of file metadata
     * @throws Error if listing fails
     *
     * @example
     * ```typescript
     * const files = await dataProvider.storage.list("avatars", "users/");
     * // files: [{ name: "user-123.jpg", size: 12345, ... }]
     * ```
     */
    list(bucket: string, path?: string): Promise<FileObject[]>;
  };

  // ==================== Edge Function Invocation ====================
  // Direct Supabase Functions access with Zod validation

  /**
   * Invoke Edge Function
   *
   * Provides consistent interface for calling Supabase Edge Functions.
   * Validates body params against edgeFunctionSchemas if schema exists.
   *
   * @param functionName - Name of the edge function to invoke
   * @param options - Options including method, body, and headers
   * @returns Data returned by the edge function (typed via generic)
   * @throws Error if edge function fails or validation errors
   *
   * @example
   * ```typescript
   * // Create sales user via Edge Function
   * const sale = await dataProvider.invoke<Sale>("create-sales", {
   *   method: "POST",
   *   body: {
   *     email: "john@example.com",
   *     password: "SecurePass123",
   *     first_name: "John",
   *     last_name: "Doe",
   *   },
   * });
   *
   * // Update sales user
   * await dataProvider.invoke("update-sales", {
   *   method: "PUT",
   *   body: { id: 123, first_name: "Jane" },
   * });
   * ```
   */
  invoke<T = unknown>(
    functionName: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ): Promise<T>;

  // ==================== Specialized Business Operations ====================
  // Transaction-like RPC operations

  /**
   * Create Booth Visitor Opportunity
   *
   * Atomically creates organization, contact, and opportunity records
   * via database function. Used by Quick Add dialog for trade show lead capture.
   *
   * @param data - QuickAddInput data from the form
   * @returns Result containing created record IDs
   * @throws Error if RPC fails or validation errors
   *
   * @example
   * ```typescript
   * const result = await dataProvider.createBoothVisitor({
   *   organization_name: "Acme Corp",
   *   first_name: "John",
   *   last_name: "Doe",
   *   email: "john@acme.com",
   *   phone: "+1-555-0123",
   *   opportunity_name: "Trade Show Lead - Acme",
   *   campaign: "2024 Trade Show",
   *   principal: "Principal A",
   * });
   * // result: { organization_id: 1, contact_id: 2, opportunity_id: 3 }
   * ```
   */
  createBoothVisitor(data: QuickAddInput): Promise<{ data: BoothVisitorResult }>;
}

/**
 * CrmDataProvider type alias
 *
 * Alias for ExtendedDataProvider for backward compatibility.
 * Use this type when declaring DataProvider variables.
 *
 * @example
 * ```typescript
 * import type { CrmDataProvider } from './extensions/types';
 *
 * const dataProvider: CrmDataProvider = extendWithCustomMethods({...});
 * ```
 */
export type CrmDataProvider = ExtendedDataProvider;
