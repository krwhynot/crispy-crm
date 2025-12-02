#!/usr/bin/env node

/**
 * Semantic Color Validation Script
 *
 * Enforces the design system by detecting:
 * 1. Hardcoded hex colors (should use CSS variables)
 * 2. Inline CSS variable syntax (should use Tailwind semantic utilities)
 *
 * Per crispy-design-system skill:
 * - Use `text-muted-foreground` not `text-[color:var(--text-subtle)]`
 * - Use `bg-primary` not `bg-[var(--brand-500)]`
 * - Use `border-border` not `border-[color:var(--stroke-card)]`
 *
 * Exit codes:
 * - 0: All checks pass
 * - 1: Violations found
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Configuration
const CONFIG = {
  // Directories to scan
  includeDirs: ["src"],

  // Patterns to exclude from scanning
  excludePatterns: [
    /node_modules/,
    /\.stories\.(ts|tsx)$/, // Storybook stories
    /stories\//, // Storybook directory
    /\.test\.(ts|tsx)$/, // Test files
    /\.spec\.(ts|tsx)$/, // Spec files
    /__tests__\//, // Test directories
    /\.d\.ts$/, // Type declaration files
    /color-types\.ts$/, // Legacy color mapping (tracked separately)
  ],

  // File extensions to check
  extensions: [".ts", ".tsx", ".css"],

  // Files with allowed hex colors (legacy code tracked for migration)
  legacyFiles: [
    "src/lib/color-types.ts", // Color mapping constants
    "src/index.css", // CSS variable definitions (hex in comments OK)
    "src/emails/daily-digest.types.ts", // Email templates (email clients don't support CSS variables)
    "src/emails/daily-digest.generator.ts", // Email generator (email clients don't support CSS variables)
  ],
};

// Violation patterns
const PATTERNS = {
  // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
  hexColor: {
    regex: /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?(?![0-9a-fA-F])/g,
    message: "Hardcoded hex color found. Use CSS variable or semantic utility instead.",
    severity: "error",
  },

  // Inline color CSS variables: text-[color:var(--...)], bg-[var(--color)]
  inlineColorVar: {
    regex:
      /(?:text|bg|border|ring|outline|fill|stroke)-\[(?:color:)?var\(--(?:text|bg|brand|accent|primary|secondary|destructive|warning|success|muted|foreground|background|border|ring)[^)]*\)\]/g,
    message: "Inline CSS variable for color. Use semantic Tailwind utility instead.",
    severity: "error",
    alternatives: {
      "text-[color:var(--text-subtle)]": "text-muted-foreground",
      "text-[color:var(--text-primary)]": "text-foreground",
      "text-[color:var(--text-body)]": "text-foreground",
      "text-[var(--brand-500)]": "text-primary",
      "text-[var(--brand-700)]": "text-primary",
      "bg-[var(--brand-500)]": "bg-primary",
      "bg-[var(--warning-default)]": "bg-warning",
      "bg-[var(--destructive)]": "bg-destructive",
      "border-[color:var(--stroke-card)]": "border-border",
      "border-[var(--border)]": "border-border",
    },
  },
};

// Allowed patterns (false positives to ignore)
const ALLOWED_PATTERNS = [
  // CSS variable definitions in index.css
  /^--[\w-]+:\s*oklch/,
  /^--[\w-]+:\s*var/,
  // Comments documenting hex values (single-line)
  /\/\*.*#[0-9a-fA-F]{3,8}.*\*\//,
  /\/\/.*#[0-9a-fA-F]{3,8}/,
  // JSDoc lines (start with *)
  /^\s*\*.*#[0-9a-fA-F]{3,8}/,
  // Example patterns in comments/docs (e.g., "Sales #123")
  /#\d{1,3}(?!\d|[a-fA-F])/, // # followed by only digits (not hex)
  // SVG fills that are truly neutral (black/white)
  /fill=["']#(?:000|FFF|fff|000000|FFFFFF|ffffff)["']/,
  // Tailwind arbitrary values for non-color properties
  /(?:w|h|p|m|gap|top|left|right|bottom|inset)-\[var\(/,
  // Shadow and spacing design tokens (acceptable)
  /shadow-\[var\(--(?:elevation|shadow|btn-shadow|input-shadow|avatar-shadow|badge-shadow|input-glow)/,
  // Radix UI component dimensions
  /\[var\(--radix-/,
  // Spacing tokens (acceptable)
  /\[var\(--spacing/,
  // Tag system CSS variables (semantic by design)
  /\[var\(--tag-/,
];

/**
 * Check if a line should be ignored based on allowed patterns
 */
function isAllowedPattern(line) {
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Check if a file should be excluded from scanning
 */
function shouldExcludeFile(filePath) {
  const relativePath = relative(projectRoot, filePath);
  return CONFIG.excludePatterns.some((pattern) => pattern.test(relativePath));
}

/**
 * Check if a file is in the legacy list (violations logged but don't fail)
 */
function isLegacyFile(filePath) {
  const relativePath = relative(projectRoot, filePath);
  return CONFIG.legacyFiles.some((legacy) => relativePath.includes(legacy));
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, files = []) {
  if (!existsSync(dirPath)) return files;

  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith(".") && entry !== "node_modules") {
        getAllFiles(fullPath, files);
      }
    } else if (CONFIG.extensions.includes(extname(fullPath))) {
      if (!shouldExcludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Extract violations from a file
 */
function checkFile(filePath) {
  const violations = [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relativePath = relative(projectRoot, filePath);
  const isLegacy = isLegacyFile(filePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip if line matches allowed patterns
    if (isAllowedPattern(line)) return;

    // Check for hex colors
    const hexMatches = line.match(PATTERNS.hexColor.regex);
    if (hexMatches) {
      // Double-check it's not in a comment
      const beforeMatch = line.indexOf(hexMatches[0]);
      const lineBeforeMatch = line.substring(0, beforeMatch);

      // Skip if in a comment
      if (!lineBeforeMatch.includes("//") && !lineBeforeMatch.includes("/*")) {
        hexMatches.forEach((match) => {
          violations.push({
            file: relativePath,
            line: lineNum,
            column: line.indexOf(match) + 1,
            match,
            message: PATTERNS.hexColor.message,
            severity: isLegacy ? "warning" : PATTERNS.hexColor.severity,
            isLegacy,
          });
        });
      }
    }

    // Check for inline color CSS variables
    const inlineMatches = line.match(PATTERNS.inlineColorVar.regex);
    if (inlineMatches) {
      inlineMatches.forEach((match) => {
        const alternative = PATTERNS.inlineColorVar.alternatives[match];
        violations.push({
          file: relativePath,
          line: lineNum,
          column: line.indexOf(match) + 1,
          match,
          message: alternative
            ? `${PATTERNS.inlineColorVar.message} Use '${alternative}' instead.`
            : PATTERNS.inlineColorVar.message,
          severity: isLegacy ? "warning" : PATTERNS.inlineColorVar.severity,
          isLegacy,
        });
      });
    }
  });

  return violations;
}

/**
 * Main validation function
 */
function validate() {
  console.log("🎨 Semantic Color Validation");
  console.log("═".repeat(60));
  console.log("Checking for design system violations...\n");

  const allViolations = [];
  let filesChecked = 0;

  // Collect all files to check
  const files = [];
  for (const dir of CONFIG.includeDirs) {
    const dirPath = join(projectRoot, dir);
    getAllFiles(dirPath, files);
  }

  // Check each file
  for (const file of files) {
    const violations = checkFile(file);
    allViolations.push(...violations);
    filesChecked++;
  }

  // Separate errors from warnings (legacy)
  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  // Report results
  console.log(`📁 Files checked: ${filesChecked}`);
  console.log("─".repeat(60));

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):\n`);
    errors.forEach((v) => {
      console.log(`  ${v.file}:${v.line}:${v.column}`);
      console.log(`    Found: ${v.match}`);
      console.log(`    ${v.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS - Legacy Code (${warnings.length}):\n`);
    warnings.forEach((v) => {
      console.log(`  ${v.file}:${v.line}:${v.column}`);
      console.log(`    Found: ${v.match}`);
      console.log(`    ${v.message}\n`);
    });
  }

  // Summary
  console.log("═".repeat(60));
  console.log("📊 SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total violations: ${allViolations.length}`);
  console.log(`  ❌ Errors: ${errors.length} (block CI)`);
  console.log(`  ⚠️  Warnings: ${warnings.length} (legacy, tracked)`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ All checks passed! Design system compliance achieved.");
    return 0;
  }

  if (errors.length === 0) {
    console.log("\n✅ No blocking errors. Legacy warnings tracked for migration.");
    return 0;
  }

  console.log("\n❌ Design system violations found. Please fix errors before committing.");
  console.log("\nRefer to:");
  console.log("  - .claude/skills/crispy-design-system/SKILL.md");
  console.log("  - docs/architecture/design-system.md");

  return 1;
}

// Run validation
const exitCode = validate();
process.exit(exitCode);
