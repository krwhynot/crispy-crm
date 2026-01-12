import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ShowContextProvider } from "ra-core";
import type * as ReactAdmin from "react-admin";
import { OpportunitiesTab } from "./OpportunitiesTab";

const mockContact = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  organization_id: 100,
  organization: { name: "Acme Corp" },
};

const mockUseGetList = vi.fn();
const mockUseGetMany = vi.fn();
const mockUseRefresh = vi.fn();
const mockCreate = vi.fn();
const mockNotify = vi.fn();

// Mock StageBadgeWithHealth component
vi.mock("./StageBadgeWithHealth", () => ({
  StageBadgeWithHealth: ({ stage, health }: any) => (
    <div data-testid="stage-badge">
      {stage} - {health}
    </div>
  ),
}));

// Mock SuggestedOpportunityCard component
vi.mock("./SuggestedOpportunityCard", () => ({
  SuggestedOpportunityCard: ({ opportunity, onLink }: any) => (
    <div data-testid="suggested-opportunity-card">
      {opportunity.name}
      <button onClick={onLink}>Link</button>
    </div>
  ),
}));

// Mock LinkOpportunityModal component
vi.mock("./LinkOpportunityModal", () => ({
  LinkOpportunityModal: ({ open, contactName, onClose }: any) => {
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
  UnlinkConfirmDialog: ({ opportunity, contactName, onClose }: any) => {
    if (!opportunity) return null;
    return (
      <div data-testid="unlink-dialog">
        Unlink {opportunity.name} from {contactName}
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
    Datagrid: ({ children }: any) => <div data-testid="datagrid">{children}</div>,
    FunctionField: ({ label }: any) => <div data-testid={`field-${label}`}>function-field</div>,
    ReferenceField: ({ children, label }: any) => (
      <div data-testid={`field-${label}`}>{children}</div>
    ),
    TextField: () => <div>text-field</div>,
    NumberField: () => <div>number-field</div>,
    ListContextProvider: ({ children, value }: any) => {
      // Render the data items for testing (data is object keyed by ID)
      const items = value?.ids?.map((id: any) => value.data[id]) || [];
      return (
        <div data-testid="list-context">
          {items.map((item: any) => (
            <div key={item.id} data-testid="opportunity-item">
              {item.name}
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
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
    useGetMany: () => mockUseGetMany(),
    useRefresh: () => mockUseRefresh,
    useCreate: () => [mockCreate],
    useNotify: () => mockNotify,
    useDataProvider: () => mockDataProvider,
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
      {
        id: 10,
        name: "Deal A",
        customer_organization_id: 100,
        stage: "qualified",
        health_status: "active",
        amount: 50000,
      },
      {
        id: 11,
        name: "Deal B",
        customer_organization_id: 100,
        stage: "proposal",
        health_status: "cooling",
        amount: 75000,
      },
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
      {
        id: 20,
        name: "Suggested Deal A",
        customer_organization_id: 100,
        stage: "qualified",
        health_status: "active",
        amount: 30000,
      },
      {
        id: 21,
        name: "Suggested Deal B",
        customer_organization_id: 100,
        stage: "proposal",
        health_status: "cooling",
        amount: 45000,
      },
      {
        id: 22,
        name: "Suggested Deal C",
        customer_organization_id: 100,
        stage: "negotiation",
        health_status: "active",
        amount: 60000,
      },
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
      {
        id: 20,
        name: "Active Deal",
        customer_organization_id: 100,
        stage: "qualified",
        health_status: "active",
        amount: 30000,
      },
      {
        id: 21,
        name: "Closed Won",
        customer_organization_id: 100,
        stage: "closed_won",
        health_status: "active",
        amount: 45000,
      },
      {
        id: 22,
        name: "Closed Lost",
        customer_organization_id: 100,
        stage: "closed_lost",
        health_status: "active",
        amount: 60000,
      },
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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
    const mockManyOpps = Array.from({ length: 10 }, (_, i) => ({
      id: 30 + i,
      name: `Deal ${i + 1}`,
      customer_organization_id: 100,
      stage: "qualified",
      health_status: "active",
      amount: 10000 * (i + 1),
    }));

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
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
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
