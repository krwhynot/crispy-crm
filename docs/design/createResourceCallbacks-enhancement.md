# Enhanced createResourceCallbacks Factory Design

**Status:** Design Specification | **Pattern:** Factory with Composable Transforms | **Version:** 2.0

## Executive Summary

The `createResourceCallbacks` factory currently supports basic soft-delete and computed field handling. This design enhances it with a **composable transform pipeline** enabling:

1. **Multiple transform chains** - Read, Write, and Delete transforms
2. **Backward-compatible composition** - Existing configs continue to work
3. **Transform reusability** - Common patterns extracted to `commonTransforms` registry
4. **Type-safe configurations** - Zod-validated transform specifications
5. **Extensibility** - Easy addition of new transforms without factory changes

This design maintains the current **single-factory-call** pattern while enabling advanced use cases (JSONB normalization, computed fields, virtual fields, formula injection prevention).

---

## Current State Analysis

### What Exists ✅

**Factory (`createResourceCallbacks`):**
- ✅ Basic `supportsSoftDelete` flag
- ✅ `computedFields` (strips before save)
- ✅ `afterReadTransform` (single custom transform)
- ✅ `createDefaults` (merge on create)
- ✅ `beforeDelete` hook (soft delete interceptor)
- ✅ `beforeGetList` hook (soft delete filter)

**Common Transforms (`commonTransforms`):**
- ✅ `normalizeJsonbArrays` function (contacts-specific)
- ✅ `Transform` interface (name, description, apply)
- ✅ Registry pattern (commonTransforms object)

### What's Missing ❌

1. **Multiple read transforms** - Only one `afterReadTransform` per resource
2. **Write transforms** - No standardized way to compose pre-save transforms
3. **Delete transforms** - No post-delete hooks
4. **Transform composition** - Can't chain transforms (`A → B → C`)
5. **Transform discovery** - No way to find available transforms
6. **Soft delete configuration** - Hard-coded behavior, no options (e.g., filter behavior)
7. **Validation transforms** - No pre-transform validation
8. **Error handling** - Silent failures if transforms throw

### Gap: Transform Execution Order

Currently:
1. `computedFields` removes fields (implicit transform)
2. `createDefaults` merges values (implicit transform)
3. `afterReadTransform` runs custom logic (explicit transform)

**Problem:** No unified execution model. New features need clearer composition rules.

---

## Design Goals

1. **Backward Compatibility** ✅ - All existing configs work without changes
2. **Composability** ✅ - Chain multiple transforms without nesting
3. **Type Safety** ✅ - Transforms validated at factory creation
4. **Discoverability** ✅ - Registry pattern for built-in transforms
5. **Fail-Fast** ✅ - Transform errors logged, not silently swallowed
6. **Zero Overhead** ✅ - No transforms = no performance cost

---

## Architecture

### Data Flow

```
Request
  ↓
[beforeDelete | beforeGetList | beforeSave]
  ↓
Data Transform Pipeline:
  1. Validation (optional)
  2. Read/Write Transforms (array, composed)
  3. Computed Fields (strip on save)
  4. Create Defaults (merge on create)
  5. Custom Transform (afterReadTransform)
  ↓
[afterRead callback]
  ↓
Response
```

### Core Types

```typescript
/**
 * Single transform function that operates on a record
 * Pure function - no side effects
 */
type TransformFn = (record: RaRecord) => RaRecord;

/**
 * Transform with metadata for registry and composition
 * Enables discovery and debugging
 */
interface Transform {
  name: string;
  description: string;
  apply: TransformFn;
  validate?: (record: RaRecord) => { valid: boolean; errors?: string[] };
}

/**
 * Composition strategy for multiple transforms
 */
type CompositionStrategy = "sequential" | "parallel" | "conditional";

/**
 * Configuration for soft-delete behavior
 * Currently hard-coded, now configurable
 */
interface SoftDeleteConfig {
  enabled: boolean;
  field: string; // "deleted_at" default
  filterOutDeleted: boolean; // exclude deleted by default
  restoreValue: null; // set to null on restore
}

/**
 * Enhanced configuration
 * All fields backward-compatible
 */
export interface ResourceCallbacksConfig {
  resource: string;

  // Legacy fields (still supported)
  computedFields?: readonly string[];
  supportsSoftDelete?: boolean; // replaced by softDeleteConfig
  afterReadTransform?: (record: RaRecord) => RaRecord;
  createDefaults?: Record<string, unknown>;

  // New fields
  softDeleteConfig?: Partial<SoftDeleteConfig>;
  readTransforms?: (Transform | TransformFn)[];
  writeTransforms?: (Transform | TransformFn)[];
  deleteTransforms?: (Transform | TransformFn)[];
  compositionStrategy?: CompositionStrategy;
  onTransformError?: "throw" | "log" | "ignore";
}
```

### Transform Execution Model

```typescript
/**
 * Compose multiple transforms into a single function
 * Handles both Transform objects and raw functions
 * Returns a single function that applies all transforms in order
 */
function composeTransforms(
  transforms: (Transform | TransformFn)[],
  strategy: CompositionStrategy = "sequential"
): TransformFn {
  return (record: RaRecord) => {
    let result = record;

    for (const transform of transforms) {
      const fn = typeof transform === "function" ? transform : transform.apply;

      try {
        result = fn(result);
      } catch (error) {
        logTransformError(transform, error);
        // Behavior controlled by onTransformError
      }
    }

    return result;
  };
}
```

### Factory Implementation Pattern

```typescript
export function createResourceCallbacks(
  config: ResourceCallbacksConfig
): ResourceCallbacks {
  const {
    resource,
    computedFields = [],
    supportsSoftDelete = true,
    afterReadTransform,
    createDefaults = {},

    // New parameters
    softDeleteConfig,
    readTransforms = [],
    writeTransforms = [],
    deleteTransforms = [],
    compositionStrategy = "sequential",
    onTransformError = "log",
  } = config;

  // Backward compatibility: convert legacy supportsSoftDelete to new format
  const softDelete: SoftDeleteConfig = {
    enabled: softDeleteConfig?.enabled ?? supportsSoftDelete,
    field: softDeleteConfig?.field ?? "deleted_at",
    filterOutDeleted: softDeleteConfig?.filterOutDeleted ?? true,
    restoreValue: softDeleteConfig?.restoreValue ?? null,
  };

  // Compose read transforms pipeline
  const readPipeline = composeTransforms(readTransforms, compositionStrategy);
  const writePipeline = composeTransforms(writeTransforms, compositionStrategy);
  const deletePipeline = composeTransforms(deleteTransforms, compositionStrategy);

  const callbacks: ResourceCallbacks = { resource };

  // === Soft Delete Handling ===
  if (softDelete.enabled) {
    callbacks.beforeDelete = async (params, dataProvider) => {
      // Execute delete transforms first
      const transformed = deletePipeline(params.previousData || {});

      const deletedAt = new Date().toISOString();
      await dataProvider.update(resource, {
        id: params.id,
        data: { [softDelete.field]: deletedAt },
        previousData: transformed,
      });

      return {
        ...params,
        meta: { ...params.meta, skipDelete: true },
      };
    };

    callbacks.beforeGetList = async (params, _dataProvider) => {
      const { includeDeleted, ...otherFilters } = params.filter || {};
      const softDeleteFilter = softDelete.filterOutDeleted && !includeDeleted
        ? { [`${softDelete.field}@is`]: null }
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

  // === After Read: Read Transforms → Custom Transform ===
  callbacks.afterRead = async (record, _dataProvider) => {
    // 1. Apply read transform pipeline
    let result = readPipeline(record);

    // 2. Apply legacy afterReadTransform if provided
    if (afterReadTransform) {
      result = afterReadTransform(result);
    }

    return result;
  };

  return callbacks;
}
```

---

## Usage Examples

### Example 1: Backward Compatible (No Changes)

```typescript
// Existing code works without modification
export const contactsCallbacks = createResourceCallbacks({
  resource: "contacts",
  computedFields: ["assignee_name", "organization_name"],
  supportsSoftDelete: true,
  afterReadTransform: normalizeJsonbArrays,
});
```

### Example 2: Multiple Read Transforms

```typescript
export const contactsCallbacks = createResourceCallbacks({
  resource: "contacts",

  // New: compose multiple read transforms
  readTransforms: [
    commonTransforms.normalizeJsonbArrays,
    { // inline transform
      name: "ensure-emails",
      description: "Ensure emails array exists",
      apply: (record) => ({
        ...record,
        email: record.email || [],
      }),
    },
  ],

  // Legacy still works alongside new
  computedFields: ["assignee_name"],
  supportsSoftDelete: true,
});
```

### Example 3: Write Transforms (Formula Injection Prevention)

```typescript
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

export const productsCallbacks = createResourceCallbacks({
  resource: "products",

  // Write transforms prevent malicious formulas
  writeTransforms: [
    {
      name: "sanitize-formula-injection",
      description: "Remove formula prefixes from string fields",
      apply: (record) => ({
        ...record,
        name: sanitizeCsvValue(record.name),
        description: sanitizeCsvValue(record.description),
      }),
    },
  ],

  supportsSoftDelete: true,
});
```

### Example 4: Delete Transforms (Audit Trail)

```typescript
export const activitiesCallbacks = createResourceCallbacks({
  resource: "activities",

  // Delete transforms create audit records
  deleteTransforms: [
    {
      name: "audit-deletion",
      description: "Log deletion for compliance",
      apply: (record) => ({
        ...record,
        deletedBy: getCurrentUserId(),
        deletionReason: "User initiated",
      }),
    },
  ],

  supportsSoftDelete: true,
  softDeleteConfig: {
    enabled: true,
    field: "deleted_at",
    filterOutDeleted: true,
  },
});
```

### Example 5: Conditional Soft Delete Configuration

```typescript
export const opportunitiesCallbacks = createResourceCallbacks({
  resource: "opportunities",

  // Replace boolean flag with configuration object
  softDeleteConfig: {
    enabled: true,
    field: "deleted_at", // default
    filterOutDeleted: process.env.NODE_ENV === "production",
    restoreValue: null,
  },

  readTransforms: [
    {
      name: "add-pipeline-stage",
      description: "Compute derived pipeline stage",
      apply: (record) => ({
        ...record,
        pipelineStage: computePipelineStage(record.status),
      }),
    },
  ],
});
```

---

## Migration Path

### Phase 1: Launch (No Breaking Changes)
- New parameters are optional
- Legacy `supportsSoftDelete` → `softDeleteConfig` internally
- `afterReadTransform` still works
- No existing code changes required

### Phase 2: Adopt (Over Time)
Resources can incrementally adopt new patterns:

```typescript
// Before: All legacy
export const contactsCallbacks = createResourceCallbacks({
  resource: "contacts",
  computedFields: ["assignee_name"],
  supportsSoftDelete: true,
  afterReadTransform: normalizeJsonbArrays,
});

// After: Mix legacy + new as beneficial
export const contactsCallbacks = createResourceCallbacks({
  resource: "contacts",

  // Use new readTransforms instead of legacy afterReadTransform
  readTransforms: [commonTransforms.normalizeJsonbArrays],

  // Keep legacy for other needs
  computedFields: ["assignee_name"],

  // Explicit config instead of boolean
  softDeleteConfig: { enabled: true },
});
```

### Phase 3: Standardize (Optional, Not Required)
- Document transform discovery for new features
- Build transform compositions for common patterns
- Consider transform middleware library if patterns emerge

---

## Implementation Checklist

- [ ] Create `TransformComposer` utility function (composeTransforms)
- [ ] Enhance `ResourceCallbacksConfig` interface with new fields
- [ ] Implement backward-compatible `softDeleteConfig` conversion
- [ ] Add read/write/delete transform execution in callbacks
- [ ] Update `commonTransforms` registry with metadata
- [ ] Add transform error handling (`onTransformError` option)
- [ ] Write unit tests for transform composition
- [ ] Add E2E tests for real-world transform chains
- [ ] Update examples in `contactsCallbacks`, `productsCallbacks`, `activitiesCallbacks`
- [ ] Document transform registry in CLAUDE.md
- [ ] Optional: Add CLI command for discovering available transforms

---

## Key Design Decisions

### ✅ Decision 1: Keep Single Factory Call

**Option A:** Multiple factories for different concerns
```typescript
// ❌ Creates fragmentation
const softDeleteCallbacks = createSoftDeleteCallbacks(...);
const transformCallbacks = createTransformCallbacks(...);
```

**Option B:** Single factory with optional parameters (chosen)
```typescript
// ✅ Single entry point, opt-in features
const callbacks = createResourceCallbacks({
  ...
  readTransforms: [...],
  writeTransforms: [...],
});
```

### ✅ Decision 2: Transforms as Optional Array

**Option A:** Transform composition library
```typescript
// ❌ Requires learning new DSL
const transforms = pipe([a, b, c]);
```

**Option B:** Simple array composition (chosen)
```typescript
// ✅ Straightforward sequential execution
readTransforms: [transformA, transformB, transformC]
```

### ✅ Decision 3: Support Both Raw Functions and Transform Objects

**Option A:** Only Transform objects with metadata
```typescript
// ❌ Forces wrapping even for simple transforms
readTransforms: [
  { name: "x", description: "y", apply: (r) => r }
]
```

**Option B:** Accept both (chosen)
```typescript
// ✅ Flexible: inline simple, structured when needed
readTransforms: [
  (record) => ({ ...record, x: 1 }), // Simple
  commonTransforms.normalizeJsonbArrays, // Reusable
]
```

### ✅ Decision 4: Backward Compatibility Over New Feature Flags

**Option A:** Feature flag for legacy mode
```typescript
// ❌ Requires migration decision
supportsSoftDelete: true, // OR
softDeleteConfig: {...},
```

**Option B:** Implicit migration (chosen)
```typescript
// ✅ Works both ways, automatically converted
supportsSoftDelete: true, // STILL WORKS
softDeleteConfig: {...}, // ALSO WORKS
```

---

## Testing Strategy

### Unit Tests
- ✅ Transform composition with empty array
- ✅ Transform composition with single transform
- ✅ Transform composition with multiple transforms
- ✅ Transform error handling (throw vs log vs ignore)
- ✅ Backward compatibility: legacy supportsSoftDelete parameter
- ✅ Soft delete filter generation with filterOutDeleted option

### Integration Tests
- ✅ Real read transform pipeline with normalizeJsonbArrays
- ✅ Real write transform pipeline with computed field stripping
- ✅ Delete transform pipeline with soft delete
- ✅ Create defaults merged after write transforms
- ✅ Legacy afterReadTransform runs after read transforms

### E2E Tests
- ✅ Create contact with JSONB arrays → normalized on read
- ✅ Create product with formula injection → sanitized on write
- ✅ Delete activity with audit trail → soft delete recorded
- ✅ List contacts → soft deleted filtered out by default
- ✅ List with ?includeDeleted=1 → shows all records

---

## Success Metrics

1. **Backward Compatibility:** 100% of existing callbacks work without changes
2. **Type Safety:** All transforms validated at factory creation
3. **Performance:** Transforms on/off toggle has zero overhead
4. **Maintainability:** Clear execution order documented in CLAUDE.md
5. **Extensibility:** New transforms added to registry without factory changes

---

## Open Questions

1. **Parallel Transform Execution:** Should we support `compositionStrategy: "parallel"` for independent transforms?
   - **Answer:** Not in Phase 1. Sequential is safer and simpler. Can add later if needed.

2. **Transform Validation:** Should transforms be validated before factory creation?
   - **Answer:** Yes, optional `validate()` method on Transform interface. Factory logs validation errors.

3. **Transform Debugging:** How do users debug transform pipelines?
   - **Answer:** `onTransformError: "log"` logs transform name + error. Consider debug CLI later.

4. **Transform Registry Discovery:** Should there be a CLI command to list available transforms?
   - **Answer:** Document manual registry in CLAUDE.md first. CLI is Phase 3 optimization.

---

## References

- Current: `src/atomic-crm/providers/supabase/callbacks/createResourceCallbacks.ts`
- Transforms: `src/atomic-crm/providers/supabase/callbacks/commonTransforms.ts`
- Usage: `src/atomic-crm/providers/supabase/callbacks/{contacts,activities,products,organizations}Callbacks.ts`
- Design System: `docs/plans/2025-11-16-unified-design-system-rollout.md`
- Engineering Constitution: `docs/claude/engineering-constitution.md`
