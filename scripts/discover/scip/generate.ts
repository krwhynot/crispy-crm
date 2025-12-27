/**
 * SCIP Index Generator
 *
 * Generates a SCIP index from the TypeScript codebase using scip-typescript.
 * The index is written to .claude/state/index.scip in protobuf binary format.
 *
 * Usage: npx tsx scripts/discover/scip/generate.ts
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, ".claude", "state");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "index.scip");

interface GenerateOptions {
  verbose?: boolean;
  force?: boolean;
}

export async function generateScipIndex(
  options: GenerateOptions = {}
): Promise<{ success: boolean; indexPath: string; stats: IndexStats }> {
  const { verbose = false, force = false } = options;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if index already exists and is recent (< 1 hour old)
  if (!force && fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    const ageMs = Date.now() - stats.mtimeMs;
    const oneHour = 60 * 60 * 1000;

    if (ageMs < oneHour) {
      if (verbose) {
        console.log(
          `Index exists and is ${Math.round(ageMs / 1000 / 60)} minutes old. Use --force to regenerate.`
        );
      }
      return {
        success: true,
        indexPath: OUTPUT_FILE,
        stats: getIndexStats(OUTPUT_FILE),
      };
    }
  }

  const startTime = performance.now();

  if (verbose) {
    console.log("Generating SCIP index from TypeScript source...");
  }

  // Run scip-typescript indexer
  // --infer-tsconfig: Auto-detect tsconfig.json
  // --output: Write index to specified path
  const command = `npx scip-typescript index --output "${OUTPUT_FILE}"`;

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: verbose ? "inherit" : "pipe",
      encoding: "utf-8",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`SCIP index generation failed: ${message}`);
  }

  const elapsed = Math.round(performance.now() - startTime);

  if (!fs.existsSync(OUTPUT_FILE)) {
    throw new Error(`SCIP index file not created at ${OUTPUT_FILE}`);
  }

  const stats = getIndexStats(OUTPUT_FILE);

  if (verbose) {
    console.log(`Index generated in ${elapsed}ms`);
    console.log(`  Size: ${formatBytes(stats.sizeBytes)}`);
    console.log(`  Path: ${OUTPUT_FILE}`);
  }

  return {
    success: true,
    indexPath: OUTPUT_FILE,
    stats,
  };
}

interface IndexStats {
  sizeBytes: number;
  modifiedAt: Date;
  path: string;
}

function getIndexStats(indexPath: string): IndexStats {
  const stats = fs.statSync(indexPath);
  return {
    sizeBytes: stats.size,
    modifiedAt: stats.mtime,
    path: indexPath,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
  const force = process.argv.includes("--force") || process.argv.includes("-f");

  generateScipIndex({ verbose, force })
    .then(({ indexPath, stats }) => {
      console.log(`SCIP index generated: ${indexPath} (${formatBytes(stats.sizeBytes)})`);
    })
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
