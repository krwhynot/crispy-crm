# Why Your AI Assistant Needs a Local Index

Every time you ask your AI coding assistant a question, something expensive happens in the background.

The AI reads files. Lots of them. Often the same files it read thirty seconds ago for your previous question. It parses them, analyzes them, builds a mental model, answers you, and then forgets everything it just learned.

Next question? Start from scratch.

This is the dirty secret of AI-assisted development. The tools are brilliant at understanding code, but terrible at remembering what they already know. And you are paying for that amnesia in tokens, time, and memory.

---

## The Problem

Picture what happens when you ask "Where is the login function defined?"

1. The AI scans your project structure
2. It reads dozens, maybe hundreds, of files looking for clues
3. It parses each file to understand the code structure
4. It finally locates your login function
5. Then it forgets everything it just learned

Ask a follow-up question like "What calls that function?" and the AI reads all those files again. From the beginning. As if the first question never happened.

Here is why this matters.

**Token costs add up fast.** If you are using a cloud-based AI assistant (and most of us are), every file read costs tokens. Reading the same 200 files ten times costs ten times as much as reading them once. For a team of five developers asking twenty questions each per day, that is 1,000 file-reading operations that could have been 100.

**Memory pressure becomes real.** Each file gets loaded, parsed into an Abstract Syntax Tree, held in memory while the AI thinks, then discarded. A 100,000-line codebase can consume gigabytes of RAM during analysis. Your laptop with 16GB starts to sweat.

**Latency compounds.** Reading files from disk, parsing them, analyzing their structure, walking their ASTs, it all takes time. For small codebases this is invisible. For large codebases you start noticing multi-second delays before the AI even begins thinking about your actual question.

The worst part? Most of this work is completely redundant. Your codebase did not change between questions. The function definitions are in the same places. The import relationships are identical. Why should the AI pretend it has never seen your code before?

---

## The Card Catalog Approach

Imagine walking into a library with a million books.

You ask the librarian: "Where can I find books about React hooks?"

The librarian could do what your AI does today. Walk through every aisle. Pull each book off the shelf. Flip through the pages. Check if it mentions hooks. Put it back. Move to the next book.

Hours later, you have your answer.

Or the librarian could walk to the card catalog.

The card catalog does not contain the books. It contains information about the books. Titles. Authors. Subjects. Locations. Enough to answer most questions without touching the actual books.

Need more detail? The card catalog tells you exactly which shelf to check. You read only what you need.

This is the fundamental insight: the cost of building knowledge about a codebase should happen once, not on every query.

The card catalog is built once. Updated when new books arrive. Consulted thousands of times. The upfront cost is amortized across every future question.

Your AI needs a card catalog for your code.

---

## Why ripgrep Is Not Enough

You might be thinking: "I already have fast search. What is wrong with ripgrep?"

Nothing is wrong with ripgrep. It is the fastest grep in the world. For text matching, nothing beats it.

But ripgrep searches text. It matches characters.

Code intelligence requires understanding structure.

Search for "validateContact" with ripgrep and you will find:

- The actual function definition (good)
- A comment that says "// TODO: fix validateContact later" (noise)
- A test mock called validateContactMock (maybe relevant)
- A string literal "validateContact is deprecated" (definitely not what you want)
- A variable named validateContactSchema (different thing entirely)

Ripgrep cannot distinguish between these. It matches the characters "validateContact" and reports where they appear.

When you ask "what calls validateContact," you need semantic understanding. You need to know that `validateContact()` on line 47 is a function call, that `validateContact:` on line 23 is an object key, that `// validateContact` is a comment.

Text search gives you positions. Code intelligence gives you meaning.

Here is the key insight.

The TypeScript compiler already knows all of this. When it type-checks your code, it builds a complete model of every symbol, every reference, every relationship. It knows that `validateContact` on line 47 is a call to the function defined on line 12 of another file.

The problem is that the compiler throws away this knowledge after compilation. And your AI rebuilds it from scratch on every question.

What if we could save what the compiler knows and query it later?

---

## Let Us Build It

The solution is called SCIP: Source Code Intelligence Protocol.

SCIP is a standardized format for storing everything the compiler knows about your code. It was created by Sourcegraph (the code search company) and is used by GitHub, Meta, and every serious code intelligence tool.

Here is what SCIP captures:

**Symbols.** Every named thing in your code gets a unique identifier. Not just the name "validateContact" but a fully-qualified path like `npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact().` This distinguishes your validateContact from a validateContact in another package or file.

**Definitions.** Where each symbol is created. The exact file and line number where you wrote `function validateContact(...)`.

**References.** Where each symbol is used. Every call site, every import, every type annotation that references the symbol.

With these three pieces of information, you can answer almost any code navigation question instantly:

- "Where is X defined?" Look up the definition.
- "Where is X used?" List all references.
- "What does this file export?" List definitions with export roles.
- "What does this file import?" List references to external symbols.

No parsing required. Just lookup.

Let us generate an index for a TypeScript project:

```bash
# Install the TypeScript indexer
npm install -D @sourcegraph/scip-typescript

# Generate the index
npx scip-typescript index --output .claude/state/index.scip
```

That is it. One command.

The indexer reads your tsconfig.json, processes every included file, and writes a compact binary index. For a 50,000-line codebase, this takes about 30 seconds. For 500,000 lines, maybe 2-3 minutes.

But here is the beautiful part.

Once the index exists, it just sits on disk. It does not consume memory until queried. It does not slow down your editor. It waits patiently until you need it.

Compare that to the AI's current approach of loading everything into memory for every question.

---

## The Numbers

Here is what changes when you have an index:

| Without Index | With Index |
|---------------|------------|
| Read 500 files per query | Read 1 index file |
| Parse each file into AST | Query pre-parsed structure |
| 2-4 GB memory per query | Under 100 MB |
| 5-30 seconds latency | Under 1 second |
| Token cost multiplies | Token cost is constant |

The performance difference is not 2x or 5x.

Revolutionary.

For incremental updates, the difference is even more dramatic. Changed one file? Without an index, you re-read everything. With an index, you update only the affected symbols. What took 30 seconds takes 50 milliseconds.

---

## Watch Out For

Building code indexes is not without gotchas. Here are the ones we discovered.

**Build before indexing.** SCIP uses the TypeScript compiler, which needs your code to type-check. If you have compilation errors, the indexer might skip those files or produce incomplete data. Always run `tsc --noEmit` first.

**Watch your tsconfig scope.** The indexer only processes files included by your tsconfig.json. If your config excludes test files, those files will not be indexed. For complete coverage, consider a separate tsconfig.indexing.json that includes everything.

**The index is a snapshot.** Rename a function, move a file, add new code, the old index is stale. Regenerate after significant changes. In CI, regenerate on every push. Locally, regenerate when starting a work session.

**SCIP CLI is a Go binary, not an npm package.** The `@sourcegraph/scip-typescript` package handles indexing. But if you want to inspect or snapshot the index file, you need the SCIP CLI, which is installed via Go: `go install github.com/sourcegraph/scip/cmd/scip@latest`.

---

## What Is Next

Now you understand why your AI rereads everything and how an index fixes that.

But generating an index is just the beginning. An index file sitting on disk is like an unread encyclopedia. The information is there, but you need a way to access it.

The next article explains what SCIP actually stores and introduces trigrams, the technique that makes fuzzy search blazingly fast. You will learn how typing "con" can match "contacts", "ContactList", and "useContactForm" in milliseconds.

Time to open the index and see what is inside.

---

## Quick Reference

**Install scip-typescript:**
```bash
npm install -D @sourcegraph/scip-typescript
```

**Generate an index:**
```bash
npx scip-typescript index --output .claude/state/index.scip
```

**What SCIP stores:**
- Symbols (fully-qualified names)
- Definitions (where symbols are created)
- References (where symbols are used)

**When to regenerate:**
- After refactoring or renaming
- After adding new files
- In CI on every push
- Locally when starting a work session

**Key insight:**
Index once, query many times. Separate the expensive work (parsing) from the frequent work (answering questions).

---

*This is part 1 of a 12-part series on building local code intelligence.*
