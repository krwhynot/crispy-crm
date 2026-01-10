import { z } from "zod";

/**
 * Contact-Organization relationship validation schemas
 */

// Contact-Organization relationship schema
export const contactOrganizationSchema = z
  .strictObject({
    id: z.coerce.number().optional(),
    contact_id: z.coerce.number().optional(),
    organization_id: z.coerce.number().optional(),
    is_primary: z.coerce.boolean().default(false),
    created_at: z.string().max(50).optional(),
    updated_at: z.string().max(50).optional(),
    deleted_at: z.string().max(50).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Check for removed legacy fields and provide helpful error messages
    if ("is_primary_contact" in data) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Field 'is_primary_contact' is no longer supported. Use is_primary in contact_organizations relationship instead.",
        path: ["is_primary_contact"],
      });
    }
  });

export type ContactOrganization = z.infer<typeof contactOrganizationSchema>;

// Validation for contact-organization relationships
export async function validateContactOrganization(data: unknown): Promise<void> {
  try {
    contactOrganizationSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}
