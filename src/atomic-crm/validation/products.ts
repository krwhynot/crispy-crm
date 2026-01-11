import { z } from "zod";
import { createValidationError } from "@/lib/zodErrorFormatting";

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
export const productCategorySchema = z
  .string()
  .trim()
  .min(1, "Category is required")
  .max(100, "Category too long")
  .default("beverages");

// Export suggested categories for form components (Constitution Rule #5)
export const PRODUCT_CATEGORIES = FB_CONSUMABLE_CATEGORIES;

// Product status enum matching database
// Removed: seasonal, limited_availability (2025-10-18)
export const productStatusSchema = z.enum(["active", "discontinued", "coming_soon"]);

// Export the enum values for form components (Constitution Rule #5)
export const PRODUCT_STATUSES = productStatusSchema.options;

// Main product schema matching database structure
export const productSchema = z.strictObject({
  // Required fields - Zod v4 uses 'error' property instead of required_error/invalid_type_error
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().trim().max(2000).nullish(),

  // Food/health specific fields (kept for flexibility)
  // NOTE: Using .nullish() to accept both undefined and null values
  certifications: z.array(z.string().max(100)).max(50).nullish(),
  allergens: z.array(z.string().max(100)).max(50).nullish(),
  ingredients: z.string().trim().max(5000).nullish(),
  // Union supports both string and number values for backwards compatibility with legacy data
  nutritional_info: z
    .record(z.string().max(50), z.union([z.string().max(100), z.number()]))
    .nullish(),
  marketing_description: z.string().trim().max(2000).nullish(),

  // System fields (handled automatically)
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),
});

export const productUpdateSchema = productSchema.strip();

// Validation function for React Admin
export async function validateProductForm(data: unknown): Promise<void> {
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
    // React Admin expects { message, body: { errors } } - see opportunities.ts:203
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}

export async function validateProductUpdate(data: unknown): Promise<void> {
  const result = productUpdateSchema.safeParse(data);

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

// Export for type inference
export type ProductFormData = z.infer<typeof productSchema>;

// ============================================================================
// PRODUCT SCHEMAS WITH DISTRIBUTOR FIELDS
// ============================================================================
// These schemas explicitly allow distributor fields that are sent by the form
// (ProductDistributorInput.tsx) and processed by productsHandler before DB write.
//
// Uses z.strictObject() to REJECT truly unknown keys (fail-fast principle)
// while explicitly allowing the known distributor fields.

/**
 * Distributor fields schema - reusable for create and update
 * Types match exactly what ProductDistributorInput.tsx sends:
 * - distributor_ids: number[] - array of distributor organization IDs
 * - product_distributors: Record<number, { vendor_item_number: string | null }>
 */
const distributorFieldsSchema = {
  distributor_ids: z.array(z.coerce.number().int().positive()).optional(),
  // Zod v4: z.record(keySchema, valueSchema) - keys are strings in JS objects
  product_distributors: z
    .record(z.string(), z.strictObject({ vendor_item_number: z.string().max(50).nullable() }))
    .optional(),
};

/**
 * Product schema with distributor fields for create operations
 *
 * Uses z.strictObject() to:
 * 1. Validate all product fields strictly
 * 2. Explicitly allow distributor fields (handled by productsHandler.create)
 * 3. REJECT truly unknown keys (fail-fast principle)
 *
 * Constitution: Zod at API boundary, fail-fast on unknown keys
 */
export const productCreateWithDistributorsSchema = z.strictObject({
  // Required fields
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().trim().max(2000).nullish(),

  // Food/health specific fields
  certifications: z.array(z.string().max(100)).max(50).nullish(),
  allergens: z.array(z.string().max(100)).max(50).nullish(),
  ingredients: z.string().trim().max(5000).nullish(),
  // Union supports both string and number values for backwards compatibility with legacy data
  nutritional_info: z
    .record(z.string().max(50), z.union([z.string().max(100), z.number()]))
    .nullish(),
  marketing_description: z.string().trim().max(2000).nullish(),

  // System fields
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),

  // Distributor fields - explicitly allowed for productsHandler
  ...distributorFieldsSchema,
});

/**
 * Product schema with distributor fields for update operations
 * Same as create but id is allowed in data (React Admin includes it)
 */
export const productUpdateWithDistributorsSchema = z.strictObject({
  // ID may be included in update data
  id: z.union([z.string(), z.number()]).optional(),

  // Required fields
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  principal_id: z
    .number({ error: "Principal/Supplier is required" })
    .int()
    .positive("Principal/Supplier is required"),
  category: productCategorySchema,

  // Optional fields with defaults
  status: productStatusSchema.default("active"),
  description: z.string().trim().max(2000).nullish(),

  // Food/health specific fields
  certifications: z.array(z.string().max(100)).max(50).nullish(),
  allergens: z.array(z.string().max(100)).max(50).nullish(),
  ingredients: z.string().trim().max(5000).nullish(),
  // Union supports both string and number values for backwards compatibility with legacy data
  nutritional_info: z
    .record(z.string().max(50), z.union([z.string().max(100), z.number()]))
    .nullish(),
  marketing_description: z.string().trim().max(2000).nullish(),

  // System fields
  created_by: z.number().int().nullish(),
  updated_by: z.number().int().nullish(),

  // Distributor fields - explicitly allowed for productsHandler
  ...distributorFieldsSchema,
});

/**
 * Validation function for product create with distributor fields
 * Used by ValidationService for 'products' create operations
 */
export async function validateProductFormWithDistributors(data: unknown): Promise<void> {
  const result = productCreateWithDistributorsSchema.safeParse(data);

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
 * Validation function for product updates with distributor fields
 * Used by ValidationService for 'products' update operations
 */
export async function validateProductUpdateWithDistributors(data: unknown): Promise<void> {
  const result = productUpdateWithDistributorsSchema.safeParse(data);

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

// Opportunity Product schema for line items (added for opportunity-products junction)
// SIMPLIFIED: Only tracks product associations, no pricing/quantity (matches database schema)
export const opportunityProductSchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.coerce.number().int().positive("Product is required"),
  product_name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  product_category: z.string().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

// Type inference for opportunity products
export type OpportunityProduct = z.infer<typeof opportunityProductSchema>;

// Validation function for opportunity products
export async function validateOpportunityProduct(data: unknown): Promise<void> {
  try {
    opportunityProductSchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Product validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}
