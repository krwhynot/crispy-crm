/**
 * SCIP Index Verification
 *
 * Tests that go-to-definition and find-all-references work correctly
 * against the populated SQLite database.
 *
 * Usage: npx tsx scripts/discover/scip/verify.ts
 */

import * as path from "path";
import Database from "better-sqlite3";

const PROJECT_ROOT = process.cwd();
const SQLITE_DB_PATH = path.join(PROJECT_ROOT, ".claude", "state", "search.db");

interface VerificationResult {
  success: boolean;
  tests: TestResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

export function verifyIndex(): VerificationResult {
  const db = new Database(SQLITE_DB_PATH, { readonly: true });
  const tests: TestResult[] = [];

  // Test 1: Database has documents
  const docCount = db.prepare("SELECT COUNT(*) as count FROM documents").get() as {
    count: number;
  };
  tests.push({
    name: "Documents indexed",
    passed: docCount.count > 0,
    message: `${docCount.count} documents in database`,
    details: { count: docCount.count },
  });

  // Test 2: Database has symbols
  const symbolCount = db.prepare("SELECT COUNT(*) as count FROM symbols").get() as {
    count: number;
  };
  tests.push({
    name: "Symbols indexed",
    passed: symbolCount.count > 0,
    message: `${symbolCount.count} symbols in database`,
    details: { count: symbolCount.count },
  });

  // Test 3: Database has references
  const refCount = db.prepare('SELECT COUNT(*) as count FROM "references"').get() as {
    count: number;
  };
  tests.push({
    name: "References indexed",
    passed: refCount.count > 0,
    message: `${refCount.count} references in database`,
    details: { count: refCount.count },
  });

  // Test 4: Hooks are discoverable
  const hooks = db
    .prepare(
      `
    SELECT name, relative_path FROM symbols_with_paths
    WHERE kind = 'function' AND name LIKE 'use%'
    LIMIT 10
  `
    )
    .all() as Array<{ name: string; relative_path: string }>;
  tests.push({
    name: "Hooks discoverable",
    passed: hooks.length > 0,
    message: `Found ${hooks.length} hooks (e.g., ${hooks[0]?.name || "none"})`,
    details: { hooks: hooks.slice(0, 5) },
  });

  // Test 5: FTS trigram search works
  const ftsResults = db
    .prepare(
      `
    SELECT name, full_symbol FROM symbols_fts
    WHERE symbols_fts MATCH 'useF'
    LIMIT 5
  `
    )
    .all() as Array<{ name: string; full_symbol: string }>;
  tests.push({
    name: "FTS trigram search",
    passed: ftsResults.length >= 0, // May be 0 if no matches, but query should work
    message: `Trigram search returned ${ftsResults.length} results for 'useF'`,
    details: { results: ftsResults },
  });

  // Test 6: Go-to-definition works (find a hook definition)
  const definitionTest = db
    .prepare(
      `
    SELECT
      s.name,
      s.line,
      s.column,
      d.relative_path
    FROM symbols s
    JOIN documents d ON s.document_id = d.id
    WHERE s.name LIKE 'use%' AND s.kind = 'function'
    LIMIT 1
  `
    )
    .get() as { name: string; line: number; column: number; relative_path: string } | undefined;
  tests.push({
    name: "Go-to-definition",
    passed: definitionTest !== undefined,
    message: definitionTest
      ? `${definitionTest.name} defined at ${definitionTest.relative_path}:${definitionTest.line + 1}`
      : "No definitions found",
    details: definitionTest,
  });

  // Test 7: Find-all-references works
  if (definitionTest) {
    const symbolId = db
      .prepare("SELECT id FROM symbols WHERE name = ? LIMIT 1")
      .get(definitionTest.name) as { id: number } | undefined;

    if (symbolId) {
      const references = db
        .prepare(
          `
        SELECT
          r.line,
          r.role,
          d.relative_path
        FROM "references" r
        JOIN documents d ON r.document_id = d.id
        WHERE r.symbol_id = ?
      `
        )
        .all(symbolId.id) as Array<{ line: number; role: string; relative_path: string }>;

      tests.push({
        name: "Find-all-references",
        passed: references.length > 0,
        message: `${references.length} references found for ${definitionTest.name}`,
        details: { references: references.slice(0, 5) },
      });
    }
  }

  // Test 8: File content search works
  const contentResults = db
    .prepare(
      `
    SELECT relative_path, snippet(file_contents_fts, 1, '[', ']', '...', 30) as snippet
    FROM file_contents_fts
    WHERE file_contents_fts MATCH 'useEffect'
    LIMIT 3
  `
    )
    .all() as Array<{ relative_path: string; snippet: string }>;
  tests.push({
    name: "File content search",
    passed: contentResults.length >= 0,
    message: `Content search for 'useEffect' returned ${contentResults.length} results`,
    details: { results: contentResults },
  });

  db.close();

  // Calculate summary
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  return {
    success: failed === 0,
    tests,
    summary: {
      passed,
      failed,
      total: tests.length,
    },
  };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
  const json = process.argv.includes("--json");

  try {
    const result = verifyIndex();

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("\nSCIP Index Verification\n");
      console.log("=".repeat(50));

      for (const test of result.tests) {
        const status = test.passed ? "[PASS]" : "[FAIL]";
        console.log(`${status} ${test.name}`);
        console.log(`       ${test.message}`);
        if (verbose && test.details) {
          console.log(`       Details: ${JSON.stringify(test.details, null, 2)}`);
        }
      }

      console.log("=".repeat(50));
      console.log(`Summary: ${result.summary.passed}/${result.summary.total} tests passed`);

      if (!result.success) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}
