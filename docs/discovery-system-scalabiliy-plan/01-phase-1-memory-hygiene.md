# Phase 1: Memory Hygiene

> **Status:** Ready for Implementation
> **Target Scale:** 2 Million Lines of Code
> **Phase Duration:** Week 1
> **Priority:** CRITICAL

---

## Overview Context

### Tools & Dependencies

| Tool | Purpose |
|------|---------|
| **Node.js** | Runtime environment for TypeScript execution |
| **tsx** | Direct TypeScript execution (`npx tsx scripts/discover/index.ts`) |
| **TypeScript** | Type-safe development |
| **ts-morph** | TypeScript AST parser - extracts components, hooks, schemas, types, call graphs |
| **fs/promises** | Async file read/write operations |
| **path** | Cross-platform path manipulation |
| **crypto** | SHA-256 hashing for staleness detection |
| **just** | CLI command orchestration (`just discover`, `just discover --check`) |

### Key Gaps Summary

| Gap | Severity | Impact |
|-----|----------|--------|
| **Cache Security** | Critical | Plain JSON with no integrity verification |
| **No File Size Limits** | Medium | Could choke on generated files/bundles |
| **No Manifest Integrity Hash** | Medium | Can't verify chunks weren't tampered with |
| **No dispose() calls** | Critical | Memory grows unboundedly |

### Scalability Blockers Summary

| Blocker | Current State | 2M LOC Requirement |
|---------|--------------|-------------------|
| **Memory** | Single ts-morph Project loads all files | Separate Projects per package/module |
| **AST Disposal** | No explicit `dispose()` calls | Must dispose after each file |
| **Processing** | Single-threaded extraction | Worker threads / child processes |

---

## PHASE 1: Memory Hygiene (Week 1) - CRITICAL

**Goal:** Stop memory leaks without breaking existing functionality.

---

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

---

### Task 1.2: Add file size filter

**File:** `scripts/discover/utils/output.ts`

**Add helper function:**

```typescript
const MAX_FILE_SIZE = 500 * 1024; // 500KB

export function filterLargeFiles(files: string[]): string[] {
  return files.filter(file => {
    const stats = fs.statSync(file);
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`Warning: Skipping large file (${(stats.size / 1024).toFixed(1)}KB): ${file}`);
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

---

### Task 1.3: Add memory profiling command

**File:** `justfile`

```makefile
# Memory profiling
discover-profile:
    node --inspect --max-old-space-size=4096 \
      ./node_modules/.bin/tsx scripts/discover/index.ts 2>&1 | \
      tee .claude/logs/discover-profile.log
```

---

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

---

## Phase 1 Testing

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

## Success Criteria

- [ ] All 7 extractors have try/finally with `forget()` calls
- [ ] `filterLargeFiles()` function added and integrated
- [ ] `just discover-profile` recipe added to justfile
- [ ] Manifest includes `output_integrity` and `generator_version` fields
- [ ] Memory usage reduced compared to baseline (profile with --inspect)
- [ ] `just discover` produces identical output (diff .claude/state/)
- [ ] No TypeScript compilation errors

---

## Next Phase

After Phase 1 completion, proceed to **Phase 2: Project Isolation** which replaces the singleton pattern with a factory function for true memory release between extractors.
