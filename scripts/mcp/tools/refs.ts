/**
 * find_references MCP Tool
 *
 * Finds all locations where a symbol is referenced in the codebase.
 * Uses the SCIP-populated SQLite database for precise reference lookup.
 */

import { z } from "zod";
import { getDb } from "../db.js";

const refsSchema = z.object({
  symbolName: z.string().describe("Symbol name to find references for"),
  includeDefinition: z
    .boolean()
    .default(true)
    .describe("Include the definition in results"),
});

type RefsInput = z.infer<typeof refsSchema>;

interface ReferenceLocation {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  role: string;
  isDefinition: boolean;
}

interface RefsResult {
  symbol: string;
  references: ReferenceLocation[];
  count: number;
}

interface RefsError {
  error: string;
  suggestion: string;
}

async function execute(args: RefsInput): Promise<string> {
  const { symbolName, includeDefinition } = args;

  try {
    const db = getDb();

    const baseQuery = `
      SELECT d.relative_path as path, r.line, r.column, r.end_line, r.end_column,
             r.role, (r.role = 'definition') as isDefinition
      FROM "references" r
      JOIN symbols s ON r.symbol_id = s.id
      JOIN documents d ON r.document_id = d.id
      WHERE s.name = ?
    `;

    const filterClause = includeDefinition ? "" : "AND r.role != 'definition'";
    const orderClause = "ORDER BY d.relative_path, r.line";

    const query = `${baseQuery} ${filterClause} ${orderClause}`;

    const stmt = db.prepare(query);
    const rows = stmt.all(symbolName) as Array<{
      path: string;
      line: number;
      column: number;
      end_line: number;
      end_column: number;
      role: string;
      isDefinition: number;
    }>;

    if (rows.length === 0) {
      return JSON.stringify({
        error: "No references found",
        suggestion: "Check symbol name spelling",
      });
    }

    const references: ReferenceLocation[] = rows.map((row) => ({
      file: row.path,
      line: row.line,
      column: row.column,
      endLine: row.end_line,
      endColumn: row.end_column,
      role: row.role,
      isDefinition: row.isDefinition === 1,
    }));

    return JSON.stringify({
      symbol: symbolName,
      references,
      count: references.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`find_references error: ${message}`);
    return JSON.stringify({
      error: `Database error: ${message}`,
      suggestion: "Ensure the search database exists at .claude/state/search.db",
    });
  }
}

export const findReferencesTool = {
  name: "find_references",
  description: `Find all places a symbol is used.
Use for: "who calls useForm?", "where is ContactList used?"
Returns: Array of {file, line, isDefinition}`,
  parameters: refsSchema,
  execute,
};
