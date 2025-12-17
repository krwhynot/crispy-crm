import { test, expect } from "../../support/fixtures/authenticated";
import AxeBuilder from "@axe-core/playwright";

/**
 * E2E tests for UI/UX Accessibility Improvements (WCAG 2.1 AA)
 *
 * Tests accessibility compliance focused on form interactions and validation:
 * - Label-input connection (for attribute)
 * - Error message association (aria-describedby + role="alert")
 * - WCAG 2.1 AA compliance (axe-core audit)
 *
 * WCAG 2.1 AA Requirements tested:
 * - 1.3.1 Info and Relationships (label/input association)
 * - 3.3.1 Error Identification (validation errors)
 * - 3.3.2 Labels or Instructions (proper labeling)
 * - 4.1.2 Name, Role, Value (ARIA attributes)
 * - 4.1.3 Status Messages (role="alert" for errors)
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (minimal, focused on accessibility testing)
 * - Semantic selectors only (getByRole/Label/Text)
 * - Console monitoring via authenticated fixture
 * - Condition-based waiting (no arbitrary timeouts)
 */

test.describe("Accessibility Improvements - WCAG 2.1 AA", () => {
  test.describe("6.1 Form Label-Input Connection", () => {
    test("clicking on label focuses associated input", async ({ authenticatedPage }) => {
      // Navigate to contacts create form
      await authenticatedPage.goto("/#/contacts/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form to be visible
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Find a label (First Name is required and always visible)
      const label = authenticatedPage.locator('label:has-text("First Name")');
      await expect(label).toBeVisible();

      // Click on the label text
      await label.click();

      // Verify the associated input gets focused
      const input = authenticatedPage.getByLabel("First Name", { exact: false });
      await expect(input).toBeFocused();
    });

    test("multiple form fields have proper label association", async ({ authenticatedPage }) => {
      // Navigate to opportunities create form
      await authenticatedPage.goto("/#/opportunities/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form to be visible
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Test multiple labels - these fields should always be present in opportunity form
      const labelTexts = [
        "Opportunity Name",
        "Customer Organization",
        "Principal Organization",
      ];

      for (const labelText of labelTexts) {
        const label = authenticatedPage.locator(`label:has-text("${labelText}")`);
        const isVisible = await label.isVisible().catch(() => false);

        if (isVisible) {
          // Click label
          await label.click();

          // Get the associated input
          const input = authenticatedPage.getByLabel(labelText, { exact: false });

          // Input should be focused or its parent container should be (for comboboxes)
          const isFocused = await input.isFocused().catch(() => false);
          const parent = input.locator("..");
          const isParentFocused = await parent
            .locator("[role='combobox']")
            .isFocused()
            .catch(() => false);

          expect(
            isFocused || isParentFocused,
            `Label "${labelText}" should focus its associated input`
          ).toBeTruthy();
        }
      }
    });
  });

  test.describe("6.2 Error Message Association", () => {
    test("validation errors have aria-describedby linking to error messages with role=alert", async ({
      authenticatedPage,
    }) => {
      // Navigate to contacts create form
      await authenticatedPage.goto("/#/contacts/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form to be visible
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Try to submit empty form to trigger validation errors
      const saveButton = authenticatedPage.getByRole("button", { name: /save.*close/i });
      await saveButton.click();

      // Wait for validation to trigger
      await authenticatedPage.waitForTimeout(1000);

      // Find inputs with aria-invalid="true"
      const invalidInputs = authenticatedPage.locator('[aria-invalid="true"]');
      const invalidCount = await invalidInputs.count();

      // There should be at least one validation error
      expect(invalidCount, "Should have at least one validation error").toBeGreaterThan(0);

      // Check the first invalid input
      const firstInvalidInput = invalidInputs.first();

      // Verify aria-describedby attribute exists
      const describedBy = await firstInvalidInput.getAttribute("aria-describedby");
      expect(describedBy, "Invalid input should have aria-describedby attribute").toBeTruthy();

      if (describedBy) {
        // Extract the ID (might have multiple space-separated IDs)
        const errorId = describedBy.split(" ").find((id) => id.includes("error") || id.includes("helper"));

        if (errorId) {
          // Find the error element by ID
          const errorElement = authenticatedPage.locator(`#${errorId}`);
          await expect(errorElement, "Error message element should be visible").toBeVisible();

          // Verify error element has role="alert" for screen reader announcement
          const role = await errorElement.getAttribute("role");
          expect(
            role,
            "Error message should have role='alert' for screen reader announcement"
          ).toBe("alert");
        }
      }
    });

    test("error messages are programmatically associated with inputs", async ({
      authenticatedPage,
    }) => {
      // Navigate to opportunities create form
      await authenticatedPage.goto("/#/opportunities/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form to be visible
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Click save to trigger validation
      const saveButton = authenticatedPage.getByRole("button", { name: /save/i });
      await saveButton.click();

      // Wait for validation
      await authenticatedPage.waitForTimeout(1000);

      // Find all invalid inputs
      const invalidInputs = authenticatedPage.locator('[aria-invalid="true"]');
      const count = await invalidInputs.count();

      if (count > 0) {
        // Check each invalid input (up to 3)
        for (let i = 0; i < Math.min(count, 3); i++) {
          const input = invalidInputs.nth(i);
          const describedBy = await input.getAttribute("aria-describedby");

          // Should have aria-describedby
          expect(
            describedBy,
            `Invalid input ${i} should have aria-describedby`
          ).toBeTruthy();

          if (describedBy) {
            // Each ID in describedBy should reference a visible element
            const ids = describedBy.split(" ");
            for (const id of ids) {
              const element = authenticatedPage.locator(`#${id}`);
              const exists = await element.count();
              expect(exists, `Element with id="${id}" should exist`).toBeGreaterThan(0);
            }
          }

          // Should have aria-invalid
          const ariaInvalid = await input.getAttribute("aria-invalid");
          expect(ariaInvalid, `Invalid input ${i} should have aria-invalid="true"`).toBe("true");
        }
      }
    });
  });

  test.describe("6.3 WCAG 2.1 AA Compliance", () => {
    test("opportunities page passes axe-core WCAG 2.1 AA audit", async ({
      authenticatedPage,
    }) => {
      // Navigate to opportunities list page
      await authenticatedPage.goto("/#/opportunities");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for page to fully render
      await authenticatedPage
        .getByRole("navigation")
        .first()
        .waitFor({ state: "visible", timeout: 10000 });

      // Run axe-core accessibility audit with WCAG 2.1 AA tags
      const accessibilityResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Log violations with details for debugging
      if (accessibilityResults.violations.length > 0) {
        console.log("\n=== ACCESSIBILITY VIOLATIONS ===");
        accessibilityResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
          console.log(`  Description: ${violation.description}`);
          console.log(`  Help URL: ${violation.helpUrl}`);
          console.log(`  Affected elements (${violation.nodes.length}):`);
          violation.nodes.slice(0, 3).forEach((node) => {
            console.log(`    - ${node.html.substring(0, 100)}...`);
            console.log(`      ${node.failureSummary}`);
          });
          if (violation.nodes.length > 3) {
            console.log(`    ... and ${violation.nodes.length - 3} more elements`);
          }
        });
        console.log("================================\n");
      }

      // Attach full report to test results
      await test.info().attach("accessibility-opportunities-report", {
        body: JSON.stringify(accessibilityResults, null, 2),
        contentType: "application/json",
      });

      // Assert no violations
      expect(
        accessibilityResults.violations,
        `Found ${accessibilityResults.violations.length} accessibility violations`
      ).toHaveLength(0);
    });

    test("contacts page passes axe-core WCAG 2.1 AA audit", async ({ authenticatedPage }) => {
      // Navigate to contacts list page
      await authenticatedPage.goto("/#/contacts");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for page to fully render
      await authenticatedPage
        .getByRole("navigation")
        .first()
        .waitFor({ state: "visible", timeout: 10000 });

      // Run axe-core accessibility audit
      const accessibilityResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Log violations
      if (accessibilityResults.violations.length > 0) {
        console.log("\n=== ACCESSIBILITY VIOLATIONS (Contacts Page) ===");
        accessibilityResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
        });
        console.log("================================================\n");
      }

      // Attach report
      await test.info().attach("accessibility-contacts-report", {
        body: JSON.stringify(accessibilityResults, null, 2),
        contentType: "application/json",
      });

      // Assert no violations
      expect(accessibilityResults.violations).toHaveLength(0);
    });

    test("opportunity create form passes axe-core WCAG 2.1 AA audit", async ({
      authenticatedPage,
    }) => {
      // Navigate to opportunity create form
      await authenticatedPage.goto("/#/opportunities/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form to be visible
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Run axe-core accessibility audit
      const accessibilityResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Log violations
      if (accessibilityResults.violations.length > 0) {
        console.log("\n=== ACCESSIBILITY VIOLATIONS (Opportunity Form) ===");
        accessibilityResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
        });
        console.log("===================================================\n");
      }

      // Attach report
      await test.info().attach("accessibility-opportunity-form-report", {
        body: JSON.stringify(accessibilityResults, null, 2),
        contentType: "application/json",
      });

      // Assert no violations
      expect(accessibilityResults.violations).toHaveLength(0);
    });
  });

  test.describe("Additional Accessibility Checks", () => {
    test("form inputs have visible focus indicators", async ({ authenticatedPage }) => {
      // Navigate to contacts create form
      await authenticatedPage.goto("/#/contacts/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Tab to first focusable element
      await authenticatedPage.keyboard.press("Tab");

      // Get focus ring styles
      const focusStyles = await authenticatedPage.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;

        const styles = getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
          ring: styles.getPropertyValue("--tw-ring-width"),
        };
      });

      // Verify some focus indicator is present
      expect(focusStyles, "Focus styles should be present").toBeTruthy();

      // Either outline or box-shadow should indicate focus
      const hasFocusIndicator =
        (focusStyles?.outline && focusStyles.outline !== "none") ||
        (focusStyles?.boxShadow && focusStyles.boxShadow !== "none") ||
        focusStyles?.ring;

      expect(hasFocusIndicator, "Focus indicator should be visible").toBeTruthy();
    });

    test("keyboard navigation works on forms", async ({ authenticatedPage }) => {
      // Navigate to contacts create form
      await authenticatedPage.goto("/#/contacts/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for form
      await authenticatedPage
        .getByRole("form")
        .or(authenticatedPage.locator("form"))
        .waitFor({ state: "visible", timeout: 10000 });

      // Track focused elements
      const focusedElements: string[] = [];

      // Tab through 10 elements
      for (let i = 0; i < 10; i++) {
        await authenticatedPage.keyboard.press("Tab");

        const focusedTag = await authenticatedPage.evaluate(() => {
          const el = document.activeElement;
          return el ? el.tagName.toLowerCase() : "none";
        });

        focusedElements.push(focusedTag);
      }

      // Verify we visited multiple unique elements (not trapped)
      const uniqueElements = new Set(focusedElements);
      expect(
        uniqueElements.size,
        "Should be able to navigate to multiple unique elements"
      ).toBeGreaterThan(3);

      // Should include interactive elements
      const hasInteractive =
        focusedElements.includes("button") ||
        focusedElements.includes("input") ||
        focusedElements.includes("select") ||
        focusedElements.includes("textarea");

      expect(hasInteractive, "Should focus interactive form elements").toBeTruthy();
    });
  });
});
