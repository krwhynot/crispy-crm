# Incremental Index Updates: Only Rebuild What Changed

You changed one file.

The indexer re-processes 10,000 chunks.

Five minutes later, you have an updated index. One file different from before.

That is insanity.

---

## The Full Rebuild Trap

Every code intelligence tutorial ends the same way.

"Run the indexer. Wait for it to finish. Now you can search."

They never mention what happens after you edit a file.

Run the indexer again. Wait again. The same files get parsed, embedded, and stored. Minutes pass.

This is like reprinting an entire phone book because one person moved.

The solution? Incremental updates.

An incremental update detects what changed, processes only those parts, and leaves everything else untouched.

Sounds simple. The devil is in the details.

---

## The Newspaper Archive

Imagine you run a newspaper archive.

Every day, new articles arrive. You need to index them for researchers.

**The naive approach:** Re-index all articles from all newspapers from all time. Every single day.

Nobody does this.

**The smart approach:** Track what you have already indexed. When new articles arrive, index only those. When old articles get corrected, re-index only those. Leave everything else alone.

This requires bookkeeping. You need to know what exists now versus what existed before.

A manifest solves this.

---

## The Manifest: Your Index's Memory

A manifest is metadata about your index. It is a record of what was indexed and when.

Think of it as the index's memory.

Here is ours:

```json
{
  "status": "complete",
  "generated_at": "2025-12-27T10:15:30Z",
  "source_hashes": {
    "src/ContactForm.tsx": "a1b2c3d4e5f6",
    "src/useContacts.ts": "7890abcdef12"
  },
  "summary": {
    "total_files": 127,
    "total_chunks": 892
  }
}
```

The key field is `source_hashes`.

A hash is a fingerprint of file content. Same content, same hash. Change one character, completely different hash.

It is like a wax seal on a letter. Break the seal, and you know someone opened it.

---

## Staleness Detection

Staleness means the index no longer reflects reality. A file changed, but the index does not know.

Detecting staleness is simple:

1. Hash all current source files
2. Compare to manifest hashes
3. Different hash? The file changed
4. Missing from manifest? New file
5. In manifest but missing from disk? Deleted file

That is it.

No parsing. No reading file contents beyond hashing. Just compare fingerprints.

Files with matching hashes? Skip them entirely. Their chunks are still valid.

---

## Building the Hash Function

We need reliable content hashing:

```typescript
import * as crypto from "node:crypto";
import * as fs from "node:fs";

function hashContent(content: string): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 12);
}
```

We use SHA-256, truncated to 12 hex characters. That is 48 bits of entropy.

Why truncate? Readability. Full SHA-256 is 64 characters. Twelve is easier to scan in logs.

Collision risk at this length is about 1 in 10 billion for 10,000 files. Acceptable.

---

## Building the Staleness Detector

Now we can detect what changed:

```typescript
interface StalenessReport {
  newFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  isStale: boolean;
}

function detectStaleness(
  manifestHashes: Record<string, string>,
  currentFiles: string[]
): StalenessReport {
  const newFiles: string[] = [];
  const modifiedFiles: string[] = [];

  for (const file of currentFiles) {
    const currentHash = hashFile(file);
    const manifestHash = manifestHashes[file];

    if (!manifestHash) newFiles.push(file);
    else if (currentHash !== manifestHash) modifiedFiles.push(file);
  }

  const currentSet = new Set(currentFiles);
  const deletedFiles = Object.keys(manifestHashes)
    .filter(f => !currentSet.has(f));

  return { newFiles, modifiedFiles, deletedFiles,
    isStale: newFiles.length + modifiedFiles.length + deletedFiles.length > 0 };
}
```

Three categories. New, modified, deleted.

Each one needs different handling.

---

## The Incremental Update Flow

With staleness detection working, the update flow is straightforward:

1. **Deleted files:** Remove their chunks from the database
2. **Modified files:** Delete old chunks, then re-index
3. **New files:** Index them fresh
4. **Unchanged files:** Do nothing

It is like editing a document. You do not retype unchanged paragraphs.

Here is the core logic:

```typescript
async function incrementalIndex(files: string[]) {
  const staleness = detectStaleness(manifest.source_hashes, files);

  if (!staleness.isStale) {
    console.log("Index is up-to-date.");
    return;
  }

  // Remove chunks for deleted/modified files
  for (const file of [...staleness.deletedFiles, ...staleness.modifiedFiles]) {
    await table.delete(`filePath = "${file}"`);
  }

  // Re-index new and modified files
  for (const file of [...staleness.newFiles, ...staleness.modifiedFiles]) {
    const chunks = await extractAndEmbed(file);
    await table.add(chunks);
  }

  // Update manifest with new hashes
  await writeManifest(hashFiles(files));
}
```

Files that did not change? Never touched. Their chunks stay. Their embeddings stay valid.

---

## File-Level vs. Chunk-Level Tracking

Here is a choice you will face.

We track staleness at the file level. One file produces multiple chunks. When the file changes, we re-index all its chunks.

Why not track individual chunks?

**Argument for chunk-level:** More precise. If only one function changed, re-embed only that function.

**Argument for file-level:** Simpler. Chunk boundaries shift when code changes. A modified function might now span different lines, affecting neighboring chunks.

We chose file-level.

Embedding is fast enough that re-doing a few extra chunks does not matter. Chunk boundary stability is hard to guarantee.

For 50-200 line files, file-level is sufficient. For 1000+ line files, you might reconsider.

---

## Why Hashes Beat Timestamps

You might think: just use file modification timestamps.

```typescript
// Tempting but wrong
if (file.mtime > lastIndexTime) {
  // Stale
}
```

Do not do this.

Problems with timestamps:
- Git clone resets all timestamps to now
- Build tools touch files without changing content
- Time sync issues between machines
- Daylight saving time bugs

Hashes are content-based. Same content, same hash. Period.

It is like comparing DNA instead of birthdays. DNA does not lie.

---

## Atomic Writes

If the indexer crashes mid-write, the manifest might be incomplete.

Invalid JSON. Missing entries. Corrupted state.

Always write atomically:

```typescript
async function writeManifest(manifest: object, path: string) {
  const tempPath = `${path}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(manifest, null, 2));
  await fs.rename(tempPath, path);
}
```

Write to a temp file. Then rename.

Rename is atomic on POSIX filesystems. Either the old file exists or the new one does. Never a partial state.

It is like swapping license plates in one motion. The car is never without a plate.

---

## Embedding Model Changes

You index with nomic-embed-text v1.0. Later you upgrade to v1.5.

Old embeddings are incompatible with new embeddings.

Your index is corrupt. Old vectors and new vectors in the same space. Searches return garbage.

Track the model version in your manifest:

```json
{
  "embedding_model": "nomic-embed-text:v1.5",
  "source_hashes": { ... }
}
```

If the model changes, force a full rebuild. No exceptions.

It is like mixing metric and imperial parts. The assembly looks right but nothing fits.

---

## Race Conditions

You list files at time T. You hash them at time T+1.

Between those times, a file gets deleted.

Your hash function throws ENOENT. Your indexer crashes.

Always handle missing files:

```typescript
function hashFile(filePath: string): string | null {
  try {
    return hashContent(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
```

Files disappear. Code must handle it.

---

## CI Integration

CI should not blindly trust the committed index. It should verify freshness.

```typescript
async function checkFreshness() {
  const files = await glob("src/**/*.{ts,tsx}");
  const staleness = detectStaleness(manifest.source_hashes, files);

  if (staleness.isStale) {
    console.error("Index is stale! Run 'just discover'");
    process.exit(1);
  }

  console.log("Index is fresh.");
}
```

Add this to your CI pipeline.

If someone commits code changes without updating the index, CI fails. The error tells them exactly what to do.

This is your enforcement mechanism. It keeps the index trustworthy.

---

## The Manifest Merge Problem

Incremental updates create a subtle issue with teams.

Developer A runs incremental update. Modifies ContactForm.tsx.

Developer B runs incremental update. Modifies ContactList.tsx.

Both push to main.

Which manifest wins?

**Solution:** In CI, always do full indexing. Incremental is for local development speed only.

```yaml
- name: Regenerate Index
  run: just discover  # Full, not incremental
```

Local manifests are ephemeral. CI manifests are authoritative.

It is like local notes versus official meeting minutes. Both useful. Different purposes.

---

## Performance Numbers

Real numbers from our incremental indexer:

| Scenario | Full Index | Incremental |
|----------|-----------|-------------|
| First run (127 files) | 3m 42s | N/A |
| 0 files changed | 3m 42s | 1.2s |
| 1 file changed | 3m 42s | 4.8s |
| 10 files changed | 3m 42s | 18s |

For typical development, incremental is 40-100x faster.

The break-even point is around 30% of files changing. Beyond that, full rebuild is competitive.

---

## Daily Workflow

```bash
# After editing code
just discover-incr    # Fast - only changed files

# Before committing
just discover-check   # Verify freshness

# If something seems wrong
just discover-rebuild # Nuclear option
```

Incremental for speed. Check for safety. Rebuild for recovery.

That is the rhythm.

---

## What's Next

We have all the pieces now.

SCIP for structural intelligence. Tree-sitter for smart chunking. LanceDB for vector storage. Ollama for local embeddings. FastMCP for Claude Code integration. Incremental indexing for fast updates.

The final article brings it together.

Complete architecture. Performance numbers. Cost savings. Where to go from here.

Everything we built, working as one system.

---

## Quick Reference

**Staleness Detection:**
```typescript
const staleness = detectStaleness(manifest.source_hashes, currentFiles);
if (staleness.isStale) {
  // Process newFiles, modifiedFiles, deletedFiles
}
```

**Why Hashes Beat Timestamps:**
- Git clone resets timestamps
- Build tools touch files without changing content
- Content-based is deterministic

**Incremental Flow:**
1. Hash current files
2. Compare to manifest
3. Delete chunks for deleted/modified files
4. Re-index new/modified files
5. Update manifest

**CI Rule:** Always full index in CI. Incremental is for local only.

---

*Part 11 of 12: Building Local Code Intelligence*
