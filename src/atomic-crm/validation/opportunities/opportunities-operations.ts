import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import {
  opportunityStageSchema,
  opportunityPrioritySchema,
  leadSourceSchema,
  winReasonSchema,
  lossReasonSchema,
  opportunityProductSchema,
} from "./opportunities-core";
import { STAGE, CLOSED_STAGES } from "@/atomic-crm/opportunities/constants";

/**
 * Operation-specific schemas for opportunities
 * Create, update, close, and quick-create schemas with validation
 */

// ============================================================================
// CANONICAL PRODUCT SYNC SCHEMAS (Single Source of Truth)
// ============================================================================
// These schemas consolidate product validation that was previously scattered
// across opportunitiesHandler.ts, this file, and diffProducts.ts.
//
// Key design decisions:
// 1. Input schema REQUIRES product_id_reference - fail at API boundary with
//    user-friendly "Product is required" error, not cryptic 500 in handler.
// 2. Handler schema uses .optional().nullable() for notes to match DB reality
//    where empty columns return null, not undefined.
// ============================================================================

/**
 * Input schema: What forms send (API boundary validation)
 *
 * product_id_reference is REQUIRED - if UI fails to filter empty rows,
 * validation fails here with field-level error, not 500 in handler.
 */
export const opportunityProductSyncInputSchema = z.strictObject({
  product_id_reference: z.union([z.string(), z.number()]),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * Handler schema: What handler processes (includes denormalized view fields)
 *
 * Uses .optional().nullable() for notes to handle both:
 * - Key missing from payload (undefined)
 * - Key present but empty in DB (null)
 */
export const opportunityProductSyncHandlerSchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.union([z.string(), z.number()]),
  product_name: z.string().optional(),
  product_category: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type OpportunityProductSyncInput = z.infer<typeof opportunityProductSyncInputSchema>;
export type OpportunityProductSyncHandler = z.infer<typeof opportunityProductSyncHandlerSchema>;

// Re-create the base schema here to avoid circular dependency issues
// This is a copy of opportunityBaseSchema from opportunities-core.ts
const opportunityBaseSchema = z.strictObject({
  // System fields
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  version: z.number().optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // OpportunityInfoInputs fields
  name: z
    .string()
    .trim()
    .min(1, "Opportunity name is required")
    .max(255, "Opportunity name too long"),
  description: z
    .string()
    .trim()
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
  // Stage is REQUIRED - no silent default. Forms must explicitly select a stage.
  // This prevents workflow corruption from missing/null stage values.
  stage: opportunityStageSchema,
  priority: opportunityPrioritySchema,
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
    .max(100, "Maximum 100 contacts")
    .optional()
    .default([]),

  // Campaign & Workflow Tracking fields (added 2025-11-03)
  campaign: z
    .string()
    .trim()
    .max(100, "Campaign name must be 100 characters or less")
    .optional()
    .nullable(),
  related_opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // General notes about the opportunity (separate from activity log)
  tags: z
    .array(z.string().trim().max(50, "Tag must be 50 characters or less"))
    .max(20, "Maximum 20 tags allowed")
    .optional()
    .default([]),
  next_action: z
    .string()
    .trim()
    .max(500, "Next action must be 500 characters or less")
    .optional()
    .nullable(),
  next_action_date: z.coerce.date().optional().nullable(),
  decision_criteria: z
    .string()
    .trim()
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
    .trim()
    .max(500, "Close reason notes must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // Required when reason is "other"

  // Database fields (read-only - no UI inputs in OpportunityInputs.tsx)
  // Included in schema for validation completeness when loading records
  // MUST stay in sync with opportunities-core.ts
  status: z.enum(["active", "on_hold", "nurturing", "stalled", "expired"]).optional().nullable(),
  index: z.number().int().optional().nullable(),
  actual_close_date: z.coerce.date().optional().nullable(),
  stage_manual: z.boolean().optional().nullable(),
  status_manual: z.boolean().optional().nullable(),
  competition: z.string().max(2000).optional().nullable(),
  founding_interaction_id: z.union([z.string(), z.number()]).optional().nullable(),
  probability: z.number().optional().nullable(),
  opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  updated_by: z.union([z.string(), z.number()]).optional().nullable(),
  search_tsv: z.string().optional().nullable(),
  stage_changed_at: z.string().optional().nullable(),

  // Summary view computed fields (populated by database views, not editable)
  customer_organization_name: z.string().optional().nullable(),
  principal_organization_name: z.string().optional().nullable(),
  distributor_organization_name: z.string().optional().nullable(),
  days_in_stage: z.number().optional().nullable(),
  last_activity_date: z.string().optional().nullable(),
  days_since_last_activity: z.number().optional().nullable(),
  pending_task_count: z.number().optional().nullable(),
  overdue_task_count: z.number().optional().nullable(),
  next_task_id: z.union([z.string(), z.number()]).optional().nullable(),
  next_task_title: z.string().optional().nullable(),
  next_task_due_date: z.string().optional().nullable(),
  next_task_priority: z.string().optional().nullable(),
  products: opportunityProductSchema, // Type-safe JSONB array from view
});

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
    // Contact_ids: REQUIRED for full creates, OPTIONAL for quick creates
    // FIX [WF-E2E-001]: Quick creates (Kanban button) don't collect contacts upfront
    // They create minimal opportunities that users enrich later via slide-over
    // The .refine() below enforces min(1) only when contact_ids is explicitly provided
    // SECURITY: Use z.coerce.number() to reject non-numeric strings like "@@ra-create"
    contact_ids: z
      .array(z.coerce.number().int().positive())
      .max(100, "Maximum 100 contacts")
      .optional(),

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
    // Uses canonical input schema - product_id_reference is REQUIRED per product
    products_to_sync: z
      .array(opportunityProductSyncInputSchema)
      .max(100, "Maximum 100 products")
      .optional(),

    // Customer REQUIRED (Salesforce standard + business rule Q12)
    customer_organization_id: z.union([z.string(), z.number()]),
    // Principal REQUIRED (MFB business rule: every opportunity represents a principal's product)
    // Note: Inherits from opportunityBaseSchema which already requires this field
    principal_organization_id: z.union([z.string(), z.number()]),

    // Fields used by quick-create but not in UI forms
    // These are set programmatically (status=active, owner=current user)
    // Must be included since opportunityBaseSchema uses strictObject()
    // NO DEFAULT: UI must explicitly provide status. DB has column default as safety net.
    status: z.literal("active").optional(),
    opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
  })
  .required({
    name: true,
    customer_organization_id: true, // Salesforce standard: Account required
  })
  // FIX [WF-E2E-001]: Contact validation for create
  // - contact_ids undefined → Quick create (allowed, user adds contacts later)
  // - contact_ids [] empty → Form submission with no contacts (rejected)
  // - contact_ids [1,2] → Full create with contacts (allowed)
  .refine(
    (data) => {
      // Quick creates don't include contact_ids - allow them
      if (data.contact_ids === undefined) {
        return true;
      }
      // If contact_ids is explicitly provided, require at least one
      return data.contact_ids.length > 0;
    },
    {
      message: "At least one contact is required",
      path: ["contact_ids"],
    }
  );

/**
 * Quick-Create Schema (Salesforce standard + business rule Q12)
 *
 * Minimal schema for Kanban quick-add buttons.
 * Per industry research (2025-12):
 * - Salesforce: Opportunities REQUIRE an Account (hard requirement)
 *
 * Required: name + customer + principal + stage (matches Salesforce pattern + MFB rule)
 * Optional: contacts (can be enriched later via slide-over)
 */
export const quickCreateOpportunitySchema = z.strictObject({
  // Required fields (Salesforce standard + MFB business rule)
  name: z
    .string()
    .trim()
    .min(1, "Opportunity name is required")
    .max(255, "Opportunity name too long"),
  stage: opportunityStageSchema,
  customer_organization_id: z.union([z.string(), z.number()]), // Business rule Q12
  principal_organization_id: z.union([z.string(), z.number()]), // MFB: every opp has a principal

  // Auto-populated fields
  // NO DEFAULT: UI must explicitly provide status. DB has column default as safety net.
  status: z.literal("active"),
  // NO DEFAULT: UI must explicitly provide priority. DB has column default as safety net.
  priority: opportunityPrioritySchema,

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
    contact_ids: z
      .array(z.coerce.number().int().positive())
      .max(100, "Maximum 100 contacts")
      .optional(), // No .default([]) here!

    // Virtual field: products_to_sync (stripped by TransformService before DB save)
    // Must be declared here since opportunityBaseSchema uses strictObject()
    // Uses canonical input schema - product_id_reference is REQUIRED per product
    products_to_sync: z
      .array(opportunityProductSyncInputSchema)
      .max(100, "Maximum 100 products")
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

      // WG-002 FIX: Detect stage-only updates but ENFORCE close requirements
      // Stage-only updates to non-closed stages are allowed (normal Kanban drag)
      // Stage-only updates to closed_won/closed_lost MUST have reason (no bypass)
      const closedStagesArray = [...CLOSED_STAGES] as string[];
      const stageOnlyFields = new Set([
        "id",
        "stage",
        "win_reason",
        "loss_reason",
        "close_reason_notes",
        "contact_ids",
      ]);
      const providedFields = Object.keys(data).filter(
        (key) => data[key as keyof typeof data] !== undefined
      );
      const isStageOnlyUpdate = providedFields.every((field) => stageOnlyFields.has(field));

      // For stage-only updates to NON-closed stages, skip contact validation
      // For stage-only updates to CLOSED stages, fall through to normal validation
      if (isStageOnlyUpdate && data.stage && !closedStagesArray.includes(data.stage)) {
        return true; // Allow non-closed stage drag-drop
      }

      // WG-001 FIX: For closed stage updates, DO NOT return early!
      // We must fall through to allow the win/loss refinements (lines 298-336) to validate.
      // Removing the early return that previously bypassed contact validation for closed stages.
      // The win_reason/loss_reason refinements below will enforce proper close requirements.

      // Skip validation for full form submissions (React Admin v5 sends ALL fields on every update)
      // Heuristic: If 5+ fields are present, this is a form submission, not a contacts-only edit.
      // We only enforce "at least one contact" when user is explicitly on a contacts edit screen
      // (which would send only a few fields like {id, contact_ids, version}).
      if (providedFields.length >= 5) {
        return true;
      }

      // If user is specifically editing contacts (few fields, including contact_ids), enforce minimum
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    {
      message: "At least one contact is required",
      path: ["contact_ids"],
    }
  )
  // ============================================================================
  // Win/Loss Reason Validation (WG-002 / TODO-004a)
  // ============================================================================
  // DEFENSE IN DEPTH: These rules are enforced at TWO layers:
  //   1. DATABASE: CHECK constraints (single source of truth)
  //      - opportunities_closed_won_check: stage != 'closed_won' OR win_reason IS NOT NULL
  //      - opportunities_closed_lost_check: stage != 'closed_lost' OR loss_reason IS NOT NULL
  //   2. APP LAYER: Zod refinements below (UX layer for friendly error messages)
  //
  // The app-layer validation exists for UX purposes only:
  //   - Provides user-friendly error messages
  //   - Enables field-level error highlighting via path: ["field"]
  //   - Prevents unnecessary round-trips to server
  //
  // The database is the ultimate authority. If app validation is bypassed,
  // the DB constraint will reject the invalid data with a constraint violation.
  // ============================================================================
  .refine(
    (data) => {
      // DB: opportunities_closed_won_check enforces this at database level
      if (data.stage === STAGE.CLOSED_WON) {
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
      // DB: opportunities_closed_lost_check enforces this at database level
      if (data.stage === STAGE.CLOSED_LOST) {
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
      // Note: "other" requires notes is NOT enforced at DB level (business logic only)
      // This is intentional - DB should not care about the specific reason value
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
 * Close Opportunity BASE Schema (TODO-004a)
 * IMPORTANT: Exported for Zod v4 compatibility - use closeOpportunityBaseSchema.partial().parse({}) for defaults
 * Dedicated base schema for the CloseOpportunityModal component
 */
export const closeOpportunityBaseSchema = z.strictObject({
  id: z.union([z.string(), z.number()]),
  stage: z.enum([STAGE.CLOSED_WON, STAGE.CLOSED_LOST]),
  win_reason: winReasonSchema.optional().nullable(),
  loss_reason: lossReasonSchema.optional().nullable(),
  close_reason_notes: z
    .string()
    .max(500, "Close reason notes must be 500 characters or less")
    .optional()
    .nullable(),
});

/**
 * Close Opportunity Schema with refinements - for validation
 * Enforces win/loss reason based on target stage
 * Use closeOpportunityBaseSchema.partial().parse({}) for form defaults
 *
 * DEFENSE IN DEPTH (WG-002):
 * - DB Layer: CHECK constraints are the single source of truth
 * - App Layer: Zod refinements below provide UX-friendly error messages
 * See updateOpportunitySchema comments for full explanation.
 */
export const closeOpportunitySchema = closeOpportunityBaseSchema
  .refine(
    (data) => {
      // DB: opportunities_closed_won_check enforces this at database level
      if (data.stage === STAGE.CLOSED_WON) {
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
      // DB: opportunities_closed_lost_check enforces this at database level
      if (data.stage === STAGE.CLOSED_LOST) {
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
      // Note: "other" requires notes is app-layer only (business logic, not DB enforced)
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
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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
