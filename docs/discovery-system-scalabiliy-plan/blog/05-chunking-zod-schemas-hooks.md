# Chunking at Semantic Boundaries: Zod Schemas, Hooks, and Beyond

Most chunking systems are dumb.

They draw lines every N tokens. They have no idea they just cut a function in half. They produce garbage.

We tried that. An AI asking "how do we validate contacts?" got a chunk that started mid-schema with `email: z.string().email()` and ended with `phoneNumber: z`.

Not helpful.

---

## Semantic Chunking: What It Actually Means

Semantic chunking splits code at meaningful boundaries instead of arbitrary line counts.

It's like organizing magazine subscriptions by topic instead of by month. When a researcher asks "what do we know about solar energy?", topical filing delivers. Chronological filing requires reading every box.

The key insight: code has natural joints.

Functions. Classes. Schemas. Hooks. These are complete thoughts.

Line-based chunking ignores them. Semantic chunking respects them.

---

## What Makes a Boundary?

A **function** is a complete unit. Name. Parameters. Body. Purpose. Opening and closing braces mark its extent.

A **Zod schema** is a complete unit. Shape. Constraints. Transforms. The `z.object()` call and its closing parenthesis mark its extent.

A **React hook** is a complete unit. Follows `use*` naming. Calls other hooks. Returns something useful. Function boundaries mark its extent.

These aren't arbitrary lines. They're where code naturally separates.

Semantic chunking means:
- Never splitting a function mid-body
- Never separating a schema from its fields
- Never isolating a hook from its dependencies

The chunk is the complete thought.

---

## The Zod Schema Problem

Zod schemas present unique challenges.

Here's a common pattern:

```typescript
export const contactSchema = z.strictObject({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  notes: z.string().max(10000).transform(sanitizeHtml).optional(),
});

export type Contact = z.infer<typeof contactSchema>;
export const contactCreateSchema = contactSchema.omit({ id: true });
```

Naive chunking might split this into three pieces. Every piece is incomplete.

The AI cannot understand `contactSchema` without all its fields. Cannot understand `Contact` without the schema it derives from. Cannot understand `contactCreateSchema` without `contactSchema`.

It's like tearing a recipe in half and asking someone to cook it.

Semantic chunking keeps related declarations together. Period.

---

## Building the Extractor

The key insight: Zod schemas are variable declarations that call `z.object()` or related methods.

```typescript
const ZOD_PATTERNS = [
  'z.object', 'z.strictObject', 'z.array',
  'z.enum', 'z.union', 'z.discriminatedUnion',
];

function isZodSchema(decl: VariableDeclaration): boolean {
  const init = decl.getInitializer();
  if (!init) return false;
  return ZOD_PATTERNS.some(p => init.getText().includes(p));
}
```

Notice we check the initializer text, not the variable name. A schema could be named anything.

What matters is what it contains.

---

## Extracting Fields

Each field carries metadata the AI needs:

```typescript
interface FieldInfo {
  name: string;
  zodType: string;
  constraints: string[];
  optional: boolean;
  hasTransform: boolean;
}
```

The extraction walks the AST:

```typescript
function extractFields(decl: VariableDeclaration): FieldInfo[] {
  const init = decl.getInitializer();
  const objLiteral = init?.getFirstDescendantByKind(
    SyntaxKind.ObjectLiteralExpression
  );
  if (!objLiteral) return [];

  return objLiteral.getProperties()
    .filter(p => p.getKind() === SyntaxKind.PropertyAssignment)
    .map(prop => parseFieldFromProperty(prop));
}
```

It's like an X-ray machine for your validation logic. Every constraint visible at a glance.

---

## The `z.infer` Relationship

Here's where things get interesting.

Many codebases derive types from schemas:

```typescript
export type Contact = z.infer<typeof contactSchema>;
```

This creates a relationship. The `Contact` type is not independent.

It's derived from `contactSchema`.

Our chunking must preserve this. If you ask about `Contact`, you need to know about `contactSchema` too.

Think of it as a family tree. You can't understand the child without knowing the parent.

---

## Three Flavors of Type Derivation

Zod offers three type derivation helpers:

```typescript
z.infer<typeof schema>   // Output type (default)
z.output<typeof schema>  // Output type (explicit)
z.input<typeof schema>   // Input type (before transforms)
```

Here's what most people miss: if your schema has `.transform()`, input and output types differ.

A `birthDate` field might accept a string (input) but produce a Date object (output).

Your validation schema is doing double duty. It validates AND converts.

The extraction captures this:

```typescript
function extractDerivedType(alias: TypeAliasDeclaration) {
  const text = alias.getTypeNode()?.getText() || '';

  if (text.match(/z\.infer<typeof\s+(\w+)>/)) {
    return { relationship: 'infer', schemaName: RegExp.$1 };
  }
  if (text.match(/z\.input<typeof\s+(\w+)>/)) {
    return { relationship: 'input', schemaName: RegExp.$1 };
  }
  // z.output similar...
}
```

---

## Why Regex Fails on Generics

TypeScript generics break simple regex parsing.

Consider these:

```typescript
z.infer<typeof schema>                    // Simple
z.infer<typeof Record<string, Schema>>    // Nested
T extends z.ZodType<infer U> ? U : never  // Conditional
```

Regex cannot match balanced brackets reliably.

It's like trying to count parentheses by eye in a 50-line expression. You'll get lost.

The AST approach handles nesting correctly because ts-morph already parsed the structure:

```typescript
function findInferredSchema(typeNode: TypeNode): string | null {
  const typeRef = typeNode.getFirstDescendantByKind(
    SyntaxKind.TypeReference
  );
  if (typeRef?.getTypeName().getText() !== 'z.infer') return null;

  const query = typeRef.getTypeArguments()[0];
  return query?.asKind(SyntaxKind.TypeQuery)
    ?.getExprName().getText() ?? null;
}
```

Let ts-morph do the hard work. That's what it's for.

---

## Hook Detection

Custom React hooks follow conventions that make them detectable.

Three rules:
1. Name starts with `use`
2. Fourth character is uppercase
3. Function calls at least one other hook

```typescript
function isHookName(name: string): boolean {
  return name.startsWith('use') &&
         name.length > 3 &&
         /[A-Z]/.test(name[3]);
}
```

Valid hooks: `useState`, `useContacts`, `useSmartDefaults`.

Not hooks: `use`, `used`, `useful`, `username`.

It's like spotting a doctor by their white coat. The naming convention is the uniform.

---

## Extracting Hook Dependencies

Hooks call other hooks. This creates a dependency graph:

```typescript
function extractHookDependencies(bodyText: string): string[] {
  const deps = new Set<string>();
  const pattern = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g;

  let match;
  while ((match = pattern.exec(bodyText))) {
    deps.add(match[1]);
  }
  return Array.from(deps);
}
```

When `useContactForm` calls `useState`, `useEffect`, and `useValidation`, all three become dependencies.

The chunk should reflect this. Think of it as capturing the hook's "imports" even when they're not at the top of the file.

---

## Grouping Related Units

Here's the core algorithm.

First, identify all chunkable units in a file:

```typescript
interface ChunkableUnit {
  kind: 'schema' | 'hook' | 'type' | 'function';
  name: string;
  startLine: number;
  endLine: number;
  dependencies: string[];
}
```

Then group related units by following dependencies:

```typescript
function groupRelated(units: ChunkableUnit[]): ChunkableUnit[][] {
  const byName = new Map(units.map(u => [u.name, u]));
  const visited = new Set<string>();
  const groups: ChunkableUnit[][] = [];

  for (const unit of units) {
    if (visited.has(unit.name)) continue;
    const group = collectGroup(unit, byName, visited);
    groups.push(group);
  }
  return groups;
}
```

It's like playing connect-the-dots. Follow the arrows until you run out.

Schemas stay with their derived types. Hooks stay with their custom hook dependencies. Nothing gets orphaned.

---

## Size Limits

Groups can get too big.

A single massive chunk defeats the purpose. The AI can't hold it all in context.

Target 20-150 lines per chunk. If a group exceeds the limit, split it but keep individual units whole:

```typescript
if (groupLines > MAX_CHUNK_LINES) {
  // Split, but never mid-declaration
  for (const unit of group) {
    chunks.push(createSingleUnitChunk(unit));
  }
} else {
  chunks.push(createGroupChunk(group));
}
```

Better to have two complete chunks than one that gets truncated.

It's like packing boxes for a move. If something doesn't fit, it gets its own box. You don't saw the furniture in half.

---

## Re-Exports Lose Context

Here's a gotcha that bit us.

Barrel files look like this:

```typescript
// src/validation/index.ts
export { contactSchema } from './contacts';
export { organizationSchema } from './organizations';
```

The barrel has no schema definitions. Its chunk is just re-exports.

When the AI asks about `contactSchema`, it might get the barrel file instead of the actual schema.

Solution: trace re-exports back to source. Include the real file path in metadata.

Think of barrel files as forwarding addresses. They point somewhere else.

---

## Circular Dependencies

Zod allows circular references through `z.lazy()`:

```typescript
// contacts.ts
export const contactSchema = z.object({
  organization: z.lazy(() => organizationSchema),
});

// organizations.ts
export const organizationSchema = z.object({
  contacts: z.array(z.lazy(() => contactSchema)),
});
```

These schemas depend on each other across files. Our chunking can't keep both in the same chunk.

The solution: detect `z.lazy()` calls and note them as deferred dependencies. Tell the AI that complete understanding requires both files.

It's like a reference book that says "see also." You need to follow the link.

---

## Closure Dependencies

Hooks often reference module-level constants:

```typescript
const API_BASE = '/api/v1';

export function useContactApi() {
  return useCallback(() => axios.get(`${API_BASE}/contacts`), []);
}
```

Chunking the hook alone loses `API_BASE`.

The solution: detect references to module-level variables. Expand chunk boundaries or include them in metadata.

Think of closures as invisible threads connecting code. Cut the thread, lose the meaning.

---

## Schema Factories

Generic factories split schema definitions:

```typescript
function createCrudSchema<T>(shape: T) {
  return z.object({
    ...shape,
    id: z.string().uuid(),
    createdAt: z.date(),
  });
}

export const contactSchema = createCrudSchema({ name: z.string() });
```

The actual fields live in two places. Naive extraction misses half of them.

Solution: detect factory patterns. Include both the factory and call site. Or inline the computed result.

It's like understanding a templated document. You need the template AND the values.

---

## What's Next

We've chunked schemas and hooks as semantic units. The AI receives complete, coherent code blocks instead of arbitrary slices.

But identification and chunking are just step one.

The discovery system needs to answer questions like:
- "Which components use this schema?"
- "What calls this hook?"
- "Where is this function defined?"

These require understanding symbol references across files. That's where SCIP comes in.

The next article dives into SCIP's symbol reference system. How it stores definitions and references. How cross-file navigation works. How to query it efficiently.

The index knows everything.

We just need to ask the right questions.

---

## Quick Reference

**Zod schema patterns:**
```typescript
['z.object', 'z.strictObject', 'z.array',
 'z.enum', 'z.union', 'z.discriminatedUnion']
```

**Hook naming test:**
```typescript
name.startsWith('use') && name.length > 3 && /[A-Z]/.test(name[3])
```

**Type derivation:**
```typescript
z.infer<typeof schema>   // Output (default)
z.output<typeof schema>  // Output (explicit)
z.input<typeof schema>   // Input (before transforms)
```

**Chunking principles:**
- Never split declarations mid-body
- Keep schemas with derived types
- Keep hooks with local dependencies
- Target 20-150 lines per chunk

---

*Part 5 of 12: Building Local Code Intelligence*
