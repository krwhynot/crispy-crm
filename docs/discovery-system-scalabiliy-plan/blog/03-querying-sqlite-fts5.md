# Querying SQLite FTS5: From Text to Results

You have a database full of symbols. Thousands of them. Function names, type definitions, component names, hook identifiers.

Someone types "contact" into a search box.

In 3 milliseconds, you return 47 results ranked by relevance. ContactList appears before validateContactEmail because it is a better match.

This is not magic. This is SQLite FTS5.

---

## The Problem

Regular database queries are exact. Ask for `WHERE name = 'contact'` and you get rows that exactly match "contact". Nothing else.

But code search is fuzzy. Developers type partial names. They make typos. They remember the concept but not the exact spelling.

When someone searches for "contact", they probably want:
- `Contact` (the interface)
- `ContactList` (a component)
- `useContactForm` (a hook)
- `validateContact` (a function)
- `contact_id` (a database column)

A regular LIKE query could work: `WHERE name LIKE '%contact%'`. But LIKE scans every row. For 10,000 symbols, that is 10,000 string comparisons per query. Add case-insensitive matching and it gets slower.

FTS5 inverts the problem. Instead of scanning rows looking for matches, it builds an index of where each word (or trigram) appears. Querying the index is constant time regardless of table size.

Here is the key insight.

Building the index is expensive. Querying the index is cheap. Since you query far more often than you insert, the tradeoff is massively in your favor.

---

## The Virtual Table Approach

FTS5 uses a SQLite feature called virtual tables.

A virtual table looks and acts like a regular table. You INSERT into it, SELECT from it, DELETE from it. The SQL syntax is identical.

But under the hood, a virtual table can do anything. It is an abstraction over custom code.

FTS5's virtual table builds a full-text index automatically. Every INSERT updates the index. Every MATCH query searches the index.

Here is how to create one:

```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name,
  file_path,
  kind,
  documentation,
  tokenize = 'trigram'
);
```

Notice what this does NOT specify. No column types. No primary keys. No foreign keys. FTS5 tables are pure text containers designed for search.

The `tokenize = 'trigram'` part is crucial. It tells FTS5 how to break text into searchable chunks. Trigrams mean every three-character sequence becomes an index entry.

Insert some data:

```sql
INSERT INTO symbols_fts (name, file_path, kind, documentation) VALUES
  ('ContactList', 'src/components/ContactList.tsx', 'component', 'Displays a list of contacts'),
  ('useContactForm', 'src/hooks/useContactForm.ts', 'hook', 'Form state for contact editing'),
  ('validateContact', 'src/validation/contacts.ts', 'function', 'Validates contact data'),
  ('Contact', 'src/types/Contact.ts', 'interface', 'Contact entity type');
```

FTS5 automatically indexes these rows. You can start querying immediately.

---

## Let Us Build It

The MATCH clause is where FTS5 searches happen.

```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

This returns all rows where any column contains "contact" (via trigram matching). The ContactList, useContactForm, validateContact, and Contact rows all match.

But MATCH can do more than simple text matching.

**Column-specific search:**
```sql
-- Only search the name column
SELECT * FROM symbols_fts WHERE name MATCH 'contact';

-- Only search documentation
SELECT * FROM symbols_fts WHERE documentation MATCH 'validation';
```

**Prefix matching:**
```sql
-- Match anything starting with "use"
SELECT * FROM symbols_fts WHERE name MATCH 'use*';
-- Returns: useContactForm, useState, useEffect, ...
```

**Phrase matching:**
```sql
-- Match exact phrase "list of contacts"
SELECT * FROM symbols_fts WHERE documentation MATCH '"list of contacts"';
```

**Boolean operators:**
```sql
-- Must contain both terms
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact AND form';

-- Either term
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact OR organization';

-- Exclude term
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact NOT test';
```

---

## Ranking Results with bm25

Finding matches is not enough. You need to rank them.

When someone searches "contact", should `Contact` appear before `validateContactEmail`? Probably. The first is an exact match. The second just contains the term.

FTS5 includes the bm25() function for relevance ranking.

BM25 (Best Matching 25) is the same algorithm Google used in early search. It scores documents based on:
- **Term frequency:** How often the search term appears
- **Inverse document frequency:** How rare the term is across all documents
- **Document length:** Shorter matches rank higher (all else equal)

Here is how to use it:

```sql
SELECT
  name,
  file_path,
  bm25(symbols_fts) as relevance
FROM symbols_fts
WHERE symbols_fts MATCH 'contact'
ORDER BY relevance;
```

Lower bm25 scores mean better matches. The function returns negative numbers, so ORDER BY without DESC gives you best matches first.

You can weight columns differently:

```sql
-- Give name column 10x importance, documentation 2x, others 1x
SELECT
  name,
  bm25(symbols_fts, 10.0, 1.0, 1.0, 2.0) as relevance
FROM symbols_fts
WHERE symbols_fts MATCH 'contact'
ORDER BY relevance;
```

The weights correspond to columns in creation order. A match in the name column now contributes much more to the score than a match in file_path.

---

## Configuring the Tokenizer

Trigrams work for fuzzy matching, but they are not the only option.

FTS5 supports several tokenizers:

**unicode61 (default):**
```sql
CREATE VIRTUAL TABLE docs USING fts5(content, tokenize = 'unicode61');
```
Splits on whitespace and punctuation. Good for natural language.

**ascii:**
```sql
CREATE VIRTUAL TABLE docs USING fts5(content, tokenize = 'ascii');
```
Same as unicode61 but ASCII-only. Slightly faster.

**porter:**
```sql
CREATE VIRTUAL TABLE docs USING fts5(content, tokenize = 'porter ascii');
```
Applies Porter stemming. "running" and "runs" match "run". Great for documentation search.

**trigram:**
```sql
CREATE VIRTUAL TABLE docs USING fts5(content, tokenize = 'trigram');
```
Three-character chunks. Essential for substring matching in code.

For code search, trigram is usually the right choice. You want `ContactList` to match when someone types "tact" or "List" or "Con".

You can combine tokenizers:

```sql
-- Case-insensitive trigrams
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name,
  tokenize = 'trigram case_sensitive 0'
);
```

The `case_sensitive 0` option normalizes to lowercase before tokenizing.

---

## Practical Query Patterns

Here are query patterns we use constantly.

**Find all React hooks:**
```sql
SELECT name, file_path FROM symbols_fts
WHERE name MATCH 'use*'
  AND kind = 'function'
ORDER BY name;
```

**Find components that mention "form":**
```sql
SELECT name, file_path FROM symbols_fts
WHERE symbols_fts MATCH 'form'
  AND kind = 'component'
  AND file_path MATCH '*.tsx';
```

**Search with fallback (try exact, then fuzzy):**
```sql
-- First, try exact name match
SELECT * FROM symbols_fts WHERE name = 'ContactForm';

-- If no results, try FTS match
SELECT * FROM symbols_fts WHERE name MATCH 'contactform';

-- If still nothing, try broader search
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact form';
```

**Autocomplete (prefix match with limit):**
```sql
SELECT name, kind FROM symbols_fts
WHERE name MATCH 'cont*'
ORDER BY bm25(symbols_fts)
LIMIT 10;
```

**Find related symbols (same file):**
```sql
SELECT b.name, b.kind FROM symbols_fts a
JOIN symbols_fts b ON a.file_path = b.file_path
WHERE a.name = 'ContactList'
  AND b.name != 'ContactList';
```

---

## Deep Dive: How FTS5 Stores Data

Understanding the internals helps you optimize.

FTS5 creates several internal tables when you create a virtual table:

```sql
CREATE VIRTUAL TABLE t USING fts5(content);
-- Actually creates:
-- t           (virtual table interface)
-- t_data      (internal data storage)
-- t_content   (original content, if using external content)
-- t_docsize   (document lengths for ranking)
-- t_config    (configuration)
```

The `t_data` table stores the inverted index. For each token (word or trigram), it stores which rows contain that token and where.

Conceptually:
```
Token "con" -> Row 1 (position 0), Row 3 (position 4), Row 7 (position 0)
Token "ont" -> Row 1 (position 1), Row 3 (position 5), Row 7 (position 1)
Token "nta" -> Row 1 (position 2), Row 3 (position 6)
```

When you search for "contact", FTS5:
1. Extracts trigrams: con, ont, nta, tac, act
2. Looks up each trigram in the inverted index
3. Intersects the row sets
4. Returns rows that contain all trigrams

This intersection happens in memory, on pre-sorted lists. It is extremely fast.

For ranking, FTS5 also stores:
- Total document count
- Total term frequency per term
- Document length per row

The bm25() function uses these to compute relevance without rescanning the data.

---

## Watch Out For

FTS5 gotchas that will bite you.

**MATCH requires the table name.**
```sql
-- Wrong (confusing error message)
SELECT * FROM symbols_fts WHERE MATCH 'contact';

-- Right
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

**Single quotes for queries, not double quotes.**
```sql
-- Wrong
SELECT * FROM symbols_fts WHERE symbols_fts MATCH "contact";

-- Right
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

**Empty queries crash.**
```sql
-- This throws an error
SELECT * FROM symbols_fts WHERE symbols_fts MATCH '';

-- Always validate input
SELECT * FROM symbols_fts WHERE length('query') > 0 AND symbols_fts MATCH 'query';
```

**Special characters need escaping.**
```sql
-- Parentheses are boolean operators in FTS5
-- This tries to group: (foo) AND (bar)
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'foo(bar)';

-- Quote to treat literally
SELECT * FROM symbols_fts WHERE symbols_fts MATCH '"foo(bar)"';
```

**Trigram minimum length.**
Trigrams are three characters. Searching for "ab" with trigram tokenization returns no results because "ab" produces no complete trigrams.
```sql
-- Returns nothing with trigram tokenizer
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'ab';

-- Returns rows containing "abc", "abd", etc.
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'abc';
```

**Index size grows with data.**
For 100,000 symbols, the FTS5 index might be 20-50 MB. This is usually fine, but for massive codebases, consider partitioning (separate tables for different file types or directories).

---

## Building the Complete Query Layer

Here is a TypeScript wrapper that handles the common patterns:

```typescript
import Database from 'better-sqlite3';

export class SymbolSearch {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.createTables();
  }

  private createTables() {
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
        name,
        file_path,
        kind,
        line,
        documentation,
        tokenize = 'trigram case_sensitive 0'
      );
    `);
  }

  search(query: string, limit = 50): SearchResult[] {
    if (query.length < 2) return [];

    const escaped = this.escapeQuery(query);
    const stmt = this.db.prepare(`
      SELECT
        name,
        file_path,
        kind,
        line,
        documentation,
        bm25(symbols_fts, 10.0, 1.0, 2.0, 0.5, 1.0) as score
      FROM symbols_fts
      WHERE symbols_fts MATCH ?
      ORDER BY score
      LIMIT ?
    `);

    return stmt.all(escaped, limit) as SearchResult[];
  }

  searchByKind(query: string, kind: string): SearchResult[] {
    const escaped = this.escapeQuery(query);
    const stmt = this.db.prepare(`
      SELECT name, file_path, kind, line
      FROM symbols_fts
      WHERE symbols_fts MATCH ? AND kind = ?
      ORDER BY bm25(symbols_fts)
      LIMIT 100
    `);

    return stmt.all(escaped, kind) as SearchResult[];
  }

  autocomplete(prefix: string, limit = 10): string[] {
    if (prefix.length < 2) return [];

    const stmt = this.db.prepare(`
      SELECT DISTINCT name
      FROM symbols_fts
      WHERE name MATCH ?
      ORDER BY length(name), name
      LIMIT ?
    `);

    const results = stmt.all(`${prefix}*`, limit) as { name: string }[];
    return results.map(r => r.name);
  }

  private escapeQuery(query: string): string {
    // Escape FTS5 special characters
    return query
      .replace(/[(){}[\]^"~*?:\\]/g, ' ')
      .trim();
  }
}
```

---

## What Is Next

You can now store symbols and search them instantly. But we are still working with text matching.

"Find code related to authentication" returns nothing if no symbol contains the word "auth".

The next article introduces Tree-sitter for parsing actual code structure. You will learn how to extract React components, find hook dependencies, and build the component hierarchy.

Structure is not enough. Meaning comes next.

---

## Quick Reference

**Create FTS5 table:**
```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name, file_path, kind,
  tokenize = 'trigram case_sensitive 0'
);
```

**Basic search:**
```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'query';
```

**Ranked search:**
```sql
SELECT *, bm25(symbols_fts) as score
FROM symbols_fts
WHERE symbols_fts MATCH 'query'
ORDER BY score;
```

**Column weights:**
```sql
bm25(symbols_fts, 10.0, 1.0, 2.0)  -- name=10x, path=1x, docs=2x
```

**Prefix matching:**
```sql
WHERE name MATCH 'use*'
```

**Boolean operators:**
```sql
WHERE symbols_fts MATCH 'contact AND form'
WHERE symbols_fts MATCH 'contact OR organization'
WHERE symbols_fts MATCH 'contact NOT test'
```

**Key insight:**
Build the index once, query it forever. FTS5 handles the complexity.

---

*This is part 3 of a 12-part series on building local code intelligence.*
