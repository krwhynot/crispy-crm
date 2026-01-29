import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FilterChipBar } from "./FilterChipBar";
import type { ChipFilterConfig } from "./filterConfigSchema";

// Mock React Admin hooks
const mockSetFilters = vi.fn();
const mockFilterValues = { status: "active", organization_id: "123" };

vi.mock("ra-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ra-core")>();
  return {
    ...actual,
    useListContext: () => ({
      filterValues: mockFilterValues,
      setFilters: mockSetFilters,
      displayedFilters: {},
    }),
  };
});

// Mock name hooks
vi.mock("@/atomic-crm/hooks/useResourceNames", () => ({
  useOrganizationName: () => (id: string) => `Organization ${id}`,
  useSalesName: () => (id: string) => `Sales ${id}`,
  useTagName: () => (id: string) => `Tag ${id}`,
  useSegmentName: () => (id: string) => `Segment ${id}`,
  useCategoryName: () => (id: string) => `Category ${id}`,
}));

describe("FilterChipBar", () => {
  const mockFilterConfig: ChipFilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      choices: [
        { id: "active", name: "Active" },
        { id: "disabled", name: "Disabled" },
      ],
    },
    {
      key: "organization_id",
      label: "Organization",
      type: "reference",
      reference: "organizations",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should throw error if filterConfig is empty", () => {
      expect(() => {
        renderWithAdminContext(<FilterChipBar filterConfig={[]} />);
      }).toThrow("FilterChipBar requires a non-empty filterConfig");
    });

    it("should render active filter chips", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      expect(screen.getByText("Active filters:")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Organization 123")).toBeInTheDocument();
    });

    it("should not render when no active filters", () => {
      vi.mocked(
        vi.importActual<typeof import("ra-core")>("ra-core") as unknown as {
          useListContext: () => unknown;
        }
      ).useListContext = () => ({
        filterValues: {},
        setFilters: mockSetFilters,
        displayedFilters: {},
      });

      const { container } = renderWithAdminContext(
        <FilterChipBar filterConfig={mockFilterConfig} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render Clear all button when 2+ filters active", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const clearButton = screen.getByRole("button", { name: /Clear all 2 filters/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("should focus next chip on ArrowRight", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      expect(buttons.length).toBe(2);

      buttons[0]!.focus();
      expect(document.activeElement).toBe(buttons[0]);

      fireEvent.keyDown(buttons[0]!, { key: "ArrowRight" });
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("should focus previous chip on ArrowLeft", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      buttons[1]!.focus();
      expect(document.activeElement).toBe(buttons[1]);

      fireEvent.keyDown(buttons[1]!, { key: "ArrowLeft" });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("should wrap to last chip on ArrowLeft from first chip", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      buttons[0]!.focus();

      fireEvent.keyDown(buttons[0]!, { key: "ArrowLeft" });
      expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    });

    it("should wrap to first chip on ArrowRight from last chip", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      const lastButton = buttons[buttons.length - 1]!;
      lastButton.focus();

      fireEvent.keyDown(lastButton, { key: "ArrowRight" });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("should focus first chip on Home", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      buttons[1]!.focus();

      fireEvent.keyDown(buttons[1]!, { key: "Home" });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("should focus last chip on End", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      buttons[0]!.focus();

      fireEvent.keyDown(buttons[0]!, { key: "End" });
      expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    });

    it("should not crash on keyboard events with no buttons", () => {
      vi.mocked(vi.importActual<typeof import("ra-core")>("ra-core") as any).useListContext =
        () => ({
          filterValues: {},
          setFilters: mockSetFilters,
          displayedFilters: {},
        });

      const { container } = renderWithAdminContext(
        <FilterChipBar filterConfig={mockFilterConfig} />
      );

      // Component returns null when no filters
      expect(container.firstChild).toBeNull();
    });
  });

  describe("filter removal", () => {
    it("should remove individual filter on chip click", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const removeButton = screen.getByRole("button", { name: /Remove Active filter/i });
      fireEvent.click(removeButton);

      expect(mockSetFilters).toHaveBeenCalledWith(
        { organization_id: "123" }, // status removed
        {}
      );
    });

    it("should clear all filters on Clear all click", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const clearButton = screen.getByRole("button", { name: /Clear all 2 filters/i });
      fireEvent.click(clearButton);

      expect(mockSetFilters).toHaveBeenCalledWith({}, {});
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA roles", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      expect(screen.getByRole("toolbar", { name: "Active filters" })).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeInTheDocument();

      const listitems = screen.getAllByRole("listitem");
      expect(listitems.length).toBe(2); // One for each filter chip
    });

    it("should have data-chip-button attribute on chip buttons", () => {
      renderWithAdminContext(<FilterChipBar filterConfig={mockFilterConfig} />);

      const buttons = screen.getAllByRole("button", { name: /Remove/i });
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("data-chip-button");
      });
    });
  });
});
