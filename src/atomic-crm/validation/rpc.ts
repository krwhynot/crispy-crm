import { z } from "zod";

/**
 * get_or_create_segment(p_name text) RETURNS SETOF segments
 * Get or create a segment by name. Case-insensitive lookup.
 */
export const getOrCreateSegmentParamsSchema = z.strictObject({
  p_name: z.string().trim().min(1, "Segment name is required").max(255, "Segment name too long"),
});

/**
 * set_primary_organization(p_contact_id bigint, p_organization_id bigint) RETURNS void
 * Sets the primary organization for a contact, ensuring only one primary organization exists.
 */
export const setPrimaryOrganizationParamsSchema = z.strictObject({
  p_contact_id: z.number().int().positive("Contact ID must be a positive integer"),
  p_organization_id: z.number().int().positive("Organization ID must be a positive integer"),
});

/**
 * archive_opportunity_with_relations(opp_id bigint) RETURNS void
 * Archive an opportunity and all related records by setting deleted_at.
 * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
 */
export const archiveOpportunityWithRelationsParamsSchema = z.strictObject({
  opp_id: z.number().int().positive("Opportunity ID must be a positive integer"),
});

/**
 * unarchive_opportunity_with_relations(opp_id bigint) RETURNS void
 * Unarchive an opportunity and all related records by setting deleted_at to null.
 * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
 */
export const unarchiveOpportunityWithRelationsParamsSchema = z.strictObject({
  opp_id: z.number().int().positive("Opportunity ID must be a positive integer"),
});

/**
 * sync_opportunity_with_products(
 *   opportunity_data jsonb,
 *   products_to_create jsonb,
 *   products_to_update jsonb,
 *   product_ids_to_delete integer[]
 * ) RETURNS jsonb
 * Atomically synchronize opportunity and its product associations.
 */
const opportunityProductItemSchema = z.strictObject({
  product_id: z.number().int().positive("Product ID must be a positive integer"),
  notes: z.string().max(2000, "Notes too long").optional().nullable(),
});

export const syncOpportunityWithProductsParamsSchema = z.strictObject({
  opportunity_data: z.unknown(),
  products_to_create: z.array(opportunityProductItemSchema).default([]),
  products_to_update: z.array(opportunityProductItemSchema).default([]),
  product_ids_to_delete: z.array(z.number().int().positive()).default([]),
});

/**
 * check_authorization(
 *   _distributor_id bigint,
 *   _principal_id bigint DEFAULT NULL,
 *   _product_id bigint DEFAULT NULL
 * ) RETURNS JSONB
 * Check if a principal is authorized to sell through a distributor.
 * Supports Product→Org fallback: if product_id provided, looks up principal from product.
 */
export const checkAuthorizationParamsSchema = z.strictObject({
  _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
  _principal_id: z
    .number()
    .int()
    .positive("Principal ID must be a positive integer")
    .optional()
    .nullable(),
  _product_id: z
    .number()
    .int()
    .positive("Product ID must be a positive integer")
    .optional()
    .nullable(),
});

/**
 * Response schema for check_authorization RPC
 * Used for type inference and response validation
 */
// Response schemas use z.strictObject() to prevent mass assignment attacks
// If DB returns new fields, update this schema explicitly
export const checkAuthorizationResponseSchema = z.strictObject({
  authorized: z.boolean(),
  reason: z.string().max(500, "Reason too long").optional(),
  error: z.string().max(1000, "Error message too long").optional(),
  authorization_id: z.number().optional(),
  distributor_id: z.number(),
  distributor_name: z.string().max(255, "Distributor name too long").optional(),
  principal_id: z.number().optional(),
  principal_name: z.string().max(255, "Principal name too long").optional(),
  authorization_date: z.string().max(50, "Authorization date too long").optional(),
  expiration_date: z.string().max(50, "Expiration date too long").nullable().optional(),
  territory_restrictions: z
    .array(z.string().max(255, "Territory restriction too long"))
    .nullable()
    .optional(),
  notes: z.string().max(2000, "Notes too long").nullable().optional(),
  product_id: z.number().optional(),
  product_name: z.string().max(255, "Product name too long").optional(),
  resolved_via: z.literal("product_lookup").optional(),
});

export type CheckAuthorizationParams = z.infer<typeof checkAuthorizationParamsSchema>;
export type CheckAuthorizationResponse = z.infer<typeof checkAuthorizationResponseSchema>;

/**
 * check_authorization_batch(
 *   _distributor_id bigint,
 *   _product_ids bigint[] DEFAULT NULL,
 *   _principal_ids bigint[] DEFAULT NULL
 * ) RETURNS JSONB
 * Batch authorization check for multiple products or principals.
 */
export const checkAuthorizationBatchParamsSchema = z.strictObject({
  _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
  _product_ids: z.array(z.number().int().positive()).optional().nullable(),
  _principal_ids: z.array(z.number().int().positive()).optional().nullable(),
});

/**
 * Response schema for check_authorization_batch RPC
 * Uses z.strictObject() to prevent mass assignment attacks
 */
export const checkAuthorizationBatchResponseSchema = z.strictObject({
  distributor_id: z.number(),
  total_checked: z.number(),
  all_authorized: z.boolean().nullable(),
  results: z.array(checkAuthorizationResponseSchema),
});

export type CheckAuthorizationBatchParams = z.infer<typeof checkAuthorizationBatchParamsSchema>;
export type CheckAuthorizationBatchResponse = z.infer<typeof checkAuthorizationBatchResponseSchema>;

/**
 * Map of RPC function names to their validation schemas
 * Used by unifiedDataProvider to validate params before calling RPC
 */
export const RPC_SCHEMAS = {
  get_or_create_segment: getOrCreateSegmentParamsSchema,
  set_primary_organization: setPrimaryOrganizationParamsSchema,
  archive_opportunity_with_relations: archiveOpportunityWithRelationsParamsSchema,
  unarchive_opportunity_with_relations: unarchiveOpportunityWithRelationsParamsSchema,
  sync_opportunity_with_products: syncOpportunityWithProductsParamsSchema,
  check_authorization: checkAuthorizationParamsSchema,
  check_authorization_batch: checkAuthorizationBatchParamsSchema,
} as const;

export type RPCFunctionName = keyof typeof RPC_SCHEMAS;

/**
 * Edge Function parameter schemas
 * Currently no Edge Functions are in use, but this registry is ready for future additions.
 */
export const edgeFunctionSchemas = {
  // Add edge function param schemas here when Edge Functions are implemented
  // Example: process_csv_import: z.object({ ... })
} as const;

export type EdgeFunctionName = keyof typeof edgeFunctionSchemas;
