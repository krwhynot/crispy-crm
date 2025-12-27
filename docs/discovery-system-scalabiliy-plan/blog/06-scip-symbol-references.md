# SCIP Symbol References: Go to Definition and Beyond

Click a function name. Press a key. Land exactly where it is defined.

We take "Go to Definition" for granted. It feels like magic. You click on `validateContact` in one file and teleport to line 47 of `contacts.ts` where it lives.

But it is not magic. It is an index lookup.

Understanding how this works reveals the true power of SCIP. And once you understand it, you can build tools that navigate code as fluently as your IDE.

---

## The City Directory Analogy

Before GPS, cities published directories.

You wanted to find "Johnson, Michael" on Oak Street. You opened the directory, found "Johnson, Michael," and read: "2847 Oak Street, Apartment 3B."

No wandering through neighborhoods. No asking strangers. Direct lookup.

Now imagine you wanted the reverse. "Who lives at 2847 Oak Street, Apartment 3B?"

A regular directory cannot answer that. It is organized by name, not address. You would have to scan every entry looking for that address.

But a cross-referenced directory can. It maintains two indexes: name to address, and address to name.

SCIP is a cross-referenced directory for code.

Every symbol has a definition location. Every location has symbols defined there. Both directions are indexed.

This is how "Go to Definition" and "Find All References" both work instantly. Same data, different queries.

---

## How SCIP Stores Definition Locations

When you index a codebase, SCIP records every symbol definition with precise coordinates.

Consider this source file:

```typescript
// src/validation/contacts.ts
export function validateContact(data: unknown): Contact {
  const result = contactSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
```

SCIP creates an occurrence record:

```
Occurrence {
  range: [2, 16, 2, 31]  // line 2, columns 16-31
  symbol: "npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact()."
  symbol_roles: DEFINITION | EXPORT
}
```

Let us decode this:

**range: [2, 16, 2, 31]**

The symbol spans line 2, starting at column 16 and ending at column 31. Zero-indexed. The text at those coordinates is "validateContact".

Four numbers mean it is a multi-line range (though in this case, start and end lines are the same). Three numbers would mean single-line: `[line, startCol, endCol]`.

**symbol**

The fully-qualified name. We covered this format in the previous article. Package, path, descriptor. Globally unique.

**symbol_roles: DEFINITION | EXPORT**

Roles are bit flags. This occurrence is both a definition (the symbol is created here) and an export (the symbol is visible outside the file).

Other roles include:
- `REFERENCE` - using a symbol defined elsewhere
- `IMPORT` - bringing a symbol into scope
- `FORWARD_DEFINITION` - declaring before defining (rare in TypeScript)

The roles tell you what kind of occurrence this is without re-parsing the code.

---

## The Reverse Lookup: Find All References

"Go to Definition" is a forward lookup: symbol name to definition location.

"Find All References" is a reverse lookup: symbol name to all reference locations.

SCIP stores both in the same data structure. Every occurrence includes the symbol it refers to.

Let us trace a reference:

```typescript
// src/components/ContactForm.tsx
import { validateContact } from '../validation/contacts';

export function ContactForm({ data }: Props) {
  const handleSubmit = () => {
    const contact = validateContact(formData);  // <-- This is a reference
    saveContact(contact);
  };
  // ...
}
```

SCIP records:

```
Occurrence {
  range: [6, 20, 6, 35]
  symbol: "npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact()."
  symbol_roles: REFERENCE
}
```

Same symbol. Different file. Different role.

To find all references:

1. Look up the symbol string: `"npm @crispy-crm 1.0.0 src/validation/contacts.ts validateContact()."`
2. Scan all occurrences for that symbol with `REFERENCE` role
3. Collect the file paths and ranges

In a hash-indexed structure, step 2 is O(1) per reference. Total cost is O(k) where k is the number of references. For a symbol used in 50 places, that is 50 lookups. Milliseconds.

Compare to the non-indexed approach: parse every file, walk the AST, check if any node matches. O(n) where n is total AST nodes in the codebase. Orders of magnitude slower.

---

## Deep Dive: Cross-File Navigation

Real codebases are webs of imports and exports.

```
contacts.ts  ───exports───>  validateContact
     │
     │ import
     ▼
ContactForm.tsx  ───uses───>  validateContact
     │
     │ import
     ▼
ContactEdit.tsx  ───uses───>  validateContact
```

SCIP captures this entire web. Every import is a reference. Every export is a definition with a special role.

Here is how import chains work:

```typescript
// src/validation/contacts.ts
export function validateContact(data: unknown) { ... }

// src/validation/index.ts (barrel file)
export { validateContact } from './contacts';

// src/components/ContactForm.tsx
import { validateContact } from '../validation';
```

SCIP creates three occurrences for `validateContact`:

1. **Definition** in `contacts.ts` at the function declaration
2. **Reference + Export** in `index.ts` at the re-export
3. **Reference + Import** in `ContactForm.tsx` at the import

The symbol string is the same everywhere. That is the key insight. Re-exports do not create new symbols. They reference the original.

When you "Go to Definition" from `ContactForm.tsx`, SCIP does not stop at `index.ts`. It follows the chain to the original definition in `contacts.ts`.

This is why your IDE knows to jump to the real function, not the barrel file.

---

## Symbol Occurrence Types

SCIP distinguishes several occurrence types through the `symbol_roles` field:

```typescript
enum SymbolRole {
  Definition = 1,           // Symbol is created here
  Import = 2,               // Symbol is brought into scope
  WriteAccess = 4,          // Symbol is modified (x = 5)
  ReadAccess = 8,           // Symbol is read (console.log(x))
  Generated = 16,           // Code was auto-generated
  Test = 32,                // Occurrence is in test code
  ForwardDefinition = 64,   // Declared before defined
}
```

These are bit flags. A single occurrence can have multiple roles.

For example, a parameter in a destructuring assignment:

```typescript
function process({ name, value }: Config) {
  console.log(name, value);
}
```

The `name` parameter occurrence has:
- `Definition` (the parameter is created here)
- `Import` (it is destructured from the argument)

Both bits are set.

Use case: finding all places where a variable is modified:

```typescript
function findWriteOccurrences(
  index: scip.Index,
  symbolName: string
): Occurrence[] {
  const writes: Occurrence[] = [];

  for (const doc of index.documents) {
    for (const occ of doc.occurrences) {
      if (occ.symbol !== symbolName) continue;

      // Check for WriteAccess role
      if (occ.symbolRoles & scip.SymbolRole.WriteAccess) {
        writes.push({
          symbol: occ.symbol,
          filePath: doc.relativePath,
          range: occ.range,
          role: 'write',
        });
      }
    }
  }

  return writes;
}
```

Now you can answer: "Where is this variable mutated?" Without parsing. Without walking ASTs. Pure lookup.

---

## Building a Reference Graph

Individual lookups are powerful. But the real leverage comes from building graphs.

A reference graph shows relationships between all symbols:

```typescript
interface ReferenceGraph {
  nodes: Map<string, SymbolNode>;
  edges: ReferenceEdge[];
}

interface SymbolNode {
  symbol: string;
  name: string;
  file: string;
  line: number;
  kind: 'function' | 'class' | 'variable' | 'type' | 'import';
}

interface ReferenceEdge {
  from: string;    // Symbol being referenced
  to: string;      // Symbol doing the referencing
  file: string;
  line: number;
  edgeType: 'call' | 'import' | 'type' | 'extend';
}

function buildReferenceGraph(index: scip.Index): ReferenceGraph {
  const nodes = new Map<string, SymbolNode>();
  const edges: ReferenceEdge[] = [];

  // First pass: collect all definitions
  for (const doc of index.documents) {
    for (const occ of doc.occurrences) {
      if (!(occ.symbolRoles & scip.SymbolRole.Definition)) continue;

      nodes.set(occ.symbol, {
        symbol: occ.symbol,
        name: extractName(occ.symbol),
        file: doc.relativePath,
        line: occ.range[0],
        kind: inferKind(occ.symbol),
      });
    }
  }

  // Second pass: collect all references as edges
  for (const doc of index.documents) {
    // Find which symbol is "active" at each position
    // (which function/class contains this reference)
    const containingSymbol = findContainingDefinition(doc);

    for (const occ of doc.occurrences) {
      if (occ.symbolRoles & scip.SymbolRole.Definition) continue;

      const referencedSymbol = occ.symbol;
      const referencingSymbol = containingSymbol(occ.range[0]);

      if (referencingSymbol && nodes.has(referencedSymbol)) {
        edges.push({
          from: referencedSymbol,
          to: referencingSymbol,
          file: doc.relativePath,
          line: occ.range[0],
          edgeType: inferEdgeType(occ),
        });
      }
    }
  }

  return { nodes, edges };
}
```

With this graph, you can answer complex questions:

**"What calls this function?"**
```typescript
function findCallers(graph: ReferenceGraph, symbol: string): SymbolNode[] {
  const callerSymbols = graph.edges
    .filter(e => e.from === symbol && e.edgeType === 'call')
    .map(e => e.to);

  return callerSymbols.map(s => graph.nodes.get(s)).filter(Boolean);
}
```

**"What does this function depend on?"**
```typescript
function findDependencies(graph: ReferenceGraph, symbol: string): SymbolNode[] {
  const depSymbols = graph.edges
    .filter(e => e.to === symbol)
    .map(e => e.from);

  return depSymbols.map(s => graph.nodes.get(s)).filter(Boolean);
}
```

**"Which symbols are never referenced?"**
```typescript
function findDeadCode(graph: ReferenceGraph): SymbolNode[] {
  const referenced = new Set(graph.edges.map(e => e.from));

  return Array.from(graph.nodes.values()).filter(
    node => !referenced.has(node.symbol) && node.kind === 'function'
  );
}
```

---

## Import/Export Chains

Following import chains correctly is tricky.

Consider this structure:

```typescript
// lib/core/validation.ts
export function validate() { ... }

// lib/core/index.ts
export { validate } from './validation';
export { format } from './formatting';

// lib/index.ts
export * from './core';

// app/form.ts
import { validate } from 'lib';
```

The symbol `validate` is re-exported twice through barrel files.

SCIP tracks each step:

```
1. Definition in lib/core/validation.ts
   symbol: "npm lib 1.0.0 lib/core/validation.ts validate()."
   role: DEFINITION | EXPORT

2. Re-export in lib/core/index.ts
   symbol: "npm lib 1.0.0 lib/core/validation.ts validate()."
   role: REFERENCE | EXPORT

3. Re-export in lib/index.ts
   symbol: "npm lib 1.0.0 lib/core/validation.ts validate()."
   role: REFERENCE | EXPORT

4. Import in app/form.ts
   symbol: "npm lib 1.0.0 lib/core/validation.ts validate()."
   role: REFERENCE | IMPORT
```

The symbol string never changes. That is the key. No matter how many re-exports, the identity is preserved.

To trace the chain programmatically:

```typescript
function traceImportChain(
  index: scip.Index,
  symbolName: string
): string[] {
  const chain: string[] = [];

  // Find definition
  const definition = findDefinition(index, symbolName);
  if (definition) {
    chain.push(`${definition.file}:${definition.line} (definition)`);
  }

  // Find all occurrences, ordered by file path depth
  const occurrences = findAllOccurrences(index, symbolName);

  const reexports = occurrences
    .filter(o =>
      (o.roles & scip.SymbolRole.Export) &&
      !(o.roles & scip.SymbolRole.Definition)
    )
    .sort((a, b) => a.file.split('/').length - b.file.split('/').length);

  for (const reexport of reexports) {
    chain.push(`${reexport.file}:${reexport.line} (re-export)`);
  }

  return chain;
}
```

---

## Watch Out For

Symbol reference analysis has edge cases.

**Dynamic imports break static analysis.**

```typescript
const module = await import(`./plugins/${pluginName}`);
module.doSomething();
```

SCIP cannot know what `pluginName` will be at runtime. The symbol `doSomething` might come from any file in the `plugins` directory.

Dynamic imports create holes in the reference graph. Be aware that some edges are invisible.

**Type-only imports are marked differently.**

```typescript
import type { Contact } from './types';
import { validateContact } from './validation';
```

The first import is type-only. It disappears at runtime. The second is a value import. It affects bundling and code execution.

SCIP marks these differently. Type-only references have no `ReadAccess` or `WriteAccess` roles. They are pure type system constructs.

If you are analyzing runtime dependencies, filter for value imports:

```typescript
function isValueReference(occurrence: scip.Occurrence): boolean {
  const roles = occurrence.symbolRoles;
  return (
    (roles & scip.SymbolRole.ReadAccess) !== 0 ||
    (roles & scip.SymbolRole.WriteAccess) !== 0
  );
}
```

**Namespace re-exports aggregate symbols.**

```typescript
export * from './utils';
```

This re-exports every symbol from `utils`. SCIP does not expand this into individual symbol occurrences at the re-export site. It records the namespace re-export as a special occurrence.

To fully resolve what symbols are exported through `*`, you need to follow the reference to the source file and collect its exports.

**Generic instantiation creates new "virtual" symbols.**

```typescript
type StringResult = Result<string>;
type NumberResult = Result<number>;
```

Are `Result<string>` and `Result<number>` the same symbol? In SCIP, they reference the same base symbol (`Result`) with different type arguments.

The symbol string does not encode the type arguments. Both references point to `Result#`. The specialization is metadata, not part of the identity.

This matters when analyzing generic usage patterns. You might want to know "all instantiations of Result," which requires examining the type arguments separately from the symbol lookup.

**External symbols lack definition data.**

```typescript
import { useState } from 'react';
```

`useState` is defined in `react`, not your codebase. SCIP records the reference to an external symbol:

```
symbol: "npm react 18.2.0 index.d.ts useState()."
```

But the index does not contain React's source code. You cannot "Go to Definition" into `node_modules` unless you indexed that too.

For practical purposes, external symbols are leaves in your reference graph. You know they are used, but not how they work internally.

---

## Practical Query: Impact Analysis

Here is a real-world use case: you want to change a function. What might break?

```typescript
function analyzeImpact(
  index: scip.Index,
  symbolName: string
): ImpactReport {
  // Direct references
  const directRefs = getReferences(index, symbolName);

  // Find symbols that contain those references
  const affectedSymbols = new Set<string>();
  for (const ref of directRefs) {
    const containing = findContainingSymbol(index, ref.file, ref.line);
    if (containing) {
      affectedSymbols.add(containing);
    }
  }

  // Transitively expand: who references the affected symbols?
  const transitive = new Set<string>();
  for (const affected of affectedSymbols) {
    const refs = getReferences(index, affected);
    for (const ref of refs) {
      const containing = findContainingSymbol(index, ref.file, ref.line);
      if (containing && !affectedSymbols.has(containing)) {
        transitive.add(containing);
      }
    }
  }

  return {
    directlyAffected: Array.from(affectedSymbols),
    transitivelyAffected: Array.from(transitive),
    totalReferences: directRefs.length,
    fileCount: new Set(directRefs.map(r => r.file)).size,
  };
}
```

Before changing `validateContact`, you know:
- 47 direct references across 12 files
- 23 functions directly depend on it
- 156 functions transitively depend on it

Change with eyes open.

---

## What is Next

We have covered how SCIP stores symbols and references, enabling instant navigation and graph-based analysis.

But structural queries only get us so far. "Find all references to validateContact" works when you know the exact name. It fails when you want something fuzzier.

"Find code that handles form validation" is a semantic query. You want conceptually related code, not just exact matches.

The next article introduces vector embeddings: turning code into coordinates in a meaning space. Similar concepts cluster together. Semantic search becomes possible.

From exact matches to fuzzy matches. From symbols to meaning.

---

## Quick Reference

**Finding a definition:**
```typescript
const definition = index.documents
  .flatMap(doc => doc.occurrences
    .filter(o => o.symbol === symbolName)
    .filter(o => o.symbolRoles & SymbolRole.Definition)
    .map(o => ({ file: doc.relativePath, ...o }))
  )[0];
```

**Finding all references:**
```typescript
const references = index.documents
  .flatMap(doc => doc.occurrences
    .filter(o => o.symbol === symbolName)
    .filter(o => !(o.symbolRoles & SymbolRole.Definition))
    .map(o => ({ file: doc.relativePath, ...o }))
  );
```

**Symbol role flags:**
```typescript
Definition     = 1    // Created here
Import         = 2    // Brought into scope
WriteAccess    = 4    // Modified
ReadAccess     = 8    // Read
Export         = ??   // Visible outside module
```

**Symbol identity rule:**
> Re-exports do not create new symbols. The symbol string is identical at every occurrence, from original definition through any number of re-exports to final usage.

---

*This is part 6 of a 12-part series on building local code intelligence.*
