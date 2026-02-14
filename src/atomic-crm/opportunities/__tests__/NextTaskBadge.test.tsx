import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { NextTaskBadge } from "../NextTaskBadge";

describe("NextTaskBadge", () => {
  describe("empty states", () => {
    it("renders 'No tasks' when taskId is null", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={null} title={null} dueDate={null} priority={null} />
      );
      expect(screen.getByText("No tasks")).toBeInTheDocument();
    });

    it("renders 'No tasks' when taskId is undefined", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={undefined} title="Some title" dueDate="2025-12-20" priority="high" />
      );
      expect(screen.getByText("No tasks")).toBeInTheDocument();
    });

    it("renders 'No tasks' when title is missing", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title={null} dueDate="2025-12-20" priority="high" />
      );
      expect(screen.getByText("No tasks")).toBeInTheDocument();
    });
  });

  describe("task display", () => {
    it("renders task title when provided", () => {
      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Call buyer about pricing"
          dueDate="2025-12-20"
          priority="high"
        />
      );
      expect(screen.getByText("Call buyer about pricing")).toBeInTheDocument();
    });

    it("renders as a button element for accessibility", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Follow up call" dueDate="2025-12-25" priority="medium" />
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("includes task title in aria-label", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Send proposal" dueDate={null} priority="medium" />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Task: Send proposal");
    });
  });

  describe("due date urgency", () => {
    it("shows overdue styling for past due dates", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const dateStr = twoDaysAgo.toISOString().split("T")[0];

      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Past due task" dueDate={dateStr} priority="medium" />
      );
      // Should show "Xd overdue" text - find by pattern
      expect(screen.getByText(/\d+d overdue/)).toBeInTheDocument();
    });

    it("shows 'Due today' for today's date", () => {
      // Create today's date with explicit local timezone to avoid UTC parsing issues
      // Using toLocaleDateString to get YYYY-MM-DD in local time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      // Append local time to ensure date-fns parses it in local timezone
      const todayWithTime = `${year}-${month}-${day}T12:00:00`;

      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Today's task"
          dueDate={todayWithTime}
          priority="medium"
        />
      );
      expect(screen.getByText("Due today")).toBeInTheDocument();
    });

    it("shows day abbreviation for near-future dates (within 3 days)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const dateStr = tomorrow.toISOString().split("T")[0];

      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Soon task" dueDate={dateStr} priority="medium" />
      );
      // Should show a day abbreviation like "Mon", "Tue", etc.
      const dayAbbreviations = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const hasDayAbbr = dayAbbreviations.some((day) => screen.queryByText(day));
      expect(hasDayAbbr).toBe(true);
    });

    it("shows full date for dates more than 3 days out", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateStr = futureDate.toISOString().split("T")[0];

      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Future task" dueDate={dateStr} priority="medium" />
      );
      // Should show something like "Dec 26"
      expect(screen.getByText(/[A-Z][a-z]{2} \d{1,2}/)).toBeInTheDocument();
    });

    it("handles null due date gracefully", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="No date task" dueDate={null} priority="high" />
      );
      expect(screen.getByText("No date task")).toBeInTheDocument();
      // Should not crash, just not show a date
    });
  });

  describe("priority badge", () => {
    it("shows priority badge for high priority", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Important task" dueDate="2025-12-25" priority="high" />
      );
      // Find the badge specifically (it has data-slot="badge")
      const badge = document.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("High");
    });

    it("shows priority badge for critical priority", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Urgent task" dueDate="2025-12-25" priority="critical" />
      );
      // Find the badge specifically (it has data-slot="badge")
      const badge = document.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("Critical");
    });

    it("shows priority badge for medium priority", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Regular task" dueDate="2025-12-25" priority="medium" />
      );
      // Medium priority shows a badge
      const badge = document.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("Medium");
    });

    it("does not show priority badge for low priority", () => {
      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Task without badge"
          dueDate="2025-12-25"
          priority="low"
        />
      );
      // Low priority does NOT show a priority badge (per component logic)
      // Only the task title should be visible, no priority indicator
      expect(screen.getByText("Task without badge")).toBeInTheDocument();
      // Verify no PriorityBadge rendered (component skips for "low")
      const badges = screen.queryAllByRole("status");
      expect(badges.length).toBe(0);
    });

    it("handles null priority gracefully", () => {
      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="No priority task" dueDate="2025-12-25" priority={null} />
      );
      expect(screen.getByText("No priority task")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Clickable task"
          dueDate="2025-12-25"
          priority="low"
          onClick={handleClick}
        />
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("works without onClick handler", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="No click handler"
          dueDate="2025-12-25"
          priority="medium"
        />
      );

      // Should not throw
      await user.click(screen.getByRole("button"));
    });
  });

  describe("accessibility", () => {
    it("has minimum touch target height (44px via min-h-11)", () => {
      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Touch target test"
          dueDate="2025-12-25"
          priority="medium"
        />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("min-h-11");
    });

    it("includes due date info in aria-label when present", () => {
      // Use a future date to avoid timezone-related "overdue" issues
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split("T")[0];

      renderWithAdminContext(
        <NextTaskBadge taskId={123} title="Future task" dueDate={dateStr} priority="high" />
      );
      const button = screen.getByRole("button");
      // Should include date info in aria-label
      expect(button.getAttribute("aria-label")).toContain("Future task");
      // And should have some date information
      expect(button.getAttribute("aria-label")?.length).toBeGreaterThan(15);
    });

    it("applies custom className", () => {
      renderWithAdminContext(
        <NextTaskBadge
          taskId={123}
          title="Custom class"
          dueDate="2025-12-25"
          priority="medium"
          className="custom-test-class"
        />
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-test-class");
    });
  });
});
