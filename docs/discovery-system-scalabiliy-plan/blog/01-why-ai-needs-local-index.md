# Why Your AI Assistant Needs a Local Index

Your AI coding assistant has amnesia.

Every question you ask? It reads your entire codebase from scratch. The same files it read thirty seconds ago. The same parsing. The same analysis.

Then it forgets everything.

That's expensive. In tokens. In time. In memory.

---

## The Expensive Reality

Ask your AI: "Where is the login function defined?"

Here's what happens behind the scenes:

1. Scan the project structure
2. Read dozens—maybe hundreds—of files
3. Parse each one into a syntax tree
4. Finally locate the function
5. Forget everything

Now ask: "What calls that function?"

The AI starts over. From scratch. As if you never asked the first question.

**Token costs add up fast.**

Every file read costs tokens. Read 200 files once? One toll. Read them ten times? Ten tolls.

It's like paying bridge fare each direction instead of buying a FastPass.

**Memory pressure becomes real.**

An Abstract Syntax Tree (AST) is a structured representation of your code—every function, every variable, every expression organized into a tree you can navigate.

The AI builds one for each file. Holds it in memory. Discards it. Rebuilds it next question.

A 100,000-line codebase can consume gigabytes of RAM during analysis.

Your laptop starts to sweat.

**Latency compounds.**

Disk reads. Parsing. Tree walking. It all takes time.

Small codebases? Invisible.

Large codebases? Multi-second delays before the AI even *starts* thinking about your question.

Here's the frustrating part.

Your codebase didn't change between questions. The functions are in the same places. The imports are identical.

Why pretend you've never seen it before?

---

## The Card Catalog Solution

Picture a library with a million books.

You ask the librarian: "Where can I find books about React hooks?"

Option A: Walk every aisle. Pull each book. Flip through pages. Check for hooks. Put it back. Repeat a million times.

Hours later, you have your answer.

Option B: Walk to the card catalog.

A card catalog is a compact index of every book's metadata—title, author, subject, location—without containing the books themselves.

That's the key insight.

Most questions don't need the full book. They need to know *where* the book is.

The card catalog gets built once. Updated when new books arrive. Consulted thousands of times.

The upfront cost gets amortized across every future question.

Your AI needs a card catalog for your code.

---

## Why ripgrep Isn't Enough

You might be thinking: "I have ripgrep. Problem solved."

Not quite.

ripgrep is the fastest text search in the world. For matching characters, nothing beats it.

But code intelligence requires *structure*.

Search for "validateContact" and ripgrep returns:

| Match | What it actually is |
|-------|---------------------|
| `function validateContact()` | ✓ The real definition |
| `// TODO: fix validateContact` | ✗ A comment |
| `validateContactMock` | ? Maybe relevant |
| `"validateContact is deprecated"` | ✗ A string literal |

ripgrep can't distinguish between these. It matches characters. Period.

When you ask "what calls validateContact," you need semantic understanding.

Is `validateContact()` on line 47 a function call or an object key? Is it in a comment?

Text search gives you positions.

Code intelligence gives you *meaning*.

---

## What the Compiler Already Knows

Here's the part most people miss.

The TypeScript compiler already understands all of this. When it type-checks your code, it builds a complete model—every symbol, every reference, every relationship.

It knows that `validateContact` on line 47 is a call to the function defined on line 12 of another file.

The problem?

The compiler throws away this knowledge after compilation.

Your AI rebuilds it from scratch. Every. Single. Question.

What if we could save what the compiler knows?

---

## Enter SCIP

SCIP stands for Source Code Intelligence Protocol.

It's a standardized format for storing everything the compiler knows about your code. Think of it as a card catalog that captures not just where functions are, but who calls them, who imports them, and how they relate.

Created by Sourcegraph. Used by GitHub, Meta, and every serious code intelligence tool.

SCIP captures three things:

**Symbols.** Unique identifiers for every named thing in your code.

Not just "validateContact" but a fully-qualified path:
```
npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact()
```

This distinguishes *your* validateContact from one in another package.

**Definitions.** Where each symbol is created.

The exact file and line where you wrote `function validateContact(...)`.

**References.** Where each symbol is used.

Every call site. Every import. Every type annotation.

With these three pieces, you can answer almost any code navigation question instantly:

| Question | Answer |
|----------|--------|
| Where is X defined? | Look up the definition |
| Where is X used? | List all references |
| What does this file export? | List definitions with export roles |
| What does this file import? | List references to external symbols |

No parsing required. Just lookup.

---

## Building Your First Index

Generate an index in two commands:

```bash
npm install -D @sourcegraph/scip-typescript
npx scip-typescript index --output .claude/state/index.scip
```

That's it.

The indexer reads your tsconfig.json, processes every file, writes a compact binary index.

50,000 lines? About 30 seconds.

500,000 lines? Maybe 2-3 minutes.

Here's the beautiful part.

Once the index exists, it sits on disk. No memory consumption until queried. No editor slowdown. It waits patiently.

Compare that to loading everything into memory for every question.

**One gotcha:** The indexer uses TypeScript's compiler. If your code has type errors, files may be skipped. Run `tsc --noEmit` first.

**Another gotcha:** Only files in your tsconfig.json get indexed. Excluding test files? They won't be searchable. Consider a separate tsconfig.indexing.json for full coverage.

---

## The Numbers

Here's what changes:

| Without Index | With Index |
|---------------|------------|
| Read 500 files per query | Read 1 index file |
| Parse each file into AST | Query pre-parsed structure |
| 2-4 GB memory | Under 100 MB |
| 5-30 seconds latency | Under 1 second |
| Token cost multiplies | Token cost is constant |

This isn't 2x faster.

It's a different category.

For incremental updates, the gap widens further.

Changed one file? Without an index, re-read everything. With an index, update only affected symbols.

30 seconds becomes 50 milliseconds.

---

## The Index is a Snapshot

One thing to remember: indexes are point-in-time snapshots.

Rename a function? The old index is stale.

Move a file? Stale.

Add new code? Stale.

When to regenerate:
- After refactoring or renaming
- After adding new files
- In CI: every push
- Locally: when starting a work session

It's like a printed phone book. Useful until someone moves.

---

## What's Next

You now understand why your AI rereads everything—and how an index fixes that.

But an index file on disk is like an unread encyclopedia. The information exists. You need a way to access it.

The next article explains what SCIP actually stores and introduces trigrams—the technique that makes fuzzy search blazingly fast.

Typing "con" will match "contacts", "ContactList", and "useContactForm" in milliseconds.

Time to open the index and see what's inside.

---

## Quick Reference

```bash
# Install
npm install -D @sourcegraph/scip-typescript

# Generate
npx scip-typescript index --output .claude/state/index.scip

# Inspect (requires Go)
go install github.com/sourcegraph/scip/cmd/scip@latest
scip snapshot index.scip
```

**What SCIP stores:**
- Symbols (fully-qualified names)
- Definitions (where symbols are created)
- References (where symbols are used)

**Key insight:** Index once, query many times. Separate the expensive work (parsing) from the frequent work (answering questions).

---

*Part 1 of 12: Building Local Code Intelligence*
