import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ShowContextProvider } from "ra-core";
import type * as ReactAdmin from "react-admin";
import type { ReactNode } from "react";
import type { Identifier } from "ra-core";
import { OpportunitiesTab } from "./OpportunitiesTab";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import { createMockContact, createMockOpportunity } from "@/tests/utils/mock-providers";

// Create typed mock contact with organization field
const mockContact = createMockContact({
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  organization_id: 100,
});
// Add organization property for display (not in base Contact type but used by component)
const mockContactWithOrg = {
  ...mockContact,
  organization: { name: "Acme Corp" },
};

const mockUseGetList = vi.fn();
const mockUseGetMany = vi.fn();
const mockUseRefresh = vi.fn();
const mockCreate = vi.fn();
const mockNotify = vi.fn();

// Mock StageBadgeWithHealth component
vi.mock("./StageBadgeWithHealth", () => ({
  StageBadgeWithHealth: ({ stage, health }: { stage: string; health?: string }) => (
    <div data-testid="stage-badge">
      {stage} - {health}
    </div>
  ),
}));

// Mock SuggestedOpportunityCard component
vi.mock("./SuggestedOpportunityCard", () => ({
  SuggestedOpportunityCard: ({
    opportunity,
    onLink,
  }: {
    opportunity: { id: number; name: string };
    onLink: () => void;
  }) => (
    <div data-testid="suggested-opportunity-card">
      {opportunity.name}
      <button onClick={onLink}>Link</button>
    </div>
  ),
}));

// Mock LinkOpportunityModal component
vi.mock("./LinkOpportunityModal", () => ({
  LinkOpportunityModal: ({
    open,
    contactName,
    onClose,
  }: {
    open: boolean;
    contactName: string;
    onClose: () => void;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="link-modal">
        Link Opportunity to {contactName}
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock UnlinkConfirmDialog component
vi.mock("./UnlinkConfirmDialog", () => ({
  UnlinkConfirmDialog: ({
    opportunity,
    contactName,
    contactId,
    onClose,
  }: {
    opportunity: { id: number; name: string } | null;
    contactName: string;
    contactId: number;
    onClose: () => void;
  }) => {
    if (!opportunity) return null;
    return (
      <div data-testid="unlink-dialog">
        Unlink {opportunity.name} from {contactName} (Contact ID: {contactId})
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

// Mock react-admin components - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    Datagrid: ({ children }: { children: ReactNode }) => (
      <div data-testid="datagrid">{children}</div>
    ),
    FunctionField: ({ label }: { label?: string }) => (
      <div data-testid={`field-${label}`}>function-field</div>
    ),
    ReferenceField: ({ children, label }: { children: ReactNode; label?: string }) => (
      <div data-testid={`field-${label}`}>{children}</div>
    ),
    TextField: () => <div>text-field</div>,
    NumberField: () => <div>number-field</div>,
    ListContextProvider: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: { ids?: Identifier[]; data?: Record<Identifier, { id: Identifier; name: string }> };
    }) => {
      // Render the data items for testing (data is object keyed by ID)
      const items = value?.ids?.map((id: Identifier) => value.data?.[id]).filter(Boolean) || [];
      return (
        <div data-testid="list-context">
          {items.map((item) => (
            <div key={item!.id} data-testid="opportunity-item">
              {item!.name}
            </div>
          ))}
          {children}
        </div>
      );
    },
  };
});

const mockDataProvider = {
  create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
};

const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

vi.mock("ra-core", async () => {
  const actual = await vi.importActual<typeof import("ra-core")>("ra-core");
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
    useGetMany: () => mockUseGetMany(),
    useRefresh: () => mockUseRefresh,
    useCreate: () => [mockCreate],
    useNotify: () => mockNotify,
    useDataProvider: () => mockDataProvider,
    // Preserve ShowContextProvider from actual module
    ShowContextProvider: actual.ShowContextProvider,
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

describe("OpportunitiesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while fetching", () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseGetMany.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows empty state when no opportunities linked", async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no opportunities linked/i)).toBeInTheDocument();
    });
  });

  it("renders opportunities table with linked opportunities", async () => {
    const mockJunctionRecords = [
      { id: "j1", contact_id: 1, opportunity_id: 10, created_at: "2025-01-01" },
      { id: "j2", contact_id: 1, opportunity_id: 11, created_at: "2025-01-02" },
    ];

    const mockOpportunities = [
      createMockOpportunity({
        id: 10,
        name: "Deal A",
        customer_organization_id: 100,
        stage: "qualified",
      }),
      createMockOpportunity({
        id: 11,
        name: "Deal B",
        customer_organization_id: 100,
        stage: "proposal",
      }),
    ];

    mockUseGetList.mockReturnValue({
      data: mockJunctionRecords,
      isLoading: false,
    });
    mockUseGetMany.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Deal A")).toBeInTheDocument();
      expect(screen.getByText("Deal B")).toBeInTheDocument();
    });
  });

  it("opens link modal when clicking Link Opportunity button", async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    const linkButton = screen.getByText(/Link Opportunity/i);
    fireEvent.click(linkButton);

    await waitFor(() => {
      expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
    });
  });

  it("shows suggested opportunities when contact has organization with active deals", async () => {
    const mockSuggestedOpps = [
      createMockOpportunity({
        id: 20,
        name: "Suggested Deal A",
        customer_organization_id: 100,
        stage: "qualified",
      }),
      createMockOpportunity({
        id: 21,
        name: "Suggested Deal B",
        customer_organization_id: 100,
        stage: "proposal",
      }),
      createMockOpportunity({
        id: 22,
        name: "Suggested Deal C",
        customer_organization_id: 100,
        stage: "negotiation",
      }),
    ];

    // First call returns empty junction records (no linked opportunities)
    // Second call returns suggested opportunities from the organization
    let callCount = 0;
    mockUseGetList.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Junction records query
        return { data: [], isLoading: false };
      } else {
        // Suggested opportunities query
        return { data: mockSuggestedOpps, isLoading: false };
      }
    });

    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/suggested opportunities/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Suggested Deal A")).toBeInTheDocument();
    expect(screen.getByText("Suggested Deal B")).toBeInTheDocument();
    expect(screen.getByText("Suggested Deal C")).toBeInTheDocument();
    expect(screen.getByText(/we found 3 active opportunities/i)).toBeInTheDocument();
  });

  it("filters out closed opportunities from suggestions", async () => {
    const mockAllOpps = [
      createMockOpportunity({
        id: 20,
        name: "Active Deal",
        customer_organization_id: 100,
        stage: "qualified",
      }),
      createMockOpportunity({
        id: 21,
        name: "Closed Won",
        customer_organization_id: 100,
        stage: "closed_won",
      }),
      createMockOpportunity({
        id: 22,
        name: "Closed Lost",
        customer_organization_id: 100,
        stage: "closed_lost",
      }),
    ];

    let callCount = 0;
    mockUseGetList.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: [], isLoading: false };
      } else {
        return { data: mockAllOpps, isLoading: false };
      }
    });

    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Active Deal")).toBeInTheDocument();
    });

    expect(screen.queryByText("Closed Won")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed Lost")).not.toBeInTheDocument();
  });

  it("limits suggestions to 5 opportunities max", async () => {
    const mockManyOpps = Array.from({ length: 10 }, (_, i) =>
      createMockOpportunity({
        id: 30 + i,
        name: `Deal ${i + 1}`,
        customer_organization_id: 100,
        stage: "qualified",
      })
    );

    let callCount = 0;
    mockUseGetList.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: [], isLoading: false };
      } else {
        return { data: mockManyOpps, isLoading: false };
      }
    });

    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={mockUseShowContextReturn({ record: mockContactWithOrg })}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/we found 5 active opportunities/i)).toBeInTheDocument();
    });

    // Should show first 5
    expect(screen.getByText("Deal 1")).toBeInTheDocument();
    expect(screen.getByText("Deal 5")).toBeInTheDocument();

    // Should not show 6th and beyond
    expect(screen.queryByText("Deal 6")).not.toBeInTheDocument();
  });
});
