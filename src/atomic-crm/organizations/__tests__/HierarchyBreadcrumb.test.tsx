/**
 * Tests for HierarchyBreadcrumb component
 *
 * Tests the breadcrumb navigation for organization hierarchies:
 * - Renders nothing for parent organizations (no parent_organization_id)
 * - Renders breadcrumb for child organizations with parent link
 * - Shows Organizations link at start
 * - Current org is not clickable
 */

import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockOrganization } from "@/tests/utils/mock-providers";
import { HierarchyBreadcrumb } from "../HierarchyBreadcrumb";
import type { OrganizationWithHierarchy } from "../../types";

describe("HierarchyBreadcrumb", () => {
  test("renders nothing for parent organization (no parent_organization_id)", () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Parent Corp",
      parent_organization_id: null,
    }) as OrganizationWithHierarchy;

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<HierarchyBreadcrumb organization={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/1/show"],
      }
    );

    // Should render nothing
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  test("renders breadcrumb for child organization with parent link", () => {
    const mockOrg = createMockOrganization({
      id: 2,
      name: "Child Division",
      parent_organization_id: 1,
      parent_organization_name: "Parent Corp",
    }) as OrganizationWithHierarchy;

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<HierarchyBreadcrumb organization={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/2/show"],
      }
    );

    // Should render breadcrumb navigation
    const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumb).toBeInTheDocument();
  });

  test("shows Organizations link at start of breadcrumb", () => {
    const mockOrg = createMockOrganization({
      id: 2,
      name: "Child Division",
      parent_organization_id: 1,
      parent_organization_name: "Parent Corp",
    }) as OrganizationWithHierarchy;

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<HierarchyBreadcrumb organization={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/2/show"],
      }
    );

    // Should have Organizations link
    expect(screen.getByText("Organizations")).toBeInTheDocument();
  });

  test("parent organization name is clickable link", () => {
    const mockOrg = createMockOrganization({
      id: 2,
      name: "Child Division",
      parent_organization_id: 1,
      parent_organization_name: "Parent Corp",
    }) as OrganizationWithHierarchy;

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<HierarchyBreadcrumb organization={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/2/show"],
      }
    );

    // Parent link should be clickable (find by text and verify it's an anchor element)
    const parentLink = screen.getByText("Parent Corp");
    expect(parentLink).toBeInTheDocument();
    expect(parentLink.tagName).toBe("A");
  });

  test("current organization is not clickable", () => {
    const mockOrg = createMockOrganization({
      id: 2,
      name: "Child Division",
      parent_organization_id: 1,
      parent_organization_name: "Parent Corp",
    }) as OrganizationWithHierarchy;

    renderWithAdminContext(
      <Routes>
        <Route
          path="/organizations/:id/show"
          element={<HierarchyBreadcrumb organization={mockOrg} />}
        />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/2/show"],
      }
    );

    // Current org should not be a link (should have role="link" with aria-disabled="true" or be a span)
    const currentOrg = screen.getByText("Child Division");
    expect(currentOrg).toBeInTheDocument();

    // The current org should not have an href attribute (it's the current page)
    const link = currentOrg.closest("a");
    expect(link).not.toBeInTheDocument();
  });
});
