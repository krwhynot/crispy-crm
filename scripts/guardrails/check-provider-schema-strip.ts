/**
 * Provider Schema Strip Guardrail
 *
 * Scans src/atomic-crm/validation/ for .strip() usage on Zod schemas
 * that flow to provider-bound paths (update/create schemas).
 *
 * .strip() silently removes unknown keys, which can cause data loss when
 * form data includes fields the schema doesn't know about (e.g., distributor_ids).
 *
 * Usage:
 *   npx tsx scripts/guardrails/check-provider-schema-strip.ts
 *
 * Exit codes:
 *   0 = no strip usage found
 *   1 = violations found
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const VALIDATION_DIR = join(import.meta.dirname, "..", "..", "src", "atomic-crm", "validation");
const PROJECT_ROOT = join(import.meta.dirname, "..", "..");

// Pattern: .strip() on a schema definition or assignment
const STRIP_PATTERN = /\.strip\(\)/g;

interface Violation {
  file: string;
  line: number;
  text: string;
}

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        results.push(...collectTsFiles(fullPath));
      } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist
  }
  return results;
}

function findStripUsage(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relPath = relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (STRIP_PATTERN.test(line)) {
      violations.push({
        file: relPath,
        line: i + 1,
        text: line.trim(),
      });
    }
    // Reset regex lastIndex
    STRIP_PATTERN.lastIndex = 0;
  }

  return violations;
}

// Main
const files = collectTsFiles(VALIDATION_DIR);
const violations: Violation[] = [];

for (const file of files) {
  violations.push(...findStripUsage(file));
}

// Report
console.log("=== Provider Schema Strip Check ===\n");
console.log(`Scanned: ${files.length} validation files`);
console.log(`Strip usage violations: ${violations.length}`);
console.log();

if (violations.length > 0) {
  console.log("VIOLATIONS (.strip() in provider-bound schemas causes silent data loss):");
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ${v.text}`);
  }
  console.log();
  console.log("FIX: Replace .strip() with explicit strict schemas or passthrough + sanitize.");
  console.log("See DOMAIN_INTEGRITY.md 'Strict vs Passthrough' section.");
  console.log();
  console.log("RESULT: FAIL");
  process.exit(1);
} else {
  console.log("RESULT: PASS");
  process.exit(0);
}
