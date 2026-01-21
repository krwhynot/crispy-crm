/**
 * Skip Delete Wrapper for DataProvider
 *
 * Honors the `meta.skipDelete` flag returned by beforeDelete lifecycle callbacks.
 * When a beforeDelete callback performs a soft delete via RPC and sets skipDelete=true,
 * this wrapper intercepts the delete call and returns a "fake" success response
 * without calling the underlying provider's hard DELETE.
 *
 * WHY THIS EXISTS:
 * ----------------
 * React Admin's `withLifecycleCallbacks` does NOT check for skipDelete flags.
 * When `beforeDelete` archives a record via RPC and returns `{ meta: { skipDelete: true } }`,
 * the lifecycle wrapper still calls the inner provider's delete method, which attempts
 * a hard DELETE. This causes FK constraint errors when related records exist.
 *
 * COMPOSITION ORDER:
 * ------------------
 * This wrapper MUST be INSIDE `withLifecycleCallbacks`:
 *
 * ```typescript
 * withErrorLogging(
 *   withLifecycleCallbacks(
 *     withSkipDelete(withValidation(baseProvider)),  // ← INSIDE lifecycle
 *     [callbacks]
 *   )
 * )
 * ```
 *
 * Why? Because `withLifecycleCallbacks` passes the MODIFIED params (with skipDelete)
 * to its inner provider. If `withSkipDelete` is outside, it receives original params
 * without the skipDelete flag.
 *
 * Engineering Constitution: Single responsibility - honors lifecycle callback signals
 */

import type { DataProvider, RaRecord, DeleteParams, DeleteManyParams, Identifier } from "ra-core";

/**
 * Wrap a DataProvider to honor skipDelete meta flag
 *
 * When delete/deleteMany receives `params.meta.skipDelete = true`:
 * - Returns a "fake" success response without calling the underlying provider
 * - The record was already soft-deleted by the beforeDelete callback's RPC call
 *
 * When skipDelete is not set:
 * - Passes through to the underlying provider normally
 *
 * @param provider - The DataProvider to wrap
 * @returns A new DataProvider that honors skipDelete
 */
export function withSkipDelete<T extends DataProvider>(provider: T): T {
  // Create a new object preserving all original methods
  const wrappedProvider = { ...provider } as T;

  // Wrap delete to check for skipDelete flag
  wrappedProvider.delete = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteParams<RecordType>
  ) => {
    // Check if beforeDelete callback signaled to skip the actual delete
    if (params.meta?.skipDelete) {
      // Return fake success - the record was already soft-deleted by RPC
      // React Admin expects { data: { id: ... } } format for delete responses
      return { data: { id: params.id } as RecordType };
    }

    // No skipDelete flag - proceed with normal delete
    return provider.delete<RecordType>(resource, params);
  };

  // Wrap deleteMany to check for skipDelete flag
  wrappedProvider.deleteMany = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: DeleteManyParams<RecordType>
  ) => {
    // Check if beforeDelete callback signaled to skip the actual delete
    if (params.meta?.skipDelete) {
      // Return fake success - records were already soft-deleted by RPC
      // React Admin expects { data: [...ids] } format for deleteMany responses
      return { data: params.ids as Identifier[] };
    }

    // No skipDelete flag - proceed with normal deleteMany
    return provider.deleteMany<RecordType>(resource, params);
  };

  return wrappedProvider;
}
