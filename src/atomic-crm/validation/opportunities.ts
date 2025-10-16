import { z } from "zod";
import type { Identifier } from "ra-core";

/**
 * Opportunity validation schemas and functions
 * Implements validation rules from OpportunityInputs.tsx
 */


// Enum schemas for stage, status, and priority
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "awaiting_response",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityStatusSchema = z.enum([
  "active",
  "on_hold",
  "nurturing",
  "stalled",
  "expired",
]);

export const opportunityPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

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

// Base schema object for reuse
const opportunityBaseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  principal_organization_id: z
    .union([z.string(), z.number()])
    .optional()
    .nullable(),
  distributor_organization_id: z
    .union([z.string(), z.number()])
    .optional()
    .nullable(),
  contact_ids: z
    .array(z.union([z.string(), z.number()]))
    .min(1, "At least one contact is required"),
  stage: opportunityStageSchema.nullable().default("new_lead"),
  status: opportunityStatusSchema.optional().nullable(),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  description: z.string().optional().nullable(),
  // Support both field names for compatibility
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .optional(),
  expected_closing_date: z
    .string()
    .min(1, "Expected closing date is required")
    .optional(),
  actual_close_date: z.string().optional().nullable(),
  closed_date: z.string().optional().nullable(),
  opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
  account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),
  sales_rep_id: z.union([z.string(), z.number()]).optional().nullable(),
  lead_source: leadSourceSchema.optional().nullable(),
  index: z.number().default(0),
  founding_interaction_id: z
    .union([z.string(), z.number()])
    .optional()
    .nullable(),
  stage_manual: z.boolean().optional().nullable(),
  status_manual: z.boolean().optional().nullable(),
  next_action: z.string().optional().nullable(),
  next_action_date: z.string().optional().nullable(),
  next_step: z.string().optional().nullable(),
  competition: z.string().optional().nullable(),
  decision_criteria: z.string().optional().nullable(),
  // Add missing fields from tests
  amount: z
    .number()
    .min(0, "Amount must be positive")
    .default(0),
  probability: z
    .number()
    .min(0, "Probability must be between 0 and 100")
    .max(100, "Probability must be between 0 and 100")
    .default(50),
  tags: z.array(z.string()).optional().nullable(),
  competitor_ids: z.array(z.union([z.string(), z.number()])).optional().nullable(),
  loss_reason: z.string().optional().nullable(),
  team_members: z.array(z.union([z.string(), z.number()])).optional().nullable(),

  deleted_at: z.string().optional().nullable(),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Main opportunity schema with comprehensive validation
// This schema serves as the single source of truth for all opportunity validation
// per Engineering Constitution - all validation happens at API boundary only
//
// Fields with .default() provide business logic defaults that will be used
// by forms via schema.parse({}) - see Constitution #5: FORM STATE DERIVED FROM TRUTH
export const opportunitySchema = opportunityBaseSchema
  .refine((data) => {
    // Check for removed legacy fields and provide helpful error messages
    if ("company_id" in data) {
      throw new Error(
        "Field 'company_id' is no longer supported. Use customer_organization_id, principal_organization_id, or distributor_organization_id instead.",
      );
    }
    if ("archived_at" in data) {
      throw new Error(
        "Field 'archived_at' is no longer supported. Use deleted_at for soft deletes or stage transitions for opportunity lifecycle management.",
      );
    }
    return true;
  })
  .transform((data) => {
    // Normalize date field names
    if (data.expected_closing_date && !data.estimated_close_date) {
      data.estimated_close_date = data.expected_closing_date;
    }
    if (data.closed_date && !data.actual_close_date) {
      data.actual_close_date = data.closed_date;
    }
    if (data.sales_rep_id && !data.opportunity_owner_id) {
      data.opportunity_owner_id = data.sales_rep_id;
    }
    return data;
  });

// Type inference
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where opportunity validation occurs
export async function validateOpportunityForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      // Throw error in React Admin expected format
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
// Note: We check for either expected_closing_date or estimated_close_date
export const createOpportunitySchema = opportunityBaseSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .required({
    name: true,
    contact_ids: true,
  })
  .refine(
    (data) => data.expected_closing_date || data.estimated_close_date,
    {
      message: "Expected closing date is required",
      path: ["expected_closing_date"],
    }
  )
  .transform((data) => {
    // Apply same transformations as main schema
    if (data.expected_closing_date && !data.estimated_close_date) {
      data.estimated_close_date = data.expected_closing_date;
    }
    if (data.closed_date && !data.actual_close_date) {
      data.actual_close_date = data.closed_date;
    }
    if (data.sales_rep_id && !data.opportunity_owner_id) {
      data.opportunity_owner_id = data.sales_rep_id;
    }
    return data;
  });

// Update-specific schema (more flexible)
export const updateOpportunitySchema = opportunityBaseSchema.partial().required({
  id: true,
});

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
        errors: formattedErrors,
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
        errors: formattedErrors,
      };
    }
    throw error;
  }
}
