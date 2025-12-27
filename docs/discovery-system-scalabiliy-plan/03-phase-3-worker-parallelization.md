# Phase 3: Worker Thread Parallelization (Week 3) - PERFORMANCE

> This phase builds on [Phase 1: Chunk-Based Output](./01-phase-1-chunked-output.md) and [Phase 2: Incremental Extraction](./02-phase-2-incremental-extraction.md). Ensure those are complete before proceeding.

**Goal:** Use all CPU cores for parallel extraction.

---

## Task 3.1: Create worker script

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

---

## Task 3.2: Create worker pool orchestrator

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

---

## Task 3.3: Add graceful shutdown

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

---

## Task 3.4: Add --parallel flag

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

---

## Phase 3 Testing

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
