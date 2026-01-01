/**
 * Staleness detection script for CI integration.
 *
 * Checks if Discovery System index is out of date compared to source files.
 * Creates and uses a unified manifest at .claude/state/manifest.json to track
 * all source file hashes across the codebase.
 *
 * Exit codes:
 *   0 - Discovery is fresh
 *   1 - Discovery is stale (needs regeneration)
 *
 * Usage:
 *   npx tsx scripts/discover/check-staleness.ts          # Check staleness
 *   npx tsx scripts/discover/check-staleness.ts --generate  # Generate manifest
 *   just discover-staleness           # Check via justfile
 *   just discover-staleness-generate  # Generate via justfile
 *
 * Edge Cases (for blog gotchas):
 *   1. First run: If manifest.json doesn't exist, returns stale with reason.
 *   2. Empty manifest: If sourceHashes is empty, considered stale.
 *   3. Corrupted manifest: JSON parse errors result in stale status.
 *   4. Symlinks: Files are hashed by content, symlinks are followed.
 *   5. Binary files: Only source files are tracked via glob patterns.
 *   6. Race conditions: If a file is modified between scan and hash, the next
 *      run will detect it. This is acceptable for CI (eventual consistency).
 *   7. Encoding: Uses UTF-8 for all file reads. Non-UTF-8 files may produce
 *      inconsistent hashes if their content is interpreted differently.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import fg from "fast-glob";

const MANIFEST_PATH = ".claude/state/manifest.json";
const SOURCE_GLOBS = ["src/**/*.ts", "src/**/*.tsx"];
const IGNORE_PATTERNS = ["node_modules/**", "**/*.d.ts", "**/*.test.ts", "**/*.test.tsx"];

interface Manifest {
  sourceHashes: Record<string, string>;
  generatedAt: string;
  version: string;
}

interface ChangeInfo {
  type: "modified" | "new" | "deleted";
  file: string;
}

/**
 * Hash file content using SHA-256 (first 16 characters).
 */
function hashFile(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  } catch {
    return "MISSING";
  }
}

/**
 * Read the existing manifest from disk.
 */
function readManifest(): Manifest | null {
  const manifestPath = path.resolve(process.cwd(), MANIFEST_PATH);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(content) as Manifest;
  } catch {
    return null;
  }
}

/**
 * Write manifest to disk atomically.
 */
function writeManifest(manifest: Manifest): void {
  const manifestPath = path.resolve(process.cwd(), MANIFEST_PATH);
  const tempPath = `${manifestPath}.tmp`;

  // Ensure directory exists
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), "utf-8");
  fs.renameSync(tempPath, manifestPath);
}

/**
 * Check if discovery is stale by comparing source file hashes.
 * Returns true if stale, false if fresh.
 */
async function checkStaleness(): Promise<boolean> {
  const manifest = readManifest();

  // If manifest doesn't exist, discovery is stale
  if (!manifest) {
    console.log("\x1b[33mNo manifest found. Run 'just discover' to generate.\x1b[0m");
    return true;
  }

  const storedHashes = manifest.sourceHashes || {};

  if (Object.keys(storedHashes).length === 0) {
    console.log("\x1b[33mManifest has no source hashes. Discovery is stale.\x1b[0m");
    return true;
  }

  // Get current source files
  const currentFiles = await fg(SOURCE_GLOBS, {
    cwd: process.cwd(),
    ignore: IGNORE_PATTERNS,
    absolute: false,
  });

  const currentFilesSet = new Set(currentFiles);
  const changes: ChangeInfo[] = [];

  // Build current hashes
  const currentHashes: Record<string, string> = {};
  for (const file of currentFiles) {
    const absolutePath = path.resolve(process.cwd(), file);
    currentHashes[file] = hashFile(absolutePath);
  }

  // Check for modified and new files
  for (const [file, hash] of Object.entries(currentHashes)) {
    if (!storedHashes[file]) {
      changes.push({ type: "new", file });
    } else if (storedHashes[file] !== hash) {
      changes.push({ type: "modified", file });
    }
  }

  // Check for deleted files
  for (const file of Object.keys(storedHashes)) {
    if (!currentFilesSet.has(file)) {
      changes.push({ type: "deleted", file });
    }
  }

  if (changes.length === 0) {
    console.log("\x1b[32m\u2713 Discovery is fresh.\x1b[0m");
    return false;
  }

  // Discovery is stale
  console.log(`\x1b[31m\u2717 Discovery is stale. ${changes.length} file(s) changed:\x1b[0m`);

  // Show first 10 changes
  const displayChanges = changes.slice(0, 10);
  for (const change of displayChanges) {
    const prefix = change.type === "new" ? "+" : change.type === "modified" ? "~" : "-";
    const color =
      change.type === "new" ? "\x1b[32m" : change.type === "modified" ? "\x1b[33m" : "\x1b[31m";
    console.log(`${color}  ${prefix} ${change.file}\x1b[0m`);
  }

  if (changes.length > 10) {
    console.log(`\x1b[90m  ... and ${changes.length - 10} more\x1b[0m`);
  }

  console.log("\n\x1b[33mRun 'just discover' to regenerate.\x1b[0m");

  return true;
}

/**
 * Generate a fresh manifest with current source file hashes.
 * Call this after running discovery to update the manifest.
 */
async function generateManifest(): Promise<void> {
  const currentFiles = await fg(SOURCE_GLOBS, {
    cwd: process.cwd(),
    ignore: IGNORE_PATTERNS,
    absolute: false,
  });

  const sourceHashes: Record<string, string> = {};
  for (const file of currentFiles) {
    const absolutePath = path.resolve(process.cwd(), file);
    sourceHashes[file] = hashFile(absolutePath);
  }

  const manifest: Manifest = {
    sourceHashes,
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
  };

  writeManifest(manifest);
  console.log(`\x1b[32m\u2713 Manifest updated with ${currentFiles.length} files.\x1b[0m`);
}

// CLI entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--generate")) {
    await generateManifest();
    process.exit(0);
  }

  const isStale = await checkStaleness();
  process.exit(isStale ? 1 : 0);
}

main().catch((error) => {
  console.error("\x1b[31mError:\x1b[0m", error instanceof Error ? error.message : error);
  process.exit(1);
});
