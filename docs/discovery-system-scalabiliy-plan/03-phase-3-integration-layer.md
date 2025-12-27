# Phase 3: Integration Layer

> **Prerequisites:** Phase 1 (SCIP + SQLite) and Phase 2 (LanceDB + Ollama) complete
> **Timeline:** Days 5-6
> **Complexity:** Medium

---

## Goal

Expose unified search through an MCP server for Claude Code integration, combining exact search (SQLite FTS5) with semantic search (LanceDB).

---

## Task 3.1: Install MCP SDK

**File:** `package.json`

The official MCP TypeScript SDK provides everything needed to build an MCP server. We use the v1.x stable branch (recommended for production until v2 ships in Q1 2026).

```bash
npm install @modelcontextprotocol/sdk zod
```

**Why this approach:**
- Official SDK from Anthropic, actively maintained
- v1.x is stable and production-ready
- Zod integration for schema validation built-in
- Supports stdio transport (required for Claude Code)

---

## Task 3.2: Create MCP Server Scaffold

**File:** `scripts/mcp/server.ts`

The MCP server is the central hub that registers tools and handles connections from Claude Code. It uses stdio transport for local integration.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import Database from 'better-sqlite3';
import * as lancedb from 'lancedb';
import { registerSearchTool } from './tools/search.js';
import { registerGotoTool } from './tools/goto.js';
import { registerRefsTool } from './tools/refs.js';

// Database paths
const SQLITE_PATH = '.claude/state/search.db';
const LANCE_PATH = '.claude/state/vectors.lance';

async function main(): Promise<void> {
  // Initialize databases
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const lance = await lancedb.connect(LANCE_PATH);

  // Create MCP server
  const server = new McpServer({
    name: 'code-intel',
    version: '1.0.0',
  });

  // Register all tools
  registerSearchTool(server, sqlite, lance);
  registerGotoTool(server, sqlite);
  registerRefsTool(server, sqlite);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    sqlite.close();
    process.exit(0);
  });

  console.error('[code-intel] MCP server started');
}

main().catch((error) => {
  console.error('[code-intel] Fatal error:', error);
  process.exit(1);
});
```

**Why this approach:**
- Readonly database connections prevent accidental modifications
- Graceful shutdown closes database handles properly
- Console.error for logging (stdout reserved for MCP protocol)
- Modular tool registration for maintainability

---

## Task 3.3: Implement `search_code` Tool

**File:** `scripts/mcp/tools/search.ts`

The `search_code` tool combines exact text search (FTS5) with semantic search (LanceDB) for comprehensive code discovery. Users can choose exact, semantic, or hybrid search modes.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type Database from 'better-sqlite3';
import type { Connection, Table } from 'lancedb';
import { hybridRank, type SearchResult } from '../ranking.js';

// Input schema for search_code tool
const SearchInputSchema = {
  query: z.string().describe('Search query (text or natural language)'),
  limit: z.number().min(1).max(50).default(10).describe('Maximum results'),
  search_type: z.enum(['exact', 'semantic', 'hybrid']).default('hybrid')
    .describe('Search mode: exact (FTS5), semantic (vector), or hybrid (both)'),
};

// Output schema
const SearchOutputSchema = {
  results: z.array(z.object({
    file_path: z.string(),
    line_start: z.number(),
    line_end: z.number(),
    content: z.string(),
    score: z.number(),
    match_type: z.enum(['exact', 'semantic']),
  })),
  total_count: z.number(),
};

export function registerSearchTool(
  server: McpServer,
  sqlite: Database.Database,
  lance: Connection
): void {
  server.registerTool(
    'search_code',
    {
      title: 'Search Code',
      description: 'Search codebase using text patterns or natural language queries',
      inputSchema: SearchInputSchema,
      outputSchema: SearchOutputSchema,
    },
    async ({ query, limit, search_type }) => {
      const results: SearchResult[] = [];

      // Exact search via SQLite FTS5
      if (search_type === 'exact' || search_type === 'hybrid') {
        const exactResults = searchExact(sqlite, query, limit);
        results.push(...exactResults);
      }

      // Semantic search via LanceDB
      if (search_type === 'semantic' || search_type === 'hybrid') {
        const semanticResults = await searchSemantic(lance, query, limit);
        results.push(...semanticResults);
      }

      // Combine and rank results
      const ranked = search_type === 'hybrid'
        ? hybridRank(results, limit)
        : results.slice(0, limit);

      const output = {
        results: ranked.map((r) => ({
          file_path: r.file_path,
          line_start: r.line_start,
          line_end: r.line_end,
          content: r.content,
          score: r.score,
          match_type: r.match_type,
        })),
        total_count: ranked.length,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}

function searchExact(
  db: Database.Database,
  query: string,
  limit: number
): SearchResult[] {
  // FTS5 search with trigram tokenizer
  const stmt = db.prepare(`
    SELECT
      file_path,
      line_start,
      line_end,
      content,
      bm25(code_fts) as score
    FROM code_fts
    WHERE code_fts MATCH ?
    ORDER BY score
    LIMIT ?
  `);

  const rows = stmt.all(query, limit) as Array<{
    file_path: string;
    line_start: number;
    line_end: number;
    content: string;
    score: number;
  }>;

  return rows.map((row) => ({
    ...row,
    match_type: 'exact' as const,
  }));
}

async function searchSemantic(
  lance: Connection,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  // Get embedding for query via Ollama
  const embedding = await getQueryEmbedding(query);

  // Vector search in LanceDB
  const table = await lance.openTable('code_chunks');
  const results = await table
    .search(embedding)
    .limit(limit)
    .toArray();

  return results.map((row) => ({
    file_path: row.file_path as string,
    line_start: row.line_start as number,
    line_end: row.line_end as number,
    content: row.content as string,
    score: 1 - (row._distance as number), // Convert distance to similarity
    match_type: 'semantic' as const,
  }));
}

async function getQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}
```

**Why this approach:**
- Three search modes give flexibility for different use cases
- FTS5 with BM25 ranking for precise text matching
- Vector search for "find code that does X" queries
- Ollama runs locally (no API costs, no latency)
- Structured output enables Claude to parse results programmatically

---

## Task 3.4: Implement `go_to_definition` Tool

**File:** `scripts/mcp/tools/goto.ts`

The `go_to_definition` tool queries the SCIP index to find where a symbol is defined. This enables precise navigation across files.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type Database from 'better-sqlite3';

// Input schema
const GotoInputSchema = {
  symbol: z.string().describe('Symbol name to find definition for'),
  file_context: z.string().optional()
    .describe('File path for context (helps disambiguate)'),
};

// Output schema
const GotoOutputSchema = {
  definitions: z.array(z.object({
    file_path: z.string(),
    line: z.number(),
    column: z.number(),
    symbol_kind: z.string(),
    container: z.string().optional(),
  })),
  found: z.boolean(),
};

export function registerGotoTool(
  server: McpServer,
  sqlite: Database.Database
): void {
  server.registerTool(
    'go_to_definition',
    {
      title: 'Go to Definition',
      description: 'Find where a symbol (function, class, variable) is defined',
      inputSchema: GotoInputSchema,
      outputSchema: GotoOutputSchema,
    },
    async ({ symbol, file_context }) => {
      const definitions = findDefinitions(sqlite, symbol, file_context);

      const output = {
        definitions: definitions.map((d) => ({
          file_path: d.file_path,
          line: d.line,
          column: d.column,
          symbol_kind: d.symbol_kind,
          container: d.container,
        })),
        found: definitions.length > 0,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}

interface Definition {
  file_path: string;
  line: number;
  column: number;
  symbol_kind: string;
  container?: string;
}

function findDefinitions(
  db: Database.Database,
  symbol: string,
  fileContext?: string
): Definition[] {
  // Query SCIP symbols table for definitions
  let query = `
    SELECT
      s.file_path,
      s.line,
      s.column,
      s.kind as symbol_kind,
      s.container
    FROM symbols s
    WHERE s.name = ?
      AND s.is_definition = 1
  `;

  const params: Array<string | number> = [symbol];

  // Prioritize definitions in the same file if context provided
  if (fileContext) {
    query += `
    ORDER BY
      CASE WHEN s.file_path = ? THEN 0 ELSE 1 END,
      s.file_path
    `;
    params.push(fileContext);
  } else {
    query += ' ORDER BY s.file_path';
  }

  query += ' LIMIT 10';

  const stmt = db.prepare(query);
  return stmt.all(...params) as Definition[];
}
```

**Why this approach:**
- SCIP index provides compiler-accurate symbol resolution
- File context helps disambiguate symbols with the same name
- Returns multiple definitions when symbol is re-exported
- Symbol kind (function, class, interface) helps Claude understand context

---

## Task 3.5: Implement `find_references` Tool

**File:** `scripts/mcp/tools/refs.ts`

The `find_references` tool locates all places where a symbol is used. Essential for understanding impact of changes.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type Database from 'better-sqlite3';

// Input schema
const RefsInputSchema = {
  symbol: z.string().describe('Symbol name to find references for'),
  include_definition: z.boolean().default(false)
    .describe('Include the definition in results'),
  limit: z.number().min(1).max(100).default(25)
    .describe('Maximum references to return'),
};

// Output schema
const RefsOutputSchema = {
  references: z.array(z.object({
    file_path: z.string(),
    line: z.number(),
    column: z.number(),
    context: z.string(),
    is_definition: z.boolean(),
  })),
  total_count: z.number(),
  truncated: z.boolean(),
};

export function registerRefsTool(
  server: McpServer,
  sqlite: Database.Database
): void {
  server.registerTool(
    'find_references',
    {
      title: 'Find References',
      description: 'Find all usages of a symbol across the codebase',
      inputSchema: RefsInputSchema,
      outputSchema: RefsOutputSchema,
    },
    async ({ symbol, include_definition, limit }) => {
      const { references, totalCount } = findReferences(
        sqlite,
        symbol,
        include_definition,
        limit
      );

      const output = {
        references: references.map((r) => ({
          file_path: r.file_path,
          line: r.line,
          column: r.column,
          context: r.context,
          is_definition: r.is_definition,
        })),
        total_count: totalCount,
        truncated: totalCount > limit,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );
}

interface Reference {
  file_path: string;
  line: number;
  column: number;
  context: string;
  is_definition: boolean;
}

function findReferences(
  db: Database.Database,
  symbol: string,
  includeDefinition: boolean,
  limit: number
): { references: Reference[]; totalCount: number } {
  // Count total references first
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM references r
    JOIN symbols s ON r.symbol_id = s.id
    WHERE s.name = ?
      ${includeDefinition ? '' : 'AND r.is_definition = 0'}
  `);
  const { count: totalCount } = countStmt.get(symbol) as { count: number };

  // Get references with surrounding context
  const stmt = db.prepare(`
    SELECT
      r.file_path,
      r.line,
      r.column,
      r.context,
      r.is_definition
    FROM references r
    JOIN symbols s ON r.symbol_id = s.id
    WHERE s.name = ?
      ${includeDefinition ? '' : 'AND r.is_definition = 0'}
    ORDER BY
      r.is_definition DESC,
      r.file_path,
      r.line
    LIMIT ?
  `);

  const references = stmt.all(symbol, limit) as Reference[];

  return { references, totalCount };
}
```

**Why this approach:**
- Separate count query prevents scanning all results
- Context snippet shows surrounding code for each reference
- Definitions listed first when included
- Truncation flag tells Claude if more references exist

---

## Task 3.6: Add Hybrid Ranking

**File:** `scripts/mcp/ranking.ts`

Hybrid ranking combines exact match scores with semantic similarity using Reciprocal Rank Fusion (RRF). This ensures both search types contribute fairly.

```typescript
export interface SearchResult {
  file_path: string;
  line_start: number;
  line_end: number;
  content: string;
  score: number;
  match_type: 'exact' | 'semantic';
}

interface RankedResult extends SearchResult {
  rrf_score: number;
}

/**
 * Reciprocal Rank Fusion (RRF) for combining ranked lists
 *
 * RRF score = sum(1 / (k + rank_i)) for each ranking list i
 * where k is a constant (typically 60) to prevent high ranks from dominating
 */
export function hybridRank(
  results: SearchResult[],
  limit: number,
  k: number = 60
): SearchResult[] {
  // Group by unique file+line combination
  const resultMap = new Map<string, RankedResult>();

  // Separate by match type
  const exactResults = results
    .filter((r) => r.match_type === 'exact')
    .sort((a, b) => b.score - a.score);

  const semanticResults = results
    .filter((r) => r.match_type === 'semantic')
    .sort((a, b) => b.score - a.score);

  // Calculate RRF scores for exact matches
  exactResults.forEach((result, rank) => {
    const key = `${result.file_path}:${result.line_start}`;
    const rrfContribution = 1 / (k + rank + 1);

    if (resultMap.has(key)) {
      const existing = resultMap.get(key)!;
      existing.rrf_score += rrfContribution;
    } else {
      resultMap.set(key, {
        ...result,
        rrf_score: rrfContribution,
      });
    }
  });

  // Calculate RRF scores for semantic matches
  semanticResults.forEach((result, rank) => {
    const key = `${result.file_path}:${result.line_start}`;
    const rrfContribution = 1 / (k + rank + 1);

    if (resultMap.has(key)) {
      const existing = resultMap.get(key)!;
      existing.rrf_score += rrfContribution;
      // Boost score if found by both methods
      existing.score = Math.max(existing.score, result.score);
    } else {
      resultMap.set(key, {
        ...result,
        rrf_score: rrfContribution,
      });
    }
  });

  // Sort by RRF score and return top results
  const ranked = Array.from(resultMap.values())
    .sort((a, b) => b.rrf_score - a.rrf_score)
    .slice(0, limit);

  // Return without internal rrf_score field
  return ranked.map(({ rrf_score, ...rest }) => rest);
}

/**
 * Simple weighted scoring alternative
 * Useful when you want more control over exact vs semantic balance
 */
export function weightedRank(
  results: SearchResult[],
  limit: number,
  exactWeight: number = 0.6,
  semanticWeight: number = 0.4
): SearchResult[] {
  // Normalize scores within each type
  const exactMax = Math.max(
    ...results.filter((r) => r.match_type === 'exact').map((r) => r.score),
    1
  );
  const semanticMax = Math.max(
    ...results.filter((r) => r.match_type === 'semantic').map((r) => r.score),
    1
  );

  const scored = results.map((r) => {
    const normalizedScore = r.match_type === 'exact'
      ? r.score / exactMax
      : r.score / semanticMax;

    const weight = r.match_type === 'exact' ? exactWeight : semanticWeight;

    return {
      ...r,
      combinedScore: normalizedScore * weight,
    };
  });

  // Deduplicate by file+line, keeping highest score
  const deduped = new Map<string, typeof scored[0]>();
  for (const result of scored) {
    const key = `${result.file_path}:${result.line_start}`;
    const existing = deduped.get(key);
    if (!existing || result.combinedScore > existing.combinedScore) {
      deduped.set(key, result);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit)
    .map(({ combinedScore, ...rest }) => rest);
}
```

**Why this approach:**
- RRF is proven effective for combining multiple ranking signals
- k=60 is the standard constant (from the original RRF paper)
- Results found by both methods get boosted
- Deduplication prevents same code appearing twice
- Weighted alternative gives manual control when needed

---

## Task 3.7: Configure Claude Code Connection

**File:** `.claude/mcp.json` (create new)

Claude Code reads MCP server configuration from `.claude/mcp.json`. This file tells Claude how to start and connect to the code-intel server.

```json
{
  "mcpServers": {
    "code-intel": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp/server.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Alternative: Global configuration**

For system-wide availability, add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "code-intel": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/crispy-crm/scripts/mcp/server.ts"],
      "cwd": "/absolute/path/to/crispy-crm"
    }
  }
}
```

**Verification steps:**

1. Start Claude Code in the project directory
2. Check the MCP server list: `claude mcp list`
3. The `code-intel` server should appear with status "connected"
4. Test a tool: Claude should be able to call `search_code` autonomously

**Why this approach:**
- Project-local config via `.claude/mcp.json` (recommended)
- Uses `npx tsx` for TypeScript execution without compilation
- NODE_ENV=production disables debug logging
- cwd ensures correct working directory for relative paths

---

## Complete File Structure

After implementing Phase 3:

```
scripts/mcp/
├── server.ts           # MCP server entry point
├── ranking.ts          # Hybrid ranking algorithms
└── tools/
    ├── search.ts       # search_code tool
    ├── goto.ts         # go_to_definition tool
    └── refs.ts         # find_references tool

.claude/
├── mcp.json            # MCP server configuration
└── state/
    ├── search.db       # SQLite FTS5 database (Phase 1)
    └── vectors.lance/  # LanceDB vectors (Phase 2)
```

---

## Success Criteria

- [ ] MCP server starts in < 2 seconds
- [ ] `search_code` returns results in < 200ms
- [ ] `go_to_definition` resolves cross-file references
- [ ] `find_references` finds all usages of a symbol
- [ ] Hybrid ranking surfaces relevant results from both search types
- [ ] Claude Code successfully connects and queries tools

---

## Verification Commands

```bash
# Start the MCP server manually (for testing)
npx tsx scripts/mcp/server.ts

# In another terminal, test with Claude Code
claude mcp list              # Should show "code-intel: connected"
claude mcp test code-intel   # Runs health check

# Test individual tools via Claude
# Ask Claude: "Search for form validation code"
# Claude should call search_code tool automatically
```

---

## Troubleshooting

### Server fails to start

```bash
# Check if databases exist
ls -la .claude/state/search.db
ls -la .claude/state/vectors.lance/

# If missing, run Phase 1 and Phase 2 first
just scip-index
just embed-code
```

### Ollama connection refused

```bash
# Ensure Ollama is running
ollama serve

# Or via Docker
docker compose up -d ollama

# Verify model is available
ollama list  # Should show nomic-embed-text
```

### Claude Code does not see the server

```bash
# Check mcp.json syntax
cat .claude/mcp.json | jq .

# Restart Claude Code after config changes
# MCP servers are loaded on startup
```

### Slow semantic search

```bash
# Check LanceDB index size
du -sh .claude/state/vectors.lance/

# If very large, consider reducing chunk count
# or upgrading to SSD storage
```

---

## References

- [MCP TypeScript SDK v1.x](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Reciprocal Rank Fusion Paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [LanceDB Vector Search](https://lancedb.github.io/lancedb/)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)
