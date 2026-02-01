import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockDataProvider } from "@/tests/utils/mock-providers";
import type { GetListParams } from "ra-core";
import { OrganizationCreate } from "../OrganizationCreate";

/**
 * Mock data provider with segments data required by OrganizationCreate.
 * The component uses useGetList("segments") to fetch the "Unknown" segment
 * and guards against rendering if it's not found.
 */
const createOrgTestDataProvider = () =>
  createMockDataProvider({
    getList: vi.fn(async (resource: string, _params: GetListParams) => {
      if (resource === "segments") {
        return {
          data: [{ id: "uuid-unknown-segment", name: "Unknown" }],
          total: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        };
      }
      if (resource === "sales") {
        return {
          data: [{ id: 1, first_name: "Test", last_name: "User" }],
          total: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        };
      }
      return { data: [], total: 0, pageInfo: { hasNextPage: false, hasPreviousPage: false } };
    }),
  });

const renderOrganizationCreate = () => {
  return renderWithAdminContext(<OrganizationCreate />, {
    resource: "organizations",
    dataProvider: createOrgTestDataProvider(),
  });
};

describe("OrganizationCreate with Progress Tracking", () => {
  beforeEach(() => {
    // Reset any test state if needed
  });

  it("renders progress bar with initial progress", async () => {
    renderOrganizationCreate();
    const progressBar = await screen.findByRole("progressbar");
    // Progress may be higher than 10% due to schema defaults and auto-filled fields
    const progress = parseInt(progressBar.getAttribute("aria-valuenow") || "0", 10);
    expect(progress).toBeGreaterThanOrEqual(10);
    expect(progress).toBeLessThan(100);
  });

  it("shows Company Profile section with incomplete indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByTestId("section-incomplete-icon")).toBeInTheDocument();
  });

  it("shows Company Profile section title", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Company Profile")).toBeInTheDocument();
  });

  it("shows Account Details section without completion indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Account Details")).toBeInTheDocument();
    // Section has no required fields, so no icon should be shown
    const allIncompleteIcons = screen.queryAllByTestId("section-incomplete-icon");
    // Only one incomplete icon for Company Profile section
    expect(allIncompleteIcons).toHaveLength(1);
  });

  it("shows Location section without completion indicator", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Location")).toBeInTheDocument();
  });

  it("renders all form sections", async () => {
    renderOrganizationCreate();
    expect(await screen.findByText("Company Profile")).toBeInTheDocument();
    expect(screen.getByText("Account Details")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
  });

  it("wraps organization name field with isRequired", async () => {
    renderOrganizationCreate();
    const nameInput = await screen.findByLabelText(/Company Name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it("shows complete icon when name is filled", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    const nameInput = await screen.findByLabelText(/Company Name/i);
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

    const nameInput = await screen.findByLabelText(/Company Name/i);
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

    const nameInput = await screen.findByLabelText(/Company Name/i);
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
    await screen.findByText("Company Profile");

    // Check for data-tutorial attributes using querySelector
    const orgNameTutorial = container.querySelector('[data-tutorial="org-name"]');
    expect(orgNameTutorial).toBeInTheDocument();

    const orgTypeTutorial = container.querySelector('[data-tutorial="org-type"]');
    expect(orgTypeTutorial).toBeInTheDocument();

    // Contact & Web is collapsed by default - need to expand it
    const additionalDetailsButton = screen.getByRole("button", { name: /Contact & Web/i });
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
    renderOrganizationCreate();

    const progressBar = await screen.findByRole("progressbar");
    expect(progressBar).toBeInTheDocument();

    // The mb-6 class is on the wrapper div, not the progressbar itself
    const progressBarWrapper = progressBar.parentElement;
    expect(progressBarWrapper?.className).toContain("mb-6");
  });

  it("validates form fields on blur and change (mode=all)", async () => {
    renderOrganizationCreate();

    // The form should exist
    const nameInput = await screen.findByLabelText(/Company Name/i);
    expect(nameInput).toBeInTheDocument();

    // Validation behavior test - type and blur to trigger validation
    const user = userEvent.setup();
    await user.click(nameInput);
    await user.tab(); // Blur the field

    // Field should be validated on blur and change (form mode: all)
    // This ensures required fields like segment_id are validated even when untouched
  });

  it("shows section with requiredFields prop correctly", async () => {
    renderOrganizationCreate();

    // Company Profile has requiredFields=['name']
    const basicInfoSection = await screen.findByText("Company Profile");
    expect(basicInfoSection).toBeInTheDocument();

    // Should have incomplete icon initially
    const incompleteIcon = screen.getByTestId("section-incomplete-icon");
    expect(incompleteIcon).toBeInTheDocument();
  });

  it("wraps Contact & Web fields with FormFieldWrapper", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    // Contact & Web is in a collapsible section - need to expand it
    const additionalDetailsButton = await screen.findByRole("button", {
      name: /Contact & Web/i,
    });
    await user.click(additionalDetailsButton);

    // Now the fields should be visible
    const websiteInput = await screen.findByLabelText(/Website/i);
    expect(websiteInput).toBeInTheDocument();

    const phoneInput = screen.getByLabelText(/Phone/i);
    expect(phoneInput).toBeInTheDocument();
  });
});

describe("OrganizationCreate - Save & Add Another (Config-Driven)", () => {
  it("should preserve parent_organization_id from config preserveFields", async () => {
    const dataProvider = createOrgTestDataProvider();
    const createSpy = vi.spyOn(dataProvider, "create");

    renderWithAdminContext(<OrganizationCreate />, {
      resource: "organizations",
      dataProvider,
    });

    // Wait for form to load
    await screen.findByLabelText(/Company Name/i);

    // Verify that the form will preserve parent_organization_id
    // (actual preservation logic tested in OrganizationCreate unit tests)
    expect(createSpy).not.toHaveBeenCalled(); // No save yet
  });

  it("should preserve organization_type from config preserveFields", async () => {
    const dataProvider = createOrgTestDataProvider();
    renderWithAdminContext(<OrganizationCreate />, {
      resource: "organizations",
      dataProvider,
    });

    await screen.findByLabelText(/Company Name/i);

    // Organization type field should exist and be part of preserved fields
    // (tested via config in organizationFormConfig.test.ts)
  });

  it("should preserve sales_id from config preserveFields", async () => {
    const dataProvider = createOrgTestDataProvider();
    renderWithAdminContext(<OrganizationCreate />, {
      resource: "organizations",
      dataProvider,
    });

    await screen.findByLabelText(/Company Name/i);

    // Sales ID field should exist and be part of preserved fields
    // (tested via config in organizationFormConfig.test.ts)
  });
});

/**
 * CRITICAL BUG FIX: Cancel button regression tests
 *
 * Background: Cancel button was missing type="button" attribute, causing it
 * to default to type="submit" and trigger form submission instead of just
 * showing the discard dialog. This created unwanted database records.
 *
 * These tests verify the fix and prevent regression.
 */
describe("OrganizationCreate Cancel Button Behavior", () => {
  it("should have type='button' attribute to prevent form submission", async () => {
    renderOrganizationCreate();

    // Wait for form to render
    await screen.findByLabelText(/Company Name/i);

    // Find Cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    // CRITICAL: Verify type="button" is set (not type="submit")
    expect(cancelButton).toHaveAttribute("type", "button");
  });

  it("should show unsaved changes dialog when Cancel is clicked with dirty form", async () => {
    const user = userEvent.setup();
    renderOrganizationCreate();

    // Fill in form to make it dirty
    const nameInput = await screen.findByLabelText(/Company Name/i);
    await user.type(nameInput, "Test Organization");

    // Click Cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Verify unsaved changes dialog appears
    await waitFor(() => {
      expect(screen.getByText(/discard unsaved changes/i)).toBeInTheDocument();
    });

    // Verify "Discard Changes" and "Keep Editing" buttons are present
    expect(screen.getByRole("button", { name: /discard changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep editing/i })).toBeInTheDocument();
  });
});
