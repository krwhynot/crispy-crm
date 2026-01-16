/**
 * Tests for ParentOrganizationInput component
 *
 * Verifies the hierarchy cycle prevention behavior:
 * - Loading state while descendants fetch (race condition prevention)
 * - Self-exclusion from parent dropdown options
 * - Descendant exclusion from parent dropdown options
 * - Smart defaults (root orgs when search is empty)
 * - Name filtering when search text provided
 * - New record handling (create mode)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentOrganizationInput } from "../ParentOrganizationInput";

// Mock ra-core - useRecordContext returns the current record
const mockUseRecordContext = vi.fn();
vi.mock("ra-core", () => ({
  useRecordContext: () => mockUseRecordContext(),
}));

// Mock useOrganizationDescendants hook
const mockUseOrganizationDescendants = vi.fn();
vi.mock("@/hooks", () => ({
  useOrganizationDescendants: (orgId: number | undefined) => mockUseOrganizationDescendants(orgId),
}));

// Mock ReferenceInput - capture props to verify filter configuration
const mockReferenceInputProps = vi.fn();
vi.mock("@/components/admin/reference-input", () => ({
  ReferenceInput: (props: Record<string, unknown>) => {
    mockReferenceInputProps(props);
    return (
      <div data-testid="reference-input" data-filter={JSON.stringify(props.filter)}>
        {props.children}
      </div>
    );
  },
}));

// Mock AutocompleteInput - capture props to verify filterToQuery behavior
const mockAutocompleteInputProps = vi.fn();
vi.mock("@/components/admin/autocomplete-input", () => ({
  AutocompleteInput: (props: Record<string, unknown>) => {
    mockAutocompleteInputProps(props);
    return <div data-testid="autocomplete-input" />;
  },
}));

// Mock autocomplete defaults
vi.mock("@/atomic-crm/utils/autocompleteDefaults", () => ({
  AUTOCOMPLETE_DEBOUNCE_MS: 300,
}));

describe("ParentOrganizationInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReferenceInputProps.mockClear();
    mockAutocompleteInputProps.mockClear();
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

      render(<ParentOrganizationInput />);

      // Expect: Loading skeleton with "Loading hierarchy..." text
      expect(screen.getByText("Loading hierarchy...")).toBeInTheDocument();
      expect(screen.getByLabelText("Loading parent organization options")).toBeInTheDocument();
      expect(screen.queryByTestId("reference-input")).not.toBeInTheDocument();
    });

    it("renders ReferenceInput after descendants are fetched", () => {
      // Given: existing record with descendants fetched
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [10, 15],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      // Expect: ReferenceInput rendered, no loading state
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("reference-input")).toBeInTheDocument();
    });
  });

  describe("Self-exclusion from options", () => {
    it("excludes self ID from ReferenceInput filter", () => {
      // Given: record with id=5
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      // Expect: ReferenceInput filter includes self exclusion
      expect(mockReferenceInputProps).toHaveBeenCalled();
      const props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.filter).toEqual({ "id@not.in": "(5)" });
    });
  });

  describe("Descendant exclusion", () => {
    it("excludes self AND all descendants from ReferenceInput filter", () => {
      // Given: record with id=5, descendants=[10, 15, 20]
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [10, 15, 20],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      // Expect: filter excludes self + all descendants
      expect(mockReferenceInputProps).toHaveBeenCalled();
      const props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.filter).toEqual({ "id@not.in": "(5,10,15,20)" });
    });

    it("updates filter when descendants change (ensures fresh data)", () => {
      // Given: record with id=1, descendants=[2,3]
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [2, 3],
        isLoading: false,
        isFetched: true,
      });

      const { rerender } = render(<ParentOrganizationInput />);

      // Initial render - verify filter
      expect(mockReferenceInputProps).toHaveBeenCalled();
      let props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.filter).toEqual({ "id@not.in": "(1,2,3)" });

      // Clear mocks and update descendants
      mockReferenceInputProps.mockClear();
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [2, 3, 4, 5],
        isLoading: false,
        isFetched: true,
      });

      // Re-render to simulate descendants changing
      rerender(<ParentOrganizationInput />);

      // Expect: filter is updated with new descendants
      expect(mockReferenceInputProps).toHaveBeenCalled();
      props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.filter).toEqual({ "id@not.in": "(1,2,3,4,5)" });
    });
  });

  describe("filterToQuery behavior", () => {
    it("returns root org filter when search is empty", () => {
      // Given: component rendered
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      // Get the filterToQuery function from AutocompleteInput props
      expect(mockAutocompleteInputProps).toHaveBeenCalled();
      const props = mockAutocompleteInputProps.mock.calls[0][0];
      const filterToQuery = props.filterToQuery as (searchText: string) => Record<string, string>;

      // Expect: empty search returns root org filter
      expect(filterToQuery("")).toEqual({ "parent_organization_id@is": "null" });
    });

    it("returns name filter when search text is provided", () => {
      // Given: component rendered
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      // Get the filterToQuery function from AutocompleteInput props
      expect(mockAutocompleteInputProps).toHaveBeenCalled();
      const props = mockAutocompleteInputProps.mock.calls[0][0];
      const filterToQuery = props.filterToQuery as (searchText: string) => Record<string, string>;

      // Expect: search text returns name ilike filter
      expect(filterToQuery("Acme")).toEqual({ "name@ilike": "%Acme%" });
      expect(filterToQuery("Test Corp")).toEqual({ "name@ilike": "%Test Corp%" });
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

      render(<ParentOrganizationInput />);

      // Expect: No loading state, ReferenceInput renders immediately
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("reference-input")).toBeInTheDocument();
    });

    it("passes empty filter when no IDs to exclude (new record)", () => {
      // Given: new record (no ID)
      mockUseRecordContext.mockReturnValue({});
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      render(<ParentOrganizationInput />);

      // Expect: empty filter (no exclusions needed)
      expect(mockReferenceInputProps).toHaveBeenCalled();
      const props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.filter).toEqual({});
    });

    it("does not call useOrganizationDescendants with undefined when record has no ID", () => {
      // Given: record with no ID
      mockUseRecordContext.mockReturnValue({ parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      render(<ParentOrganizationInput />);

      // Expect: hook called with undefined (which disables the query)
      expect(mockUseOrganizationDescendants).toHaveBeenCalledWith(undefined);
    });
  });

  describe("ReferenceInput configuration", () => {
    it("configures ReferenceInput with correct source and reference", () => {
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      expect(mockReferenceInputProps).toHaveBeenCalled();
      const props = mockReferenceInputProps.mock.calls[0][0];
      expect(props.source).toBe("parent_organization_id");
      expect(props.reference).toBe("organizations");
    });
  });

  describe("AutocompleteInput configuration", () => {
    it("configures AutocompleteInput with correct label and helper text", () => {
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      expect(mockAutocompleteInputProps).toHaveBeenCalled();
      const props = mockAutocompleteInputProps.mock.calls[0][0];
      expect(props.label).toBe("Parent Organization");
      expect(props.emptyText).toBe("No parent organization");
      expect(props.helperText).toBe("Select a parent organization if this is a branch location");
      expect(props.optionText).toBe("name");
    });

    it("configures debounce from autocomplete defaults", () => {
      mockUseRecordContext.mockReturnValue({ id: 1, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: true,
      });

      render(<ParentOrganizationInput />);

      expect(mockAutocompleteInputProps).toHaveBeenCalled();
      const props = mockAutocompleteInputProps.mock.calls[0][0];
      expect(props.debounce).toBe(300);
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

      render(<ParentOrganizationInput />);

      expect(screen.getByText("Parent Organization")).toBeInTheDocument();
    });

    it("displays helper text in loading state", () => {
      mockUseRecordContext.mockReturnValue({ id: 5, parent_organization_id: null });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: true,
        isFetched: false,
      });

      render(<ParentOrganizationInput />);

      expect(
        screen.getByText("Select a parent organization if this is a branch location")
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

      render(<ParentOrganizationInput />);

      // Should render without error, treat as new record
      expect(screen.getByTestId("reference-input")).toBeInTheDocument();
    });

    it("handles undefined record gracefully", () => {
      mockUseRecordContext.mockReturnValue(undefined);
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      render(<ParentOrganizationInput />);

      // Should render without error, treat as new record
      expect(screen.getByTestId("reference-input")).toBeInTheDocument();
    });

    it("handles record with only parent_organization_id (no id)", () => {
      mockUseRecordContext.mockReturnValue({ parent_organization_id: 10 });
      mockUseOrganizationDescendants.mockReturnValue({
        descendants: [],
        isLoading: false,
        isFetched: false,
      });

      render(<ParentOrganizationInput />);

      // Should render without loading state since no ID means new record
      expect(screen.queryByText("Loading hierarchy...")).not.toBeInTheDocument();
      expect(screen.getByTestId("reference-input")).toBeInTheDocument();
    });
  });
});
