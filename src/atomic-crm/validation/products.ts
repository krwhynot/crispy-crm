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

// Product status enum matching database
export const productStatusSchema = z.enum([
  "active",
  "discontinued",
  "seasonal",
  "coming_soon",
  "out_of_stock",
  "limited_availability",
]);

// Currency code validation (3-letter ISO codes)
export const currencyCodeSchema = z.string()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code like USD");

// Unit of measure - text field now for flexibility
export const unitOfMeasureSchema = z.string()
  .min(1, "Unit of measure is required")
  .default("each");

// Main product schema matching database structure
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
  manufacturer_part_number: z.string().optional(),
  subcategory: z.string().optional(),

  // B2B fields with defaults
  currency_code: currencyCodeSchema.default("USD"),
  unit_of_measure: unitOfMeasureSchema,
  minimum_order_quantity: z.number().int().min(1, "Minimum order must be at least 1").default(1),

  // Pricing fields (optional but must be positive if provided)
  list_price: z.number().min(0, "Price must be positive").optional(),
  cost_per_unit: z.number().min(0, "Cost must be positive").optional(),

  // Food/health specific fields (kept for flexibility)
  certifications: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  ingredients: z.string().optional(),
  nutritional_info: z.record(z.any()).optional(),
  marketing_description: z.string().optional(),

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