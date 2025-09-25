import { supabaseDataProvider } from "ra-supabase-core";

import type {
  CreateParams,
  DataProvider,
  GetListParams,
  Identifier,
  RaRecord,
  ResourceCallbacks,
  UpdateParams,
} from "ra-core";
import { withLifecycleCallbacks } from "ra-core";
import type {
  Contact,
  ContactNote,
  ContactOrganization,
  Opportunity,
  OpportunityNote,
  OpportunityParticipant,
  RAFile,
  Sale,
  SalesFormData,
  Tag,
} from "../../types";
import {
  validateTagColor,
  migrateHexToSemantic,
  isLegacyHexColor,
} from "../../tags/tag-colors";
import { getActivityLog } from "../commons/activity";
import { getCompanyAvatar } from "../commons/getCompanyAvatar";
import { getContactAvatar } from "../commons/getContactAvatar";
import { supabase } from "./supabase";
import { getResourceName, getSearchableFields, RESOURCE_LIFECYCLE_CONFIG } from "./resources";

if (import.meta.env.VITE_SUPABASE_URL === undefined) {
  throw new Error("Please set the VITE_SUPABASE_URL environment variable");
}
if (import.meta.env.VITE_SUPABASE_ANON_KEY === undefined) {
  throw new Error("Please set the VITE_SUPABASE_ANON_KEY environment variable");
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
  sortOrder: "asc,desc.nullslast" as any,
});

const processCompanyLogo = async (params: any) => {
  let logo = params.data.logo;

  if (typeof logo !== "object" || logo === null || !logo.src) {
    logo = await getCompanyAvatar(params.data);
  } else if (logo.rawFile instanceof File) {
    await uploadToBucket(logo);
  }

  return {
    ...params,
    data: {
      ...params.data,
      logo,
    },
  };
};

async function processContactAvatar(
  params: UpdateParams<Contact>,
): Promise<UpdateParams<Contact>>;

async function processContactAvatar(
  params: CreateParams<Contact>,
): Promise<CreateParams<Contact>>;

async function processContactAvatar(
  params: CreateParams<Contact> | UpdateParams<Contact>,
): Promise<CreateParams<Contact> | UpdateParams<Contact>> {
  const { data } = params;
  if (data.avatar?.src || !data.email_jsonb || !data.email_jsonb.length) {
    return params;
  }
  const avatarUrl = await getContactAvatar(data);

  // Clone the data and modify the clone
  const newData = { ...data, avatar: { src: avatarUrl || undefined } };

  return { ...params, data: newData };
}

const dataProviderWithCustomMethods = {
  ...baseDataProvider,
  async getList<RecordType extends RaRecord = any>(resource: string, params: GetListParams): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);

    // Use summary views for optimized queries
    if (resource === "opportunities") {
      return baseDataProvider.getList("opportunities_summary", params);
    }

    if (resource === "companies") {
      return baseDataProvider.getList("companies_summary", params);
    }

    if (resource === "contacts") {
      return baseDataProvider.getList("contacts_summary", params);
    }

    return baseDataProvider.getList(actualResource, params);
  },
  async getOne<RecordType extends RaRecord = any>(resource: string, params: any): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);

    // Use summary views for optimized queries
    if (resource === "opportunities") {
      return baseDataProvider.getOne("opportunities_summary", params);
    }

    if (resource === "companies") {
      return baseDataProvider.getOne("companies_summary", params);
    }

    if (resource === "contacts") {
      return baseDataProvider.getOne("contacts_summary", params);
    }

    return baseDataProvider.getOne(actualResource, params);
  },
  async create<RecordType extends Omit<RaRecord, "id"> = any>(
    resource: string,
    params: CreateParams<RecordType>
  ): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);
    return baseDataProvider.create(actualResource, params);
  },
  async update<RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams<RecordType>
  ): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);
    return baseDataProvider.update(actualResource, params);
  },
  async delete(resource: string, params: any): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);
    return baseDataProvider.delete(actualResource, params);
  },
  async deleteMany(resource: string, params: any): Promise<any> {
    // Map resource names through the resource mapping
    const actualResource = getResourceName(resource);
    return baseDataProvider.deleteMany(actualResource, params);
  },
  async salesCreate(body: SalesFormData) {
    const { data, error } = await supabase.functions.invoke<Sale>("users", {
      method: "POST",
      body,
    });

    if (!data || error) {
      console.error("salesCreate.error", error);
      throw new Error("Failed to create account manager");
    }

    return data;
  },
  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>,
  ) {
    const { email, first_name, last_name, administrator, avatar, disabled } =
      data;

    const { data: sale, error } = await supabase.functions.invoke<Sale>(
      "users",
      {
        method: "PATCH",
        body: {
          sales_id: id,
          email,
          first_name,
          last_name,
          administrator,
          disabled,
          avatar,
        },
      },
    );

    if (!sale || error) {
      console.error("salesCreate.error", error);
      throw new Error("Failed to update account manager");
    }

    return data;
  },
  async updatePassword(id: Identifier) {
    const { data: passwordUpdated, error } =
      await supabase.functions.invoke<boolean>("updatePassword", {
        method: "PATCH",
        body: {
          sales_id: id,
        },
      });

    if (!passwordUpdated || error) {
      console.error("passwordUpdate.error", error);
      throw new Error("Failed to update password");
    }

    return passwordUpdated;
  },
  async unarchiveOpportunity(opportunity: Opportunity) {
    // get all opportunities where stage is the same as the opportunity to unarchive
    const { data: opportunities } = await baseDataProvider.getList<Opportunity>("opportunities", {
      filter: { stage: opportunity.stage },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "index", order: "ASC" },
    });

    // set index for each opportunity starting from 1, if the opportunity to unarchive is found, set its index to the last one
    const updatedOpportunities = opportunities.map((o, index) => ({
      ...o,
      index: o.id === opportunity.id ? 0 : index + 1,
      deleted_at: o.id === opportunity.id ? null : o.deleted_at,
    }));

    return await Promise.all(
      updatedOpportunities.map((updatedOpportunity) =>
        baseDataProvider.update("opportunities", {
          id: updatedOpportunity.id,
          data: updatedOpportunity,
          previousData: opportunities.find((o) => o.id === updatedOpportunity.id),
        }),
      ),
    );
  },
  async getActivityLog(companyId?: Identifier) {
    return getActivityLog(baseDataProvider, companyId);
  },
  // Junction table support for contact-organization relationships
  async getContactOrganizations(contactId: Identifier) {
    const { data } = await supabase
      .from('contact_organizations')
      .select(`
        *,
        organization:companies(*)
      `)
      .eq('contact_id', contactId);

    return { data: data || [] };
  },
  async addContactToOrganization(contactId: Identifier, organizationId: Identifier, params: Partial<ContactOrganization> = {}) {
    const { data, error } = await supabase
      .from('contact_organizations')
      .insert({
        contact_id: contactId,
        organization_id: organizationId,
        is_primary_contact: params.is_primary_contact || false,
        purchase_influence: params.purchase_influence || 'Unknown',
        decision_authority: params.decision_authority || 'End User',
        role: params.role,
        created_at: new Date().toISOString(),
        ...params
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add contact to organization: ${error.message}`);
    }

    return { data };
  },
  async removeContactFromOrganization(contactId: Identifier, organizationId: Identifier) {
    const { error } = await supabase
      .from('contact_organizations')
      .delete()
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to remove contact from organization: ${error.message}`);
    }

    return { data: { id: `${contactId}-${organizationId}` } };
  },
  // Opportunity participants support
  async getOpportunityParticipants(opportunityId: Identifier) {
    const { data } = await supabase
      .from('opportunity_participants')
      .select(`
        *,
        organization:companies(*)
      `)
      .eq('opportunity_id', opportunityId);

    return { data: data || [] };
  },
  async addOpportunityParticipant(opportunityId: Identifier, organizationId: Identifier, params: Partial<OpportunityParticipant> = {}) {
    const { data, error } = await supabase
      .from('opportunity_participants')
      .insert({
        opportunity_id: opportunityId,
        organization_id: organizationId,
        role: params.role || 'customer',
        is_primary: params.is_primary || false,
        commission_rate: params.commission_rate,
        territory: params.territory,
        notes: params.notes,
        created_at: new Date().toISOString(),
        ...params
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add opportunity participant: ${error.message}`);
    }

    return { data };
  },
  async removeOpportunityParticipant(opportunityId: Identifier, organizationId: Identifier) {
    const { error } = await supabase
      .from('opportunity_participants')
      .delete()
      .eq('opportunity_id', opportunityId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to remove opportunity participant: ${error.message}`);
    }

    return { data: { id: `${opportunityId}-${organizationId}` } };
  },
  // Opportunity contacts support (many-to-many)
  async getOpportunityContacts(opportunityId: Identifier) {
    const { data } = await supabase
      .from('opportunity_contacts')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('opportunity_id', opportunityId);

    return { data: data || [] };
  },
  async addOpportunityContact(opportunityId: Identifier, contactId: Identifier, params: any = {}) {
    const { data, error } = await supabase
      .from('opportunity_contacts')
      .insert({
        opportunity_id: opportunityId,
        contact_id: contactId,
        role: params.role,
        is_primary: params.is_primary || false,
        created_at: new Date().toISOString(),
        ...params
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add opportunity contact: ${error.message}`);
    }

    return { data };
  },
  async removeOpportunityContact(opportunityId: Identifier, contactId: Identifier) {
    const { error } = await supabase
      .from('opportunity_contacts')
      .delete()
      .eq('opportunity_id', opportunityId)
      .eq('contact_id', contactId);

    if (error) {
      throw new Error(`Failed to remove opportunity contact: ${error.message}`);
    }

    return { data: { id: `${opportunityId}-${contactId}` } };
  },
} as any;

export type CrmDataProvider = typeof dataProviderWithCustomMethods;

export const dataProvider = withLifecycleCallbacks(
    dataProviderWithCustomMethods,
  [
    {
      resource: "contactNotes",
      beforeSave: async (data: ContactNote, _, __) => {
        if (data.attachments) {
          for (const fi of data.attachments) {
            await uploadToBucket(fi);
          }
        }
        return data;
      },
    },
    {
      resource: "opportunityNotes",
      beforeSave: async (data: OpportunityNote, _, __) => {
        if (data.attachments) {
          for (const fi of data.attachments) {
            await uploadToBucket(fi);
          }
        }
        return data;
      },
    },
    {
      resource: "sales",
      beforeSave: async (data: Sale, _, __) => {
        if (data.avatar) {
          await uploadToBucket(data.avatar);
        }
        return data;
      },
    },
    {
      resource: "contacts",
      beforeCreate: async (params) => {
        return processContactAvatar(params);
      },
      beforeUpdate: async (params) => {
        return processContactAvatar(params);
      },
      beforeGetList: async (params) => {
        return applyFullTextSearch([
          "first_name",
          "last_name",
          "company_name",
          "title",
          "email",
          "phone",
          "background",
        ])(params);
      },
    },
    {
      resource: "companies",
      beforeGetList: async (params) => {
        return applyFullTextSearch([
          "name",
          "phone_number",
          "website",
          "zipcode",
          "city",
          "stateAbbr",
          "description",
          "segment",
        ])(params);
      },
      beforeCreate: async (params) => {
        const createParams = await processCompanyLogo(params);

        return {
          ...createParams,
          data: {
            ...createParams.data,
            created_at: new Date().toISOString(),
          },
        };
      },
      beforeUpdate: async (params) => {
        return await processCompanyLogo(params);
      },
    },
    {
      resource: "companies_summary",
      beforeGetList: async (params) => {
        return applyFullTextSearch([
          "name",
          "phone_number",
          "website",
          "zipcode",
          "city",
          "stateAbbr",
          "description",
          "segment",
        ])(params);
      },
    },
    {
      resource: "contacts_summary",
      beforeGetList: async (params) => {
        return applyFullTextSearch(["first_name", "last_name"])(params);
      },
    },
    {
      resource: "opportunities",
      beforeGetList: async (params) => {
        return applyFullTextSearch(["name", "category", "description", "next_action"])(params);
      },
    },
    {
      resource: "opportunities_summary",
      beforeGetList: async (params) => {
        return applyFullTextSearch(["name", "category", "description"])(params);
      },
    },
    {
      resource: "tags",
      beforeCreate: async (params) => {
        const { data } = params;

        // Validate the color
        const validationError = validateTagColor(data.color);
        if (validationError) {
          // If it's a legacy hex color, migrate it
          if (isLegacyHexColor(data.color)) {
            return {
              ...params,
              data: {
                ...data,
                color: migrateHexToSemantic(data.color),
              },
            };
          }
          // Otherwise, throw an error
          throw new Error(validationError);
        }

        return params;
      },
      beforeUpdate: async (params) => {
        const { data } = params;

        // Validate the color
        const validationError = validateTagColor(data.color);
        if (validationError) {
          // If it's a legacy hex color, migrate it
          if (isLegacyHexColor(data.color)) {
            return {
              ...params,
              data: {
                ...data,
                color: migrateHexToSemantic(data.color),
              },
            };
          }
          // Otherwise, throw an error
          throw new Error(validationError);
        }

        return params;
      },
    } satisfies ResourceCallbacks<Tag>,
  ],
);

const applyFullTextSearch = (columns: string[]) => (params: GetListParams) => {
  if (!params.filter?.q) {
    return params;
  }
  const { q, ...filter } = params.filter;

  // Apply soft delete filter automatically for supported resources
  const softDeleteFilter = params.filter?.includeDeleted ? {} : { deleted_at: null };

  return {
    ...params,
    filter: {
      ...filter,
      ...softDeleteFilter,
      "@or": columns.reduce((acc, column) => {
        if (column === "email")
          return {
            ...acc,
            [`email_fts@ilike`]: q,
          };
        if (column === "phone")
          return {
            ...acc,
            [`phone_fts@ilike`]: q,
          };
        else
          return {
            ...acc,
            [`${column}@ilike`]: q,
          };
      }, {}),
    },
  };
};

const uploadToBucket = async (fi: RAFile) => {
  if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
    // Sign URL check if path exists in the bucket
    if (fi.path) {
      const { error } = await supabase.storage
        .from("attachments")
        .createSignedUrl(fi.path, 60);

      if (!error) {
        return;
      }
    }
  }

  const dataContent = fi.src
    ? await fetch(fi.src).then((res) => res.blob())
    : fi.rawFile;

  const file = fi.rawFile;
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, dataContent);

  if (uploadError) {
    console.error("uploadError", uploadError);
    throw new Error("Failed to upload attachment");
  }

  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);

  fi.path = filePath;
  fi.src = data.publicUrl;

  // save MIME type
  const mimeType = file.type;
  fi.type = mimeType;

  return fi;
};
