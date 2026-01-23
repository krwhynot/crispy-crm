import { z } from "zod";
import { productCategorySchema, productStatusSchema } from "./products";
import { productDistributorStatusSchema } from "./productDistributors";

/**
 * Product with Distributors validation schema
 * Used for atomic product creation with distributor associations
 * Following Engineering Constitution: z.strictObject, string .max() limits
 */

// Schema for distributor association in create payload
export const distributorAssociationSchema = z.strictObject({
  distributor_id: z.coerce.number().int().positive("Distributor is required"),
  vendor_item_number: z.string().max(50, "Vendor item number too long").nullable().optional(),
  status: productDistributorStatusSchema.default("pending"),
  notes: z.string().max(1000, "Notes too long").nullable().optional(),
});

export type DistributorAssociation = z.infer<typeof distributorAssociationSchema>;

// Main schema for product with distributors
export const productWithDistributorsSchema = z.strictObject({
  // Required product fields
  name: z.string().trim().min(1, "Product name is required").max(255, "Product name too long"),
  principal_id: z.coerce.number().int().positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional product fields
  status: productStatusSchema.default("active"),
  description: z.string().max(2000).optional(),
  manufacturer_part_number: z.string().max(100).nullable().optional(),

  // Distributor associations array
  distributors: z
    .array(distributorAssociationSchema)
    .max(100, "Maximum 100 distributors")
    .default([]),

  // System fields (handled automatically)
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),
});

export type ProductWithDistributors = z.infer<typeof productWithDistributorsSchema>;
export type ProductWithDistributorsInput = z.input<typeof productWithDistributorsSchema>;

// Form defaults (Engineering Constitution: form state from schema)
export const productWithDistributorsDefaults = productWithDistributorsSchema.partial().parse({
  status: "active",
  category: "beverages",
  distributors: [],
});

/**
 * Validation function for the combined payload
 * @throws Error with formatted errors for React Admin
 */
export async function validateCreateProductWithDistributors(data: unknown): Promise<void> {
  const result = productWithDistributorsSchema.safeParse(data);

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

/**
 * Transform form data to RPC parameters
 * Separates product data from distributor associations
 */
export function transformToRpcParams(data: ProductWithDistributors): {
  productData: Record<string, unknown>;
  distributors: DistributorAssociation[];
} {
  const { distributors, ...productData } = data;
  return {
    productData,
    distributors: distributors || [],
  };
}
