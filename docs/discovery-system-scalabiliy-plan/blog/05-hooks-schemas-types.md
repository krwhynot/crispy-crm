# Hooks, Schemas, and Types: One Pattern to Find Them All

Once you can find components, you can find anything.

That sounds like a bold claim. But here is the thing: the pattern for extracting React components is almost identical to the pattern for extracting hooks, Zod schemas, and TypeScript types.

The shape changes slightly. The detection logic tweaks. But the core approach stays the same.

This is one of those insights that seems obvious in hindsight but changes how you think about the problem.

---

## The Generalization Insight

Think of your codebase as a library with different sections.

The "Components" section contains books about UI. The "Hooks" section contains books about state and side effects. The "Schemas" section contains books about data validation. The "Types" section contains books about structure.

Same library. Same card catalog system. Different sections.

When we built our component extractor, we learned a fundamental skill: how to walk a TypeScript AST, identify declarations matching specific patterns, and extract useful metadata.

That skill transfers directly.

A React component is a function that returns JSX. A custom hook is a function starting with `use` that calls other hooks. A Zod schema is a variable initialized with `z.object()` or `z.strictObject()`. A TypeScript type is an `interface` or `type` declaration.

Different patterns. Same extraction machinery.

The real power comes from recognizing this. You are not writing four completely different extractors. You are writing one extraction pattern with four variations.

Let me show you exactly how each one works.

---

## Finding Custom Hooks

Hooks follow the "Rules of Hooks" from React. Every custom hook must start with `use` and call at least one other hook.

This gives us a detection heuristic.

```typescript
function isHookName(name: string): boolean {
  return name.startsWith("use") && name.length > 3;
}
```

That is the core check. If a function starts with `use` and has at least one character after that, it might be a hook. `useEffect` passes. `use` alone fails. `useMemo`, `useContacts`, `useSmartDefaults` all pass.

But there is a subtlety. React convention says the character after `use` should be uppercase. `useEffect` is a hook. `useful` is not.

The actual implementation handles this:

```typescript
function isHookName(name: string): boolean {
  return name.startsWith("use") && name.length > 3 && /[A-Z]/.test(name[3]);
}
```

Now we need to find functions matching this pattern. Hooks come in two forms: function declarations and arrow functions.

```typescript
// Function declaration form
export function useContacts() {
  const [contacts, setContacts] = useState([]);
  return { contacts, setContacts };
}

// Arrow function form
export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  return { contacts, setContacts };
};
```

Same hook. Different AST structure. The extractor must handle both.

Here is the pattern for function declarations:

```typescript
function extractFromFunctionDeclaration(
  decl: FunctionDeclaration,
  filePath: string
): HookInfo | null {
  const name = decl.getName();
  if (!name || !isHookName(name)) return null;

  const params = decl.getParameters().map((p) => p.getName());
  const returnType = decl.getReturnType().getText(decl);
  const functionBody = decl.getBodyText() || "";

  const dependencies = extractHookDependencies(functionBody, name);

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    parameters: params,
    returnType: returnType || "unknown",
    dependencies,
  };
}
```

Three things happen here.

First, we check the name. If it does not start with `use`, we bail immediately. No point processing further.

Second, we extract metadata: parameters, return type, location. This is the "card catalog" information that answers "what does this hook do?" without reading the source.

Third, we find hook dependencies. What other hooks does this hook call?

```typescript
function extractHookDependencies(
  functionBody: string,
  hookName: string
): string[] {
  const dependencies = new Set<string>();
  const hookCallPattern = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g;
  let match;

  while ((match = hookCallPattern.exec(functionBody)) !== null) {
    const depName = match[1];
    if (depName !== hookName) {
      dependencies.add(depName);
    }
  }

  return Array.from(dependencies).sort();
}
```

This regex scans the function body for hook calls. It finds `useState`, `useEffect`, `useMemo`, and any custom hooks. It excludes the hook itself (no self-references in the dependency list).

The arrow function case is slightly different:

```typescript
function extractFromVariableDeclaration(
  decl: VariableDeclaration,
  filePath: string
): HookInfo | null {
  const name = decl.getName();
  if (!isHookName(name)) return null;

  const initializer = decl.getInitializer();
  if (!initializer) return null;

  // Check if it's an arrow function or function expression
  if (initializer.getKind() === SyntaxKind.ArrowFunction) {
    const arrowFunc = initializer as ArrowFunction;
    const params = arrowFunc.getParameters().map((p) => p.getName());
    const returnType = arrowFunc.getReturnType().getText(arrowFunc);
    const functionBody = arrowFunc.getBodyText() || "";

    const dependencies = extractHookDependencies(functionBody, name);

    return {
      name,
      file: path.relative(process.cwd(), filePath),
      line: decl.getStartLineNumber(),
      parameters: params,
      returnType: returnType || "unknown",
      dependencies,
    };
  }

  return null;
}
```

Same pattern. Different AST node type. We look for variable declarations where the initializer is an arrow function and the variable name starts with `use`.

The main extraction loop ties it together:

```typescript
for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();

  // Function declarations
  const functionDeclarations = sourceFile.getFunctions();
  for (const funcDecl of functionDeclarations) {
    if (funcDecl.isExported()) {
      const hookInfo = extractFromFunctionDeclaration(funcDecl, filePath);
      if (hookInfo) hooks.push(hookInfo);
    }
  }

  // Arrow function assignments
  const variableStatements = sourceFile.getVariableStatements();
  for (const varStmt of variableStatements) {
    if (varStmt.isExported()) {
      for (const decl of varStmt.getDeclarations()) {
        const hookInfo = extractFromVariableDeclaration(decl, filePath);
        if (hookInfo) hooks.push(hookInfo);
      }
    }
  }
}
```

We scan every source file. We check both function declarations and variable statements. We filter to only exported items (internal hooks are usually not what the AI needs to know about).

Result: a complete inventory of every custom hook in the codebase, including what other hooks each one depends on.

---

## Finding Zod Schemas

Zod schemas are different beasts.

A hook is a function. A schema is a data structure. But the detection pattern follows the same shape.

First, identify the signature. Zod schemas are variables initialized with calls to `z.object()`, `z.strictObject()`, `z.enum()`, and similar.

```typescript
const contactSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().max(255),
  email: z.string().email().optional(),
});
```

The detection heuristic: does the variable name contain "Schema" or "schema" AND does the initializer contain `z.`?

```typescript
function extractSchemaFromDeclaration(
  decl: VariableDeclaration,
  filePath: string
): SchemaInfo | null {
  const name = decl.getName();

  // Only process declarations that look like schemas
  if (!name.includes("Schema") && !name.includes("schema")) {
    return null;
  }

  const initializer = decl.getInitializer();
  if (!initializer) return null;

  const initText = initializer.getText();

  // Must be a Zod schema
  if (!initText.includes("z.")) {
    return null;
  }

  // Continue with extraction...
}
```

But Zod schemas have rich internal structure. We want to know what fields they contain, what types those fields have, what constraints apply.

This requires deeper AST traversal.

```typescript
function detectSchemaType(callExpr: CallExpression): SchemaType {
  const expression = callExpr.getExpression();
  const exprText = expression.getText();

  if (/^z\s*\.\s*strictObject$/.test(exprText)) {
    return "strictObject";
  }

  if (/^z\s*\.\s*object$/.test(exprText)) {
    return "object";
  }

  if (/^z\s*\.\s*enum$/.test(exprText)) {
    return "enum";
  }

  return "other";
}
```

We use regex here because Zod code can have whitespace variations. `z.object` and `z\n  .object` both mean the same thing.

For object schemas, we extract field information:

```typescript
function extractFields(callExpr: CallExpression): SchemaField[] {
  const fields: SchemaField[] = [];
  const args = callExpr.getArguments();

  if (args.length === 0) return fields;

  const firstArg = args[0];
  if (firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return fields;
  }

  const objectLiteral = firstArg.asKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  );

  for (const property of objectLiteral.getProperties()) {
    if (property.getKind() === SyntaxKind.PropertyAssignment) {
      const propAssignment = property.asKindOrThrow(
        SyntaxKind.PropertyAssignment
      );
      const name = propAssignment.getName();
      const initializer = propAssignment.getInitializer();

      if (!initializer) continue;

      const valueText = initializer.getText();
      const zodType = extractZodType(valueText);
      const constraints = extractConstraints(initializer);

      fields.push({
        name,
        zodType,
        constraints,
        optional: /\.optional\(\)/.test(valueText),
        nullable: /\.nullable\(\)/.test(valueText),
        hasTransform: /\.transform\(/.test(valueText),
      });
    }
  }

  return fields;
}
```

Each field becomes an entry in our index. Name, type, constraints, modifiers.

The constraint extraction is particularly useful for AI assistants:

```typescript
function extractConstraints(node: Node): string[] {
  const constraints: string[] = [];
  const text = node.getText();

  const constraintPattern =
    /\.(max|min|email|url|uuid|regex|length|trim)\(([^)]*)\)/g;
  let match;

  while ((match = constraintPattern.exec(text)) !== null) {
    const [, method, arg] = match;
    constraints.push(arg ? `${method}(${arg})` : `${method}()`);
  }

  return constraints;
}
```

Now the AI knows that `name` has `max(255)`, `email` has `email()`. It can answer validation questions without reading the schema file.

One more layer: transform detection. Zod transforms are security-sensitive. If a field uses `.transform(sanitizeHtml)`, that is important metadata.

```typescript
const SECURITY_PATTERN =
  /sanitize|escape|encode|clean|strip|purify|xss|html/i;

function extractTransformDetails(text: string): TransformDetails | undefined {
  if (!hasTransform(text)) return undefined;

  // Pattern: .transform((val) => functionName(val))
  const arrowMatch = text.match(
    /\.transform\s*\(\s*\([^)]*\)\s*=>\s*(\w+)\s*\(/
  );
  if (arrowMatch) {
    const funcName = arrowMatch[1];
    return {
      functionName: funcName,
      isSecurity: SECURITY_PATTERN.test(funcName),
    };
  }

  // Pattern: .transform(functionName)
  const directMatch = text.match(/\.transform\s*\(\s*(\w+)\s*\)/);
  if (directMatch) {
    return {
      functionName: directMatch[1],
      isSecurity: SECURITY_PATTERN.test(directMatch[1]),
    };
  }

  return { functionName: "unknown", isSecurity: false };
}
```

The AI can now answer "which fields have security transforms?" by querying the index.

---

## Finding TypeScript Types

Types are the simplest to extract because TypeScript makes them explicit.

An interface is an interface. A type alias is a type alias. No heuristics needed.

```typescript
interface ContactInfo {
  id: string;
  name: string;
  email?: string;
}

type ContactStatus = "active" | "inactive" | "pending";
```

The extractor distinguishes between the two forms:

```typescript
function extractFromInterface(
  decl: InterfaceDeclaration,
  filePath: string
): TypeInfo {
  const name = decl.getName();
  const extendsClause = decl.getExtends();
  const extendsNames = extendsClause.map((e) => e.getText());
  const properties = extractProperties(decl);
  const generics = extractGenerics(decl);

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    kind: "interface",
    properties,
    extends: extendsNames.length > 0 ? extendsNames : undefined,
    isComplex: properties.length > 5 || extendsNames.length > 0,
    isExported: decl.isExported(),
    generics,
  };
}
```

For interfaces, we extract: name, properties, what it extends, generic parameters, export status.

Type aliases are slightly different:

```typescript
function extractFromTypeAlias(
  decl: TypeAliasDeclaration,
  filePath: string
): TypeInfo {
  const name = decl.getName();
  const typeNode = decl.getTypeNode();
  const typeExpression = typeNode?.getText() || "unknown";
  const derivedFrom = detectZodInfer(decl);
  const generics = extractGenerics(decl);

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    kind: "type_alias",
    typeExpression,
    isComplex: isComplexType(typeExpression),
    derivedFrom,
    isExported: decl.isExported(),
    generics,
  };
}
```

One special case: Zod-derived types. Many codebases use `z.infer<typeof schema>` to generate TypeScript types from Zod schemas.

```typescript
const contactSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
});

type Contact = z.infer<typeof contactSchema>;
```

The extractor detects this pattern:

```typescript
function detectZodInfer(typeNode: TypeAliasDeclaration): string | undefined {
  const typeText = typeNode.getTypeNode()?.getText() || "";

  // z.infer<typeof schemaName>
  const zodInferMatch = typeText.match(/z\.infer<typeof\s+(\w+)>/);
  if (zodInferMatch) {
    return zodInferMatch[1];
  }

  // z.output<typeof schemaName>
  const zodOutputMatch = typeText.match(/z\.output<typeof\s+(\w+)>/);
  if (zodOutputMatch) {
    return zodOutputMatch[1];
  }

  return undefined;
}
```

Now the AI knows that `Contact` type is derived from `contactSchema`. It can follow the connection.

---

## Deep Dive: Relationships in SCIP

So far we have extracted entities: hooks, schemas, types. But entities alone are not enough.

The real power is in relationships.

When the AI asks "what uses this hook?", entity extraction does not help. You need to know which components call `useContacts`. Which other hooks depend on it.

This is where call graph extraction comes in.

A call graph is a directed graph where nodes are functions (or components, or hooks) and edges represent "calls" relationships.

```typescript
export interface CallGraphNode {
  id: string;           // "file:line:name"
  name: string;
  file: string;
  line: number;
  nodeType: 'function' | 'component' | 'hook' | 'arrow';
  exported: boolean;
  async: boolean;
}

export interface CallGraphEdge {
  source: string;       // Node ID of caller
  target: string;       // Name of callee
  edgeType: 'call' | 'render' | 'hook' | 'callback';
  line: number;
  conditional: boolean; // Inside if/ternary?
  inLoop: boolean;      // Inside loop?
}
```

The edge types matter:
- `call`: Regular function invocation
- `render`: JSX component rendering (`<ContactList />`)
- `hook`: Hook invocation (`useContacts()`)
- `callback`: Function passed as prop (`onClick={handleSubmit}`)

Building the graph requires traversing function bodies:

```typescript
function extractCallEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  const callExpressions = bodyNode.getDescendantsOfKind(
    SyntaxKind.CallExpression
  );

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    let targetName: string | undefined;

    // Simple call: foo()
    if (expression.getKind() === SyntaxKind.Identifier) {
      targetName = expression.getText();
    }
    // Method call: obj.method()
    else if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expression.asKindOrThrow(
        SyntaxKind.PropertyAccessExpression
      );
      targetName = propAccess.getName();
    }

    if (!targetName) continue;

    let edgeType: EdgeType = 'call';
    if (isHookName(targetName)) {
      edgeType = 'hook';
    }

    edges.push({
      source: sourceNodeId,
      target: targetName,
      edgeType,
      line: callExpr.getStartLineNumber(),
      conditional: isInConditional(callExpr),
      inLoop: isInLoop(callExpr),
    });
  }

  return edges;
}
```

JSX rendering creates different edges:

```typescript
function extractJsxEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  const jsxElements = bodyNode.getDescendantsOfKind(SyntaxKind.JsxElement);

  for (const jsx of jsxElements) {
    const openingElement = jsx.getOpeningElement();
    const tagName = openingElement.getTagNameNode().getText();

    // Only track PascalCase components (not div, span, etc.)
    if (isComponentName(tagName)) {
      edges.push({
        source: sourceNodeId,
        target: tagName,
        edgeType: 'render',
        line: jsx.getStartLineNumber(),
        conditional: isInConditional(jsx),
        inLoop: isInLoop(jsx),
      });
    }
  }

  return edges;
}
```

The conditional and loop detection adds context. If a component is rendered inside a condition, the AI should know. If it is rendered in a loop, that matters for performance analysis.

```typescript
function isInConditional(node: Node): boolean {
  let parent = node.getParent();
  while (parent) {
    const kind = parent.getKind();
    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ConditionalExpression ||
      kind === SyntaxKind.SwitchStatement
    ) {
      return true;
    }
    // Stop at function boundary
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.ArrowFunction
    ) {
      break;
    }
    parent = parent.getParent();
  }
  return false;
}
```

With the call graph, the AI can answer:
- "What components render `ContactCard`?"
- "What hooks does `ContactList` use?"
- "Is `handleSubmit` ever called conditionally?"

**Cycle Detection**

One powerful use of call graphs: finding circular dependencies before they cause problems.

Tarjan's Strongly Connected Components algorithm identifies cycles in the graph. Any SCC with more than one node is a circular dependency.

```typescript
function detectCycles(
  nodes: CallGraphNode[],
  edges: CallGraphEdge[]
): string[][] {
  // Build adjacency list
  const adjList = new Map<string, string[]>();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source)) {
      const neighbors = adjList.get(edge.source) || [];
      const targetNode = nodes.find(n => n.name === edge.target);
      if (targetNode) {
        neighbors.push(targetNode.id);
        adjList.set(edge.source, neighbors);
      }
    }
  }

  // Tarjan's algorithm implementation...
  // Returns arrays of node IDs that form cycles
}
```

When extraction runs, it flags cycles automatically. The AI can warn you before you merge a PR that introduces a circular import.

This is the relationship layer that makes entity extraction truly useful.

---

## Watch Out For

Every extraction pattern has edge cases. Here are the ones that will bite you.

**Barrel Files and Re-exports**

Your codebase probably has index files that re-export from other modules:

```typescript
// src/hooks/index.ts
export { useContacts } from './useContacts';
export { useOrganizations } from './useOrganizations';
export { useOpportunities } from './useOpportunities';
```

Naive extraction might register `useContacts` as defined in `index.ts` at line 1. That is wrong. The actual definition is in `useContacts.ts`.

The fix: detect re-exports and trace back to the original source.

```typescript
function isReExport(exportDecl: ExportDeclaration): boolean {
  return exportDecl.getModuleSpecifier() !== undefined;
}
```

If the export has a `from './...'` clause, it is a re-export. Skip it or trace the reference.

**Aliased Imports**

Sometimes developers rename imports:

```typescript
import { useContactData as useContacts } from './hooks';
```

Now the local name is `useContacts` but the actual hook is `useContactData`. Call graph edges should point to the original name, not the alias.

ts-morph gives you access to the symbol table:

```typescript
const symbol = identifier.getSymbol();
const declarations = symbol?.getDeclarations();
const originalName = declarations?.[0]?.getSymbol()?.getName();
```

This resolves aliases back to their original names. Expensive, but correct.

**Dynamic Imports**

Lazy loading breaks static analysis:

```typescript
const ContactList = lazy(() => import('./ContactList'));
```

You cannot follow `import()` the same way you follow static imports. The target is a string, not a resolved module.

The pragmatic solution: detect lazy import patterns and record them as "dynamic dependency" edges with the string path as metadata. Better than missing them entirely.

**Generic Type Parameters**

Types with generics require special handling:

```typescript
interface ApiResponse<T> {
  data: T;
  error: string | null;
}
```

If you just extract `data: T`, that is useless. You need to preserve the generic parameter context.

The extractor stores generics separately:

```typescript
function extractGenerics(
  decl: InterfaceDeclaration | TypeAliasDeclaration
): string[] | undefined {
  const typeParams = decl.getTypeParameters();
  if (typeParams.length === 0) return undefined;

  return typeParams.map((tp) => {
    const constraint = tp.getConstraint();
    const defaultType = tp.getDefault();
    let text = tp.getName();
    if (constraint) text += ` extends ${constraint.getText()}`;
    if (defaultType) text += ` = ${defaultType.getText()}`;
    return text;
  });
}
```

Now `ApiResponse` has `generics: ["T"]` in its metadata. The AI knows it is parameterized.

**Transform Detection in Nested Structures**

Zod schemas can be deeply nested:

```typescript
const schema = z.union([
  z.string().transform(sanitize),
  z.null(),
]);
```

Simple regex will not find that transform. It is inside a union, inside an array argument.

The solution is AST-based detection:

```typescript
function hasTransformInNode(node: Node): boolean {
  const callExprs = node.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const call of callExprs) {
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKindOrThrow(
        SyntaxKind.PropertyAccessExpression
      );
      if (propAccess.getName() === 'transform') {
        return true;
      }
    }
  }

  return false;
}
```

Walk the entire AST subtree. Find any `.transform()` call at any depth.

**Symbol Table Inheritance**

Zod schemas often reference other schemas:

```typescript
const urlWithProtocol = z.string()
  .transform(val => val.startsWith('http') ? val : `https://${val}`)
  .pipe(z.string().url());

const contactSchema = z.strictObject({
  website: urlWithProtocol.optional(),
});
```

The `website` field inherits its transform from `urlWithProtocol`. Naive extraction misses this.

The solution: build a symbol table first, then resolve references.

```typescript
function buildSchemaSymbolTable(
  sourceFile: SourceFile
): Map<string, SchemaSymbol> {
  const symbols = new Map<string, SchemaSymbol>();

  sourceFile.getVariableDeclarations().forEach(decl => {
    const name = decl.getName();
    const init = decl.getInitializer();
    if (!init) return;

    const text = init.getText();
    if (text.includes('z.')) {
      symbols.set(name, {
        hasTransform: hasTransformInNode(init),
        hasPipe: /\.pipe\(/.test(text),
      });
    }
  });

  return symbols;
}
```

When extracting `website`, look up `urlWithProtocol` in the symbol table. Inherit its properties.

**Conditional Hook Calls**

React forbids conditional hook calls. But developers still write them:

```typescript
function useData(shouldFetch: boolean) {
  if (shouldFetch) {
    return useQuery(...); // Invalid!
  }
  return null;
}
```

The extractor should flag this. Add a `conditionalHookCall` field to hook edges:

```typescript
if (edgeType === 'hook' && isInConditional(callExpr)) {
  edge.conditionalHookCall = true; // Rules of Hooks violation
}
```

Now the AI can answer "are there any invalid conditional hook calls in this codebase?"

---

## What's Next

We have covered how to extract entities (hooks, schemas, types) and relationships (call graphs) from source code.

But there is a problem.

All of this uses ts-morph, which parses the TypeScript AST on every run. That works for small codebases. It chokes on large ones.

[Part 6: Adding Semantic Search with Vector Embeddings](/docs/discovery-system-scalabiliy-plan/blog/06-semantic-search-embeddings.md) goes beyond structural queries entirely. Instead of asking "where is X defined?", we will ask "find code that handles user authentication" and get meaningful results.

Semantic search opens up a new dimension of code intelligence. The AI can answer questions that cannot be expressed as structural patterns.

See you there.
