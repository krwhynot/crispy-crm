import { test, expect } from "../../support/fixtures/authenticated";

/**
 * Activity Form Simplified Layout Tests
 *
 * Verifies that the Activity form uses non-collapsible FormSection components,
 * ensuring all form sections are immediately visible without requiring clicks
 * to expand/collapse sections.
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Semantic selectors only (getByRole/Label/Text)
 * - Console monitoring via authenticatedPage fixture
 * - No waitForTimeout except where needed
 */

test.describe("Activity Form - Simplified Layout", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("2.1 Follow-up section visible without clicks", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/#/activities/create");

    await expect(
      authenticatedPage.getByRole("heading", { name: /create activity/i })
    ).toBeVisible();

    const followUpHeading = authenticatedPage.getByText(/follow-up/i, { exact: false });
    await expect(followUpHeading).toBeVisible();

    const sentimentField = authenticatedPage.getByLabel(/sentiment/i);
    await expect(sentimentField).toBeVisible();

    const followUpDateField = authenticatedPage.getByLabel(/follow-up date/i);
    await expect(followUpDateField).toBeVisible();

    const followUpNotesField = authenticatedPage.getByLabel(/follow-up notes/i);
    await expect(followUpNotesField).toBeVisible();
  });

  test("2.2 Outcome section visible without clicks", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/#/activities/create");

    await expect(
      authenticatedPage.getByRole("heading", { name: /create activity/i })
    ).toBeVisible();

    const outcomeHeading = authenticatedPage.getByText(/outcome/i, { exact: false });
    await expect(outcomeHeading).toBeVisible();

    const locationField = authenticatedPage.getByLabel(/location/i);
    await expect(locationField).toBeVisible();

    const outcomeField = authenticatedPage.getByLabel(/outcome/i);
    await expect(outcomeField).toBeVisible();
  });

  test("2.3 Click count comparison - no expand/collapse clicks required", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/#/activities/create");

    await expect(
      authenticatedPage.getByRole("heading", { name: /create activity/i })
    ).toBeVisible();

    const collapseTriggers = authenticatedPage.locator('[data-state="closed"]');
    const closedTriggerCount = await collapseTriggers.count();

    expect(closedTriggerCount).toBe(0);

    const allSections = [
      authenticatedPage.getByText(/activity details/i),
      authenticatedPage.getByText(/relationships/i),
      authenticatedPage.getByText(/follow-up/i),
      authenticatedPage.getByText(/outcome/i),
    ];

    for (const section of allSections) {
      await expect(section).toBeVisible();
    }

    const allFields = [
      authenticatedPage.getByLabel(/interaction type/i),
      authenticatedPage.getByLabel(/subject/i),
      authenticatedPage.getByLabel(/date/i),
      authenticatedPage.getByLabel(/opportunity/i),
      authenticatedPage.getByLabel(/sentiment/i),
      authenticatedPage.getByLabel(/follow-up date/i),
      authenticatedPage.getByLabel(/location/i),
    ];

    for (const field of allFields) {
      await expect(field).toBeVisible();
    }
  });
});
