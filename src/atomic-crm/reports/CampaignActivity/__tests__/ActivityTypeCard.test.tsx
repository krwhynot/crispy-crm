import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ActivityTypeCard } from "../ActivityTypeCard";

describe("ActivityTypeCard", () => {
  const mockActivityGroup = {
    type: "note",
    activities: [
      {
        id: 1,
        type: "note",
        subject: "Discussed pricing",
        created_at: "2025-11-10T14:30:00Z",
        created_by: 1,
        organization_id: 1,
        contact_id: null,
      },
    ],
    totalCount: 141,
    uniqueOrgs: 119,
    percentage: 57,
    mostActiveOrg: "Organization 1",
    mostActiveCount: 1,
  };

  const mockSalesMap = new Map([[1, "John Smith"]]);

  it("should render collapsed card with activity type summary", () => {
    renderWithAdminContext(
      <ActivityTypeCard
        group={mockActivityGroup}
        isExpanded={false}
        onToggle={vi.fn()}
        salesMap={mockSalesMap}
      />
    );

    // Check icon and type name
    expect(screen.getByText("Note")).toBeInTheDocument();

    // Check summary stats - the text is split across multiple elements
    const summaryText = screen.getByText((content, element) => {
      return element?.textContent === "141 activities • 119 unique orgs • 57%";
    });
    expect(summaryText).toBeInTheDocument();
  });

  it("should render expanded card with activity table", () => {
    renderWithAdminContext(
      <ActivityTypeCard
        group={mockActivityGroup}
        isExpanded={true}
        onToggle={vi.fn()}
        salesMap={mockSalesMap}
      />
    );

    // Check table is rendered
    expect(screen.getByRole("table")).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Rep")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
  });
});
