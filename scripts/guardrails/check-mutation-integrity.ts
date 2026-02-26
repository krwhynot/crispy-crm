/**
 * Mutation Integrity Guardrail
 *
 * Scans src/ for awaited mutation calls (update, create, deleteOne, deleteMany)
 * and verifies each has { returnPromise: true }.
 *
 * Exceptions: fire-and-forget calls that are NOT awaited and use onError callbacks
 * must be listed in mutation-allowlist.json with FIRE_AND_FORGET_APPROVED annotation.
 *
 * Usage:
 *   npx tsx scripts/guardrails/check-mutation-integrity.ts [--fix-dry-run]
 *
 * Exit codes:
 *   0 = all clear
 *   1 = violations found
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_DIR = join(import.meta.dirname, "..", "..", "src");
const ALLOWLIST_PATH = join(import.meta.dirname, "mutation-allowlist.json");

// Mutation hook calls that must use returnPromise when awaited
const MUTATION_PATTERN = /await\s+(update|create|deleteOne|deleteMany)\s*\(/g;

// Check if the call already has returnPromise: true within the same statement
const RETURN_PROMISE_PATTERN = /returnPromise\s*:\s*true/;

interface Violation {
  file: string;
  line: number;
  column: number;
  mutation: string;
  text: string;
}

interface AllowlistEntry {
  file: string;
  line: number;
  reason: string;
  ticket_id: string;
  owner: string;
  created_at: string;
  expires_at: string;
}

interface Allowlist {
  exceptions: AllowlistEntry[];
}

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, test dirs, and generated
      if (entry.name === "node_modules" || entry.name === "__tests__" || entry.name === ".next") {
        continue;
      }
      results.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      // Skip test files
      if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function findViolations(filePath: string, projectRoot: string): Violation[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relPath = relative(projectRoot, filePath).replace(/\\/g, "/");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match: RegExpExecArray | null;
    MUTATION_PATTERN.lastIndex = 0;

    while ((match = MUTATION_PATTERN.exec(line)) !== null) {
      // Extract the full call expression by tracking balanced parentheses
      // from the opening `(` to its matching `)`, spanning multiple lines
      const callStartCol = match.index + match[0].length - 1; // position of `(`
      const fullCallSpan = extractBalancedCall(lines, i, callStartCol);
      if (!RETURN_PROMISE_PATTERN.test(fullCallSpan)) {
        violations.push({
          file: relPath,
          line: i + 1,
          column: match.index + 1,
          mutation: match[1],
          text: line.trim(),
        });
      }
    }
  }

  return violations;
}

/**
 * Extract text from lines[startLine][startCol] through the matching
 * closing parenthesis, tracking nested parens/braces/brackets.
 * Falls back to a 30-line lookahead if nesting never resolves.
 */
function extractBalancedCall(lines: string[], startLine: number, startCol: number): string {
  let depth = 0;
  const maxLines = Math.min(startLine + 30, lines.length);
  const chunks: string[] = [];

  for (let i = startLine; i < maxLines; i++) {
    const lineText = i === startLine ? lines[i].slice(startCol) : lines[i];
    chunks.push(lineText);
    for (const ch of lineText) {
      if (ch === "(" || ch === "{" || ch === "[") depth++;
      else if (ch === ")" || ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) return chunks.join("\n");
      }
    }
  }
  // Fallback: return everything collected
  return chunks.join("\n");
}

function loadAllowlist(): Allowlist {
  try {
    const raw = readFileSync(ALLOWLIST_PATH, "utf-8");
    return JSON.parse(raw) as Allowlist;
  } catch {
    return { exceptions: [] };
  }
}

function checkExpiredEntries(allowlist: Allowlist): AllowlistEntry[] {
  const now = new Date();
  return allowlist.exceptions.filter((entry) => {
    const expires = new Date(entry.expires_at);
    return expires < now;
  });
}

function isAllowlisted(violation: Violation, allowlist: Allowlist): boolean {
  return allowlist.exceptions.some(
    (entry) => entry.file === violation.file && entry.line === violation.line
  );
}

// Main
const projectRoot = join(import.meta.dirname, "..", "..");
const files = collectTsFiles(SRC_DIR);
const allowlist = loadAllowlist();
const allViolations: Violation[] = [];

for (const file of files) {
  allViolations.push(...findViolations(file, projectRoot));
}

// Filter out allowlisted entries
const activeViolations = allViolations.filter((v) => !isAllowlisted(v, allowlist));

// Check for expired allowlist entries
const expiredEntries = checkExpiredEntries(allowlist);

// Report
console.log("=== Mutation Integrity Check ===\n");
console.log(`Scanned: ${files.length} files`);
console.log(`Total awaited mutations found: ${allViolations.length + allowlist.exceptions.length}`);
console.log(`Violations (missing returnPromise): ${activeViolations.length}`);
console.log(`Allowlisted exceptions: ${allowlist.exceptions.length}`);
console.log(`Expired exceptions: ${expiredEntries.length}`);
console.log();

if (activeViolations.length > 0) {
  console.log("VIOLATIONS:");
  for (const v of activeViolations) {
    console.log(`  ${v.file}:${v.line} — await ${v.mutation}() missing { returnPromise: true }`);
    console.log(`    ${v.text}`);
  }
  console.log();
}

if (expiredEntries.length > 0) {
  console.log("EXPIRED ALLOWLIST ENTRIES (must be renewed or resolved):");
  for (const e of expiredEntries) {
    console.log(
      `  ${e.file}:${e.line} — expired ${e.expires_at} (owner: ${e.owner}, ticket: ${e.ticket_id})`
    );
  }
  console.log();
}

const hasFailures = activeViolations.length > 0 || expiredEntries.length > 0;

if (hasFailures) {
  console.log("RESULT: FAIL");
  process.exit(1);
} else {
  console.log("RESULT: PASS");
  process.exit(0);
}
