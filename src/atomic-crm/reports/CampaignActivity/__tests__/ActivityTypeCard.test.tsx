import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  };

  const mockSalesMap = new Map([[1, "John Smith"]]);

  it("should render collapsed card with activity type summary", () => {
    render(
      <ActivityTypeCard
        group={mockActivityGroup}
        isExpanded={false}
        onToggle={vi.fn()}
        salesMap={mockSalesMap}
      />
    );

    // Check icon and type name
    expect(screen.getByText("Note")).toBeInTheDocument();

    // Check summary stats
    expect(screen.getByText("141 activities")).toBeInTheDocument();
    expect(screen.getByText("119 unique orgs")).toBeInTheDocument();
    expect(screen.getByText("57%")).toBeInTheDocument(); // 141/247 activities
  });
});