# Ultra-Deep Audit: `scripts/discover` Codebase Introspection System

## Executive Summary

The `scripts/discover` directory contains a **production-grade, AI-optimized metadata extraction pipeline** that automatically extracts structural information about the Crispy CRM codebase. It uses **AST parsing** (not regex) to extract accurate metadata about 700+ source entities, outputting structured JSON for AI consumption (specifically Claude Code).

---

## System Architecture

```
scripts/discover/
├── index.ts                          # Orchestrator & CLI handler
├── utils/
│   ├── project.ts                    # ts-morph singleton (36 lines)
│   └── output.ts                     # Discovery envelope & I/O (318 lines)
└── extractors/
    ├── components.ts                 # 484 React components → chunked
    ├── hooks.ts                      # 77 custom hooks → single file
    ├── schemas.ts                    # 82 Zod schemas → chunked
    ├── types.ts                      # 101 TypeScript types → chunked
    ├── forms.ts                      # 39 form components → single file
    └── validation-services.ts        # Validation wrappers → chunked
```

**Output Directory:** `.claude/state/`
- 4 chunked outputs (component-inventory/, schemas-inventory/, types-inventory/, validation-services-inventory/)
- 2 single-file outputs (hooks-inventory.json, forms-inventory.json)

---

## File-by-File Analysis

### 1. `index.ts` - Main Orchestrator (251 lines)

**Purpose:** Entry point that coordinates all extractors and manages the discovery lifecycle.

**Key Mechanisms:**
- **EXTRACTORS config object** - Maps extractor names to their configuration:
  ```typescript
  {
    name, label, outputPath, isChunked,
    extractFn: () => Promise<void>,
    getSourceFiles: () => string[]
  }
  ```
- **CLI argument parsing** - `--check` for staleness, `--only=components,hooks` for selective extraction
- **Parallel execution** - Uses `Promise.allSettled()` to run extractors concurrently
- **Summary reporting** - Reads output files and displays item/chunk counts

**Data Flow:**
```
parseCliArgs() → checkStaleness() OR runExtractors() → printSummary()
```

---

### 2. `utils/project.ts` - ts-morph Singleton (36 lines)

**Purpose:** Provides a shared TypeScript AST parser across all extractors.

**Key Design Decisions:**
- **Singleton pattern** - Single `Project` instance cached across extractors
- **Lazy loading** - `skipAddingFilesFromTsConfig: true` prevents loading entire codebase at startup
- **On-demand file addition** - Extractors call `project.addSourceFilesAtPaths(globs)` for their specific files

**Why ts-morph over regex?**
- Accurate type resolution (handles imports, path aliases)
- Reliable AST traversal (call expressions, declarations, exports)
- Compiler-level accuracy for TypeScript features

---

### 3. `utils/output.ts` - Discovery Envelope & Staleness (318 lines)

**Purpose:** Standardizes output format and implements change detection.

**Core Data Structures:**

```typescript
// Single-file output envelope
interface DiscoveryEnvelope<T> {
  status: "complete" | "in_progress" | "error";
  generated_at: string;           // ISO timestamp
  generator: string;              // Source file path
  source_globs: string[];         // Patterns used
  checksum: string;               // SHA256 of payload
  source_hashes: Record<string, string>; // File → hash map
  summary: Record<string, number>;
  [key]: T;                       // Payload data
}

// Chunked output manifest
interface ChunkedManifest {
  // ...same envelope fields...
  chunks: ChunkInfo[];  // Array of {name, file, item_count, checksum}
}
```

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `hashFile(path)` | SHA256 of file contents (12-char prefix) |
| `hashPayload(data)` | SHA256 of JSON payload (16-char prefix) |
| `buildSourceHashes(paths)` | Map all source files to hashes |
| `createEnvelope()` | Build standard envelope structure |
| `writeDiscoveryFile()` | Atomic write for single-file output |
| `writeChunkedDiscovery()` | Write manifest + individual chunks atomically |
| `isDiscoveryStale()` | Compare hashes for single-file output |
| `isChunkedDiscoveryStale()` | Compare hashes for chunked output |

**Staleness Detection Algorithm:**
```
1. Load existing source_hashes from discovery file
2. Compute current hashes for all source files
3. Compare:
   - New files: + filename (new)
   - Modified files: ~ filename (modified)
   - Deleted files: - filename (deleted)
4. Return {stale, reason, changedFiles}
```

**Atomic Write Pattern:**
```typescript
fs.writeFileSync(tempPath, data);  // Write to .tmp
fs.renameSync(tempPath, finalPath); // Atomic rename (POSIX)
```

---

### 4. `extractors/components.ts` - React Component Extraction (254 lines)

**Purpose:** Extract all React components from `src/atomic-crm/**/*.tsx`

**Output Schema (ComponentInfo):**
```typescript
{
  name: string;
  file: string;
  line: number;
  type: "form_controller" | "presentational";
  hooks: string[];              // All hooks used
  imports: string[];            // All import sources
  isDefaultExport: boolean;
  childComponents: string[];    // Local component imports
  contextDependencies: string[]; // Context hooks detected
  componentRole: 'entry' | 'wrapper' | 'leaf';
}
```

**Classification Logic:**
- **form_controller** - Uses `useActionState` or `useFormStatus` (React 19)
- **entry** - Exported from `index.tsx`
- **wrapper** - Has children AND uses context hooks
- **leaf** - No child components

**Chunking Strategy:** Groups by feature directory (e.g., "contacts", "opportunities", "_root")

---

### 5. `extractors/schemas.ts` - Zod Schema Extraction (633 lines)

**Purpose:** Extract all Zod schemas from `src/atomic-crm/validation/**/*.ts`

**Output Schema (SchemaInfo):**
```typescript
{
  name: string;
  file: string;
  line: number;
  schemaType: "strictObject" | "object" | "enum" | "array" | "union" | "other";
  fields: SchemaField[];        // Detailed field info
  enumValues?: string[];
  relatedSchemas: string[];     // Same base name variations
  validationFunctions: string[]; // Functions using this schema
  hasTransforms: boolean;
  hasSuperRefine: boolean;
}
```

**SchemaField Details:**
```typescript
{
  name: string;
  zodType: string;              // "string", "coerce.number", "enum"
  constraints: string[];        // ["max(255)", "email()"]
  optional: boolean;
  nullable: boolean;
  hasTransform: boolean;
  hasDefault: boolean;
  enumValues?: string[];
  transformDetails?: {
    functionName: string;       // "sanitizeHtml"
    isSecurity: boolean;        // Detects sanitization patterns
  };
}
```

**Security Detection:** Identifies sanitization transforms via regex:
```typescript
/sanitize|escape|encode|clean|strip|purify/i
```

---

### 6. Other Extractors

| Extractor | Source Globs | Output | Key Metadata |
|-----------|--------------|--------|--------------|
| `hooks.ts` | `src/**/*.ts(x)` | Single file | dependencies, isReact19Action |
| `types.ts` | `src/**/types.ts` | Chunked | kind, properties, derivedFrom (Zod) |
| `forms.ts` | `*Create*.tsx`, `*Edit*.tsx` | Single file | formType, inputComponents, validationSchemaRef |
| `validation-services.ts` | `validation/**/*.ts` | Chunked | type, schemaReference, errorFormatting |

---

## Architectural Strengths

### 1. **AI-Optimized Design**
- **Chunked output** - Allows Claude to load only needed features (saves tokens)
- **Flat JSON structures** - Efficient for LLM parsing
- **Rich metadata** - Includes line numbers, relationships, classifications
- **Semantic fields** - `componentRole`, `isSecurity`, `formType` for quick filtering

### 2. **Production-Quality Reliability**
- **Atomic writes** - Prevents partial file corruption on crash
- **SHA256 checksums** - Payload integrity verification
- **Staleness detection** - Only regenerate when source changes
- **Parallel execution** - All 6 extractors run concurrently

### 3. **AST Accuracy**
- **ts-morph** - Compiler-level TypeScript parsing
- **Lazy loading** - Only parses needed files
- **Singleton pattern** - Shared compiler instance across extractors

### 4. **Extensibility**
- **EXTRACTORS config** - Easy to add new extractors
- **Chunked vs single-file** - Flexible output modes
- **CLI filtering** - `--only=schemas,types` for targeted extraction

---

## Potential Weaknesses & Edge Cases

### 1. **Memory Considerations**
- ts-morph holds AST in memory
- Large codebases (10k+ files) may need optimization
- **Mitigation:** `skipAddingFilesFromTsConfig` helps

### 2. **No Incremental Updates**
- Currently regenerates entire output on any change
- Could be optimized to update only affected chunks
- **Impact:** Low for this codebase size (~700 entities)

### 3. **Transform Detection Limitations**
- Regex-based detection may miss complex patterns:
  ```typescript
  // May not detect:
  .transform(compose(sanitize, trim))
  .transform(myCustomSanitizer) // if not named with pattern
  ```

### 4. **Circular Dependency Handling**
- Not explicitly handled in schema/type extraction
- May cause issues with deeply nested schema references

### 5. **No Watch Mode**
- Must be run manually or in CI
- Could benefit from file watcher integration

---

## How It Serves AI-Assisted Development

### Token Efficiency
| Output | Items | Chunks | Strategy |
|--------|-------|--------|----------|
| Components | 484 | 26 | Load by feature |
| Schemas | 82 | 18 | Load by validation file |
| Types | 101 | 10 | Load by feature |
| Hooks | 77 | 1 | Single file (small) |
| Forms | 39 | 1 | Single file (small) |

### Query Patterns Enabled
- "What components use `useListContext`?" → Filter by `contextDependencies`
- "Which schemas have sanitization?" → Filter by `transformDetails.isSecurity`
- "What forms validate against X schema?" → Match `validationSchemaRef`
- "Show entry components for contacts" → Filter by `componentRole: 'entry'`, feature

### CLAUDE.md Integration
The discovery files are directly referenced in CLAUDE.md:
```markdown
**Before exploring code manually, read these pre-computed discovery files:**
| File | Contents | Use When |
|------|----------|----------|
| `.claude/state/component-inventory/` | 484 React components... |
```

---

## CLI Commands (from justfile)

```bash
just discover                # Run all 6 extractors
just discover-check          # Check staleness (CI integration)
just discover-priority       # Components + hooks only (fast)
just discover-schemas        # Schemas only
just discover-types          # Types only
just discover-forms          # Forms only
```

---

## Comparison to Industry Tools

| Aspect | scripts/discover | TypeDoc | TSDoc | JSDoc |
|--------|------------------|---------|-------|-------|
| **Purpose** | AI context | API docs | Type info | JS docs |
| **Output** | JSON (chunked) | HTML | JSON | HTML |
| **Granularity** | Component-level | Module-level | Type-level | Function-level |
| **Staleness** | SHA256 hashing | Timestamp | None | None |
| **AI-Ready** | Yes (token-aware) | No | Partial | No |
| **Custom metadata** | Rich (roles, security) | Limited | Type-only | Comments |

**Verdict:** This is a **custom-built solution** specifically designed for AI-assisted development workflows. It goes beyond documentation tools by providing:
- Semantic classifications (form_controller, wrapper, leaf)
- Security detection (sanitization transforms)
- Relationship mapping (childComponents, relatedSchemas)
- Token-efficient chunking

---

---

## Priority-Sorted Recommendations

### 🔴 P0 - Critical (Immediate Action)
*None identified - the system is production-quality and working correctly.*

---

### 🟠 P1 - High Priority (Should Address Soon)

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **No CI enforcement** | Stale discovery files could mislead Claude | Add `just discover-check` to CI pipeline (already supported via `--check` flag) |
| **Transform detection gaps** | Security sanitizers using composition may be missed | Expand regex pattern or use AST for transform function detection |

---

### 🟡 P2 - Medium Priority (Plan For)

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **No incremental updates** | Full regeneration on any file change | Implement per-chunk regeneration based on affected source files |
| **Memory with large codebases** | ts-morph holds AST in memory | Monitor memory usage; consider file streaming for 10k+ file codebases |
| **No watch mode** | Manual runs required | Add `chokidar` file watcher for development workflow |

---

### 🟢 P3 - Low Priority (Nice to Have)

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| **Circular dependency handling** | Edge cases in deeply nested schemas | Add cycle detection in schema/type extraction |
| **No diff output** | Hard to see what changed between runs | Add `--diff` flag to show changes from last run |
| **No JSON Schema validation** | Output format not formally specified | Add Zod/JSON Schema for output format validation |

---

### 🔵 P4 - Enhancements (Future Consideration)

| Enhancement | Value | Effort |
|-------------|-------|--------|
| **Vector embeddings** | Enable semantic search over codebase | Medium |
| **Call graph extraction** | "What calls this function?" queries | High |
| **Test coverage linkage** | Connect components to their tests | Low |
| **Dependency graph visualization** | Visual component relationships | Medium |

---

## Summary

The `scripts/discover` system is a **well-architected, production-quality codebase introspection tool** specifically designed for AI consumption. It uses:

1. **ts-morph** for accurate AST parsing
2. **Chunked output** for token efficiency
3. **SHA256 staleness detection** for incremental workflows
4. **Atomic writes** for reliability
5. **Rich semantic metadata** for intelligent querying

The system effectively bridges the gap between raw source code and AI-consumable context, enabling Claude Code to quickly understand codebase structure without reading every file.

---

## Quick Priority Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIORITY MATRIX: scripts/discover Improvements                 │
├─────────────┬───────────────────────────────────────────────────┤
│   PRIORITY  │  ACTION ITEMS                                     │
├─────────────┼───────────────────────────────────────────────────┤
│  P0 Critical│  ✅ None - system is healthy                      │
├─────────────┼───────────────────────────────────────────────────┤
│  P1 High    │  • CI integration for staleness checks            │
│             │  • Improve transform detection accuracy           │
├─────────────┼───────────────────────────────────────────────────┤
│  P2 Medium  │  • Incremental chunk updates                      │
│             │  • Memory optimization for scale                  │
│             │  • Watch mode for development                     │
├─────────────┼───────────────────────────────────────────────────┤
│  P3 Low     │  • Circular dependency handling                   │
│             │  • Diff output mode                               │
│             │  • Output schema validation                       │
├─────────────┼───────────────────────────────────────────────────┤
│  P4 Future  │  • Vector embeddings for semantic search          │
│             │  • Call graph extraction                          │
│             │  • Test coverage linkage                          │
└─────────────┴───────────────────────────────────────────────────┘
```
