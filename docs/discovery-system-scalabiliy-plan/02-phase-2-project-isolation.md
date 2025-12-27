# Phase 2: Replace Extractors with SCIP Queries

> **Prerequisites:** Complete [Phase 1: SCIP Index Generation](./01-phase-1-parallel-group-optimization.md) with a valid SCIP index before starting Phase 2.

---

## Goal

Rewrite all 7 extractors to query SCIP index instead of using ts-morph.

---

## Timeline

Days 2-3

---

## Task 2.1: Create SCIP query utilities

**File:** `scripts/discover/scip/query.ts`

```typescript
// scripts/discover/scip/query.ts
import { Index, Document, Occurrence } from '@sourcegraph/scip';

export function findSymbolsByPattern(index: Index, pattern: RegExp): Symbol[] {
  // Query SCIP index for matching symbols
}

export function getReferences(index: Index, symbol: string): Occurrence[] {
  // Get all references to a symbol
}

export function getDefinition(index: Index, symbol: string): Occurrence | null {
  // Get definition location
}
```

---

## Task 2.2: Rewrite extractors

Each extractor must be rewritten to query SCIP instead of ts-morph:

| Extractor | SCIP Query Strategy |
|-----------|---------------------|
| `extractors/components.ts` | Query SCIP for React components |
| `extractors/hooks.ts` | Query SCIP for custom hooks |
| `extractors/schemas.ts` | Query SCIP for Zod schemas |
| `extractors/types.ts` | Query SCIP for TypeScript types |
| `extractors/forms.ts` | Query SCIP for form components |
| `extractors/validation-services.ts` | Query SCIP for validators |
| `extractors/call-graph.ts` | Use SCIP relationships |

---

## Task 2.3: (Optional) Add ast-grep patterns for complex matching

For patterns that require more sophisticated matching beyond SCIP symbol queries:

```yaml
# .claude/ast-grep/react-components.yaml
id: react-component
language: tsx
rule:
  any:
    - pattern: function $NAME($$$) { $$$ return <$$$>; }
    - pattern: const $NAME = ($$$) => <$$$>;
```

---

## Files to Create

- `scripts/discover/scip/query.ts`

---

## Files to Rewrite

- `scripts/discover/extractors/components.ts`
- `scripts/discover/extractors/hooks.ts`
- `scripts/discover/extractors/schemas.ts`
- `scripts/discover/extractors/types.ts`
- `scripts/discover/extractors/forms.ts`
- `scripts/discover/extractors/validation-services.ts`
- `scripts/discover/extractors/call-graph.ts`

---

## Verification

- [ ] All extractors use SCIP instead of ts-morph
- [ ] Output matches previous component/hook/schema counts
- [ ] No ts-morph imports remain

```bash
# Verify no ts-morph imports in extractors
rg "from.*ts-morph" scripts/discover/extractors/
# Expected: No matches

# Verify extraction counts unchanged
just discover
diff <(cat .claude/state/*-inventory/*.json | jq -r '.count // .totalNodes') expected-counts.txt
```

---

**Next:** [Phase 3: Worker Thread Parallelization](./03-phase-3-worker-thread-parallelization.md)
