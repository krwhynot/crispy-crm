/**
 * Tests for ParentOrganizationInput component
 *
 * Verifies the hierarchy cycle prevention behavior:
 * - Loading state while descendants fetch (race condition prevention)
 * - Self-exclusion from parent dropdown options
 * - Descendant exclusion from parent dropdown options
 * - New record handling (create mode)
 * - HierarchicalSelectInput prop configuration
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ParentOrganizationInput } from "../ParentOrganizationInput";

// Mock ra-core - useRecordContext returns the current record
const mockUseRecordContext = vi.fn();
vi.mock("ra-core", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory
  const actual = (await vi.importActual("ra-core")) as typeof import("ra-core");
  return {
    ...actual,
    useRecordContext: () => mockUseRecordContext(),
  };
});

// Mock useOrganizationDescendants hook
const mockUseOrganizationDescendants = vi.fn();
vi.mock("@/hooks", () => ({
  useOrganizationDescendants: (orgId: number | undefined) => mockUseOrganizationDescendants(orgId),
}));

// Mock HierarchicalSelectInput - capture props to verify configuration
const mockHierarchicalSelectInputProps = vi.fn();
vi.mock("@/components/ra-wrappers/HierarchicalSelectInput", () => ({
  HierarchicalSelectInput: (props: {
    source?: string;
    resource?: string;
    label?: string;
    helperText?: string;
    excludeIds?: number[];
    filter?: Record<string, unknown>;
  }) => {
    mockHierarchicalSelectInputProps(props);
    return (
      <div
        data-testid="hierarchical-select-input"
        data-source={props.source}
        data-resource={props.resource}
        data-exclude-ids={JSON.stringify(props.excludeIds)}
      >
        {props.label}
      </div>
    );
  },
}));

describe("ParentOrganizationInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHierarchicalSelectInputProps.mockClear();
  });

  describe("Loading state", () => {
    it("shows loading skeleton while descendants fetch for existing record", () => {
      // Given: existing record (has ID), descendants not yet fetched
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: true,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: Loading skeleton with "Loading hierarchy..." text
      expect(screen.getByText("Loading hierarchy...")).toBeInTheDocument();
      expect(screen.getByLabelText("Loading parent organization options")).toBeInTheDocument();
      expect(screen.queryByTestId("hierarchical-select-input")).not.toBeInTheDocument();
    });

    it("renders HierarchicalSelectInput after descendants are fetched", () => {
      // Given: existing record with descendants fetched
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [10, 15],
        isLoading: false,
        isFetched: true,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: HierarchicalSelectInput rendered, no loading state
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("hierarchical-select-input")).toBeInTheDocument();
    });
  });

  describe("Self-exclusion from options", () => {
    it("excludes self ID via excludeIds prop", () => {
      // Given: record with id=5
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: excludeIds includes self
      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      const props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.excludeIds).toEqual([5]);
    });
  });

  describe("Descendant exclusion", () => {
    it("excludes self AND all descendants via excludeIds prop", () => {
      // Given: record with id=5, descendants=[10, 15, 20]
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [10, 15, 20],
        isLoading: false,
        isFetched: true,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: excludeIds includes self + all descendants
      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      const props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.excludeIds).toEqual([5, 10, 15, 20]);
    });

    it("updates excludeIds when descendants change (ensures fresh data)", () => {
      // Given: record with id=1, descendants=[2,3]
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [2, 3],
        isLoading: false,
        isFetched: true,
      });

      const { rerender } = renderWithAdminContext(<ParentOrganizationInput />);

      // Initial render - verify excludeIds
      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      let props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.excludeIds).toEqual([1, 2, 3]);

      // Clear mocks and update descendants
      mockHierarchicalSelectInputProps.mockClear();
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [2, 3, 4, 5],
        isLoading: false,
        isFetched: true,
      });

      // Re-render to simulate descendants changing
      rerender(<ParentOrganizationInput />);

      // Expect: excludeIds is updated with new descendants
      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.excludeIds).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("New record handling (create mode)", () => {
    it("renders immediately without loading state when record has no ID", () => {
      // Given: record with no ID (create mode)
      mockUseRecordContext.mockReturnValue({ parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false, // Not fetched because no ID was provided
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: No loading state, HierarchicalSelectInput renders immediately
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("hierarchical-select-input")).toBeInTheDocument();
    });

    it("passes empty excludeIds when no IDs to exclude (new record)", () => {
      // Given: new record (no ID)
      mockUseRecordContext.mockReturnValue({});
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: empty excludeIds (no exclusions needed)
      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      const props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.excludeIds).toEqual([]);
    });

    it("does not call useOrganizationDescendants with undefined when record has no ID", () => {
      // Given: record with no ID
      mockUseRecordContext.mockReturnValue({ parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Expect: hook called with undefined (which disables the query)
      expect(mockUseOrganizationDescendants).toHaveBeenCalledWith(undefined);
    });
  });

  describe("HierarchicalSelectInput configuration", () => {
    it("configures HierarchicalSelectInput with correct source and resource", () => {
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      const props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.source).toBe("parent_organization_id");
      expect(props.resource).toBe("organizations");
    });

    it("configures HierarchicalSelectInput with correct label and helper text", () => {
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      expect(mockHierarchicalSelectInputProps).toHaveBeenCalled();
      const props = mockHierarchicalSelectInputProps.mock.calls[0]![0];
      expect(props.label).toBe("Parent Organization");
      expect(props.helperText).toBe(
        "Link this organization to its parent (e.g., Sysco Chicago → Sysco Corporation for regional branches)"
      );
    });
  });

  describe("Loading state UI details", () => {
    it("displays correct label in loading state", () => {
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: true,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      expect(screen.getByText("Parent Organization")).toBeInTheDocument();
    });

    it("displays helper text in loading state", () => {
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: true,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      expect(
        screen.getByText(
          "Link this organization to its parent (e.g., Sysco Chicago → Sysco Corporation for regional branches)"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles null record gracefully", () => {
      mockUseRecordContext.mockReturnValue(null);
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Should render without error, treat as new record
      expect(screen.getByTestId("hierarchical-select-input")).toBeInTheDocument();
    });

    it("handles undefined record gracefully", () => {
      mockUseRecordContext.mockReturnValue(undefined);
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Should render without error, treat as new record
      expect(screen.getByTestId("hierarchical-select-input")).toBeInTheDocument();
    });

    it("handles record with only parent_organization_id (no id)", () => {
      mockUseRecordContext.mockReturnValue({ parent_organization_id: 10 });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      renderWithAdminContext(<ParentOrganizationInput />);

      // Should render without loading state since no ID means new record
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("hierarchical-select-input")).toBeInTheDocument();
    });
  });
});
