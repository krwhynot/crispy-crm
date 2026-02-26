/**
 * OrganizationHierarchyChips component tests
 *
 * Tests for parent and branch chips rendered inline with org names:
 * - Default mode: "Parent: {name}" text for card contexts
 * - listCompact mode: icon + name (no prefix) for list table
 * - parentClassName applied for responsive visibility
 * - Branch chip rendering unchanged across modes
 * - show prop: "all" (default), "parent", "branches" for selective rendering
 */

import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OrganizationHierarchyChips } from "../OrganizationHierarchyChips";
import type { OrganizationRecord } from "../types";

function createTestRecord(overrides: Partial<OrganizationRecord> = {}): OrganizationRecord {
  return {
    id: 1,
    name: "Test Org",
    organization_type: "customer",
    priority: "A",
    parent_organization_id: null,
    parent_organization_name: null,
    child_branch_count: 0,
    nb_contacts: 0,
    nb_opportunities: 0,
    ...overrides,
  } as OrganizationRecord;
}

// Mock useListContext for FilterableBadge
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "organizations",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
  };
});

describe("OrganizationHierarchyChips", () => {
  test("returns null when record has no parent and no branches", () => {
    const record = createTestRecord({
      id: 1,
      parent_organization_id: null,
      parent_organization_name: null,
      child_branch_count: 0,
    });

    const { container } = renderWithAdminContext(<OrganizationHierarchyChips record={record} />);

    expect(container.innerHTML).toBe("");
  });

  describe("default mode", () => {
    test('renders parent chip with "Parent: {name}" text', () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} />);

      expect(screen.getByText(/Parent: Acme Corp/)).toBeInTheDocument();
    });

    test("does not render parent icon in default mode", () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} />);

      expect(screen.queryByTestId("hierarchy-parent-icon")).not.toBeInTheDocument();
    });
  });

  describe("listCompact mode", () => {
    test("renders parent chip without 'Parent:' prefix", () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      renderWithAdminContext(
        <OrganizationHierarchyChips record={record} parentDisplayMode="listCompact" />
      );

      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });

    test("renders hierarchy parent icon with aria-hidden", () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      renderWithAdminContext(
        <OrganizationHierarchyChips record={record} parentDisplayMode="listCompact" />
      );

      const icon = screen.getByTestId("hierarchy-parent-icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("parentClassName", () => {
    test("applies parentClassName to parent chip wrapper", () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      const { container } = renderWithAdminContext(
        <OrganizationHierarchyChips record={record} parentClassName="lg:hidden" />
      );

      // FilterableBadge renders a button wrapper; parentClassName should appear on it
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
      expect(button?.className).toContain("lg:hidden");
    });
  });

  describe("branch chip", () => {
    test("renders branch count with plural text", () => {
      const record = createTestRecord({
        id: 1,
        parent_organization_id: null,
        parent_organization_name: null,
        child_branch_count: 5,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} />);

      expect(screen.getByText("5 branches")).toBeInTheDocument();
    });

    test("renders singular branch text for count of 1", () => {
      const record = createTestRecord({
        id: 1,
        parent_organization_id: null,
        parent_organization_name: null,
        child_branch_count: 1,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} />);

      expect(screen.getByText("1 branch")).toBeInTheDocument();
    });

    test("branch chip is unaffected by parentDisplayMode", () => {
      const record = createTestRecord({
        id: 1,
        parent_organization_id: null,
        parent_organization_name: null,
        child_branch_count: 3,
      });

      renderWithAdminContext(
        <OrganizationHierarchyChips record={record} parentDisplayMode="listCompact" />
      );

      expect(screen.getByText("3 branches")).toBeInTheDocument();
    });
  });

  describe("show prop", () => {
    test('show="parent" renders only parent chip, not branches', () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 5,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} show="parent" />);

      expect(screen.getByText(/Parent: Acme Corp/)).toBeInTheDocument();
      expect(screen.queryByText("5 branches")).not.toBeInTheDocument();
    });

    test('show="branches" renders only branches chip, not parent', () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 5,
      });

      renderWithAdminContext(<OrganizationHierarchyChips record={record} show="branches" />);

      expect(screen.getByText("5 branches")).toBeInTheDocument();
      expect(screen.queryByText(/Parent: Acme Corp/)).not.toBeInTheDocument();
    });

    test('show="parent" returns null when record has no parent', () => {
      const record = createTestRecord({
        id: 1,
        parent_organization_id: null,
        parent_organization_name: null,
        child_branch_count: 5,
      });

      const { container } = renderWithAdminContext(
        <OrganizationHierarchyChips record={record} show="parent" />
      );

      expect(container.innerHTML).toBe("");
    });

    test('show="branches" returns null when record has no branches', () => {
      const record = createTestRecord({
        id: 2,
        parent_organization_id: 1,
        parent_organization_name: "Acme Corp",
        child_branch_count: 0,
      });

      const { container } = renderWithAdminContext(
        <OrganizationHierarchyChips record={record} show="branches" />
      );

      expect(container.innerHTML).toBe("");
    });
  });
});
