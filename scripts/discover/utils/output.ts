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
  const outputDir = path.resolve(process.cwd(), ".claude/state");
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
  const outputDir = path.resolve(process.cwd(), ".claude/state");
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

/**
 * Manifest for chunked discovery output.
 * Points to individual feature chunks for efficient partial loading.
 */
export interface ChunkedManifest {
  status: "complete" | "in_progress" | "error";
  generated_at: string;
  generator: string;
  source_globs: string[];
  checksum: string;
  source_hashes: Record<string, string>;
  summary: Record<string, number>;
  chunks: ChunkInfo[];
  /** Maps source file paths to chunk names they contribute to (for incremental updates) */
  file_to_chunks: Record<string, string[]>;
}

export interface ChunkInfo {
  name: string;
  file: string;
  item_count: number;
  checksum: string;
  /** Source files that contributed to this chunk (for incremental staleness detection) */
  source_files: string[];
  /** Hashes of source files in this chunk */
  source_hashes: Record<string, string>;
}

/**
 * Write chunked discovery output: manifest.json + feature chunks.
 * Reduces context usage by allowing Claude to load only needed features.
 *
 * @param fileToChunkMapping - Maps source file paths to chunk names (for incremental updates)
 */
export function writeChunkedDiscovery<T>(
  dirName: string,
  generator: string,
  sourceGlobs: string[],
  sourceFiles: string[],
  summary: Record<string, number>,
  chunks: Map<string, T[]>,
  fileToChunkMapping?: Map<string, string>
): void {
  const outputDir = path.resolve(process.cwd(), ".claude/state", dirName);
  const cwd = process.cwd();

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sourceHashes = buildSourceHashes(sourceFiles);
  const chunkInfos: ChunkInfo[] = [];

  // Build file_to_chunks mapping for manifest
  const fileToChunks: Record<string, string[]> = {};
  if (fileToChunkMapping) {
    for (const [filePath, chunkName] of fileToChunkMapping) {
      const relativePath = path.relative(cwd, filePath);
      if (!fileToChunks[relativePath]) {
        fileToChunks[relativePath] = [];
      }
      if (!fileToChunks[relativePath].includes(chunkName)) {
        fileToChunks[relativePath].push(chunkName);
      }
    }
  }

  // Build reverse mapping: chunk → source files
  const chunkToFiles: Map<string, string[]> = new Map();
  if (fileToChunkMapping) {
    for (const [filePath, chunkName] of fileToChunkMapping) {
      const relativePath = path.relative(cwd, filePath);
      if (!chunkToFiles.has(chunkName)) {
        chunkToFiles.set(chunkName, []);
      }
      const files = chunkToFiles.get(chunkName)!;
      if (!files.includes(relativePath)) {
        files.push(relativePath);
      }
    }
  }

  // Write each feature chunk
  for (const [chunkName, items] of chunks) {
    const chunkFileName = `${chunkName}.json`;
    const chunkPath = path.join(outputDir, chunkFileName);
    const tempPath = `${chunkPath}.tmp`;

    // Get source files for this chunk
    const chunkSourceFiles = chunkToFiles.get(chunkName) || [];
    const chunkSourceHashes: Record<string, string> = {};
    for (const file of chunkSourceFiles) {
      if (sourceHashes[file]) {
        chunkSourceHashes[file] = sourceHashes[file];
      }
    }

    const chunkData = {
      chunk_name: chunkName,
      generated_at: new Date().toISOString(),
      item_count: items.length,
      items,
    };

    const chunkChecksum = hashPayload(chunkData);

    // Atomic write for chunk
    fs.writeFileSync(tempPath, JSON.stringify(chunkData, null, 2), "utf-8");
    fs.renameSync(tempPath, chunkPath);

    chunkInfos.push({
      name: chunkName,
      file: chunkFileName,
      item_count: items.length,
      checksum: chunkChecksum,
      source_files: chunkSourceFiles.sort(),
      source_hashes: chunkSourceHashes,
    });
  }

  // Sort chunks alphabetically for consistent output
  chunkInfos.sort((a, b) => a.name.localeCompare(b.name));

  // Create manifest
  const manifest: ChunkedManifest = {
    status: "complete",
    generated_at: new Date().toISOString(),
    generator,
    source_globs: sourceGlobs,
    checksum: "", // Will be filled
    source_hashes: sourceHashes,
    summary,
    chunks: chunkInfos,
    file_to_chunks: fileToChunks,
  };

  manifest.checksum = hashPayload({ ...manifest, checksum: "" });

  // Write manifest atomically
  const manifestPath = path.join(outputDir, "manifest.json");
  const tempManifestPath = `${manifestPath}.tmp`;
  fs.writeFileSync(tempManifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  fs.renameSync(tempManifestPath, manifestPath);

  console.log(`✅ Written: ${dirName}/ (${chunkInfos.length} chunks, ${summary.total_items || 0} items)`);
}

/**
 * Check if a chunked discovery directory is stale.
 * Checks manifest.json source hashes against current source files.
 */
export function isChunkedDiscoveryStale(
  dirName: string,
  currentSourceFiles: string[]
): { stale: boolean; reason?: string; changedFiles?: string[] } {
  const outputDir = path.resolve(process.cwd(), ".claude/state", dirName);
  const manifestPath = path.join(outputDir, "manifest.json");

  // If manifest doesn't exist, it's definitely stale
  if (!fs.existsSync(manifestPath)) {
    return { stale: true, reason: "Manifest file does not exist" };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ChunkedManifest;
    const currentHashes = buildSourceHashes(currentSourceFiles);

    const changedFiles: string[] = [];

    // Check for new or modified files
    for (const [file, hash] of Object.entries(currentHashes)) {
      if (!manifest.source_hashes[file]) {
        changedFiles.push(`+ ${file} (new)`);
      } else if (manifest.source_hashes[file] !== hash) {
        changedFiles.push(`~ ${file} (modified)`);
      }
    }

    // Check for deleted files
    for (const file of Object.keys(manifest.source_hashes)) {
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
      reason: `Error reading manifest: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
