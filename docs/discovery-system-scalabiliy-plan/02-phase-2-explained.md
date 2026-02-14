# Phase 2 Explained: The Semantic Layer

> **What this document is:** A beginner-friendly explanation of the Semantic Layer. Read this before diving into the technical implementation in `02-phase-2-semantic-layer.md`.

---

## Wait, I Thought We Just Built a Search System?

Yes, we did. Phase 1 gave us a powerful search engine that finds exact symbols, definitions, and references. It answers questions like "where is useContactForm defined?" and "what files import this function?"

But try asking it something like this:

"Show me all the code that handles user input validation."

The Phase 1 system is stumped. It can only find exact text matches. It does not know that "form validation," "Zod schema," "input checking," and "data sanitization" all relate to the same concept.

This is the gap Phase 2 fills. We are teaching our system to understand meaning.

---

## What Is the Problem?

Imagine you just joined a team working on Crispy CRM. You need to find code that "validates user data before saving."

You open your search tool and type... what exactly?

- "validate"?
- "check"?
- "schema"?
- "Zod"?
- "form"?

You run five searches. Each returns dozens of results. You manually scan through them, trying to find the ones that actually do what you want. Some files contain the word "validate" in a comment but do nothing related to validation. Other files do exactly what you need but never use that word.

This is exhausting. And it gets worse as the codebase grows.

The problem is that computers, by default, are extremely literal. They match characters, not concepts. Phase 2 changes that.

---

## What Is the Semantic Layer?

Think of two types of library assistants.

**The literal assistant:** You ask for books about "cooking." They search the card catalog for titles containing the word "cooking." They miss "Mastering the Art of French Cuisine," "Kitchen Confidential," and "Salt, Fat, Acid, Heat" because those titles do not contain your exact word.

**The semantic assistant:** You ask for books about "cooking." They understand you want books about preparing food, recipes, and culinary techniques. They bring you books from the cooking section, even ones with creative titles that never say "cooking."

Phase 1 built us the literal assistant. Phase 2 builds the semantic assistant.

The word "semantic" comes from Greek. It means "relating to meaning." A semantic layer is software that understands what code means, not just what characters it contains.

---

## So What Is the Problem? (The Technical Version)

We need to solve three problems to make semantic search work:

1. **How do we represent meaning mathematically?** Computers understand numbers, not concepts. We need a way to convert "form validation" into numbers that a computer can compare.

2. **How do we break code into meaningful pieces?** We cannot embed our entire 500-file codebase as one giant blob. We need to split it at natural boundaries: functions, classes, components.

3. **How do we store and search these numbers efficiently?** Once we have numbers representing meaning, we need a database that can quickly find "numbers similar to these numbers."

Each task in Phase 2 addresses one of these problems.

---

## Let Me Make Sure I Have This Straight

Here is the flow:

```
Your Code Files
      |
      v
[Tree-sitter] -----> Breaks code into chunks
      |               (one function = one chunk)
      v
Code Chunks
      |
      v
[Ollama] ----------> Converts each chunk to 768 numbers
      |               (the "embedding")
      v
Embeddings
      |
      v
[LanceDB] ----------> Stores embeddings on disk
                      (ready for fast search)
```

When you search:

```
Your Query: "form validation"
      |
      v
[Ollama] -----------> Converts query to 768 numbers
      |
      v
Query Embedding
      |
      v
[LanceDB] ----------> Finds stored embeddings
      |                near your query embedding
      v
Results: validateContactForm(), useFormValidation(), ContactSchema
         (ranked by similarity)
```

---

## What Is Tree-sitter?

Imagine you have a 1000-line TypeScript file. You want to split it into searchable chunks. Where do you draw the lines?

**Bad approach: Split every 100 lines.**

Line 100 might be in the middle of a function. You would get a chunk that starts with `return result;` and makes no sense on its own.

**Good approach: Split at natural boundaries.**

Functions, classes, interfaces, and type definitions are complete thoughts. Each one makes sense on its own.

Tree-sitter is a tool that understands code structure. It reads your TypeScript file and builds a map of where every function starts and ends, where every class is defined, where every interface lives.

It is like having a meticulous librarian who marks every chapter, section, and paragraph in every book.

```typescript
// Tree-sitter finds these boundaries automatically:

export function validateEmail(input: string) {  // <- chunk starts here
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(input);
}                                                // <- chunk ends here

export interface User {                          // <- new chunk starts
  id: string;
  email: string;
  name: string;
}                                                // <- chunk ends here
```

Each chunk becomes one embedding. When you search for "email validation," you find the `validateEmail` function specifically, not just "somewhere in utils.ts."

The name "Tree-sitter" comes from the data structure it creates: an Abstract Syntax Tree (AST). The tool "sits" on this tree and walks through it to find meaningful boundaries.

---

## What Is Ollama?

Now we have chunks of code. Each chunk is meaningful text. But computers cannot compare text directly. They need numbers.

This is where Ollama comes in.

**The translation analogy:**

You need to compare how similar two French sentences are. You do not speak French. You could:

1. **Cloud translation service:** Send sentences to Google Translate, pay per request, wait for network responses, worry about privacy.

2. **Local translator:** Have a translator living in your house who works for free, instantly, with no internet required.

Ollama is option 2 for AI models.

It runs machine learning models locally on your computer. No cloud. No API keys. No costs. No privacy concerns. The AI runs on your machine.

**Why does this matter?**

Some embedding APIs charge per request. Index 10,000 code chunks at $0.0001 each and you have spent $1. Reindex after changes? Spend again. Ollama is free forever.

---

## What Are Embeddings? (The GPS Analogy)

This is the core concept. Understanding embeddings is understanding semantic search.

**Start with GPS coordinates.**

Every place on Earth has coordinates. San Francisco is at (37.7749, -122.4194). Tokyo is at (35.6762, 139.6503). Two numbers locate any point on the planet.

Nearby cities have similar coordinates. Cities on opposite continents have very different coordinates.

**Now imagine GPS for meaning.**

What if we could give every word, sentence, or code snippet a set of coordinates based on what it means?

- "Happy" might be at (0.8, 0.3)
- "Joyful" might be at (0.79, 0.31) - very close because similar meaning
- "Sad" might be at (0.2, 0.7) - far away because opposite meaning
- "Function" might be at (-0.5, 0.1) - in a completely different area

Finding similar words becomes finding nearby coordinates.

**But two dimensions are not enough.**

Is "happy" similar to "birthday"? Kind of. Is "happy" similar to "function"? Probably not, unless it is a function called `makeUserHappy`.

To capture all these nuances, we need more dimensions. The nomic-embed-text model uses 768 numbers per embedding. You cannot visualize 768 dimensions, but the math works the same way. Similar meanings have coordinates that are close together.

**What an embedding actually looks like:**

```
"form validation" -> [0.23, -0.41, 0.87, 0.12, ... 764 more numbers]
"input checking"  -> [0.21, -0.39, 0.85, 0.14, ... 764 more numbers]
"database query"  -> [0.67, 0.32, -0.21, 0.89, ... 764 more numbers]
```

Notice how "form validation" and "input checking" have similar numbers? They mean similar things. "Database query" has very different numbers because it refers to a different concept.

---

## What Is nomic-embed-text?

Ollama is the engine. But which "translator" runs on that engine?

Different embedding models are trained on different data. Some understand medical text. Some understand legal documents. Some understand code.

nomic-embed-text is an embedding model that:

- **Is free and open source.** No licensing costs.
- **Produces 768-dimensional embeddings.** Good balance of quality and speed.
- **Understands code.** Trained on diverse text including programming languages.
- **Runs locally.** Works offline on your machine.

To install it:

```bash
ollama pull nomic-embed-text
```

Now your local Ollama can convert any text into 768 coordinates of meaning.

---

## What Is LanceDB?

We have chunks. We have embeddings. Now we need somewhere to store them.

Regular databases like PostgreSQL or MySQL are designed for exact matches. "Find all users where name equals 'John'." They are not designed for "find all users whose name is similar to 'Jon'."

**The filing cabinet analogy:**

Imagine a magical filing cabinet. Instead of alphabetical folders, the folders are arranged by meaning. Similar documents are physically close to each other.

You open the drawer, point at a location, and say "give me the 10 nearest files." The cabinet instantly hands them to you.

LanceDB is that magical filing cabinet for code.

**Why LanceDB instead of Qdrant, Pinecone, or Milvus?**

- **No Docker required.** LanceDB is just files on disk. No servers to run.
- **No cloud costs.** Pinecone charges monthly fees. LanceDB is free.
- **No cold starts.** Cloud databases need time to "wake up." LanceDB loads instantly.
- **Simple backup.** Copy the folder. That is your backup.

For a project the size of Crispy CRM, LanceDB is the right tool. It handles hundreds of thousands of vectors without breaking a sweat.

---

## What Is Cosine Similarity?

When we have two embeddings, how do we measure how similar they are?

**The flashlight analogy:**

Imagine two flashlights in a dark room. Each flashlight points in a direction.

- If both flashlights point the same way, they are similar.
- If they point in opposite directions, they are dissimilar.
- If they point at right angles, they are unrelated.

Cosine similarity measures the angle between two vectors (lists of numbers). It produces a score from -1 to 1:

- 1.0 = identical direction (same meaning)
- 0.0 = perpendicular (unrelated)
- -1.0 = opposite direction (opposite meaning)

In practice, most code embeddings fall between 0.3 and 0.9. Higher scores mean more similar meaning.

When you search for "form validation," the system:
1. Converts your query to a 768-number vector.
2. Computes the cosine similarity between your query and every stored chunk.
3. Returns the chunks with the highest scores.

---

## What Happens When You Run This?

Let me walk through a concrete example.

### Indexing (happens once)

You run: `npx tsx scripts/semantic/index.ts`

The system:

1. **Scans your codebase.** Finds 500 TypeScript files.
2. **Parses with Tree-sitter.** Extracts 3000 code chunks (functions, classes, types).
3. **Generates embeddings.** Calls Ollama 3000 times (about 30 seconds).
4. **Stores in LanceDB.** Writes to `.claude/state/vectors.lance/`.

Now you have a database of meaning.

### Searching (happens every query)

You run: `npx tsx scripts/semantic/search.ts "form validation"`

The system:

1. **Generates query embedding.** Converts your query to 768 numbers.
2. **Searches LanceDB.** Finds the 10 closest stored embeddings.
3. **Returns results.** Shows file paths, line numbers, and similarity scores.

```
Searching for: "form validation"

1. [87.3%] function: validateContactForm
   src/atomic-crm/contacts/validation.ts:45-67

2. [84.1%] component: ContactFormValidator
   src/atomic-crm/contacts/ContactFormValidator.tsx:12-89

3. [81.7%] type: FormValidationResult
   src/types/forms.ts:23-31
```

The function named `validateContactForm` scores highest. But notice the second result is a component that never contains the word "validation." The semantic search found it anyway because it handles the same concept.

---

## What Will Be Different When This Is Done?

### Before Phase 2

You want to find code that handles form validation.

1. Search "validation" - 87 results, mostly noise.
2. Search "form" - 124 results, even more noise.
3. Search "Zod" - 34 results, some relevant.
4. Manually open 50 files, skim each one.
5. Eventually find what you need, 15 minutes later.

### After Phase 2

You want to find code that handles form validation.

1. Search "form validation" - 10 ranked results.
2. Open the top 3. Two are exactly what you need.

Time: 30 seconds.

### The Numbers

| Metric | Before | After |
|--------|--------|-------|
| Search time | 5-10 seconds per query | Under 100 milliseconds |
| Results quality | Random keyword matches | Ranked by meaning |
| False positives | Many | Few |
| Can find synonyms | No | Yes |
| Works offline | Yes | Yes |

---

## Do I Need to Know All This to Use the System?

No.

To use semantic search, you just run:

```bash
# Index your codebase (once)
just embed-code

# Search by meaning
just semantic-search "form validation"
```

The technical details matter only if you want to:
- Modify how chunking works
- Switch to a different embedding model
- Debug strange search results
- Understand why certain code is ranked highly

For normal usage, treat it as a magic box. Put in natural language, get back relevant code.

---

## Quick Glossary

**Semantic**

Relating to meaning. Semantic search finds things by what they mean, not what characters they contain.

**Embedding**

A list of numbers (typically 768) that represents the meaning of text. Similar meanings have similar numbers.

**Vector**

Another name for a list of numbers. In machine learning, "embedding" and "vector" are often used interchangeably.

**Cosine Similarity**

A way to measure how similar two vectors are. Returns a score from -1 to 1, where 1 means identical.

**Tree-sitter**

A parser that understands code structure. It finds where functions, classes, and other units start and end.

**Chunking**

Breaking code into meaningful pieces. Good chunks are complete units like functions or classes.

**Ollama**

Software that runs AI models locally on your computer. No cloud, no costs, no privacy concerns.

**nomic-embed-text**

An embedding model that converts text to 768 numbers. Trained to understand code as well as prose.

**LanceDB**

A file-based vector database. Stores embeddings on disk and enables fast similarity search.

**768 Dimensions**

The number of coordinates in each embedding. More dimensions capture more nuance but require more storage.

**SCIP**

From Phase 1. Stores exact symbol definitions and references. Complementary to semantic search.

**API Boundary**

Where your application meets external data. Phase 2 indexes code inside this boundary.

---

## Common Questions

**Q: How long does indexing take?**

For Crispy CRM's 500 files, about 30-60 seconds. Each chunk requires one Ollama API call.

**Q: How much disk space does this use?**

About 50-100 MB for the vector database. Trivial by modern standards.

**Q: Does Ollama require a GPU?**

No. It runs on CPU. A GPU makes it faster, but CPU works fine for indexing a few thousand chunks.

**Q: What if I change a file?**

Currently you re-run the full index. Phase 3 adds incremental updates.

**Q: Can I search for function names directly?**

Yes, but Phase 1's SCIP index is better for that. Use semantic search when you do not know exact names.

**Q: What about private or sensitive code?**

Everything stays local. Ollama runs on your machine. Nothing is sent to the cloud.

**Q: How do I know if a result is good?**

The similarity percentage tells you. Above 80% is usually highly relevant. Below 60% is often tangential.

---

## Summary

Phase 2 adds a brain to our search system.

Phase 1 taught the system to find exact symbols. Phase 2 teaches it to find similar meanings.

The key technologies are:

- **Tree-sitter** splits code at natural boundaries.
- **Ollama** runs AI models locally for free.
- **nomic-embed-text** converts text to 768-number coordinates.
- **LanceDB** stores and searches those coordinates efficiently.

The result: ask "where's the code for handling user mistakes" and find error handling, validation, and exception catching, even if none of those functions literally contain your search words.

Next up: Phase 3 adds parallel processing and incremental updates for even faster indexing.

---

## What Could Go Wrong?

**Ollama is not running**

You see "Connection refused" errors.

Fix: Start Ollama with `ollama serve` in a terminal.

**Model not found**

You see "Model 'nomic-embed-text' not found."

Fix: Run `ollama pull nomic-embed-text` to download it.

**Results seem random**

Either the model downloaded incorrectly, or your query is too vague.

Fix: Try more specific queries. Verify model with `ollama list`.

**Indexing is slow**

Each chunk needs an Ollama call. Thousands of chunks take minutes.

This is normal for first-time indexing. Consider running it in the background.

---

**Next:** [Phase 3: Integration Layer](./03-phase-3-integration-layer.md) for tool integration and faster retrieval.
