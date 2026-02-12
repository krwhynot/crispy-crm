import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import ProductShow from "../ProductShow";
import type { Product } from "../../types";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    RecordRepresentation: () => <span data-testid="record-representation">Principal Name</span>,
  };
});

vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/date-field", () => ({
  DateField: ({ source }: { source: string }) => (
    <span data-testid={`date-field-${source}`}>2024-01-15</span>
  ),
}));

import { useShowContext } from "ra-core";

const mockedUseShowContext = vi.mocked(useShowContext<Product>);

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Test Product",
    principal_id: 10,
    category: "beverages",
    status: "active",
    description: null,
    manufacturer_part_number: null,
    marketing_description: null,
    list_price: null,
    currency_code: null,
    unit_of_measure: null,
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("ProductShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading and empty states", () => {
    it("renders loading state when isPending is true", () => {
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ isPending: true }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      expect(screen.getByText("Loading product...")).toBeInTheDocument();
    });

    it("renders NotFound when record is null", () => {
      mockedUseShowContext.mockReturnValue(
        mockUseShowContextReturn<Product>({ isPending: false, record: undefined })
      );

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      expect(screen.getByText("Record not found")).toBeInTheDocument();
    });
  });

  describe("Field display", () => {
    it("displays product name in the card header", async () => {
      const product = buildProduct({ name: "Frozen Pizza Supreme" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Frozen Pizza Supreme")).toBeInTheDocument();
      });
    });

    it("displays SKU when manufacturer_part_number is present", async () => {
      const product = buildProduct({ manufacturer_part_number: "SKU-12345" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("SKU")).toBeInTheDocument();
        expect(screen.getByText("SKU-12345")).toBeInTheDocument();
      });
    });

    it("displays description when present", async () => {
      const product = buildProduct({ description: "A delicious frozen pizza." });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("A delicious frozen pizza.")).toBeInTheDocument();
      });
    });

    it("displays category when present", async () => {
      const product = buildProduct({ category: "Frozen Foods" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Category")).toBeInTheDocument();
        expect(screen.getByText("Frozen Foods")).toBeInTheDocument();
      });
    });

    it("displays principal reference field when principal_id is present", async () => {
      const product = buildProduct({ principal_id: 10 });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByTestId("reference-field")).toBeInTheDocument();
      });
    });

    it("displays marketing description when present", async () => {
      const product = buildProduct({
        marketing_description: "The best pizza you will ever taste!",
      });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Marketing Description")).toBeInTheDocument();
        expect(screen.getByText("The best pizza you will ever taste!")).toBeInTheDocument();
      });
    });

    it("displays list price with currency and unit of measure", async () => {
      const product = buildProduct({
        list_price: 12.99,
        currency_code: "$",
        unit_of_measure: "case",
      });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("List Price")).toBeInTheDocument();
        expect(screen.getByText("$12.99 / case")).toBeInTheDocument();
      });
    });

    it("displays list price without unit when unit_of_measure is null", async () => {
      const product = buildProduct({
        list_price: 9.99,
        currency_code: "$",
        unit_of_measure: null,
      });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("$9.99")).toBeInTheDocument();
      });
    });

    it("uses default currency symbol when currency_code is null", async () => {
      const product = buildProduct({
        list_price: 5.99,
        currency_code: null,
        unit_of_measure: "each",
      });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("$5.99 / each")).toBeInTheDocument();
      });
    });

    it("displays created_at date field", async () => {
      const product = buildProduct({ created_at: "2024-01-15T10:00:00Z" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        expect(screen.getByTestId("date-field-created_at")).toBeInTheDocument();
      });
    });
  });

  describe("Status badge", () => {
    it("displays active status with default badge variant", async () => {
      const product = buildProduct({ status: "active" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("active")).toBeInTheDocument();
      });
    });

    it("displays discontinued status with secondary badge variant", async () => {
      const product = buildProduct({ status: "discontinued" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("discontinued")).toBeInTheDocument();
      });
    });

    it("displays coming_soon status with secondary badge variant", async () => {
      const product = buildProduct({ status: "coming_soon" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("coming_soon")).toBeInTheDocument();
      });
    });
  });

  describe("Conditional field rendering", () => {
    it("hides SKU section when manufacturer_part_number is null", async () => {
      const product = buildProduct({ manufacturer_part_number: null });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("SKU")).not.toBeInTheDocument();
    });

    it("hides description section when description is null", async () => {
      const product = buildProduct({ description: null });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("hides category section when category is empty", async () => {
      const product = buildProduct({ category: "" });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Category")).not.toBeInTheDocument();
    });

    it("hides principal section when principal_id is null", async () => {
      const product = buildProduct({ principal_id: undefined });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Principal")).not.toBeInTheDocument();
    });

    it("hides marketing description section when marketing_description is null", async () => {
      const product = buildProduct({ marketing_description: null });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Marketing Description")).not.toBeInTheDocument();
    });

    it("hides list price section when list_price is null", async () => {
      const product = buildProduct({ list_price: null });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("List Price")).not.toBeInTheDocument();
    });
  });

  describe("Complete product display", () => {
    it("renders all fields when fully populated", async () => {
      const product = buildProduct({
        name: "Complete Product",
        manufacturer_part_number: "MPN-99999",
        description: "Full product description",
        category: "Beverages",
        principal_id: 5,
        marketing_description: "Amazing marketing copy",
        list_price: 25.5,
        currency_code: "$",
        unit_of_measure: "bottle",
        status: "active",
        created_at: "2024-01-15T10:00:00Z",
      });
      mockedUseShowContext.mockReturnValue(mockUseShowContextReturn<Product>({ record: product }));

      renderWithAdminContext(<ProductShow />, { resource: "products" });

      await waitFor(() => {
        expect(screen.getByText("Complete Product")).toBeInTheDocument();
        expect(screen.getByText("active")).toBeInTheDocument();
        expect(screen.getByText("SKU")).toBeInTheDocument();
        expect(screen.getByText("MPN-99999")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Full product description")).toBeInTheDocument();
        expect(screen.getByText("Category")).toBeInTheDocument();
        expect(screen.getByText("Beverages")).toBeInTheDocument();
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByText("Marketing Description")).toBeInTheDocument();
        expect(screen.getByText("Amazing marketing copy")).toBeInTheDocument();
        expect(screen.getByText("List Price")).toBeInTheDocument();
        expect(screen.getByText("$25.5 / bottle")).toBeInTheDocument();
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
      });
    });
  });
});
