import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import jsonExport from "jsonexport/dist";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import type { RaRecord } from "ra-core";
import type { Mock } from "vitest";
import WeeklyActivitySummary from "../WeeklyActivitySummary";

/**
 * Test activity record type matching WeeklyActivityRecord shape.
 *
 * Extends the base activity fields with the view-computed columns
 * that the refactored component reads directly.
 */
interface TestWeeklyActivity extends RaRecord {
  id: number;
  activity_type: "activity" | "task";
  type: string;
  subject: string;
  activity_date: string;
  created_by: number | null;
  organization_id: number | null;
  contact_id: number | null;
  opportunity_id: number | null;
  principal_organization_id: number | null;
  principal_organization_name: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
  follow_up_required: boolean;
  sample_status: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Mock the report hooks module.
 *
 * - useReportData: controlled via mockUseReportData so each test can set data
 * - useReportFilterState: returns stable defaults (current week range)
 *
 * Mocking hooks directly avoids the need to mock all of ra-core and
 * eliminates timeouts from async vi.importActual("ra-core").
 */
const mockUseReportData = vi.fn();

vi.mock("../hooks", () => ({
  useReportData: (...args: unknown[]) => mockUseReportData(...args),
  useReportFilterState: () => [{ start: "2026-02-09", end: "2026-02-15" }, vi.fn(), vi.fn()],
}));

// Mock jsonexport (used by CSV export)
vi.mock("jsonexport/dist", () => ({
  default: vi.fn(
    (data: Array<Record<string, unknown>>, callback: (err: Error | null, csv: string) => void) => {
      const csv = data.map((row) => Object.values(row).join(",")).join("\n");
      callback(null, csv);
    }
  ),
}));

/** Minimal defaults for a test activity record */
function makeActivity(overrides: Partial<TestWeeklyActivity>): TestWeeklyActivity {
  return {
    id: 1,
    activity_type: "activity",
    type: "call",
    subject: "Test activity",
    activity_date: "2026-02-10",
    created_by: 1,
    organization_id: 100,
    contact_id: null,
    opportunity_id: null,
    principal_organization_id: null,
    principal_organization_name: null,
    creator_first_name: null,
    creator_last_name: null,
    follow_up_required: false,
    sample_status: null,
    created_at: "2026-02-10T10:00:00Z",
    updated_at: "2026-02-10T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

/**
 * Configure mockUseReportData to return the given activities array
 * with isLoading=false and no error.
 */
function setActivities(activities: TestWeeklyActivity[]) {
  mockUseReportData.mockReturnValue({
    data: activities,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isTruncated: false,
    total: activities.length,
  });
}

/**
 * Factory to build a mock dataProvider whose getList tracks all calls.
 * Used by tests 4-5 to verify no "organizations" or "sales" resource is fetched.
 */
function createSpyDataProvider(activities: TestWeeklyActivity[]) {
  const getListSpy: Mock = vi.fn().mockImplementation((resource: string) => {
    if (resource === "activities") {
      return Promise.resolve({
        data: activities,
        total: activities.length,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      });
    }
    return Promise.resolve({ data: [], total: 0 });
  });

  return {
    dataProvider: { getList: getListSpy },
    getListSpy,
  };
}

describe("WeeklyActivitySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub URL.createObjectURL for downloadCSV (not available in JSDOM)
    if (typeof URL.createObjectURL !== "function") {
      URL.createObjectURL = vi.fn(() => "blob:mock-url");
    }
  });

  // ---------------------------------------------------------------
  // 1. Principal name renders from view field
  // ---------------------------------------------------------------
  it("renders principal name from the activities_summary view field", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "John",
        creator_last_name: "Doe",
        principal_organization_id: 3,
        principal_organization_name: "Midwest Foods Co.",
        type: "call",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Midwest Foods Co.")).toBeInTheDocument();
    });

    // "No Principal" should NOT appear
    expect(screen.queryByText("No Principal")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // 2. Null principal fallback shows "No Principal"
  // ---------------------------------------------------------------
  it('renders "No Principal" when principal fields are null', async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Alice",
        creator_last_name: "Wang",
        principal_organization_id: null,
        principal_organization_name: null,
        type: "email",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("No Principal")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------
  // 3. Archived-opportunity principal linkage
  // ---------------------------------------------------------------
  it("renders principal from a soft-deleted opportunity via view fields", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Bob",
        creator_last_name: "Lee",
        principal_organization_id: 5,
        principal_organization_name: "Archived Corp",
        type: "meeting",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Archived Corp")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------
  // 4. No organizations fetch
  // ---------------------------------------------------------------
  it('does NOT call dataProvider.getList with "organizations"', async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Sue",
        creator_last_name: "Martinez",
        principal_organization_id: 7,
        principal_organization_name: "Fresh Farms Inc.",
        type: "call",
      }),
    ];

    // useReportData is mocked, so dataProvider.getList is only called if the
    // component makes additional fetches beyond useReportData.
    setActivities(activities);
    const { dataProvider, getListSpy } = createSpyDataProvider(activities);

    renderWithAdminContext(<WeeklyActivitySummary />, { dataProvider });

    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(screen.getByText("Fresh Farms Inc.")).toBeInTheDocument();
    });

    // Verify getList was never called with "organizations"
    const calledResources = getListSpy.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(calledResources).not.toContain("organizations");
  });

  // ---------------------------------------------------------------
  // 5. No sales fetch
  // ---------------------------------------------------------------
  it('does NOT call dataProvider.getList with "sales"', async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Sue",
        creator_last_name: "Martinez",
        principal_organization_id: 7,
        principal_organization_name: "Fresh Farms Inc.",
        type: "call",
      }),
    ];

    setActivities(activities);
    const { dataProvider, getListSpy } = createSpyDataProvider(activities);

    renderWithAdminContext(<WeeklyActivitySummary />, { dataProvider });

    await waitFor(() => {
      expect(screen.getByText("Fresh Farms Inc.")).toBeInTheDocument();
    });

    const calledResources = getListSpy.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(calledResources).not.toContain("sales");
  });

  // ---------------------------------------------------------------
  // 6. Rep name from view fields
  // ---------------------------------------------------------------
  it("renders rep name from creator_first_name / creator_last_name view fields", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 42,
        creator_first_name: "Sue",
        creator_last_name: "Martinez",
        principal_organization_id: 9,
        principal_organization_name: "Test Principal",
        type: "call",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Sue Martinez")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------
  // 7. Null rep name fallback
  // ---------------------------------------------------------------
  it('renders "Unknown Rep (#42)" when creator name fields are null', async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 42,
        creator_first_name: null,
        creator_last_name: null,
        principal_organization_id: 9,
        principal_organization_name: "Test Principal",
        type: "call",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Unknown Rep (#42)")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------
  // 8. Follow-up type counts in Follow-up column
  // ---------------------------------------------------------------
  it("counts follow_up type in the Follow-up column", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 3,
        principal_organization_name: "Acme Foods",
        type: "follow_up",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Acme Foods")).toBeInTheDocument();
    });

    // Find the table and scope to the data row
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // rows[0] = header, rows[1] = data row
    const cells = within(rows[1]).getAllByRole("cell");
    // Column order after Principal(0): Call(1), Email(2), Meeting(3), Follow-up(4), Demo(5), Proposal(6), Notes(7), Other(8), Total(9)
    expect(cells[1]).toHaveTextContent("0"); // Call
    expect(cells[2]).toHaveTextContent("0"); // Email
    expect(cells[3]).toHaveTextContent("0"); // Meeting
    expect(cells[4]).toHaveTextContent("1"); // Follow-up
    expect(cells[5]).toHaveTextContent("0"); // Demo
    expect(cells[6]).toHaveTextContent("0"); // Proposal
    expect(cells[7]).toHaveTextContent("0"); // Notes
    expect(cells[8]).toHaveTextContent("0"); // Other
    expect(cells[9]).toHaveTextContent("1"); // Total
  });

  // ---------------------------------------------------------------
  // 9. Note type counts in Notes column
  // ---------------------------------------------------------------
  it("counts note type in the Notes column", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 4,
        principal_organization_name: "Beta Corp",
        type: "note",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Beta Corp")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");

    expect(cells[1]).toHaveTextContent("0"); // Call
    expect(cells[2]).toHaveTextContent("0"); // Email
    expect(cells[3]).toHaveTextContent("0"); // Meeting
    expect(cells[4]).toHaveTextContent("0"); // Follow-up
    expect(cells[5]).toHaveTextContent("0"); // Demo
    expect(cells[6]).toHaveTextContent("0"); // Proposal
    expect(cells[7]).toHaveTextContent("1"); // Notes
    expect(cells[8]).toHaveTextContent("0"); // Other
    expect(cells[9]).toHaveTextContent("1"); // Total
  });

  // ---------------------------------------------------------------
  // 10. Unknown type falls to Other column
  // ---------------------------------------------------------------
  it("counts unknown activity type in the Other column", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 5,
        principal_organization_name: "Gamma LLC",
        type: "trade_show",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Gamma LLC")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");

    expect(cells[1]).toHaveTextContent("0"); // Call
    expect(cells[2]).toHaveTextContent("0"); // Email
    expect(cells[3]).toHaveTextContent("0"); // Meeting
    expect(cells[4]).toHaveTextContent("0"); // Follow-up
    expect(cells[5]).toHaveTextContent("0"); // Demo
    expect(cells[6]).toHaveTextContent("0"); // Proposal
    expect(cells[7]).toHaveTextContent("0"); // Notes
    expect(cells[8]).toHaveTextContent("1"); // Other
    expect(cells[9]).toHaveTextContent("1"); // Total
  });

  // ---------------------------------------------------------------
  // 11. Task activity_type uses interaction_type, not separate column
  // ---------------------------------------------------------------
  it("counts task activity_type by its interaction type (no separate Tasks column)", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 6,
        principal_organization_name: "Delta Inc",
        activity_type: "task",
        type: "call",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Delta Inc")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");

    // activity_type "task" should NOT create a separate column;
    // the interaction type "call" should increment the Call column
    expect(cells[1]).toHaveTextContent("1"); // Call
    expect(cells[2]).toHaveTextContent("0"); // Email
    expect(cells[3]).toHaveTextContent("0"); // Meeting
    expect(cells[4]).toHaveTextContent("0"); // Follow-up
    expect(cells[5]).toHaveTextContent("0"); // Demo
    expect(cells[6]).toHaveTextContent("0"); // Proposal
    expect(cells[7]).toHaveTextContent("0"); // Notes
    expect(cells[8]).toHaveTextContent("0"); // Other
    expect(cells[9]).toHaveTextContent("1"); // Total

    // Verify no "Tasks" column header exists
    const headers = within(table).getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);
    expect(headerTexts).not.toContain("Tasks");
  });

  // ---------------------------------------------------------------
  // 12. Table headers match expected order
  // ---------------------------------------------------------------
  it("renders table headers in expected column order", async () => {
    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 7,
        principal_organization_name: "Epsilon Corp",
        type: "call",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Epsilon Corp")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent);

    expect(headerTexts).toEqual([
      "Principal",
      "Call",
      "Email",
      "Meeting",
      "Follow-up",
      "Demo",
      "Proposal",
      "Notes",
      "Other",
      "Total",
    ]);
  });

  // ---------------------------------------------------------------
  // 13. CSV export has correct column names
  // ---------------------------------------------------------------
  it("exports CSV data with expected column keys", async () => {
    const user = userEvent.setup();

    const activities: TestWeeklyActivity[] = [
      makeActivity({
        id: 1,
        created_by: 10,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        principal_organization_id: 8,
        principal_organization_name: "Zeta Foods",
        type: "email",
      }),
    ];

    setActivities(activities);
    renderWithAdminContext(<WeeklyActivitySummary />);

    await waitFor(() => {
      expect(screen.getByText("Zeta Foods")).toBeInTheDocument();
    });

    // Click the export button rendered by ReportLayout
    const exportButton = screen.getByRole("button", { name: /export csv/i });
    await user.click(exportButton);

    // Verify jsonExport was called with data containing expected keys
    const mockedJsonExport = vi.mocked(jsonExport);
    expect(mockedJsonExport).toHaveBeenCalledTimes(1);

    const exportedData = mockedJsonExport.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(exportedData).toHaveLength(1);

    const expectedKeys = [
      "rep_name",
      "principal_name",
      "call",
      "email",
      "meeting",
      "follow_up",
      "demo",
      "proposal",
      "notes",
      "other",
      "total",
    ];
    expect(Object.keys(exportedData[0])).toEqual(expectedKeys);

    // Verify actual values
    expect(exportedData[0].rep_name).toBe("Jane Smith");
    expect(exportedData[0].principal_name).toBe("Zeta Foods");
    expect(exportedData[0].email).toBe(1);
    expect(exportedData[0].call).toBe(0);
    expect(exportedData[0].total).toBe(1);
  });
});
