# Phase 3 Explained: Teaching Computers to Understand Meaning

> **What this document is:** A beginner-friendly explanation of Phase 3 concepts. Read this before diving into the technical implementation in `03-phase-3-worker-parallelization.md`.

---

## The Problem: Keywords Are Not Enough

Imagine you join a new project and need to find "code that handles user mistakes."

You open your code search tool and type... what exactly?

- "error handling"?
- "validation"?
- "catch"?
- "try"?

You end up running five different searches, scanning hundreds of results, because the computer doesn't understand that all these words relate to the same concept.

This is frustrating.

The computer is matching exact characters, not meaning.

---

## The Librarian Analogy

Think about asking a librarian versus using a card catalog.

**Card catalog (keyword search):**
You search for books with "cooking" in the title. You miss cookbooks titled "The Art of French Cuisine" or "Kitchen Mastery."

**Librarian (semantic search):**
You say "I want to learn to cook Italian food." The librarian understands your intent and brings you books from the cooking section, even ones without "cooking" in the title.

Phase 3 gives our discovery system a librarian instead of a card catalog.

---

## What We Need to Build This Librarian

To make semantic search work, we need four things:

1. **A way to run specialized software** (Docker)
2. **A database that understands similarity** (Qdrant)
3. **A translator that converts text to numbers** (Ollama + nomic-embed-text)
4. **A way to break code into digestible pieces** (Tree-sitter chunking)

Let's understand each one.

---

## What is Docker?

You want to run a restaurant, but you don't want to build a kitchen.

It's like... a food truck.

A food truck comes with everything pre-installed: stove, fridge, counter, exhaust system. You just plug in power and water. The truck is self-contained and doesn't mess with your house.

Docker is a food truck for software.

Instead of installing Qdrant (the vector database) directly on your computer, Docker runs it in a contained box. If something breaks, you throw away the container and start fresh. Your actual computer stays clean.

**Why this matters:** You could spend hours figuring out how to install Qdrant on your specific operating system. Or you could run `docker compose up` and have it working in 30 seconds.

---

## What is docker-compose.yml?

One food truck is useful. But what if you need a pizza truck AND a coffee truck, parked next to each other, with specific spots marked out?

It's like... a parking lot layout with reserved spots.

`docker-compose.yml` is that layout. It says:

- "Bring the Qdrant truck and park it at spot 6333"
- "Bring the Ollama truck and park it at spot 11434"
- "Store their stuff in these specific folders"
- "Make sure they can talk to each other"

One file, one command (`docker compose up`), and everything starts together.

```yaml
services:
  qdrant:      # The vector database truck
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"   # Park at spot 6333

  ollama:      # The embedding generator truck
    image: ollama/ollama:latest
    ports:
      - "11434:11434" # Park at spot 11434
```

---

## What is Qdrant?

Regular databases store text and numbers. You ask "give me all users named John" and it finds exact matches.

But what if you want "users similar to John"? Regular databases can't do that.

It's like... a map where similar things are physically close together.

Imagine a giant map of a city. Restaurants that serve similar food are located near each other. Italian restaurants cluster together. So do Thai restaurants. If you're standing at one Italian restaurant and walk in any direction, you'll probably hit another Italian restaurant.

Qdrant is a database, but instead of storing text, it stores locations on a meaning-map.

"Form validation" and "input checking" might be stored close together because they mean similar things. When you search for "form validation," Qdrant finds not just exact matches but also nearby neighbors like "input checking," "user data verification," and "schema validation."

**Technical name:** This is called a "vector database."

---

## What Are Vectors and Embeddings?

This is the hardest concept. Let's build up to it.

### GPS Coordinates for Words

Every place on Earth has GPS coordinates. San Francisco is at (37.7749, -122.4194). Tokyo is at (35.6762, 139.6503).

Close cities have similar coordinates. Different continents have very different coordinates.

It's like... GPS coordinates, but for meaning.

What if we could give every word or sentence GPS coordinates based on what it means?

- "Happy" might be at (0.8, 0.3)
- "Joyful" might be at (0.79, 0.31) - very close!
- "Sad" might be at (0.2, 0.7) - far away
- "Melancholy" might be at (0.25, 0.68) - close to sad

Now finding similar words is just finding nearby coordinates.

### From 2D to 768D

Real GPS uses 2 numbers (latitude, longitude). That's not enough dimensions to capture all the nuances of meaning.

Is "happy" similar to "joyful"? Yes.
Is "happy" similar to "birthday"? Kind of, but differently.
Is "happy" similar to "function"? Probably not, unless it's a function called "makeUserHappy."

To capture all these relationships, we need more dimensions.

Embeddings use 768 numbers to locate each piece of text in meaning-space.

You can't visualize 768 dimensions. That's okay. The math still works the same way - similar things have coordinates that are close together.

### What an Embedding Looks Like

Here's a real (simplified) example:

```
"form validation" -> [0.23, -0.41, 0.87, 0.12, ... 764 more numbers]
"input checking"  -> [0.21, -0.39, 0.85, 0.14, ... 764 more numbers]
"database query"  -> [0.67, 0.32, -0.21, 0.89, ... 764 more numbers]
```

Notice how "form validation" and "input checking" have similar numbers, but "database query" is quite different?

The distance between those coordinate lists tells us how similar the meanings are.

---

## What is Ollama?

Someone has to calculate those 768 numbers for each piece of text.

This requires a machine learning model - software that learned patterns from billions of text examples.

It's like... having a translator living in your house.

You could send your documents to a cloud translation service (expensive, privacy concerns, requires internet). Or you could have a translator living in your spare room who works for free.

Ollama is a way to run AI models locally on your own computer. No cloud. No API costs. No privacy concerns. The translator lives on your machine.

**Why this matters:** Some embedding APIs charge $0.0001 per request. Sounds cheap, but index 50,000 code chunks and that's $5. Reindex after every change? Costs add up. Ollama is free forever.

---

## What is nomic-embed-text?

Ollama is the translator's house. But which translator lives there?

It's like... the specific translation dictionary the translator uses.

Different embedding models are trained on different data and produce different quality embeddings.

`nomic-embed-text` is:
- **Free and open source** (no licensing costs)
- **768 dimensions** (good balance of quality vs. speed)
- **Trained on diverse text** (understands code, not just prose)
- **Fast** (about 100 embeddings per second on a normal laptop)

To install the translator:

```bash
ollama pull nomic-embed-text
```

Now your local Ollama can convert any text into 768-dimensional coordinates.

---

## What is Tree-sitter Chunking?

We can't embed our entire codebase as one giant text block.

It's like... instead of summarizing an entire book in one sentence, we summarize each chapter separately.

If you embed 50,000 lines of code as one piece, the embedding captures a vague average of everything. Not useful for search.

We need to break the code into meaningful chunks. But where do we break it?

**Bad chunking:** Split every 100 lines.
This might cut a function in half. The embedding of half a function is meaningless.

**Good chunking:** Split at natural boundaries.
Functions, classes, interfaces, type definitions. Each chunk is a complete, meaningful unit.

Tree-sitter is a parser that understands code structure. It can find exactly where functions start and end, where classes are defined, where interfaces live.

```typescript
// Tree-sitter finds these boundaries:

function validateUser(input: unknown) {  // <- chunk starts here
  const schema = z.object({ ... });
  return schema.parse(input);
}                                         // <- chunk ends here

interface UserProfile {                   // <- new chunk starts
  id: string;
  email: string;
}                                         // <- chunk ends
```

Each chunk gets its own embedding. When you search for "user validation," you find the `validateUser` function specifically, not just "somewhere in user.ts."

---

## The Complete Flow

Let's trace what happens from code to search result:

### Step 1: Index Time (Once, or when code changes)

```
Source Code
    |
    v
[Tree-sitter] -- breaks into meaningful chunks
    |
    v
Code Chunks (functions, classes, etc.)
    |
    v
[Ollama + nomic-embed-text] -- converts each chunk to 768 numbers
    |
    v
Embeddings (lists of numbers)
    |
    v
[Qdrant] -- stores embeddings with metadata (file path, line numbers)
    |
    v
Vector Database (meaning-map populated)
```

### Step 2: Search Time (Every query)

```
Your Query: "hooks for form validation"
    |
    v
[Ollama + nomic-embed-text] -- converts query to 768 numbers
    |
    v
Query Embedding
    |
    v
[Qdrant] -- finds nearest neighbors in meaning-space
    |
    v
Results: useFormValidation(), validateContactForm(), useInputValidator()
         (sorted by similarity score)
```

---

## Why All This Complexity?

You might wonder: why not just use better keyword search?

Here's what semantic search can do that keywords cannot:

| Query | Keyword Search Finds | Semantic Search Finds |
|-------|---------------------|----------------------|
| "error handling" | Only code with "error" and "handling" | Code with try/catch, Result types, validation failures |
| "form state" | Only code with "form" and "state" | useForm hooks, validation contexts, input controllers |
| "data fetching" | Only code with "data" and "fetching" | useQuery, fetch calls, axios requests, SWR hooks |
| "user authentication" | Only code with these words | Login logic, JWT handling, session management, auth guards |

The semantic search understands relationships between concepts that keyword search completely misses.

---

## Installation Summary

Here's what you actually need to do:

### 1. Install Docker Desktop
Download from [docker.com](https://docker.com). This takes 5 minutes and gives you the food truck infrastructure.

### 2. Start the Services
```bash
docker compose up -d qdrant ollama
```
This brings in both trucks and parks them.

### 3. Download the Embedding Model
```bash
docker exec ollama ollama pull nomic-embed-text
```
This gives the translator their dictionary. Takes about 2 minutes to download.

### 4. Index Your Codebase
```bash
npx tsx scripts/discover/embeddings/index.ts index
```
This walks through every file, chunks it, generates embeddings, and stores them.

### 5. Search!
```bash
npx tsx scripts/discover/embeddings/index.ts search "form validation"
```

---

## Try It Yourself: Example Queries

Once indexed, try these searches to see semantic understanding in action:

| Query | What it should find |
|-------|---------------------|
| "handling user mistakes" | Validation code, error boundaries, form error displays |
| "talking to the database" | Data provider, Supabase calls, query functions |
| "showing lists of things" | List components, DataGrid, table views |
| "checking if data is valid" | Zod schemas, validation hooks, type guards |
| "reusable UI pieces" | Common components, shared inputs, button variations |
| "user login flow" | Auth components, session management, protected routes |

Notice how none of these queries use exact function names. The semantic search finds relevant code based on what you mean, not what you type.

---

## What Could Go Wrong?

### Qdrant won't start
Usually means Docker isn't running. Start Docker Desktop first.

### Ollama is slow on first query
The model loads into memory on first use. Subsequent queries are fast.

### Results seem random
The embedding model might not have downloaded correctly. Run `ollama pull nomic-embed-text` again.

### Index takes forever
Each file makes API calls to Ollama. If you have thousands of files, this takes time on first index. Future updates are incremental.

---

## Key Takeaways

1. **Semantic search finds code by meaning**, not just keywords
2. **Docker** packages software so you don't have to install it manually
3. **Qdrant** is a database that stores locations on a meaning-map
4. **Embeddings** are GPS coordinates for text (768 numbers that capture meaning)
5. **Ollama** runs AI models locally, for free
6. **nomic-embed-text** is the specific model that converts text to embeddings
7. **Tree-sitter** breaks code at natural boundaries (functions, classes)

The result: ask "where's the code for handling user mistakes" and find exactly that, even if no function is literally named "handleUserMistakes."

---

## Next Steps

Ready to implement? Head to [03-phase-3-worker-parallelization.md](./03-phase-3-worker-parallelization.md) for the technical details and code.

Still have questions? The concepts here are genuinely complex. Re-read the analogies. They'll click with time.

---

## Glossary

| Term | Plain English |
|------|---------------|
| **Vector** | A list of numbers representing a location |
| **Embedding** | Converting text into a vector (GPS coordinates for meaning) |
| **Vector Database** | Database that stores and searches vectors |
| **Semantic Search** | Finding by meaning, not keywords |
| **Docker Container** | Self-contained software package (food truck) |
| **docker-compose** | Configuration for running multiple containers |
| **Ollama** | Tool for running AI models locally |
| **nomic-embed-text** | Specific embedding model we use |
| **Tree-sitter** | Parser that understands code structure |
| **Chunking** | Breaking code into meaningful pieces |
| **768 dimensions** | How many numbers in each embedding |
| **Cosine similarity** | Math for measuring how close two vectors are |
