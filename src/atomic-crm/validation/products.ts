import { z } from "zod";

/**
 * Product validation schemas and functions
 * Following Engineering Constitution: Single validation at API boundary
 */

// Product category enum matching database
export const productCategorySchema = z.enum([
  "beverages",
  "dairy",
  "frozen",
  "fresh_produce",
  "meat_poultry",
  "seafood",
  "dry_goods",
  "snacks",
  "condiments",
  "baking_supplies",
  "spices_seasonings",
  "canned_goods",
  "pasta_grains",
  "oils_vinegars",
  "sweeteners",
  "cleaning_supplies",
  "paper_products",
  "equipment",
  "other",
]);

// Product status enum
export const productStatusSchema = z.enum([
  "active",
  "discontinued",
  "pending",
  "seasonal",
  "out_of_stock",
]);

// Unit of measure enum
export const unitOfMeasureSchema = z.enum([
  "each",
  "case",
  "pound",
  "kilogram",
  "liter",
  "gallon",
  "dozen",
  "pallet",
]);

// Main product schema
export const productSchema = z.object({
  // Required fields
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  principal_id: z.number().int().positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().optional(),
  brand: z.string().optional(),
  upc: z.string().optional(),
  unit_of_measure: unitOfMeasureSchema.optional().default("each"),
  subcategory: z.string().optional(),

  // Pricing fields (optional but must be positive if provided)
  list_price: z.number().min(0, "Price must be positive").optional(),
  cost_per_unit: z.number().min(0, "Cost must be positive").optional(),
  map_price: z.number().min(0, "MAP price must be positive").optional(),

  // Inventory fields
  min_order_quantity: z.number().int().min(1).optional().default(1),
  units_per_case: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),

  // System fields (handled automatically)
  created_by: z.number().int().optional(),
  updated_by: z.number().int().optional(),
});

// Validation function for React Admin
export async function validateProductForm(data: any): Promise<void> {
  // Use safeParse for consistent error handling
  const result = productSchema.safeParse(data);

  if (!result.success) {
    // Format validation errors for React Admin
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    // Throw error in React Admin expected format
    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}

// Export for type inference
export type ProductFormData = z.infer<typeof productSchema>;