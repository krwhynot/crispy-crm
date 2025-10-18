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
  "awaiting_response",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
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
    .optional(),

  // OpportunityClassificationInputs fields
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  lead_source: leadSourceSchema.optional().nullable(),

  // OpportunityOrganizationInputs fields
  customer_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),

  // OpportunityContactsInput fields
  contact_ids: z
    .array(z.union([z.string(), z.number()]))
    .min(1, "At least one contact is required"),

  // Note: The following fields exist in database but are NOT validated
  // because they have no UI input fields in OpportunityInputs.tsx (per "UI as truth" principle):
  // - status, actual_close_date
  // - index, founding_interaction_id
  // - stage_manual, status_manual
  // - next_action, next_action_date
  // - competition, decision_criteria
  // - amount, probability, tags
  // - competitor_ids, loss_reason, team_members
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
        errors: formattedErrors,
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
  .required({
    name: true,
    contact_ids: true,
    estimated_close_date: true,
  });

// Update-specific schema (more flexible for partial updates)
// IMPORTANT: React Admin sends only "dirty" fields during update (fields that changed).
// This means if you update priority, the payload might only contain {id, priority},
// without contact_ids. We need to handle two cases:
// 1. contact_ids NOT in payload (partial update of other fields) → ALLOW
// 2. contact_ids IN payload but empty [] → REJECT (can't remove all contacts)
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
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
  );

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
    // TEMP DEBUG: Verify useMemo fix is loaded
    console.log('[validateUpdateOpportunity] Data received:', {
      hasContactIds: 'contact_ids' in data,
      contactIdsValue: data.contact_ids,
      isArray: Array.isArray(data.contact_ids),
      length: Array.isArray(data.contact_ids) ? data.contact_ids.length : 'N/A',
      allKeys: Object.keys(data),
      timestamp: new Date().toISOString(),
    });

    updateOpportunitySchema.parse(data);
    console.log('[validateUpdateOpportunity] ✓ Validation passed');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[validateUpdateOpportunity] ✗ Validation failed:', error.issues);
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
