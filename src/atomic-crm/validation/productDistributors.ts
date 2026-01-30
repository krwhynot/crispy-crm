import { z } from "zod";
import { zodErrorToReactAdminError } from "./utils";

/**
 * ProductDistributor validation schemas
 * Junction table linking products to distributors with vendor item codes
 * Following Engineering Constitution: Single validation at API boundary
 */

// ===== ENUM DEFINITIONS =====
export const productDistributorStatusSchema = z.enum(["pending", "active", "inactive"]);
export type ProductDistributorStatus = z.infer<typeof productDistributorStatusSchema>;

// ===== MAIN SCHEMA =====
export const productDistributorSchema = z.strictObject({
  // Composite primary key - BIGINT foreign keys
  product_id: z.coerce.number().int().positive("Product is required"),
  distributor_id: z.coerce.number().int().positive("Distributor is required"),

  // DOT number (vendor's internal code: USF#, Sysco#, GFS#)
  vendor_item_number: z.string().max(50, "Vendor item number too long").nullable().optional(),

  // Status workflow
  status: productDistributorStatusSchema.default("pending"),

  // Temporal validity
  valid_from: z.coerce.date().default(() => new Date()),
  valid_to: z.coerce.date().nullable().optional(),

  // Context
  notes: z.string().max(1000, "Notes too long").nullable().optional(),

  // Audit timestamps
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type ProductDistributor = z.infer<typeof productDistributorSchema>;
export type ProductDistributorInput = z.input<typeof productDistributorSchema>;

// Form defaults (Engineering Constitution: form state from schema)
export const productDistributorDefaults = productDistributorSchema.partial().parse({
  status: "pending",
});

// Create schema (both FKs required, no system fields)
export const createProductDistributorSchema = productDistributorSchema
  .omit({
    created_at: true,
    updated_at: true,
  })
  .required({
    product_id: true,
    distributor_id: true,
  });

// Update schema (FKs immutable after creation)
export const updateProductDistributorSchema = productDistributorSchema.partial().omit({
  product_id: true,
  distributor_id: true,
  created_at: true,
});

// ===== VALIDATION FUNCTIONS =====
// Following existing pattern from other validation files

export async function validateProductDistributorForm(data: unknown): Promise<void> {
  const result = productDistributorSchema.safeParse(data);

  if (!result.success) {
    throw zodErrorToReactAdminError(result.error);
  }
}

export async function validateCreateProductDistributor(data: unknown): Promise<void> {
  const result = createProductDistributorSchema.safeParse(data);

  if (!result.success) {
    throw zodErrorToReactAdminError(result.error);
  }
}

export async function validateUpdateProductDistributor(data: unknown): Promise<void> {
  const result = updateProductDistributorSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}
