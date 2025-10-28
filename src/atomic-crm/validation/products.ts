import { z } from "zod";

/**
 * Product validation schemas and functions
 * Following Engineering Constitution: Single validation at API boundary
 */

// F&B Consumable categories (suggested values)
// Note: Database now accepts TEXT to allow custom categories
export const FB_CONSUMABLE_CATEGORIES = [
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
  "other",
] as const;

// Product category schema - now accepts any non-empty string
export const productCategorySchema = z.string().min(1, "Category is required").default("beverages");

// Export suggested categories for form components (Constitution Rule #5)
export const PRODUCT_CATEGORIES = FB_CONSUMABLE_CATEGORIES;

// Product status enum matching database
// Removed: seasonal, limited_availability (2025-10-18)
export const productStatusSchema = z.enum([
  "active",
  "discontinued",
  "coming_soon",
]);

// Export the enum values for form components (Constitution Rule #5)
export const PRODUCT_STATUSES = productStatusSchema.options;

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
  distributor_id: z.number().int().positive().optional(),

  // Food/health specific fields (kept for flexibility)
  // NOTE: Using .nullish() to accept both undefined and null values
  certifications: z.array(z.string()).nullish(),
  allergens: z.array(z.string()).nullish(),
  ingredients: z.string().nullish(),
  nutritional_info: z.record(z.any()).nullish(),
  marketing_description: z.string().nullish(),

  // System fields (handled automatically)
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),
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