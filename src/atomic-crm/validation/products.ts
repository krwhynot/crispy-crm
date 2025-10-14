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
  subcategory: z.string().optional(),

  // Pricing fields with defaults
  currency_code: currencyCodeSchema.default("USD"),
  unit_of_measure: unitOfMeasureSchema,
  list_price: z.number().min(0, "Price must be positive").optional(),

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

// Opportunity Product schema for line items (added for opportunity-products junction)
export const opportunityProductSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.coerce.number().int().positive("Product is required"),
  product_name: z.string().min(1, "Product name is required"),
  product_category: z.string().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// Type inference for opportunity products
export type OpportunityProduct = z.infer<typeof opportunityProductSchema>;

// Validation function for opportunity products
export async function validateOpportunityProduct(data: any): Promise<void> {
  try {
    opportunityProductSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Product validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}