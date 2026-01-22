import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { NotificationDropdown } from "../NotificationDropdown";

describe("NotificationDropdown", () => {
  it("uses data provider instead of direct Supabase calls", async () => {
    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      update: vi.fn().mockResolvedValue({ data: {} }),
      updateMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    };

    const mockAuthProvider = {
      login: vi.fn().mockResolvedValue({}),
      logout: vi.fn().mockResolvedValue({}),
      checkAuth: vi.fn().mockResolvedValue({}),
      checkError: vi.fn().mockResolvedValue({}),
      getPermissions: vi.fn().mockResolvedValue({}),
      getIdentity: vi
        .fn()
        .mockResolvedValue({ id: "user-123", user_id: "user-123", fullName: "Test User" }),
    };

    renderWithAdminContext(
      <NotificationDropdown>
        <button>Open</button>
      </NotificationDropdown>,
      {
        dataProvider: mockDataProvider,
        authProvider: mockAuthProvider,
      }
    );

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith("notifications", expect.any(Object));
    });
  });
});
