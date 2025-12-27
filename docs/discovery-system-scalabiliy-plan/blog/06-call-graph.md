# The Call Graph: Who Calls What

Your code has circular dependencies.

You might not know it yet. They are hiding in there, quietly making your codebase harder to refactor, harder to test, and harder to reason about.

But how do you find them?

You need a call graph.

---

## The Phone Log Analogy

Picture an office phone system from the 1990s.

Every call gets logged. Alice called Bob at 2:15pm. Bob called Carol at 2:17pm. Carol called Alice at 2:20pm.

If you wanted to know "who talks to whom?", you would not sit in the hallway eavesdropping. You would pull the phone logs and draw a diagram.

```
Alice ───call──> Bob
          │
          ▼
        Carol ───call──> Alice
```

Wait. Alice called Bob, who called Carol, who called... Alice?

That is a cycle. And in an office, maybe that is fine. But in code, cycles create problems.

A call graph does the same thing for your functions. It tracks who calls whom, when, and under what conditions.

---

## Nodes, Edges, and Why We Care

A call graph has two parts.

**Nodes** are the things that can call other things. Functions. Components. Hooks. Methods.

**Edges** are the calls themselves. Function A calls Function B. Component X renders Component Y. Hook Z invokes another hook.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CALL GRAPH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐         ┌─────────────┐                       │
│   │ ContactList │──call──>│ useContacts │                       │
│   │ (component) │         │   (hook)    │                       │
│   └──────┬──────┘         └─────────────┘                       │
│          │                                                       │
│          │render                                                 │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │ ContactCard │──callback──> handleClick                      │
│   │ (component) │                                               │
│   └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Each edge has a type:

- **call** - Direct function invocation: `fetchData()`
- **render** - JSX component usage: `<ContactCard />`
- **hook** - Hook invocation: `useContacts()`
- **callback** - Passing a function as a prop: `onClick={handleSubmit}`

Why does this matter? Three reasons.

**Dead code detection.** If no edge points to a node, nothing calls it. It might be dead code.

**Circular dependency detection.** If you can follow edges from A to B to C and back to A, you have a cycle. Cycles make refactoring dangerous because changing A might break C which breaks B which breaks A.

**Impact analysis.** Want to change function X? The call graph tells you every function that depends on X, directly or indirectly. Change with confidence or fear appropriately.

---

## Finding Circular Dependencies

Here is the real power of a call graph.

You have a 500-component React application. Somewhere in there, Component A imports Component B imports Component C imports Component A.

How would you find this manually?

You would open Component A. Read through the imports. Open Component B. Read through those imports. Open Component C. Check its imports. By now you have forgotten what you were looking for.

Repeat this for 500 components.

You would not. You would give up and hope for the best.

But the call graph makes it trivial. Follow the edges. If you end up where you started, you found a cycle.

```
ContactEdit ─────> useContactForm
     ▲                    │
     │                    ▼
     │              ContactValidator
     │                    │
     └────────────────────┘

CYCLE DETECTED: ContactEdit → useContactForm → ContactValidator → ContactEdit
```

In a real codebase, cycles are rarely this obvious. They span five, ten, twenty files. They hide behind layers of abstraction.

That is why we need an algorithm to find them automatically.

---

## Let's Build It

Time to write the extractor.

First, let's define what we are capturing:

```typescript
// What we're tracking - the nodes (functions/components)
interface CallGraphNode {
  id: string;           // "file:line:name" - unique identifier
  name: string;         // Function/component name
  file: string;         // Relative file path
  line: number;         // Declaration line
  nodeType: 'function' | 'component' | 'hook' | 'arrow';
  exported: boolean;    // Is it exported from the module?
  async: boolean;       // Is it async?
}

// What we're tracking - the edges (calls/renders)
interface CallGraphEdge {
  source: string;       // Node ID of caller
  target: string;       // Node ID or name of callee
  targetName: string;   // Name of the callee for display
  edgeType: 'call' | 'render' | 'hook' | 'callback';
  line: number;         // Line where call occurs
  conditional: boolean; // Inside if/ternary?
  inLoop: boolean;      // Inside loop?
}
```

The `conditional` and `inLoop` flags are gold for debugging. They tell you not just *what* calls *what*, but *when*.

A function called inside a loop behaves very differently than one called once at the top level.

---

### Classifying Nodes

How do we know if something is a component versus a hook versus a plain function?

Naming conventions.

```typescript
function isHookName(name: string): boolean {
  // Hooks start with "use" followed by uppercase
  // useEffect, useState, useContacts - yes
  // used, user, useful - no
  return name.startsWith("use") &&
         name.length > 3 &&
         /[A-Z]/.test(name[3]);
}

function isComponentName(name: string): boolean {
  // Components are PascalCase
  // ContactList, Button, App - yes
  // contactList, button - no
  return /^[A-Z]/.test(name) && !isHookName(name);
}

function classifyNodeType(
  name: string,
  isArrow: boolean
): CallGraphNode['nodeType'] {
  if (isHookName(name)) return 'hook';
  if (isComponentName(name)) return 'component';
  if (isArrow) return 'arrow';
  return 'function';
}
```

This is React's convention working in our favor. The community agreed on naming rules, and now we can exploit them for static analysis.

---

### Detecting Context: Conditionals and Loops

When a call happens matters almost as much as what calls what.

A hook called inside an `if` statement? That is a React rules violation. The call graph should flag it.

```typescript
function isInConditional(node: Node): boolean {
  let parent = node.getParent();

  while (parent) {
    const kind = parent.getKind();

    // Found a conditional - we're inside one
    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ConditionalExpression ||
      kind === SyntaxKind.SwitchStatement
    ) {
      return true;
    }

    // Hit a function boundary - stop looking
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.FunctionExpression ||
      kind === SyntaxKind.ArrowFunction
    ) {
      break;
    }

    parent = parent.getParent();
  }

  return false;
}
```

We walk up the AST tree. If we hit a conditional before we hit the function boundary, we are inside a conditional.

Same pattern for loops:

```typescript
function isInLoop(node: Node): boolean {
  let parent = node.getParent();

  while (parent) {
    const kind = parent.getKind();

    if (
      kind === SyntaxKind.ForStatement ||
      kind === SyntaxKind.ForInStatement ||
      kind === SyntaxKind.ForOfStatement ||
      kind === SyntaxKind.WhileStatement ||
      kind === SyntaxKind.DoStatement
    ) {
      return true;
    }

    // Stop at function boundary
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.FunctionExpression ||
      kind === SyntaxKind.ArrowFunction
    ) {
      break;
    }

    parent = parent.getParent();
  }

  return false;
}
```

---

### Extracting Call Edges

Now the core logic. Given a function body, find every call expression.

```typescript
function extractCallEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  // Find all call expressions: foo(), bar.baz(), etc.
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

    // Determine edge type
    let edgeType: CallGraphEdge['edgeType'] = 'call';
    if (isHookName(targetName)) {
      edgeType = 'hook';
    }

    edges.push({
      source: sourceNodeId,
      target: targetName,
      targetName,
      edgeType,
      line: callExpr.getStartLineNumber(),
      conditional: isInConditional(callExpr),
      inLoop: isInLoop(callExpr),
    });
  }

  return edges;
}
```

---

### Extracting JSX Edges

React components call other components through JSX. That is a different kind of edge.

```typescript
function extractJsxEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  // Find <Component>...</Component> elements
  const jsxElements = bodyNode.getDescendantsOfKind(SyntaxKind.JsxElement);

  for (const jsx of jsxElements) {
    const openingElement = jsx.getOpeningElement();
    const tagName = openingElement.getTagNameNode().getText();

    // Only track PascalCase (components, not HTML elements)
    if (isComponentName(tagName)) {
      edges.push({
        source: sourceNodeId,
        target: tagName,
        targetName: tagName,
        edgeType: 'render',
        line: jsx.getStartLineNumber(),
        conditional: isInConditional(jsx),
        inLoop: isInLoop(jsx),
      });
    }
  }

  // Also find <Component /> self-closing elements
  const selfClosing = bodyNode.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement
  );

  for (const jsx of selfClosing) {
    const tagName = jsx.getTagNameNode().getText();

    if (isComponentName(tagName)) {
      edges.push({
        source: sourceNodeId,
        target: tagName,
        targetName: tagName,
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

Notice we skip lowercase tags. `<div>` and `<span>` are HTML elements, not components. We do not care about those edges.

---

## Tarjan's Algorithm (The Simple Version)

Now the fun part. Finding cycles.

The algorithm we need is Tarjan's Strongly Connected Components (SCC) algorithm. It sounds intimidating, but the idea is simple.

Imagine you are exploring a maze. You mark each room with a number as you enter: 1, 2, 3, and so on. You also track the lowest-numbered room you can reach from your current position.

If you walk into a room and it is already on your current path? You found a loop. Everything from that room back to where you are forms a cycle.

Tarjan's algorithm does this systematically. It explores the entire graph using depth-first search, tracking which nodes can reach which other nodes. Nodes that can all reach each other form a "strongly connected component."

Think of an SCC as a group of nodes where you can start at any one and eventually get back to it through the edges. If there is only one node in the group, it is just a node with no cycle. If there are two or more nodes, they form a cycle because they can all reach each other.

An SCC with more than one node is a cycle.

```typescript
function detectCycles(
  nodes: CallGraphNode[],
  edges: CallGraphEdge[]
): string[][] {
  // Build adjacency list (who calls whom)
  const adjList = new Map<string, string[]>();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source)) {
      const neighbors = adjList.get(edge.source) || [];
      // Find the target node by name
      const targetNode = nodes.find(n => n.name === edge.target);
      if (targetNode) {
        neighbors.push(targetNode.id);
        adjList.set(edge.source, neighbors);
      }
    }
  }

  // Tarjan's state
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const sccs: string[][] = [];

  function strongConnect(v: string): void {
    // Assign index and lowlink
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    // Visit all neighbors
    const neighbors = adjList.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        // Not yet visited - recurse
        strongConnect(w);
        lowlinks.set(v, Math.min(
          lowlinks.get(v)!,
          lowlinks.get(w)!
        ));
      } else if (onStack.has(w)) {
        // Already on stack - we found a cycle
        lowlinks.set(v, Math.min(
          lowlinks.get(v)!,
          indices.get(w)!
        ));
      }
    }

    // If v is a root, pop the SCC
    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      // Only report actual cycles (size > 1)
      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  // Run on all nodes
  for (const node of nodes) {
    if (!indices.has(node.id)) {
      strongConnect(node.id);
    }
  }

  return sccs;
}
```

The magic is in the `lowlinks`. Each node tracks the lowest index it can reach. If a node's lowlink equals its own index, it is the root of an SCC. Everything on the stack above it belongs to the same SCC.

---

## Deep Dive: Edge Cases

The basic extractor works. But real codebases are messy.

### Callbacks and Event Handlers

When you pass a function as a prop, that is a dependency relationship:

```tsx
<Button onClick={handleSubmit} />
```

`Button` does not *call* `handleSubmit`. But it *depends* on it. The user clicking triggers the call.

We track these as `callback` edges:

```typescript
// Inside extractJsxEdges, for each attribute
const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
const initializer = jsxAttr.getInitializer();

if (initializer?.getKind() === SyntaxKind.JsxExpression) {
  const expr = initializer.asKindOrThrow(SyntaxKind.JsxExpression);
  const exprNode = expr.getExpression();

  if (exprNode?.getKind() === SyntaxKind.Identifier) {
    const handlerName = exprNode.getText();

    // Only track handler-like names
    if (/^(handle|on)[A-Z]/.test(handlerName)) {
      edges.push({
        source: sourceNodeId,
        target: handlerName,
        targetName: handlerName,
        edgeType: 'callback',
        line: attr.getStartLineNumber(),
        conditional: isInConditional(attr),
        inLoop: isInLoop(attr),
      });
    }
  }
}
```

---

### Async Functions

Async functions behave differently. An `await` pauses execution. The call graph should capture this.

```typescript
const node: CallGraphNode = {
  id: nodeId,
  name,
  file: relativePath,
  line: funcDecl.getStartLineNumber(),
  nodeType: classifyNodeType(name, false),
  exported,
  async: funcDecl.isAsync(),  // <-- Track this
};
```

Why does this matter? Async boundaries are where errors can slip through. A call graph that knows which paths are async helps you trace error propagation.

---

### Arrow Functions vs Function Declarations

Both are functions. But they behave differently.

Arrow functions capture `this` from their enclosing scope. Function declarations have their own `this`. For React components, this rarely matters. But for methods and callbacks, it is crucial.

We track this by setting `nodeType: 'arrow'` for arrow functions that are not hooks or components.

---

## Watch Out For

Static analysis has limits. Here is what the call graph cannot see.

### Dynamic Imports

```typescript
const module = await import(`./features/${featureName}`);
module.init();
```

The target of this call is a runtime value. Static analysis cannot know what `featureName` will be.

**Impact:** Some edges will be missing. Functions loaded dynamically will appear disconnected.

**Workaround:** Document dynamic import points in comments. Or maintain a separate manifest of dynamic modules.

---

### eval and Function Constructors

```typescript
eval('someFunction()');
new Function('return someFunction()')();
```

If your codebase uses `eval`, stop reading this article and go fix that first.

Seriously. `eval` is a security nightmare and makes static analysis impossible.

---

### String-Based Method Calls

```typescript
const methodName = 'handleSubmit';
this[methodName]();
```

The extractor sees `this[methodName]()`. It does not know that `methodName` is `'handleSubmit'`.

**Impact:** Edge will be missing or point to the wrong target.

**Workaround:** Avoid bracket notation for method calls when possible. Or add explicit type annotations.

---

### Higher-Order Functions

```typescript
const wrapped = withAuth(MyComponent);
```

Is `wrapped` a call to `withAuth`? Yes. Does `wrapped` eventually render `MyComponent`? Yes. But the call graph sees only the first edge.

The relationship between `wrapped` and `MyComponent` is lost because it happens at runtime through function composition.

**Impact:** Some component dependencies will be invisible.

**Workaround:** Follow naming conventions that make HOC relationships obvious. `AuthenticatedMyComponent` instead of just `wrapped`.

---

### Indirect Callbacks

```typescript
const handlers = { submit: handleSubmit };
<Button onClick={handlers.submit} />
```

The extractor sees `onClick={handlers.submit}`. It knows something is being passed. But tracing through the `handlers` object requires data flow analysis, which is much more complex.

**Impact:** Callback edge will point to `submit` (the property name) instead of `handleSubmit`.

**Workaround:** Pass handlers directly when possible. Or accept that some indirection will be invisible.

---

## Real Output: What You Get

Here is what a chunk from a real call graph looks like:

```json
{
  "chunk_name": "activities",
  "generated_at": "2025-12-27T06:59:42.746Z",
  "items": {
    "nodes": [
      {
        "id": "src/atomic-crm/activities/ActivityCreate.tsx:25:ActivityCreate",
        "name": "ActivityCreate",
        "file": "src/atomic-crm/activities/ActivityCreate.tsx",
        "line": 25,
        "nodeType": "component",
        "exported": true,
        "async": false
      }
    ],
    "edges": [
      {
        "source": "src/atomic-crm/activities/ActivityCreate.tsx:25:ActivityCreate",
        "target": "useRecordContext",
        "targetName": "useRecordContext",
        "edgeType": "hook",
        "line": 28,
        "conditional": false,
        "inLoop": false
      }
    ]
  }
}
```

919 nodes. 10,000+ edges. 30 chunks. All extracted in under 3 seconds.

And when there are cycles:

```
  ⚠️  Detected 2 circular dependency cycle(s)
      ContactEdit → useContactForm → ContactValidator → ContactEdit
      OpportunityCard → usePipelineStage → OpportunityCard
```

---

## Putting It All Together

Here is the main extraction function that ties everything together:

```typescript
async function extractCallGraph(): Promise<void> {
  console.log("Extracting call graph...");

  // Load all source files
  const sourceFiles = project.addSourceFilesAtPaths([
    "src/**/*.ts",
    "src/**/*.tsx",
  ]);

  // Filter out test files
  const filteredFiles = sourceFiles.filter(sf => {
    const filePath = sf.getFilePath();
    return !filePath.includes("node_modules") &&
           !filePath.includes(".test.") &&
           !filePath.includes("__tests__");
  });

  // Collect nodes and edges from each file
  const allNodes: CallGraphNode[] = [];
  const allEdges: CallGraphEdge[] = [];

  for (const sourceFile of filteredFiles) {
    const relativePath = path.relative(process.cwd(), sourceFile.getFilePath());
    const { nodes, edges } = processSourceFile(sourceFile, relativePath);
    allNodes.push(...nodes);
    allEdges.push(...edges);
  }

  // Run cycle detection
  const cycles = detectCycles(allNodes, allEdges);

  // Report results
  console.log(`Found ${allNodes.length} nodes, ${allEdges.length} edges`);
  if (cycles.length > 0) {
    console.log(`Detected ${cycles.length} circular dependency cycle(s)`);
  }
}
```

The process is straightforward:

1. Load all TypeScript and TSX files
2. Filter out tests and node_modules
3. Extract nodes and edges from each file
4. Run Tarjan's algorithm to find cycles
5. Report what we found

The whole extraction runs in under 3 seconds for a 500-component codebase. That is fast enough to run in CI on every commit.

---

## What's Next

The call graph is powerful, but it is also raw data.

In the next article, we will build visualizations on top of it. Interactive diagrams where you can click a node and see all its dependencies highlighted. Heatmaps showing which files have the most connections. Treemaps that reveal which features are most tightly coupled.

The call graph captures the data. Visualization makes it useful.

But first, go run the extractor on your codebase.

You might be surprised what cycles you find.
