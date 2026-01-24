/**
 * Activity UI display transforms
 *
 * Schemas and types for UI-friendly activity forms (QuickLogForm).
 */

import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";
import { sampleStatusSchema } from "./types";
import { ACTIVITY_TYPE_GROUPS } from "./constants";

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
  // Sample tracking field (PRD 4.4)
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
    // Sample tracking validation (PRD 4.4)
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
export const activityLogSchema = quickLogFormSchema;
export type ActivityLogInput = QuickLogFormInput;
export type ActivityLog = QuickLogFormOutput;
