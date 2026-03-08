/**
 * SalesPermissionsTab Tests
 *
 * Verifies that SalesPermissionsTab:
 * 1. Renders role badge and status badge in view mode
 * 2. Shows role select, admin switch, and self-edit warning in edit mode
 * 3. Tracks dirty state via onDirtyChange callback
 * 4. Opens UserDisableReassignDialog when toggling disabled ON
 * 5. Shows password reset and remove user sections for admin (non-self) only
 * 6. Calls update("sales", ...) on save with formData and previousData
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { screen, waitFor, act } from "@testing-library/react";

// vi.hoisted ensures these are available inside vi.mock factories (which get hoisted)
const {
  mockUpdate,
  mockDeleteOne,
  mockNotify,
  mockRedirect,
  mockRefresh,
  mockGetIdentity,
  mockInvalidateIdentityCache,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDeleteOne: vi.fn(),
  mockNotify: vi.fn(),
  mockRedirect: vi.fn(),
  mockRefresh: vi.fn(),
  mockGetIdentity: vi.fn(),
  mockInvalidateIdentityCache: vi.fn(),
}));

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useUpdate: vi.fn(() => [mockUpdate, { isLoading: false }]),
    useDelete: vi.fn(() => [mockDeleteOne, { isPending: false }]),
    useNotify: vi.fn(() => mockNotify),
    useRedirect: vi.fn(() => mockRedirect),
    useRefresh: vi.fn(() => mockRefresh),
    useGetIdentity: mockGetIdentity,
    useDataProvider: vi.fn(() => ({
      resetUserPassword: vi.fn().mockResolvedValue({ success: true }),
    })),
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useUpdate: vi.fn(() => [mockUpdate, { isLoading: false }]),
    useDelete: vi.fn(() => [mockDeleteOne, { isPending: false }]),
    useNotify: vi.fn(() => mockNotify),
    useRedirect: vi.fn(() => mockRedirect),
    useRefresh: vi.fn(() => mockRefresh),
    useGetIdentity: mockGetIdentity,
    useDataProvider: vi.fn(() => ({
      resetUserPassword: vi.fn().mockResolvedValue({ success: true }),
    })),
  };
});

// Mock invalidateIdentityCache
vi.mock("../../providers/supabase/authProvider", () => ({
  invalidateIdentityCache: mockInvalidateIdentityCache,
}));

// Mock UserDisableReassignDialog
vi.mock("../UserDisableReassignDialog", () => ({
  UserDisableReassignDialog: ({
    open,
    onClose: _onClose,
    onSuccess: _onSuccess,
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => (open ? <div data-testid="disable-dialog">Dialog Open</div> : null),
}));

// Mock lucide-react icons (partial mock to preserve icons used by Select, etc.)
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    KeyRound: () => <span data-testid="icon-key" />,
    Trash2: () => <span data-testid="icon-trash" />,
  };
});

// Import after mocks
import { SalesPermissionsTab } from "../SalesPermissionsTab";
import type { Sale } from "@/atomic-crm/types";

// Base mock record
const mockRecord: Sale = {
  id: 2,
  user_id: "user-456",
  first_name: "Jane",
  last_name: "Smith",
  email: "jane@test.com",
  role: "rep",
  disabled: false,
};

describe("SalesPermissionsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: non-admin identity, different id from record
    mockGetIdentity.mockReturnValue({
      data: { id: 99, role: "admin" },
      isPending: false,
    });
  });

  // ===================================================================
  // View Mode
  // ===================================================================
  describe("View Mode", () => {
    test("renders role badge with correct styling for rep role", () => {
      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      const badge = screen.getByText("Rep");
      expect(badge).toBeDefined();
      expect(badge.className).toContain("border-muted-foreground");
      expect(badge.className).toContain("text-muted-foreground");
    });

    test('renders "Active" badge when disabled=false', () => {
      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      const badge = screen.getByText("Active");
      expect(badge).toBeDefined();
      expect(badge.className).toContain("border-success");
      expect(badge.className).toContain("text-success");
    });
  });

  // ===================================================================
  // Edit Mode Rendering
  // ===================================================================
  describe("Edit Mode Rendering", () => {
    test("shows Select with 3 role options (rep, manager, admin)", async () => {
      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="edit" />);

      // The SelectTrigger should show current value
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDefined();

      // Open the select to see options
      await act(async () => {
        trigger.click();
      });

      // Radix Select renders options as role="option"
      await waitFor(() => {
        const options = screen.getAllByRole("option");
        const optionTexts = options.map((o) => o.textContent);
        expect(optionTexts).toContain("Rep");
        expect(optionTexts).toContain("Manager");
        expect(optionTexts).toContain("Admin");
      });
    });

    test("shows administrator Switch that reflects role=admin state", () => {
      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="edit" />);

      // The administrator switch should exist; rep record means it should be unchecked
      const adminSwitch = document.getElementById("administrator") as HTMLButtonElement;
      expect(adminSwitch).toBeDefined();
      // For a rep role, the switch should show "Disabled" text
      expect(screen.getByText("Disabled")).toBeDefined();
    });

    test("shows self-edit warning when identity.id === record.id", () => {
      // Set identity to same id as record
      mockGetIdentity.mockReturnValue({
        data: { id: 2, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="edit" />);

      expect(
        screen.getByText((content) => content.includes("You cannot modify your own permissions"))
      ).toBeDefined();
    });
  });

  // ===================================================================
  // Form State
  // ===================================================================
  describe("Form State", () => {
    test("onDirtyChange fires when role changes", async () => {
      const onDirtyChange = vi.fn();

      renderWithAdminContext(
        <SalesPermissionsTab record={mockRecord} mode="edit" onDirtyChange={onDirtyChange} />
      );

      // Open the role select and pick a different value
      const trigger = screen.getByRole("combobox");
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
      });

      // Click the Manager option
      const managerOption = screen.getAllByRole("option").find((o) => o.textContent === "Manager");
      expect(managerOption).toBeDefined();

      await act(async () => {
        managerOption!.click();
      });

      await waitFor(() => {
        expect(onDirtyChange).toHaveBeenCalledWith(true);
      });
    });

    test("form resets when switching from edit to view mode (unmount/remount)", () => {
      const { rerender } = renderWithAdminContext(
        <SalesPermissionsTab record={mockRecord} mode="edit" />
      );

      // Remount in view mode
      rerender(<SalesPermissionsTab record={mockRecord} mode="view" />);

      // View mode should show the original record badge, not form fields
      expect(screen.getByText("Rep")).toBeDefined();
      // No combobox in view mode
      expect(screen.queryByRole("combobox")).toBeNull();
    });
  });

  // ===================================================================
  // Disable Toggle
  // ===================================================================
  describe("Disable Toggle", () => {
    test("toggling disabled ON shows UserDisableReassignDialog", async () => {
      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="edit" />);

      // Find the disabled switch
      const disabledSwitch = document.getElementById("disabled") as HTMLButtonElement;
      expect(disabledSwitch).toBeDefined();

      // Click to toggle disabled ON
      await act(async () => {
        disabledSwitch.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("disable-dialog")).toBeDefined();
      });
    });
  });

  // ===================================================================
  // Password Reset
  // ===================================================================
  describe("Password Reset", () => {
    test("password reset button visible only for admin identity + non-self record", () => {
      // Admin identity, different id
      mockGetIdentity.mockReturnValue({
        data: { id: 99, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      expect(screen.getByText("Send Reset Email")).toBeDefined();
      expect(screen.getByText("Password Management")).toBeDefined();
    });

    test("generate setup code button visible for admin viewing non-self record", () => {
      mockGetIdentity.mockReturnValue({
        data: { id: 99, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      expect(screen.getByText("Generate Setup Code")).toBeDefined();
    });

    test("generate setup code button NOT visible for self-edit", () => {
      mockGetIdentity.mockReturnValue({
        data: { id: 2, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      expect(screen.queryByText("Generate Setup Code")).toBeNull();
    });
  });

  // ===================================================================
  // Remove User
  // ===================================================================
  describe("Remove User", () => {
    test("remove button visible only for admin identity + non-self record", () => {
      mockGetIdentity.mockReturnValue({
        data: { id: 99, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      expect(screen.getByText("Danger Zone")).toBeDefined();
      expect(screen.getByText("Remove User")).toBeDefined();
    });

    test("self-delete blocked (isSelfEdit prevents remove)", () => {
      // Identity id matches record id
      mockGetIdentity.mockReturnValue({
        data: { id: 2, role: "admin" },
        isPending: false,
      });

      renderWithAdminContext(<SalesPermissionsTab record={mockRecord} mode="view" />);

      // Danger Zone and Remove User should NOT be visible for self-edit
      expect(screen.queryByText("Danger Zone")).toBeNull();
      expect(screen.queryByText("Remove User")).toBeNull();
    });
  });

  // ===================================================================
  // Save
  // ===================================================================
  describe("Save", () => {
    test('save calls update("sales", ...) with formData and previousData', async () => {
      // Make update resolve successfully
      mockUpdate.mockImplementation(
        (
          _resource: string,
          _params: Record<string, unknown>,
          callbacks: { onSuccess?: () => void }
        ) => {
          if (callbacks?.onSuccess) callbacks.onSuccess();
          return Promise.resolve();
        }
      );

      const onModeToggle = vi.fn();

      renderWithAdminContext(
        <SalesPermissionsTab record={mockRecord} mode="edit" onModeToggle={onModeToggle} />
      );

      // Submit the form
      const form = document.getElementById("slide-over-edit-form") as HTMLFormElement;
      expect(form).toBeDefined();

      await act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          "sales",
          {
            id: 2,
            data: { role: "rep", disabled: false },
            previousData: mockRecord,
          },
          expect.objectContaining({
            returnPromise: true,
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });
  });
});
