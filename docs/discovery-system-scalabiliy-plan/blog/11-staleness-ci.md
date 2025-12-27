# Keeping It Fresh: Staleness Detection and CI

Your index is useless if it's out of date.

Think about it. You spent all that time building a beautiful code index. Components, hooks, schemas, call graphs. All pre-computed and ready to serve your AI assistant in milliseconds.

Then someone changes a file. Now your index says `ContactForm.tsx` has three props when it actually has five. Your AI reads the stale data, gives bad advice, and you spend an hour debugging a problem that doesn't exist.

An outdated index is worse than no index at all.

---

## The Forgotten Update Problem

Here's what always happens.

Someone sets up a discovery system. It works great. Everyone's excited.

"Just remember to regenerate the index when you change things," they say.

Three days later, nobody remembers.

Six months later, the index is so stale that it actively misleads anyone who trusts it. Half the components it lists have been deleted. The schemas it describes have completely different shapes.

Manual regeneration is a fantasy. Developers forget. They're busy. They don't see immediate consequences from stale data.

The only reliable way to keep an index fresh is to make staleness detection automatic. Part of CI. A gate that blocks merges when the index drifts.

If it's not enforced, it won't happen.

---

## The Milk Expiration Analogy

You wouldn't drink milk without checking the expiration date.

Well, you might. Once. The consequences teach you not to do it again.

But here's the thing about milk: it has an expiration date printed right on the carton. You don't have to open it and sniff. You don't have to track when you bought it. The information is right there.

Code indexes need the same thing.

Every index file should carry its own expiration metadata. Not a date, exactly. But enough information to determine: "Has the source changed since this index was generated?"

When you want to use the index, you check first. If it's fresh, proceed. If it's stale, regenerate or fail loudly.

No sniffing required.

---

## Hash-Based Detection

So how do you know if something changed?

The naive approach: check file modification times.

The file was last modified at 3:47pm. The index was generated at 4:15pm. The index must be fresh, right?

Wrong. And we'll explain why in detail later. For now, trust me: timestamps lie.

The reliable approach: content hashes.

A hash is a fingerprint of a file's contents. Change one character, and the hash changes completely. The same content always produces the same hash.

Here's the insight that makes staleness detection work:

1. When you generate the index, hash every source file
2. Store those hashes alongside the index
3. Before using the index, hash the source files again
4. Compare. If any hash differs, the index is stale

This is foolproof. You can move files around. You can copy them between machines. You can restore from backup. As long as the content matches, the hash matches.

No false positives. No false negatives. Just math.

---

## Let's Build It: Staleness Check

Time to write some code.

We need three pieces: a way to hash files, a way to store hashes, and a way to compare them.

### The Hash Function

First, let's hash a single file:

```typescript
// scripts/discover/utils/staleness.ts

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 12);
}
```

We're using SHA-256, the same algorithm that secures Bitcoin. Overkill? Maybe. But it's fast, reliable, and built into Node.js.

The `.slice(0, 12)` at the end keeps hashes short. Twelve hex characters is 48 bits of entropy. The odds of a collision are one in 281 trillion. Good enough for our purposes.

### Building the Hash Map

Now let's hash all source files at once:

```typescript
export function buildSourceHashes(
  filePaths: string[]
): Record<string, string> {
  const hashes: Record<string, string> = {};
  const cwd = process.cwd();

  for (const filePath of filePaths) {
    const relativePath = path.relative(cwd, filePath);
    try {
      hashes[relativePath] = hashFile(filePath);
    } catch {
      // File might have been deleted between scan and hash
      hashes[relativePath] = 'MISSING';
    }
  }

  return hashes;
}
```

This returns an object mapping file paths to their hashes:

```json
{
  "src/components/ContactForm.tsx": "a1b2c3d4e5f6",
  "src/hooks/useContacts.ts": "7890abcdef12",
  "src/validation/contacts.ts": "deadbeef1234"
}
```

### Storing Hashes in the Index

When we generate the index, we store these hashes:

```typescript
export interface DiscoveryManifest {
  status: 'complete' | 'error';
  generated_at: string;
  generator: string;
  source_globs: string[];
  source_hashes: Record<string, string>;  // <-- This is the key
  summary: Record<string, number>;
  // ... actual index data
}
```

Every manifest includes `source_hashes`. This is our expiration date.

### The Staleness Checker

Now the actual detection logic:

```typescript
export interface StalenessResult {
  stale: boolean;
  reason?: string;
  changedFiles?: string[];
}

export function isDiscoveryStale(
  manifestPath: string,
  currentSourceFiles: string[]
): StalenessResult {
  // No manifest? Definitely stale
  if (!fs.existsSync(manifestPath)) {
    return {
      stale: true,
      reason: 'Manifest file does not exist'
    };
  }

  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf-8')
  ) as DiscoveryManifest;

  const currentHashes = buildSourceHashes(currentSourceFiles);
  const changedFiles: string[] = [];

  // Check for new or modified files
  for (const [file, hash] of Object.entries(currentHashes)) {
    if (!manifest.source_hashes[file]) {
      changedFiles.push(`+ ${file} (new)`);
    } else if (manifest.source_hashes[file] !== hash) {
      changedFiles.push(`~ ${file} (modified)`);
    }
  }

  // Check for deleted files
  for (const file of Object.keys(manifest.source_hashes)) {
    if (!currentHashes[file]) {
      changedFiles.push(`- ${file} (deleted)`);
    }
  }

  if (changedFiles.length > 0) {
    return {
      stale: true,
      reason: `${changedFiles.length} file(s) changed`,
      changedFiles,
    };
  }

  return { stale: false };
}
```

This function does three comparisons:

1. **New files**: In current sources but not in manifest hashes
2. **Modified files**: Hash differs between manifest and current
3. **Deleted files**: In manifest hashes but not in current sources

Any of these means the index is stale.

### Putting It All Together

The CLI entry point ties everything together:

```typescript
// scripts/discover/check-staleness.ts

import chalk from 'chalk';

async function main() {
  const extractors = [
    { name: 'Components', dir: 'component-inventory' },
    { name: 'Hooks', dir: 'hooks-inventory' },
    { name: 'Schemas', dir: 'schemas-inventory' },
    // ... more extractors
  ];

  console.log(chalk.cyan.bold('\n  Checking discovery file staleness...\n'));

  let hasStale = false;

  for (const extractor of extractors) {
    const manifestPath = `.claude/state/${extractor.dir}/manifest.json`;
    const sourceFiles = getSourceFilesForExtractor(extractor);
    const result = isDiscoveryStale(manifestPath, sourceFiles);

    if (result.stale) {
      hasStale = true;
      console.log(chalk.red(`  ${extractor.name}: STALE`));
      console.log(chalk.gray(`    Reason: ${result.reason}`));

      // Show first few changed files
      const display = result.changedFiles?.slice(0, 5) || [];
      display.forEach(file => console.log(chalk.gray(`      ${file}`)));

      if ((result.changedFiles?.length || 0) > 5) {
        console.log(chalk.gray(
          `      ... and ${result.changedFiles!.length - 5} more`
        ));
      }
    } else {
      console.log(chalk.green(`  ${extractor.name}: Fresh`));
    }
  }

  if (hasStale) {
    console.log(chalk.yellow(
      '\nDiscovery files need regeneration. Run `just discover` to update.'
    ));
    process.exit(1);  // Non-zero exit code = CI failure
  }

  console.log(chalk.green('\nAll discovery files are up-to-date!'));
  process.exit(0);
}
```

Run it with:

```bash
npx tsx scripts/discover/index.ts --check
```

The `--check` flag runs staleness detection without regenerating anything.

---

## Let's Build It: GitHub Actions

Detection is useless unless it runs automatically.

We need a CI job that:
1. Runs on every push and pull request
2. Checks if the index is stale
3. Blocks the merge if it is

Here's the GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, Type Check & Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

      - name: Discovery Freshness Check
        run: npx tsx scripts/discover/index.ts --check

      - name: Build
        run: npm run build
```

The `Discovery Freshness Check` step is the key.

If any discovery files are stale, this step exits with code 1. GitHub Actions interprets that as a failure. The PR gets a red X. The merge button stays gray.

No stale indexes in main. Ever.

### What Happens When It Fails

When a developer pushes code that changes source files without regenerating the index, they see this:

```
  Checking discovery file staleness...

  Components: STALE
    Reason: 2 file(s) changed
      + src/atomic-crm/contacts/ContactCard.tsx (new)
      ~ src/atomic-crm/contacts/ContactList.tsx (modified)
  Hooks: Fresh
  Schemas: Fresh

Discovery files need regeneration. Run `just discover` to update.

Error: Process completed with exit code 1.
```

The fix is simple:

```bash
just discover
git add .claude/state/
git commit --amend --no-edit
git push --force-with-lease
```

Regenerate, commit the updated index, push again.

Some teams automate even this step. A pre-commit hook that runs `just discover` before every commit. Or a bot that regenerates and commits automatically when CI fails.

But honestly? Explicit regeneration is fine. The friction is small, and it forces developers to understand what's happening.

---

## Deep Dive: Hashes vs. Timestamps

Earlier I said timestamps lie. Let me explain.

Consider file modification time (mtime). It records when the file was last written.

Here's problem one: **git doesn't preserve mtime**.

When you clone a repository, every file gets the current timestamp. To git, it's a brand new file creation. The actual modification history is lost.

This means: two developers clone the same repo at different times. They have identical file contents. But completely different mtimes. Your staleness check would think one index is fresh and the other is stale.

Here's problem two: **build tools reset mtime**.

Many build tools (webpack, esbuild, vite) write identical output files on every build. The content is the same, but the mtime updates. Your staleness check sees "changed" files that haven't actually changed.

Now you're regenerating the index on every build. That defeats the purpose.

Here's problem three: **time synchronization**.

Distributed systems are hard. Clocks drift. CI runners have different wall-clock times than developer machines. NTP hiccups happen.

Your index was generated at 10:00:00.000 UTC. The file was modified at 10:00:00.001 UTC. Or was it 09:59:59.999? Depends on whose clock you trust.

Millisecond precision matters when you're asking "which came first?"

Content hashes sidestep all of this.

A hash doesn't care when the file was modified. It doesn't care who modified it. It doesn't care which machine it's on.

Same content = same hash. Different content = different hash.

No ambiguity. No edge cases. No race conditions.

The downside? Hashing takes time.

Reading every source file and computing SHA-256 adds overhead. For small projects (under 1000 files), it's negligible. For very large projects, it can add seconds to every CI run.

But compare that to the cost of debugging issues caused by stale data. Or the cost of regenerating the index when it didn't need regenerating.

Hashes win.

---

## Watch Out For

This staleness detection system has edge cases you need to understand.

### New Files

When someone adds a new file, the staleness checker notices immediately.

The file appears in the current source list but not in the manifest's `source_hashes`. That's an easy diff: new file = stale index.

But here's the subtle part: which chunk does the new file belong to?

If you're using chunked output (and you should be, for large projects), you need to map new files to chunks. Our system uses path-based rules:

```typescript
function getChunkNameForFile(filePath: string): string {
  // src/atomic-crm/<feature>/... → "feature" chunk
  const match = relativePath.match(/^src\/atomic-crm\/([^/]+)\//);
  return match ? match[1] : '_root';
}
```

A new file at `src/atomic-crm/contacts/NewComponent.tsx` joins the `contacts` chunk.

A new file at `src/atomic-crm/new-feature/SomeComponent.tsx` creates a *new* `new-feature` chunk. That requires full regeneration, not incremental update.

The staleness checker handles this:

```typescript
if (!allChunkNames.has(chunkName)) {
  // New chunk needed - require full regeneration
  return {
    requiresFullRegen: true,
    fullRegenReason: 'New chunks needed - run full discovery',
  };
}
```

When you add a new feature directory, expect full regeneration. That's correct behavior.

### Modified Files

Modified files are the common case.

The hash changes. The staleness checker identifies which chunks contain that file. Those chunks get marked stale.

With incremental updates, only stale chunks regenerate. Fresh chunks stay on disk untouched.

```
  Zod Schemas: Updating 1 of 18 chunks
     contacts: Modified: src/atomic-crm/validation/contacts.ts
  Incremental update: schemas-inventory/ (1 chunk updated, 18 total)
```

One file change = one chunk update. Not a full regeneration.

This is why we store per-chunk source hashes in the manifest. Each chunk knows exactly which files contributed to it. Change tracking happens at the chunk level.

### Deleted Files

Deleted files are trickier than you'd expect.

The file is gone from disk. It exists in the manifest's `source_hashes` but not in the current file list.

That's straightforward to detect:

```typescript
for (const file of Object.keys(manifest.source_hashes)) {
  if (!currentHashes[file]) {
    changedFiles.push(`- ${file} (deleted)`);
  }
}
```

But here's the gotcha: what about chunks that become *empty*?

If you delete every file in a feature directory, that chunk should be removed entirely. Not just updated to have zero items.

```typescript
// Handle chunks that should be removed (all source files deleted)
for (const [chunkName, chunkInfo] of chunkInfoMap) {
  if (!currentChunkNames.has(chunkName)) {
    // Remove orphaned chunk file
    const chunkPath = path.join(outputDir, chunkInfo.file);
    if (fs.existsSync(chunkPath)) {
      fs.unlinkSync(chunkPath);
      console.log(`  Removed empty chunk: ${chunkName}`);
    }
    chunkInfoMap.delete(chunkName);
  }
}
```

The manifest shrinks. The chunk file gets deleted. Everything stays consistent.

### The Race Condition Nobody Thinks About

Here's one that bites people in production.

Developer A pushes code that modifies `ContactForm.tsx`. Developer B pushes code that modifies `ContactList.tsx`. Both run CI in parallel.

Developer A's CI regenerates the index. It includes their change to `ContactForm.tsx`.

Developer B's CI regenerates the index. It includes their change to `ContactList.tsx`.

Both CI runs pass. Both indexes are "fresh" according to their respective views of the world.

But when B's branch merges after A's, the index in main only has B's changes. A's changes are lost.

The fix: regenerate the index based on merged code, not branch code.

Some teams run a "post-merge" job that regenerates and commits the index after every merge to main. Others use a "merge queue" that serializes merges and runs final validation.

For most projects, this is overkill. The problem only manifests when multiple PRs touch the same source files and merge in quick succession. And the consequence is merely a brief window of staleness.

But if you're running a high-frequency merge environment with strict freshness requirements, think about it.

---

## What's Next

You now have an airtight staleness detection system.

Every source file gets hashed. Every index stores those hashes. Every CI run verifies freshness. Stale indexes can't sneak into main.

But we've been assuming full regeneration is the answer to staleness. For a 500-file project, regenerating the entire index takes 30 seconds. Annoying but tolerable.

For a 50,000-file project? That's minutes. Every PR. Every push.

The next article covers incremental updates: regenerating only what changed. Same freshness guarantees, a fraction of the time.

We'll dive into chunk-level staleness detection, partial extraction, and manifest merging. The system gets more complex, but the payoff is linear scaling regardless of codebase size.

See you there.

---

## Quick Reference

**Check staleness from CLI:**
```bash
npx tsx scripts/discover/index.ts --check
```

**Hash a single file:**
```typescript
const hash = crypto
  .createHash('sha256')
  .update(content)
  .digest('hex')
  .slice(0, 12);
```

**Staleness detection flow:**
1. Read manifest's `source_hashes`
2. Hash current source files
3. Compare: new files, modified files, deleted files
4. Any difference = stale

**GitHub Actions integration:**
```yaml
- name: Discovery Freshness Check
  run: npx tsx scripts/discover/index.ts --check
```

**Why hashes beat timestamps:**
- Git doesn't preserve mtime
- Build tools reset mtime
- Clock synchronization is hard
- Same content = same hash (always)

**Edge cases to handle:**
- New files: map to chunk, may require new chunk
- Modified files: mark containing chunks stale
- Deleted files: may create empty chunks to remove
- Race conditions: consider post-merge regeneration

---

*This is part 11 of a series on scaling codebase discovery. Part 10 covered parallel extraction with worker threads. Part 12 wraps up with lessons learned and what we'd do differently.*
