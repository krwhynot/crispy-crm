# Discovery System Extension Plan

**Goal:** Extend the existing `scripts/discover/` framework with 3 new extractors AND implement feature-based chunking for large discovery files.

## Summary

| Deliverable | Output | Source Globs |
|-------------|--------|--------------|
| Schemas Extractor | `schemas-inventory.json` | `src/atomic-crm/validation/**/*.ts` |
| Types Extractor | `types-inventory.json` | `src/atomic-crm/**/types.ts`, `src/types/**/*.ts` |
| Forms Extractor | `forms-inventory.json` | `src/atomic-crm/**/*{Create,Edit,Form,Inputs}*.tsx` |
| **Component Chunking** | `component-inventory/manifest.json` + per-feature chunks | `src/atomic-crm/**/*.tsx` |

## Why Chunking?

The current `component-inventory.json` is **267KB (~67,000 tokens)** - too large for efficient AI processing. Chunking by feature folder enables:
- Selective loading of just the relevant feature area
- Faster staleness checks per feature
- Better cache utilization

## Critical Files

**Modify:**
- `scripts/discover/index.ts` - Add 3 new extractor registrations + chunking
- `scripts/discover/extractors/components.ts` - Output to directory instead of single file
- `scripts/discover/utils/output.ts` - Add chunked output utilities
- `justfile` - Add discover-schemas, discover-types, discover-forms commands

**Create:**
- `scripts/discover/extractors/schemas.ts`
- `scripts/discover/extractors/types.ts`
- `scripts/discover/extractors/forms.ts`

**New Output Structure:**
```
docs/_state/
├── component-inventory/           # Chunked (replaces single JSON)
│   ├── manifest.json              # Index + staleness for all chunks
│   ├── contacts.json              # ~45KB
│   ├── organizations.json         # ~35KB
│   ├── opportunities.json         # ~40KB
│   ├── activities.json            # ~20KB
│   ├── products.json              # ~15KB
│   ├── tasks.json                 # ~10KB
│   ├── shared.json                # Components in shared/, utils/, etc.
│   └── other.json                 # Remaining components
├── hooks-inventory.json           # Keep as-is (87KB is acceptable)
├── schemas-inventory.json         # NEW
├── types-inventory.json           # NEW
└── forms-inventory.json           # NEW
```

**Reference (read-only):**
- `scripts/discover/utils/output.ts` - Envelope format, atomic writes
- `scripts/discover/extractors/components.ts` - Pattern to follow
- `src/atomic-crm/validation/organizations.ts` - Test schema

---

## Phase 1: Schemas Extractor

**File:** `scripts/discover/extractors/schemas.ts`

### What to Extract

```typescript
interface SchemaInfo {
  name: string;                    // e.g., "organizationSchema"
  file: string;                    // relative path
  line: number;
  schemaType: "strictObject" | "object" | "enum" | "array" | "union" | "other";
  fields: SchemaField[];           // for object schemas
  relatedSchemas: string[];        // create/update variants
  validationFunctions: string[];   // e.g., validateOrganizationForSubmission
  hasTransforms: boolean;
  hasSuperRefine: boolean;
}

interface SchemaField {
  name: string;
  zodType: string;                 // "string", "coerce.number", "enum"
  constraints: string[];           // ["max(255)", "min(1)", "email()"]
  optional: boolean;
  nullable: boolean;
  hasTransform: boolean;
  hasDefault: boolean;
  enumValues?: string[];
}
```

### ts-morph Patterns

1. **Find Zod schemas:** Look for `VariableDeclaration` with `z.strictObject()` or `z.object()` initializer
2. **Extract fields:** Parse `ObjectLiteralExpression` inside `z.strictObject()`
3. **Detect constraints:** Find `.max()`, `.min()`, `.email()` method chains
4. **Detect coercion:** Match `z.coerce.number()` pattern
5. **Find validation functions:** Async functions containing `.parse()` calls

### Implementation Steps

1. Add source files: `src/atomic-crm/validation/**/*.ts` (exclude `__tests__`)
2. Find exported const declarations with Zod initializers
3. For each schema:
   - Extract name from variable name
   - Determine type from `z.xxx()` method
   - For object schemas: iterate properties
   - Build field info with constraints
4. Find related schemas (same base name prefix)
5. Find validation functions that use the schema
6. Call `createEnvelope()` and `writeDiscoveryFile()`

---

## Phase 2: Types Extractor

**File:** `scripts/discover/extractors/types.ts`

### What to Extract

```typescript
interface TypeInfo {
  name: string;
  file: string;
  line: number;
  kind: "interface" | "type_alias";
  properties?: PropertyInfo[];     // for interfaces
  extends?: string[];              // inheritance
  typeExpression?: string;         // for simple type aliases
  isComplex: boolean;
  derivedFrom?: string;            // if z.infer<typeof X>
}
```

### ts-morph Patterns

1. `sourceFile.getInterfaces()` - Get all interface declarations
2. `sourceFile.getTypeAliases()` - Get all type aliases
3. `interface.getExtends()` - Get inheritance chain
4. Detect `z.infer<typeof schemaName>` pattern in type alias

### Implementation Steps

1. Add source files:
   - `src/atomic-crm/types.ts`
   - `src/atomic-crm/**/types.ts`
   - `src/types/**/*.ts` (EXCLUDE `database.generated.ts` - 180KB auto-generated)
2. For interfaces: extract name, properties, extends
3. For type aliases: extract name, expression, detect z.infer
4. Skip types derived from z.infer (already covered by schemas)
5. Build envelope and write

---

## Phase 3: Forms Extractor

**File:** `scripts/discover/extractors/forms.ts`

### What to Extract

```typescript
interface FormInfo {
  componentName: string;
  file: string;
  line: number;
  formType: "react-admin-simple" | "react-admin-tabbed" | "react-admin-wizard" |
            "react-hook-form-direct" | "react19-action" | "unknown";
  formPatterns: {
    primary: string;
    secondary: string[];
  };
  inputComponents: string[];       // ["TextInput", "SelectInput"]
  validationSchemaRef?: string;    // Zod schema import
  hasZodResolver: boolean;
  features: {
    hasTabs: boolean;
    hasWizard: boolean;
    hasProgress: boolean;
  };
}
```

### Detection Patterns

**React Admin Forms:**
- JSX elements: `<Form>`, `<SimpleForm>`, `<TabbedForm>`, `<CreateBase>`, `<EditBase>`
- Hook: `useForm()` from react-admin or react-hook-form
- Tabs: `<TabbedFormInputs>`, `<FormTab>`
- Wizard: `<FormWizard>`

**React 19 Forms:**
- Hooks: `useActionState()`, `useFormStatus()`

**Validation Detection:**
- Import from `../validation/*`
- `zodResolver(schemaName)` call

### Implementation Steps

1. Add source files: `*Create*.tsx`, `*Edit*.tsx`, `*Form*.tsx`, `*Inputs*.tsx`
2. For each file, find exported function components
3. Analyze JSX for form wrapper components
4. Detect useForm/useActionState hook calls
5. Find zodResolver usage and extract schema name
6. Collect input component names (match `*Input` pattern)
7. Detect tabbed/wizard features
8. Build envelope and write

---

## Phase 4: Integration

### Update `scripts/discover/index.ts`

Add to EXTRACTORS registry:

```typescript
schemas: {
  name: "schemas",
  label: "Zod Schemas",
  outputFile: "schemas-inventory.json",
  extractFn: extractSchemas,
  getSourceFiles: () => {
    const files = project.addSourceFilesAtPaths("src/atomic-crm/validation/**/*.ts");
    return files.map(f => f.getFilePath()).filter(p => !p.includes("__tests__"));
  },
},
types: {
  name: "types",
  label: "TypeScript Types",
  outputFile: "types-inventory.json",
  extractFn: extractTypes,
  getSourceFiles: () => {
    const globs = ["src/atomic-crm/types.ts", "src/atomic-crm/**/types.ts", "src/types/**/*.ts"];
    const files = project.addSourceFilesAtPaths(globs);
    return files.map(f => f.getFilePath()).filter(p => !p.includes("database.generated.ts"));
  },
},
forms: {
  name: "forms",
  label: "Forms",
  outputFile: "forms-inventory.json",
  extractFn: extractForms,
  getSourceFiles: () => {
    const globs = ["src/atomic-crm/**/*Create*.tsx", "src/atomic-crm/**/*Edit*.tsx",
                   "src/atomic-crm/**/*Form*.tsx", "src/atomic-crm/**/*Inputs*.tsx"];
    const files = project.addSourceFilesAtPaths(globs);
    return files.map(f => f.getFilePath()).filter(p => !p.includes("__tests__"));
  },
},
```

### Update `justfile`

```just
# Individual extractor commands
discover-schemas:
    npx tsx scripts/discover/index.ts --only=schemas

discover-types:
    npx tsx scripts/discover/index.ts --only=types

discover-forms:
    npx tsx scripts/discover/index.ts --only=forms

# All new extractors
discover-new:
    npx tsx scripts/discover/index.ts --only=schemas,types,forms
```

---

## Phase 5: Component Chunking

**Goal:** Split the 267KB `component-inventory.json` into feature-based chunks.

### Feature Folder Mapping

```typescript
const FEATURE_CHUNKS: Record<string, string[]> = {
  "contacts": ["src/atomic-crm/contacts/"],
  "organizations": ["src/atomic-crm/organizations/"],
  "opportunities": ["src/atomic-crm/opportunities/"],
  "activities": ["src/atomic-crm/activities/", "src/atomic-crm/activity-log/"],
  "products": ["src/atomic-crm/products/", "src/atomic-crm/productDistributors/"],
  "tasks": ["src/atomic-crm/tasks/"],
  "notes": ["src/atomic-crm/notes/"],
  "reports": ["src/atomic-crm/reports/", "src/atomic-crm/dashboard/"],
  "shared": ["src/components/", "src/atomic-crm/shared/"],
  "other": [] // Catch-all for remaining
};
```

### Manifest Structure

```typescript
interface ChunkedManifest {
  status: "complete";
  generated_at: string;
  generator: "scripts/discover/extractors/components.ts";
  chunks: {
    [chunkName: string]: {
      file: string;           // e.g., "contacts.json"
      component_count: number;
      source_files: number;
      checksum: string;
    };
  };
  total_components: number;
  source_hashes: Record<string, string>; // All source files
}
```

### Chunk File Structure

Each chunk follows the same envelope format:
```typescript
{
  status: "complete",
  generated_at: string,
  generator: string,
  feature: "contacts",           // Feature name
  source_globs: ["src/atomic-crm/contacts/**/*.tsx"],
  checksum: string,
  source_hashes: Record<string, string>,
  summary: { total_items: number, form_controllers: number, presentational: number },
  components: ComponentInfo[]
}
```

### Modify `extractors/components.ts`

```typescript
export async function extractComponents(): Promise<void> {
  // ... existing extraction logic ...

  // Group components by feature
  const chunks = groupByFeature(components);

  // Write each chunk + manifest
  writeChunkedDiscovery("component-inventory", chunks, sourceFilePaths);
}

function groupByFeature(components: ComponentInfo[]): Map<string, ComponentInfo[]> {
  const chunks = new Map<string, ComponentInfo[]>();

  for (const component of components) {
    const feature = detectFeature(component.file);
    if (!chunks.has(feature)) chunks.set(feature, []);
    chunks.get(feature)!.push(component);
  }

  return chunks;
}

function detectFeature(filePath: string): string {
  for (const [feature, prefixes] of Object.entries(FEATURE_CHUNKS)) {
    if (prefixes.some(prefix => filePath.startsWith(prefix))) {
      return feature;
    }
  }
  return "other";
}
```

### Modify `utils/output.ts`

Add new functions:
```typescript
export function writeChunkedDiscovery(
  baseName: string,
  chunks: Map<string, unknown[]>,
  allSourceFiles: string[]
): void {
  const outputDir = path.join(process.cwd(), "docs/_state", baseName);
  ensureDir(outputDir);

  const manifest: ChunkedManifest = {
    status: "complete",
    generated_at: new Date().toISOString(),
    generator: `scripts/discover/extractors/${baseName.replace("-inventory", "")}.ts`,
    chunks: {},
    total_components: 0,
    source_hashes: buildSourceHashes(allSourceFiles)
  };

  for (const [feature, items] of chunks) {
    const chunkFile = `${feature}.json`;
    const envelope = createEnvelope(...);
    writeDiscoveryFile(path.join(baseName, chunkFile), envelope);

    manifest.chunks[feature] = {
      file: chunkFile,
      component_count: items.length,
      source_files: /* count */,
      checksum: envelope.checksum
    };
    manifest.total_components += items.length;
  }

  // Write manifest
  writeAtomicJson(path.join(outputDir, "manifest.json"), manifest);
}

export function isChunkedDiscoveryStale(baseName: string, sourceFiles: string[]): StalenessResult {
  const manifestPath = path.join(process.cwd(), "docs/_state", baseName, "manifest.json");
  // Compare source_hashes in manifest with current files
}
```

### Update Staleness Check

The `--check` flag should:
1. Read `component-inventory/manifest.json`
2. Compare `source_hashes` against current source files
3. Report which chunks are stale (if any)

---

## Session Execution Order

**Why split sessions?** Context rot degrades quality in long conversations. Each phase is designed to run in a **fresh Claude session** (~30-60 min each).

### Execution Flow (with Parallel)

```
Session 1 (Chunking) ─────────────── 40 min
              │
              ├──→ Session 2 (Schemas) ─┐
              ├──→ Session 3 (Types)  ──┼── PARALLEL (40 min total)
              └──→ Session 4 (Forms)  ──┘
                            │
                            ↓
              Session 5 (Integration) ─── 20 min
                                          ═══════
                              Total: ~2 hours
```

### Session 1: Component Chunking (FIRST - Sequential)

```
Read the plan at .claude/plans/atomic-forging-key.md, specifically the
"Phase 5: Component Chunking" section.

Implement component chunking:
1. Update scripts/discover/utils/output.ts with writeChunkedDiscovery()
2. Modify scripts/discover/extractors/components.ts to output by feature
3. Update index.ts to handle chunked output staleness checks
4. Test with: just discover --only=components
5. Verify docs/_state/component-inventory/ has manifest + feature chunks

Reference existing patterns in the codebase. Commit when working.
```

**Verification:** `ls docs/_state/component-inventory/` shows manifest.json + feature chunks

**After this completes → Open 3 terminals for parallel Sessions 2-4**

---

## Tips for Session Success

1. **Start each session fresh** - Don't continue from a previous conversation
2. **Reference the plan file** - Each session reads `.claude/plans/atomic-forging-key.md`
3. **Commit after each session** - Creates checkpoints you can revert to
4. **Test before moving on** - Don't start Session N+1 until Session N passes verification
5. **Keep sessions focused** - One phase per session, ~30-60 min each

---

## Parallel Execution Strategy

Sessions 2, 3, 4 run **simultaneously in separate terminals** since they create independent files:

```
     ┌──────────────────┐
     │  Session 1       │
     │  Chunking        │  ← Must be first (modifies utils)
     └────────┬─────────┘
              │
     ┌────────┴─────────┐
     ↓        ↓         ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│Terminal1│  │Terminal2│  │Terminal3│
│ Schemas │  │  Types  │  │  Forms  │  ← Run in PARALLEL
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  ↓
          ┌──────────────┐
          │  Session 5   │
          │  Integration │  ← Merges all, must be last
          └──────────────┘
```

**Time savings:**
- Sequential: 5 sessions × 40 min = 200 min (~3.5 hours)
- Parallel: 40 + 40 + 40 = 120 min (~2 hours)
- Savings: 40% faster!

**How to run parallel sessions:**
```bash
# Terminal 1
cd ~/projects/crispy-crm && claude
# Paste Session 2 prompt (schemas)

# Terminal 2 (simultaneously)
cd ~/projects/crispy-crm && claude
# Paste Session 3 prompt (types)

# Terminal 3 (simultaneously)
cd ~/projects/crispy-crm && claude
# Paste Session 4 prompt (forms)
```

---

### Parallel Session Prompts (Sessions 2-4)

**IMPORTANT:** These prompts skip index.ts registration - Session 5 handles that.

#### Session 2: Schemas (Terminal 1)
```
Read the plan at .claude/plans/atomic-forging-key.md, specifically the
"Phase 1: Schemas Extractor" section.

Create the Zod schemas extractor ONLY:
1. Create scripts/discover/extractors/schemas.ts (follow components.ts pattern)
2. DO NOT modify index.ts (Session 5 will do this)
3. Test directly: npx tsx -e "import('./scripts/discover/extractors/schemas.js').then(m => m.extractSchemas())"
4. Verify output appears in docs/_state/schemas-inventory.json
5. Commit just the new extractor file

Skip index.ts registration - another session handles that.
```

#### Session 3: Types (Terminal 2)
```
Read the plan at .claude/plans/atomic-forging-key.md, specifically the
"Phase 2: Types Extractor" section.

Create the TypeScript types extractor ONLY:
1. Create scripts/discover/extractors/types.ts
2. DO NOT modify index.ts (Session 5 will do this)
3. Exclude database.generated.ts (180KB auto-generated)
4. Skip z.infer<typeof X> derived types (mark as derivedFrom)
5. Test directly: npx tsx -e "import('./scripts/discover/extractors/types.js').then(m => m.extractTypes())"
6. Verify output appears in docs/_state/types-inventory.json
7. Commit just the new extractor file

Skip index.ts registration - another session handles that.
```

#### Session 4: Forms (Terminal 3)
```
Read the plan at .claude/plans/atomic-forging-key.md, specifically the
"Phase 3: Forms Extractor" section.

Create the forms extractor detecting BOTH patterns:
- React Admin: <Form>, <SimpleForm>, <TabbedForm>, useForm()
- React 19: useActionState, useFormStatus

Steps:
1. Create scripts/discover/extractors/forms.ts
2. DO NOT modify index.ts (Session 5 will do this)
3. Detect zodResolver() and link to validation schemas
4. Test directly: npx tsx -e "import('./scripts/discover/extractors/forms.js').then(m => m.extractForms())"
5. Verify output appears in docs/_state/forms-inventory.json
6. Commit just the new extractor file

Skip index.ts registration - another session handles that.
```

---

### Session 5: Integration (After 2-4 Complete)

**Wait for all parallel sessions to complete and commit, then run:**

```
Read the plan at .claude/plans/atomic-forging-key.md.

All extractors are now created. Complete integration:
1. Pull latest: git pull (if working on branches)
2. Check that these files exist:
   - scripts/discover/extractors/schemas.ts
   - scripts/discover/extractors/types.ts
   - scripts/discover/extractors/forms.ts
3. Register ALL THREE in scripts/discover/index.ts
4. Add justfile commands: discover-schemas, discover-types, discover-forms
5. Run: just discover (should run all 5 extractors)
6. Run: just discover-check (all should be fresh)
7. Update CLAUDE.md with new discovery descriptions
8. Commit everything

This is the final session - ensure all outputs work together.
```

---

## Verification

After implementation, run:

```bash
# Run all extractors
just discover

# Check freshness (should all be fresh)
just discover-check

# Verify chunked component output
ls -la docs/_state/component-inventory/

# Verify new single-file outputs
ls -la docs/_state/*.json
```

Expected output structure:
```
docs/_state/
├── component-inventory/
│   ├── manifest.json        # Index of all chunks
│   ├── contacts.json        # ~45KB
│   ├── organizations.json   # ~35KB
│   ├── opportunities.json   # ~40KB
│   ├── activities.json      # ~20KB
│   ├── products.json        # ~15KB
│   ├── tasks.json           # ~10KB
│   ├── notes.json           # ~5KB
│   ├── reports.json         # ~15KB
│   ├── shared.json          # ~30KB
│   └── other.json           # remaining
├── hooks-inventory.json     # (unchanged, 87KB)
├── schemas-inventory.json   # NEW (~30KB)
├── types-inventory.json     # NEW (~20KB)
└── forms-inventory.json     # NEW (~25KB)
```

---

## Design Decisions

1. **Nesting Depth:** Extract nested Zod object fields to 1 level only (prevents verbose output)
2. **Skip z.infer Types:** Types derived from `z.infer<typeof schema>` are marked but not duplicated
3. **Hybrid Forms:** Use `formPatterns.primary` + `formPatterns.secondary[]` for components using multiple patterns
4. **Cross-References:** Forms link to their validation schemas via `validationSchemaRef`
