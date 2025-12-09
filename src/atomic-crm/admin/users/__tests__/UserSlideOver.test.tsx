import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { UserSlideOver } from "../UserSlideOver";

const mockUser = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@mfb.com",
  role: "rep",
  disabled: false,
};

describe("UserSlideOver", () => {
  it("renders edit form with user data", async () => {
    renderWithAdminContext(<UserSlideOver />, {
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({ data: mockUser }),
      },
      resource: "sales",
      record: mockUser,
      initialEntries: ["/admin/users/1"],
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
      expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    });
  });

  it("displays email as read-only", async () => {
    renderWithAdminContext(<UserSlideOver />, {
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({ data: mockUser }),
      },
      resource: "sales",
      record: mockUser,
    });

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeDisabled();
    });
  });

  it("allows role selection", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(<UserSlideOver />, {
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({ data: mockUser }),
      },
      resource: "sales",
      record: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    // Verify role options exist
    const roleSelect = screen.getByLabelText(/role/i);
    await user.click(roleSelect);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(screen.getByText("Rep")).toBeInTheDocument();
  });

  it("has disable account toggle", async () => {
    renderWithAdminContext(<UserSlideOver />, {
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({ data: mockUser }),
      },
      resource: "sales",
      record: mockUser,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/disabled/i)).toBeInTheDocument();
    });
  });
});
