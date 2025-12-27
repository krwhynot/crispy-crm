# SCIP Symbol References: The GPS for Your Code

Click a function name. Press a key. Land exactly where it is defined.

We take "Go to Definition" for granted.

But have you ever wondered how it actually works?

It is not magic. It is an index lookup. And understanding that lookup unlocks everything.

---

## The City Directory

Before GPS, cities published directories.

You wanted to find "Johnson, Michael" on Oak Street? Open the directory, find the name, read the address: "2847 Oak Street, Apartment 3B."

Direct lookup. No wandering.

Now flip the question. "Who lives at 2847 Oak Street?"

A regular directory cannot answer that. It is organized by name, not address. You would have to scan every entry.

But a cross-referenced directory can. It maintains two indexes: name to address, and address to name.

SCIP is a cross-referenced directory for code.

Every symbol has a definition location. Every location has symbols defined there. Both directions are indexed.

That is how "Go to Definition" and "Find All References" both work instantly. Same data, different queries.

---

## What SCIP Actually Stores

An occurrence is a single appearance of a symbol in your code. It is like a pin on a map marking where something happens.

When you index a codebase, SCIP records every occurrence with precise coordinates.

Consider this function:

```typescript
// src/validation/contacts.ts
export function validateContact(data: unknown): Contact {
  const result = contactSchema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error);
  return result.data;
}
```

SCIP creates a record:

```
range: [2, 16, 2, 31]
symbol: "npm @crispy-crm 1.0.0 src/.../contacts.ts validateContact()."
symbol_roles: DEFINITION | EXPORT
```

Three pieces. Let me decode them.

**The range.** Four numbers: `[startLine, startCol, endLine, endCol]`. Zero-indexed. The text at those coordinates is "validateContact."

**The symbol.** A fully-qualified name. Package, path, descriptor. Globally unique. We covered this format in the previous article.

**The roles.** Bit flags describing what kind of occurrence this is.

A symbol role is a flag indicating how a symbol is being used at that location. Think of it as a label on that map pin: "definition here" or "just a reference."

This occurrence is both a definition (the symbol is created here) and an export (visible outside the file).

Other roles you will see:
- `REFERENCE` - using a symbol defined elsewhere
- `IMPORT` - bringing a symbol into scope
- `WRITE_ACCESS` - modifying the symbol
- `READ_ACCESS` - reading the symbol

The roles tell you what is happening without re-parsing anything.

---

## The Reverse Lookup

"Go to Definition" is forward: symbol name to definition location.

"Find All References" is reverse: symbol name to all reference locations.

Here is the beautiful part.

SCIP stores both in the same data. Every occurrence includes the symbol it refers to.

Let me trace a reference:

```typescript
// src/components/ContactForm.tsx
import { validateContact } from '../validation/contacts';

export function ContactForm({ data }: Props) {
  const contact = validateContact(formData);  // <-- Reference
  saveContact(contact);
}
```

SCIP records:

```
range: [5, 20, 5, 35]
symbol: "npm @crispy-crm 1.0.0 src/.../contacts.ts validateContact()."
symbol_roles: REFERENCE
```

Same symbol. Different file. Different role.

To find all references:
1. Look up the symbol string
2. Scan occurrences for that symbol with `REFERENCE` role
3. Collect file paths and ranges

In a hash-indexed structure, that is O(1) per reference. Symbol used in 50 places? Fifty lookups. Milliseconds.

Compare to the non-indexed approach: parse every file, walk every AST, check every node. Orders of magnitude slower.

---

## Following Import Chains

Real codebases are webs of imports and exports. It is like a relay race where the baton gets passed from file to file.

```typescript
// lib/core/validation.ts
export function validate() { ... }

// lib/core/index.ts (barrel file)
export { validate } from './validation';

// lib/index.ts
export * from './core';

// app/form.ts
import { validate } from 'lib';
```

The symbol `validate` is re-exported twice through barrel files.

SCIP tracks each step:

1. **Definition** in `validation.ts` - role: `DEFINITION | EXPORT`
2. **Re-export** in `core/index.ts` - role: `REFERENCE | EXPORT`
3. **Re-export** in `lib/index.ts` - role: `REFERENCE | EXPORT`
4. **Import** in `app/form.ts` - role: `REFERENCE | IMPORT`

Here is what most people miss.

The symbol string never changes. No matter how many re-exports, the identity is preserved. Every occurrence points to the same original symbol.

That is why your IDE knows to jump to the real function, not the barrel file. SCIP does not stop at intermediate re-exports. It follows the chain to the original definition.

---

## Building a Reference Graph

Individual lookups are powerful. But the real leverage comes from graphs.

A reference graph shows relationships between all symbols. It is like a social network, but for code. Who calls whom. Who depends on whom.

```typescript
interface ReferenceGraph {
  nodes: Map<string, SymbolNode>;
  edges: ReferenceEdge[];
}

interface SymbolNode {
  symbol: string;
  file: string;
  line: number;
}
```

With this graph, complex questions become simple queries.

**"What calls this function?"**

```typescript
const callers = graph.edges
  .filter(e => e.from === symbol && e.edgeType === 'call')
  .map(e => graph.nodes.get(e.to));
```

**"What does this function depend on?"**

```typescript
const deps = graph.edges
  .filter(e => e.to === symbol)
  .map(e => graph.nodes.get(e.from));
```

**"Which functions are never referenced?"**

```typescript
const referenced = new Set(graph.edges.map(e => e.from));
const deadCode = [...graph.nodes.values()]
  .filter(n => !referenced.has(n.symbol));
```

No parsing. No AST walking. Pure lookup.

---

## The Holes in Your Graph

Symbol reference analysis has edge cases. Knowing them saves you from false confidence.

**Dynamic imports are invisible.**

```typescript
const module = await import(`./plugins/${pluginName}`);
module.doSomething();
```

SCIP cannot know what `pluginName` will be at runtime. That `doSomething` might come from any file in `plugins/`.

Dynamic imports create holes in your reference graph. Some edges simply do not exist in the index.

**Type-only imports are different animals.**

```typescript
import type { Contact } from './types';     // Type-only
import { validateContact } from './validation';  // Value import
```

The first disappears at runtime. The second affects bundling.

SCIP marks them differently. Type-only references have no `READ_ACCESS` or `WRITE_ACCESS` roles. They are pure type system constructs.

If you are analyzing runtime dependencies, filter for value imports:

```typescript
function isValueReference(occ: Occurrence): boolean {
  const roles = occ.symbolRoles;
  return (roles & READ_ACCESS) !== 0 || (roles & WRITE_ACCESS) !== 0;
}
```

**Namespace re-exports hide their contents.**

```typescript
export * from './utils';
```

This re-exports every symbol from `utils`. But SCIP does not expand it into individual occurrences at the re-export site.

To fully resolve what symbols flow through `*`, you need to follow the reference to the source file and collect its exports yourself.

**Generic instantiations share identity.**

```typescript
type StringResult = Result<string>;
type NumberResult = Result<number>;
```

Are these the same symbol? In SCIP, yes. Both reference the same base symbol `Result#`. The type arguments are metadata, not part of the identity.

This matters when analyzing generic usage patterns. You might want "all instantiations of Result." That requires examining type arguments separately from symbol lookup.

**External symbols are leaves.**

```typescript
import { useState } from 'react';
```

`useState` is defined in React, not your codebase. SCIP records the reference but cannot show you the definition.

For practical purposes, external symbols are dead ends in your reference graph. You know they are used. You cannot see how they work internally.

---

## Impact Analysis: A Real Use Case

You want to change a function. What might break?

This is impact analysis. It is like checking which dominoes fall when you push one over.

```typescript
function analyzeImpact(index: Index, symbol: string): ImpactReport {
  const directRefs = getReferences(index, symbol);

  const affectedSymbols = new Set<string>();
  for (const ref of directRefs) {
    const containing = findContainingSymbol(index, ref.file, ref.line);
    if (containing) affectedSymbols.add(containing);
  }

  return {
    directlyAffected: Array.from(affectedSymbols),
    totalReferences: directRefs.length,
    fileCount: new Set(directRefs.map(r => r.file)).size,
  };
}
```

Before changing `validateContact`, you know:
- 47 direct references across 12 files
- 23 functions directly depend on it

Change with eyes open.

---

## What is Next

We have covered how SCIP stores symbols and references. You can now build instant navigation and graph-based analysis.

But structural queries only get us so far.

"Find all references to validateContact" works when you know the exact name. It fails when you want something fuzzier.

"Find code that handles form validation" is a semantic query. You want conceptually related code, not just exact matches. It is like searching for "songs that sound like this" instead of "songs with this exact title."

The next article introduces vector embeddings: turning code into coordinates in a meaning space. Similar concepts cluster together. Semantic search becomes possible.

From exact matches to fuzzy matches. From symbols to meaning.

---

## Quick Reference

**Finding a definition:**
```typescript
const def = index.documents
  .flatMap(d => d.occurrences.filter(o =>
    o.symbol === symbolName && (o.symbolRoles & DEFINITION)
  ))[0];
```

**Finding all references:**
```typescript
const refs = index.documents
  .flatMap(d => d.occurrences.filter(o =>
    o.symbol === symbolName && !(o.symbolRoles & DEFINITION)
  ));
```

**Symbol role flags:**
```typescript
DEFINITION   = 1   // Created here
IMPORT       = 2   // Brought into scope
WRITE_ACCESS = 4   // Modified
READ_ACCESS  = 8   // Read
```

**The identity rule:**

Re-exports do not create new symbols. The symbol string is identical at every occurrence, from original definition through any number of re-exports to final usage.

---

*Part 6 of 12: Building Local Code Intelligence*
