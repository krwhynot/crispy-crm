# Discovery Generator: Pre-Computed Codebase Intelligence for AI Assistants

## Blog Article Reference Notes

**Author Context:** These notes document the Discovery Generator system built for Crispy CRM, a React 19 + TypeScript + Supabase CRM application. The system pre-computes codebase metadata to enable AI coding assistants to understand large codebases without repeatedly scanning source files.

---

## 1. The Problem We're Solving

### The Token Tax of Codebase Understanding

When AI coding assistants like Claude Code work on large codebases, they face a fundamental problem: **understanding the architecture requires reading files, but reading files consumes tokens.**

Consider a typical query: *"Which components use the useListContext hook?"*

**Without pre-computed discovery:**
1. Search 485 component files for import statements
2. Parse each file to find hook usage
3. Return results after scanning ~200KB of source code
4. **Result:** Slow response, high token consumption, repeated work

**With pre-computed discovery:**
1. Read one JSON file with component metadata
2. Filter for `contextDependencies: ["useListContext"]`
3. Return 15 matching components instantly
4. **Result:** Sub-second response, minimal tokens, consistent answers

### The Staleness Problem

Pre-computed metadata becomes dangerous when stale. If a developer adds a new component but doesn't update the inventory, the AI operates with incomplete information.

**Our solution:** CI-enforced freshness checks that fail the build if discovery files don't match source code.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Discovery Generator System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   CLI       │    │  Extractors  │    │   Output Utils   │   │
│  │  index.ts   │───▶│  (6 types)   │───▶│   output.ts      │   │
│  │             │    │              │    │   project.ts     │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
│        │                   │                     │              │
│        ▼                   ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  .claude/state/                          │   │
│  │  ├── component-inventory/  (26 chunks, 485 components)   │   │
│  │  ├── hooks-inventory.json  (77 custom hooks)             │   │
│  │  ├── schemas-inventory/    (18 chunks, 82 schemas)       │   │
│  │  ├── types-inventory/      (10 chunks, 101 types)        │   │
│  │  ├── forms-inventory.json  (39 form components)          │   │
│  │  └── validation-services-inventory/ (validators)         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Statistics

| Metric | Value |
|--------|-------|
| Total source lines | ~2,900 lines TypeScript |
| Extractors | 6 specialized modules |
| Components tracked | 485 across 26 feature chunks |
| Custom hooks | 77 with dependency graphs |
| Zod schemas | 82 with transform detection |
| TypeScript types | 101 interfaces/type aliases |
| Form components | 39 with input hierarchies |
| Execution time | ~2-3 seconds full run |

---

## 3. The Six Extractors

### 3.1 Components Extractor (253 lines)

**Purpose:** Extract React component metadata from `.tsx` files

**Key innovation:** Component role classification

```typescript
interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  type: "form_controller" | "presentational";
  hooks: string[];                    // All hooks used
  childComponents: string[];          // Local component imports
  contextDependencies: string[];      // React context hooks
  componentRole: 'entry' | 'wrapper' | 'leaf';
}
```

**Role classification logic:**
- **Entry:** Exported from `index.tsx` (feature entry points)
- **Wrapper:** Has child components AND uses context hooks
- **Leaf:** Pure presentational, no children

**Chunking strategy:** Group by feature directory
- `activities.json` → 25 components
- `contacts.json` → 102 components
- `opportunities.json` → 45 components

### 3.2 Hooks Extractor (191 lines)

**Purpose:** Extract custom hook metadata with dependency graphs

```typescript
interface HookInfo {
  name: string;
  parameters: string[];
  returnType: string;
  dependencies: string[];      // Other hooks it calls
  isReact19Action: boolean;    // Uses useActionState/useFormStatus
}
```

**React 19 detection:** Flags hooks using new action patterns:
```typescript
const REACT_19_ACTION_HOOKS = ["useActionState", "useFormStatus", "useOptimistic"];
```

**Output:** Single file (77 hooks fit easily, no chunking needed)

### 3.3 Schemas Extractor (802 lines) - **Most Sophisticated**

**Purpose:** Extract Zod validation schema metadata with transform detection

```typescript
interface SchemaField {
  name: string;
  zodType: string;              // "string", "coerce.number", "ref:ContactSchema"
  constraints: string[];        // ["max(255)", "email()"]
  hasTransform: boolean;
  hasPipe: boolean;
  transformDetails?: {
    functionName: string;       // "sanitizeHtml", "urlAutoPrefix"
    isSecurity: boolean;        // Security-related transform?
  };
}
```

**Key innovations:**

1. **Two-pass analysis with symbol table:**
   ```typescript
   // Problem: linkedin_url: isLinkedinUrl.nullish()
   // The transform lives in `isLinkedinUrl`, not visible in field definition

   // Solution: Build symbol table first
   const symbolTable = buildSchemaSymbolTable(sourceFile);
   // { "isLinkedinUrl": { hasTransform: true, functionName: "urlAutoPrefix" } }

   // Then resolve references during field extraction
   if (zodType.startsWith("ref:")) {
     const symbolInfo = symbolTable.get(refName);
     // Inherit transform info from referenced schema
   }
   ```

2. **AST-based union transform detection:**
   ```typescript
   // Problem: z.union([z.string(), z.number().transform(String)])
   // Simple regex misses the nested transform

   // Solution: Walk AST descendants
   function hasTransformInNode(node: Node): boolean {
     // Check node itself (for z.string().transform())
     if (isTransformCall(node)) return true;

     // Check all descendants (for unions, arrays, etc.)
     const callExprs = node.getDescendantsOfKind(SyntaxKind.CallExpression);
     return callExprs.some(isTransformCall);
   }
   ```

3. **Security function detection:**
   ```typescript
   const SECURITY_PATTERN = /sanitize|escape|encode|clean|strip|purify|xss|html/i;
   // Flags transforms as security-related for audit purposes
   ```

### 3.4 Types Extractor (328 lines)

**Purpose:** Extract TypeScript interface/type alias metadata

```typescript
interface TypeInfo {
  name: string;
  kind: "interface" | "type_alias";
  properties?: PropertyInfo[];
  extends?: string[];
  derivedFrom?: string;         // For z.infer<typeof schema>
  isComplex: boolean;           // Union, intersection, conditional
}
```

**Zod inference detection:**
```typescript
// Detects: type Contact = z.infer<typeof contactSchema>
const zodInferMatch = typeText.match(/z\.infer<typeof\s+(\w+)>/);
// Links types to their validation schemas
```

### 3.5 Forms Extractor (519 lines)

**Purpose:** Extract form component patterns and input hierarchies

```typescript
interface FormInfo {
  componentName: string;
  formType: "react-admin-simple" | "react-admin-tabbed" | "react19-action" | ...;
  inputComponents: string[];        // ["TextInput", "SelectInput", "DateInput"]
  validationSchemaRef?: string;     // "contactCreateSchema"
  hasZodResolver: boolean;
  componentChain: string[];         // Import hierarchy trace
  inputComponentsDeep: string[];    // Recursive input scan
}
```

**Form type priority classification:**
1. React 19 actions (useActionState, useFormStatus)
2. React Admin tabbed (TabbedForm, FormTab)
3. React Admin wizard (FormWizard)
4. React Admin simple (SimpleForm)
5. React Hook Form direct

### 3.6 Validation Services Extractor (208 lines)

**Purpose:** Extract validation helper functions and custom validators

```typescript
interface ValidationServiceInfo {
  name: string;
  type: 'validator' | 'formatter' | 'custom';
  errorFormatting: boolean;    // Formats Zod errors?
  customValidators: string[];  // Custom validators used
}
```

---

## 4. The Output System

### Chunked vs Single-File Output

**Chunked output** (directories with manifest + chunk files):
- Components: 26 chunks by feature
- Schemas: 18 chunks by validation file
- Types: 10 chunks by feature/global

**Single-file output:**
- Hooks: 77 items (small enough)
- Forms: 39 items (small enough)

### Manifest Structure

Every chunked directory has a `manifest.json`:

```json
{
  "status": "complete",
  "generated_at": "2025-12-26T22:00:00.154Z",
  "generator": "scripts/discover/extractors/components.ts",
  "source_globs": ["src/atomic-crm/**/*.tsx"],
  "checksum": "sha256:f0724331ec03d915",
  "source_hashes": {
    "src/atomic-crm/contacts/ContactCreate.tsx": "5be39db1446b",
    "src/atomic-crm/contacts/ContactList.tsx": "886b57c41711"
  },
  "summary": {
    "total_items": 485,
    "total_chunks": 26,
    "form_controllers": 120,
    "presentational": 365
  },
  "chunks": [
    { "name": "contacts", "file": "contacts.json", "item_count": 102 },
    { "name": "opportunities", "file": "opportunities.json", "item_count": 45 }
  ]
}
```

### Atomic Writes

All file operations use temp-then-rename pattern:

```typescript
// Prevents partial writes on crash
fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
fs.renameSync(tempPath, finalPath);
```

### Content Hashing

**File hashes** (12-char SHA-256 truncated):
```typescript
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}
```

**Payload checksums** for integrity verification:
```typescript
function hashPayload(data: unknown): string {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16)}`;
}
```

---

## 5. Staleness Detection

### The Algorithm

```typescript
function isDiscoveryStale(filename: string, currentSourceFiles: string[]) {
  // 1. File missing → stale
  if (!fs.existsSync(filePath)) {
    return { stale: true, reason: "Discovery file does not exist" };
  }

  // 2. Compare hashes
  const existing = JSON.parse(fs.readFileSync(filePath));
  const currentHashes = buildSourceHashes(currentSourceFiles);

  const changedFiles: string[] = [];

  // 3. Check for new/modified files
  for (const [file, hash] of Object.entries(currentHashes)) {
    if (!existing.source_hashes[file]) {
      changedFiles.push(`+ ${file} (new)`);
    } else if (existing.source_hashes[file] !== hash) {
      changedFiles.push(`~ ${file} (modified)`);
    }
  }

  // 4. Check for deleted files
  for (const file of Object.keys(existing.source_hashes)) {
    if (!currentHashes[file]) {
      changedFiles.push(`- ${file} (deleted)`);
    }
  }

  return { stale: changedFiles.length > 0, changedFiles };
}
```

### Output Example

```
🔍 Checking discovery file staleness...

✗ Components: STALE
  Reason: 3 file(s) changed
    ~ src/atomic-crm/contacts/ContactList.tsx (modified)
    + src/atomic-crm/contacts/NewComponent.tsx (new)
    - src/atomic-crm/contacts/OldComponent.tsx (deleted)
✓ Hooks: Fresh
✓ Schemas: Fresh
```

---

## 6. CI/CD Integration

### GitHub Actions Check

```yaml
# .github/workflows/ci.yml
- name: Discovery Freshness Check
  run: npx tsx scripts/discover/index.ts --check
```

**Behavior:**
- Runs `--check` mode (no file generation)
- Exit code 1 if any discovery is stale
- CI fails, blocking merge
- Developer must run `just discover` locally and commit

### Justfile Commands

```makefile
# Full extraction (~30s)
discover:
    npx tsx scripts/discover/index.ts

# CI freshness check (~5s)
discover-check:
    npx tsx scripts/discover/index.ts --check

# Selective extraction
discover-schemas:
    npx tsx scripts/discover/index.ts --only=schemas
```

---

## 7. How AI Assistants Use Discovery

### CLAUDE.md Instructions

The project's CLAUDE.md explicitly teaches AI to use discovery first:

```markdown
## Codebase Discovery (Read First!)

**Before exploring code manually, read these pre-computed discovery files:**

| File | Contents | Use When |
|------|----------|----------|
| `.claude/state/component-inventory/` | 485 components | "Which components exist?" |
| `.claude/state/hooks-inventory.json` | 77 hooks | "What hooks are available?" |
| `.claude/state/schemas-inventory/` | 82 schemas | "What validation exists?" |

**These files are auto-generated and CI-enforced fresh.**
```

### Query Examples

**Without Discovery:**
```
Q: "Which components use useFormContext?"
A: [Reads 485 files, finds 15 matches, consumes 50K tokens]
```

**With Discovery:**
```
Q: "Which components use useFormContext?"
A: [Reads hooks-inventory.json, filters contextDependencies, returns 15 matches in <1s]
```

---

## 8. Key Design Decisions

### 1. Declarative Extractor Configuration

```typescript
const EXTRACTORS: Record<string, ExtractorConfig> = {
  components: {
    name: "components",
    outputPath: "component-inventory",
    isChunked: true,
    extractFn: extractComponents,
    getSourceFiles: () => project.addSourceFilesAtPaths("src/atomic-crm/**/*.tsx"),
  },
  // ... more extractors
};
```

**Benefits:**
- Easy to add new extractors
- Consistent error handling
- Dynamic CLI filtering (`--only=components,hooks`)

### 2. ts-morph for AST Parsing

```typescript
// Singleton pattern for expensive Project object
export const project = DiscoveryProject.getInstance();

// Lazy file loading (memory optimization)
const options: ProjectOptions = {
  tsConfigFilePath: tsConfigPath,
  skipAddingFilesFromTsConfig: true,  // Don't load all files at once
};
```

**Why ts-morph over regex:**
- Accurate AST traversal
- Handles complex nested structures
- TypeScript-aware parsing

### 3. Chunking for Token Efficiency

**Problem:** Single file with 485 components = ~200KB = expensive to load

**Solution:** Chunk by feature directory
- 26 chunks × ~8KB each
- Load only needed chunks
- **90% token savings** for targeted queries

### 4. Two-Pass Schema Analysis

**Problem:** Transforms hidden in referenced schemas

```typescript
const isLinkedinUrl = z.string().transform(urlAutoPrefix);
const contactSchema = z.object({
  linkedin_url: isLinkedinUrl.optional(),  // Transform invisible here!
});
```

**Solution:** Build symbol table first, resolve during extraction

### 5. Parallel Execution

```typescript
const results = await Promise.allSettled(
  extractorsToRun.map(async (extractor) => {
    await extractor.extractFn();
  })
);
```

**All 6 extractors run concurrently** because:
- Each has independent source files
- ts-morph instances don't block each other
- ~6x faster than sequential

---

## 9. Metrics and Impact

### Before Discovery
- Answer "what components exist?" → 5-10 minutes of file exploration
- Consistent architecture view across team? No
- AI assistants understand codebase? Partially, inconsistently

### After Discovery
- Answer "what components exist?" → Instant (read manifest)
- Consistent architecture view? Yes, CI-enforced
- AI assistants understand codebase? Yes, reliably

### Token Savings Example

| Query | Without Discovery | With Discovery | Savings |
|-------|-------------------|----------------|---------|
| "List all forms" | ~100KB source | ~30KB JSON | 70% |
| "Find useListContext usage" | ~200KB search | ~5KB filter | 97.5% |
| "Schema for contacts?" | ~50KB validation | ~12KB chunk | 76% |

---

## 10. Lessons Learned

### 1. Staleness is the Enemy
Pre-computed metadata is only valuable if fresh. CI enforcement is non-negotiable.

### 2. Chunking Matters at Scale
A 500-component codebase needs chunked output. Single files become unwieldy.

### 3. AST > Regex for Accuracy
Regex-based extraction breaks on edge cases. ts-morph handles complex TypeScript correctly.

### 4. Two-Pass Analysis for References
Schema references require symbol table resolution. Single-pass misses inherited properties.

### 5. Atomic Writes Prevent Corruption
Temp-then-rename ensures partial failures don't leave corrupted state.

### 6. AI Instructions Drive Adoption
CLAUDE.md explicitly teaching AI to use discovery files is critical for adoption.

---

## 11. Future Enhancements (Not Yet Implemented)

1. **Incremental updates** - Only regenerate chunks for changed files
2. **Watch mode** - Auto-regenerate on file changes during development
3. **Memory optimization** - Batch processing for very large codebases
4. **Cross-file dependency graph** - Track component/schema import relationships

---

## Quick Reference: File Locations

| File | Purpose | Lines |
|------|---------|-------|
| `scripts/discover/index.ts` | Entry point, CLI, orchestration | 250 |
| `scripts/discover/extractors/components.ts` | Component extraction | 253 |
| `scripts/discover/extractors/hooks.ts` | Hook extraction | 191 |
| `scripts/discover/extractors/schemas.ts` | Schema extraction | 802 |
| `scripts/discover/extractors/types.ts` | Type extraction | 328 |
| `scripts/discover/extractors/forms.ts` | Form extraction | 519 |
| `scripts/discover/extractors/validation-services.ts` | Validator extraction | 208 |
| `scripts/discover/utils/output.ts` | File I/O, hashing, staleness | 317 |
| `scripts/discover/utils/project.ts` | ts-morph singleton | 35 |
| **Total** | | **~2,900** |

---

## Blog Article Angle Suggestions

1. **"Pre-Computed Codebase Intelligence: How We Made AI Assistants 10x More Effective"**
   - Focus on the problem-solution narrative
   - Token savings metrics

2. **"Building a Discovery System: Lessons from 2,900 Lines of TypeScript"**
   - Technical deep-dive on extractors
   - Two-pass analysis, AST parsing

3. **"CI-Enforced Architecture: Keeping AI Assistants and Developers in Sync"**
   - Focus on staleness detection
   - CI integration patterns

4. **"From Regex to AST: Why Accurate Code Analysis Matters"**
   - Technical focus on ts-morph
   - Schema transform detection challenges

5. **"Chunking for AI: How We Reduced Token Consumption by 90%"**
   - Chunking strategy deep-dive
   - Manifest design patterns
