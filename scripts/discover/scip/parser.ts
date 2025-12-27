/**
 * SCIP Index Parser
 *
 * GOTCHAS (lessons learned the hard way):
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

// Type aliases for clarity
export type ScipIndex = InstanceType<typeof scip.Index>;
export type ScipDocument = InstanceType<typeof scip.Document>;
export type ScipOccurrence = InstanceType<typeof scip.Occurrence>;
export type ScipSymbolInfo = InstanceType<typeof scip.SymbolInformation>;

// Symbol role bitmask values
export const SymbolRoles = {
  Definition: 1,
  Import: 2,
  WriteAccess: 4,
  ReadAccess: 8,
  Generated: 16,
  Test: 32,
} as const;

/**
 * Parsed symbol with location information
 */
export interface ParsedSymbol {
  name: string;
  fullSymbol: string;
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  kind: SymbolKind;
  isDefinition: boolean;
  documentation?: string;
}

export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "method"
  | "property"
  | "parameter"
  | "unknown";

/**
 * Load and parse a SCIP index file.
 */
export function parseScipIndex(indexPath: string): ScipIndex {
  const buffer = fs.readFileSync(indexPath);
  return scip.Index.deserializeBinary(buffer);
}

/**
 * Extract the short name from a SCIP symbol string.
 *
 * SCIP symbol format:
 *   scip-typescript npm <package> <version> <path>/SymbolName
 *
 * Examples:
 *   "scip-typescript npm atomic-crm 0.1.0 src/hooks/`use-mobile.ts`/useIsMobile()."
 *   -> "useIsMobile"
 */
export function extractSymbolName(fullSymbol: string): string {
  // Remove trailing punctuation (. or ())
  const cleaned = fullSymbol.replace(/\(\)\.$/, "").replace(/\.$/, "");
  // Get the last path segment
  const parts = cleaned.split("/");
  const lastPart = parts[parts.length - 1] || "";
  // Remove backticks around filenames
  return lastPart.replace(/`/g, "");
}

/**
 * Determine symbol kind from the SCIP symbol string.
 */
export function inferSymbolKind(fullSymbol: string): SymbolKind {
  if (fullSymbol.endsWith("().")) return "function";
  if (fullSymbol.includes("#") && fullSymbol.endsWith("().")) return "method";
  if (fullSymbol.includes("#")) return "property";
  if (fullSymbol.match(/\/[A-Z][a-zA-Z0-9]*\.$/)) return "class";
  if (fullSymbol.match(/\/[A-Z][a-zA-Z0-9]*#$/)) return "interface";
  if (fullSymbol.match(/\/[A-Z][a-zA-Z0-9]*$/)) return "type";
  return "unknown";
}

/**
 * Parse occurrence range to line/column.
 *
 * Range format:
 *   [startLine, startCol, endCol] for single-line
 *   [startLine, startCol, endLine, endCol] for multi-line
 */
export function parseRange(range: number[]): {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
} {
  const isSingleLine = range.length === 3;
  return {
    startLine: range[0],
    startColumn: range[1],
    endLine: isSingleLine ? range[0] : range[2],
    endColumn: isSingleLine ? range[2] : range[3],
  };
}

/**
 * Extract all symbols from a SCIP index.
 */
export function extractAllSymbols(index: ScipIndex): ParsedSymbol[] {
  const symbols: ParsedSymbol[] = [];

  for (const document of index.documents) {
    const filePath = document.relative_path;

    // Extract from symbol definitions
    for (const symbolInfo of document.symbols) {
      const name = extractSymbolName(symbolInfo.symbol);
      const kind = inferSymbolKind(symbolInfo.symbol);
      const doc = symbolInfo.documentation?.join("\n");

      // Find the definition occurrence for this symbol
      const defOccurrence = document.occurrences.find(
        (occ) =>
          occ.symbol === symbolInfo.symbol &&
          (occ.symbol_roles & SymbolRoles.Definition) !== 0
      );

      if (defOccurrence) {
        const loc = parseRange(defOccurrence.range);
        symbols.push({
          name,
          fullSymbol: symbolInfo.symbol,
          filePath,
          line: loc.startLine,
          column: loc.startColumn,
          endLine: loc.endLine,
          endColumn: loc.endColumn,
          kind,
          isDefinition: true,
          documentation: doc,
        });
      }
    }
  }

  return symbols;
}

/**
 * Extract all references (usages) of a specific symbol.
 */
export function extractReferences(
  index: ScipIndex,
  targetSymbol: string
): ParsedSymbol[] {
  const references: ParsedSymbol[] = [];

  for (const document of index.documents) {
    for (const occurrence of document.occurrences) {
      if (occurrence.symbol === targetSymbol) {
        const loc = parseRange(occurrence.range);
        const isDefinition =
          (occurrence.symbol_roles & SymbolRoles.Definition) !== 0;

        references.push({
          name: extractSymbolName(targetSymbol),
          fullSymbol: targetSymbol,
          filePath: document.relative_path,
          line: loc.startLine,
          column: loc.startColumn,
          endLine: loc.endLine,
          endColumn: loc.endColumn,
          kind: inferSymbolKind(targetSymbol),
          isDefinition,
        });
      }
    }
  }

  return references;
}

/**
 * Get index statistics.
 */
export function getStats(index: ScipIndex): {
  documentCount: number;
  symbolCount: number;
  occurrenceCount: number;
  externalSymbolCount: number;
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
  };
}
