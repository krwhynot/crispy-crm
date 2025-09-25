import { z } from 'zod';
import type { Identifier } from 'ra-core';

/**
 * Opportunity validation schemas and functions
 * Implements validation rules from OpportunityInputs.tsx
 */

// Enum schemas for stage, status, and priority
export const opportunityStageSchema = z.enum([
  'lead',
  'qualified',
  'needs_analysis',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'nurturing'
]);

export const opportunityStatusSchema = z.enum([
  'active',
  'on_hold',
  'nurturing',
  'stalled',
  'expired'
]);

export const opportunityPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

// Main opportunity schema
export const opportunitySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Opportunity name is required'),
  customer_organization_id: z.union([z.string(), z.number()]).optional(),
  principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  contact_ids: z.array(z.union([z.string(), z.number()])).min(1, 'At least one contact is required'),
  category: z.string().optional(),
  stage: opportunityStageSchema.default('lead'),
  status: opportunityStatusSchema.optional(),
  priority: opportunityPrioritySchema.default('medium'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive').default(0),
  probability: z.number()
    .min(0, 'Probability must be between 0 and 100')
    .max(100, 'Probability must be between 0 and 100')
    .default(50),
  expected_closing_date: z.string().min(1, 'Expected closing date is required'),
  estimated_close_date: z.string().optional(),
  actual_close_date: z.string().optional().nullable(),
  sales_id: z.union([z.string(), z.number()]).optional(),
  index: z.number().optional(),
  founding_interaction_id: z.union([z.string(), z.number()]).optional().nullable(),
  stage_manual: z.boolean().optional(),
  status_manual: z.boolean().optional(),
  next_action: z.string().optional().nullable(),
  next_action_date: z.string().optional().nullable(),
  competition: z.string().optional().nullable(),
  decision_criteria: z.string().optional().nullable(),

  // Backward compatibility fields (may be present but not used)
  company_id: z.union([z.string(), z.number()]).optional(),
  archived_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Type inference
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;

// Validation function matching expected signature from unifiedDataProvider
export async function validateOpportunityForm(data: any): Promise<void> {
  try {
    // Parse and validate the data
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });

      // Throw error in React Admin expected format
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// Create-specific schema (stricter requirements)
export const createOpportunitySchema = opportunitySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
}).required({
  name: true,
  contact_ids: true,
  expected_closing_date: true,
});

// Update-specific schema (more flexible)
export const updateOpportunitySchema = opportunitySchema.partial().required({
  id: true,
});

// Export validation functions for specific operations
export async function validateCreateOpportunity(data: any): Promise<void> {
  try {
    createOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

export async function validateUpdateOpportunity(data: any): Promise<void> {
  try {
    updateOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      throw {
        message: 'Validation failed',
        errors: formattedErrors,
      };
    }
    throw error;
  }
}