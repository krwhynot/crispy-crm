# The Complete Picture: Everything We Built

Eleven articles. Twelve components. Zero cloud dependencies.

We started with a problem: AI assistants read your entire codebase for every question. They forget everything between queries. Tokens burn. Memory spikes. Latency compounds.

Now we have a solution.

Instant semantic search. Structural analysis. Call graphs. All running locally. All free.

This is the capstone. Everything connected. Lessons distilled. What we'd do differently.

---

## The Architecture in One Diagram

Here's the complete system:

```
SOURCE CODE → SCIP + Tree-sitter + File Hashing
                    ↓
            Ollama (embeddings)
                    ↓
        .claude/state/ + LanceDB
                    ↓
              MCP Server
                    ↓
             Claude Code
```

Five layers. Each does one thing well.

Your TypeScript files get parsed three ways. SCIP extracts structure—definitions, references, call relationships. Tree-sitter finds natural chunk boundaries. File hashing tracks what changed.

Ollama turns chunks into 768-dimensional vectors. GPS coordinates for meaning.

Everything lands in `.claude/state/`. JSON inventories for fast lookup. LanceDB for vector similarity.

The MCP server exposes tools. Claude Code calls them instead of reading files.

That's it.

---

## Following a Query

Let me trace what happens when you ask: "Find code that handles form validation."

**Step 1: Tool Selection**

Claude sees `semantic_search` in its available tools. Description: "Search by meaning, not keywords."

Perfect match. It calls the tool.

**Step 2: Embedding**

The MCP server receives "form validation."

Ollama converts it to numbers:

```
"form validation" → [0.234, -0.567, 0.891, ...768 values]
```

It's like translating a question into map coordinates.

**Step 3: Vector Search**

LanceDB opens instantly. No startup delay—it's just a directory.

```typescript
const results = await table
  .vectorSearch(queryVector)
  .limit(10)
  .toArray();
```

Fifteen milliseconds later: ten closest matches.

**Step 4: Response**

Claude gets back:

```
useFormValidation (src/hooks/useFormValidation.ts:12-45)
schemas (src/validation/schemas.ts:8-34)
ContactForm (src/components/ContactForm.tsx:67-89)
```

Total time? Under 500 milliseconds.

No file reading. No parsing. Just lookup.

---

## The Numbers

Real measurements from our 485-component codebase.

**Indexing:**

| Operation | Time |
|-----------|------|
| Full SCIP index | 8 seconds |
| Full embeddings | 3 minutes 42 seconds |
| Incremental (1 file changed) | 5 seconds |
| Incremental (nothing changed) | 1 second |

**Queries:**

| Operation | Time |
|-----------|------|
| LanceDB open | 2 ms |
| Vector search (top 10) | 15 ms |
| Component lookup | 8 ms |
| Call graph traversal | 12 ms |

**Memory:**

| Component | Size |
|-----------|------|
| Ollama inference | 1.2 GB |
| LanceDB queries | 47 MB |
| SCIP index | 12 MB |
| JSON inventories | 8 MB |

**Storage:**

| Data | Size |
|------|------|
| Vectors (892 chunks) | 47 MB |
| SCIP index | 12 MB |
| Component inventory | 2 MB |
| Call graph | 5 MB |
| **Total** | **~66 MB** |

That last number matters. Sixty-six megabytes. Fits in any repo. Commits cleanly. Syncs instantly.

---

## What Cloud Would Cost

Pinecone charges $70/month for their standard tier. Weaviate Cloud starts at $25/month.

OpenAI embeddings cost $0.02 per million tokens. Sounds cheap until you're re-indexing daily.

Our solution costs electricity.

That's it.

For a team of ten developers, cloud would run $50-100/month minimum. Enterprise with strict data policies? The privacy benefits alone justify local-first.

It's like owning versus renting. Higher upfront investment, but the asset is yours forever.

---

## The Series at a Glance

| Article | Topic | Key Insight |
|---------|-------|-------------|
| 1 | The Problem | Your AI has amnesia. Indexes fix this. |
| 2 | Code Indexes | SCIP is a card catalog for code. |
| 3 | Reading SCIP | Binary → TypeScript objects. |
| 4 | React Components | Extract props, hooks, context from ASTs. |
| 5 | Hooks and Schemas | Specialized extractors for custom patterns. |
| 6 | Call Graphs | Who calls whom. Tarjan detects cycles. |
| 7 | Embeddings | Meaning as coordinates. Ollama runs locally. |
| 8 | Chunking | Tree-sitter finds natural boundaries. |
| 9 | LanceDB | Serverless vectors. No Docker. |
| 10 | MCP Server | FastMCP exposes tools to Claude. |
| 11 | Incremental Updates | Hash comparison makes re-indexing fast. |
| 12 | This article | Everything connected. |

Skip any one and the system has a gap.

---

## Five Things That Made the Difference

**Chunking beats embedding quality.**

A mediocre embedding model on well-chunked code beats an excellent model on randomly sliced code.

Tree-sitter was the unlock. It knows where functions end. No more splitting code mid-statement.

We spent more time on chunking than any other component. Worth every hour.

**Structural plus semantic beats either alone.**

SCIP tells you what calls what. Can't tell you what's "similar to" something.

Embeddings tell you what's similar. Can't give you the call graph.

Together? Questions neither could answer alone.

"Find authentication code" (semantic) + "What calls useAuth?" (structural) = complete understanding.

It's like having both a GPS and a paper map. The GPS knows current conditions. The paper map shows relationships between places.

**Incremental updates aren't optional.**

A 4-minute rebuild kills adoption. "I'll just grep" becomes the default.

With incremental updates? One file change means one chunk re-embedded. Under 5 seconds.

Speed changes behavior. People actually use the system.

**Serverless simplifies everything.**

Docker startup. Health checks. Port conflicts. Container orchestration.

All friction. All eliminated.

LanceDB is just a directory. Open it, query it, close it. No daemon. No config file. No "is it running?" questions.

For local development tools, serverless is the only sensible architecture.

**CI enforcement keeps it fresh.**

Developers forget to regenerate indexes. Always. Every single one.

CI staleness checks turn "please remember" into "your PR is blocked."

The system is only trustworthy if it's always current. CI enforcement makes trust automatic.

---

## What We'd Do Differently

Hindsight is brutal. Here's what we learned the hard way.

**Start with chunking.**

We started with embeddings. Wrong order.

You can't evaluate embedding quality until you have good chunks. We wasted days tuning model parameters when the real problem was 200-line chunks splitting functions in half.

Start with Tree-sitter. Get chunking right. Then add embeddings.

It's like tuning a car's engine before checking if the wheels are attached.

**Design the manifest first.**

Our manifest evolved organically. Early versions lacked crucial fields. We migrated data three times.

If we started over? Design the manifest schema upfront:
- What staleness detection needs
- What incremental updates need
- What CI checks need

Get the manifest right and everything else follows.

**Separate structural from semantic.**

We initially tried putting everything in one index. Call graphs and embeddings. Exact lookups and similarity searches.

They have different access patterns. Structural queries are "find exactly this." Semantic queries are "find things like this."

Two separate indexes, queried appropriately, work better than one unified mess.

**Test with real queries first.**

We built features based on what seemed useful. Some turned out essential. Others? Never touched.

If we started over? Collect real queries from developers for a week. What do they actually search for? What questions do they ask?

Then build exactly what's needed. Nothing more.

---

## Where This Could Go

The foundation is solid. Here's what comes next.

**Watch mode.**

Currently you run `just discover-incr` manually after changes.

A file watcher could trigger re-indexing automatically. Change a file, wait 2 seconds, it's searchable.

It's like having your index auto-update instead of manually rebuilding.

**Hybrid search.**

Pure vector search sometimes misses exact matches. "useFormContext" should find the exact hook, not just similar concepts.

Hybrid search combines vector similarity with keyword matching. LanceDB supports this natively.

Best of both worlds.

**Cross-repository search.**

Our system indexes one repository. Enterprise needs span dozens.

Extension: one LanceDB table per repository, query router that fans out and merges results.

Same architecture, replicated.

**Custom embedding models.**

nomic-embed-text is general-purpose. A model fine-tuned on code would understand that `useState` and `useReducer` are related. That `async/await` and `.then()` solve the same problem.

We could generate training data from our call graph. Functions that call each other are related.

**IDE integration.**

Right now you query through Claude Code.

A VSCode extension could show results inline. Select text, right-click, "Find similar code."

The MCP server already exists. It just needs a different client.

---

## Quick Start for Your Project

Want this in your own codebase? Here's the minimal path.

**Install dependencies:**

```bash
npm install @lancedb/lancedb tree-sitter tree-sitter-typescript fastmcp zod
```

**Create the discovery script:**

```typescript
// scripts/discover/index.ts
import * as lancedb from "@lancedb/lancedb";
import Parser from "tree-sitter";

const parser = new Parser();
// ... chunk files with Tree-sitter
// ... embed with Ollama
// ... store in LanceDB
```

**Create the MCP server:**

```typescript
// .claude/mcp/server.ts
import { FastMCP } from "fastmcp";

const server = new FastMCP("discovery");
server.addTool({
  name: "search",
  description: "Semantic code search",
  execute: async ({ query }) => /* query LanceDB */
});
server.run();
```

**Configure Claude Code:**

```json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["tsx", ".claude/mcp/server.ts"]
    }
  }
}
```

**Run it:**

```bash
npx tsx scripts/discover/index.ts
# Now Claude Code has semantic search
```

That's the skeleton. Fill in details from the individual articles.

---

## The Commands

Everything you need:

```bash
just discover          # Full rebuild
just discover-incr     # Changed files only
just discover-check    # Verify freshness
just discover-search "authentication"  # Search
just discover-calls "useAuth"          # Call graph
just discover-stats    # Show statistics
```

One command to build. One command to search. That's the interface.

---

## What You Built

Enterprise-grade code intelligence infrastructure.

Free.

Local.

Zero cloud dependencies.

The same capabilities GitHub, Sourcegraph, and Cursor charge for—semantic search, structural analysis, instant queries—are now yours. To own. To extend. To modify.

This isn't a toy. This is production infrastructure that scales to millions of lines.

More importantly? You understand how it works.

Every component. Every trade-off. Every edge case.

When something breaks, you can fix it. When you need new features, you can add them. When the next AI revolution happens, you can adapt.

That understanding is worth more than any subscription.

---

## Your Move

Clone your largest codebase.

Run `just discover`.

Ask Claude Code a question about your code.

Watch it use semantic search instead of reading files.

That moment when the answer comes back instantly? With relevant code you forgot existed?

That's when theory becomes real.

That's when you know it works.

---

## Resources

What we built on:

- **[SCIP](https://github.com/sourcegraph/scip)** - Structural indexing
- **[Tree-sitter](https://tree-sitter.github.io/tree-sitter/)** - Incremental parsing
- **[LanceDB](https://lancedb.github.io/lancedb/)** - Serverless vectors
- **[Ollama](https://ollama.ai/)** - Local inference
- **[FastMCP](https://github.com/jlowin/fastmcp)** - MCP framework
- **[nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)** - Embedding model

Further reading:

- **[Semantic Code Search at Scale](https://arxiv.org/abs/1909.09436)**
- **[CodeBERT](https://arxiv.org/abs/2002.08155)**
- **[MCP Specification](https://spec.modelcontextprotocol.io/)**

---

## Thank You

This series took months.

Not because the concepts are hard. Because explaining them clearly is hard. Finding the right analogies. Building working examples. Making infrastructure feel approachable.

The tools are real. The code works. The architecture scales.

Now it's yours.

Go index something.

```bash
just discover
just discover-search "the code that scared me last week"
```

You might finally find that bug.

---

*Part 12 of 12: Building Local Code Intelligence*

*Happy building.*
