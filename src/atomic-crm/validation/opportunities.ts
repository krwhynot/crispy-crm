import { z } from "zod";

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
  "relationship",        // Strong existing relationship with customer
  "product_quality",     // Superior product quality/fit
  "price_competitive",   // Competitive pricing
  "timing",              // Right timing for customer needs
  "other",               // Free-text reason required
]);

// Loss reasons - why deals are lost
export const lossReasonSchema = z.enum([
  "price_too_high",           // Price not competitive
  "no_authorization",         // Distributor not authorized for principal
  "competitor_relationship",  // Customer has existing competitor relationship
  "product_fit",              // Product doesn't meet customer needs
  "timing",                   // Bad timing (budget, seasonality, etc.)
  "no_response",              // Customer became unresponsive
  "other",                    // Free-text reason required
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
const opportunityBaseSchema = z.object({
  // System fields
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),

  // OpportunityInfoInputs fields
  name: z.string().min(1, "Opportunity name is required"),
  description: z.string().optional().nullable(),
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split("T")[0];
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
  contact_ids: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),

  // Campaign & Workflow Tracking fields (added 2025-11-03)
  campaign: z
    .string()
    .max(100, "Campaign name must be 100 characters or less")
    .optional()
    .nullable(),
  related_opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z.string().optional().nullable(), // General notes about the opportunity (separate from activity log)
  tags: z.array(z.string()).optional().default([]),
  next_action: z.string().optional().nullable(),
  next_action_date: z.string().optional().nullable(), // ISO date string
  decision_criteria: z.string().optional().nullable(),

  // Win/Loss Reason Fields (TODO-004a)
  // Required when stage is closed_won or closed_lost respectively
  // Per PRD Section 5.3, MVP #12, #47 - industry standard
  win_reason: winReasonSchema.optional().nullable(),
  loss_reason: lossReasonSchema.optional().nullable(),
  close_reason_notes: z
    .string()
    .max(500, "Close reason notes must be 500 characters or less")
    .optional()
    .nullable(), // Required when reason is "other"

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

// Validation function matching expected signature from unifiedDataProvider
export async function validateOpportunityForm(data: any): Promise<void> {
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

// Create-specific schema (stricter requirements)
export const createOpportunitySchema = opportunityBaseSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .extend({
    // Require at least one contact for new opportunities
    contact_ids: z
      .array(z.union([z.string(), z.number()]))
      .min(1, "At least one contact is required"),

    // Remove default from estimated_close_date for create - must be explicitly provided
    estimated_close_date: z.string().min(1, "Expected closing date is required"),

    // Products are optional for opportunity creation
    // They can be added later via the UI
    products_to_sync: z
      .array(
        z.object({
          product_id_reference: z.union([z.string(), z.number()]).optional(),
          notes: z.string().optional().nullable(), // Allow null from form inputs
        })
      )
      .optional(),
  })
  .required({
    name: true,
    estimated_close_date: true,
  });

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
    contact_ids: z.array(z.union([z.string(), z.number()])).optional(), // No .default([]) here!
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

      // If contact_ids IS provided, it must not be empty (can't remove all contacts)
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
  .object({
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
export async function validateCreateOpportunity(data: any): Promise<void> {
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

export async function validateUpdateOpportunity(data: any): Promise<void> {
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
export async function validateCloseOpportunity(data: any): Promise<void> {
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
