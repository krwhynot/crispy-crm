/**
 * Typed Test Helpers
 *
 * Provides type-safe alternatives to common test patterns that use `: any`.
 * Import these helpers instead of using inline `: any` in test files.
 */

import type { GetListParams, GetOneParams, UpdateParams, RaRecord } from "ra-core";

/**
 * Type-safe row mapper for export tests
 */
export function mapExportRows<T>(
  data: T[],
  mapper: (row: T) => (string | number | null)[]
): (string | number | null)[][] {
  return data.map(mapper);
}

/**
 * Type for mock setState callback used in hook tests
 */
export type MockSetState<T> = (updater: (prev: T) => T) => void;

/**
 * Type-safe mock implementation signature for useGetList
 */
export type MockGetListImpl<T extends RaRecord = RaRecord> = (
  resource: string,
  params: GetListParams,
  options?: Record<string, unknown>
) => { data: T[]; total: number; isPending: boolean; error: Error | null };

/**
 * Type-safe mock implementation signature for dataProvider methods
 */
export type MockDataProviderMethod<T extends RaRecord = RaRecord> = (
  resource: string,
  params: GetListParams | GetOneParams | UpdateParams
) => Promise<{ data: T | T[] }>;

/**
 * Extract filter from GetListParams safely
 */
export function getFilterValue<T>(params: GetListParams, key: string): T | undefined {
  return params.filter?.[key] as T | undefined;
}

/**
 * Generic hook state interface for testing
 */
export interface HookState<T> {
  data: T[];
  isPending: boolean;
  isLoading?: boolean;
  error: Error | null;
}

/**
 * Create a type-safe setState mock for hook testing
 */
export function createMockSetState<T>(): [T | undefined, MockSetState<T>, () => T | undefined] {
  let state: T | undefined;
  const setState: MockSetState<T> = (updater) => {
    state = updater(state as T);
  };
  const getState = () => state;
  return [state, setState, getState];
}
