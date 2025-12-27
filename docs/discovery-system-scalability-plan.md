# Discovery System - Scalability Refactor Plan

> **Status:** Planning Complete
> **Target Scale:** 2 Million Lines of Code
> **Estimated Effort:** 3-4 weeks
> **Generated:** 2025-12-27

---

## Table of Contents

1. [Tools & Dependencies Required](#tools--dependencies-required)
2. [Custom Modules Created](#custom-modules-created)
3. [Major Gaps Identified](#major-gaps-identified-from-industry-best-practices)
4. [Scalability Analysis: 2M LOC](#scalability-analysis-2-million-lines-of-code)
5. [Detailed Implementation Plan](#detailed-implementation-plan-4-phase-scalability-refactor)
6. [Verification Checklist](#verification-checklist)

---

## Tools & Dependencies Required

### 1. Core Runtime & Build Tools

| Tool | Purpose |
|------|---------|
| **Node.js** | Runtime environment for TypeScript execution |
| **tsx** | Direct TypeScript execution (`npx tsx scripts/discover/index.ts`) |
| **TypeScript** | Type-safe development |

### 2. AST Parsing & Code Analysis

| Tool | Purpose |
|------|---------|
| **ts-morph** | TypeScript AST parser - extracts components, hooks, schemas, types, call graphs |

This is the **critical tool** that powers all 7 extractors by parsing TypeScript/TSX files into analyzable AST nodes.

### 3. File System & Hashing (Node.js Built-ins)

| Module | Purpose |
|--------|---------|
| **fs/promises** | Async file read/write operations |
| **path** | Cross-platform path manipulation |
| **crypto** | SHA-256 hashing for staleness detection |

### 4. Task Runner

| Tool | Purpose |
|------|---------|
| **just** (justfile) | CLI command orchestration (`just discover`, `just discover --check`) |

### 5. File Discovery (Optional Performance Tools)

| Tool | Purpose |
|------|---------|
| **fast-glob** or **glob** | Find source files matching patterns (`**/*.tsx`, `**/*.ts`) |
| **fd** (optional) | Faster alternative to find for file discovery |

### 6. CLI Argument Parsing

| Tool | Purpose |
|------|---------|
| **process.argv** parsing | Handle `--check`, `--incremental`, `--only=hooks` flags |
| (or **commander**/**yargs**) | More robust CLI parsing if used |

---

## Custom Modules Created

### scripts/discover/index.ts (Orchestrator)
```
├── parseCliArgs()           → CLI flag parsing
├── getChunkNameForFile()    → Map source file → chunk name
├── checkStaleness()         → Compare hashes, return stale status
├── runExtractors()          → Run all extractors in parallel
└── main()                   → Entry point
```

### scripts/discover/utils/output.ts (I/O Utilities)
```
├── hashFile()               → SHA-256 hash of file content (12 chars)
├── hashPayload()            → SHA-256 hash of JSON payload
├── buildSourceHashes()      → Create {path: hash} map
├── writeDiscoveryFile()     → Write single JSON file
├── writeChunkedDiscovery()  → Write manifest + chunk files
├── isDiscoveryStale()       → Single file staleness check
├── isChunkedDiscoveryStale()→ Chunked staleness check
└── getStaleChunks()         → Identify which chunks are stale
```

### scripts/discover/extractors/*.ts (7 Extractors)
```
├── components.ts    → React component extraction (26 chunks)
├── hooks.ts         → Custom hooks extraction (15 chunks)
├── schemas.ts       → Zod schema extraction (18 chunks)
├── types.ts         → TypeScript types extraction (10 chunks)
├── forms.ts         → Form component extraction (single file)
├── validationSvcs.ts→ Validation wrapper extraction
└── callGraph.ts     → Call/render relationship extraction (30 chunks)
```

---

## Summary: Minimum Required Package Dependencies

```json
{
  "dependencies": {
    "ts-morph": "^21.0.0"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "fast-glob": "^3.x"
  }
}
```

Plus **just** installed separately (`brew install just` or `cargo install just`).

---

## Why These Specific Tools?

| Tool | Rationale |
|------|-----------|
| **ts-morph** | Only robust TypeScript AST parser that handles JSX/TSX and provides type information |
| **SHA-256 hashing** | Cryptographically strong for reliable change detection |
| **Chunked output** | Token efficiency - Claude reads only relevant chunks |
| **just** | Declarative task runner with dependency tracking |
| **tsx** | Zero-config TypeScript execution without compilation step |

---

## Architecture Decision: Why Not Alternatives?

| Alternative | Why Not Used |
|-------------|--------------|
| Babel parser | Less TypeScript-aware, no type resolution |
| ESLint parser | Designed for linting, not extraction |
| tsc --emit | Requires compilation, slower iteration |
| Make | Less readable than justfile syntax |

---

# Major Gaps Identified (from Industry Best Practices)

Based on research from ts-morph docs, Nx cache security (CVE-2025-36852), and Kilo Code's codebase indexing:

## Gap 1: NO SEMANTIC SEARCH ⭐ Critical
**Current:** Structural extraction only (components, hooks, schemas)
**Industry Standard:** AI embeddings + vector database for semantic queries

**What's Missing:**
- Can't query "find authentication logic" or "error handling patterns"
- No similarity search ("find code like this")
- Limited to exact name/path lookups

**Tools Needed:**
- Embedding provider (OpenAI `text-embedding-3-small` or Ollama `nomic-embed-text`)
- Vector database (Qdrant, Pinecone, or Chroma)
- Tree-sitter for language-agnostic parsing

---

## Gap 2: NO WATCH MODE ⭐ High Priority
**Current:** Runs on-demand via `just discover`
**Industry Standard:** Continuous file watching with real-time updates

**What's Missing:**
- Developer must manually run discovery after changes
- No integration with IDE save events
- Stale data between runs

**Tools Needed:**
- `chokidar` or Node.js `fs.watch` for file monitoring
- Debounced update triggers
- Background process or VS Code extension

---

## Gap 3: CACHE SECURITY VULNERABILITY ⭐ Security Critical
**Current:** Plain JSON files in `.claude/state/` with no integrity verification
**Industry Standard:** Multi-tier cache with poisoning prevention (CVE-2025-36852)

**What's Missing:**
- Anyone with repo write access can poison discovery cache
- No signature verification on output files
- No trusted vs untrusted environment separation
- CI could use poisoned artifacts if `.claude/state/` is committed

**Risks (from CREEP vulnerability):**
- Malicious actor modifies `manifest.json` to inject false component info
- Poisoned call-graph could hide security vulnerabilities
- No audit trail of who generated each chunk

**Mitigations Needed:**
- HMAC signatures on chunk files
- Separate CI-generated vs local discovery outputs
- Integrity check before Claude reads any chunk

---

## Gap 4: NO FILE SIZE LIMITS
**Current:** Processes all matched files regardless of size
**Industry Standard:** 1MB max per file (Kilo Code)

**What's Missing:**
- Could choke on generated files (bundles, minified code)
- No protection against memory exhaustion
- Large files slow down extraction

**Tools Needed:**
- File size check before processing
- Skip or warn for files > threshold

---

## Gap 5: NO ERROR RECOVERY / PARTIAL RESULTS
**Current:** All-or-nothing extraction per chunk
**Industry Standard:** Graceful degradation with partial results

**What's Missing:**
- Single parse error aborts entire chunk extraction
- No resume capability after failure
- No per-file error isolation

**Tools Needed:**
- Try/catch per file with error logging
- Partial chunk output with error manifest
- `--resume` flag for failed runs

---

## Gap 6: TYPESCRIPT-ONLY (No Multi-Language Support)
**Current:** ts-morph handles .ts/.tsx only
**Industry Standard:** Tree-sitter for 40+ languages

**What's Missing:**
- SQL migrations not analyzed
- Markdown docs not indexed
- Edge Functions (Deno) may have parsing issues
- JSON schemas not extracted

**Tools Needed:**
- Tree-sitter bindings (`tree-sitter`, `web-tree-sitter`)
- Language-specific parsers for SQL, Markdown

---

## Gap 7: NO TRAVERSAL OPTIMIZATION
**Current:** Unknown if using ts-morph's `traversal.skip()/stop()`
**Industry Standard:** Controlled traversal for performance

**From ts-morph docs:**
```typescript
node.forEachDescendant((node, traversal) => {
  if (Node.isClassDeclaration(node)) {
    traversal.skip(); // Skip class internals
  }
  if (foundTarget) {
    traversal.stop(); // Early exit
  }
});
```

**What's Missing:**
- May be traversing entire AST unnecessarily
- No early termination for simple queries
- Performance impact on large files

---

## Gap 8: NO CROSS-REFERENCE VALIDATION
**Current:** Call graph captures relationships but doesn't validate them
**Industry Standard:** Broken reference detection

**What's Missing:**
- Dead code detection (unreferenced exports)
- Broken import detection
- Circular dependency warnings (Tarjan's SCC exists but not surfaced)

**Tools Needed:**
- Validation pass after extraction
- Report of broken/suspicious references

---

## Gap 9: NO MANIFEST INTEGRITY HASH
**Current:** `source_hashes` tracks input files only
**Industry Standard:** Output integrity verification

**What's Missing:**
- No hash of the actual chunk content
- Can't verify chunks weren't tampered with
- No way to detect partial/corrupt writes

**Fix:**
```json
{
  "source_hashes": {...},
  "output_hash": "sha256-of-all-chunks",
  "generated_at": "ISO-timestamp",
  "generator_version": "1.2.3"
}
```

---

## Priority Matrix

| Gap | Severity | Effort | Recommendation |
|-----|----------|--------|----------------|
| Cache Security | 🔴 Critical | Medium | Add HMAC signatures |
| Semantic Search | 🟡 High | High | Phase 2 - requires infrastructure |
| Watch Mode | 🟡 High | Medium | Add chokidar integration |
| File Size Limits | 🟢 Low | Low | Quick win - add check |
| Error Recovery | 🟢 Medium | Medium | Improves reliability |
| Multi-Language | 🟢 Low | High | Nice-to-have for SQL |
| Traversal Optimization | 🟢 Low | Low | Profile first |
| Cross-Reference Validation | 🟢 Low | Medium | Surface existing SCC data |
| Manifest Integrity | 🟢 Medium | Low | Quick security win |

---

## Recommended Immediate Actions

1. **Add file size limit** (30 min) - Skip files > 500KB
2. **Add output integrity hash** (1 hr) - SHA-256 of manifest
3. **Add per-file error isolation** (2 hr) - Don't abort on single parse failure
4. **Surface circular dependency warnings** (1 hr) - Already computed, just expose

---

# Scalability Analysis: 2 Million Lines of Code

## Current Architecture vs 2M LOC Reality

| Aspect | Current Design | 2M LOC Requirement | Gap Severity |
|--------|---------------|-------------------|--------------|
| **Memory** | Single ts-morph Project loads all files | Separate Projects per package/module | 🔴 **BLOCKER** |
| **Processing** | Single-threaded extraction | Worker threads / child processes | 🔴 **BLOCKER** |
| **AST Disposal** | No explicit `dispose()` calls | Must dispose after each file | 🔴 **BLOCKER** |
| **Chunking** | By feature directory (~30 chunks) | By package (100+ shards) | 🟡 High |
| **Incremental** | Hash-based staleness per chunk | Per-file incremental parsing | 🟡 High |
| **Type Resolution** | Full project type checking | Lazy type resolution (LSP) | 🟢 Medium |

## Scalability Gaps (Critical for 2M LOC)

### Gap S1: MEMORY EXHAUSTION 🔴 BLOCKER
**Current:** One `ts-morph.Project` loads entire codebase AST into memory
**At 2M LOC:** Will cause OOM (Out of Memory) crash

**Evidence (from Perplexity research):**
> "ts-morph can hit memory limits in massive codebases due to type dependencies and AST traversal"

**Required Fix:**
```typescript
// CURRENT (WILL FAIL AT SCALE)
const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
project.addSourceFilesAtPaths('src/**/*.ts'); // Loads ALL 2M lines

// REQUIRED FOR SCALE
const packages = await getPackageDirectories();
for (const pkg of packages) {
  const project = new Project(); // Fresh project per package
  project.addSourceFilesAtPaths(`${pkg}/**/*.ts`);
  await extractFromProject(project, pkg);
  project.getSourceFiles().forEach(sf => sf.forget()); // Free memory
  // project is garbage collected here
}
```

**Tools Needed:**
- Package/module boundary detection
- Memory profiling (`--inspect`, `heapdump`)
- Explicit `SourceFile.forget()` calls

---

### Gap S2: SINGLE-THREADED PROCESSING 🔴 BLOCKER
**Current:** Sequential extraction in main thread
**At 2M LOC:** Hours to complete full extraction

**Required Fix:**
```typescript
// Use Node.js Worker Threads
import { Worker, isMainThread, workerData } from 'worker_threads';
import pQueue from 'p-queue';

const queue = new pQueue({ concurrency: os.cpus().length });
const packages = await getPackageDirectories();

for (const pkg of packages) {
  queue.add(() => new Promise((resolve) => {
    const worker = new Worker('./extractor-worker.js', {
      workerData: { packagePath: pkg }
    });
    worker.on('message', resolve);
  }));
}
await queue.onIdle();
```

**Tools Needed:**
- `worker_threads` (Node.js built-in)
- `p-queue` for concurrency limiting
- Worker script for each extractor type

---

### Gap S3: NO DISPOSE() CALLS 🔴 BLOCKER
**Current:** AST nodes retained in memory indefinitely
**At 2M LOC:** Memory grows unboundedly, eventually crashes

**Required Fix:**
```typescript
// After processing each file
sourceFile.forget(); // Releases compiler memory

// After processing each package
project.getSourceFiles().forEach(sf => sf.forget());
```

---

### Gap S4: INSUFFICIENT SHARDING 🟡 HIGH
**Current:** ~30 chunks by feature directory
**At 2M LOC:** Need 100-500+ shards by package/module

**Current Chunk Logic:**
```
src/atomic-crm/contacts/ → contacts.json (30 components)
```

**Required for Scale:**
```
packages/auth/src/components/ → auth-components.json
packages/auth/src/hooks/      → auth-hooks.json
packages/core/src/components/ → core-components.json
... (100+ shards)
```

**Tools Needed:**
- Package.json detection for monorepo packages
- Configurable shard boundaries
- Shard aggregation for cross-package queries

---

### Gap S5: NO TYPE CACHING 🟢 MEDIUM
**Current:** Full type resolution on every run
**At 2M LOC:** Redundant type checking on unchanged dependencies

**Required Fix:**
```typescript
// Cache resolved types between runs
const typeCache = await loadTypeCache('.cache/ts-morph-types.json');
// ... use cached type info for unchanged files
await saveTypeCache(typeCache);
```

**Tools Needed:**
- Type resolution cache (JSON/SQLite)
- Cache invalidation based on `tsconfig.json` changes

---

## Revised Architecture for 2M LOC

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (main thread)                   │
│  - Package discovery                                            │
│  - Work queue management (p-queue)                              │
│  - Result aggregation                                           │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  WORKER 1       │  │  WORKER 2       │  │  WORKER N       │
│  (package: auth)│  │  (package: core)│  │  (package: ...)│
│                 │  │                 │  │                 │
│  ts-morph       │  │  ts-morph       │  │  ts-morph       │
│  Project        │  │  Project        │  │  Project        │
│  (isolated)     │  │  (isolated)     │  │  (isolated)     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SHARD OUTPUT                                 │
│  .claude/state/                                                 │
│  ├── component-inventory/                                       │
│  │   ├── manifest.json (aggregated)                            │
│  │   ├── auth-components.json      (from Worker 1)             │
│  │   ├── core-components.json      (from Worker 2)             │
│  │   └── ... (100+ shards)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scalability Priority Matrix

| Gap | Impact at 2M LOC | Fix Effort | Recommendation |
|-----|-----------------|------------|----------------|
| S1: Memory | 🔴 OOM crash | High | **MUST FIX** - separate Project per package |
| S2: Single-threaded | 🔴 Hours to run | High | **MUST FIX** - worker threads |
| S3: No dispose() | 🔴 OOM after ~500K LOC | Low | **MUST FIX** - add forget() calls |
| S4: Sharding | 🟡 Huge chunk files | Medium | Refactor chunk logic for packages |
| S5: Type caching | 🟢 Slower incremental | Medium | Phase 2 optimization |

---

## Verdict: Is Current Architecture Scalable to 2M LOC?

### 🔴 NO - Current architecture will FAIL at scale

**Critical Blockers:**
1. Single ts-morph Project = OOM crash around 500K-1M LOC
2. Single-threaded = unacceptable extraction time (hours)
3. No memory disposal = unbounded memory growth

**Required Minimum Changes:**
1. **Package-level Project isolation** - Separate ts-morph instance per package
2. **Worker thread parallelization** - Use all CPU cores
3. **Explicit dispose()** - Call `forget()` after processing
4. **Dynamic shard count** - Scale shards with package count

**Estimated Effort:** 2-3 weeks for architecture refactor

---

## Incremental Migration Path

### Phase 1: Foundation (Week 1)
- Add `SourceFile.forget()` calls after processing
- Add file size limits (skip > 500KB)
- Profile memory with `--inspect`

### Phase 2: Isolation (Week 2)
- Detect package boundaries (`package.json` / `tsconfig.json`)
- Create separate Project per package
- Merge manifest from package shards

### Phase 3: Parallelization (Week 3)
- Implement worker thread pool
- Add concurrency limiting with p-queue
- Benchmark extraction time improvement

### Phase 4: Optimization (Week 4+)
- Type resolution caching
- Semantic search with embeddings
- Watch mode with file monitoring

---

# Detailed Implementation Plan: 4-Phase Scalability Refactor

## Current Architecture Issues (from Exploration)

| Issue | File | Lines | Impact |
|-------|------|-------|--------|
| **Singleton Project** | `utils/project.ts` | 1-36 | All extractors share one memory pool |
| **No dispose() calls** | All extractors | - | Memory grows unboundedly |
| **Overlapping globs** | `index.ts` | 31-123 | Same files parsed 3+ times |
| **Sequential for loops** | `output.ts` | 251-286 | Chunk writing is sequential |
| **Hash all files every run** | `output.ts` | 40-55 | Even --check hashes everything |

---

## PHASE 1: Memory Hygiene (Week 1) - CRITICAL

**Goal:** Stop memory leaks without breaking existing functionality.

### Task 1.1: Add dispose() to extractors

**Files to Modify:**
- `scripts/discover/extractors/components.ts`
- `scripts/discover/extractors/hooks.ts`
- `scripts/discover/extractors/schemas.ts`
- `scripts/discover/extractors/types.ts`
- `scripts/discover/extractors/forms.ts`
- `scripts/discover/extractors/validationServices.ts`
- `scripts/discover/extractors/call-graph.ts`

**Pattern - Add to END of each extract function:**
```typescript
// BEFORE: (no cleanup)
export async function extractComponents(onlyChunks?: Set<string>) {
  const sourceFiles = project.addSourceFilesAtPaths(globs);
  // ... extraction logic ...
  await writeChunkedDiscovery(...);
}

// AFTER: (with cleanup)
export async function extractComponents(onlyChunks?: Set<string>) {
  const sourceFiles = project.addSourceFilesAtPaths(globs);
  try {
    // ... extraction logic ...
    await writeChunkedDiscovery(...);
  } finally {
    // CRITICAL: Release AST memory after extraction
    sourceFiles.forEach(sf => sf.forget());
  }
}
```

### Task 1.2: Add file size filter

**File:** `scripts/discover/utils/output.ts`

**Add helper function:**
```typescript
const MAX_FILE_SIZE = 500 * 1024; // 500KB

export function filterLargeFiles(files: string[]): string[] {
  return files.filter(file => {
    const stats = fs.statSync(file);
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`⚠️ Skipping large file (${(stats.size / 1024).toFixed(1)}KB): ${file}`);
      return false;
    }
    return true;
  });
}
```

**Usage in each extractor:**
```typescript
const sourceFiles = filterLargeFiles(project.addSourceFilesAtPaths(globs));
```

### Task 1.3: Add memory profiling command

**File:** `justfile`

```makefile
# Memory profiling
discover-profile:
    node --inspect --max-old-space-size=4096 \
      ./node_modules/.bin/tsx scripts/discover/index.ts 2>&1 | \
      tee .claude/logs/discover-profile.log
```

### Task 1.4: Add output integrity hash

**File:** `scripts/discover/utils/output.ts` (modify `writeChunkedDiscovery`)

**Add to manifest:**
```typescript
interface ChunkedManifest {
  // ... existing fields ...
  output_integrity: string;  // NEW: SHA-256 of all chunk checksums combined
  generator_version: string; // NEW: For cache invalidation on upgrades
}

// In writeChunkedDiscovery, after writing chunks:
const integritySource = chunks.map(c => c.checksum).sort().join('|');
const outputIntegrity = hashPayload(integritySource);
manifest.output_integrity = outputIntegrity;
manifest.generator_version = '1.1.0'; // Bump on breaking changes
```

### Phase 1 Testing

```bash
# Before/after memory comparison
just discover-profile  # Note peak memory
# Compare with: node --expose-gc -e "gc(); console.log(process.memoryUsage())"

# Verify file size filter works
touch src/test-large.ts  # Create 600KB file
just discover  # Should skip it with warning

# Verify output integrity
just discover
cat .claude/state/component-inventory/manifest.json | jq .output_integrity
```

---

## PHASE 2: Project Isolation (Week 2) - ARCHITECTURE

**Goal:** Separate ts-morph Project per extractor to enable memory release.

### Task 2.1: Replace singleton with factory

**File:** `scripts/discover/utils/project.ts`

```typescript
// BEFORE: Singleton
class DiscoveryProject {
  private static instance: Project;
  public static getInstance(): Project { ... }
}
export const project = DiscoveryProject.getInstance();

// AFTER: Factory function
export function createProject(name: string): Project {
  const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");

  console.log(`📦 Creating Project for: ${name}`);

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,  // NEW: Faster for extraction-only
  });

  return project;
}

export function disposeProject(project: Project, name: string): void {
  const sourceFiles = project.getSourceFiles();
  console.log(`🧹 Disposing ${sourceFiles.length} files from: ${name}`);
  sourceFiles.forEach(sf => sf.forget());
}
```

### Task 2.2: Update each extractor to use factory

**Pattern for each extractor:**

```typescript
// BEFORE:
import { project } from '../utils/project';

export async function extractComponents(onlyChunks?: Set<string>) {
  const sourceFiles = project.addSourceFilesAtPaths(globs);
  // ...
}

// AFTER:
import { createProject, disposeProject } from '../utils/project';

export async function extractComponents(onlyChunks?: Set<string>) {
  const project = createProject('components');
  try {
    const sourceFiles = project.addSourceFilesAtPaths(globs);
    // ... same extraction logic ...
  } finally {
    disposeProject(project, 'components');
  }
}
```

### Task 2.3: Add extractor-level isolation to orchestrator

**File:** `scripts/discover/index.ts`

```typescript
// BEFORE (line 253-280):
async function runExtractors(extractors: ExtractorConfig[]): Promise<void> {
  const results = await Promise.allSettled(
    extractors.map(ext => ext.extractFn())
  );
  // ...
}

// AFTER: True isolation
async function runExtractors(extractors: ExtractorConfig[]): Promise<void> {
  // Each extractor now has its own Project - truly parallel safe
  const results = await Promise.allSettled(
    extractors.map(async (ext) => {
      const startMem = process.memoryUsage().heapUsed;
      await ext.extractFn();
      const endMem = process.memoryUsage().heapUsed;
      console.log(`📊 ${ext.name}: ${((endMem - startMem) / 1024 / 1024).toFixed(1)}MB used`);
    })
  );
  // ...
}
```

### Phase 2 Testing

```bash
# Verify each extractor creates/disposes its own Project
just discover 2>&1 | grep -E "Creating|Disposing"
# Expected: 7 pairs of Create/Dispose messages

# Verify memory releases between extractors
just discover-profile
# Memory should drop after each extractor completes

# Verify extraction results unchanged
just discover
git diff .claude/state/  # Should be empty (no output changes)
```

---

## PHASE 3: Worker Thread Parallelization (Week 3) - PERFORMANCE

**Goal:** Use all CPU cores for parallel extraction.

### Task 3.1: Create worker script

**New File:** `scripts/discover/extractor-worker.ts`

```typescript
import { parentPort, workerData } from 'worker_threads';
import { createProject, disposeProject } from './utils/project';

interface WorkerInput {
  extractorName: string;
  globs: string[];
  outputPath: string;
  onlyChunks?: string[];
}

interface WorkerOutput {
  success: boolean;
  extractorName: string;
  itemCount: number;
  error?: string;
  memoryUsedMB: number;
}

async function runExtractor(input: WorkerInput): Promise<WorkerOutput> {
  const { extractorName, globs, outputPath, onlyChunks } = input;
  const startMem = process.memoryUsage().heapUsed;

  try {
    const project = createProject(extractorName);
    const sourceFiles = project.addSourceFilesAtPaths(globs);

    // Dynamic import of extractor (avoids loading all extractors)
    const extractor = await import(`./extractors/${extractorName}`);
    const result = await extractor.extract(project, sourceFiles, onlyChunks ? new Set(onlyChunks) : undefined);

    disposeProject(project, extractorName);

    const endMem = process.memoryUsage().heapUsed;

    return {
      success: true,
      extractorName,
      itemCount: result.itemCount,
      memoryUsedMB: (endMem - startMem) / 1024 / 1024,
    };
  } catch (error) {
    return {
      success: false,
      extractorName,
      itemCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      memoryUsedMB: 0,
    };
  }
}

// Worker entry point
if (parentPort) {
  parentPort.on('message', async (input: WorkerInput) => {
    const result = await runExtractor(input);
    parentPort!.postMessage(result);
  });
}
```

### Task 3.2: Create worker pool orchestrator

**New File:** `scripts/discover/worker-pool.ts`

```typescript
import { Worker } from 'worker_threads';
import os from 'os';
import PQueue from 'p-queue';

const WORKER_PATH = new URL('./extractor-worker.ts', import.meta.url);
const MAX_WORKERS = Math.max(1, os.cpus().length - 1); // Leave 1 core for main thread

interface ExtractorTask {
  extractorName: string;
  globs: string[];
  outputPath: string;
  onlyChunks?: string[];
}

export async function runExtractorsParallel(tasks: ExtractorTask[]): Promise<void> {
  const queue = new PQueue({ concurrency: MAX_WORKERS });

  console.log(`🚀 Running ${tasks.length} extractors with ${MAX_WORKERS} workers`);

  const results = await Promise.allSettled(
    tasks.map(task => queue.add(() => runWorker(task)))
  );

  // Report results
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.success) {
      console.log(`✅ ${result.value.extractorName}: ${result.value.itemCount} items (${result.value.memoryUsedMB.toFixed(1)}MB)`);
    } else if (result.status === 'fulfilled') {
      console.error(`❌ ${result.value.extractorName}: ${result.value.error}`);
    } else {
      console.error(`❌ ${tasks[i].extractorName}: Worker crashed - ${result.reason}`);
    }
  });
}

function runWorker(task: ExtractorTask): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      execArgv: ['--loader', 'tsx'], // Support TypeScript
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Timeout: ${task.extractorName} took > 5 minutes`));
    }, 5 * 60 * 1000);

    worker.on('message', (result) => {
      clearTimeout(timeout);
      resolve(result);
    });

    worker.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Worker exited with code ${code}`));
      }
    });

    worker.postMessage(task);
  });
}
```

### Task 3.3: Add graceful shutdown

**File:** `scripts/discover/index.ts`

```typescript
// Add at top of main()
const activeWorkers: Worker[] = [];

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await Promise.all(activeWorkers.map(w => w.terminate()));
  process.exit(0);
});

process.on('SIGINT', () => {
  process.emit('SIGTERM' as any);
});
```

### Task 3.4: Add --parallel flag

**File:** `scripts/discover/index.ts`

```typescript
function parseCliArgs() {
  return {
    // ... existing args ...
    parallel: process.argv.includes('--parallel'),
  };
}

// In main():
if (parallel && !incremental) {
  await runExtractorsParallel(extractorTasks);
} else {
  await runExtractors(extractorsToUse); // Existing sequential
}
```

### Phase 3 Testing

```bash
# Benchmark: Sequential vs Parallel
time just discover           # Note time
time just discover --parallel  # Compare

# Verify worker isolation
just discover --parallel 2>&1 | grep -E "Worker|✅|❌"

# Stress test with memory limits
NODE_OPTIONS="--max-old-space-size=512" just discover --parallel
# Should complete without OOM (each worker isolated)

# Verify output unchanged
just discover --parallel
git diff .claude/state/  # Should be empty
```

---

## PHASE 4: Advanced Optimizations (Week 4+)

### Task 4.1: Deduplicate overlapping globs

**Problem:** Components, Hooks, and CallGraph all scan `src/atomic-crm/**/*.tsx`

**File:** `scripts/discover/index.ts`

```typescript
// NEW: Single scan, partition by extractor needs
async function scanSourceFilesOnce(): Promise<Map<string, SourceFile[]>> {
  const project = createProject('scan');
  const allFiles = project.addSourceFilesAtPaths([
    'src/**/*.ts',
    'src/**/*.tsx',
  ]);

  // Partition files by what extractors need
  const partitions = new Map<string, SourceFile[]>();

  partitions.set('components', allFiles.filter(sf =>
    sf.getFilePath().endsWith('.tsx') &&
    !sf.getFilePath().includes('/hooks/')
  ));

  partitions.set('hooks', allFiles.filter(sf =>
    sf.getBaseName().startsWith('use')
  ));

  // ... etc for other extractors

  return partitions;
}
```

### Task 4.2: mtime-based hash cache

**File:** `scripts/discover/utils/output.ts`

```typescript
interface HashCache {
  [filePath: string]: {
    mtime: number;
    size: number;
    hash: string;
  };
}

const HASH_CACHE_PATH = '.claude/cache/source-hashes.json';

export async function buildSourceHashesCached(files: string[]): Promise<Record<string, string>> {
  let cache: HashCache = {};

  if (fs.existsSync(HASH_CACHE_PATH)) {
    cache = JSON.parse(fs.readFileSync(HASH_CACHE_PATH, 'utf-8'));
  }

  const hashes: Record<string, string> = {};
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const file of files) {
    const stats = fs.statSync(file);
    const cached = cache[file];

    if (cached && cached.mtime === stats.mtimeMs && cached.size === stats.size) {
      hashes[file] = cached.hash;
      cacheHits++;
    } else {
      const hash = hashFile(file);
      hashes[file] = hash;
      cache[file] = { mtime: stats.mtimeMs, size: stats.size, hash };
      cacheMisses++;
    }
  }

  // Write updated cache
  fs.mkdirSync(path.dirname(HASH_CACHE_PATH), { recursive: true });
  fs.writeFileSync(HASH_CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log(`📊 Hash cache: ${cacheHits} hits, ${cacheMisses} misses`);
  return hashes;
}
```

### Task 4.3: Package-based sharding for monorepos

**New File:** `scripts/discover/utils/packages.ts`

```typescript
import { glob } from 'fast-glob';
import path from 'path';

export interface PackageInfo {
  name: string;
  path: string;
  sourceGlobs: string[];
}

export async function detectPackages(): Promise<PackageInfo[]> {
  // Find all package.json files (monorepo detection)
  const packageJsons = await glob('**/package.json', {
    ignore: ['node_modules/**', '**/node_modules/**'],
  });

  if (packageJsons.length <= 1) {
    // Not a monorepo - use feature-based chunking
    return [{
      name: 'root',
      path: '.',
      sourceGlobs: ['src/**/*.ts', 'src/**/*.tsx'],
    }];
  }

  // Monorepo - create package per package.json
  return packageJsons.map(pkgJson => {
    const pkgDir = path.dirname(pkgJson);
    const pkgName = pkgDir.replace(/[\/\\]/g, '-') || 'root';

    return {
      name: pkgName,
      path: pkgDir,
      sourceGlobs: [`${pkgDir}/src/**/*.ts`, `${pkgDir}/src/**/*.tsx`],
    };
  });
}
```

---

## Files to Create/Modify Summary

| Phase | File | Action | Effort |
|-------|------|--------|--------|
| 1 | `scripts/discover/extractors/*.ts` (7 files) | Add try/finally with forget() | Low |
| 1 | `scripts/discover/utils/output.ts` | Add filterLargeFiles(), integrity hash | Low |
| 1 | `justfile` | Add discover-profile recipe | Trivial |
| 2 | `scripts/discover/utils/project.ts` | Replace singleton with factory | Medium |
| 2 | `scripts/discover/extractors/*.ts` (7 files) | Use factory instead of singleton | Medium |
| 2 | `scripts/discover/index.ts` | Update orchestration | Medium |
| 3 | `scripts/discover/extractor-worker.ts` | NEW - Worker script | High |
| 3 | `scripts/discover/worker-pool.ts` | NEW - Pool orchestrator | High |
| 3 | `scripts/discover/index.ts` | Add --parallel flag, SIGTERM handler | Medium |
| 3 | `package.json` | Add p-queue dependency | Trivial |
| 4 | `scripts/discover/utils/output.ts` | Add mtime cache | Medium |
| 4 | `scripts/discover/utils/packages.ts` | NEW - Monorepo detection | Medium |

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "p-queue": "^8.0.1"
  }
}
```

---

## Verification Checklist

### After Each Phase:
- [ ] `just discover` produces identical output (diff .claude/state/)
- [ ] `just discover --check` returns correct exit code
- [ ] `just discover --incremental` still works
- [ ] No TypeScript compilation errors
- [ ] Memory usage reduced (profile with --inspect)

### Final Acceptance:
- [ ] Extraction completes for 500K+ LOC test
- [ ] Peak memory < 2GB
- [ ] Full extraction < 5 minutes with parallel
- [ ] Incremental < 30 seconds for single file change

---

## References

- [ts-morph documentation](https://ts-morph.com/)
- [CVE-2025-36852 - CREEP vulnerability](https://nx.dev/blog/creep-vulnerability-build-cache-security)
- [Kilo Code codebase indexing](https://kilocode.ai/docs/features/codebase-indexing)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [p-queue - Promise concurrency control](https://github.com/sindresorhus/p-queue)
