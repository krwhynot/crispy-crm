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

  describe("Collapsed State (default)", () => {
    it("renders opportunity name", () => {
      renderCard({ name: "My Test Deal" });
      expect(screen.getByText("My Test Deal")).toBeInTheDocument();
    });

    it("shows activity pulse dot", () => {
      renderCard({ days_since_last_activity: 5 });
      const pulseDot = screen.getByRole("status");
      expect(pulseDot).toBeInTheDocument();
      expect(pulseDot).toHaveClass("bg-success"); // Green for <7 days
    });

    it("shows expand button with aria-expanded=false", () => {
      renderCard({});
      const expandButton = screen.getByRole("button", { name: /expand/i });
      expect(expandButton).toHaveAttribute("aria-expanded", "false");
    });

    it("does NOT show description when collapsed", () => {
      renderCard({ description: "Hidden description" });
      expect(screen.queryByText("Hidden description")).not.toBeInTheDocument();
    });

    it("does NOT show priority badge when collapsed", () => {
      renderCard({ priority: "high" });
      // Priority badge is in expanded section
      expect(screen.queryByText(/High/i)).not.toBeInTheDocument();
    });
  });

  describe("Expanded State", () => {
    it("shows description when expanded", () => {
      renderCard({ description: "Visible description" });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText("Visible description")).toBeInTheDocument();
    });

    it("shows priority badge when expanded", () => {
      renderCard({ priority: "high" });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it("shows days in stage when expanded", () => {
      renderCard({ days_in_stage: 12 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/12 days in stage/)).toBeInTheDocument();
    });

    it("shows stuck warning for >14 days in stage", () => {
      renderCard({ days_in_stage: 20 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/20 days in stage/)).toBeInTheDocument();
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("shows task count when expanded", () => {
      renderCard({ pending_task_count: 3, overdue_task_count: 1 });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/3 tasks/)).toBeInTheDocument();
      expect(screen.getByText(/1 overdue/)).toBeInTheDocument();
    });

    it("updates aria-expanded to true when expanded", () => {
      renderCard({});

      const expandButton = screen.getByRole("button", { name: /expand/i });
      fireEvent.click(expandButton);

      expect(expandButton).toHaveAttribute("aria-expanded", "true");
    });

    it("shows principal organization name when expanded", () => {
      renderCard({ principal_organization_name: "McCRUM Foods" });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText("McCRUM Foods")).toBeInTheDocument();
    });

    it("shows products count when expanded", () => {
      renderCard({
        products: [
          { id: 1, product_id_reference: 1, product_name: "Product A" },
          { id: 2, product_id_reference: 2, product_name: "Product B" }
        ]
      });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText("2 products")).toBeInTheDocument();
    });
  });

  describe("Activity Pulse Colors", () => {
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

  describe("Interactions", () => {
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

    it("toggles expanded state on expand button click", () => {
      renderCard({ description: "Toggle test" });

      const expandButton = screen.getByRole("button", { name: /expand/i });

      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText("Toggle test")).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);
      expect(screen.queryByText("Toggle test")).not.toBeInTheDocument();
    });
  });

  describe("Primary Contact", () => {
    it("displays primary contact name when available", () => {
      vi.mocked(useOpportunityContacts).mockReturnValue({
        primaryContact: { id: 1, firstName: "John", lastName: "Doe" },
        contacts: [],
        isLoading: false,
        error: null,
      });

      renderCard({});
      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows loading state for contacts", () => {
      vi.mocked(useOpportunityContacts).mockReturnValue({
        primaryContact: null,
        contacts: [],
        isLoading: true,
        error: null,
      });

      renderCard({});
      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      // Should show a loading placeholder
      const loadingElement = document.querySelector(".animate-pulse");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("Win/Loss Reasons", () => {
    it("shows win reason for closed_won stage", () => {
      renderCard({
        stage: "closed_won",
        win_reason: "relationship"
      });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/Relationship/i)).toBeInTheDocument();
    });

    it("shows loss reason for closed_lost stage", () => {
      renderCard({
        stage: "closed_lost",
        loss_reason: "price_too_high"
      });

      fireEvent.click(screen.getByRole("button", { name: /expand/i }));

      expect(screen.getByText(/Price too high/i)).toBeInTheDocument();
    });
  });
});
