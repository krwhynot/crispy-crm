import { z } from "zod";

/**
 * Quick Add Booth Visitor BASE validation schema
 * IMPORTANT: Exported for Zod v4 compatibility - use quickAddBaseSchema.partial().parse({}) for defaults
 *
 * This schema validates the input for creating a booth visitor opportunity,
 * which atomically creates an organization, contact, and opportunity record.
 *
 * Requirements:
 * - Contact first_name, last_name are optional
 * - Contact must have at least one of phone OR email (validated in refined schema)
 * - Organization must have name; city and state are optional
 * - Opportunity must have campaign and principal_id
 * - Products and notes are optional
 */
export const quickAddBaseSchema = z.strictObject({
  // Contact fields (optional)
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),

  // Contact information (at least one required, validated in refined schema)
  phone: z.string().max(50).optional(),
  email: z.union([z.string().email("Invalid email address").max(254), z.literal("")]).optional(),

  // Organization fields (org_name required, city/state optional)
  org_name: z
    .string({ error: "Organization name required" })
    .trim()
    .min(1, "Organization name required")
    .max(255),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),

  // Opportunity fields (required)
  campaign: z.string({ error: "Campaign required" }).trim().min(1, "Campaign required").max(255),
  principal_id: z.number({ error: "Principal required" }),

  // Optional fields
  product_ids: z.array(z.number()).optional().default([]),
  quick_note: z.string().max(2000).optional(),
});

/**
 * Quick Add schema with refinements - for validation
 * Enforces phone OR email requirement
 * Use quickAddBaseSchema.partial().parse({}) for form defaults
 */
export const quickAddSchema = quickAddBaseSchema.refine((data) => !!data.phone || !!data.email, {
  message: "Phone or Email required (at least one)",
  path: ["phone"],
});

/**
 * Type inference for QuickAdd input
 * Use this type for form data and function parameters
 */
export type QuickAddInput = z.infer<typeof quickAddSchema>;
