import { z } from "zod";

/**
 * All 13 activity types from PRD v1.18
 * Organized into logical groups for dropdown UI
 */
export const ACTIVITY_TYPE_GROUPS = {
  Communication: ["Call", "Email", "Check-in", "Social"] as const,
  Meetings: ["Meeting", "Demo", "Site Visit", "Trade Show"] as const,
  Documentation: ["Proposal", "Contract Review", "Follow-up", "Note", "Sample"] as const,
} as const;

// Flatten all activity types for the schema
const ALL_ACTIVITY_TYPES = [
  ...ACTIVITY_TYPE_GROUPS.Communication,
  ...ACTIVITY_TYPE_GROUPS.Meetings,
  ...ACTIVITY_TYPE_GROUPS.Documentation,
] as const;

// Activity types that map to database interaction_type enum (13 types from PRD)
export const activityTypeSchema = z.enum(ALL_ACTIVITY_TYPES);

export const activityOutcomeSchema = z.enum([
  "Connected",
  "Left Voicemail",
  "No Answer",
  "Completed",
  "Rescheduled",
]);

// Mapping display labels to database enum values (snake_case)
export const ACTIVITY_TYPE_MAP: Record<string, string> = {
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

export const activityLogSchema = z
  .object({
    activityType: activityTypeSchema,
    outcome: activityOutcomeSchema,
    date: z.date().default(() => new Date()),
    duration: z.number().min(0).optional(),
    contactId: z.number().optional(),
    organizationId: z.number().optional(),
    opportunityId: z.number().optional(),
    notes: z.string().min(1, "Notes are required"),
    createFollowUp: z.boolean().default(false),
    followUpDate: z.date().optional(),
  })
  .refine((data) => data.contactId || data.organizationId, {
    message: "Select a contact or organization before logging",
    path: ["contactId"],
  })
  .refine((data) => !data.createFollowUp || data.followUpDate, {
    message: "Follow-up date is required when creating a follow-up task",
    path: ["followUpDate"],
  });

export type ActivityLogInput = z.input<typeof activityLogSchema>;
export type ActivityLog = z.output<typeof activityLogSchema>;
