/**
 * SCIP Query Utilities for the Discovery System
 *
 * GOTCHAS (document these in the blog):
 * 1. The @sourcegraph/scip npm package does NOT exist - use the bindings
 *    from @sourcegraph/scip-typescript instead (dist/src/scip.js)
 * 2. SCIP index files are protobuf binary format - use Index.deserializeBinary()
 * 3. Symbol names follow this format:
 *    scip-typescript npm <package> <version> <path>/SymbolName
 *    Example: scip-typescript npm atomic-crm 0.1.0 src/hooks/`use-mobile.ts`/useIsMobile().
 * 4. symbol_roles is a bitmask - use bitwise AND to check for Definition (1)
 * 5. The range array format is [startLine, startCol, endCol] for single-line
 *    or [startLine, startCol, endLine, endCol] for multi-line
 */

import * as fs from "fs";
import { scip } from "@sourcegraph/scip-typescript/dist/src/scip.js";

// Re-export types from scip module for convenience
export type Index = InstanceType<typeof scip.Index>;
export type Document = InstanceType<typeof scip.Document>;
export type Occurrence = InstanceType<typeof scip.Occurrence>;
export type SymbolInformation = InstanceType<typeof scip.SymbolInformation>;

// Export enums for use in queries
export const SymbolRole = scip.SymbolRole;

/**
 * Location information for an occurrence
 */
export interface OccurrenceLocation {
  occurrence: Occurrence;
  document: Document;
  relativePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/**
 * Load SCIP index from a binary file.
 *
 * @param indexPath - Path to the .scip index file
 * @returns Parsed Index object
 * @throws Error if file cannot be read or parsed
 */
export async function loadIndex(indexPath: string): Promise<Index> {
  const buffer = await fs.promises.readFile(indexPath);
  return scip.Index.deserializeBinary(buffer);
}

/**
 * Synchronous version of loadIndex for simpler use cases.
 */
export function loadIndexSync(indexPath: string): Index {
  const buffer = fs.readFileSync(indexPath);
  return scip.Index.deserializeBinary(buffer);
}

/**
 * Find all symbols matching a regex pattern across the index.
 *
 * Symbol names in scip-typescript follow this format:
 *   scip-typescript npm <package> <version> <path>/SymbolName
 *
 * Examples:
 *   - /use[A-Z]/ matches hooks like useIsMobile, useSidebar
 *   - /Create\.tsx/ matches symbols from Create form files
 *   - /validation/ matches symbols from validation files
 *
 * @param index - Loaded SCIP Index
 * @param pattern - Regular expression to match against symbol names
 * @returns Array of matching SymbolInformation objects with their document path
 */
export function findSymbolsByPattern(
  index: Index,
  pattern: RegExp
): Array<{ symbol: SymbolInformation; documentPath: string }> {
  const results: Array<{ symbol: SymbolInformation; documentPath: string }> = [];

  for (const document of index.documents) {
    for (const symbol of document.symbols) {
      if (pattern.test(symbol.symbol)) {
        results.push({
          symbol,
          documentPath: document.relative_path,
        });
      }
    }
  }

  // Also check external_symbols (symbols from dependencies)
  for (const symbol of index.external_symbols) {
    if (pattern.test(symbol.symbol)) {
      results.push({
        symbol,
        documentPath: "(external)",
      });
    }
  }

  return results;
}

/**
 * Get all references (occurrences) to a symbol across the codebase.
 *
 * This includes both definitions and usages. Use the symbol_roles
 * bitmask to distinguish:
 *   - Definition: symbol_roles & 1
 *   - Import: symbol_roles & 2
 *   - WriteAccess: symbol_roles & 4
 *   - ReadAccess: symbol_roles & 8
 *
 * @param index - Loaded SCIP Index
 * @param symbol - The symbol string to search for (exact match)
 * @returns Array of occurrences with their location information
 */
export function getReferences(
  index: Index,
  symbol: string
): OccurrenceLocation[] {
  const results: OccurrenceLocation[] = [];

  for (const document of index.documents) {
    for (const occurrence of document.occurrences) {
      if (occurrence.symbol === symbol) {
        const range = occurrence.range;
        // Range format: [startLine, startCol, endCol] for single-line
        // or [startLine, startCol, endLine, endCol] for multi-line
        const isSingleLine = range.length === 3;

        results.push({
          occurrence,
          document,
          relativePath: document.relative_path,
          startLine: range[0],
          startColumn: range[1],
          endLine: isSingleLine ? range[0] : range[2],
          endColumn: isSingleLine ? range[2] : range[3],
        });
      }
    }
  }

  return results;
}

/**
 * Get the definition location for a symbol.
 *
 * A definition is an occurrence where symbol_roles includes the Definition bit (1).
 *
 * @param index - Loaded SCIP Index
 * @param symbol - The symbol string to search for
 * @returns The definition occurrence with location, or null if not found
 */
export function getDefinition(
  index: Index,
  symbol: string
): OccurrenceLocation | null {
  for (const document of index.documents) {
    for (const occurrence of document.occurrences) {
      if (occurrence.symbol === symbol) {
        // Check if this is a definition (bit 0 = Definition)
        if (occurrence.symbol_roles & SymbolRole.Definition) {
          const range = occurrence.range;
          const isSingleLine = range.length === 3;

          return {
            occurrence,
            document,
            relativePath: document.relative_path,
            startLine: range[0],
            startColumn: range[1],
            endLine: isSingleLine ? range[0] : range[2],
            endColumn: isSingleLine ? range[2] : range[3],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Find all hooks in the codebase (functions starting with "use" followed by uppercase).
 *
 * This is a convenience wrapper around findSymbolsByPattern.
 *
 * SCIP symbol format for functions: ...path/functionName().
 * The trailing (). indicates it's a function.
 *
 * @param index - Loaded SCIP Index
 * @returns Array of hook symbols with their paths
 */
export function findHooks(
  index: Index
): Array<{ symbol: SymbolInformation; documentPath: string }> {
  // Match function-like symbols that start with "use" followed by uppercase
  // SCIP function symbols end with (). (parentheses + dot)
  return findSymbolsByPattern(index, /use[A-Z][a-zA-Z0-9]*\(\)\.$/);
}

/**
 * Get all symbols defined in a specific file.
 *
 * @param index - Loaded SCIP Index
 * @param relativePath - Relative path to the file (e.g., "src/hooks/use-mobile.ts")
 * @returns Array of SymbolInformation for that file, or empty array if not found
 */
export function getSymbolsInFile(
  index: Index,
  relativePath: string
): SymbolInformation[] {
  const document = index.documents.find(
    (doc) => doc.relative_path === relativePath
  );
  return document ? [...document.symbols] : [];
}

/**
 * Get document by relative path.
 *
 * @param index - Loaded SCIP Index
 * @param relativePath - Relative path to the file
 * @returns Document or undefined
 */
export function getDocument(index: Index, relativePath: string): Document | undefined {
  return index.documents.find((doc) => doc.relative_path === relativePath);
}

/**
 * Get index statistics for debugging/info.
 */
export function getIndexStats(index: Index): {
  documentCount: number;
  symbolCount: number;
  occurrenceCount: number;
  externalSymbolCount: number;
  projectRoot: string | undefined;
  toolName: string | undefined;
} {
  let symbolCount = 0;
  let occurrenceCount = 0;

  for (const doc of index.documents) {
    symbolCount += doc.symbols.length;
    occurrenceCount += doc.occurrences.length;
  }

  return {
    documentCount: index.documents.length,
    symbolCount,
    occurrenceCount,
    externalSymbolCount: index.external_symbols.length,
    projectRoot: index.metadata?.project_root,
    toolName: index.metadata?.tool_info?.name,
  };
}
