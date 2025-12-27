# What Is SCIP and Why Trigrams Matter

Your TypeScript compiler is brilliant.

It reads your entire codebase, resolves every import, type-checks every expression. It knows that `validateContact` on line 47 calls the function defined on line 12 of a different file.

Then it compiles your code.

And forgets everything.

What if you could save what the compiler knows?

---

## SCIP: The Compiler's Memory

SCIP stands for Source Code Intelligence Protocol.

It's a standardized format for storing everything the compiler already figured out. Think of it as hitting "Save" on the compiler's brain right before it would normally forget.

Sourcegraph created it. GitHub uses it. Meta uses it. When you click "Go to Definition" on github.com, you're querying a SCIP index.

Here's what SCIP captures:

**Symbols.** Every named thing in your code gets a unique identifier.

Not just "validateContact" but a fully-qualified path:

```
npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact()
```

This distinguishes *your* validateContact from one in a random npm package.

**Definitions.** Where each symbol is created.

The exact file and line where you wrote `function validateContact(...)`.

**References.** Where each symbol is used.

Every function call. Every import. Every type annotation.

With these three pieces, most code navigation becomes instant lookup.

---

## The Filing Cabinet

Here's an analogy that makes SCIP click.

Your codebase is a filing cabinet with 500 folders.

Without SCIP: someone asks "where is validateContact?" You open every folder. Flip through every document. Check for matches. Build a list. Tomorrow? Do it again.

With SCIP: you build a master index card for every document. The card says what it is, where it lives, and who references it. Finding validateContact becomes a card lookup.

It's like the difference between memorizing every book in a library versus walking to the card catalog.

The upfront cost is paid once.

Every query after that is nearly free.

---

## Building the Index

Generate a SCIP index with one command:

```bash
npx scip-typescript index --output index.scip
```

That's it.

The indexer reads your tsconfig.json, processes every file, writes a compact binary. 50,000 lines takes about 30 seconds.

One thing to know: the indexer uses TypeScript's compiler. If your code has type errors, those files may be skipped. Run `tsc --noEmit` first to check.

Another thing: only files in your tsconfig.json get indexed. Excluding test files? They won't be searchable. It's like leaving books out of the card catalog—they still exist, but they're invisible to search.

---

## What's Actually Inside

SCIP files use Protocol Buffers encoding. You can't open them in a text editor.

But conceptually, the structure is simple:

```protobuf
Document {
  relative_path: "src/validation/contacts.ts"
  occurrences: [
    { range: [12, 16], symbol: "...validateContact()", role: DEFINITION }
    { range: [47, 2], symbol: "...validateContact()", role: REFERENCE }
  ]
}
```

Each document is one source file. Occurrences list every symbol that appears, with exact positions. Roles tell you whether it's a definition or a reference.

It's like a detailed map of every landmark in your code.

---

## The Trigram Trick

SCIP solves "find all references."

But what about fuzzy search?

A trigram is a three-character sequence. That's the whole definition.

The word "contact" contains these trigrams:

```
con  ont  nta  tac  act
```

Here's the insight.

Build an index of trigrams, and you can find approximate matches without scanning every symbol.

Search for "con"? Look up which symbols contain "con" in their trigram index:

- **contact** (has con)
- **ContactList** (has Con)
- **constant** (has con)
- **connect** (has con)

It's like looking up words in a dictionary by their first few letters. You don't read the whole dictionary—you jump to the right page.

The math is elegant.

A 10-character symbol has 8 trigrams. A codebase with 10,000 symbols might have 50,000 unique trigrams. Look up one trigram, get a small candidate set. Intersect multiple lookups, narrow it further.

Search for "conta"? Intersect symbols containing "con", "ont", "nta", "ta". The result is a handful of precise matches.

Milliseconds. Not seconds.

---

## SQLite FTS5: The Container

Where do you store trigrams?

You could build a custom data structure.

Or you could use SQLite's FTS5.

FTS5 stands for Full-Text Search version 5. It's a virtual table that handles all the trigram indexing behind the scenes. Insert rows, FTS5 builds the index. Query with MATCH, FTS5 searches instantly.

```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  symbol_name,
  file_path,
  tokenize = 'trigram'
);
```

The `tokenize = 'trigram'` part is the magic. It tells SQLite to break text into three-character chunks.

Now searching is trivial:

```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'conta';
```

Returns validateContact, ContactList, ContactSchema. Milliseconds.

Think of FTS5 as a pre-built trigram engine. You don't have to understand the internals. You just use it.

---

## Short Queries Are Noisy

Search for "a" and you match nearly everything.

Trigrams work best with 3+ characters. With fewer, you're essentially doing a brute-force scan anyway.

The fix is simple: require minimum query length, or show a "type more to refine" message. Most code search tools do this.

---

## Case Matters (Usually)

By default, "Contact" and "contact" generate different trigrams.

For code search, you usually want case-insensitive matching. Normalize before indexing:

```sql
INSERT INTO symbols_fts VALUES (lower('ContactList'), ...);
```

It's like filing everything under lowercase in the card catalog. You can still display the original case in results.

---

## Symbols Get Weird

Symbols like `__init__` or `$scope` contain characters that FTS5 might treat as word boundaries.

Test your actual symbol names. If things break, adjust tokenization. Most codebases are fine with defaults.

---

## Indexes Go Stale

Add new files without regenerating? Those files are invisible to search.

It's like adding books to the library but forgetting to update the card catalog.

Build regeneration into your workflow:
- Pre-commit hooks
- CI pipeline
- Editor commands

Staleness is silent. Nothing breaks. You just get incomplete results.

---

## The Complete Picture

Here's how everything connects:

```
Source Code
    ↓
TypeScript Compiler (scip-typescript)
    ↓
SCIP Index (binary file)
    ↓
SQLite Loader
    ↓
FTS5 Table (trigram-indexed)
    ↓
Query: "find symbols matching 'contact'"
    ↓
Results in milliseconds
```

The expensive work—parsing, type-checking, symbol resolution—happens once during indexing.

Everything after that is database lookups.

For a 500-file codebase:
- Indexing: 30-60 seconds (one-time)
- Loading to SQLite: 1-2 seconds
- Queries: 1-5 milliseconds

That's the difference between waiting and instant.

---

## What's Next

You now understand the two pillars of fast code search:

**SCIP** captures what the compiler knows.

**Trigrams** enable fuzzy matching.

The next article dives into querying SQLite FTS5. You'll learn the MATCH syntax, how to rank results with bm25(), and how to handle edge cases.

We'll build queries that answer "find all hooks" or "find components importing this module."

Time to write some SQL.

---

## Quick Reference

```bash
# Generate SCIP index
npx scip-typescript index --output index.scip
```

**What SCIP stores:**
- Symbols (fully-qualified identifiers)
- Definitions (where symbols are created)
- References (where symbols are used)

**Trigram basics:**
- Three-character sequences from text
- "contact" -> con, ont, nta, tac, act
- Enable fuzzy matching through index intersection

**FTS5 setup:**
```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  symbol_name, tokenize = 'trigram'
);
```

**Key insight:** SCIP captures structure. Trigrams enable search. SQLite makes it queryable.

---

*Part 2 of 12: Building Local Code Intelligence*
