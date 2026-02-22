/**
 * OrganizationCard unit tests
 *
 * Tests card rendering of the 3-zone layout:
 * - Zone 1: Header (avatar, name, priority pill)
 * - Zone 2: Metadata (location, type/segment, parent)
 * - Zone 3: Metrics (contact + opportunity counts)
 * - Interaction: click, keyboard
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRecordContext } from "@/tests/utils/render-admin";
import { OrganizationCard } from "../OrganizationCard";
import { createMockOrganization } from "@/tests/utils/mock-providers";

// Mock avatar to isolate card logic
vi.mock("../OrganizationAvatar", () => ({
  OrganizationAvatar: ({ record }: { record: { name: string } }) => (
    <span data-testid="org-avatar">{record.name.charAt(0)}</span>
  ),
}));

describe("OrganizationCard", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCard = (overrides = {}) => {
    const record = createMockOrganization({
      id: 1,
      name: "Tech Corp",
      organization_type: "distributor",
      priority: "A",
      city: "San Francisco",
      state: "CA",
      segment_name: "Restaurant",
      nb_contacts: 5,
      nb_opportunities: 3,
      parent_organization_id: null,
      parent_organization_name: null,
      ...overrides,
    });

    return renderWithRecordContext(<OrganizationCard record={record} onClick={mockOnClick} />, {
      record,
      resource: "organizations",
    });
  };

  // Zone 1: Header

  test("renders organization name", () => {
    renderCard();
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
  });

  test("renders avatar with record", () => {
    renderCard();
    expect(screen.getByTestId("org-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("org-avatar")).toHaveTextContent("T");
  });

  test("renders priority pill when priority is set", () => {
    renderCard();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("●")).toBeInTheDocument();
  });

  test("does not render priority pill when priority is null", () => {
    renderCard({ priority: null });
    expect(screen.queryByText("●")).not.toBeInTheDocument();
  });

  // Zone 2: Metadata

  test("renders location as city, state", () => {
    renderCard();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
  });

  test("renders city only when no state", () => {
    renderCard({ state: null });
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
  });

  test("renders state only when no city", () => {
    renderCard({ city: null });
    expect(screen.getByText("CA")).toBeInTheDocument();
  });

  test("renders em-dash when no location", () => {
    renderCard({ city: null, state: null });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  test("renders type and segment as neutral text", () => {
    renderCard();
    expect(screen.getByText(/Distributor · Restaurant/)).toBeInTheDocument();
  });

  test("renders parent line when parent exists", () => {
    renderCard({ parent_organization_id: 99, parent_organization_name: "ParentCorp" });
    expect(screen.getByText(/Part of ParentCorp/)).toBeInTheDocument();
  });

  test("does not render parent line for top-level organization", () => {
    renderCard({ parent_organization_id: null, parent_organization_name: null });
    expect(screen.queryByText(/Part of/)).not.toBeInTheDocument();
  });

  // Zone 3: Metrics

  test("renders metric labels with counts", () => {
    renderCard();
    expect(screen.getByText(/5 Contacts/)).toBeInTheDocument();
    expect(screen.getByText(/3 Opportunities/)).toBeInTheDocument();
  });

  test("renders zero counts when no contacts or opportunities", () => {
    renderCard({ nb_contacts: 0, nb_opportunities: 0 });
    expect(screen.getByText(/0 Contacts/)).toBeInTheDocument();
    expect(screen.getByText(/0 Opportunities/)).toBeInTheDocument();
  });

  // Interaction

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
});
