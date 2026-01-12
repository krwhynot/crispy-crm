import { z } from "zod";
import { sanitizeHtml } from "@/lib/sanitization";

/**
 * Core opportunity validation schemas
 * Base schemas, enums, and types
 */

// Enum schemas matching UI select options
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const leadSourceSchema = z.enum([
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
]);

/**
 * Win/Loss Reason Schemas (TODO-004a)
 * Per PRD Section 5.3, MVP #12, #47 - Industry standard (Salesforce/HubSpot)
 * Required when closing opportunities to track deal outcomes
 */

// Win reasons - why deals are won
export const winReasonSchema = z.enum([
  "relationship", // Strong existing relationship with customer
  "product_quality", // Superior product quality/fit
  "price_competitive", // Competitive pricing
  "timing", // Right timing for customer needs
  "other", // Free-text reason required
]);

// Loss reasons - why deals are lost
export const lossReasonSchema = z.enum([
  "price_too_high", // Price not competitive
  "no_authorization", // Distributor not authorized for principal
  "competitor_relationship", // Customer has existing competitor relationship
  "product_fit", // Product doesn't meet customer needs
  "timing", // Bad timing (budget, seasonality, etc.)
  "no_response", // Customer became unresponsive
  "other", // Free-text reason required
]);

// Type exports for use in components
export type WinReason = z.infer<typeof winReasonSchema>;
export type LossReason = z.infer<typeof lossReasonSchema>;

// Constants for UI dropdown choices
export const WIN_REASONS: Array<{ id: WinReason; name: string }> = [
  { id: "relationship", name: "Strong Relationship" },
  { id: "product_quality", name: "Product Quality/Fit" },
  { id: "price_competitive", name: "Competitive Pricing" },
  { id: "timing", name: "Right Timing" },
  { id: "other", name: "Other (specify)" },
];

export const LOSS_REASONS: Array<{ id: LossReason; name: string }> = [
  { id: "price_too_high", name: "Price Too High" },
  { id: "no_authorization", name: "No Distributor Authorization" },
  { id: "competitor_relationship", name: "Competitor Relationship" },
  { id: "product_fit", name: "Product Didn't Fit" },
  { id: "timing", name: "Bad Timing" },
  { id: "no_response", name: "Customer Unresponsive" },
  { id: "other", name: "Other (specify)" },
];

// Base schema - validates only fields that have UI inputs in OpportunityInputs.tsx
const opportunityBaseSchema = z.strictObject({
  // System fields
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  version: z.number().optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // OpportunityInfoInputs fields
  name: z
    .string()
    .trim()
    .min(1, "Opportunity name is required")
    .max(255, "Opportunity name too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  estimated_close_date: z.coerce
    .date({
      error: "Expected closing date is required",
    })
    .default(() => {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }),

  // OpportunityClassificationInputs fields
  // Stage is REQUIRED - no silent default. Forms must explicitly select a stage.
  // This prevents workflow corruption from missing/null stage values.
  stage: opportunityStageSchema,
  priority: opportunityPrioritySchema,
  lead_source: leadSourceSchema.optional().nullable(),

  // OpportunityOrganizationInputs fields
  customer_organization_id: z.union([z.string(), z.number()]), // Required - marked with * in UI
  principal_organization_id: z.union([z.string(), z.number()]), // Required - marked with * in UI
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),

  // OpportunityContactsInput fields
  // SECURITY: Use z.coerce.number() to reject non-numeric strings like "@@ra-create"
  // This provides defense-in-depth against UI bugs that might add invalid IDs
  contact_ids: z.array(z.coerce.number().int().positive()).optional().default([]),

  // Campaign & Workflow Tracking fields (added 2025-11-03)
  campaign: z
    .string()
    .trim()
    .max(100, "Campaign name must be 100 characters or less")
    .optional()
    .nullable(),
  related_opportunity_id: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // General notes about the opportunity (separate from activity log)
  tags: z
    .array(z.string().trim().max(50, "Tag must be 50 characters or less"))
    .max(20, "Maximum 20 tags allowed")
    .optional()
    .default([]),
  next_action: z
    .string()
    .trim()
    .max(500, "Next action must be 500 characters or less")
    .optional()
    .nullable(),
  next_action_date: z.coerce.date().optional().nullable(),
  decision_criteria: z
    .string()
    .trim()
    .max(2000, "Decision criteria must be 2000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Win/Loss Reason Fields (TODO-004a)
  // Required when stage is closed_won or closed_lost respectively
  // Per PRD Section 5.3, MVP #12, #47 - industry standard
  win_reason: winReasonSchema.optional().nullable(),
  loss_reason: lossReasonSchema.optional().nullable(),
  close_reason_notes: z
    .string()
    .trim()
    .max(500, "Close reason notes must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)), // Required when reason is "other"

  // Database fields (read-only - no UI inputs in OpportunityInputs.tsx)
  // Included in schema for validation completeness when loading records
  status: z.enum(["active", "on_hold", "nurturing", "stalled", "expired"]).optional().nullable(),
  index: z.number().int().optional().nullable(),
  actual_close_date: z.coerce.date().optional().nullable(),
  stage_manual: z.boolean().optional().nullable(),
  status_manual: z.boolean().optional().nullable(),
  competition: z.string().max(2000).optional().nullable(),
  founding_interaction_id: z.union([z.string(), z.number()]).optional().nullable(),
  probability: z.number().optional().nullable(),
  opportunity_owner_id: z.union([z.string(), z.number()]).optional().nullable(),
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  updated_by: z.union([z.string(), z.number()]).optional().nullable(),
  search_tsv: z.string().optional().nullable(),
  stage_changed_at: z.string().optional().nullable(),

  // Summary view computed fields (populated by database views, not editable)
  customer_organization_name: z.string().optional().nullable(),
  principal_organization_name: z.string().optional().nullable(),
  distributor_organization_name: z.string().optional().nullable(),
  days_in_stage: z.number().optional().nullable(),
  last_activity_date: z.string().optional().nullable(),
  days_since_last_activity: z.number().optional().nullable(),
  pending_task_count: z.number().optional().nullable(),
  overdue_task_count: z.number().optional().nullable(),
  next_task_id: z.union([z.string(), z.number()]).optional().nullable(),
  next_task_title: z.string().optional().nullable(),
  next_task_due_date: z.string().optional().nullable(),
  next_task_priority: z.string().optional().nullable(),
  products: z.any().optional().nullable(), // JSONB array from view
});

// Main opportunity schema
// Fields with .default() provide business logic defaults that will be used
// by forms via schema.parse({}) - see Constitution #5: FORM STATE DERIVED FROM TRUTH
export const opportunitySchema = opportunityBaseSchema;

// Type inference
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;

// Pipeline stage type (P1 consolidation - single source of truth)
// This replaces the manual type in stageConstants.ts
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;

// Validation function matching expected signature from unifiedDataProvider
export async function validateOpportunityForm(data: unknown): Promise<void> {
  try {
    opportunitySchema.parse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        body: { errors: formattedErrors }, // React Admin expects errors at body.errors
      };
    }
    throw error;
  }
}
