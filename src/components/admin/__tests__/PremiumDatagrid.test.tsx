/**
 * Tests for PremiumDatagrid component
 *
 * Tests the enhanced Datagrid wrapper with premium hover effects,
 * custom row click handling, and keyboard navigation focus indicators.
 *
 * This is a high-leverage shared component used across all list views.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, render, fireEvent } from "@testing-library/react";
import { PremiumDatagrid } from "../PremiumDatagrid";

// Mock useListContext from react-admin
const mockListContext = {
  data: [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ],
  total: 3,
  isLoading: false,
  filterValues: {},
  setFilters: vi.fn(),
  displayedFilters: {},
  showFilter: vi.fn(),
  hideFilter: vi.fn(),
  sort: { field: "name", order: "ASC" as const },
  setSort: vi.fn(),
  resource: "items",
  selectedIds: [] as (string | number)[],
  onSelect: vi.fn(),
  onToggleItem: vi.fn(),
  onUnselectItems: vi.fn(),
};

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => mockListContext),
    Datagrid: ({ children, rowClassName, rowClick }: {
  children?: React.ReactNode;
  rowClassName?: string | ((record: unknown, index: number) => string);
  rowClick?: string | false | ((id: unknown, resource: string, record: unknown) => void);
}) => {
      const getRowClass = (record: unknown, index: number) => {
        if (typeof rowClassName === "function") {
          return rowClassName(record, index);
        }
        return rowClassName || "";
      };

      return (
        <div data-testid="datagrid">
          {mockListContext.data.map((record, index) => (
            <div
              key={record.id}
              data-testid={`datagrid-row-${record.id}`}
              className={getRowClass(record, index)}
              onClick={() => {
                if (typeof rowClick === "function") {
                  rowClick(record.id);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && typeof rowClick === "function") {
                  rowClick(record.id);
                }
              }}
              role="row"
              tabIndex={0}
            >
              {record.name}
            </div>
          ))}
          <div data-testid="datagrid-children">{children}</div>
        </div>
      );
    },
  };
});

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

describe("PremiumDatagrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Row Click", () => {
    test("calls onClick with record ID when row clicked", () => {
      const handleRowClick = vi.fn();

      render(
        <PremiumDatagrid onRowClick={handleRowClick}>
          <span data-testid="column">Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-1");
      fireEvent.click(row);

      expect(handleRowClick).toHaveBeenCalledWith(1);
      expect(handleRowClick).toHaveBeenCalledTimes(1);
    });

    test("calls onClick with correct ID for different rows", () => {
      const handleRowClick = vi.fn();

      render(
        <PremiumDatagrid onRowClick={handleRowClick}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      fireEvent.click(screen.getByTestId("datagrid-row-1"));
      expect(handleRowClick).toHaveBeenLastCalledWith(1);

      fireEvent.click(screen.getByTestId("datagrid-row-2"));
      expect(handleRowClick).toHaveBeenLastCalledWith(2);

      fireEvent.click(screen.getByTestId("datagrid-row-3"));
      expect(handleRowClick).toHaveBeenLastCalledWith(3);
    });

    test("supports keyboard activation with Enter key", () => {
      const handleRowClick = vi.fn();

      render(
        <PremiumDatagrid onRowClick={handleRowClick}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-1");
      fireEvent.keyDown(row, { key: "Enter" });

      expect(handleRowClick).toHaveBeenCalledWith(1);
    });

    test("supports keyboard activation with Space key", () => {
      const handleRowClick = vi.fn();

      render(
        <PremiumDatagrid onRowClick={handleRowClick}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-2");
      fireEvent.keyDown(row, { key: " " });

      expect(handleRowClick).toHaveBeenCalledWith(2);
    });

    test("does not call onClick when onRowClick is not provided", () => {
      render(
        <PremiumDatagrid>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-1");
      expect(() => fireEvent.click(row)).not.toThrow();
    });
  });

  describe("Focused Row", () => {
    test("highlights row matching focusedIndex", () => {
      render(
        <PremiumDatagrid focusedIndex={1}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const focusedRow = screen.getByTestId("datagrid-row-2");
      expect(focusedRow.className).toContain("ring-2");
      expect(focusedRow.className).toContain("ring-primary");
      expect(focusedRow.className).toContain("bg-primary/5");
    });

    test("applies focus class only to correct row index", () => {
      render(
        <PremiumDatagrid focusedIndex={0}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const firstRow = screen.getByTestId("datagrid-row-1");
      const secondRow = screen.getByTestId("datagrid-row-2");
      const thirdRow = screen.getByTestId("datagrid-row-3");

      expect(firstRow.className).toContain("ring-2");
      expect(secondRow.className).not.toContain("ring-2");
      expect(thirdRow.className).not.toContain("ring-2");
    });

    test("applies table-row-premium class to all rows", () => {
      render(
        <PremiumDatagrid>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-1");
      expect(row.className).toContain("table-row-premium");
    });

    test("does not apply focus styling when focusedIndex is undefined", () => {
      render(
        <PremiumDatagrid focusedIndex={undefined}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const firstRow = screen.getByTestId("datagrid-row-1");
      expect(firstRow.className).not.toContain("ring-2");
      expect(firstRow.className).not.toContain("ring-primary");
    });

    test("does not apply focus styling when focusedIndex is -1", () => {
      render(
        <PremiumDatagrid focusedIndex={-1}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const firstRow = screen.getByTestId("datagrid-row-1");
      expect(firstRow.className).not.toContain("ring-2");
    });

    test("supports external rowClassName function", () => {
      const customRowClassName = (record: any, index: number) =>
        index === 0 ? "custom-first-row" : "custom-row";

      render(
        <PremiumDatagrid rowClassName={customRowClassName}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const firstRow = screen.getByTestId("datagrid-row-1");
      const secondRow = screen.getByTestId("datagrid-row-2");

      expect(firstRow.className).toContain("custom-first-row");
      expect(firstRow.className).toContain("table-row-premium");

      expect(secondRow.className).toContain("custom-row");
      expect(secondRow.className).toContain("table-row-premium");
    });

    test("supports external rowClassName string", () => {
      render(
        <PremiumDatagrid rowClassName="custom-static-class">
          <span>Column</span>
        </PremiumDatagrid>
      );

      const row = screen.getByTestId("datagrid-row-1");
      expect(row.className).toContain("custom-static-class");
      expect(row.className).toContain("table-row-premium");
    });

    test("merges focus styling with external rowClassName", () => {
      render(
        <PremiumDatagrid focusedIndex={0} rowClassName="custom-class">
          <span>Column</span>
        </PremiumDatagrid>
      );

      const firstRow = screen.getByTestId("datagrid-row-1");
      expect(firstRow.className).toContain("custom-class");
      expect(firstRow.className).toContain("ring-2");
      expect(firstRow.className).toContain("table-row-premium");
    });
  });

  describe("Column Rendering", () => {
    test("passes children to Datagrid", () => {
      render(
        <PremiumDatagrid>
          <span data-testid="child-column-1">Column 1</span>
          <span data-testid="child-column-2">Column 2</span>
        </PremiumDatagrid>
      );

      expect(screen.getByTestId("child-column-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-column-2")).toBeInTheDocument();
    });

    test("renders within overflow container", () => {
      const { container } = render(
        <PremiumDatagrid>
          <span>Column</span>
        </PremiumDatagrid>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex-1");
      expect(wrapper).toHaveClass("min-h-0");
      expect(wrapper).toHaveClass("overflow-auto");
    });
  });

  describe("Empty State", () => {
    test("renders datagrid structure even with empty data array", () => {
      render(
        <PremiumDatagrid>
          <span data-testid="empty-column">Column</span>
        </PremiumDatagrid>
      );

      expect(screen.getByTestId("datagrid")).toBeInTheDocument();
      expect(screen.getByTestId("empty-column")).toBeInTheDocument();
    });
  });

  describe("Props Passthrough", () => {
    test("passes additional props to Datagrid", () => {
      render(
        <PremiumDatagrid bulkActionButtons={false}>
          <span>Column</span>
        </PremiumDatagrid>
      );

      expect(screen.getByTestId("datagrid")).toBeInTheDocument();
    });
  });
});
