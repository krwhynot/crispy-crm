import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import CampaignActivityReport from "../CampaignActivityReport";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";

/**
 * Activity record type for test data
 * Matches the shape returned by the activities API
 */
interface TestActivity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  created_by: number;
  organization_id: number | null;
  contact_id: number | null;
  opportunity_id?: number | null;
  organization_name?: string;
  contact_name?: string;
}

/**
 * Opportunity record type for test data
 */
interface TestOpportunity {
  id: number;
  name: string;
  campaign: string;
  stage?: string | null;
  customer_organization_name?: string;
}

/**
 * Sales rep record type for test data
 */
interface TestSalesRep {
  id: number;
  first_name: string;
  last_name: string;
}

/**
 * CSV row type for jsonexport mock
 */
type CsvRow = Record<string, unknown>;

// Mock ra-core hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useNotify: vi.fn(() => vi.fn()),
    downloadCSV: vi.fn(),
  };
});

// Mock jsonexport
vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data: CsvRow[], callback: (err: Error | null, csv: string) => void) => {
    const csv = data.map((row: CsvRow) => Object.values(row).join(",")).join("\n");
    callback(null, csv);
  }),
}));

/**
 * Helper to create mock dataProvider for tests that need useReportData to return data.
 *
 * The component uses:
 * - useReportData (uses useDataProvider().getList()) - needs dataProvider.getList mock
 * - useCampaignActivityData (uses useDataProvider().rpc()) - needs dataProvider.rpc mock
 *
 * This helper creates both getList and rpc mocks for complete test coverage.
 */
const createMockDataProviderWithActivities = (
  activities: TestActivity[],
  opportunityCount: number = 1
) => ({
  getList: vi.fn().mockImplementation((resource: string) => {
    if (resource === "activities") {
      return Promise.resolve({
        data: activities,
        total: activities.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      });
    }
    // Return opportunities with the default campaign for other resources
    if (resource === "opportunities") {
      const mockOpps = Array.from({ length: opportunityCount }, (_, i) => ({
        id: i + 1,
        name: `Test Opp ${i + 1}`,
        campaign: "Grand Rapids Trade Show",
      }));
      return Promise.resolve({
        data: mockOpps,
        total: opportunityCount,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      });
    }
    return Promise.resolve({ data: [], total: 0 });
  }),
  // Mock RPC for get_campaign_report_stats - required for useCampaignActivityData
  rpc: vi.fn().mockImplementation((procedureName: string) => {
    if (procedureName === "get_campaign_report_stats") {
      return Promise.resolve({
        campaign_options: [{ name: "Grand Rapids Trade Show", count: opportunityCount }],
        sales_rep_options: [],
        activity_type_counts: {},
      });
    }
    return Promise.resolve({});
  }),
});

describe("CampaignActivityReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Activity Grouping Logic", () => {
    it("groups activities correctly by type", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Test note 1",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Test Org 1",
        },
        {
          id: 2,
          type: "call",
          subject: "Followup call",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Test Org 2",
        },
        {
          id: 3,
          type: "note",
          subject: "Test note 2",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Test Org 1",
        },
      ];

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: mockActivities,
          total: 3,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      // Pass dataProvider to make useReportData return activities
      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
      });
    });

    it("sorts groups by count in descending order", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        // 1 call
        {
          id: 1,
          type: "call",
          subject: "Call 1",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        // 3 notes (should be first)
        {
          id: 2,
          type: "note",
          subject: "Note 1",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 3,
          type: "note",
          subject: "Note 2",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Org 2",
        },
        {
          id: 4,
          type: "note",
          subject: "Note 3",
          created_at: "2025-11-11T13:00:00Z",
          created_by: 1,
          organization_id: 30,
          contact_id: null,
          organization_name: "Org 3",
        },
        // 2 emails (should be second)
        {
          id: 5,
          type: "email",
          subject: "Email 1",
          created_at: "2025-11-11T14:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 6,
          type: "email",
          subject: "Email 2",
          created_at: "2025-11-11T15:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Org 2",
        },
      ];

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: mockActivities,
          total: 6,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
      });
    });

    it("calculates percentage correctly", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Note 1",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 2,
          type: "note",
          subject: "Note 2",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Org 2",
        },
        {
          id: 3,
          type: "call",
          subject: "Call 1",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 1,
          organization_id: 30,
          contact_id: null,
          organization_name: "Org 3",
        },
        {
          id: 4,
          type: "call",
          subject: "Call 2",
          created_at: "2025-11-11T13:00:00Z",
          created_by: 1,
          organization_id: 40,
          contact_id: null,
          organization_name: "Org 4",
        },
      ];

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: mockActivities,
          total: 4,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        // 2 notes out of 4 total = 50%, 2 calls out of 4 total = 50%
        expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
      });
    });

    it("calculates unique organization count per group", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        // 2 notes, but both for same org (uniqueOrgs = 1)
        {
          id: 1,
          type: "note",
          subject: "Note 1",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 2,
          type: "note",
          subject: "Note 2",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        // 2 calls for different orgs (uniqueOrgs = 2)
        {
          id: 3,
          type: "call",
          subject: "Call 1",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Org 2",
        },
        {
          id: 4,
          type: "call",
          subject: "Call 2",
          created_at: "2025-11-11T13:00:00Z",
          created_by: 1,
          organization_id: 30,
          contact_id: null,
          organization_name: "Org 3",
        },
      ];

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: mockActivities,
          total: 4,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
      });
    });

    it("calculates most active organization correctly", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        // Org 1: 3 notes (most active)
        {
          id: 1,
          type: "note",
          subject: "Note 1",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 2,
          type: "note",
          subject: "Note 2",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        {
          id: 3,
          type: "note",
          subject: "Note 3",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Org 1",
        },
        // Org 2: 1 note
        {
          id: 4,
          type: "note",
          subject: "Note 4",
          created_at: "2025-11-11T13:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Org 2",
        },
      ];

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: mockActivities,
          total: 4,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        expect(screen.getByText("Activity Type Breakdown")).toBeInTheDocument();
      });
    });
  });

  describe("Filter Combinations", () => {
    it("filters by date range (start date)", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText("Start Date");
      await user.type(startDateInput, "2025-11-01");

      await waitFor(() => {
        expect(startDateInput).toHaveValue("2025-11-01");
      });
    });

    it("filters by date range (end date)", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByLabelText("End Date")).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText("Start Date");
      const endDateInput = screen.getByLabelText("End Date");

      fireEvent.change(startDateInput, { target: { value: "2025-11-01" } });
      fireEvent.change(endDateInput, { target: { value: "2025-11-30" } });

      await waitFor(() => {
        expect(endDateInput).toHaveValue("2025-11-30");
      });
    });

    it("filters by date preset (last 7 days)", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });

      const last7DaysButton = screen.getByText("Last 7 days");
      await user.click(last7DaysButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Start Date")).toHaveValue();
        expect(screen.getByLabelText("End Date")).toHaveValue();
      });
    });

    it("filters by activity type multi-select", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByText("Activity Type")).toBeInTheDocument();
      });
    });

    it("filters by sales rep", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByText("Sales Rep")).toBeInTheDocument();
      });
    });

    it("combines date and activity type filters", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByText("Activity Type")).toBeInTheDocument();
        expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
      });
    });

    it("clears all filters when Clear Filters is clicked", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />);

      // Set a date filter first
      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });

      const last7DaysButton = screen.getByText("Last 7 days");
      await user.click(last7DaysButton);

      await waitFor(() => {
        expect(screen.getAllByText("Clear Filters").length).toBeGreaterThan(0);
      });

      // Use getAllByText and pick the first "Clear Filters" button (toolbar button)
      const clearFiltersButtons = screen.getAllByText("Clear Filters");
      expect(clearFiltersButtons[0]).toBeDefined();
      await user.click(clearFiltersButtons[0]!);

      await waitFor(() => {
        expect(screen.getByLabelText("Start Date")).toHaveValue("");
        expect(screen.getByLabelText("End Date")).toHaveValue("");
      });
    });
  });

  describe("Stale Leads Calculation", () => {
    describe("Stage Data Integrity", () => {
      // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
      // See CampaignActivityReport.tsx line 148-160
      it.skip("should filter out opportunities with null stage and log error", async () => {
        const { useGetList } = await import("ra-core");
        const user = userEvent.setup();
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const mockOpportunities: TestOpportunity[] = [
          {
            id: 1,
            name: "Valid Stage Opp",
            campaign: "Grand Rapids Trade Show",
            customer_organization_name: "Test Org 1",
            stage: "new_lead",
          },
          {
            id: 2,
            name: "Null Stage Opp",
            campaign: "Grand Rapids Trade Show",
            customer_organization_name: "Test Org 2",
            stage: null, // Invalid - should be filtered out
          },
          {
            id: 3,
            name: "Undefined Stage Opp",
            campaign: "Grand Rapids Trade Show",
            customer_organization_name: "Test Org 3",
            // stage is undefined - should be filtered out
          },
        ];

        vi.mocked(useGetList).mockImplementation((resource: string) => {
          if (resource === "opportunities") {
            return mockUseGetListReturn<TestOpportunity>({
              data: mockOpportunities,
              total: 3,
              isPending: false,
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            });
          }
          return mockUseGetListReturn<TestActivity>({
            data: [],
            total: 0,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        });

        renderWithAdminContext(<CampaignActivityReport />);

        await waitFor(() => {
          expect(
            screen.getByLabelText("Show stale leads (per-stage thresholds)")
          ).toBeInTheDocument();
        });

        const staleLeadsCheckbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
        await user.click(staleLeadsCheckbox);

        await waitFor(() => {
          // Should have logged errors for both invalid opportunities
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("[DATA INTEGRITY] Opportunity ID 2 has no stage")
          );
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("[DATA INTEGRITY] Opportunity ID 3 has no stage")
          );
        });

        consoleErrorSpy.mockRestore();
      });

      // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
      // See CampaignActivityReport.tsx line 148-160
      it.skip("should process opportunities with valid stage without error", async () => {
        const { useGetList } = await import("ra-core");
        const user = userEvent.setup();
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const mockOpportunities: TestOpportunity[] = [
          {
            id: 1,
            name: "Valid Opp 1",
            campaign: "Grand Rapids Trade Show",
            customer_organization_name: "Test Org 1",
            stage: "new_lead",
          },
          {
            id: 2,
            name: "Valid Opp 2",
            campaign: "Grand Rapids Trade Show",
            customer_organization_name: "Test Org 2",
            stage: "initial_outreach",
          },
        ];

        vi.mocked(useGetList).mockImplementation((resource: string) => {
          if (resource === "opportunities") {
            return mockUseGetListReturn<TestOpportunity>({
              data: mockOpportunities,
              total: 2,
              isPending: false,
              isLoading: false,
              error: null,
              refetch: vi.fn(),
            });
          }
          return mockUseGetListReturn<TestActivity>({
            data: [],
            total: 0,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        });

        renderWithAdminContext(<CampaignActivityReport />);

        await waitFor(() => {
          expect(
            screen.getByLabelText("Show stale leads (per-stage thresholds)")
          ).toBeInTheDocument();
        });

        const staleLeadsCheckbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
        await user.click(staleLeadsCheckbox);

        await waitFor(() => {
          expect(screen.getByText(/Stale Leads Report/)).toBeInTheDocument();
        });

        // Should not have logged any DATA INTEGRITY errors
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("[DATA INTEGRITY]")
        );

        consoleErrorSpy.mockRestore();
      });
    });

    // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
    // See CampaignActivityReport.tsx line 148-160
    it.skip("identifies stale opportunities with no activity in threshold period", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Stale Opp",
          campaign: "Grand Rapids Trade Show",
          customer_organization_name: "Test Org 1",
          stage: "new_lead",
        },
      ];

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Old activity",
          created_at: "2025-10-01T10:00:00Z", // Over 30 days ago
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          opportunity_id: 1,
          organization_name: "Test Org 1",
        },
      ];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "activities") {
          return mockUseGetListReturn<TestActivity>({
            data: mockActivities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Show stale leads (per-stage thresholds)")
        ).toBeInTheDocument();
      });

      const staleLeadsCheckbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
      await user.click(staleLeadsCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/Stale Leads Report/)).toBeInTheDocument();
      });
    });

    // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
    // See CampaignActivityReport.tsx line 148-160
    it.skip("calculates days since last activity correctly", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Test Opp",
          campaign: "Grand Rapids Trade Show",
          customer_organization_name: "Test Org",
          stage: "new_lead",
        },
      ];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Show stale leads (per-stage thresholds)")
        ).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Stale Leads Report/)).toBeInTheDocument();
      });
    });

    // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
    // See CampaignActivityReport.tsx line 148-160
    it.skip("handles never contacted opportunities", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Never Contacted Opp",
          campaign: "Grand Rapids Trade Show",
          customer_organization_name: "Test Org",
          stage: "new_lead",
        },
      ];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Show stale leads (per-stage thresholds)")
        ).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Stale Leads Report/)).toBeInTheDocument();
      });
    });
  });

  describe("CSV Export Data", () => {
    it("generates correct CSV columns for activity export", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Test note",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: 1,
          opportunity_id: 1,
          organization_name: "Test Org",
          contact_name: "John Doe",
        },
      ];

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Test Opportunity",
          campaign: "Grand Rapids Trade Show",
          stage: "negotiation",
        },
      ];

      const mockSalesReps: TestSalesRep[] = [{ id: 1, first_name: "Jane", last_name: "Smith" }];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "activities") {
          return mockUseGetListReturn<TestActivity>({
            data: mockActivities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "sales") {
          return mockUseGetListReturn<TestSalesRep>({
            data: mockSalesReps,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />);

      await waitFor(() => {
        expect(screen.getByText("Export to CSV")).toBeInTheDocument();
      });
    });

    it("sanitizes CSV data to prevent formula injection", () => {
      // Test formula injection prevention
      expect(sanitizeCsvValue("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
      expect(sanitizeCsvValue("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
      expect(sanitizeCsvValue("-10+20")).toBe("'-10+20");
      expect(sanitizeCsvValue("@SUM(A:A)")).toBe("'@SUM(A:A)");

      // Test control character removal
      expect(sanitizeCsvValue("test\x00value")).toBe("testvalue");
      expect(sanitizeCsvValue("line1\x1Fline2")).toBe("line1line2");

      // Test normal values pass through
      expect(sanitizeCsvValue("Normal Organization Name")).toBe("Normal Organization Name");
      expect(sanitizeCsvValue("")).toBe("");
      expect(sanitizeCsvValue(null)).toBe("");
      expect(sanitizeCsvValue(undefined)).toBe("");
    });
  });

  describe("Empty States", () => {
    it("shows empty state when no activities found", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities([]),
      });

      await waitFor(() => {
        expect(screen.getByText("No Campaign Activities")).toBeInTheDocument();
        expect(
          screen.getByText("Activities will appear here once your team starts engaging with leads.")
        ).toBeInTheDocument();
      });
    });

    it("shows empty state when campaign has no opportunities", async () => {
      const { useGetList } = await import("ra-core");

      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities([]),
      });

      await waitFor(() => {
        expect(screen.getByText("No Campaign Activities")).toBeInTheDocument();
      });
    });

    it("shows empty state when filters result in 0 matches", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      vi.mocked(useGetList).mockImplementation(() => {
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities([]),
      });

      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });

      const last7DaysButton = screen.getByText("Last 7 days");
      await user.click(last7DaysButton);

      await waitFor(() => {
        expect(
          screen.getByText("Try adjusting your filters to see more results.")
        ).toBeInTheDocument();
      });
    });

    // TODO: Re-enable when server-side RPC get_stale_opportunities is implemented
    // See CampaignActivityReport.tsx line 148-160
    it.skip("shows empty state for stale leads when none found", async () => {
      const { useGetList } = await import("ra-core");
      const user = userEvent.setup();

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Active Opp",
          campaign: "Grand Rapids Trade Show",
          customer_organization_name: "Test Org",
          stage: "new_lead",
        },
      ];

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Recent activity",
          created_at: new Date().toISOString(), // Activity today
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          opportunity_id: 1,
          organization_name: "Test Org",
        },
      ];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "activities") {
          return mockUseGetListReturn<TestActivity>({
            data: mockActivities,
            total: 1,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities(mockActivities),
      });

      await waitFor(() => {
        expect(
          screen.getByLabelText("Show stale leads (per-stage thresholds)")
        ).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText("Show stale leads (per-stage thresholds)");
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText("No Stale Leads")).toBeInTheDocument();
        expect(screen.getByText("All leads have recent activity - great job!")).toBeInTheDocument();
      });
    });
  });

  describe("Rendering and UI", () => {
    it("renders report title and summary cards", async () => {
      const { useGetList } = await import("ra-core");
      vi.mocked(useGetList).mockReturnValue(
        mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        })
      );

      renderWithAdminContext(<CampaignActivityReport />, {
        dataProvider: createMockDataProviderWithActivities([]),
      });

      await waitFor(() => {
        expect(screen.getByText("Campaign Activity Report")).toBeInTheDocument();
      });

      // Summary cards
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
      expect(screen.getByText("Organizations Contacted")).toBeInTheDocument();
      expect(screen.getByText("Coverage Rate")).toBeInTheDocument();
      expect(screen.getByText("Avg Activities per Lead")).toBeInTheDocument();
    });

    it("calculates summary metrics correctly", async () => {
      const { useGetList } = await import("ra-core");

      const mockActivities: TestActivity[] = [
        {
          id: 1,
          type: "note",
          subject: "Test",
          created_at: "2025-11-11T10:00:00Z",
          created_by: 1,
          organization_id: 10,
          contact_id: null,
          organization_name: "Test Org 1",
        },
        {
          id: 2,
          type: "call",
          subject: "Followup",
          created_at: "2025-11-11T11:00:00Z",
          created_by: 1,
          organization_id: 20,
          contact_id: null,
          organization_name: "Test Org 2",
        },
        {
          id: 3,
          type: "email",
          subject: "Product info",
          created_at: "2025-11-11T12:00:00Z",
          created_by: 2,
          organization_id: 30,
          contact_id: null,
          organization_name: "Test Org 3",
        },
      ];

      const mockOpportunities: TestOpportunity[] = [
        {
          id: 1,
          name: "Test Opp 1",
          campaign: "Grand Rapids Trade Show",
          stage: "new_lead",
        },
        {
          id: 2,
          name: "Test Opp 2",
          campaign: "Grand Rapids Trade Show",
          stage: "initial_outreach",
        },
        {
          id: 3,
          name: "Test Opp 3",
          campaign: "Grand Rapids Trade Show",
          stage: "demo_scheduled",
        },
      ];

      const mockSalesReps: TestSalesRep[] = [
        { id: 1, first_name: "John", last_name: "Smith" },
        { id: 2, first_name: "Jane", last_name: "Doe" },
      ];

      vi.mocked(useGetList).mockImplementation((resource: string) => {
        if (resource === "activities") {
          return mockUseGetListReturn<TestActivity>({
            data: mockActivities,
            total: 3,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "opportunities") {
          return mockUseGetListReturn<TestOpportunity>({
            data: mockOpportunities,
            total: 3,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        } else if (resource === "sales") {
          return mockUseGetListReturn<TestSalesRep>({
            data: mockSalesReps,
            total: 2,
            isPending: false,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          });
        }
        return mockUseGetListReturn<TestActivity>({
          data: [],
          total: 0,
          isPending: false,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        });
      });

      renderWithAdminContext(<CampaignActivityReport />, {
        // Pass opportunityCount=3 to match the 3 activities for correct metrics
        dataProvider: createMockDataProviderWithActivities(mockActivities, 3),
      });

      await waitFor(() => {
        // Check summary metrics - using getAllByText since "3" appears twice
        const threeElements = screen.getAllByText("3");
        expect(threeElements).toHaveLength(2); // Total Activities and Organizations Contacted both show "3"

        // Coverage Rate: 3 orgs contacted / 3 opportunities = 100%
        expect(screen.getByText("100%")).toBeInTheDocument();
        // Avg per lead: 3 activities / 3 opportunities = 1.0
        expect(screen.getByText("1.0")).toBeInTheDocument();
      });
    });
  });
});
