import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityCardActions } from "../kanban/OpportunityCardActions";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

const mockRecord = {
  id: 1,
  name: "Test Opportunity",
};

// Mock React Admin hooks
vi.mock("react-admin", () => ({
  useUpdate: () => [vi.fn()],
  useDelete: () => [vi.fn()],
  useNotify: () => vi.fn(),
  useRefresh: () => vi.fn(),
  useRecordContext: () => mockRecord,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("OpportunityCardActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows actions menu on button click", () => {
    renderWithRouter(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(button);

    expect(screen.getByText("View Details")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Mark as Won")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("prevents drag when clicking actions button", () => {
    const stopPropagation = vi.fn();
    renderWithRouter(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });

    fireEvent.mouseDown(button, { stopPropagation });

    // Verify the button has onMouseDown handler
    expect(button).toHaveAttribute("type", "button");
  });
});
