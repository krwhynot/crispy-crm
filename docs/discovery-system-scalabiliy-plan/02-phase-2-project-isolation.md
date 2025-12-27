# Phase 2: Project Isolation (Week 2)

> **Prerequisites:** Complete [Phase 1: Parallel Group Optimization](./01-phase-1-parallel-group-optimization.md) before starting Phase 2. The instrumentation from Task 1.3 will help verify memory improvements from project isolation.

---

## Goal

Separate ts-morph Project per extractor to enable memory release.

---

## Task 2.1: Replace singleton with factory

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

  console.log(`[Memory] Creating Project for: ${name}`);

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,  // NEW: Faster for extraction-only
  });

  return project;
}

export function disposeProject(project: Project, name: string): void {
  const sourceFiles = project.getSourceFiles();
  console.log(`[Memory] Disposing ${sourceFiles.length} files from: ${name}`);
  sourceFiles.forEach(sf => sf.forget());
}
```

---

## Task 2.2: Update each extractor to use factory

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

---

## Task 2.3: Add extractor-level isolation to orchestrator

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
      console.log(`[Memory] ${ext.name}: ${((endMem - startMem) / 1024 / 1024).toFixed(1)}MB used`);
    })
  );
  // ...
}
```

---

## Phase 2 Testing

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

**Next:** [Phase 3: Worker Thread Parallelization](./03-phase-3-worker-thread-parallelization.md)
