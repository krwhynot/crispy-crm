# Querying SQLite FTS5: From Text to Results

You have thousands of symbols in a database. Function names. Type definitions. Components. Hooks.

Someone types "contact" into a search box.

47 results. Ranked by relevance. 3 milliseconds.

That's not magic. That's FTS5.

---

## The Exact Match Problem

Regular SQL is literal.

`WHERE name = 'contact'` returns rows that exactly match "contact". Nothing else. Not "ContactList". Not "validateContact". Not even "CONTACT".

But developers don't search like that.

They type partial names. They make typos. They remember the concept but not the exact spelling.

When someone searches "contact", they want:
- `Contact` (the interface)
- `ContactList` (a component)
- `useContactForm` (a hook)
- `validateContact` (a function)

You could use LIKE: `WHERE name LIKE '%contact%'`. That scans every row. Ten thousand symbols means ten thousand string comparisons per keystroke.

Your UI stutters.

FTS5 flips the problem. It builds an index of where each term appears. Querying that index takes the same time whether you have 100 symbols or 100,000.

It's like looking up a word in a book's index versus reading every page to find it.

Here's the key insight.

Building the index is expensive. Querying it is cheap. You query thousands of times for every insert. The math works massively in your favor.

---

## Virtual Tables

FTS5 uses something called a virtual table.

A virtual table is a SQLite abstraction that looks like a regular table but does custom work behind the scenes. You INSERT, SELECT, DELETE with normal SQL. The virtual table handles the magic internally.

It's like a regular table wearing a costume.

FTS5's virtual table builds a full-text index automatically. Every INSERT updates the index. Every MATCH query searches it.

```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name,
  file_path,
  kind,
  tokenize = 'trigram'
);
```

Notice what's missing. No column types. No primary keys. No foreign keys.

FTS5 tables are pure text containers optimized for one thing: search.

The `tokenize = 'trigram'` part tells FTS5 how to break text into searchable chunks. More on that in a moment.

Insert some symbols:

```sql
INSERT INTO symbols_fts (name, file_path, kind) VALUES
  ('ContactList', 'src/components/ContactList.tsx', 'component'),
  ('useContactForm', 'src/hooks/useContactForm.ts', 'hook'),
  ('validateContact', 'src/validation/contacts.ts', 'function');
```

FTS5 indexes them immediately. You can query right now.

---

## The MATCH Clause

MATCH is where FTS5 searches happen.

```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

Returns every row containing "contact" anywhere. ContactList, useContactForm, validateContact—all of them.

But here's a gotcha that will bite you: MATCH requires the table name.

```sql
-- Wrong. Confusing error.
SELECT * FROM symbols_fts WHERE MATCH 'contact';

-- Right.
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact';
```

The syntax feels redundant. It isn't optional.

MATCH does more than simple text:

**Prefix matching:**
```sql
SELECT * FROM symbols_fts WHERE name MATCH 'use*';
```
Returns useContactForm, useState, useEffect.

**Boolean operators:**
```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact AND form';
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'contact NOT test';
```

Think of AND/OR/NOT as filters on top of the text search. It's like telling a librarian "find books about cooking AND Italian, but NOT desserts."

---

## Ranking with BM25

Finding matches isn't enough. You need to rank them.

Should `Contact` appear before `validateContactEmail`? Probably. One is an exact match. The other just contains the term.

BM25 is a relevance scoring algorithm. It stands for "Best Matching 25" and it's the same algorithm early Google used. The function scores results based on term frequency, document rarity, and length.

It's like a judge scoring how well each result answers your question.

```sql
SELECT name, bm25(symbols_fts) as relevance
FROM symbols_fts
WHERE symbols_fts MATCH 'contact'
ORDER BY relevance;
```

Lower scores mean better matches. The function returns negative numbers. ORDER BY without DESC gives you best matches first.

Counterintuitive, but it works.

You can weight columns differently:

```sql
SELECT name, bm25(symbols_fts, 10.0, 1.0, 2.0) as score
FROM symbols_fts
WHERE symbols_fts MATCH 'contact'
ORDER BY score;
```

The numbers correspond to columns in creation order. A match in name (10x) now matters far more than a match in file_path (1x).

It's like telling the ranking algorithm: "I care most about name matches."

---

## Trigrams Explained

A trigram is every three-character sequence in a string.

"contact" becomes: con, ont, nta, tac, act.

FTS5 stores which rows contain each trigram. When you search "contact", it finds rows containing all five trigrams, intersects the results, and returns them.

It's like solving a crossword where multiple clues must all point to the same answer.

This enables substring matching. Type "tact" and you find "Contact". Type "List" and you find "ContactList".

But trigrams have a minimum length problem. Searching for "ab" produces no complete trigrams. No trigrams means no results.

```sql
-- Returns nothing with trigram tokenizer
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'ab';

-- Works fine
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'abc';
```

Always validate that search queries are at least 3 characters. Or use a different tokenizer for short-query support.

---

## Tokenizer Options

Trigrams aren't the only choice.

**unicode61:** Splits on whitespace and punctuation. Good for natural language documentation.

**porter:** Applies stemming. "running" and "runs" match "run". It's like teaching the search engine that verb forms are the same word.

**trigram:** Three-character chunks. Essential for code where you want substring matching.

For code search, trigram is usually right. For documentation search, porter might be better.

You can make trigrams case-insensitive:

```sql
CREATE VIRTUAL TABLE symbols_fts USING fts5(
  name,
  tokenize = 'trigram case_sensitive 0'
);
```

Now "Contact" and "contact" match the same queries.

---

## Escaping Special Characters

FTS5 uses special characters for query syntax.

Parentheses group boolean expressions. Asterisks mean prefix match. Quotes mean phrase match.

When user input contains these characters, things break:

```sql
-- User searches for "foo(bar)"
-- FTS5 interprets as: foo grouped with bar
SELECT * FROM symbols_fts WHERE symbols_fts MATCH 'foo(bar)';
```

Escape by quoting:

```sql
SELECT * FROM symbols_fts WHERE symbols_fts MATCH '"foo(bar)"';
```

Or strip special characters before querying. It's like sanitizing HTML to prevent injection—you have to assume user input is hostile.

Empty queries crash too:

```sql
-- Throws an error
SELECT * FROM symbols_fts WHERE symbols_fts MATCH '';
```

Always validate input length before querying.

---

## Practical Patterns

**Autocomplete:**
```sql
SELECT DISTINCT name FROM symbols_fts
WHERE name MATCH 'cont*'
ORDER BY length(name)
LIMIT 10;
```

Shorter names first. It's like Google suggesting "contact" before "contactlessPaymentSystemInitializer".

**Find all hooks:**
```sql
SELECT name, file_path FROM symbols_fts
WHERE name MATCH 'use*' AND kind = 'function';
```

**Search with fallback:**
```sql
-- Try exact match first
SELECT * FROM symbols_fts WHERE name = 'ContactForm';
-- Then try FTS
SELECT * FROM symbols_fts WHERE name MATCH 'contactform';
```

The cascading approach gives users the most relevant result when they know the exact name, but still works when they don't.

---

## How FTS5 Stores Data

Understanding internals helps you optimize.

When you create a virtual table, FTS5 creates several hidden tables:

```
t           (virtual table interface)
t_data      (inverted index)
t_docsize   (document lengths for ranking)
```

The inverted index maps each token to rows containing it:

```
Token "con" -> Row 1 (position 0), Row 3 (position 4)
Token "ont" -> Row 1 (position 1), Row 3 (position 5)
```

It's like a book index that says "React: pages 12, 47, 89" except with row IDs instead of pages.

When you search "contact", FTS5 extracts trigrams, looks up each one, intersects the row sets. All on pre-sorted lists. Blazingly fast.

For 100,000 symbols, the index might be 20-50 MB. Usually fine. For massive codebases, consider partitioning into separate tables by file type or directory.

---

## A TypeScript Wrapper

```typescript
export class SymbolSearch {
  private db: Database.Database;

  search(query: string, limit = 50) {
    if (query.length < 3) return [];

    const escaped = query.replace(/[(){}[\]^"~*?:\\]/g, ' ').trim();
    return this.db.prepare(`
      SELECT name, file_path, kind, bm25(symbols_fts, 10, 1, 2) as score
      FROM symbols_fts WHERE symbols_fts MATCH ?
      ORDER BY score LIMIT ?
    `).all(escaped, limit);
  }

  autocomplete(prefix: string, limit = 10) {
    if (prefix.length < 3) return [];
    return this.db.prepare(`
      SELECT DISTINCT name FROM symbols_fts
      WHERE name MATCH ? ORDER BY length(name) LIMIT ?
    `).all(`${prefix}*`, limit);
  }
}
```

Escape special characters. Validate length. Weight columns. That's it.

---

## What's Next

You can store symbols and search them instantly. But we're still matching text.

"Find code related to authentication" returns nothing if no symbol contains "auth".

The next article introduces Tree-sitter for parsing code structure. You'll learn how to extract React components, find hook dependencies, and build the component hierarchy.

Structure is not enough. Meaning comes next.

---

## Quick Reference

**Create FTS5 table:**
```sql
CREATE VIRTUAL TABLE t USING fts5(name, path, tokenize = 'trigram');
```

**Basic search:**
```sql
SELECT * FROM t WHERE t MATCH 'query';
```

**Ranked search:**
```sql
SELECT *, bm25(t) as score FROM t WHERE t MATCH 'query' ORDER BY score;
```

**Prefix match:**
```sql
WHERE name MATCH 'use*'
```

**Key insight:** Build the index once, query it forever. FTS5 handles the complexity.

---

*Part 3 of 12: Building Local Code Intelligence*
