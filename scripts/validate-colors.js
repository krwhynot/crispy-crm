#!/usr/bin/env node

/**
 * Color Contrast Validation Script
 * Validates WCAG contrast ratios for all tag colors and semantic colors
 * in both light and dark modes.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OKLCH to sRGB conversion functions
function oklchToLinearSrgb(l, c, h) {
  // Convert to OKLab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab to linear sRGB matrix
  const m1 = [
    [1.0, 0.3963377774, 0.2158037573],
    [1.0, -0.1055613458, -0.0638541728],
    [1.0, -0.0894841775, -1.291485548],
  ];

  const m2 = [
    [4.0767416621, -3.3077115913, 0.2309699292],
    [-1.2684380046, 2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, 1.707614701],
  ];

  // Convert OKLab to LMS
  const lms = [
    m1[0][0] * l + m1[0][1] * a + m1[0][2] * b,
    m1[1][0] * l + m1[1][1] * a + m1[1][2] * b,
    m1[2][0] * l + m1[2][1] * a + m1[2][2] * b,
  ];

  // Cube the LMS values
  const lmsCubed = lms.map((x) => x ** 3);

  // Convert to linear sRGB
  const linearRgb = [
    m2[0][0] * lmsCubed[0] + m2[0][1] * lmsCubed[1] + m2[0][2] * lmsCubed[2],
    m2[1][0] * lmsCubed[0] + m2[1][1] * lmsCubed[1] + m2[1][2] * lmsCubed[2],
    m2[2][0] * lmsCubed[0] + m2[2][1] * lmsCubed[1] + m2[2][2] * lmsCubed[2],
  ];

  return linearRgb;
}

function linearToSrgb(linear) {
  return linear <= 0.0031308
    ? 12.92 * linear
    : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

function oklchToRgb(l, c, h) {
  const linearRgb = oklchToLinearSrgb(l, c, h);
  const srgb = linearRgb.map(linearToSrgb);

  // Clamp to [0, 1] and convert to 8-bit
  return srgb.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255));
}

// Calculate relative luminance for WCAG contrast
function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG contrast ratio
function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse OKLCH color string
function parseOklch(colorStr) {
  // Handle both formats: oklch(92.1% 0.041 69.5) and oklch(0.145 0 0)
  const match = colorStr.match(/oklch\(([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return null;

  const hasPercent = match[2] === "%";
  const lightness = parseFloat(match[1]);

  return {
    l: hasPercent ? lightness / 100 : lightness, // Convert percentage to 0-1 if needed
    c: parseFloat(match[3]),
    h: parseFloat(match[4]),
  };
}

// Read CSS file and extract color definitions
function extractColorsFromCss() {
  const cssPath = path.join(__dirname, "..", "src", "index.css");
  const cssContent = fs.readFileSync(cssPath, "utf8");

  const colors = {
    light: {},
    dark: {},
  };

  let currentMode = "light";
  let inRootBlock = false;
  let inDarkBlock = false;
  const lines = cssContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect :root block
    if (line.includes(":root")) {
      inRootBlock = true;
      currentMode = "light";
      continue;
    }

    // Detect .dark block
    if (line.includes(".dark")) {
      inDarkBlock = true;
      currentMode = "dark";
      continue;
    }

    // End of block
    if (line === "}") {
      if (inDarkBlock) {
        inDarkBlock = false;
        currentMode = "light";
      } else if (inRootBlock) {
        inRootBlock = false;
      }
      continue;
    }

    // Extract color variables only within blocks
    if (inRootBlock || inDarkBlock) {
      const varMatch = line.match(/--([a-z-]+):\s*(oklch\([^)]+\))/);
      if (varMatch) {
        const [, varName, colorValue] = varMatch;
        colors[currentMode][varName] = colorValue;
      }
    }
  }

  return colors;
}

// Validate contrast ratios
async function validateContrast() {
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  console.log("🔍 Extracting colors from CSS...\n");
  const colors = extractColorsFromCss();

  // Define test cases
  const tagColorPairs = [
    "warm",
    "green",
    "teal",
    "blue",
    "purple",
    "yellow",
    "gray",
    "pink",
  ];

  const semanticTests = [
    {
      bg: "primary",
      fg: "primary-foreground",
      minRatio: 4.5,
      description: "Primary button",
    },
    {
      bg: "secondary",
      fg: "secondary-foreground",
      minRatio: 4.5,
      description: "Secondary button",
    },
    {
      bg: "destructive",
      fg: "destructive-foreground",
      minRatio: 4.5,
      description: "Destructive button",
    },
    {
      bg: "accent",
      fg: "accent-foreground",
      minRatio: 4.5,
      description: "Accent elements",
    },
    {
      bg: "muted",
      fg: "muted-foreground",
      minRatio: 4.5,
      description: "Muted elements",
    },
    {
      bg: "card",
      fg: "card-foreground",
      minRatio: 4.5,
      description: "Card content",
    },
    {
      bg: "popover",
      fg: "popover-foreground",
      minRatio: 4.5,
      description: "Popover content",
    },
  ];

  const focusTests = [
    {
      bg: "background",
      fg: "ring",
      minRatio: 3.0,
      description: "Focus ring on background",
    },
    {
      bg: "card",
      fg: "ring",
      minRatio: 3.0,
      description: "Focus ring on cards",
    },
  ];

  // Test tag colors in both modes
  for (const mode of ["light", "dark"]) {
    console.log(`\n📋 Testing ${mode.toUpperCase()} mode tag colors:`);
    console.log("─".repeat(50));

    for (const colorName of tagColorPairs) {
      const bgVar = `tag-${colorName}-bg`;
      const fgVar = `tag-${colorName}-fg`;

      const bgColor = colors[mode][bgVar];
      const fgColor = colors[mode][fgVar];

      if (!bgColor || !fgColor) {
        results.warnings.push({
          mode,
          test: `Tag ${colorName}`,
          message: `Missing color definition for ${bgVar} or ${fgVar}`,
        });
        results.summary.warnings++;
        continue;
      }

      const bgOklch = parseOklch(bgColor);
      const fgOklch = parseOklch(fgColor);

      if (!bgOklch || !fgOklch) {
        results.warnings.push({
          mode,
          test: `Tag ${colorName}`,
          message: `Failed to parse OKLCH values`,
        });
        results.summary.warnings++;
        continue;
      }

      const bgRgb = oklchToRgb(bgOklch.l, bgOklch.c, bgOklch.h);
      const fgRgb = oklchToRgb(fgOklch.l, fgOklch.c, fgOklch.h);

      const ratio = contrastRatio(bgRgb, fgRgb);
      const minRatio = 4.5; // WCAG AA for normal text
      const passes = ratio >= minRatio;

      results.summary.totalTests++;

      if (passes) {
        results.passed.push({
          mode,
          test: `Tag ${colorName}`,
          ratio: ratio.toFixed(2),
          minRatio,
          bg: bgVar,
          fg: fgVar,
        });
        results.summary.passed++;
        console.log(
          `✅ Tag ${colorName}: ${ratio.toFixed(2)}:1 (min ${minRatio}:1)`,
        );
      } else {
        results.failed.push({
          mode,
          test: `Tag ${colorName}`,
          ratio: ratio.toFixed(2),
          minRatio,
          bg: bgVar,
          fg: fgVar,
          message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${minRatio}:1`,
        });
        results.summary.failed++;
        console.log(
          `❌ Tag ${colorName}: ${ratio.toFixed(2)}:1 (min ${minRatio}:1) - FAILED`,
        );
      }
    }

    // Test semantic colors
    console.log(`\n📋 Testing ${mode.toUpperCase()} mode semantic colors:`);
    console.log("─".repeat(50));

    for (const test of semanticTests) {
      const bgColor = colors[mode][test.bg];
      const fgColor = colors[mode][test.fg];

      if (!bgColor || !fgColor) {
        // Skip if colors don't exist in this mode
        continue;
      }

      const bgOklch = parseOklch(bgColor);
      const fgOklch = parseOklch(fgColor);

      if (!bgOklch || !fgOklch) {
        continue;
      }

      const bgRgb = oklchToRgb(bgOklch.l, bgOklch.c, bgOklch.h);
      const fgRgb = oklchToRgb(fgOklch.l, fgOklch.c, fgOklch.h);

      const ratio = contrastRatio(bgRgb, fgRgb);
      const passes = ratio >= test.minRatio;

      results.summary.totalTests++;

      if (passes) {
        results.passed.push({
          mode,
          test: test.description,
          ratio: ratio.toFixed(2),
          minRatio: test.minRatio,
          bg: test.bg,
          fg: test.fg,
        });
        results.summary.passed++;
        console.log(
          `✅ ${test.description}: ${ratio.toFixed(2)}:1 (min ${test.minRatio}:1)`,
        );
      } else {
        results.failed.push({
          mode,
          test: test.description,
          ratio: ratio.toFixed(2),
          minRatio: test.minRatio,
          bg: test.bg,
          fg: test.fg,
          message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${test.minRatio}:1`,
        });
        results.summary.failed++;
        console.log(
          `❌ ${test.description}: ${ratio.toFixed(2)}:1 (min ${test.minRatio}:1) - FAILED`,
        );
      }
    }

    // Test focus states
    console.log(`\n📋 Testing ${mode.toUpperCase()} mode focus states:`);
    console.log("─".repeat(50));

    for (const test of focusTests) {
      const bgColor = colors[mode][test.bg];
      const fgColor = colors[mode][test.fg];

      if (!bgColor || !fgColor) {
        continue;
      }

      const bgOklch = parseOklch(bgColor);
      const fgOklch = parseOklch(fgColor);

      if (!bgOklch || !fgOklch) {
        continue;
      }

      const bgRgb = oklchToRgb(bgOklch.l, bgOklch.c, bgOklch.h);
      const fgRgb = oklchToRgb(fgOklch.l, fgOklch.c, fgOklch.h);

      const ratio = contrastRatio(bgRgb, fgRgb);
      const passes = ratio >= test.minRatio;

      results.summary.totalTests++;

      if (passes) {
        results.passed.push({
          mode,
          test: test.description,
          ratio: ratio.toFixed(2),
          minRatio: test.minRatio,
          bg: test.bg,
          fg: test.fg,
        });
        results.summary.passed++;
        console.log(
          `✅ ${test.description}: ${ratio.toFixed(2)}:1 (min ${test.minRatio}:1)`,
        );
      } else {
        results.failed.push({
          mode,
          test: test.description,
          ratio: ratio.toFixed(2),
          minRatio: test.minRatio,
          bg: test.bg,
          fg: test.fg,
          message: `Contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum of ${test.minRatio}:1`,
        });
        results.summary.failed++;
        console.log(
          `❌ ${test.description}: ${ratio.toFixed(2)}:1 (min ${test.minRatio}:1) - FAILED`,
        );
      }
    }
  }

  return results;
}

// Generate accessibility report
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(__dirname, "..", "color-contrast-report.json");

  const report = {
    timestamp,
    summary: results.summary,
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n" + "═".repeat(60));
  console.log("📊 ACCESSIBILITY REPORT SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log("\n📄 Full report saved to: color-contrast-report.json");

  if (results.summary.failed > 0) {
    console.log("\n❌ WCAG VIOLATIONS FOUND:");
    console.log("─".repeat(60));
    results.failed.forEach((failure) => {
      console.log(`  • [${failure.mode}] ${failure.test}`);
      console.log(`    ${failure.message}`);
      console.log(`    Variables: ${failure.bg} / ${failure.fg}`);
    });
  }

  return report;
}

// Main execution
async function main() {
  console.log("🎨 Color Contrast Validation Script");
  console.log("═".repeat(60));
  console.log(
    "Validating WCAG contrast ratios for all color combinations...\n",
  );

  try {
    const results = await validateContrast();
    const report = generateReport(results);

    // CI/CD integration
    if (process.env.CI) {
      if (results.summary.failed > 0) {
        console.error("\n❌ CI Build Failed: WCAG violations detected");
        process.exit(1);
      }
      console.log(
        "\n✅ CI Build Passed: All contrast ratios meet WCAG AA standards",
      );
    }

    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Error during validation:", error);
    process.exit(1);
  }
}

// Run the script
main();
