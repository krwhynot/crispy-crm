# Understanding the Discovery System Overhaul

You just opened `00-overview.md` and saw terms like "SCIP," "FTS5 trigram tokenizer," and "768-dimensional vector embeddings." Your eyes glazed over. That is completely normal.

This document exists because technical specifications are written for implementation, not comprehension. They assume you already know what SCIP does, why trigrams matter, and how embedding vectors work. You probably do not. Most developers do not.

So let us fix that. By the end of this document, you will understand what we are building, why we are building it, and what changes when it is done. You will not become an expert in compiler-based indexing. But you will know enough to follow along, ask smart questions, and recognize when something goes wrong.

---

## What Is the Discovery System in the First Place?

Imagine you just joined a company with 50,000 pages of documentation scattered across filing cabinets, desk drawers, and banker boxes in the basement. Someone asks you to find "that memo about the Johnson account from last quarter." What do you do?

You could open every drawer and read every page. That works when you have 50 documents. It becomes impossible at 50,000.

The Discovery System is like hiring a librarian. It reads everything once, creates an index of what exists and where, and then answers questions instantly. "Where is the Johnson memo?" becomes a 2-second lookup instead of a 2-hour search.

For code, the "documents" are source files. The "questions" are things like:
- "Where is the `useContactForm` hook defined?"
- "What files use the `Contact` type?"
- "Find code that handles form validation"

Currently, searching this codebase requires scanning files one by one. That takes 2 or more minutes for complex questions. The new system will answer those same questions in under 10 seconds.

---

## So What Is the Problem?

The current approach has three fatal flaws.

**Flaw 1: Text search is dumb.**

When you search for "Contact," plain text search finds every occurrence of those letters. It returns comments that say "// Contact form logic," variable names like `contactId`, and the actual `Contact` type definition. You wade through noise to find signal.

Worse, it cannot understand relationships. If you ask "what uses the Contact type," text search cannot answer. It just finds the word "Contact" and leaves you to figure out which matches are type usages versus coincidental string matches.

**Flaw 2: No cross-file understanding.**

Modern codebases split logic across dozens of files. The `ContactForm` component lives in one file. The `Contact` type lives in another. The Zod validation schema lives in a third. The database table definition lives in SQL migrations.

Plain text search treats each file as isolated. It cannot tell you that `ContactForm.tsx` at line 45 is using the `Contact` type from `types/contacts.ts` at line 12. You have to trace those connections manually.

**Flaw 3: Cannot understand intent.**

What if you do not know the exact name of what you are looking for?

"Show me the code that handles form validation errors" is a reasonable question. But text search requires exact matches. If the code uses `validationErrors` and you searched for "form errors," you get nothing.

Semantic search understands meaning. It knows that "form validation errors" and "validation error handling" and `displayFormErrors()` are all related concepts. Text search does not.

---

## Enter the New Architecture: The Three Librarians Approach

The new system has three specialized librarians, each with a different skill set.

**The Precision Librarian (SCIP + SQLite FTS5)**

This librarian read every file and created a card catalog. Not of words, but of code symbols: functions, types, variables, imports. It knows that `useContactForm` is defined at line 23 of `hooks/contacts.ts` and is used in 7 other files.

When you ask "go to definition of ContactSchema," it flips to the right card and gives you the exact location. No guessing. No scanning.

**The Meaning Librarian (LanceDB + Ollama)**

This librarian understands concepts, not just words. When you ask "find hooks that handle form validation," it does not search for those exact words. It finds code that does form validation, regardless of what the developers named things.

How? It read every piece of code and placed it on a "meaning map." Related concepts are near each other on the map. When you ask a question, it places your question on the same map and finds the closest matches.

**The Coordinator (MCP Server)**

Claude cannot talk directly to SQLite databases or vector stores. The MCP server is the translator. Claude asks questions in plain English. The MCP server converts those questions into database queries, gets results from both librarians, ranks the combined results, and returns answers.

---

## Let Me Make Sure I Have This Straight

Here is the full picture:

- **Source files** are the raw input. TypeScript, TSX, SQL migrations.

- **SCIP** is a compiler-based indexer. It understands code structure the same way the TypeScript compiler does. It generates an index file (`.scip`) containing every symbol, where it is defined, and where it is used.

- **SQLite FTS5** is a full-text search engine embedded in a single file. It stores the SCIP index data and supports instant lookup. The "trigram tokenizer" means it can match partial words like "ontact" finding "Contact."

- **Tree-sitter** parses code into chunks at semantic boundaries (functions, classes, types). This is smarter than just splitting by line count.

- **Ollama** runs locally on your machine. It converts code chunks into "embeddings"—768 numbers that represent the meaning of that code.

- **LanceDB** stores those embeddings in a file. When you search, it finds embeddings closest to your query's embedding.

- **FastMCP** is a framework for building MCP servers. Our server exposes three tools: `search_code`, `go_to_definition`, and `find_references`.

- **Claude Code** connects to the MCP server and uses these tools autonomously.

---

## Why Are We Doing This With Embedded Databases?

There are cloud services that do all of this. Elasticsearch for text search. Pinecone for vector search. Sourcegraph for code intelligence. Why not use those?

Three reasons: cost, speed, and simplicity.

**Cost.** Elasticsearch hosting starts at $50/month. Pinecone starts at $70/month. Sourcegraph enterprise is far more. Our approach costs $0/month. Everything runs from files on disk.

**Speed.** Cloud services add network latency. Every query takes 50-200ms just to reach the server and return. Embedded databases respond in under 5ms. When Claude makes dozens of queries during a complex task, those milliseconds add up.

**Simplicity.** Cloud services require accounts, API keys, Docker containers, health monitoring, backup strategies, and upgrade planning. Embedded databases are files. If something breaks, delete the file and regenerate. No DevOps expertise required.

The tradeoff is that we must build and maintain the indexing pipeline ourselves. That is what the 6-day implementation plan covers.

---

## What Happens Over Those 6 Days?

**Days 1-2: The Precision Layer**

We install `scip-typescript`, a tool that generates compiler-quality indexes for TypeScript projects. We run it on our codebase and get an `.scip` file containing every symbol and reference.

Then we parse that file and load its contents into a SQLite database. We configure FTS5 with the trigram tokenizer so partial matches work.

At the end of Day 2, `just search "useForm"` returns every hook with "Form" in the name, along with their exact file and line locations.

**Days 3-4: The Semantic Layer**

We install Tree-sitter and write a "chunker" that breaks source files into meaningful pieces. Not arbitrary 100-line chunks, but complete functions, complete types, complete components.

We install Ollama and the `nomic-embed-text` model. For each code chunk, we generate an embedding—768 numbers representing its meaning—and store it in LanceDB.

At the end of Day 4, `just semantic-search "form validation"` returns the most relevant code chunks, even if they do not contain those exact words.

**Days 5-6: The Integration Layer**

We build an MCP server using FastMCP. We implement three tools:
- `search_code`: Combines exact search (FTS5) with meaning search (LanceDB) and ranks results
- `go_to_definition`: Uses the SCIP index to jump directly to where a symbol is defined
- `find_references`: Uses the SCIP index to find everywhere a symbol is used

We configure Claude Code to connect to this server. At the end of Day 6, Claude can ask "where is useContactForm defined?" and get an immediate, precise answer.

---

## What Will Be Different When This is Done?

Today, asking Claude to find all usages of a type requires:
1. Claude running grep commands
2. Waiting 10-30 seconds for results
3. Parsing through false positives
4. Often missing some usages entirely

Time: 2+ minutes. Accuracy: 70-80%.

After the upgrade:
1. Claude calls `find_references("Contact")`
2. Gets complete, accurate results in under 200ms
3. No false positives. No missed references.

Time: Under 10 seconds. Accuracy: 100%.

For "find code that handles X" questions, the improvement is even larger. Today, Claude has to guess at naming conventions and run multiple searches. After the upgrade, semantic search finds conceptually related code regardless of naming.

Other specific improvements:
- **Go-to-definition** resolves cross-file imports instantly. No more "I cannot find where this is defined."
- **Incremental updates** take under 5 seconds. When you edit a file, the index updates without a full rebuild.
- **Zero external dependencies.** No Docker containers. No cloud accounts. No API keys to rotate.
- **Offline capable.** Everything runs locally. No internet required after initial setup.

---

## Do I Need to Know All This to Use the System?

No.

The commands are simple:
```bash
just discover          # Rebuild the full index
just search "pattern"  # Find exact matches
just mcp-start         # Start the MCP server
```

Claude handles the rest automatically. When you ask "find where Contact is used," Claude queries the MCP server behind the scenes. You do not need to know about SCIP or embeddings or SQLite.

Understanding the internals helps in two scenarios:

**Debugging.** If searches return unexpected results, knowing that FTS5 uses trigrams helps you understand why "ct" matches "Contact." If semantic search returns irrelevant results, knowing about embeddings helps you rephrase the query.

**Extending.** If you want to add support for Python files, or index a different codebase, understanding the architecture helps you know what to modify.

For day-to-day use, the system is a black box that answers questions faster and more accurately than before.

---

## Quick Glossary

**SCIP (Source Code Intelligence Protocol)**
A standard format for code intelligence data. Think of it as the compiler's memory, pre-computed and saved to disk. It knows what every symbol means, where it is defined, and where it is used. Created by Sourcegraph and used by GitHub and Meta.

**SQLite FTS5**
Full-Text Search version 5. A feature of SQLite that enables Google-like search over text. FTS5 is the search engine. SQLite is the database that contains it. It runs from a single file—no server required.

**Trigram**
A three-character slice. "Contact" becomes ["Con", "ont", "nta", "tac", "act", "cts"]. Searching for "tac" finds "Contact" because "tac" is one of its trigrams. This enables partial matching and typo tolerance.

**LanceDB**
A vector database that runs from a single folder. No server required. Just files on disk that store embeddings and support similarity search. Think of it as a meaning database that runs from a file.

**Ollama**
An application that runs AI models locally on your machine. Instead of sending data to OpenAI's servers, Ollama runs the models on your own CPU/GPU. We use it for embedding generation. Think of it as a local AI translator.

**Embeddings**
A list of numbers (768 in our case) that represents the meaning of text. Similar meanings produce similar numbers. "Form validation" and "input error checking" would have nearly identical embeddings. Think of embeddings as coordinates on a meaning map.

**Semantic Search**
Finding things by meaning rather than exact words. Traditional search requires matching characters. Semantic search matches concepts. "Form validation" finds code about "input checking" because they mean similar things.

**MCP (Model Context Protocol)**
A way for Claude to call external tools. Instead of just reading files, Claude can query databases, call APIs, and interact with systems through MCP servers. Think of it as Claude's API to talk to tools.

**Tree-sitter**
A parser that understands code structure. It knows where functions begin and end, which brackets belong together, and how to extract meaningful chunks from source files.

**Hybrid Ranking**
Combining exact match scores with semantic similarity scores. A result that matches both the exact words AND the meaning ranks higher than one that matches only one.

---

## What Happens Next?

The next three documents walk through each phase in detail:

1. **Phase 1: Precision Layer** (Days 1-2) - SCIP indexing and SQLite FTS5 setup
2. **Phase 2: Semantic Layer** (Days 3-4) - Tree-sitter chunking, Ollama embeddings, LanceDB storage
3. **Phase 3: Integration Layer** (Days 5-6) - FastMCP server connecting Claude to both layers

Each phase builds on the previous one. Do not skip ahead.

If you are implementing this migration, start with Phase 1. If you are just trying to understand the system, keep reading the overviews before diving into the details.

---

## Final Note

The technical overview document is 700 lines of specifications, code examples, and diagrams. This explanation is 280 lines of context. Both are necessary.

The specification tells implementers exactly what to build. This explanation tells everyone else what is being built and why it matters.

If you read both and still have questions, that is a documentation failure. Ask. The answer probably belongs in one of these documents.
