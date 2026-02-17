/**
 * Handler Chain (Golden Chain) Guardrail
 *
 * Verifies that all handler factory functions in src/atomic-crm/providers/supabase/handlers/
 * follow the Golden Chain wrapper composition:
 *   withErrorLogging(withLifecycleCallbacks(withSkipDelete(withValidation(base)), [callbacks]))
 *
 * Specifically checks:
 * 1. withSkipDelete is present for soft-delete resources
 * 2. withErrorLogging is the outermost wrapper
 * 3. withValidation is the innermost wrapper
 *
 * Usage:
 *   npx tsx scripts/guardrails/check-handler-chain.ts
 *
 * Exit codes:
 *   0 = all handlers compliant
 *   1 = violations found
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const HANDLERS_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "src",
  "atomic-crm",
  "providers",
  "supabase",
  "handlers"
);
const PROJECT_ROOT = join(import.meta.dirname, "..", "..");

/**
 * Handlers that intentionally deviate from the Golden Chain.
 * Each entry documents the reason for exemption.
 */
const EXEMPT_HANDLERS: Record<string, string> = {
  // Tasks delegate to activitiesHandler (STI pattern) - inherits its wrapper chain
  createTasksHandler: "STI wrapper: delegates to activitiesHandler which has full Golden Chain",
  // Segments are fixed constants - only need error logging
  createSegmentsHandler: "Fixed constants: no user writes, no validation, no lifecycle hooks",
  // Timeline is read-only - no mutations to protect
  createTimelineHandler: "Read-only handler: no mutations, raw Supabase for timeline aggregation",
  // Product distributors use hard delete (composite key, not in SOFT_DELETE_RESOURCES)
  createProductDistributorsHandler:
    "Hard delete resource: composite key, not in SOFT_DELETE_RESOURCES",
};

interface HandlerInfo {
  file: string;
  factoryName: string;
  hasWithSkipDelete: boolean;
  hasWithValidation: boolean;
  hasWithErrorLogging: boolean;
  hasWithLifecycleCallbacks: boolean;
  issues: string[];
}

function analyzeHandler(filePath: string): HandlerInfo[] {
  const content = readFileSync(filePath, "utf-8");
  const relPath = relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
  const results: HandlerInfo[] = [];

  // Find all factory function exports
  const factoryPattern = /export\s+function\s+(create\w+Handler)\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = factoryPattern.exec(content)) !== null) {
    const factoryName = match[1];
    // Extract the function body (rough heuristic: from match to next export or end)
    const startIdx = match.index;
    const nextExport = content.indexOf("export function", startIdx + 1);
    const bodyEnd = nextExport === -1 ? content.length : nextExport;
    const body = content.slice(startIdx, bodyEnd);

    const hasWithSkipDelete = /withSkipDelete\s*\(/.test(body);
    const hasWithValidation = /withValidation\s*\(/.test(body);
    const hasWithErrorLogging = /withErrorLogging\s*\(/.test(body);
    const hasWithLifecycleCallbacks = /withLifecycleCallbacks\s*\(/.test(body);

    const issues: string[] = [];

    if (!hasWithErrorLogging) {
      issues.push("Missing withErrorLogging (must be outermost wrapper)");
    }
    if (!hasWithValidation) {
      issues.push("Missing withValidation (must be innermost wrapper)");
    }
    if (!hasWithSkipDelete) {
      issues.push("Missing withSkipDelete (required for soft-delete resources)");
    }
    if (!hasWithLifecycleCallbacks) {
      // Not all handlers need lifecycle callbacks, but most do
      issues.push("Missing withLifecycleCallbacks (required for callbacks)");
    }

    results.push({
      file: relPath,
      factoryName,
      hasWithSkipDelete,
      hasWithValidation,
      hasWithErrorLogging,
      hasWithLifecycleCallbacks,
      issues,
    });
  }

  return results;
}

// Main
const handlerFiles: string[] = [];
try {
  for (const entry of readdirSync(HANDLERS_DIR, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      entry.name.endsWith("Handler.ts") &&
      !entry.name.endsWith(".test.ts") &&
      entry.name !== "index.ts"
    ) {
      handlerFiles.push(join(HANDLERS_DIR, entry.name));
    }
  }
} catch {
  console.error("Could not read handlers directory:", HANDLERS_DIR);
  process.exit(1);
}

const allHandlers: HandlerInfo[] = [];
for (const file of handlerFiles) {
  allHandlers.push(...analyzeHandler(file));
}

const exempt = allHandlers.filter((h) => h.factoryName in EXEMPT_HANDLERS);
const nonExempt = allHandlers.filter((h) => !(h.factoryName in EXEMPT_HANDLERS));
const violations = nonExempt.filter((h) => h.issues.length > 0);
const compliant = nonExempt.filter((h) => h.issues.length === 0);

// Report
console.log("=== Handler Chain (Golden Chain) Check ===\n");
console.log(`Scanned: ${handlerFiles.length} handler files`);
console.log(`Factory functions found: ${allHandlers.length}`);
console.log(`Compliant: ${compliant.length}`);
console.log(`Exempt: ${exempt.length}`);
console.log(`Violations: ${violations.length}`);
console.log();

if (compliant.length > 0) {
  console.log("COMPLIANT:");
  for (const h of compliant) {
    console.log(`  ✓ ${h.file} → ${h.factoryName}`);
  }
  console.log();
}

if (exempt.length > 0) {
  console.log("EXEMPT (documented deviations):");
  for (const h of exempt) {
    console.log(`  ⊘ ${h.file} → ${h.factoryName}`);
    console.log(`      Reason: ${EXEMPT_HANDLERS[h.factoryName]}`);
  }
  console.log();
}

if (violations.length > 0) {
  console.log("VIOLATIONS:");
  for (const h of violations) {
    console.log(`  ✗ ${h.file} → ${h.factoryName}`);
    for (const issue of h.issues) {
      console.log(`      - ${issue}`);
    }
  }
  console.log();
  console.log("FIX: Apply Golden Chain composition:");
  console.log(
    "  withErrorLogging(withLifecycleCallbacks(withSkipDelete(withValidation(base)), [callbacks]))"
  );
  console.log("See PROVIDER_RULES.md 'Wrapper Composition Order' section.");
  console.log();
  console.log("RESULT: FAIL");
  process.exit(1);
} else {
  console.log("RESULT: PASS");
  process.exit(0);
}
