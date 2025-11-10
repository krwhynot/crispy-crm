import { render, screen } from "@testing-library/react";
import { OpportunityCard } from "../OpportunityCard";
import { describe, it, expect, vi } from "vitest";
import { useOpportunityContacts } from "../useOpportunityContacts";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

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

const renderWithDragContext = (component: React.ReactElement) => {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {component}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

describe("OpportunityCard", () => {
  it("displays primary contact name", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: { id: 1, firstName: "John", lastName: "Doe" },
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays estimated close date", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText(/Dec \d+, 2025/)).toBeInTheDocument();
  });

  it("displays days in stage badge", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText("5 days in stage")).toBeInTheDocument();
  });

  it("shows priority badge with correct color", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    const badge = screen.getByText("High");
    expect(badge).toHaveClass("bg-warning/10");
  });
});
