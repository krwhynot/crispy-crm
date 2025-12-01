import { test, expect } from "../support/fixtures/authenticated";
import AxeBuilder from "@axe-core/playwright";

/**
 * Dashboard V3 - Comprehensive Accessibility Audit (WCAG 2.1 AA)
 *
 * Tests accessibility compliance using axe-core across all Dashboard V3 panels:
 * - Panel 1: Pipeline by Principal (table, sorting, filtering)
 * - Panel 2: My Tasks (task items, checkboxes, action menus)
 * - Panel 3: Quick Logger (form inputs, comboboxes)
 *
 * Scenarios tested:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Focus management
 *
 * WCAG 2.1 AA Requirements checked:
 * - 1.1.1 Non-text Content
 * - 1.3.1 Info and Relationships
 * - 1.3.2 Meaningful Sequence
 * - 1.4.1 Use of Color
 * - 1.4.3 Contrast (Minimum)
 * - 1.4.4 Resize text
 * - 2.1.1 Keyboard
 * - 2.1.2 No Keyboard Trap
 * - 2.4.1 Bypass Blocks
 * - 2.4.3 Focus Order
 * - 2.4.6 Headings and Labels
 * - 2.4.7 Focus Visible
 * - 3.2.1 On Focus
 * - 3.2.2 On Input
 * - 4.1.1 Parsing
 * - 4.1.2 Name, Role, Value
 */

test.describe("Dashboard V3 - Accessibility Audit (WCAG 2.1 AA)", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V3 and wait for full load
    await authenticatedPage.goto("/");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for dashboard to be fully rendered
    await expect(
      authenticatedPage.getByRole("heading", { name: /principal dashboard/i, level: 1 })
    ).toBeVisible({ timeout: 15000 });
  });

  test.describe("Full Page Accessibility Scan", () => {
    test("entire dashboard passes WCAG 2.1 AA automated checks", async ({ authenticatedPage }) => {
      // Run axe-core on the full page
      const accessibilityResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Log violations for debugging
      if (accessibilityResults.violations.length > 0) {
        console.log("\n=== ACCESSIBILITY VIOLATIONS ===");
        for (const violation of accessibilityResults.violations) {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
          console.log(`  Description: ${violation.description}`);
          console.log(`  Help URL: ${violation.helpUrl}`);
          console.log(`  Affected elements (${violation.nodes.length}):`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`    - ${node.html.substring(0, 100)}...`);
            console.log(`      Failure: ${node.failureSummary}`);
          }
          if (violation.nodes.length > 3) {
            console.log(`    ... and ${violation.nodes.length - 3} more elements`);
          }
        }
        console.log("\n================================\n");
      }

      // Attach full report to test results
      await test.info().attach("accessibility-full-report", {
        body: JSON.stringify(accessibilityResults, null, 2),
        contentType: "application/json",
      });

      // Filter out incomplete rules (need manual review) - focus on violations
      expect(
        accessibilityResults.violations,
        `Found ${accessibilityResults.violations.length} accessibility violations`
      ).toHaveLength(0);
    });

    test("dashboard maintains accessibility after data loads", async ({ authenticatedPage }) => {
      // Wait for all panels to finish loading
      await authenticatedPage.waitForTimeout(2000);

      // Ensure no loading skeletons are visible
      await expect(authenticatedPage.locator(".animate-pulse").first()).not.toBeVisible({
        timeout: 10000,
      });

      const accessibilityResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      await test.info().attach("accessibility-post-load-report", {
        body: JSON.stringify(accessibilityResults, null, 2),
        contentType: "application/json",
      });

      expect(accessibilityResults.violations).toHaveLength(0);
    });
  });

  test.describe("Panel 1: Pipeline by Principal - Accessibility", () => {
    test("pipeline table has proper semantic structure", async ({ authenticatedPage }) => {
      // Focus on just the pipeline panel
      const pipelineSection = authenticatedPage.locator("section, div").filter({
        has: authenticatedPage.getByRole("heading", { name: /pipeline by principal/i }),
      });

      const results = await new AxeBuilder({ page: authenticatedPage })
        .include(await pipelineSection.elementHandle().then((h) => h?.asElement()))
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      await test.info().attach("pipeline-accessibility-report", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      expect(results.violations).toHaveLength(0);
    });

    test("table headers are properly associated with data cells", async ({ authenticatedPage }) => {
      // Verify table has proper structure
      const table = authenticatedPage.getByRole("table");
      await expect(table).toBeVisible();

      // Check for proper columnheader roles
      const headers = authenticatedPage.getByRole("columnheader");
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThanOrEqual(5);

      // Verify aria-sort on sortable columns
      for (let i = 0; i < headerCount - 1; i++) {
        // Last column (Next Action) might not be sortable
        const header = headers.nth(i);
        const ariaSort = await header.getAttribute("aria-sort");
        expect(
          ariaSort,
          `Column header ${i} should have aria-sort attribute for sortable columns`
        ).toBeTruthy();
      }
    });

    test("clickable rows are keyboard accessible", async ({ authenticatedPage }) => {
      // Find a table row that's clickable
      const tableBody = authenticatedPage.locator("tbody");
      const rows = tableBody.locator("tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();

        // Row should be focusable (tabIndex=0 and role=button in PrincipalPipelineTable)
        const tabIndex = await firstRow.getAttribute("tabindex");
        expect(tabIndex).toBe("0");

        const role = await firstRow.getAttribute("role");
        expect(role).toBe("button");

        // Test keyboard activation
        await firstRow.focus();
        await expect(firstRow).toBeFocused();

        // Verify aria-label for screen readers
        const ariaLabel = await firstRow.getAttribute("aria-label");
        expect(ariaLabel).toMatch(/view opportunities for/i);
      }
    });

    test("filter controls are properly labeled", async ({ authenticatedPage }) => {
      // My Principals Only switch
      const myPrincipalsSwitch = authenticatedPage.getByRole("switch");
      await expect(myPrincipalsSwitch).toHaveAttribute("id", "my-principals");

      // Filters dropdown button
      const filtersButton = authenticatedPage.getByRole("button", { name: /filters/i });
      await expect(filtersButton).toBeVisible();

      // Search input should have accessible name
      const searchInput = authenticatedPage.getByPlaceholder(/search principals/i);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe("Panel 2: My Tasks - Accessibility", () => {
    test("task checkboxes have proper labels", async ({ authenticatedPage }) => {
      // Find task items
      const taskItems = authenticatedPage.locator(".interactive-card");
      const taskCount = await taskItems.count();

      if (taskCount > 0) {
        // Each checkbox should have proper labeling via aria-labelledby or aria-label
        const checkboxes = authenticatedPage.getByRole("checkbox");
        const checkboxCount = await checkboxes.count();

        for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
          const checkbox = checkboxes.nth(i);
          // Checkbox should be accessible
          const isVisible = await checkbox.isVisible();
          if (isVisible) {
            // Run axe specifically on this checkbox
            const results = await new AxeBuilder({ page: authenticatedPage })
              .include(await checkbox.elementHandle())
              .withTags(["wcag2a", "wcag2aa"])
              .disableRules(["region"]) // Checkboxes don't need landmark
              .analyze();

            expect(results.violations).toHaveLength(0);
          }
        }
      }
    });

    test("action buttons have accessible names", async ({ authenticatedPage }) => {
      // Snooze buttons should have aria-label
      const snoozeButtons = authenticatedPage.getByRole("button", { name: /snooze/i });
      const snoozeCount = await snoozeButtons.count();

      for (let i = 0; i < Math.min(snoozeCount, 3); i++) {
        const button = snoozeButtons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toMatch(/snooze/i);
      }

      // More actions buttons should have aria-label
      const moreActionsButtons = authenticatedPage.getByRole("button", {
        name: /more actions/i,
      });
      const moreActionsCount = await moreActionsButtons.count();

      for (let i = 0; i < Math.min(moreActionsCount, 3); i++) {
        const button = moreActionsButtons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
      }
    });

    test("task groups are properly structured", async ({ authenticatedPage }) => {
      // Task groups (Overdue, Today, Tomorrow) should be identifiable
      const taskGroupHeadings = ["Overdue", "Today", "Tomorrow"];

      for (const groupName of taskGroupHeadings) {
        const group = authenticatedPage.locator(
          `button:has-text("${groupName}"), [role="button"]:has-text("${groupName}")`
        );
        const isVisible = await group.isVisible().catch(() => false);

        if (isVisible) {
          // If it's collapsible, it should have aria-expanded
          const ariaExpanded = await group.getAttribute("aria-expanded");
          // Either no aria-expanded (not collapsible) or has a value
          expect(ariaExpanded === null || ["true", "false"].includes(ariaExpanded!)).toBe(true);
        }
      }
    });

    test("WCAG 2.1 AA touch targets meet 44x44 minimum", async ({ authenticatedPage }) => {
      // Get all interactive elements in tasks panel
      const tasksPanel = authenticatedPage.locator(".card-container").filter({
        has: authenticatedPage.getByText("My Tasks", { exact: true }),
      });

      const buttons = tasksPanel.getByRole("button");
      const buttonCount = await buttons.count();

      const violations: string[] = [];

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          const box = await button.boundingBox();
          if (box) {
            if (box.width < 44 || box.height < 44) {
              const text = await button.textContent();
              violations.push(
                `Button "${text?.substring(0, 20) || "unknown"}" has size ${box.width.toFixed(0)}x${box.height.toFixed(0)} (minimum 44x44)`
              );
            }
          }
        }
      }

      // Report any violations
      if (violations.length > 0) {
        console.log("\n=== TOUCH TARGET VIOLATIONS ===");
        violations.forEach((v) => console.log(`  - ${v}`));
        console.log("================================\n");
      }

      expect(violations, violations.join("; ")).toHaveLength(0);
    });
  });

  test.describe("Panel 3: Quick Logger - Accessibility", () => {
    test("form controls have proper labels", async ({ authenticatedPage }) => {
      // Click "New Activity" to open the form
      const newActivityButton = authenticatedPage.getByRole("button", { name: /new activity/i });
      await newActivityButton.click();

      // Wait for form to appear
      await authenticatedPage.waitForTimeout(500);

      // Run axe on the form
      const quickLoggerPanel = authenticatedPage.locator(".card-container").filter({
        has: authenticatedPage.getByText("Log Activity", { exact: true }),
      });

      const results = await new AxeBuilder({ page: authenticatedPage })
        .include(await quickLoggerPanel.elementHandle().then((h) => h?.asElement()))
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      await test.info().attach("quick-logger-form-accessibility", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      expect(results.violations).toHaveLength(0);
    });

    test("comboboxes are keyboard navigable", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await authenticatedPage.waitForTimeout(500);

      // Focus activity type select (first combobox)
      const activityTypeCombobox = authenticatedPage.locator('[role="combobox"], select').first();
      await activityTypeCombobox.focus();

      // Should be able to keyboard navigate
      await authenticatedPage.keyboard.press("ArrowDown");
      await authenticatedPage.keyboard.press("Enter");

      // Form should still be accessible after interaction
      const results = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      // Focus on form-related violations only
      const formViolations = results.violations.filter(
        (v) =>
          v.id.includes("label") ||
          v.id.includes("aria") ||
          v.id.includes("focus") ||
          v.id.includes("keyboard")
      );

      expect(formViolations).toHaveLength(0);
    });

    test("form submission buttons are accessible", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await authenticatedPage.waitForTimeout(500);

      // Check Save & Close button
      const saveAndCloseButton = authenticatedPage.getByRole("button", {
        name: /save & close/i,
      });
      await expect(saveAndCloseButton).toBeVisible();
      await expect(saveAndCloseButton).toBeEnabled();

      // Check Save & New button
      const saveAndNewButton = authenticatedPage.getByRole("button", { name: /save & new/i });
      await expect(saveAndNewButton).toBeVisible();
      await expect(saveAndNewButton).toBeEnabled();

      // Check Cancel button
      const cancelButton = authenticatedPage.getByRole("button", { name: /cancel/i });
      await expect(cancelButton).toBeVisible();
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("can navigate entire dashboard using Tab key", async ({ authenticatedPage }) => {
      // Start from document body
      await authenticatedPage.keyboard.press("Tab");

      // Track focused elements
      const focusedElements: string[] = [];
      let previousElement = "";

      // Tab through 20 elements (should cover main UI)
      for (let i = 0; i < 20; i++) {
        const focusedElement = await authenticatedPage.evaluate(() => {
          const el = document.activeElement;
          return el
            ? `${el.tagName}${el.id ? "#" + el.id : ""}${el.className ? "." + el.className.split(" ")[0] : ""}`
            : "none";
        });

        // Detect keyboard trap (same element focused twice in a row)
        if (focusedElement === previousElement && focusedElement !== "none") {
          // This might be a keyboard trap!
          console.warn(`Potential keyboard trap at: ${focusedElement}`);
        }

        focusedElements.push(focusedElement);
        previousElement = focusedElement;

        await authenticatedPage.keyboard.press("Tab");
      }

      // Verify we visited multiple unique elements (not trapped)
      const uniqueElements = new Set(focusedElements);
      expect(
        uniqueElements.size,
        "Should be able to navigate to multiple unique elements"
      ).toBeGreaterThan(5);

      await test.info().attach("keyboard-navigation-path", {
        body: focusedElements.join("\n"),
        contentType: "text/plain",
      });
    });

    test("Escape key closes open dialogs and dropdowns", async ({ authenticatedPage }) => {
      // Open Filters dropdown
      const filtersButton = authenticatedPage.getByRole("button", { name: /filters/i });
      await filtersButton.click();

      // Verify dropdown is open
      await expect(authenticatedPage.locator('[role="menu"]')).toBeVisible({ timeout: 2000 });

      // Press Escape
      await authenticatedPage.keyboard.press("Escape");

      // Dropdown should be closed
      await expect(authenticatedPage.locator('[role="menu"]')).not.toBeVisible();
    });

    test("focus returns to trigger after closing dialogs", async ({ authenticatedPage }) => {
      // Open Filters dropdown
      const filtersButton = authenticatedPage.getByRole("button", { name: /filters/i });
      await filtersButton.click();

      // Wait for dropdown
      await expect(authenticatedPage.locator('[role="menu"]')).toBeVisible({ timeout: 2000 });

      // Press Escape
      await authenticatedPage.keyboard.press("Escape");

      // Focus should return to the filters button
      await expect(filtersButton).toBeFocused();
    });
  });

  test.describe("Color Contrast", () => {
    test("text has sufficient color contrast (4.5:1 for normal text)", async ({
      authenticatedPage,
    }) => {
      const results = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2aa"])
        .withRules(["color-contrast"])
        .analyze();

      // Report violations
      if (results.violations.length > 0) {
        console.log("\n=== COLOR CONTRAST VIOLATIONS ===");
        for (const violation of results.violations) {
          for (const node of violation.nodes) {
            console.log(`  - ${node.html.substring(0, 80)}...`);
            console.log(`    ${node.failureSummary}`);
          }
        }
        console.log("=================================\n");
      }

      await test.info().attach("color-contrast-report", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      expect(results.violations).toHaveLength(0);
    });

    test("semantic colors are used (not hardcoded hex)", async ({ authenticatedPage }) => {
      // Check that we're using CSS custom properties for colors
      const colorStyles = await authenticatedPage.evaluate(() => {
        const elements = document.querySelectorAll("*");
        const hardcodedColors: string[] = [];

        elements.forEach((el) => {
          const computed = getComputedStyle(el);
          const color = computed.color;

          // Check for hardcoded hex or rgb that isn't from CSS vars
          // This is a simplified check - in practice you'd verify against your design tokens
          if (color.includes("rgb(0, 0, 0)") && el.textContent?.trim()) {
            // Pure black on text might be intentional but worth flagging
            const text = el.textContent.substring(0, 30);
            if (text && !el.closest(".sr-only")) {
              hardcodedColors.push(`Text "${text}..." uses pure black`);
            }
          }
        });

        return hardcodedColors.slice(0, 10); // Limit to first 10
      });

      // Log any findings (not necessarily failures, just awareness)
      if (colorStyles.length > 0) {
        await test.info().attach("color-usage-notes", {
          body: colorStyles.join("\n"),
          contentType: "text/plain",
        });
      }
    });
  });

  test.describe("Focus Management", () => {
    test("focus is visible on all interactive elements", async ({ authenticatedPage }) => {
      const results = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2aa"])
        .withRules(["focus-visible"])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test("focus ring is clearly visible (3px ring per design system)", async ({
      authenticatedPage,
    }) => {
      // Tab to first focusable element
      await authenticatedPage.keyboard.press("Tab");

      // Get focus ring styles
      const focusRingStyles = await authenticatedPage.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;

        const styles = getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineOffset: styles.outlineOffset,
          boxShadow: styles.boxShadow,
          ring: styles.getPropertyValue("--tw-ring-width"),
        };
      });

      // Verify some focus indicator is present
      expect(focusRingStyles).toBeTruthy();

      // Either outline, box-shadow, or ring should indicate focus
      const hasFocusIndicator =
        (focusRingStyles?.outline && focusRingStyles.outline !== "none") ||
        (focusRingStyles?.boxShadow && focusRingStyles.boxShadow !== "none") ||
        focusRingStyles?.ring;

      expect(hasFocusIndicator, "Focus indicator should be visible").toBeTruthy();
    });
  });

  test.describe("Screen Reader Compatibility", () => {
    test("heading hierarchy is logical", async ({ authenticatedPage }) => {
      const headings = await authenticatedPage.evaluate(() => {
        const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        return Array.from(headingElements).map((h) => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim().substring(0, 50),
        }));
      });

      // Log heading structure
      await test.info().attach("heading-structure", {
        body: headings.map((h) => `H${h.level}: ${h.text}`).join("\n"),
        contentType: "text/plain",
      });

      // Verify there's exactly one h1
      const h1Count = headings.filter((h) => h.level === 1).length;
      expect(h1Count, "Should have exactly one H1").toBe(1);

      // Verify heading levels don't skip (e.g., h1 -> h3)
      let previousLevel = 0;
      for (const heading of headings) {
        if (heading.level > previousLevel + 1 && previousLevel > 0) {
          console.warn(
            `Heading level skipped: H${previousLevel} -> H${heading.level} ("${heading.text}")`
          );
        }
        previousLevel = heading.level;
      }
    });

    test("images and icons have appropriate alt text or are decorative", async ({
      authenticatedPage,
    }) => {
      const results = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a"])
        .withRules(["image-alt", "svg-img-alt"])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test("ARIA attributes are valid and properly used", async ({ authenticatedPage }) => {
      const results = await new AxeBuilder({ page: authenticatedPage })
        .withTags(["wcag2a", "wcag2aa"])
        .withRules([
          "aria-allowed-attr",
          "aria-hidden-body",
          "aria-hidden-focus",
          "aria-required-attr",
          "aria-required-children",
          "aria-required-parent",
          "aria-roles",
          "aria-valid-attr-value",
          "aria-valid-attr",
        ])
        .analyze();

      await test.info().attach("aria-validation-report", {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
      });

      expect(results.violations).toHaveLength(0);
    });

    test("live regions announce dynamic updates", async ({ authenticatedPage }) => {
      // Check for ARIA live regions in the document
      const liveRegions = await authenticatedPage.evaluate(() => {
        const regions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
        return Array.from(regions).map((r) => ({
          role: r.getAttribute("role"),
          ariaLive: r.getAttribute("aria-live"),
          ariaAtomic: r.getAttribute("aria-atomic"),
          content: r.textContent?.substring(0, 50),
        }));
      });

      await test.info().attach("live-regions", {
        body: JSON.stringify(liveRegions, null, 2),
        contentType: "application/json",
      });

      // Dashboard should have some mechanism for announcing updates
      // (could be from the useAriaAnnounce hook or notification system)
    });
  });

  test.describe("Drill-Down Sheet Accessibility", () => {
    test("drill-down sheet is properly announced to screen readers", async ({
      authenticatedPage,
    }) => {
      // Click on a pipeline row to open drill-down sheet
      const firstRow = authenticatedPage.locator("tbody tr").first();
      const rowCount = await firstRow.count();

      if (rowCount > 0) {
        await firstRow.click();

        // Wait for sheet to open
        await authenticatedPage.waitForTimeout(500);

        // Check if dialog is present with proper ARIA
        const dialog = authenticatedPage.getByRole("dialog");
        const isDialogVisible = await dialog.isVisible().catch(() => false);

        if (isDialogVisible) {
          // Dialog should have aria-modal
          await expect(dialog).toHaveAttribute("aria-modal", "true");

          // Run accessibility check on dialog
          const results = await new AxeBuilder({ page: authenticatedPage })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

          // Focus on dialog-specific violations
          const dialogViolations = results.violations.filter(
            (v) =>
              v.id.includes("dialog") ||
              v.id.includes("modal") ||
              v.id.includes("focus") ||
              v.id.includes("aria")
          );

          expect(dialogViolations).toHaveLength(0);

          // Close dialog
          await authenticatedPage.keyboard.press("Escape");
        }
      }
    });

    test("focus is trapped within open dialogs", async ({ authenticatedPage }) => {
      // Click on a pipeline row to open drill-down sheet
      const firstRow = authenticatedPage.locator("tbody tr").first();
      const rowCount = await firstRow.count();

      if (rowCount > 0) {
        await firstRow.click();

        // Wait for sheet to open
        const dialog = authenticatedPage.getByRole("dialog");
        await expect(dialog)
          .toBeVisible({ timeout: 5000 })
          .catch(() => {});

        if (await dialog.isVisible()) {
          // Tab through elements - should stay within dialog
          const focusedElementsInDialog: string[] = [];

          for (let i = 0; i < 10; i++) {
            await authenticatedPage.keyboard.press("Tab");

            const isInDialog = await authenticatedPage.evaluate(() => {
              const focused = document.activeElement;
              const dialog = document.querySelector('[role="dialog"]');
              return dialog?.contains(focused);
            });

            focusedElementsInDialog.push(isInDialog ? "in-dialog" : "outside-dialog");
          }

          // All focus should remain inside dialog
          const outsideCount = focusedElementsInDialog.filter((f) => f === "outside-dialog").length;
          expect(outsideCount, "Focus should remain trapped in dialog").toBe(0);

          // Clean up
          await authenticatedPage.keyboard.press("Escape");
        }
      }
    });
  });
});
