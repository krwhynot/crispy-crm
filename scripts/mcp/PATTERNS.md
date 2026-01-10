# MCP Server Patterns

Code intelligence MCP server exposing semantic search, symbol navigation, and reference finding via FastMCP. Uses SQLite FTS5 + LanceDB vectors with Reciprocal Rank Fusion for hybrid search ranking.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FastMCP Server                             │
│                      (server.ts)                                │
│                                                                 │
│   server.addTool(searchCodeTool)                               │
│   server.addTool(goToDefinitionTool)                           │
│   server.addTool(findReferencesTool)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐   ┌──────▼──────┐  ┌────▼──────────┐
    │ search  │   │ go_to_def   │  │find_reference │
    │ _code   │   │inition      │  │s              │
    └────┬────┘   └──────┬──────┘  └────┬──────────┘
         │               │              │
         │     ┌─────────┴──────────────┘
         │     │
    ┌────▼─────▼────┐
    │    db.ts      │◄──────── Singleton (readonly, WAL)
    │   (getDb())   │
    └───────┬───────┘
            │
    ┌───────▼───────┐
    │  search.db    │
    │   (SQLite)    │
    └───────────────┘
            │
   ┌────────┼────────┐
   │        │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│FTS5 │  │symb-│  │refs │
│index│  │ols  │  │     │
└─────┘  └─────┘  └─────┘

    search_code also uses:
    ┌─────────────┐     ┌─────────────┐
    │   Ollama    │────▶│   LanceDB   │
    │ (embedding) │     │  (vectors)  │
    └─────────────┘     └─────────────┘
           │
    ┌──────▼──────┐
    │ ranking.ts  │◄──────── RRF algorithm
    │ (rrfRank()) │
    └─────────────┘
```

---

## Pattern A: MCP Tool Definition

Structure for defining FastMCP-compatible tools with Zod validation, descriptive metadata, and JSON response handling.

**When to use**: When adding new code intelligence tools to the MCP server.

### Tool Structure

```typescript
// scripts/mcp/tools/search.ts

import { z } from "zod";

// 1. Zod schema with .describe() on every field
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

// 2. Define success and error response types
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

// 3. Export tool object
export const searchCodeTool = {
  name: "search_code",
  description: `Search codebase by meaning OR exact text.
Use for: "find form validation", "where is authentication handled?"
Returns: Array of {file, lines, preview, score}`,
  parameters: searchSchema,
  execute: async (args: unknown): Promise<string> => {
    // 4. Validate with safeParse (never throws)
    const parseResult = searchSchema.safeParse(args);
    if (!parseResult.success) {
      return JSON.stringify({
        error: "Invalid search parameters",
        suggestion: parseResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
    }

    // 5. Execute and return JSON string
    const result = await executeSearch(parseResult.data);
    return JSON.stringify(result);
  },
};
```

**Key points:**
- Every schema field needs `.describe()` for Claude to understand parameters
- `execute()` returns `Promise<string>` - always use `JSON.stringify()`
- Multi-line description with examples helps Claude know when to use the tool
- Use `safeParse()` instead of `parse()` to avoid throwing

---

## Pattern B: Hybrid Search with RRF Ranking

Combines FTS5 (exact match) and vector search (semantic) using Reciprocal Rank Fusion, boosting items found by both sources.

**When to use**: When implementing search that benefits from both exact match and semantic similarity.

### RRF Algorithm

```typescript
// scripts/mcp/ranking.ts

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export interface RankedResult {
  file: string;
  line: number;
  content: string;
  score: number;
  sources: ("fts" | "vector")[];
}

// RRF Formula: score = 1 / (k + rank)
// k=60 is standard tuning constant (higher = more equal weighting)
function computeRRFScore(rank: number, k: number): number {
  return 1 / (k + rank);
}

// Create unique key for deduplication
function makeKey(file: string, line: number): string {
  return `${file}:${line}`;
}

export function rrfRank(
  ftsResults: SearchResult[],
  vectorResults: SearchResult[],
  k: number = 60
): RankedResult[] {
  const resultMap = new Map<string, IntermediateResult>();

  // Process FTS results (1-based ranking)
  for (let i = 0; i < ftsResults.length; i++) {
    const result = ftsResults[i];
    const key = makeKey(result.file, result.line);
    const rank = i + 1;
    const rrfScore = computeRRFScore(rank, k);

    const existing = resultMap.get(key);
    if (existing) {
      // BOOST: item found by both sources
      existing.score += rrfScore;
      existing.sources.add("fts");
    } else {
      resultMap.set(key, {
        ...result,
        score: rrfScore,
        sources: new Set(["fts"]),
      });
    }
  }

  // Process vector results - same deduplication logic
  for (let i = 0; i < vectorResults.length; i++) {
    const result = vectorResults[i];
    const key = makeKey(result.file, result.line);
    const rank = i + 1;
    const rrfScore = computeRRFScore(rank, k);

    const existing = resultMap.get(key);
    if (existing) {
      existing.score += rrfScore;
      existing.sources.add("vector");
    } else {
      resultMap.set(key, {
        ...result,
        score: rrfScore,
        sources: new Set(["vector"]),
      });
    }
  }

  // Sort by combined score, convert Set to Array
  const results = Array.from(resultMap.values());
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => ({
    ...r,
    sources: Array.from(r.sources) as ("fts" | "vector")[],
  }));
}
```

**Key points:**
- `k=60` is a standard constant that balances rank importance
- Deduplication uses `${file}:${line}` as unique key
- Items found by both FTS and vector get summed scores (boosted)
- `sources` tracked as Set during processing, converted to array in output

---

## Pattern C: Database Query Patterns

SQLite query patterns for the SCIP symbol database and FTS5 index.

**When to use**: When querying the symbol database or full-text search index.

### Database Singleton

```typescript
// scripts/mcp/db.ts

import Database from "better-sqlite3";

const DB_PATH = process.cwd() + "/.claude/state/search.db";
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

### FTS5 Search

```typescript
// scripts/mcp/tools/search.ts

function escapeFtsQuery(query: string): string {
  // Escape double quotes for FTS5
  return query.replace(/"/g, '""');
}

function runFtsSearch(
  query: string,
  limit: number
): Array<{ file: string; line: number; content: string }> {
  const db = getDb();

  // Handle multi-word queries as phrases
  const escapedQuery = escapeFtsQuery(query);
  const ftsQuery = query.includes(" ") ? `"${escapedQuery}"` : escapedQuery;

  // Parameterized query with BM25 scoring
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
    line: 1, // FTS5 doesn't provide line numbers
    content: row.content,
  }));
}
```

### Symbol Lookup (SCIP Tables)

```typescript
// scripts/mcp/tools/goto.ts

async function execute(args: GotoArgs): Promise<string> {
  const { symbolName, kind } = args;
  const db = getDb();

  // Parameterized query with JOIN
  const query = `
    SELECT d.relative_path, s.line, s.column, s.end_line, s.end_column,
           s.kind, s.documentation, s.signature
    FROM symbols s
    JOIN documents d ON s.document_id = d.id
    WHERE s.name = ?
    ${kind !== "any" ? "AND s.kind = ?" : ""}
    ORDER BY d.relative_path, s.line
  `;

  const params = kind === "any" ? [symbolName] : [symbolName, kind];
  const rows = db.prepare(query).all(...params);

  // Map snake_case columns to camelCase output
  return rows.map((row) => ({
    file: row.relative_path,
    line: row.line,
    endLine: row.end_line,      // snake_case → camelCase
    endColumn: row.end_column,
    // Only include optional fields if non-null
    ...(row.documentation && { documentation: row.documentation }),
    ...(row.signature && { signature: row.signature }),
  }));
}
```

### Reference Lookup

```typescript
// scripts/mcp/tools/refs.ts

const query = `
  SELECT d.relative_path as path, r.line, r.column, r.end_line, r.end_column,
         r.role, (r.role = 'definition') as isDefinition
  FROM "references" r
  JOIN symbols s ON r.symbol_id = s.id
  JOIN documents d ON r.document_id = d.id
  WHERE s.name = ?
  ${includeDefinition ? "" : "AND r.role != 'definition'"}
  ORDER BY d.relative_path, r.line
`;

const rows = stmt.all(symbolName);

// SQLite returns 0/1 for booleans - convert back
return rows.map((row) => ({
  file: row.path,
  isDefinition: row.isDefinition === 1,  // 0/1 → boolean
}));
```

**Key points:**
- Always use parameterized queries (`?` placeholders) - never string interpolation
- Escape FTS5 special characters (double quotes → `""`)
- Multi-word queries need phrase matching with quotes
- Map `snake_case` database columns to `camelCase` output
- SQLite booleans are 0/1 integers - convert explicitly

---

## Pattern D: Error Handling

MCP-compatible error handling that never throws, with structured responses and graceful degradation.

**When to use**: When any MCP tool operation can fail.

### Error Response Structure

```typescript
// Standard error response interface
interface ToolError {
  error: string;      // What went wrong
  suggestion: string; // How to fix it
}

// In execute function
async function execute(args: unknown): Promise<string> {
  try {
    const db = getDb();
    // ... business logic
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`tool_name error: ${message}`);

    return JSON.stringify({
      error: `Database error: ${message}`,
      suggestion: "Ensure the search database exists at .claude/state/search.db",
    });
  }
}
```

### Graceful Degradation

```typescript
// scripts/mcp/tools/search.ts

async function executeSearch(args: SearchInput): Promise<SearchResponse> {
  const { query, limit, type } = args;

  // FTS5 is required - return error if unavailable
  let ftsResults: SearchResult[];
  try {
    ftsResults = runFtsSearch(query, limit);
  } catch (_error) {
    return {
      error: "FTS5 database not available",
      suggestion: "Run 'just discover' to build the search index",
    };
  }

  // Vector search is optional - degrade gracefully
  let vectorResults: SearchResult[] = [];
  let warning: string | undefined;

  try {
    const embedding = await generateEmbedding(query);
    vectorResults = await runVectorSearch(embedding, type, limit);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[search_code] Ollama unavailable:", errorMessage);
    // Continue with FTS-only, add warning to response
    warning = "Vector search unavailable (Ollama not running). Returning FTS-only results.";
  }

  // Combine results using RRF
  const rankedResults = rrfRank(ftsResults, vectorResults);

  return {
    results: formatResults(rankedResults.slice(0, limit)),
    totalCount: rankedResults.length,
    ...(warning ? { warning } : {}),
  };
}
```

**Key points:**
- Never throw from `execute()` - MCP protocol expects JSON response
- Always return valid JSON, even for errors
- Include actionable `suggestion` field to help users fix issues
- Use `console.error()` for debugging (visible in server logs)
- Distinguish required vs optional features for degradation

---

## Pattern E: Logging Wrapper

Higher-order function that wraps MCP tool executors with automatic logging to `.claude/state/usage.log`. Tracks invocations, timing, and result counts.

**When to use**: When registering MCP tools to track usage patterns and diagnose issues.

### Logging Wrapper

```typescript
// scripts/mcp/logger.ts

import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const LOG_FILE = join(process.cwd(), ".claude", "state", "usage.log");

// Ensure directory exists at module load
const logDir = dirname(LOG_FILE);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

interface LogEntry {
  tool: string;
  query?: string;
  params?: Record<string, unknown>;
  resultCount?: number;
  duration?: number;
  error?: string;
}

export function logToolCall(entry: LogEntry): void {
  const timestamp = new Date().toISOString();
  const icon = entry.error ? "❌" : "✓";

  let line = `[${timestamp}] ${icon} ${entry.tool}`;

  if (entry.query) {
    line += ` | query: "${entry.query}"`;
  }

  if (entry.params && Object.keys(entry.params).length > 0) {
    const params = Object.entries(entry.params)
      .filter(([k]) => k !== "query") // Don't duplicate query
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(", ");
    if (params) {
      line += ` | ${params}`;
    }
  }

  if (entry.resultCount !== undefined) {
    line += ` | results: ${entry.resultCount}`;
  }

  if (entry.duration !== undefined) {
    line += ` | ${entry.duration}ms`;
  }

  if (entry.error) {
    line += ` | error: ${entry.error}`;
  }

  line += "\n";

  try {
    appendFileSync(LOG_FILE, line);
  } catch {
    // Silent fail - logging shouldn't break the MCP server
  }
}

/**
 * Create a wrapped tool executor with automatic logging
 */
export function withLogging<T>(
  toolName: string,
  fn: (args: T) => Promise<string>
): (args: T) => Promise<string> {
  return async (args: T) => {
    const start = Date.now();

    try {
      const result = await fn(args);
      const duration = Date.now() - start;

      // Parse result to get count
      let resultCount: number | undefined;
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          resultCount = parsed.length;
        } else if (parsed.results && Array.isArray(parsed.results)) {
          resultCount = parsed.results.length;
        } else if (parsed.references && Array.isArray(parsed.references)) {
          resultCount = parsed.references.length;
        }
      } catch {
        // Not JSON or unexpected format
      }

      logToolCall({
        tool: toolName,
        query: (args as Record<string, unknown>).query as string | undefined,
        params: args as Record<string, unknown>,
        resultCount,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logToolCall({
        tool: toolName,
        query: (args as Record<string, unknown>).query as string | undefined,
        params: args as Record<string, unknown>,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };
}
```

### Usage in Server Registration

```typescript
// scripts/mcp/server.ts

import { withLogging } from "./logger.js";

// Register all tools with logging wrappers
server.addTool({
  ...searchCodeTool,
  execute: withLogging("search_code", searchCodeTool.execute),
});

server.addTool({
  ...goToDefinitionTool,
  execute: withLogging("go_to_definition", goToDefinitionTool.execute),
});

server.addTool({
  ...findReferencesTool,
  execute: withLogging("find_references", findReferencesTool.execute),
});
```

### Log Output Format

```
[2024-01-15T10:23:45.123Z] ✓ search_code | query: "form validation" | limit=20, type="all" | results: 15 | 234ms
[2024-01-15T10:23:46.789Z] ✓ go_to_definition | query: "useForm" | symbolName="useForm", kind="any" | results: 1 | 45ms
[2024-01-15T10:23:47.456Z] ❌ find_references | query: "NonExistent" | symbolName="NonExistent" | 12ms | error: Symbol not found
```

**Key points:**
- Wrap tool executors at registration time, not at definition time
- Silent failure in `logToolCall()` prevents logging from breaking the MCP server
- Result count extraction handles multiple response formats (array, `.results`, `.references`)
- Duration tracking helps identify slow queries
- Error indicator (❌) makes failures visible in log output
- Log file location: `.claude/state/usage.log`

**Viewing logs:**
```bash
# Real-time monitoring
tail -f .claude/state/usage.log

# Recent activity
tail -20 .claude/state/usage.log
```

---

## Pattern Comparison Table

| Aspect | Tool Definition | Search Ranking | Database Queries | Error Handling | Logging Wrapper |
|--------|-----------------|----------------|------------------|----------------|-----------------|
| **Purpose** | Define MCP tools | Combine search sources | Query symbol data | Handle failures | Track usage |
| **Key file** | tools/*.ts | ranking.ts | db.ts | All tools | logger.ts |
| **Zod usage** | Parameters | N/A | N/A | Error types | N/A |
| **Returns** | JSON string | RankedResult[] | Query rows | Error object | Wrapped function |
| **Key pattern** | safeParse | RRF formula | Parameterized SQL | try/catch + JSON | Higher-order function |

---

## Anti-Patterns to Avoid

### 1. Throwing from MCP Tools

```typescript
// BAD: Throws break MCP protocol
async function execute(args) {
  const db = getDb(); // Can throw!
  // ...
}

// GOOD: Return structured error
async function execute(args) {
  try {
    const db = getDb();
    // ...
  } catch (err) {
    return JSON.stringify({
      error: `Database error: ${err.message}`,
      suggestion: "Run 'just discover' to rebuild index"
    });
  }
}
```

### 2. String Interpolation in SQL

```typescript
// BAD: SQL injection risk
const query = `SELECT * FROM symbols WHERE name = '${symbolName}'`;

// GOOD: Parameterized query
const stmt = db.prepare(`SELECT * FROM symbols WHERE name = ?`);
stmt.all(symbolName);
```

### 3. Unescaped FTS5 Queries

```typescript
// BAD: Special characters break FTS5
const ftsQuery = query; // "hello world" breaks

// GOOD: Escape and handle phrases
const escaped = query.replace(/"/g, '""');
const ftsQuery = query.includes(' ') ? `"${escaped}"` : escaped;
```

### 4. Missing Zod Validation

```typescript
// BAD: No validation
execute: async (args: any) => {
  const { query } = args;
  // ...
}

// GOOD: Validate with safeParse
execute: async (args: unknown) => {
  const result = schema.safeParse(args);
  if (!result.success) {
    return JSON.stringify({ error: "Invalid parameters", ... });
  }
  // ...
}
```

### 5. Missing .describe() on Schema Fields

```typescript
// BAD: Claude doesn't understand parameters
const schema = z.object({
  query: z.string(),
  limit: z.number(),
});

// GOOD: Descriptive schema
const schema = z.object({
  query: z.string().describe("Search query (code or natural language)"),
  limit: z.number().min(1).max(50).describe("Max results"),
});
```

---

## New MCP Tool Checklist

When adding a new MCP tool:

1. [ ] Create `scripts/mcp/tools/{tool-name}.ts`
2. [ ] Define Zod schema with `.describe()` on each field
3. [ ] Define success and error response interfaces
4. [ ] Implement `execute()` function with try/catch
5. [ ] Return `JSON.stringify()` for all code paths
6. [ ] Export tool object with name, description, parameters, execute
7. [ ] Register in `scripts/mcp/server.ts` with `server.addTool()`
8. [ ] Verify: `npx tsx scripts/mcp/server.ts` (check for startup errors)
9. [ ] Test: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx tsx scripts/mcp/server.ts`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Tool Definition** | `tools/search.ts`, `tools/goto.ts`, `tools/refs.ts` |
| **B: RRF Ranking** | `ranking.ts` |
| **C: Database Queries** | `db.ts`, `tools/*.ts` |
| **D: Error Handling** | All tool files |
| **E: Logging Wrapper** | `logger.ts`, `server.ts` |
