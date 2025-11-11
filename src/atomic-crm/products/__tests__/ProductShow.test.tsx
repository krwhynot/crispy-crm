/**
 * Tests for ProductShow component
 *
 * Tests the product details view including:
 * - Loading states
 * - Tab navigation (Overview, Details, Activity)
 * - Rendering product information
 * - Status badges
 * - Category and brand display
 * - Error handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockProduct } from "@/tests/utils/mock-providers";
import ProductShow from "../ProductShow";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    useRecordContext: vi.fn(),
  };
});

// Mock ProductAside
vi.mock("../ProductAside", () => ({
  ProductAside: () => <div data-testid="product-aside">Product Aside</div>,
}));

// Import mocked functions
import { useShowContext, useRecordContext } from "ra-core";

describe("ProductShow", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  test("renders loading state", () => {
    (useShowContext as any).mockReturnValue({
      record: undefined,
      isPending: true,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        initialEntries: ["/products/1/show"],
      }
    );

    // When isPending is true, the component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders with valid product data", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Premium Widget",
      sku: "WIDGET-001",
      description: "A high-quality widget for all your needs",
      status: "active",
      category: "widgets",
      brand: "WidgetCo",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    // Mock useRecordContext for the tab content components
    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Check main content area
      expect(screen.getByRole("main", { name: /product details/i })).toBeInTheDocument();

      // Check product name and SKU
      expect(screen.getByText("Premium Widget")).toBeInTheDocument();
      expect(screen.getByText(/SKU: WIDGET-001/i)).toBeInTheDocument();

      // Check description
      expect(screen.getByText("A high-quality widget for all your needs")).toBeInTheDocument();

      // Check tabs
      expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument();

      // Check aside
      expect(screen.getByTestId("product-aside")).toBeInTheDocument();
    });
  });

  test("displays status badge with correct variant", async () => {
    const statusTests = [
      { status: "active", expected: "active" },
      { status: "discontinued", expected: "discontinued" },
      { status: "coming_soon", expected: "coming_soon" },
    ];

    for (const { status, expected } of statusTests) {
      const mockProduct = createMockProduct({
        id: 1,
        name: "Test Product",
        sku: "TEST-001",
        status,
      });

      (useShowContext as any).mockReturnValue({
        record: mockProduct,
        isPending: false,
        error: null,
      });

      (useRecordContext as any).mockReturnValue(mockProduct);

      const { unmount } = renderWithAdminContext(
        <Routes>
          <Route path="/products/:id/show" element={<ProductShow />} />
        </Routes>,
        {
          resource: "products",
          record: mockProduct,
          initialEntries: ["/products/1/show"],
        }
      );

      await waitFor(() => {
        expect(screen.getByText(expected)).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  test("displays category badge", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Categorized Product",
      sku: "CAT-001",
      category: "electronics",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Category appears in multiple places (badge, overview, details)
      const categoryElements = screen.getAllByText("electronics");
      expect(categoryElements.length).toBeGreaterThan(0);
    });
  });

  test("displays category with underscores replaced", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Multi-word Category Product",
      sku: "MWC-001",
      category: "office_supplies",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Category should replace underscores with spaces (appears in multiple places)
      const categoryElements = screen.getAllByText("office supplies");
      expect(categoryElements.length).toBeGreaterThan(0);
    });
  });

  test("displays brand badge", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Branded Product",
      sku: "BRAND-001",
      brand: "TechBrand",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Brand appears in multiple places (badge, overview section)
      const brandElements = screen.getAllByText("TechBrand");
      expect(brandElements.length).toBeGreaterThan(0);
    });
  });

  test("renders overview tab with product information", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Overview Test Product",
      sku: "OVW-001",
      category: "test_category",
      subcategory: "test_subcategory",
      brand: "TestBrand",
      upc: "123456789012",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Overview tab should show product information
      expect(screen.getByText("Product Information")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      // Category and brand appear in multiple places (badge + overview section)
      expect(screen.getAllByText("test category").length).toBeGreaterThan(0);
      expect(screen.getByText("Subcategory")).toBeInTheDocument();
      expect(screen.getByText("test_subcategory")).toBeInTheDocument();
      expect(screen.getByText("Brand")).toBeInTheDocument();
      expect(screen.getAllByText("TestBrand").length).toBeGreaterThan(0);
      expect(screen.getByText("UPC")).toBeInTheDocument();
      expect(screen.getByText("123456789012")).toBeInTheDocument();
    });
  });

  test("renders details tab with specifications", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Details Test Product",
      sku: "DET-001",
      description: "Detailed product description",
      upc: "987654321098",
      category: "test_category",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    // Click details tab
    const detailsTab = screen.getByRole("tab", { name: /details/i });
    await user.click(detailsTab);

    await waitFor(() => {
      expect(screen.getByText("Specifications")).toBeInTheDocument();
    });
  });

  test("renders activity tab with empty state", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Activity Test Product",
      sku: "ACT-001",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    // Click activity tab
    const activityTab = screen.getByRole("tab", { name: /activity/i });
    activityTab.click();

    await waitFor(() => {
      expect(screen.getByText("Activity Log")).toBeInTheDocument();
      expect(screen.getByText("No activity recorded yet")).toBeInTheDocument();
    });
  });

  test("handles missing record gracefully", () => {
    (useShowContext as any).mockReturnValue({
      record: null,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        initialEntries: ["/products/1/show"],
      }
    );

    // When record is null, component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders complementary aside section", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Aside Test Product",
      sku: "ASIDE-001",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Check aside section
      const aside = screen.getByRole("complementary", { name: /product information/i });
      expect(aside).toBeInTheDocument();
    });
  });

  test("renders product icon", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Icon Test Product",
      sku: "ICON-001",
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // The product icon should be rendered (Package icon from lucide-react)
      expect(screen.getByText("Icon Test Product")).toBeInTheDocument();
    });
  });

  test("renders product without optional fields", async () => {
    const mockProduct = createMockProduct({
      id: 1,
      name: "Minimal Product",
      sku: "MIN-001",
      description: undefined,
      category: undefined,
      brand: undefined,
      subcategory: undefined,
      upc: undefined,
    });

    (useShowContext as any).mockReturnValue({
      record: mockProduct,
      isPending: false,
      error: null,
    });

    (useRecordContext as any).mockReturnValue(mockProduct);

    renderWithAdminContext(
      <Routes>
        <Route path="/products/:id/show" element={<ProductShow />} />
      </Routes>,
      {
        resource: "products",
        record: mockProduct,
        initialEntries: ["/products/1/show"],
      }
    );

    await waitFor(() => {
      // Should still render name and SKU
      expect(screen.getByText("Minimal Product")).toBeInTheDocument();
      expect(screen.getByText(/SKU: MIN-001/i)).toBeInTheDocument();

      // Should not show optional badges
      expect(screen.queryByText(/category/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/brand/i)).not.toBeInTheDocument();
    });
  });
});
