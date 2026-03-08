/**
 * SalesCreate Smoke, Permission, & Error Handling Tests
 *
 * Verifies that SalesCreate:
 * 1. Renders without throwing errors (smoke test)
 * 2. Shows skeleton while checking permissions
 * 3. Renders form fields when authorized
 * 4. Schema validation (password now optional)
 * 5. Mutation error handler maps HttpError to notify calls
 * 6. Email conflict (duplicate) errors produce correct user message
 * 7. Recovery URL dialog shown on successful creation
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { screen, waitFor, act } from "@testing-library/react";

// vi.hoisted ensures these are available inside vi.mock factories (which get hoisted)
const { mockCanAccess, mockNotify, mockRedirect, mockMutate, capturedMutationConfig } = vi.hoisted(
  () => ({
    mockCanAccess: vi.fn(),
    mockNotify: vi.fn(),
    mockRedirect: vi.fn(),
    mockMutate: vi.fn(),
    // Capture the config passed to useMutation so we can invoke onError directly
    capturedMutationConfig: { current: null as Record<string, unknown> | null },
  })
);

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useCanAccess: mockCanAccess,
    useDataProvider: vi.fn(() => ({
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      invoke: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    })),
    useNotify: vi.fn(() => mockNotify),
    useRedirect: vi.fn(() => mockRedirect),
    useGetIdentity: vi.fn(() => ({
      data: { id: 1, fullName: "Admin User", sales_id: 1 },
      isPending: false,
    })),
    useRecordContext: vi.fn(() => null),
    Title: ({ title }: { title: string }) => <title>{title}</title>,
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useCanAccess: mockCanAccess,
    useDataProvider: vi.fn(() => ({
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      invoke: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    })),
    useNotify: vi.fn(() => mockNotify),
    useRedirect: vi.fn(() => mockRedirect),
    useGetIdentity: vi.fn(() => ({
      data: { id: 1, fullName: "Admin User", sales_id: 1 },
      isPending: false,
    })),
    useRecordContext: vi.fn(() => null),
  };
});

// Mock TanStack Query — capture useMutation config for onError testing
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: vi.fn((config: Record<string, unknown>) => {
      // Capture the config so tests can invoke onError/onSuccess directly
      capturedMutationConfig.current = config;
      return {
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      };
    }),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

// Mock react-hook-form (SalesFormContent uses useFormContext + useFormState)
vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useFormContext: vi.fn(() => ({
      setError: vi.fn(),
      clearErrors: vi.fn(),
      watch: vi.fn(),
      getValues: vi.fn(() => ({})),
      formState: { errors: {}, isSubmitting: false, isDirty: false },
    })),
    useFormState: vi.fn(() => ({
      errors: {},
      isSubmitting: false,
      isDirty: false,
      isValid: true,
      dirtyFields: {},
      touchedFields: {},
    })),
  };
});

// Mock component dependencies
vi.mock("@/components/ra-wrappers/simple-form", () => ({
  SimpleForm: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
    <form data-testid="simple-form">{children}</form>
  ),
}));

vi.mock("@/components/ra-wrappers/FormErrorSummary", () => ({
  FormErrorSummary: () => <div data-testid="form-error-summary" />,
}));

vi.mock("@/components/ra-wrappers/SectionCard", () => ({
  SectionCard: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid={`section-card-${title || "default"}`}>{children}</div>
  ),
}));

vi.mock("@/components/ui/list-skeleton", () => ({
  SalesListSkeleton: () => <div data-testid="sales-skeleton">Loading...</div>,
}));

vi.mock("@/hooks/useUnsavedChangesWarning", () => ({
  useUnsavedChangesWarning: vi.fn(),
}));

vi.mock("../SalesInputs", () => ({
  SalesInputs: () => (
    <div data-testid="sales-inputs">
      <input data-testid="input-first_name" name="first_name" />
      <input data-testid="input-last_name" name="last_name" />
      <input data-testid="input-email" name="email" />
    </div>
  ),
}));

// Mock Dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="recovery-dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Import after mocks
import SalesCreate from "../SalesCreate";
import { createSalesSchema } from "../../validation/sales";

describe("SalesCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMutationConfig.current = null;
  });

  describe("permission gating", () => {
    test("shows skeleton while permission check is pending", () => {
      mockCanAccess.mockReturnValue({ isPending: true, canAccess: false });

      renderWithAdminContext(<SalesCreate />);

      expect(screen.getByTestId("sales-skeleton")).toBeDefined();
    });

    test("renders null when access is denied", () => {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: false });

      const { container } = renderWithAdminContext(<SalesCreate />);

      // Should render nothing when unauthorized
      expect(container.querySelector("[data-testid='simple-form']")).toBeNull();
    });
  });

  describe("form rendering", () => {
    test("renders form when authorized (smoke test)", () => {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: true });

      expect(() => {
        renderWithAdminContext(<SalesCreate />);
      }).not.toThrow();
    });

    test("renders form with SalesInputs when authorized", async () => {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: true });

      renderWithAdminContext(<SalesCreate />);

      await waitFor(() => {
        expect(screen.getByTestId("sales-inputs")).toBeDefined();
      });
    });

    test("renders FormErrorSummary for server error display", async () => {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: true });

      renderWithAdminContext(<SalesCreate />);

      await waitFor(() => {
        expect(screen.getByTestId("form-error-summary")).toBeDefined();
      });
    });
  });

  describe("schema validation (createSalesSchema)", () => {
    test("accepts form data without password (recovery link flow)", () => {
      const result = createSalesSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      });

      expect(result.success).toBe(true);
    });

    test("still accepts password if provided", () => {
      const result = createSalesSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "validpass",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("mutation error handling", () => {
    /**
     * Helper: render the component to capture useMutation config,
     * then return the onError callback for direct invocation.
     */
    function getOnError(): (error: Error) => void {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: true });
      renderWithAdminContext(<SalesCreate />);

      expect(capturedMutationConfig.current).not.toBeNull();
      const onError = capturedMutationConfig.current?.onError as (error: Error) => void;
      expect(typeof onError).toBe("function");
      return onError;
    }

    test("HttpError with body.errors maps to notify with root server error", () => {
      const onError = getOnError();

      // Simulate HttpError from service layer (409 email conflict)
      const httpError = Object.assign(new Error("User already registered"), {
        status: 409,
        body: {
          errors: {
            root: { serverError: "A user with this email already exists." },
            email: "This email is already registered.",
          },
        },
      });

      act(() => {
        onError(httpError);
      });

      // Should notify with the root.serverError message
      expect(mockNotify).toHaveBeenCalledWith("A user with this email already exists.", {
        type: "error",
      });
    });

    test("duplicate email error without HttpError format shows user-friendly message", () => {
      const onError = getOnError();

      // Simulate plain Error with "already exists" in message
      const error = new Error("User already exists in the system");

      act(() => {
        onError(error);
      });

      expect(mockNotify).toHaveBeenCalledWith("A user with this email already exists.", {
        type: "error",
      });
    });

    test("authentication error redirects to login", () => {
      const onError = getOnError();

      const authError = new Error("Not authenticated");

      act(() => {
        onError(authError);
      });

      expect(mockNotify).toHaveBeenCalledWith("Your session has expired. Please log in again.", {
        type: "error",
      });
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    test("generic error shows fallback message", () => {
      const onError = getOnError();

      const genericError = new Error("Network failure");

      act(() => {
        onError(genericError);
      });

      expect(mockNotify).toHaveBeenCalledWith("An error occurred while creating the user.", {
        type: "error",
      });
    });
  });

  describe("recovery URL dialog", () => {
    function getOnSuccess(): (result: {
      sale: unknown;
      recoveryUrl: string | null;
      emailOtp: string | null;
    }) => void {
      mockCanAccess.mockReturnValue({ isPending: false, canAccess: true });
      renderWithAdminContext(<SalesCreate />);

      expect(capturedMutationConfig.current).not.toBeNull();
      const onSuccess = capturedMutationConfig.current?.onSuccess as (result: {
        sale: unknown;
        recoveryUrl: string | null;
        emailOtp: string | null;
      }) => void;
      expect(typeof onSuccess).toBe("function");
      return onSuccess;
    }

    test("shows recovery URL dialog when recoveryUrl is returned", async () => {
      const onSuccess = getOnSuccess();

      act(() => {
        onSuccess({
          sale: { id: 1 },
          recoveryUrl: "https://example.com/recovery",
          emailOtp: "847293",
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("recovery-dialog")).toBeDefined();
        expect(screen.getByText("User Created Successfully")).toBeDefined();
      });
    });

    test("redirects when no recovery URL returned (fallback path)", () => {
      const onSuccess = getOnSuccess();

      act(() => {
        onSuccess({ sale: { id: 1 }, recoveryUrl: null, emailOtp: null });
      });

      expect(mockNotify).toHaveBeenCalledWith(
        "User created. Use 'Generate Setup Code' on their profile to get a code.",
        { type: "success" }
      );
      expect(mockRedirect).toHaveBeenCalledWith("/sales");
    });
  });
});
