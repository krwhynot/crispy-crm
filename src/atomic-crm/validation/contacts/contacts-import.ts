import { z } from "zod";
import { contactSchema } from "./contacts-core";

/**
 * Contact import validation schema
 * Validates raw string fields from CSV imports
 */

/**
 * Validates a single import row against the contact schema
 * Encapsulates Zod validation so UI components don't need to import Zod
 *
 * @param row - The data row to validate
 * @param rowIndex - 0-based row index (displayed as rowIndex + 1)
 * @returns Structured validation result with field-level errors
 */
export function validateContactImportRow(row: unknown, rowIndex: number): ImportValidationResult {
  try {
    contactSchema.parse(row);
    return { row: rowIndex + 1, valid: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        row: rowIndex + 1,
        valid: false,
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      };
    }
    // Non-Zod error - return generic failure
    return { row: rowIndex + 1, valid: false, errors: [] };
  }
}

// LinkedIn URL validation
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

// Schema specifically for CSV imports - validates raw string fields from CSV
// More permissive than the main schema to handle real-world CSV data
export const importContactSchema = z
  .object({
    first_name: z.string().trim().max(100).optional().nullable(),
    last_name: z.string().trim().max(100).optional().nullable(),
    organization_name: z
      .string({ error: "Organization name is required" })
      .trim()
      .min(1, { message: "Organization name is required" }),
    // Email fields - validate format but allow empty/null for lenient imports
    email_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().trim().email({ message: "Invalid email address" }),
      ])
      .optional()
      .nullable(),
    email_home: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().trim().email({ message: "Invalid email address" }),
      ])
      .optional()
      .nullable(),
    email_other: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().trim().email({ message: "Invalid email address" }),
      ])
      .optional()
      .nullable(),
    // Phone fields - allow empty, null, string, or number (PapaParse converts numeric strings to numbers)
    phone_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().max(50),
        z.number().transform(String), // Convert numbers to strings
      ])
      .optional()
      .nullable(),
    phone_home: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().max(50),
        z.number().transform(String), // Convert numbers to strings
      ])
      .optional()
      .nullable(),
    phone_other: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().max(50),
        z.number().transform(String), // Convert numbers to strings
      ])
      .optional()
      .nullable(),
    // LinkedIn URL - allow empty, null, or valid LinkedIn URL
    linkedin_url: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z
          .string()
          .max(2048, "URL too long")
          .refine(
            (url) => {
              try {
                const parsedUrl = new URL(url);
                return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
              } catch {
                return false;
              }
            },
            { message: "LinkedIn URL must be a valid URL from linkedin.com" }
          ),
      ])
      .optional()
      .nullable(),
    // Other optional fields - allow empty, null, or any string (with .max() for DoS prevention)
    title: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().trim().max(100)])
      .optional()
      .nullable(),
    notes: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().trim().max(5000)])
      .optional()
      .nullable(),
    tags: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().trim().max(1000)])
      .optional()
      .nullable(),
    first_seen: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().max(50)])
      .optional()
      .nullable(),
    last_seen: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().max(50)])
      .optional()
      .nullable(),
    gender: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().trim().max(50)])
      .optional()
      .nullable(),
    // Avatar field - allow URL strings for importing avatar images
    avatar: z
      .union([z.literal(""), z.literal(null), z.undefined(), z.string().max(2048)])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // Require at least first name or last name
    if (!data.first_name?.trim() && !data.last_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "Either first name or last name must be provided",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_name"],
        message: "Either first name or last name must be provided",
      });
    }
  });

export type ImportContactInput = z.input<typeof importContactSchema>;
