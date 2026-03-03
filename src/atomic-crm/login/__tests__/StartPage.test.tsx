import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { StartPage } from "../StartPage";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useLogin: () => vi.fn().mockResolvedValue(undefined),
    useNotify: () => vi.fn(),
    Form: ({
      children,
      onSubmit,
    }: {
      children: React.ReactNode;
      onSubmit?: unknown;
      [key: string]: unknown;
    }) => (
      <form
        data-testid="login-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {children}
      </form>
    ),
  };
});

vi.mock("@/atomic-crm/root/ConfigurationContext", () => ({
  useAppBranding: () => ({
    darkModeLogo: "/logo.png",
    title: "Crispy CRM",
  }),
}));

vi.mock("@/components/ra-wrappers/text-input", () => ({
  TextInput: ({ source, label, type }: { source: string; label: string; type?: string }) => (
    <div>
      <label htmlFor={source}>{label}</label>
      <input id={source} name={source} type={type || "text"} data-testid={`input-${source}`} />
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/notification", () => ({
  Notification: () => <div data-testid="notification" />,
}));

describe("StartPage (Login)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders 'Sign in' heading", async () => {
    renderWithAdminContext(<StartPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  test("renders email and password inputs", async () => {
    renderWithAdminContext(<StartPage />);

    await waitFor(() => {
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
    });
  });

  test("renders submit button", async () => {
    renderWithAdminContext(<StartPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  test("renders 'Forgot your password?' link", async () => {
    renderWithAdminContext(<StartPage />);

    await waitFor(() => {
      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    });
  });
});
