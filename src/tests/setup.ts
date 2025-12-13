/**
 * Global Test Setup
 *
 * Configures test environment with necessary polyfills, mocks, and global settings.
 * This file is automatically loaded by Vitest before running tests.
 */

import "@testing-library/jest-dom";
import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import "../index.css"; // Import CSS to make spacing tokens available in tests

// Global Supabase Mock - Must be set up before any imports
// This prevents "supabase.from is not a function" errors
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve) =>
      resolve({ data: [], error: null, count: 0, status: 200, statusText: "OK" })
    ),
  })),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id", email: "test@example.com" },
        },
      },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: { id: "test-user-id", email: "test@example.com" },
      },
      error: null,
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" }, session: {} },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: "https://example.com/test.jpg" },
      })),
    })),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock @supabase/supabase-js module globally
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

/**
 * Global React Admin Mock
 *
 * Provides sensible defaults for all commonly used react-admin exports.
 * Individual tests can override specific hooks using vi.mocked() or by
 * defining their own vi.mock("react-admin", ...) which will take precedence.
 *
 * This prevents "No X export is defined on the react-admin mock" errors
 * when tests mock react-admin partially but other code imports different exports.
 */
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-admin")>();

  return {
    // Spread all actual exports to preserve types, components, utilities
    ...actual,

    // Mock hooks with sensible defaults - these are the most commonly mocked
    useDataProvider: vi.fn(() => ({
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: null }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [] }),
    })),

    useGetList: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),

    useGetOne: vi.fn(() => ({
      data: null,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),

    useGetMany: vi.fn(() => ({
      data: [],
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })),

    useCreate: vi.fn(() => [vi.fn().mockResolvedValue({ data: { id: 1 } }), { isPending: false, isLoading: false }]),

    useUpdate: vi.fn(() => [vi.fn().mockResolvedValue({ data: { id: 1 } }), { isPending: false, isLoading: false }]),

    useDelete: vi.fn(() => [vi.fn().mockResolvedValue({ data: { id: 1 } }), { isPending: false, isLoading: false }]),

    useNotify: vi.fn(() => vi.fn()),

    useRefresh: vi.fn(() => vi.fn()),

    useRedirect: vi.fn(() => vi.fn()),

    useRecordContext: vi.fn(() => null),

    useGetIdentity: vi.fn(() => ({
      data: { id: "test-user-id", fullName: "Test User" },
      isPending: false,
      isLoading: false,
      error: null,
    })),

    useCreatePath: vi.fn(() => vi.fn((opts: any) => `/${opts?.resource}/${opts?.id}`)),
  };
});

// Global QueryClient configuration for tests
// Disable retries and set short stale times for faster tests
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0, // Immediately garbage collect to avoid cache pollution between tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Suppress React Query errors in tests
    },
  });

// Mock window.matchMedia for responsive tests
// Required for components that check media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated but some libraries still use
    removeListener: () => {}, // Deprecated but some libraries still use
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver for virtualized lists
// Required for components using react-virtual or similar libraries
class IntersectionObserverMock {
  observe = () => null;
  disconnect = () => null;
  unobserve = () => null;
  takeRecords = () => [];
  root = null;
  rootMargin = "";
  thresholds = [];
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver for components that observe element size changes
class ResizeObserverMock {
  observe = () => null;
  disconnect = () => null;
  unobserve = () => null;
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// Mock scrollTo for components that programmatically scroll
window.scrollTo = () => {};

// Mock HTMLElement.prototype.scrollIntoView
HTMLElement.prototype.scrollIntoView = () => {};

// Mock Pointer Capture API for Radix UI Select component
// jsdom doesn't support these methods, but Radix UI's Select uses them
// This prevents "target.hasPointerCapture is not a function" errors in tests
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn();
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}

// Mock PointerEvent for Radix UI Select component
// jsdom doesn't implement PointerEvent, but Radix UI relies on it to open dropdowns
// Without this, fireEvent.pointerDown and userEvent.click won't trigger Select to open
// Reference: https://github.com/shadcn-ui/ui/discussions/4168
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;
  pointerId: number;
  pressure: number;
  width: number;
  height: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.button = props.button ?? 0;
    this.ctrlKey = props.ctrlKey ?? false;
    this.pointerType = props.pointerType ?? "mouse";
    this.pointerId = props.pointerId ?? 1;
    this.pressure = props.pressure ?? 0;
    this.width = props.width ?? 1;
    this.height = props.height ?? 1;
  }
}

// Only set if not already defined (avoid breaking real browser environments)
if (typeof window.PointerEvent === "undefined") {
  window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
}
