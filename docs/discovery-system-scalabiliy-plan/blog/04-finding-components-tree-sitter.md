# Finding Components with Tree-sitter

There are 484 React components in our codebase.

We found them in 400 milliseconds.

Not by reading every file. Not by loading gigabytes into memory. Not by running the TypeScript compiler.

We walked syntax trees.

---

## Why Regex Fails

You want to find every React component. The obvious approach is pattern matching.

```typescript
const componentPattern = /(?:function|const)\s+([A-Z][a-zA-Z]*)/g;
```

This breaks immediately.

```typescript
const SOME_CONSTANT = 'value';     // Matches but not a component
function processData(ContactList: Array<Contact>) { }  // Parameter, not component
```

Regex matches characters. Period.

What you actually want is "functions that return JSX." That requires understanding structure.

It's like trying to find all the bedrooms in a house by searching for the word "bed" in the blueprints. You might find some. You'll also find "bedside table" and miss rooms with "sleeping quarters."

---

## What Tree-sitter Actually Is

Tree-sitter is a parser generator that creates extremely fast parsers for any language.

A parser reads code and converts it into a structured tree representation. Each node in the tree has a type: `function_declaration`, `identifier`, `jsx_element`.

It's like converting a sentence into a grammar diagram. "The cat sat" becomes Subject -> Verb -> Predicate. You can now ask "what's the verb?" instead of searching for words that look verb-like.

Here's the key difference from TypeScript's compiler.

TypeScript loads your entire project. Resolves imports. Checks types. That takes 30 seconds and 2 GB of RAM.

Tree-sitter parses one file at a time. No imports. No type checking. Just structure.

500 files in 2 seconds. Under 100 MB.

---

## Your First Parse

Install Tree-sitter and the TypeScript grammar:

```bash
npm install tree-sitter tree-sitter-typescript
```

Parse a file:

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

const tree = tsxParser.parse(`
  export function ContactList() {
    return <ul>{items}</ul>;
  }
`);
```

That's it.

Notice what this does NOT do. It doesn't resolve imports. It doesn't type-check. It doesn't load other files. It takes a string and returns a tree.

That's the secret to speed.

---

## Inside the Syntax Tree

What does the tree actually look like?

```
program
  export_statement
    function_declaration
      name: identifier "ContactList"
      body: statement_block
        return_statement
          jsx_element
```

An Abstract Syntax Tree (AST) represents your code as nested nodes. Each node has a type and children.

It's like an org chart for your code. The CEO (program) has departments (statements), which have teams (declarations), which have individuals (identifiers).

Every syntactic detail is captured. Function names. Parameters. Return statements. JSX elements. All accessible through a consistent API.

---

## Finding Components

A React component is a function that returns JSX. Here's how to find them:

```typescript
function isComponent(node: Parser.SyntaxNode): boolean {
  if (node.type !== 'function_declaration') return false;

  const name = node.childForFieldName('name')?.text;
  if (!name || name[0] !== name[0].toUpperCase()) return false;

  return containsJSX(node);
}
```

Walk the tree. Check each function. Does the name start uppercase? Does the body contain JSX?

It's like sorting mail by checking the address format rather than reading every letter.

---

## Detecting JSX

How do you know if a function returns JSX?

```typescript
const JSX_TYPES = new Set([
  'jsx_element',              // <div>...</div>
  'jsx_self_closing_element', // <Component />
  'jsx_fragment',             // <>...</>
]);

function containsJSX(node: Parser.SyntaxNode): boolean {
  if (JSX_TYPES.has(node.type)) return true;
  return node.children.some(containsJSX);
}
```

Check if any descendant is a JSX node. Recursive search through the tree.

This catches everything. Direct returns. Conditional returns. Nested JSX. Fragments.

---

## The Parser Trap

Here's where most people get bitten.

TypeScript and TSX need different parsers.

```typescript
// WRONG - JSX fails silently
parser.setLanguage(TypeScript.typescript);
parser.parse('<div></div>');  // Broken tree

// RIGHT
parser.setLanguage(TypeScript.tsx);
parser.parse('<div></div>');  // Works
```

The TypeScript grammar doesn't understand JSX syntax. Your tree will be malformed and you'll miss components.

Always check the file extension. `.tsx` files get the TSX parser. `.ts` files get the TypeScript parser.

It's like using French grammar rules to parse Spanish. Similar enough to seem right, wrong enough to fail.

---

## Arrow Functions Are Different

Here's another trap.

```typescript
function MyComponent() { }        // Has a name field
const MyComponent = () => { }     // No name field
```

Function declarations have a `name` field. Arrow functions don't.

For arrow functions, the name lives on the parent `variable_declarator`:

```typescript
function getName(node: Parser.SyntaxNode): string | null {
  if (node.type === 'function_declaration') {
    return node.childForFieldName('name')?.text ?? null;
  }
  if (node.type === 'arrow_function') {
    const parent = node.parent;
    if (parent?.type === 'variable_declarator') {
      return parent.childForFieldName('name')?.text ?? null;
    }
  }
  return null;
}
```

The name isn't ON the function. It's on the assignment.

It's like asking someone's name. A person can tell you directly. A package needs you to read the label.

---

## Extracting Hook Dependencies

Want to know which hooks a component uses?

```typescript
function extractHooks(node: Parser.SyntaxNode): string[] {
  const hooks: string[] = [];

  visit(node, (child) => {
    if (child.type === 'call_expression') {
      const name = child.childForFieldName('function')?.text;
      if (name?.startsWith('use') && /^use[A-Z]/.test(name)) {
        hooks.push(name);
      }
    }
  });

  return [...new Set(hooks)];
}
```

Find all `call_expression` nodes. Check if the function name matches the `useXxx` pattern. Deduplicate.

Now you know that `ContactList` uses `useState`, `useEffect`, and `useContactData`. Invaluable for understanding dependencies.

---

## Export Detection

Is this component exported?

The answer depends on how deep you look.

```typescript
export function Foo() {}        // Parent is export_statement
export const Foo = () => {}     // Great-great-grandparent is export_statement
```

Check multiple ancestor levels:

```typescript
function isExported(node: Parser.SyntaxNode): boolean {
  let current = node;
  for (let i = 0; i < 5; i++) {
    if (current.type === 'export_statement') return true;
    if (!current.parent) break;
    current = current.parent;
  }
  return false;
}
```

Don't just check the immediate parent. The export might be several levels up.

It's like asking if someone works for a company. They might be a direct employee, or a contractor, or a contractor's subcontractor. You need to follow the chain.

---

## Position vs Index

Tree-sitter gives you two ways to locate text.

Positions are row/column pairs:
```typescript
node.startPosition  // { row: 5, column: 0 }
node.endPosition    // { row: 10, column: 1 }
```

Indices are byte offsets:
```typescript
node.startIndex     // 142
node.endIndex       // 387
```

Here's the trap. Positions only work for single-line extractions.

```typescript
// WRONG - breaks for multi-line nodes
content.substring(node.startPosition.column, node.endPosition.column);

// RIGHT - always works
content.slice(node.startIndex, node.endIndex);
```

Use indices for extracting text. Use positions for human-readable line numbers.

And remember: lines are 0-indexed. Line 1 in your editor is row 0 in Tree-sitter.

---

## The TreeCursor Trap

Tree-sitter has a cursor API for efficient traversal. It's faster than recursion.

It's also a footgun.

```typescript
const cursor = tree.rootNode.walk();

function traverse() {
  console.log(cursor.nodeType);

  if (cursor.gotoFirstChild()) {
    do { traverse(); } while (cursor.gotoNextSibling());
    cursor.gotoParent();  // MUST call this!
  }
}
```

Miss the `gotoParent()` call and your cursor gets lost. You'll skip entire subtrees with no error message.

Stick with recursive traversal unless you're parsing thousands of files and need every millisecond.

---

## Putting It Together

Here's a production-ready component extractor:

```typescript
async function extractAllComponents(sourceDir: string) {
  const files = await glob(`${sourceDir}/**/*.tsx`);
  const components = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parser = filePath.endsWith('.tsx') ? tsxParser : tsParser;
    const tree = parser.parse(content);

    visit(tree.rootNode, (node) => {
      const component = tryExtractComponent(node, filePath);
      if (component) components.push(component);
    });
  }

  return components;
}
```

Run this on 500 files. Under a second.

The syntax tree knows everything. We just asked the right questions.

---

## What's Next

We can find components. But components are just the beginning.

The same techniques apply to hooks. To Zod schemas. To type definitions. To exports.

It's like learning to read sheet music. Once you can parse the notation, you can analyze any piece. Different notes, same skill.

The next article covers hooks, schemas, and types. Same parsing technique. Different node types.

Then we build the call graph: who calls whom, who renders whom, who depends on whom.

---

## Quick Reference

```bash
npm install tree-sitter tree-sitter-typescript
```

```typescript
// Create parsers
const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

// Parse (pick parser by extension!)
const tree = parser.parse(content);

// Access nodes
node.type                        // "function_declaration"
node.text                        // Source code
node.childForFieldName('name')   // Named field access
node.children                    // All children
node.startIndex / node.endIndex  // Byte offsets (use for text extraction)
node.startPosition.row + 1       // Human-readable line number
```

**Key insight:** Parse fast, traverse smart. Tree-sitter gives you structure without the weight of a full compiler.

---

*Part 4 of 12: Building Local Code Intelligence*
