import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { UseGetListHookValue } from "ra-core";
import type * as RaCore from "ra-core";
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";

// Mock useGetList from ra-core
const mockUseGetList = vi.fn();
vi.mock("ra-core", async (importOriginal) => {
  const actual = await importOriginal<typeof RaCore>();
  return {
    ...actual,
    useGetList: (...args: Parameters<typeof actual.useGetList>) => mockUseGetList(...args),
  };
});

// Mock TimelineEntry to simplify testing (avoids mocking ReferenceField and other dependencies)
vi.mock("../TimelineEntry", () => ({
  TimelineEntry: ({ entry }: { entry: { id: number; title: string } }) => (
    <div data-testid={`timeline-entry-${entry.id}`}>{entry.title}</div>
  ),
}));

// Import component AFTER mocks are set up
import { UnifiedTimeline } from "../UnifiedTimeline";

interface TimelineEntryData {
  id: number;
  entry_type: "activity" | "task";
  subtype: string;
  title: string;
  description?: string;
  entry_date: string;
  contact_id?: number;
  organization_id?: number;
  opportunity_id?: number;
  created_by?: number;
  sales_id?: number;
  created_at: string;
}

const createMockTimelineEntry = (
  overrides: Partial<TimelineEntryData> = {}
): TimelineEntryData => ({
  id: overrides.id ?? 1,
  entry_type: overrides.entry_type ?? "activity",
  subtype: overrides.subtype ?? "call",
  title: overrides.title ?? "Test Entry",
  description: overrides.description,
  entry_date: overrides.entry_date ?? "2025-01-15T10:00:00Z",
  contact_id: overrides.contact_id,
  organization_id: overrides.organization_id,
  opportunity_id: overrides.opportunity_id,
  created_by: overrides.created_by,
  sales_id: overrides.sales_id,
  created_at: overrides.created_at ?? "2025-01-15T10:00:00Z",
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
};

describe("UnifiedTimeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseGetList.mockReturnValue(
      mockUseGetListReturn<TimelineEntryData>({
        data: [],
        total: 0,
        isPending: false,
        isLoading: false,
        error: null,
      })
    );
  });

  describe("filter merging", () => {
    it("passes opportunityId as filter", () => {
      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            opportunity_id: 123,
          }),
        }),
        expect.anything()
      );
    });

    it("passes contactId as filter", () => {
      renderWithAdminContext(<UnifiedTimeline contactId={456} />, { wrapper: createWrapper() });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            contact_id: 456,
          }),
        }),
        expect.anything()
      );
    });

    it("passes organizationId as filter", () => {
      renderWithAdminContext(<UnifiedTimeline organizationId={789} />, {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_id: 789,
          }),
        }),
        expect.anything()
      );
    });

    it("uses $or when multiple entity IDs are provided", () => {
      renderWithAdminContext(<UnifiedTimeline contactId={100} organizationId={200} />, {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            $or: expect.arrayContaining([{ contact_id: 100 }, { organization_id: 200 }]),
          }),
        }),
        expect.anything()
      );
    });

    it("merges external filters with entity filters", () => {
      renderWithAdminContext(
        <UnifiedTimeline opportunityId={123} filters={{ subtype: "stage_change" }} />,
        {
          wrapper: createWrapper(),
        }
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            opportunity_id: 123,
            subtype: "stage_change",
          }),
        }),
        expect.anything()
      );
    });

    it("external filters take precedence over entity filters", () => {
      renderWithAdminContext(
        <UnifiedTimeline
          opportunityId={123}
          filters={{ opportunity_id: 999, entry_type: "task" }}
        />,
        { wrapper: createWrapper() }
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          filter: expect.objectContaining({
            opportunity_id: 999,
            entry_type: "task",
          }),
        }),
        expect.anything()
      );
    });
  });

  describe("pagination", () => {
    it("shows pagination controls when total > pageSize", () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    it("does not show pagination when total <= pageSize", () => {
      const mockData = [createMockTimelineEntry({ id: 1, title: "Single Entry" })];

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 1,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
    });

    it("increments page when Next is clicked", async () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      // Find and click Next button
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockUseGetList).toHaveBeenLastCalledWith(
          "entity_timeline",
          expect.objectContaining({
            pagination: { page: 2, perPage: 50 },
          }),
          expect.anything()
        );
      });
    });

    it("decrements page when Previous is clicked", async () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 150,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      // Go to page 2 first
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
      });

      // Click Previous
      const prevButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(mockUseGetList).toHaveBeenLastCalledWith(
          "entity_timeline",
          expect.objectContaining({
            pagination: { page: 1, perPage: 50 },
          }),
          expect.anything()
        );
      });
    });

    it("disables Previous button on first page", () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      const prevButton = screen.getByRole("button", { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it("disables Next button on last page", async () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      // Go to page 2 (last page)
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
      });
    });

    it("resets to page 1 when filters change", async () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 150,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      // Create a wrapper component that can update filters via props
      const TestWrapper = ({ filters }: { filters: Record<string, unknown> }) => (
        <UnifiedTimeline opportunityId={123} filters={filters} />
      );

      const Wrapper = createWrapper();
      const { rerender } = renderWithAdminContext(<TestWrapper filters={{}} />, {
        wrapper: Wrapper,
      });

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
      });

      // Clear mock call history
      mockUseGetList.mockClear();

      // Change filters - rerender the same TestWrapper with new props (no nested providers)
      rerender(<TestWrapper filters={{ subtype: "stage_change" }} />);

      await waitFor(() => {
        expect(mockUseGetList).toHaveBeenLastCalledWith(
          "entity_timeline",
          expect.objectContaining({
            pagination: { page: 1, perPage: 50 },
          }),
          expect.anything()
        );
      });
    });

    it("respects custom pageSize prop", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} pageSize={25} />, {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          pagination: { page: 1, perPage: 25 },
        }),
        expect.anything()
      );
    });
  });

  describe("empty state", () => {
    it("shows empty message when no entries", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByText(/No activities yet/i)).toBeInTheDocument();
    });

    it("shows description in empty state", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Log calls, emails, and meetings to track interactions/i)
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeleton while loading", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: undefined,
          total: undefined,
          isPending: true,
          isLoading: true,
          error: null,
        }) as UseGetListHookValue<TimelineEntryData>
      );

      const { container } = renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, {
        wrapper: createWrapper(),
      });

      // Look for skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("shows error message when error occurs", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: undefined,
          total: undefined,
          isPending: false,
          isLoading: false,
          error: new Error("Failed to fetch"),
        }) as UseGetListHookValue<TimelineEntryData>
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByText(/Failed to load timeline/i)).toBeInTheDocument();
    });

    it("shows Try Again button on error", () => {
      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: undefined,
          total: undefined,
          isPending: false,
          isLoading: false,
          error: new Error("Failed to fetch"),
        }) as UseGetListHookValue<TimelineEntryData>
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });

    it("calls refetch when Try Again is clicked", async () => {
      const mockRefetch = vi.fn();
      mockUseGetList.mockReturnValue({
        ...mockUseGetListReturn<TimelineEntryData>({
          data: undefined,
          total: undefined,
          isPending: false,
          isLoading: false,
          error: new Error("Failed to fetch"),
        }),
        refetch: mockRefetch,
      } as UseGetListHookValue<TimelineEntryData>);

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      const tryAgainButton = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("rendering entries", () => {
    it("renders timeline entries when data is available", () => {
      const mockData = [
        createMockTimelineEntry({ id: 1, title: "First Entry" }),
        createMockTimelineEntry({ id: 2, title: "Second Entry" }),
      ];

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 2,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByTestId("timeline-entry-1")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-entry-2")).toBeInTheDocument();
      expect(screen.getByText("First Entry")).toBeInTheDocument();
      expect(screen.getByText("Second Entry")).toBeInTheDocument();
    });
  });

  describe("sort order", () => {
    it("sorts by entry_date descending", () => {
      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.objectContaining({
          sort: { field: "entry_date", order: "DESC" },
        }),
        expect.anything()
      );
    });
  });

  describe("stale time configuration", () => {
    it("configures staleTime for caching", () => {
      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.anything(),
        expect.objectContaining({
          staleTime: 5 * 60 * 1000,
        })
      );
    });

    it("enables refetchOnWindowFocus", () => {
      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "entity_timeline",
        expect.anything(),
        expect.objectContaining({
          refetchOnWindowFocus: true,
        })
      );
    });
  });

  describe("accessibility", () => {
    it("has proper navigation role for pagination", () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      const nav = screen.getByRole("navigation", { name: /Timeline pagination/i });
      expect(nav).toBeInTheDocument();
    });

    it("has proper aria-labels on pagination buttons", () => {
      const mockData = Array.from({ length: 50 }, (_, i) =>
        createMockTimelineEntry({ id: i + 1, title: `Entry ${i + 1}` })
      );

      mockUseGetList.mockReturnValue(
        mockUseGetListReturn<TimelineEntryData>({
          data: mockData,
          total: 75,
          isPending: false,
          isLoading: false,
          error: null,
        })
      );

      renderWithAdminContext(<UnifiedTimeline opportunityId={123} />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next page/i })).toBeInTheDocument();
    });
  });
});
