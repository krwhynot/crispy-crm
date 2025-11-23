import { z } from "zod";

// Activity types that map to database interaction_type enum
export const activityTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Note", // ✅ Added for quick note logging
]);

export const activityOutcomeSchema = z.enum([
  "Connected",
  "Left Voicemail",
  "No Answer",
  "Completed",
  "Rescheduled",
]);

// Mapping to database enum values
export const ACTIVITY_TYPE_MAP: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  "Follow-up": "follow_up",
  Note: "note", // ✅ Maps to interaction_type.note from migration
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
