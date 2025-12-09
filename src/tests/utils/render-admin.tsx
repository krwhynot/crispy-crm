/**
 * React Admin Component Testing Utilities
 *
 * Provides helper functions for rendering React Admin components in tests
 * with all necessary providers (AdminContext, QueryClient, RecordContext, etc.)
 */

import type { ReactElement } from "react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { DataProvider, AuthProvider, I18nProvider } from "ra-core";
import { CoreAdminContext, RecordContextProvider, ResourceContextProvider } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { createTestQueryClient } from "../setup";
import { createMockDataProvider, createMockAuthProvider } from "./mock-providers";

// Default i18n provider for tests
const defaultI18nProvider = polyglotI18nProvider(() => englishMessages, "en");

/**
 * Options for renderWithAdminContext
 */
export interface RenderAdminOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Data provider to use (defaults to mock provider)
   * Can be partial - only override methods you need
   */
  dataProvider?: Partial<DataProvider>;

  /**
   * Auth provider to use (defaults to mock provider with "user" role)
   */
  authProvider?: AuthProvider;

  /**
   * QueryClient instance (defaults to createTestQueryClient())
   */
  queryClient?: QueryClient;

  /**
   * Resource name for ResourceContextProvider
   */
  resource?: string;

  /**
   * Record data for RecordContextProvider
   */
  record?: any;

  /**
   * User role for mock auth provider
   */
  userRole?: "admin" | "user";

  /**
   * Is user authenticated (defaults to true)
   */
  isAuthenticated?: boolean;

  /**
   * I18n provider (defaults to English)
   */
  i18nProvider?: I18nProvider;

  /**
   * Initial route entries for MemoryRouter (defaults to ["/"])
   */
  initialEntries?: string[];
}

/**
 * Extended render result with test helpers
 */
export interface RenderAdminResult extends RenderResult {
  queryClient: QueryClient;
  dataProvider: DataProvider;
  authProvider: AuthProvider;
}

/**
 * Render a component wrapped in AdminContext with all necessary providers
 *
 * @example
 * ```tsx
 * const { getByLabelText } = renderWithAdminContext(<OpportunityCreate />, {
 *   dataProvider: {
 *     create: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test' } })
 *   },
 *   userRole: 'admin'
 * });
 * ```
 */
export function renderWithAdminContext(
  ui: ReactElement,
  options: RenderAdminOptions = {}
): RenderAdminResult {
  const {
    dataProvider: dataProviderOverrides,
    authProvider: authProviderOption,
    queryClient: queryClientOption,
    i18nProvider: i18nProviderOption,
    resource,
    record,
    userRole = "user",
    isAuthenticated = true,
    initialEntries = ["/"],
    ...renderOptions
  } = options;

  // Create QueryClient instance (real, not mocked - required for cache operations)
  const queryClient = queryClientOption || createTestQueryClient();

  // Create data provider with overrides merged into defaults
  const dataProvider = createMockDataProvider(dataProviderOverrides);

  // Create auth provider
  const authProvider =
    authProviderOption || createMockAuthProvider({ role: userRole, isAuthenticated });

  // Use provided i18n or default
  const i18nProvider = i18nProviderOption || defaultI18nProvider;

  // Wrapper component with all necessary providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <CoreAdminContext
          dataProvider={dataProvider}
          authProvider={authProvider}
          i18nProvider={i18nProvider}
        >
          {resource ? (
            <ResourceContextProvider value={resource}>
              {record ? (
                <RecordContextProvider value={record}>{children}</RecordContextProvider>
              ) : (
                children
              )}
            </ResourceContextProvider>
          ) : record ? (
            <RecordContextProvider value={record}>{children}</RecordContextProvider>
          ) : (
            children
          )}
        </CoreAdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    queryClient,
    dataProvider,
    authProvider,
  };
}

/**
 * Render a component with RecordContext and ResourceContext
 *
 * Useful for testing components that use useRecordContext() or useResourceContext()
 * without needing full AdminContext
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithRecordContext(<ContactShow />, {
 *   record: { id: 1, first_name: 'John', last_name: 'Doe' },
 *   resource: 'contacts'
 * });
 * ```
 */
export function renderWithRecordContext(
  ui: ReactElement,
  options: {
    record: any;
    resource?: string;
    queryClient?: QueryClient;
  } & Omit<RenderOptions, "wrapper">
): RenderAdminResult {
  const { record, resource, queryClient: queryClientOption, ...renderOptions } = options;

  const queryClient = queryClientOption || createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {resource ? (
        <ResourceContextProvider value={resource}>
          <RecordContextProvider value={record}>{children}</RecordContextProvider>
        </ResourceContextProvider>
      ) : (
        <RecordContextProvider value={record}>{children}</RecordContextProvider>
      )}
    </QueryClientProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  // Return minimal providers for this context
  return {
    ...renderResult,
    queryClient,
    dataProvider: createMockDataProvider(),
    authProvider: createMockAuthProvider(),
  };
}

/**
 * Wait for React Admin's optimistic/pessimistic updates to complete
 *
 * Useful when testing mutations that update the UI
 *
 * @example
 * ```tsx
 * await userEvent.click(screen.getByRole('button', { name: /save/i }));
 * await waitForMutation();
 * expect(mockDataProvider.create).toHaveBeenCalled();
 * ```
 */
export async function waitForMutation(timeout = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
