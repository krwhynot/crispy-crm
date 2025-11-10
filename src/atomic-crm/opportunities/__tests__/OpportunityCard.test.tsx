import { render, screen } from "@testing-library/react";
import { OpportunityCard } from "../OpportunityCard";
import { describe, it, expect, vi } from "vitest";
import { useOpportunityContacts } from "../useOpportunityContacts";

vi.mock("../useOpportunityContacts");
vi.mock("react-admin", () => ({
  useRecordContext: () => ({
    id: 1,
    name: "Test Opportunity",
    contact_ids: [1],
    estimated_close_date: "2025-12-31",
    priority: "high",
    days_in_stage: 5,
    last_interaction_date: "2025-11-01",
  }),
}));

describe("OpportunityCard", () => {
  it("displays primary contact name", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: { id: 1, firstName: "John", lastName: "Doe" },
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays estimated close date", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
  });

  it("displays days in stage badge", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    expect(screen.getByText("5 days in stage")).toBeInTheDocument();
  });

  it("shows priority badge with correct color", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    render(<OpportunityCard index={0} />);

    const badge = screen.getByText("High");
    expect(badge).toHaveClass("bg-destructive");
  });
});
