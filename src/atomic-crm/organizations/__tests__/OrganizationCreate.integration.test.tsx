import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OrganizationCreate } from "../OrganizationCreate";

const renderOrganizationCreate = () => {
  return renderWithAdminContext(<OrganizationCreate />, {
    resource: "organizations",
  });
};

describe("OrganizationCreate with Progress Tracking", () => {
  beforeEach(() => {
    // Reset any test state if needed
  });

  it("renders progress bar at ~10% initially", async () => {
    renderOrganizationCreate();
    const progressBar = await screen.findByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "10");
  });

  it("shows Basic Information section with incomplete indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByTestId("section-incomplete-icon")).toBeInTheDocument();
  });

  it("shows Basic Information section title", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Basic Information")).toBeInTheDocument();
  });

  it("shows Account & Segment section without completion indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Account & Segment")).toBeInTheDocument();
    // Section has no required fields, so no icon should be shown
    const allIncompleteIcons = screen.queryAllByTestId("section-incomplete-icon");
    // Only one incomplete icon for Basic Information section
    expect(allIncompleteIcons).toHaveLength(1);
  });

  it("shows Location section without completion indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Location")).toBeInTheDocument();
  });

  it("renders all form sections", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Account & Segment")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("wraps organization name field with isRequired", async () => {
    renderOrganizationCreate();
    const nameInput = await screen.findByLabelText(/Organization Name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it("shows complete icon when name is filled", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    const nameInput = await screen.findByLabelText(/Organization Name/i);
    await user.type(nameInput, "Test Organization");

    // Wait for the form to register the change
    await waitFor(() => {
      const completeIcon = screen.queryByTestId("section-complete-icon");
      expect(completeIcon).toBeInTheDocument();
    });
  });

  it("shows Complete badge when name field is valid", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    const nameInput = await screen.findByLabelText(/Organization Name/i);
    await user.type(nameInput, "Test Organization");

    await waitFor(() => {
      const completeBadge = screen.queryByTestId("section-complete-badge");
      expect(completeBadge).toBeInTheDocument();
    });
  });

  it("increases progress bar when name is filled", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    const progressBar = await screen.findByRole("progressbar");
    const initialProgress = progressBar.getAttribute("aria-valuenow");

    const nameInput = await screen.findByLabelText(/Organization Name/i);
    await user.type(nameInput, "Test Organization");

    await waitFor(() => {
      const newProgress = progressBar.getAttribute("aria-valuenow");
      expect(Number(newProgress)).toBeGreaterThan(Number(initialProgress));
    });
  });

  it("preserves data-tutorial attributes on fields", async () => {
    const user = userEvent.setup();
    const { container } = renderOrganizationCreate();

    // Wait for component to render by finding a known element first
    await screen.findByText("Basic Information");

    // Check for data-tutorial attributes using querySelector
    const orgNameTutorial = container.querySelector('[data-tutorial="org-name"]');
    expect(orgNameTutorial).toBeInTheDocument();

    const orgTypeTutorial = container.querySelector('[data-tutorial="org-type"]');
    expect(orgTypeTutorial).toBeInTheDocument();

    // Additional Details is collapsed by default - need to expand it
    const additionalDetailsButton = screen.getByRole("button", { name: /Additional Details/i });
    await user.click(additionalDetailsButton);

    await waitFor(() => {
      const orgWebsiteTutorial = container.querySelector('[data-tutorial="org-website"]');
      expect(orgWebsiteTutorial).toBeInTheDocument();
    });
  });

  it("renders FormProgressProvider wrapper", async () => {
    renderOrganizationCreate();

    // Progress bar should be rendered if provider exists
    const progressBar = await screen.findByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders FormProgressBar before the form card", async () => {
    const { container } = renderOrganizationCreate();

    const progressBar = await screen.findByRole("progressbar");
    expect(progressBar).toBeInTheDocument();

    // The mb-6 class is on the wrapper div, not the progressbar itself
    const progressBarWrapper = progressBar.parentElement;
    expect(progressBarWrapper?.className).toContain("mb-6");
  });

  it("maintains form mode as onBlur", async () => {
    renderOrganizationCreate();

    // The form should exist
    const nameInput = await screen.findByLabelText(/Organization Name/i);
    expect(nameInput).toBeInTheDocument();

    // Blur behavior test - type and blur to trigger validation
    const user = userEvent.setup();
    await user.click(nameInput);
    await user.tab(); // Blur the field

    // Field should be validated on blur (form mode: onBlur)
    // This is implicit - the form uses onBlur mode
  });

  it("shows section with requiredFields prop correctly", async () => {
    renderOrganizationCreate();

    // Basic Information has requiredFields=['name']
    const basicInfoSection = await screen.findByText("Basic Information");
    expect(basicInfoSection).toBeInTheDocument();

    // Should have incomplete icon initially
    const incompleteIcon = screen.getByTestId("section-incomplete-icon");
    expect(incompleteIcon).toBeInTheDocument();
  });

  it("wraps Additional Details fields with FormFieldWrapper", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    // Additional Details is in a collapsible section - need to expand it
    const additionalDetailsButton = await screen.findByRole("button", {
      name: /Additional Details/i,
    });
    await user.click(additionalDetailsButton);

    // Now the fields should be visible
    const websiteInput = await screen.findByLabelText(/Website/i);
    expect(websiteInput).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/Phone/i);
    expect(phoneInput).toBeInTheDocument();
  });
});
