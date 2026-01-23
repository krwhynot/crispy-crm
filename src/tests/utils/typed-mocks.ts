/**
 * Typed Mock Helpers for React Admin Hooks
 *
 * Provides strongly-typed mock factories for common React Admin hooks
 * to replace `as any` casts in test files.
 *
 * @example
 * ```tsx
 * vi.mocked(useGetList).mockReturnValue(
 *   mockUseGetListReturn({ data: [mockContact], total: 1 })
 * );
 * ```
 */

import { vi, type Mock } from "vitest";
import type {
  UseGetListHookValue,
  UseGetOneHookValue,
  UseCreateResult,
  UseDeleteResult,
  GetListParams,
  RaRecord,
  ListControllerResult,
  SortPayload,
  FilterPayload,
} from "ra-core";

/**
 * Create a mock return value for useGetList hook
 * @param overrides - Partial values to override defaults
 */
export function mockUseGetListReturn<RecordType extends RaRecord = RaRecord>(
  overrides?: Partial<UseGetListHookValue<RecordType>>
): UseGetListHookValue<RecordType> {
  return {
    data: [] as RecordType[],
    total: 0,
    isPending: false,
    isFetching: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
    },
    ...overrides,
  } as UseGetListHookValue<RecordType>;
}

/**
 * Create a mock implementation for useGetList that returns typed values
 * @param returnValue - Partial values to return from the mock
 */
export function mockUseGetList<RecordType extends RaRecord = RaRecord>(
  returnValue: Partial<UseGetListHookValue<RecordType>>
): Mock {
  return vi.fn().mockReturnValue(mockUseGetListReturn(returnValue));
}

/**
 * Create a mock return value for useGetOne hook
 * @param overrides - Partial values to override defaults
 */
export function mockUseGetOneReturn<RecordType extends RaRecord = RaRecord>(
  overrides?: Partial<UseGetOneHookValue<RecordType>>
): UseGetOneHookValue<RecordType> {
  return {
    data: undefined,
    isPending: false,
    isFetching: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as UseGetOneHookValue<RecordType>;
}

/**
 * Create a mock implementation for useGetOne that returns typed values
 * @param returnValue - Partial values to return from the mock
 */
export function mockUseGetOne<RecordType extends RaRecord = RaRecord>(
  returnValue: Partial<UseGetOneHookValue<RecordType>>
): Mock {
  return vi.fn().mockReturnValue(mockUseGetOneReturn(returnValue));
}

/**
 * Create a mock return value for useCreate hook
 * Returns a tuple of [mutate function, mutation state]
 * @param overrides - Options to customize the mock behavior
 */
export function mockUseCreateReturn<RecordType extends RaRecord = RaRecord>(overrides?: {
  mutate?: Mock;
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  data?: RecordType;
}): UseCreateResult<RecordType> {
  const mutateFn = overrides?.mutate ?? vi.fn();
  return [
    mutateFn,
    {
      isPending: overrides?.isPending ?? false,
      isSuccess: overrides?.isSuccess ?? false,
      isError: overrides?.isError ?? false,
      error: overrides?.error ?? null,
      data: overrides?.data,
      reset: vi.fn(),
    },
  ] as unknown as UseCreateResult<RecordType>;
}

/**
 * Create a mock implementation for useCreate that returns typed values
 * @param options - Options to customize the mock behavior
 */
export function mockUseCreate<RecordType extends RaRecord = RaRecord>(
  options?: Parameters<typeof mockUseCreateReturn<RecordType>>[0]
): Mock {
  return vi.fn().mockReturnValue(mockUseCreateReturn<RecordType>(options));
}

/**
 * Create a mock return value for useDelete hook
 * Returns a tuple of [mutate function, mutation state]
 * @param overrides - Options to customize the mock behavior
 */
export function mockUseDeleteReturn<RecordType extends RaRecord = RaRecord>(overrides?: {
  mutate?: Mock;
  isPending?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  data?: RecordType;
}): UseDeleteResult<RecordType> {
  const mutateFn = overrides?.mutate ?? vi.fn();
  return [
    mutateFn,
    {
      isPending: overrides?.isPending ?? false,
      isSuccess: overrides?.isSuccess ?? false,
      isError: overrides?.isError ?? false,
      error: overrides?.error ?? null,
      data: overrides?.data,
      reset: vi.fn(),
    },
  ] as unknown as UseDeleteResult<RecordType>;
}

/**
 * Create a mock implementation for useDelete that returns typed values
 * @param options - Options to customize the mock behavior
 */
export function mockUseDelete<RecordType extends RaRecord = RaRecord>(
  options?: Parameters<typeof mockUseDeleteReturn<RecordType>>[0]
): Mock {
  return vi.fn().mockReturnValue(mockUseDeleteReturn<RecordType>(options));
}

/**
 * Identity type for useGetIdentity hook
 */
export interface MockIdentity {
  id: string | number;
  fullName?: string;
  avatar?: string;
  [key: string]: unknown;
}

/**
 * Create a mock return value for useGetIdentity hook
 * @param overrides - Partial values to override defaults
 */
export function mockUseGetIdentityReturn(overrides?: {
  data?: MockIdentity;
  isPending?: boolean;
  isLoading?: boolean;
  error?: Error | null;
}): {
  data: MockIdentity | undefined;
  isPending: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: Mock;
} {
  return {
    data: overrides?.data,
    isPending: overrides?.isPending ?? false,
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
    refetch: vi.fn(),
  };
}

/**
 * Create a mock implementation for useGetIdentity that returns typed values
 * @param options - Options to customize the mock behavior
 */
export function mockUseGetIdentity(options?: Parameters<typeof mockUseGetIdentityReturn>[0]): Mock {
  return vi.fn().mockReturnValue(mockUseGetIdentityReturn(options));
}

/**
 * Type alias for GetListParams to use in mock implementations
 * Avoids `params?: any` in test mock implementations
 */
export type { GetListParams };
