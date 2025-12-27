# Chunking Code: Where to Draw the Lines

You don't embed entire books. You embed chapters.

Actually, you embed paragraphs. Sometimes sentences. But never arbitrary slices of words that cut a sentence in half mid-thought.

Yet that is exactly what most code chunking systems do. They slice your source files every 500 lines like a butcher who doesn't care where the joints are.

This article is about doing better.

---

## The Recipe-Cutting Problem

Imagine you're creating a searchable cookbook database.

Each recipe needs to be chunked into smaller pieces so your embedding model can understand it. You decide to split every 100 words.

Here's what happens to Grandma's lasagna recipe:

**Chunk 1:**
```
Lasagna Recipe

Ingredients:
- 1 lb ground beef
- 1 onion, diced
- 4 cloves garlic, minced
- 28 oz crushed tomatoes
- 2 tbsp olive
```

**Chunk 2:**
```
oil
- 1 tsp salt
- 1 tsp oregano

Instructions:
Brown the beef in a large pan over medium-high heat...
```

Your search system just learned that lasagna requires something called "olive" as an ingredient.

When someone searches "recipes with olive oil," this chunk won't match. The word "oil" is in a completely different chunk.

Worse, chunk 2 starts with a dangling "oil" that has no context. Your embedding model has no idea what this orphaned word connects to.

This is what happens when you cut without looking.

---

## Why Chunks Matter

Code chunking affects everything downstream.

Embeddings capture meaning. If your chunk has incomplete meaning, your embedding captures incomplete meaning.

A vector search for "authentication middleware" won't find your auth middleware if the function signature is in one chunk and the implementation is in another.

Retrieval-Augmented Generation (RAG) feeds chunks to language models. If the model receives a chunk that starts mid-function, it lacks the context to understand what it's looking at.

Bad chunks create bad searches create bad AI assistance.

The garbage in, garbage out principle applies at the chunking layer before it applies anywhere else.

---

## Why Line-Based Chunking Fails

Most tutorials show you something like this:

```typescript
function chunkByLines(content: string, maxLines: number): string[] {
  const lines = content.split('\n');
  const chunks: string[] = [];

  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join('\n'));
  }

  return chunks;
}
```

Simple. Clean. Catastrophically wrong for code.

This function has no idea what TypeScript is. It doesn't know what a function looks like. It can't tell the difference between a blank line and a semantic boundary.

A 500-line file chunked every 100 lines produces five chunks. Maybe chunk 3 starts in the middle of a class method and ends in the middle of a different method. Both methods are now unsearchable by their complete semantics.

Line-based chunking is context-blind.

---

## Tree-sitter: The Swiss Army Knife

Tree-sitter is a parser generator and incremental parsing library.

That's the technical definition. Here's the useful one:

Tree-sitter reads your code and understands its structure. Not just the text. The actual grammar.

It knows that `function calculateTotal(items: Item[])` is a function declaration. It knows where the function body starts and ends. It knows that the curly brace on line 47 closes the opening brace on line 12.

Tree-sitter doesn't guess. It parses.

And it parses fast. Fast enough to run on every keystroke in code editors like VS Code, Neovim, and Zed. Fast enough to parse a 50,000-line file in milliseconds.

It supports over 40 programming languages. TypeScript, JavaScript, Python, Rust, Go, Java, C, C++, Ruby, PHP, and many more.

One tool that speaks every language in your codebase.

---

## How Tree-sitter Sees Your Code

When you look at this code:

```typescript
interface User {
  id: string;
  name: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}
```

You see two things: an interface and a function.

Tree-sitter sees the same thing, but formally:

```
program
  interface_declaration
    name: type_identifier (User)
    object_type
      property_signature
        name: property_identifier (id)
        type_annotation: predefined_type (string)
      property_signature
        name: property_identifier (name)
        type_annotation: predefined_type (string)
  function_declaration
    name: identifier (greetUser)
    parameters: formal_parameters
      required_parameter
        name: identifier (user)
        type_annotation: type_identifier (User)
    return_type: type_annotation
      predefined_type (string)
    body: statement_block
      return_statement
        template_string (Hello, ${user.name}!)
```

This is called an Abstract Syntax Tree (AST). It's not just text anymore. It's a tree structure where each node knows its type and its children.

The tree knows that `User` is an interface. It knows that `greetUser` is a function that takes a `User` and returns a `string`. It knows exactly where each construct starts and ends.

This is the foundation of semantic chunking.

---

## Finding Natural Boundaries

What are the natural units of code?

Functions. They have a name, parameters, a body, and a purpose. They're self-contained.

Classes. They group related methods and properties. They represent a concept.

Interfaces and types. They define shapes. They document contracts.

Exports. They declare what a module shares with the world.

These are your chunks.

A function should never be split in half. An interface should stay whole. A class might be too big for one chunk, but each method within it is a valid chunk on its own.

Tree-sitter gives you the boundaries. You just have to respect them.

---

## Let's Build It

Time to write code. We'll create a chunking script that uses Tree-sitter to find natural boundaries in TypeScript files.

First, install the dependencies:

```bash
npm install tree-sitter tree-sitter-typescript
```

Now, the chunking script:

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

// Initialize parser with TypeScript grammar
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

// Node types that represent complete, chunkable units
const CHUNK_NODE_TYPES = new Set([
  'function_declaration',
  'class_declaration',
  'interface_declaration',
  'type_alias_declaration',
  'enum_declaration',
  'export_statement',
  'lexical_declaration', // const/let at module level
  'variable_declaration',
  'method_definition',
]);

interface CodeChunk {
  type: string;
  name: string | null;
  content: string;
  startLine: number;
  endLine: number;
}

function extractChunks(sourceCode: string): CodeChunk[] {
  const tree = parser.parse(sourceCode);
  const chunks: CodeChunk[] = [];

  function visit(node: Parser.SyntaxNode) {
    // Check if this node type is a chunk boundary
    if (CHUNK_NODE_TYPES.has(node.type)) {
      chunks.push({
        type: node.type,
        name: extractName(node),
        content: node.text,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
      });

      // Don't recurse into chunked nodes
      // (we don't want methods as separate chunks if the class is already chunked)
      return;
    }

    // Recurse into children
    for (const child of node.children) {
      visit(child);
    }
  }

  visit(tree.rootNode);
  return chunks;
}

function extractName(node: Parser.SyntaxNode): string | null {
  // Different node types store names differently
  const nameNode = node.childForFieldName('name');
  if (nameNode) {
    return nameNode.text;
  }

  // Handle export statements that wrap declarations
  if (node.type === 'export_statement') {
    const declaration = node.childForFieldName('declaration');
    if (declaration) {
      return extractName(declaration);
    }
  }

  return null;
}
```

Let's test it:

```typescript
const testCode = `
interface User {
  id: string;
  name: string;
  email: string;
}

export function createUser(data: Partial<User>): User {
  return {
    id: generateId(),
    name: data.name ?? 'Anonymous',
    email: data.email ?? '',
  };
}

const DEFAULT_ROLE = 'viewer';

class UserService {
  private users: Map<string, User> = new Map();

  add(user: User): void {
    this.users.set(user.id, user);
  }

  find(id: string): User | undefined {
    return this.users.get(id);
  }
}
`;

const chunks = extractChunks(testCode);

for (const chunk of chunks) {
  console.log(`[${chunk.type}] ${chunk.name ?? '(anonymous)'}`);
  console.log(`  Lines ${chunk.startLine}-${chunk.endLine}`);
  console.log(`  ${chunk.content.split('\n')[0]}...`);
  console.log();
}
```

Output:

```
[interface_declaration] User
  Lines 2-6
  interface User {...

[export_statement] createUser
  Lines 8-14
  export function createUser(data: Partial<User>): User {...

[lexical_declaration] DEFAULT_ROLE
  Lines 16-16
  const DEFAULT_ROLE = 'viewer';

[class_declaration] UserService
  Lines 18-28
  class UserService {...
```

Four semantic chunks. No function split in half. No dangling code fragments.

---

## Deep Dive: Node Types

Tree-sitter's power comes from its precise node types. Here are the ones that matter for TypeScript chunking:

**Top-Level Declarations:**
- `function_declaration` - Named functions: `function foo() {}`
- `class_declaration` - Classes: `class Foo {}`
- `interface_declaration` - Interfaces: `interface Foo {}`
- `type_alias_declaration` - Type aliases: `type Foo = ...`
- `enum_declaration` - Enums: `enum Foo {}`

**Variable Declarations:**
- `lexical_declaration` - `const` and `let` statements
- `variable_declaration` - `var` statements

**Exports:**
- `export_statement` - Wraps any exported declaration

**Class Members:**
- `method_definition` - Methods inside classes
- `public_field_definition` - Class properties

**React-Specific:**
- Arrow function components appear as `lexical_declaration` with an `arrow_function` child
- Function components appear as `function_declaration`

You can explore the AST for any code using the Tree-sitter Playground at https://tree-sitter.github.io/tree-sitter/playground. Paste your code and see exactly how Tree-sitter parses it.

---

## Handling Large Constructs

What if a class has 50 methods and 800 lines?

One option: keep it as a single chunk. The embedding model will process the whole thing. This works if your embedding model handles long inputs well.

Another option: chunk the class, then chunk each method separately. Now you have a class-level chunk (for searches about the class itself) and method-level chunks (for searches about specific functionality).

```typescript
function extractChunksWithNesting(
  sourceCode: string,
  maxChunkLines: number = 100
): CodeChunk[] {
  const tree = parser.parse(sourceCode);
  const chunks: CodeChunk[] = [];

  function visit(node: Parser.SyntaxNode, depth: number = 0) {
    if (CHUNK_NODE_TYPES.has(node.type)) {
      const lineCount = node.endPosition.row - node.startPosition.row + 1;

      chunks.push({
        type: node.type,
        name: extractName(node),
        content: node.text,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
      });

      // If the chunk is large, also extract its children
      if (lineCount > maxChunkLines) {
        for (const child of node.children) {
          visit(child, depth + 1);
        }
      }

      return;
    }

    for (const child of node.children) {
      visit(child, depth);
    }
  }

  visit(tree.rootNode);
  return chunks;
}
```

Now a 50-method class produces 51 chunks: one for the whole class, and one for each method.

Searches for "UserService authentication" might match the class chunk. Searches for "how to validate JWT tokens" might match the `validateToken` method chunk.

More granular chunks mean more precise retrieval.

---

## Adding Context to Chunks

A chunk of just the function body lacks context. What file is this from? What class contains this method? What imports does it need?

Add metadata:

```typescript
interface EnrichedChunk extends CodeChunk {
  filePath: string;
  parentName: string | null;
  imports: string[];
}

function extractEnrichedChunks(
  sourceCode: string,
  filePath: string
): EnrichedChunk[] {
  const tree = parser.parse(sourceCode);
  const imports = extractImports(tree.rootNode);
  const chunks: EnrichedChunk[] = [];

  function visit(node: Parser.SyntaxNode, parentName: string | null = null) {
    if (CHUNK_NODE_TYPES.has(node.type)) {
      const name = extractName(node);

      chunks.push({
        type: node.type,
        name,
        content: node.text,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        filePath,
        parentName,
        imports,
      });

      // If this is a class, pass its name as parent for methods
      if (node.type === 'class_declaration') {
        for (const child of node.children) {
          visit(child, name);
        }
      }

      return;
    }

    for (const child of node.children) {
      visit(child, parentName);
    }
  }

  visit(tree.rootNode);
  return chunks;
}

function extractImports(rootNode: Parser.SyntaxNode): string[] {
  const imports: string[] = [];

  for (const child of rootNode.children) {
    if (child.type === 'import_statement') {
      imports.push(child.text);
    }
  }

  return imports;
}
```

Now each chunk knows its home address. When the RAG system retrieves a chunk, it has full context: file path, parent class, and required imports.

---

## Watch Out For

Tree-sitter chunking isn't perfect. Here are the gotchas.

**Anonymous Arrow Functions**

```typescript
const handlers = {
  onClick: () => console.log('clicked'),
  onHover: (e) => setHovered(true),
};
```

Tree-sitter sees `lexical_declaration` for `handlers`, but the individual arrow functions inside the object literal don't have names. The whole object is one chunk. That's usually fine, but if you need to search for the `onClick` handler specifically, you won't find it by name.

**One-Liner Components**

```typescript
export const Spinner = () => <div className="spinner" />;
```

This is a valid React component. Tree-sitter sees it as `export_statement` containing a `lexical_declaration`. The name is `Spinner`. The chunk works fine.

But what about:

```typescript
export default () => <div>Anonymous</div>;
```

No name. The chunk type is `export_statement` but `extractName` returns null. Your chunk metadata says "(anonymous)" and searches for "default export component" might struggle.

**Solution:** Add special handling for default exports:

```typescript
function extractName(node: Parser.SyntaxNode): string | null {
  // Check for named identifier first
  const nameNode = node.childForFieldName('name');
  if (nameNode) return nameNode.text;

  // Handle default exports
  if (node.type === 'export_statement') {
    const isDefault = node.children.some(
      c => c.type === 'default'
    );
    if (isDefault) return '[default export]';

    const declaration = node.childForFieldName('declaration');
    if (declaration) return extractName(declaration);
  }

  return null;
}
```

**IIFEs and Closures**

```typescript
const createCounter = (() => {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    get: () => count,
  };
})();
```

This IIFE (Immediately Invoked Function Expression) is a single `lexical_declaration`. The inner functions are hidden inside. If someone searches for "increment counter," they might not find this chunk unless they search for "createCounter."

**Decorators and Class Properties**

```typescript
@Controller('/users')
class UserController {
  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.service.find(id);
  }
}
```

Decorators are parsed as separate nodes. The `@Controller` decorator is associated with the class, but Tree-sitter represents it as a sibling, not a child. Make sure your chunking logic captures decorators with their targets.

**Template Literals with Complex Expressions**

```typescript
const query = `
  SELECT * FROM users
  WHERE ${condition ? 'active = true' : '1=1'}
  ORDER BY ${sortField}
`;
```

Tree-sitter parses the template literal correctly, but the embedded expressions are their own subtrees. If you're chunking SQL queries for search, the dynamic parts might not be what you expect.

---

## Performance Considerations

Tree-sitter is fast, but parsing every file on every query isn't necessary.

**Parse Once, Cache the AST**

```typescript
const astCache = new Map<string, Parser.Tree>();

function getCachedTree(filePath: string, content: string): Parser.Tree {
  const cacheKey = `${filePath}:${hashContent(content)}`;

  if (!astCache.has(cacheKey)) {
    astCache.set(cacheKey, parser.parse(content));
  }

  return astCache.get(cacheKey)!;
}
```

**Incremental Parsing**

Tree-sitter supports incremental parsing. If you have the old tree and the new content, Tree-sitter reuses unchanged nodes:

```typescript
const oldTree = parser.parse(oldContent);
// ... user edits line 47 ...
const newTree = parser.parse(newContent, oldTree);
```

The new parse only re-analyzes the changed portions. For real-time applications like code editors, this is essential.

**Parallel Processing**

Tree-sitter parsers are not thread-safe per instance. But you can create multiple parser instances for parallel processing:

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // Main thread spawns workers for each file
  const workers = files.map(file =>
    new Worker(__filename, { workerData: file })
  );
} else {
  // Worker creates its own parser instance
  const parser = new Parser();
  parser.setLanguage(TypeScript.typescript);

  const chunks = extractChunks(workerData);
  parentPort?.postMessage(chunks);
}
```

---

## Chunk Size Guidelines

How big should chunks be?

Embedding models have context windows. OpenAI's `text-embedding-3-small` handles 8,191 tokens. Anthropic's models handle more. But bigger isn't always better.

**Too Small:** A single-line constant like `const PI = 3.14159` doesn't carry much semantic meaning. It's noise in your vector database.

**Too Big:** A 500-line class embedding loses the granularity of individual methods. Searches become imprecise.

**Sweet Spot:** 20-150 lines per chunk. This captures enough context for meaningful embeddings while staying granular enough for precise retrieval.

Use the `maxChunkLines` parameter to enforce an upper bound, and filter out trivially small chunks:

```typescript
const MIN_CHUNK_LINES = 3;
const MAX_CHUNK_LINES = 150;

const filteredChunks = chunks.filter(chunk => {
  const lines = chunk.endLine - chunk.startLine + 1;
  return lines >= MIN_CHUNK_LINES && lines <= MAX_CHUNK_LINES;
});
```

---

## What's Next

Semantic chunking with Tree-sitter is the foundation. But chunks alone don't make a search system.

Next, you need to:

1. **Generate embeddings** - Send each chunk through an embedding model
2. **Store vectors** - Put the embeddings in a vector database like Qdrant
3. **Index metadata** - Store file paths, names, and types for filtering
4. **Build retrieval** - Query the vectors and return relevant chunks

The chunking layer determines the quality of everything downstream. Get this right, and your code search will find what you're looking for.

Get it wrong, and you're back to searching for "olive" when you meant "olive oil."

---

## Key Takeaways

- Line-based chunking is context-blind and breaks semantic meaning
- Tree-sitter parses code structure, not just text
- Natural boundaries are functions, classes, interfaces, and types
- Handle edge cases: anonymous functions, default exports, decorators
- Cache ASTs and use incremental parsing for performance
- Aim for 20-150 lines per chunk

Tree-sitter is your scalpel. Use it to cut at the joints.
