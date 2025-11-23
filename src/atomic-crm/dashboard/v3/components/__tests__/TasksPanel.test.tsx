import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TasksPanel } from "../TasksPanel";

// Mock the useMyTasks hook
vi.mock("../../hooks/useMyTasks", () => ({
  useMyTasks: () => ({
    tasks: [
      {
        id: 1,
        subject: "Follow up on Q4 proposal",
        dueDate: new Date(Date.now() - 86400000),
        priority: "high",
        taskType: "Call",
        relatedTo: { type: "opportunity", name: "Q4 Enterprise Deal", id: 101 },
        status: "overdue",
      },
      {
        id: 2,
        subject: "Send contract for review",
        dueDate: new Date(),
        priority: "critical",
        taskType: "Email",
        relatedTo: { type: "contact", name: "John Smith", id: 202 },
        status: "today",
      },
      {
        id: 3,
        subject: "Schedule demo meeting",
        dueDate: new Date(Date.now() + 86400000),
        priority: "medium",
        taskType: "Meeting",
        relatedTo: { type: "organization", name: "TechCorp", id: 303 },
        status: "tomorrow",
      },
    ],
    loading: false,
    error: null,
    completeTask: vi.fn(),
    snoozeTask: vi.fn(),
  }),
}));

describe("TasksPanel", () => {
  it("should render panel headers and helper text", () => {
    render(<TasksPanel />);

    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Today's priorities and upcoming activities")).toBeInTheDocument();
  });

  it("should render task groups", () => {
    render(<TasksPanel />);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("should apply interactive-card class to task items", () => {
    const { container } = render(<TasksPanel />);
    const cards = container.querySelectorAll(".interactive-card");
    expect(cards.length).toBeGreaterThan(0);
  });
});
