# Discovery System Scalability Plan - Architecture Overview

> **Status:** Planning
> **Target:** 2M LOC TypeScript/React support at $0/month
> **Total Effort:** 6 days (3 phases)
> **Generated:** 2025-12-27

---

## Executive Summary

The codebase intelligence system will be rebuilt using embedded databases and compiler-based indexing to eliminate external service dependencies entirely. This architecture provides precise go-to-definition, regex search, and semantic queries through a unified MCP interface that Claude can query autonomously.

| Change | Current State | New State | Benefit |
|--------|---------------|-----------|---------|
| **Search Engine** | ripgrep / Qdrant | SQLite FTS5 (Embedded) | Instant exact/regex search; zero ops |
| **Semantic DB** | Managed Vector DB | LanceDB (File-based) | Serverless; in-process |
| **Intelligence** | Naive Text Search | SCIP (Compiler-based) | Precise Go-to-Definition |
| **Interface** | Manual Context Copy | MCP Server | Claude queries autonomously |

This plan provides a 6-day migration path to support 2M+ lines of code with zero monthly infrastructure cost.

---

## Phase Roadmap

```
Days 1-2              Days 3-4              Days 5-6
   │                     │                     │
   ▼                     ▼                     ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 1    │──▶│   PHASE 2    │──▶│   PHASE 3    │
│  Precision   │   │   Semantic   │   │ Integration  │
│    Layer     │   │    Layer     │   │    Layer     │
└──────────────┘   └──────────────┘   └──────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
   search.db         vectors.lance      code-intel MCP
   ────────          ────────────       ─────────────
   • SCIP index      • Tree-sitter      • FastMCP server
   • SQLite FTS5     • Ollama embed     • Hybrid search
   • Trigram tokens  • LanceDB store    • Claude connection
```

---

## Phase Details

### [Phase 1: Precision Layer](./01-phase-1-precision-layer.md) - Days 1-2

**Goal:** Generate SCIP index from TypeScript source and populate SQLite with trigram tokenizer for precise symbol resolution and fast text search.

| Task | File(s) | Effort |
|------|---------|--------|
| 1.1 Install scip-typescript | `package.json` | Trivial |
| 1.2 Generate SCIP index | `scripts/discover/scip/generate.ts` (NEW) | Low |
| 1.3 Parse SCIP protobuf | `scripts/discover/scip/parser.ts` (NEW) | Medium |
| 1.4 Create SQLite schema | `scripts/discover/scip/schema.sql` (NEW) | Low |
| 1.5 Populate FTS5 with trigrams | `scripts/discover/scip/populate.ts` (NEW) | Medium |
| 1.6 Verify symbol resolution | `scripts/discover/scip/verify.ts` (NEW) | Low |

**Key Deliverable:** `search.db` file with full-text search over symbols, references, and file contents

**Code Example - SCIP Index Generation:**

```typescript
// scripts/discover/scip/generate.ts
import { execSync } from 'child_process';
import { resolve } from 'path';

const PROJECT_ROOT = resolve(__dirname, '../../..');
const OUTPUT_PATH = resolve(PROJECT_ROOT, '.claude/state/index.scip');

export function generateScipIndex(): void {
  execSync(
    `npx scip-typescript index --output ${OUTPUT_PATH}`,
    { cwd: PROJECT_ROOT, stdio: 'inherit' }
  );
}
```

**Code Example - SQLite FTS5 Schema:**

```sql
-- scripts/discover/scip/schema.sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name,
  kind,
  file_path,
  line_number,
  documentation,
  tokenize = 'trigram'
);

CREATE TABLE definitions (
  id INTEGER PRIMARY KEY,
  symbol_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  kind TEXT NOT NULL,
  parent_symbol TEXT,
  UNIQUE(symbol_name, file_path, start_line)
);

CREATE TABLE references (
  id INTEGER PRIMARY KEY,
  symbol_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  is_definition BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (symbol_name) REFERENCES definitions(symbol_name)
);

CREATE INDEX idx_definitions_symbol ON definitions(symbol_name);
CREATE INDEX idx_references_symbol ON references(symbol_name);
CREATE INDEX idx_references_file ON references(file_path);
```

---

### [Phase 2: Semantic Layer](./02-phase-2-semantic-layer.md) - Days 3-4

**Goal:** Add vector embeddings for natural language code queries using local Ollama inference and LanceDB storage.

| Task | File(s) | Effort |
|------|---------|--------|
| 2.1 Install LanceDB | `package.json` | Trivial |
| 2.2 Install Tree-sitter | `package.json` | Trivial |
| 2.3 Create code chunker | `scripts/discover/embeddings/chunker.ts` (NEW) | Medium |
| 2.4 Configure Ollama embeddings | `scripts/discover/embeddings/embed.ts` (NEW) | Low |
| 2.5 Create LanceDB schema | `scripts/discover/embeddings/schema.ts` (NEW) | Low |
| 2.6 Build vector index | `scripts/discover/embeddings/index.ts` (NEW) | Medium |
| 2.7 Add semantic search CLI | `scripts/discover/embeddings/search.ts` (NEW) | Low |

**Key Deliverable:** `vectors.lance` dataset enabling natural language queries like "hooks that handle form validation"

**Code Example - Tree-sitter Code Chunking:**

```typescript
// scripts/discover/embeddings/chunker.ts
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

interface CodeChunk {
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  kind: 'function' | 'class' | 'interface' | 'component' | 'hook';
  name: string;
}

export function chunkFile(filePath: string, source: string): CodeChunk[] {
  const parser = new Parser();
  parser.setLanguage(TypeScript.typescript);

  const tree = parser.parse(source);
  const chunks: CodeChunk[] = [];

  // Walk AST to find semantic boundaries
  walkNode(tree.rootNode, filePath, source, chunks);

  return chunks;
}

function walkNode(
  node: Parser.SyntaxNode,
  filePath: string,
  source: string,
  chunks: CodeChunk[]
): void {
  const chunkableTypes = [
    'function_declaration',
    'arrow_function',
    'class_declaration',
    'interface_declaration',
    'type_alias_declaration',
  ];

  if (chunkableTypes.includes(node.type)) {
    chunks.push({
      content: source.slice(node.startIndex, node.endIndex),
      filePath,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      kind: mapNodeKind(node.type),
      name: extractName(node),
    });
  }

  for (const child of node.children) {
    walkNode(child, filePath, source, chunks);
  }
}
```

**Code Example - Ollama Embedding Pipeline:**

```typescript
// scripts/discover/embeddings/embed.ts
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });
const MODEL = 'nomic-embed-text';
const EMBEDDING_DIM = 768;

export async function embedChunk(text: string): Promise<number[]> {
  const response = await ollama.embeddings({
    model: MODEL,
    prompt: text,
  });

  if (response.embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Expected ${EMBEDDING_DIM} dimensions, got ${response.embedding.length}`);
  }

  return response.embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 10;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await Promise.all(batch.map(embedChunk));
    results.push(...embeddings);
  }

  return results;
}
```

---

### [Phase 3: Integration Layer](./03-phase-3-integration-layer.md) - Days 5-6

**Goal:** Expose unified search through MCP server for Claude Code integration with hybrid ranking.

| Task | File(s) | Effort |
|------|---------|--------|
| 3.1 Install FastMCP | `package.json` | Trivial |
| 3.2 Create MCP server scaffold | `scripts/mcp/server.ts` (NEW) | Low |
| 3.3 Implement `search_code` tool | `scripts/mcp/tools/search.ts` (NEW) | Medium |
| 3.4 Implement `go_to_definition` tool | `scripts/mcp/tools/goto.ts` (NEW) | Medium |
| 3.5 Implement `find_references` tool | `scripts/mcp/tools/refs.ts` (NEW) | Medium |
| 3.6 Add hybrid ranking | `scripts/mcp/ranking.ts` (NEW) | Low |
| 3.7 Configure Claude Code connection | `.claude/settings.json` | Low |

**Key Deliverable:** `code-intel` MCP server enabling Claude to query codebase autonomously

**Code Example - FastMCP Server:**

```typescript
// scripts/mcp/server.ts
import { FastMCP } from 'fastmcp';
import { searchCode } from './tools/search';
import { goToDefinition } from './tools/goto';
import { findReferences } from './tools/refs';

const server = new FastMCP('code-intel');

server.addTool({
  name: 'search_code',
  description: 'Search codebase using exact match, regex, or natural language',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      mode: {
        type: 'string',
        enum: ['exact', 'regex', 'semantic'],
        default: 'exact'
      },
      limit: { type: 'number', default: 20 },
    },
    required: ['query'],
  },
  execute: searchCode,
});

server.addTool({
  name: 'go_to_definition',
  description: 'Find definition of a symbol',
  parameters: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Symbol name' },
      file: { type: 'string', description: 'Current file for context' },
    },
    required: ['symbol'],
  },
  execute: goToDefinition,
});

server.addTool({
  name: 'find_references',
  description: 'Find all references to a symbol',
  parameters: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Symbol name' },
      includeDefinition: { type: 'boolean', default: true },
    },
    required: ['symbol'],
  },
  execute: findReferences,
});

server.start();
```

**Code Example - Hybrid Ranking:**

```typescript
// scripts/mcp/ranking.ts
interface SearchResult {
  filePath: string;
  line: number;
  content: string;
  exactScore: number;
  semanticScore: number;
}

export function hybridRank(
  exactResults: SearchResult[],
  semanticResults: SearchResult[],
  weights = { exact: 0.6, semantic: 0.4 }
): SearchResult[] {
  const combined = new Map<string, SearchResult>();

  // Normalize and combine scores
  for (const result of exactResults) {
    const key = `${result.filePath}:${result.line}`;
    combined.set(key, { ...result, semanticScore: 0 });
  }

  for (const result of semanticResults) {
    const key = `${result.filePath}:${result.line}`;
    const existing = combined.get(key);
    if (existing) {
      existing.semanticScore = result.semanticScore;
    } else {
      combined.set(key, { ...result, exactScore: 0 });
    }
  }

  // Calculate final scores and sort
  return Array.from(combined.values())
    .map(r => ({
      ...r,
      finalScore: r.exactScore * weights.exact + r.semanticScore * weights.semantic,
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}
```

---

## Architecture Comparison

### Before (ripgrep + Manual Context)

```
┌─────────────────────────────────────────────────────────┐
│                    User Workflow                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    rg "pattern" ──▶ Manual Review ──▶ Copy to Claude    │
│         │                                               │
│         └──▶ No semantic understanding                  │
│         └──▶ No cross-file resolution                   │
│         └──▶ Context window limits                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### After (Embedded Intelligence + MCP)

```
┌─────────────────────────────────────────────────────────┐
│                  Claude Code + MCP                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    Claude ──▶ code-intel MCP ──▶ Hybrid Search          │
│                     │                                   │
│         ┌──────────┴──────────┐                        │
│         ▼                     ▼                        │
│    ┌─────────┐          ┌──────────┐                   │
│    │ SQLite  │          │ LanceDB  │                   │
│    │  FTS5   │          │ Vectors  │                   │
│    │ (exact) │          │(semantic)│                   │
│    └────┬────┘          └────┬─────┘                   │
│         │                    │                         │
│         └────────┬───────────┘                         │
│                  ▼                                     │
│             SCIP Index                                 │
│        (Go-to-Definition)                              │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Zero external services ($0/month)
- Precise compiler-based navigation
- Natural language queries
- Claude queries autonomously
- <200ms response time

---

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Source Files                               │
│   src/**/*.ts, src/**/*.tsx, supabase/migrations/*.sql           │
└─────────────────────────┬────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │    SCIP     │ │ Tree-sitter │ │  Raw Text   │
   │  Compiler   │ │  AST Parse  │ │   Index     │
   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │ definitions │ │   chunks    │ │ symbols_fts │
   │ references  │ │  (semantic) │ │  (trigram)  │
   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          │               ▼               │
          │        ┌─────────────┐        │
          │        │   Ollama    │        │
          │        │  Embeddings │        │
          │        └──────┬──────┘        │
          │               │               │
          ▼               ▼               ▼
   ┌─────────────────────────────────────────────┐
   │              search.db (SQLite)             │
   │  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
   │  │ symbols │  │  refs   │  │   FTS5      │ │
   │  └─────────┘  └─────────┘  └─────────────┘ │
   └─────────────────────┬───────────────────────┘
                         │
   ┌─────────────────────┴───────────────────────┐
   │             vectors.lance (LanceDB)         │
   │  ┌─────────────────────────────────────────┐│
   │  │  768-dim vectors + metadata             ││
   │  └─────────────────────────────────────────┘│
   └─────────────────────┬───────────────────────┘
                         │
                         ▼
   ┌─────────────────────────────────────────────┐
   │           code-intel MCP Server             │
   │  ┌─────────────────────────────────────────┐│
   │  │ search_code | go_to_definition | refs   ││
   │  └─────────────────────────────────────────┘│
   └─────────────────────┬───────────────────────┘
                         │
                         ▼
   ┌─────────────────────────────────────────────┐
   │               Claude Code                   │
   └─────────────────────────────────────────────┘
```

---

## Tools & Dependencies

### Current Stack (Being Extended)

| Tool | Purpose | Status |
|------|---------|--------|
| **ripgrep** | Text search | Replaced by FTS5 |
| **tsx** | TypeScript execution | Unchanged |
| **just** | Task runner | Unchanged |
| **fast-glob** | File matching | Unchanged |

### New Dependencies

```json
{
  "devDependencies": {
    "scip-typescript": "^0.3.0",
    "better-sqlite3": "^11.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@lancedb/lancedb": "^0.15.0",
    "tree-sitter": "^0.22.0",
    "tree-sitter-typescript": "^0.22.0",
    "ollama": "^0.5.0",
    "fastmcp": "^1.0.0"
  }
}
```

### External Tools (Local Install)

| Tool | Version | Purpose | Cost |
|------|---------|---------|------|
| **Ollama** | 0.5+ | Local embedding inference | FREE |
| **nomic-embed-text** | v1.5 | 768-dim code embeddings | FREE |
| **SQLite** | 3.45+ | FTS5 trigram search | Built-in |

---

## Stack-Specific Features

### Supabase Bridge

Index SQL migrations for cross-layer navigation:

```
supabase/migrations/*.sql ──▶ SQLite FTS5
                                  │
                          "table contacts"
                                  │
                                  ▼
                    src/atomic-crm/validation/contacts.ts
```

### Zod Schema Linking

SCIP traces `z.infer<>` to TypeScript definitions:

```typescript
// SCIP resolves this chain:
z.infer<typeof contactSchema>
    │
    └──▶ contactSchema (validation/contacts.ts:15)
              │
              └──▶ Contact interface (types/contacts.ts:3)
```

### React Admin Resolution

Trigram search for resource string matching:

```
Query: "contacts resource"
          │
          ▼
FTS5 Trigram: "con" "ont" "nta" "tac" "act" "cts" "res" ...
          │
          ▼
Match: ContactList.tsx (resource="contacts")
```

---

## Success Criteria

### Phase 1 Completion
- [ ] `just scip-index` generates index in < 30 seconds
- [ ] SQLite database contains all symbols and references
- [ ] `just search "useForm"` returns accurate results
- [ ] Memory usage < 200MB during indexing

### Phase 2 Completion
- [ ] `just embed-code` processes codebase in < 60 seconds
- [ ] LanceDB vectors queryable via CLI
- [ ] `just semantic-search "form validation"` works
- [ ] Incremental updates for changed files only

### Phase 3 Completion
- [ ] MCP server starts in < 2 seconds
- [ ] `search_code` tool returns in < 200ms
- [ ] `go_to_definition` resolves cross-file references
- [ ] Claude Code successfully connects and queries

### Final Acceptance
- [ ] Full index rebuild < 60 seconds
- [ ] Query latency < 200ms (p95)
- [ ] RAM < 500MB idle
- [ ] Zero external service dependencies
- [ ] Incremental updates < 5 seconds

---

## Quick Reference

```bash
# === Phase 1: Precision ===
just scip-index                    # Generate SCIP index
just search "pattern"              # FTS5 trigram search

# === Phase 2: Semantic ===
just embed-code                    # Build vector embeddings
just semantic-search "query"       # Natural language search

# === Phase 3: Integration ===
just mcp-start                     # Start code-intel MCP server
just mcp-status                    # Check MCP health

# === Maintenance ===
just index-incremental             # Update changed files only
just index-verify                  # Validate index integrity
```

---

## File Structure

```
docs/discovery-system-scalabiliy-plan/
├── 00-overview.md                       ← You are here
├── 01-phase-1-precision-layer.md        ← Days 1-2: SCIP + SQLite
├── 02-phase-2-semantic-layer.md         ← Days 3-4: LanceDB + Ollama
└── 03-phase-3-integration-layer.md      ← Days 5-6: MCP Server

scripts/discover/
├── scip/                                ← Phase 1 outputs
│   ├── generate.ts                      # SCIP index generation
│   ├── parser.ts                        # SCIP protobuf parser
│   ├── schema.sql                       # SQLite FTS5 schema
│   ├── populate.ts                      # Index population
│   └── verify.ts                        # Validation script
│
├── embeddings/                          ← Phase 2 outputs
│   ├── chunker.ts                       # Tree-sitter code chunking
│   ├── embed.ts                         # Ollama embedding pipeline
│   ├── schema.ts                        # LanceDB schema
│   ├── index.ts                         # Vector index builder
│   └── search.ts                        # Semantic search CLI
│
└── mcp/                                 ← Phase 3 outputs
    ├── server.ts                        # FastMCP server
    ├── ranking.ts                       # Hybrid ranking logic
    └── tools/
        ├── search.ts                    # Hybrid search tool
        ├── goto.ts                      # Go-to-definition tool
        └── refs.ts                      # Find references tool

.claude/state/
├── search.db                            ← SQLite FTS5 database
├── vectors.lance/                       ← LanceDB vector store
└── index.scip                           ← SCIP index file
```

---

## Why This Architecture?

### SQLite FTS5 vs Elasticsearch/Qdrant

| Metric | Elasticsearch | Qdrant | SQLite FTS5 |
|--------|--------------|--------|-------------|
| **Deployment** | Docker/Cloud | Docker | Embedded |
| **RAM** | 2GB+ | 512MB+ | 50MB |
| **Cost** | $50+/month | $20+/month | $0 |
| **Latency** | 10-50ms | 5-20ms | <5ms |
| **Ops Burden** | High | Medium | Zero |

### LanceDB vs Pinecone/Weaviate

| Feature | Pinecone | Weaviate | LanceDB |
|---------|----------|----------|---------|
| **Pricing** | $70+/month | $25+/month | FREE |
| **Hosting** | Cloud-only | Cloud/Self | Embedded |
| **Cold Start** | 2-5s | 1-3s | 0ms |
| **Persistence** | Cloud | Docker volume | File-based |

### SCIP vs ts-morph

| Metric | ts-morph | SCIP |
|--------|----------|------|
| **Used By** | Small projects | Sourcegraph, GitHub, Meta |
| **Index Size** | N/A (in-memory) | ~1/8th of source size |
| **Memory** | Unbounded growth | Constant (disk-based) |
| **Speed** | O(n) per query | O(1) lookups |
| **Cross-file refs** | Slow resolution | Pre-computed |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **SCIP TypeScript version mismatch** | Pin scip-typescript version; test with project TS version |
| **Ollama not available** | Fallback to FTS5-only mode; document manual Ollama install |
| **Large codebase memory pressure** | Stream processing; batch SQLite inserts; incremental updates |
| **LanceDB breaking changes** | Pin version; add integration tests for vector queries |

---

## References

- [SCIP Protocol Specification](https://sourcegraph.com/docs/code-intelligence/scip)
- [scip-typescript](https://github.com/sourcegraph/scip-typescript)
- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)
- [FastMCP](https://github.com/jlowin/fastmcp)
- [Ollama](https://ollama.ai/)
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)
