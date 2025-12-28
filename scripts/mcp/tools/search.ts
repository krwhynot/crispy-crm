/**
 * search_code Tool for FastMCP
 *
 * Hybrid search combining FTS5 (exact match) and LanceDB vector search.
 * Uses Reciprocal Rank Fusion (RRF) to merge and rank results from both sources.
 *
 * Graceful Degradation:
 * - If Ollama is unavailable, returns FTS-only results with a warning
 * - Never throws - returns error objects for MCP compatibility
 */

import { z } from "zod";
import { getDb } from "../db.js";
import { rrfRank, type SearchResult as RankingSearchResult } from "../ranking.js";
import {
  search as vectorSearch,
  searchByType as vectorSearchByType,
} from "../../discover/embeddings/lancedb.js";
import { generateEmbedding } from "../../discover/embeddings/ollama.js";

const searchSchema = z.object({
  query: z.string().describe("Search query (code or natural language)"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe("Max results"),
  type: z
    .enum(["all", "function", "class", "interface", "type", "component", "hook"])
    .default("all")
    .describe("Filter by code element type"),
});

type SearchInput = z.infer<typeof searchSchema>;

interface SearchResultOutput {
  file: string;
  lines: { start: number; end: number };
  preview: string;
  score: number;
  sources: ("fts" | "vector")[];
}

interface SearchSuccess {
  results: SearchResultOutput[];
  totalCount: number;
  warning?: string;
}

interface SearchError {
  error: string;
  suggestion: string;
}

type SearchResponse = SearchSuccess | SearchError;

/**
 * Escape special FTS5 query characters to prevent syntax errors.
 * FTS5 uses double quotes for phrase queries and * for prefix matching.
 */
function escapeFtsQuery(query: string): string {
  // Escape double quotes by doubling them
  return query.replace(/"/g, '""');
}

/**
 * Run FTS5 search on SQLite database.
 *
 * @param query - Search query text
 * @param limit - Maximum results to return
 * @returns Array of search results from FTS5
 */
function runFtsSearch(
  query: string,
  limit: number
): Array<{ file: string; line: number; content: string }> {
  try {
    const db = getDb();

    // Escape and prepare query - use phrase matching for multi-word queries
    const escapedQuery = escapeFtsQuery(query);
    const ftsQuery = query.includes(" ") ? `"${escapedQuery}"` : escapedQuery;

    const stmt = db.prepare(`
      SELECT relative_path,
             snippet(file_contents_fts, 1, '<mark>', '</mark>', '...', 64) as content,
             bm25(file_contents_fts) as score
      FROM file_contents_fts
      WHERE file_contents_fts MATCH ?
      ORDER BY bm25(file_contents_fts)
      LIMIT ?
    `);

    const rows = stmt.all(ftsQuery, limit) as Array<{
      relative_path: string;
      content: string;
      score: number;
    }>;

    return rows.map((row) => ({
      file: row.relative_path,
      line: 1, // FTS5 doesn't provide line numbers, will be overridden by vector results if available
      content: row.content,
    }));
  } catch (error) {
    console.error(
      "[search_code] FTS5 search failed:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Run vector search using LanceDB.
 *
 * @param embedding - Query embedding vector
 * @param type - Code element type filter ("all" for no filter)
 * @param limit - Maximum results to return
 * @returns Array of search results from vector search
 */
async function runVectorSearch(
  embedding: number[],
  type: string,
  limit: number
): Promise<Array<{ file: string; line: number; content: string }>> {
  try {
    const results =
      type === "all"
        ? await vectorSearch(embedding, limit)
        : await vectorSearchByType(embedding, type, limit);

    return results.map((r) => ({
      file: r.payload.filePath,
      line: r.payload.startLine,
      content: r.payload.content,
    }));
  } catch (error) {
    console.error(
      "[search_code] Vector search failed:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Execute hybrid search combining FTS5 and vector search.
 *
 * @param args - Validated search parameters
 * @returns Search response with results or error
 */
async function executeSearch(args: SearchInput): Promise<SearchResponse> {
  const { query, limit, type } = args;

  // Run FTS5 search (always available if DB exists)
  let ftsResults: RankingSearchResult[];
  try {
    ftsResults = runFtsSearch(query, limit);
  } catch (error) {
    return {
      error: "FTS5 database not available",
      suggestion:
        "Run 'just discover' to build the search index, then 'just index-fts' to populate FTS5",
    };
  }

  // Attempt vector search with graceful degradation
  let vectorResults: RankingSearchResult[] = [];
  let warning: string | undefined;

  try {
    const embedding = await generateEmbedding(query);
    vectorResults = await runVectorSearch(embedding, type, limit);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[search_code] Ollama unavailable:", errorMessage);
    warning =
      "Vector search unavailable (Ollama not running). Returning FTS-only results.";
  }

  // Combine results using RRF ranking
  const rankedResults = rrfRank(ftsResults, vectorResults);

  // Convert to output format
  const outputResults: SearchResultOutput[] = rankedResults
    .slice(0, limit)
    .map((r) => ({
      file: r.file,
      lines: {
        start: r.line,
        end: r.line, // FTS doesn't have end line, could be enhanced with vector results
      },
      preview: r.content,
      score: r.score,
      sources: r.sources,
    }));

  return {
    results: outputResults,
    totalCount: rankedResults.length,
    ...(warning ? { warning } : {}),
  };
}

/**
 * search_code tool for FastMCP.
 *
 * Combines FTS5 (exact match) and LanceDB vector search with RRF ranking.
 * Gracefully degrades to FTS-only if Ollama is unavailable.
 */
export const searchCodeTool = {
  name: "search_code",
  description: `Search codebase by meaning OR exact text.
Use for: "find form validation", "where is authentication handled?"
Returns: Array of {file, lines, preview, score}`,
  parameters: searchSchema,
  execute: async (args: unknown): Promise<SearchResponse> => {
    // Validate input
    const parseResult = searchSchema.safeParse(args);
    if (!parseResult.success) {
      return {
        error: "Invalid search parameters",
        suggestion: parseResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      };
    }

    return executeSearch(parseResult.data);
  },
};
