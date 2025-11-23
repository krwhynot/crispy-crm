import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuickLogForm } from "../QuickLogForm";
import { AdminProvider } from "react-admin";

// Mock data
const mockContacts = [
  { id: 1, name: "John Doe", organization_id: 1, company_name: "Acme Corp" },
  { id: 2, name: "Jane Smith", organization_id: 2, company_name: "Tech Inc" },
  { id: 3, name: "Bob Wilson", organization_id: 1, company_name: "Acme Corp" },
  { id: 4, name: "Alice Brown", organization_id: 3, company_name: "Sales Co" },
];

const mockOrganizations = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Tech Inc" },
  { id: 3, name: "Sales Co" },
];

const mockOpportunities = [
  { id: 1, name: "Acme Deal 1", customer_organization_id: 1, stage: "prospect" },
  { id: 2, name: "Acme Deal 2", customer_organization_id: 1, stage: "qualified" },
  { id: 3, name: "Tech Deal", customer_organization_id: 2, stage: "prospect" },
  { id: 4, name: "Sales Deal", customer_organization_id: 3, stage: "proposal" },
];

// Mock providers
const mockDataProvider = {
  getList: vi.fn((resource: string) => {
    switch (resource) {
      case "contacts":
        return Promise.resolve({ data: mockContacts, total: mockContacts.length });
      case "organizations":
        return Promise.resolve({ data: mockOrganizations, total: mockOrganizations.length });
      case "opportunities":
        return Promise.resolve({ data: mockOpportunities, total: mockOpportunities.length });
      default:
        return Promise.resolve({ data: [], total: 0 });
    }
  }),
  create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
};

const mockNotify = vi.fn();

// Mock hooks
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    AdminProvider: actual.AdminProvider,
    useDataProvider: () => mockDataProvider,
    useNotify: () => mockNotify,
  };
});

vi.mock("../../hooks/useCurrentSale", () => ({
  useCurrentSale: () => ({ salesId: 1, loading: false, error: null }),
}));

// Helper function to render component with required providers
const renderQuickLogForm = () => {
  const onComplete = vi.fn();
  const onRefresh = vi.fn();

  return render(
    <AdminProvider dataProvider={mockDataProvider as any}>
      <QuickLogForm onComplete={onComplete} onRefresh={onRefresh} />
    </AdminProvider>
  );
};

describe("QuickLogForm - Cascading Filter Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Anchor Organization Pattern", () => {
    it("should filter contacts when organization is selected first", async () => {
      renderQuickLogForm();

      // Wait for data to load
      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          expect.objectContaining({ resource: "organizations" })
        );
      });

      // Select Acme Corp organization
      const orgButton = screen.getByRole("combobox", { name: /organization/i });
      fireEvent.click(orgButton);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Acme Corp"));

      // Open contact dropdown
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);

      // Should only show contacts from Acme Corp
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
      });

      // Should NOT show contacts from other organizations
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
      expect(screen.queryByText("Alice Brown")).not.toBeInTheDocument();
    });

    it("should lock organization when contact is selected", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select John Doe from Acme Corp
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("John Doe"));

      // Open organization dropdown
      const orgButton = screen.getByRole("combobox", { name: /organization/i });
      fireEvent.click(orgButton);

      // Should only show Acme Corp (filtered, not just sorted)
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Should NOT show other organizations
      expect(screen.queryByText("Tech Inc")).not.toBeInTheDocument();
      expect(screen.queryByText("Sales Co")).not.toBeInTheDocument();
    });

    it("should filter opportunities based on selected organization", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select Tech Inc organization
      const orgButton = screen.getByRole("combobox", { name: /organization/i });
      fireEvent.click(orgButton);

      await waitFor(() => {
        expect(screen.getByText("Tech Inc")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Tech Inc"));

      // Open opportunity dropdown
      const oppButton = screen.getByRole("combobox", { name: /opportunity/i });
      fireEvent.click(oppButton);

      // Should only show Tech Inc opportunities
      await waitFor(() => {
        expect(screen.getByText("Tech Deal")).toBeInTheDocument();
      });

      // Should NOT show opportunities from other organizations
      expect(screen.queryByText("Acme Deal 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Sales Deal")).not.toBeInTheDocument();
    });
  });

  describe("Clear Button Functionality", () => {
    it("should have clear buttons for all dropdowns", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select values for all dropdowns
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);
      await waitFor(() => screen.getByText("John Doe"));
      fireEvent.click(screen.getByText("John Doe"));

      // All dropdowns should have clear buttons
      expect(screen.getByLabelText("Clear contact selection")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear organization selection")).toBeInTheDocument();

      // Select opportunity to test its clear button
      const oppButton = screen.getByRole("combobox", { name: /opportunity/i });
      fireEvent.click(oppButton);
      await waitFor(() => screen.getByText("Acme Deal 1"));
      fireEvent.click(screen.getByText("Acme Deal 1"));

      expect(screen.getByLabelText("Clear opportunity selection")).toBeInTheDocument();
    });

    it("should clear dependent fields when parent is cleared", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select contact (which auto-fills organization)
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);
      await waitFor(() => screen.getByText("John Doe"));
      fireEvent.click(screen.getByText("John Doe"));

      // Select opportunity
      const oppButton = screen.getByRole("combobox", { name: /opportunity/i });
      fireEvent.click(oppButton);
      await waitFor(() => screen.getByText("Acme Deal 1"));
      fireEvent.click(screen.getByText("Acme Deal 1"));

      // Clear contact
      const clearContactButton = screen.getByLabelText("Clear contact selection");
      fireEvent.click(clearContactButton);

      // Organization and opportunity should also be cleared
      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
        expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
        expect(screen.queryByText("Acme Deal 1")).not.toBeInTheDocument();
      });
    });
  });

  describe("Auto-clear on Mismatch", () => {
    it("should clear contact when selecting mismatched organization", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select John Doe from Acme Corp
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);
      await waitFor(() => screen.getByText("John Doe"));
      fireEvent.click(screen.getByText("John Doe"));

      // Try to select Tech Inc (different org)
      const orgButton = screen.getByRole("combobox", { name: /organization/i });
      fireEvent.click(orgButton);

      // Should only see Acme Corp (filtered)
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.queryByText("Tech Inc")).not.toBeInTheDocument();
      });
    });

    it("should clear contact when selecting opportunity from different org", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      // Select John Doe from Acme Corp
      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      fireEvent.click(contactButton);
      await waitFor(() => screen.getByText("John Doe"));
      fireEvent.click(screen.getByText("John Doe"));

      // Opportunities should be filtered to Acme only
      const oppButton = screen.getByRole("combobox", { name: /opportunity/i });
      fireEvent.click(oppButton);

      await waitFor(() => {
        expect(screen.getByText("Acme Deal 1")).toBeInTheDocument();
        expect(screen.queryByText("Tech Deal")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on comboboxes", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      const contactButton = screen.getByRole("combobox", { name: /contact/i });
      const orgButton = screen.getByRole("combobox", { name: /organization/i });
      const oppButton = screen.getByRole("combobox", { name: /opportunity/i });

      // Check for required ARIA attributes
      expect(contactButton).toHaveAttribute("aria-expanded", "false");
      expect(contactButton).toHaveAttribute("aria-haspopup", "listbox");
      expect(contactButton).toHaveAttribute("aria-controls");

      expect(orgButton).toHaveAttribute("aria-expanded", "false");
      expect(orgButton).toHaveAttribute("aria-haspopup", "listbox");
      expect(orgButton).toHaveAttribute("aria-controls");

      expect(oppButton).toHaveAttribute("aria-expanded", "false");
      expect(oppButton).toHaveAttribute("aria-haspopup", "listbox");
      expect(oppButton).toHaveAttribute("aria-controls");
    });

    it("should update aria-expanded when dropdowns open", async () => {
      renderQuickLogForm();

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      const contactButton = screen.getByRole("combobox", { name: /contact/i });

      // Initially closed
      expect(contactButton).toHaveAttribute("aria-expanded", "false");

      // Open dropdown
      fireEvent.click(contactButton);

      // Should be expanded
      expect(contactButton).toHaveAttribute("aria-expanded", "true");
    });
  });
});