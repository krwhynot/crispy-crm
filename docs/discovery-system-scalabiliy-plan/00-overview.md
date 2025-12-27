# Discovery System Scalability Refactor - Overview

> **Status:** Planning Complete
> **Target Scale:** 2 Million Lines of Code
> **Total Effort:** 6 days
> **Generated:** 2025-12-27

---

## Executive Summary

The current Discovery System architecture **will be replaced** with industry-proven tools used by Sourcegraph, GitHub, and Meta. This big bang migration replaces ts-morph with SCIP for code intelligence and adds Qdrant + Ollama for semantic search.

| Change | Current State | New State | Benefit |
|--------|--------------|-----------|---------|
| **Parser** | ts-morph (single Project) | SCIP + Tree-sitter | 10x faster, 8x smaller output |
| **Semantic Search** | None | Qdrant + Ollama | Natural language queries |
| **Embeddings** | None | nomic-embed-text (768-dim) | FREE local inference |
| **Architecture** | In-memory AST | Pre-computed index | Memory-independent scaling |

This plan provides a 6-day migration path to support 2M+ lines of code with semantic search capabilities.

---

## Phase Roadmap

```
Day 1           Days 2-3            Days 4-5              Day 6
  │                │                   │                    │
  ▼                ▼                   ▼                    ▼
┌─────────┐   ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐
│ PHASE 1 │──▶│   PHASE 2   │──▶│     PHASE 3      │──▶│   PHASE 4   │
│  SCIP   │   │  Extractor  │   │    Qdrant +      │   │     CI      │
│ Install │   │  Migration  │   │     Ollama       │   │ Integration │
└─────────┘   └─────────────┘   └──────────────────┘   └─────────────┘
     │               │                   │                    │
     ▼               ▼                   ▼                    ▼
  scip-ts        7 extractors      Self-hosted DB        justfile
  SCIP index     SCIP queries      Local embeddings      GitHub Actions
  Verify output  Tree-sitter       Semantic search       Health checks
```

---

## Phase Details

### [Phase 1: SCIP Installation](./01-phase-1-scip-install.md) - Day 1 (CRITICAL)

**Goal:** Generate SCIP index from TypeScript codebase.

| Task | File(s) | Effort |
|------|---------|--------|
| 1.1 Install scip-typescript | `package.json` | Trivial |
| 1.2 Configure SCIP indexing | `scip.json` (NEW) | Low |
| 1.3 Generate first SCIP index | `justfile` | Low |
| 1.4 Verify index output | Manual validation | Low |

**Key Deliverable:** `index.scip` file with all symbols, references, and relationships

---

### [Phase 2: Extractor Migration](./02-phase-2-extractor-migration.md) - Days 2-3

**Goal:** Replace ts-morph extractors with SCIP queries.

| Task | File(s) | Effort |
|------|---------|--------|
| 2.1 Install @sourcegraph/scip | `package.json` | Trivial |
| 2.2 Create SCIP query utilities | `utils/scip-query.ts` (NEW) | Medium |
| 2.3 Migrate component extractor | `extract-components.ts` | Medium |
| 2.4 Migrate hook extractor | `extract-hooks.ts` | Medium |
| 2.5 Migrate schema extractor | `extract-schemas.ts` | Medium |
| 2.6 Migrate remaining extractors | 4 extractor files | Medium |
| 2.7 Add Tree-sitter fallback | `utils/tree-sitter.ts` (NEW) | Low |

**Key Deliverable:** All 7 extractors using SCIP index instead of ts-morph

---

### [Phase 3: Qdrant + Ollama Integration](./03-phase-3-qdrant-ollama.md) - Days 4-5

**Goal:** Add semantic search with local embeddings.

| Task | File(s) | Effort |
|------|---------|--------|
| 3.1 Install Qdrant (Docker) | `docker-compose.yml` | Low |
| 3.2 Install Ollama + nomic-embed-text | Local install | Low |
| 3.3 Create embedding pipeline | `utils/embeddings.ts` (NEW) | Medium |
| 3.4 Create Qdrant client | `utils/qdrant-client.ts` (NEW) | Medium |
| 3.5 Index discovery output | `index-to-qdrant.ts` (NEW) | Medium |
| 3.6 Add semantic search CLI | `semantic-search.ts` (NEW) | Medium |

**Key Deliverable:** `just discover-search "hooks for form validation"` returns relevant results

---

### [Phase 4: CI Integration](./04-phase-4-ci-integration.md) - Day 6

**Goal:** Update build system and CI for new architecture.

| Task | File(s) | Effort |
|------|---------|--------|
| 4.1 Update justfile commands | `justfile` | Low |
| 4.2 Add SCIP generation to CI | `.github/workflows/` | Medium |
| 4.3 Add Qdrant health check | `scripts/health-check.ts` (NEW) | Low |
| 4.4 Update documentation | `CLAUDE.md`, docs | Low |
| 4.5 Remove ts-morph dependency | `package.json` | Trivial |

**Key Deliverable:** CI generates SCIP index on every push, semantic search available in dev

---

## Tools & Dependencies

### Current Stack (Being Replaced)

| Tool | Purpose | Replacement |
|------|---------|-------------|
| **ts-morph** | TypeScript AST parsing | SCIP + Tree-sitter |
| **tsx** | Direct TypeScript execution | Unchanged |
| **just** | Task runner | Unchanged |
| **fast-glob** | File pattern matching | Unchanged |

### New Dependencies

```json
{
  "devDependencies": {
    "scip-typescript": "^0.3.x",
    "@sourcegraph/scip": "^0.4.x",
    "tree-sitter": "^0.21.x",
    "tree-sitter-typescript": "^0.21.x",
    "@qdrant/js-client-rest": "^1.x"
  }
}
```

### External Tools (Local Install)

| Tool | Version | Purpose |
|------|---------|---------|
| **Qdrant** | 1.9+ | Self-hosted vector database |
| **Ollama** | 0.3+ | Local LLM/embedding inference |
| **nomic-embed-text** | Latest | 768-dim embeddings (FREE) |
| **ast-grep** | Optional | Fast pattern matching fallback |

---

## Architecture Comparison

### Before (ts-morph)

```
Source Files → ts-morph Project (in-memory) → Extract → JSON Output
                    ↓
              Memory grows unbounded
              Single-threaded
              OOM at 500K+ LOC
```

### After (SCIP + Qdrant)

```
Source Files → SCIP Index (on-disk) → Query → JSON Output
                                          ↓
                                    Qdrant (vectors)
                                          ↓
                                    Semantic Search

Benefits:
- Index once, query many times
- Memory-independent of codebase size
- 10x faster extraction
- Semantic search with natural language
```

---

## Success Criteria

### After Each Phase
- [ ] `just discover` produces identical output to current system
- [ ] `just discover --check` returns correct exit code
- [ ] `just discover --incremental` still works
- [ ] No TypeScript compilation errors

### Final Acceptance (Post Phase 4)
- [ ] SCIP index generation < 30 seconds for entire codebase
- [ ] Extraction from SCIP < 10 seconds (vs current 2+ minutes)
- [ ] Peak memory < 500MB (vs current 1.5GB+)
- [ ] Semantic search returns relevant results in < 1 second
- [ ] `just discover-search "query"` works from CLI

---

## Quick Reference

```bash
# Generate SCIP index
just scip-index

# Run discovery (from SCIP index)
just discover

# Run with staleness check only
just discover --check

# Run incrementally (only stale chunks)
just discover --incremental

# Semantic search (Phase 3+)
just discover-search "hooks for form validation"

# Start Qdrant (Phase 3+)
docker compose up -d qdrant

# Pull Ollama model (Phase 3+)
ollama pull nomic-embed-text
```

---

## File Structure

```
docs/discovery-system-scalabiliy-plan/
├── 00-overview.md                      ← You are here
├── 01-phase-1-scip-install.md          ← Day 1: SCIP installation
├── 02-phase-2-extractor-migration.md   ← Days 2-3: Replace ts-morph
├── 03-phase-3-qdrant-ollama.md         ← Days 4-5: Semantic search
└── 04-phase-4-ci-integration.md        ← Day 6: CI + cleanup
```

---

## Why This Architecture?

### SCIP (Source Code Intelligence Protocol)

| Metric | ts-morph | SCIP |
|--------|----------|------|
| **Used By** | Small projects | Sourcegraph, GitHub, Meta |
| **Index Size** | N/A (in-memory) | ~1/8th of source size |
| **Memory** | Unbounded growth | Constant (disk-based) |
| **Speed** | O(n) per query | O(1) lookups |
| **Cross-file refs** | Slow resolution | Pre-computed |

### Qdrant (Vector Database)

| Feature | Value |
|---------|-------|
| **Cost** | FREE (self-hosted) |
| **Memory** | 97% reduction vs in-memory |
| **Persistence** | On-disk, survives restarts |
| **Query Speed** | <10ms for semantic search |

### Ollama + nomic-embed-text

| Feature | Value |
|---------|-------|
| **Cost** | FREE (local inference) |
| **Dimensions** | 768 (optimal for code) |
| **Speed** | ~100 embeddings/second |
| **Privacy** | Never leaves your machine |

---

## References

- [SCIP Protocol Specification](https://sourcegraph.com/docs/code-intelligence/scip)
- [scip-typescript](https://github.com/sourcegraph/scip-typescript)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Ollama](https://ollama.ai/)
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)
- [ast-grep](https://ast-grep.github.io/)
