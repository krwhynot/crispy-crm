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
  beforeDelete?: (
    params: DeleteParams,
    dataProvider: DataProvider
  ) => Promise<DeleteParams & { meta?: { skipDelete?: boolean } }>;
  afterRead?: (record: RaRecord, dataProvider: DataProvider) => Promise<RaRecord>;
  beforeGetList?: (params: GetListParams, dataProvider: DataProvider) => Promise<GetListParams>;
  beforeSave?: (
    data: Partial<RaRecord>,
    dataProvider: DataProvider,
    resource: string
  ) => Promise<Partial<RaRecord>>;
}

/**
 * Transform function that operates on a record
 * Pure function - no side effects
 */
export type TransformFn = (record: RaRecord) => RaRecord;

/**
 * Validation function that checks if a record is valid
 * Returns object with validity status and optional error messages
 */
export type ValidateFn = (record: RaRecord) => { valid: boolean; errors?: string[] };

/**
 * Transform with metadata for registry and composition
 * Enables discovery and debugging of transform pipelines
 */
export interface Transform {
  /** Unique identifier for the transform */
  name: string;
  /** Human-readable description of what this transform does */
  description: string;
  /** The transformation function to apply */
  apply: TransformFn;
  /** Optional validation function to run before/after transform */
  validate?: ValidateFn;
}

/**
 * Type that accepts either a raw transform function or a Transform object
 * Allows inline simple transforms and reusable structured transforms
 */
export type TransformInput = TransformFn | Transform;

/**
 * Composition strategy for multiple transforms
 * - sequential: Apply each transform in order (default)
 * - parallel: Apply all transforms independently (not yet implemented)
 * - conditional: Apply transforms based on conditions (future)
 */
export type CompositionStrategy = "sequential" | "parallel" | "conditional";

/**
 * Configuration for soft-delete behavior
 * Replaces boolean flag with detailed, configurable options
 */
export interface SoftDeleteConfig {
  /** Enable soft delete functionality */
  enabled: boolean;
  /** Database field name that stores deletion timestamp */
  field: string;
  /** Filter out deleted records in getList by default */
  filterOutDeleted: boolean;
  /** Value to set when restoring a soft-deleted record (usually null) */
  restoreValue: null | unknown;
}

/**
 * Configuration options for creating resource callbacks
 */
export interface ResourceCallbacksConfig {
  /** Resource name (must match React Admin resource) */
  resource: string;
  /** Fields to strip before save (computed/view fields) */
  computedFields?: readonly string[];
  /** Whether resource supports soft delete (legacy - use softDeleteConfig instead) */
  supportsSoftDelete?: boolean;
  /** Soft delete configuration (replaces supportsSoftDelete boolean) */
  softDeleteConfig?: Partial<SoftDeleteConfig>;
  /** Custom afterRead transformation (legacy - use readTransforms instead) */
  afterReadTransform?: (record: RaRecord) => RaRecord;
  /** Default values to merge on create */
  createDefaults?: Record<string, unknown>;
  /** Read transforms: applied after data is fetched from database */
  readTransforms?: TransformInput[];
  /** Write transforms: applied before data is saved to database */
  writeTransforms?: TransformInput[];
  /** Delete transforms: applied before record is deleted */
  deleteTransforms?: TransformInput[];
  /** Strategy for composing multiple transforms */
  compositionStrategy?: CompositionStrategy;
  /** Error handling strategy for transforms */
  onTransformError?: "throw" | "log";
}

/**
 * Helper: Check if a value is a Transform object vs a TransformFn
 */
function isTransform(value: unknown): value is Transform {
  return (
    typeof value === "object" &&
    value !== null &&
    "apply" in value &&
    typeof (value as Transform).apply === "function" &&
    "name" in value &&
    typeof (value as Transform).name === "string"
  );
}

/**
 * Compose multiple transforms into a single function
 * Handles both Transform objects and raw functions
 * Returns a single function that applies all transforms in order
 *
 * @param transforms - Array of transforms to compose (can be functions or Transform objects)
 * @param strategy - How to compose the transforms (default: sequential)
 * @param errorHandler - Callback when a transform throws an error
 * @returns A single function that applies all transforms
 */
function composeTransforms(
  transforms: TransformInput[],
  strategy: CompositionStrategy = "sequential",
  errorHandler?: (transform: TransformInput, error: Error) => void
): TransformFn {
  if (transforms.length === 0) {
    return (record) => record;
  }

  if (strategy === "sequential") {
    return (record: RaRecord): RaRecord => {
      let result = record;

      for (const transform of transforms) {
        try {
          const fn = isTransform(transform) ? transform.apply : transform;
          result = fn(result);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (errorHandler) {
            errorHandler(transform, err);
          } else {
            throw err;
          }
        }
      }

      return result;
    };
  }

  // Other strategies (parallel, conditional) not yet implemented
  throw new Error(`Transform composition strategy "${strategy}" not yet implemented`);
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
 *
 * @example
 * ```typescript
 * // New: Using read transforms
 * export const contactsCallbacks = createResourceCallbacks({
 *   resource: 'contacts',
 *   readTransforms: [
 *     commonTransforms.normalizeJsonbArrays,
 *     (record) => ({ ...record, email: record.email || [] }),
 *   ],
 *   softDeleteConfig: { enabled: true },
 * });
 * ```
 */
export function createResourceCallbacks(config: ResourceCallbacksConfig): ResourceCallbacks {
  const {
    resource,
    computedFields = [],
    supportsSoftDelete = true,
    softDeleteConfig: userSoftDeleteConfig,
    afterReadTransform,
    createDefaults = {},
    readTransforms = [],
    writeTransforms = [],
    deleteTransforms = [],
    compositionStrategy = "sequential",
    onTransformError = "log",
  } = config;

  // Backward compatibility: convert legacy supportsSoftDelete to new format
  const softDeleteConfig: SoftDeleteConfig = {
    enabled: userSoftDeleteConfig?.enabled ?? supportsSoftDelete,
    field: userSoftDeleteConfig?.field ?? "deleted_at",
    filterOutDeleted: userSoftDeleteConfig?.filterOutDeleted ?? true,
    restoreValue: userSoftDeleteConfig?.restoreValue ?? null,
  };

  // Error handler for transforms
  const handleTransformError = (transform: TransformInput, error: Error) => {
    const name = isTransform(transform) ? transform.name : "<anonymous>";
    const message = `Transform error in "${name}": ${error.message}`;

    switch (onTransformError) {
      case "throw":
        throw new Error(message);
      case "log":
        console.error(message, error);
        break;
    }
  };

  // Compose transform pipelines
  const readPipeline = composeTransforms(readTransforms, compositionStrategy, handleTransformError);
  const writePipeline = composeTransforms(
    writeTransforms,
    compositionStrategy,
    handleTransformError
  );
  const deletePipeline = composeTransforms(
    deleteTransforms,
    compositionStrategy,
    handleTransformError
  );

  const callbacks: ResourceCallbacks = {
    resource,
  };

  // === Soft Delete Handling ===
  if (softDeleteConfig.enabled) {
    callbacks.beforeDelete = async (params, dataProvider) => {
      // Apply delete transforms first
      const transformed = deletePipeline(params.previousData || {});

      const deletedAt = new Date().toISOString();

      await dataProvider.update(resource, {
        id: params.id,
        data: { [softDeleteConfig.field]: deletedAt },
        previousData: transformed,
      });

      return {
        ...params,
        meta: { ...params.meta, skipDelete: true },
      };
    };

    // Add soft delete filter to getList
    callbacks.beforeGetList = async (params, _dataProvider) => {
      const { includeDeleted, ...otherFilters } = params.filter || {};
      const softDeleteFilter =
        softDeleteConfig.filterOutDeleted && !includeDeleted
          ? { [`${softDeleteConfig.field}@is`]: null }
          : {};

      return {
        ...params,
        filter: {
          ...otherFilters,
          ...softDeleteFilter,
        },
      };
    };
  }

  // === Before Save: Write Transforms → Computed Fields → Create Defaults ===
  if (
    writeTransforms.length > 0 ||
    computedFields.length > 0 ||
    Object.keys(createDefaults).length > 0
  ) {
    callbacks.beforeSave = async (data, _dataProvider, _resource) => {
      // 1. Apply write transform pipeline
      let processed = writePipeline(data);

      // 2. Strip computed fields (legacy support)
      if (computedFields.length > 0) {
        processed = stripFields(processed, computedFields);
      }

      // 3. Merge create defaults if create operation
      if (!data.id && Object.keys(createDefaults).length > 0) {
        processed = { ...createDefaults, ...processed };
      }

      return processed;
    };
  }

  // === After Read: Read Transforms → Custom Transform ===
  if (readTransforms.length > 0 || afterReadTransform) {
    callbacks.afterRead = async (record, _dataProvider) => {
      // 1. Apply read transform pipeline
      let result = readPipeline(record);

      // 2. Apply legacy afterReadTransform if provided
      if (afterReadTransform) {
        result = afterReadTransform(result);
      }

      return result;
    };
  }

  return callbacks;
}

/**
 * Export types for external use
 */
export type {
  ResourceCallbacksConfig as CallbacksConfig,
  TransformFn,
  ValidateFn,
  Transform,
  TransformInput,
  CompositionStrategy,
  SoftDeleteConfig,
};
