# PHASE 4: Advanced Optimizations (Week 4+)

## Task 4.1: Deduplicate overlapping globs

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

## Task 4.2: mtime-based hash cache

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

  console.log(`Hash cache: ${cacheHits} hits, ${cacheMisses} misses`);
  return hashes;
}
```

## Task 4.3: Package-based sharding for monorepos

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
