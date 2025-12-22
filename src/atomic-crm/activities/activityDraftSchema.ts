import { z } from "zod";

/**
 * Schema for activity draft data stored in localStorage.
 *
 * Used by LogActivityFAB and QuickLogActivityDialog to persist
 * unsaved activity form data across page navigations.
 *
 * Security: Validates localStorage data to prevent type confusion attacks.
 */
export const activityDraftSchema = z.strictObject({
  formData: z
    .object({
      activity_type: z.string().max(50).optional(),
      notes: z.string().max(10000).optional(),
      contact_id: z.number().int().positive().optional(),
      organization_id: z.number().int().positive().optional(),
      opportunity_id: z.number().int().positive().optional(),
      date: z.string().max(50).optional(),
    })
    .passthrough(), // Allow additional form fields
  savedAt: z.number().int().positive(),
});

export type ActivityDraft = z.infer<typeof activityDraftSchema>;
