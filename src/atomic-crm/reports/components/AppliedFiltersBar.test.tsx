// src/atomic-crm/reports/components/AppliedFiltersBar.test.tsx
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { AppliedFiltersBar } from "./AppliedFiltersBar";

describe("AppliedFiltersBar", () => {
  const createFilters = () => [
    { label: "Date Range", value: "Last 7 Days", onRemove: vi.fn() },
    { label: "Sales Rep", value: "John Smith", onRemove: vi.fn() },
  ];

  it("renders nothing when hasActiveFilters is false", () => {
    const { container } = renderWithAdminContext(
      <AppliedFiltersBar filters={createFilters()} onResetAll={vi.fn()} hasActiveFilters={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when filters array is empty", () => {
    const { container } = renderWithAdminContext(
      <AppliedFiltersBar filters={[]} onResetAll={vi.fn()} hasActiveFilters={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders all filter chips when hasActiveFilters is true", () => {
    renderWithAdminContext(
      <AppliedFiltersBar filters={createFilters()} onResetAll={vi.fn()} hasActiveFilters={true} />
    );

    expect(screen.getByText("Date Range:")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
    expect(screen.getByText("Sales Rep:")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("renders Clear filters button", () => {
    renderWithAdminContext(
      <AppliedFiltersBar filters={createFilters()} onResetAll={vi.fn()} hasActiveFilters={true} />
    );

    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("calls onResetAll when Clear filters button is clicked", async () => {
    const onResetAll = vi.fn();
    const user = userEvent.setup();

    renderWithAdminContext(
      <AppliedFiltersBar
        filters={createFilters()}
        onResetAll={onResetAll}
        hasActiveFilters={true}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it("calls individual filter onRemove when chip is dismissed", async () => {
    const filter1OnRemove = vi.fn();
    const filter2OnRemove = vi.fn();
    const filters = [
      { label: "Date Range", value: "Last 7 Days", onRemove: filter1OnRemove },
      { label: "Sales Rep", value: "John Smith", onRemove: filter2OnRemove },
    ];
    const user = userEvent.setup();

    renderWithAdminContext(
      <AppliedFiltersBar filters={filters} onResetAll={vi.fn()} hasActiveFilters={true} />
    );

    // Click remove on first filter
    const removeButtons = screen.getAllByRole("button", {
      name: /remove.*filter/i,
    });
    await user.click(removeButtons[0]);

    expect(filter1OnRemove).toHaveBeenCalledTimes(1);
    expect(filter2OnRemove).not.toHaveBeenCalled();
  });

  it("has role=list on filters container", () => {
    renderWithAdminContext(
      <AppliedFiltersBar filters={createFilters()} onResetAll={vi.fn()} hasActiveFilters={true} />
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
