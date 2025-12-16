import { test, expect } from "../support/fixtures/authenticated";
import { createSlideOver } from "../support/fixtures/design-system";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * SlideOver Responsive Width Tests
 *
 * Validates that the SlideOver component respects the lg: breakpoint (1024px):
 * - Desktop (≥1024px): Constrained to 40vw, min 576px, max 600px
 * - Tablet/Mobile (<1024px): Full viewport width
 *
 * Per playwright-e2e-testing skill:
 * - Semantic selectors only ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting ✓
 * - No arbitrary timeouts (except animations) ✓
 */
test.describe("SlideOver Responsive Width", () => {
  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();
    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }
    // Filter out known React warning about rowClassName prop (non-critical)
    const criticalErrors = errors.filter(
      (e) => !e.includes("rowClassName") && !e.includes("rowclassname")
    );
    expect(criticalErrors, "Console errors detected").toHaveLength(0);
  });

  const viewports = {
    desktop: { width: 1440, height: 900, expectedBehavior: "constrained" as const },
    laptop: { width: 1280, height: 800, expectedBehavior: "constrained" as const },
    lgBreakpoint: { width: 1024, height: 768, expectedBehavior: "constrained" as const },
    belowLg: { width: 1023, height: 768, expectedBehavior: "fullscreen" as const },
    tabletPortrait: { width: 768, height: 1024, expectedBehavior: "fullscreen" as const },
    mobile: { width: 375, height: 667, expectedBehavior: "fullscreen" as const },
  };

  for (const [name, config] of Object.entries(viewports)) {
    test(`SlideOver width at ${name} (${config.width}px)`, async ({ authenticatedPage }) => {
      // Set viewport size BEFORE navigation
      await authenticatedPage.setViewportSize({
        width: config.width,
        height: config.height,
      });

      const slideOver = createSlideOver(authenticatedPage);

      // Use deep link to open slide-over directly (more reliable than row clicking)
      // This avoids table loading issues and viewport-specific list layouts
      await authenticatedPage.goto("/#/contacts?view=1");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for slide-over animation to complete
      await authenticatedPage.waitForTimeout(500);

      // Verify slide-over is visible
      await slideOver.expectVisible();

      // Measure actual width
      const dialog = slideOver.getDialog();
      const box = await dialog.boundingBox();
      expect(box, "Dialog should have bounding box").toBeTruthy();

      if (config.expectedBehavior === "constrained") {
        // Desktop: 40vw with min 576px, max 600px
        const expected40vw = config.width * 0.4;
        const expectedWidth = Math.min(600, Math.max(576, expected40vw));

        expect(box!.width).toBeCloseTo(expectedWidth, -1); // ±10px tolerance
        expect(box!.width).toBeLessThanOrEqual(610); // max-w-[600px] + tolerance
        expect(box!.width).toBeGreaterThanOrEqual(400); // min practical width
      } else {
        // Mobile/Tablet: Full viewport width
        expect(box!.width).toBeCloseTo(config.width, -1); // ±10px tolerance
      }

      // Clean up
      await slideOver.pressEscapeAndVerifyClosed();
    });
  }

  test.describe("Desktop main content visibility", () => {
    test("main content remains visible when slide-over is open at 1440px", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });

      const slideOver = createSlideOver(authenticatedPage);

      // Use deep link for reliability
      await authenticatedPage.goto("/#/contacts?view=1");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.waitForTimeout(500);

      await slideOver.expectVisible();

      const dialog = slideOver.getDialog();
      const box = await dialog.boundingBox();

      // At 1440px, SlideOver should be ~576px (40vw)
      // Remaining space: 1440 - 576 = 864px for main content
      const remainingSpace = 1440 - (box?.width || 0);
      expect(remainingSpace).toBeGreaterThanOrEqual(600);
    });
  });
});
