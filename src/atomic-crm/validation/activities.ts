import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";

/**
 * Activities validation schemas and functions
 * Implements validation rules for customer interactions and engagements
 */

// Activity type enum - determines the activity category
// After STI migration, 'task' distinguishes planned items from logged interactions
export const activityTypeSchema = z.enum([
  "engagement", // Standalone activity not linked to opportunity
  "interaction", // Activity linked to an opportunity
  "task", // Planned task (STI pattern - stored in same table)
]);

// Interaction type enum - the specific type of activity (15 types after STI migration)
export const interactionTypeSchema = z
  .enum([
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
    "note",
    "sample", // Added for sample tracking workflow (PRD §4.4)
    // STI task type mappings
    "administrative", // Maps from task type 'None'
    "other", // Maps from task type 'Other'
  ])
  .default("call");

// Sample status enum - workflow states for sample activities
// Workflow: sent → received → feedback_pending → feedback_received
export const sampleStatusSchema = z.enum([
  "sent",
  "received",
  "feedback_pending",
  "feedback_received",
]);

// Sentiment enum
export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

// Interaction type options for UI components (15 types after STI migration)
export const INTERACTION_TYPE_OPTIONS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "demo", label: "Demo" },
  { value: "proposal", label: "Proposal" },
  { value: "follow_up", label: "Follow Up" },
  { value: "trade_show", label: "Trade Show" },
  { value: "site_visit", label: "Site Visit" },
  { value: "contract_review", label: "Contract Review" },
  { value: "check_in", label: "Check In" },
  { value: "social", label: "Social" },
  { value: "note", label: "Note" },
  { value: "sample", label: "Sample" },
  // STI task type mappings
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other" },
] as const;

// Sample status options for UI components
export const SAMPLE_STATUS_OPTIONS = [
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "feedback_pending", label: "Feedback Pending" },
  { value: "feedback_received", label: "Feedback Received" },
] as const;

// Base schema without refinements - can be extended and used with .partial() for form defaults
// IMPORTANT: Exported for Zod v4 compatibility - use baseActivitiesSchema.partial().parse({}) for defaults
export const baseActivitiesSchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
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
  contact_id: z.union([z.string(), z.number()]).optional().nullable(),
  organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),

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

  // Sample tracking fields (PRD §4.4)
  // Only required when type = 'sample', validated via superRefine
  sample_status: sampleStatusSchema.optional().nullable(),

  // System fields
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // ============================================================================
  // STI Task Fields (added for Tasks → Activities migration)
  // These fields are only used when activity_type = 'task'
  // ============================================================================
  due_date: z.coerce.date().optional().nullable(),
  reminder_date: z.coerce.date().optional().nullable(),
  completed: z.coerce.boolean().optional().nullable(),
  completed_at: z.coerce.date().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  sales_id: z.union([z.string(), z.number()]).optional().nullable(), // Task owner (maps to activities.created_by for non-tasks)
  snooze_until: z.coerce.date().optional().nullable(),
  overdue_notified_at: z.coerce.date().optional().nullable(), // System field for notification tracking

  // Related task reference (for activities that complete a task)
  related_task_id: z.union([z.string(), z.number()]).optional().nullable(),
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

  // Sample tracking validation (PRD §4.4)
  // If type is 'sample', sample_status is required
  if (data.type === "sample" && !data.sample_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sample_status"],
      message: "Sample status is required for sample activities",
    });
  }

  // If type is NOT 'sample', sample_status should not be set
  // This prevents data inconsistency
  // Guard: Only validate when 'type' is explicitly provided (allows partial updates)
  if (data.type && data.type !== "sample" && data.sample_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sample_status"],
      message: "Sample status should only be set for sample activities",
    });
  }

  // WG-001: Sample activities with active workflow status REQUIRE follow-up
  // Per PRD §4.4: "Samples require follow-up activities"
  // Active statuses: sent, received, feedback_pending (not feedback_received - workflow complete)
  const SAMPLE_ACTIVE_STATUSES = ["sent", "received", "feedback_pending"];

  if (
    data.type === "sample" &&
    data.sample_status &&
    SAMPLE_ACTIVE_STATUSES.includes(data.sample_status)
  ) {
    // Enforce follow_up_required = true
    if (!data.follow_up_required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_required"],
        message: "Sample activities require follow-up when status is active",
      });
    }

    // Enforce follow_up_date is set
    if (!data.follow_up_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_up_date"],
        message: "Follow-up date is required for active sample activities",
      });
    }
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

    // Sample tracking validation (PRD §4.4)
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
    // Per PRD §4.4: "Samples require follow-up activities"
    // Active statuses: sent, received, feedback_pending (not feedback_received - workflow complete)
    const SAMPLE_ACTIVE_STATUSES = ["sent", "received", "feedback_pending"];

    if (
      data.type === "sample" &&
      data.sample_status &&
      SAMPLE_ACTIVE_STATUSES.includes(data.sample_status)
    ) {
      // Enforce follow_up_required = true
      if (!data.follow_up_required) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["follow_up_required"],
          message: "Sample activities require follow-up when status is active",
        });
      }

      // Enforce follow_up_date is set
      if (!data.follow_up_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["follow_up_date"],
          message: "Follow-up date is required for active sample activities",
        });
      }
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

    // Sample tracking validation (PRD §4.4)
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
    // Per PRD §4.4: "Samples require follow-up activities"
    // Active statuses: sent, received, feedback_pending (not feedback_received - workflow complete)
    const SAMPLE_ACTIVE_STATUSES = ["sent", "received", "feedback_pending"];

    if (
      data.type === "sample" &&
      data.sample_status &&
      SAMPLE_ACTIVE_STATUSES.includes(data.sample_status)
    ) {
      // Enforce follow_up_required = true
      if (!data.follow_up_required) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["follow_up_required"],
          message: "Sample activities require follow-up when status is active",
        });
      }

      // Enforce follow_up_date is set
      if (!data.follow_up_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["follow_up_date"],
          message: "Follow-up date is required for active sample activities",
        });
      }
    }
  });

// Type inference
export type ActivitiesInput = z.input<typeof activitiesSchema>;
export type Activities = z.infer<typeof activitiesSchema>;
export type EngagementsInput = z.input<typeof engagementsSchema>;
export type Engagements = z.infer<typeof engagementsSchema>;
export type InteractionsInput = z.input<typeof interactionsSchema>;
export type Interactions = z.infer<typeof interactionsSchema>;
export type SampleStatus = z.infer<typeof sampleStatusSchema>;
export type InteractionType = z.infer<typeof interactionTypeSchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;

// P2 consolidation: Alias for backward compatibility with types.ts interface name
export type ActivityRecord = Activities;

// Validation function matching expected signature from unifiedDataProvider
// This is the ONLY place where activities validation occurs
export async function validateActivitiesForm(data: unknown): Promise<void> {
  try {
    // Parse and validate the data
    activitiesSchema.parse(data);
  } catch (error: unknown) {
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
        body: { errors: formattedErrors },
      };
    }

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function matching expected signature from unifiedDataProvider
export async function validateCreateActivities(data: unknown): Promise<void> {
  return validateActivitiesForm(data);
}

// Schema for Updates - .partial() makes all fields optional
// This allows PATCH-style updates where only changed fields are sent
export const updateActivitiesSchema = baseActivitiesSchema.partial().extend({
  // ID accepts both string (UUIDs in production) and number (test fixtures)
  // This matches baseActivitiesSchema.id type
  id: z.union([z.string(), z.number()]).optional(),
});

// Update validation function matching expected signature from unifiedDataProvider
export async function validateUpdateActivities(data: unknown): Promise<void> {
  await updateActivitiesSchema.parseAsync(data);
}

// Validation function for engagements specifically
export async function validateEngagementsForm(data: unknown): Promise<void> {
  try {
    // Parse and validate the data
    engagementsSchema.parse(data);
  } catch (error: unknown) {
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
        body: { errors: formattedErrors },
      };
    }

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function for engagements
export async function validateCreateEngagements(data: unknown): Promise<void> {
  return validateEngagementsForm(data);
}

// Update validation function for engagements
export async function validateUpdateEngagements(data: unknown): Promise<void> {
  // FIXED: Use partial schema for updates to allow patching single fields
  await baseActivitiesSchema
    .partial()
    .extend({
      activity_type: z.literal("engagement").optional(),
    })
    .parseAsync(data);
}

// Validation function for interactions specifically
export async function validateInteractionsForm(data: unknown): Promise<void> {
  try {
    // Parse and validate the data
    interactionsSchema.parse(data);
  } catch (error: unknown) {
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
        body: { errors: formattedErrors },
      };
    }

    // Re-throw non-Zod errors
    throw error;
  }
}

// Create validation function for interactions
export async function validateCreateInteractions(data: unknown): Promise<void> {
  return validateInteractionsForm(data);
}

// Update validation function for interactions
export async function validateUpdateInteractions(data: unknown): Promise<void> {
  // FIXED: Use partial schema for updates to allow patching single fields
  await baseActivitiesSchema
    .partial()
    .extend({
      activity_type: z.literal("interaction").optional(),
    })
    .parseAsync(data);
}

// Activity note form schema - simplified schema for quick note capture
// Used for adding notes directly from opportunity stages
export const activityNoteFormSchema = z.strictObject({
  activity_date: z.coerce.date(),
  type: interactionTypeSchema,
  contact_id: z.coerce.number().nullable().optional(),
  stage: z.string().max(50),
  subject: z.string().trim().min(1, "Subject is required").max(255, "Subject too long"),
});

// Type inference for activity note form
export type ActivityNoteFormData = z.infer<typeof activityNoteFormSchema>;

// ============================================================================
// UI Display Transforms (added for QuickLogForm compatibility)
// ============================================================================

/**
 * Activity types organized by logical groups for dropdown UI
 * Uses Title Case for display, snake_case for API
 */
export const ACTIVITY_TYPE_GROUPS = {
  Communication: ["Call", "Email", "Check-in", "Social"] as const,
  Meetings: ["Meeting", "Demo", "Site Visit", "Trade Show"] as const,
  Documentation: ["Proposal", "Contract Review", "Follow-up", "Note", "Sample"] as const,
} as const;

// Flatten all activity types for schema validation
const ALL_ACTIVITY_DISPLAY_TYPES = [
  ...ACTIVITY_TYPE_GROUPS.Communication,
  ...ACTIVITY_TYPE_GROUPS.Meetings,
  ...ACTIVITY_TYPE_GROUPS.Documentation,
] as const;

/**
 * Display activity type schema (Title Case for UI)
 * Mirrors interactionTypeSchema but with display-friendly values
 */
export const activityDisplayTypeSchema = z.enum(ALL_ACTIVITY_DISPLAY_TYPES).default("Call");

/**
 * Map from Title Case (UI) to snake_case (API/database)
 * Used when submitting forms to convert display values to database values
 */
export const ACTIVITY_TYPE_TO_API: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  Demo: "demo",
  Proposal: "proposal",
  "Follow-up": "follow_up",
  "Trade Show": "trade_show",
  "Site Visit": "site_visit",
  "Contract Review": "contract_review",
  "Check-in": "check_in",
  Social: "social",
  Note: "note",
  Sample: "sample",
} as const;

/**
 * Map from snake_case (API/database) to Title Case (UI)
 * Used when displaying database values in the UI
 */
export const ACTIVITY_TYPE_FROM_API: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  proposal: "Proposal",
  follow_up: "Follow-up",
  trade_show: "Trade Show",
  site_visit: "Site Visit",
  contract_review: "Contract Review",
  check_in: "Check-in",
  social: "Social",
  note: "Note",
  sample: "Sample",
} as const;

// Legacy alias for backward compatibility during migration
export const ACTIVITY_TYPE_MAP = ACTIVITY_TYPE_TO_API;

/**
 * Context-specific outcome options by activity type
 * Provides relevant outcomes for each activity type category
 *
 * Design rationale:
 * - "Left Voicemail" only makes sense for Call
 * - "Bounced" only makes sense for Email
 * - Meeting-type activities use scheduling-related outcomes
 */
export const OUTCOME_OPTIONS_BY_TYPE: Record<string, readonly string[]> = {
  // Communication outcomes
  Call: ["Connected", "Left Voicemail", "No Answer", "Wrong Number"],
  Email: ["Sent", "Replied", "No Reply", "Bounced"],
  "Check-in": ["Connected", "Left Voicemail", "No Answer"],
  Social: ["Engaged", "No Response"],

  // Meeting outcomes
  Meeting: ["Held", "Rescheduled", "Cancelled", "No Show"],
  Demo: ["Held", "Rescheduled", "Cancelled", "No Show"],
  "Site Visit": ["Completed", "Rescheduled", "Cancelled"],
  "Trade Show": ["Attended", "Engaged", "Collected Leads"],

  // Documentation outcomes
  Proposal: ["Sent", "Accepted", "Rejected", "Revised"],
  "Contract Review": ["Completed", "Pending Changes", "Approved"],
  "Follow-up": ["Completed", "Rescheduled"],
  Note: ["Completed"],
  Sample: ["Sent", "Received", "Feedback Pending", "Feedback Received"],
} as const;

// All possible outcomes for schema validation (union of all type-specific options)
const ALL_OUTCOMES = [
  // Communication
  "Connected",
  "Left Voicemail",
  "No Answer",
  "Wrong Number",
  // Email
  "Sent",
  "Replied",
  "No Reply",
  "Bounced",
  // Social
  "Engaged",
  "No Response",
  // Meetings
  "Held",
  "Rescheduled",
  "Cancelled",
  "No Show",
  // Documentation
  "Completed",
  "Pending Changes",
  "Approved",
  // Trade Show
  "Attended",
  "Collected Leads",
  // Proposal
  "Accepted",
  "Rejected",
  "Revised",
  // Sample
  "Received",
  "Feedback Pending",
  "Feedback Received",
] as const;

/**
 * Activity outcome schema - validates all possible outcomes across activity types
 * UI components should filter to context-specific options using OUTCOME_OPTIONS_BY_TYPE
 */
export const activityOutcomeSchema = z.enum(ALL_OUTCOMES);

/**
 * QuickLogForm BASE schema - UI-friendly version with Title Case activity types
 * IMPORTANT: Exported for Zod v4 compatibility - use quickLogFormBaseSchema.partial().parse({}) for defaults
 *
 * This schema is designed for the QuickLogForm component and uses:
 * - Title Case activity types (for display)
 * - camelCase field names (for React form state)
 * - Date objects (for date picker components)
 *
 * When submitting, use ACTIVITY_TYPE_TO_API to convert activityType to API format
 */
export const quickLogFormBaseSchema = z.strictObject({
  activityType: activityDisplayTypeSchema,
  outcome: activityOutcomeSchema,
  date: z.date().default(() => new Date()),
  duration: z.number().min(0).optional(),
  contactId: z.number().optional(),
  organizationId: z.number().optional(),
  opportunityId: z.number().optional(),
  notes: z
    .string()
    .trim()
    .min(1, "Notes are required")
    .transform((val) => sanitizeHtml(val)),
  createFollowUp: z.coerce.boolean().default(false),
  followUpDate: z.date().optional(),
  // Sample tracking field (PRD §4.4)
  sampleStatus: sampleStatusSchema.optional(),
});

/**
 * QuickLogForm schema with refinements - for validation
 * Use quickLogFormBaseSchema.partial().parse({}) for form defaults
 */
export const quickLogFormSchema = quickLogFormBaseSchema
  .refine((data) => data.contactId || data.organizationId, {
    message: "Select a contact or organization before logging",
    path: ["contactId"],
  })
  .refine((data) => !data.createFollowUp || data.followUpDate, {
    message: "Follow-up date is required when creating a follow-up task",
    path: ["followUpDate"],
  })
  .superRefine((data, ctx) => {
    // Sample tracking validation (PRD §4.4)
    if (data.activityType === "Sample" && !data.sampleStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sampleStatus"],
        message: "Sample status is required for sample activities",
      });
    }
    if (data.activityType !== "Sample" && data.sampleStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sampleStatus"],
        message: "Sample status should only be set for sample activities",
      });
    }
  });

// Type inference for QuickLogForm
export type QuickLogFormInput = z.input<typeof quickLogFormSchema>;
export type QuickLogFormOutput = z.output<typeof quickLogFormSchema>;

// Legacy aliases for backward compatibility during migration
// NOTE: activityLogSchema points to refined schema for validation
// Use quickLogFormBaseSchema.partial().parse({}) for extracting form defaults
export const activityLogSchema = quickLogFormSchema;
export type ActivityLogInput = QuickLogFormInput;
export type ActivityLog = QuickLogFormOutput;
