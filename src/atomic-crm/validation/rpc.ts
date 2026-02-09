/**
 * RPC Contract Schemas — Test-Only Documentation
 *
 * These schemas define the expected shapes of Supabase RPC function parameters
 * and return types. They are NOT used for runtime validation in handlers — instead,
 * they serve as living documentation tested in src/tests/validation/rpc.test.ts.
 *
 * @remarks Test-only — do not import into production handler code.
 * @see src/tests/validation/rpc.test.ts
 */
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
  product_id_reference: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num > 0;
      },
      {
        message: "Product ID must be a positive integer",
      }
    )
    .transform((val) => {
      return typeof val === "string" ? parseInt(val, 10) : val;
    }),
  notes: z.string().max(2000, "Notes too long").optional().nullable(),
});

export const syncOpportunityWithProductsParamsSchema = z.strictObject({
  opportunity_data: z.unknown(),
  products_to_create: z
    .array(opportunityProductItemSchema)
    .max(100, "Maximum 100 products to create")
    .default([]),
  products_to_update: z
    .array(opportunityProductItemSchema)
    .max(100, "Maximum 100 products to update")
    .default([]),
  product_ids_to_delete: z
    .array(z.number().int().positive())
    .max(100, "Maximum 100 products to delete")
    .default([]),
  expected_version: z.number().int().optional(),
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

/**
 * check_authorization_batch(
 *   _distributor_id bigint,
 *   _product_ids bigint[] DEFAULT NULL,
 *   _principal_ids bigint[] DEFAULT NULL
 * ) RETURNS JSONB
 * Batch authorization check for multiple products or principals.
 */
export const checkAuthorizationBatchParamsSchema = z
  .strictObject({
    _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
    _product_ids: z
      .array(z.number().int().positive())
      .max(500, "Maximum 500 product IDs")
      .optional()
      .nullable(),
    _principal_ids: z
      .array(z.number().int().positive())
      .max(500, "Maximum 500 principal IDs")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const hasProducts = data._product_ids && data._product_ids.length > 0;
      const hasPrincipals = data._principal_ids && data._principal_ids.length > 0;
      return hasProducts || hasPrincipals;
    },
    {
      message:
        "At least one of _product_ids or _principal_ids must be provided with non-empty values",
      path: ["_product_ids"],
    }
  );

/**
 * Response schema for check_authorization_batch RPC
 * Uses z.strictObject() to prevent mass assignment attacks
 */
export const checkAuthorizationBatchResponseSchema = z.strictObject({
  distributor_id: z.number(),
  total_checked: z.number(),
  all_authorized: z.boolean().nullable(),
  results: z.array(checkAuthorizationResponseSchema).max(500, "Maximum 500 results"),
});

/**
 * Map of RPC function names to their validation schemas
 * Used by unifiedDataProvider to validate params before calling RPC
 */
/**
 * log_activity_with_task(p_activity jsonb, p_task jsonb DEFAULT NULL) RETURNS jsonb
 * Atomically creates an activity and optionally a follow-up task in a single transaction.
 * Used by QuickLogForm to ensure consistency.
 */
const logActivityWithTaskActivitySchema = z.strictObject({
  activity_type: z.literal("activity"),
  type: z.string().min(1, "Interaction type is required").max(50, "Type too long"),
  outcome: z.string().max(2000, "Outcome too long").nullable(),
  subject: z.string().min(1, "Subject is required").max(255, "Subject too long"),
  description: z.string().max(5000, "Description too long").optional().nullable(),
  activity_date: z.string().max(50, "Activity date too long"),
  duration_minutes: z.number().int().positive().nullable(),
  contact_id: z.number().int().positive().nullable(),
  organization_id: z.number().int().positive().nullable(),
  opportunity_id: z.number().int().positive().nullable(),
  follow_up_required: z.boolean(),
  follow_up_date: z.string().max(50, "Follow-up date too long").nullable(),
  related_task_id: z.number().int().positive().nullable().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional().nullable(),
  location: z.string().max(255, "Location too long").optional().nullable(),
  follow_up_notes: z.string().max(10000, "Follow-up notes too long").optional().nullable(),
});

const logActivityWithTaskTaskSchema = z.strictObject({
  title: z.string().min(1, "Task title is required").max(255, "Title too long"),
  due_date: z.string().max(50, "Due date too long"),
  priority: z.enum(["low", "medium", "high"]),
  contact_id: z.number().int().positive().nullable(),
  opportunity_id: z.number().int().positive().nullable(),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  reminder_date: z.string().max(50, "Reminder date too long").optional().nullable(),
  type: z.enum(["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"]).optional(),
});

export const logActivityWithTaskParamsSchema = z.strictObject({
  p_activity: logActivityWithTaskActivitySchema,
  p_task: logActivityWithTaskTaskSchema.nullable(),
});

export const logActivityWithTaskResponseSchema = z.strictObject({
  success: z.boolean(),
  activity_id: z.number(),
  task_id: z.number().nullable(),
});

export type LogActivityWithTaskParams = z.infer<typeof logActivityWithTaskParamsSchema>;
export type LogActivityWithTaskResponse = z.infer<typeof logActivityWithTaskResponseSchema>;

// check_similar_opportunities RPC schema
export const checkSimilarOpportunitiesParamsSchema = z.strictObject({
  p_name: z.string().trim().min(1).max(500),
  p_threshold: z.number().min(0).max(1).default(0.3),
  p_exclude_id: z.number().int().positive().nullable().optional(),
  p_limit: z.number().int().positive().max(50).default(10),
});

export const checkSimilarOpportunitiesResponseSchema = z
  .array(
    z.strictObject({
      id: z.number(),
      name: z.string().max(500),
      stage: z.string().max(50),
      similarity_score: z.number(),
      principal_organization_name: z.string().max(255).nullable(),
      customer_organization_name: z.string().max(255).nullable(),
    })
  )
  .max(50, "Maximum 50 similar opportunities");

/**
 * get_campaign_report_stats(p_campaign TEXT DEFAULT NULL) RETURNS JSONB
 * Get campaign report statistics including campaign options, sales rep options, and activity type counts.
 * Optional p_campaign filters results to a specific campaign.
 */
export const getCampaignReportStatsParamsSchema = z.strictObject({
  p_campaign: z.string().max(255, "Campaign name too long").optional().nullable(),
});

const campaignOptionSchema = z.strictObject({
  name: z.string().max(255, "Campaign name too long"),
  count: z.number().int().nonnegative(),
});

const salesRepOptionSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().max(255, "Sales rep name too long"),
  count: z.number().int().nonnegative(),
});

export const getCampaignReportStatsResponseSchema = z.strictObject({
  campaign_options: z.array(campaignOptionSchema).max(200, "Maximum 200 campaign options"),
  sales_rep_options: z.array(salesRepOptionSchema).max(200, "Maximum 200 sales rep options"),
  activity_type_counts: z.record(z.string().max(50), z.number().int().nonnegative()),
});

/**
 * get_stale_opportunities(
 *   p_campaign TEXT,
 *   p_start_date TIMESTAMPTZ DEFAULT NULL,
 *   p_end_date TIMESTAMPTZ DEFAULT NULL,
 *   p_sales_rep_id BIGINT DEFAULT NULL
 * ) RETURNS SETOF stale_opportunity_record
 * Get stale opportunities for a campaign based on per-stage activity thresholds.
 */
export const getStaleOpportunitiesParamsSchema = z.strictObject({
  p_campaign: z.string().max(255, "Campaign name too long"),
  p_start_date: z.string().datetime().optional().nullable(),
  p_end_date: z.string().datetime().optional().nullable(),
  p_sales_rep_id: z.number().int().positive().optional().nullable(),
});

export const staleOpportunityRecordSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().max(500, "Opportunity name too long"),
  stage: z.string().max(50, "Stage too long"),
  customer_organization_name: z.string().max(255, "Organization name too long").nullable(),
  last_activity_date: z.string().datetime().nullable(),
  days_inactive: z.number().int().nonnegative(),
  stage_threshold: z.number().int().positive(),
  is_stale: z.boolean(),
});

export const getStaleOpportunitiesResponseSchema = z
  .array(staleOpportunityRecordSchema)
  .max(1000, "Maximum 1000 stale opportunities");

export const RPC_SCHEMAS = {
  get_or_create_segment: getOrCreateSegmentParamsSchema,
  set_primary_organization: setPrimaryOrganizationParamsSchema,
  archive_opportunity_with_relations: archiveOpportunityWithRelationsParamsSchema,
  unarchive_opportunity_with_relations: unarchiveOpportunityWithRelationsParamsSchema,
  sync_opportunity_with_products: syncOpportunityWithProductsParamsSchema,
  check_authorization: checkAuthorizationParamsSchema,
  check_authorization_batch: checkAuthorizationBatchParamsSchema,
  log_activity_with_task: logActivityWithTaskParamsSchema,
  check_similar_opportunities: checkSimilarOpportunitiesParamsSchema,
  get_campaign_report_stats: getCampaignReportStatsParamsSchema,
  get_stale_opportunities: getStaleOpportunitiesParamsSchema,
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
