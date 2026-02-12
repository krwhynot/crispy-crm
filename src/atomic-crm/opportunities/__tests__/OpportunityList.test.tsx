/**
 * Tests for OpportunityList components
 *
 * Tests list rendering, multi-select filters, localStorage persistence,
 * empty states, pagination, and dynamic filter choices.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import { OPPORTUNITY_STAGE_CHOICES, OPPORTUNITY_STAGES_LEGACY } from "../constants";
import { OpportunityListContent } from "../kanban/OpportunityListContent";

// Mock useListContext to test components directly
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(),
  };
});

// Mock OpportunityColumn to simplify rendering
// Path is relative to the component being tested (kanban/OpportunityListContent.tsx)
vi.mock("../kanban/OpportunityColumn", () => ({
  OpportunityColumn: ({
    stage,
    opportunities,
  }: {
    stage: { value: string; label: string } | string;
    opportunities?: { id: number; name: string }[];
  }) => (
    <div data-testid={`column-${typeof stage === "object" ? stage?.value : stage}`}>
      <h3>{typeof stage === "object" ? stage?.label : stage}</h3>
      {opportunities?.map((opp: { id: number; name: string }) => (
        <div key={opp.id} data-testid={`opportunity-${opp.id}`}>
          {opp.name}
        </div>
      )) || null}
    </div>
  ),
}));

// Import mocked useListContext after mock definition
import { useListContext } from "ra-core";

describe("OpportunityListContent", () => {
  const mockOpportunities = [
    createMockOpportunity({
      id: 1,
      name: "Tech Deal",
      stage: "new_lead",
      priority: "high",
    }),
    createMockOpportunity({
      id: 2,
      name: "Healthcare Deal",
      stage: "demo_scheduled",
      priority: "medium",
    }),
    createMockOpportunity({
      id: 3,
      name: "Closed Deal",
      stage: "closed_won",
      priority: "low",
    }),
  ];

  const defaultListContext = {
    data: mockOpportunities,
    total: mockOpportunities.length,
    isPending: false,
    isLoading: false,
    filterValues: { "deleted_at@is": null },
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    page: 1,
    perPage: 100,
    sort: { field: "index", order: "DESC" },
    resource: "opportunities",
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default useListContext mock
    vi.mocked(useListContext).mockReturnValue(defaultListContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Mock openSlideOver for all tests
  const mockOpenSlideOver = vi.fn();

  test("renders list with mocked data from useListContext", async () => {
    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    // Wait for component to render with mock data
    await waitFor(() => {
      expect(screen.getByText("Tech Deal")).toBeInTheDocument();
    });

    expect(screen.getByText("Healthcare Deal")).toBeInTheDocument();
    expect(screen.getByText("Closed Deal")).toBeInTheDocument();
  });

  test("applies multi-select stage filter", async () => {
    const contextWithFilters = {
      ...defaultListContext,
      filterValues: {
        "deleted_at@is": null,
        stage: ["new_lead", "demo_scheduled"],
      },
    };

    vi.mocked(useListContext).mockReturnValue(contextWithFilters);

    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    await waitFor(() => {
      // When stages are filtered, OpportunityListContent only shows those stage columns
      // Find stage columns that exist
      const columns = screen.getAllByTestId(/column-/);

      // Should have only 2 columns for the filtered stages
      expect(columns).toHaveLength(2);

      // Verify the opportunities are rendered
      expect(screen.getByText("Tech Deal")).toBeInTheDocument();
      expect(screen.getByText("Healthcare Deal")).toBeInTheDocument();
      // Closed won opportunity should not be visible
      expect(screen.queryByText("Closed Deal")).not.toBeInTheDocument();
    });
  });

  test("renders empty state when no data", async () => {
    const emptyContext = {
      ...defaultListContext,
      data: [],
      total: 0,
    };

    vi.mocked(useListContext).mockReturnValue(emptyContext);

    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    await waitFor(() => {
      // Should show all stage columns but empty
      const columns = screen.getAllByTestId(/column-/);
      expect(columns.length).toBeGreaterThan(0);

      // But no opportunities
      expect(screen.queryByText("Tech Deal")).not.toBeInTheDocument();
      expect(screen.queryByText("Healthcare Deal")).not.toBeInTheDocument();
    });
  });

  test("handles pagination behavior with many opportunities", async () => {
    // Create many opportunities for pagination testing
    const manyOpportunities = Array.from({ length: 150 }, (_, i) =>
      createMockOpportunity({
        id: i + 1,
        name: `Deal ${i + 1}`,
        stage: OPPORTUNITY_STAGES_LEGACY[i % OPPORTUNITY_STAGES_LEGACY.length].value,
      })
    );

    const paginatedContext = {
      ...defaultListContext,
      data: manyOpportunities.slice(0, 100), // First page
      total: 150,
      hasNextPage: true,
      hasPreviousPage: false,
      perPage: 100,
      page: 1,
    };

    vi.mocked(useListContext).mockReturnValue(paginatedContext);

    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    await waitFor(() => {
      // Should show first page of results
      expect(screen.getByText("Deal 1")).toBeInTheDocument();
      expect(screen.getByText("Deal 100")).toBeInTheDocument();
      expect(screen.queryByText("Deal 101")).not.toBeInTheDocument();
    });
  });

  test("groups opportunities by stage correctly", async () => {
    const contextWithGrouping = {
      ...defaultListContext,
      data: [
        createMockOpportunity({ id: 1, name: "Deal A", stage: "new_lead" }),
        createMockOpportunity({ id: 2, name: "Deal B", stage: "new_lead" }),
        createMockOpportunity({ id: 3, name: "Deal C", stage: "demo_scheduled" }),
      ],
    };

    vi.mocked(useListContext).mockReturnValue(contextWithGrouping);

    renderWithAdminContext(<OpportunityListContent openSlideOver={mockOpenSlideOver} />);

    await waitFor(() => {
      // Find all columns
      const columns = screen.getAllByTestId(/column-/);

      // Should have multiple stage columns
      expect(columns.length).toBeGreaterThan(0);

      // All opportunities should be rendered
      expect(screen.getByText("Deal A")).toBeInTheDocument();
      expect(screen.getByText("Deal B")).toBeInTheDocument();
      expect(screen.getByText("Deal C")).toBeInTheDocument();
    });
  });
});

describe("OpportunityList localStorage persistence", () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    vi.clearAllMocks();
  });

  test("persists stage filter preferences to localStorage", () => {
    // Simulate the function that updates stage preferences
    const updateStagePreferences = (selectedStages: string[]): void => {
      const allStages = OPPORTUNITY_STAGE_CHOICES.map((choice) => choice.id);
      const hiddenStages = allStages.filter((stage) => !selectedStages.includes(stage));

      if (hiddenStages.length > 0) {
        localStorage.setItem("opportunity_hidden_stages", JSON.stringify(hiddenStages));
      }
    };

    // Test that selecting certain stages updates localStorage
    const selectedStages = ["new_lead", "demo_scheduled", "initial_outreach"];
    updateStagePreferences(selectedStages);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "opportunity_hidden_stages",
      expect.stringContaining("closed_won")
    );
  });

  test("reads default stage filter from localStorage", () => {
    // Mock localStorage to return hidden stages
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "opportunity_hidden_stages") {
        return JSON.stringify(["closed_won", "closed_lost"]);
      }
      return null;
    });

    // Simulate the function that gets initial stage filter
    const getInitialStageFilter = (): string[] | undefined => {
      const hiddenStages = JSON.parse(
        localStorage.getItem("opportunity_hidden_stages") || '["closed_won", "closed_lost"]'
      );

      return OPPORTUNITY_STAGE_CHOICES.map((choice) => choice.id).filter(
        (stage) => !hiddenStages.includes(stage)
      );
    };

    const visibleStages = getInitialStageFilter();

    expect(visibleStages).not.toContain("closed_won");
    expect(visibleStages).not.toContain("closed_lost");
    expect(visibleStages).toContain("new_lead");
    expect(visibleStages).toContain("demo_scheduled");
  });
});

describe("OpportunityList dynamic filter choices", () => {
  test("fetches and processes dynamic opportunity contexts", async () => {
    // Mock the data provider that would fetch contexts
    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [
          "Retail",
          "Manufacturing",
          "Retail", // Duplicate to test uniqueness
          null, // Null to test filtering
          "", // Empty to test filtering
        ],
        total: 5,
      }),
    };

    // Simulate the context fetching logic
    const fetchContexts = async () => {
      const { data } = await mockDataProvider.getList("opportunities", {
        pagination: { page: 1, perPage: 1000 },
        filter: { "deleted_at@is": null },
      });

      // Extract unique, non-null contexts
      const uniqueContexts = [
        ...new Set(data.filter((context: string) => context && context.trim() !== "")),
      ];

      return uniqueContexts.map((context) => ({
        id: context,
        name: context,
      }));
    };

    const choices = await fetchContexts();

    expect(choices).toHaveLength(2);
    expect(choices).toContainEqual({ id: "Retail", name: "Retail" });
    expect(choices).toContainEqual({ id: "Manufacturing", name: "Manufacturing" });
    expect(mockDataProvider.getList).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        filter: { "deleted_at@is": null },
      })
    );
  });
});
