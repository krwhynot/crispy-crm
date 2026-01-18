import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import { EntitySelectionSection } from "../EntitySelectionSection";
import type { UseEntitySelectionReturn } from "../../hooks/useEntitySelection";

// Mock SidepaneSection
vi.mock("@/components/layouts/sidepane", () => ({
  SidepaneSection: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div data-testid="sidepane-section" data-label={label}>
      {children}
    </div>
  ),
}));

// Mock EntityCombobox
vi.mock("../EntityCombobox", () => ({
  EntityCombobox: ({
    label,
    listId,
    onSelect,
    onClear,
    options,
    placeholder,
  }: {
    label: string;
    listId: string;
    onSelect?: (option: { id: number; name: string }) => void;
    onClear?: () => void;
    options: Array<{ id: number; name: string }>;
    placeholder: string;
  }) => (
    <div data-testid={`entity-combobox-${label.toLowerCase()}`} data-list-id={listId}>
      <span data-testid={`label-${label.toLowerCase()}`}>{label}</span>
      <span data-testid={`placeholder-${label.toLowerCase()}`}>{placeholder}</span>
      <span data-testid={`options-count-${label.toLowerCase()}`}>{options.length}</span>
      <button
        data-testid={`select-${label.toLowerCase()}`}
        onClick={() => onSelect?.({ id: 1, name: "Test" })}
      >
        Select
      </button>
      <button data-testid={`clear-${label.toLowerCase()}`} onClick={() => onClear?.()}>
        Clear
      </button>
    </div>
  ),
}));

// Create mock handlers
function createMockHandlers(): UseEntitySelectionReturn {
  return {
    handleContactSelect: vi.fn(),
    handleContactClear: vi.fn(),
    handleOrganizationSelect: vi.fn(),
    handleOrganizationClear: vi.fn(),
  };
}

// Create mock entity data
function createMockEntityData() {
  return {
    filteredContacts: [
      { id: 1, name: "John Doe", company_name: "Acme Corp" },
      { id: 2, name: "Jane Smith", company_name: "TechCo" },
    ],
    filteredOrganizations: [
      { id: 1, name: "Acme Corp" },
      { id: 2, name: "TechCo" },
    ],
    filteredOpportunities: [{ id: 1, name: "Big Deal" }],
    contactsForAnchorOrg: [],
    oppsForAnchorOrg: [],
    contactsLoading: false,
    organizationsLoading: false,
    opportunitiesLoading: false,
    anchorOrganizationId: null,
    contactSearch: { searchTerm: "", setSearchTerm: vi.fn() },
    orgSearch: { searchTerm: "", setSearchTerm: vi.fn() },
    oppSearch: { searchTerm: "", setSearchTerm: vi.fn() },
  };
}

// Test component that provides real form context
function TestComponent({
  entityData,
  handlers,
}: {
  entityData: ReturnType<typeof createMockEntityData>;
  handlers: UseEntitySelectionReturn;
}) {
  const methods = useForm<ActivityLogInput>({
    defaultValues: {
      contactId: undefined,
      organizationId: undefined,
      opportunityId: undefined,
      activityType: "Call",
      outcome: "Connected",
      notes: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <EntitySelectionSection
        control={methods.control}
        entityData={entityData}
        handlers={handlers}
      />
    </FormProvider>
  );
}

describe("EntitySelectionSection", () => {
  let mockHandlers: UseEntitySelectionReturn;
  let mockEntityData: ReturnType<typeof createMockEntityData>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers = createMockHandlers();
    mockEntityData = createMockEntityData();
  });

  describe("Rendering", () => {
    it("renders SidepaneSection with 'Who Was Involved' label", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      const sidepane = screen.getByTestId("sidepane-section");
      expect(sidepane).toHaveAttribute("data-label", "Who Was Involved");
    });

    it("renders Contact, Organization, Opportunity comboboxes", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      expect(screen.getByTestId("entity-combobox-contact")).toBeInTheDocument();
      expect(screen.getByTestId("entity-combobox-organization")).toBeInTheDocument();
      expect(screen.getByTestId("entity-combobox-opportunity")).toBeInTheDocument();
    });
  });

  describe("Handlers", () => {
    it("passes handleContactSelect to Contact combobox", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      screen.getByTestId("select-contact").click();
      expect(mockHandlers.handleContactSelect).toHaveBeenCalled();
    });

    it("passes handleContactClear to Contact combobox", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      screen.getByTestId("clear-contact").click();
      expect(mockHandlers.handleContactClear).toHaveBeenCalled();
    });

    it("passes handleOrganizationSelect to Organization combobox", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      screen.getByTestId("select-organization").click();
      expect(mockHandlers.handleOrganizationSelect).toHaveBeenCalled();
    });

    it("passes handleOrganizationClear to Organization combobox", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      screen.getByTestId("clear-organization").click();
      expect(mockHandlers.handleOrganizationClear).toHaveBeenCalled();
    });
  });

  describe("Entity Data", () => {
    it("passes filtered entities from entityData", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      expect(screen.getByTestId("options-count-contact")).toHaveTextContent("2");
      expect(screen.getByTestId("options-count-organization")).toHaveTextContent("2");
      expect(screen.getByTestId("options-count-opportunity")).toHaveTextContent("1");
    });
  });

  describe("Accessibility", () => {
    it("all listId attributes are unique for accessibility", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      const contactCombobox = screen.getByTestId("entity-combobox-contact");
      const orgCombobox = screen.getByTestId("entity-combobox-organization");
      const oppCombobox = screen.getByTestId("entity-combobox-opportunity");

      const contactListId = contactCombobox.getAttribute("data-list-id");
      const orgListId = orgCombobox.getAttribute("data-list-id");
      const oppListId = oppCombobox.getAttribute("data-list-id");

      expect(contactListId).toBe("contact-list");
      expect(orgListId).toBe("organization-list");
      expect(oppListId).toBe("opportunity-list");

      // All should be unique
      const uniqueIds = new Set([contactListId, orgListId, oppListId]);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("Placeholders", () => {
    it("renders correct placeholders for each combobox", () => {
      render(<TestComponent entityData={mockEntityData} handlers={mockHandlers} />);

      expect(screen.getByTestId("placeholder-contact")).toHaveTextContent("Select contact");
      expect(screen.getByTestId("placeholder-organization")).toHaveTextContent(
        "Select organization"
      );
      expect(screen.getByTestId("placeholder-opportunity")).toHaveTextContent(
        "Select opportunity (optional)"
      );
    });
  });
});
