/**
 * Resource Callbacks Factory
 *
 * Creates standardized lifecycle callbacks for resources following common patterns.
 * This factory reduces duplication while maintaining consistent behavior across resources.
 *
 * Common patterns:
 * 1. Soft delete - Set deleted_at instead of hard delete
 * 2. Soft delete filter - Add deleted_at@is: null to getList
 * 3. Computed field stripping - Remove view-generated fields before save
 *
 * Engineering Constitution: DRY principle for cross-resource patterns
 */

import type { DataProvider, RaRecord, GetListParams, DeleteParams } from "ra-core";

/**
 * Lifecycle callback interface for React Admin withLifecycleCallbacks
 */
export interface ResourceCallbacks {
  resource: string;
  beforeDelete?: (params: DeleteParams, dataProvider: DataProvider) => Promise<DeleteParams & { meta?: { skipDelete?: boolean } }>;
  afterRead?: (record: RaRecord, dataProvider: DataProvider) => Promise<RaRecord>;
  beforeGetList?: (params: GetListParams, dataProvider: DataProvider) => Promise<GetListParams>;
  beforeSave?: (data: Partial<RaRecord>, dataProvider: DataProvider, resource: string) => Promise<Partial<RaRecord>>;
}

/**
 * Configuration options for creating resource callbacks
 */
export interface ResourceCallbacksConfig {
  /** Resource name (must match React Admin resource) */
  resource: string;
  /** Fields to strip before save (computed/view fields) */
  computedFields?: readonly string[];
  /** Whether resource supports soft delete */
  supportsSoftDelete?: boolean;
  /** Custom afterRead transformation */
  afterReadTransform?: (record: RaRecord) => RaRecord;
  /** Default values to merge on create */
  createDefaults?: Record<string, unknown>;
}

/**
 * Strip computed fields from data
 */
function stripFields(data: Partial<RaRecord>, fields: readonly string[]): Partial<RaRecord> {
  const cleaned = { ...data };
  for (const field of fields) {
    delete cleaned[field];
  }
  return cleaned;
}

/**
 * Create standardized resource callbacks
 *
 * @param config - Configuration for the callbacks
 * @returns ResourceCallbacks object for use with withLifecycleCallbacks
 *
 * @example
 * ```typescript
 * export const tasksCallbacks = createResourceCallbacks({
 *   resource: 'tasks',
 *   supportsSoftDelete: true,
 *   computedFields: ['assignee_name', 'opportunity_name'],
 * });
 * ```
 */
export function createResourceCallbacks(config: ResourceCallbacksConfig): ResourceCallbacks {
  const {
    resource,
    computedFields = [],
    supportsSoftDelete = true,
    afterReadTransform,
    createDefaults = {},
  } = config;

  const callbacks: ResourceCallbacks = {
    resource,
  };

  // Soft delete handler
  if (supportsSoftDelete) {
    callbacks.beforeDelete = async (params, dataProvider) => {
      const deletedAt = new Date().toISOString();

      await dataProvider.update(resource, {
        id: params.id,
        data: { deleted_at: deletedAt },
        previousData: params.previousData,
      });

      return {
        ...params,
        meta: { ...params.meta, skipDelete: true },
      };
    };

    // Add soft delete filter to getList
    callbacks.beforeGetList = async (params, _dataProvider) => {
      const { includeDeleted, ...otherFilters } = params.filter || {};
      const softDeleteFilter = includeDeleted ? {} : { "deleted_at@is": null };

      return {
        ...params,
        filter: {
          ...otherFilters,
          ...softDeleteFilter,
        },
      };
    };
  }

  // Data transformation before save
  if (computedFields.length > 0 || Object.keys(createDefaults).length > 0) {
    callbacks.beforeSave = async (data, _dataProvider, _resource) => {
      let processed = computedFields.length > 0 ? stripFields(data, computedFields) : { ...data };

      // Merge create defaults if no id (create operation)
      if (!data.id && Object.keys(createDefaults).length > 0) {
        processed = { ...createDefaults, ...processed };
      }

      return processed;
    };
  }

  // Custom afterRead transformation
  if (afterReadTransform) {
    callbacks.afterRead = async (record, _dataProvider) => {
      return afterReadTransform(record);
    };
  }

  return callbacks;
}

/**
 * Export types for external use
 */
export type { ResourceCallbacksConfig as CallbacksConfig };
