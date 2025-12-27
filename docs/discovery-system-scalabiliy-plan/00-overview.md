# Discovery System Scalability Refactor - Overview

> **Status:** Planning Complete
> **Target Scale:** 2 Million Lines of Code
> **Total Effort:** 3-4 weeks
> **Generated:** 2025-12-27

---

## Executive Summary

The current Discovery System architecture **will fail at scale**. Three critical blockers prevent scaling beyond ~500K LOC:

| Blocker | Current State | Impact |
|---------|--------------|--------|
| **Memory** | Single ts-morph Project | OOM crash at 500K-1M LOC |
| **Processing** | Single-threaded | Hours to complete extraction |
| **Disposal** | No `forget()` calls | Unbounded memory growth |

This plan provides a 4-phase migration path to support 2M+ lines of code.

---

## Phase Roadmap

```
Week 1          Week 2              Week 3                  Week 4+
  │               │                   │                       │
  ▼               ▼                   ▼                       ▼
┌─────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ PHASE 1 │──▶│   PHASE 2   │──▶│     PHASE 3      │──▶│    PHASE 4      │
│ Memory  │   │  Isolation  │   │ Parallelization  │   │  Optimization   │
│ Hygiene │   │             │   │                  │   │                 │
└─────────┘   └─────────────┘   └──────────────────┘   └─────────────────┘
     │               │                   │                       │
     ▼               ▼                   ▼                       ▼
  forget()      Factory        Worker Threads          Hash Cache
  File Limits   Pattern        p-queue Pool            Monorepo Shards
  Integrity     Per-Extractor  --parallel Flag         Glob Dedup
```

---

## Phase Details

### [Phase 1: Memory Hygiene](./01-phase-1-memory-hygiene.md) - Week 1 (CRITICAL)

**Goal:** Stop memory leaks without breaking existing functionality.

| Task | File(s) | Effort |
|------|---------|--------|
| 1.1 Add `dispose()` to extractors | 7 extractor files | Low |
| 1.2 Add file size filter | `utils/output.ts` | Low |
| 1.3 Add memory profiling | `justfile` | Trivial |
| 1.4 Add output integrity hash | `utils/output.ts` | Low |

**Key Deliverable:** `sourceFile.forget()` calls in try/finally blocks

---

### [Phase 2: Project Isolation](./02-phase-2-project-isolation.md) - Week 2

**Goal:** Separate ts-morph Project per extractor to enable memory release.

| Task | File(s) | Effort |
|------|---------|--------|
| 2.1 Replace singleton with factory | `utils/project.ts` | Medium |
| 2.2 Update extractors to use factory | 7 extractor files | Medium |
| 2.3 Add extractor-level isolation | `index.ts` | Medium |

**Key Deliverable:** `createProject()` / `disposeProject()` factory pattern

---

### [Phase 3: Worker Thread Parallelization](./03-phase-3-worker-parallelization.md) - Week 3

**Goal:** Use all CPU cores for parallel extraction.

| Task | File(s) | Effort |
|------|---------|--------|
| 3.1 Create worker script | `extractor-worker.ts` (NEW) | High |
| 3.2 Create worker pool | `worker-pool.ts` (NEW) | High |
| 3.3 Add graceful shutdown | `index.ts` | Medium |
| 3.4 Add `--parallel` flag | `index.ts` | Medium |

**Key Deliverable:** `just discover --parallel` using all CPU cores

---

### [Phase 4: Advanced Optimizations](./04-phase-4-advanced-optimizations.md) - Week 4+

**Goal:** Further performance improvements and monorepo support.

| Task | File(s) | Effort |
|------|---------|--------|
| 4.1 Deduplicate overlapping globs | `index.ts` | Medium |
| 4.2 mtime-based hash cache | `utils/output.ts` | Medium |
| 4.3 Package-based sharding | `utils/packages.ts` (NEW) | Medium |

**Key Deliverable:** Incremental builds < 30 seconds for single file changes

---

## Tools & Dependencies

### Current Stack

| Tool | Purpose |
|------|---------|
| **ts-morph** | TypeScript AST parsing (all 7 extractors) |
| **tsx** | Direct TypeScript execution |
| **just** | Task runner (`just discover`) |
| **fast-glob** | File pattern matching |
| **crypto** | SHA-256 hashing for staleness |

### New Dependencies (Phase 3)

```json
{
  "devDependencies": {
    "p-queue": "^8.0.1"
  }
}
```

---

## Known Gaps (from Industry Research)

| Gap | Severity | Addressed In |
|-----|----------|--------------|
| Cache Security (CVE-2025-36852) | Critical | Phase 1 (integrity hash) |
| No Semantic Search | High | Future (requires embeddings) |
| No Watch Mode | High | Future (requires chokidar) |
| No File Size Limits | Low | Phase 1 |
| No Error Recovery | Medium | Phase 1 (try/finally) |
| TypeScript-Only | Low | Future (tree-sitter) |
| No Traversal Optimization | Low | Profile first |
| No Cross-Reference Validation | Low | Surface existing SCC |

---

## Success Criteria

### After Each Phase
- [ ] `just discover` produces identical output
- [ ] `just discover --check` returns correct exit code
- [ ] `just discover --incremental` still works
- [ ] No TypeScript compilation errors
- [ ] Memory usage reduced (profile with `--inspect`)

### Final Acceptance (Post Phase 4)
- [ ] Extraction completes for 500K+ LOC
- [ ] Peak memory < 2GB
- [ ] Full extraction < 5 minutes with `--parallel`
- [ ] Incremental < 30 seconds for single file change

---

## Quick Reference

```bash
# Run discovery (current)
just discover

# Run with staleness check only
just discover --check

# Run incrementally (only stale chunks)
just discover --incremental

# Run with memory profiling (Phase 1+)
just discover-profile

# Run in parallel (Phase 3+)
just discover --parallel
```

---

## File Structure

```
docs/discovery-system-scalabiliy-plan/
├── 00-overview.md                      ← You are here
├── 01-phase-1-memory-hygiene.md        ← Week 1: Stop memory leaks
├── 02-phase-2-project-isolation.md     ← Week 2: Factory pattern
├── 03-phase-3-worker-parallelization.md← Week 3: Multi-core
└── 04-phase-4-advanced-optimizations.md← Week 4+: Polish
```

---

## References

- [ts-morph documentation](https://ts-morph.com/)
- [CVE-2025-36852 - CREEP vulnerability](https://nx.dev/blog/creep-vulnerability-build-cache-security)
- [Kilo Code codebase indexing](https://kilocode.ai/docs/features/codebase-indexing)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [p-queue - Promise concurrency control](https://github.com/sindresorhus/p-queue)
