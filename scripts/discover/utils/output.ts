import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Standard envelope for all discovery JSON files.
 * Token-dense design: flat structures for efficient Claude processing.
 */
export interface DiscoveryEnvelope<T> {
  status: "complete" | "in_progress" | "error";
  generated_at: string;
  generator: string;
  source_globs: string[];
  checksum: string;
  source_hashes: Record<string, string>;
  summary: Record<string, number>;
  [key: string]: T | string | string[] | Record<string, string | number>;
}

/**
 * Calculate SHA-256 hash of a file's contents.
 */
export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

/**
 * Calculate SHA-256 hash of the entire discovery payload.
 */
export function hashPayload(data: unknown): string {
  const json = JSON.stringify(data, null, 0); // Compact for consistent hashing
  return `sha256:${crypto.createHash("sha256").update(json).digest("hex").slice(0, 16)}`;
}

/**
 * Build source hashes map for staleness detection.
 * Maps relative file path to its content hash.
 */
export function buildSourceHashes(filePaths: string[]): Record<string, string> {
  const hashes: Record<string, string> = {};
  const cwd = process.cwd();

  for (const filePath of filePaths) {
    const relativePath = path.relative(cwd, filePath);
    try {
      hashes[relativePath] = hashFile(filePath);
    } catch {
      // File may have been deleted between scan and hash
      hashes[relativePath] = "MISSING";
    }
  }

  return hashes;
}

/**
 * Create the standard discovery envelope.
 */
export function createEnvelope<T>(
  generator: string,
  sourceGlobs: string[],
  sourceFiles: string[],
  summary: Record<string, number>,
  payload: Record<string, T>
): DiscoveryEnvelope<T> {
  const sourceHashes = buildSourceHashes(sourceFiles);

  const envelope: DiscoveryEnvelope<T> = {
    status: "complete",
    generated_at: new Date().toISOString(),
    generator,
    source_globs: sourceGlobs,
    checksum: "", // Will be filled after
    source_hashes: sourceHashes,
    summary,
    ...payload,
  };

  // Calculate checksum of the entire payload (excluding checksum field)
  envelope.checksum = hashPayload({ ...envelope, checksum: "" });

  return envelope;
}

/**
 * Atomic write: write to temp file, then rename.
 * Prevents partial writes on crash.
 */
export function writeDiscoveryFile(
  filename: string,
  data: DiscoveryEnvelope<unknown>
): void {
  const outputDir = path.resolve(process.cwd(), "docs/_state");
  const finalPath = path.join(outputDir, filename);
  const tempPath = `${finalPath}.tmp`;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to temp file first
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");

  // Atomic rename (POSIX guarantees atomicity)
  fs.renameSync(tempPath, finalPath);

  console.log(`✅ Written: ${filename} (${data.summary.total_items || 0} items)`);
}

/**
 * Check if a discovery file is stale by comparing source hashes.
 * Returns true if stale (needs regeneration), false if fresh.
 */
export function isDiscoveryStale(
  filename: string,
  currentSourceFiles: string[]
): { stale: boolean; reason?: string; changedFiles?: string[] } {
  const outputDir = path.resolve(process.cwd(), "docs/_state");
  const filePath = path.join(outputDir, filename);

  // If file doesn't exist, it's definitely stale
  if (!fs.existsSync(filePath)) {
    return { stale: true, reason: "Discovery file does not exist" };
  }

  try {
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8")) as DiscoveryEnvelope<unknown>;
    const currentHashes = buildSourceHashes(currentSourceFiles);

    const changedFiles: string[] = [];

    // Check for new or modified files
    for (const [file, hash] of Object.entries(currentHashes)) {
      if (!existing.source_hashes[file]) {
        changedFiles.push(`+ ${file} (new)`);
      } else if (existing.source_hashes[file] !== hash) {
        changedFiles.push(`~ ${file} (modified)`);
      }
    }

    // Check for deleted files
    for (const file of Object.keys(existing.source_hashes)) {
      if (!currentHashes[file]) {
        changedFiles.push(`- ${file} (deleted)`);
      }
    }

    if (changedFiles.length > 0) {
      return {
        stale: true,
        reason: `${changedFiles.length} file(s) changed`,
        changedFiles,
      };
    }

    return { stale: false };
  } catch (error) {
    return {
      stale: true,
      reason: `Error reading discovery file: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
