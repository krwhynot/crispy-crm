import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TabFilterBar } from "./TabFilterBar";
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";

// Mock ra-core hooks
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

import { useGetList } from "ra-core";

interface SalesRep {
  id: number;
  first_name: string;
  last_name: string;
}

const mockSalesReps: SalesRep[] = [
  { id: 1, first_name: "John", last_name: "Smith" },
  { id: 2, first_name: "Jane", last_name: "Doe" },
];

describe("TabFilterBar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useGetList<SalesRep>).mockReturnValue(
      mockUseGetListReturn<SalesRep>({ data: mockSalesReps, isPending: false })
    );
  });
  it("renders date range selector with presets", () => {
    const onChange = vi.fn();
    renderWithAdminContext(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last30", start: null, end: null }}
        onDateRangeChange={onChange}
      />
    );

    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
  });

  it("renders sales rep selector when enabled", () => {
    const onChange = vi.fn();
    renderWithAdminContext(<TabFilterBar showSalesRep salesRepId={null} onSalesRepChange={onChange} />);

    expect(screen.getByLabelText(/sales rep/i)).toBeInTheDocument();
  });

  it("shows reset button when filters are active", () => {
    const onReset = vi.fn();
    renderWithAdminContext(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last7", start: null, end: null }}
        onDateRangeChange={vi.fn()}
        hasActiveFilters
        onReset={onReset}
      />
    );

    const resetButton = screen.getByRole("button", { name: /reset/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(onReset).toHaveBeenCalled();
  });

  it("meets 44px touch target requirement", () => {
    renderWithAdminContext(
      <TabFilterBar
        showDateRange
        dateRange={{ preset: "last30", start: null, end: null }}
        onDateRangeChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveClass("h-11"); // 44px = h-11
  });
});
