import { z } from "zod";

/**
 * Opportunity Junction Table Schemas
 *
 * Validation schemas for many-to-many relationships between opportunities
 * and other entities (participants, contacts).
 *
 * Per Engineering Constitution:
 * - z.strictObject() to reject unknown keys
 * - z.coerce for form inputs that may arrive as strings
 * - Single source of truth for types via z.infer
 */

// ============================================================================
// Opportunity Participants (Organizations linked to opportunities)
// ============================================================================

/**
 * Participant role enum - defines organization's role in the opportunity
 * Matches database enum: customer, principal, distributor, competitor
 */
export const opportunityParticipantRoleSchema = z.enum([
  "customer",
  "principal",
  "distributor",
  "competitor",
]);

export type OpportunityParticipantRole = z.infer<typeof opportunityParticipantRoleSchema>;

/**
 * Opportunity Participant schema
 * Links organizations to opportunities with role metadata
 *
 * Database table: opportunity_participants
 */
export const opportunityParticipantSchema = z.strictObject({
  id: z.coerce.number().int().positive().optional(),
  opportunity_id: z.coerce.number().int().positive("Opportunity is required"),
  organization_id: z.coerce.number().int().positive("Organization is required"),
  role: opportunityParticipantRoleSchema,
  is_primary: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000, "Notes too long").optional().nullable(),

  // Audit fields
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional().nullable(),
  created_by: z.coerce.number().int().positive().optional().nullable(),
  deleted_at: z.string().max(50).optional().nullable(),
});

export type OpportunityParticipant = z.infer<typeof opportunityParticipantSchema>;
export type OpportunityParticipantInput = z.input<typeof opportunityParticipantSchema>;

/**
 * Create schema - omits system-managed fields
 */
export const createOpportunityParticipantSchema = opportunityParticipantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export type CreateOpportunityParticipantInput = z.infer<typeof createOpportunityParticipantSchema>;

/**
 * Update schema - all fields optional except id
 */
export const updateOpportunityParticipantSchema = opportunityParticipantSchema
  .partial()
  .required({ id: true });

export type UpdateOpportunityParticipantInput = z.infer<typeof updateOpportunityParticipantSchema>;

// ============================================================================
// Opportunity Contacts (Contacts linked to opportunities)
// ============================================================================

/**
 * Opportunity Contact schema
 * Links contacts to opportunities with role and primary flag
 *
 * Database table: opportunity_contacts
 */
export const opportunityContactSchema = z.strictObject({
  id: z.coerce.number().int().positive().optional(),
  opportunity_id: z.coerce.number().int().positive("Opportunity is required"),
  contact_id: z.coerce.number().int().positive("Contact is required"),
  role: z.string().trim().max(100, "Role too long").optional().nullable(),
  is_primary: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000, "Notes too long").optional().nullable(),

  // Audit fields
  created_at: z.string().max(50).optional(),
});

export type OpportunityContact = z.infer<typeof opportunityContactSchema>;
export type OpportunityContactInput = z.input<typeof opportunityContactSchema>;

/**
 * Create schema - omits system-managed fields
 */
export const createOpportunityContactSchema = opportunityContactSchema.omit({
  id: true,
  created_at: true,
});

export type CreateOpportunityContactInput = z.infer<typeof createOpportunityContactSchema>;

/**
 * Update schema - all fields optional except id
 */
export const updateOpportunityContactSchema = opportunityContactSchema.partial().required({
  id: true,
});

export type UpdateOpportunityContactInput = z.infer<typeof updateOpportunityContactSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate opportunity participant data
 * @throws Zod validation error if invalid
 */
export function validateOpportunityParticipant(data: unknown): OpportunityParticipant {
  return opportunityParticipantSchema.parse(data);
}

/**
 * Validate opportunity contact data
 * @throws Zod validation error if invalid
 */
export function validateOpportunityContact(data: unknown): OpportunityContact {
  return opportunityContactSchema.parse(data);
}
