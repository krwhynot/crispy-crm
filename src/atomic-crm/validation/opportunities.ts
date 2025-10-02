import { z } from "zod";
import type { Identifier } from "ra-core";

/**
 * Opportunity validation schemas and functions
 * Implements validation rules from OpportunityInputs.tsx
 */

// Opportunity Context enum schema (SIMPLIFIED - 7 values only, no legacy)
export const opportunityContextSchema = z.enum([
  "Site Visit",
  "Food Show",
  "New Product Interest",
  "Follow-up",
  "Demo Request",
  "Sampling",
  "Custom",
]);

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

// Main opportunity schema with comprehensive validation
// This schema serves as the single source of truth for all opportunity validation
// per Engineering Constitution - all validation happens at API boundary only
export const opportunitySchema = z
  .object({
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
    opportunity_context: opportunityContextSchema.optional().nullable(),
    products: z.array(z.any()).optional(), // Products before transform - will become products_to_sync after transform
    products_to_sync: z.array(z.any()).optional(), // Products after transform extraction
    stage: opportunityStageSchema.nullable().default("new_lead"),
    status: opportunityStatusSchema.optional().nullable(),
    priority: opportunityPrioritySchema.nullable().default("medium"),
    description: z.string().optional().nullable(),
    amount: z.number().min(0, "Amount must be positive").default(0),
    probability: z
      .number()
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100")
      .default(50),
    expected_closing_date: z
      .string()
      .min(1, "Expected closing date is required"),
    estimated_close_date: z.string().optional().nullable(),
    actual_close_date: z.string().optional().nullable(),
    opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
    account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),
    lead_source: leadSourceSchema.optional().nullable(),
    index: z.number().optional().nullable(),
    founding_interaction_id: z
      .union([z.string(), z.number()])
      .optional()
      .nullable(),
    stage_manual: z.boolean().optional().nullable(),
    status_manual: z.boolean().optional().nullable(),
    next_action: z.string().optional().nullable(),
    next_action_date: z.string().optional().nullable(),
    competition: z.string().optional().nullable(),
    decision_criteria: z.string().optional().nullable(),

    deleted_at: z.string().optional().nullable(),

    // System fields
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
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
export const createOpportunitySchema = opportunitySchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .required({
    name: true,
    contact_ids: true,
    expected_closing_date: true,
  });

// Update-specific schema (more flexible)
export const updateOpportunitySchema = opportunitySchema.partial().required({
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
