import { z } from 'zod';

/**
 * get_or_create_segment(p_name text) RETURNS SETOF segments
 * Get or create a segment by name. Case-insensitive lookup.
 */
export const getOrCreateSegmentParamsSchema = z.object({
  p_name: z.string().min(1, "Segment name is required"),
});

/**
 * set_primary_organization(p_contact_id bigint, p_organization_id bigint) RETURNS void
 * Sets the primary organization for a contact, ensuring only one primary organization exists.
 */
export const setPrimaryOrganizationParamsSchema = z.object({
  p_contact_id: z.number().int().positive("Contact ID must be a positive integer"),
  p_organization_id: z.number().int().positive("Organization ID must be a positive integer"),
});

/**
 * archive_opportunity_with_relations(opp_id bigint) RETURNS void
 * Archive an opportunity and all related records by setting deleted_at.
 * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
 */
export const archiveOpportunityWithRelationsParamsSchema = z.object({
  opp_id: z.number().int().positive("Opportunity ID must be a positive integer"),
});

/**
 * unarchive_opportunity_with_relations(opp_id bigint) RETURNS void
 * Unarchive an opportunity and all related records by setting deleted_at to null.
 * Cascades to: activities, opportunityNotes, opportunity_participants, tasks
 */
export const unarchiveOpportunityWithRelationsParamsSchema = z.object({
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
const opportunityProductItemSchema = z.object({
  product_id: z.number().int().positive("Product ID must be a positive integer"),
  notes: z.string().optional().nullable(),
});

export const syncOpportunityWithProductsParamsSchema = z.object({
  opportunity_data: z.unknown(),
  products_to_create: z.array(opportunityProductItemSchema).default([]),
  products_to_update: z.array(opportunityProductItemSchema).default([]),
  product_ids_to_delete: z.array(z.number().int().positive()).default([]),
});

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
