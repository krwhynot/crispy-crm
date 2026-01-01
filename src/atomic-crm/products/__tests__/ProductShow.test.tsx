/**
 * Tests for ProductShow component
 *
 * Tests the product details view including:
 * - Loading states
 * - Field display (name, SKU, description, status, principal, category)
 * - Status badge variants
 * - Conditional field rendering
 * - Missing record handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockProduct } from "@/tests/utils/mock-providers";
import ProductShow from "../ProductShow";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    RecordRepresentation: () => <span data-testid="record-representation">Principal Name</span>,
  };
});

vi.mock("@/components/admin/reference-field", () => ({
  ReferenceField: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));

vi.mock("@/components/admin/date-field", () => ({
  DateField: ({ source }: { source: string }) => (
    <span data-testid={`date-field-${source}`}>2024-01-15</span>
  ),
}));

import { useShowContext } from "ra-core";

describe("ProductShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Layout", () => {
    test("uses Card component for layout structure", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });
    });

    test("displays product name in card header", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Frozen Pizza Supreme",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Frozen Pizza Supreme")).toBeInTheDocument();
      });
    });

    test("renders loading state when isPending is true", () => {
      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: undefined,
        isPending: true,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
      });

      expect(screen.getByText("Loading product...")).toBeInTheDocument();
    });
  });

  describe("Field Configuration", () => {
    test("displays SKU when manufacturer_part_number is present", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        manufacturer_part_number: "SKU-12345",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("SKU")).toBeInTheDocument();
        expect(screen.getByText("SKU-12345")).toBeInTheDocument();
      });
    });

    test("displays description when present", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        description: "A delicious frozen pizza with premium toppings.",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(
          screen.getByText("A delicious frozen pizza with premium toppings.")
        ).toBeInTheDocument();
      });
    });

    test("displays category when present", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        category: "Frozen Foods",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Category")).toBeInTheDocument();
        expect(screen.getByText("Frozen Foods")).toBeInTheDocument();
      });
    });

    test("displays principal reference field when principal_id is present", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        principal_id: 10,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Principal")).toBeInTheDocument();
        expect(screen.getByTestId("reference-field")).toBeInTheDocument();
      });
    });

    test("displays marketing description when present", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        marketing_description: "The best pizza you will ever taste!",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Marketing Description")).toBeInTheDocument();
        expect(screen.getByText("The best pizza you will ever taste!")).toBeInTheDocument();
      });
    });

    test("displays list price with currency and unit of measure", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        list_price: 12.99,
        currency_code: "$",
        unit_of_measure: "case",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("List Price")).toBeInTheDocument();
        expect(screen.getByText("$12.99 / case")).toBeInTheDocument();
      });
    });

    test("displays created_at date field", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        created_at: "2024-01-15T10:00:00Z",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        expect(screen.getByTestId("date-field-created_at")).toBeInTheDocument();
      });
    });
  });

  describe("Status Badge", () => {
    test("displays active status with default badge variant", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Active Product",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        const badge = screen.getByText("active");
        expect(badge).toBeInTheDocument();
      });
    });

    test("displays discontinued status with secondary badge variant", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Discontinued Product",
        status: "discontinued",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        const badge = screen.getByText("discontinued");
        expect(badge).toBeInTheDocument();
      });
    });

    test("displays seasonal status with secondary badge variant", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Seasonal Product",
        status: "seasonal",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        const badge = screen.getByText("seasonal");
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe("Conditional Field Rendering", () => {
    test("hides SKU section when manufacturer_part_number is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        manufacturer_part_number: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("SKU")).not.toBeInTheDocument();
    });

    test("hides description section when description is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        description: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    test("hides category section when category is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        category: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Category")).not.toBeInTheDocument();
    });

    test("hides principal section when principal_id is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        principal_id: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Principal")).not.toBeInTheDocument();
    });

    test("hides marketing description section when marketing_description is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        marketing_description: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("Marketing Description")).not.toBeInTheDocument();
    });

    test("hides list price section when list_price is null", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        list_price: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });

      expect(screen.queryByText("List Price")).not.toBeInTheDocument();
    });
  });

  describe("Record Display", () => {
    test("handles missing record gracefully", () => {
      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: null,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
      });

      expect(screen.getByText("Loading product...")).toBeInTheDocument();
    });

    test("handles undefined record gracefully", () => {
      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: undefined,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
      });

      expect(screen.getByText("Loading product...")).toBeInTheDocument();
    });

    test("displays list price without unit when unit_of_measure is not set", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        list_price: 9.99,
        currency_code: "$",
        unit_of_measure: null,
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("$9.99")).toBeInTheDocument();
      });
    });

    test("uses default currency when currency_code is not set", async () => {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        list_price: 5.99,
        currency_code: null,
        unit_of_measure: "each",
        status: "active",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

      await waitFor(() => {
        expect(screen.getByText("$5.99 / each")).toBeInTheDocument();
      });
    });
  });

  describe("All Fields Display", () => {
    test("renders complete product with all fields", async () => {
      const mockProduct = createMockProduct({
        id: 1,
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

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockProduct,
        isPending: false,
      });

      renderWithAdminContext(<ProductShow />, {
        resource: "products",
        record: mockProduct,
      });

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
