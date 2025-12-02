import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TasksDrawer } from "../TasksDrawer";

// Mock TasksKanbanPanel to avoid complex setup
vi.mock("../TasksKanbanPanel", () => ({
  TasksKanbanPanel: () => <div data-testid="tasks-content">Tasks Content</div>,
}));

describe("TasksDrawer", () => {
  it("renders closed by default when open is false", () => {
    render(<TasksDrawer open={false} onOpenChange={vi.fn()} variant="laptop" />);
    expect(screen.queryByTestId("tasks-content")).not.toBeInTheDocument();
  });

  it("renders tasks content when open", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="laptop" />);
    await waitFor(() => {
      expect(screen.getByTestId("tasks-content")).toBeInTheDocument();
    });
  });

  it("uses 320px width for laptop variant", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="laptop" />);
    await waitFor(() => {
      const drawer = screen.getByRole("dialog");
      expect(drawer).toHaveClass("sm:max-w-[320px]");
    });
  });

  it("uses 70% width for tablet variant", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="tablet" />);
    await waitFor(() => {
      const drawer = screen.getByRole("dialog");
      expect(drawer).toHaveClass("w-[70%]");
    });
  });

  it("calls onOpenChange when closed via escape", async () => {
    const onOpenChange = vi.fn();
    render(<TasksDrawer open={true} onOpenChange={onOpenChange} variant="laptop" />);

    // Press Escape to close
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("has accessible title", async () => {
    render(<TasksDrawer open={true} onOpenChange={vi.fn()} variant="laptop" />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /tasks/i })).toBeInTheDocument();
    });
  });
});
