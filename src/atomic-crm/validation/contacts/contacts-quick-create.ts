import { z } from "zod";
import { emailAndTypeSchema, phoneNumberAndTypeSchema } from "./contacts-communication";

/**
 * Quick create contact validation schema
 * Reduced requirements but maintains security
 */

export const quickCreateContactSchema = z.strictObject({
  // REQUIRED: Security-critical fields
  first_name: z.string().trim().min(1, "First name required").max(100),
  organization_id: z.coerce.number().int().positive(),

  // OPTIONAL: Can be empty for quick create
  last_name: z.string().trim().max(100).optional().default(""),
  email: z.array(emailAndTypeSchema).optional().default([]),
  phone: z.array(phoneNumberAndTypeSchema).optional().default([]),

  // PASS-THROUGH: Other valid fields
  sales_id: z.coerce.number().int().positive().optional(),
  first_seen: z.string().max(50).optional(),
  last_seen: z.string().max(50).optional(),
  quickCreate: z.literal(true), // Must be explicitly true

  // COMPUTED: Added by contactsCallbacks.computeNameField() before validation
  // Required by database NOT NULL constraint, but computed from first_name + last_name
  name: z.string().max(201).optional(), // 100 + space + 100 = max combined length
});
