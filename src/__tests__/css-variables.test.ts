import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * CSS Variables Snapshot Test
 *
 * Prevents accidental duplicate CSS variable definitions and ensures
 * the design system tokens remain consistent across theme blocks.
 *
 * Related to: P1 High-Churn Stabilization - Week 2
 * Issue: 50+ changes to index.css with duplicate definitions
 */

function extractCSSVariables(content: string, blockPattern: RegExp): string[] {
  const match = content.match(blockPattern);
  if (!match) return [];

  const variables: string[] = [];
  const varRegex = /--[\w-]+/g;
  let varMatch;

  while ((varMatch = varRegex.exec(match[0])) !== null) {
    variables.push(varMatch[0]);
  }

  return variables;
}

describe("CSS Variables", () => {
  const cssPath = resolve(__dirname, "../index.css");
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("@theme block consistency", () => {
    it("should not have duplicate variable definitions in @theme blocks", () => {
      // Extract all @theme inline blocks
      const themeBlocks = cssContent.match(/@theme\s+inline\s*\{[^}]+\}/g) || [];

      // If multiple @theme blocks exist, check for duplicates across them
      if (themeBlocks.length > 1) {
        const allVars: Map<string, number[]> = new Map();

        themeBlocks.forEach((block, blockIndex) => {
          const vars = extractCSSVariables(block, /\{([^}]+)\}/);
          vars.forEach((varName) => {
            const existing = allVars.get(varName) || [];
            existing.push(blockIndex);
            allVars.set(varName, existing);
          });
        });

        // Find variables defined in multiple @theme blocks
        const duplicates: string[] = [];
        allVars.forEach((blocks, varName) => {
          if (blocks.length > 1) {
            duplicates.push(varName);
          }
        });

        // These are known intentional duplicates (different values for different contexts)
        // Shadow variables: @theme has direct OKLCH values, second block references --elevation-*
        // Spacing variables: @theme aliases reference :root definitions
        const intentionalDuplicates = [
          // Shadow tokens (different implementations in each block)
          "--shadow-card-1",
          "--shadow-card-2",
          "--shadow-card-3",
          "--shadow-card-1-hover",
          "--shadow-card-2-hover",
          "--shadow-card-3-hover",
          "--shadow-col-inner",
          // Spacing aliases in second @theme block (Tailwind integration)
          "--radius",
          "--spacing-edge-desktop",
          "--spacing-edge-ipad",
          "--spacing-edge-mobile",
          "--spacing-section",
          "--spacing-widget",
          "--spacing-content",
          "--spacing-compact",
          "--spacing-widget-padding",
        ];

        const unexpectedDuplicates = duplicates.filter((d) => !intentionalDuplicates.includes(d));

        expect(unexpectedDuplicates).toEqual([]);
      }
    });
  });

  describe("required design system tokens", () => {
    it("should have core spacing tokens defined", () => {
      const requiredSpacingTokens = [
        "--spacing-edge-desktop",
        "--spacing-widget-padding",
        "--spacing-gutter-desktop",
        "--spacing-section",
        "--spacing-widget",
        "--spacing-content",
        "--spacing-compact",
      ];

      requiredSpacingTokens.forEach((token) => {
        expect(cssContent).toContain(token);
      });
    });

    it("should have desktop data density tokens defined once", () => {
      const densityTokens = [
        "--row-height-compact",
        "--row-height-comfortable",
        "--row-padding-desktop",
        "--hover-zone-padding",
        "--action-button-size",
        "--context-menu-width",
      ];

      densityTokens.forEach((token) => {
        // Count occurrences - should be exactly 1 (in first @theme block only)
        const regex = new RegExp(`${token}:`, "g");
        const matches = cssContent.match(regex);
        expect(matches?.length).toBe(1);
      });
    });

    it("should have semantic color tokens defined", () => {
      const colorTokens = [
        "--color-background",
        "--color-foreground",
        "--color-primary",
        "--color-destructive",
        "--color-muted",
        "--color-accent",
        "--color-warning",
      ];

      colorTokens.forEach((token) => {
        expect(cssContent).toContain(token);
      });
    });
  });

  describe("dark mode completeness", () => {
    it("should have .dark block with theme overrides", () => {
      expect(cssContent).toMatch(/\.dark\s*\{/);
    });

    it("should define neutral palette in both :root and .dark", () => {
      // Both light and dark modes should define neutral scale
      const rootMatch = cssContent.match(/:root\s*\{[^}]+--neutral-50[^}]+\}/s);
      const darkMatch = cssContent.match(/\.dark\s*\{[^}]+--neutral-50[^}]+\}/s);

      expect(rootMatch).toBeTruthy();
      expect(darkMatch).toBeTruthy();
    });
  });

  describe("shadow token structure", () => {
    it("should have elevation tokens defined", () => {
      const elevationTokens = ["--elevation-1", "--elevation-2", "--elevation-3"];

      elevationTokens.forEach((token) => {
        expect(cssContent).toContain(token);
      });
    });

    it("should have shadow card tokens referencing elevations in :root", () => {
      // In :root, shadow-card should reference elevation tokens
      const rootBlock = cssContent.match(/:root\s*\{[\s\S]+?\n\}/);
      if (rootBlock) {
        expect(rootBlock[0]).toMatch(/--shadow-card-1:\s*var\(--elevation/);
      }
    });
  });
});
