import { z } from "zod";

/**
 * Quick Add Booth Visitor validation schema
 * Implements validation rules for the Quick Add dialog for trade show data entry
 *
 * This schema validates the input for creating a booth visitor opportunity,
 * which atomically creates an organization, contact, and opportunity record.
 *
 * Requirements:
 * - Contact must have first_name and last_name
 * - Contact must have at least one of phone OR email
 * - Organization must have name, city, and state
 * - Opportunity must have campaign and principal_id
 * - Products and notes are optional
 */
export const quickAddSchema = z
  .strictObject({
    // Contact fields (required)
    first_name: z.string({ required_error: "First name required" }).min(1, "First name required"),
    last_name: z.string({ required_error: "Last name required" }).min(1, "Last name required"),

    // Contact information (at least one required, validated in refine)
    phone: z.string().optional(),
    email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),

    // Organization fields (required)
    org_name: z
      .string({ required_error: "Organization name required" })
      .min(1, "Organization name required"),
    city: z.string({ required_error: "City required" }).min(1, "City required"),
    state: z.string({ required_error: "State required" }).min(1, "State required"),

    // Opportunity fields (required)
    campaign: z.string({ required_error: "Campaign required" }).min(1, "Campaign required"),
    principal_id: z.number({ required_error: "Principal required" }),

    // Optional fields
    product_ids: z.array(z.number()).optional().default([]),
    quick_note: z.string().optional(),
  })
  .refine((data) => !!data.phone || !!data.email, {
    message: "Phone or Email required (at least one)",
    path: ["phone"],
  });

/**
 * Type inference for QuickAdd input
 * Use this type for form data and function parameters
 */
export type QuickAddInput = z.infer<typeof quickAddSchema>;
