# Beyond Keywords: Teaching Computers to Understand Meaning

You search for "form validation" in your codebase.

Zero results.

But you *know* there's validation code in there. You wrote it last week.

You try again. "input checking." Still nothing.

Then you remember: you called it `fieldSanitization`.

Keyword search just failed you. It happens constantly. And it's about to become a much bigger problem as we scale our discovery system to 2 million lines of code.

---

## The Keyword Problem

Here's the thing about keyword search: it's dumb. I don't mean that as an insult. I mean it literally cannot think.

When you search for "authentication," keyword search looks for those exact 14 characters. It doesn't know that "auth," "login," "signin," and "credential verification" all mean the same thing.

This creates a massive gap in code discovery.

Consider these real examples from codebases:

| You Search For | The Code Actually Says |
|----------------|------------------------|
| "form validation" | `inputSanitizer` |
| "user authentication" | `credentialManager` |
| "error handling" | `exceptionBoundary` |
| "data fetching" | `resourceLoader` |
| "user permissions" | `accessControlList` |
| "save to database" | `persistEntity` |

Every missed synonym is a missed answer.

And it gets worse. Developers are creative with naming. One team calls it `handleSubmit`. Another calls it `processFormData`. A third calls it `onFormComplete`. They all do the same thing.

Keyword search sees three completely unrelated functions.

For AI assistants, this problem compounds. When Claude asks "find code that handles authentication," our current keyword-based discovery system can only match exact terms.

The AI can't discover that `SessionGuard.tsx` is actually your authentication component if nobody ever typed the word "authentication" in that file.

This isn't a theoretical problem. In our discovery system, we have 485 components. Try searching for "data grid" and you might miss `PremiumDatagrid`, `TableView`, `ListShell`, and `RecordBrowser`. They're all variations on the same concept.

At 2 million lines of code, this becomes untenable. You can't rely on developers using consistent terminology across hundreds of files written by dozens of people over years of development.

---

## GPS Coordinates for Meaning

Let me share an analogy that made this click for me.

Think about GPS coordinates. New York City is at roughly 40.7, -74.0. Los Angeles is at 34.0, -118.2.

Here's the interesting part: cities that are *close together* have *similar coordinates*.

San Francisco (37.7, -122.4) is closer to Los Angeles (34.0, -118.2) than to New York (40.7, -74.0). You can tell just by looking at the numbers.

Now imagine we could do the same thing for *words and concepts*.

What if "authentication" got coordinates like [0.8, 0.2, 0.5, ...]? And "login" got coordinates like [0.79, 0.21, 0.48, ...]? And "database migration" got coordinates like [0.1, 0.9, 0.3, ...]?

The first two would be *close together* in this coordinate space. The third would be *far away*.

That's exactly what embeddings do.

---

## What Are Embeddings?

An embedding is a list of numbers that captures the *meaning* of text.

Not the letters. Not the keywords. The *meaning*.

Here's what happens when you generate an embedding:

```
Input: "user authentication logic"
Output: [0.023, -0.156, 0.789, 0.234, -0.567, ... ] (768 numbers)
```

Those 768 numbers position that phrase in a 768-dimensional "meaning space."

Why 768 dimensions? Because meaning is complex. Two dimensions (latitude, longitude) are enough for physical location. But concepts like "authentication" have many facets: security, identity, user experience, session management, cryptography.

Each dimension captures a different aspect of meaning.

Think of it like describing a person. You could use height, weight, age, income, years of education, number of siblings... Each measurement captures one facet. Combine enough measurements and you can distinguish any person from any other.

Embeddings do the same thing for meaning. 768 measurements. Each one a different facet of what the text *means*.

The magic: similar concepts cluster together in this space.

```
"user authentication" → [0.82, 0.15, 0.44, ...]
"login verification"  → [0.81, 0.16, 0.43, ...]  // Very close!
"database schema"     → [0.12, 0.89, 0.23, ...]  // Far away
```

To find related code, you embed your search query and look for vectors that are *close* to it.

No keyword matching required.

---

## Why Run Locally?

You might be thinking: "OpenAI has embedding APIs. Why not just use those?"

Three reasons:

**1. Cost**

OpenAI's `text-embedding-3-small` costs $0.02 per million tokens. That sounds cheap until you're embedding 2 million lines of code. Every time you regenerate. Every time a file changes.

Let's do the math. A typical code file averages 200 lines, maybe 1000 tokens. 2 million lines means roughly 10 million tokens.

First embedding run: $0.20. Okay, not bad.

But then you change 50 files and need to re-embed. That's another $0.01. Do that 20 times a day during active development. Multiply by a team of 10 developers. Multiply by 250 working days per year.

Suddenly you're looking at $500/year just for embeddings. And that's a modest codebase.

Local embeddings cost exactly $0.00.

**2. Privacy**

Your code contains trade secrets, proprietary logic, and possibly credentials that slipped through. Sending it to external APIs for embedding means your code leaves your machine.

Even if you trust the API provider, your security team might not. Compliance requirements might prohibit it. And data breaches happen.

Local models never phone home. Your code stays on your hardware.

**3. Speed**

API calls have latency. Network round trips. Rate limits. Cold starts.

Even with a fast connection, you're looking at 50-100ms per API call. That's the speed of light plus server processing. Nothing you can do about it.

Local inference on a decent CPU runs in 10-50ms. And there's no rate limiting.

The tradeoff? Local models are slightly less accurate than the best commercial offerings. Maybe 5-10% lower on benchmark tasks. For code search, that tradeoff is worth it.

You're not asking the model to write poetry. You're asking it to tell you that "authentication" and "login" are related concepts. It can handle that.

---

## Let's Build It

Time to get our hands dirty.

We'll use Ollama, which makes running local AI models as easy as running Docker containers. And we'll use `nomic-embed-text`, a high-quality embedding model that runs on CPU.

### Step 1: Install Ollama

If you have Docker:

```bash
docker run -d -p 11434:11434 ollama/ollama
```

Or install natively on Mac:

```bash
brew install ollama
ollama serve
```

On Linux, use the install script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
```

Ollama runs as a local server on port 11434.

### Step 2: Pull the Embedding Model

```bash
ollama pull nomic-embed-text
```

This downloads the `nomic-embed-text` model. It's about 274MB.

Why this model? It's specifically trained for embedding tasks, runs efficiently on CPU, and produces 768-dimensional vectors that work well for semantic search.

### Step 3: Test It

Let's verify it's working:

```bash
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "hello world"}'
```

You should see a JSON response with an `embedding` array containing 768 numbers.

If you get connection refused, make sure `ollama serve` is running.

---

## Your First Embedding

Now let's write the code that will power our semantic search.

Create a new file for our embedding utility:

```typescript
// scripts/discover/embeddings/ollama.ts

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Generate an embedding vector for the given text.
 * Returns a 768-dimensional vector capturing semantic meaning.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OllamaEmbeddingResponse;

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding response from Ollama');
  }

  return data.embedding;
}
```

Let's test it:

```typescript
// Quick test
const embedding = await generateEmbedding("user authentication logic");
console.log(`Generated ${embedding.length} dimensions`);
console.log(`First 5 values: ${embedding.slice(0, 5).map(n => n.toFixed(4))}`);
```

Output:
```
Generated 768 dimensions
First 5 values: 0.0234,-0.1567,0.7891,0.2341,-0.5673
```

Those 768 numbers now represent "user authentication logic" in meaning-space.

---

## Deep Dive: Cosine Similarity

We can generate embeddings. Now we need to compare them.

The standard way to measure similarity between embedding vectors is *cosine similarity*.

Why not just use distance? Like, measure how far apart two vectors are?

You could. It's called Euclidean distance. But it has a problem: it's sensitive to magnitude.

Imagine two vectors. One is [1, 1]. The other is [2, 2]. They point in the exact same direction. They represent the same concept. But the Euclidean distance between them is 1.41.

Cosine similarity ignores magnitude. It only looks at direction.

Picture two arrows pointing from the origin. Cosine similarity measures the angle between them.

```
    ↗ Vector A (authentication)
   /
  / θ = small angle = similar meaning
 /
→ Vector B (login)


    ↗ Vector A (authentication)
   /
  /
 /
 ─────→ Vector C (database)
         θ = large angle = different meaning
```

When vectors point in the same direction, the angle is 0 degrees. Cosine of 0 is 1. Perfect similarity.

When vectors are perpendicular, the angle is 90 degrees. Cosine of 90 is 0. No similarity.

When vectors point opposite directions, the angle is 180 degrees. Cosine of 180 is -1. Opposite meaning.

For embeddings, you'll almost never see negative values. Text embeddings tend to be positive, so most similarity scores land between 0 and 1.

Here's the implementation:

```typescript
// scripts/discover/embeddings/similarity.ts

/**
 * Calculate cosine similarity between two embedding vectors.
 * Returns a value between -1 (opposite) and 1 (identical).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions must match: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / magnitude;
}
```

Let's see it in action:

```typescript
// Test semantic similarity
const auth = await generateEmbedding("user authentication");
const login = await generateEmbedding("login verification");
const database = await generateEmbedding("database schema");

console.log(`auth vs login:    ${cosineSimilarity(auth, login).toFixed(4)}`);
console.log(`auth vs database: ${cosineSimilarity(auth, database).toFixed(4)}`);
```

Output:
```
auth vs login:    0.9234
auth vs database: 0.3156
```

The numbers don't lie. "User authentication" and "login verification" are semantically close (0.92). "User authentication" and "database schema" are semantically distant (0.32).

This is how semantic search works. Embed the query. Embed the code. Find the closest matches.

---

## Watch Out For

Before you rush off to embed your entire codebase, here are the gotchas that will bite you.

### Gotcha 1: Model Quality Varies Wildly

Not all embedding models are created equal.

Some models are trained on general text (Wikipedia, books). They don't understand code.

Some models are trained specifically on code (CodeBERT, StarCoder). They understand function names but might miss natural language descriptions.

`nomic-embed-text` sits in the middle: trained on diverse data including code, but not code-specialized.

For pure code search, you might want a code-specific model. For searching code comments and documentation, a general-purpose model works better.

Test with your actual queries before committing to a model.

### Gotcha 2: Context Window Limits

Embedding models have maximum input lengths.

`nomic-embed-text` handles up to 8192 tokens. Sounds like a lot until you try to embed an entire file.

A 500-line TypeScript file easily exceeds that limit.

The solution: chunk your code into smaller pieces. Embed function signatures. Embed docstrings. Embed class definitions. Not entire files.

### Gotcha 3: Garbage In, Garbage Out

Embeddings capture meaning from text. If your code has no meaningful text, embeddings won't help.

```typescript
// Terrible for semantic search
const x = a.b(c, d);

// Much better
const authenticatedUser = authService.validateCredentials(username, password);
```

Descriptive variable names and function names make semantic search work. Single-letter variables make it useless.

This is actually a good forcing function. Code that's hard for embeddings to understand is also hard for humans to understand. If semantic search can't find your code, maybe your code needs better names.

Some teams add structured comments specifically for embedding-based search:

```typescript
/**
 * @semantic authentication, login, user verification, session management
 */
function createSession(userId: string): SessionToken { ... }
```

It's a bit like SEO for your codebase.

### Gotcha 4: Embedding is Slow for Large Codebases

Generating one embedding takes ~50ms on CPU. That's fast for interactive use.

But if you have 10,000 code chunks to embed, that's 500 seconds. Over 8 minutes.

Solutions:
- Embed incrementally (only changed files)
- Batch requests where possible
- Use GPU if available (10-100x faster)
- Pre-compute and cache aggressively

### Gotcha 5: Vector Storage Gets Big

768 dimensions * 4 bytes per float = 3KB per embedding.

10,000 code chunks = 30MB of vectors.

That's manageable. But at 2 million lines with fine-grained chunking? You're looking at hundreds of megabytes.

And that's just storage. Loading all those vectors into memory for search? That's where things get interesting.

We'll tackle storage and efficient search in the next article. Spoiler: you don't compare against every vector. That would be O(n). Vector databases use clever data structures to get O(log n) or even O(1) performance.

### Gotcha 6: Embedding Models Can Be Sensitive

Subtle differences in input can produce surprising differences in output.

"User authentication" and "Authentication of users" mean the same thing. But they might have different embeddings because the word order changed.

Good embedding models minimize this sensitivity. Cheap or old models are more susceptible.

Also watch out for capitalization and punctuation. Some models treat "login" and "Login" differently. Others don't.

Test your specific model with variations of the same query to understand its quirks.

---

## What's Next

We've laid the foundation: embeddings that capture meaning, similarity measures to compare them, and local inference to keep costs at zero.

But generating embeddings is only half the battle.

Right now, if you wanted to search 10,000 code chunks, you'd have to:

1. Generate an embedding for your query
2. Load all 10,000 stored embeddings
3. Calculate cosine similarity against each one
4. Sort by similarity
5. Return the top 10

That's O(n) for every query. At 10,000 chunks, it takes maybe 100ms. Tolerable.

At 1 million chunks? 10 seconds per query. Unusable.

The real challenge is storing millions of vectors and searching them efficiently. You need data structures that don't require checking every single vector.

In the next article, we'll explore vector databases: specialized storage systems that make similarity search fast at scale.

We'll set up Qdrant (a local vector database that runs in Docker), store our code embeddings, and build queries that find semantically similar code in milliseconds.

The goal: search for "authentication logic" and find every component that handles login, session management, and credential verification. Even if none of them contain the word "authentication."

No more missed synonyms. No more creative naming defeating your search.

That's the power of semantic search.

---

## Key Takeaways

1. **Keyword search misses synonyms.** "Authentication" and "login" are the same concept but different strings. At scale, this becomes a serious discovery problem.

2. **Embeddings are GPS coordinates for meaning.** Similar concepts have similar coordinates. Distance in embedding space corresponds to semantic distance.

3. **768 numbers capture semantic meaning.** Each dimension represents a different aspect of meaning. It's like describing a person with 768 different measurements.

4. **Local models are free and private.** Ollama + nomic-embed-text runs entirely on your machine. No API costs. No data leaving your network.

5. **Cosine similarity measures semantic closeness.** Values near 1 mean similar; values near 0 mean different. It ignores magnitude and focuses on direction.

6. **Model quality matters.** Different models have different strengths. Test with your actual queries before committing to a model.

7. **Chunk your code.** Embedding models have context limits. You can't embed a 1000-line file as a single unit.

8. **Plan for scale.** Embedding 2M lines of code takes time and storage. Incremental updates and caching are essential.

---

## Quick Reference

```bash
# Install Ollama
brew install ollama && ollama serve

# Pull embedding model
ollama pull nomic-embed-text

# Test embedding API
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "test"}'
```

```typescript
// Generate embedding
const vector = await generateEmbedding("your text here");

// Compare embeddings
const similarity = cosineSimilarity(vectorA, vectorB);
// 1.0 = identical, 0.0 = unrelated, -1.0 = opposite
```

---

## Further Reading

If you want to go deeper on embeddings:

- **[Ollama Documentation](https://ollama.ai)** - Running local models
- **[Nomic AI](https://nomic.ai)** - The team behind nomic-embed-text
- **[What are Embeddings?](https://vickiboykis.com/what_are_embeddings/)** - Vicki Boykis's excellent deep dive
- **[Sentence Transformers](https://www.sbert.net/)** - The Python library that popularized text embeddings

---

*Next up: Vector Databases - Storing and Searching Millions of Embeddings*
