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
│   ├── chunk.ts              Code chunking strategy
│   ├── health-check.ts       Service health verification CLI
│   └── search-cli.ts         Semantic code search CLI
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
// scripts/discover/index.ts (lines 15-22)
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
  // ... 6 more extractors (hooks, schemas, types, forms, validation-services, call-graph)
};
```

**Key points:**
- `isChunked: true` enables incremental updates via `onlyChunks` parameter
- `getSourceFiles()` returns absolute paths for staleness detection
- `outputPath` is relative to `.claude/state/`
- Filter test files in `getSourceFiles()`, not in the extractor

**Example:** `scripts/discover/index.ts` lines 24-128

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
// scripts/discover/utils/output.ts (lines 198-312)
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

### ChunkedManifest Interface

```typescript
// scripts/discover/utils/output.ts (lines 168-190)
export interface ChunkedManifest {
  status: "complete" | "in_progress" | "error";
  generated_at: string;
  generator: string;
  source_globs: string[];
  checksum: string;
  source_hashes: Record<string, string>;        // All source files hashes
  summary: Record<string, number>;
  chunks: ChunkInfo[];
  file_to_chunks: Record<string, string[]>;     // Critical for incremental updates
}

export interface ChunkInfo {
  name: string;
  file: string;
  item_count: number;
  checksum: string;
  source_files: string[];                       // Files contributing to this chunk
  source_hashes: Record<string, string>;        // Per-chunk hashes for staleness
}
```

### Incremental Chunked Discovery

```typescript
// scripts/discover/utils/output.ts (lines 576-722)
export function writeIncrementalChunkedDiscovery<T>(
  dirName: string,
  generator: string,
  sourceGlobs: string[],
  allSourceFiles: string[],
  updatedChunks: Map<string, T[]>,
  fileToChunkMapping: Map<string, string>,
  existingManifest: ChunkedManifest
): void {
  // 1. Only write updated chunk files (stale chunks)
  // 2. Preserve existing chunk files for fresh chunks
  // 3. Remove chunk files for deleted chunks
  // 4. Create merged manifest with updated checksums
}
```

### Reading Existing Manifests

```typescript
// scripts/discover/utils/output.ts (lines 530-556)
export function readExistingManifest(dirName: string): ChunkedManifest | null {
  // Returns parsed manifest or null if missing/invalid
  // Validates required incremental fields (chunks, source_hashes, file_to_chunks)
}
```

**Key points:**
- Atomic writes prevent corrupted output on crash
- `file_to_chunks` enables O(1) lookup of which chunks need updating
- Chunk checksums allow verification without reading full content
- Manifest is written last to ensure chunks exist first
- `writeIncrementalChunkedDiscovery` merges with existing manifest for partial updates
- `readExistingManifest` validates manifest before incremental operations

---

## Pattern C: Staleness Detection Pattern

Hash-based staleness detection enables fast incremental updates.

**When to use**: Before running extractors to skip unchanged chunks.

### Source Hash Comparison

```typescript
// scripts/discover/utils/output.ts (lines 40-55)
export function buildSourceHashes(filePaths: string[]): Record<string, string> {
  const hashes: Record<string, string> = {};
  const cwd = process.cwd();

  for (const filePath of filePaths) {
    const relativePath = path.relative(cwd, filePath);
    try {
      hashes[relativePath] = hashFile(filePath);  // SHA-256 truncated to 12 chars
    } catch {
      hashes[relativePath] = "MISSING";  // File deleted between scan and hash
    }
  }

  return hashes;
}
```

### Stale Chunk Detection

```typescript
// scripts/discover/utils/output.ts (lines 398-521)
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
      // New file (+) - find its chunk
      const chunkName = getChunkForFile(absolutePath);
      staleChunks.add(chunkName);
    } else if (oldHash !== currentHash) {
      // Modified file (~) - mark its chunks stale
      const chunks = manifest.file_to_chunks[relativePath] || [];
      chunks.forEach(c => staleChunks.add(c));
    }
  }
  // Also detect deleted files (-) from manifest not in current

  return { hasStaleChunks: staleChunks.size > 0, staleChunks, freshChunks };
}
```

**Key points:**
- SHA-256 hash truncated to 12 chars for space efficiency
- Three change types: new (`+`), modified (`~`), deleted (`-`)
- Returns `requiresFullRegen: true` if new chunks needed (manifest schema change)
- Incremental mode only processes stale chunks

---

## Pattern D: AST Extraction Pattern

ts-morph provides type-safe AST traversal for extracting code metadata.

**When to use**: Extracting structured data from TypeScript/TSX source files.

### Singleton Project

```typescript
// scripts/discover/utils/project.ts (lines 9-34)
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
// scripts/discover/extractors/components.ts (lines 122-271)
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

### Feature-Based Chunk Grouping

```typescript
// scripts/discover/extractors/components.ts (lines 30-38)
function extractFeatureName(relativePath: string): string {
  const match = relativePath.match(/^src\/atomic-crm\/([^/]+)\//);
  if (match) return match[1];  // src/atomic-crm/contacts/... → "contacts"
  return "_root";              // Files in src/atomic-crm/ root → "_root"
}
```

### Test File Filtering

```typescript
// scripts/discover/extractors/hooks.ts (lines 155-161)
if (filePath.includes("node_modules") ||
    filePath.includes(".test.") ||
    filePath.includes(".spec.")) {
  continue;
}
```

**Key points:**
- `skipAddingFilesFromTsConfig: true` saves memory - add files explicitly
- `asKindOrThrow()` provides type-safe narrowing
- `getDescendantsOfKind()` for recursive AST traversal
- Filter test files in processing loop, not at glob level

---

## Pattern E: Embedding Pipeline Pattern

Ollama generates embeddings, LanceDB stores them for similarity search.

**When to use**: Enabling semantic code search ("find form validation" vs exact text match).

### Ollama Client

```typescript
// scripts/discover/embeddings/ollama.ts (lines 15-29)
const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = "nomic-embed-8k";    // 8192 context for larger chunks
const FALLBACK_MODEL = "nomic-embed-text"; // Standard 2048 context
const EXPECTED_DIMENSIONS = 768;

interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;  // API uses "prompt" NOT "input" (OpenAI difference)
}

// scripts/discover/embeddings/ollama.ts (lines 62-129)
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
// scripts/discover/embeddings/lancedb.ts (lines 29-30, 83-99)
let db: lancedb.Connection | null = null;

async function getConnection(): Promise<lancedb.Connection> {
  if (db) return db;  // Return cached connection (lazy singleton)

  const dbDir = path.dirname(DB_PATH);
  await fs.mkdir(dbDir, { recursive: true });
  db = await lancedb.connect(DB_PATH);
  return db;
}

// scripts/discover/embeddings/lancedb.ts (lines 162-204)
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

### Distance-to-Score Conversion

```typescript
// scripts/discover/embeddings/lancedb.ts (lines 214-216)
function distanceToScore(distance: number): number {
  // LanceDB cosine distance: 0 (identical) to 2 (opposite)
  // Qdrant-compatible score: -1 (opposite) to 1 (identical)
  return 1 - distance / 2;
}
```

### Filtered Vector Search

```typescript
// scripts/discover/embeddings/lancedb.ts (lines 293-339)
export async function searchByType(
  queryVector: number[],
  type: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const table = await conn.openTable(TABLE_NAME);
  const results = await table
    .vectorSearch(queryVector)
    .distanceType("cosine")
    .where(`type = '${type}'`)  // SQL-like filter syntax
    .limit(limit)
    .toArray();
  // ... convert to SearchResult format
}
```

**Key points:**
- Ollama uses `prompt` not `input` (unlike OpenAI API)
- No batch endpoint - sequential calls with retry logic
- LanceDB stores as files in `.claude/state/vectors.lance/`
- `mergeInsert("id")` enables idempotent upserts
- `searchByType` allows filtering results by code element type (component, function, hook, etc.)

---

## Pattern F: SCIP Integration Pattern

SCIP provides IDE-quality symbol navigation (go-to-definition, find-references).

**When to use**: Precise symbol lookup vs fuzzy search.

### Loading SCIP Index

```typescript
// scripts/discover/scip/query.ts (lines 48-51)
import { scip } from "@sourcegraph/scip-typescript/dist/src/scip.js";

export async function loadIndex(indexPath: string): Promise<Index> {
  const buffer = await fs.promises.readFile(indexPath);
  return scip.Index.deserializeBinary(buffer);  // Protobuf binary format
}
```

**Critical:** Import from `@sourcegraph/scip-typescript/dist/src/scip.js`, NOT `@sourcegraph/scip` (doesn't exist).

### Symbol Naming Convention

```
scip-typescript npm <package> <version> <path>/SymbolName
```

**Examples:**
```
scip-typescript npm atomic-crm 0.1.0 src/hooks/`use-mobile.ts`/useIsMobile().
scip-typescript npm atomic-crm 0.1.0 src/components/ContactList.tsx/ContactList.
```

### Symbol Roles Bitmask

```typescript
// scripts/discover/scip/parser.ts (lines 26-33)
export const SymbolRoles = {
  Definition: 1,        // 0b0001
  Import: 2,            // 0b0010
  WriteAccess: 4,       // 0b0100
  ReadAccess: 8,        // 0b1000
  Generated: 16,        // 0b10000
  Test: 32,             // 0b100000
} as const;

// Usage: Check if occurrence is a definition
if (occurrence.symbol_roles & SymbolRoles.Definition) {
  // This is a definition
}
```

### Range Format Handling

```typescript
// scripts/discover/scip/parser.ts (lines 110-123)
export function parseRange(range: number[]): {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
} {
  // Two formats:
  // Single-line (3 elements): [startLine, startCol, endCol]
  // Multi-line (4 elements): [startLine, startCol, endLine, endCol]
  const isSingleLine = range.length === 3;
  return {
    startLine: range[0],
    startColumn: range[1],
    endLine: isSingleLine ? range[0] : range[2],
    endColumn: isSingleLine ? range[2] : range[3],
  };
}
```

**Key points:**
- Binary protobuf format requires `deserializeBinary()`
- `symbol_roles` is a bitmask - test with bitwise AND
- Range array length determines single-line vs multi-line span
- Lines are 0-indexed in SCIP format

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

### 1. Non-Atomic File Writes

```typescript
// BAD: Can corrupt output on crash
fs.writeFileSync(outputPath, JSON.stringify(data));

// GOOD: Atomic write with temp file + rename
const tempPath = `${outputPath}.tmp`;
fs.writeFileSync(tempPath, JSON.stringify(data));
fs.renameSync(tempPath, outputPath);  // POSIX atomic
```

### 2. Missing Incremental Support

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

### 3. Wrong SCIP Import Path

```typescript
// BAD: This package doesn't exist
import { scip } from "@sourcegraph/scip";

// GOOD: Import from scip-typescript bindings
import { scip } from "@sourcegraph/scip-typescript/dist/src/scip.js";
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

### 5. Missing file_to_chunks Mapping

```typescript
// BAD: No way to determine which chunks need updating
writeChunkedDiscovery(dirName, generator, globs, files, summary, chunks);

// GOOD: Pass fileToChunkMapping for incremental support
const fileToChunkMapping = new Map<string, string>();
for (const sf of sourceFiles) {
  fileToChunkMapping.set(sf.getFilePath(), extractFeatureName(sf.getFilePath()));
}
writeChunkedDiscovery(dirName, generator, globs, files, summary, chunks, fileToChunkMapping);
```

---

## New Extractor Checklist

When adding a new extractor to the discovery system:

1. [ ] Create extractor file in `scripts/discover/extractors/{name}.ts`
2. [ ] Implement standard signature: `(onlyChunks?: Set<string>) => Promise<void>`
3. [ ] Add configuration to `EXTRACTORS` in `scripts/discover/index.ts`
4. [ ] Define `getSourceFiles()` with appropriate glob patterns
5. [ ] Implement chunk grouping logic (feature-based or file-based)
6. [ ] Build `fileToChunkMapping` Map for incremental support
7. [ ] Call `writeChunkedDiscovery()` or `writeIncrementalChunkedDiscovery()`
8. [ ] Filter out test files (`.test.`, `.spec.`, `__tests__`)
9. [ ] Test incremental mode: modify one source file, verify only that chunk updates
10. [ ] Verify: `npx tsx scripts/discover/index.ts --only={name} --check`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Extractor Interface** | `index.ts:15-128` |
| **B: Chunked Output** | `utils/output.ts:168-312, 530-556, 576-722` |
| **C: Staleness Detection** | `utils/output.ts:40-55, 318-521` |
| **D: AST Extraction** | `utils/project.ts:9-34`, `extractors/*.ts` |
| **E: Embedding Pipeline** | `embeddings/ollama.ts:15-129`, `embeddings/lancedb.ts:29-339` |
| **F: SCIP Integration** | `scip/query.ts:48-51`, `scip/parser.ts:26-123` |

---

## CLI Utilities

### health-check.ts - Discovery Services Health Check

Verifies that all required services (LanceDB, Ollama) are running and properly configured for semantic search.

**Location:** `scripts/discover/embeddings/health-check.ts`

**Usage:**
```bash
npx tsx scripts/discover/embeddings/health-check.ts
# Or via justfile:
just discover-health
```

**What it checks:**
1. **Ollama (Embedding Service)**
   - Server reachable at `http://localhost:11434`
   - Required model `nomic-embed-text` is pulled
   - Lists all available models

2. **LanceDB (Vector Database)**
   - Database accessible at `.claude/state/vectors.lance`
   - Table `code_chunks` exists
   - Reports number of indexed points

**Key Functions:**
- `checkAllServices()` - Orchestrates all health checks and outputs results
- Uses `checkOllamaHealth()` and `getHealthDetails()` from `ollama.ts`
- Uses `checkLanceDBHealth()` and `getHealthDetails()` from `lancedb.ts`

**Exit Codes:**
- `0` - All services healthy
- `1` - One or more services unhealthy

**Example Output:**
```
🔍 Discovery Services Health Check

──────────────────────────────────────────────────

📦 Ollama (Embedding Service)
   ✅ Server reachable
   ✅ Model available: nomic-embed-text
   📋 All models: nomic-embed-text, llama2

📦 LanceDB (Vector Database)
   ✅ Database accessible at .claude/state/vectors.lance
   ✅ Table 'code_chunks' exists
   📊 Points indexed: 1234

──────────────────────────────────────────────────
✅ All services healthy - ready for semantic search
```

---

### search-cli.ts - Semantic Code Search CLI

Search for code by meaning rather than exact keywords. Uses Ollama to generate embeddings and LanceDB for similarity search.

**Location:** `scripts/discover/embeddings/search-cli.ts`

**Usage:**
```bash
npx tsx scripts/discover/embeddings/search-cli.ts <query> [options]

# Or via justfile:
just discover-search "form validation"
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--limit <n>` | Maximum results to return | 10 |
| `--type <type>` | Filter by code element type (component, hook, function, etc.) | none |
| `--no-preview` | Hide code previews in output | show previews |
| `--help` | Show help message | - |

**Examples:**
```bash
# Basic semantic search
npx tsx scripts/discover/embeddings/search-cli.ts "form validation"

# Limit results
npx tsx scripts/discover/embeddings/search-cli.ts "hooks for authentication" --limit 5

# Filter by type
npx tsx scripts/discover/embeddings/search-cli.ts "data fetching" --type hook

# Hide code previews
npx tsx scripts/discover/embeddings/search-cli.ts "Zod schema" --no-preview
```

**Key Functions:**
- `parseArgs()` - Parses CLI arguments into `SearchOptions`
- `runSearch(options)` - Executes the search pipeline:
  1. Verifies Ollama and LanceDB health
  2. Checks if index has data
  3. Generates query embedding via `generateEmbedding()`
  4. Searches via `search()` or `searchByType()`
  5. Formats and displays results

**Output Format:**
```
🔎 Searching for: "form validation"

Found 5 results:

────────────────────────────────────────────────────────────

1. [92.3%] component: ContactForm
   📁 src/atomic-crm/contacts/ContactForm.tsx:15-89
   📄 export function ContactForm({ contact, onSave }) { const { handleSubmit...

2. [87.1%] hook: useFormValidation
   📁 src/hooks/useFormValidation.ts:8-45
   📄 export function useFormValidation<T extends ZodSchema>(schema: T) {...

────────────────────────────────────────────────────────────

💡 Tip: Use --limit <n> to show more results
```

**Exit Codes:**
- `0` - Search completed successfully
- `1` - Error (services unavailable, no index, or search failure)
