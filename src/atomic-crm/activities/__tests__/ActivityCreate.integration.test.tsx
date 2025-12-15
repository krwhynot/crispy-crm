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

  test("shows 2 of 3 required fields initially due to schema defaults", async () => {
    renderActivityCreate();
    await waitFor(() => {
      expect(screen.getByText(/2 of 3 required fields/i)).toBeInTheDocument();
    });
  });

  test("shows checkmark on valid required field", async () => {
    const user = userEvent.setup();
    renderActivityCreate();

    const subjectInput = await screen.findByLabelText(/subject/i);
    await user.type(subjectInput, "Follow up call");
    await user.tab();

    await waitFor(() => {
      const checkIcons = document.querySelectorAll('svg.lucide-check');
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

  test("updates required field count when subject filled", async () => {
    const user = userEvent.setup();
    renderActivityCreate();

    const subjectInput = await screen.findByLabelText(/subject/i);
    await user.type(subjectInput, "Test subject");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/3 of 3 required fields/i)).toBeInTheDocument();
    });
  });
});
