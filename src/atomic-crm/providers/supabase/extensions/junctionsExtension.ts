/**
 * Junctions Extension Layer
 *
 * Delegates junction table custom methods to JunctionsService.
 * Provides relationship management for contact-organization, opportunity-participant,
 * and opportunity-contact junctions.
 *
 * Methods (13 total):
 * - Contact-Organization (4): get, add, remove, setPrimary
 * - Opportunity-Participant (3): get, add, remove
 * - Opportunity-Contact (6): get, add, remove, + 3 legacy "ViaJunction" methods
 *
 * @module providers/supabase/extensions/junctionsExtension
 */

import type { Identifier } from "ra-core";
import type { ServiceContainer } from "../services";
import type { JunctionParams } from "./types";
import type {
  ContactOrganization,
  OpportunityParticipant,
  OpportunityContact,
} from "../../../types";

/**
 * Junctions extension methods interface
 */
export interface JunctionsExtension {
  // Contact-Organization junction methods
  getContactOrganizations(contactId: Identifier): Promise<{ data: ContactOrganization[] }>;
  addContactToOrganization(
    contactId: Identifier,
    organizationId: Identifier,
    params: JunctionParams
  ): Promise<{ data: ContactOrganization }>;
  removeContactFromOrganization(
    contactId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { id: string } }>;
  setPrimaryOrganization(
    contactId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { success: boolean } }>;

  // Opportunity-Participant junction methods
  getOpportunityParticipants(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityParticipant[] }>;
  addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params: Partial<OpportunityParticipant>
  ): Promise<{ data: OpportunityParticipant }>;
  removeOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier
  ): Promise<{ data: { id: string } }>;

  // Opportunity-Contact junction methods
  getOpportunityContacts(opportunityId: Identifier): Promise<{ data: OpportunityContact[] }>;
  addOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
    params: JunctionParams
  ): Promise<{ data: OpportunityContact }>;
  removeOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier
  ): Promise<{ data: { id: string } }>;

  // Legacy "ViaJunction" methods
  getOpportunityContactsViaJunction(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityContact[] }>;
  addOpportunityContactViaJunction(
    opportunityId: Identifier,
    contactId: Identifier,
    metadata?: { role?: string; notes?: string }
  ): Promise<{ data: OpportunityContact }>;
  removeOpportunityContactViaJunction(junctionId: Identifier): Promise<{ data: { id: string } }>;
}

/**
 * Create Junctions Extension
 *
 * Returns junction-related custom methods that delegate to JunctionsService.
 *
 * @param services - Pre-initialized service container
 * @returns Junctions extension methods
 */
export function createJunctionsExtension(services: ServiceContainer): JunctionsExtension {
  return {
    // ========================================================================
    // CONTACT-ORGANIZATION JUNCTION METHODS (4 methods)
    // ========================================================================

    /**
     * Get all organizations linked to a contact
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @returns Wrapped array of contact-organization junction records
     */
    getContactOrganizations: async (
      contactId: Identifier
    ): Promise<{ data: ContactOrganization[] }> => {
      return services.junctions.getContactOrganizations(contactId);
    },

    /**
     * Link contact to organization
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID
     * @param params - Junction metadata (is_primary, role, notes)
     * @returns Wrapped contact-organization junction record
     */
    addContactToOrganization: async (
      contactId: Identifier,
      organizationId: Identifier,
      params: JunctionParams
    ): Promise<{ data: ContactOrganization }> => {
      return services.junctions.addContactToOrganization(contactId, organizationId, params);
    },

    /**
     * Unlink contact from organization
     * Delegates to JunctionsService
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID
     * @returns Wrapped success response with junction ID
     */
    removeContactFromOrganization: async (
      contactId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeContactFromOrganization(contactId, organizationId);
    },

    /**
     * Set primary organization for contact via RPC
     * Delegates to JunctionsService which calls set_primary_organization RPC
     *
     * @param contactId - Contact record ID
     * @param organizationId - Organization record ID to set as primary
     * @returns Wrapped success response
     */
    setPrimaryOrganization: async (
      contactId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { success: boolean } }> => {
      return services.junctions.setPrimaryOrganization(contactId, organizationId);
    },

    // ========================================================================
    // OPPORTUNITY PARTICIPANT JUNCTION METHODS (3 methods)
    // ========================================================================

    /**
     * Get all participant organizations for an opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-participant junction records
     */
    getOpportunityParticipants: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityParticipant[] }> => {
      return services.junctions.getOpportunityParticipants(opportunityId);
    },

    /**
     * Add participant organization to opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param organizationId - Organization record ID
     * @param params - Partial opportunity participant data
     * @returns Wrapped opportunity-participant junction record
     */
    addOpportunityParticipant: async (
      opportunityId: Identifier,
      organizationId: Identifier,
      params: Partial<OpportunityParticipant>
    ): Promise<{ data: OpportunityParticipant }> => {
      return services.junctions.addOpportunityParticipant(opportunityId, organizationId, params);
    },

    /**
     * Remove participant organization from opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param organizationId - Organization record ID
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityParticipant: async (
      opportunityId: Identifier,
      organizationId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeOpportunityParticipant(opportunityId, organizationId);
    },

    // ========================================================================
    // OPPORTUNITY CONTACT JUNCTION METHODS (6 methods)
    // ========================================================================

    /**
     * Get all contacts linked to an opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-contact junction records
     */
    getOpportunityContacts: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityContact[] }> => {
      return services.junctions.getOpportunityContacts(opportunityId);
    },

    /**
     * Link contact to opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @param params - Junction metadata (is_primary, role, notes)
     * @returns Wrapped opportunity-contact junction record
     */
    addOpportunityContact: async (
      opportunityId: Identifier,
      contactId: Identifier,
      params: JunctionParams
    ): Promise<{ data: OpportunityContact }> => {
      return services.junctions.addOpportunityContact(opportunityId, contactId, params);
    },

    /**
     * Unlink contact from opportunity
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityContact: async (
      opportunityId: Identifier,
      contactId: Identifier
    ): Promise<{ data: { id: string } }> => {
      return services.junctions.removeOpportunityContact(opportunityId, contactId);
    },

    /**
     * Alternative getter for opportunity contacts via junction table
     * Legacy compatibility method (identical to getOpportunityContacts)
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @returns Wrapped array of opportunity-contact junction records
     */
    getOpportunityContactsViaJunction: async (
      opportunityId: Identifier
    ): Promise<{ data: OpportunityContact[] }> => {
      return services.junctions.getOpportunityContactsViaJunction(opportunityId);
    },

    /**
     * Alternative adder for opportunity contacts with metadata
     * Legacy compatibility method with explicit metadata parameter
     * Delegates to JunctionsService
     *
     * @param opportunityId - Opportunity record ID
     * @param contactId - Contact record ID
     * @param metadata - Optional junction metadata
     * @returns Wrapped opportunity-contact junction record
     */
    addOpportunityContactViaJunction: async (
      opportunityId: Identifier,
      contactId: Identifier,
      metadata?: { role?: string; notes?: string }
    ): Promise<{ data: OpportunityContact }> => {
      return services.junctions.addOpportunityContactViaJunction(
        opportunityId,
        contactId,
        metadata
      );
    },

    /**
     * Remove opportunity contact by junction ID
     * Delegates to JunctionsService
     *
     * @param junctionId - Junction record ID to delete
     * @returns Wrapped success response with junction ID
     */
    removeOpportunityContactViaJunction: async (
      junctionId: Identifier
    ): Promise<{ data: { id: string } }> => {
      const result = await services.junctions.removeOpportunityContactViaJunctionId(junctionId);
      return { data: { id: String(result.data.id) } };
    },
  };
}
