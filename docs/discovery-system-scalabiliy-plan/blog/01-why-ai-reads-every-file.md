# Why Your AI Assistant Is Secretly Reading Every File

Every time you ask GitHub Copilot, Cursor, or Claude a question about your codebase, something expensive is happening behind the scenes.

Your AI assistant is reading files. Lots of them. Often the same files, over and over again.

---

## The Problem

Here is what happens when you ask "Where is the login function defined?":

1. The AI scans your project structure
2. It reads dozens (maybe hundreds) of files looking for clues
3. It parses each file to understand the code
4. It finally gives you an answer
5. Then it forgets everything it just learned

Next question? Repeat from step 1.

This is not just slow. It is expensive in every way that matters.

**Memory:** Each file gets loaded into RAM, parsed into an Abstract Syntax Tree, and held there while the AI thinks. A 100K line codebase can eat gigabytes of memory.

**Time:** Reading files from disk, parsing them, and analyzing them takes time. For large codebases, this can mean seconds of delay before you get an answer.

**Tokens:** If you are paying per-token (and you probably are), every file the AI reads costs money. Reading the same file ten times costs ten times as much.

The worst part? Most of this work is redundant. Your codebase does not change between questions. Why should the AI re-read everything?

---

## The Card Catalog Analogy

Imagine you are in a library with a million books.

You ask the librarian: "Where can I find books about React hooks?"

The librarian could do what your AI assistant does. Walk through every aisle. Pull every book off the shelf. Flip through the pages. Check if it mentions hooks. Put it back. Move to the next book.

Hours later, you have your answer.

Or the librarian could walk to the card catalog.

The card catalog does not contain the books. It contains *information about* the books. Titles, authors, subjects, locations. Enough to answer most questions without touching the actual books.

Need more detail? The card catalog tells you exactly which shelf to check.

This is the difference between scanning files on every query and maintaining an index.

The card catalog is built once. Updated when new books arrive. Consulted many times. The cost of building it is amortized across thousands of queries.

Your AI assistant needs a card catalog for your code.

---

## What the Pros Know

This is not a new problem. Every serious code intelligence tool has solved it.

**Sourcegraph** built SCIP (Source Code Intelligence Protocol). When you search their code intelligence platform, you are not searching raw files. You are querying a pre-computed index that knows where every symbol is defined, referenced, and used.

**GitHub** does the same thing. When you click "Go to Definition" in github.com, you are not waiting for GitHub to parse the entire repository. They indexed it when the code was pushed.

**Cursor** and **Cody** maintain local embeddings databases. They convert your code into vector representations and store them. When you ask a question, they search the vectors first to find relevant code, then read only what they need.

These tools share a common insight: the cost of reading files should happen once, not on every query.

The index is the product. Reading raw files is the tax you pay to build it.

---

## What We Are Building

We faced this problem in our own project.

Our discovery system extracts metadata from our React codebase. Components, hooks, Zod schemas, TypeScript types, call graphs. Everything an AI assistant might need to understand the code.

The naive approach: parse everything on every run.

The reality: our codebase hit the point where this approach started choking. Memory usage spiked. Extraction took minutes. And we are not even at "large codebase" scale yet.

So we are building our own card catalog.

Here is the core idea:

```
Before: Source Files -> Parse Every Time -> Answer

After:  Source Files -> Build Index Once -> Query Index -> Answer
                              |
                        (Update when files change)
```

The index stores exactly what AI assistants need: where things are defined, what depends on what, how pieces connect. Pre-computed, stored on disk, updated incrementally.

This is not revolutionary. It is just applying what Sourcegraph, GitHub, and every other serious tool already does, but locally, for a single project, without external dependencies.

The result? Instead of parsing 500 files to answer a question, we read a single JSON index file. Instead of hitting memory limits at scale, we stay under 500MB. Instead of minutes, we get answers in seconds.

[GOTCHA: TBD after implementation - actual performance numbers from before/after benchmarking]

---

## The Series Roadmap

This blog series documents everything we learned building this system.

Over the next 11 articles, we will cover:

**Part 2: The Discovery Generator Architecture**
How our current system works. The extractors, the chunking strategy, the incremental update logic. Understanding what we have before we improve it.

**Part 3: Why ts-morph Hits a Wall**
TypeScript's AST parser is powerful but hungry. We explore exactly where the memory and performance limits come from, with actual profiling data.

**Part 4: Enter SCIP - The Protocol Sourcegraph Uses**
What SCIP is, why it exists, and how it provides the same code intelligence that powers Sourcegraph at scale.

**Part 5: Migrating Extractors to SCIP Queries**
The practical work of replacing ts-morph with SCIP. What breaks, what improves, and how to maintain backward compatibility.

**Part 6: Adding Semantic Search with Vector Embeddings**
Beyond structural queries. How to ask "find code that handles authentication" and get useful results.

**Part 7: Self-Hosted Vector Search with Qdrant**
Running your own vector database locally. No cloud dependencies, no API costs, full privacy.

**Part 8: Embedding Code with Ollama**
Free, local embeddings with nomic-embed-text. How to convert code into searchable vectors without sending anything to an external API.

**Part 9: The Incremental Update Problem**
You changed one file. How do you update the index without rebuilding everything? Cache invalidation is hard, but not impossible.

**Part 10: Worker Threads for Parallel Extraction**
Using all your CPU cores. How to parallelize extraction without blowing up memory usage.

**Part 11: CI Integration and Freshness Guarantees**
Making sure the index is never stale. How to integrate with your build pipeline so the index updates automatically.

**Part 12: Lessons Learned and What We Would Do Differently**
Hindsight is 20/20. The mistakes we made, the surprises we encountered, and the advice we would give ourselves starting over.

Each article will include:
- The specific problem we were solving
- The approach we took (and alternatives we considered)
- Working code you can adapt
- Gotchas we discovered the hard way

---

## What's Next

[Part 2: The Discovery Generator Architecture](/docs/discovery-system-scalabiliy-plan/blog/02-discovery-generator-architecture.md) dives into our current system. Before we can improve it, we need to understand exactly what it does and why.

We will walk through the seven extractors, explain the chunking strategy, and show how incremental updates work. This is the foundation everything else builds on.

See you there.
