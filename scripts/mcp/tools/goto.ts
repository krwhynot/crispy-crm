import { z } from "zod";
import { getDb } from "../db";

const gotoSchema = z.object({
  symbolName: z.string().describe("Symbol name (e.g., 'useForm', 'ContactList')"),
  kind: z
    .enum(["any", "function", "class", "interface", "type", "method", "property"])
    .default("any")
    .describe("Filter by symbol kind"),
});

type GotoArgs = z.infer<typeof gotoSchema>;

interface DefinitionResult {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  kind: string;
  documentation?: string;
  signature?: string;
}

interface GotoSuccess {
  definitions: DefinitionResult[];
}

interface GotoError {
  error: string;
  suggestion: string;
}

type _GotoResult = GotoSuccess | GotoError;

async function execute(args: GotoArgs): Promise<string> {
  const { symbolName, kind } = args;

  try {
    const db = getDb();

    let query: string;
    let params: (string | number)[];

    if (kind === "any") {
      query = `
        SELECT d.relative_path, s.line, s.column, s.end_line, s.end_column,
               s.kind, s.documentation, s.signature
        FROM symbols s
        JOIN documents d ON s.document_id = d.id
        WHERE s.name = ?
        ORDER BY d.relative_path, s.line
      `;
      params = [symbolName];
    } else {
      query = `
        SELECT d.relative_path, s.line, s.column, s.end_line, s.end_column,
               s.kind, s.documentation, s.signature
        FROM symbols s
        JOIN documents d ON s.document_id = d.id
        WHERE s.name = ? AND s.kind = ?
        ORDER BY d.relative_path, s.line
      `;
      params = [symbolName, kind];
    }

    const rows = db.prepare(query).all(...params) as Array<{
      relative_path: string;
      line: number;
      column: number;
      end_line: number;
      end_column: number;
      kind: string;
      documentation: string | null;
      signature: string | null;
    }>;

    if (rows.length === 0) {
      return JSON.stringify({
        error: "Symbol not found",
        suggestion: "Try search_code for fuzzy matching",
      });
    }

    const definitions: DefinitionResult[] = rows.map((row) => {
      const result: DefinitionResult = {
        file: row.relative_path,
        line: row.line,
        column: row.column,
        endLine: row.end_line,
        endColumn: row.end_column,
        kind: row.kind,
      };

      if (row.documentation) {
        result.documentation = row.documentation;
      }

      if (row.signature) {
        result.signature = row.signature;
      }

      return result;
    });

    return JSON.stringify({ definitions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`go_to_definition error: ${message}`);
    return JSON.stringify({
      error: `Database error: ${message}`,
      suggestion: "Ensure the search database exists at .claude/state/search.db",
    });
  }
}

export const goToDefinitionTool = {
  name: "go_to_definition",
  description: `Jump to where a symbol is defined.
Use for: "go to ContactList definition", "where is useForm declared?"
Returns: {file, line, column, kind, documentation}
NOT for: finding usages - use find_references instead`,
  parameters: gotoSchema,
  execute,
};
