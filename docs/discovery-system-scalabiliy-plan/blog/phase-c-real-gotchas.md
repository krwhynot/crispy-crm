# The Gotchas That Actually Bit Us

You will hit every one of these.

Not maybe. Not if you're careless. These are the invisible walls that documentation doesn't mention. The errors that make you question your sanity at 2 AM.

We discovered each one the hard way so you don't have to.

---

## The SCIP CLI Doesn't Exist

Here's what every tutorial says:

```bash
npm install -g @sourcegraph/scip
```

Here's what actually happens:

```
npm error 404 '@sourcegraph/scip@*' is not in this registry
```

That package doesn't exist.

The SCIP snapshot CLI is a Go binary. Go is a compiled language from Google. The tools live in a different ecosystem entirely.

It's like showing up at a car dealership expecting to buy a boat.

**The fix:**

```bash
go install github.com/sourcegraph/scip/cmd/scip@latest
```

Or download the binary from GitHub releases. Or skip the CLI entirely and use the protobuf library in Node.

---

## Ollama Speaks a Different Language

OpenAI set the standard for embedding APIs. Everyone copies it.

Except Ollama.

```json
// What you'll try (OpenAI style)
{ "input": "text to embed" }

// What Ollama expects
{ "prompt": "text to embed" }
```

One field name. Hours of debugging.

The response differs too. OpenAI returns `embeddings` (plural, nested array). Ollama returns `embedding` (singular, flat array).

It's like ordering at a restaurant where the menu is in a slightly different dialect.

**The working version:**

```typescript
const response = await fetch('http://localhost:11434/api/embeddings', {
  body: JSON.stringify({
    model: 'nomic-embed-text',
    prompt: text,  // NOT "input"
  }),
});
const { embedding } = await response.json(); // NOT "embeddings"
```

---

## Ollama Has No Batch Mode

OpenAI lets you embed 100 texts in one request.

Ollama processes one at a time. Period.

500 code chunks? That's 500 HTTP requests. Sequential. About 5 seconds total at 100 embeddings per second.

There's no workaround. No hidden batch endpoint. No clever parallelization without running multiple Ollama instances.

You just wait.

It's like a coffee shop with one barista and no espresso machine automation.

For most codebases, 5 seconds is fine. Just don't expect OpenAI-level throughput.

---

## The Model Must Already Exist

Your first embedding request will fail.

```
Error 404: Model "nomic-embed-text" not found
```

Ollama doesn't auto-download models. You have to pull them explicitly first.

```bash
ollama pull nomic-embed-text
```

That's an 800MB download. First-time indexing waits for it.

It's like a vending machine that requires you to stock it yourself before buying.

**Pro tip:** Add `just discover-pull-model` to your setup script.

---

## Empty Strings Return Real Vectors

This one's subtle.

```typescript
await generateEmbedding("")  // Returns [0, 0, 0, ... 768 zeros]
```

A valid 768-dimensional vector. Technically correct. Semantically useless.

Those zeros pollute your search results. They match everything equally poorly.

Filter empty content before embedding. Always.

---

## TypeScript and TSX Need Different Parsers

Tree-sitter is a parsing library. It converts source code into a syntax tree you can navigate programmatically.

Here's the trap: TypeScript and TSX are different grammars.

```typescript
// This parser can't see JSX
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);
parser.parse('<Button />');  // Confusion ensues
```

JSX is the syntax React uses for components. Looks like HTML inside JavaScript.

Using the TypeScript parser on TSX files? The JSX nodes become invisible.

It's like using an English dictionary to read Spanish. Some words match. Most don't.

**The fix:**

```typescript
const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
```

Two parsers. Choose by file extension.

---

## Arrow Functions Hide Their Names

Regular functions wear name tags:

```typescript
function greet() {}
node.childForFieldName('name')  // Returns "greet"
```

Arrow functions don't:

```typescript
const greet = () => {}
node.childForFieldName('name')  // Returns null
```

The name lives in the parent, not the function itself.

An arrow function is assigned to a variable. The variable has the name. The function is anonymous.

It's like asking a package what's inside when the label is on the shelf.

**The fix:** Climb up to the parent `variable_declarator`:

```typescript
function extractArrowFunctionName(node: SyntaxNode): string | null {
  if (node.parent?.type === 'variable_declarator') {
    return node.parent.childForFieldName('name')?.text ?? null;
  }
  return null;
}
```

---

## Export Detection Is Ancestry Archaeology

How many nodes between a function and its export statement?

It depends.

```typescript
// Direct export: 1 level up
export function foo() {}

// Arrow export: 3 levels up
export const foo = () => {}
```

The path is: arrow function → variable_declarator → lexical_declaration → export_statement.

Don't check just the parent. Walk the ancestors.

It's like asking "who's your boss" when the org chart has variable depth.

---

## Line Numbers Start at Zero

Programmers count from zero. Humans count from one.

```typescript
node.startPosition.row  // 0 for the first line
node.endPosition.row    // 9 for the tenth line
```

Every line number you display needs `+ 1`.

It's like a building with no ground floor.

---

## Positions and Indices Are Different Things

This error wastes hours:

```typescript
// WRONG: positions are row/column pairs
content.substring(node.startPosition.column, node.endPosition.column)

// RIGHT: indices are byte offsets
content.slice(node.startIndex, node.endIndex)
```

Position tells you where something is in a grid (row 5, column 12).

Index tells you the byte offset from the start of the file.

Use indices for slicing content. Always.

---

## Qdrant Rejects String IDs

Vector databases store points. Each point has an ID, a vector, and metadata.

Qdrant IDs must be numbers or UUIDs. Not strings.

```typescript
// FAILS
{ id: 'component:ContactList', vector: [...] }

// WORKS
{ id: 42, vector: [...], payload: { originalId: 'component:ContactList' } }
```

Your semantic identifier goes in the payload. The database gets a number.

It's like a library that assigns call numbers but lets you write whatever title you want on the spine.

**The mapping pattern:**

```typescript
const idMap = new Map<string, number>();
let nextId = 1;

function getNumericId(stringId: string): number {
  if (!idMap.has(stringId)) idMap.set(stringId, nextId++);
  return idMap.get(stringId)!;
}
```

---

## search() Is Dead, Long Live query()

The Qdrant client has two methods that do similar things.

```typescript
// Deprecated (still works, warns in logs)
await qdrant.search('collection', { vector: [...] });

// Current (recommended)
await qdrant.query('collection', { query: [...] });
```

Same result. Different name. The API evolved.

It's like asking for a "tape" at a music store. They know what you mean. But it dates you.

---

## Case Sensitivity Strikes Again

Creating a Qdrant collection requires specifying a distance metric. Cosine similarity is standard.

```typescript
// WRONG
{ distance: 'cosine' }

// RIGHT
{ distance: 'Cosine' }
```

Capital C. That's it. That's the whole gotcha.

One character. Cryptic error message. Twenty minutes of confusion.

---

## Creating Collections Isn't Idempotent

Idempotent means "running twice produces the same result as running once."

`createCollection` isn't idempotent.

```typescript
await qdrant.createCollection('col', {...});
await qdrant.createCollection('col', {...});  // Throws!
```

But `deleteCollection` is:

```typescript
await qdrant.deleteCollection('nonexistent');  // Silent success
```

Asymmetric behavior. Check existence before creating.

**The pattern:**

```typescript
const { exists } = await qdrant.collectionExists('col');
if (!exists) {
  await qdrant.createCollection('col', {...});
}
```

---

## Health Checks Lie

The docs suggest `/health` returns JSON.

```bash
curl http://localhost:6333/health
# Returns empty 200 with no body
```

Use the root endpoint instead:

```bash
curl http://localhost:6333
# Returns {"title":"qdrant","version":"1.x.x"}
```

It's like a doctor who just nods instead of giving test results.

---

## Docker Names Are Predictable (But Not Obvious)

Docker Compose generates container names from your project directory and service name.

```bash
# From crispy-crm directory
docker exec crispy-crm-ollama-1 ollama pull nomic-embed-text

# NOT this (fails)
docker exec ollama ollama pull nomic-embed-text
```

The pattern: `<project-dir>-<service>-<instance>`.

It's like how hotels number rooms by floor. Predictable once you know the system.

---

## Services Need Warmup Time

Containers start fast. Services inside them don't.

```bash
docker compose up -d qdrant ollama
curl http://localhost:6333  # Connection refused
```

Wait three seconds. Try again. Works.

Health checks in automation need retry logic or sleep delays.

It's like expecting a computer to boot instantly because you pressed the power button.

---

## Writes Can Be Async By Default

Qdrant acknowledges writes before persisting them.

```typescript
// Returns immediately, might not be persisted yet
await qdrant.upsert('col', { points: [...] });

// Waits for actual persistence
await qdrant.upsert('col', { points: [...], wait: true });
```

For indexing scripts that query immediately after writing, `wait: true` prevents race conditions.

It's like the difference between "message sent" and "message delivered."

---

## TypeScript Doesn't Know Your Payloads

Qdrant payload types are `unknown`. TypeScript can't help.

```typescript
const result = await qdrant.query(...);
const payload = result.points[0].payload;  // Type: unknown
```

You need explicit assertions:

```typescript
const payload = result.points[0].payload as CodePointPayload;
```

Not ideal. But necessary.

---

## The Cursor Needs Manual Navigation

Tree-sitter cursors are efficient. They're also easy to lose.

```typescript
const cursor = node.walk();

function visit() {
  // Process current node
  if (cursor.gotoFirstChild()) {
    do {
      visit();
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();  // FORGET THIS AND YOU'RE LOST
  }
}
```

Always return to parent after visiting children.

It's like leaving breadcrumbs in a maze but forgetting to pick them up on the way back.

---

## Summary: The Traps That Got Us

| Category | Gotcha | Pain Level |
|----------|--------|------------|
| SCIP | CLI is Go, not npm | Medium |
| Ollama | Different API field names | High |
| Ollama | No batch endpoint | Low |
| Ollama | Model must be pre-pulled | Medium |
| Tree-sitter | TS vs TSX need different parsers | High |
| Tree-sitter | Arrow function names in parent | Medium |
| Tree-sitter | Indices vs positions | High |
| Qdrant | String IDs rejected | High |
| Qdrant | search() deprecated | Low |
| Qdrant | Case-sensitive distance | Medium |
| Docker | Naming convention | Low |
| Docker | Service warmup time | Medium |

Every single one is documented somewhere.

None of them are documented where you'll look first.

Now you know.

---

*Part 11 of 12: Building Local Code Intelligence*
