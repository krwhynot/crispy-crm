import type { DataProvider, Identifier } from "ra-core";
import type { ContactOrganization, OpportunityParticipant } from "../types";

/**
 * Junction service handles many-to-many relationship operations
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 *
 * Updated to use dataProvider exclusively - no direct Supabase access
 * per Engineering Constitution principle #2: Single Source of Truth
 */
export class JunctionsService {
  constructor(private dataProvider: DataProvider & {
    rpc?: (functionName: string, params: any) => Promise<any>;
  }) {}

  // Contact-Organization Relationships

  /**
   * Get all organizations associated with a contact
   * @param contactId Contact identifier
   * @returns Object with data array of contact organizations with populated organization data
   */
  async getContactOrganizations(contactId: Identifier): Promise<{ data: any[] }> {
    try {
      // Use dataProvider.getList with proper filter
      const response = await this.dataProvider.getList("contact_organizations", {
        filter: { contact_id: contactId },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "is_primary", order: "DESC" },
      });

    // Optimize: Use getMany instead of N+1 queries
    const orgIds = response.data
      .map((co: any) => co.organization_id)
      .filter(Boolean); // Remove any null/undefined IDs

    let orgMap = new Map();
    if (orgIds.length > 0) {
      try {
        const { data: orgs } = await this.dataProvider.getMany("organizations", { ids: orgIds });
        orgMap = new Map(orgs.map((o: any) => [o.id, o]));
      } catch (error: any) {
        console.error(`[JunctionsService] Failed to fetch organizations in batch`, {
          orgIds,
          error
        });
        throw new Error(`Failed to fetch organizations: ${error.message}`);
      }
    }

    const organizationsWithDetails = response.data.map((contactOrg: any) => {
      const org = orgMap.get(contactOrg.organization_id);
      return org ? { ...contactOrg, organization: org } : contactOrg;
    });

      return { data: organizationsWithDetails };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to get contact organizations`, {
        contactId,
        error
      });
      throw new Error(`Get contact organizations failed: ${error.message}`);
    }
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
    try {
      const response = await this.dataProvider.create("contact_organizations", {
        data: {
          contact_id: contactId,
          organization_id: organizationId,
          is_primary: params.is_primary || false,
          purchase_influence: params.purchase_influence || "Unknown",
          decision_authority: params.decision_authority || "End User",
          role: params.role,
          created_at: new Date().toISOString(),
          ...params,
        },
      });

      return { data: response.data };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to add contact to organization`, {
        contactId,
        organizationId,
        params,
        error
      });
      throw new Error(`Add contact to organization failed: ${error.message}`);
    }
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
    try {
      // Need to find the record first, then delete it
      const response = await this.dataProvider.getList("contact_organizations", {
        filter: {
          contact_id: contactId,
          organization_id: organizationId,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      });

      if (response.data.length > 0) {
        await this.dataProvider.delete("contact_organizations", {
          id: response.data[0].id,
        });
      }

      return { data: { id: `${contactId}-${organizationId}` } };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to remove contact from organization`, {
        contactId,
        organizationId,
        error
      });
      throw new Error(`Remove contact from organization failed: ${error.message}`);
    }
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
    // Use the extended RPC capability from unifiedDataProvider
    if (!this.dataProvider.rpc) {
      console.error(`[JunctionsService] DataProvider missing RPC capability`, {
        operation: 'setPrimaryOrganization',
        contactId,
        organizationId
      });
      throw new Error(`Set primary organization failed: DataProvider does not support RPC operations`);
    }

    try {
      await this.dataProvider.rpc("set_primary_organization", {
        p_contact_id: contactId,
        p_organization_id: organizationId,
      });

      return { data: { success: true } };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to set primary organization`, {
        contactId,
        organizationId,
        error
      });
      throw new Error(`Set primary organization failed: ${error.message}`);
    }
  }

  // Opportunity Participants

  /**
   * Get all participating organizations for an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity participants with populated organization data
   */
  async getOpportunityParticipants(opportunityId: Identifier): Promise<{ data: any[] }> {
    try {
      const response = await this.dataProvider.getList("opportunity_participants", {
        filter: { opportunity_id: opportunityId },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "is_primary", order: "DESC" },
      });

    // Optimize: Use getMany instead of N+1 queries
    const orgIds = response.data
      .map((p: any) => p.organization_id)
      .filter(Boolean); // Remove any null/undefined IDs

    let orgMap = new Map();
    if (orgIds.length > 0) {
      try {
        const { data: orgs } = await this.dataProvider.getMany("organizations", { ids: orgIds });
        orgMap = new Map(orgs.map((o: any) => [o.id, o]));
      } catch (error: any) {
        console.error(`[JunctionsService] Failed to fetch participant organizations in batch`, {
          orgIds,
          error
        });
        throw new Error(`Failed to fetch participant organizations: ${error.message}`);
      }
    }

    const participantsWithDetails = response.data.map((participant: any) => {
      const org = orgMap.get(participant.organization_id);
      return org ? { ...participant, organization: org } : participant;
    });

      return { data: participantsWithDetails };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to get opportunity participants`, {
        opportunityId,
        error
      });
      throw new Error(`Get opportunity participants failed: ${error.message}`);
    }
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
    try {
      const response = await this.dataProvider.create("opportunity_participants", {
        data: {
          opportunity_id: opportunityId,
          organization_id: organizationId,
          role: params.role || "customer",
          is_primary: params.is_primary || false,
          commission_rate: params.commission_rate,
          territory: params.territory,
          notes: params.notes,
          created_at: new Date().toISOString(),
          ...params,
        },
      });

      return { data: response.data };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to add opportunity participant`, {
        opportunityId,
        organizationId,
        params,
        error
      });
      throw new Error(`Add opportunity participant failed: ${error.message}`);
    }
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
    try {
      // Find the record first, then delete it
      const response = await this.dataProvider.getList("opportunity_participants", {
        filter: {
          opportunity_id: opportunityId,
          organization_id: organizationId,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      });

      if (response.data.length > 0) {
        await this.dataProvider.delete("opportunity_participants", {
          id: response.data[0].id,
        });
      }

      return { data: { id: `${opportunityId}-${organizationId}` } };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to remove opportunity participant`, {
        opportunityId,
        organizationId,
        error
      });
      throw new Error(`Remove opportunity participant failed: ${error.message}`);
    }
  }

  // Opportunity Contacts

  /**
   * Get all contacts associated with an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity contacts with populated contact data
   */
  async getOpportunityContacts(opportunityId: Identifier): Promise<{ data: any[] }> {
    try {
      const response = await this.dataProvider.getList("opportunity_contacts", {
        filter: { opportunity_id: opportunityId },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "is_primary", order: "DESC" },
      });

    // Optimize: Use getMany instead of N+1 queries
    const contactIds = response.data
      .map((oc: any) => oc.contact_id)
      .filter(Boolean); // Remove any null/undefined IDs

    let contactMap = new Map();
    if (contactIds.length > 0) {
      try {
        const { data: contacts } = await this.dataProvider.getMany("contacts", { ids: contactIds });
        contactMap = new Map(contacts.map((c: any) => [c.id, c]));
      } catch (error: any) {
        console.error(`[JunctionsService] Failed to fetch contacts in batch`, {
          contactIds,
          error
        });
        throw new Error(`Failed to fetch contacts: ${error.message}`);
      }
    }

    const contactsWithDetails = response.data.map((oppContact: any) => {
      const contact = contactMap.get(oppContact.contact_id);
      return contact ? { ...oppContact, contact } : oppContact;
    });

      return { data: contactsWithDetails };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to get opportunity contacts`, {
        opportunityId,
        error
      });
      throw new Error(`Get opportunity contacts failed: ${error.message}`);
    }
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
    try {
      const response = await this.dataProvider.create("opportunity_contacts", {
        data: {
          opportunity_id: opportunityId,
          contact_id: contactId,
          role: params.role,
          is_primary: params.is_primary || false,
          created_at: new Date().toISOString(),
          ...params,
        },
      });

      return { data: response.data };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to add opportunity contact`, {
        opportunityId,
        contactId,
        params,
        error
      });
      throw new Error(`Add opportunity contact failed: ${error.message}`);
    }
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
    try {
      // Find the record first, then delete it
      const response = await this.dataProvider.getList("opportunity_contacts", {
        filter: {
          opportunity_id: opportunityId,
          contact_id: contactId,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      });

      if (response.data.length > 0) {
        await this.dataProvider.delete("opportunity_contacts", {
          id: response.data[0].id,
        });
      }

      return { data: { id: `${opportunityId}-${contactId}` } };
    } catch (error: any) {
      console.error(`[JunctionsService] Failed to remove opportunity contact`, {
        opportunityId,
        contactId,
        error
      });
      throw new Error(`Remove opportunity contact failed: ${error.message}`);
    }
  }
}