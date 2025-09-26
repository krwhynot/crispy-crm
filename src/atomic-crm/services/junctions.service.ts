import type { DataProvider, Identifier } from "ra-core";
import type { ContactOrganization, OpportunityParticipant } from "../types";
import { supabase } from "../providers/supabase/supabase";

/**
 * Junction service handles many-to-many relationship operations
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class JunctionsService {
  constructor(private dataProvider: DataProvider) {}

  // Contact-Organization Relationships

  /**
   * Get all organizations associated with a contact
   * @param contactId Contact identifier
   * @returns Object with data array of contact organizations with populated organization data
   */
  async getContactOrganizations(contactId: Identifier): Promise<{ data: any[] }> {
    const { data } = await supabase
      .from("contact_organizations")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("contact_id", contactId);

    return { data: data || [] };
  }

  /**
   * Add contact to organization with relationship metadata
   * @param contactId Contact identifier
   * @param organizationId Organization identifier
   * @param params Optional relationship parameters (role, influence, etc.)
   * @returns Object with created relationship data
   */
  async addContactToOrganization(
    contactId: Identifier,
    organizationId: Identifier,
    params: any = {},
  ): Promise<{ data: any }> {
    const { data, error } = await supabase
      .from("contact_organizations")
      .insert({
        contact_id: contactId,
        organization_id: organizationId,
        is_primary: params.is_primary || false,
        purchase_influence: params.purchase_influence || "Unknown",
        decision_authority: params.decision_authority || "End User",
        role: params.role,
        created_at: new Date().toISOString(),
        ...params,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to add contact to organization: ${error.message}`,
      );
    }

    return { data };
  }

  /**
   * Remove contact from organization relationship
   * @param contactId Contact identifier
   * @param organizationId Organization identifier
   * @returns Object with composite ID
   */
  async removeContactFromOrganization(
    contactId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { id: string } }> {
    const { error } = await supabase
      .from("contact_organizations")
      .delete()
      .eq("contact_id", contactId)
      .eq("organization_id", organizationId);

    if (error) {
      throw new Error(
        `Failed to remove contact from organization: ${error.message}`,
      );
    }

    return { data: { id: `${contactId}-${organizationId}` } };
  }

  /**
   * Set primary organization for a contact using atomic RPC function
   * @param contactId Contact identifier
   * @param organizationId Organization identifier to set as primary
   * @returns Success confirmation
   */
  async setPrimaryOrganization(
    contactId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { success: boolean } }> {
    const { error } = await supabase.rpc("set_primary_organization", {
      p_contact_id: contactId,
      p_organization_id: organizationId,
    });

    if (error) {
      throw new Error(
        `Failed to set primary organization: ${error.message}`,
      );
    }

    return { data: { success: true } };
  }

  // Opportunity Participants

  /**
   * Get all participating organizations for an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity participants with populated organization data
   */
  async getOpportunityParticipants(opportunityId: Identifier): Promise<{ data: any[] }> {
    const { data } = await supabase
      .from("opportunity_participants")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("opportunity_id", opportunityId);

    return { data: data || [] };
  }

  /**
   * Add organization as participant to opportunity
   * @param opportunityId Opportunity identifier
   * @param organizationId Organization identifier
   * @param params Optional participant parameters (role, commission rate, etc.)
   * @returns Object with created participant data
   */
  async addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params: Partial<OpportunityParticipant> = {},
  ): Promise<{ data: any }> {
    const { data, error } = await supabase
      .from("opportunity_participants")
      .insert({
        opportunity_id: opportunityId,
        organization_id: organizationId,
        role: params.role || "customer",
        is_primary: params.is_primary || false,
        commission_rate: params.commission_rate,
        territory: params.territory,
        notes: params.notes,
        created_at: new Date().toISOString(),
        ...params,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to add opportunity participant: ${error.message}`,
      );
    }

    return { data };
  }

  /**
   * Remove organization from opportunity participation
   * @param opportunityId Opportunity identifier
   * @param organizationId Organization identifier
   * @returns Object with composite ID
   */
  async removeOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
  ): Promise<{ data: { id: string } }> {
    const { error } = await supabase
      .from("opportunity_participants")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("organization_id", organizationId);

    if (error) {
      throw new Error(
        `Failed to remove opportunity participant: ${error.message}`,
      );
    }

    return { data: { id: `${opportunityId}-${organizationId}` } };
  }

  // Opportunity Contacts

  /**
   * Get all contacts associated with an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity contacts with populated contact data
   */
  async getOpportunityContacts(opportunityId: Identifier): Promise<{ data: any[] }> {
    const { data } = await supabase
      .from("opportunity_contacts")
      .select(
        `
        *,
        contact:contacts(*)
      `,
      )
      .eq("opportunity_id", opportunityId);

    return { data: data || [] };
  }

  /**
   * Add contact to opportunity
   * @param opportunityId Opportunity identifier
   * @param contactId Contact identifier
   * @param params Optional contact parameters (role, primary status, etc.)
   * @returns Object with created contact association data
   */
  async addOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
    params: any = {},
  ): Promise<{ data: any }> {
    const { data, error } = await supabase
      .from("opportunity_contacts")
      .insert({
        opportunity_id: opportunityId,
        contact_id: contactId,
        role: params.role,
        is_primary: params.is_primary || false,
        created_at: new Date().toISOString(),
        ...params,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add opportunity contact: ${error.message}`);
    }

    return { data };
  }

  /**
   * Remove contact from opportunity
   * @param opportunityId Opportunity identifier
   * @param contactId Contact identifier
   * @returns Object with composite ID
   */
  async removeOpportunityContact(
    opportunityId: Identifier,
    contactId: Identifier,
  ): Promise<{ data: { id: string } }> {
    const { error } = await supabase
      .from("opportunity_contacts")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("contact_id", contactId);

    if (error) {
      throw new Error(`Failed to remove opportunity contact: ${error.message}`);
    }

    return { data: { id: `${opportunityId}-${contactId}` } };
  }
}