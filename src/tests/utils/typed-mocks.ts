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
  UseUpdateResult,
  GetListParams,
  RaRecord,
  ListControllerResult,
  SortPayload,
  FilterPayload,
  ShowControllerResult,
  DataProvider,
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
 * Return type for useGetMany hook
 */
export interface UseGetManyReturn<RecordType extends RaRecord = RaRecord> {
  data: RecordType[] | undefined;
  isPending: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: Mock;
}

/**
 * Create a mock return value for useGetMany hook
 * @param overrides - Partial values to override defaults
 *
 * @example
 * ```tsx
 * vi.mocked(useGetMany<Contact>).mockReturnValue(
 *   mockUseGetManyReturn<Contact>({
 *     data: [mockContact1, mockContact2],
 *     isLoading: false,
 *   })
 * );
 * ```
 */
export function mockUseGetManyReturn<RecordType extends RaRecord = RaRecord>(
  overrides?: Partial<UseGetManyReturn<RecordType>>
): UseGetManyReturn<RecordType> {
  return {
    data: overrides?.data,
    isPending: overrides?.isPending ?? false,
    isFetching: overrides?.isFetching ?? false,
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
    refetch: overrides?.refetch ?? vi.fn(),
  } as UseGetManyReturn<RecordType>;
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
  role?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Create a mock return value for useGetIdentity hook
 * React Admin's useGetIdentity returns { identity, isLoading, error, refetch }
 * @param overrides - Partial values to override defaults
 */
export function mockUseGetIdentityReturn(overrides?: {
  identity?: MockIdentity;
  /** @deprecated Use 'identity' instead */
  data?: MockIdentity;
  isPending?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  refetch?: Mock;
}): {
  identity: MockIdentity | undefined;
  data: MockIdentity | undefined;
  isPending: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: Mock;
} {
  // Support both 'identity' (correct) and 'data' (legacy) properties
  const identityValue = overrides?.identity ?? overrides?.data;
  return {
    identity: identityValue,
    data: identityValue, // Keep data for backwards compatibility
    isPending: overrides?.isPending ?? false,
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
    refetch: overrides?.refetch ?? vi.fn(),
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

/**
 * Partial type for useListContext mock to allow flexible overrides
 * While maintaining type safety for consumers
 */
export interface MockListContextValue<RecordType extends RaRecord = RaRecord> {
  data?: RecordType[];
  total?: number;
  isPending?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  sort?: SortPayload;
  filterValues?: FilterPayload;
  displayedFilters?: Record<string, boolean>;
  setFilters?: Mock;
  setSort?: Mock;
  setPage?: Mock;
  setPerPage?: Mock;
  page?: number;
  perPage?: number;
  resource?: string;
  selectedIds?: RecordType["id"][];
  onSelect?: Mock;
  onSelectAll?: Mock;
  onToggleItem?: Mock;
  onUnselectItems?: Mock;
  showFilter?: Mock;
  hideFilter?: Mock;
  refetch?: Mock;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/**
 * Create a mock return value for useListContext hook
 * @param overrides - Partial values to override defaults
 *
 * @example
 * ```tsx
 * vi.mocked(useListContext).mockReturnValue(
 *   mockUseListContextReturn({ data: [mockContact], total: 1 })
 * );
 * ```
 */
export function mockUseListContextReturn<RecordType extends RaRecord = RaRecord>(
  overrides?: MockListContextValue<RecordType>
): ListControllerResult<RecordType> {
  return {
    data: (overrides?.data ?? []) as RecordType[],
    total: overrides?.total ?? 0,
    isPending: overrides?.isPending ?? false,
    isLoading: overrides?.isLoading ?? false,
    isFetching: overrides?.isFetching ?? false,
    error: overrides?.error ?? null,
    sort: overrides?.sort ?? { field: "id", order: "ASC" },
    filterValues: overrides?.filterValues ?? {},
    displayedFilters: overrides?.displayedFilters ?? {},
    setFilters: overrides?.setFilters ?? vi.fn(),
    setSort: overrides?.setSort ?? vi.fn(),
    setPage: overrides?.setPage ?? vi.fn(),
    setPerPage: overrides?.setPerPage ?? vi.fn(),
    page: overrides?.page ?? 1,
    perPage: overrides?.perPage ?? 25,
    resource: overrides?.resource ?? "test",
    selectedIds: overrides?.selectedIds ?? [],
    onSelect: overrides?.onSelect ?? vi.fn(),
    onSelectAll: overrides?.onSelectAll ?? vi.fn(),
    onToggleItem: overrides?.onToggleItem ?? vi.fn(),
    onUnselectItems: overrides?.onUnselectItems ?? vi.fn(),
    showFilter: overrides?.showFilter ?? vi.fn(),
    hideFilter: overrides?.hideFilter ?? vi.fn(),
    refetch: overrides?.refetch ?? vi.fn(),
    hasNextPage: overrides?.hasNextPage ?? false,
    hasPreviousPage: overrides?.hasPreviousPage ?? false,
  } as ListControllerResult<RecordType>;
}

/**
 * Create a mock implementation for useListContext that returns typed values
 * @param returnValue - Partial values to return from the mock
 */
export function mockUseListContext<RecordType extends RaRecord = RaRecord>(
  returnValue: MockListContextValue<RecordType>
): Mock {
  return vi.fn().mockReturnValue(mockUseListContextReturn(returnValue));
}

/**
 * Partial type for useShowContext mock to allow flexible overrides
 */
export interface MockShowContextValue<RecordType extends RaRecord = RaRecord> {
  record?: RecordType;
  isPending?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  resource?: string;
  refetch?: Mock;
}

/**
 * Create a mock return value for useShowContext hook
 * @param overrides - Partial values to override defaults
 *
 * @example
 * ```tsx
 * vi.mocked(useShowContext).mockReturnValue(
 *   mockUseShowContextReturn({ record: mockContact, isPending: false })
 * );
 * ```
 */
export function mockUseShowContextReturn<RecordType extends RaRecord = RaRecord>(
  overrides?: MockShowContextValue<RecordType>
): ShowControllerResult<RecordType> {
  // Return loading state if isPending is true
  if (overrides?.isPending) {
    return {
      record: undefined,
      isPending: true,
      isLoading: overrides?.isLoading ?? true,
      isFetching: overrides?.isFetching ?? true,
      error: null,
      resource: overrides?.resource ?? "test",
      refetch: overrides?.refetch ?? vi.fn(),
    } as ShowControllerResult<RecordType>;
  }

  // Return success state with record
  return {
    record: overrides?.record,
    isPending: false,
    isLoading: overrides?.isLoading ?? false,
    isFetching: overrides?.isFetching ?? false,
    error: overrides?.error ?? null,
    resource: overrides?.resource ?? "test",
    refetch: overrides?.refetch ?? vi.fn(),
  } as ShowControllerResult<RecordType>;
}

/**
 * Create a mock implementation for useShowContext that returns typed values
 * @param returnValue - Partial values to return from the mock
 */
export function mockUseShowContext<RecordType extends RaRecord = RaRecord>(
  returnValue: MockShowContextValue<RecordType>
): Mock {
  return vi.fn().mockReturnValue(mockUseShowContextReturn(returnValue));
}

/**
 * Create a mock return value for useUpdate hook
 * Returns a tuple of [mutate function, mutation state]
 * @param overrides - Options to customize the mock behavior
 *
 * @example
 * ```tsx
 * vi.mocked(useUpdate).mockReturnValue(
 *   mockUseUpdateReturn({ isPending: false, isSuccess: true })
 * );
 * ```
 */
export function mockUseUpdateReturn<RecordType extends RaRecord = RaRecord>(overrides?: {
  mutate?: Mock;
  isPending?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  data?: RecordType;
}): UseUpdateResult<RecordType> {
  const mutateFn = overrides?.mutate ?? vi.fn();
  return [
    mutateFn,
    {
      isPending: overrides?.isPending ?? false,
      isLoading: overrides?.isLoading ?? false,
      isSuccess: overrides?.isSuccess ?? false,
      isError: overrides?.isError ?? false,
      error: overrides?.error ?? null,
      data: overrides?.data,
      reset: vi.fn(),
    },
  ] as unknown as UseUpdateResult<RecordType>;
}

/**
 * Create a mock implementation for useUpdate that returns typed values
 * @param options - Options to customize the mock behavior
 */
export function mockUseUpdate<RecordType extends RaRecord = RaRecord>(
  options?: Parameters<typeof mockUseUpdateReturn<RecordType>>[0]
): Mock {
  return vi.fn().mockReturnValue(mockUseUpdateReturn<RecordType>(options));
}

/**
 * Create a mock return value for useRecordContext hook
 * @param record - The record to return from the mock (or undefined for no record)
 *
 * @example
 * ```tsx
 * vi.mocked(useRecordContext).mockReturnValue(
 *   mockUseRecordContextReturn(mockContact)
 * );
 * ```
 */
export function mockUseRecordContextReturn<RecordType extends RaRecord = RaRecord>(
  record?: RecordType
): RecordType | undefined {
  return record;
}

/**
 * Create a mock implementation for useRecordContext that returns typed values
 * @param record - The record to return from the mock
 */
export function mockUseRecordContext<RecordType extends RaRecord = RaRecord>(
  record?: RecordType
): Mock {
  return vi.fn().mockReturnValue(mockUseRecordContextReturn(record));
}

/**
 * Supabase RPC Response type
 */
export interface SupabaseRpcResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

/**
 * Create a typed mock for Supabase RPC response
 * @param data - The data to return
 * @param error - Optional error to return
 */
export function mockSupabaseRpcResponse<T>(
  data: T | null,
  error: { message: string; code?: string } | null = null
): SupabaseRpcResponse<T> {
  return { data, error };
}

/**
 * Supabase Storage Response type
 */
export interface SupabaseStorageResponse<T> {
  data: T | null;
  error: {
    message: string;
  } | null;
}

/**
 * Create a typed mock for Supabase Storage response
 * @param data - The data to return
 * @param error - Optional error to return
 */
export function mockSupabaseStorageResponse<T>(
  data: T | null,
  error: { message: string } | null = null
): SupabaseStorageResponse<T> {
  return { data, error };
}

/**
 * Supabase Edge Function Response type
 */
export interface SupabaseEdgeFunctionResponse<T> {
  data: T | null;
  error: {
    message: string;
  } | null;
}

/**
 * Create a typed mock for Supabase Edge Function response
 * @param data - The data to return
 * @param error - Optional error to return
 */
export function mockSupabaseEdgeFunctionResponse<T>(
  data: T | null,
  error: { message: string } | null = null
): SupabaseEdgeFunctionResponse<T> {
  return { data, error };
}

/**
 * Storage bucket API methods interface for mocking
 */
export interface StorageBucketApi {
  upload?: Mock;
  getPublicUrl?: Mock;
  remove?: Mock;
  list?: Mock;
  [key: string]: Mock | undefined;
}

/**
 * Create a typed mock for Supabase storage bucket operations
 * @param methods - Storage API methods to mock (upload, getPublicUrl, remove, list, etc.)
 */
export function mockStorageBucketApi(methods: StorageBucketApi): StorageBucketApi {
  return methods;
}

/**
 * Extended DataProvider interface with RPC method for testing services that use Edge Functions
 * This is a common pattern in Crispy CRM for services that call Supabase RPC functions
 */
export interface DataProviderWithRpc extends DataProvider {
  rpc: Mock;
}

/**
 * Create a mock DataProvider with RPC support
 * @param baseMock - The base mock data provider (from createMockDataProvider)
 * @returns DataProvider with typed rpc mock function
 */
export function createMockDataProviderWithRpc(baseMock: DataProvider): DataProviderWithRpc {
  return {
    ...baseMock,
    rpc: vi.fn(),
  };
}

/**
 * Delete params with meta for skipDelete pattern
 * Used by lifecycle callbacks that convert DELETE to soft-delete
 */
export interface DeleteParamsWithMeta {
  id: RaRecord["id"];
  previousData?: RaRecord;
  meta?: {
    skipDelete?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Activity log entry type for ActivitiesService tests
 */
export interface ActivityLogEntry {
  id: number;
  activity_type: string;
  type?: string;
  subject?: string;
  activity_date: string;
  source_table?: string;
  [key: string]: unknown;
}

// ============================================================================
// Keyboard Event Mocks
// ============================================================================

/**
 * Create a mock React KeyboardEvent for testing keyboard shortcuts
 * @param overrides - Properties to override on the event
 *
 * @example
 * ```tsx
 * const event = createMockKeyboardEvent({
 *   key: 'Enter',
 *   metaKey: true,
 *   target: document.createElement('input'),
 * });
 * result.current.handleKeyDown(event);
 * ```
 */
export function createMockKeyboardEvent(
  overrides: Partial<{
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    preventDefault: Mock;
    stopPropagation: Mock;
    target: EventTarget | null;
  }> = {}
): React.KeyboardEvent {
  return {
    key: overrides.key ?? "",
    metaKey: overrides.metaKey ?? false,
    ctrlKey: overrides.ctrlKey ?? false,
    shiftKey: overrides.shiftKey ?? false,
    altKey: overrides.altKey ?? false,
    preventDefault: overrides.preventDefault ?? vi.fn(),
    stopPropagation: overrides.stopPropagation ?? vi.fn(),
    target: overrides.target ?? document.createElement("input"),
    // Required event properties
    nativeEvent: new KeyboardEvent("keydown"),
    currentTarget: null as unknown as EventTarget & Element,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    timeStamp: Date.now(),
    type: "keydown",
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    persist: () => {},
    // KeyboardEvent specific
    charCode: 0,
    code: overrides.key ?? "",
    keyCode: 0,
    locale: "",
    location: 0,
    repeat: false,
    which: 0,
    getModifierState: () => false,
  } as React.KeyboardEvent;
}

// ============================================================================
// Query Client Mocks (@tanstack/react-query)
// ============================================================================

/**
 * Mock QueryClient interface for testing hooks that use useQueryClient
 */
export interface MockQueryClient {
  invalidateQueries: Mock;
  setQueryData: Mock;
  getQueryData: Mock;
  removeQueries: Mock;
  cancelQueries: Mock;
  refetchQueries: Mock;
  clear: Mock;
}

/**
 * Create a mock return value for useQueryClient hook
 * @param overrides - Methods to override on the mock client
 *
 * @example
 * ```tsx
 * const mockInvalidate = vi.fn();
 * vi.mocked(useQueryClient).mockReturnValue(
 *   mockUseQueryClientReturn({ invalidateQueries: mockInvalidate })
 * );
 * ```
 */
export function mockUseQueryClientReturn(overrides?: Partial<MockQueryClient>): MockQueryClient {
  return {
    invalidateQueries: overrides?.invalidateQueries ?? vi.fn(),
    setQueryData: overrides?.setQueryData ?? vi.fn(),
    getQueryData: overrides?.getQueryData ?? vi.fn(),
    removeQueries: overrides?.removeQueries ?? vi.fn(),
    cancelQueries: overrides?.cancelQueries ?? vi.fn(),
    refetchQueries: overrides?.refetchQueries ?? vi.fn(),
    clear: overrides?.clear ?? vi.fn(),
  };
}

// ============================================================================
// Base DataProvider Mock
// ============================================================================

/**
 * Create a base mock DataProvider for testing
 * @param overrides - Methods to override on the provider
 *
 * @example
 * ```tsx
 * const mockProvider = createMockDataProvider({
 *   getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
 * });
 * ```
 */
export function createMockDataProvider(overrides?: Partial<DataProvider>): DataProvider {
  return {
    getList: overrides?.getList ?? vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getOne: overrides?.getOne ?? vi.fn().mockResolvedValue({ data: {} }),
    getMany: overrides?.getMany ?? vi.fn().mockResolvedValue({ data: [] }),
    getManyReference:
      overrides?.getManyReference ?? vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: overrides?.create ?? vi.fn().mockResolvedValue({ data: {} }),
    update: overrides?.update ?? vi.fn().mockResolvedValue({ data: {} }),
    updateMany: overrides?.updateMany ?? vi.fn().mockResolvedValue({ data: [] }),
    delete: overrides?.delete ?? vi.fn().mockResolvedValue({ data: {} }),
    deleteMany: overrides?.deleteMany ?? vi.fn().mockResolvedValue({ data: [] }),
  };
}

// ============================================================================
// History Mock (for router testing)
// ============================================================================

/**
 * Create a mock History object for router testing
 * @param overrides - Properties to override on the history object
 */
export function createMockHistory(
  overrides?: Partial<{
    push: Mock;
    replace: Mock;
    go: Mock;
    goBack: Mock;
    goForward: Mock;
    listen: Mock;
    location: { pathname: string; search: string; hash: string; state: unknown };
    length: number;
    action: string;
  }>
): {
  push: Mock;
  replace: Mock;
  go: Mock;
  goBack: Mock;
  goForward: Mock;
  listen: Mock;
  location: { pathname: string; search: string; hash: string; state: unknown };
  length: number;
  action: string;
} {
  return {
    push: overrides?.push ?? vi.fn(),
    replace: overrides?.replace ?? vi.fn(),
    go: overrides?.go ?? vi.fn(),
    goBack: overrides?.goBack ?? vi.fn(),
    goForward: overrides?.goForward ?? vi.fn(),
    listen: overrides?.listen ?? vi.fn(() => vi.fn()),
    location: overrides?.location ?? { pathname: "/", search: "", hash: "", state: null },
    length: overrides?.length ?? 1,
    action: overrides?.action ?? "PUSH",
  };
}
