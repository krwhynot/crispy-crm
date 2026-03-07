import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SettingsPage } from "../SettingsPage";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetIdentity: vi.fn(() => ({
      data: { id: 1, fullName: "Test Admin", role: "admin" },
      isPending: false,
      refetch: vi.fn(),
    })),
    useGetOne: vi.fn(() => ({
      data: { id: 1, first_name: "Test", last_name: "Admin", email: "admin@test.com" },
      refetch: vi.fn(),
    })),
    useNotify: () => vi.fn(),
    useDataProvider: () => ({
      updatePassword: vi.fn().mockResolvedValue({}),
    }),
    Form: ({
      children,
      onSubmit: _onSubmit,
    }: {
      children: React.ReactNode;
      onSubmit?: unknown;
      [key: string]: unknown;
    }) => (
      <form
        data-testid="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {children}
      </form>
    ),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: ({
      mutationFn: _mutationFn,
    }: {
      mutationFn: () => Promise<unknown>;
      [key: string]: unknown;
    }) => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("../useSalesUpdate", () => ({
  useSalesUpdate: () => ({ mutate: vi.fn() }),
}));

vi.mock("../SettingsLayout", () => ({
  SettingsLayout: ({
    sections,
  }: {
    sections: Array<{ id: string; label: string; component: React.ReactNode }>;
  }) => (
    <div data-testid="settings-layout">
      {sections.map((s) => (
        <div key={s.id} data-testid={`section-${s.id}`}>
          <h2>{s.label}</h2>
          {s.component}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../PersonalSection", () => ({
  PersonalSection: () => <div data-testid="personal-section">Personal</div>,
}));

vi.mock("../NotificationsSection", () => ({
  NotificationsSection: () => <div data-testid="notifications-section">Notifications</div>,
}));

vi.mock("../SecuritySection", () => ({
  SecuritySection: ({ onPasswordChange }: { onPasswordChange: () => void }) => (
    <div data-testid="security-section">
      <button onClick={onPasswordChange}>Change Password</button>
    </div>
  ),
}));

vi.mock("../AuditLogSection", () => ({
  AuditLogSection: () => <div data-testid="audit-section">Audit</div>,
}));

vi.mock("../UsersSection", () => ({
  UsersSection: () => <div data-testid="users-section">Users</div>,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders settings layout with all sections for admin", async () => {
    renderWithAdminContext(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-layout")).toBeInTheDocument();
      expect(screen.getByTestId("section-personal")).toBeInTheDocument();
      expect(screen.getByTestId("section-notifications")).toBeInTheDocument();
      expect(screen.getByTestId("section-security")).toBeInTheDocument();
      expect(screen.getByTestId("section-users")).toBeInTheDocument();
      expect(screen.getByTestId("section-audit")).toBeInTheDocument();
    });
  });

  test("renders section labels", async () => {
    renderWithAdminContext(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Personal").length).toBeGreaterThan(0);
      expect(screen.getByText("Team")).toBeInTheDocument();
      expect(screen.getByText("Activity Log")).toBeInTheDocument();
    });
  });
});
