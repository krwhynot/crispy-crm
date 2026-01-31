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

/**
 * Create schema - omits system-managed fields
 */
export const createOpportunityParticipantSchema = opportunityParticipantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

/**
 * Update schema - all fields optional except id
 */
export const updateOpportunityParticipantSchema = opportunityParticipantSchema
  .partial()
  .required({ id: true });

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

/**
 * Create schema - omits system-managed fields
 */
export const createOpportunityContactSchema = opportunityContactSchema.omit({
  id: true,
  created_at: true,
});

/**
 * Update schema - all fields optional except id
 */
export const updateOpportunityContactSchema = opportunityContactSchema.partial().required({
  id: true,
});
