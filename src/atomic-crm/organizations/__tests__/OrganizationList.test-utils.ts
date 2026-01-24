/**
 * Shared test utilities for OrganizationList tests
 *
 * This module provides common types, mock data, and utilities
 * used across the split OrganizationList test files.
 *
 * NOTE: vi.mock() calls cannot be shared - they must be at the top level
 * of each test file. Use the mock setup template from the original file.
 */

import { vi } from "vitest";
import { createMockOrganization } from "@/tests/utils/mock-providers";

// Mock component prop types
export interface MockChildrenProps {
  children?: React.ReactNode;
}

export interface MockFieldProps extends MockChildrenProps {
  source?: string;
  sortable?: boolean;
  label?: string;
  sortBy?: string;
}

export interface MockLayoutProps extends MockChildrenProps {
  filterComponent?: React.ReactNode;
  onRowClick?: (id: string | number, resource: string, record: unknown) => void;
  recordId?: string | number;
  isOpen?: boolean;
  placeholder?: string;
}

export interface MockBadgeProps {
  type?: string;
  priority?: string;
  status?: string;
}

// Track sortable column configuration for testing
export const sortableColumns: { label: string; sortBy: string; sortable: boolean }[] = [];

// Mock function references for slide-over state
export const mockOpenSlideOver = vi.fn();
export const mockCloseSlideOver = vi.fn();
export const mockToggleMode = vi.fn();

// Standard mock organizations for testing
export const mockOrganizations = [
  createMockOrganization({
    id: 1,
    name: "Tech Corp",
    organization_type: "restaurant",
    priority: "A",
    parent_organization_id: null,
    nb_contacts: 5,
    nb_opportunities: 3,
  }),
  createMockOrganization({
    id: 2,
    name: "Health Inc",
    organization_type: "distributor",
    priority: "B",
    parent_organization_id: 1,
    nb_contacts: 10,
    nb_opportunities: 7,
  }),
  createMockOrganization({
    id: 3,
    name: "Finance Co",
    organization_type: "supplier",
    priority: "C",
    parent_organization_id: null,
    nb_contacts: 0,
    nb_opportunities: 1,
  }),
];

// Default list context for testing
export function createDefaultListContext() {
  return {
    data: mockOrganizations,
    total: mockOrganizations.length,
    isPending: false,
    isLoading: false,
    filterValues: {},
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    page: 1,
    perPage: 25,
    sort: { field: "name", order: "ASC" },
    resource: "organizations",
    selectedIds: [],
    onSelect: vi.fn(),
    onToggleItem: vi.fn(),
    onUnselectItems: vi.fn(),
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

// Reset all mock function states
export function resetMocks(): void {
  vi.clearAllMocks();
  mockOpenSlideOver.mockClear();
  mockCloseSlideOver.mockClear();
  mockToggleMode.mockClear();
  sortableColumns.length = 0;
}
