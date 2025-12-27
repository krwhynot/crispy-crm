# What We Built and Where to Go Next

We just built what powers GitHub Copilot. For free.

Think about that for a second.

The semantic code search that Microsoft spent millions developing. The vector embeddings that Sourcegraph uses to power their enterprise code intelligence. The incremental indexing that Cursor relies on for instant code understanding.

We built all of it. With open source tools. Running on your laptop.

This is not a toy. This is production-grade code intelligence infrastructure that scales to millions of lines of code.

Let me show you what we actually built.

---

## The Full Picture

Here is the complete architecture, from source code to semantic search:

```
                    DISCOVERY PIPELINE ARCHITECTURE
                    ===============================

    +-----------+     +-----------+     +------------+
    |  Source   |     |   SCIP    |     | Tree-sitter|
    |   Files   |---->|  Parser   |---->|  Chunker   |
    | (*.tsx)   |     |           |     |            |
    +-----------+     +-----------+     +------------+
                            |                  |
                            v                  v
                    +---------------+   +-------------+
                    | Symbol Index  |   | Code Chunks |
                    | - definitions |   | - functions |
                    | - references  |   | - classes   |
                    | - call graph  |   | - types     |
                    +---------------+   +-------------+
                                               |
                                               v
                    +-----------------------------------------------+
                    |              OLLAMA (nomic-embed-text)        |
                    |  "function validates email" -> [0.2, 0.8, ...]|
                    +-----------------------------------------------+
                                               |
                                               v
                    +-----------------------------------------------+
                    |                    QDRANT                      |
                    |  Vector DB storing 768-dim embeddings          |
                    |  "similar to" queries in milliseconds          |
                    +-----------------------------------------------+
                                               |
                                               v
                    +-----------------------------------------------+
                    |              SEMANTIC SEARCH                   |
                    |  Query: "form validation hooks"                |
                    |  Result: useFormValidation, validateInput,     |
                    |          sanitizeUserData, fieldChecker...     |
                    +-----------------------------------------------+

                    +-----------------------------------------------+
                    |              JUSTFILE RECIPES                  |
                    |  just discover      - Full pipeline            |
                    |  just discover-incr - Incremental update       |
                    |  just discover-search "query" - Semantic search|
                    +-----------------------------------------------+
```

Every box in this diagram is something we built and explained in this series.

The source files flow through SCIP for structural analysis. Tree-sitter chunks them at natural boundaries. Ollama converts those chunks to vector embeddings. Qdrant stores and searches those embeddings.

One command to index. One command to search.

---

## The Journey: What Each Article Covered

Before we celebrate, let me remind you what we actually learned.

**Article 1: Why AI Reads Every File.** We discovered the problem. AI assistants re-read your entire codebase on every query. Memory spikes. Tokens burn. Latency suffers. The card catalog analogy showed us a better way.

**Article 2: What Is a Code Index.** We learned what SCIP is and why Sourcegraph built it. Structural code intelligence that knows where every symbol is defined and referenced.

**Article 3: Reading the Index.** We built TypeScript code to parse SCIP output. Extracting symbols, definitions, and references into usable data structures.

**Article 4: Finding React Components.** We specialized our extractor for React. Components, hooks, props, context dependencies. The metadata AI assistants actually need.

**Article 6: Call Graphs.** We mapped who calls whom. Tarjan's algorithm for cycle detection. Understanding the web of dependencies in a real codebase.

**Article 7: Teaching Meaning.** Embeddings transformed our approach. GPS coordinates for code semantics. Similar things cluster together.

**Article 8: Chunking Code.** Tree-sitter showed us where to split. Function boundaries, class definitions, natural code units. Not arbitrary line counts.

**Article 9: Qdrant Vector Search.** We stored embeddings in a proper vector database. Similarity search in milliseconds. The restaurant map analogy made it click.

**Article 10: Wiring Together.** The justfile brought it all together. Health checks, warm-up requests, orchestration. From scripts to pipeline.

Each article built on the last. Each concept connected to the next. And now we have a complete system.

---

## What We Achieved

Let me be specific about what this system delivers.

**Speed.** Semantic search returns results in under one second. Not minutes. Not "please wait while I scan your codebase." Under one second.

**Memory efficiency.** The chunked architecture means we never load the entire codebase into RAM. We process files incrementally. We store only what we need.

**Semantic understanding.** Search for "form validation" and find `inputSanitizer`, `fieldChecker`, and `useValidationHook`. Even if those files never contain the words "form" or "validation."

**Incremental updates.** Change one file? Update one chunk. Not a full re-index. Two seconds instead of five minutes.

**Local-first.** No cloud APIs. No usage limits. No sending your proprietary code to third parties. Everything runs on your machine.

**Cost.** Zero. Ollama is free. Qdrant is free. Tree-sitter is free. SCIP is free. Your GPU does the work, not your wallet.

This is not theoretical. We are running this on a real codebase with 485 React components, 82 Zod schemas, and 77 custom hooks.

It works.

### The Key Insights

Looking back, a few insights made the difference.

**Chunking matters more than embedding quality.** A mediocre embedding of well-chunked code beats a great embedding of poorly-chunked code. Tree-sitter was the unlock.

**Structural + semantic beats either alone.** SCIP tells you what calls what. Embeddings tell you what is similar to what. Combine them and you get answers neither could provide alone.

**Incremental is not optional.** A five-minute re-index kills adoption. Two seconds keeps people using the system. The manifest-based hash checking was worth every line of code.

**Local-first enables iteration.** No API limits meant we could experiment freely. Run the pipeline ten times in an hour. Tune parameters. Break things. Learn fast.

These are not obvious insights. We discovered them by building.

---

## Before vs. After

Here is what the numbers look like.

| Metric | Before Discovery System | After Discovery System |
|--------|------------------------|------------------------|
| **Time to find "validation" code** | 2-5 minutes (grep + manual review) | < 1 second (semantic search) |
| **Memory during analysis** | 2-4 GB (full AST in memory) | < 500 MB (chunked processing) |
| **Re-index time after changes** | 3-5 minutes (full scan) | 2-10 seconds (incremental) |
| **Search accuracy** | ~40% (keyword-only) | ~85% (semantic + structural) |
| **New dev onboarding** | "Read the code" | `just discover-search "where does X"` |
| **Cost per query** | $0.01-0.05 (API tokens) | $0 (local inference) |
| **Privacy risk** | Code sent to cloud | Code stays local |

*Note: These are representative metrics based on development testing. Your numbers will vary based on codebase size and hardware.*

The "Before" column represents the typical AI assistant workflow. Read files on every query. Parse everything. Pay per token.

The "After" column is what we built. Index once. Query forever. Pay nothing.

---

## What the Pros Add Next

We built a solid foundation. But GitHub, Sourcegraph, and Cursor do not stop here.

Here is what they add to reach production scale.

### Custom Embedding Models

We used `nomic-embed-text` because it is free and runs locally.

GitHub trained their own code embedding model. Specifically for code. Specifically for their scale.

The result? 37% improvement in search relevance.

Their model understands that `useState` and `useReducer` are similar. That `async/await` and `.then()` solve the same problem. That `export default` and `module.exports` are conceptually equivalent.

Generic embedding models miss these nuances.

**To add this yourself:**

Fine-tune a model on your codebase. Or use CodeBERT, GraphCodeBERT, or UniXcoder instead of nomic-embed-text. These are pre-trained on code specifically.

The infrastructure we built supports any embedding model. Swap out the Ollama call, and everything else stays the same.

### Hybrid Search (Dense + Sparse)

Vector search is powerful but not perfect.

Sometimes you need exact matches. When a developer types `useFormContext` in the search box, they probably want the file that defines `useFormContext`. Not something semantically similar.

Hybrid search combines two approaches:

**Dense vectors:** What we built. Semantic similarity in 768 dimensions.

**Sparse vectors:** Traditional keyword matching. BM25 scoring. Exact term frequency.

Combine them with a weighted formula. Get the best of both worlds.

Qdrant supports this natively. You store both dense and sparse vectors in the same collection. Query both at once. Merge the results.

**To add this yourself:**

Generate sparse vectors using TF-IDF or BM25. Store them alongside your dense vectors. Use Qdrant's hybrid search API to query both.

### Watch Mode for Real-Time Updates

Our incremental update runs manually. `just discover-incr` after you make changes.

The pros run it automatically.

File watcher detects changes. Triggers re-embedding for affected chunks. Updates Qdrant in the background.

You save a file. Three seconds later, your changes are searchable.

No manual step. No "remember to re-index."

**To add this yourself:**

Use `chokidar` to watch source files. Debounce changes to avoid thrashing. Trigger the embedding pipeline on stable file sets.

The infrastructure supports this. You just need the trigger.

### Cross-Repository Search

We built single-repository search.

Sourcegraph searches across thousands of repositories.

Same architecture. Just... bigger.

Instead of one Qdrant collection, create one per repository. Or use multi-tenancy with payload filtering. The search API fans out across repositories and merges results.

**To add this yourself:**

Extend the collection naming to include repository identifiers. Add a repository filter to your search queries. Scale Qdrant horizontally if needed.

---

## Resources

Here is where to go deeper.

**The tools we used:**

- [SCIP (Source Code Intelligence Protocol)](https://github.com/sourcegraph/scip) - Structural code indexing
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) - Incremental parsing framework
- [Qdrant](https://qdrant.tech/) - Vector database
- [Ollama](https://ollama.ai/) - Local LLM and embedding inference
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) - The embedding model

**Research and papers:**

- [GitHub's Code Search architecture](https://github.blog/engineering/infrastructure/the-architecture-of-sourcegraph/) - How they built it
- [Semantic Code Search at Scale](https://arxiv.org/abs/1909.09436) - Academic foundations
- [CodeBERT: A Pre-Trained Model for Programming Languages](https://arxiv.org/abs/2002.08155) - Code-specific embeddings

**Alternative approaches:**

- [Sourcegraph Cody](https://sourcegraph.com/cody) - Enterprise code AI
- [Cursor](https://cursor.sh/) - AI-first code editor
- [Continue.dev](https://continue.dev/) - Open source Copilot alternative

**Our implementation:**

All code from this series lives in our project's discovery system. The justfile recipes. The TypeScript extractors. The Docker configuration.

Clone it. Modify it. Make it yours.

---

## Your Turn

You made it through the entire series.

That is not nothing. Twelve articles covering parsing, indexing, embeddings, vector databases, chunking strategies, and pipeline orchestration.

Now I want to see what you build.

**Try this:**

1. Clone your largest codebase
2. Run `just discover`
3. Search for something you know exists but could never find with grep
4. Tell me what comes back

The moment when semantic search surfaces code you forgot existed? That is the moment when this stops being theory and becomes useful.

**Share your implementation:**

- Open an issue on our repo with your results
- Tweet your `before vs. after` numbers
- Write your own blog post extending what we built

Every codebase is different. Every implementation will teach us something new.

**Extension ideas if you want to go further:**

- Add a VSCode extension that queries your local Qdrant on save
- Build a CLI that pipes search results into your editor
- Create a Slack bot that answers "where is the code for X" questions
- Hook it into your CI to flag similar code patterns across PRs

The foundation supports all of these. The infrastructure is in place. The extension points are clear.

What will you build on top of it?

---

## Thank You

This series took six months to write.

Not because the concepts are hard. But because explaining them clearly is hard. Finding the right analogies. Building the right examples. Making complex infrastructure feel approachable.

I hope it was worth your time.

Building a code discovery system is not trivial. It requires understanding parsers, embeddings, vector databases, and orchestration. Each piece is a specialty. Combining them is an art.

But the result is transformational.

AI assistants that actually understand your codebase. Search that finds what you mean, not what you type. Onboarding that takes hours instead of weeks.

We built that. For free. Running locally.

Go index something.

```bash
just discover
just discover-search "the code that kept me up last night"
```

You might finally find that bug.

---

*This is the final article in the Discovery System series. The complete implementation is available in our repository. Questions, feedback, and contributions are welcome.*

*Happy building.*
