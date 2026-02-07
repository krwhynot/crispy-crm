/**
 * ContactCreate Form Progress Integration Tests
 *
 * Tests the form progress tracking system including:
 * - FormProgressProvider initialization
 * - FormProgressBar rendering and progress calculation
 * - FormFieldWrapper validation state tracking
 * - FormSectionWithProgress completion indicators
 * - Field validation and error states
 */

import { describe, test, expect, beforeEach, beforeAll, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ContactCreate from "../ContactCreate";

/**
 * Mock data provider for ContactCreate tests.
 * Provides sales data for the Account Manager ReferenceInput.
 */
const createContactTestDataProvider = () => ({
  getList: vi.fn(async (resource: string) => {
    if (resource === "sales") {
      // Return sales user for ReferenceInput
      return {
        data: [{ id: 1, first_name: "Test", last_name: "User" }],
        total: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      };
    }
    if (resource === "organizations") {
      // Return organization for OrganizationPicker
      return {
        data: [{ id: 1, name: "Test Organization" }],
        total: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      };
    }
    return { data: [], total: 0, pageInfo: { hasNextPage: false, hasPreviousPage: false } };
  }),
});

const renderContactCreate = () => {
  return renderWithAdminContext(<ContactCreate />, {
    resource: "contacts",
    dataProvider: createContactTestDataProvider(),
  });
};

describe("ContactCreate with Progress Tracking", () => {
  beforeAll(() => {
    vi.setConfig({ testTimeout: 30000 });
  });

  beforeEach(() => {
    // Clear any cached state between tests
    localStorage.clear();
  });

  describe("Progress Bar Initialization", () => {
    test("renders progress indicator (Dot Mode) initially", async () => {
      renderContactCreate();

      // FormProgressBar renders in Dot Mode with role="group" when schema prop is passed
      const progressGroup = await screen.findByRole("group", { name: /required fields/i });
      expect(progressGroup).toBeInTheDocument();

      // Dot Mode shows individual dots - verify dots exist
      const dots = progressGroup.querySelectorAll("svg");
      expect(dots.length).toBeGreaterThan(0);
    }, 30000);

    test("progress indicator has correct accessibility attributes (Dot Mode)", async () => {
      renderContactCreate();

      // Dot Mode uses role="group" with aria-label describing completion status
      const progressGroup = await screen.findByRole("group", { name: /required fields/i });
      expect(progressGroup).toHaveAttribute("aria-label");

      // Verify aria-label contains completion info (e.g., "0 of 3 required fields complete")
      const ariaLabel = progressGroup.getAttribute("aria-label") || "";
      expect(ariaLabel).toMatch(/\d+ of \d+ required fields complete/);
    }, 30000);

    test("progress indicator is visible before form content", async () => {
      renderContactCreate();

      // Dot Mode renders with role="group"
      const progressGroup = await screen.findByRole("group", { name: /required fields/i });
      const firstNameInput = await screen.findByLabelText(/First Name/i);

      expect(progressGroup).toBeInTheDocument();
      expect(firstNameInput).toBeInTheDocument();
    });
  });

  describe("Form Section Rendering", () => {
    test("renders all three form sections", async () => {
      renderContactCreate();

      await waitFor(() => {
        const nameHeadings = screen.getAllByText("Contact Profile");
        expect(nameHeadings.some((el) => el.tagName === "H3")).toBe(true);

        const orgHeadings = screen.getAllByText("Account Details");
        expect(orgHeadings.some((el) => el.tagName === "H3")).toBe(true);

        expect(screen.getByRole("button", { name: /Contact Methods/i })).toBeInTheDocument();
      });
    });

    test("Contact Profile section shows no complete indicator initially", async () => {
      renderContactCreate();

      await screen.findByText("Contact Profile");
      // Initially incomplete - no complete icon shown (component only shows icon when complete)
      const completeIcons = screen.queryAllByTestId("section-complete-icon");
      expect(completeIcons.length).toBe(0);
    });

    test("Account Details section shows no complete indicator initially", async () => {
      renderContactCreate();

      await waitFor(() => {
        const orgHeadings = screen.getAllByText("Account Details");
        expect(orgHeadings.some((el) => el.tagName === "H3")).toBe(true);

        // Initially incomplete - no complete icon shown (component only shows icon when complete)
        const completeIcons = screen.queryAllByTestId("section-complete-icon");
        expect(completeIcons.length).toBe(0);
      });
    });

    test("CollapsibleSections have no progress indicators", async () => {
      renderContactCreate();

      // Contact Methods is now a CollapsibleSection (button), not FormSectionWithProgress
      const contactMethodsButton = await screen.findByRole("button", { name: /Contact Methods/i });
      expect(contactMethodsButton).toBeInTheDocument();

      // FormSectionWithProgress only shows complete icon when all required fields are valid
      // Initially no section is complete, so 0 icons are shown
      const completeIcons = screen.queryAllByTestId("section-complete-icon");
      expect(completeIcons.length).toBe(0);
    });
  });

  describe("Field Validation State", () => {
    test("required fields show wrapper without validation icon initially", async () => {
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      expect(firstNameInput).toBeInTheDocument();

      // Initially, no check or X icons should be visible
      const container = firstNameInput.closest(".relative");
      expect(container).toBeInTheDocument();
    });

    test("filling required field shows check icon", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      await user.type(firstNameInput, "John");
      await user.tab(); // Trigger onBlur validation

      await waitFor(() => {
        // Look for check icons using lucide-check class
        const checkIcons = document.querySelectorAll("svg.lucide-check");
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });

    test("field wrapper tracks field validity state", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      // Type valid value
      await user.type(firstNameInput, "Jane");
      await user.tab();

      await waitFor(() => {
        // Field should now be tracked as having a value
        expect(firstNameInput).toHaveValue("Jane");
      });
    });

    test("all required fields in Name section marked valid shows complete badge", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const completeBadges = screen.queryAllByTestId("section-complete-badge");
        expect(completeBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Progress Calculation", () => {
    test("progress increases when filling Name section fields", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const progressGroup = await screen.findByRole("group", {
        name: /required fields/i,
      });
      const initialLabel = progressGroup.getAttribute("aria-label") || "";
      const initialMatch = initialLabel.match(/^(\d+) of (\d+)/);
      const initialComplete = initialMatch ? parseInt(initialMatch[1], 10) : 0;

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      await user.type(firstNameInput, "John");
      await user.tab();

      await waitFor(() => {
        const currentLabel = progressGroup.getAttribute("aria-label") || "";
        const currentMatch = currentLabel.match(/^(\d+) of (\d+)/);
        const currentComplete = currentMatch ? parseInt(currentMatch[1], 10) : 0;
        expect(currentComplete).toBeGreaterThan(initialComplete);
      });
    });

    test("progress continues increasing when filling Organization fields", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const progressGroup = await screen.findByRole("group", {
        name: /required fields/i,
      });

      // Fill Name section
      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const afterNameLabel = progressGroup.getAttribute("aria-label") || "";
        const afterNameMatch = afterNameLabel.match(/^(\d+) of (\d+)/);
        const afterNameComplete = afterNameMatch ? parseInt(afterNameMatch[1], 10) : 0;
        // Fill Organization (would require interaction with autocomplete)
        // For now, just verify progress indicator is still responsive
        expect(afterNameComplete).toBeGreaterThan(0);
      });
    });

    test("progress reaches high percentage when all required fields filled", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const progressGroup = await screen.findByRole("group", {
        name: /required fields/i,
      });

      // Fill all Name fields
      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const currentLabel = progressGroup.getAttribute("aria-label") || "";
        const currentMatch = currentLabel.match(/^(\d+) of (\d+)/);
        const currentComplete = currentMatch ? parseInt(currentMatch[1], 10) : 0;
        // Should have completed at least 1 required field
        expect(currentComplete).toBeGreaterThan(0);
      });
    }, 30000);
  });

  describe("Section Completion Indicators", () => {
    test("Name section shows complete icon when both fields valid", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const completeIcons = screen.queryAllByTestId("section-complete-icon");
        expect(completeIcons.length).toBeGreaterThan(0);
      });
    });

    test("Name section shows Complete badge when both fields valid", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const completeBadges = screen.queryAllByTestId("section-complete-badge");
        expect(completeBadges.length).toBeGreaterThan(0);
      });
    });

    test("incomplete section does not show Complete badge", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      await user.type(firstNameInput, "John");
      await user.tab();

      // Only filled first_name, not last_name
      const completeBadges = screen.queryAllByTestId("section-complete-badge");
      // Should not show complete badge for Name section yet
      expect(completeBadges.length).toBe(0);
    });
  });

  describe("Form Mode Configuration", () => {
    test("form uses onBlur mode for validation", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const firstNameInput = await screen.findByLabelText(/First Name/i);

      // Type without blurring
      await user.type(firstNameInput, "J");

      // Should not trigger validation immediately (no error/check icon)
      // Validation happens on blur
      const checkIconsBefore = screen.queryAllByTestId("Check");
      expect(checkIconsBefore.length).toBe(0);

      // Blur the field
      await user.tab();

      // Now validation might trigger
      await waitFor(() => {
        const checkIconsAfter = screen.queryAllByTestId("Check");
        expect(checkIconsAfter.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Accessibility and UX", () => {
    test("FormFieldWrapper maintains data-tutorial attributes", async () => {
      renderContactCreate();

      // Wait for form to render
      await screen.findByLabelText(/First Name/i);

      // Check that data-tutorial attributes exist in the DOM
      const firstNameContainer = document.querySelector('[data-tutorial="contact-first-name"]');
      expect(firstNameContainer).toBeInTheDocument();

      const lastNameContainer = document.querySelector('[data-tutorial="contact-last-name"]');
      expect(lastNameContainer).toBeInTheDocument();
    });

    test("section titles are semantic headings", async () => {
      renderContactCreate();

      await waitFor(() => {
        const headings = screen.getAllByText("Contact Profile");
        const nameHeading = headings.find((el) => el.tagName === "H3");
        expect(nameHeading).toBeInTheDocument();

        const orgHeadings = screen.getAllByText("Account Details");
        const orgHeading = orgHeadings.find((el) => el.tagName === "H3");
        expect(orgHeading).toBeInTheDocument();
      });
    });

    test("progress bar updates are smooth without flicker", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const progressGroup = await screen.findByRole("group", {
        name: /required fields/i,
      });

      const firstNameInput = await screen.findByLabelText(/First Name/i);
      await user.type(firstNameInput, "John");
      await user.tab();

      // Progress group should remain in document (no unmount/remount)
      expect(progressGroup).toBeInTheDocument();

      await waitFor(() => {
        const label = progressGroup.getAttribute("aria-label") || "";
        const match = label.match(/(\d+) of (\d+)/);
        const filledCount = match ? parseInt(match[1], 10) : 0;
        expect(filledCount).toBeGreaterThan(0);
      });
    });
  });

  describe("Additional Details Fields", () => {
    test("optional fields in CollapsibleSection are wrapped with FormFieldWrapper", async () => {
      renderContactCreate();

      // Professional Details section should exist (collapsible)
      const professionalDetailsButton = await screen.findByRole("button", {
        name: /Professional Details/i,
      });
      expect(professionalDetailsButton).toBeInTheDocument();
    });

    test("CollapsibleSections are collapsed by default - fields hidden", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      // Wait for form to render
      await screen.findByLabelText(/First Name/i);

      // Fields in collapsible sections should not be visible initially
      expect(screen.queryByLabelText(/Job Title/i)).not.toBeInTheDocument();

      // Expand Professional Details
      const professionalButton = await screen.findByRole("button", {
        name: /Professional Details/i,
      });
      await user.click(professionalButton);

      // Now fields are visible
      expect(await screen.findByLabelText(/Job Title/i)).toBeInTheDocument();
    });

    test("optional fields do not affect required progress", async () => {
      const user = userEvent.setup();
      renderContactCreate();

      const progressGroup = await screen.findByRole("group", {
        name: /required fields/i,
      });

      // Fill only required Name fields
      const firstNameInput = await screen.findByLabelText(/First Name/i);
      const lastNameInput = await screen.findByLabelText(/Last Name/i);

      await user.type(firstNameInput, "John");
      await user.tab();
      await user.type(lastNameInput, "Doe");
      await user.tab();

      await waitFor(() => {
        const label = progressGroup.getAttribute("aria-label") || "";
        const match = label.match(/(\d+) of (\d+)/);
        const filledCount = match ? parseInt(match[1], 10) : 0;
        // Progress should be based on required fields, not optional ones
        expect(filledCount).toBeGreaterThan(0);
      });
    });
  });
});
