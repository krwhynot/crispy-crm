# Chunking at Semantic Boundaries: Zod Schemas, Hooks, and Beyond

You can split a book into pages. Or you can split it into chapters.

One approach is mechanical. The other is meaningful.

Most chunking systems treat code like a book split into pages. They draw lines every N tokens, blissfully unaware that they just cut a function in half.

We tried that. It produced garbage results. An AI asking "how do we validate contacts?" received a chunk that started mid-schema with `email: z.string().email()` and ended mid-field with `phoneNumber: z`.

Not helpful.

This article is about chunking code the way humans think about code: at semantic boundaries.

---

## The Magazine Subscription Analogy

Imagine you are organizing a library of magazine subscriptions.

You could file them by month. January issues in one box, February in another. Clean, predictable, completely useless for research.

Or you could file them by topic. All the articles about solar energy together, regardless of which month they appeared.

When a researcher asks "what do we know about solar energy?", the topical filing system delivers. The chronological system requires reading every box.

Code has natural topics: functions, classes, schemas, hooks. These are semantic units that encapsulate complete ideas.

Line-based chunking ignores these units. It files by month.

Semantic chunking respects them. It files by topic.

---

## What Makes a Semantic Boundary?

In TypeScript, semantic boundaries align with the language's own structure.

A **function** is a complete unit. It has a name, parameters, a body, and a purpose. The opening and closing braces mark its extent.

A **Zod schema** is a complete unit. It declares a shape, defines constraints, and optionally transforms data. The `z.object()` call and its closing parenthesis mark its extent.

A **React hook** is a complete unit. It follows a naming convention (`use*`), calls other hooks, and returns something useful. Its function boundaries mark its extent.

These are not arbitrary lines. They are the joints where code naturally separates.

Chunking at semantic boundaries means:
- Never splitting a function mid-body
- Never separating a schema from its fields
- Never isolating a hook from its dependencies

The chunk is the complete thought.

---

## The Zod Schema Problem

Zod schemas present unique chunking challenges.

Consider this common pattern in our codebase:

```typescript
import { z } from 'zod';
import { sanitizeHtml } from '../utils/security';

export const contactSchema = z.strictObject({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  notes: z.string().max(10000).transform(sanitizeHtml).optional(),
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCreateSchema = contactSchema.omit({ id: true });
export const contactUpdateSchema = contactSchema.partial();
```

Naive chunking might split this file into three pieces:
1. Imports and the first half of `contactSchema`
2. The second half of `contactSchema` and the type
3. The derived schemas

Every chunk is incomplete. The AI cannot understand `contactSchema` without all its fields. It cannot understand `Contact` without the schema it derives from. It cannot understand `contactUpdateSchema` without `contactSchema`.

Semantic chunking keeps related declarations together.

---

## Let Us Build the Extractor

We need to identify Zod schemas in source files and extract them as complete units.

The key insight: Zod schemas are variable declarations that call `z.object()`, `z.strictObject()`, or related methods.

```typescript
// scripts/discover/extractors/zod-schemas.ts
import { Project, VariableDeclaration, SyntaxKind } from 'ts-morph';

const ZOD_SCHEMA_PATTERNS = [
  'z.object',
  'z.strictObject',
  'z.array',
  'z.enum',
  'z.union',
  'z.intersection',
  'z.discriminatedUnion',
];

interface ZodSchemaInfo {
  name: string;
  file: string;
  line: number;
  schemaType: string;
  fields: FieldInfo[];
  derivedFrom?: string;
  hasTransform: boolean;
  fullText: string;
}

function isZodSchema(decl: VariableDeclaration): boolean {
  const initializer = decl.getInitializer();
  if (!initializer) return false;

  const text = initializer.getText();
  return ZOD_SCHEMA_PATTERNS.some(pattern => text.includes(pattern));
}

function detectSchemaType(text: string): string {
  for (const pattern of ZOD_SCHEMA_PATTERNS) {
    if (text.startsWith(pattern) || text.includes(` ${pattern}`)) {
      return pattern.split('.')[1]; // 'object', 'strictObject', etc.
    }
  }
  return 'unknown';
}
```

Notice how we check the initializer text, not the variable name. A schema could be named anything. What matters is what it contains.

Now the field extraction:

```typescript
interface FieldInfo {
  name: string;
  zodType: string;
  constraints: string[];
  optional: boolean;
  hasTransform: boolean;
  transformName?: string;
}

function extractFields(decl: VariableDeclaration): FieldInfo[] {
  const fields: FieldInfo[] = [];
  const initializer = decl.getInitializer();
  if (!initializer) return fields;

  // Find the object literal inside z.object() or z.strictObject()
  const objLiterals = initializer.getDescendantsOfKind(
    SyntaxKind.ObjectLiteralExpression
  );

  if (objLiterals.length === 0) return fields;

  const schemaObj = objLiterals[0];

  for (const prop of schemaObj.getProperties()) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;

    const propAssign = prop.asKindOrThrow(SyntaxKind.PropertyAssignment);
    const name = propAssign.getName();
    const valueText = propAssign.getInitializer()?.getText() || '';

    fields.push({
      name,
      zodType: extractZodType(valueText),
      constraints: extractConstraints(valueText),
      optional: valueText.includes('.optional()'),
      hasTransform: valueText.includes('.transform('),
      transformName: extractTransformName(valueText),
    });
  }

  return fields;
}

function extractZodType(text: string): string {
  // Extract the base type: z.string(), z.number(), z.boolean(), etc.
  const match = text.match(/z\.(\w+)\(/);
  return match ? match[1] : 'unknown';
}

function extractConstraints(text: string): string[] {
  const constraints: string[] = [];
  const patterns = [
    /\.min\((\d+)\)/g,
    /\.max\((\d+)\)/g,
    /\.email\(\)/g,
    /\.url\(\)/g,
    /\.uuid\(\)/g,
    /\.regex\([^)]+\)/g,
    /\.length\((\d+)\)/g,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      constraints.push(match[0].slice(1)); // Remove leading dot
    }
  }

  return constraints;
}
```

---

## Handling `z.infer<>` Type Derivation

Here is where TypeScript generics get tricky.

Many codebases derive types from schemas:

```typescript
export type Contact = z.infer<typeof contactSchema>;
```

This creates a relationship. The `Contact` type is not independent. It is derived from `contactSchema`.

Our chunking strategy must preserve this relationship:

```typescript
function extractDerivedTypes(sourceFile: SourceFile): DerivedTypeInfo[] {
  const derived: DerivedTypeInfo[] = [];

  const typeAliases = sourceFile.getTypeAliases();

  for (const alias of typeAliases) {
    const typeNode = alias.getTypeNode();
    if (!typeNode) continue;

    const text = typeNode.getText();

    // Pattern: z.infer<typeof schemaName>
    const inferMatch = text.match(/z\.infer<typeof\s+(\w+)>/);
    if (inferMatch) {
      derived.push({
        typeName: alias.getName(),
        schemaName: inferMatch[1],
        line: alias.getStartLineNumber(),
        relationship: 'infer',
      });
      continue;
    }

    // Pattern: z.output<typeof schemaName>
    const outputMatch = text.match(/z\.output<typeof\s+(\w+)>/);
    if (outputMatch) {
      derived.push({
        typeName: alias.getName(),
        schemaName: outputMatch[1],
        line: alias.getStartLineNumber(),
        relationship: 'output',
      });
      continue;
    }

    // Pattern: z.input<typeof schemaName>
    const inputMatch = text.match(/z\.input<typeof\s+(\w+)>/);
    if (inputMatch) {
      derived.push({
        typeName: alias.getName(),
        schemaName: inputMatch[1],
        line: alias.getStartLineNumber(),
        relationship: 'input',
      });
    }
  }

  return derived;
}
```

The key distinction between `z.infer`, `z.input`, and `z.output`:

- `z.infer` is the default, usually equivalent to `z.output`
- `z.input` gives the type before transforms run
- `z.output` gives the type after transforms run

If your schema has `.transform()`, these differ. If not, they are identical.

---

## Parsing TypeScript Generics: The Edge Cases

TypeScript generics break simple regex parsing.

Consider:

```typescript
// Simple case
z.infer<typeof schema>

// Nested generics
z.infer<typeof Record<string, typeof schema>>

// With constraints
T extends z.ZodType<infer U> ? U : never

// Generic schema factory
function createSchema<T extends z.ZodRawShape>(shape: T): z.ZodObject<T>
```

Each of these requires different handling.

For `z.infer`, we can use the AST:

```typescript
function findInferredSchema(typeNode: TypeNode): string | undefined {
  // Walk the AST looking for z.infer type references
  const typeRefs = typeNode.getDescendantsOfKind(SyntaxKind.TypeReference);

  for (const ref of typeRefs) {
    const typeName = ref.getTypeName().getText();
    if (typeName !== 'z.infer') continue;

    const typeArgs = ref.getTypeArguments();
    if (typeArgs.length === 0) continue;

    const arg = typeArgs[0];
    if (arg.getKind() !== SyntaxKind.TypeQuery) continue;

    // TypeQuery is "typeof X"
    const query = arg.asKindOrThrow(SyntaxKind.TypeQuery);
    return query.getExprName().getText();
  }

  return undefined;
}
```

The AST approach handles nested generics correctly because ts-morph already parsed the nesting structure.

Regex cannot match balanced brackets reliably. AST can.

---

## Hook Detection Patterns

Custom React hooks follow conventions that make them detectable:

1. The name starts with `use`
2. The character after `use` is uppercase
3. The function calls at least one other hook

```typescript
function isHookName(name: string): boolean {
  if (!name.startsWith('use')) return false;
  if (name.length < 4) return false;
  return /[A-Z]/.test(name[3]);
}

function extractHooks(sourceFile: SourceFile): HookInfo[] {
  const hooks: HookInfo[] = [];

  // Check function declarations
  for (const func of sourceFile.getFunctions()) {
    const name = func.getName();
    if (!name || !isHookName(name)) continue;
    if (!func.isExported()) continue;

    hooks.push(extractHookInfo(func, sourceFile));
  }

  // Check arrow functions assigned to variables
  for (const varStmt of sourceFile.getVariableStatements()) {
    if (!varStmt.isExported()) continue;

    for (const decl of varStmt.getDeclarations()) {
      const name = decl.getName();
      if (!isHookName(name)) continue;

      const init = decl.getInitializer();
      if (!init || init.getKind() !== SyntaxKind.ArrowFunction) continue;

      hooks.push(extractHookInfoFromArrow(decl, sourceFile));
    }
  }

  return hooks;
}
```

The hook info includes dependencies (other hooks called):

```typescript
interface HookInfo {
  name: string;
  file: string;
  line: number;
  parameters: ParameterInfo[];
  returnType: string;
  dependencies: string[];  // Other hooks this hook calls
  fullText: string;
}

function extractHookDependencies(bodyText: string): string[] {
  const deps = new Set<string>();

  // Pattern: hookName( - matches hook calls
  const hookCallPattern = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g;

  let match;
  while ((match = hookCallPattern.exec(bodyText)) !== null) {
    deps.add(match[1]);
  }

  return Array.from(deps).sort();
}
```

---

## Chunking Strategy: Keep Related Units Together

Now we combine schema and hook extraction into a chunking strategy.

The principle: a chunk should contain a complete semantic unit and its immediate dependencies.

For a Zod schema file:

```typescript
interface ChunkableUnit {
  kind: 'schema' | 'hook' | 'type' | 'function';
  name: string;
  startLine: number;
  endLine: number;
  dependencies: string[];  // Names of other units this depends on
}

function identifyChunkBoundaries(sourceFile: SourceFile): ChunkableUnit[] {
  const units: ChunkableUnit[] = [];

  // Collect all schemas
  for (const schema of extractSchemas(sourceFile)) {
    units.push({
      kind: 'schema',
      name: schema.name,
      startLine: schema.line,
      endLine: findDeclarationEnd(sourceFile, schema.line),
      dependencies: schema.derivedFrom ? [schema.derivedFrom] : [],
    });
  }

  // Collect all derived types
  for (const derived of extractDerivedTypes(sourceFile)) {
    units.push({
      kind: 'type',
      name: derived.typeName,
      startLine: derived.line,
      endLine: findDeclarationEnd(sourceFile, derived.line),
      dependencies: [derived.schemaName],
    });
  }

  // Collect all hooks
  for (const hook of extractHooks(sourceFile)) {
    units.push({
      kind: 'hook',
      name: hook.name,
      startLine: hook.line,
      endLine: findDeclarationEnd(sourceFile, hook.line),
      dependencies: hook.dependencies,
    });
  }

  return units;
}
```

Now group related units into chunks:

```typescript
function createChunks(
  sourceFile: SourceFile,
  units: ChunkableUnit[],
  maxChunkLines: number = 150
): Chunk[] {
  const chunks: Chunk[] = [];
  const grouped = groupRelatedUnits(units);

  for (const group of grouped) {
    const startLine = Math.min(...group.map(u => u.startLine));
    const endLine = Math.max(...group.map(u => u.endLine));
    const lineCount = endLine - startLine + 1;

    if (lineCount <= maxChunkLines) {
      // Group fits in one chunk
      chunks.push({
        units: group,
        startLine,
        endLine,
        content: extractLines(sourceFile, startLine, endLine),
      });
    } else {
      // Group too large, split but keep individual units whole
      for (const unit of group) {
        chunks.push({
          units: [unit],
          startLine: unit.startLine,
          endLine: unit.endLine,
          content: extractLines(sourceFile, unit.startLine, unit.endLine),
        });
      }
    }
  }

  return chunks;
}

function groupRelatedUnits(units: ChunkableUnit[]): ChunkableUnit[][] {
  // Build dependency graph
  const nameToUnit = new Map(units.map(u => [u.name, u]));
  const groups: ChunkableUnit[][] = [];
  const visited = new Set<string>();

  for (const unit of units) {
    if (visited.has(unit.name)) continue;

    const group: ChunkableUnit[] = [];
    collectRelated(unit, nameToUnit, visited, group);

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

function collectRelated(
  unit: ChunkableUnit,
  nameToUnit: Map<string, ChunkableUnit>,
  visited: Set<string>,
  group: ChunkableUnit[]
): void {
  if (visited.has(unit.name)) return;

  visited.add(unit.name);
  group.push(unit);

  // Follow dependencies
  for (const depName of unit.dependencies) {
    const dep = nameToUnit.get(depName);
    if (dep) {
      collectRelated(dep, nameToUnit, visited, group);
    }
  }
}
```

This produces chunks where schemas stay with their derived types, hooks stay with their custom hook dependencies (when in the same file), and nothing gets split mid-declaration.

---

## Watch Out For

Semantic chunking has failure modes. Here are the ones that bit us.

**Re-exported schemas lose their context.**

```typescript
// src/validation/index.ts
export { contactSchema } from './contacts';
export { organizationSchema } from './organizations';
```

The barrel file has no schema definitions. Its chunk is just re-exports. When the AI asks about `contactSchema`, it might get the barrel file instead of the actual schema.

Solution: trace re-exports back to their source files. Include the source location in metadata.

**Circular schema dependencies.**

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

Circular references through `z.lazy()` mean the schemas depend on each other across files. Our chunking cannot keep both in the same chunk.

Solution: detect `z.lazy()` calls and note them as deferred dependencies in metadata. The AI should be told that complete understanding requires both files.

**Generic schema factories.**

```typescript
function createCrudSchema<T extends z.ZodRawShape>(
  baseShape: T,
  tableName: string
) {
  return z.object({
    ...baseShape,
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
  });
}

export const contactSchema = createCrudSchema({ name: z.string() }, 'contacts');
```

The actual schema fields are split between the factory and the call site. Naive extraction misses fields from the factory.

Solution: detect factory patterns and include both the factory definition and call site in the chunk. Or inline the factory output.

**Hooks with closure dependencies.**

```typescript
const API_BASE = '/api/v1';

export function useContactApi() {
  // Uses API_BASE from closure
  const fetch = useCallback(() => {
    return axios.get(`${API_BASE}/contacts`);
  }, []);

  return { fetch };
}
```

The hook depends on `API_BASE` defined outside its boundaries. Chunking the hook alone loses context.

Solution: detect references to module-level variables and include them in the chunk metadata. Consider expanding chunk boundaries to include nearby constants.

**Conditional type inference.**

```typescript
export type ContactInput = z.input<typeof contactSchema>;
export type ContactOutput = z.output<typeof contactSchema>;

// These differ if schema has transforms
type InputDiffers = ContactInput extends ContactOutput ? false : true;
```

The relationship between input and output types is non-obvious. Simple "derives from" metadata misses the subtlety.

Solution: explicitly note when schemas have transforms, and explain that input and output types may differ.

---

## What is Next

We have chunked schemas and hooks as semantic units. The AI can now receive complete, coherent code blocks instead of arbitrary slices.

But identification and chunking are just the first step. The discovery system needs to answer questions like:

- "Which components use this schema?"
- "What calls this hook?"
- "Where is this function defined?"

These questions require understanding symbol references across files. That is where SCIP comes in.

The next article dives into SCIP's symbol reference system: how it stores definitions and references, how cross-file navigation works, and how to query it efficiently.

The index knows everything. We just need to ask the right questions.

---

## Quick Reference

**Zod schema patterns to detect:**
```typescript
const SCHEMA_PATTERNS = [
  'z.object',
  'z.strictObject',
  'z.array',
  'z.enum',
  'z.union',
  'z.discriminatedUnion',
];
```

**Hook naming convention:**
```typescript
// Valid hooks: useState, useEffect, useContacts, useSmartDefaults
// Not hooks: use, used, useful, username
function isHookName(name: string): boolean {
  return name.startsWith('use') &&
         name.length > 3 &&
         /[A-Z]/.test(name[3]);
}
```

**Type derivation patterns:**
```typescript
z.infer<typeof schema>   // Output type (default)
z.output<typeof schema>  // Output type (explicit)
z.input<typeof schema>   // Input type (before transforms)
```

**Chunking principles:**
- Never split a declaration mid-body
- Keep schemas with their derived types
- Keep hooks with their local dependencies
- Target 20-150 lines per chunk
- Filter out trivially small chunks

---

*This is part 5 of a 12-part series on building local code intelligence.*
