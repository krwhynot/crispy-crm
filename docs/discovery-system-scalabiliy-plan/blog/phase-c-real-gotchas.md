# Phase C: Real Gotchas Discovered During Implementation

> **Status:** Documented after Phase B implementation
> **Date:** 2025-12-27
> **Purpose:** Update placeholder gotchas in blog articles with real discoveries

---

## Article 2: SCIP Installation Gotchas

### 1. `@sourcegraph/scip` CLI Doesn't Exist in npm

**What the docs said:** `npm install -g @sourcegraph/scip`

**What actually happened:**
```
npm error 404 '@sourcegraph/scip@*' is not in this registry
```

**Reality:** The SCIP snapshot CLI is a Go binary, not an npm package. Use:
- `go install github.com/sourcegraph/scip/cmd/scip@latest`
- Or download from GitHub releases
- Or use the protobuf library directly in Node

**Blog update needed:** Article 3 needs to explain that SCIP snapshots require the Go CLI, not an npm package.

---

## Article 7: Ollama Embedding Gotchas

### 1. Different API Structure Than OpenAI

**OpenAI API:**
```json
{
  "input": "text to embed",
  "model": "text-embedding-3-small"
}
```

**Ollama API:**
```json
{
  "prompt": "text to embed",    // NOT "input"
  "model": "nomic-embed-text"
}
```

**Response also differs:**
- OpenAI: `{ embeddings: [[...]] }`
- Ollama: `{ embedding: [...] }` (singular, not nested)

### 2. No Batch Endpoint

Ollama processes one embedding at a time. For 500 code chunks:
- Sequential: ~5 seconds @ 100 embeddings/sec
- No way to batch-parallelize without multiple Ollama instances

**Workaround:** Accept sequential processing or run multiple Ollama containers.

### 3. Model Must Be Pre-Pulled

First embedding call fails if model not pulled:
```
Error 404: Model "nomic-embed-text" not found
```

**Solution:** `just discover-pull-model` before indexing.

### 4. Empty Strings Return Valid Embeddings

Empty string produces 768 zeros - valid but meaningless:
```typescript
await generateEmbedding("") // Returns [0, 0, 0, ... 768 times]
```

**Gotcha:** Always filter empty/trivial content before embedding.

### 5. Model Tags Include Version

When checking available models, names include version:
```json
{ "models": [{ "name": "nomic-embed-text:latest" }] }
```

**Gotcha:** Match with `startsWith()` not exact equals.

---

## Article 8: Tree-sitter Chunking Gotchas

### 1. Separate Parsers for TS vs TSX

**Wrong:**
```typescript
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);
// Parsing .tsx file with TypeScript parser = JSX not recognized!
```

**Right:**
```typescript
const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);  // Different grammar!

// Choose based on file extension
const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
```

### 2. Arrow Functions Have No Name Field

```typescript
// function_declaration has name field
node.childForFieldName('name') // Returns "greet" for: function greet() {}

// arrow_function does NOT have name field
node.childForFieldName('name') // Returns null for: const greet = () => {}
```

**Solution:** Traverse UP to parent `variable_declarator`:
```typescript
function extractArrowFunctionName(node: SyntaxNode): string | null {
  const parent = node.parent;
  if (parent?.type === 'variable_declarator') {
    return parent.childForFieldName('name')?.text ?? null;
  }
  return null;
}
```

### 3. Export Detection Requires Ancestry Traversal

Export depth varies by syntax:
```typescript
// Depth 1: parent is export_statement
export function foo() {}

// Depth 3: arrow function → variable_declarator → lexical_declaration → export_statement
export const foo = () => {}
```

**Gotcha:** Check multiple ancestor levels.

### 4. Line Numbers Are 0-Indexed

```typescript
node.startPosition.row  // 0 for first line
node.endPosition.row    // 9 for 10th line

// Human-readable:
const startLine = node.startPosition.row + 1;
```

### 5. Use Indices for Content, Not Positions

**Wrong:**
```typescript
content.substring(startPosition.column, endPosition.column) // WRONG
```

**Right:**
```typescript
content.slice(node.startIndex, node.endIndex) // Correct!
```

`startPosition`/`endPosition` are row/column pairs. `startIndex`/`endIndex` are byte offsets.

### 6. JSX Detection Requires Node Type Checking

To identify React components:
```typescript
function hasJsxReturn(node: SyntaxNode): boolean {
  // Check for any of these node types in function body
  const jsxTypes = [
    'jsx_element',           // <div>...</div>
    'jsx_self_closing_element', // <Component />
    'jsx_fragment'           // <>...</>
  ];
  // ... traverse body looking for these types
}
```

### 7. TreeCursor Requires Manual Parent Return

```typescript
const cursor = node.walk();

function visit() {
  // Process current node

  if (cursor.gotoFirstChild()) {
    do {
      visit();
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();  // MUST call or cursor is lost!
  }
}
```

---

## Article 9: Qdrant Gotchas

### 1. Point IDs Must Be Numeric or UUID

**Wrong:**
```typescript
await qdrant.upsert('collection', {
  points: [{ id: 'component:ContactList', vector: [...] }]  // FAILS
});
```

**Right:**
```typescript
// Use incremental numeric IDs, store original in payload
let nextId = 1;
const idMap = new Map<string, number>();

function getNumericId(stringId: string): number {
  if (!idMap.has(stringId)) idMap.set(stringId, nextId++);
  return idMap.get(stringId)!;
}

await qdrant.upsert('collection', {
  points: [{
    id: getNumericId('component:ContactList'),
    vector: [...],
    payload: { originalId: 'component:ContactList' }  // Preserve for retrieval
  }]
});
```

### 2. `search()` Is Deprecated - Use `query()`

```typescript
// Old (deprecated)
await qdrant.search('collection', { vector: [...], limit: 10 });

// New (recommended)
await qdrant.query('collection', { query: [...], limit: 10 });
```

### 3. Distance Metric Is Case-Sensitive

```typescript
// WRONG
await qdrant.createCollection('col', { vectors: { distance: 'cosine' } });

// RIGHT
await qdrant.createCollection('col', { vectors: { distance: 'Cosine' } });
```

### 4. `createCollection` Throws If Exists

```typescript
// This throws on second call
await qdrant.createCollection('col', {...});
await qdrant.createCollection('col', {...}); // Error!

// Use idempotent pattern
const { exists } = await qdrant.collectionExists('col');
if (!exists) {
  await qdrant.createCollection('col', {...});
}
```

### 5. Health Check Returns Empty 200

```bash
# Docs suggest /health returns JSON
curl http://localhost:6333/health
# Returns empty 200 with no body!

# Use root endpoint for version info
curl http://localhost:6333
# Returns {"title":"qdrant","version":"1.x.x"}
```

### 6. `deleteCollection` Succeeds Even If Missing

```typescript
// No error if collection doesn't exist
await qdrant.deleteCollection('nonexistent'); // Silent success
```

### 7. Use `wait: true` for Synchronous Writes

```typescript
// Async write (returns before persisted)
await qdrant.upsert('col', { points: [...] });

// Sync write (waits for persistence)
await qdrant.upsert('col', { points: [...], wait: true });
```

### 8. TypeScript Type Assertions Needed

```typescript
// Payload type is `unknown`, needs assertion
const result = await qdrant.query(...);
const payload = result.points[0].payload as unknown as CodePointPayload;
```

---

## Article 10: Docker & Infrastructure Gotchas

### 1. Container Naming Convention

Docker Compose naming: `<project-dir>-<service>-<instance>`

```bash
# If running from crispy-crm directory
docker exec crispy-crm-ollama-1 ollama pull nomic-embed-text

# NOT
docker exec ollama ollama pull nomic-embed-text  # FAILS
```

### 2. Volume Ownership Issues

Docker volumes default to root:root ownership:
```
.claude/qdrant/  → root:root
.claude/ollama/  → root:root
```

**Gotcha:** May need chmod/chown for non-root access.

### 3. Service Startup Timing

Services need warmup time:
```bash
docker compose up -d qdrant ollama
# Immediate curl fails:
curl http://localhost:6333  # Connection refused

# Wait ~3 seconds
sleep 3
curl http://localhost:6333  # Success
```

**Gotcha:** Add health check waits in automation.

### 4. Ollama Model Download Timing

First `ollama pull nomic-embed-text` downloads ~800MB:
```
pulling manifest
pulling 8dd... 80%   600 MB/s
```

**Gotcha:** First indexing waits for model download if not pre-pulled.

---

## Summary: Blog Articles to Update

| Article | Placeholder | Real Gotcha |
|---------|-------------|-------------|
| 2 | TBD | SCIP CLI is Go binary, not npm |
| 7 | TBD | Ollama uses "prompt", returns singular "embedding" |
| 7 | TBD | No batch endpoint, ~100 embeddings/sec |
| 8 | TBD | Separate parsers for TS vs TSX |
| 8 | TBD | Arrow functions need parent traversal for name |
| 8 | TBD | Use indices not positions for content |
| 9 | TBD | IDs must be numeric, store originalId in payload |
| 9 | TBD | Use query() not deprecated search() |
| 9 | TBD | Distance metrics are case-sensitive |
| 10 | TBD | Container naming is project-service-instance |
| 10 | TBD | Services need warmup time |

---

## Code Snippets for Blog

### Correct Ollama Embedding Request
```typescript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'nomic-embed-text',
    prompt: text,  // NOT "input"
  }),
});
const { embedding } = await response.json(); // NOT "embeddings"
```

### Correct Qdrant Upsert with ID Mapping
```typescript
const idMap = new Map<string, number>();
let nextId = 1;

function upsertWithStringIds(points: Array<{ id: string; vector: number[]; payload: any }>) {
  return qdrant.upsert('collection', {
    wait: true,
    points: points.map(p => ({
      id: idMap.get(p.id) ?? idMap.set(p.id, nextId++).get(p.id)!,
      vector: p.vector,
      payload: { ...p.payload, originalId: p.id },
    })),
  });
}
```

### Correct Tree-sitter Parser Selection
```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

function parseFile(filePath: string, content: string) {
  const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
  return parser.parse(content);
}
```

---

**Next Step:** Update each blog article's `[GOTCHA: TBD after implementation]` placeholders with these real discoveries.
