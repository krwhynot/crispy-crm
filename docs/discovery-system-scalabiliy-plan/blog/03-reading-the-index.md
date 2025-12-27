# Reading the Index: From Binary Blob to Useful Data

You generated an index. Congratulations.

Now open it in your text editor.

See that wall of gibberish? That compressed binary data that makes your editor lag?

That's the problem we're solving today.

---

## The Problem

SCIP indexes are powerful. They contain symbol definitions, references, documentation, and cross-file relationships.

But they're stored in Protocol Buffers format.

That means they're optimized for machines, not humans.

You can't grep them. You can't eyeball them for debugging. You can't paste a snippet into a GitHub issue.

When something goes wrong with your semantic analysis, you're flying blind.

Try it yourself. Run `cat index.scip` and watch your terminal explode with binary noise.

This is by design. Protobuf prioritizes compact storage and fast parsing over human readability. For production systems processing millions of symbols, that tradeoff makes sense.

But for development? For debugging why your hook wasn't indexed? For verifying your configuration works?

You need a way in.

---

## The Filing Cabinet Analogy

Think of a SCIP index like a filing cabinet with a very particular lock.

The cabinet contains everything: every function definition, every import statement, every symbol reference across your entire codebase.

But you can't just open the drawers.

You need a special key that understands the encoding. And even then, you get raw data structures instead of readable documents.

**Snapshots are like printed reports from that cabinet.**

Instead of wrestling with the lock every time, you extract what you need into plain text. Now you can search with grep. Diff between runs. Share with colleagues.

The filing cabinet stays locked for efficiency. But your daily work happens with the printed reports.

There's another benefit to this mental model.

Printed reports can be archived, compared, and annotated. If someone asks "what changed between Monday and Tuesday?" you pull out both reports and diff them.

Same with snapshots. They're version control friendly. They're diff friendly. They let you see exactly what your indexer captured, and what it missed.

---

## Generating Human-Readable Snapshots

The SCIP CLI has a built-in command for this exact problem.

```bash
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

This reads your binary index and writes one text file per source file.

Let's try it:

```bash
# First, make sure you have an index
scip-typescript index --project tsconfig.json --output .claude/state/index.scip

# Now generate snapshots
mkdir -p .claude/state/scip-snapshot
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

What comes out the other side?

For a TypeScript file like `src/utils/formatters.ts`, you'll get a corresponding snapshot at `.claude/state/scip-snapshot/src/utils/formatters.ts`.

Open it. Here's what you'll see:

```
  export function formatCurrency(value: number): string {
//       ^^^^^^^^ definition npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().
//                          ^^^^^ reference typescript 5.3.0 lib/lib.es5.d.ts number#
//                                            ^^^^^^ reference typescript 5.3.0 lib/lib.es5.d.ts string#
    return new Intl.NumberFormat('en-US', {
//             ^^^^ reference typescript 5.3.0 lib/lib.es2020.intl.d.ts Intl.
//                  ^^^^^^^^^^^^ reference typescript 5.3.0 lib/lib.es2020.intl.d.ts Intl/NumberFormat#
      style: 'currency',
//    ^^^^^ reference typescript 5.3.0 lib/lib.es2020.intl.d.ts NumberFormatOptions#style.
      currency: 'USD',
    }).format(value);
//     ^^^^^^ reference typescript 5.3.0 lib/lib.es2020.intl.d.ts NumberFormat#format().
//            ^^^^^ reference npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().(value)
  }
```

Every symbol is annotated. Every reference points to its definition.

This is what semantic analysis actually captured.

---

## Understanding Snapshot Annotations

The format takes a minute to internalize.

Each annotation appears on comment lines (`//`) directly beneath the code it describes.

The `^^^^^^^^` carets point to the exact characters being annotated. Count them. They match the length of the symbol.

Then comes the relationship type:
- `definition` means this is where the symbol is declared
- `reference` means this is a usage of something defined elsewhere

Finally, the full symbol name tells you exactly where to find the original:
- `npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency()` is your local function
- `typescript 5.3.0 lib/lib.es5.d.ts string#` is the built-in string type

Let's decode a real example:

```
//       ^^^^^^^^ definition npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().
```

Reading left to right:
1. `^^^^^^^^` - the symbol is 8 characters wide ("formatCurrency" is actually 14, so this would be 14 carets)
2. `definition` - this line declares the symbol
3. `npm @crispy-crm 1.0.0` - package manager, package name, version
4. `src/utils/formatters.ts` - file path within the package
5. `formatCurrency().` - the symbol descriptor (function, hence the parentheses)

---

## Hands-On: Exploring Your Snapshots

Time to get your hands dirty.

Generate snapshots for your project:

```bash
# From your project root
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

Now explore what you've got:

```bash
# Count how many files were snapshotted
find .claude/state/scip-snapshot -name "*.ts" -o -name "*.tsx" | wc -l

# Find all definitions (new symbols introduced)
grep -r "definition" .claude/state/scip-snapshot | head -20

# Find all external references (to node_modules, stdlib)
grep -r "reference typescript" .claude/state/scip-snapshot | head -10

# Find references to a specific function
grep -r "formatCurrency" .claude/state/scip-snapshot
```

The grep output shows you exactly where each symbol is used.

No more manually searching. No more hoping your editor's "Find All References" works.

Here's a real debugging scenario.

You added a new custom hook called `useContactSearch`. You expect it to show up in your discovery output. But it's missing.

With snapshots, you can verify in seconds:

```bash
# Did the indexer see the hook at all?
grep -r "useContactSearch" .claude/state/scip-snapshot/

# If nothing comes back, the file wasn't indexed
# Check if the source file has a snapshot
ls .claude/state/scip-snapshot/src/hooks/

# If the snapshot exists but the hook doesn't appear,
# check for syntax errors that prevented parsing
```

This beats staring at binary data hoping for insight.

---

## Let's Build Query Utilities

Snapshots are great for humans. But we need programmatic access for tooling.

Let's build a query layer that reads the index directly.

First, we need to understand what we're working with:

```typescript
// scripts/discover/scip/types.ts

// A Symbol in SCIP is a string with a specific format
// Example: "npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency()."
type SymbolName = string;

// An Occurrence is a symbol appearance at a specific location
interface Occurrence {
  symbol: SymbolName;
  range: [startLine: number, startChar: number, endLine: number, endChar: number];
  isDefinition: boolean;
  filePath: string;
}

// The Index contains all symbols and their occurrences
interface Index {
  documents: Document[];
  externalSymbols: ExternalSymbol[];
}

interface Document {
  relativePath: string;
  occurrences: Occurrence[];
  symbols: SymbolInfo[];
}
```

Now let's implement the query functions:

```typescript
// scripts/discover/scip/query.ts
import * as scip from '@anthropic/scip-sdk';
import * as fs from 'fs';

/**
 * Find symbols matching a pattern.
 * Useful for "find all React hooks" or "find all validation schemas"
 */
export function findSymbolsByPattern(index: scip.Index, pattern: RegExp): string[] {
  const matches = new Set<string>();

  for (const doc of index.documents) {
    for (const occurrence of doc.occurrences) {
      if (pattern.test(occurrence.symbol)) {
        matches.add(occurrence.symbol);
      }
    }
  }

  // Also check external symbols (from dependencies)
  for (const ext of index.externalSymbols) {
    if (pattern.test(ext.symbol)) {
      matches.add(ext.symbol);
    }
  }

  return Array.from(matches);
}

/**
 * Get all places where a symbol is used (not defined).
 * The workhorse of "Find All References" functionality.
 */
export function getReferences(index: scip.Index, symbolName: string): Occurrence[] {
  const references: Occurrence[] = [];

  for (const doc of index.documents) {
    for (const occ of doc.occurrences) {
      // Skip definitions, we only want usages
      if (occ.symbolRoles & scip.SymbolRole.Definition) {
        continue;
      }

      if (occ.symbol === symbolName) {
        references.push({
          symbol: occ.symbol,
          range: occ.range,
          isDefinition: false,
          filePath: doc.relativePath,
        });
      }
    }
  }

  return references;
}

/**
 * Find where a symbol is defined.
 * Returns null if the symbol is external (defined in node_modules).
 */
export function getDefinition(index: scip.Index, symbolName: string): Occurrence | null {
  for (const doc of index.documents) {
    for (const occ of doc.occurrences) {
      // Check if this occurrence is a definition
      if (!(occ.symbolRoles & scip.SymbolRole.Definition)) {
        continue;
      }

      if (occ.symbol === symbolName) {
        return {
          symbol: occ.symbol,
          range: occ.range,
          isDefinition: true,
          filePath: doc.relativePath,
        };
      }
    }
  }

  return null; // Symbol defined externally
}
```

Using these utilities:

```typescript
// Example: Find all custom hooks and their usages
import { findSymbolsByPattern, getReferences, getDefinition } from './query';
import { loadIndex } from './loader';

async function analyzeHooks() {
  const index = await loadIndex('.claude/state/index.scip');

  // Find all symbols that look like React hooks
  const hookPattern = /use[A-Z][a-zA-Z]+\(\)/;
  const hooks = findSymbolsByPattern(index, hookPattern);

  console.log(`Found ${hooks.length} hooks`);

  for (const hook of hooks) {
    const definition = getDefinition(index, hook);
    const references = getReferences(index, hook);

    if (definition) {
      console.log(`${hook}:`);
      console.log(`  Defined in: ${definition.filePath}:${definition.range[0]}`);
      console.log(`  Used ${references.length} times`);
    }
  }
}
```

---

## Deep Dive: SCIP Symbol Names

Understanding symbol naming is crucial. Get this wrong and your queries return nothing.

SCIP uses a structured format for symbol names. Here's the anatomy:

```
npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().
|   |           |     |                       |               |
|   |           |     |                       |               +-- suffix (describes kind)
|   |           |     |                       +-- descriptor (symbol path)
|   |           |     +-- path within package
|   |           +-- version
|   +-- package name
+-- scheme (npm, typescript, local, etc.)
```

The **scheme** tells you where the symbol comes from:
- `npm` - Published package
- `typescript` - TypeScript standard library
- `local` - Not published, internal to project
- `scip-java`, `scip-python` - Language-specific schemes

The **suffix** tells you what kind of symbol it is:
- `.` (dot) - Term (function, variable, parameter)
- `#` (hash) - Type (class, interface, type alias)
- `/` (slash) - Package or namespace
- `()` - Method or function (appears before the final dot)

Real examples from a typical codebase:

```
# A function
npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().

# A type/interface
npm @crispy-crm 1.0.0 src/types/Contact.ts Contact#

# A method on a class
npm @crispy-crm 1.0.0 src/services/API.ts API#fetchData().

# A parameter
npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().(value)

# A type parameter (generic)
npm @crispy-crm 1.0.0 src/utils/Result.ts Result#[T]

# An exported constant
npm @crispy-crm 1.0.0 src/config/constants.ts DEFAULT_TIMEOUT.
```

Nested symbols chain their descriptors:

```
# A method inside a class inside a namespace
npm @crispy-crm 1.0.0 src/lib/services.ts Services/UserService#getById().
```

Here's how to parse a symbol name:

```typescript
// scripts/discover/scip/parser.ts

interface ParsedSymbol {
  scheme: string;
  package: string;
  version: string;
  path: string;
  descriptors: string[];
}

export function parseSymbolName(symbol: string): ParsedSymbol {
  // Symbol format: "scheme package version path descriptor..."
  const parts = symbol.split(' ');

  if (parts.length < 4) {
    throw new Error(`Invalid symbol format: ${symbol}`);
  }

  const [scheme, pkg, version, ...rest] = parts;

  // Everything after version is path + descriptors
  // Path ends at the first part that contains symbol characters (.#/)
  let pathEnd = 0;
  for (let i = 0; i < rest.length; i++) {
    if (/[.#\/\(\)\[\]]/.test(rest[i])) {
      break;
    }
    pathEnd = i + 1;
  }

  return {
    scheme,
    package: pkg,
    version,
    path: rest.slice(0, pathEnd).join('/'),
    descriptors: rest.slice(pathEnd),
  };
}

// Usage
const parsed = parseSymbolName(
  'npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().'
);
// { scheme: 'npm', package: '@crispy-crm', version: '1.0.0',
//   path: 'src/utils/formatters.ts', descriptors: ['formatCurrency().'] }
```

---

## Building a Symbol Index

For fast lookups, we need to index the symbols ourselves:

```typescript
// scripts/discover/scip/symbol-index.ts

interface SymbolIndex {
  byName: Map<string, SymbolEntry>;
  byFile: Map<string, SymbolEntry[]>;
  byKind: Map<SymbolKind, SymbolEntry[]>;
}

type SymbolKind = 'function' | 'type' | 'variable' | 'class' | 'method' | 'parameter';

interface SymbolEntry {
  symbol: string;
  kind: SymbolKind;
  filePath: string;
  line: number;
  column: number;
  documentation?: string;
}

function inferKind(symbol: string): SymbolKind {
  if (symbol.endsWith('#')) return 'type';
  if (symbol.includes('().')) return 'function';
  if (symbol.includes('#') && symbol.includes('().')) return 'method';
  if (symbol.includes('.(')) return 'parameter';
  return 'variable';
}

export function buildSymbolIndex(index: scip.Index): SymbolIndex {
  const byName = new Map<string, SymbolEntry>();
  const byFile = new Map<string, SymbolEntry[]>();
  const byKind = new Map<SymbolKind, SymbolEntry[]>();

  for (const doc of index.documents) {
    const fileEntries: SymbolEntry[] = [];

    for (const occ of doc.occurrences) {
      // Only index definitions
      if (!(occ.symbolRoles & scip.SymbolRole.Definition)) {
        continue;
      }

      const kind = inferKind(occ.symbol);
      const entry: SymbolEntry = {
        symbol: occ.symbol,
        kind,
        filePath: doc.relativePath,
        line: occ.range[0],
        column: occ.range[1],
      };

      byName.set(occ.symbol, entry);
      fileEntries.push(entry);

      if (!byKind.has(kind)) {
        byKind.set(kind, []);
      }
      byKind.get(kind)!.push(entry);
    }

    byFile.set(doc.relativePath, fileEntries);
  }

  return { byName, byFile, byKind };
}
```

Now queries are instant:

```typescript
// Find all functions
const functions = symbolIndex.byKind.get('function') ?? [];
console.log(`Found ${functions.length} functions`);

// Find symbols in a specific file
const fileSymbols = symbolIndex.byFile.get('src/utils/formatters.ts') ?? [];
console.log(`Formatters defines ${fileSymbols.length} symbols`);

// Look up a specific symbol
const formatCurrency = symbolIndex.byName.get(
  'npm @crispy-crm 1.0.0 src/utils/formatters.ts formatCurrency().'
);
```

The performance difference is dramatic.

Without the index: O(n) scan through all documents for every query.

With the index: O(1) map lookup.

On a 500-file codebase, that's the difference between 500 iterations and 1. On a 5000-file codebase, it's even more pronounced.

Build the index once. Query it forever.

---

## Practical Queries for Discovery

Let's build some queries that actually solve real problems:

```typescript
// scripts/discover/scip/practical-queries.ts

/**
 * Find all components that use a specific hook
 */
export function findComponentsUsingHook(
  index: scip.Index,
  hookName: string
): string[] {
  const hookSymbol = findSymbolsByPattern(index, new RegExp(`${hookName}\\(\\)\\.?$`))[0];

  if (!hookSymbol) {
    return [];
  }

  const refs = getReferences(index, hookSymbol);

  // Get unique files, filter to .tsx components
  const files = new Set(
    refs
      .map(r => r.filePath)
      .filter(f => f.endsWith('.tsx'))
  );

  return Array.from(files);
}

/**
 * Find circular dependencies between files
 */
export function findCircularDependencies(index: scip.Index): string[][] {
  // Build import graph
  const imports = new Map<string, Set<string>>();

  for (const doc of index.documents) {
    const thisFile = doc.relativePath;
    imports.set(thisFile, new Set());

    for (const occ of doc.occurrences) {
      // Skip definitions and local symbols
      if (occ.symbolRoles & scip.SymbolRole.Definition) continue;
      if (occ.symbol.startsWith('local ')) continue;

      // Parse symbol to get source file
      const parsed = parseSymbolName(occ.symbol);
      if (parsed.path && parsed.path !== thisFile) {
        imports.get(thisFile)!.add(parsed.path);
      }
    }
  }

  // Detect cycles using DFS
  return findCycles(imports);
}

/**
 * Find dead code (exported but never imported)
 */
export function findUnusedExports(index: scip.Index): SymbolEntry[] {
  const symbolIndex = buildSymbolIndex(index);
  const unused: SymbolEntry[] = [];

  for (const [symbol, entry] of symbolIndex.byName) {
    // Skip non-exported symbols
    if (symbol.startsWith('local ')) continue;

    // Skip React components (might be used via lazy loading)
    if (entry.kind === 'function' && entry.filePath.endsWith('.tsx')) continue;

    const refs = getReferences(index, symbol);

    // Filter out self-references
    const externalRefs = refs.filter(r => r.filePath !== entry.filePath);

    if (externalRefs.length === 0) {
      unused.push(entry);
    }
  }

  return unused;
}
```

---

## Watch Out For

**The snapshot directory can get huge.**

Every source file becomes a snapshot file. On a 2000-file codebase, that's 2000 snapshot files.

Don't commit them. Add to `.gitignore`:

```
.claude/state/scip-snapshot/
```

**Symbol resolution fails silently for external packages.**

If you query for a symbol from `lodash` or `react`, you might get partial results. The index only contains references to external symbols, not their definitions.

Check if a symbol is external before assuming the definition is missing:

```typescript
function isExternalSymbol(symbol: string): boolean {
  // External symbols won't have your package name
  return !symbol.includes('your-package-name');
}
```

**Range arrays use different formats.**

SCIP ranges can be 3 or 4 elements:
- 3 elements: `[line, startChar, endChar]` (single line)
- 4 elements: `[startLine, startChar, endLine, endChar]` (multi-line)

Handle both:

```typescript
function getRangeEnd(range: number[]): { line: number; char: number } {
  if (range.length === 3) {
    return { line: range[0], char: range[2] };
  }
  return { line: range[2], char: range[3] };
}
```

**Incremental indexing requires cache invalidation.**

If you regenerate the index but keep old snapshots, they'll be stale. Delete snapshots when regenerating:

```bash
rm -rf .claude/state/scip-snapshot/
scip-typescript index --project tsconfig.json --output .claude/state/index.scip
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

**Local symbols have their own scheme.**

Symbols that aren't exported use the `local` scheme:

```
local 0 src/components/Button.tsx internalHelper().
```

The `0` after `local` is a counter, not a version. It increments for each local symbol in the file.

This matters when querying. If you're looking for "all functions," remember that local functions won't match your package-name pattern.

**Empty indexes are silent failures.**

If your index is suspiciously small, check your configuration.

Common causes:
- Wrong `tsconfig.json` path
- Exclude patterns hiding your source files
- Running from the wrong directory

The indexer doesn't warn you when it indexes zero files. It just produces an empty (but valid) index.

---

## What's Next

You can read your index. You can query it programmatically. You can generate snapshots for debugging.

But this is still reactive. You're responding to indexes that already exist.

The real power comes when you integrate this into your development workflow.

Think about what we've built:
- **Snapshots** for human debugging and verification
- **Query utilities** for programmatic access
- **Symbol indexes** for instant lookups
- **Practical queries** that answer real architecture questions

Each piece serves a purpose. Together, they transform an opaque binary blob into actionable intelligence.

In the next article, we'll flip the script. Instead of querying an index, we'll use the index to power real-time discovery. Components, hooks, schemas - all extracted and chunked for AI consumption.

The index becomes the foundation. The discovery system becomes the interface.

Time to build the bridge.
