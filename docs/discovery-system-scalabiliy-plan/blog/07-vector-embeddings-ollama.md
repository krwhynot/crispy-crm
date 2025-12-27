# Vector Embeddings with Ollama: Meaning as Coordinates

You search for "authentication" and get zero results.

But your codebase handles authentication. You wrote that code last month. It is called `SessionGuard`. And `CredentialValidator`. And `useLoginFlow`.

None of those contain the word "authentication."

Keyword search fails.

---

## GPS for Meaning

An embedding is a list of numbers that represents meaning.

That is the whole idea. Everything else is implementation.

For the model we use (nomic-embed-text), it is 768 numbers. Each number captures one facet of meaning. Combined, they place any concept in a 768-dimensional space.

It is like GPS coordinates for ideas.

New York City: 40.7128, -74.0060
Los Angeles: 34.0522, -118.2437

Cities that are close have similar coordinates. You can tell just by looking at the numbers.

Now imagine coordinates for concepts:

```
"authentication" → [0.82, 0.15, 0.44, ...]
"login flow"     → [0.81, 0.16, 0.43, ...]
"database migration" → [0.12, 0.89, 0.23, ...]
```

The first two are neighbors. They mean similar things.

The third is far away. Different concept entirely.

Distance in embedding space equals distance in meaning space.

---

## Why 768 Numbers?

Because meaning is multidimensional.

Consider "authentication":
- It relates to security
- It involves user identity
- It includes session management
- It touches cryptography

No single number captures all of this.

But 768 numbers, each measuring a different aspect, can approximate the full meaning. It is like describing a person. Height alone does not identify anyone. Height plus weight plus age plus eye color eventually becomes unique.

Combine enough measurements and you distinguish any concept.

---

## Why Local Inference?

Cloud embedding APIs exist. OpenAI's `text-embedding-3-small`. Cohere's Embed.

We chose Ollama. Here is why.

**Cost**

OpenAI charges $0.02 per million tokens. Sounds cheap.

Your 2-million-line codebase has roughly 10 million tokens. First run: $0.20. But you re-embed constantly. Every file change. Every new file. During development, maybe 100 files per day.

Over a year, costs compound.

Local embedding costs exactly $0.00. Forever.

**Privacy**

Your code contains trade secrets. Proprietary algorithms. Maybe credentials that slipped through review.

Cloud APIs mean your code leaves your network. Compliance may prohibit it.

Ollama runs on your machine. Your code never leaves. Period.

**Speed**

Cloud APIs have network latency. 50-100ms per request minimum. Rate limits throttle bulk operations.

Local inference on a modern CPU runs in 10-50ms. No rate limits. No cold starts after warmup.

**Quality Tradeoff**

Cloud models score 5-10% higher on benchmarks.

For code search, this rarely matters. We are not asking the model to understand Proust. We are asking if "authentication" and "login" are related.

Local models handle that fine.

---

## Setting Up Ollama

Ollama is a tool for running AI models locally with a simple API.

It is like Docker for AI models. Pull, run, done.

**Install on macOS:**
```bash
brew install ollama && ollama serve
```

**Install on Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
```

**Pull the embedding model:**
```bash
ollama pull nomic-embed-text
```

Downloads about 274MB. Ready to use.

**Test it:**
```bash
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "hello world"}'
```

You should see 768 numbers in the response.

That is it.

---

## Generating Embeddings

Here is a minimal client:

```typescript
const OLLAMA_URL = 'http://localhost:11434';

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  const { embedding } = await response.json();
  return embedding;
}
```

Using it:

```typescript
const vector = await embed("user authentication flow");
console.log(vector.length);  // 768
```

Those 768 numbers now represent "user authentication flow" in meaning-space.

One gotcha: the first request takes 3-10 seconds while Ollama loads the model into memory. Warm up during initialization:

```typescript
await embed("warmup");
```

Now subsequent embeds are fast.

---

## Why nomic-embed-text?

We chose this model specifically.

**768 dimensions**

OpenAI's ada-002 uses 1536. Double the storage for marginal improvement. For code search, 768 is plenty.

**Trained on code**

Pure natural language models struggle with code. Pure code models struggle with queries. nomic-embed-text handles both. It is like a translator fluent in two languages.

**8192 token context**

Long enough for substantial code chunks. A 300-line function fits easily.

Some models have 512 token limits. They choke on real code. If your chunk exceeds 8192 tokens, the model truncates silently. Check before embedding.

**CPU-efficient**

Runs comfortably without GPU. 10-50ms per embedding on a modern laptop. GPU acceleration drops that to 5ms but is not required.

---

## Embedding Code Well

Natural language has consistent structure. Sentences. Paragraphs.

Code has variable naming that differs wildly:

```typescript
// Dense
const f = (a, b) => a.map(x => x * b);

// Verbose
function multiplyArray(numbers: number[], factor: number) {
  return numbers.map(num => num * factor);
}
```

These do the same thing. Their embeddings should be similar.

To help the model, augment code with context:

```typescript
function prepareForEmbedding(chunk: CodeChunk): string {
  return [
    `File: ${chunk.filePath}`,
    `Type: ${chunk.kind}`,
    `Name: ${chunk.name}`,
    chunk.content
  ].join('\n');
}
```

Now when someone searches "authentication guard," the embedding captures both code structure and semantic context. It is like adding labels to a museum exhibit. The art speaks for itself, but labels help visitors find what they want.

---

## Cosine Similarity

Cosine similarity measures the angle between two vectors.

It is like comparing the direction two arrows point.

Same direction: cosine 1, identical meaning.
Perpendicular: cosine 0, unrelated.
Opposite: cosine -1, opposite meaning.

```
     ↗ "authentication"
    /
   / small angle
  /
 → "login"         (cosine ≈ 0.92)


     ↗ "authentication"
    /
  ────→ "database migration"   (cosine ≈ 0.31)
```

Implementation:

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

Interpretation:
- 0.9+ : Nearly identical
- 0.7-0.9 : Closely related
- 0.5-0.7 : Somewhat related
- Below 0.5 : Likely unrelated

---

## Semantic Search in 20 Lines

```typescript
class SemanticSearch {
  private chunks: CodeChunk[] = [];
  private embeddings: number[][] = [];

  async index(chunks: CodeChunk[]) {
    this.chunks = chunks;
    this.embeddings = await Promise.all(
      chunks.map(c => embed(prepareForEmbedding(c)))
    );
  }

  async search(query: string, limit = 10) {
    const queryVec = await embed(query);
    return this.chunks
      .map((chunk, i) => ({ chunk, score: cosineSimilarity(queryVec, this.embeddings[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
```

No keyword matching. Pure semantic similarity.

Search for "form validation logic" and get:

```
[0.847] src/validation/schemas/contact.ts - contactSchema
[0.823] src/hooks/useFormValidator.ts - useFormValidator
[0.801] src/components/ContactForm.tsx - ContactForm
```

The search finds relevant code even when names differ.

It is like asking a librarian for "books about cooking" and getting results whether the title says "cuisine," "recipes," or "culinary arts."

---

## Failure Modes

Embeddings are not magic. Learn the limits.

**Garbage in, garbage out**

```typescript
// Terrible for semantic search
const x = a.b(c, d);

// Good for semantic search
const validatedContact = validateContact(formData);
```

If your code has no meaningful names, embeddings capture no meaning. Descriptive naming helps humans and embeddings alike. It is like trying to organize a library where every book is titled "Book."

**Model incompatibility**

Embeddings from different models are incompatible. nomic-embed-text vectors mean nothing to OpenAI's ada-002.

Switch models? Re-embed everything. Old vectors become garbage.

**Novel concepts**

Embeddings capture statistical patterns from training data. They are not reasoning.

"authentication" and "login" cluster together because they co-occur in training data. Your company's unique jargon will not embed well unless it appeared in training.

It is like asking someone to translate a language they have never heard.

---

## Performance at Scale

10,000 chunks at 50ms each equals 8+ minutes.

For large codebases:

**Incremental embedding**

Only embed changed files. Hash content and skip unchanged:

```typescript
const hash = crypto.createHash('sha256').update(content).digest('hex');
if (existingHashes.has(hash)) return existingEmbeddings.get(hash);
```

**Parallel batching**

Pipeline requests instead of sequential:

```typescript
const batch = texts.slice(i, i + 10);
const results = await Promise.all(batch.map(embed));
```

**GPU acceleration**

If available, Ollama uses it automatically. 50ms becomes 5ms.

---

## What is Next

We can generate embeddings and compare them. But our search is O(n): compare against every chunk.

At 10,000 chunks? Maybe 100ms. Tolerable.

At 1,000,000 chunks? 10 seconds. Unusable.

The next article covers smart chunking and vector storage with LanceDB. How to store millions of embeddings efficiently. How to search in milliseconds.

The geometry is ready. Now we need infrastructure.

---

## Quick Reference

**Install:**
```bash
brew install ollama && ollama serve
ollama pull nomic-embed-text
```

**Embed:**
```typescript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
});
const { embedding } = await response.json();
```

**Compare:**
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

---

*Part 7 of 12: Building Local Code Intelligence*
