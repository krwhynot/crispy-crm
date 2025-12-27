# What Is SCIP and Why Trigrams Matter

Your TypeScript compiler is brilliant.

Every time you run `tsc`, it reads your entire codebase, resolves every import, type-checks every expression, and builds a complete mental model of how everything connects. It knows that `validateContact` on line 47 calls the function defined on line 12 of a different file. It knows that your `Contact` interface is used in 37 places across 12 files.

Then it compiles your code and forgets everything.

What if you could save what the compiler knows and query it later?

---

## The Problem

Code understanding is expensive to compute.

When your IDE shows "23 references" next to a function name, it had to find those 23 references by analyzing your code. When GitHub shows "Go to Definition" links, it pre-computed where every definition lives.

The naive approach is to recompute this information on every query. Open a file, parse it, analyze the symbols, resolve the references. For small codebases, this is fine. For large codebases, it becomes the bottleneck.

Here is what happens when you search for "contact" in a 500-file codebase:

1. Read all 500 files from disk
2. Parse each file into an AST (Abstract Syntax Tree)
3. Walk each AST looking for symbols containing "contact"
4. Build a list of matches with file paths and line numbers
5. Display results

This takes seconds. Maybe tens of seconds for larger codebases.

Now imagine doing this for every code navigation request. Every "Find References". Every "Go to Definition". Every autocomplete suggestion.

The solution is to do the expensive work once and store the results.

---

## The Compiler's Memory

SCIP (Source Code Intelligence Protocol) is a format for storing what the compiler already knows.

Think of it as the compiler's memory, persisted to disk. Instead of forgetting everything after compilation, you save the symbol table, the reference graph, the type relationships, everything that took expensive computation to build.

The name is intentional. SCIP is a protocol, not a tool. It defines a data format that any language can target. There are SCIP indexers for TypeScript, Java, Python, Go, Rust, and more.

Here is what SCIP captures:

**Every symbol in your codebase.** Functions, variables, classes, interfaces, type aliases, constants. Each gets a unique identifier that distinguishes it from similarly-named symbols elsewhere.

**Every definition site.** The exact file and line where each symbol is created. Where you wrote `function validateContact(...)` or `interface Contact {...}`.

**Every reference site.** Every place each symbol is used. Every function call, every import statement, every type annotation.

**The relationships between symbols.** Which file imports which. Which function calls which. Which class implements which interface.

The result is a complete map of your codebase's structure, stored in a compact binary format.

For a 100,000-line TypeScript codebase, this might be 50-100 MB on disk. That sounds large until you realize it replaces gigabytes of in-memory ASTs that would otherwise be rebuilt on every query.

---

## The Filing Cabinet Approach

Here is an analogy that makes SCIP click.

Imagine your codebase is a filing cabinet with 500 folders (files). Each folder contains documents (functions, classes, types).

**Without SCIP:** Every time someone asks "where is the validateContact document?", you open every folder, flip through every document, check if it matches, and build a list of locations. Tomorrow, you do it again.

**With SCIP:** You build a master index card for every document. The card says what the document is, which folder it lives in, and which other documents reference it. Store the cards in a searchable index. Now finding validateContact is instant.

The upfront cost of building the index is paid once. Every query after that is a simple lookup.

Who uses SCIP? Sourcegraph built it to power their code search platform that handles codebases with millions of files. GitHub uses it for code navigation. Meta uses it internally. When you click "Go to Definition" on github.com, you are querying a SCIP index.

---

## Let Us Build It

Generating a SCIP index for TypeScript is one command:

```bash
npx scip-typescript index --output .claude/state/index.scip
```

This creates a binary file containing the complete symbol graph of your codebase. But what is actually in there?

SCIP files use Protocol Buffers (protobuf) encoding, so you cannot just open them in a text editor. But conceptually, the structure is:

```protobuf
Index {
  metadata: {
    version: "0.3.0"
    tool_info: { name: "scip-typescript", version: "0.3.17" }
    project_root: "file:///home/user/project"
  }
  documents: [
    Document {
      relative_path: "src/validation/contacts.ts"
      occurrences: [
        { range: [12, 16, 31], symbol: "npm package ... validateContact().", role: DEFINITION }
        { range: [47, 2, 17], symbol: "npm package ... validateContact().", role: REFERENCE }
      ]
      symbols: [
        { symbol: "npm package ... validateContact().", documentation: ["Validates contact data"] }
      ]
    }
    // ... 499 more documents
  ]
}
```

Each document represents one source file. Within each document:

- **Occurrences** list every symbol that appears in the file, with exact positions and roles (definition vs reference)
- **Symbols** provide metadata like documentation and kind (function, type, variable)

The symbol identifiers are fully-qualified paths. Not just "validateContact" but:

```
npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact().
```

This uniquely identifies the symbol across your entire dependency graph. There might be another validateContact in a different package. SCIP can tell them apart.

---

## The Trigram Trick

SCIP solves the "find all references" problem. But what about fuzzy search?

Developers do not always know the exact name. You might type "contact" hoping to find `ContactList`, `useContactForm`, `validateContact`, and `ContactSchema`. You might type "val" looking for `validateUser`, `ValidationError`, and `isValid`.

This is where trigrams enter the picture.

A trigram is simply a three-character sequence. The word "contact" contains these trigrams:

```
con  ont  nta  tac  act
```

Here is the insight: if you build an index of trigrams, you can find approximate matches without scanning every symbol.

Search for "con"? Look up symbols whose trigram index contains "con". You get:
- contact (contains con)
- ContactList (contains con)
- useContactContext (contains con)
- constant (contains con)
- connect (contains con)

This is fuzzy matching through indexing. Instead of comparing your query against every symbol, you look up which symbols contain the trigrams you typed.

The math works out beautifully. A symbol with 10 characters has 8 trigrams. A codebase with 10,000 symbols might have 50,000 unique trigrams. Looking up one trigram gives you a small set of candidate symbols. Intersecting multiple trigram lookups narrows it further.

Search for "conta"? Intersect symbols containing "con", "ont", "nta", and "ta". The result is a tiny set of precise matches.

---

## SQLite FTS5: The Container

Where do you store trigrams for fast lookup? You could build a custom data structure. Or you could use something that already exists and is battle-tested.

SQLite's FTS5 (Full-Text Search 5) extension does exactly what we need.

FTS5 is a virtual table that stores text and builds a searchable index. The "virtual" part means SQLite handles all the indexing behind the scenes. You insert rows, FTS5 builds the trigram index. You query with MATCH, FTS5 searches the index.

Here is how to set it up:

```sql
-- Create an FTS5 table with trigram tokenization
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  symbol_name,
  file_path,
  definition_line,
  documentation,
  tokenize = 'trigram'
);

-- Insert symbols from your SCIP index
INSERT INTO symbols_fts VALUES (
  'validateContact',
  'src/validation/contacts.ts',
  '12',
  'Validates contact data against schema'
);

-- Search with trigrams
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'conta';
-- Returns: validateContact, ContactList, ContactSchema, etc.
```

The `tokenize = 'trigram'` configuration tells FTS5 to break text into three-character chunks for indexing. Now searches like "conta" or "valid" return matches in milliseconds.

This is the foundation of fast code search. SCIP gives you the symbol data. FTS5 makes it searchable. Together they turn "find anything related to contacts" from a multi-second operation into an instant lookup.

---

## Connecting the Pieces

Here is how the complete system works:

```
Source Code
    ↓
TypeScript Compiler (via scip-typescript)
    ↓
SCIP Index (index.scip)
    ↓
SQLite Loader (reads SCIP, writes to SQLite)
    ↓
FTS5 Table (symbols_fts)
    ↓
Query API ("find symbols matching 'contact'")
    ↓
Results (ContactList at line 47, validateContact at line 12, ...)
```

The expensive work (parsing, type-checking, symbol resolution) happens once during indexing. Everything after that is database lookups.

For a 500-file codebase:
- Indexing takes 30-60 seconds (one-time or after changes)
- Loading into SQLite takes 1-2 seconds
- Queries take 1-5 milliseconds

That is the difference between waiting and instant.

---

## Watch Out For

Trigrams and SCIP are powerful but have sharp edges.

**Short queries produce too many results.** Search for "a" and you match nearly every symbol. Trigrams work best with 3+ characters. Consider requiring minimum query length or showing partial results with a "type more" indicator.

**Case sensitivity varies by use case.** By default, "Contact" and "contact" generate different trigrams. For code search, you usually want case-insensitive matching. Normalize to lowercase before indexing:

```sql
INSERT INTO symbols_fts VALUES (lower('ContactList'), ...);
```

**Special characters need handling.** Symbols like `__init__` or `$scope` contain characters that FTS5 might treat as word boundaries. Test your actual symbol names and adjust tokenization if needed.

**Index staleness is silent.** If you add new files but do not regenerate the index, those files are invisible to search. Build index regeneration into your workflow (pre-commit hooks, CI pipeline, editor commands).

**Memory vs disk tradeoff.** SQLite FTS5 can keep indexes in memory or on disk. In-memory is faster but consumes RAM. On-disk is slower but scales better. For development machines with 16GB RAM, in-memory usually wins. For servers processing large codebases, consider disk-based indexes.

---

## What Is Next

Now you understand the two pillars of fast code search:

1. **SCIP** for capturing what the compiler knows
2. **Trigrams** for fuzzy text matching

The next article dives deeper into querying SQLite FTS5. You will learn the MATCH syntax, how to rank results with bm25(), and how to configure tokenizers for different use cases.

We will build actual queries that answer questions like "find all hooks" or "find components that import this module".

Time to write some SQL.

---

## Quick Reference

**Generate SCIP index:**
```bash
npx scip-typescript index --output index.scip
```

**What SCIP contains:**
- Symbols (fully-qualified identifiers)
- Definitions (where symbols are created)
- References (where symbols are used)
- Relationships (imports, calls, inheritance)

**Trigram basics:**
- Three-character sequences from text
- "contact" -> con, ont, nta, tac, act
- Enable fuzzy matching through index intersection

**FTS5 setup:**
```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  symbol_name, file_path,
  tokenize = 'trigram'
);
```

**FTS5 query:**
```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

**Key insight:**
SCIP captures structure. Trigrams enable search. SQLite makes it queryable.

---

*This is part 2 of a 12-part series on building local code intelligence.*
