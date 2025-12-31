---
name: generate-patterns-scripts-mcp
directory: scripts/mcp/
complexity: MEDIUM
output: scripts/mcp/PATTERNS.md
---

# Generate PATTERNS.md for MCP Server Tools

## Context

The `scripts/mcp/` directory implements a Model Context Protocol (MCP) server that exposes code intelligence tools to Claude Code. This enables semantic code search, symbol navigation, and reference finding across the codebase.

**Key Technologies:**
- FastMCP framework for MCP protocol handling
- better-sqlite3 for FTS5 and SCIP symbol database
- LanceDB for vector embeddings
- Zod for input validation
- Reciprocal Rank Fusion (RRF) for hybrid search ranking

**Tools Exposed:**
- `search_code` - Hybrid FTS5 + vector semantic search
- `go_to_definition` - Jump to symbol definitions
- `find_references` - Find all symbol usages

## Phase 1: Exploration

Read the following files in order to understand the architecture:

### Core Server Files

| File | Purpose | Read For |
|------|---------|----------|
| `scripts/mcp/server.ts` | MCP server entry point | FastMCP setup, tool registration |
| `scripts/mcp/db.ts` | Database connection singleton | Connection pattern, WAL mode |
| `scripts/mcp/ranking.ts` | RRF ranking algorithm | Search result fusion logic |

### Tool Implementations

| File | Purpose | Read For |
|------|---------|----------|
| `scripts/mcp/tools/search.ts` | Hybrid search tool | FTS5 queries, vector search, graceful degradation |
| `scripts/mcp/tools/goto.ts` | Symbol definition lookup | SCIP database queries, parameterized SQL |
| `scripts/mcp/tools/refs.ts` | Reference finder | Cross-table joins, result formatting |

## Phase 2: Pattern Identification

Identify and document these 4 patterns:

### Pattern A: MCP Tool Definition

Structure for defining FastMCP-compatible tools:
- Zod schema for parameters with `.describe()` annotations
- `name` and `description` fields (multi-line with examples)
- `execute` function returning JSON string
- Success/error response types

### Pattern B: Hybrid Search with RRF Ranking

How FTS5 and vector search are combined:
- Parallel execution of both search types
- Reciprocal Rank Fusion formula: `1 / (k + rank)`
- Score aggregation for items in both result sets
- Graceful degradation when Ollama unavailable

### Pattern C: Database Query Patterns

SQLite query patterns used across tools:
- Parameterized queries (never string interpolation)
- FTS5 MATCH syntax with BM25 scoring
- SCIP table joins (symbols, documents, references)
- Result mapping to typed interfaces

### Pattern D: Error Handling and Graceful Degradation

How errors are handled without throwing:
- Never throw from MCP tools (return error objects)
- Structured error responses with `error` + `suggestion` fields
- Fallback behavior (FTS-only when vector fails)
- Console logging for debugging

## Phase 3: Generate PATTERNS.md

Generate the PATTERNS.md file with this structure:

```markdown
# MCP Server Patterns

{1-2 sentence description of the code intelligence MCP server}

## Architecture Overview

```
{ASCII diagram showing:
- server.ts at top registering tools
- db.ts providing singleton connection
- ranking.ts used by search tool
- tools/ directory with 3 tool implementations
- External dependencies (SQLite, LanceDB, Ollama)}
```

---

## Pattern A: MCP Tool Definition

{Description of the FastMCP tool structure}

**When to use**: When adding new code intelligence tools to the MCP server.

### Tool Structure

```typescript
// scripts/mcp/tools/{example}.ts
{Show complete tool export with:
- Zod schema with .describe()
- name and description
- execute function signature
- Response type handling}
```

**Key points:**
- {Zod validation requirement}
- {Return JSON.stringify() always}
- {Description format with examples}
- {Error response structure}

---

## Pattern B: Hybrid Search with RRF Ranking

{Description of the hybrid search approach}

**When to use**: When implementing search that benefits from both exact match and semantic similarity.

### RRF Algorithm

```typescript
// scripts/mcp/ranking.ts
{Show rrfRank function with formula}
```

**Key points:**
- {Formula explanation}
- {k constant purpose}
- {Deduplication by file:line}
- {Source tracking (fts/vector)}

---

## Pattern C: Database Query Patterns

{Description of SQLite query patterns}

**When to use**: When querying the SCIP symbol database or FTS5 index.

### FTS5 Search

```typescript
// scripts/mcp/tools/search.ts
{Show FTS5 query with MATCH and BM25}
```

### Symbol Lookup

```typescript
// scripts/mcp/tools/goto.ts
{Show parameterized query with JOIN}
```

**Key points:**
- {Parameterized queries requirement}
- {FTS5 escaping for special characters}
- {Table relationships (symbols, documents, references)}
- {Column name mapping (snake_case to camelCase)}

---

## Pattern D: Error Handling

{Description of MCP-compatible error handling}

**When to use**: When any MCP tool operation can fail.

### Error Response

```typescript
// Pattern for error handling in MCP tools
{Show try/catch with structured error response}
```

### Graceful Degradation

```typescript
// scripts/mcp/tools/search.ts
{Show fallback when Ollama unavailable}
```

**Key points:**
- {Never throw from execute()}
- {Always return valid JSON}
- {Include actionable suggestions}
- {Log errors for debugging}

---

## Pattern Comparison Table

| Aspect | Tool Definition | Search Ranking | Database Queries | Error Handling |
|--------|-----------------|----------------|------------------|----------------|
| **Purpose** | Define MCP tools | Combine search sources | Query symbol data | Handle failures |
| **Key file** | tools/*.ts | ranking.ts | db.ts | All tools |
| **Zod usage** | Parameters | N/A | N/A | Error types |
| **Returns** | JSON string | RankedResult[] | Query rows | Error object |

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
```

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/scripts/mcp/PATTERNS.md
```

After writing, verify:
1. All file paths in examples reference existing files
2. Code examples are accurate to the actual implementation
3. ASCII diagram reflects the true architecture
4. Anti-patterns are real issues from the codebase
