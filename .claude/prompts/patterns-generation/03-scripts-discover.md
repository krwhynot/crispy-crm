---
name: generate-patterns-scripts-discover
directory: scripts/discover/
complexity: HIGH
output: scripts/discover/PATTERNS.md
---

# Generate PATTERNS.md for Code Discovery System

## Context

The `scripts/discover/` directory contains the code intelligence pipeline that powers Claude's codebase understanding. It extracts metadata from source files using AST analysis (ts-morph), generates embeddings for semantic search (Ollama + LanceDB), and indexes symbol references (SCIP). This system produces the `.claude/state/` output files that enable fast, token-efficient codebase queries.

**Key subsystems:**
- **Extractors** - AST-based metadata extraction (components, hooks, schemas, types, forms, call-graph)
- **Embeddings** - Vector embeddings via Ollama, stored in LanceDB for similarity search
- **SCIP** - Source Code Intelligence Protocol integration for go-to-definition and find-references
- **Orchestrator** - Main entry point with incremental update support
- **Watch Mode** - File watcher for automatic re-indexing during development

## Phase 1: Exploration

Read these files in order to understand the discovery system:

1. `/home/krwhynot/projects/crispy-crm/scripts/discover/index.ts`
   - Purpose: Main orchestrator that coordinates all extractors, handles CLI args, and manages incremental updates

2. `/home/krwhynot/projects/crispy-crm/scripts/discover/watch.ts`
   - Purpose: Chokidar-based file watcher that triggers incremental discovery on source changes

3. `/home/krwhynot/projects/crispy-crm/scripts/discover/extractors/components.ts`
   - Purpose: Example extractor showing the standard pattern - AST traversal, metadata extraction, chunked output

4. `/home/krwhynot/projects/crispy-crm/scripts/discover/utils/output.ts`
   - Purpose: Output utilities including envelope format, atomic writes, staleness detection, and incremental chunk updates

5. `/home/krwhynot/projects/crispy-crm/scripts/discover/utils/project.ts`
   - Purpose: Singleton ts-morph Project for efficient AST analysis across extractors

6. `/home/krwhynot/projects/crispy-crm/scripts/discover/embeddings/ollama.ts`
   - Purpose: Ollama client for generating 768-dimensional nomic-embed-text embeddings

7. `/home/krwhynot/projects/crispy-crm/scripts/discover/embeddings/lancedb.ts`
   - Purpose: LanceDB vector store - upsert, search, searchByType operations

8. `/home/krwhynot/projects/crispy-crm/scripts/discover/scip/query.ts`
   - Purpose: SCIP index queries - loadIndex, findSymbolsByPattern, getReferences, getDefinition

9. `/home/krwhynot/projects/crispy-crm/scripts/discover/scip/index.ts`
   - Purpose: Re-exports for SCIP module public API

## Phase 2: Pattern Identification

Identify and document these patterns from the code:

### Pattern A: Extractor Interface Pattern
- `ExtractorConfig` interface in index.ts
- Standard extractor function signature: `(onlyChunks?: Set<string>) => Promise<void>`
- Registration in `EXTRACTORS` object
- Source file glob patterns

### Pattern B: Chunked Output Pattern
- `writeChunkedDiscovery` and `writeIncrementalChunkedDiscovery` in output.ts
- Manifest + chunk files structure (manifest.json + {feature}.json)
- `file_to_chunks` mapping for incremental updates
- Atomic writes with temp file + rename

### Pattern C: Staleness Detection Pattern
- `buildSourceHashes` - SHA-256 hash of source files
- `isChunkedDiscoveryStale` - compare current hashes to manifest
- `getStaleChunks` - chunk-level granularity for incremental updates
- Changed file detection (new, modified, deleted)

### Pattern D: AST Extraction Pattern
- ts-morph Project singleton in utils/project.ts
- `project.addSourceFilesAtPaths()` for glob-based file loading
- `sourceFile.getExportedDeclarations()` for symbol extraction
- `getDescendantsOfKind(SyntaxKind.X)` for AST traversal

### Pattern E: Embedding Pipeline Pattern
- Ollama client with model fallback (nomic-embed-8k -> nomic-embed-text)
- LanceDB lazy connection pattern
- `upsertPoints` with mergeInsert for idempotent updates
- Distance-to-score conversion for cosine similarity

### Pattern F: SCIP Integration Pattern
- Binary protobuf index loading with `Index.deserializeBinary()`
- Symbol naming convention: `scip-typescript npm <package> <version> <path>/SymbolName`
- `symbol_roles` bitmask for definition vs reference detection
- Range format: `[startLine, startCol, endCol]` or `[startLine, startCol, endLine, endCol]`

## Phase 3: Generate PATTERNS.md

Create a PATTERNS.md file following this structure:

```markdown
# Code Discovery System Patterns

The discovery system generates codebase intelligence for Claude Code. It extracts metadata via AST analysis, creates embeddings for semantic search, and indexes symbols for precise navigation.

## Architecture Overview

```
scripts/discover/
├── index.ts ─────────────── Main orchestrator (CLI, incremental, full modes)
├── watch.ts ─────────────── File watcher → triggers incremental updates
│
├── extractors/ ───────────── AST-based metadata extraction
│   ├── components.ts         React components (hooks, imports, roles)
│   ├── hooks.ts              Custom hooks (parameters, return types)
│   ├── schemas.ts            Zod schemas (fields, validation rules)
│   ├── types.ts              TypeScript types/interfaces
│   ├── forms.ts              Form definitions (inputs, validation)
│   ├── call-graph.ts         Function call relationships
│   └── validation-services.ts Validation service functions
│
├── embeddings/ ───────────── Semantic search infrastructure
│   ├── ollama.ts             Embedding generation (768-dim vectors)
│   ├── lancedb.ts            Vector storage and similarity search
│   ├── indexer.ts            Full re-index pipeline
│   └── chunk.ts              Code chunking strategy
│
├── scip/ ─────────────────── Symbol intelligence (go-to-def, find-refs)
│   ├── generate.ts           Run scip-typescript indexer
│   ├── parser.ts             Parse SCIP protobuf format
│   ├── query.ts              Query symbols and references
│   └── populate.ts           Populate SQLite FTS index
│
└── utils/ ────────────────── Shared infrastructure
    ├── output.ts             Envelope format, atomic writes, staleness
    ├── project.ts            Singleton ts-morph Project
    └── visualization.ts      Mermaid diagram generation

                    Data Flow
┌──────────┐    ┌──────────────┐    ┌─────────────────┐
│ Source   │───>│  Extractors  │───>│ .claude/state/  │
│  Files   │    │  (ts-morph)  │    │  *.json chunks  │
└──────────┘    └──────────────┘    └─────────────────┘
      │
      ├───────────────────────────────>┌─────────────────┐
      │         SCIP Indexer           │ search.db       │
      │                                │ (SQLite FTS5)   │
      └───────────────────────────────>└─────────────────┘
      │
      ├───────────────────────────────>┌─────────────────┐
      │    Ollama → LanceDB            │ vectors.lance/  │
      │                                │ (semantic)      │
      └───────────────────────────────>└─────────────────┘
```

---

## Pattern A: Extractor Interface Pattern

All extractors follow a standard interface for consistent registration and incremental updates.

**When to use**: Adding a new type of code element to extract (e.g., test files, API routes).

### Extractor Configuration

```typescript
// scripts/discover/index.ts
interface ExtractorConfig {
  name: string;
  label: string;
  outputPath: string;        // Directory name for chunked, filename for single
  isChunked: boolean;        // Chunked = manifest + feature files
  extractFn: (onlyChunks?: Set<string>) => Promise<void>;
  getSourceFiles: () => string[];
}

const EXTRACTORS: Record<string, ExtractorConfig> = {
  components: {
    name: "components",
    label: "Components",
    outputPath: "component-inventory",
    isChunked: true,
    extractFn: extractComponents,
    getSourceFiles: () => {
      const files = project.addSourceFilesAtPaths("src/atomic-crm/**/*.tsx");
      return files.map(f => f.getFilePath());
    },
  },
  // ... more extractors
};
```

**Key points:**
- `isChunked: true` enables incremental updates via `onlyChunks` parameter
- `getSourceFiles()` returns absolute paths for staleness detection
- `outputPath` is relative to `.claude/state/`
- Filter test files in `getSourceFiles()`, not in the extractor

**Example:** `scripts/discover/index.ts` lines 24-124

---

## Pattern B: Chunked Output Pattern

Chunked output reduces context usage by allowing Claude to load only needed feature chunks.

**When to use**: Any extractor with >50 items or feature-based grouping.

### Manifest + Chunks Structure

```
.claude/state/component-inventory/
├── manifest.json      # Index with checksums and file_to_chunks mapping
├── contacts.json      # Feature chunk
├── organizations.json # Feature chunk
├── opportunities.json # Feature chunk
└── _root.json         # Items in atomic-crm/ root
```

### Writing Chunked Output

```typescript
// scripts/discover/utils/output.ts
export function writeChunkedDiscovery<T>(
  dirName: string,
  generator: string,
  sourceGlobs: string[],
  sourceFiles: string[],
  summary: Record<string, number>,
  chunks: Map<string, T[]>,
  fileToChunkMapping?: Map<string, string>  // For incremental updates
): void {
  // 1. Build source hashes for staleness detection
  const sourceHashes = buildSourceHashes(sourceFiles);

  // 2. Write each chunk atomically (temp file + rename)
  for (const [chunkName, items] of chunks) {
    const chunkPath = path.join(outputDir, `${chunkName}.json`);
    const tempPath = `${chunkPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(chunkData, null, 2));
    fs.renameSync(tempPath, chunkPath);  // Atomic rename
  }

  // 3. Write manifest with file_to_chunks for incremental
  const manifest: ChunkedManifest = {
    status: "complete",
    generated_at: new Date().toISOString(),
    source_hashes: sourceHashes,
    chunks: chunkInfos,
    file_to_chunks: fileToChunks,  // Maps source file → chunk names
  };
}
```

**Key points:**
- Atomic writes prevent corrupted output on crash
- `file_to_chunks` enables O(1) lookup of which chunks need updating
- Chunk checksums allow verification without reading full content
- Manifest is written last to ensure chunks exist first

**Example:** `scripts/discover/utils/output.ts` lines 201-313

---

## Pattern C: Staleness Detection Pattern

Hash-based staleness detection enables fast incremental updates.

**When to use**: Before running extractors to skip unchanged chunks.

### Source Hash Comparison

```typescript
// scripts/discover/utils/output.ts
export function getStaleChunks(
  dirName: string,
  currentSourceFiles: string[],
  getChunkForFile: (filePath: string) => string
): StaleChunksResult {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const currentHashes = buildSourceHashes(currentSourceFiles);

  // Check for new, modified, or deleted files
  for (const [relativePath, currentHash] of Object.entries(currentHashes)) {
    const oldHash = manifest.source_hashes[relativePath];

    if (!oldHash) {
      // New file - find its chunk
      const chunkName = getChunkForFile(absolutePath);
      staleChunks.add(chunkName);
    } else if (oldHash !== currentHash) {
      // Modified file - mark its chunks stale
      const chunks = manifest.file_to_chunks[relativePath] || [];
      chunks.forEach(c => staleChunks.add(c));
    }
  }

  return { hasStaleChunks: staleChunks.size > 0, staleChunks, freshChunks };
}
```

**Key points:**
- SHA-256 hash truncated to 12 chars for space efficiency
- Three change types: new (`+`), modified (`~`), deleted (`-`)
- Returns `requiresFullRegen: true` if new chunks needed (manifest schema change)
- Incremental mode only processes stale chunks

**Example:** `scripts/discover/utils/output.ts` lines 399-524

---

## Pattern D: AST Extraction Pattern

ts-morph provides type-safe AST traversal for extracting code metadata.

**When to use**: Extracting structured data from TypeScript/TSX source files.

### Singleton Project

```typescript
// scripts/discover/utils/project.ts
class DiscoveryProject {
  private static instance: Project;

  public static getInstance(): Project {
    if (!DiscoveryProject.instance) {
      DiscoveryProject.instance = new Project({
        tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
        skipAddingFilesFromTsConfig: true,  // Memory optimization
      });
    }
    return DiscoveryProject.instance;
  }
}

export const project = DiscoveryProject.getInstance();
```

### Extractor Implementation

```typescript
// scripts/discover/extractors/components.ts
export async function extractComponents(onlyChunks?: Set<string>): Promise<void> {
  // 1. Get source files (cached by singleton)
  const sourceFiles = project.addSourceFilesAtPaths("src/atomic-crm/**/*.tsx");

  // 2. Filter for incremental mode
  let filesToProcess = sourceFiles;
  if (onlyChunks) {
    filesToProcess = sourceFiles.filter(sf => {
      const chunkName = extractFeatureName(sf.getFilePath());
      return onlyChunks.has(chunkName);
    });
  }

  // 3. Extract metadata from each file
  for (const sourceFile of filesToProcess) {
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [exportName, declarations] of exportedDeclarations) {
      // Use ts-morph's type-safe AST navigation
      if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
        const funcDecl = declaration.asKindOrThrow(SyntaxKind.FunctionDeclaration);
        const hooks = extractHooksFromNode(funcDecl);
        // ... build component info
      }
    }
  }

  // 4. Write output (chunked or incremental)
  if (onlyChunks) {
    writeIncrementalChunkedDiscovery(...);
  } else {
    writeChunkedDiscovery(...);
  }
}
```

**Key points:**
- `skipAddingFilesFromTsConfig: true` saves memory - add files explicitly
- `asKindOrThrow()` provides type-safe narrowing
- `getDescendantsOfKind()` for recursive AST traversal
- Filter test files at source, not after extraction

**Example:** `scripts/discover/extractors/components.ts` lines 117-260

---

## Pattern E: Embedding Pipeline Pattern

Ollama generates embeddings, LanceDB stores them for similarity search.

**When to use**: Enabling semantic code search ("find form validation" vs exact text match).

### Ollama Client

```typescript
// scripts/discover/embeddings/ollama.ts
const DEFAULT_MODEL = "nomic-embed-8k";    // 8192 context for larger chunks
const FALLBACK_MODEL = "nomic-embed-text"; // Standard 2048 context
const EXPECTED_DIMENSIONS = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    body: JSON.stringify({ model: DEFAULT_MODEL, prompt: text }),
  });

  const data = await response.json();
  if (data.embedding.length !== EXPECTED_DIMENSIONS) {
    throw new OllamaError(`Expected ${EXPECTED_DIMENSIONS} dimensions`);
  }
  return data.embedding;
}
```

### LanceDB Vector Store

```typescript
// scripts/discover/embeddings/lancedb.ts
export async function upsertPoints(points: UpsertPoint[]): Promise<void> {
  const conn = await getConnection();

  const records = points.map(p => ({
    id: p.id,
    filePath: p.payload.filePath,
    type: p.payload.type,
    name: p.payload.name,
    content: p.payload.content,
    startLine: p.payload.startLine,
    endLine: p.payload.endLine,
    vector: p.vector,
  }));

  if (!await tableExists()) {
    // Schema inferred from first insert
    await conn.createTable(TABLE_NAME, records);
  } else {
    // mergeInsert = upsert on "id" column
    const table = await conn.openTable(TABLE_NAME);
    await table
      .mergeInsert("id")
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute(records);
  }
}
```

**Key points:**
- Ollama uses `prompt` not `input` (unlike OpenAI API)
- No batch endpoint - sequential calls with retry logic
- LanceDB stores as files in `.claude/state/vectors.lance/`
- Distance-to-score conversion: `score = 1 - (distance / 2)`

**Example:** `scripts/discover/embeddings/lancedb.ts` lines 168-210

---

## Pattern F: SCIP Integration Pattern

SCIP provides IDE-quality symbol navigation (go-to-definition, find-references).

**When to use**: Precise symbol lookup vs fuzzy search.

### Loading SCIP Index

```typescript
// scripts/discover/scip/query.ts
import { scip } from "@sourcegraph/scip-typescript/dist/src/scip.js";

export async function loadIndex(indexPath: string): Promise<Index> {
  const buffer = await fs.promises.readFile(indexPath);
  return scip.Index.deserializeBinary(buffer);  // Protobuf binary format
}
```

### Finding Definitions

```typescript
// scripts/discover/scip/query.ts
export function getDefinition(index: Index, symbol: string): OccurrenceLocation | null {
  for (const document of index.documents) {
    for (const occurrence of document.occurrences) {
      if (occurrence.symbol === symbol) {
        // Check definition bit (symbol_roles is a bitmask)
        if (occurrence.symbol_roles & SymbolRole.Definition) {
          const range = occurrence.range;
          // Range format varies: [line, col, endCol] or [line, col, endLine, endCol]
          const isSingleLine = range.length === 3;

          return {
            relativePath: document.relative_path,
            startLine: range[0],
            startColumn: range[1],
            endLine: isSingleLine ? range[0] : range[2],
            endColumn: isSingleLine ? range[2] : range[3],
          };
        }
      }
    }
  }
  return null;
}
```

**Key points:**
- Import from `@sourcegraph/scip-typescript/dist/src/scip.js` (not `@sourcegraph/scip`)
- Symbol format: `scip-typescript npm <pkg> <ver> <path>/SymbolName`
- `symbol_roles` bitmask: Definition=1, Import=2, WriteAccess=4, ReadAccess=8
- Range array format differs for single-line vs multi-line spans

**Example:** `scripts/discover/scip/query.ts` lines 159-186

---

## Pattern Comparison Table

| Aspect | Extractors | Embeddings | SCIP |
|--------|------------|------------|------|
| **Purpose** | Structured metadata | Semantic search | Symbol navigation |
| **Input** | Source files | Code chunks | Source files |
| **Output** | JSON inventories | LanceDB vectors | SQLite + protobuf |
| **Query type** | Direct lookup | Similarity search | Exact symbol match |
| **Incremental** | Chunk-level | Point-level | Full re-index |

---

## Anti-Patterns to Avoid

### 1. Synchronous File Operations in Extractors

```typescript
// BAD: Blocks event loop during large file processing
const content = fs.readFileSync(filePath, "utf-8");
const parsed = JSON.parse(content);

// GOOD: Use ts-morph's cached file system
const sourceFile = project.addSourceFilesAtPaths(glob);
sourceFile.getText();  // Already cached
```

### 2. Skipping Atomic Writes

```typescript
// BAD: Can corrupt output on crash
fs.writeFileSync(outputPath, JSON.stringify(data));

// GOOD: Atomic write with temp file + rename
const tempPath = `${outputPath}.tmp`;
fs.writeFileSync(tempPath, JSON.stringify(data));
fs.renameSync(tempPath, outputPath);  // POSIX atomic
```

### 3. Missing Incremental Support

```typescript
// BAD: Always processes all files
export async function extractFoo(): Promise<void> {
  const allFiles = project.addSourceFilesAtPaths("src/**/*.ts");
  // Process all files every time
}

// GOOD: Accept onlyChunks for incremental updates
export async function extractFoo(onlyChunks?: Set<string>): Promise<void> {
  const allFiles = project.addSourceFilesAtPaths("src/**/*.ts");
  const filesToProcess = onlyChunks
    ? allFiles.filter(f => onlyChunks.has(getChunkName(f)))
    : allFiles;
}
```

### 4. Hardcoded Embedding Dimensions

```typescript
// BAD: Magic numbers
if (vector.length !== 768) throw new Error("Bad vector");

// GOOD: Named constants with documentation
const EXPECTED_DIMENSIONS = 768;  // nomic-embed-text output size
if (vector.length !== EXPECTED_DIMENSIONS) {
  throw new OllamaError(`Expected ${EXPECTED_DIMENSIONS} dimensions`);
}
```

---

## New Extractor Checklist

When adding a new extractor to the discovery system:

1. [ ] Create extractor file in `scripts/discover/extractors/{name}.ts`
2. [ ] Implement standard signature: `(onlyChunks?: Set<string>) => Promise<void>`
3. [ ] Add configuration to `EXTRACTORS` in `scripts/discover/index.ts`
4. [ ] Define `getSourceFiles()` with appropriate glob patterns
5. [ ] Implement chunk grouping logic (feature-based or file-based)
6. [ ] Call `writeChunkedDiscovery()` or `writeIncrementalChunkedDiscovery()`
7. [ ] Filter out test files in `getSourceFiles()`, not in extractor
8. [ ] Test incremental mode: modify one source file, verify only that chunk updates
9. [ ] Verify: `npx tsx scripts/discover/index.ts --only={name} --check`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Extractor Interface** | `index.ts`, `extractors/*.ts` |
| **B: Chunked Output** | `utils/output.ts` |
| **C: Staleness Detection** | `utils/output.ts`, `check-staleness.ts` |
| **D: AST Extraction** | `utils/project.ts`, `extractors/*.ts` |
| **E: Embedding Pipeline** | `embeddings/ollama.ts`, `embeddings/lancedb.ts` |
| **F: SCIP Integration** | `scip/query.ts`, `scip/generate.ts` |
```

## Phase 4: Write the File

After generating the content above, write it to:

`/home/krwhynot/projects/crispy-crm/scripts/discover/PATTERNS.md`

Verify that:
- All file paths in code examples are accurate
- ASCII diagram reflects current directory structure
- Pattern names match the actual implementation patterns found
- Anti-patterns are real issues discovered during exploration (not hypothetical)
