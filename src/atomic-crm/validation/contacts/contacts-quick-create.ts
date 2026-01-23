import { z } from "zod";
import { emailAndTypeSchema, phoneNumberAndTypeSchema } from "./contacts-communication";

/**
 * Quick create contact validation schemas
 *
 * Two schemas for different layers:
 * 1. quickCreateContactFormSchema - For form validation (react-hook-form)
 *    Uses simple string types matching form inputs
 * 2. quickCreateContactSchema - For API boundary validation
 *    Uses array structures matching database format
 */

/**
 * Form-level validation for QuickCreateContactPopover
 * Uses simple string types because form inputs are individual strings,
 * not the array structures used at the API boundary.
 */
export const quickCreateContactFormSchema = z.strictObject({
  first_name: z.string().min(1, "First name required").max(100),
  last_name: z.string().min(1, "Last name required").max(100),
  email: z.string().email("Invalid email").max(255),
});

export type QuickCreateContactFormInput = z.infer<typeof quickCreateContactFormSchema>;

/**
 * API boundary validation for quick create contacts
 * Reduced requirements but maintains security
 */
export const quickCreateContactSchema = z.strictObject({
  // REQUIRED: Security-critical fields
  first_name: z.string().trim().min(1, "First name required").max(100),
  organization_id: z.coerce.number().int().positive(),

  // OPTIONAL: Can be empty for quick create
  last_name: z.string().trim().max(100).optional().default(""),
  email: z.array(emailAndTypeSchema).max(10, "Maximum 10 email addresses").optional().default([]),
  phone: z
    .array(phoneNumberAndTypeSchema)
    .max(10, "Maximum 10 phone numbers")
    .optional()
    .default([]),

  // PASS-THROUGH: Other valid fields
  sales_id: z.coerce.number().int().positive().optional(),
  first_seen: z.string().max(50).optional(),
  last_seen: z.string().max(50).optional(),
  quickCreate: z.literal(true), // Must be explicitly true

  // COMPUTED: Added by contactsCallbacks.computeNameField() before validation
  // Required by database NOT NULL constraint, but computed from first_name + last_name
  name: z.string().max(201).optional(), // 100 + space + 100 = max combined length
});
