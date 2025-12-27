# Finding Components with Tree-sitter

There are 484 React components in our codebase.

We found them in 400 milliseconds.

Not by reading 484 files. Not by loading gigabytes into memory. Not by running a full TypeScript compiler pass.

We walked syntax trees.

---

## The Problem

You want to find every React component in a codebase. The obvious approach is pattern matching.

```typescript
// Look for "function ComponentName" or "const ComponentName = () =>"
const componentPattern = /(?:function|const)\s+([A-Z][a-zA-Z]*)/g;
```

This breaks immediately.

```typescript
// Matches but not a component
const SOME_CONSTANT = 'value';

// Component but pattern misses it
export default function() { return <div />; }

// Component with type parameters
const MyComponent: FC<Props> = ({ children }) => <div>{children}</div>;

// Nested functions that are not components
function processData(ContactList: Array<Contact>) {
  // ContactList matches the pattern but is a parameter, not a component
}
```

Regex matches text patterns. Code has structure.

When you search for "function definitions starting with capital letters," regex gives you every match including comments, strings, and false positives. What you actually want is "function definitions at the module level that return JSX."

That requires understanding the syntax tree.

---

## The Grammar Approach

Every programming language has a grammar. Rules that define valid syntax.

When you write `const x = 1`, TypeScript parses this into a structure:

```
variable_declaration
  └── variable_declarator
      ├── name: identifier "x"
      └── value: number "1"
```

This structure is called an Abstract Syntax Tree (AST). It represents code as a tree of nodes, where each node has a type and children.

The TypeScript compiler builds this tree to type-check and compile your code. But the compiler is heavy. It loads your entire project, resolves all imports, checks all types. For extracting component names, that is overkill.

Tree-sitter takes a different approach.

Tree-sitter is a parser generator that creates extremely fast parsers for any language. Instead of loading your whole project, it parses one file at a time. Instead of type-checking, it just builds the syntax tree.

The result? Parsing 500 files takes 2 seconds, not 30 seconds. Memory usage stays under 100 MB, not 2 GB.

---

## Let Us Build It

Install Tree-sitter and the TypeScript grammar:

```bash
npm install tree-sitter tree-sitter-typescript
```

Here is a basic parser:

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

// Create parser for TypeScript
const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

// Create parser for TSX (different grammar!)
const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

function parseFile(filePath: string, content: string): Parser.Tree {
  const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
  return parser.parse(content);
}
```

Notice what this does NOT do.

It does not resolve imports. It does not type-check anything. It does not load other files. It takes a string of code and returns a syntax tree.

That is the key to speed.

Parse a file and look at what you get:

```typescript
const code = `
export function ContactList({ contacts }: Props) {
  return (
    <ul>
      {contacts.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  );
}
`;

const tree = tsxParser.parse(code);
console.log(tree.rootNode.toString());
```

Output:
```
(program
  (export_statement
    (function_declaration
      name: (identifier)
      parameters: (formal_parameters
        (required_parameter
          pattern: (object_pattern ...)
          type: (type_identifier)))
      body: (statement_block
        (return_statement
          (parenthesized_expression
            (jsx_element ...)))))))
```

The tree captures every syntactic detail. Function name, parameters, return type, body structure, JSX elements. All accessible through a consistent API.

---

## Walking the Syntax Tree

Tree-sitter provides two ways to explore nodes.

**Direct child access:**
```typescript
const functionNode = tree.rootNode.firstChild; // export_statement
const declaration = functionNode.firstChild;    // function_declaration
const name = declaration.childForFieldName('name'); // identifier "ContactList"

console.log(name.text); // "ContactList"
```

**Cursor-based traversal:**
```typescript
function visit(node: Parser.SyntaxNode) {
  console.log(node.type, node.text.slice(0, 20));

  for (const child of node.children) {
    visit(child);
  }
}

visit(tree.rootNode);
```

For finding components, we need to:
1. Find all function declarations and arrow functions
2. Check if they start with a capital letter
3. Check if they return JSX

Here is a component extractor:

```typescript
interface ComponentInfo {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  isExported: boolean;
  hooks: string[];
}

function extractComponents(
  filePath: string,
  content: string
): ComponentInfo[] {
  if (!filePath.endsWith('.tsx')) return [];

  const tree = tsxParser.parse(content);
  const components: ComponentInfo[] = [];

  visit(tree.rootNode, (node) => {
    // Check function declarations
    if (node.type === 'function_declaration') {
      const nameNode = node.childForFieldName('name');
      if (nameNode && startsWithUppercase(nameNode.text)) {
        const component = analyzeComponent(node, nameNode.text, filePath);
        if (component) components.push(component);
      }
    }

    // Check arrow functions assigned to const
    if (node.type === 'lexical_declaration') {
      const declarator = node.firstNamedChild;
      if (declarator?.type === 'variable_declarator') {
        const nameNode = declarator.childForFieldName('name');
        const valueNode = declarator.childForFieldName('value');

        if (
          nameNode &&
          startsWithUppercase(nameNode.text) &&
          valueNode?.type === 'arrow_function'
        ) {
          const component = analyzeComponent(valueNode, nameNode.text, filePath);
          if (component) components.push(component);
        }
      }
    }
  });

  return components;
}

function analyzeComponent(
  node: Parser.SyntaxNode,
  name: string,
  filePath: string
): ComponentInfo | null {
  // Check if this function returns JSX
  if (!containsJSX(node)) return null;

  // Extract hooks used in this component
  const hooks = extractHooks(node);

  // Check if exported
  const isExported = checkExported(node);

  return {
    name,
    filePath,
    startLine: node.startPosition.row + 1, // Tree-sitter uses 0-indexed lines
    endLine: node.endPosition.row + 1,
    isExported,
    hooks,
  };
}
```

---

## Detecting JSX

A function is a React component if it returns JSX. Here is how to detect that:

```typescript
const JSX_NODE_TYPES = new Set([
  'jsx_element',           // <div>...</div>
  'jsx_self_closing_element', // <Component />
  'jsx_fragment',          // <>...</>
]);

function containsJSX(node: Parser.SyntaxNode): boolean {
  // Check if this node is JSX
  if (JSX_NODE_TYPES.has(node.type)) {
    return true;
  }

  // Check children recursively
  for (const child of node.children) {
    if (containsJSX(child)) {
      return true;
    }
  }

  return false;
}
```

This catches all JSX patterns:
- Direct returns: `return <div />`
- Conditional returns: `if (x) return <A />; return <B />`
- Fragments: `return <>{items}</>`
- Nested JSX: `return <Wrapper><Inner /></Wrapper>`

---

## Extracting Hook Dependencies

Finding which hooks a component uses reveals its dependencies:

```typescript
function extractHooks(node: Parser.SyntaxNode): string[] {
  const hooks: string[] = [];

  visit(node, (child) => {
    if (child.type === 'call_expression') {
      const funcNode = child.childForFieldName('function');
      if (funcNode?.type === 'identifier') {
        const name = funcNode.text;
        // Hooks follow the useXxx naming convention
        if (name.startsWith('use') && name.length > 3 && isUpperCase(name[3])) {
          hooks.push(name);
        }
      }
    }
  });

  return [...new Set(hooks)]; // Deduplicate
}

function isUpperCase(char: string): boolean {
  return char === char.toUpperCase() && char !== char.toLowerCase();
}
```

Now you know that `ContactList` uses `useState`, `useEffect`, and `useContactData`. This information is invaluable for understanding component dependencies and refactoring.

---

## Deep Dive: Node Types and Fields

Tree-sitter grammars define both node types and fields.

**Node types** classify what a node represents:
- `function_declaration`
- `arrow_function`
- `jsx_element`
- `identifier`
- `string`

**Fields** provide named access to important children:
- `function_declaration.name` -> the function identifier
- `function_declaration.parameters` -> the parameter list
- `function_declaration.body` -> the function body

Here is how to explore a grammar:

```typescript
// Print all node types in a tree
function collectTypes(node: Parser.SyntaxNode, types = new Set<string>()) {
  types.add(node.type);
  for (const child of node.children) {
    collectTypes(child, types);
  }
  return types;
}

const allTypes = collectTypes(tree.rootNode);
console.log([...allTypes].sort());
```

For a typical React component file, you might see:
```
arrow_function, call_expression, export_statement, formal_parameters,
function_declaration, identifier, import_statement, jsx_attribute,
jsx_element, jsx_expression, jsx_self_closing_element, jsx_text,
lexical_declaration, member_expression, object_pattern, return_statement,
statement_block, string, template_string, type_identifier, ...
```

Each type has consistent structure. Once you understand the grammar, extracting specific patterns becomes mechanical.

---

## Watch Out For

Tree-sitter is powerful but has sharp edges.

**TypeScript and TSX need different parsers.**

```typescript
// WRONG: Using TypeScript parser for .tsx file
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);
parser.parse('<div></div>'); // Fails! JSX not recognized

// RIGHT: Use TSX parser for JSX files
const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);
tsxParser.parse('<div></div>'); // Works
```

Always select the parser based on file extension.

**Arrow functions have no name field.**

```typescript
// function_declaration has a name field
function MyComponent() { }
// node.childForFieldName('name') returns "MyComponent"

// arrow_function does NOT have a name field
const MyComponent = () => { }
// node.childForFieldName('name') returns null
```

For arrow functions, traverse up to the variable_declarator parent:

```typescript
function getArrowFunctionName(node: Parser.SyntaxNode): string | null {
  if (node.type !== 'arrow_function') return null;

  const parent = node.parent;
  if (parent?.type === 'variable_declarator') {
    const nameNode = parent.childForFieldName('name');
    return nameNode?.text ?? null;
  }
  return null;
}
```

**Use indices for content extraction, not positions.**

```typescript
// WRONG: Using row/column positions
const text = content.substring(
  node.startPosition.column,
  node.endPosition.column
); // Only works for single-line nodes!

// RIGHT: Using byte indices
const text = content.slice(node.startIndex, node.endIndex); // Always works
```

`startPosition` and `endPosition` are row/column pairs. `startIndex` and `endIndex` are byte offsets into the source string.

**Line numbers are 0-indexed.**

```typescript
node.startPosition.row  // 0 for first line
node.endPosition.row    // 9 for 10th line

// Human-readable:
const humanLine = node.startPosition.row + 1;
```

**Export detection requires checking ancestors.**

```typescript
// Depth 1: function is direct child of export_statement
export function Foo() {}

// Depth 3: arrow function -> variable_declarator -> lexical_declaration -> export_statement
export const Foo = () => {}
```

Check multiple ancestor levels:

```typescript
function isExported(node: Parser.SyntaxNode): boolean {
  let current: Parser.SyntaxNode | null = node;
  let depth = 0;

  while (current && depth < 5) {
    if (current.type === 'export_statement') return true;
    current = current.parent;
    depth++;
  }

  return false;
}
```

**TreeCursor requires explicit parent return.**

When using the cursor API for efficiency:

```typescript
const cursor = tree.rootNode.walk();

function visitWithCursor() {
  // Process current node
  console.log(cursor.nodeType);

  if (cursor.gotoFirstChild()) {
    do {
      visitWithCursor();
    } while (cursor.gotoNextSibling());

    cursor.gotoParent(); // MUST call or cursor gets lost!
  }
}
```

Missing the `gotoParent()` call is a common bug that causes incomplete traversals.

---

## Putting It Together

Here is a production-ready component extractor:

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

export async function extractAllComponents(
  sourceDir: string
): Promise<ComponentInfo[]> {
  const files = await glob(`${sourceDir}/**/*.tsx`);
  const components: ComponentInfo[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileComponents = extractComponents(filePath, content);
    components.push(...fileComponents);
  }

  return components;
}

function extractComponents(
  filePath: string,
  content: string
): ComponentInfo[] {
  const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
  const tree = parser.parse(content);
  const components: ComponentInfo[] = [];

  visitNode(tree.rootNode, (node) => {
    const component = tryExtractComponent(node, filePath);
    if (component) components.push(component);
  });

  return components;
}

function visitNode(
  node: Parser.SyntaxNode,
  callback: (node: Parser.SyntaxNode) => void
) {
  callback(node);
  for (const child of node.children) {
    visitNode(child, callback);
  }
}

function tryExtractComponent(
  node: Parser.SyntaxNode,
  filePath: string
): ComponentInfo | null {
  let name: string | null = null;
  let bodyNode: Parser.SyntaxNode | null = null;

  if (node.type === 'function_declaration') {
    const nameNode = node.childForFieldName('name');
    name = nameNode?.text ?? null;
    bodyNode = node;
  } else if (node.type === 'variable_declarator') {
    const nameNode = node.childForFieldName('name');
    const valueNode = node.childForFieldName('value');

    if (valueNode?.type === 'arrow_function') {
      name = nameNode?.text ?? null;
      bodyNode = valueNode;
    }
  }

  if (!name || !bodyNode) return null;
  if (!startsWithUppercase(name)) return null;
  if (!containsJSX(bodyNode)) return null;

  return {
    name,
    filePath,
    startLine: bodyNode.startPosition.row + 1,
    endLine: bodyNode.endPosition.row + 1,
    isExported: isExported(bodyNode),
    hooks: extractHooks(bodyNode),
  };
}

function startsWithUppercase(str: string): boolean {
  return str.length > 0 && str[0] === str[0].toUpperCase();
}
```

Run this on a 500-file codebase. It completes in under a second.

---

## What Is Next

We can find components. But components are just the beginning.

The same Tree-sitter techniques apply to:
- **Hooks:** Find function definitions starting with "use"
- **Zod schemas:** Find calls to `z.object()`, `z.string()`, etc.
- **Types:** Find interface and type alias declarations
- **Exports:** Build a complete export graph

The next article covers hooks, schemas, and types. Same parsing technique, different node types to match.

Once we can extract all these elements, we will build the call graph: who calls whom, who renders whom, who depends on whom.

The syntax tree knows everything. We just need to ask the right questions.

---

## Quick Reference

**Install Tree-sitter:**
```bash
npm install tree-sitter tree-sitter-typescript
```

**Create parsers:**
```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);
```

**Parse a file:**
```typescript
const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
const tree = parser.parse(content);
```

**Access nodes:**
```typescript
node.type           // "function_declaration"
node.text           // Source code string
node.startPosition  // { row: 0, column: 0 }
node.startIndex     // Byte offset
node.childForFieldName('name')  // Named child access
node.children       // All children array
```

**Common node types:**
- `function_declaration` - Named functions
- `arrow_function` - Arrow functions
- `variable_declarator` - const/let/var assignments
- `jsx_element` - `<Tag>...</Tag>`
- `jsx_self_closing_element` - `<Tag />`
- `call_expression` - Function calls
- `identifier` - Names

**Key insight:**
Parse fast, traverse smart. Tree-sitter gives you structure without the weight of a full compiler.

---

*This is part 4 of a 12-part series on building local code intelligence.*
