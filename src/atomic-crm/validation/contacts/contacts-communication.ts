import { z } from "zod";

/**
 * Contact communication validation schemas
 * Email and phone validation for JSONB fields
 */

// Email and phone type enum - lowercase to match database JSONB format
export const personalInfoTypeSchema = z.enum(["work", "home", "other"]);

// Email and phone sub-schemas for JSONB arrays
// Field is "value" (not "email") to match database JSONB format
export const emailAndTypeSchema = z.strictObject({
  value: z.string().email("Invalid email address").max(254, "Email too long"),
  type: personalInfoTypeSchema.default("work"),
});

// Field is "value" (not "number") to match database JSONB format
export const phoneNumberAndTypeSchema = z.strictObject({
  value: z.string().trim().max(30, "Phone number too long"),
  type: personalInfoTypeSchema.default("work"),
});

// Email entry type for iteration - matches database JSONB format
export interface EmailEntry {
  value: string;
  type?: "work" | "home" | "other";
}
