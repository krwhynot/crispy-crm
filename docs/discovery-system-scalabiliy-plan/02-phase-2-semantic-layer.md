# Phase 2: Semantic Layer

> **Prerequisites:** Phase 1 complete (SCIP index generated, SQLite FTS5 populated)
> **Timeline:** Days 3-4
> **Complexity:** Medium

---

## Goal

Add vector embeddings for natural language code queries using Tree-sitter chunking, Ollama embeddings, and LanceDB storage.

---

## Task 2.1: Install LanceDB

**File:** `package.json`

LanceDB is a file-based, serverless vector database that requires no Docker container or external service. It stores vectors in columnar format using Apache Arrow, enabling fast similarity searches without cold start delays.

```bash
npm install -D lancedb apache-arrow
```

```json
{
  "devDependencies": {
    "lancedb": "^0.15.0",
    "apache-arrow": "^18.0.0"
  }
}
```

**Why this approach:**
- **Zero infrastructure:** No Docker required, unlike Qdrant or Milvus. The database is just files on disk.
- **No cold start:** Embedded databases load instantly. Cloud vector DBs often have 2-5 second warm-up delays.
- **File-based persistence:** Data survives script restarts automatically. Store in `.claude/state/vectors.lance/`.
- **Apache Arrow format:** Columnar storage enables fast batch operations and efficient memory usage.
- **Free forever:** No API costs, no monthly fees, no usage limits.

---

## Task 2.2: Install Tree-sitter

**File:** `package.json`

Tree-sitter is a parser generator that understands code structure. Instead of splitting code at arbitrary line boundaries, Tree-sitter finds semantic boundaries: functions, classes, interfaces, components.

```bash
npm install -D tree-sitter tree-sitter-typescript
```

```json
{
  "devDependencies": {
    "tree-sitter": "^0.22.0",
    "tree-sitter-typescript": "^0.22.0"
  }
}
```

**Why this approach:**
- **AST-aware chunking:** Tree-sitter builds an Abstract Syntax Tree, so it knows exactly where a function starts and ends. No more cutting a function in half.
- **React component detection:** For `.tsx` files, Tree-sitter identifies JSX elements, enabling accurate component classification.
- **Fast parsing:** Originally built for code editors, Tree-sitter parses a 50,000-line file in milliseconds.
- **Language-specific grammars:** Separate parsers for TypeScript (`.ts`) and TSX (`.tsx`) handle language-specific syntax correctly.
- **Incremental parsing:** When files change, Tree-sitter can reparse only the modified portions.

---

## Task 2.3: Create Code Chunker

**File:** `scripts/semantic/chunker.ts`

The chunker walks through TypeScript/TSX files and extracts semantic units. Each chunk becomes a separate embedding, enabling precise search results that point to specific functions rather than vague file matches.

```typescript
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Represents a semantic code chunk extracted from a source file.
 * Each chunk corresponds to one embedding vector in LanceDB.
 */
export interface CodeChunk {
  /** Unique identifier: filePath:symbolName */
  id: string;
  /** Relative path from project root */
  filePath: string;
  /** Semantic type of the chunk */
  type: "function" | "class" | "interface" | "type" | "component";
  /** Symbol name (function name, class name, etc.) */
  name: string;
  /** Full source code of the chunk */
  content: string;
  /** 1-indexed start line */
  startLine: number;
  /** 1-indexed end line */
  endLine: number;
}

// Initialize separate parsers for TS and TSX
// GOTCHA: Tree-sitter requires different grammars for JSX support
const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

/**
 * Select the correct parser based on file extension.
 * Using the wrong parser causes JSX nodes to be misidentified.
 */
function getParserForFile(filePath: string): Parser {
  return filePath.endsWith(".tsx") ? tsxParser : tsParser;
}

/**
 * Node types that represent complete, chunkable semantic units.
 * These map to Tree-sitter's AST node types for TypeScript.
 */
const CHUNK_NODE_TYPES = new Set([
  "function_declaration",
  "class_declaration",
  "interface_declaration",
  "type_alias_declaration",
  "arrow_function", // Handled specially to get variable name
  "method_definition",
]);

/**
 * Check if a function body contains JSX elements.
 * Used to distinguish React components from regular functions.
 */
function hasJsxReturn(node: Parser.SyntaxNode): boolean {
  const bodyNode = node.childForFieldName("body");
  if (!bodyNode) return false;

  const cursor = bodyNode.walk();
  let foundJsx = false;

  const visitNode = (): void => {
    const current = cursor.currentNode;

    // Check for any JSX node type
    if (
      current.type === "jsx_element" ||
      current.type === "jsx_self_closing_element" ||
      current.type === "jsx_fragment"
    ) {
      foundJsx = true;
      return;
    }

    // Recurse into children
    if (cursor.gotoFirstChild()) {
      do {
        if (foundJsx) return;
        visitNode();
      } while (cursor.gotoNextSibling());
      cursor.gotoParent();
    }
  };

  visitNode();
  return foundJsx;
}

/**
 * Extract the name from a node using Tree-sitter's field access.
 */
function extractNameFromNode(node: Parser.SyntaxNode): string | null {
  const nameNode = node.childForFieldName("name");
  return nameNode ? nameNode.text : null;
}

/**
 * Arrow functions don't have a name field.
 * We must traverse UP to find the variable_declarator parent.
 *
 * Example: `const Button = () => <div/>`
 * The arrow_function has no name, but its parent is variable_declarator
 * which has `Button` as its name.
 */
function extractArrowFunctionName(node: Parser.SyntaxNode): string | null {
  const parent = node.parent;
  if (!parent) return null;

  if (parent.type === "variable_declarator") {
    const nameNode = parent.childForFieldName("name");
    return nameNode ? nameNode.text : null;
  }

  return null;
}

/**
 * Get the full text of a declaration including any export statement.
 *
 * GOTCHA: For `export const Foo = () => {}`, the arrow_function node
 * only contains `() => {}`. We need to traverse up to get the full
 * `export const Foo = () => {}` text.
 */
function getFullDeclarationText(
  node: Parser.SyntaxNode,
  content: string
): { text: string; startLine: number; endLine: number } {
  let targetNode = node;

  // Check if direct parent is export_statement
  const parent = node.parent;
  if (parent?.type === "export_statement") {
    targetNode = parent;
  } else if (node.type === "arrow_function") {
    // Traverse up through: arrow_function -> variable_declarator
    //                    -> lexical_declaration -> export_statement
    let current: Parser.SyntaxNode | null = node;
    while (current) {
      if (current.parent?.type === "export_statement") {
        targetNode = current.parent;
        break;
      }
      if (
        current.parent?.type === "lexical_declaration" &&
        current.parent.parent?.type === "export_statement"
      ) {
        targetNode = current.parent.parent;
        break;
      }
      current = current.parent;
    }

    // If no export found, get the lexical_declaration for const/let
    if (targetNode === node) {
      current = node;
      while (current && current.type !== "lexical_declaration") {
        current = current.parent;
      }
      if (current) {
        targetNode = current;
      }
    }
  }

  return {
    // GOTCHA: Use startIndex/endIndex for string slicing,
    // NOT startPosition/endPosition (which are row/column)
    text: content.slice(targetNode.startIndex, targetNode.endIndex),
    // GOTCHA: Tree-sitter uses 0-indexed rows, add 1 for human-readable
    startLine: targetNode.startPosition.row + 1,
    endLine: targetNode.endPosition.row + 1,
  };
}

/**
 * Parse a TypeScript/TSX file and extract semantic code chunks.
 *
 * @param filePath - Relative path from project root
 * @param content - File contents
 * @returns Array of semantic chunks ready for embedding
 *
 * @example
 * const content = fs.readFileSync('src/Button.tsx', 'utf-8');
 * const chunks = chunkFile('src/Button.tsx', content);
 * // Returns: [{ id: 'src/Button.tsx:Button', type: 'component', ... }]
 */
export function chunkFile(filePath: string, content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const parser = getParserForFile(filePath);
  const tree = parser.parse(content);
  const cursor = tree.rootNode.walk();

  const processNode = (node: Parser.SyntaxNode): void => {
    let chunkType: CodeChunk["type"] | null = null;
    let name: string | null = null;

    switch (node.type) {
      case "function_declaration": {
        name = extractNameFromNode(node);
        if (name) {
          const isTsx = filePath.endsWith(".tsx");
          const isPascalCase = /^[A-Z]/.test(name);
          // React components: PascalCase + TSX file + returns JSX
          if (isTsx && isPascalCase && hasJsxReturn(node)) {
            chunkType = "component";
          } else {
            chunkType = "function";
          }
        }
        break;
      }

      case "arrow_function": {
        name = extractArrowFunctionName(node);
        if (name) {
          const isTsx = filePath.endsWith(".tsx");
          const isPascalCase = /^[A-Z]/.test(name);
          if (isTsx && isPascalCase && hasJsxReturn(node)) {
            chunkType = "component";
          } else {
            chunkType = "function";
          }
        }
        break;
      }

      case "class_declaration": {
        name = extractNameFromNode(node);
        if (name) chunkType = "class";
        break;
      }

      case "interface_declaration": {
        name = extractNameFromNode(node);
        if (name) chunkType = "interface";
        break;
      }

      case "type_alias_declaration": {
        name = extractNameFromNode(node);
        if (name) chunkType = "type";
        break;
      }
    }

    if (chunkType && name) {
      const { text, startLine, endLine } = getFullDeclarationText(node, content);
      chunks.push({
        id: `${filePath}:${name}`,
        filePath,
        type: chunkType,
        name,
        content: text,
        startLine,
        endLine,
      });
    }
  };

  // Tree traversal using cursor (memory-efficient for large files)
  const visitTree = (): void => {
    processNode(cursor.currentNode);

    if (cursor.gotoFirstChild()) {
      do {
        visitTree();
      } while (cursor.gotoNextSibling());
      cursor.gotoParent(); // GOTCHA: Must return to parent after visiting children
    }
  };

  visitTree();
  return chunks;
}

/**
 * Recursively chunk all TypeScript/TSX files in a directory.
 * Skips node_modules, hidden directories, and test files.
 */
export function chunkDirectory(
  dirPath: string,
  extensions: string[] = [".ts", ".tsx"]
): CodeChunk[] {
  const allChunks: CodeChunk[] = [];

  const walkDir = (currentPath: string): void => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          // Skip test files
          if (entry.name.includes(".test.") || entry.name.includes(".spec.")) {
            continue;
          }
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const relativePath = path.relative(process.cwd(), fullPath);
            const chunks = chunkFile(relativePath, content);
            allChunks.push(...chunks);
          } catch (error) {
            console.error(`Error processing ${fullPath}:`, error);
          }
        }
      }
    }
  };

  walkDir(dirPath);
  return allChunks;
}
```

**Why this approach:**
- **Semantic boundaries:** Each chunk is a complete function, class, or type. No arbitrary line splits.
- **React detection:** Combines PascalCase naming + `.tsx` extension + JSX return to identify components.
- **Full export capture:** Traverses upward to include `export` keyword in chunk content.
- **Memory-efficient traversal:** Uses Tree-sitter's cursor API instead of creating node arrays.
- **Unique IDs:** Format `filePath:symbolName` enables deduplication and lookup.

---

## Task 2.4: Configure Ollama Embeddings

**File:** `scripts/semantic/embed.ts`

Ollama runs AI models locally with zero API costs. The `nomic-embed-text` model produces 768-dimensional vectors optimized for code similarity.

```typescript
/**
 * Ollama Embedding Client
 *
 * Generates 768-dimensional embeddings using nomic-embed-text model.
 * Uses native fetch (Node 18+) for HTTP requests.
 *
 * API GOTCHAS:
 * 1. Ollama uses "prompt" not "input" (unlike OpenAI)
 * 2. Response is { embedding: number[] } not { embeddings: number[][] }
 * 3. No batch endpoint - must call sequentially
 * 4. Model must be pulled first: `ollama pull nomic-embed-text`
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = "nomic-embed-text";
const EXPECTED_DIMENSIONS = 768;

interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Custom error class for Ollama-specific failures.
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

/**
 * Generate embedding for a single text chunk.
 *
 * @param text - Code or natural language to embed
 * @param model - Ollama model name (default: nomic-embed-text)
 * @returns 768-dimensional vector
 * @throws OllamaError if request fails
 *
 * @example
 * const vec = await generateEmbedding("function add(a, b) { return a + b; }");
 * console.log(vec.length); // 768
 */
export async function generateEmbedding(
  text: string,
  model: string = DEFAULT_MODEL
): Promise<number[]> {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;

  const requestBody: OllamaEmbeddingRequest = {
    model,
    prompt: text,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new OllamaError(
      `Failed to connect to Ollama at ${OLLAMA_BASE_URL}. ` +
        `Is Ollama running? Start with: ollama serve`,
      undefined,
      cause
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");

    if (response.status === 404) {
      throw new OllamaError(
        `Model "${model}" not found. Pull it with: ollama pull ${model}`,
        response.status
      );
    }

    throw new OllamaError(
      `Ollama API error (${response.status}): ${errorText}`,
      response.status
    );
  }

  let data: OllamaEmbeddingResponse;
  try {
    data = await response.json() as OllamaEmbeddingResponse;
  } catch (error) {
    throw new OllamaError(
      "Failed to parse Ollama response as JSON",
      response.status,
      error instanceof Error ? error : undefined
    );
  }

  if (!Array.isArray(data.embedding)) {
    throw new OllamaError(
      `Invalid response: expected embedding array, got ${typeof data.embedding}`
    );
  }

  if (data.embedding.length !== EXPECTED_DIMENSIONS) {
    throw new OllamaError(
      `Unexpected dimensions: expected ${EXPECTED_DIMENSIONS}, got ${data.embedding.length}`
    );
  }

  return data.embedding;
}

/**
 * Generate embeddings for multiple texts with progress reporting.
 *
 * Note: Ollama has no batch API, so this processes sequentially.
 * For large batches, this provides progress callbacks.
 *
 * @param texts - Array of texts to embed
 * @param onProgress - Optional callback for progress updates
 * @returns Array of 768-dimensional vectors (same order as input)
 */
export async function generateBatchEmbeddings(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
    onProgress?.(i + 1, texts.length);
  }

  return embeddings;
}

/**
 * Health check - verify Ollama is running with required model.
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return false;

    const data = await response.json() as { models: Array<{ name: string }> };
    const models = data.models || [];

    return models.some(
      (m) => m.name === DEFAULT_MODEL || m.name.startsWith(`${DEFAULT_MODEL}:`)
    );
  } catch {
    return false;
  }
}

/**
 * Warm up the embedding model to avoid first-query latency.
 * Ollama loads models into memory on first use (5-10 second delay).
 */
export async function warmupModel(): Promise<void> {
  await generateEmbedding("warmup");
}
```

**Why this approach:**
- **Local inference:** No API costs, no rate limits, no privacy concerns. Code never leaves your machine.
- **nomic-embed-text:** 768-dimensional embeddings trained on diverse text including code. Good balance of quality vs. speed.
- **Fail-fast errors:** Descriptive error messages tell you exactly what went wrong and how to fix it.
- **Progress callbacks:** For large codebases, provides feedback during sequential embedding generation.
- **Model warmup:** First query is slow (model loading). Warm up proactively to avoid user-facing delays.

---

## Task 2.5: Create LanceDB Schema

**File:** `scripts/semantic/schema.ts`

LanceDB stores vectors alongside metadata in a table format. The schema defines what data is stored and enables filtering during search.

```typescript
import * as lancedb from "lancedb";
import * as arrow from "apache-arrow";
import type { CodeChunk } from "./chunker";
import * as path from "node:path";

const DB_PATH = path.join(process.cwd(), ".claude/state/vectors.lance");
const TABLE_NAME = "code_chunks";
const VECTOR_DIMENSION = 768;

let db: lancedb.Connection | null = null;

/**
 * Code chunk record as stored in LanceDB.
 * Extends CodeChunk with the embedding vector.
 */
export interface CodeChunkRecord {
  id: string;
  filePath: string;
  type: string;
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  vector: number[];
}

/**
 * Search result with similarity score.
 */
export interface SearchResult {
  id: string;
  filePath: string;
  type: string;
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  score: number;
}

/**
 * Get or create the LanceDB connection.
 * LanceDB is file-based, so "connecting" just opens the directory.
 */
export async function getDatabase(): Promise<lancedb.Connection> {
  if (db === null) {
    db = await lancedb.connect(DB_PATH);
  }
  return db;
}

/**
 * Create or recreate the code_chunks table.
 *
 * LanceDB tables are schema-on-write: the first batch of data
 * defines the schema. We pass an empty array with type hints
 * to establish the schema before inserting data.
 *
 * @param fresh - If true, drops existing table first
 */
export async function ensureTable(fresh: boolean = false): Promise<lancedb.Table> {
  const database = await getDatabase();
  const tableNames = await database.tableNames();

  if (fresh && tableNames.includes(TABLE_NAME)) {
    await database.dropTable(TABLE_NAME);
  }

  if (!tableNames.includes(TABLE_NAME) || fresh) {
    // Create table with schema-defining record
    // LanceDB infers schema from first inserted data
    const table = await database.createTable(TABLE_NAME, [
      {
        id: "schema-placeholder",
        filePath: "",
        type: "",
        name: "",
        content: "",
        startLine: 0,
        endLine: 0,
        vector: new Array(VECTOR_DIMENSION).fill(0),
      },
    ]);

    // Delete the placeholder record
    await table.delete('id = "schema-placeholder"');
    return table;
  }

  return database.openTable(TABLE_NAME);
}

/**
 * Get an existing table (throws if not exists).
 */
export async function getTable(): Promise<lancedb.Table> {
  const database = await getDatabase();
  return database.openTable(TABLE_NAME);
}

/**
 * Insert code chunk records into LanceDB.
 *
 * @param chunks - Code chunks with their embeddings
 */
export async function insertChunks(records: CodeChunkRecord[]): Promise<void> {
  if (records.length === 0) return;

  const table = await getTable();
  await table.add(records);
}

/**
 * Search for similar code chunks.
 *
 * @param queryVector - 768-dimensional query embedding
 * @param limit - Maximum results to return
 * @returns Ranked search results with similarity scores
 */
export async function searchChunks(
  queryVector: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  const table = await getTable();

  // LanceDB uses L2 distance by default, lower is more similar
  // Convert to similarity score where higher is better
  const results = await table
    .search(queryVector)
    .limit(limit)
    .toArray();

  return results.map((row) => ({
    id: row.id as string,
    filePath: row.filePath as string,
    type: row.type as string,
    name: row.name as string,
    content: row.content as string,
    startLine: row.startLine as number,
    endLine: row.endLine as number,
    // LanceDB returns _distance (L2), convert to similarity
    // Cosine similarity approximation: 1 / (1 + distance)
    score: 1 / (1 + (row._distance as number)),
  }));
}

/**
 * Get table statistics.
 */
export async function getTableStats(): Promise<{
  rowCount: number;
  exists: boolean;
}> {
  try {
    const database = await getDatabase();
    const tableNames = await database.tableNames();

    if (!tableNames.includes(TABLE_NAME)) {
      return { rowCount: 0, exists: false };
    }

    const table = await database.openTable(TABLE_NAME);
    const count = await table.countRows();

    return { rowCount: count, exists: true };
  } catch {
    return { rowCount: 0, exists: false };
  }
}

/**
 * Filter search by chunk type.
 *
 * @example
 * const components = await searchByType(queryVec, "component", 5);
 */
export async function searchByType(
  queryVector: number[],
  type: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const table = await getTable();

  const results = await table
    .search(queryVector)
    .where(`type = '${type}'`)
    .limit(limit)
    .toArray();

  return results.map((row) => ({
    id: row.id as string,
    filePath: row.filePath as string,
    type: row.type as string,
    name: row.name as string,
    content: row.content as string,
    startLine: row.startLine as number,
    endLine: row.endLine as number,
    score: 1 / (1 + (row._distance as number)),
  }));
}
```

**Why this approach:**
- **Schema-on-write:** LanceDB infers schema from first insert. We create a placeholder to define types.
- **Metadata storage:** File path, type, name, and line numbers stored alongside vectors for result display.
- **L2 to similarity conversion:** LanceDB uses L2 distance. We convert to similarity score (higher = more similar).
- **SQL-like filtering:** `where()` clause enables filtering by type before vector search.
- **Row count API:** `countRows()` enables quick stats without loading full table.

---

## Task 2.6: Build Vector Index

**File:** `scripts/semantic/index.ts`

The main orchestrator that coordinates chunking, embedding, and storage. Processes the codebase with progress reporting and handles errors gracefully.

```typescript
#!/usr/bin/env npx tsx

/**
 * Semantic Code Index Builder
 *
 * Orchestrates the full indexing pipeline:
 * 1. Find all TypeScript/TSX source files
 * 2. Chunk files into semantic units
 * 3. Generate embeddings via Ollama
 * 4. Store vectors in LanceDB
 *
 * Usage:
 *   npx tsx scripts/semantic/index.ts          # Fresh index
 *   npx tsx scripts/semantic/index.ts --check  # Verify health only
 */

import * as fg from "fast-glob";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { chunkFile, type CodeChunk } from "./chunker";
import { generateEmbedding, checkOllamaHealth, warmupModel } from "./embed";
import {
  ensureTable,
  insertChunks,
  getTableStats,
  type CodeChunkRecord
} from "./schema";

const SOURCE_PATTERNS = ["src/**/*.ts", "src/**/*.tsx"];
const IGNORE_PATTERNS = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/*.d.ts",
  "**/node_modules/**",
  "**/__tests__/**",
  "**/__mocks__/**",
];

const BATCH_SIZE = 50; // Insert to LanceDB in batches

interface IndexingStats {
  filesProcessed: number;
  chunksGenerated: number;
  embeddingsCreated: number;
  errors: number;
  startTime: number;
}

/**
 * Verify Ollama is running and model is available.
 */
async function verifyServices(): Promise<boolean> {
  console.log("Verifying services...\n");

  const ollamaOk = await checkOllamaHealth();
  if (!ollamaOk) {
    console.error("Ollama not available.");
    console.error("Start Ollama:      ollama serve");
    console.error("Pull model:        ollama pull nomic-embed-text");
    return false;
  }
  console.log("   Ollama ready");

  // Warm up model to avoid first-query latency
  console.log("   Warming up embedding model...");
  await warmupModel();
  console.log("   Model ready\n");

  return true;
}

/**
 * Index the entire codebase.
 *
 * @param rootDir - Project root directory
 * @param fresh - If true, clear existing index first
 */
async function indexCodebase(
  rootDir: string,
  fresh: boolean = true
): Promise<void> {
  const stats: IndexingStats = {
    filesProcessed: 0,
    chunksGenerated: 0,
    embeddingsCreated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  // Verify services
  const servicesOk = await verifyServices();
  if (!servicesOk) {
    process.exit(1);
  }

  // Setup LanceDB table
  console.log(fresh ? "Creating fresh index..." : "Opening existing index...");
  await ensureTable(fresh);

  // Find source files
  console.log("Scanning for source files...");
  const files = await fg.glob(SOURCE_PATTERNS, {
    cwd: rootDir,
    absolute: true,
    ignore: IGNORE_PATTERNS,
  });
  console.log(`   Found ${files.length} source files\n`);

  // Process files
  const pendingRecords: CodeChunkRecord[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const chunks = chunkFile(relativePath, content);
      stats.filesProcessed++;

      for (const chunk of chunks) {
        // Skip trivially small chunks
        if (chunk.content.trim().length < 20) {
          continue;
        }

        stats.chunksGenerated++;

        try {
          // Generate embedding
          const vector = await generateEmbedding(chunk.content);
          stats.embeddingsCreated++;

          // Prepare record
          pendingRecords.push({
            ...chunk,
            vector,
          });

          // Batch insert to LanceDB
          if (pendingRecords.length >= BATCH_SIZE) {
            await insertChunks(pendingRecords);
            console.log(
              `Indexed ${stats.embeddingsCreated} chunks ` +
              `(${stats.filesProcessed}/${files.length} files)`
            );
            pendingRecords.length = 0;
          }
        } catch (error) {
          stats.errors++;
          console.error(`   Error embedding ${chunk.id}:`, error);
        }
      }
    } catch (error) {
      stats.errors++;
      console.error(`   Error processing ${relativePath}:`, error);
    }
  }

  // Flush remaining records
  if (pendingRecords.length > 0) {
    await insertChunks(pendingRecords);
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const tableStats = await getTableStats();

  console.log("\n" + "-".repeat(50));
  console.log("Indexing Complete\n");
  console.log(`   Files processed:    ${stats.filesProcessed}`);
  console.log(`   Chunks generated:   ${stats.chunksGenerated}`);
  console.log(`   Embeddings created: ${stats.embeddingsCreated}`);
  console.log(`   Errors:             ${stats.errors}`);
  console.log(`   Duration:           ${duration}s`);
  console.log(`   Vectors in LanceDB: ${tableStats.rowCount}`);
  console.log("\n   Next: npx tsx scripts/semantic/search.ts \"your query\"");
}

/**
 * Check index health without rebuilding.
 */
async function checkHealth(): Promise<void> {
  console.log("Checking semantic index health...\n");

  // Check Ollama
  const ollamaOk = await checkOllamaHealth();
  console.log(`   Ollama:   ${ollamaOk ? "Ready" : "Not available"}`);

  // Check LanceDB
  const tableStats = await getTableStats();
  console.log(`   LanceDB:  ${tableStats.exists ? "Ready" : "No index found"}`);
  console.log(`   Vectors:  ${tableStats.rowCount}`);

  if (!ollamaOk) {
    console.log("\n   To start Ollama:");
    console.log("   ollama serve");
    console.log("   ollama pull nomic-embed-text");
  }

  if (!tableStats.exists || tableStats.rowCount === 0) {
    console.log("\n   To build index:");
    console.log("   npx tsx scripts/semantic/index.ts");
  }
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Semantic Code Indexer");
  console.log("");
  console.log("Usage:");
  console.log("  npx tsx scripts/semantic/index.ts           Build fresh index");
  console.log("  npx tsx scripts/semantic/index.ts --check   Check health only");
  console.log("  npx tsx scripts/semantic/index.ts --help    Show this help");
  process.exit(0);
}

if (args.includes("--check")) {
  checkHealth().catch((error) => {
    console.error("Health check failed:", error);
    process.exit(1);
  });
} else {
  const fresh = !args.includes("--incremental");
  indexCodebase(process.cwd(), fresh).catch((error) => {
    console.error("Indexing failed:", error);
    process.exit(1);
  });
}
```

**Why this approach:**
- **Batch processing:** Inserts to LanceDB in batches of 50 for efficiency.
- **Progress reporting:** Console output shows files processed and chunks indexed.
- **Model warmup:** Pre-loads embedding model to avoid latency on first chunk.
- **Error tolerance:** Continues indexing even if individual chunks fail.
- **Health check mode:** `--check` flag verifies setup without rebuilding.
- **Trivial chunk filtering:** Skips chunks under 20 characters (empty functions, etc.).

---

## Task 2.7: Add Semantic Search CLI

**File:** `scripts/semantic/search.ts`

The search interface enables natural language queries against the code index. Results are ranked by semantic similarity.

```typescript
#!/usr/bin/env npx tsx

/**
 * Semantic Code Search CLI
 *
 * Search for code by meaning rather than exact keywords.
 *
 * Usage:
 *   npx tsx scripts/semantic/search.ts "form validation"
 *   npx tsx scripts/semantic/search.ts "hooks for data fetching" --limit 20
 *   npx tsx scripts/semantic/search.ts "React components" --type component
 *
 * Examples:
 *   "form validation"        -> Find form validation logic
 *   "authentication hooks"   -> Find auth-related hooks
 *   "Zod schema"             -> Find Zod validation schemas
 *   "data provider"          -> Find data fetching patterns
 */

import { generateEmbedding, checkOllamaHealth } from "./embed";
import { searchChunks, searchByType, getTableStats, type SearchResult } from "./schema";

interface SearchOptions {
  query: string;
  limit: number;
  type: string | null;
  showContent: boolean;
}

function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Semantic Code Search\n");
    console.log("Usage: npx tsx scripts/semantic/search.ts <query> [options]\n");
    console.log("Options:");
    console.log("  --limit <n>          Maximum results (default: 10)");
    console.log("  --type <type>        Filter by type: function, class, interface, type, component");
    console.log("  --content            Show full content instead of preview");
    console.log("  --help               Show this help\n");
    console.log("Examples:");
    console.log('  npx tsx search.ts "form validation"');
    console.log('  npx tsx search.ts "hooks for authentication" --limit 5');
    console.log('  npx tsx search.ts "React components" --type component');
    process.exit(0);
  }

  let query = "";
  let limit = 10;
  let type: string | null = null;
  let showContent = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--type" && args[i + 1]) {
      type = args[i + 1];
      i++;
    } else if (arg === "--content") {
      showContent = true;
    } else if (!arg.startsWith("-")) {
      query = arg;
    }
  }

  if (!query) {
    console.error("Error: No query provided");
    process.exit(1);
  }

  return { query, limit, type, showContent };
}

function formatResult(result: SearchResult, index: number, showContent: boolean): string {
  const similarity = (result.score * 100).toFixed(1);
  const location = `${result.filePath}:${result.startLine}-${result.endLine}`;

  let output = `\n${index + 1}. [${similarity}%] ${result.type}: ${result.name}`;
  output += `\n   ${location}`;

  if (showContent) {
    output += `\n\n${result.content}\n`;
  } else {
    // Show preview (first 120 chars, normalized whitespace)
    const preview = result.content
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    output += `\n   ${preview}...`;
  }

  return output;
}

async function runSearch(options: SearchOptions): Promise<void> {
  // Verify Ollama
  const ollamaOk = await checkOllamaHealth();
  if (!ollamaOk) {
    console.error("Ollama not available. Start with: ollama serve");
    process.exit(1);
  }

  // Check index exists
  const stats = await getTableStats();
  if (!stats.exists || stats.rowCount === 0) {
    console.error("No code indexed. Run: npx tsx scripts/semantic/index.ts");
    process.exit(1);
  }

  // Generate query embedding
  console.log(`\nSearching for: "${options.query}"\n`);
  const queryVector = await generateEmbedding(options.query);

  // Search
  let results: SearchResult[];
  if (options.type) {
    results = await searchByType(queryVector, options.type, options.limit);
  } else {
    results = await searchChunks(queryVector, options.limit);
  }

  if (results.length === 0) {
    console.log("No results found.\n");
    return;
  }

  // Display results
  console.log(`Found ${results.length} results:`);
  console.log("-".repeat(60));

  for (let i = 0; i < results.length; i++) {
    console.log(formatResult(results[i], i, options.showContent));
  }

  console.log("\n" + "-".repeat(60));
  console.log("\nTips:");
  console.log("  --limit <n>     Show more results");
  console.log("  --type <type>   Filter by: function, class, interface, type, component");
  console.log("  --content       Show full code instead of preview\n");
}

// Main
const options = parseArgs();
runSearch(options).catch((error) => {
  console.error("Search failed:", error);
  process.exit(1);
});
```

**Why this approach:**
- **Natural language queries:** Ask "form validation" instead of exact function names.
- **Type filtering:** `--type component` limits results to React components only.
- **Similarity scores:** Results show percentage match (higher = more relevant).
- **Preview mode:** Default shows first 120 chars; `--content` shows full code.
- **File location:** Every result includes `filePath:startLine-endLine` for navigation.
- **Helpful tips:** CLI shows available options after each search.

---

## Key Deliverable

**Output:** `.claude/state/vectors.lance/` directory containing the LanceDB vector store.

This dataset enables queries like:
- "hooks that handle form validation"
- "components for displaying lists"
- "Zod schemas for user data"
- "authentication and authorization logic"

---

## Success Criteria

- [ ] `npx tsx scripts/semantic/index.ts` processes codebase in < 60 seconds
- [ ] Semantic search returns relevant results for natural language queries
- [ ] `--type` filtering correctly restricts results to specified chunk types
- [ ] Incremental updates only re-embed changed files
- [ ] LanceDB persists across script restarts (file-based storage verified)

---

## justfile Commands

Add these commands to your `justfile` for convenient access:

```just
# Build semantic vector index
embed-code:
    npx tsx scripts/semantic/index.ts

# Semantic search CLI
semantic-search query:
    npx tsx scripts/semantic/search.ts "{{query}}"

# Check semantic index health
semantic-health:
    npx tsx scripts/semantic/index.ts --check
```

---

## Verification Checklist

Before calling Phase 2 complete:

- [ ] `npm install -D lancedb apache-arrow tree-sitter tree-sitter-typescript` succeeds
- [ ] `ollama serve` is running and `ollama pull nomic-embed-text` complete
- [ ] `just embed-code` completes without errors
- [ ] `.claude/state/vectors.lance/` directory exists with data files
- [ ] `just semantic-search "form validation"` returns relevant results
- [ ] `just semantic-search "React components" --type component` filters correctly
- [ ] Similarity scores correlate with result relevance (higher = better matches)

---

## Common Issues

**"Cannot find module 'lancedb'"**
Run `npm install -D lancedb apache-arrow`. The Apache Arrow dependency is required.

**"Model not found" from Ollama**
Run `ollama pull nomic-embed-text` to download the embedding model.

**"Connection refused" to Ollama**
Start Ollama with `ollama serve`. It runs on port 11434 by default.

**Results seem random or low quality**
Verify embedding model is correct: results should be from `nomic-embed-text`, not another model. Check with `ollama list`.

**Index takes too long**
Each chunk requires one Ollama API call (~10-20ms each). For 1000 chunks, expect 20-40 seconds. Consider parallelization for larger codebases.

---

## References

- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [Tree-sitter TypeScript Grammar](https://github.com/tree-sitter/tree-sitter-typescript)
- [Ollama Embedding API](https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings)
- [nomic-embed-text Model Card](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)
