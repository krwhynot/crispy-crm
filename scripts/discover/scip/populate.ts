/**
 * SCIP to SQLite Populator
 *
 * Reads a SCIP index and populates the SQLite database with symbols,
 * references, and file contents for full-text search.
 *
 * Usage: npx tsx scripts/discover/scip/populate.ts
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import {
  parseScipIndex,
  extractSymbolName,
  inferSymbolKind,
  parseRange,
  SymbolRoles,
  type ScipIndex as _ScipIndex,
} from "./parser.js";

const PROJECT_ROOT = process.cwd();
const SCIP_INDEX_PATH = path.join(PROJECT_ROOT, ".claude", "state", "index.scip");
const SQLITE_DB_PATH = path.join(PROJECT_ROOT, ".claude", "state", "search.db");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "scripts", "discover", "scip", "schema.sql");

interface PopulateOptions {
  verbose?: boolean;
  incremental?: boolean;
}

interface PopulateResult {
  success: boolean;
  dbPath: string;
  stats: {
    documents: number;
    symbols: number;
    references: number;
    elapsedMs: number;
  };
}

export async function populateDatabase(
  options: PopulateOptions = {}
): Promise<PopulateResult> {
  const { verbose = false, incremental = false } = options;
  const startTime = performance.now();

  // Verify SCIP index exists
  if (!fs.existsSync(SCIP_INDEX_PATH)) {
    throw new Error(
      `SCIP index not found at ${SCIP_INDEX_PATH}. Run 'just discover-scip' first.`
    );
  }

  if (verbose) {
    console.log("Loading SCIP index...");
  }

  const index = parseScipIndex(SCIP_INDEX_PATH);

  if (verbose) {
    console.log(`  Documents: ${index.documents.length}`);
  }

  // Initialize database
  const db = new Database(SQLITE_DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // Load and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);

  // Clear existing data unless incremental
  if (!incremental) {
    db.exec('DELETE FROM "references"');
    db.exec("DELETE FROM symbols");
    db.exec("DELETE FROM documents");
    db.exec("DELETE FROM file_contents_fts");
  }

  // Prepare statements for batch inserts
  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO documents (relative_path, language, content_hash)
    VALUES (?, ?, ?)
  `);

  const insertSymbol = db.prepare(`
    INSERT OR REPLACE INTO symbols
    (document_id, name, full_symbol, kind, line, column, end_line, end_column, documentation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRef = db.prepare(`
    INSERT OR IGNORE INTO "references"
    (symbol_id, document_id, line, column, end_line, end_column, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertContent = db.prepare(`
    INSERT INTO file_contents_fts (relative_path, content)
    VALUES (?, ?)
  `);

  let docCount = 0;
  let symbolCount = 0;
  let refCount = 0;

  // Use a transaction for bulk insert performance
  const populate = db.transaction(() => {
    // Symbol ID lookup map for references
    const symbolIdMap = new Map<string, number>();

    // Process each document
    for (const document of index.documents) {
      const filePath = document.relative_path;

      // Skip non-source files
      if (
        filePath.includes("node_modules") ||
        filePath.includes(".d.ts") ||
        !filePath.match(/\.(ts|tsx|js|jsx)$/)
      ) {
        continue;
      }

      // Insert document
      const contentHash = computeHash(filePath);
      const docResult = insertDoc.run(filePath, "typescript", contentHash);
      const documentId = docResult.lastInsertRowid as number;
      docCount++;

      // Index file content for full-text search
      const absolutePath = path.join(PROJECT_ROOT, filePath);
      if (fs.existsSync(absolutePath)) {
        const content = fs.readFileSync(absolutePath, "utf-8");
        insertContent.run(filePath, content);
      }

      // Insert symbol definitions
      for (const symbolInfo of document.symbols) {
        const name = extractSymbolName(symbolInfo.symbol);
        const kind = inferSymbolKind(symbolInfo.symbol);
        const doc = symbolInfo.documentation?.join("\n") || null;

        // Find definition occurrence for location
        const defOcc = document.occurrences.find(
          (occ) =>
            occ.symbol === symbolInfo.symbol &&
            (occ.symbol_roles & SymbolRoles.Definition) !== 0
        );

        if (defOcc) {
          const loc = parseRange(defOcc.range);
          const symResult = insertSymbol.run(
            documentId,
            name,
            symbolInfo.symbol,
            kind,
            loc.startLine,
            loc.startColumn,
            loc.endLine,
            loc.endColumn,
            doc
          );

          symbolIdMap.set(symbolInfo.symbol, symResult.lastInsertRowid as number);
          symbolCount++;
        }
      }

      // Insert references
      for (const occurrence of document.occurrences) {
        const symbolId = symbolIdMap.get(occurrence.symbol);
        if (!symbolId) continue;

        const loc = parseRange(occurrence.range);
        const isDefinition =
          (occurrence.symbol_roles & SymbolRoles.Definition) !== 0;
        const isImport = (occurrence.symbol_roles & SymbolRoles.Import) !== 0;
        const isWrite = (occurrence.symbol_roles & SymbolRoles.WriteAccess) !== 0;

        const role = isDefinition
          ? "definition"
          : isImport
            ? "import"
            : isWrite
              ? "write"
              : "read";

        insertRef.run(
          symbolId,
          documentId,
          loc.startLine,
          loc.startColumn,
          loc.endLine,
          loc.endColumn,
          role
        );
        refCount++;
      }

      if (verbose && docCount % 100 === 0) {
        console.log(`  Processed ${docCount} documents...`);
      }
    }
  });

  populate();

  // Rebuild FTS index to sync with content table (required after bulk insert)
  db.exec("INSERT INTO symbols_fts(symbols_fts) VALUES('rebuild')");

  // Optimize FTS index
  db.exec("INSERT INTO symbols_fts(symbols_fts) VALUES('optimize')");

  db.close();

  const elapsed = Math.round(performance.now() - startTime);

  if (verbose) {
    console.log(`\nPopulation complete in ${elapsed}ms:`);
    console.log(`  Documents: ${docCount}`);
    console.log(`  Symbols: ${symbolCount}`);
    console.log(`  References: ${refCount}`);
    console.log(`  Database: ${SQLITE_DB_PATH}`);
  }

  return {
    success: true,
    dbPath: SQLITE_DB_PATH,
    stats: {
      documents: docCount,
      symbols: symbolCount,
      references: refCount,
      elapsedMs: elapsed,
    },
  };
}

/**
 * Compute a simple hash for change detection.
 */
function computeHash(filePath: string): string {
  const absolutePath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(absolutePath)) return "";

  const stats = fs.statSync(absolutePath);
  return `${stats.size}-${stats.mtimeMs}`;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
  const incremental = process.argv.includes("--incremental");

  populateDatabase({ verbose, incremental })
    .then(({ dbPath, stats }) => {
      console.log(
        `Database populated: ${dbPath} (${stats.documents} docs, ${stats.symbols} symbols, ${stats.references} refs in ${stats.elapsedMs}ms)`
      );
    })
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
