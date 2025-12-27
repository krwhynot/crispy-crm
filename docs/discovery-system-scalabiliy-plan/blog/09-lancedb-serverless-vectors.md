# LanceDB: Serverless Vector Search Without the Server

What if your vector database was just a file?

No Docker container spinning in the background. No port to configure. No "connection refused" errors at 2am when you forgot to start the service.

Just a file. Open it. Query it. Close it. Done.

That is LanceDB. And it changes everything about how we think about local code intelligence.

---

## The Docker Tax

Every vector database tutorial starts the same way.

"First, start the Docker container."

```bash
docker compose up -d qdrant
```

Then you wait. Is it ready? Check the health endpoint. Still starting. Check again. Now it is ready.

You run your code. "Connection refused." The container is running but not accepting connections yet. Wait more.

Finally, it works. You index your code. You search. Life is good.

Then you reboot your laptop.

Docker does not auto-start. Neither does your vector database. You open your project, run a search, and... "Connection refused."

This is the Docker tax. A small friction that compounds over time. Every new machine needs setup. Every teammate needs the same Docker configuration. Every CI pipeline needs container orchestration.

For a local-first code intelligence system, that friction is unacceptable.

We want instant-on. Open the project, search immediately. No startup sequence. No background processes.

LanceDB delivers exactly that.

---

## The SQLite Moment

Remember when SQLite changed databases?

Before SQLite, databases meant servers. MySQL, PostgreSQL, Oracle. You needed a daemon running, ports open, credentials configured.

SQLite said: "What if the database was just a file?"

One file. No server. Open it, query it, close it. Embedded directly in your application.

SQLite powers Firefox, Chrome, Android, iOS, and a thousand other applications. It handles billions of installations because it has zero deployment complexity.

LanceDB is SQLite for vectors.

Same philosophy. Same simplicity. Same "it just works" experience.

Your vector embeddings live in a directory. Your application opens that directory, runs queries, and closes it. No network calls. No connection pools. No process management.

The implications for local code intelligence are profound.

---

## Why Not Qdrant or Milvus?

Let me be clear: Qdrant and Milvus are excellent vector databases.

Qdrant has a beautiful API, excellent performance, and great documentation. Milvus scales to billions of vectors across distributed clusters.

But both require running a server process.

For cloud deployments, that is fine. You already have container orchestration. One more service is nothing.

For local development? It is friction.

Here is what happens when a new developer joins the team:

**With Qdrant:**
1. Install Docker Desktop
2. Download docker-compose.yml
3. Run `docker compose up -d`
4. Wait for services to start
5. Pull the embedding model
6. Run the indexer
7. Finally, search works

**With LanceDB:**
1. Clone the repo
2. Run `npm install`
3. Search works

Seven steps versus three. Docker installation alone can take 20 minutes on a slow network.

For CI pipelines, the difference is even starker. Container startup adds 30-60 seconds per run. LanceDB adds zero seconds. It is just reading files.

The serverless model wins on developer experience.

---

## Let's Build It: Setup

Time to get concrete.

Install LanceDB:

```bash
npm install @lancedb/lancedb
```

That is it. No Docker. No binaries. Pure JavaScript with native bindings for performance.

Create your first vector store:

```typescript
// scripts/discover/embeddings/lancedb-store.ts

import * as lancedb from '@lancedb/lancedb';
import * as path from 'node:path';

const DB_PATH = '.claude/vectordb';

interface CodeChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  vector: number[];
}

async function createVectorStore() {
  // Open or create the database
  const db = await lancedb.connect(DB_PATH);

  // Check if table exists
  const tables = await db.tableNames();

  if (!tables.includes('code_chunks')) {
    console.log('Creating code_chunks table...');

    // Create table with sample data to establish schema
    const sampleData: CodeChunk[] = [{
      id: 'init',
      filePath: '',
      startLine: 0,
      endLine: 0,
      content: '',
      vector: new Array(768).fill(0),
    }];

    const table = await db.createTable('code_chunks', sampleData);

    // Delete the sample row
    await table.delete('id = "init"');

    console.log('Table created successfully');
  }

  return db;
}
```

Notice what is missing.

No connection strings. No authentication. No port numbers.

`lancedb.connect(DB_PATH)` opens a directory. If it does not exist, LanceDB creates it. If it exists, LanceDB opens it.

The directory contains your vectors. Lance format files, optimized for vector search.

---

## Let's Build It: Indexing

Now let us store some actual code embeddings.

```typescript
// scripts/discover/embeddings/index-code.ts

import * as lancedb from '@lancedb/lancedb';
import { generateEmbedding } from './ollama';
import { extractChunks } from './chunker';
import { glob } from 'glob';
import * as fs from 'node:fs/promises';

const DB_PATH = '.claude/vectordb';

async function indexCodebase(sourceDir: string) {
  const db = await lancedb.connect(DB_PATH);

  // Get or create the table
  let table: lancedb.Table;
  const tables = await db.tableNames();

  if (tables.includes('code_chunks')) {
    table = await db.openTable('code_chunks');
    // Clear existing data for fresh index
    await table.delete('id IS NOT NULL');
  } else {
    // Will create with first batch
    table = null as any;
  }

  // Find all TypeScript files
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/dist/**'],
  });

  console.log(`Found ${files.length} files to index`);

  const allChunks: CodeChunk[] = [];
  let chunkId = 0;

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const chunks = extractChunks(content);

    for (const chunk of chunks) {
      // Generate embedding for this chunk
      const vector = await generateEmbedding(chunk.content);

      allChunks.push({
        id: `chunk-${chunkId++}`,
        filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content.slice(0, 1000), // Store preview
        vector,
      });

      // Batch insert every 100 chunks
      if (allChunks.length >= 100) {
        if (!table) {
          table = await db.createTable('code_chunks', allChunks);
        } else {
          await table.add(allChunks);
        }
        console.log(`Indexed ${chunkId} chunks...`);
        allChunks.length = 0;
      }
    }
  }

  // Insert remaining chunks
  if (allChunks.length > 0) {
    if (!table) {
      table = await db.createTable('code_chunks', allChunks);
    } else {
      await table.add(allChunks);
    }
  }

  console.log(`Indexing complete. Total chunks: ${chunkId}`);
}

// Run it
indexCodebase('./src');
```

The pattern is familiar if you have used any database. Create a table. Insert rows. Batch for efficiency.

But there is no server to worry about. The data writes directly to disk.

---

## Let's Build It: Searching

Search is where LanceDB shines.

```typescript
// scripts/discover/embeddings/search.ts

import * as lancedb from '@lancedb/lancedb';
import { generateEmbedding } from './ollama';

const DB_PATH = '.claude/vectordb';

interface SearchResult {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  score: number;
}

async function search(query: string, limit: number = 10): Promise<SearchResult[]> {
  const db = await lancedb.connect(DB_PATH);
  const table = await db.openTable('code_chunks');

  // Generate embedding for the query
  const queryVector = await generateEmbedding(query);

  // Vector similarity search
  const results = await table
    .vectorSearch(queryVector)
    .limit(limit)
    .toArray();

  return results.map(row => ({
    filePath: row.filePath,
    startLine: row.startLine,
    endLine: row.endLine,
    content: row.content,
    score: row._distance, // Lower is better (L2 distance)
  }));
}

// CLI interface
const query = process.argv.slice(2).join(' ');

if (!query) {
  console.log('Usage: npx tsx search.ts <query>');
  process.exit(1);
}

const results = await search(query);

console.log(`\nResults for: "${query}"\n`);

for (const result of results) {
  console.log(`[${result.score.toFixed(4)}] ${result.filePath}:${result.startLine}`);
  console.log(`  ${result.content.slice(0, 100)}...`);
  console.log();
}
```

Try it:

```bash
npx tsx scripts/discover/embeddings/search.ts "form validation hooks"
```

Output:

```
Results for: "form validation hooks"

[0.2341] src/hooks/useFormValidation.ts:12
  export function useFormValidation<T extends ZodSchema>(schema: T) {...

[0.2567] src/components/ContactForm.tsx:45
  const { errors, validate } = useFormValidation(contactSchema);...

[0.2891] src/validation/schemas/contact.ts:8
  export const contactSchema = z.object({ firstName: z.string().min(1)...
```

Notice the scores. LanceDB uses L2 distance by default, so lower is better. 0.23 is more similar than 0.28.

The query executed in milliseconds. No network round trip. No container startup. Just disk I/O.

---

## Deep Dive: Zero Cold Start

"Zero cold start" is not marketing speak. Let me explain what it means.

Traditional vector databases load indexes into memory on startup. Qdrant builds HNSW graphs. Milvus constructs segment indexes. This takes time.

First query after restart? Wait for the index to load.

LanceDB takes a different approach: memory-mapped files.

When you open a LanceDB table, it does not load the data into memory. It maps the file into the process's address space. The operating system handles the rest.

First query? The OS loads the necessary pages from disk. Fast SSD, fast query.

Second query? Pages are already in the OS page cache. Even faster.

Subsequent queries? Near-instant.

The difference:

| Scenario | Qdrant | LanceDB |
|----------|--------|---------|
| First query after restart | 2-5 seconds | 50-200ms |
| Subsequent queries | 1-10ms | 1-10ms |
| After system idle | May need reload | OS cache handles it |

For interactive development, this matters. You do not want to wait 5 seconds for your first search after lunch.

---

## Deep Dive: The Lance Format

LanceDB stores data in Lance format, a columnar format optimized for vector search.

Why columnar? Because vector search has specific access patterns.

When searching, you need:
1. All vectors (to compare similarity)
2. Only the metadata for matching rows

Columnar storage keeps vectors together on disk. One sequential read loads all vectors. No seeking around the file.

Row-based storage would interleave vectors with metadata. Reading vectors would require skipping over file paths, line numbers, content previews. Lots of seeks. Slow.

Lance also supports:
- **Compression** - Vectors compress well, reducing disk usage
- **Versioning** - Time-travel to previous states of your index
- **Zero-copy reads** - Data stays on disk until needed
- **Concurrent readers** - Multiple processes can read simultaneously

For code intelligence, versioning is interesting. You could index at each git commit and search historical versions of your codebase.

---

## Filtering: More Than Just Vectors

Vector similarity is not always enough.

"Find form validation code" is a vector search.

"Find form validation code in the hooks directory" is a filtered vector search.

LanceDB supports SQL-like filtering:

```typescript
const results = await table
  .vectorSearch(queryVector)
  .where("filePath LIKE '%/hooks/%'")
  .limit(10)
  .toArray();
```

Or with multiple conditions:

```typescript
const results = await table
  .vectorSearch(queryVector)
  .where("filePath LIKE '%/hooks/%' AND startLine > 100")
  .limit(10)
  .toArray();
```

Filters execute before vector search, narrowing the candidate set. This is faster than searching everything and filtering after.

Common filter patterns for code search:

```typescript
// Only TypeScript files (not tests)
.where("filePath NOT LIKE '%test%' AND filePath NOT LIKE '%spec%'")

// Specific feature directory
.where("filePath LIKE '%/atomic-crm/contacts/%'")

// Large functions only
.where("endLine - startLine > 20")

// Exclude generated code
.where("filePath NOT LIKE '%generated%'")
```

Filtering makes vector search practical for real codebases where context matters.

---

## Watch Out For

LanceDB has gotchas. Here is what will bite you.

### Schema Evolution Is Limited

Once you create a table with a schema, changing it is hard.

```typescript
// Original schema
{ id: string, filePath: string, vector: number[] }

// Later you want to add
{ id: string, filePath: string, chunkType: string, vector: number[] }
```

LanceDB does not support `ALTER TABLE`. You need to:
1. Create a new table with the new schema
2. Copy data from the old table
3. Delete the old table
4. Rename the new table

Plan your schema carefully upfront.

### Vector Dimension Is Fixed

All vectors in a table must have the same dimension.

```typescript
// nomic-embed-text produces 768 dimensions
const vector768 = await embed("hello", "nomic-embed-text");

// OpenAI produces 1536 dimensions
const vector1536 = await embed("hello", "text-embedding-3-small");

// Cannot mix in the same table!
```

If you switch embedding models, you need a fresh index.

### No Built-In Deduplication

LanceDB does not enforce unique IDs. Insert the same chunk twice, and you have duplicates.

```typescript
// This creates duplicates!
await table.add([{ id: 'chunk-1', ... }]);
await table.add([{ id: 'chunk-1', ... }]); // Same ID, still inserts
```

For incremental updates, delete before inserting:

```typescript
await table.delete(`filePath = "${filePath}"`);
await table.add(newChunks);
```

### Memory-Mapped File Limits

Memory mapping uses virtual address space. On 32-bit systems (rare now), you hit limits around 2-3GB.

On 64-bit systems, the limit is effectively your disk size.

But if you are indexing truly massive codebases (billions of vectors), consider whether embedded databases are the right choice. At that scale, distributed systems like Milvus make more sense.

### Concurrent Writes Need Care

Multiple readers work fine. Multiple writers can cause issues.

```typescript
// Process A
const table = await db.openTable('chunks');
await table.add(chunksA);

// Process B (running simultaneously)
const table = await db.openTable('chunks');
await table.add(chunksB);

// Possible corruption!
```

Use file locking or ensure single-writer architecture. For code indexing, this usually means one indexer process at a time.

---

## Performance Numbers

Real numbers from our codebase (485 components, ~50,000 lines):

| Operation | Time |
|-----------|------|
| Open database | 2ms |
| Vector search (top 10) | 15ms |
| Vector search with filter | 18ms |
| Index 1000 chunks | 3.2s (including embeddings) |
| Index 1000 chunks (pre-embedded) | 120ms |
| Database size on disk | 47MB |

For comparison, Qdrant with the same data:
- Container startup: 4-8 seconds
- First query (cold): 2-3 seconds
- Subsequent queries: 8-12ms
- Database size: 52MB

Query performance is similar once both are warm. The difference is cold start.

For local development where you constantly stop and start, LanceDB wins on experience.

---

## Justfile Integration

Add these recipes to your justfile:

```makefile
# Vector search with LanceDB
db-path := ".claude/vectordb"

# Index the codebase into LanceDB
discover-vectors:
    npx tsx scripts/discover/embeddings/index-code.ts

# Search the vector index
discover-search query:
    @npx tsx scripts/discover/embeddings/search.ts "{{query}}"

# Check vector database stats
discover-stats:
    @npx tsx -e "
    import * as lancedb from '@lancedb/lancedb';
    const db = await lancedb.connect('{{db-path}}');
    const table = await db.openTable('code_chunks');
    console.log('Rows:', await table.countRows());
    "

# Clear the vector index
discover-clear:
    rm -rf {{db-path}}
    @echo "Vector database cleared"
```

Usage:

```bash
just discover-vectors              # Build the index
just discover-search "auth hooks"  # Search
just discover-stats                # Check row count
just discover-clear                # Start fresh
```

No Docker commands. No health checks. Just file operations.

---

## What's Next

LanceDB gives us zero-friction vector storage. But how do we expose this to Claude Code?

The answer is MCP - the Model Context Protocol.

In the next article, we build an MCP server that wraps our discovery system. Claude Code will be able to search semantically, query the call graph, and find components - all through natural language.

We will use FastMCP to make server creation trivially easy. Define tools with Zod schemas. Connect to Claude Code. Watch it work.

The pieces are coming together.

---

## Quick Reference

### Installation

```bash
npm install @lancedb/lancedb
```

### Basic Operations

```typescript
import * as lancedb from '@lancedb/lancedb';

// Connect (creates if missing)
const db = await lancedb.connect('.claude/vectordb');

// Create table
const table = await db.createTable('chunks', data);

// Open existing table
const table = await db.openTable('chunks');

// Insert data
await table.add(newData);

// Vector search
const results = await table
  .vectorSearch(queryVector)
  .limit(10)
  .toArray();

// Filtered search
const results = await table
  .vectorSearch(queryVector)
  .where("filePath LIKE '%hooks%'")
  .limit(10)
  .toArray();

// Delete rows
await table.delete("filePath = 'old/path.ts'");

// Count rows
const count = await table.countRows();
```

### Why LanceDB Over Qdrant/Milvus

| Feature | LanceDB | Qdrant/Milvus |
|---------|---------|---------------|
| Server process | No | Yes |
| Docker required | No | Typically |
| Cold start | Instant | 2-8 seconds |
| Setup complexity | npm install | Container config |
| CI integration | Trivial | Container setup |
| Query performance | Fast | Fast |
| Scale limit | ~10M vectors | Billions |

For local code intelligence under 10 million vectors, LanceDB wins on simplicity.

---

*This is part 9 of a 12-part series on building local code intelligence.*
