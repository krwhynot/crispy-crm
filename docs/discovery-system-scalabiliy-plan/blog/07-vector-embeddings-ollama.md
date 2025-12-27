# Vector Embeddings with Ollama: Meaning as Coordinates

You search for "authentication" and get zero results.

But your codebase handles authentication. You wrote that code last month. It is called `SessionGuard`. And `CredentialValidator`. And `useLoginFlow`.

None of those contain the word "authentication." Keyword search fails.

Now imagine a search that understands meaning. You search for "authentication" and it returns `SessionGuard`, `CredentialValidator`, and `useLoginFlow`. Not because they contain matching text, but because they *mean* similar things.

That is what embeddings enable.

---

## The GPS Analogy

GPS coordinates represent physical location as numbers.

New York City: 40.7128, -74.0060
Los Angeles: 34.0522, -118.2437
Paris: 48.8566, 2.3522

Cities that are geographically close have numerically similar coordinates. San Francisco (37.7749, -122.4194) is closer to Los Angeles than to New York. You can tell just by looking at the numbers.

Now imagine coordinates for *meaning*.

"authentication" might be [0.82, 0.15, 0.44, 0.67, ...]
"login flow" might be [0.81, 0.16, 0.43, 0.68, ...]
"database migration" might be [0.12, 0.89, 0.23, 0.34, ...]

The first two are close together. They mean similar things. The third is far away. Different concept entirely.

Embeddings are GPS coordinates for meaning. Similar ideas have similar coordinates. Distance in embedding space corresponds to distance in semantic space.

That is the entire insight. Everything else is implementation details.

---

## What Embeddings Actually Capture

An embedding is a list of numbers. For the model we use (nomic-embed-text), it is 768 numbers.

Why 768? Because meaning is multidimensional.

Consider the concept "authentication":
- It relates to security (one dimension)
- It involves user identity (another dimension)
- It includes session management (another dimension)
- It touches cryptography (another dimension)
- It affects user experience (another dimension)

No single number captures all of this. But 768 numbers, each capturing a different facet, can approximate the full meaning.

Think of it like describing a person. Height alone does not uniquely identify anyone. But height + weight + age + eye color + shoe size + ... eventually becomes unique. Combine enough measurements and you distinguish any individual.

Embeddings measure 768 aspects of meaning. Combine them and you distinguish any concept.

The magic is in how similar concepts cluster:

```
"user authentication"       → [0.82, 0.15, 0.44, ...]
"login verification"        → [0.81, 0.16, 0.43, ...]  // Very close
"password validation"       → [0.79, 0.18, 0.41, ...]  // Still close
"credential checking"       → [0.80, 0.17, 0.42, ...]  // Same neighborhood

"database schema migration" → [0.12, 0.89, 0.23, ...]  // Far away
"unit test framework"       → [0.23, 0.67, 0.56, ...]  // Different neighborhood
```

To find code related to authentication, you embed your query and find vectors near it. No keyword matching. No synonym dictionaries. The geometry does the work.

---

## Why Local Inference with Ollama

Cloud embedding APIs exist. OpenAI's `text-embedding-3-small`. Cohere's Embed. Google's Gecko.

We chose local inference with Ollama. Here is why.

**Cost: Zero vs. Recurring**

OpenAI charges $0.02 per million tokens. That sounds cheap.

Your 2-million-line codebase has roughly 10 million tokens. First embedding run: $0.20.

But you re-embed constantly. Every time a file changes. Every time you add code. During development, you might re-embed 100 files per day.

Over a year, with a team of developers, costs compound. Local embedding costs exactly $0.00, forever.

**Privacy: Complete**

Your code contains trade secrets. Proprietary algorithms. Maybe credentials that slipped through review.

Cloud APIs mean your code leaves your network. Even with trusted providers, security teams worry. Compliance requirements may prohibit it. Data breaches happen.

Ollama runs on your machine. Your code never leaves. Complete air-gap possible.

**Speed: Competitive**

Cloud APIs have network latency. 50-100ms per request, minimum. Rate limits throttle bulk operations. Cold starts add seconds.

Local inference on a modern CPU runs in 10-50ms per embedding. No rate limits. No cold starts after the first request.

**Tradeoff: Slightly Lower Quality**

Cloud models are trained on more data with more compute. They score 5-10% higher on embedding benchmarks.

For code search, this rarely matters. We are not asking the model to understand Proust. We are asking if "authentication" and "login" are related concepts. Local models handle this fine.

---

## Setting Up Ollama

Ollama makes running local AI models trivially easy.

**Install on macOS:**
```bash
brew install ollama
ollama serve
```

**Install on Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
```

**Install via Docker:**
```bash
docker run -d -p 11434:11434 --name ollama ollama/ollama
```

**Pull the embedding model:**
```bash
ollama pull nomic-embed-text
```

This downloads about 274MB. The model is now ready to use.

**Test it:**
```bash
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "hello world"}'
```

You should see a JSON response with an `embedding` array containing 768 numbers.

Ollama is running. Time to write code.

---

## Generating Embeddings in TypeScript

Here is a minimal embedding client:

```typescript
// scripts/discover/embeddings/ollama.ts

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'nomic-embed-text';

interface EmbeddingResponse {
  embedding: number[];
}

export async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding failed: ${response.status} ${response.statusText}`
    );
  }

  const data: EmbeddingResponse = await response.json();

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding response');
  }

  return data.embedding;
}
```

Using it:

```typescript
const vector = await embed("user authentication flow");
console.log(`Dimensions: ${vector.length}`);  // 768
console.log(`Sample: ${vector.slice(0, 5).map(n => n.toFixed(4))}`);
// Sample: 0.0234,-0.1567,0.7891,0.2341,-0.5673
```

Those 768 numbers now represent "user authentication flow" in meaning-space.

---

## nomic-embed-text: Why This Model

We chose `nomic-embed-text` specifically. Here is why.

**768 dimensions**

A good balance. Enough to capture nuance. Not so many that storage explodes.

OpenAI's ada-002 uses 1536 dimensions. Double the storage for marginal quality improvement. For code search, 768 is plenty.

**Trained on diverse data including code**

nomic-embed-text was trained on a mix of natural language and code. It understands that "function" in code is different from "function" in math.

Pure natural language models struggle with code. Pure code models struggle with natural language queries. This model handles both.

**8192 token context window**

Long enough to embed substantial code chunks. A 300-line function with comments fits easily.

Some models have 512 token limits. They choke on real code.

**CPU-efficient**

Runs comfortably on a laptop without GPU. Inference is 10-50ms per embedding on a modern MacBook.

GPU acceleration is possible but not required. The CPU path is production-viable.

**Open weights**

The model weights are publicly available. No API keys. No usage tracking. Full control.

---

## Embedding Code vs. Natural Language

Code embeddings require care.

Natural language has consistent structure. Sentences. Paragraphs. Punctuation.

Code has variable naming, syntax, and structure that differs wildly:

```typescript
// Dense, minified style
const f=(a,b)=>a.map(x=>x*b).filter(x=>x>0);

// Verbose, documented style
/**
 * Multiplies each element by factor and filters positive results.
 * @param numbers - Input array
 * @param factor - Multiplication factor
 * @returns Positive products only
 */
function multiplyAndFilterPositive(
  numbers: number[],
  factor: number
): number[] {
  return numbers
    .map(num => num * factor)
    .filter(product => product > 0);
}
```

These do the same thing. Their embeddings should be similar.

To help the model, we augment code chunks with context:

```typescript
function prepareForEmbedding(chunk: CodeChunk): string {
  const parts: string[] = [];

  // Add file context
  parts.push(`File: ${chunk.filePath}`);

  // Add type information
  if (chunk.kind) {
    parts.push(`Type: ${chunk.kind}`);  // "function", "class", "hook", etc.
  }

  // Add the name prominently
  if (chunk.name) {
    parts.push(`Name: ${chunk.name}`);
  }

  // Add any documentation
  if (chunk.documentation) {
    parts.push(`Description: ${chunk.documentation}`);
  }

  // Add the actual code
  parts.push('Code:');
  parts.push(chunk.content);

  return parts.join('\n');
}
```

Example output:

```
File: src/auth/SessionGuard.tsx
Type: component
Name: SessionGuard
Description: Protects routes by checking authentication status.
Code:
export function SessionGuard({ children }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;

  return <>{children}</>;
}
```

Now when someone searches "authentication guard," the embedding captures both the code structure and the semantic context.

---

## Batch Embedding for Performance

Embedding one chunk at a time is slow for large codebases.

10,000 chunks at 50ms each = 500 seconds = 8+ minutes.

Ollama supports batch requests:

```typescript
async function embedBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Ollama processes sequentially, but we can pipeline requests
  const batchSize = 10;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const promises = batch.map(text =>
      embed(text).catch(err => {
        console.error(`Embedding failed for chunk: ${err.message}`);
        return new Array(768).fill(0);  // Zero vector as fallback
      })
    );

    const results = await Promise.all(promises);
    embeddings.push(...results);

    // Progress indicator
    if ((i + batchSize) % 100 === 0) {
      console.log(`Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length}`);
    }
  }

  return embeddings;
}
```

Parallel requests within batches speed things up. But watch memory usage. Each embedding in flight consumes resources.

For very large codebases, consider:

**Incremental embedding**

Only embed changed files. Hash file contents and skip if unchanged.

```typescript
const contentHash = crypto.createHash('sha256')
  .update(chunk.content)
  .digest('hex');

if (existingHashes.has(contentHash)) {
  // Reuse existing embedding
  return existingEmbeddings.get(contentHash);
}
```

**GPU acceleration**

If you have a CUDA-capable GPU, Ollama uses it automatically. Embeddings drop from 50ms to 5ms.

**Model caching**

Ollama keeps models in memory after first use. The first embedding is slow (model loading). Subsequent embeddings are fast.

Warm up the model at startup:

```typescript
// Warm up during initialization
await embed("warmup");
console.log("Embedding model ready");
```

---

## Deep Dive: Cosine Similarity

We can generate embeddings. Now we need to compare them.

The standard measure is cosine similarity.

Imagine two arrows pointing from the origin. Cosine similarity measures the angle between them.

If they point the same direction: angle 0, cosine 1, identical meaning.

If they are perpendicular: angle 90, cosine 0, unrelated meaning.

If they point opposite directions: angle 180, cosine -1, opposite meaning.

```
     ↗ "authentication"
    /
   / small angle
  /
 → "login"         (cosine ≈ 0.92, very similar)


     ↗ "authentication"
    /
   /
  /
  ────────→ "database migration"   (cosine ≈ 0.31, quite different)
```

Implementation:

```typescript
// scripts/discover/embeddings/similarity.ts

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
```

Interpretation:
- 0.9+ : Very similar
- 0.7-0.9 : Related
- 0.5-0.7 : Somewhat related
- 0.3-0.5 : Weakly related
- Below 0.3 : Probably unrelated

Testing it:

```typescript
const authEmbedding = await embed("user authentication");
const loginEmbedding = await embed("login verification");
const dbEmbedding = await embed("database schema");

console.log("auth vs login:", cosineSimilarity(authEmbedding, loginEmbedding));
console.log("auth vs db:", cosineSimilarity(authEmbedding, dbEmbedding));
```

Output:
```
auth vs login: 0.9234
auth vs db: 0.3156
```

The numbers confirm our intuition. Authentication and login are semantically close. Authentication and database schemas are not.

---

## Watch Out For

Embeddings have failure modes. Learn them before they surprise you.

**Model loading latency**

Ollama loads models lazily. First request takes 3-10 seconds while the model loads into memory.

In production, warm up during initialization. Do not let the first user query pay the loading cost.

```typescript
// At startup
await embed("warmup");
// Now all subsequent embeds are fast
```

**Context window overflow**

nomic-embed-text handles 8192 tokens. Exceed that and the model truncates silently.

A 500-line function might exceed the limit. Check before embedding:

```typescript
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for code
  return Math.ceil(text.length / 4);
}

function safeEmbed(text: string): Promise<number[]> {
  const tokens = estimateTokens(text);
  if (tokens > 8000) {
    console.warn(`Text too long (${tokens} tokens), truncating`);
    text = text.slice(0, 32000);  // ~8000 tokens
  }
  return embed(text);
}
```

**Garbage in, garbage out**

If your code has no meaningful names, embeddings capture no meaning.

```typescript
// Terrible for semantic search
const x = a.b(c, d);

// Good for semantic search
const validatedContact = validateContact(formData);
```

Descriptive naming helps humans and embeddings alike.

**Embedding drift across models**

Embeddings from different models are incompatible. nomic-embed-text vectors mean nothing to OpenAI's ada-002.

If you switch models, re-embed everything. Old vectors become garbage.

**Not magic**

Embeddings capture statistical patterns from training data. They are not reasoning.

"authentication" and "login" cluster together because they co-occur in training data. Novel concepts without training examples will not embed well.

Do not expect the model to understand your company's unique jargon unless that jargon appears in its training data.

---

## Practical Example: Semantic Code Search

Let us build a simple semantic search:

```typescript
// scripts/discover/embeddings/search.ts

interface CodeChunk {
  content: string;
  filePath: string;
  name: string;
  kind: string;
}

interface SearchResult {
  chunk: CodeChunk;
  score: number;
}

class SemanticSearch {
  private chunks: CodeChunk[] = [];
  private embeddings: number[][] = [];

  async index(chunks: CodeChunk[]): Promise<void> {
    this.chunks = chunks;

    console.log(`Indexing ${chunks.length} chunks...`);

    this.embeddings = await embedBatch(
      chunks.map(c => prepareForEmbedding(c))
    );

    console.log(`Indexing complete`);
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const queryEmbedding = await embed(query);

    const scored = this.chunks.map((chunk, i) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, this.embeddings[i]),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// Usage
const search = new SemanticSearch();

await search.index(codeChunks);

const results = await search.search("form validation logic");

for (const { chunk, score } of results) {
  console.log(`[${score.toFixed(3)}] ${chunk.filePath} - ${chunk.name}`);
}
```

Output:
```
[0.847] src/validation/schemas/contact.ts - contactSchema
[0.823] src/hooks/useFormValidator.ts - useFormValidator
[0.801] src/components/ContactForm.tsx - ContactForm
[0.756] src/utils/sanitize.ts - sanitizeInput
[0.734] src/validation/schemas/organization.ts - organizationSchema
```

No keyword matching. Pure semantic similarity. The search finds relevant code even when names differ.

---

## What is Next

We can generate embeddings and compare them. But our current search is O(n): we compare against every chunk.

At 10,000 chunks, that is maybe 100ms. Tolerable.

At 1,000,000 chunks, that is 10 seconds. Unusable.

The next article covers smart chunking and vector storage with LanceDB. How to store millions of embeddings efficiently. How to search in milliseconds instead of seconds. How to add metadata filtering.

The geometry is ready. Now we need infrastructure.

---

## Quick Reference

**Install Ollama:**
```bash
# macOS
brew install ollama && ollama serve

# Linux
curl -fsSL https://ollama.com/install.sh | sh && ollama serve

# Docker
docker run -d -p 11434:11434 ollama/ollama
```

**Pull embedding model:**
```bash
ollama pull nomic-embed-text
```

**Generate embedding:**
```typescript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
});
const { embedding } = await response.json();
// embedding is number[768]
```

**Cosine similarity:**
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Similarity interpretation:**
- 0.9+ : Nearly identical meaning
- 0.7-0.9 : Closely related
- 0.5-0.7 : Somewhat related
- < 0.5 : Likely unrelated

---

*This is part 7 of a 12-part series on building local code intelligence.*
