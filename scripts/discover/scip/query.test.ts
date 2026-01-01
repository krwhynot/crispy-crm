/**
 * Simple test script for SCIP query utilities.
 *
 * Run with: npx tsx scripts/discover/scip/query.test.ts
 */

import * as path from "path";
import {
  loadIndex,
  loadIndexSync,
  findSymbolsByPattern,
  findHooks,
  getReferences,
  getDefinition,
  getSymbolsInFile,
  getIndexStats,
  SymbolRole,
} from "./query.js";

const INDEX_PATH = path.resolve(process.cwd(), ".claude/state/index.scip");

async function runTests() {
  console.log("=== SCIP Query Utilities Test ===\n");

  // Test 1: Load index
  console.log("1. Loading SCIP index...");
  const index = await loadIndex(INDEX_PATH);
  console.log("   OK: Index loaded successfully\n");

  // Test 2: Get stats
  console.log("2. Index Statistics:");
  const stats = getIndexStats(index);
  console.log(`   Documents: ${stats.documentCount}`);
  console.log(`   Symbols: ${stats.symbolCount}`);
  console.log(`   Occurrences: ${stats.occurrenceCount}`);
  console.log(`   External Symbols: ${stats.externalSymbolCount}`);
  console.log(`   Project Root: ${stats.projectRoot}`);
  console.log(`   Tool: ${stats.toolName}\n`);

  // Test 3: Find hooks
  console.log("3. Finding hooks (use[A-Z]...):");
  const hooks = findHooks(index);
  console.log(`   Found ${hooks.length} hooks`);
  const sampleHooks = hooks.slice(0, 5);
  for (const h of sampleHooks) {
    // Extract just the function name from the full symbol path
    const symbolName = h.symbol.symbol.split("/").pop() || h.symbol.symbol;
    console.log(`   - ${symbolName} (${h.documentPath})`);
  }
  if (hooks.length > 5) {
    console.log(`   ... and ${hooks.length - 5} more`);
  }
  console.log();

  // Test 4: Find symbols by pattern
  console.log("4. Finding validation-related symbols:");
  const validationSymbols = findSymbolsByPattern(index, /validation/i);
  console.log(`   Found ${validationSymbols.length} symbols`);
  const sampleValidation = validationSymbols.slice(0, 3);
  for (const v of sampleValidation) {
    const symbolName = v.symbol.symbol.split("/").pop() || v.symbol.symbol;
    console.log(`   - ${symbolName}`);
  }
  console.log();

  // Test 5: Get symbols in specific file
  console.log("5. Getting symbols in src/hooks/use-mobile.ts:");
  const mobileHookSymbols = getSymbolsInFile(index, "src/hooks/use-mobile.ts");
  console.log(`   Found ${mobileHookSymbols.length} symbols`);
  for (const s of mobileHookSymbols) {
    const symbolName = s.symbol.split("/").pop() || s.symbol;
    console.log(`   - ${symbolName}`);
  }
  console.log();

  // Test 6: Find references to a specific hook
  if (hooks.length > 0) {
    const hookToFind = hooks.find((h) => h.symbol.symbol.includes("useIsMobile"));
    if (hookToFind) {
      console.log("6. Finding references to useIsMobile:");
      const refs = getReferences(index, hookToFind.symbol.symbol);
      console.log(`   Found ${refs.length} references`);

      // Group by role
      const definitions = refs.filter((r) => r.occurrence.symbol_roles & SymbolRole.Definition);
      const usages = refs.filter((r) => !(r.occurrence.symbol_roles & SymbolRole.Definition));

      console.log(`   Definitions: ${definitions.length}`);
      console.log(`   Usages: ${usages.length}`);

      if (definitions.length > 0) {
        const def = definitions[0];
        console.log(`   Definition location: ${def.relativePath}:${def.startLine + 1}`);
      }

      // Show some usage locations
      const sampleUsages = usages.slice(0, 3);
      for (const u of sampleUsages) {
        console.log(`   Used in: ${u.relativePath}:${u.startLine + 1}`);
      }
    }
  }
  console.log();

  // Test 7: Get definition
  if (hooks.length > 0) {
    const hookToFind = hooks.find((h) => h.symbol.symbol.includes("useIsMobile"));
    if (hookToFind) {
      console.log("7. Getting definition of useIsMobile:");
      const definition = getDefinition(index, hookToFind.symbol.symbol);
      if (definition) {
        console.log(
          `   Found at: ${definition.relativePath}:${definition.startLine + 1}:${definition.startColumn + 1}`
        );
      } else {
        console.log("   Definition not found (may be in external package)");
      }
    }
  }
  console.log();

  // Test 8: Sync loading
  console.log("8. Testing synchronous loading...");
  const indexSync = loadIndexSync(INDEX_PATH);
  console.log(`   OK: Loaded ${indexSync.documents.length} documents synchronously\n`);

  console.log("=== All tests passed! ===\n");

  // Document gotchas for the blog
  console.log("--- GOTCHAS FOR BLOG ---");
  console.log("1. Package: Use @sourcegraph/scip-typescript, NOT @sourcegraph/scip");
  console.log("   Import from: @sourcegraph/scip-typescript/dist/src/scip.js");
  console.log("");
  console.log("2. Symbol format: scip-typescript npm <pkg> <ver> <path>/SymbolName");
  console.log("   Example:", hooks[0]?.symbol.symbol || "(no hooks found)");
  console.log("");
  console.log("3. symbol_roles is a bitmask:");
  console.log("   Definition = 1, Import = 2, WriteAccess = 4, ReadAccess = 8");
  console.log("");
  console.log("4. Range format:");
  console.log("   Single-line: [startLine, startCol, endCol]");
  console.log("   Multi-line: [startLine, startCol, endLine, endCol]");
  console.log("");
  console.log("5. Lines and columns are 0-indexed");
}

runTests().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
