/**
 * Codebase Indexer for Semantic Search
 *
 * Orchestrates the full indexing pipeline:
 * 1. Find all TypeScript/TSX source files
 * 2. Chunk files into semantic units (functions, classes, components)
 * 3. Generate embeddings via Ollama
 * 4. Store vectors in Qdrant for similarity search
 *
 * Usage: npx tsx scripts/discover/embeddings/indexer.ts
 *
 * Gotchas (for blog documentation):
 * 1. Ollama processes embeddings sequentially - no batch API
 * 2. Large codebases take time: ~100 embeddings/second
 * 3. Qdrant uses numeric IDs - we map string IDs via payload
 * 4. Empty chunks are skipped to avoid meaningless embeddings
 */

import fg from "fast-glob";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { chunkFile } from "./chunk.js";
import { generateEmbedding, checkOllamaHealth } from "./ollama.js";
import {
  ensureCollection,
  upsertPoints,
  clearCollection,
  checkLanceDBHealth,
  getCollectionInfo,
  type UpsertPoint,
} from "./lancedb.js";

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

const BATCH_SIZE = 50; // Upsert to Qdrant in batches of 50

interface IndexingStats {
  filesProcessed: number;
  chunksGenerated: number;
  embeddingsCreated: number;
  errors: number;
  startTime: number;
}

async function verifyServices(): Promise<boolean> {
  console.log("🔍 Verifying services...\n");

  const ollamaOk = await checkOllamaHealth();
  if (!ollamaOk) {
    console.error(
      "❌ Ollama not available. Run: just discover-services && just discover-pull-model"
    );
    return false;
  }
  console.log("   ✅ Ollama ready");

  const lanceOk = await checkLanceDBHealth();
  if (!lanceOk) {
    console.error("❌ LanceDB not available. Run: just discover-services");
    return false;
  }
  console.log("   ✅ LanceDB ready\n");

  return true;
}

async function indexCodebase(rootDir: string, freshIndex: boolean = true): Promise<void> {
  const stats: IndexingStats = {
    filesProcessed: 0,
    chunksGenerated: 0,
    embeddingsCreated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  // Verify services are running
  const servicesOk = await verifyServices();
  if (!servicesOk) {
    process.exit(1);
  }

  // Setup collection
  if (freshIndex) {
    console.log("🗑️  Clearing existing collection...");
    await clearCollection();
  } else {
    await ensureCollection();
  }

  // Find source files
  console.log("📁 Scanning for source files...");
  const files = await fg(SOURCE_PATTERNS, {
    cwd: rootDir,
    absolute: true,
    ignore: IGNORE_PATTERNS,
  });
  console.log(`   Found ${files.length} source files\n`);

  // Process files
  const pendingPoints: UpsertPoint[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const chunks = chunkFile(relativePath, content);
      stats.filesProcessed++;

      for (const chunk of chunks) {
        // Skip empty or trivial chunks
        if (chunk.content.trim().length < 20) {
          continue;
        }

        stats.chunksGenerated++;

        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.content);
          stats.embeddingsCreated++;

          // Prepare point for upsert
          pendingPoints.push({
            id: chunk.id,
            vector: embedding,
            payload: {
              originalId: chunk.id,
              filePath: chunk.filePath,
              type: chunk.type,
              name: chunk.name,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              content: chunk.content,
            },
          });

          // Batch upsert
          if (pendingPoints.length >= BATCH_SIZE) {
            await upsertPoints(pendingPoints);
            console.log(
              `📤 Indexed ${stats.embeddingsCreated} chunks ` +
                `(${stats.filesProcessed}/${files.length} files)`
            );
            pendingPoints.length = 0;
          }
        } catch (error) {
          stats.errors++;
          console.error(`   ⚠️  Error embedding ${chunk.id}:`, error);
        }
      }
    } catch (error) {
      stats.errors++;
      console.error(`   ⚠️  Error processing ${relativePath}:`, error);
    }
  }

  // Flush remaining points
  if (pendingPoints.length > 0) {
    await upsertPoints(pendingPoints);
  }

  // Print summary
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const info = await getCollectionInfo();

  console.log("\n" + "─".repeat(50));
  console.log("✅ Indexing Complete\n");
  console.log(`   Files processed:    ${stats.filesProcessed}`);
  console.log(`   Chunks generated:   ${stats.chunksGenerated}`);
  console.log(`   Embeddings created: ${stats.embeddingsCreated}`);
  console.log(`   Errors:             ${stats.errors}`);
  console.log(`   Duration:           ${duration}s`);
  console.log(`   Points in LanceDB:  ${info.pointCount}`);
  console.log('\n   Next: just discover-search "your query here"');
}

// CLI entry point
const rootDir = process.cwd();
const freshIndex = !process.argv.includes("--incremental");

if (process.argv.includes("--help")) {
  console.log("Usage: npx tsx scripts/discover/embeddings/indexer.ts [options]");
  console.log("");
  console.log("Options:");
  console.log("  --incremental  Keep existing vectors, only add new");
  console.log("  --help         Show this help message");
  process.exit(0);
}

indexCodebase(rootDir, freshIndex).catch((error) => {
  console.error("Indexing failed:", error);
  process.exit(1);
});
