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

// Stage-specific field schemas
export const sampleVisitOfferedSchema = z.object({
  sampleType: z.string().optional(),
  visitDate: z.string().optional(), // ISO date string
  sampleProducts: z.array(z.string()).optional(),
});

export const feedbackLoggedSchema = z.object({
  feedbackNotes: z.string().optional(),
  sentimentScore: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .optional(),
  nextSteps: z.string().optional(),
});

export const demoScheduledSchema = z.object({
  demoDate: z.string().optional(), // ISO date string
  attendees: z.array(z.string()).optional(),
  demoProducts: z.array(z.string()).optional(),
});

export const closedWonSchema = z.object({
  finalAmount: z.number().min(0).optional(),
  contractStartDate: z.string().optional(), // ISO date string
  contractTermMonths: z.number().min(0).optional(),
});

export const lossReasonSchema = z.enum([
  "price",
  "product_fit",
  "competitor",
  "timing",
  "other",
]);

export const closedLostSchema = z.object({
  lossReason: lossReasonSchema.optional(),
  competitorWon: z.string().optional(),
  lossNotes: z.string().optional(),
});

// Main opportunity schema with comprehensive validation
// This schema serves as the single source of truth for all opportunity validation
// per Engineering Constitution - all validation happens at API boundary only
export const opportunitySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1, "Opportunity name is required"),
    customer_organization_id: z.union([z.string(), z.number()]).optional(),
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
    category: z.string().optional(),
    stage: opportunityStageSchema.default("new_lead"),
    status: opportunityStatusSchema.optional(),
    priority: opportunityPrioritySchema.default("medium"),
    description: z.string().optional(),
    amount: z.number().min(0, "Amount must be positive").default(0),
    probability: z
      .number()
      .min(0, "Probability must be between 0 and 100")
      .max(100, "Probability must be between 0 and 100")
      .default(50),
    expected_closing_date: z
      .string()
      .min(1, "Expected closing date is required"),
    estimated_close_date: z.string().optional(),
    actual_close_date: z.string().optional().nullable(),
    sales_id: z.union([z.string(), z.number()]).optional(),
    index: z.number().optional(),
    founding_interaction_id: z
      .union([z.string(), z.number()])
      .optional()
      .nullable(),
    stage_manual: z.boolean().optional(),
    status_manual: z.boolean().optional(),
    next_action: z.string().optional().nullable(),
    next_action_date: z.string().optional().nullable(),
    competition: z.string().optional().nullable(),
    decision_criteria: z.string().optional().nullable(),

    // Stage-specific fields (optional for all opportunities)
    sampleType: z.string().optional(),
    visitDate: z.string().optional(),
    sampleProducts: z.array(z.string()).optional(),
    feedbackNotes: z.string().optional(),
    sentimentScore: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ])
      .optional(),
    nextSteps: z.string().optional(),
    demoDate: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    demoProducts: z.array(z.string()).optional(),
    finalAmount: z.number().min(0).optional(),
    contractStartDate: z.string().optional(),
    contractTermMonths: z.number().min(0).optional(),
    lossReason: lossReasonSchema.optional(),
    competitorWon: z.string().optional(),
    lossNotes: z.string().optional(),

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
  })
  .superRefine((data, ctx) => {
    // Stage-specific conditional validation
    // These rules were previously spread across form components

    // Demo scheduled stage requires demo date
    if (data.stage === "demo_scheduled" && !data.demoDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["demoDate"],
        message: "Demo date is required for Demo Scheduled stage",
      });
    }

    // Feedback logged stage requires feedback notes
    if (data.stage === "feedback_logged" && !data.feedbackNotes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feedbackNotes"],
        message: "Feedback notes are required for Feedback Logged stage",
      });
    }

    // Closed won stage requires final amount
    if (data.stage === "closed_won") {
      if (data.finalAmount === undefined || data.finalAmount === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["finalAmount"],
          message: "Final amount is required for closed won deals",
        });
      }
      if (!data.actual_close_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual_close_date"],
          message: "Actual close date is required when closing a deal",
        });
      }
    }

    // Closed lost stage requires loss reason
    if (data.stage === "closed_lost") {
      if (!data.lossReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lossReason"],
          message: "Loss reason is required for closed lost deals",
        });
      }
      if (!data.actual_close_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual_close_date"],
          message: "Actual close date is required when closing a deal",
        });
      }
    }
  });

// Type inference
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;

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
