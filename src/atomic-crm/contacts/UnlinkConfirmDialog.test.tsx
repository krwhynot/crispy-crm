// src/atomic-crm/contacts/UnlinkConfirmDialog.test.tsx
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { UnlinkConfirmDialog } from "./UnlinkConfirmDialog";
import { vi } from "vitest";
import type * as ReactAdmin from "react-admin";

// Mock react-admin hooks - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useDelete: () => [vi.fn(), { isLoading: false }],
    useNotify: () => vi.fn(),
  };
});

describe("UnlinkConfirmDialog", () => {
  const mockOpportunity = {
    id: 10,
    name: "Deal A",
    junctionId: "j1",
  };

  it("renders when opportunity is set", () => {
    renderWithAdminContext(
      <UnlinkConfirmDialog
        opportunity={mockOpportunity}
        contactName="Jane Doe"
        contactId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Remove contact from opportunity/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Deal A/)).toBeInTheDocument();
  });

  it("does not render when opportunity is null", () => {
    renderWithAdminContext(
      <UnlinkConfirmDialog
        opportunity={null}
        contactName="Jane Doe"
        contactId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText(/Remove contact from opportunity/i)).not.toBeInTheDocument();
  });
});
