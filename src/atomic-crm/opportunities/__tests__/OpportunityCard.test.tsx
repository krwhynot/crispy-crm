import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityCard } from "../kanban/OpportunityCard";
import { describe, it, expect, vi } from "vitest";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { BrowserRouter } from "react-router-dom";
import { RecordContextProvider } from "react-admin";
import type { Opportunity } from "../../types";

vi.mock("../hooks/useOpportunityContacts");

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
  RecordContextProvider: ({ children, value }: any) => children,
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

/**
 * DnD wrapper required for testing Draggable components (for TDD expand/collapse tests)
 */
const DndTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test-droppable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  </BrowserRouter>
);

/**
 * Helper to render OpportunityCard with all required wrappers (for TDD expand/collapse tests)
 */
const renderCard = (
  record: Partial<Opportunity>,
  props: { openSlideOver?: (id: number, mode?: "view" | "edit") => void; onDelete?: (id: number) => void } = {}
) => {
  const defaultRecord: Opportunity = {
    id: 1,
    name: "Test Opportunity",
    description: "Test description",
    stage: "initial_outreach",
    status: "active",
    priority: "medium",
    estimated_close_date: "2026-03-05",
    customer_organization_id: 1,
    contact_ids: [],
    stage_manual: false,
    status_manual: false,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    days_in_stage: 5,
    days_since_last_activity: 3,
    pending_task_count: 0,
    overdue_task_count: 0,
    ...record,
  };

  // Mock the useOpportunityContacts hook for this render
  (useOpportunityContacts as any).mockReturnValue({
    primaryContact: null,
    isLoading: false,
  });

  return render(
    <DndTestWrapper>
      <RecordContextProvider value={defaultRecord}>
        <OpportunityCard
          index={0}
          openSlideOver={props.openSlideOver ?? vi.fn()}
          onDelete={props.onDelete}
        />
      </RecordContextProvider>
    </DndTestWrapper>
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

describe("OpportunityCard - Expand/Collapse", () => {
  it("renders collapsed by default", () => {
    renderCard({ name: "My Test Deal", description: "Hidden description" });

    // Name should be visible
    expect(screen.getByText("My Test Deal")).toBeInTheDocument();

    // Description should NOT be visible when collapsed
    expect(screen.queryByText("Hidden description")).not.toBeInTheDocument();
  });

  it("expands when expand button is clicked", () => {
    renderCard({
      description: "National hotel chain expansion",
      principal_organization_name: "McCRUM Foods",
      days_in_stage: 12,
      pending_task_count: 2
    });

    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    // Expanded: description should be visible
    expect(screen.getByText("National hotel chain expansion")).toBeInTheDocument();

    // Expanded: full details visible
    expect(screen.getByText(/McCRUM Foods/)).toBeInTheDocument();
    expect(screen.getByText(/12 days in stage/)).toBeInTheDocument();
    expect(screen.getByText(/2 task/)).toBeInTheDocument();
  });

  it("collapses when collapse button is clicked", () => {
    renderCard({ description: "Toggle test description" });

    // First expand
    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);
    expect(screen.getByText("Toggle test description")).toBeInTheDocument();

    // Then collapse
    fireEvent.click(expandButton);

    // Description should be hidden again
    expect(screen.queryByText("Toggle test description")).not.toBeInTheDocument();
  });

  it("shows activity pulse dot with correct color", () => {
    renderCard({ days_since_last_activity: 5 });

    const pulseDot = screen.getByRole("status");
    expect(pulseDot).toHaveClass("bg-success"); // Green for <7 days
  });

  it("shows overdue task warning when tasks are overdue", () => {
    renderCard({ pending_task_count: 3, overdue_task_count: 2 });

    // Expand to see tasks
    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("has correct aria-expanded state", () => {
    renderCard({});

    const expandButton = screen.getByRole("button", { name: /expand/i });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(expandButton);
    expect(expandButton).toHaveAttribute("aria-expanded", "true");
  });

  it("calls openSlideOver when card body is clicked", () => {
    const openSlideOver = vi.fn();
    renderCard({ id: 123 }, { openSlideOver });

    const card = screen.getByTestId("opportunity-card");
    fireEvent.click(card);

    expect(openSlideOver).toHaveBeenCalledWith(123, "view");
  });

  it("does NOT call openSlideOver when expand button is clicked", () => {
    const openSlideOver = vi.fn();
    renderCard({}, { openSlideOver });

    fireEvent.click(screen.getByRole("button", { name: /expand/i }));

    expect(openSlideOver).not.toHaveBeenCalled();
  });
});

describe("OpportunityCard - Activity Pulse Colors", () => {
  it("shows green pulse for <7 days since activity", () => {
    renderCard({ days_since_last_activity: 3 });
    expect(screen.getByRole("status")).toHaveClass("bg-success");
  });

  it("shows yellow pulse for 7-14 days since activity", () => {
    renderCard({ days_since_last_activity: 10 });
    expect(screen.getByRole("status")).toHaveClass("bg-warning");
  });

  it("shows red pulse for >14 days since activity", () => {
    renderCard({ days_since_last_activity: 20 });
    expect(screen.getByRole("status")).toHaveClass("bg-destructive");
  });

  it("shows gray pulse for null activity", () => {
    renderCard({ days_since_last_activity: null });
    expect(screen.getByRole("status")).toHaveClass("bg-muted-foreground");
  });
});
