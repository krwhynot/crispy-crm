import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Desktop spacing tokens", () => {
  it("should have desktop-optimized spacing values", () => {
    // Read the CSS file directly since jsdom doesn't fully support CSS custom properties
    const cssPath = resolve(__dirname, "../index.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    // Original values that were reduced for desktop density
    expect(cssContent).toMatch(/--spacing-edge-desktop:\s*24px/); // from 120px
    expect(cssContent).toMatch(/--spacing-widget-padding:\s*12px/); // from 20px
    expect(cssContent).toMatch(/--spacing-gutter-desktop:\s*12px/); // from 24px
    expect(cssContent).toMatch(/--spacing-section:\s*24px/); // from 32px
    expect(cssContent).toMatch(/--spacing-widget:\s*16px/); // from 24px
    expect(cssContent).toMatch(/--spacing-content:\s*12px/); // from 16px
    expect(cssContent).toMatch(/--spacing-compact:\s*8px/); // from 12px
    expect(cssContent).toMatch(/--spacing-widget-min-height:\s*240px/); // from 280px
    expect(cssContent).toMatch(/--spacing-top-offset:\s*60px/); // from 80px

    // New desktop data density tokens
    expect(cssContent).toMatch(/--row-height-compact:\s*32px/);
    expect(cssContent).toMatch(/--row-height-comfortable:\s*40px/);
    expect(cssContent).toMatch(/--row-padding-desktop:\s*6px\s*12px/);
    expect(cssContent).toMatch(/--hover-zone-padding:\s*4px/);
    expect(cssContent).toMatch(/--action-button-size:\s*28px/);
    expect(cssContent).toMatch(/--context-menu-width:\s*200px/);
  });
});
