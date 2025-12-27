# LanceDB: Serverless Vector Search Without the Server

What if your vector database was just a file?

No Docker container. No port configuration. No "connection refused" at 2am.

Just a file. Open it. Query it. Done.

---

## The Docker Tax

Every vector database tutorial starts the same way.

"First, start the Docker container."

```bash
docker compose up -d qdrant
```

Then you wait. Is it ready? Check the health endpoint. Still starting.

You run your code. Connection refused. The container is running but not accepting connections yet.

Finally it works. You index your code. Life is good.

Then you reboot your laptop.

Docker does not auto-start. Neither does your vector database. You open your project and... connection refused.

This is the Docker tax. Small friction that compounds over time.

Every new machine needs setup. Every teammate needs the same Docker configuration. Every CI pipeline needs container orchestration.

For a local-first code intelligence system, that friction is unacceptable.

---

## The SQLite Moment

Remember when SQLite changed everything?

Before SQLite, databases meant servers. MySQL. PostgreSQL. Oracle. Daemons running. Ports open. Credentials configured.

SQLite said: "What if the database was just a file?"

One file. No server. Open it, query it, close it.

SQLite powers Firefox, Chrome, Android, iOS. Billions of installations. Zero deployment complexity.

LanceDB is SQLite for vectors.

A vector database stores numerical representations of text, code, or images as arrays of numbers, enabling similarity search instead of exact matching. It is like a library that groups books by topic rather than alphabetically.

Same philosophy as SQLite. Same simplicity. Same "it just works" experience.

Your vector embeddings live in a directory. Your application opens that directory, runs queries, closes it. No network calls. No connection pools. No process management.

---

## Why Not Qdrant or Milvus?

Let me be clear. Qdrant and Milvus are excellent.

Qdrant has a beautiful API. Milvus scales to billions of vectors.

Both require running a server.

For cloud deployments, fine. You already have container orchestration.

For local development? Friction.

Here is what happens when a new developer joins:

**With Qdrant:**
1. Install Docker Desktop
2. Download docker-compose.yml
3. Run docker compose up
4. Wait for services
5. Pull embedding model
6. Run indexer
7. Finally search works

**With LanceDB:**
1. Clone repo
2. npm install
3. Search works

Seven steps versus three.

Docker installation alone can take 20 minutes on a slow network. LanceDB adds zero seconds to CI pipelines. It is just reading files.

---

## Setup

Install LanceDB:

```bash
npm install @lancedb/lancedb
```

That's it.

No Docker. No binaries. Pure JavaScript with native bindings for performance.

Create your first vector store:

```typescript
import * as lancedb from '@lancedb/lancedb';

const db = await lancedb.connect('.claude/vectordb');
const tables = await db.tableNames();

if (!tables.includes('code_chunks')) {
  await db.createTable('code_chunks', sampleData);
}
```

Notice what is missing.

No connection strings. No authentication. No port numbers.

`lancedb.connect()` opens a directory. If it does not exist, LanceDB creates it. If it exists, LanceDB opens it. It is like opening a folder on your desktop.

The directory contains your vectors in Lance format. Lance format is a columnar storage layout optimized for vector operations. Think of it as Parquet but designed specifically for similarity search.

---

## Indexing Code

Storing embeddings follows a familiar pattern:

```typescript
const db = await lancedb.connect('.claude/vectordb');
const table = await db.openTable('code_chunks');

for (const chunk of chunks) {
  const vector = await generateEmbedding(chunk.content);
  await table.add([{ id: chunk.id, filePath, vector }]);
}
```

Create a table. Insert rows. Batch for efficiency.

No server to worry about. Data writes directly to disk.

One gotcha here. LanceDB does not enforce unique IDs. Insert the same chunk twice and you have duplicates. For incremental updates, delete before inserting:

```typescript
await table.delete(`filePath = "${filePath}"`);
await table.add(newChunks);
```

---

## Searching

Search is where LanceDB shines.

```typescript
const db = await lancedb.connect('.claude/vectordb');
const table = await db.openTable('code_chunks');
const queryVector = await generateEmbedding(query);

const results = await table
  .vectorSearch(queryVector)
  .limit(10)
  .toArray();
```

The query executes in milliseconds. No network round trip. No container startup. Just disk I/O.

LanceDB uses L2 distance by default. Lower scores mean more similar. A score of 0.23 is better than 0.28. It is like golf. Lower wins.

---

## Filtered Search

Vector similarity alone is not always enough.

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

Filters execute before vector search. This narrows the candidate set first. It is like asking the librarian to only look in the science section before finding similar books.

Common patterns for code search:

```typescript
// Exclude tests
.where("filePath NOT LIKE '%test%'")

// Specific feature
.where("filePath LIKE '%/contacts/%'")

// Large functions only
.where("endLine - startLine > 20")
```

---

## Zero Cold Start

"Zero cold start" is not marketing speak.

Traditional vector databases load indexes into memory on startup. Qdrant builds HNSW graphs. Milvus constructs segment indexes. This takes time.

First query after restart? Wait for the index to load.

LanceDB takes a different approach. Memory-mapped files.

Memory mapping is a technique where the operating system treats a file on disk as if it were in RAM. The OS loads only the pages you actually access. It is like reading a book by only opening the pages you need rather than photocopying the whole thing first.

When you open a LanceDB table, it does not load data into memory. It maps the file into the process's address space.

First query? The OS loads necessary pages from disk.

Second query? Pages are already cached.

Subsequent queries? Near-instant.

| Scenario | Qdrant | LanceDB |
|----------|--------|---------|
| First query after restart | 2-5 seconds | 50-200ms |
| Subsequent queries | 1-10ms | 1-10ms |

For interactive development, this matters. You do not want to wait 5 seconds after lunch.

---

## The Lance Format

LanceDB stores data in Lance format. A columnar format optimized for vector search.

Why columnar? Because vector search has specific access patterns.

Columnar storage organizes data by column rather than by row. All vectors are stored together. All file paths together. All line numbers together. It is like organizing a spreadsheet where each column is a separate file.

When searching, you need all vectors to compare similarity. But you only need metadata for matching rows.

Columnar storage keeps vectors together on disk. One sequential read loads all vectors. No seeking around.

Row-based storage would interleave vectors with metadata. Reading vectors would require skipping over file paths and line numbers. Lots of seeks. Slow.

Lance also supports versioning. You could index at each git commit and search historical versions. Time travel for your codebase.

---

## Schema Matters

Here is where LanceDB will bite you.

Once you create a table with a schema, changing it is hard. LanceDB does not support ALTER TABLE.

Plan your schema carefully upfront.

Want to add a new field later? You need to create a new table, copy data, delete the old table, rename. Tedious.

Vector dimension is also fixed. All vectors in a table must have the same dimension.

```typescript
// nomic-embed-text: 768 dimensions
// OpenAI ada-002: 1536 dimensions
// Cannot mix in the same table
```

Switch embedding models? You need a fresh index. It is like changing the grid size on graph paper after you have already drawn your chart.

---

## Concurrent Access

Multiple readers work fine.

Multiple writers? Problems.

```typescript
// Process A writes
await table.add(chunksA);

// Process B writes simultaneously
await table.add(chunksB);

// Possible corruption
```

Use file locking or ensure single-writer architecture. For code indexing, this means one indexer process at a time.

It is like multiple people trying to edit the same Google Doc in offline mode. Merge conflicts await.

---

## Performance Numbers

Real numbers from our codebase. 485 components. 50,000 lines.

| Operation | Time |
|-----------|------|
| Open database | 2ms |
| Vector search (top 10) | 15ms |
| Vector search with filter | 18ms |
| Index 1000 chunks | 120ms |
| Database size on disk | 47MB |

For comparison, Qdrant with the same data:

- Container startup: 4-8 seconds
- First query cold: 2-3 seconds
- Subsequent queries: 8-12ms

Query performance is similar once warm. The difference is cold start.

For local development where you constantly stop and start, LanceDB wins.

---

## Justfile Integration

Add these recipes:

```makefile
# Index codebase into LanceDB
discover-vectors:
    npx tsx scripts/discover/embeddings/index-code.ts

# Search the vector index
discover-search query:
    @npx tsx scripts/discover/embeddings/search.ts "{{query}}"

# Check database stats
discover-stats:
    @npx tsx -e "import * as lancedb from '@lancedb/lancedb'; ..."
```

Usage:

```bash
just discover-vectors              # Build index
just discover-search "auth hooks"  # Search
just discover-stats                # Row count
```

No Docker commands. No health checks. Just file operations.

---

## When LanceDB Is Wrong

LanceDB is not always the answer.

Scaling past 10 million vectors? Consider Qdrant or Milvus. They are designed for distributed workloads.

Need real-time updates from multiple services? A client-server architecture makes more sense.

Building a production SaaS with high availability requirements? Managed vector databases like Pinecone eliminate operational burden.

LanceDB is perfect for local development, CLI tools, CI pipelines, and embedded applications. It is like choosing between a sports car and a pickup truck. Both excellent. Different jobs.

---

## What's Next

LanceDB gives us zero-friction vector storage.

But how do we expose this to Claude Code?

The answer is MCP. The Model Context Protocol.

MCP is a standard for connecting AI assistants to external tools and data sources. It is like USB for AI. Plug in capabilities without modifying the core assistant.

In the next article, we build an MCP server that wraps our discovery system. Claude Code will search semantically, query the call graph, and find components through natural language.

The pieces are coming together.

---

## Quick Reference

```typescript
import * as lancedb from '@lancedb/lancedb';

// Connect (creates if missing)
const db = await lancedb.connect('.claude/vectordb');

// Create table
const table = await db.createTable('chunks', data);

// Vector search
const results = await table
  .vectorSearch(queryVector)
  .where("filePath LIKE '%hooks%'")
  .limit(10)
  .toArray();
```

**LanceDB vs Qdrant/Milvus:**

| Feature | LanceDB | Qdrant/Milvus |
|---------|---------|---------------|
| Server process | No | Yes |
| Cold start | Instant | 2-8 seconds |
| Setup | npm install | Container config |
| Scale limit | ~10M vectors | Billions |

For local code intelligence under 10 million vectors, LanceDB wins on simplicity.

---

*Part 9 of 12: Building Local Code Intelligence*
