/**
 * Activity Zod schemas
 *
 * Core validation schemas for activities, engagements, and interactions.
 */

import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import {
  activityTypeSchema,
  interactionTypeSchema,
  sampleStatusSchema,
  sentimentSchema,
} from "./types";
import { SAMPLE_ACTIVE_STATUSES } from "./constants";

/**
 * Base schema without refinements - can be extended and used with .partial() for form defaults
 * IMPORTANT: Exported for Zod v4 compatibility - use baseActivitiesSchema.partial().parse({}) for defaults
 */
export const baseActivitiesSchema = z.strictObject({
  id: z.union([z.string().max(50, "Activity ID too long"), z.number()]).optional(),
  activity_type: activityTypeSchema.default("interaction"), // Default to interaction
  type: interactionTypeSchema.default("call"), // Default to call
  subject: z.string().trim().min(1, "Subject is required").max(255, "Subject too long"),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  activity_date: z.coerce.date().default(() => new Date()), // Default to today's date
  duration_minutes: z.number().int().positive().optional().nullable(),

  // Entity relationships
  contact_id: z
    .union([z.string().max(50, "Contact ID too long"), z.number()])
    .optional()
    .nullable(),
  organization_id: z
    .union([z.string().max(50, "Organization ID too long"), z.number()])
    .optional()
    .nullable(),
  opportunity_id: z
    .union([z.string().max(50, "Opportunity ID too long"), z.number()])
    .optional()
    .nullable(),

  // Follow-up fields
  follow_up_required: z.coerce.boolean().default(false),
  follow_up_date: z.coerce.date().optional().nullable(),
  follow_up_notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Activity details
  outcome: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  sentiment: sentimentSchema.optional().nullable(),
  attachments: z.array(z.string().max(2048)).max(20).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  attendees: z.array(z.string().trim().max(255)).max(50).optional().nullable(),
  tags: z
    .array(z.union([z.string().max(100), z.number()]))
    .max(20)
    .optional()
    .nullable(),

  // Sample tracking fields (PRD 4.4)
  // Only required when type = 'sample', validated via superRefine
  sample_status: sampleStatusSchema.optional().nullable(),

  // System fields
  created_by: z
    .union([z.string().max(50, "Created by ID too long"), z.number()])
    .optional()
    .nullable(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // STI Task Fields (added for Tasks -> Activities migration)
  // These fields are only used when activity_type = 'task'
  due_date: z.coerce.date().optional().nullable(),
  reminder_date: z.coerce.date().optional().nullable(),
  completed: z.coerce.boolean().optional().nullable(),
  completed_at: z.coerce.date().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  sales_id: z
    .union([z.string().max(50, "Sales ID too long"), z.number()])
    .optional()
    .nullable(),
  snooze_until: z.coerce.date().optional().nullable(),
  overdue_notified_at: z.coerce.date().optional().nullable(),

  // Related task reference (for activities that complete a task)
  related_task_id: z
    .union([z.string().max(50, "Task ID too long"), z.number()])
    .optional()
    .nullable(),
});

/**
 * Shared refinement logic for activity validation
 */
function applyActivityRefinements(
  data: z.infer<typeof baseActivitiesSchema>,
  ctx: z.RefinementCtx
): void {
  // At least one entity relationship is required (contact or organization)
  // EXCEPTION: Tasks can exist without entity relationships (standalone to-dos)
  if (data.activity_type !== "task" && !data.contact_id && !data.organization_id) {
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

  // Sample tracking validation (PRD 4.4)
  if (data.type === "sample" && !data.sample_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sample_status"],
      message: "Sample status is required for sample activities",
    });
  }

  // Guard: Only validate when 'type' is explicitly provided (allows partial updates)
  if (data.type && data.type !== "sample" && data.sample_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sample_status"],
      message: "Sample status should only be set for sample activities",
    });
  }

  // WG-001: Sample activities with active workflow status REQUIRE follow-up
  if (
    data.type === "sample" &&
    data.sample_status &&
    SAMPLE_ACTIVE_STATUSES.includes(data.sample_status as (typeof SAMPLE_ACTIVE_STATUSES)[number])
  ) {
    if (!data.follow_up_required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_required"],
        message: "Sample activities require follow-up when status is active",
      });
    }

    if (!data.follow_up_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_date"],
        message: "Follow-up date is required for active sample activities",
      });
    }
  }
}

/**
 * Main activities schema with comprehensive validation
 * This schema serves as the single source of truth for all activity validation
 * per Engineering Constitution - all validation happens at API boundary only
 */
export const activitiesSchema = baseActivitiesSchema.superRefine((data, ctx) => {
  // Validation rules based on activity_type
  if (data.activity_type === "interaction" && !data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity is required for interaction activities",
    });
  }

  if (data.activity_type === "engagement" && data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity should not be set for engagement activities",
    });
  }

  applyActivityRefinements(data, ctx);
});

/**
 * Engagement-specific schema (activity_type = "engagement")
 * Extends base schema and adds engagement-specific validation
 */
export const engagementsSchema = baseActivitiesSchema
  .extend({
    activity_type: z.literal("engagement"),
  })
  .superRefine((data, ctx) => {
    if (data.opportunity_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opportunity_id"],
        message: "Opportunity should not be set for engagement activities",
      });
    }

    applyActivityRefinements(data, ctx);
  });

/**
 * Interaction-specific schema (activity_type = "interaction")
 * Extends base schema and adds interaction-specific validation
 */
export const interactionsSchema = baseActivitiesSchema
  .extend({
    activity_type: z.literal("interaction"),
    opportunity_id: z.union([z.string(), z.number()]), // Required for interactions
  })
  .superRefine((data, ctx) => {
    if (!data.opportunity_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opportunity_id"],
        message: "Opportunity is required for interaction activities",
      });
    }

    applyActivityRefinements(data, ctx);
  });

/**
 * Schema for Updates - .partial() makes all fields optional
 * This allows PATCH-style updates where only changed fields are sent
 */
export const updateActivitiesSchema = baseActivitiesSchema.partial().extend({
  id: z.union([z.string(), z.number()]).optional(),
});

/**
 * Activity note form schema - simplified schema for quick note capture
 * Used for adding notes directly from opportunity stages
 */
export const activityNoteFormSchema = z.strictObject({
  activity_date: z.coerce.date(),
  type: interactionTypeSchema,
  contact_id: z.coerce.number().nullable().optional(),
  stage: z.string().max(50),
  subject: z.string().trim().min(1, "Subject is required").max(255, "Subject too long"),
});

// Type inference for main schemas
export type ActivitiesInput = z.input<typeof activitiesSchema>;
export type Activities = z.infer<typeof activitiesSchema>;
export type EngagementsInput = z.input<typeof engagementsSchema>;
export type Engagements = z.infer<typeof engagementsSchema>;
export type InteractionsInput = z.input<typeof interactionsSchema>;
export type Interactions = z.infer<typeof interactionsSchema>;
export type ActivityNoteFormData = z.infer<typeof activityNoteFormSchema>;

// P2 consolidation: Alias for backward compatibility with types.ts interface name
export type ActivityRecord = Activities;
