import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi } from "vitest";

import { ListContextProvider } from "ra-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/tests/setup";
import { CampaignGroupedList } from "../CampaignGroupedList";
import type { Opportunity } from "../../types";

describe("CampaignGroupedList - Performance", () => {
  it("is wrapped with React.memo", () => {
    expect(CampaignGroupedList.$$typeof?.toString()).toBe("Symbol(react.memo)");
  });

  it("re-renders when data prop changes", () => {
    const mockOpportunities1: Opportunity[] = [
      {
        id: 1,
        name: "Test Opportunity 1",
        stage: "new_lead",
        status: "active",
        priority: "medium",
        customer_organization_id: 1,
        contact_ids: [],
        stage_manual: false,
        status_manual: false,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        days_in_stage: 5,
        days_since_last_activity: 3,
        pending_task_count: 0,
        overdue_task_count: 0,
        campaign: "Winter Fancy Food Show 2025",
        principal_organization_name: "McCRUM",
      },
    ];

    const mockOpportunities2: Opportunity[] = [
      {
        id: 2,
        name: "Test Opportunity 2",
        stage: "initial_outreach",
        status: "active",
        priority: "high",
        customer_organization_id: 2,
        contact_ids: [],
        stage_manual: false,
        status_manual: false,
        created_at: "2025-01-02",
        updated_at: "2025-01-02",
        days_in_stage: 3,
        days_since_last_activity: 1,
        pending_task_count: 1,
        overdue_task_count: 0,
        campaign: "Summer Food Expo 2025",
        principal_organization_name: "SWAP",
      },
    ];

    const openSlideOver = vi.fn();
    const queryClient = createTestQueryClient();

    const TestWrapper = ({
      children,
      data,
    }: {
      children: React.ReactNode;
      data: Opportunity[];
    }) => (
      <QueryClientProvider client={queryClient}>
        <ListContextProvider
          value={{
            data,
            isPending: false,
            total: data.length,
            isLoading: false,
            isFetching: false,
            page: 1,
            perPage: 10,
            setPage: vi.fn(),
            setPerPage: vi.fn(),
            setSort: vi.fn(),
            setFilters: vi.fn(),
            filterValues: {},
            displayedFilters: {},
            showFilter: vi.fn(),
            hideFilter: vi.fn(),
            sort: { field: "id", order: "ASC" },
            resource: "opportunities",
            refetch: vi.fn(),
          }}
        >
          {children}
        </ListContextProvider>
      </QueryClientProvider>
    );

    const { rerender, getByText } = renderWithAdminContext(
      <TestWrapper data={mockOpportunities1}>
        <CampaignGroupedList openSlideOver={openSlideOver} />
      </TestWrapper>
    );

    expect(getByText("Winter Fancy Food Show 2025")).toBeInTheDocument();

    rerender(
      <TestWrapper data={mockOpportunities2}>
        <CampaignGroupedList openSlideOver={openSlideOver} />
      </TestWrapper>
    );

    expect(getByText("Summer Food Expo 2025")).toBeInTheDocument();
  });
});
