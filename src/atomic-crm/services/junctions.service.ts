import type { DataProvider, Identifier, RaRecord } from "ra-core";
import type { OpportunityParticipant, OpportunityContact, Contact } from "../types";
import type { Organization } from "../validation/organizations";
import { devError } from "@/lib/devLogger";

/**
 * Extended DataProvider with optional RPC capability
 */
type DataProviderWithRpc = DataProvider & {
  rpc?: <T = unknown>(functionName: string, params: Record<string, Identifier>) => Promise<T>;
};

/**
 * Opportunity participant with populated organization data
 */
interface OpportunityParticipantWithDetails extends OpportunityParticipant {
  organization?: Organization;
}

/**
 * Opportunity contact junction record with populated contact data
 */
interface OpportunityContactWithDetails extends OpportunityContact {
  contact?: Contact;
}

/**
 * Parameters for adding a contact to an opportunity
 */
interface AddOpportunityContactParams {
  role?: string;
  is_primary?: boolean;
  created_at?: string;
}

/**
 * Generic error with message property
 */
interface ErrorWithMessage {
  message: string;
}

/**
 * Type guard to check if error has message property
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithMessage).message === "string"
  );
}

/**
 * Extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Junction service handles many-to-many relationship operations
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 *
 * Manages:
 * - opportunity_participants (Organizations linked to opportunities)
 * - opportunity_contacts (Contacts linked to opportunities)
 *
 * Note: contact_organizations junction was deprecated and removed.
 * Contacts now use a direct organization_id FK (single org per contact).
 *
 * Updated to use dataProvider exclusively - no direct Supabase access
 * per Engineering Constitution principle #2: Single Source of Truth
 */
export class JunctionsService {
  constructor(private dataProvider: DataProviderWithRpc) {}

  // Opportunity Participants

  /**
   * Get all participating organizations for an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity participants with populated organization data
   */
  async getOpportunityParticipants(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityParticipantWithDetails[] }> {
    try {
      const response = await this.dataProvider.getList<OpportunityParticipant>(
        "opportunity_participants",
        {
          filter: { opportunity_id: opportunityId },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "is_primary", order: "DESC" },
        }
      );

      // Optimize: Use getMany instead of N+1 queries
      const orgIds = response.data
        .map((p) => p.organization_id)
        .filter((id): id is Identifier => id != null);

      let orgMap = new Map<Identifier, Organization>();
      if (orgIds.length > 0) {
        try {
          const { data: orgs } = await this.dataProvider.getMany<Organization & RaRecord>(
            "organizations",
            { ids: orgIds }
          );
          orgMap = new Map(orgs.map((o) => [o.id, o]));
        } catch (error: unknown) {
          devError("JunctionsService", "Failed to fetch participant organizations in batch", {
            orgIds,
            error,
          });
          throw new Error(`Failed to fetch participant organizations: ${getErrorMessage(error)}`);
        }
      }

      const participantsWithDetails: OpportunityParticipantWithDetails[] = response.data.map(
        (participant) => {
          const org = orgMap.get(participant.organization_id);
          return org ? { ...participant, organization: org } : participant;
        }
      );

      return { data: participantsWithDetails };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to get opportunity participants", {
        opportunityId,
        error,
      });
      throw new Error(`Get opportunity participants failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Add organization as participant to opportunity
   * @param opportunityId Opportunity identifier
   * @param organizationId Organization identifier
   * @param params Optional participant parameters (role, notes, etc.)
   * @returns Object with created participant data
   */
  async addOpportunityParticipant(
    opportunityId: Identifier,
    organizationId: Identifier,
    params: Partial<OpportunityParticipant> = {}
  ): Promise<{ data: OpportunityParticipant }> {
    try {
      const response = await this.dataProvider.create<OpportunityParticipant>(
        "opportunity_participants",
        {
          data: {
            opportunity_id: opportunityId,
            organization_id: organizationId,
            role: params.role || "customer",
            is_primary: params.is_primary || false,
            notes: params.notes,
            created_at: new Date().toISOString(),
            ...params,
          },
        }
      );

      return { data: response.data };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to add opportunity participant", {
        opportunityId,
        organizationId,
        params,
        error,
      });
      throw new Error(`Add opportunity participant failed: ${getErrorMessage(error)}`);
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
    organizationId: Identifier
  ): Promise<{ data: { id: string } }> {
    try {
      // Find the record first, then delete it
      const response = await this.dataProvider.getList<OpportunityParticipant>(
        "opportunity_participants",
        {
          filter: {
            opportunity_id: opportunityId,
            organization_id: organizationId,
          },
          pagination: { page: 1, perPage: 1 },
          sort: { field: "id", order: "ASC" },
        }
      );

      if (response.data.length > 0) {
        await this.dataProvider.delete("opportunity_participants", {
          id: response.data[0].id,
        });
      }

      return { data: { id: `${opportunityId}-${organizationId}` } };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to remove opportunity participant", {
        opportunityId,
        organizationId,
        error,
      });
      throw new Error(`Remove opportunity participant failed: ${getErrorMessage(error)}`);
    }
  }

  // Opportunity Contacts

  /**
   * Get all contacts associated with an opportunity
   * @param opportunityId Opportunity identifier
   * @returns Object with data array of opportunity contacts with populated contact data
   */
  async getOpportunityContacts(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityContactWithDetails[] }> {
    try {
      const response = await this.dataProvider.getList<OpportunityContact>("opportunity_contacts", {
        filter: { opportunity_id: opportunityId },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "is_primary", order: "DESC" },
      });

      // Optimize: Use getMany instead of N+1 queries
      const contactIds = response.data
        .map((oc) => oc.contact_id)
        .filter((id): id is Identifier => id != null);

      let contactMap = new Map<Identifier, Contact>();
      if (contactIds.length > 0) {
        try {
          const { data: contacts } = await this.dataProvider.getMany<Contact & RaRecord>(
            "contacts",
            {
              ids: contactIds,
            }
          );
          contactMap = new Map(contacts.map((c) => [c.id, c]));
        } catch (error: unknown) {
          devError("JunctionsService", "Failed to fetch contacts in batch", {
            contactIds,
            error,
          });
          throw new Error(`Failed to fetch contacts: ${getErrorMessage(error)}`);
        }
      }

      const contactsWithDetails: OpportunityContactWithDetails[] = response.data.map(
        (oppContact) => {
          const contact = contactMap.get(oppContact.contact_id);
          return contact ? { ...oppContact, contact } : oppContact;
        }
      );

      return { data: contactsWithDetails };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to get opportunity contacts", {
        opportunityId,
        error,
      });
      throw new Error(`Get opportunity contacts failed: ${getErrorMessage(error)}`);
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
    params: AddOpportunityContactParams = {}
  ): Promise<{ data: OpportunityContact }> {
    try {
      const response = await this.dataProvider.create<OpportunityContact>("opportunity_contacts", {
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
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to add opportunity contact", {
        opportunityId,
        contactId,
        params,
        error,
      });
      throw new Error(`Add opportunity contact failed: ${getErrorMessage(error)}`);
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
    contactId: Identifier
  ): Promise<{ data: { id: string } }> {
    try {
      // Find the record first, then delete it
      const response = await this.dataProvider.getList<OpportunityContact>("opportunity_contacts", {
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
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to remove opportunity contact", {
        opportunityId,
        contactId,
        error,
      });
      throw new Error(`Remove opportunity contact failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get contacts associated with an opportunity via junction table with complete details
   * Explicit variant of getOpportunityContacts using batch loading pattern
   * @param opportunityId The opportunity ID
   * @returns Promise with array of OpportunityContact records with contact details
   */
  async getOpportunityContactsViaJunction(
    opportunityId: Identifier
  ): Promise<{ data: OpportunityContactWithDetails[] }> {
    try {
      // 1. Get junction records
      const junctionResult = await this.dataProvider.getList<OpportunityContact>(
        "opportunity_contacts",
        {
          filter: { opportunity_id: opportunityId },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "created_at", order: "ASC" },
        }
      );

      if (!junctionResult.data || junctionResult.data.length === 0) {
        return { data: [] };
      }

      // 2. Get unique contact IDs
      const contactIds = junctionResult.data
        .map((jc) => jc.contact_id)
        .filter((id): id is Identifier => id != null);

      let contactMap = new Map<Identifier, Contact>();
      if (contactIds.length > 0) {
        try {
          // 3. Batch fetch contacts
          const contactsResult = await this.dataProvider.getMany<Contact & RaRecord>("contacts", {
            ids: contactIds,
          });

          // 4. Create map for efficient lookup
          contactMap = new Map(contactsResult.data.map((contact) => [contact.id, contact]));
        } catch (error: unknown) {
          devError("JunctionsService", "Failed to fetch contacts in batch", {
            contactIds,
            error,
          });
          throw new Error(`Failed to fetch contacts: ${getErrorMessage(error)}`);
        }
      }

      // 5. Map contacts into junction records
      const result: OpportunityContactWithDetails[] = junctionResult.data.map((junction) => ({
        ...junction,
        contact: contactMap.get(junction.contact_id),
      }));

      return { data: result };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to get opportunity contacts via junction", {
        opportunityId,
        error,
      });
      throw new Error(`Get opportunity contacts via junction failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Add a contact to an opportunity via junction table with metadata support
   * Explicit variant of addOpportunityContact with optional metadata fields
   * @param opportunityId The opportunity ID
   * @param contactId The contact ID to add
   * @param metadata Optional metadata (role, is_primary, notes)
   * @returns Promise with created junction record
   */
  async addOpportunityContactViaJunction(
    opportunityId: Identifier,
    contactId: Identifier,
    metadata?: Partial<Pick<OpportunityContact, "role" | "is_primary" | "notes">>
  ): Promise<{ data: OpportunityContact }> {
    try {
      return await this.dataProvider.create<OpportunityContact>("opportunity_contacts", {
        data: {
          opportunity_id: opportunityId,
          contact_id: contactId,
          role: metadata?.role,
          is_primary: metadata?.is_primary ?? false,
          notes: metadata?.notes,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to add opportunity contact via junction", {
        opportunityId,
        contactId,
        metadata,
        error,
      });
      throw new Error(`Add opportunity contact via junction failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Remove a contact from an opportunity using the junction record ID
   * Direct delete variant using junction table primary key
   * @param junctionId The opportunity_contacts junction record ID
   * @returns Promise with deleted record
   */
  async removeOpportunityContactViaJunctionId(
    junctionId: Identifier
  ): Promise<{ data: { id: Identifier } }> {
    try {
      await this.dataProvider.delete("opportunity_contacts", {
        id: junctionId,
      });

      return { data: { id: junctionId } };
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to remove opportunity contact via junction ID", {
        junctionId,
        error,
      });
      throw new Error(
        `Remove opportunity contact via junction ID failed: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Update opportunity contact metadata (role, is_primary, notes)
   * Allows updating junction record fields without recreating the relationship
   * @param junctionId The opportunity_contacts junction record ID
   * @param updates Partial updates (role, is_primary, notes)
   * @returns Promise with updated junction record
   */
  async updateOpportunityContactMetadata(
    junctionId: Identifier,
    updates: Partial<Pick<OpportunityContact, "role" | "is_primary" | "notes">>
  ): Promise<{ data: OpportunityContact }> {
    try {
      // Get current record first for previousData
      const currentRecord = await this.dataProvider.getOne<OpportunityContact>(
        "opportunity_contacts",
        {
          id: junctionId,
        }
      );

      return await this.dataProvider.update<OpportunityContact>("opportunity_contacts", {
        id: junctionId,
        data: updates,
        previousData: currentRecord.data,
      });
    } catch (error: unknown) {
      devError("JunctionsService", "Failed to update opportunity contact metadata", {
        junctionId,
        updates,
        error,
      });
      throw new Error(`Update opportunity contact metadata failed: ${getErrorMessage(error)}`);
    }
  }
}
