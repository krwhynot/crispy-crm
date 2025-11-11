import { render, screen } from "@testing-library/react";
import { OpportunityCard } from "../OpportunityCard";
import { describe, it, expect, vi } from "vitest";
import { useOpportunityContacts } from "../useOpportunityContacts";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { BrowserRouter } from "react-router-dom";

vi.mock("../useOpportunityContacts");

const mockRecord = {
  id: 1,
  name: "Test Opportunity",
  contact_ids: [1],
  estimated_close_date: "2025-12-31",
  priority: "high",
  days_in_stage: 5,
  last_interaction_date: "2025-11-01",
};

// Mock React Admin hooks
vi.mock("react-admin", () => ({
  useRecordContext: () => mockRecord,
  useUpdate: () => [vi.fn()],
  useDelete: () => [vi.fn()],
  useNotify: () => vi.fn(),
  useRefresh: () => vi.fn(),
}));

const renderWithDragContext = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
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
    </BrowserRouter>
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

  it("shows warning indicator when opportunity is stuck (>14 days)", () => {
    mockRecord.days_in_stage = 20; // >14 days
    mockRecord.priority = "medium";

    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText("20 days in stage")).toBeInTheDocument();
    // Check for warning icon SVG
    const warningIcon = document.querySelector('svg path[fill-rule="evenodd"]');
    expect(warningIcon).toBeInTheDocument();

    // Reset
    mockRecord.days_in_stage = 5;
  });

  it("shows skeleton loader when contacts are loading", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: true,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    const loader = document.querySelector(".animate-pulse");
    expect(loader).toBeInTheDocument();
  });

  it("shows 'No date set' when estimated_close_date is null", () => {
    mockRecord.estimated_close_date = null as any;

    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText("No date set")).toBeInTheDocument();

    // Reset
    mockRecord.estimated_close_date = "2025-12-31";
  });

  it("does not render contact section when primaryContact is null", () => {
    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    // User icon SVG should not be present
    const userIcons = document.querySelectorAll('svg path[d*="M16 7a4 4"]');
    expect(userIcons).toHaveLength(0);
  });

  it("shows 'Medium' as default priority when priority is null", () => {
    mockRecord.priority = null as any;

    (useOpportunityContacts as any).mockReturnValue({
      primaryContact: null,
      isLoading: false,
    });

    renderWithDragContext(<OpportunityCard index={0} />);

    expect(screen.getByText("Medium")).toBeInTheDocument();

    // Reset
    mockRecord.priority = "high";
  });
});
