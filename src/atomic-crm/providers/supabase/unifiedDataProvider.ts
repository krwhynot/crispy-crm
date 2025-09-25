/**
 * Unified Data Provider
 *
 * Consolidates transformation logic and error logging into a single provider layer.
 * This reduces the provider chain from 4+ layers to a maximum of 2 layers while
 * preserving all existing functionality including transformations, validation,
 * error logging, and database operations.
 */

import { supabaseDataProvider } from "ra-supabase-core";
import type {
  CreateParams,
  DataProvider,
  GetListParams,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  DeleteParams,
  DeleteManyParams,
  Identifier,
  RaRecord,
} from "ra-core";

import { supabase } from "./supabase";
import {
  getResourceName,
  getSearchableFields,
  supportsSoftDelete,
} from "./resources";

// Import all transformers
import {
  transformOpportunity,
  toOpportunityDatabase,
  transformOpportunities,
} from "../../transformers/opportunities";

import {
  transformOrganization,
  toDbCompany,
  transformOrganizations,
} from "../../transformers/organizations";

import {
  transformContact,
  contactToDatabase as toDbContact,
  transformContacts,
} from "../../transformers/contacts";

import {
  transformContactNote,
  transformOpportunityNote,
  toDbContactNote,
  toDbOpportunityNote,
  transformContactNotes,
  transformOpportunityNotes,
} from "../../transformers/notes";

import {
  transformActivity,
  transformActivities,
} from "../../transformers/activities";

import {
  transformTag,
  tagToDatabase as toDbTag,
  transformTags,
} from "../../transformers/tags";

import {
  transformProduct,
  toDbProduct,
  transformProducts,
} from "../../transformers/products";

import {
  transformContactOrganization,
  toDbContactOrganization,
  transformContactOrganizations,
  transformOpportunityContact,
  toDbOpportunityContact,
  transformOpportunityContacts,
} from "../../transformers/relationships";

// Import validation functions
import { validateOpportunityForm } from "../../validation/opportunities";
import { validateOrganizationForSubmission } from "../../validation/organizations";
import { validateContactForm } from "../../validation/contacts";
import { validateCreateTag, validateUpdateTag } from "../../validation/tags";

// Type for transformer configuration
interface TransformerConfig<TDb = any, TApp = any> {
  transform: (db: TDb) => TApp;
  toDatabase: (app: any) => any;
  transformBatch: (db: TDb[]) => { items: TApp[] | any; errors: any[] };
  validate?: (data: any) => any;
}

// Transformer registry for each resource
const transformerRegistry: Record<string, TransformerConfig<any, any>> = {
  opportunities: {
    transform: transformOpportunity,
    toDatabase: toOpportunityDatabase as any,
    transformBatch: (db: any[]) => {
      const items = transformOpportunities(db);
      return { items, errors: [] };
    },
    validate: validateOpportunityForm,
  },

  organizations: {
    transform: transformOrganization,
    toDatabase: toDbCompany as any,
    transformBatch: (db: any[]) => {
      const items = transformOrganizations(db);
      return { items, errors: [] };
    },
    validate: validateOrganizationForSubmission,
  },

  contacts: {
    transform: transformContact,
    toDatabase: toDbContact as any,
    transformBatch: (db: any[]) => {
      const result = transformContacts(db);
      return { items: result.items, errors: result.errors };
    },
    validate: validateContactForm,
  },

  contactNotes: {
    transform: transformContactNote,
    toDatabase: toDbContactNote as any,
    transformBatch: (db: any[]) => {
      const result = transformContactNotes(db);
      return { items: result.items, errors: result.errors };
    },
  },

  opportunityNotes: {
    transform: transformOpportunityNote,
    toDatabase: toDbOpportunityNote as any,
    transformBatch: (db: any[]) => {
      const result = transformOpportunityNotes(db);
      return { items: result.items, errors: result.errors };
    },
  },

  tags: {
    transform: transformTag,
    toDatabase: toDbTag as any,
    transformBatch: (db: any[]) => {
      const result = transformTags(db);
      return { items: result.items, errors: result.errors };
    },
    validate: (data: any) => {
      // Use appropriate validator based on operation
      return data.id ? validateUpdateTag(data) : validateCreateTag(data);
    },
  },

  products: {
    transform: transformProduct,
    toDatabase: toDbProduct as any,
    transformBatch: (db: any[]) => {
      const result = transformProducts(db);
      return { items: result.items, errors: result.errors };
    },
  },

  contact_organization: {
    transform: transformContactOrganization,
    toDatabase: toDbContactOrganization as any,
    transformBatch: (db: any[]) => {
      const result = transformContactOrganizations(db);
      return { items: result.items, errors: result.errors };
    },
  },

  opportunity_contacts: {
    transform: transformOpportunityContact,
    toDatabase: toDbOpportunityContact as any,
    transformBatch: (db: any[]) => {
      const result = transformOpportunityContacts(db);
      return { items: result.items, errors: result.errors };
    },
  },
};

// Initialize base data provider
const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
  sortOrder: "asc,desc.nullslast" as any,
});

/**
 * Log error with context for debugging
 * Integrated from resilientDataProvider for consolidated error logging
 */
function logError(method: string, resource: string, params: any, error: unknown): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      ids: params?.ids,
      filter: params?.filter,
      sort: params?.sort,
      pagination: params?.pagination,
      target: params?.target,
      data: params?.data ? '[Data Present]' : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, error);
}

/**
 * Apply search parameters to a query
 */
function applySearchParams(resource: string, params: GetListParams): GetListParams {
  const searchableFields = getSearchableFields(resource);

  if (!params.filter?.q || searchableFields.length === 0) {
    return params;
  }

  const { q, ...filter } = params.filter;

  // Apply soft delete filter if supported
  const softDeleteFilter = supportsSoftDelete(resource) && !params.filter?.includeDeleted
    ? { deleted_at: null }
    : {};

  return {
    ...params,
    filter: {
      ...filter,
      ...softDeleteFilter,
      "@or": searchableFields.reduce((acc, field) => {
        // Special handling for FTS columns
        if (field === "email") {
          return { ...acc, [`email_fts@ilike`]: q };
        }
        if (field === "phone") {
          return { ...acc, [`phone_fts@ilike`]: q };
        }
        return { ...acc, [`${field}@ilike`]: q };
      }, {}),
    },
  };
}

/**
 * Get the appropriate database resource name
 */
function getDatabaseResource(resource: string, operation: 'list' | 'one' | 'create' | 'update' | 'delete' = 'list'): string {
  const actualResource = getResourceName(resource);

  // Use summary views for list operations when available
  if (operation === 'list' || operation === 'one') {
    const summaryResource = `${actualResource}_summary`;
    if (resource === 'opportunities' || resource === 'organizations' || resource === 'contacts') {
      return summaryResource;
    }
  }

  return actualResource;
}

/**
 * Transform data based on resource configuration
 */
async function transformData<TDb, TApp>(
  resource: string,
  data: TDb | TDb[],
  operation: 'get' | 'create' | 'update' = 'get'
): Promise<TApp | TApp[]> {
  const config = transformerRegistry[resource];

  if (!config) {
    // No transformer configured, return data as-is
    return data as unknown as TApp;
  }

  // Handle batch transformation for arrays
  if (Array.isArray(data)) {
    const result = config.transformBatch(data);

    if (result.errors.length > 0 && import.meta.env.DEV) {
      console.warn(`${resource} transformation had ${result.errors.length} errors:`, result.errors);
    }

    return result.items;
  }

  // Single item transformation
  return config.transform(data);
}

/**
 * Transform application data to database format
 */
async function toDatabaseFormat<TApp, TDb>(
  resource: string,
  data: Partial<TApp>
): Promise<Partial<TDb>> {
  const config = transformerRegistry[resource];

  if (!config) {
    // No transformer configured, return data as-is
    return data as unknown as Partial<TDb>;
  }

  // Validate if validator is configured
  if (config.validate) {
    await config.validate(data);
  }

  return config.toDatabase(data);
}

/**
 * Wrap a data provider method with error logging and transformations
 */
async function wrapMethod<T>(
  method: string,
  resource: string,
  params: any,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(method, resource, params, error);
    throw error; // Fail fast - no recovery attempts
  }
}

/**
 * Create the unified data provider with integrated transformations and error logging
 */
export const unifiedDataProvider: DataProvider = {
  async getList<RecordType extends RaRecord = any>(
    resource: string,
    params: GetListParams
  ): Promise<any> {
    return wrapMethod('getList', resource, params, async () => {
      // Apply search parameters
      const searchParams = applySearchParams(resource, params);

      // Get appropriate database resource
      const dbResource = getDatabaseResource(resource, 'list');

      // Execute query
      const result = await baseDataProvider.getList(dbResource, searchParams);

      // Transform results
      const transformedData = await transformData(resource, result.data, 'get');

      return {
        ...result,
        data: transformedData as RecordType[],
      };
    });
  },

  async getOne<RecordType extends RaRecord = any>(
    resource: string,
    params: GetOneParams
  ): Promise<any> {
    return wrapMethod('getOne', resource, params, async () => {
      // Get appropriate database resource
      const dbResource = getDatabaseResource(resource, 'one');

      // Execute query
      const result = await baseDataProvider.getOne(dbResource, params);

      // Transform result
      const transformedData = await transformData(resource, result.data, 'get');

      return {
        ...result,
        data: transformedData as RecordType,
      };
    });
  },

  async getMany<RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyParams
  ): Promise<any> {
    return wrapMethod('getMany', resource, params, async () => {
      const dbResource = getResourceName(resource);
      const result = await baseDataProvider.getMany(dbResource, params);

      // Transform results
      const transformedData = await transformData(resource, result.data, 'get');

      return {
        ...result,
        data: transformedData as RecordType[],
      };
    });
  },

  async getManyReference<RecordType extends RaRecord = any>(
    resource: string,
    params: GetManyReferenceParams
  ): Promise<any> {
    return wrapMethod('getManyReference', resource, params, async () => {
      const dbResource = getResourceName(resource);
      const result = await baseDataProvider.getManyReference(dbResource, params);

      // Transform results
      const transformedData = await transformData(resource, result.data, 'get');

      return {
        ...result,
        data: transformedData as RecordType[],
      };
    });
  },

  async create<RecordType extends Omit<RaRecord, "id"> = any>(
    resource: string,
    params: CreateParams<RecordType>
  ): Promise<any> {
    return wrapMethod('create', resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Transform to database format
      const dbData = await toDatabaseFormat(resource, params.data);

      // Execute create
      const result = await baseDataProvider.create(dbResource, {
        ...params,
        data: dbData as any,
      });

      // Transform result back to application format
      const transformedData = await transformData(resource, result.data, 'create');

      return {
        ...result,
        data: transformedData as RecordType & { id: Identifier },
      };
    });
  },

  async update<RecordType extends RaRecord = any>(
    resource: string,
    params: UpdateParams<RecordType>
  ): Promise<any> {
    return wrapMethod('update', resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Transform to database format
      const dbData = await toDatabaseFormat(resource, params.data);

      // Execute update
      const result = await baseDataProvider.update(dbResource, {
        ...params,
        data: {
          ...dbData,
          id: params.id, // Preserve ID
        } as any,
      });

      // Transform result back to application format
      const transformedData = await transformData(resource, result.data, 'update');

      return {
        ...result,
        data: transformedData as RecordType,
      };
    });
  },

  async updateMany(
    resource: string,
    params: UpdateManyParams
  ): Promise<any> {
    return wrapMethod('updateMany', resource, params, async () => {
      const dbResource = getResourceName(resource);

      // Transform each update to database format
      const dbData = await toDatabaseFormat(resource, params.data);

      const result = await baseDataProvider.updateMany(dbResource, {
        ...params,
        data: dbData as any,
      });

      return result;
    });
  },

  async delete<RecordType extends RaRecord = any>(
    resource: string,
    params: DeleteParams
  ): Promise<any> {
    return wrapMethod('delete', resource, params, async () => {
      const dbResource = getResourceName(resource);
      return baseDataProvider.delete(dbResource, params);
    });
  },

  async deleteMany(
    resource: string,
    params: DeleteManyParams
  ): Promise<any> {
    return wrapMethod('deleteMany', resource, params, async () => {
      const dbResource = getResourceName(resource);
      return baseDataProvider.deleteMany(dbResource, params);
    });
  },
};

/**
 * Export a helper to check if a resource uses transformers
 */
export function resourceUsesTransformers(resource: string): boolean {
  return resource in transformerRegistry;
}

/**
 * Export transformer registry for testing and debugging
 */
export { transformerRegistry };