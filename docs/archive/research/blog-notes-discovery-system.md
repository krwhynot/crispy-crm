# Blog Notes: Building a Codebase Discovery Generator System

## The Problem: AI Assistants Can't See Your Codebase

When you ask an AI assistant to help with your codebase, it faces a fundamental challenge:
- **No persistent memory** - Each conversation starts fresh
- **Token limits** - Can't read entire codebases at once
- **Exploration overhead** - Spends tokens searching instead of solving

**The symptom:** AI assistants repeatedly ask "where is X?" or make incorrect assumptions about your architecture.

---

## The Solution: Pre-Computed Discovery Files

A Discovery Generator System creates **structured JSON "maps"** of your codebase that AI assistants can read instantly. Instead of exploring 500 files, the AI reads a single 30KB JSON file that tells it:
- What components exist
- Where they're located
- How they're connected
- What patterns they follow

### Before vs. After

| Without Discovery | With Discovery |
|-------------------|----------------|
| "Let me search for components..." (50+ file reads) | Reads `component-inventory.json` (1 file, 483 components) |
| "I found some hooks, let me explore..." (30+ file reads) | Reads `hooks-inventory.json` (1 file, 76 hooks) |
| Tokens spent exploring: ~50,000 | Tokens spent: ~7,000 |
| Time to understand codebase: 5-10 min | Time: 30 seconds |

---

## Core Architecture

### The Envelope Format

Every discovery file follows a standard structure:

```json
{
  "status": "complete",
  "generated_at": "2024-01-15T10:30:00Z",
  "generator": "scripts/discover/extractors/components.ts",
  "source_globs": ["src/**/*.tsx"],
  "checksum": "sha256:abc123...",
  "source_hashes": {
    "src/Button.tsx": "def456",
    "src/Modal.tsx": "ghi789"
  },
  "summary": {
    "total_items": 483,
    "form_controllers": 24,
    "presentational": 459
  },
  "components": [
    {
      "name": "Button",
      "file": "src/components/Button.tsx",
      "line": 12,
      "type": "presentational",
      "hooks": ["useState", "useCallback"]
    }
  ]
}
```

**Why this structure?**
- `status` - Indicates if generation completed successfully
- `generated_at` - When the file was created
- `generator` - Which script created it (for debugging)
- `source_globs` - What files were scanned
- `checksum` - Integrity verification
- `source_hashes` - Per-file hashes for **staleness detection**
- `summary` - Quick stats without parsing entire file
- `[payload]` - The actual discovery data (flat structure for token efficiency)

### Staleness Detection

The killer feature: **knowing when discovery files are outdated**.

```
Source Files          Discovery File
┌──────────────┐      ┌──────────────┐
│ Button.tsx   │──────│ hash: abc123 │
│ (modified)   │      │ (stale!)     │
└──────────────┘      └──────────────┘
```

How it works:
1. Discovery file stores hash of each source file
2. `--check` mode compares current file hashes vs. stored hashes
3. Reports which files changed, were added, or deleted
4. CI can fail builds if discovery is stale

---

## Directory Structure

```
your-project/
├── scripts/
│   └── discover/
│       ├── index.ts              # Orchestrator (CLI, parallel execution)
│       ├── extractors/
│       │   ├── components.ts     # React component extraction
│       │   ├── hooks.ts          # Custom hooks extraction
│       │   ├── schemas.ts        # Validation schemas
│       │   ├── types.ts          # TypeScript types
│       │   └── forms.ts          # Form patterns
│       └── utils/
│           ├── project.ts        # ts-morph Project singleton
│           └── output.ts         # Envelope format, atomic writes
├── docs/
│   └── _state/                   # Discovery output directory
│       ├── component-inventory.json
│       ├── hooks-inventory.json
│       ├── schemas-inventory.json
│       └── ...
└── justfile                      # Task runner commands
```

---

## Extractor Design Pattern

Each extractor follows this pattern:

```typescript
// extractors/components.ts
import { project } from "../utils/project.js";
import { createEnvelope, writeDiscoveryFile } from "../utils/output.js";

interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  type: "form_controller" | "presentational";
  hooks: string[];
}

export async function extractComponents(): Promise<void> {
  // 1. Gather source files
  const sourceFiles = project.addSourceFilesAtPaths("src/**/*.tsx");

  // 2. Extract information using AST
  const components: ComponentInfo[] = [];
  for (const file of sourceFiles) {
    // Use ts-morph to parse and extract
    const exports = file.getExportedDeclarations();
    // ... extraction logic
  }

  // 3. Build summary
  const summary = {
    total_items: components.length,
    form_controllers: components.filter(c => c.type === "form_controller").length,
  };

  // 4. Create envelope and write atomically
  const envelope = createEnvelope(
    "scripts/discover/extractors/components.ts",
    ["src/**/*.tsx"],
    sourceFiles.map(f => f.getFilePath()),
    summary,
    { components }
  );

  writeDiscoveryFile("component-inventory.json", envelope);
}
```

---

## What to Extract (By Framework)

### React Projects
| Extractor | What It Finds | Why It Matters |
|-----------|---------------|----------------|
| Components | Function components, their props, hooks used | Navigate component hierarchy |
| Hooks | Custom hooks, parameters, return types | Understand state management |
| Forms | Form patterns, validation, input types | Know data flow |
| Context | React contexts, providers, consumers | Understand state sharing |

### Backend Projects (Node/Express/Fastify)
| Extractor | What It Finds | Why It Matters |
|-----------|---------------|----------------|
| Routes | API endpoints, methods, middleware | API surface area |
| Models | Database models, relationships | Data structure |
| Services | Business logic classes/functions | Core functionality |
| Middleware | Auth, validation, error handlers | Request pipeline |

### Full-Stack Projects
Combine both, plus:
| Extractor | What It Finds | Why It Matters |
|-----------|---------------|----------------|
| API Contracts | Shared types between FE/BE | Type safety |
| Validation | Zod/Yup schemas | Data rules |
| Database | Tables, columns, relationships | Persistence layer |

---

## Chunking Large Discovery Files

When discovery files exceed ~100KB (~25,000 tokens), chunk them:

```
.claude/state/
├── component-inventory/          # Directory instead of single file
│   ├── manifest.json             # Index with chunk metadata
│   ├── contacts.json             # Feature-based chunk
│   ├── organizations.json
│   ├── shared.json
│   └── other.json
```

### Manifest Structure

```json
{
  "status": "complete",
  "generated_at": "2024-01-15T10:30:00Z",
  "chunks": {
    "contacts": {
      "file": "contacts.json",
      "component_count": 45,
      "checksum": "sha256:..."
    },
    "organizations": {
      "file": "organizations.json",
      "component_count": 38,
      "checksum": "sha256:..."
    }
  },
  "total_components": 483,
  "source_hashes": { /* all source files */ }
}
```

**Benefits:**
- AI loads only the relevant chunk (e.g., just "contacts" when working on contacts)
- Faster staleness checks
- Better cache utilization

---

## CLI Interface

```bash
# Run all extractors
just discover

# Check if discovery files are stale (for CI)
just discover-check

# Run specific extractors only
just discover --only=components,hooks

# Individual extractor commands
just discover-schemas
just discover-types
just discover-forms
```

### CI Integration

```yaml
# .github/workflows/ci.yml
- name: Check Discovery Freshness
  run: npx tsx scripts/discover/index.ts --check
  # Fails if any discovery file is stale
```

### Pre-Commit Hook

```bash
# .husky/pre-commit
npx tsx scripts/discover/index.ts --check || {
  echo "⚠️  Discovery files are stale. Run 'just discover' to update."
  # Non-blocking warning (don't fail commit)
}
```

---

## Multi-Session Implementation Pattern

For large implementations, split work across fresh AI sessions to prevent context degradation.

### Why Sessions Degrade

```
Session Quality Over Time:
100% ████████░░░░░░░░░░░░ 50% (context rot)
     │        │           │
   Start   45 min      90 min
```

### The Solution: Plan File as Persistent Memory

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAN FILE (Persistent)                      │
│          .claude/plans/my-plan.md                               │
│  Contains: All implementation details, prompts, verification    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────────┐
    │  Session 1  →  git commit  →  Session 2  →  git commit  →   │
    │    (fresh)                      (fresh)                     │
    └─────────────────────────────────────────────────────────────┘
```

### Session Design Rules

1. **One focused task per session** - Don't combine unrelated work
2. **Session prompt references plan file** - AI reads plan for context
3. **Commit after each session** - Git preserves work for next session
4. **Verification before moving on** - Test current work before starting next
5. **Parallel when possible** - Independent tasks in separate terminals

### Parallel Session Pattern

```
Session 1 (Foundation) ─────────────── Sequential
              │
              ├──→ Session 2 ─┐
              ├──→ Session 3 ──┼── PARALLEL (3 terminals)
              └──→ Session 4 ──┘
                      │
                      ↓
Session 5 (Integration) ─────────────── Sequential
```

**Requirements for parallelization:**
- Tasks create NEW files (no merge conflicts)
- Tasks don't depend on each other's output
- Shared file modifications deferred to integration session

### Session Prompt Template

```
Read the plan at .claude/plans/[plan-name].md, specifically the
"[Phase Name]" section.

[Specific task instructions]
1. Create [file path]
2. DO NOT modify [shared file] (integration session handles this)
3. Test with: [test command]
4. Verify: [verification command]
5. Commit just the new files

Skip [shared file] registration - another session handles that.
```

---

## Best Practices

### 1. Keep Structures Flat

```json
// GOOD: Flat, scannable
{
  "components": [
    { "name": "Button", "file": "...", "hooks": ["useState"] }
  ]
}

// BAD: Deeply nested
{
  "features": {
    "ui": {
      "components": {
        "buttons": {
          "primary": { ... }
        }
      }
    }
  }
}
```

### 2. Include Line Numbers

```json
{
  "name": "validateUser",
  "file": "src/validation/user.ts",
  "line": 45  // AI can jump directly to this location
}
```

### 3. Summarize at the Top

```json
{
  "summary": {
    "total_items": 483,
    "with_tests": 234,
    "without_tests": 249  // Quick insight without parsing
  },
  "items": [ /* full data */ ]
}
```

### 4. Atomic Writes

```typescript
// Write to temp file, then rename (prevents corruption)
fs.writeFileSync(tempPath, JSON.stringify(data));
fs.renameSync(tempPath, finalPath);  // Atomic on POSIX
```

### 5. Hash Everything

```typescript
// File content hash for staleness
const hash = crypto.createHash("sha256")
  .update(fs.readFileSync(filePath))
  .digest("hex")
  .slice(0, 12);  // 12 chars is enough
```

### 6. Fail Fast

```typescript
// If extraction fails, throw immediately
if (!sourceFiles.length) {
  throw new Error("No source files found matching glob");
}
```

---

## Integration with CLAUDE.md

Document discovery files in your `CLAUDE.md`:

```markdown
## Codebase Discovery

Before exploring the codebase manually, read these pre-computed discovery files:

| File | Contents | Use When |
|------|----------|----------|
| `.claude/state/component-inventory.json` | All React components | "Which components exist?" |
| `.claude/state/hooks-inventory.json` | Custom hooks | "What hooks are available?" |
| `.claude/state/schemas-inventory.json` | Validation schemas | "What validation rules exist?" |

These are auto-generated and CI-enforced fresh.

To regenerate: `just discover`
To check freshness: `just discover-check`
```

---

## Metrics: Before vs. After

### Token Usage (per conversation)

| Task | Without Discovery | With Discovery | Savings |
|------|-------------------|----------------|---------|
| "Find all form components" | ~50,000 tokens | ~8,000 tokens | 84% |
| "What hooks exist?" | ~30,000 tokens | ~5,000 tokens | 83% |
| "Understand architecture" | ~80,000 tokens | ~15,000 tokens | 81% |

### Time to Context

| Metric | Without | With |
|--------|---------|------|
| Time for AI to understand codebase | 5-10 min | 30 sec |
| Files AI needs to read | 50-200 | 3-5 |
| Probability of missed context | High | Low |

---

## Common Extractors Checklist

### Frontend (React/Vue/Svelte)
- [ ] Components (name, file, line, props, hooks/composables)
- [ ] Hooks/Composables (parameters, return type, dependencies)
- [ ] Forms (type, inputs, validation schema)
- [ ] Routes (path, component, guards)
- [ ] State stores (Zustand/Pinia/Redux slices)
- [ ] API calls (endpoint, method, request/response types)

### Backend (Node/Python/Go)
- [ ] Routes/Endpoints (method, path, handler, middleware)
- [ ] Models/Entities (fields, relationships, validations)
- [ ] Services (methods, dependencies)
- [ ] Middleware (order, purpose)
- [ ] Database schemas (tables, columns, indexes)
- [ ] Background jobs (schedule, handler)

### Shared
- [ ] TypeScript types/interfaces
- [ ] Validation schemas (Zod/Yup/Joi)
- [ ] Environment variables
- [ ] Feature flags
- [ ] Test coverage map

---

## Troubleshooting

### "Discovery files are always stale"

**Cause:** File hashes don't match because of:
- Line ending differences (CRLF vs LF)
- Auto-formatting on save
- Git hooks modifying files

**Fix:** Normalize line endings, run formatter before discovery.

### "Extraction is slow"

**Cause:** ts-morph parsing entire project on each run.

**Fix:**
- Use Project singleton (parse once)
- Cache compiled files
- Run extractors in parallel

### "AI ignores discovery files"

**Cause:** Not mentioned in CLAUDE.md or prompt.

**Fix:** Add explicit instructions:
```markdown
## IMPORTANT: Read discovery files BEFORE exploring
Always check `.claude/state/*.json` before using Glob/Grep.
```

---

## Conclusion

A Discovery Generator System transforms how AI assistants understand your codebase:

1. **Pre-compute** structured maps of your code
2. **Standardize** with envelope format for consistency
3. **Detect staleness** via file hashes
4. **Enforce freshness** via CI/pre-commit
5. **Document** in CLAUDE.md for AI awareness
6. **Chunk** large files for token efficiency
7. **Parallelize** implementation across sessions

The result: AI assistants that understand your codebase in seconds, not minutes, with higher accuracy and lower token costs.

---

## Resources

- [ts-morph](https://ts-morph.com/) - TypeScript AST manipulation
- [Anthropic Claude Code](https://docs.anthropic.com/claude-code) - AI coding assistant
- [Just](https://just.systems/) - Task runner
