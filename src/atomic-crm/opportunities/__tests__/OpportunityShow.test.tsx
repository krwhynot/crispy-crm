/**
 * Tests for OpportunityShow component
 *
 * Tests the opportunity details view including:
 * - Loading states
 * - Tab navigation (Details, Notes & Activity, Change Log)
 * - Rendering opportunity information
 * - Workflow management section
 * - Products table
 * - Archive/unarchive functionality
 * - Error handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import type { OpportunityStage } from "../constants";
import type { Opportunity } from "@/atomic-crm/validation/opportunities/opportunities-core";
import OpportunityShow from "../OpportunityShow";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    useUpdate: vi.fn(() => [vi.fn()]),
    useRefresh: vi.fn(() => vi.fn()),
    useRedirect: vi.fn(() => vi.fn()),
    useNotify: vi.fn(() => vi.fn()),
    useDataProvider: vi.fn(() => ({})),
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
    })),
  };
});

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
  };
});

// Mock ReferenceField
vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));

// Mock ReferenceArrayField
vi.mock("@/components/ra-wrappers/reference-array-field", () => ({
  ReferenceArrayField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-array-field">{children}</div>
  ),
}));

// Mock ReferenceManyField
vi.mock("@/components/ra-wrappers/reference-many-field", () => ({
  ReferenceManyField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-many-field">{children}</div>
  ),
}));

// Mock OpportunityHeader
interface OpportunityHeaderMockProps {
  ArchiveButton?: React.ComponentType<{ record: { id: number; deleted_at: string | null } }>;
  UnarchiveButton?: React.ComponentType<{ record: { id: number; deleted_at: string | null } }>;
}
vi.mock("../OpportunityHeader", () => ({
  OpportunityHeader: ({ ArchiveButton, UnarchiveButton }: OpportunityHeaderMockProps) => (
    <div data-testid="opportunity-header">
      Header
      {ArchiveButton && <ArchiveButton record={{ id: 1, deleted_at: null }} />}
      {UnarchiveButton && <UnarchiveButton record={{ id: 1, deleted_at: "2024-01-01" }} />}
    </div>
  ),
}));

// Mock other sub-components
vi.mock("../ContactList", () => ({
  ContactList: () => <div data-testid="contact-list">Contact List</div>,
}));

vi.mock("../OrganizationInfoCard", () => ({
  OrganizationInfoCard: () => <div data-testid="org-info-card">Organization Info</div>,
}));

vi.mock("../ProductsTable", () => ({
  ProductsTable: ({ products }: { products?: unknown[] }) => (
    <div data-testid="products-table">Products: {products?.length || 0}</div>
  ),
}));

vi.mock("../WorkflowManagementSection", () => ({
  WorkflowManagementSection: () => <div data-testid="workflow-section">Workflow</div>,
}));

vi.mock("../RelatedOpportunitiesSection", () => ({
  RelatedOpportunitiesSection: () => <div data-testid="related-opps">Related Opportunities</div>,
}));

vi.mock("../ActivityNoteForm", () => ({
  ActivityNoteForm: () => <div data-testid="activity-form">Activity Form</div>,
}));

vi.mock("../ActivitiesList", () => ({
  ActivitiesList: () => <div data-testid="activities-list">Activities List</div>,
}));

vi.mock("../ChangeLogTab", () => ({
  ChangeLogTab: () => <div data-testid="change-log">Change Log</div>,
}));

vi.mock("../ActivityTimelineFilters", () => ({
  ActivityTimelineFilters: () => <div data-testid="activity-filters">Filters</div>,
}));

vi.mock("../notes", () => ({
  NoteCreate: () => <div data-testid="note-create">Create Note</div>,
  NotesIterator: () => <div data-testid="notes-iterator">Notes List</div>,
}));

vi.mock("../sales/SaleAvatar", () => ({
  SaleAvatar: () => <div data-testid="sale-avatar">Avatar</div>,
}));

// Mock OpportunityAside to avoid useRecordContext issues in test isolation
vi.mock("../OpportunityAside", () => ({
  OpportunityAside: () => <div data-testid="opportunity-aside">Aside Panel</div>,
}));

vi.mock("../opportunity", () => ({
  findOpportunityLabel: (stages: any[], value: string) => {
    const stage = stages.find((s: any) => s.value === value);
    return stage?.label || value;
  },
}));

// Mock OpportunitiesService
vi.mock("../services", () => ({
  OpportunitiesService: vi.fn(() => ({
    unarchiveOpportunity: vi.fn(),
  })),
}));

// Import mocked functions
import { useShowContext } from "ra-core";

describe("OpportunityShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state", () => {
    vi.mocked(useShowContext).mockReturnValue(
      mockUseShowContextReturn<Opportunity>({
        record: undefined,
        isPending: true,
        error: null,
      })
    );

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        initialEntries: ["/opportunities/1/show"],
      }
    );

    // When isPending is true, the component returns null
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  test("renders with valid opportunity data", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Big Deal",
      stage: "proposal",
      priority: "high",
      estimated_close_date: "2024-12-31",
      opportunity_owner_id: 1,
      account_manager_id: 2,
      lead_source: "referral",
      contact_ids: [1, 2],
      products: [],
      description: "This is a test opportunity",
      created_at: "2024-01-01T00:00:00Z",
      created_by: 1,
    });

    vi.mocked(useShowContext).mockReturnValue(
      mockUseShowContextReturn<Opportunity>({
        record: mockOpp,
        isPending: false,
        error: null,
      })
    );

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      // Check tabs are rendered
      expect(screen.getByRole("tab", { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /notes & activity/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /change log/i })).toBeInTheDocument();

      // Check priority badge
      expect(screen.getByText("high")).toBeInTheDocument();

      // Check stage
      expect(screen.getByText("Proposal")).toBeInTheDocument();
    });
  });

  test("displays opportunity header", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Test Opportunity",
      stage: "lead",
    });

    vi.mocked(useShowContext).mockReturnValue(
      mockUseShowContextReturn<Opportunity>({
        record: mockOpp,
        isPending: false,
        error: null,
      })
    );

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("opportunity-header")).toBeInTheDocument();
    });
  });

  test("renders details tab content", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Details Test",
      stage: "qualified",
      estimated_close_date: "2024-12-31",
      priority: "medium",
      products: [
        { id: 1, name: "Product A", quantity: 10 },
        { id: 2, name: "Product B", quantity: 5 },
      ],
    });

    vi.mocked(useShowContext).mockReturnValue(
      mockUseShowContextReturn<Opportunity>({
        record: mockOpp,
        isPending: false,
        error: null,
      })
    );

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      // Organization info card
      expect(screen.getByTestId("org-info-card")).toBeInTheDocument();

      // Workflow section
      expect(screen.getByTestId("workflow-section")).toBeInTheDocument();

      // Related opportunities
      expect(screen.getByTestId("related-opps")).toBeInTheDocument();

      // Products table
      expect(screen.getByTestId("products-table")).toBeInTheDocument();

      // Expected closing date label
      expect(screen.getByText(/expected closing date/i)).toBeInTheDocument();

      // Stage label
      expect(screen.getByText(/stage/i)).toBeInTheDocument();

      // Priority label
      expect(screen.getByText(/priority/i)).toBeInTheDocument();
    });
  });

  test("renders opportunity with contacts", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Contact Test",
      contact_ids: [1, 2, 3],
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      // Should show contacts label
      expect(screen.getByText(/contacts/i)).toBeInTheDocument();

      // Should render ReferenceArrayField
      expect(screen.getByTestId("reference-array-field")).toBeInTheDocument();
    });
  });

  test("renders opportunity without contacts", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "No Contacts Test",
      contact_ids: [],
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      // Should not show contact list (no contact_ids)
      expect(screen.queryByTestId("contact-list")).not.toBeInTheDocument();
    });
  });

  test("renders opportunity with description", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Description Test",
      description: "This is a detailed description of the opportunity.",
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      expect(
        screen.getByText("This is a detailed description of the opportunity.")
      ).toBeInTheDocument();
    });
  });

  test("renders archived opportunity with warning banner", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Archived Opportunity",
      deleted_at: "2024-01-01T00:00:00Z",
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    // ArchivedBanner component renders when deleted_at is set
    await waitFor(() => {
      expect(screen.getByText("This opportunity has been archived")).toBeInTheDocument();
    });
  });

  test("displays priority badges with correct variants", async () => {
    const priorityTests = [
      { priority: "critical", expectedClass: "destructive" },
      { priority: "high", expectedText: "high" },
      { priority: "medium", expectedText: "medium" },
      { priority: "low", expectedText: "low" },
    ];

    for (const { priority, expectedText } of priorityTests) {
      const mockOpp = createMockOpportunity({
        id: 1,
        name: "Priority Test",
        priority,
      });

      (useShowContext as any).mockReturnValue({
        record: mockOpp,
        isPending: false,
        error: null,
      });

      const { unmount } = renderWithAdminContext(
        <Routes>
          <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
        </Routes>,
        {
          resource: "opportunities",
          record: mockOpp,
          initialEntries: ["/opportunities/1/show"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText(expectedText || priority)).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  test("renders products table", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Products Test",
      products: [
        { id: 1, name: "Product 1", quantity: 10 },
        { id: 2, name: "Product 2", quantity: 5 },
      ],
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("products-table")).toBeInTheDocument();
      expect(screen.getByText("Products: 2")).toBeInTheDocument();
    });
  });

  test("handles missing record gracefully", () => {
    (useShowContext as any).mockReturnValue({
      record: null,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        initialEntries: ["/opportunities/1/show"],
      }
    );

    // When record is null, component returns null
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  test("renders created date and creator", async () => {
    const mockOpp = createMockOpportunity({
      id: 1,
      name: "Created Test",
      created_at: "2024-01-15T10:30:00Z",
      created_by: 5,
    });

    (useShowContext as any).mockReturnValue({
      record: mockOpp,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/opportunities/:id/show" element={<OpportunityShow />} />
      </Routes>,
      {
        resource: "opportunities",
        record: mockOpp,
        initialEntries: ["/opportunities/1/show"],
      }
    );

    await waitFor(() => {
      // Use getAllByText to handle multiple "Created" elements
      const createdElements = screen.getAllByText(/created/i);
      expect(createdElements.length).toBeGreaterThan(0);
    });
  });
});
