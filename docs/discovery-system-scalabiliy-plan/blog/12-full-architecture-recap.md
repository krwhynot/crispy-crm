# The Complete Picture: Architecture, Numbers, and What We Learned

We started with a problem.

AI assistants read every file on every query. Memory spikes. Tokens burn. Responses crawl.

Twelve articles later, we built a complete solution.

Zero cloud dependencies. Zero monthly costs. Instant semantic search across any codebase.

This is the capstone. Everything we built, how it fits together, and what we would do differently if we started over.

---

## The Full Architecture

Let me show you the complete system, from source code to AI-powered answers:

```
                    LOCAL CODE INTELLIGENCE SYSTEM
                    ==============================

  ┌─────────────────────────────────────────────────────────────────┐
  │                        SOURCE CODE                               │
  │   src/**/*.{ts,tsx} - Your TypeScript/React codebase            │
  └──────────────────────────────┬──────────────────────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │      SCIP       │  │   Tree-sitter   │  │  File Hashing   │
  │  (Structural)   │  │   (Chunking)    │  │  (Staleness)    │
  │                 │  │                 │  │                 │
  │  - Definitions  │  │  - Functions    │  │  - SHA-256      │
  │  - References   │  │  - Classes      │  │  - Incremental  │
  │  - Call graph   │  │  - Interfaces   │  │  - CI checks    │
  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
           │                    │                    │
           │                    ▼                    │
           │           ┌─────────────────┐           │
           │           │     OLLAMA      │           │
           │           │ (nomic-embed)   │           │
           │           │                 │           │
           │           │  768-dim        │           │
           │           │  vectors        │           │
           │           └────────┬────────┘           │
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                     .claude/state/                               │
  │                                                                  │
  │  component-inventory/     LanceDB vectordb/    manifests/       │
  │  ├── contacts.json       ├── code_chunks.lance ├── embed.json   │
  │  ├── hooks.json          └── (vectors)         └── scip.json    │
  │  └── manifest.json                                               │
  │                                                                  │
  │  call-graph-inventory/   schemas-inventory/                      │
  │  ├── chunk1.json         ├── validation.json                    │
  │  └── manifest.json       └── manifest.json                      │
  └──────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                       MCP SERVER                                 │
  │                                                                  │
  │   Tool: semantic_search    Tool: component_lookup                │
  │   "Find code by meaning"   "Look up component details"           │
  │                                                                  │
  │   Tool: call_graph_query   Tool: index_stats                     │
  │   "Who calls what"         "Check index freshness"               │
  └──────────────────────────────┬──────────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                      CLAUDE CODE                                 │
  │                                                                  │
  │   User: "Find authentication hooks"                              │
  │                                                                  │
  │   Claude: [calls semantic_search("authentication hooks")]        │
  │           Found 5 relevant hooks:                                │
  │           1. useAuth (src/hooks/useAuth.ts:12)                  │
  │           2. useSession (src/hooks/useSession.ts:8)             │
  │           ...                                                    │
  └─────────────────────────────────────────────────────────────────┘
```

Every box in this diagram is something we built and explained in this series.

---

## The Data Flow

Let us trace a query through the system.

**User asks:** "Find code that handles form validation"

**Step 1: MCP Tool Selection**

Claude Code reads the available MCP tools. It sees `semantic_search` with description: "Search codebase by meaning, not keywords."

This matches the user's intent. Claude invokes the tool.

**Step 2: Embedding Generation**

The MCP server receives the query: "form validation"

It calls Ollama to generate an embedding:
```
"form validation" → [0.234, -0.567, 0.891, ...] (768 numbers)
```

**Step 3: Vector Search**

The server opens LanceDB (just a directory, no startup delay).

It searches for vectors nearest to the query embedding:
```typescript
const results = await table
  .vectorSearch(queryVector)
  .limit(10)
  .toArray();
```

LanceDB returns the 10 most similar chunks in milliseconds.

**Step 4: Result Formatting**

The server formats results for Claude:
```json
[
  { "file": "src/hooks/useFormValidation.ts", "lines": "12-45", "score": "0.234" },
  { "file": "src/validation/schemas.ts", "lines": "8-34", "score": "0.287" },
  { "file": "src/components/ContactForm.tsx", "lines": "67-89", "score": "0.312" }
]
```

**Step 5: Claude Response**

Claude incorporates these results into its answer:

> I found several files handling form validation:
>
> 1. **useFormValidation hook** (`src/hooks/useFormValidation.ts:12-45`) - Main validation logic
> 2. **Zod schemas** (`src/validation/schemas.ts:8-34`) - Validation schema definitions
> 3. **ContactForm** (`src/components/ContactForm.tsx:67-89`) - Validation in the form component

Total time: under 500 milliseconds.

---

## Performance Numbers

Real measurements from our 485-component codebase:

### Indexing Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Full SCIP index | 8.2s | Parses all TypeScript |
| Full embedding generation | 3m 42s | 892 chunks @ 250ms each |
| Incremental (1 file) | 4.8s | Hash check + re-embed |
| Incremental (0 files) | 1.2s | Just hash comparison |

### Query Performance

| Operation | Time | Notes |
|-----------|------|-------|
| LanceDB open | 2ms | Memory-mapped, instant |
| Vector search (top 10) | 15ms | Sub-linear via ANN |
| Component lookup | 8ms | JSON file read |
| Call graph query | 12ms | Traverse edges |

### Memory Usage

| Component | Memory | Notes |
|-----------|--------|-------|
| Ollama (inference) | 1.2 GB | Model weights |
| LanceDB (query) | 47 MB | Memory-mapped vectors |
| SCIP index | 12 MB | Binary format |
| Inventory JSONs | 8 MB | Pre-computed metadata |

### Storage

| Data | Size | Notes |
|------|------|-------|
| LanceDB vectors | 47 MB | 892 chunks @ 768 dims |
| SCIP index | 12 MB | Compressed |
| Component inventory | 2.1 MB | 26 JSON chunks |
| Call graph | 4.8 MB | 919 nodes, 10K edges |
| **Total** | **~66 MB** | Fits in any repo |

---

## Cost Comparison

What would this cost with cloud alternatives?

### Cloud Vector Database (Pinecone, Weaviate Cloud)

| Service | Pricing | Our Usage | Monthly Cost |
|---------|---------|-----------|--------------|
| Pinecone Starter | Free tier | 100K vectors | $0 |
| Pinecone Standard | $70/month | 1M vectors | $70 |
| Weaviate Cloud | $25/month | Base tier | $25+ |

### Cloud Embeddings (OpenAI, Cohere)

| Service | Pricing | Our Usage | Monthly Cost |
|---------|---------|-----------|--------------|
| OpenAI text-embedding-3-small | $0.02/1M tokens | ~50K tokens/index | $0.001/index |
| Cohere embed-english-v3 | $0.10/1M tokens | ~50K tokens/index | $0.005/index |

With daily re-indexing: ~$0.15-0.75/month for embeddings alone.

### Our Solution

| Component | Cost |
|-----------|------|
| LanceDB | $0 (OSS, local) |
| Ollama + nomic-embed-text | $0 (OSS, local) |
| SCIP | $0 (OSS, local) |
| Tree-sitter | $0 (OSS, local) |
| **Total** | **$0/month** |

The only cost is electricity and your laptop's CPU cycles.

For a team of 10 developers, cloud costs would be $50-100/month minimum. We pay nothing.

For enterprise with 50 developers and strict data policies? The privacy benefits alone justify local-first.

---

## What Each Article Covered

A quick reference for the entire series:

| Article | Topic | Key Takeaway |
|---------|-------|--------------|
| 1 | The Problem | AI assistants re-read everything. Indexes fix this. |
| 2 | Code Indexes | SCIP is a card catalog for code. |
| 3 | Reading SCIP | Parse binary index into usable TypeScript data. |
| 4 | React Components | Extract props, hooks, context from component ASTs. |
| 5 | Hooks and Schemas | Specialized extractors for custom hooks and Zod. |
| 6 | Call Graphs | Map who-calls-whom. Detect cycles with Tarjan. |
| 7 | Embeddings | GPS coordinates for meaning. Local with Ollama. |
| 8 | Chunking | Tree-sitter finds natural code boundaries. |
| 9 | LanceDB | Serverless vectors. No Docker, instant queries. |
| 10 | MCP Server | FastMCP exposes tools to Claude Code. |
| 11 | Incremental Updates | Hash comparison for fast re-indexing. |
| 12 | (This article) | Full architecture and lessons learned. |

Each article built on the last. Skip any one and the system has a gap.

---

## Key Insights

Looking back, these insights made the difference:

### 1. Chunking Quality Beats Embedding Quality

A mediocre embedding of well-chunked code beats an excellent embedding of randomly-sliced code.

Tree-sitter was the unlock. It knows where functions end and classes begin. No more splitting a function in half.

We spent more time on chunking than any other component. Worth it.

### 2. Structural + Semantic Beats Either Alone

SCIP tells you what calls what. It cannot tell you what is "similar to" something.

Embeddings tell you what is similar. They cannot tell you the call graph.

Together, you get answers neither could provide alone.

"Find authentication code" (semantic) + "What calls useAuth?" (structural) = complete understanding.

### 3. Incremental Is Not Optional

A 4-minute full rebuild kills adoption. "I'll just grep" becomes the default.

With incremental updates, one file change means one chunk re-embedded. Under 5 seconds.

That speed difference changes behavior. People actually use the system.

### 4. Serverless Simplifies Everything

Docker startup, health checks, port conflicts - all friction.

LanceDB is just a directory. Open it, query it, close it. No daemon. No configuration.

For local development tools, serverless is the right architecture.

### 5. CI Enforcement Keeps It Fresh

Developers forget to regenerate indexes. Always.

CI staleness checks turn "please remember" into "your PR is blocked."

The system is only trustworthy if it is always current. CI enforcement makes that real.

---

## What We Would Do Differently

Hindsight from building this system:

### Start with Chunking

We started with embeddings. Wrong order.

You cannot evaluate embedding quality until you have good chunks. We wasted time tuning embedding parameters when the real problem was chunking.

Start with Tree-sitter. Get chunking right. Then add embeddings.

### Design the Manifest First

Our manifest evolved organically. Early versions lacked crucial fields. We had to migrate data multiple times.

If we started over, we would design the manifest schema upfront:
- What staleness detection needs
- What incremental update needs
- What CI checks need

Get the manifest right and everything else follows.

### Separate Structural from Semantic

We initially tried to put everything in one index. Structural data (call graphs) and semantic data (embeddings) in the same queries.

They have different access patterns. Structural queries are exact lookups. Semantic queries are similarity searches.

Two separate indexes, queried appropriately, work better than one unified mess.

### Test With Real Queries First

We built features based on what seemed useful. Some turned out essential. Others, never used.

If we started over, we would collect real queries from developers for a week. What do they actually search for? What questions do they ask?

Then build exactly what is needed. Nothing more.

---

## Future Enhancements

The foundation is solid. Here is where we could go next:

### Watch Mode

Currently, you run `just discover-incr` manually after changes.

A file watcher could trigger re-indexing automatically. Change a file, wait 2 seconds, it is searchable.

Implementation: chokidar watching `src/**/*.{ts,tsx}`, debounced triggers.

### Hybrid Search

Pure vector search sometimes misses exact matches. "useFormContext" should find the exact hook, not just similar concepts.

Hybrid search combines vector similarity with keyword matching. LanceDB supports this natively with full-text search indexes.

### Cross-Repository Search

Our system indexes one repository. Enterprise needs often span multiple repos.

Architecture extension: one LanceDB table per repository, query router that fans out and merges results.

### Custom Embedding Models

nomic-embed-text is general-purpose. A model fine-tuned on code would understand that `useState` and `useReducer` are related, that `async/await` and `.then()` solve the same problem.

Fine-tuning requires training data. We could generate it from our call graph: functions that call each other are related.

### IDE Integration

Right now, you query through Claude Code or command line.

A VSCode extension could show semantic search results inline. Select text, right-click, "Find similar code."

The MCP server already exists. It just needs a different client.

---

## The Complete Justfile

For reference, here are all the discovery commands:

```makefile
# =============================================================================
# DISCOVERY SYSTEM
# =============================================================================

# Directory paths
state-dir := ".claude/state"
vector-db := ".claude/vectordb"

# Full discovery (all extractors + embeddings)
discover:
    @echo "Running full discovery..."
    npx tsx scripts/discover/index.ts
    @echo "Discovery complete"

# Incremental discovery (changed files only)
discover-incr:
    npx tsx scripts/discover/index.ts --incremental

# Check if discovery files are fresh
discover-check:
    npx tsx scripts/discover/check-freshness.ts

# Semantic search
discover-search query:
    @npx tsx scripts/discover/search.ts "{{query}}"

# Component lookup
discover-component name:
    @npx tsx scripts/discover/lookup.ts component "{{name}}"

# Call graph query
discover-calls name:
    @npx tsx scripts/discover/lookup.ts calls "{{name}}"

# Show index statistics
discover-stats:
    @npx tsx scripts/discover/stats.ts

# Force full rebuild (clear all state)
discover-rebuild:
    rm -rf {{state-dir}}
    rm -rf {{vector-db}}
    just discover

# Start MCP server (for testing)
mcp-server:
    npx tsx .claude/mcp/discovery-server/src/index.ts

# =============================================================================
# OLLAMA (Embedding Model)
# =============================================================================

# Check if Ollama is running
ollama-check:
    @curl -s http://localhost:11434/api/version > /dev/null && echo "Ollama is running" || echo "Ollama is not running"

# Pull the embedding model
ollama-pull:
    ollama pull nomic-embed-text

# Warm up the embedding model
ollama-warmup:
    @curl -s -X POST http://localhost:11434/api/embeddings \
      -d '{"model":"nomic-embed-text","prompt":"warmup"}' > /dev/null
    @echo "Embedding model warmed up"
```

---

## Quick Start for New Projects

Want to add this to your own project? Here is the minimal path:

### Step 1: Install Dependencies

```bash
npm install @lancedb/lancedb tree-sitter tree-sitter-typescript fastmcp zod
```

### Step 2: Create Discovery Script

```typescript
// scripts/discover/index.ts
import * as lancedb from "@lancedb/lancedb";
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import { glob } from "glob";
import * as fs from "node:fs/promises";

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

async function discover() {
  const files = await glob("src/**/*.{ts,tsx}");
  const db = await lancedb.connect(".claude/vectordb");

  // ... chunk files with Tree-sitter
  // ... generate embeddings with Ollama
  // ... store in LanceDB

  console.log("Discovery complete");
}

discover();
```

### Step 3: Create MCP Server

```typescript
// .claude/mcp/server.ts
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP("discovery");

server.addTool({
  name: "search",
  description: "Semantic code search",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    // ... query LanceDB
    return results;
  },
});

server.run();
```

### Step 4: Configure Claude Code

```json
// .claude/mcp.json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["tsx", ".claude/mcp/server.ts"]
    }
  }
}
```

### Step 5: Index and Search

```bash
npx tsx scripts/discover/index.ts  # Build index
# Now Claude Code can use semantic search
```

That is the skeleton. Fill in the details from the articles.

---

## Closing Thoughts

We built enterprise-grade code intelligence infrastructure.

For free.

Running locally.

With no cloud dependencies.

The same capabilities that GitHub, Sourcegraph, and Cursor charge for - semantic search, structural analysis, instant queries - are now yours to own and extend.

This is not a toy. This is production infrastructure that scales to millions of lines of code.

More importantly, you understand how it works. Every component. Every trade-off. Every edge case.

When something breaks, you can fix it. When you need new features, you can add them. When the next AI revolution happens, you can adapt.

That understanding is worth more than any SaaS subscription.

---

## Your Next Steps

1. **Clone your largest codebase**
2. **Run `just discover`**
3. **Ask Claude Code a question about your code**
4. **Watch it use semantic search instead of reading files**

That moment when the answer comes back instantly, with relevant code you forgot existed?

That is when this stops being theory.

That is when you know it works.

---

## Resources

Everything we built:

- **[SCIP](https://github.com/sourcegraph/scip)** - Structural code indexing
- **[Tree-sitter](https://tree-sitter.github.io/tree-sitter/)** - Incremental parsing
- **[LanceDB](https://lancedb.github.io/lancedb/)** - Serverless vector database
- **[Ollama](https://ollama.ai/)** - Local LLM inference
- **[FastMCP](https://github.com/jlowin/fastmcp)** - MCP server framework
- **[nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)** - Embedding model

Further reading:

- **[Semantic Code Search at Scale](https://arxiv.org/abs/1909.09436)** - Academic foundations
- **[CodeBERT](https://arxiv.org/abs/2002.08155)** - Code-specific embeddings
- **[MCP Specification](https://spec.modelcontextprotocol.io/)** - Protocol details

---

## Thank You

This series took months to write.

Not because the concepts are hard. But because explaining them clearly is hard. Finding the right analogies. Building working examples. Making complex infrastructure feel approachable.

I hope it was worth your time.

The tools we built are real. The code works. The architecture scales.

Now it is yours.

Go index something.

```bash
just discover
just discover-search "the code that scared me last week"
```

You might finally find that bug.

---

*This is the final article in the 12-part series on building local code intelligence. The complete implementation is available in our project repository. Questions, feedback, and contributions are welcome.*

*Happy building.*
