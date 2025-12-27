# Smart Chunking and LanceDB: Scaling Vector Search

You have 50,000 code chunks. You want the ten most relevant to your query.

The naive approach: compare against all 50,000.

That works. It takes 5 seconds.

Now imagine 500,000 chunks. Fifty seconds per query.

Now imagine real-time queries during development.

Unusable.

---

## The Library Shortcut

Imagine a library with a million books.

You want books about "machine learning in healthcare."

**Brute force:** Walk every shelf. Pull every book. Check if it matches.

You will be here until next week.

**The smarter way:** Check the catalog. Computer Science is on floor 3. Machine Learning in aisle 12. Healthcare Applications in row 7.

Go directly there. Maybe 50 books to check. Done in minutes.

Vector databases work the same way. They organize vectors into neighborhoods. When you search, you check only relevant neighborhoods.

This is the difference between O(n) and O(log n).

At 50,000 vectors? 50,000 comparisons versus 50.

At a million? A million versus 100.

The magic is in how you organize the neighborhoods.

---

## Why LanceDB

Several vector databases exist. Pinecone is cloud-hosted and expensive. Qdrant requires separate infrastructure. Milvus is enterprise-grade but heavyweight.

LanceDB is different.

**Embedded.** It runs in your process. No separate server. No network round trips. Just a library.

**File-based.** Data lives in Lance format files on disk. Git-friendly. Backupable.

**Zero dependencies.** Pure Rust. No Python runtime. No Docker.

**Fast.** Sub-millisecond queries on millions of vectors.

**Free.** MIT license. No usage fees.

For a discovery system running locally on developer machines, LanceDB is perfect.

---

## The Token Limit Problem

Before storing vectors, we need to create them. Here is the first problem.

A token limit is the maximum number of text units an embedding model can process at once. Exceed it and input gets truncated.

nomic-embed-text handles 8,192 tokens. Sounds like a lot.

A typical 500-line TypeScript file: about 1,250 tokens. Fits easily.

A 2,000-line file: about 6,250 tokens. Barely fits. Add verbose comments and you are over.

Here is what most people miss.

Large chunks produce vague embeddings. The meaning of a 2,000-line file is... everything it does. Too general to be useful for specific searches.

It is like asking someone to summarize their entire life in one sentence.

We need to chunk intelligently.

---

## Line-Based Chunking: Simple but Dumb

The obvious approach: split every N lines.

```typescript
function chunkByLines(content: string, maxLines: number): string[] {
  const lines = content.split('\n');
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join('\n'));
  }
  return chunks;
}
```

Easy to implement. Completely ignores code structure.

You cut functions in half. A chunk starts mid-statement. Context is lost.

It is like splitting a book by page count, ignoring chapters.

---

## Semantic Chunking: Harder but Smart

A semantic boundary is a natural division point in code: function declarations, classes, type definitions. Complete thoughts.

Split at these boundaries and chunks stay coherent.

```typescript
const CHUNK_BOUNDARIES = [
  'function_declaration', 'class_declaration',
  'interface_declaration', 'type_alias_declaration',
];

function findBoundaries(ast: AST): Range[] {
  const boundaries: Range[] = [];
  walk(ast, (node) => {
    if (CHUNK_BOUNDARIES.includes(node.type)) {
      boundaries.push({ start: node.startPosition, end: node.endPosition });
    }
  });
  return boundaries;
}
```

Each boundary becomes a chunk. Functions stay whole. Classes stay whole.

It is like splitting a book by chapter. Each piece makes sense on its own.

---

## The Context Problem

Even semantic chunks lose something.

Consider a function 100 lines into a file:

```typescript
// Top of file
import { z } from 'zod';
import { sanitizeHtml } from '../utils/security';

// 100 lines later...
export function validateContact(data: unknown) {
  const result = contactSchema.safeParse(data);
}
```

Chunk just the function and you lose the imports. The embedding does not know that `z` means Zod.

It is like reading a paragraph that references "the defendant" when you never read who the defendant is.

Solution: include context in each chunk.

```typescript
function enrichChunk(chunk: string, sourceFile: SourceFile) {
  const imports = extractImports(sourceFile);
  return [
    '// File: ' + sourceFile.getFilePath(),
    ...imports.map(i => i.getText()),
    '',
    chunk,
  ].join('\n');
}
```

The embedding now captures both the function and its dependencies.

---

## Overlap: Avoiding Hard Cuts

Sometimes even semantic boundaries are not enough.

A class method references a private field defined 50 lines above. The method chunks separately. The field definition is lost.

Overlap is when consecutive chunks share some content at their edges. The end of chunk N appears at the start of chunk N+1.

```typescript
function addOverlap(chunks: string[], overlapLines: number): string[] {
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const prevLines = chunks[i - 1].split('\n').slice(-overlapLines);
    return prevLines.join('\n') + '\n' + chunk;
  });
}
```

With 20 lines of overlap, the method chunk includes the preceding context.

The tradeoff: overlap increases storage. Each line appears in multiple chunks. But 10-20 lines of overlap is usually worth it.

It is like a TV show recap. "Previously on..." gives you enough context to follow the current episode.

---

## Metadata for Filtering

Embeddings capture meaning. Metadata captures structure.

When searching, you might want to constrain:
- "Find authentication code *in the components directory*"
- "Find Zod schemas *that are exported*"
- "Find hooks *that use useEffect*"

Metadata enables these filters:

```typescript
interface ChunkMetadata {
  filePath: string;
  kind: 'function' | 'class' | 'hook' | 'schema' | 'type';
  name: string | null;
  exported: boolean;
}
```

In LanceDB, you filter before similarity search:

```typescript
const results = await table
  .search(queryEmbedding)
  .where("kind = 'hook' AND exported = true")
  .limit(10)
  .execute();
```

If only 500 chunks are exported hooks, you search 500 vectors. Not 50,000.

It is like searching for mystery novels only in the mystery section, not the entire library.

---

## Setting Up LanceDB

Install it:

```bash
npm install @lancedb/lancedb
```

Create a database:

```typescript
import * as lancedb from '@lancedb/lancedb';

const db = await lancedb.connect('.claude/lancedb');
const table = await db.createTable('code_chunks', records);
```

That is it.

The database lives in `.claude/lancedb/`. Add it to `.gitignore`—you will regenerate on each machine rather than commit binary data.

---

## The Indexing Pipeline

Now the full flow: chunk code, generate embeddings, store in LanceDB.

```typescript
async function indexCodebase(sourceDir: string) {
  const db = await lancedb.connect('.claude/lancedb');
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`);
  const records: CodeRecord[] = [];

  for (const filePath of files) {
    const chunks = extractSemanticChunks(await readFile(filePath, 'utf-8'), filePath);
    for (const chunk of chunks) {
      const vector = await embed(prepareForEmbedding(chunk));
      records.push({ vector, content: chunk.content, ...chunk.metadata });
    }
  }
  await db.createTable('code_chunks', records);
}
```

Run the indexer. Output:

```
Found 485 files
Indexed 3247 chunks
```

The database now contains 3,247 searchable vectors.

One caveat: if you index with nomic-embed-text and later search with a different model, results are garbage. Different models produce incompatible vectors. Store the model name in metadata and validate on search.

---

## Searching

Search is simple:

```typescript
async function search(query: string) {
  const db = await lancedb.connect('.claude/lancedb');
  const table = await db.openTable('code_chunks');
  const queryVector = await embed(query);

  return table.search(queryVector).limit(10).execute();
}
```

Test it:

```bash
npx tsx search.ts "form validation"
```

Output:

```
[0.847] src/validation/schemas/contact.ts - contactSchema
[0.823] src/hooks/useFormValidator.ts - useFormValidator
[0.801] src/components/ContactForm.tsx - ContactForm
```

No keyword matching. Pure meaning.

It is like asking a librarian "I need something about keeping data clean" and they know you mean validation schemas.

---

## Understanding HNSW

HNSW stands for Hierarchical Navigable Small World. It is the algorithm that makes vector search fast. Understanding it helps you tune performance.

Think of a social network.

At the top level: a few highly connected hubs. Celebrities. Influencers. They know everyone important.

At lower levels: regular people with fewer connections. They know their local community.

To find someone specific:
1. Start at a hub
2. Ask "who do you know closer to my target?"
3. Follow that connection
4. Repeat until stuck
5. Drop to a lower level
6. Repeat until found

For vectors: "connection" means nearby in vector space. "Hub" means a vector with many neighbors.

The result: logarithmic search time. O(log n) instead of O(n).

It is like asking for directions in a new city. Start with someone who knows the neighborhoods broadly, then get more specific.

Three parameters matter:

**ef_construction**: neighbors considered when building. Higher = better quality, slower indexing.

**ef_search**: neighbors considered when searching. Higher = better recall, slower queries.

**M**: connections per node. Higher = more memory, potentially better paths.

LanceDB defaults work for most cases. If recall seems low, bump ef_search.

---

## Chunk Size Sweet Spot

How big should chunks be?

**Too small (under 20 lines):** Individual statements lack context. Embeddings are noisy.

**Too large (over 300 lines):** Multiple concepts blur together. Embeddings become vague.

**Sweet spot (20-150 lines):** Complete functions. Sufficient context. Specific enough for precise matching.

It is like paragraphs in writing. Too short and ideas fragment. Too long and the reader loses the thread.

If most chunks exceed 200 lines, your chunking is too coarse. Split at more boundaries.

If most chunks are under 20 lines, you are over-fragmenting. Combine small declarations.

---

## Large Chunks Fail Silently

Here is a gotcha that will burn you.

If a chunk exceeds 8,192 tokens, Ollama truncates. No error. Just incomplete embedding.

Your search results become mysteriously bad for large files.

Validate before embedding:

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

if (estimateTokens(chunk.content) > 7500) {
  console.warn(`Chunk too large: ${chunk.filePath}`);
}
```

Better to catch this explicitly than wonder why certain files never match.

---

## Cold Start Tax

First query after loading is slow. Indexes load from disk into memory.

Warm up at startup:

```typescript
const warmupVector = await embed("warmup");
await table.search(warmupVector).limit(1).execute();
```

Now real queries are fast.

It is like warming up a car engine before driving. The first minute is sluggish, then smooth.

---

## The Complete Picture

Build index:

```typescript
await buildSemanticIndex('./src');
```

Search:

```typescript
const results = await semanticSearch("authentication middleware", {
  kind: 'function',
  limit: 5,
});
```

Results in milliseconds.

Semantic queries return relevant code without keyword matching. The meaning matters, not the exact words.

---

## What is Next

We have fast, scalable vector search. Semantic queries return relevant code in milliseconds.

But this is still a standalone system.

The next article wires everything together: SCIP indexes for structure, vector embeddings for semantics, incremental updates for freshness.

The discovery system becomes a cohesive whole.

---

## Quick Reference

**Install:**
```bash
npm install @lancedb/lancedb
```

**Create and search:**
```typescript
const db = await lancedb.connect('.claude/lancedb');
const table = await db.createTable('code_chunks', records);
const results = await table.search(queryVector).limit(10).execute();
```

**Chunk guidelines:**
- Minimum: 20 lines
- Maximum: 150 lines
- Sweet spot: 50-100 lines
- Overlap: 10-20 lines

**Key insight:** Semantic chunking at natural boundaries. Overlap for context. Metadata for filtering. HNSW for speed.

---

*Part 8 of 12: Building Local Code Intelligence*
