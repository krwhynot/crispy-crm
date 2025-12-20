import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { OpportunityCard } from "../kanban/OpportunityCard";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import type { Opportunity } from "../../types";

// Mock the contacts hook
vi.mock("../hooks/useOpportunityContacts");

/**
 * DnD wrapper required for testing Draggable components
 */
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
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
);

/**
 * Helper to render OpportunityCard with all required wrappers
 * Uses renderWithAdminContext for proper React Admin context
 */
const renderCard = (
  record: Partial<Opportunity>,
  props: {
    openSlideOver?: (id: number, mode?: "view" | "edit") => void;
    onDelete?: (id: number) => void;
  } = {}
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

  return renderWithAdminContext(
    <DndWrapper>
      <OpportunityCard
        index={0}
        openSlideOver={props.openSlideOver ?? vi.fn()}
        onDelete={props.onDelete}
      />
    </DndWrapper>,
    {
      record: defaultRecord,
      resource: "opportunities",
    }
  );
};

describe("OpportunityCard", () => {
  beforeEach(() => {
    // Reset mock before each test
    vi.mocked(useOpportunityContacts).mockReturnValue({
      primaryContact: null,
      contacts: [],
      isLoading: false,
      error: null,
    });
  });

  describe("Interactions", () => {
    it("calls openSlideOver when card body is clicked", () => {
      const openSlideOver = vi.fn();
      renderCard({ id: 123 }, { openSlideOver });

      const card = screen.getByTestId("opportunity-card");
      fireEvent.click(card);

      expect(openSlideOver).toHaveBeenCalledWith(123, "view");
    });
  });

  describe("iPad Drag Handle", () => {
    it("renders explicit drag handle icon", () => {
      renderCard({});

      const dragHandle = screen.getByTestId("drag-handle");
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder");
    });

    it("drag handle meets 44px touch target", () => {
      renderCard({});

      const dragHandle = screen.getByTestId("drag-handle");
      // Check for 44px minimum touch target (height and width)
      expect(dragHandle.className).toMatch(/min-h-\[44px\]|min-h-11|h-11/);
      expect(dragHandle.className).toMatch(/min-w-\[44px\]|min-w-11|w-11/);
    });

    it("card body does NOT have dragHandleProps", () => {
      renderCard({});

      const cardBody = screen.getByTestId("opportunity-card");
      // Card should have draggableProps but NOT dragHandleProps
      // dragHandleProps adds data-rbd-drag-handle-draggable-id attribute
      expect(cardBody).not.toHaveAttribute("data-rbd-drag-handle-draggable-id");
    });

    it("does not trigger openSlideOver when drag handle is clicked", () => {
      const openSlideOver = vi.fn();
      renderCard({}, { openSlideOver });

      const dragHandle = screen.getByTestId("drag-handle");
      fireEvent.click(dragHandle);

      expect(openSlideOver).not.toHaveBeenCalled();
    });
  });

  describe("OpportunityCard - Principal-Centric Layout", () => {
    const mockOpportunity = {
      id: 1,
      name: "Test Deal",
      stage: "new_lead",
      days_in_stage: 5,
      estimated_close_date: "2026-01-15",
      principal_organization_name: "McCRUM",
      distributor_organization_name: "Sysco Foods",
      customer_organization_name: "Chili's Corporate",
      contact_ids: [],
    };

    it("displays principal name prominently", () => {
      renderCard(mockOpportunity);
      expect(screen.getByText("McCRUM")).toBeInTheDocument();
    });

    it("displays distributor name", () => {
      renderCard(mockOpportunity);
      expect(screen.getByText("Sysco Foods")).toBeInTheDocument();
    });

    it("displays operator (customer) name", () => {
      renderCard(mockOpportunity);
      expect(screen.getByText("Chili's Corporate")).toBeInTheDocument();
    });

    it("does NOT display opportunity name", () => {
      renderCard(mockOpportunity);
      expect(screen.queryByText("Test Deal")).not.toBeInTheDocument();
    });

    it("shows StageStatusDot instead of ActivityPulseDot", () => {
      renderCard(mockOpportunity);
      expect(screen.getByText(/5 days/)).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has principal color stripe on left border", () => {
      renderCard(mockOpportunity);
      const card = screen.getByTestId("opportunity-card");
      expect(card).toHaveClass("border-l-4");
    });

    it("does not have expand/collapse toggle", () => {
      renderCard(mockOpportunity);
      expect(screen.queryByLabelText(/expand/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/collapse/i)).not.toBeInTheDocument();
    });
  });
});
