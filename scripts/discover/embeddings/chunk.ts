/**
 * AST-aware code chunking using Tree-sitter for semantic search.
 *
 * This module parses TypeScript/TSX files and extracts meaningful code chunks
 * (functions, classes, interfaces, types, components) for embedding generation.
 *
 * ## Tree-sitter Quirks & Gotchas
 *
 * 1. **Separate parsers for TS vs TSX**: Tree-sitter TypeScript provides two
 *    distinct grammars - `typescript` and `tsx`. You MUST use the correct one
 *    or JSX nodes won't be recognized. Use file extension to choose.
 *
 * 2. **Arrow functions have no name**: Unlike function declarations, arrow
 *    functions don't have a `name` field. You must traverse UP to the parent
 *    `variable_declarator` to get the assigned variable name.
 *
 * 3. **Export detection requires ancestry traversal**: To determine if something
 *    is exported, you need to check multiple levels of ancestors:
 *    - `export function foo()` - parent is `export_statement`
 *    - `export const foo = () => {}` - grandparent->grandparent is `export_statement`
 *
 * 4. **Line numbers are 0-indexed**: Tree-sitter uses 0-based row numbers.
 *    Add 1 for human-readable line numbers.
 *
 * 5. **TreeCursor vs Node traversal**: TreeCursor is more memory-efficient for
 *    large files but requires manual gotoParent() after child traversal.
 *    Node.children array is simpler but creates more objects.
 *
 * 6. **JSX detection**: To identify React components, check for JSX nodes:
 *    - `jsx_element` - <div>...</div>
 *    - `jsx_self_closing_element` - <Component />
 *    - `jsx_fragment` - <>...</>
 *
 * 7. **Content extraction uses indices**: Use `startIndex`/`endIndex` with
 *    string slicing, NOT `startPosition`/`endPosition` (which are row/column).
 *
 * @module scripts/discover/embeddings/chunk
 */

import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Represents a semantic code chunk extracted from a source file.
 */
export interface CodeChunk {
  id: string;
  filePath: string;
  type: "function" | "class" | "interface" | "type" | "component";
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  exported: boolean;
}

export interface ChunkOptions {
  includePrivate?: boolean;
}

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

function getParserForFile(filePath: string): Parser {
  return filePath.endsWith(".tsx") ? tsxParser : tsParser;
}

function hasJsxReturn(node: Parser.SyntaxNode): boolean {
  const bodyNode = node.childForFieldName("body");
  if (!bodyNode) return false;

  const cursor = bodyNode.walk();
  let foundJsx = false;

  const visitNode = (): void => {
    const current = cursor.currentNode;

    if (
      current.type === "jsx_element" ||
      current.type === "jsx_self_closing_element" ||
      current.type === "jsx_fragment"
    ) {
      foundJsx = true;
      return;
    }

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

function extractNameFromNode(node: Parser.SyntaxNode): string | null {
  const nameNode = node.childForFieldName("name");
  if (nameNode) {
    return nameNode.text;
  }
  return null;
}

function extractArrowFunctionName(node: Parser.SyntaxNode): string | null {
  const parent = node.parent;
  if (!parent) return null;

  if (parent.type === "variable_declarator") {
    const nameNode = parent.childForFieldName("name");
    if (nameNode) {
      return nameNode.text;
    }
  }

  return null;
}

function isExported(node: Parser.SyntaxNode): boolean {
  const parent = node.parent;
  if (!parent) return false;

  if (parent.type === "export_statement") {
    return true;
  }

  if (parent.type === "variable_declarator") {
    const grandparent = parent.parent;
    if (grandparent?.type === "lexical_declaration") {
      const greatGrandparent = grandparent.parent;
      return greatGrandparent?.type === "export_statement";
    }
  }

  if (parent.type === "lexical_declaration") {
    const grandparent = parent.parent;
    return grandparent?.type === "export_statement";
  }

  return false;
}

function getFullDeclarationText(
  node: Parser.SyntaxNode,
  content: string
): { text: string; startLine: number; endLine: number } {
  let targetNode = node;

  const parent = node.parent;
  if (parent?.type === "export_statement") {
    targetNode = parent;
  } else if (node.type === "arrow_function") {
    let current: Parser.SyntaxNode | null = node;
    while (current && current.type !== "export_statement") {
      if (current.parent?.type === "export_statement") {
        targetNode = current.parent;
        break;
      }
      if (current.parent?.type === "lexical_declaration" &&
          current.parent.parent?.type === "export_statement") {
        targetNode = current.parent.parent;
        break;
      }
      current = current.parent;
    }
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
    text: content.slice(targetNode.startIndex, targetNode.endIndex),
    startLine: targetNode.startPosition.row + 1,
    endLine: targetNode.endPosition.row + 1,
  };
}

/**
 * Parse a TypeScript/TSX file and extract semantic code chunks.
 *
 * By default, only exported symbols are extracted. Use `includePrivate: true`
 * to also extract non-exported symbols.
 *
 * React components are detected by checking for JSX in the function body
 * combined with PascalCase naming and .tsx file extension.
 *
 * @param filePath - Path to the file (used for parser selection and chunk IDs)
 * @param content - The file content to parse
 * @param options - Optional chunking options
 * @returns Array of code chunks extracted from the file
 *
 * @example
 * ```ts
 * const content = fs.readFileSync('src/Button.tsx', 'utf-8');
 * const chunks = chunkFile('src/Button.tsx', content);
 * // Returns: [{ id: 'src/Button.tsx:Button', type: 'component', ... }]
 * ```
 */
export function chunkFile(
  filePath: string,
  content: string,
  options: ChunkOptions = {}
): CodeChunk[] {
  const { includePrivate = false } = options;
  const chunks: CodeChunk[] = [];
  const parser = getParserForFile(filePath);
  const tree = parser.parse(content);
  const rootNode = tree.rootNode;

  const cursor = rootNode.walk();

  const processNode = (node: Parser.SyntaxNode): void => {
    let chunkType: CodeChunk["type"] | null = null;
    let name: string | null = null;
    let nodeIsExported = false;

    switch (node.type) {
      case "function_declaration": {
        name = extractNameFromNode(node);
        nodeIsExported = isExported(node);
        if (name && (nodeIsExported || includePrivate)) {
          const isTsx = filePath.endsWith(".tsx");
          const isUpperCase = /^[A-Z]/.test(name);
          if (isTsx && isUpperCase && hasJsxReturn(node)) {
            chunkType = "component";
          } else {
            chunkType = "function";
          }
        }
        break;
      }

      case "arrow_function": {
        name = extractArrowFunctionName(node);
        nodeIsExported = isExported(node);
        if (name && (nodeIsExported || includePrivate)) {
          const isTsx = filePath.endsWith(".tsx");
          const isUpperCase = /^[A-Z]/.test(name);
          if (isTsx && isUpperCase && hasJsxReturn(node)) {
            chunkType = "component";
          } else {
            chunkType = "function";
          }
        }
        break;
      }

      case "class_declaration": {
        name = extractNameFromNode(node);
        nodeIsExported = isExported(node);
        if (name && (nodeIsExported || includePrivate)) {
          chunkType = "class";
        }
        break;
      }

      case "interface_declaration": {
        name = extractNameFromNode(node);
        nodeIsExported = isExported(node);
        if (name && (nodeIsExported || includePrivate)) {
          chunkType = "interface";
        }
        break;
      }

      case "type_alias_declaration": {
        name = extractNameFromNode(node);
        nodeIsExported = isExported(node);
        if (name && (nodeIsExported || includePrivate)) {
          chunkType = "type";
        }
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
        exported: nodeIsExported,
      });
    }
  };

  const visitTree = (): void => {
    processNode(cursor.currentNode);

    if (cursor.gotoFirstChild()) {
      do {
        visitTree();
      } while (cursor.gotoNextSibling());
      cursor.gotoParent();
    }
  };

  visitTree();

  return chunks;
}

export interface DirectoryChunkOptions extends ChunkOptions {
  extensions?: string[];
}

/**
 * Recursively chunk all TypeScript/TSX files in a directory.
 *
 * Skips node_modules, hidden directories, and test files (.test., .spec.).
 *
 * @param dirPath - Absolute path to the directory to scan
 * @param options - Optional directory chunking options
 * @returns Array of code chunks from all matching files
 *
 * @example
 * ```ts
 * const chunks = chunkDirectory('/path/to/src', {
 *   extensions: ['.ts', '.tsx'],
 *   includePrivate: false
 * });
 * ```
 */
export function chunkDirectory(
  dirPath: string,
  options: DirectoryChunkOptions = {}
): CodeChunk[] {
  const { extensions = [".ts", ".tsx"], ...chunkOptions } = options;
  const allChunks: CodeChunk[] = [];

  const walkDir = (currentPath: string): void => {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          if (entry.name.includes(".test.") || entry.name.includes(".spec.")) {
            continue;
          }
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const chunks = chunkFile(fullPath, content, chunkOptions);
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

export function runTests(): void {
  const testCode = `
import { z } from "zod";

export interface UserConfig {
  name: string;
  age: number;
}

export type Status = "active" | "inactive";

export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export const multiply = (a: number, b: number): number => {
  return a * b;
};

const privateHelper = () => {
  return "not exported";
};

export class UserService {
  private users: string[] = [];

  addUser(name: string): void {
    this.users.push(name);
  }
}
`;

  console.log("Testing TypeScript chunking (exported only):\n");
  const tsChunks = chunkFile("test.ts", testCode);

  for (const chunk of tsChunks) {
    console.log(`[${chunk.type}] ${chunk.name} (lines ${chunk.startLine}-${chunk.endLine}) exported=${chunk.exported}`);
    console.log(`  ID: ${chunk.id}`);
    console.log(`  Content preview: ${chunk.content.slice(0, 60).replace(/\n/g, "\\n")}...`);
    console.log();
  }

  console.log("\n\nTesting TypeScript chunking (include private):\n");
  const tsChunksAll = chunkFile("test.ts", testCode, { includePrivate: true });

  for (const chunk of tsChunksAll) {
    console.log(`[${chunk.type}] ${chunk.name} (lines ${chunk.startLine}-${chunk.endLine}) exported=${chunk.exported}`);
    console.log(`  ID: ${chunk.id}`);
    console.log(`  Content preview: ${chunk.content.slice(0, 60).replace(/\n/g, "\\n")}...`);
    console.log();
  }

  const tsxCode = `
import React from "react";

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button = ({ label, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>;
};

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

const PrivateComponent = () => {
  return <span>Private</span>;
};

export const formatName = (first: string, last: string): string => {
  return \`\${first} \${last}\`;
};
`;

  console.log("\n\nTesting TSX component detection:\n");
  const tsxChunks = chunkFile("test.tsx", tsxCode);

  for (const chunk of tsxChunks) {
    console.log(`[${chunk.type}] ${chunk.name} (lines ${chunk.startLine}-${chunk.endLine}) exported=${chunk.exported}`);
    console.log(`  ID: ${chunk.id}`);
    console.log(`  Content preview: ${chunk.content.slice(0, 60).replace(/\n/g, "\\n")}...`);
    console.log();
  }

  console.log("\n\nTesting TSX with includePrivate:\n");
  const tsxChunksAll = chunkFile("test.tsx", tsxCode, { includePrivate: true });

  for (const chunk of tsxChunksAll) {
    console.log(`[${chunk.type}] ${chunk.name} (lines ${chunk.startLine}-${chunk.endLine}) exported=${chunk.exported}`);
    console.log(`  ID: ${chunk.id}`);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runTests();
}
