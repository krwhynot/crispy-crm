import { z } from "zod";

/**
 * Quick Add Booth Visitor BASE validation schema
 * IMPORTANT: Exported for Zod v4 compatibility - use quickAddBaseSchema.partial().parse({}) for defaults
 *
 * This schema validates the input for creating a booth visitor opportunity,
 * which atomically creates an organization, contact, and opportunity record.
 *
 * Requirements:
 * - Organization: Either organization_id (existing) OR org_name (new) must be provided
 * - principal_id and account_manager_id are required
 * - All contact fields (first_name, last_name, phone, email) are optional
 * - Products, notes, campaign, city, and state are optional
 */
export const quickAddBaseSchema = z.strictObject({
  // Organization - either existing or new (one required, validated in refined schema)
  organization_id: z.number().optional(),
  org_name: z.string().max(255).optional(),

  // Required fields
  principal_id: z.number({ error: "Principal is required" }),
  account_manager_id: z.number({ error: "Account Manager is required" }),

  // Optional contact fields
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.union([z.string().email("Invalid email address").max(254), z.literal("")]).optional(),

  // Optional location/detail fields
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  // Campaign: transform empty strings to undefined to prevent "" from leaking through (WF-C2-003)
  // If campaign is provided, it must be non-empty meaningful data
  campaign: z
    .string()
    .max(255)
    .transform((val) => (val?.trim() === "" ? undefined : val?.trim()))
    .optional(),
  product_ids: z.array(z.number()).optional().default([]),
  quick_note: z.string().max(2000).optional(),
});

/**
 * Quick Add schema with refinements - for validation
 * Enforces: organization_id OR org_name must be provided
 * Use quickAddBaseSchema.partial().parse({}) for form defaults
 */
export const quickAddSchema = quickAddBaseSchema.refine(
  (data) => data.organization_id != null || (data.org_name && data.org_name.trim() !== ""),
  {
    message: "Organization is required",
    path: ["organization_id"],
  }
);

/**
 * Type inference for QuickAdd input
 * Use this type for form data and function parameters
 */
export type QuickAddInput = z.infer<typeof quickAddSchema>;
