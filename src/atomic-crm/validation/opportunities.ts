import { z } from "zod";
import type { DataProvider, Identifier, RaRecord } from "ra-core";
import { sanitizeHtml } from "@/lib/sanitization";

/**
 * Opportunity validation schemas and functions
 * Per "UI as source of truth" principle: validates only fields in OpportunityInputs.tsx
 */

// Enum schemas matching UI select options
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const leadSourceSchema = z.enum([
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
]);

/**
 * Win/Loss Reason Schemas (TODO-004a)
 * Per PRD Section 5.3, MVP #12, #47 - Industry standard (Salesforce/HubSpot)
 * Required when closing opportunities to track deal outcomes
 */

// Win reasons - why deals are won
export const winReasonSchema = z.enum([
  "relationship", // Strong existing relationship with customer
  "product_quality", // Superior product quality/fit
  "price_competitive", // Competitive pricing
  "timing", // Right timing for customer needs
  "other", // Free-text reason required
]);

// Loss reasons - why deals are lost
export const lossReasonSchema = z.enum([
  "price_too_high", // Price not competitive
  "no_authorization", // Distributor not authorized for principal
  "competitor_relationship", // Customer has existing competitor relationship
  "product_fit", // Product doesn't meet customer needs
  "timing", // Bad timing (budget, seasonality, etc.)
  "no_response", // Customer became unresponsive
  "other", // Free-text reason required
]);

// Type exports for use in components
export type WinReason = z.infer<typeof winReasonSchema>;
export type LossReason = z.infer<typeof lossReasonSchema>;

// Constants for UI dropdown choices
export const WIN_REASONS: Array<{ id: WinReason; name: string }> = [
  { id: "relationship", name: "Strong Relationship" },
  { id: "product_quality", name: "Product Quality/Fit" },
  { id: "price_competitive", name: "Competitive Pricing" },
  { id: "timing", name: "Right Timing" },
  { id: "other", name: "Other (specify)" },
];

export const LOSS_REASONS: Array<{ id: LossReason; name: string }> = [
  { id: "price_too_high", name: "Price Too High" },
  { id: "no_authorization", name: "No Distributor Authorization" },
  { id: "competitor_relationship", name: "Competitor Relationship" },
  { id: "product_fit", name: "Product Didn't Fit" },
  { id: "timing", name: "Bad Timing" },
  { id: "no_response", name: "Customer Unresponsive" },
  { id: "other", name: "Other (specify)" },
];

// Base schema - validates only fields that have UI inputs in OpportunityInputs.tsx
const opportunityBaseSchema = z.strictObject({
  // System fields
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  version: z.number().optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // OpportunityInfoInputs fields
  name: z.string().trim().min(1, "Opportunity name is required").max(255, "Opportunity name too long"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  estimated_close_date: z.coerce
    .date({
      error: "Expected closing date is required",
    })
    .default(() => {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }),

  // OpportunityClassificationInputs fields
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  lead_source: leadSourceSchema.optional().nullable(),

  // OpportunityOrganizationInputs fields
  customer_organization_id: z.union([z.string(), z.number()]), // Required - marked with * in UI
  principal_organization_id: z.union([z.string(), z.number()]), // Required - marked with * in UI
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),

  // OpportunityContactsInput fields
  // SECURITY: Use z.coerce.number() to reject non-numeric strings like "@@ra-create"
  // This provides defense-in-depth against UI bugs that might add invalid IDs
  contact_ids: z
    .array(z.coerce.number().int().positive())
    .optional()
    .default([]),

  // Campaign & Workflow Tracking fields (added 2025-11-03)
  campaign: z
    .string()
    .max(100, "Campaign name must be 100 characters or less")
    .optional()
    .nullable(),
  related_opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // General notes about the opportunity (separate from activity log)
  tags: z
    .array(z.string().max(50, "Tag must be 50 characters or less"))
    .max(20, "Maximum 20 tags allowed")
    .optional()
    .default([]),
  next_action: z
    .string()
    .max(500, "Next action must be 500 characters or less")
    .optional()
    .nullable(),
  next_action_date: z.coerce.date().optional().nullable(),
  decision_criteria: z
    .string()
    .max(2000, "Decision criteria must be 2000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Win/Loss Reason Fields (TODO-004a)
  // Required when stage is closed_won or closed_lost respectively
  // Per PRD Section 5.3, MVP #12, #47 - industry standard
  win_reason: winReasonSchema.optional().nullable(),
  loss_reason: lossReasonSchema.optional().nullable(),
  close_reason_notes: z
    .string()
    .max(500, "Close reason notes must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // Required when reason is "other"

  // Note: The following fields exist in database but are NOT validated
  // because they have no UI input fields in OpportunityInputs.tsx (per "UI as truth" principle):
  // - status, actual_close_date
  // - index, founding_interaction_id
  // - stage_manual, status_manual
  // - competition (undocumented - not in PRD)
  // - probability
  // - competitor_ids, team_members
  // - opportunity_owner_id
});

// Main opportunity schema
// Fields with .default() provide business logic defaults that will be used
// by forms via schema.parse({}) - see Constitution #5: FORM STATE DERIVED FROM TRUTH
export const opportunitySchema = opportunityBaseSchema;

// Type inference
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;

// Pipeline stage type (P1 consolidation - single source of truth)
// This replaces the manual type in stageConstants.ts
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;

// Validation function matching expected signature from unifiedDataProvider
export async function validateOpportunityForm(data: unknown): Promise<void> {
  try {
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        body: { errors: formattedErrors }, // React Admin expects errors at body.errors
      };
    }
    throw error;
  }
}

/**
 * Create-specific schema (Salesforce standard + business rule Q12)
 *
 * Per industry research (2025-12):
 * - Salesforce: Opportunities REQUIRE an Account (hard requirement)
 * - HubSpot: Deals don't require Company (but many orgs enforce it)
 *
 * Our approach: Follow Salesforce standard - require customer_organization_id
 * This enforces business rule Q12: "Every opportunity must have exactly one customer"
 */
export const createOpportunitySchema = opportunityBaseSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    version: true,
    deleted_at: true,
  })
  .extend({
    // Contact_ids optional for quick-add (can be enriched later via slide-over)
    // SECURITY: Use z.coerce.number() to reject non-numeric strings like "@@ra-create"
    contact_ids: z
      .array(z.coerce.number().int().positive())
      .optional()
      .default([]),

    // Auto-default: 30 days from now (industry standard placeholder)
    estimated_close_date: z.coerce
      .date()
      .optional()
      .default(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      }),

    // Products are optional for opportunity creation
    products_to_sync: z
      .array(
        z.strictObject({
          product_id_reference: z.union([z.string(), z.number()]).optional(),
          notes: z.string().max(2000).optional().nullable(),
        })
      )
      .optional(),

    // Customer REQUIRED (Salesforce standard + business rule Q12)
    customer_organization_id: z.union([z.string(), z.number()]),
    // Principal optional (can be enriched later)
    principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),

    // Fields used by quick-create but not in UI forms
    // These are set programmatically (status=active, owner=current user)
    // Must be included since opportunityBaseSchema uses strictObject()
    status: z.literal("active").optional().default("active"),
    opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .required({
    name: true,
    customer_organization_id: true, // Salesforce standard: Account required
  });

/**
 * Quick-Create Schema (Salesforce standard + business rule Q12)
 *
 * Minimal schema for Kanban quick-add buttons.
 * Per industry research (2025-12):
 * - Salesforce: Opportunities REQUIRE an Account (hard requirement)
 *
 * Required: name + customer + stage (matches Salesforce pattern)
 * Optional: principal, contacts (can be enriched later via slide-over)
 */
export const quickCreateOpportunitySchema = z.strictObject({
  // Required fields (Salesforce standard)
  name: z.string().trim().min(1, "Opportunity name is required").max(255, "Opportunity name too long"),
  stage: opportunityStageSchema,
  customer_organization_id: z.union([z.string(), z.number()]), // Business rule Q12

  // Auto-populated fields
  status: z.literal("active").default("active"),
  priority: opportunityPrioritySchema.default("medium"),

  // Owner assignment (current user)
  opportunity_owner_id: z.union([z.string(), z.number()]).optional(),
  account_manager_id: z.union([z.string(), z.number()]).optional(),

  // Auto-default: 30 days from now (business standard)
  estimated_close_date: z.coerce.date().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }),
});

export type QuickCreateOpportunityInput = z.infer<typeof quickCreateOpportunitySchema>;

// Update-specific schema (more flexible for partial updates)
// IMPORTANT: React Admin v5 sends ALL form fields during update, not just dirty fields.
// This means if you update priority, the payload will contain {id, priority, contact_ids: [], ...all fields}.
// The base schema therefore must not have strict constraints that fail on default/empty values.
// We handle two cases via .refine():
// 1. contact_ids NOT in payload (undefined) → ALLOW (partial update of other fields)
// 2. contact_ids IN payload but empty [] → REJECT (user explicitly removing all contacts)
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .extend({
    // Override contact_ids to remove the default([]) that causes issues with partial updates
    // SECURITY: Use z.coerce.number() to reject non-numeric strings like "@@ra-create"
    contact_ids: z.array(z.coerce.number().int().positive()).optional(), // No .default([]) here!

    // Virtual field: products_to_sync (stripped by TransformService before DB save)
    // Must be declared here since opportunityBaseSchema uses strictObject()
    products_to_sync: z
      .array(
        z.strictObject({
          product_id_reference: z.union([z.string(), z.number()]).optional(),
          notes: z.string().max(2000).optional().nullable(),
        })
      )
      .optional(),
  })
  .required({
    id: true,
  })
  .refine(
    (data) => {
      // Only validate contact_ids if it's actually being updated
      // If contact_ids is undefined/missing, this is a partial update of other fields - allow it
      if (data.contact_ids === undefined) {
        return true;
      }

      // Skip contact validation for stage-only updates (e.g., Kanban drag-drop)
      // These updates only change stage/win_reason/loss_reason, not contacts
      const stageOnlyFields = new Set(["id", "stage", "win_reason", "loss_reason", "close_reason_notes", "contact_ids"]);
      const providedFields = Object.keys(data).filter((key) => data[key as keyof typeof data] !== undefined);
      const isStageOnlyUpdate = providedFields.every((field) => stageOnlyFields.has(field));
      if (isStageOnlyUpdate) {
        return true;
      }

      // If contact_ids IS provided in a non-stage-only update, it must not be empty
      // (user is explicitly removing all contacts, which we don't allow)
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    {
      message: "At least one contact is required",
      path: ["contact_ids"],
    }
  )
  // Win/Loss reason validation (TODO-004a)
  .refine(
    (data) => {
      // If stage is closed_won, win_reason is required
      if (data.stage === "closed_won") {
        return !!data.win_reason;
      }
      return true;
    },
    {
      message: "Win reason is required when closing as won",
      path: ["win_reason"],
    }
  )
  .refine(
    (data) => {
      // If stage is closed_lost, loss_reason is required
      if (data.stage === "closed_lost") {
        return !!data.loss_reason;
      }
      return true;
    },
    {
      message: "Loss reason is required when closing as lost",
      path: ["loss_reason"],
    }
  )
  .refine(
    (data) => {
      // If reason is "other", close_reason_notes is required
      if (data.win_reason === "other" || data.loss_reason === "other") {
        return !!data.close_reason_notes && data.close_reason_notes.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please specify the reason in notes when selecting 'Other'",
      path: ["close_reason_notes"],
    }
  );

/**
 * Close Opportunity Schema (TODO-004a)
 * Dedicated schema for the CloseOpportunityModal component
 * Enforces win/loss reason based on target stage
 */
export const closeOpportunitySchema = z
  .strictObject({
    id: z.union([z.string(), z.number()]),
    stage: z.enum(["closed_won", "closed_lost"]),
    win_reason: winReasonSchema.optional().nullable(),
    loss_reason: lossReasonSchema.optional().nullable(),
    close_reason_notes: z
      .string()
      .max(500, "Close reason notes must be 500 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.stage === "closed_won") {
        return !!data.win_reason;
      }
      return true;
    },
    {
      message: "Win reason is required when closing as won",
      path: ["win_reason"],
    }
  )
  .refine(
    (data) => {
      if (data.stage === "closed_lost") {
        return !!data.loss_reason;
      }
      return true;
    },
    {
      message: "Loss reason is required when closing as lost",
      path: ["loss_reason"],
    }
  )
  .refine(
    (data) => {
      if (data.win_reason === "other" || data.loss_reason === "other") {
        return !!data.close_reason_notes && data.close_reason_notes.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please specify the reason in notes when selecting 'Other'",
      path: ["close_reason_notes"],
    }
  );

export type CloseOpportunityInput = z.infer<typeof closeOpportunitySchema>;

// Export validation functions for specific operations
export async function validateCreateOpportunity(data: unknown): Promise<void> {
  try {
    createOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors }, // React Admin expects errors at body.errors
      };
    }
    throw error;
  }
}

export async function validateUpdateOpportunity(data: unknown): Promise<void> {
  try {
    updateOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors }, // React Admin expects errors at body.errors
      };
    }
    throw error;
  }
}

/**
 * Validate opportunity close action (TODO-004a)
 * Used by CloseOpportunityModal to validate before submission
 */
export async function validateCloseOpportunity(data: unknown): Promise<void> {
  try {
    closeOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}

/**
 * Parameters for duplicate opportunity check
 * All three fields must match for an opportunity to be considered a duplicate
 */
export interface DuplicateCheckParams {
  principal_id: Identifier;
  customer_id: Identifier;
  product_id: Identifier;
  /** Optional: Exclude this opportunity ID from duplicate check (for updates) */
  exclude_id?: Identifier;
}

/**
 * Opportunity record type for duplicate check response
 */
interface OpportunityRecord extends RaRecord {
  name: string;
  principal_organization_id: Identifier;
  customer_organization_id: Identifier;
  stage: string;
}

/**
 * Result of duplicate check query
 */
interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingOpportunity?: {
    id: Identifier;
    name: string;
    stage: string;
  };
}

/**
 * Custom error type for duplicate opportunity detection
 */
interface DuplicateOpportunityError extends Error {
  code: "DUPLICATE_OPPORTUNITY";
  existingOpportunity: {
    id: Identifier;
    name: string;
    stage: string;
  };
}

/**
 * Check for exact duplicate opportunities
 *
 * Blocks creation/update of opportunities with identical:
 * - principal_organization_id
 * - customer_organization_id
 * - product_id (via opportunity_products junction)
 *
 * Follows Engineering Constitution principles:
 * - P1: Fail-fast - throws immediately on duplicate detection
 * - P2: Uses dataProvider.getList as single composable entry point
 *
 * @param dataProvider - React Admin DataProvider instance
 * @param params - Duplicate check parameters
 * @throws Error with descriptive message if duplicate exists
 *
 * @example
 * ```typescript
 * // In Create handler
 * await checkExactDuplicate(dataProvider, {
 *   principal_id: data.principal_organization_id,
 *   customer_id: data.customer_organization_id,
 *   product_id: selectedProductId,
 * });
 * ```
 */
export async function checkExactDuplicate(
  dataProvider: DataProvider,
  params: DuplicateCheckParams
): Promise<DuplicateCheckResult> {
  const { principal_id, customer_id, product_id, exclude_id } = params;

  // Step 1: Find opportunities with matching principal + customer
  // Uses dataProvider.getList per P2 constraint (not direct Supabase)
  const { data: matchingOpportunities } = await dataProvider.getList<OpportunityRecord>(
    "opportunities",
    {
      filter: {
        principal_organization_id: principal_id,
        customer_organization_id: customer_id,
        // Exclude soft-deleted records
        "deleted_at@is": null,
      },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "DESC" },
    }
  );

  // Early return if no matching principal+customer combinations
  if (matchingOpportunities.length === 0) {
    return { isDuplicate: false };
  }

  // Filter out the current opportunity if updating
  const candidateOpportunities = exclude_id
    ? matchingOpportunities.filter((opp) => opp.id !== exclude_id)
    : matchingOpportunities;

  if (candidateOpportunities.length === 0) {
    return { isDuplicate: false };
  }

  // Step 2: Check each candidate opportunity for matching product
  // Uses dataProvider.getList for opportunity_products junction
  for (const opportunity of candidateOpportunities) {
    const { data: opportunityProducts } = await dataProvider.getList<RaRecord>(
      "opportunity_products",
      {
        filter: {
          opportunity_id: opportunity.id,
          product_id: product_id,
          "deleted_at@is": null,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      }
    );

    // Found exact duplicate: same principal + customer + product
    if (opportunityProducts.length > 0) {
      // P1: Fail-fast - throw immediately with descriptive error
      const error = new Error(
        `Duplicate opportunity detected: An opportunity already exists for this ` +
          `Principal + Customer + Product combination. ` +
          `Existing opportunity: "${opportunity.name}" (ID: ${opportunity.id}, Stage: ${opportunity.stage})`
      ) as DuplicateOpportunityError;
      // Attach metadata for UI error handling
      error.code = "DUPLICATE_OPPORTUNITY";
      error.existingOpportunity = {
        id: opportunity.id,
        name: opportunity.name,
        stage: opportunity.stage,
      };
      throw error;
    }
  }

  // No duplicates found
  return { isDuplicate: false };
}

/**
 * Validation helper that wraps checkExactDuplicate for form validation
 * Returns formatted errors compatible with React Admin
 *
 * @param dataProvider - React Admin DataProvider instance
 * @param params - Duplicate check parameters
 * @throws Object with message and body.errors for React Admin compatibility
 */
export async function validateNoDuplicate(
  dataProvider: DataProvider,
  params: DuplicateCheckParams
): Promise<void> {
  try {
    await checkExactDuplicate(dataProvider, params);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as DuplicateOpportunityError).code === "DUPLICATE_OPPORTUNITY"
    ) {
      // Format for React Admin error display
      throw {
        message: "Validation failed",
        body: {
          errors: {
            // Show error on the product field since that's the final disambiguating factor
            product_id: error.message,
          },
        },
      };
    }
    // Re-throw unexpected errors
    throw error;
  }
}
