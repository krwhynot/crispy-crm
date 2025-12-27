# Storing and Searching Vectors with Qdrant

A database that understands "similar to" instead of "equal to."

That single idea changes everything about how we search code.

Regular databases answer questions like "give me all users named John." Exact matches. Binary. Yes or no.

But what if you want "users similar to John"? Or "code that does something like form validation"?

Regular databases shrug. They don't understand similarity.

This article shows you how to build a search system that does.

---

## Why Not Just Use Postgres?

Let me show you why this matters with a real scenario.

You join a new project. You need to find code that handles form validation. You open your search tool and type... what exactly?

"validation"? Returns 847 results, including database constraints, API responses, and config files.

"form"? Returns 1,203 results, including form data, form factors, and reformed schemas.

"form AND validation"? Better. But you miss `useInputChecker`, `sanitizeUserData`, and `verifyPayload`.

SQL databases match text. Character by character. They don't know that "validation" and "checking" mean similar things.

You end up running five different searches. Scanning hundreds of results. Wasting twenty minutes.

There has to be a better way.

---

## The Restaurant Map Analogy

Imagine a map of a city where similar restaurants cluster together.

Italian restaurants are in one neighborhood. Thai restaurants in another. Mexican places all on the same street.

If you're standing at a great Italian restaurant and want to try something similar, you just walk next door. You don't need to know the exact name. You don't search for "pasta" or "pizza." You use proximity.

Now imagine that same map, but for code.

Functions that do similar things cluster together. Form validation sits near input checking. Both are close to data sanitization. They're all far away from database queries.

When you search for "form validation," you don't just get exact matches. You get the neighbors too. `useInputChecker`. `sanitizeUserData`. `verifyPayload`.

That's what Qdrant gives us.

A map where meaning determines location.

---

## Enter Qdrant

Qdrant is a vector database. Let's unpack that.

"Vector" is just a list of numbers. GPS coordinates are a vector with 2 numbers. Your position in 3D space is a vector with 3 numbers.

Qdrant stores vectors with 768 numbers. Each number captures one dimension of meaning.

Why 768? Because meaning is complicated.

Is "happy" similar to "joyful"? Yes. Is it similar to "birthday"? Kind of, but differently. Is it similar to "function"? Probably not, unless it's a function called `makeUserHappy`.

You need 768 dimensions to capture all those nuances. You can't visualize 768 dimensions. That's fine. The math works the same way as 2D or 3D.

Similar things have similar coordinates. Qdrant finds coordinates that are close together.

That's the entire idea.

---

## Why Qdrant Specifically?

There are several vector databases. Pinecone is popular but cloud-hosted. Weaviate is powerful but complex. Milvus is enterprise-grade but heavyweight.

Qdrant hits the sweet spot for local development:

**Self-hosted.** Runs on your machine in Docker. No cloud account. No API keys. No monthly bills.

**Free and open source.** MIT license. Use it however you want.

**Fast.** Sub-millisecond queries on millions of vectors. Uses an algorithm called HNSW that we'll dive into later.

**Simple API.** REST endpoints that work with any language. Official TypeScript client that makes it even easier.

**Low resource usage.** Runs comfortably on a laptop with 8GB RAM.

For a discovery system that needs to index 50,000 code chunks and answer queries instantly, Qdrant is perfect.

---

## Let's Build It: Docker Setup

First, we need Qdrant running. Docker makes this trivially easy.

If you don't have Docker, install Docker Desktop from docker.com. It takes five minutes.

Create a file called `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped
```

Let's decode this:

`image: qdrant/qdrant:latest` - Use the official Qdrant image, newest version.

`ports: - "6333:6333"` - Expose the REST API on port 6333. This is how we'll talk to Qdrant.

`ports: - "6334:6334"` - Expose the gRPC API on port 6334. Faster than REST for bulk operations.

`volumes: - ./qdrant_storage:/qdrant/storage` - Store data in a local folder. Your vectors survive container restarts.

Start it:

```bash
docker compose up -d qdrant
```

The `-d` flag runs it in the background. You can close your terminal and Qdrant keeps running.

Verify it's working:

```bash
curl http://localhost:6333/
```

You should see a JSON response with version info.

Qdrant is running. Now we need vectors to store.

---

## Where Do Vectors Come From?

We've talked about storing vectors. But who creates them?

You need an embedding model. A machine learning model trained to convert text into those 768-dimensional coordinates.

The model reads your code, understands what it does, and outputs coordinates that capture the meaning.

There are two options:

**Cloud APIs.** OpenAI, Cohere, Google all offer embedding endpoints. Send text, get vectors. Pros: high quality, no local setup. Cons: costs money, requires internet, privacy concerns.

**Local models.** Run the model on your own machine. Ollama makes this easy. Pros: free forever, no internet required, complete privacy. Cons: uses local CPU/RAM, slightly slower.

For a discovery system that might reindex thousands of chunks daily, local is the way to go.

We'll use Ollama with the `nomic-embed-text` model. Add it to your docker-compose:

```yaml
services:
  qdrant:
    # ... existing config ...

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_data:/root/.ollama
    restart: unless-stopped
```

Start both services:

```bash
docker compose up -d
```

Download the embedding model:

```bash
docker exec ollama ollama pull nomic-embed-text
```

This downloads about 300MB. Takes a minute or two.

Now we have everything we need. Let's write code.

---

## Building the Indexer

The indexer does three things:

1. Read code files and break them into chunks
2. Convert each chunk to a vector using Ollama
3. Store the vectors in Qdrant with metadata

Let's build it step by step.

### Install Dependencies

```bash
npm install @qdrant/js-client-rest
```

That's the official Qdrant TypeScript client.

### Create the Collection

Before storing vectors, we create a "collection" in Qdrant. Think of it like a database table.

```typescript
// src/embeddings/setup-collection.ts
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({ url: "http://localhost:6333" });

async function setupCollection() {
  const collectionName = "code_chunks";

  // Check if collection exists
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === collectionName
  );

  if (exists) {
    console.log(`Collection ${collectionName} already exists`);
    return;
  }

  // Create collection with correct dimensions
  await qdrant.createCollection(collectionName, {
    vectors: {
      size: 768, // nomic-embed-text dimension
      distance: "Cosine", // similarity metric
    },
  });

  console.log(`Created collection ${collectionName}`);
}

setupCollection();
```

The critical part: `size: 768`.

This must match your embedding model's output dimension. nomic-embed-text produces 768-dimensional vectors. If you use a different model, check its documentation.

`distance: "Cosine"` tells Qdrant how to measure similarity. Cosine similarity is standard for text embeddings. Other options are `Euclid` and `Dot`, but Cosine works best for most text use cases.

### Generate Embeddings

Now we need to convert text to vectors. Call Ollama's embedding endpoint:

```typescript
// src/embeddings/embed.ts

interface EmbeddingResponse {
  embedding: number[];
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.statusText}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.embedding;
}
```

Simple. Send text, get 768 numbers back.

### Chunk the Code

We don't embed entire files. That would create vague, averaged embeddings.

Instead, we break code into chunks at natural boundaries. Functions. Classes. Interfaces.

For simplicity, here's a basic chunker that splits on double newlines:

```typescript
// src/embeddings/chunker.ts

interface CodeChunk {
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

function chunkFile(content: string, filePath: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const lines = content.split("\n");

  let currentChunk: string[] = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentChunk.push(line);

    // Split on empty lines after substantial content
    if (line.trim() === "" && currentChunk.length > 5) {
      const chunkContent = currentChunk.join("\n").trim();
      if (chunkContent.length > 50) {
        chunks.push({
          content: chunkContent,
          filePath,
          startLine,
          endLine: i + 1,
        });
      }
      currentChunk = [];
      startLine = i + 2;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join("\n").trim();
    if (chunkContent.length > 50) {
      chunks.push({
        content: chunkContent,
        filePath,
        startLine,
        endLine: lines.length,
      });
    }
  }

  return chunks;
}
```

In production, you'd use Tree-sitter to find exact function and class boundaries. But this gets the idea across.

### Put It All Together

Now we connect everything:

```typescript
// src/embeddings/indexer.ts
import { QdrantClient } from "@qdrant/js-client-rest";
import { readFile } from "fs/promises";
import { glob } from "glob";

const qdrant = new QdrantClient({ url: "http://localhost:6333" });
const COLLECTION = "code_chunks";

async function embed(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });
  const data = await response.json();
  return data.embedding;
}

async function indexCodebase(sourceDir: string) {
  // Find all TypeScript files
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ["**/node_modules/**", "**/*.d.ts"],
  });

  console.log(`Found ${files.length} files to index`);

  let pointId = 0;
  const batchSize = 100;
  let batch: Array<{
    id: number;
    vector: number[];
    payload: Record<string, unknown>;
  }> = [];

  for (const filePath of files) {
    const content = await readFile(filePath, "utf-8");
    const chunks = chunkFile(content, filePath);

    for (const chunk of chunks) {
      // Generate embedding
      const vector = await embed(chunk.content);

      batch.push({
        id: pointId++,
        vector,
        payload: {
          filePath: chunk.filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          content: chunk.content.slice(0, 500), // Store preview
        },
      });

      // Upsert in batches
      if (batch.length >= batchSize) {
        await qdrant.upsert(COLLECTION, { points: batch });
        console.log(`Indexed ${pointId} chunks`);
        batch = [];
      }
    }
  }

  // Don't forget remaining items
  if (batch.length > 0) {
    await qdrant.upsert(COLLECTION, { points: batch });
  }

  console.log(`Indexing complete. Total chunks: ${pointId}`);
}

// Run it
indexCodebase("./src");
```

The key insight: we store metadata alongside each vector.

`filePath`, `startLine`, `endLine` - so we can show where the match came from.

`content` - a preview so we can display results without reading the file again.

Run the indexer:

```bash
npx tsx src/embeddings/indexer.ts
```

First run takes a while. Each chunk needs an embedding. For a codebase with 10,000 chunks, that's 10,000 API calls to Ollama. Expect 2-5 minutes.

Subsequent runs can be incremental. Only index changed files.

---

## Building the Search CLI

Now the fun part. We have vectors. Let's search them.

```typescript
// src/embeddings/search.ts
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({ url: "http://localhost:6333" });
const COLLECTION = "code_chunks";

async function embed(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });
  const data = await response.json();
  return data.embedding;
}

async function search(query: string, limit: number = 5) {
  // Convert query to vector
  const queryVector = await embed(query);

  // Search for nearest neighbors
  const results = await qdrant.search(COLLECTION, {
    vector: queryVector,
    limit,
    with_payload: true,
  });

  console.log(`\nResults for: "${query}"\n`);

  for (const result of results) {
    const score = result.score.toFixed(3);
    const payload = result.payload as Record<string, unknown>;

    console.log(`[${score}] ${payload.filePath}:${payload.startLine}`);
    console.log(`  ${String(payload.content).slice(0, 100)}...`);
    console.log();
  }
}

// Get query from command line
const query = process.argv.slice(2).join(" ");
if (!query) {
  console.log("Usage: npx tsx src/embeddings/search.ts <query>");
  process.exit(1);
}

search(query);
```

Try it:

```bash
npx tsx src/embeddings/search.ts "form validation"
```

Output might look like:

```
Results for: "form validation"

[0.847] src/validation/schemas/contact.ts:12
  export const contactSchema = z.object({ firstName: z.string().min(1)...

[0.823] src/hooks/useFormValidator.ts:5
  export function useFormValidator<T extends z.ZodSchema>(schema: T) {...

[0.801] src/components/ContactForm.tsx:34
  const { errors } = useForm({ resolver: zodResolver(contactSchema) })...
```

Notice the scores. Higher is more similar. 0.847 means the first result is 84.7% similar to your query.

Now try different queries:

```bash
npx tsx src/embeddings/search.ts "handling user errors"
npx tsx src/embeddings/search.ts "database queries"
npx tsx src/embeddings/search.ts "authentication flow"
```

You're searching by meaning. Not keywords.

---

## Deep Dive: HNSW Algorithm

How does Qdrant search millions of vectors in milliseconds?

It doesn't compare your query against every single vector. That would be too slow. Instead, it uses an algorithm called HNSW.

HNSW stands for Hierarchical Navigable Small World.

Let me explain with an analogy.

### The Social Network Analogy

Imagine you want to find a specific person in a city of 10 million people.

**Brute force:** Visit every person. Ask "are you the one I'm looking for?" Repeat 10 million times. Terrible.

**HNSW approach:** Use social connections.

You start with a few well-connected people. Celebrities, politicians, community leaders. They know lots of people.

You ask one: "I'm looking for someone who works in healthcare and lives downtown."

They say: "I know a hospital administrator. Talk to her."

The administrator knows doctors. The doctors know nurses. Each step gets you closer to your target.

You find your person in 15 hops instead of 10 million checks.

### How HNSW Works

HNSW builds a multi-layer graph of your vectors.

**Top layer:** A few "hub" vectors with many connections. These are entry points.

**Middle layers:** More vectors, fewer connections each. Navigational stepping stones.

**Bottom layer:** All vectors with connections to nearby neighbors.

When you search:

1. Start at a random hub in the top layer
2. Greedily move toward vectors more similar to your query
3. When you can't improve, drop to the next layer
4. Repeat until you reach the bottom
5. The bottom layer gives you the final, precise results

This logarithmic traversal means searching 1 million vectors takes about 20 steps. Searching 1 billion vectors takes about 30 steps.

Sub-millisecond queries on massive datasets.

### The Trade-off

HNSW needs to build the graph upfront. Indexing is slower than brute force storage.

But you index once (or incrementally). You search constantly. The trade-off is worth it.

---

## Watch Out For

After building several semantic search systems, here are the gotchas that'll bite you.

### Dimension Mismatch

This is the most common error:

```
Error: Vector dimension mismatch. Expected 768, got 1536.
```

You created a collection with 768 dimensions (nomic-embed-text). Then you tried to insert vectors from a different model that outputs 1536 dimensions (like OpenAI's text-embedding-ada-002).

**Fix:** Delete the collection and recreate with the correct dimension. Or use the same model consistently.

```typescript
// Check your model's dimension before creating collections
const testVector = await embed("test");
console.log(`Model outputs ${testVector.length} dimensions`);
```

### Collection Schema Conflicts

You can't change a collection's dimension or distance metric after creation.

**Wrong:**
```typescript
// Collection exists with size: 768
await qdrant.createCollection("code_chunks", {
  vectors: { size: 1536, distance: "Cosine" }
});
// Error: collection already exists with different config
```

**Right:**
```typescript
// Delete first, then recreate
await qdrant.deleteCollection("code_chunks");
await qdrant.createCollection("code_chunks", {
  vectors: { size: 1536, distance: "Cosine" }
});
```

Or use a migration strategy: create a new collection, migrate data, delete old collection.

### Payload Size Limits

Qdrant stores metadata (payload) alongside vectors. But don't go crazy.

Storing entire file contents as payload works for small files. For a 50KB file, you're using 50KB per chunk. Times 10,000 chunks is 500MB just in payloads.

**Better:** Store file paths and line numbers. Read the file content when displaying results.

```typescript
// Good: minimal payload
payload: {
  filePath: chunk.filePath,
  startLine: chunk.startLine,
  endLine: chunk.endLine,
  preview: chunk.content.slice(0, 200), // Just a preview
}

// Excessive: full content
payload: {
  content: entireFileContent, // Don't do this
}
```

### Embedding Model Consistency

If you index with one model and search with another, results will be nonsense.

The models speak different "languages." Model A's coordinates for "validation" are completely different from Model B's.

**Rule:** Use the same model for indexing and searching. If you change models, reindex everything.

### First Query Latency

Ollama loads models into memory on first use. Your first embedding call might take 5-10 seconds while the model loads.

Subsequent calls are fast (50-100ms).

**Workaround:** Warm up the model on startup:

```typescript
// Warm up embedding model
await embed("warmup");
console.log("Embedding model ready");
```

### Container Storage

If you didn't configure volumes, your data disappears when Docker restarts.

```yaml
# Wrong: no volume
services:
  qdrant:
    image: qdrant/qdrant:latest

# Right: persistent storage
services:
  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - ./qdrant_storage:/qdrant/storage
```

The volume maps a local folder to the container's storage directory. Your vectors survive restarts.

---

## Performance Tips

A few optimizations I've learned the hard way.

### Batch Your Upserts

Don't insert one vector at a time:

```typescript
// Slow: one at a time
for (const point of points) {
  await qdrant.upsert(COLLECTION, { points: [point] });
}

// Fast: batched
await qdrant.upsert(COLLECTION, { points });
```

Batches of 100-500 points are optimal. Network overhead dominates for small batches. Memory pressure appears for huge batches.

### Use Scroll for Bulk Reads

If you need to read many vectors (for reprocessing, export, etc.), use scroll instead of search:

```typescript
let offset: string | undefined;

while (true) {
  const response = await qdrant.scroll(COLLECTION, {
    limit: 1000,
    offset,
    with_payload: true,
    with_vector: true,
  });

  if (response.points.length === 0) break;

  // Process response.points...

  offset = response.next_page_offset;
}
```

Scroll is paginated and efficient for bulk operations.

### Filter Before Searching

If you know you only want results from certain files or directories, filter first:

```typescript
await qdrant.search(COLLECTION, {
  vector: queryVector,
  limit: 10,
  filter: {
    must: [
      {
        key: "filePath",
        match: { value: "src/components/" },
      },
    ],
  },
});
```

Filters narrow the search space before the expensive vector comparison. Much faster than filtering after.

---

## What's Next

You now have a working semantic search system.

Code goes in. Meaning-aware search comes out.

But there's more to explore:

**Incremental indexing.** Only re-embed changed files. Track file hashes, compare on each run.

**Hybrid search.** Combine keyword and semantic search. Use keywords for exact matches, semantics for fuzzy matches.

**Query expansion.** Use an LLM to rephrase queries before searching. "form validation" becomes "form validation, input checking, data sanitization, schema verification."

**Relevance feedback.** Track which results users click. Use that signal to improve rankings.

**Multi-collection search.** Separate collections for components, hooks, schemas. Search specific types of code.

The foundation is built. Now you can extend it.

---

## Quick Reference

### Docker Compose

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_data:/root/.ollama
    restart: unless-stopped
```

### Essential Commands

```bash
# Start services
docker compose up -d

# Pull embedding model
docker exec ollama ollama pull nomic-embed-text

# Check Qdrant health
curl http://localhost:6333/

# List collections
curl http://localhost:6333/collections
```

### TypeScript Snippets

```typescript
// Create client
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

// Create collection
await qdrant.createCollection("name", {
  vectors: { size: 768, distance: "Cosine" }
});

// Insert vectors
await qdrant.upsert("name", {
  points: [{ id: 1, vector: [...], payload: {...} }]
});

// Search
const results = await qdrant.search("name", {
  vector: queryVector,
  limit: 10,
  with_payload: true
});

// Delete collection
await qdrant.deleteCollection("name");
```

---

## Glossary

| Term | Plain English |
|------|---------------|
| **Vector** | A list of numbers representing location in meaning-space |
| **Embedding** | Converting text to a vector |
| **Vector Database** | Database that stores and searches vectors by similarity |
| **Qdrant** | The specific vector database we use |
| **Ollama** | Tool for running AI models locally |
| **nomic-embed-text** | The specific embedding model (768 dimensions) |
| **Collection** | Like a database table, but for vectors |
| **HNSW** | Algorithm for fast approximate nearest neighbor search |
| **Cosine Similarity** | Math for measuring how similar two vectors are |
| **Payload** | Metadata stored alongside each vector |
| **Upsert** | Insert or update (if ID already exists) |

---

That's semantic search with Qdrant.

A database that understands "similar to."

Your code search just got a lot smarter.
