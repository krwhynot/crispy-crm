/**
 * OrganizationCard unit tests
 *
 * Tests card rendering of organization data including:
 * - Name, avatar, badges, counts, state
 * - Click handler for slide-over integration
 * - Keyboard accessibility
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRecordContext } from "@/tests/utils/render-admin";
import { OrganizationCard } from "../OrganizationCard";
import { createMockOrganization } from "@/tests/utils/mock-providers";

// Mock badge components to isolate card logic
vi.mock("../OrganizationBadges", () => ({
  OrganizationTypeBadge: ({ type }: { type: string }) => (
    <span data-testid="org-type-badge">{type}</span>
  ),
  PriorityBadge: ({ priority }: { priority: string }) => (
    <span data-testid="priority-badge">{priority}</span>
  ),
  SegmentBadge: ({ segmentName }: { segmentName: string | null | undefined }) => (
    <span data-testid="segment-badge">{segmentName || "—"}</span>
  ),
}));

vi.mock("../OrganizationHierarchyChips", () => ({
  OrganizationHierarchyChips: ({
    record,
  }: {
    record: { parent_organization_id?: number | null };
  }) => (record.parent_organization_id ? <span data-testid="hierarchy-chips">child</span> : null),
}));

vi.mock("../OrganizationAvatar", () => ({
  OrganizationAvatar: ({ record }: { record: { name: string } }) => (
    <span data-testid="org-avatar">{record.name.charAt(0)}</span>
  ),
}));

describe("OrganizationCard", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderCard = (overrides = {}) => {
    const record = createMockOrganization({
      id: 1,
      name: "Tech Corp",
      organization_type: "distributor",
      priority: "A",
      state: "CA",
      segment_name: "Restaurant",
      nb_contacts: 5,
      nb_opportunities: 3,
      parent_organization_id: null,
      ...overrides,
    });

    return renderWithRecordContext(<OrganizationCard record={record} onClick={mockOnClick} />, {
      record,
      resource: "organizations",
    });
  };

  test("renders organization name", () => {
    renderCard();
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
  });

  test("renders avatar with record", () => {
    renderCard();
    expect(screen.getByTestId("org-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("org-avatar")).toHaveTextContent("T");
  });

  test("renders type badge", () => {
    renderCard();
    expect(screen.getByTestId("org-type-badge")).toHaveTextContent("distributor");
  });

  test("renders priority badge", () => {
    renderCard();
    expect(screen.getByTestId("priority-badge")).toHaveTextContent("A");
  });

  test("renders segment badge", () => {
    renderCard();
    expect(screen.getByTestId("segment-badge")).toHaveTextContent("Restaurant");
  });

  test("renders contact count", () => {
    renderCard();
    expect(screen.getByTitle("Contacts")).toHaveTextContent("5");
  });

  test("renders opportunity count", () => {
    renderCard();
    expect(screen.getByTitle("Opportunities")).toHaveTextContent("3");
  });

  test("renders state code", () => {
    renderCard();
    expect(screen.getByText("CA")).toBeInTheDocument();
  });

  test("calls onClick with record id when clicked", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /view tech corp/i }));
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });

  test("calls onClick on Enter key", () => {
    renderCard();
    fireEvent.keyDown(screen.getByRole("button", { name: /view tech corp/i }), { key: "Enter" });
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });

  test("calls onClick on Space key", () => {
    renderCard();
    fireEvent.keyDown(screen.getByRole("button", { name: /view tech corp/i }), { key: " " });
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });

  test("renders hierarchy chips when organization has parent", () => {
    renderCard({ parent_organization_id: 99 });
    expect(screen.getByTestId("hierarchy-chips")).toBeInTheDocument();
  });

  test("does not render hierarchy chips for top-level organization", () => {
    renderCard({ parent_organization_id: null });
    expect(screen.queryByTestId("hierarchy-chips")).not.toBeInTheDocument();
  });

  test("renders zero counts when no contacts or opportunities", () => {
    renderCard({ nb_contacts: 0, nb_opportunities: 0 });
    expect(screen.getByTitle("Contacts")).toHaveTextContent("0");
    expect(screen.getByTitle("Opportunities")).toHaveTextContent("0");
  });

  test("does not render state when not set", () => {
    renderCard({ state: null });
    expect(screen.queryByText("CA")).not.toBeInTheDocument();
  });
});
