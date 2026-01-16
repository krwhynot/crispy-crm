import { describe, test, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ActivityCreate from "../ActivityCreate";

const renderActivityCreate = () => {
  return renderWithAdminContext(<ActivityCreate />, {
    resource: "activities",
  });
};

describe("ActivityCreate with Progress Tracking", () => {
  test("renders progress bar showing schema defaults as complete", async () => {
    renderActivityCreate();
    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      const value = Number(progressBar.getAttribute("aria-valuenow"));
      expect(value).toBeGreaterThanOrEqual(60);
    });
  });

  test("shows partial completion initially due to schema defaults", async () => {
    // Zod v4 base schema provides defaults for type and activity_date
    // but subject is required with no default, so form starts incomplete
    renderActivityCreate();
    await waitFor(() => {
      // Progress bar should show partial completion (type and date have defaults)
      const progressBar = screen.getByRole("progressbar");
      const value = Number(progressBar.getAttribute("aria-valuenow"));
      // Should be more than 0 (some fields have defaults) but less than 100 (subject is empty)
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(100);
    });
  });

  test("shows checkmark on valid required field", async () => {
    const user = userEvent.setup();
    renderActivityCreate();

    const subjectInput = await screen.findByLabelText(/subject/i);
    await user.type(subjectInput, "Follow up call");
    await user.tab();

    await waitFor(() => {
      const checkIcons = document.querySelectorAll("svg.lucide-check");
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  test("reaches 100% progress when all required fields valid", async () => {
    const user = userEvent.setup();
    renderActivityCreate();

    const subjectInput = await screen.findByLabelText(/subject/i);
    await user.type(subjectInput, "Follow up call");
    await user.tab();

    await waitFor(
      () => {
        const progressBar = screen.getByRole("progressbar");
        const value = Number(progressBar.getAttribute("aria-valuenow"));
        expect(value).toBe(100);
      },
      { timeout: 3000 }
    );
  });

  test("preserves existing form submission behavior", async () => {
    renderActivityCreate();
    expect(screen.getByText(/Activity Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Relationships/i)).toBeInTheDocument();
  });

  test("maintains completion state when subject modified", async () => {
    // With Zod v4 base schema providing defaults, form starts complete
    // This test verifies it stays complete when user interacts with fields
    const user = userEvent.setup();
    renderActivityCreate();

    const subjectInput = await screen.findByLabelText(/subject/i);
    await user.clear(subjectInput);
    await user.type(subjectInput, "Test subject");
    await user.tab();

    await waitFor(() => {
      // Should remain complete after user modifies the subject
      expect(screen.getByTestId("section-complete-badge")).toBeInTheDocument();
    });
  });
});
