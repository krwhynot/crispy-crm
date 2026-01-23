import { z } from "zod";

/**
 * Contact communication validation schemas
 * Email and phone validation for JSONB fields
 */

// Email and phone type enum - lowercase to match database JSONB format
export const personalInfoTypeSchema = z.enum(["work", "home", "other"]);

// Email and phone sub-schemas for JSONB arrays
// Field is "value" (not "email") to match database JSONB format
// Uses z.preprocess() to coerce empty/null/undefined type to "work" default
// This handles React Admin's SimpleFormIterator which may send { value: "", type: "" }
export const emailAndTypeSchema = z.strictObject({
  value: z.string().email("Invalid email address").max(254, "Email too long"),
  type: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? "work" : val),
    personalInfoTypeSchema
  ),
});

// Field is "value" (not "number") to match database JSONB format
// Uses z.preprocess() to coerce empty/null/undefined type to "work" default
export const phoneNumberAndTypeSchema = z.strictObject({
  value: z.string().trim().max(30, "Phone number too long"),
  type: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? "work" : val),
    personalInfoTypeSchema
  ),
});

// Email entry type for iteration - matches database JSONB format
// Derived from schema for single source of truth (DOMAIN_INTEGRITY.md)
export type EmailEntry = z.infer<typeof emailAndTypeSchema>;
