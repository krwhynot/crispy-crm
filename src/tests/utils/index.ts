/**
 * Test Utilities Index
 *
 * Re-exports all test utilities for convenient importing in test files.
 *
 * @example
 * ```tsx
 * import { renderWithAdminContext, createMockOpportunity } from '@/tests/utils';
 * ```
 */

// Render utilities
export {
  renderWithAdminContext,
  renderWithRecordContext,
  waitForMutation,
  type RenderAdminOptions,
  type RenderAdminResult,
} from "./render-admin";

// Mock providers and factories
export {
  createMockDataProvider,
  createMockAuthProvider,
  createMockOpportunity,
  createMockContact,
  createMockOrganization,
  createMockProduct,
  createMockTask,
  createServerError,
  createRLSViolationError,
  createNetworkError,
  createValidationError,
  createRejectedDataProvider,
} from "./mock-providers";

// Setup utilities
export { createTestQueryClient } from "../setup";

// Combobox test helpers
export {
  selectComboboxOption,
  changeComboboxOption,
  typeInCombobox,
  clearCombobox,
  findComboboxByLabel,
  selectComboboxByLabel,
  selectCityAndVerifyState,
  type ComboboxTestOptions,
} from "./combobox";

// Typed mock helpers for React Admin hooks
export {
  mockUseGetList,
  mockUseGetListReturn,
  mockUseGetOne,
  mockUseGetOneReturn,
  mockUseCreate,
  mockUseCreateReturn,
  mockUseDelete,
  mockUseDeleteReturn,
  mockUseGetIdentity,
  mockUseGetIdentityReturn,
  type MockIdentity,
  type GetListParams,
} from "./typed-mocks";

// Typed test helpers for eliminating `: any` patterns
export {
  mapExportRows,
  getFilterValue,
  createMockSetState,
  type MockSetState,
  type MockGetListImpl,
  type MockDataProviderMethod,
  type HookState,
} from "./typed-test-helpers";
