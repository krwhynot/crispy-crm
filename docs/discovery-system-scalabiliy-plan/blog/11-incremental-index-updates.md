# Incremental Index Updates: Only Rebuild What Changed

You changed one file.

The indexer re-embeds 10,000 chunks.

Five minutes later, you have an updated index. One file different from before.

This is insanity.

A proper indexing system should notice that one file changed, update the chunks from that file, and leave everything else alone.

That is what we build today.

---

## The Full Rebuild Trap

Every code intelligence tutorial ends the same way.

"Run the indexer. Wait for it to finish. Now you can search."

They never mention what happens when you edit a file.

Run the indexer again. Wait again. The same files get parsed, embedded, and stored. The same chunks get inserted over the old ones. Minutes pass.

This works for toy projects. It falls apart at scale.

Our codebase has 485 components across hundreds of files. Full indexing takes 3-4 minutes. That is acceptable once. It is not acceptable after every code change.

The solution is incremental updates: detect what changed, update only those parts, leave the rest untouched.

Sounds simple. The devil is in the details.

---

## The Newspaper Archive Analogy

Imagine you run a newspaper archive.

Every day, you receive new articles. You need to index them so researchers can search.

**The naive approach:** Every day, re-index all articles from all newspapers from all time. Throw away yesterday's index. Build a fresh one.

This is obviously absurd. Nobody does this.

**The smart approach:** Keep track of what you have indexed. When new articles arrive, index only the new ones. When old articles get corrected, re-index only those. Leave everything else alone.

This requires bookkeeping. You need to know:
- What have we already indexed?
- What is new since last time?
- What changed since last time?
- What was deleted since last time?

A manifest answers all these questions.

---

## The Manifest: Your Index's Memory

A manifest is metadata about your index. It remembers what was indexed and when.

Here is ours:

```json
{
  "status": "complete",
  "generated_at": "2025-12-27T10:15:30Z",
  "generator": "discovery-embeddings@1.0.0",
  "source_globs": ["src/**/*.{ts,tsx}"],
  "source_hashes": {
    "src/components/ContactForm.tsx": "a1b2c3d4e5f6",
    "src/hooks/useContacts.ts": "7890abcdef12",
    "src/validation/contacts.ts": "deadbeef1234"
  },
  "chunks": {
    "contacts": {
      "file": "contacts.json",
      "source_files": [
        "src/atomic-crm/contacts/ContactList.tsx",
        "src/atomic-crm/contacts/ContactForm.tsx"
      ],
      "chunk_count": 47
    },
    "hooks": {
      "file": "hooks.json",
      "source_files": [
        "src/hooks/useContacts.ts",
        "src/hooks/useFormValidation.ts"
      ],
      "chunk_count": 23
    }
  },
  "summary": {
    "total_files": 127,
    "total_chunks": 892
  }
}
```

The key field is `source_hashes`.

Every source file gets a hash of its content. Same content, same hash. Change one character, completely different hash.

When we run incremental update:
1. Hash all current source files
2. Compare to manifest hashes
3. Identify what is new, modified, or deleted
4. Process only those files

The hash comparison is the core of incremental updates.

---

## Let's Build It: Hash Functions

First, we need reliable content hashing:

```typescript
// scripts/discover/utils/hashing.ts

import * as crypto from "node:crypto";
import * as fs from "node:fs";

export function hashContent(content: string): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 12);
}

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  return hashContent(content);
}

export function hashFiles(filePaths: string[]): Record<string, string> {
  const hashes: Record<string, string> = {};

  for (const filePath of filePaths) {
    try {
      hashes[filePath] = hashFile(filePath);
    } catch {
      // File might have been deleted between listing and hashing
      hashes[filePath] = "DELETED";
    }
  }

  return hashes;
}
```

We use SHA-256, truncated to 12 hex characters. That is 48 bits of entropy - enough to avoid collisions in any reasonable codebase.

Why truncate? Readability. Full SHA-256 is 64 characters. Twelve is easier to scan in logs.

---

## Let's Build It: Staleness Detection

Now we can detect what changed:

```typescript
// scripts/discover/utils/staleness.ts

import * as fs from "node:fs";
import { hashFile } from "./hashing";

interface Manifest {
  source_hashes: Record<string, string>;
  chunks: Record<string, { source_files: string[] }>;
}

interface StalenessReport {
  newFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  staleChunks: Set<string>;
  isStale: boolean;
}

export function detectStaleness(
  manifestPath: string,
  currentFiles: string[]
): StalenessReport {
  // No manifest? Everything is new
  if (!fs.existsSync(manifestPath)) {
    return {
      newFiles: currentFiles,
      modifiedFiles: [],
      deletedFiles: [],
      staleChunks: new Set(["_all"]),
      isStale: true,
    };
  }

  const manifest: Manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8")
  );

  const newFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const staleChunks = new Set<string>();

  // Check current files against manifest
  for (const file of currentFiles) {
    const currentHash = hashFile(file);
    const manifestHash = manifest.source_hashes[file];

    if (!manifestHash) {
      // File not in manifest - it is new
      newFiles.push(file);
      markChunkStale(manifest, file, staleChunks);
    } else if (currentHash !== manifestHash) {
      // Hash mismatch - file was modified
      modifiedFiles.push(file);
      markChunkStale(manifest, file, staleChunks);
    }
    // else: hash matches, file is unchanged
  }

  // Check for deleted files
  const currentFileSet = new Set(currentFiles);
  const deletedFiles: string[] = [];

  for (const file of Object.keys(manifest.source_hashes)) {
    if (!currentFileSet.has(file)) {
      deletedFiles.push(file);
      markChunkStale(manifest, file, staleChunks);
    }
  }

  return {
    newFiles,
    modifiedFiles,
    deletedFiles,
    staleChunks,
    isStale: newFiles.length > 0 || modifiedFiles.length > 0 || deletedFiles.length > 0,
  };
}

function markChunkStale(
  manifest: Manifest,
  filePath: string,
  staleChunks: Set<string>
): void {
  for (const [chunkName, chunkInfo] of Object.entries(manifest.chunks)) {
    if (chunkInfo.source_files.includes(filePath)) {
      staleChunks.add(chunkName);
    }
  }
}
```

This gives us exactly what we need:
- **newFiles**: Files that did not exist before
- **modifiedFiles**: Files with changed content
- **deletedFiles**: Files that were removed
- **staleChunks**: Which chunks need re-indexing

---

## Let's Build It: Partial Re-indexing

With staleness detection working, we can rebuild only what changed:

```typescript
// scripts/discover/incremental-index.ts

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import { detectStaleness } from "./utils/staleness";
import { hashFiles } from "./utils/hashing";
import { extractChunks } from "./chunker";
import { generateEmbedding } from "./embeddings/ollama";
import * as lancedb from "@lancedb/lancedb";

const DB_PATH = ".claude/vectordb";
const MANIFEST_PATH = ".claude/state/embeddings-manifest.json";

async function incrementalIndex(sourceDir: string) {
  // Find all source files
  const files = await glob(`${sourceDir}/**/*.{ts,tsx}`, {
    ignore: ["**/node_modules/**", "**/*.d.ts"],
  });

  console.log(`Found ${files.length} source files`);

  // Detect what changed
  const staleness = detectStaleness(MANIFEST_PATH, files);

  if (!staleness.isStale) {
    console.log("Index is up-to-date. Nothing to do.");
    return;
  }

  console.log(`Changes detected:`);
  console.log(`  New files: ${staleness.newFiles.length}`);
  console.log(`  Modified files: ${staleness.modifiedFiles.length}`);
  console.log(`  Deleted files: ${staleness.deletedFiles.length}`);

  // Open the vector database
  const db = await lancedb.connect(DB_PATH);
  let table: lancedb.Table;

  try {
    table = await db.openTable("code_chunks");
  } catch {
    // Table does not exist - will create with first insert
    table = null as any;
  }

  // Handle deleted files: remove their chunks from the index
  for (const deletedFile of staleness.deletedFiles) {
    if (table) {
      await table.delete(`filePath = "${deletedFile}"`);
      console.log(`  Removed chunks from: ${deletedFile}`);
    }
  }

  // Handle new and modified files: re-index them
  const filesToProcess = [...staleness.newFiles, ...staleness.modifiedFiles];

  for (const filePath of filesToProcess) {
    // Remove old chunks for this file (if modified)
    if (table && staleness.modifiedFiles.includes(filePath)) {
      await table.delete(`filePath = "${filePath}"`);
    }

    // Read and chunk the file
    const content = await fs.readFile(filePath, "utf-8");
    const chunks = extractChunks(content);

    if (chunks.length === 0) continue;

    // Generate embeddings for each chunk
    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = await generateEmbedding(chunk.content);

      rows.push({
        id: `${filePath}:${i}`,
        filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content.slice(0, 1000),
        vector,
      });
    }

    // Insert new chunks
    if (!table) {
      table = await db.createTable("code_chunks", rows);
    } else {
      await table.add(rows);
    }

    console.log(`  Indexed ${rows.length} chunks from: ${filePath}`);
  }

  // Update manifest with new hashes
  const newHashes = hashFiles(files);
  const manifest = {
    status: "complete",
    generated_at: new Date().toISOString(),
    generator: "incremental-indexer",
    source_hashes: newHashes,
    summary: {
      total_files: files.length,
      processed_this_run: filesToProcess.length,
    },
  };

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`Incremental index complete.`);
  console.log(`  Processed: ${filesToProcess.length} files`);
  console.log(`  Skipped: ${files.length - filesToProcess.length} unchanged files`);
}

// Run it
incrementalIndex("./src");
```

The flow:
1. Hash all current source files
2. Compare to manifest to find changes
3. Delete chunks for deleted/modified files
4. Re-index new/modified files
5. Update manifest with new hashes

Files that did not change? Never touched. Their chunks stay in the database. Their embeddings stay valid.

---

## Deep Dive: Chunk-Level vs. File-Level Tracking

We track staleness at the file level. But we store chunks in the database.

One file might produce 10 chunks. When the file changes, all 10 chunks might need updating. Or maybe only 2 of them changed.

Should we track staleness at the chunk level?

**Argument for chunk-level:** More precise. If only one function in a file changed, only re-embed that function.

**Argument for file-level:** Simpler. Chunk boundaries might shift when code changes. A modified function might now span different lines, affecting neighboring chunks.

We chose file-level for pragmatic reasons:
- Simpler implementation
- Fewer edge cases
- Embedding is fast enough that re-doing a few extra chunks is fine
- Chunk boundary stability is hard to guarantee

For very large files (1000+ lines), you might want chunk-level tracking. For typical files (50-200 lines), file-level is sufficient.

---

## Deep Dive: The Manifest Merge Problem

Incremental updates create a subtle problem.

**Scenario:**
1. Developer A runs incremental update. Modifies ContactForm.tsx.
2. Developer B runs incremental update. Modifies ContactList.tsx.
3. Both push to main.
4. CI runs... which manifest wins?

If A's manifest overwrites B's, we lose track of B's changes. If B's overwrites A's, we lose A's.

**Solution 1: Full manifest on every update**

Always write the complete manifest, not a partial one. Re-hash all files, not just changed ones.

This is what our code does. The manifest always reflects the full state.

**Solution 2: Manifest merge in CI**

CI generates a fresh manifest from scratch. It does not rely on developers' local manifests.

```yaml
# .github/workflows/ci.yml
- name: Regenerate Discovery Index
  run: just discover  # Full, not incremental
```

In CI, always do full indexing. Incremental is for local development speed.

**Solution 3: Lock file for concurrent updates**

If multiple processes might index simultaneously, use a lock file:

```typescript
import { lockfile } from "proper-lockfile";

async function withIndexLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = await lockfile.lock(MANIFEST_PATH, { retries: 5 });
  try {
    return await fn();
  } finally {
    await release();
  }
}

await withIndexLock(async () => {
  await incrementalIndex("./src");
});
```

This prevents concurrent updates from corrupting the manifest.

---

## CI Integration: Freshness Checks

CI should not blindly trust the committed index. It should verify freshness.

Add a staleness check to your CI pipeline:

```typescript
// scripts/discover/check-freshness.ts

import { detectStaleness } from "./utils/staleness";
import { glob } from "glob";

async function checkFreshness() {
  const files = await glob("src/**/*.{ts,tsx}", {
    ignore: ["**/node_modules/**", "**/*.d.ts"],
  });

  const staleness = detectStaleness(".claude/state/embeddings-manifest.json", files);

  if (staleness.isStale) {
    console.error("ERROR: Discovery index is stale!");
    console.error(`  New files: ${staleness.newFiles.length}`);
    console.error(`  Modified files: ${staleness.modifiedFiles.length}`);
    console.error(`  Deleted files: ${staleness.deletedFiles.length}`);
    console.error("\nRun 'just discover' to update the index.");
    process.exit(1);
  }

  console.log("Discovery index is fresh.");
  process.exit(0);
}

checkFreshness();
```

GitHub Actions integration:

```yaml
# .github/workflows/ci.yml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - run: npm ci

      - name: Check Discovery Freshness
        run: npx tsx scripts/discover/check-freshness.ts
```

If someone commits code changes without updating the index, CI fails. The error message tells them exactly what to do.

This is the enforcement mechanism that keeps the index trustworthy.

---

## Watch Out For

Incremental indexing has edge cases. Here is what will bite you.

### Race Conditions During File Operations

You list files at time T. You hash them at time T+1. Between those times, a file gets deleted.

```typescript
// This can throw ENOENT
const files = await glob("src/**/*.ts");
for (const file of files) {
  const hash = hashFile(file);  // File might be gone!
}
```

Always handle missing files gracefully:

```typescript
function hashFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return hashContent(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;  // File was deleted
    }
    throw err;
  }
}
```

### Manifest Corruption

If the indexer crashes mid-write, the manifest might be incomplete or invalid JSON.

Always write atomically:

```typescript
async function writeManifest(manifest: object, path: string) {
  const tempPath = `${path}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(manifest, null, 2));
  await fs.rename(tempPath, path);  // Atomic on POSIX
}
```

Write to a temp file, then rename. Rename is atomic on most filesystems.

### Hash Collisions

Our 12-character hash has 48 bits. Collision probability is low but not zero.

For 10,000 files, collision probability is about 1 in 10 billion per check. Acceptable.

For 1 million files, it rises to 1 in 1 million. Still fine for most purposes.

If you are paranoid, use the full 64-character hash. Or store both hash and file size.

### Timestamp vs. Hash

Why not just use file modification timestamps?

```typescript
// Tempting but wrong
if (fs.statSync(file).mtime > lastIndexTime) {
  // File is stale
}
```

Problems with timestamps:
- Git clone resets all timestamps to now
- Build tools may touch files without changing content
- Time sync issues between machines
- Daylight saving time bugs

Hashes are content-based. Same content, same hash, regardless of when the file was touched or by whom.

Always use content hashes for staleness detection.

### Embedding Model Changes

You index with nomic-embed-text v1.0. Later you upgrade to v1.5.

Old embeddings are incompatible with new embeddings. Your index is corrupt - old vectors and new vectors in the same space.

Track the embedding model version in your manifest:

```json
{
  "embedding_model": "nomic-embed-text:v1.5",
  "source_hashes": { ... }
}
```

If the model version changes, require full re-index:

```typescript
if (manifest.embedding_model !== CURRENT_MODEL) {
  console.log("Embedding model changed. Full re-index required.");
  return { requiresFullRebuild: true };
}
```

---

## Performance Numbers

Real numbers from our incremental indexer:

| Scenario | Full Index | Incremental |
|----------|-----------|-------------|
| 127 files, first run | 3m 42s | N/A |
| 0 files changed | 3m 42s | 1.2s |
| 1 file changed | 3m 42s | 4.8s |
| 10 files changed | 3m 42s | 18s |
| 50 files changed | 3m 42s | 52s |

For typical development (1-5 file changes), incremental is 40-100x faster.

The break-even point is around 30% of files changing. Beyond that, full rebuild is competitive.

---

## Justfile Recipes

Add these to your justfile:

```makefile
# Full discovery (all files)
discover:
    npx tsx scripts/discover/full-index.ts

# Incremental discovery (changed files only)
discover-incr:
    npx tsx scripts/discover/incremental-index.ts

# Check if index is fresh
discover-check:
    npx tsx scripts/discover/check-freshness.ts

# Force full rebuild (clear manifest)
discover-rebuild:
    rm -f .claude/state/embeddings-manifest.json
    just discover
```

Daily workflow:

```bash
# After editing code
just discover-incr    # Fast - only changed files

# Before committing
just discover-check   # Verify freshness

# If something seems wrong
just discover-rebuild # Nuclear option
```

---

## What's Next

We have all the pieces now.

- SCIP for structural code intelligence
- Tree-sitter for smart chunking
- LanceDB for serverless vector storage
- Ollama for local embeddings
- FastMCP for Claude Code integration
- Incremental indexing for fast updates

The final article brings it all together. We will show the complete architecture, share performance numbers, calculate cost savings, and discuss where to go from here.

This is the capstone. Everything we built, working as one system.

---

## Quick Reference

### Staleness Detection

```typescript
const staleness = detectStaleness(manifestPath, currentFiles);

if (staleness.isStale) {
  console.log("New:", staleness.newFiles);
  console.log("Modified:", staleness.modifiedFiles);
  console.log("Deleted:", staleness.deletedFiles);
}
```

### Manifest Structure

```json
{
  "status": "complete",
  "generated_at": "2025-12-27T10:15:30Z",
  "embedding_model": "nomic-embed-text",
  "source_hashes": {
    "src/file.ts": "a1b2c3d4e5f6"
  }
}
```

### Incremental Update Flow

1. Hash current source files
2. Compare to manifest hashes
3. Identify new/modified/deleted files
4. Delete chunks for deleted/modified files
5. Re-index new/modified files
6. Update manifest

### CI Check

```yaml
- name: Check Discovery Freshness
  run: npx tsx scripts/discover/check-freshness.ts
```

### Why Hashes Beat Timestamps

- Git clone resets all timestamps
- Build tools touch files without changing content
- Time sync issues between machines
- Content-based = deterministic

---

*This is part 11 of a 12-part series on building local code intelligence.*
