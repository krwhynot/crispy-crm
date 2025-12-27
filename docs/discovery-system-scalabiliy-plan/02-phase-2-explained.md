# Phase 2 Explained: Teaching the Extractors a New Language

> **Reading Time:** 8-10 minutes
> **Goal:** Understand what extractors do and why we are changing how they work

---

## What Problem Are We Solving?

Right now, our discovery system reads your entire codebase into memory every single time.

It is like opening every book in a library, reading them cover to cover, just to find a recipe. Every. Single. Time.

Phase 2 teaches our system to use a catalog instead.

---

## What Is an Extractor?

Think of extractors like specialist researchers at a library.

You would not send one person to find cookbooks, biographies, AND travel guides. Instead, you hire specialists. One researcher only looks for cookbooks. Another only looks for biographies.

Each extractor is an expert in finding one specific type of thing in your code.

---

## The Seven Extractors (Your Research Team)

### 1. Components Extractor (`components.ts`)
**Finds:** React components - the building blocks of your UI.

It is like a researcher who only looks for Lego instruction manuals. They spot anything that builds a visible piece of your app (buttons, forms, pages).

### 2. Hooks Extractor (`hooks.ts`)
**Finds:** Custom hooks - reusable logic patterns.

It is like finding recipe templates used in multiple dishes. Hooks are templates for common tasks like "fetch data" or "track user input."

### 3. Schemas Extractor (`schemas.ts`)
**Finds:** Zod schemas - validation rules for your data.

It is like finding entry requirements for a nightclub. "Must be over 21. Must have valid ID." Schemas reject anything that does not fit.

### 4. Types Extractor (`types.ts`)
**Finds:** TypeScript type definitions - descriptions of data shapes.

It is like finding blueprints that say "a house has walls, a roof, and a door." Types describe what something IS.

### 5. Forms Extractor (`forms.ts`)
**Finds:** Form components - anywhere users can input data.

It is like finding every place in a building where you can sign your name. Login forms, search boxes, contact forms.

### 6. Validation Services Extractor (`validation-services.ts`)
**Finds:** Validator functions - the rule enforcers.

It is like finding the bouncers at every door. They check if what you brought matches the requirements.

### 7. Call Graph Extractor (`call-graph.ts`)
**Finds:** Who calls what - the phone directory of function calls.

It is like mapping every phone call in an office. "When Sarah calls, she talks to Mike first, then Lisa."

---

## What Does "Query SCIP" Mean?

**Old way:** Each researcher walks through every aisle, pulling books off shelves, checking each one.

**New way:** Each researcher asks the card catalog. "Show me all cookbooks on the third floor."

SCIP is the card catalog. It is a pre-built index of your codebase.

The extractors used to read files directly. Now they just ask the index. For large codebases, this is 10x faster.

---

## What Is the query.ts Utility?

Imagine your researchers only speak English, but the card catalog only understands Latin.

You need a translator.

The `query.ts` file is that translator. It speaks "SCIP language" so your extractors do not have to.

### The Three Main Functions

| Function | What It Does | Example Use |
|----------|--------------|-------------|
| `findSymbolsByPattern` | Find symbols matching a pattern | "Find all functions starting with 'use'" |
| `getReferences` | Show everywhere a symbol is used | "Who calls this function?" |
| `getDefinition` | Where was this symbol defined? | "What file contains this?" |

The extractors stay simple. They ask questions in plain terms. The translator handles the complexity.

---

## What Is ast-grep?

Sometimes the card catalog does not have what you need.

It is like asking "show me books with red covers." The catalog tracks titles and authors, not cover colors.

ast-grep is a pattern-matching stamp. You create a shape (like a cookie cutter) and it finds everything matching that shape.

```yaml
# Example: Find React components by their "shape"
pattern: function $NAME($$$) { $$$ return <$$$>; }
```

SCIP handles 95% of cases. ast-grep catches the edge cases.

---

## What Does "Output Matches Previous Counts" Mean?

This is your safety check.

It is like verifying your new filing system still has all 100 books, not 99.

Before migration: 484 components. After migration: should still be 484 components.

If the numbers do not match, something went wrong.

```bash
# Verify nothing is missing
just discover
diff old-counts.txt new-counts.txt
```

---

## The Migration Process

### Step 1: Install the SCIP Library
```bash
npm install -D @sourcegraph/scip
```

### Step 2: Create the Translator (query.ts)
Build the utility that converts extractor questions into SCIP queries. About 50 lines that saves hundreds.

### Step 3: Rewrite Each Extractor

**Old way:**
```typescript
import { Project } from 'ts-morph';
const project = new Project();  // Loads EVERYTHING into memory
```

**New way:**
```typescript
import { findSymbolsByPattern } from './scip/query';
const components = findSymbolsByPattern(index, /^Component/);  // Instant lookup
```

### Step 4: Verify Nothing Broke
Run discovery and confirm all counts match.

---

## Why This Matters for You

After Phase 2:

| Metric | Before | After |
|--------|--------|-------|
| Speed | 2+ minutes | ~10 seconds |
| Memory | 1.5GB+ | ~200MB |
| Scale limit | ~500K lines | 2M+ lines |

The extractors do the same job. They just learned a more efficient way.

---

## Verification Checklist

Before calling Phase 2 complete:

- [ ] All 7 extractors use SCIP queries
- [ ] No `import { Project } from 'ts-morph'` lines remain
- [ ] Component count: 484
- [ ] Hook count: 77
- [ ] Schema count: 82
- [ ] Type count: 101
- [ ] Form count: 39
- [ ] Call graph nodes: 919
- [ ] `just discover` runs without errors

---

## Common Questions

**Q: Will my discovery output look different?**
No. The JSON files will be identical. Only the speed changes.

**Q: What if SCIP misses something?**
ast-grep provides a fallback. The verification step catches any gaps.

**Q: Do I need to understand SCIP?**
No. The query.ts translator hides all that complexity.

**Q: How long does the migration take?**
About 2 days. Each extractor takes 2-3 hours.

---

**Next:** [Phase 3: Qdrant + Ollama Integration](./03-phase-3-worker-parallelization.md)
