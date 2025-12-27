# Phase 1 Explained: The Precision Layer

## Finding Code in a Haystack

You are working on a project with 500 TypeScript files. You see a function called `useContactForm` somewhere in the codebase and want to know: where is it defined? What other files use it?

Your first instinct might be to search with ripgrep or grep. Type `rg "useContactForm"` and wait. You get back 47 matches scattered across imports, comments, tests, and actual usage. Which line is the definition? Which lines are references? You cannot tell without opening each file and reading context.

Now imagine doing this hundreds of times per day. Every time you want to understand how a piece of code connects to other pieces, you run a text search. You manually filter results. You lose context. You waste time.

This is the problem Phase 1 solves. Instead of treating code as text to search, we treat it as a structured graph that the compiler already understands. We extract that understanding once and store it in a way that makes queries instant.

This sounds complicated. It is not. Let me explain.

---

## What Is SCIP?

Think of a library card catalog. Before computers, librarians maintained index cards for every book. Each card told you the author, title, subject, and shelf location. You did not need to walk through every aisle to find a book. You looked it up in the catalog.

SCIP is a card catalog for your code.

SCIP stands for Source Code Intelligence Protocol. It is a format that stores pre-computed information about your code: where every function is defined, where every variable is used, what types everything has. The TypeScript compiler already knows all of this. SCIP just captures that knowledge in a file you can query later.

When you run `scip-typescript`, it reads your code once, asks the TypeScript compiler to analyze it, and writes everything to a binary file. That file contains every symbol definition, every reference, every type signature. All the work that would normally happen in your editor every time you open a file gets done once and saved.

The result? Instead of re-parsing your entire codebase to answer "where is `useContactForm` defined?", you look it up in the index. The answer comes back in under 5 milliseconds. Not 5 seconds. 5 milliseconds.

Who uses SCIP? Sourcegraph built it. GitHub Code Search uses it. Meta uses it internally for millions of lines of code. It is production-proven technology that scales to codebases 1000 times larger than Crispy CRM.

The alternative we are replacing is called ts-morph. It loads your entire codebase into memory as an Abstract Syntax Tree. For small projects, this works fine. For large projects, your computer runs out of memory. SCIP writes to disk instead. Your computer's memory does not care how big your project is.

---

## What Are Trigrams?

Here is a word: `useForm`

Now imagine breaking it into every possible 3-character chunk:

- `use`
- `seF`
- `eFo`
- `For`
- `orm`

These chunks are called trigrams. "Tri" means three. "Gram" means piece.

Why would you want to do this? Because it lets you find substrings instantly.

Traditional search indexes work on whole words. If you search for "use", you find files containing the word "use" but not "useForm" or "useEffect". The word boundaries get in the way.

Trigram indexes solve this. When you index `useForm`, you store its trigrams: `use`, `seF`, `eFo`, `For`, `orm`. When you search for "useF", the engine looks for documents containing both `use` and `seF`. That finds `useForm`, `useFilter`, `useFetch`, and anything else matching that pattern.

This is how Phase 1 enables partial matching. You do not need to remember the exact function name. Type a few characters and find what you need.

The trigram approach is 10 to 100 times faster than scanning every file for every search. The overhead is storing those extra chunks, but storage is cheap. Speed matters.

Here is a concrete example. The word "hello" produces these trigrams:

- `hel`
- `ell`
- `llo`

Search for "ell" and you find "hello", "shell", "seller", "excellent" - anything containing that 3-character sequence. Traditional word search would miss most of these because "ell" is not a complete word.

---

## What Is SQLite FTS5?

SQLite is a database that lives in a single file. No server to run. No network calls. Just open the file and query it.

FTS5 is a feature of SQLite that stands for Full-Text Search version 5. It creates "virtual tables" that are optimized for searching text quickly. A virtual table looks like a regular table when you query it, but behind the scenes it uses specialized data structures for fast lookups.

What makes a virtual table "virtual"? Normally, database tables store rows on disk in a straightforward way. Virtual tables pretend to be regular tables but actually run custom code when you query them. FTS5 virtual tables use inverted indexes and other tricks to make text search blazingly fast.

When we combine SQLite FTS5 with the trigram tokenizer, we get a search engine embedded in our project. No external services. No API calls. No network latency. Just open the database file and run a query.

Why not use Elasticsearch or Algolia or some cloud search service? Three reasons:

1. **Simplicity.** One file. No infrastructure. Works offline.
2. **Speed.** No network round-trips. Queries complete in milliseconds.
3. **Cost.** Free. No API quotas or billing surprises.

For a codebase the size of Crispy CRM, embedded SQLite with FTS5 is the right tool. It handles hundreds of thousands of symbols without breaking a sweat. We are not building Google. We are building a fast local search for a 500-file codebase.

---

## Walking Through Each Task

Phase 1 has six tasks. Here is what each one does in plain language.

### Task 1.1: Install scip-typescript

This adds the indexing tool to your project. Think of it as downloading the card catalog software. The command is:

```bash
npm install -D @sourcegraph/scip-typescript
```

The `-D` flag means "development dependency." This tool is only needed during development. It does not ship with your app to users.

You already have this installed at version 0.4.0.

### Task 1.2: Generate SCIP index

This runs the indexer on your codebase. The TypeScript compiler reads every file, understands every symbol, and writes that understanding to `.claude/state/index.scip`. This file is typically 5 to 10 MB for a project this size.

The script is smart. If the index already exists and is less than an hour old, it skips regeneration. No wasted work.

What happens under the hood? The indexer calls the TypeScript compiler, walks through every source file, records every definition and reference, then serializes everything to a binary protobuf file. Protobuf is a compact format that is 8 times smaller than the equivalent JSON.

### Task 1.3: Parse SCIP protobuf

SCIP stores data in "protobuf" format. Protobuf is a binary encoding that is small and fast but not human-readable. This parser script knows how to read the binary format and extract the symbols, definitions, and references.

The tricky part is the SCIP symbol format. A symbol like `useIsMobile` is actually stored as:

```
scip-typescript npm atomic-crm 0.1.0 src/hooks/`use-mobile.ts`/useIsMobile().
```

That long string encodes the package name, version, file path, and symbol name all in one. The parser knows how to extract the short name from this long string.

### Task 1.4: Create SQLite FTS5 schema

This defines the database structure. We create:

- A `documents` table for files in the codebase
- A `symbols` table for function definitions, classes, types
- A `references` table for every usage of every symbol
- Virtual tables with the trigram tokenizer for fast search
- Triggers that keep the search index synchronized automatically
- Views for common query patterns

The schema is just SQL statements. Run them once to set up the database.

### Task 1.5: Populate FTS5 with trigrams

This reads the SCIP index, parses it, and inserts everything into the SQLite database. Each symbol becomes a row. Each reference becomes a row. Each file's contents get indexed for code search.

The script uses database transactions for speed. Instead of committing after every insert, it batches thousands of inserts into one transaction. This makes population 100 times faster than inserting row by row.

The entire population process takes about 30 seconds for the current codebase.

### Task 1.6: Verify symbol resolution

This is the test suite. It runs queries against the database to confirm everything works:

- Can we find documents? Check.
- Can we find symbols? Check.
- Can we find references? Check.
- Does trigram search work for partial matches? Check.
- Can we go from a symbol name to its definition location? Check.
- Can we find all usages of a symbol? Check.

Eight tests total. If any test fails, the verification script exits with an error. You know something is wrong before it causes problems.

---

## What Changes When This Is Done?

### Before Phase 1

When you want to find where `useContactForm` is defined:

1. Run `rg "useContactForm"` across the codebase
2. Get 47 matches including imports, comments, and actual uses
3. Open each promising file to find the definition
4. Manually piece together the call graph

Time: 30 seconds to several minutes depending on codebase size.

When you want to find all usages of `useContactForm`:

1. Run the same ripgrep command
2. Filter out the definition manually
3. Miss usages that rename the import
4. Miss usages in dynamically generated code

Accuracy: Maybe 80% if you are careful.

### After Phase 1

When you want to find where `useContactForm` is defined:

1. Query the database: `SELECT * FROM symbols WHERE name = 'useContactForm'`
2. Get back the exact file path, line number, and column

Time: Under 5 milliseconds.

When you want to find all usages of `useContactForm`:

1. Query the database: `SELECT * FROM references WHERE symbol_id = X`
2. Get back every location that references this symbol, with role information (import, read, write)

Accuracy: 100% because the compiler resolved it.

### The Numbers

| Metric | Before | After |
|--------|--------|-------|
| Index generation | N/A | Under 30 seconds |
| Symbol lookup | 2-10 seconds | Under 5 milliseconds |
| Find all references | Manual work | Under 5 milliseconds |
| Memory usage | Loads entire AST | Fixed 200 MB maximum |
| Substring search | Full scan | Trigram index |
| Accuracy | Best effort | Compiler-verified |

The index itself is around 5-10 MB. The SQLite database is similar size. Together they take up about 20 MB of disk space. Trivial cost for a 2000x speed improvement.

---

## Quick Glossary

**SCIP (Source Code Intelligence Protocol)**

A binary format that stores pre-computed code analysis. Contains symbols, definitions, references, and type information. Created by Sourcegraph.

**Trigram**

A 3-character substring. Breaking text into trigrams enables fast partial matching. The word "hello" produces trigrams: hel, ell, llo.

**FTS5 (Full-Text Search 5)**

A SQLite feature that creates specialized indexes for text search. Supports various tokenizers including trigram. Queries run in milliseconds.

**Protobuf (Protocol Buffers)**

A binary serialization format from Google. Smaller and faster than JSON but not human-readable. SCIP uses protobuf for its index format.

**Symbol**

A named entity in code. Functions, classes, interfaces, types, variables, and parameters are all symbols. Each symbol has a unique identifier in the SCIP index.

**Reference**

A usage of a symbol. When you call a function or read a variable, that creates a reference to the symbol. References are tagged with roles: import, read, write, definition.

**Definition**

The location where a symbol is created. A function definition is where you write `function foo()`. References are everywhere else you use `foo`.

**Virtual Table**

A SQLite table backed by custom code instead of regular storage. FTS5 virtual tables look like regular tables but use search-optimized data structures internally. You query them with normal SQL.

---

## Summary

Phase 1 builds the foundation. It takes the TypeScript compiler's understanding of your code and makes it queryable. Instead of searching text and guessing at meaning, you query a database that knows exactly what every symbol is and where it lives.

The investment is small: two npm packages, five scripts, one SQL schema. The payoff is large: instant code navigation, accurate reference finding, and a base layer for everything that comes next.

When Phase 1 is complete, you can answer questions like "where is X defined?" and "what uses Y?" in milliseconds instead of minutes. The Precision Layer earns its name by giving you compiler-verified precision instead of best-effort text matching.

Next up: Phase 2 adds the Semantic Layer. That is where we teach the system to understand what code means, not just where it is located.
