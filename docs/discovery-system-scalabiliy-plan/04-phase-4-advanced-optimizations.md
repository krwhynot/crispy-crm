# Phase 4: Justfile & CI Integration

## Goal

Update justfile with new recipes and integrate into CI pipeline

## Timeline

Day 6

---

## Task 4.1: Update justfile with new recipes

**File:** `justfile`

```makefile
# SCIP indexing
discover-scip:
    npx scip-typescript index --output .claude/state/index.scip
    scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/

# Embedding generation
discover-embeddings:
    docker compose up -d qdrant ollama
    npx tsx scripts/discover/embeddings/index.ts

# Combined discovery
discover: discover-scip discover-embeddings
    @echo "✅ Discovery complete"

# Staleness check for CI
discover-check:
    npx tsx scripts/discover/check-staleness.ts
```

---

## Task 4.2: Create staleness check script

**New File:** `scripts/discover/check-staleness.ts`

- Compare source file hashes against manifest
- Exit 1 if stale, exit 0 if fresh

```typescript
import fs from 'fs';
import path from 'path';
import { glob } from 'fast-glob';
import crypto from 'crypto';

const MANIFEST_PATH = '.claude/state/manifest.json';

interface Manifest {
  sourceHashes: Record<string, string>;
  generatedAt: string;
}

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function checkStaleness(): Promise<boolean> {
  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest not found. Run `just discover` first.');
    return true; // Stale
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

  // Find all source files
  const sourceFiles = await glob(['src/**/*.ts', 'src/**/*.tsx'], {
    ignore: ['node_modules/**', '**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
  });

  let staleCount = 0;
  const staleFiles: string[] = [];

  for (const file of sourceFiles) {
    const currentHash = hashFile(file);
    const manifestHash = manifest.sourceHashes[file];

    if (currentHash !== manifestHash) {
      staleCount++;
      staleFiles.push(file);
    }
  }

  // Check for deleted files in manifest
  for (const file of Object.keys(manifest.sourceHashes)) {
    if (!fs.existsSync(file)) {
      staleCount++;
      staleFiles.push(`${file} (deleted)`);
    }
  }

  if (staleCount > 0) {
    console.error(`❌ Discovery is stale. ${staleCount} file(s) changed:`);
    staleFiles.slice(0, 10).forEach(f => console.error(`   - ${f}`));
    if (staleFiles.length > 10) {
      console.error(`   ... and ${staleFiles.length - 10} more`);
    }
    console.error('\nRun `just discover` to update.');
    return true; // Stale
  }

  console.log('✅ Discovery is fresh.');
  return false; // Fresh
}

checkStaleness().then(stale => {
  process.exit(stale ? 1 : 0);
});
```

---

## Task 4.3: Add GitHub Actions workflow

**New File:** `.github/workflows/discover-check.yml`

```yaml
name: Discovery Staleness Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: just discover-check
```

---

## Task 4.4: Clean up old ts-morph files

- Delete `scripts/discover/utils/project.ts`
- Remove ts-morph from package.json
- Update any remaining imports

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/discover/check-staleness.ts` | CI staleness check script |
| `.github/workflows/discover-check.yml` | GitHub Actions workflow |

## Files to Update

| File | Changes |
|------|---------|
| `justfile` | Add discover-scip, discover-embeddings, discover, discover-check recipes |
| `package.json` | Remove ts-morph, add @qdrant/js-client-rest |

---

## Verification Checklist

- [ ] `just discover` completes in < 30 seconds
- [ ] `just discover-check` returns correct exit code
- [ ] CI workflow passes on PR
- [ ] No ts-morph imports remain

---

## Final Cleanup Checklist

- [ ] Remove ts-morph from dependencies
- [ ] Delete utils/project.ts
- [ ] Update CLAUDE.md discovery section
