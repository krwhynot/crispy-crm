import { z } from "zod";

/**
 * Activities validation schemas and functions
 * Implements validation rules for customer interactions and engagements
 */

// Activity type enum - determines whether it's a standalone engagement or opportunity interaction
export const activityTypeSchema = z.enum([
  "engagement", // Standalone activity not linked to opportunity
  "interaction", // Activity linked to an opportunity
]);

// Interaction type enum - the specific type of activity
export const interactionTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "demo",
  "proposal",
  "follow_up",
  "trade_show",
  "site_visit",
  "contract_review",
  "check_in",
  "social",
]);

// Sentiment enum
export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

// Base schema without refinements - can be extended
const baseActivitiesSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  activity_type: activityTypeSchema,
  type: interactionTypeSchema,
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional().nullable(),
  activity_date: z.string().optional(), // Will default to now() in DB
  duration_minutes: z.number().int().positive().optional().nullable(),

  // Entity relationships
  contact_id: z.union([z.string(), z.number()]).optional().nullable(),
  organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),

  // Follow-up fields
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional().nullable(),
  follow_up_notes: z.string().optional().nullable(),

  // Activity details
  outcome: z.string().optional().nullable(),
  sentiment: sentimentSchema.optional().nullable(),
  attachments: z.array(z.string()).optional().nullable(),
  location: z.string().optional().nullable(),
  attendees: z.array(z.string()).optional().nullable(),
  tags: z.array(z.union([z.string(), z.number()])).optional().nullable(),

  // System fields
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});

// Main activities schema with comprehensive validation
// This schema serves as the single source of truth for all activity validation
// per Engineering Constitution - all validation happens at API boundary only
export const activitiesSchema = baseActivitiesSchema.superRefine((data, ctx) => {
  // Validation rules based on activity_type

  // If it's an interaction, opportunity_id is required
  if (data.activity_type === "interaction" && !data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity is required for interaction activities",
    });
  }

  // If it's an engagement, opportunity_id should not be set
  if (data.activity_type === "engagement" && data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity should not be set for engagement activities",
    });
  }

  // At least one entity relationship is required (contact or organization)
  if (!data.contact_id && !data.organization_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contact_id"],
      message: "Either contact or organization is required",
    });
  }

  // If follow-up is required, follow_up_date should be set
  if (data.follow_up_required && !data.follow_up_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["follow_up_date"],
      message: "Follow-up date is required when follow-up is enabled",
    });
  }
});

// Engagement-specific schema (activity_type = "engagement")
// Extends base schema and adds engagement-specific validation
export const engagementsSchema = baseActivitiesSchema
  .extend({
    activity_type: z.literal("engagement"),
  })
  .superRefine((data, ctx) => {
    // Engagement-specific validations
    if (data.opportunity_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opportunity_id"],
        message: "Opportunity should not be set for engagement activities",
      });
    }

    // At least one entity relationship is required (contact or organization)
    if (!data.contact_id && !data.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact_id"],
        message: "Either contact or organization is required",
      });
    }

    // If follow-up is required, follow_up_date should be set
    if (data.follow_up_required && !data.follow_up_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_date"],
        message: "Follow-up date is required when follow-up is enabled",
      });
    }
  });

// Interaction-specific schema (activity_type = "interaction")
// Extends base schema and adds interaction-specific validation
export const interactionsSchema = baseActivitiesSchema
  .extend({
    activity_type: z.literal("interaction"),
    opportunity_id: z.union([z.string(), z.number()]), // Required for interactions
  })
  .superRefine((data, ctx) => {
    // Interaction-specific validations
    if (!data.opportunity_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opportunity_id"],
        message: "Opportunity is required for interaction activities",
      });
    }

    // At least one entity relationship is required (contact or organization)
    if (!data.contact_id && !data.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contact_id"],
        message: "Either contact or organization is required",
      });
    }

    // If follow-up is required, follow_up_date should be set
    if (data.follow_up_required && !data.follow_up_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_date"],
        message: "Follow-up date is required when follow-up is enabled",
      });
    }
  });

// Type inference
export type ActivitiesInput = z.input<typeof activitiesSchema>;
export type Activities = z.infer<typeof activitiesSchema>;
export type EngagementsInput = z.input<typeof engagementsSchema>;
export type Engagements = z.infer<typeof engagementsSchema>;
export type InteractionsInput = z.input<typeof interactionsSchema>;
export type Interactions = z.infer<typeof interactionsSchema>;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where activities validation occurs
export async function validateActivitiesForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    activitiesSchema.parse(data);
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

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function matching expected signature from unifiedDataProvider
export async function validateCreateActivities(data: any): Promise<void> {
  return validateActivitiesForm(data);
}

// Update validation function matching expected signature from unifiedDataProvider
export async function validateUpdateActivities(data: any): Promise<void> {
  return validateActivitiesForm(data);
}

// Validation function for engagements specifically
export async function validateEngagementsForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    engagementsSchema.parse(data);
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

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function for engagements
export async function validateCreateEngagements(data: any): Promise<void> {
  return validateEngagementsForm(data);
}

// Update validation function for engagements
export async function validateUpdateEngagements(data: any): Promise<void> {
  return validateEngagementsForm(data);
}

// Validation function for interactions specifically
export async function validateInteractionsForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    interactionsSchema.parse(data);
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

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function for interactions
export async function validateCreateInteractions(data: any): Promise<void> {
  return validateInteractionsForm(data);
}

// Update validation function for interactions
export async function validateUpdateInteractions(data: any): Promise<void> {
  return validateInteractionsForm(data);
}