# Phase 1: SCIP Installation & Index Generation

> **Status:** Ready for Implementation
> **Timeline:** Day 1
> **Priority:** CRITICAL

---

## Overview

**Goal:** Install scip-typescript and generate the first SCIP index

### Key Insight

SCIP (Sourcegraph Code Intelligence Protocol) is 10x faster than ts-morph and produces 8x smaller output. It's the industry standard used by Sourcegraph, GitHub, and Meta.

---

## Task 1.1: Install scip-typescript

**Add as dev dependency:**

```bash
npm install -D @sourcegraph/scip-typescript
```

---

## Task 1.2: Generate SCIP Index

**Run the indexer:**

```bash
npx scip-typescript index --output .claude/state/index.scip
```

---

## Task 1.3: Install SCIP CLI for Snapshots

**Install globally for snapshot generation:**

```bash
npm install -g @sourcegraph/scip
```

---

## Task 1.4: Generate Human-Readable Snapshots

**Create snapshot directory:**

```bash
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/discover/scip/generate-index.ts` | Wrapper script for SCIP index generation |

---

## Files to Delete

| File | Reason |
|------|--------|
| `scripts/discover/utils/project.ts` | ts-morph singleton no longer needed |

---

## Verification

- [ ] `npx scip-typescript index` completes without errors
- [ ] `.claude/state/index.scip` generated (< 10MB for current codebase)
- [ ] SCIP snapshot directory created

---

## Next Phase

After Phase 1 completion, proceed to **Phase 2** which builds on the SCIP index for code intelligence queries.
