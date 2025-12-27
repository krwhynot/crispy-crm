# Smart Chunking and LanceDB: Scaling Vector Search

You have 50,000 code chunks. You want to find the ten most relevant to your query.

The naive approach: compute similarity against all 50,000. Return the top ten.

That works. It takes 5 seconds.

Now imagine 500,000 chunks. 50 seconds per query.

Now imagine real-time queries during development. Unusable.

This article is about making vector search fast. Really fast. Milliseconds fast.

---

## The Library Catalog Analogy

Imagine a library with a million books.

You are looking for books about "machine learning applications in healthcare."

**Brute force approach:** Walk through every shelf. Pull every book. Check if it matches. A million comparisons. You will be here until next week.

**Smart approach:** The library has a catalog. The catalog has sections. "Computer Science" on floor 3. "Machine Learning" in aisle 12. "Healthcare Applications" in row 7.

You go directly to floor 3, aisle 12, row 7. Maybe 50 books to check. Done in minutes.

Vector databases work the same way. They organize vectors into neighborhoods. When you search, you check only the relevant neighborhoods, not the entire database.

This is the difference between O(n) and O(log n). At 50,000 vectors, that is 50,000 comparisons vs. maybe 50. At a million vectors, it is a million vs. 100.

The magic is in how you organize the neighborhoods.

---

## Why LanceDB

Several vector databases exist. Pinecone is cloud-hosted and expensive. Qdrant is powerful but requires separate infrastructure. Milvus is enterprise-grade but heavyweight.

LanceDB is different.

**Embedded, not client-server.** LanceDB runs in your process. No separate database to deploy. No network round trips. Just a library.

**File-based storage.** Data lives in Lance format files on disk. Git-friendly. Backupable. Inspectable.

**Zero dependencies.** Pure Rust compiled to native code. No Python runtime. No Docker containers. Just import and use.

**Fast.** Sub-millisecond queries on millions of vectors. Modern approximate nearest neighbor algorithms.

**Free.** Open source. MIT license. No usage fees.

For a discovery system that needs to run locally on developer machines, LanceDB is perfect.

---

## The Token Limit Problem

Before storing vectors, we need to create them. And here is the first problem.

Embedding models have context limits. nomic-embed-text handles 8,192 tokens. That sounds like a lot until you try to embed a 500-line file.

A typical TypeScript file:
- 500 lines
- 5,000 characters
- ~1,250 tokens

That fits. But a large file:
- 2,000 lines
- 25,000 characters
- ~6,250 tokens

Still fits, but barely. Now add some verbose comments and you are over.

More importantly, large chunks produce vague embeddings. The meaning of a 2,000-line file is... everything it does. Too general to be useful for specific searches.

We need to chunk intelligently.

---

## Chunking Strategies

**Line-based chunking: Simple but dumb**

Split every N lines. Easy to implement. Completely ignores code structure.

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

Problem: you cut functions in half. A chunk might start mid-statement. Context is lost.

**Semantic chunking: Harder but smart**

Split at natural boundaries. Functions, classes, declarations. The chunk is a complete thought.

We covered semantic chunking in article 5. Here is the quick version:

```typescript
const CHUNK_BOUNDARIES = [
  'function_declaration',
  'class_declaration',
  'interface_declaration',
  'type_alias_declaration',
  'export_statement',
  'variable_declaration',
];

function findSemanticBoundaries(ast: AST): Range[] {
  const boundaries: Range[] = [];

  walk(ast, (node) => {
    if (CHUNK_BOUNDARIES.includes(node.type)) {
      boundaries.push({
        start: node.startPosition,
        end: node.endPosition,
      });
    }
  });

  return boundaries;
}
```

Each boundary becomes a chunk. Functions stay whole. Classes stay whole.

---

## Preserving Context: The Overlap Strategy

Even semantic chunks lose context.

Consider a function that references imports at the top of the file:

```typescript
// Top of file
import { z } from 'zod';
import { sanitizeHtml } from '../utils/security';

// 100 lines later...
export function validateContact(data: unknown) {
  const result = contactSchema.safeParse(data);
  // ...
}
```

If we chunk just the function, we lose the imports. The embedding does not know that `z` means Zod or that `sanitizeHtml` exists.

Solution: include context in each chunk.

```typescript
interface EnrichedChunk {
  content: string;      // The chunk itself
  context: string;      // Imports, type definitions, etc.
  metadata: ChunkMeta;
}

function enrichChunk(
  chunk: string,
  sourceFile: SourceFile
): EnrichedChunk {
  const imports = extractImports(sourceFile);
  const typeContext = extractRelevantTypes(sourceFile, chunk);

  const contextParts = [
    '// File: ' + sourceFile.getFilePath(),
    '// Imports:',
    ...imports.map(i => i.getText()),
    '// Related types:',
    ...typeContext.map(t => t.getText()),
    '',
    '// Code:',
    chunk,
  ];

  return {
    content: chunk,
    context: imports.join('\n'),
    metadata: {
      filePath: sourceFile.getFilePath(),
      imports: imports.map(i => i.getModuleSpecifier().getText()),
    },
  };
}
```

The embedding now captures both the function and its dependencies.

---

## Chunk Overlap: Avoiding Hard Cuts

Sometimes even semantic boundaries are not enough.

A class method references a private field defined 50 lines above. The method is chunked separately. The field definition is lost.

Solution: overlap chunks.

```typescript
function chunkWithOverlap(
  chunks: string[],
  overlapLines: number
): string[] {
  const overlapped: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const currentLines = chunks[i].split('\n');
    const prevLines = i > 0 ? chunks[i - 1].split('\n') : [];

    // Prepend overlap from previous chunk
    const overlap = prevLines.slice(-overlapLines).join('\n');
    const combined = overlap ? overlap + '\n' + chunks[i] : chunks[i];

    overlapped.push(combined);
  }

  return overlapped;
}
```

With 20 lines of overlap, the method chunk includes the preceding context. The field definition appears in the chunk.

Tradeoff: overlap increases storage and embedding cost. Each line appears in multiple chunks. Balance is key.

Recommendation: 10-20 lines of overlap for code. Enough for context, not so much that chunks become redundant.

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
  fileName: string;
  directory: string;
  kind: 'function' | 'class' | 'hook' | 'schema' | 'type' | 'other';
  name: string | null;
  exported: boolean;
  lineCount: number;
  dependencies: string[];  // Imports used
  language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
}
```

In LanceDB, metadata is stored alongside vectors and can be filtered before similarity search:

```typescript
const results = await table
  .search(queryEmbedding)
  .where("kind = 'hook' AND exported = true")
  .limit(10)
  .execute();
```

The filter reduces the search space. If only 500 chunks are exported hooks, you search 500 vectors, not 50,000.

---

## Setting Up LanceDB

Install LanceDB:

```bash
npm install @lancedb/lancedb
```

Create a database and table:

```typescript
// scripts/discover/embeddings/lancedb-setup.ts
import * as lancedb from '@lancedb/lancedb';

const db = await lancedb.connect('.claude/lancedb');

interface CodeRecord {
  vector: number[];
  content: string;
  filePath: string;
  kind: string;
  name: string;
  exported: boolean;
}

// Check if table exists
const tableNames = await db.tableNames();

let table;
if (tableNames.includes('code_chunks')) {
  table = await db.openTable('code_chunks');
} else {
  // Create table with first batch of records
  table = await db.createTable('code_chunks', initialRecords);
}
```

---

## Indexing Code Chunks

Now the full pipeline: chunk code, generate embeddings, store in LanceDB.

```typescript
// scripts/discover/embeddings/indexer.ts
import * as lancedb from '@lancedb/lancedb';
import { embed } from './ollama';
import { extractSemanticChunks } from './chunker';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

async function indexCodebase(sourceDir: string) {
  const db = await lancedb.connect('.claude/lancedb');

  // Find all source files
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/__tests__/**'],
  });

  console.log(`Found ${files.length} files`);

  const records: CodeRecord[] = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const chunks = extractSemanticChunks(content, filePath);

    for (const chunk of chunks) {
      // Prepare text for embedding
      const text = prepareForEmbedding(chunk);

      // Generate embedding
      const vector = await embed(text);

      records.push({
        vector,
        content: chunk.content,
        filePath: chunk.filePath,
        kind: chunk.kind,
        name: chunk.name || '',
        exported: chunk.exported,
      });

      // Progress
      if (records.length % 100 === 0) {
        console.log(`Processed ${records.length} chunks`);
      }
    }
  }

  // Create or replace table
  const tableNames = await db.tableNames();
  if (tableNames.includes('code_chunks')) {
    await db.dropTable('code_chunks');
  }

  await db.createTable('code_chunks', records);

  console.log(`Indexed ${records.length} chunks`);
}

function prepareForEmbedding(chunk: ChunkInfo): string {
  const parts = [
    `File: ${chunk.filePath}`,
    `Type: ${chunk.kind}`,
  ];

  if (chunk.name) {
    parts.push(`Name: ${chunk.name}`);
  }

  parts.push('');
  parts.push(chunk.content);

  return parts.join('\n');
}
```

Run the indexer:

```bash
npx tsx scripts/discover/embeddings/indexer.ts
```

Output:
```
Found 485 files
Processed 100 chunks
Processed 200 chunks
...
Indexed 3247 chunks
```

The database now contains 3,247 searchable vectors.

---

## Searching with LanceDB

Search is simple:

```typescript
// scripts/discover/embeddings/search.ts
import * as lancedb from '@lancedb/lancedb';
import { embed } from './ollama';

async function search(query: string, limit: number = 10) {
  const db = await lancedb.connect('.claude/lancedb');
  const table = await db.openTable('code_chunks');

  // Generate query embedding
  const queryVector = await embed(query);

  // Search
  const results = await table
    .search(queryVector)
    .limit(limit)
    .execute();

  console.log(`\nResults for: "${query}"\n`);

  for (const result of results) {
    const score = (1 - result._distance).toFixed(3);  // Convert distance to similarity
    console.log(`[${score}] ${result.filePath}`);
    console.log(`  ${result.kind}: ${result.name || '(anonymous)'}`);
    console.log(`  ${result.content.slice(0, 100)}...`);
    console.log();
  }
}

// Get query from command line
const query = process.argv.slice(2).join(' ');
search(query);
```

Test it:

```bash
npx tsx scripts/discover/embeddings/search.ts "form validation"
```

Output:
```
Results for: "form validation"

[0.847] src/validation/schemas/contact.ts
  schema: contactSchema
  export const contactSchema = z.strictObject({...

[0.823] src/hooks/useFormValidator.ts
  hook: useFormValidator
  export function useFormValidator<T extends z.ZodSchema>...

[0.801] src/components/ContactForm.tsx
  function: ContactForm
  export function ContactForm({ data }: Props) {...
```

Semantic search at work. No keyword matching. Pure meaning.

---

## Deep Dive: HNSW Algorithm

LanceDB uses HNSW (Hierarchical Navigable Small World) for fast similarity search. Understanding it helps you tune performance.

Imagine a social network graph.

At the top level, a few highly connected "hub" people. Celebrities, influencers. They know everyone important.

At lower levels, regular people with fewer connections. They know their local community.

To find someone specific:
1. Start at a hub
2. Ask "who do you know that's closer to my target?"
3. Follow that connection
4. Repeat until you reach someone who cannot point you closer
5. Drop to a lower level with more people
6. Repeat until you find your target

This is HNSW. The "hierarchical" part is the levels. The "navigable small world" part is the property that any person can reach any other in few hops.

For vectors:
- "Connection" means nearby in vector space
- "Hub" means a vector with many neighbors
- "Lower level" means a denser graph with more vectors

The result: logarithmic search time. O(log n) instead of O(n).

**HNSW parameters:**

`ef_construction`: How many neighbors to consider when building the graph. Higher = better quality, slower indexing.

`ef_search`: How many neighbors to consider when searching. Higher = better recall, slower search.

`M`: Maximum connections per node. Higher = more memory, potentially better paths.

For code search:
```typescript
// LanceDB defaults are usually fine
// For higher recall at cost of speed:
const results = await table
  .search(queryVector)
  .overwrite_ef_search(100)  // Default is usually 64
  .limit(10)
  .execute();
```

---

## Chunk Size Tradeoffs

How big should chunks be?

**Too small (< 20 lines):**
- Individual statements lack context
- Embeddings are noisy
- Search returns fragments

**Too large (> 300 lines):**
- Embeddings become vague
- Multiple concepts blur together
- Less precise matching

**Sweet spot (20-150 lines):**
- Complete functions or methods
- Sufficient context
- Specific enough for precise matching

Measure for your codebase:

```typescript
function analyzeChunkSizes(chunks: Chunk[]): void {
  const sizes = chunks.map(c => c.content.split('\n').length);

  console.log(`Total chunks: ${chunks.length}`);
  console.log(`Min lines: ${Math.min(...sizes)}`);
  console.log(`Max lines: ${Math.max(...sizes)}`);
  console.log(`Median lines: ${median(sizes)}`);
  console.log(`Mean lines: ${mean(sizes).toFixed(1)}`);

  // Distribution
  const buckets = [0, 20, 50, 100, 150, 200, 300, 500, 1000];
  for (let i = 0; i < buckets.length - 1; i++) {
    const count = sizes.filter(s => s >= buckets[i] && s < buckets[i + 1]).length;
    console.log(`${buckets[i]}-${buckets[i + 1]} lines: ${count} chunks`);
  }
}
```

If most chunks are over 200 lines, your chunking is too coarse. Split at more boundaries.

If most chunks are under 20 lines, you are over-fragmenting. Combine small declarations.

---

## Watch Out For

**LanceDB creates persistent files.**

The database lives in `.claude/lancedb/`. It can grow large.

Add to `.gitignore`:
```
.claude/lancedb/
```

Regenerate on each machine rather than committing binary data.

**Embedding model mismatch corrupts searches.**

If you index with nomic-embed-text and search with a different model, results are garbage. Different models produce incompatible vectors.

Store the model name in metadata:

```typescript
await db.createTable('code_chunks', records, {
  metadata: { embedding_model: 'nomic-embed-text' },
});
```

Check on search:

```typescript
const tableMeta = await table.getMetadata();
if (tableMeta.embedding_model !== CURRENT_MODEL) {
  throw new Error('Index was created with a different model. Please reindex.');
}
```

**Large chunks exceed token limits silently.**

If a chunk exceeds 8,192 tokens, Ollama truncates. No error, just incomplete embedding.

Validate before embedding:

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);  // Rough estimate
}

if (estimateTokens(chunk.content) > 7500) {
  console.warn(`Chunk too large: ${chunk.filePath}`);
  // Either split the chunk or truncate explicitly
}
```

**Memory grows with index size.**

LanceDB keeps indexes in memory during operations. For very large indexes (millions of vectors), memory can spike.

Monitor usage:

```typescript
const usage = process.memoryUsage();
console.log(`Heap: ${(usage.heapUsed / 1024 / 1024).toFixed(1)} MB`);
```

For production with massive codebases, consider sharding by directory or project.

**Cold start affects first query.**

First query after loading may be slow as indexes are read from disk. Warm up:

```typescript
// At application startup
const warmupVector = await embed("warmup");
await table.search(warmupVector).limit(1).execute();
console.log("Search warmed up");
```

---

## Putting It Together

Here is the complete pipeline:

```typescript
// scripts/discover/embeddings/full-pipeline.ts

async function buildSemanticIndex(sourceDir: string) {
  // 1. Find source files
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/__tests__/**'],
  });

  // 2. Extract semantic chunks
  const allChunks: EnrichedChunk[] = [];
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const chunks = extractSemanticChunks(content, file);
    const enriched = chunks.map(c => enrichWithContext(c));
    allChunks.push(...enriched);
  }

  console.log(`Extracted ${allChunks.length} chunks from ${files.length} files`);

  // 3. Generate embeddings
  const records: CodeRecord[] = [];
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const text = formatForEmbedding(chunk);
    const vector = await embed(text);

    records.push({
      vector,
      ...chunk.metadata,
      content: chunk.content,
    });

    if ((i + 1) % 100 === 0) {
      console.log(`Embedded ${i + 1}/${allChunks.length}`);
    }
  }

  // 4. Store in LanceDB
  const db = await lancedb.connect('.claude/lancedb');
  const tableNames = await db.tableNames();
  if (tableNames.includes('code_chunks')) {
    await db.dropTable('code_chunks');
  }
  await db.createTable('code_chunks', records);

  console.log('Index complete');
}

async function semanticSearch(query: string, options: SearchOptions = {}) {
  const db = await lancedb.connect('.claude/lancedb');
  const table = await db.openTable('code_chunks');

  const queryVector = await embed(query);

  let search = table.search(queryVector);

  // Apply filters
  if (options.kind) {
    search = search.where(`kind = '${options.kind}'`);
  }
  if (options.directory) {
    search = search.where(`filePath LIKE '${options.directory}%'`);
  }

  const results = await search.limit(options.limit || 10).execute();

  return results.map(r => ({
    ...r,
    similarity: 1 - r._distance,
  }));
}
```

Usage:

```typescript
// Build the index (do this when codebase changes)
await buildSemanticIndex('./src');

// Search (do this on every query)
const results = await semanticSearch("authentication middleware", {
  kind: 'function',
  limit: 5,
});

for (const r of results) {
  console.log(`[${r.similarity.toFixed(3)}] ${r.name} in ${r.filePath}`);
}
```

---

## What is Next

We have fast, scalable vector search. Semantic queries return relevant code in milliseconds.

But this is still a standalone system. The next article wires everything together: SCIP indexes for structure, vector embeddings for semantics, incremental updates for freshness.

The discovery system becomes a cohesive whole.

---

## Quick Reference

**Install LanceDB:**
```bash
npm install @lancedb/lancedb
```

**Create database and table:**
```typescript
const db = await lancedb.connect('.claude/lancedb');
const table = await db.createTable('code_chunks', records);
```

**Search with filters:**
```typescript
const results = await table
  .search(queryVector)
  .where("kind = 'hook'")
  .limit(10)
  .execute();
```

**Chunk size guidelines:**
- Minimum: 20 lines
- Maximum: 150 lines
- Sweet spot: 50-100 lines

**Overlap recommendations:**
- 10-20 lines for code
- Include imports in context
- Add file path and type info

**Storage location:**
- `.claude/lancedb/`
- Add to `.gitignore`
- Regenerate per machine

---

*This is part 8 of a 12-part series on building local code intelligence.*
