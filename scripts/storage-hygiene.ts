#!/usr/bin/env npx tsx
/**
 * Storage Hygiene Audit Script
 *
 * FIX [SF-C10]: Identifies orphaned files in Supabase Storage
 *
 * PROBLEM: Files uploaded to storage remain after records are deleted.
 * This violates GDPR "Right to be Forgotten" and wastes storage costs.
 *
 * SOLUTION: This script compares files in storage against database references
 * to identify orphaned files that can be safely deleted.
 *
 * USAGE:
 *   npx tsx scripts/storage-hygiene.ts          # Report only (default)
 *   npx tsx scripts/storage-hygiene.ts --delete # Report and delete orphans
 *   npx tsx scripts/storage-hygiene.ts --json   # JSON output for CI/CD
 *
 * REQUIRES:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (for storage access)
 *
 * @module scripts/storage-hygiene
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUCKET_NAME = "attachments";

// Storage columns in the database (table -> column -> type)
const STORAGE_COLUMNS = [
  { table: "organizations", column: "logo_url", type: "text" },
  { table: "sales", column: "avatar_url", type: "text" },
  { table: "activities", column: "attachments", type: "array" },
  { table: "contact_notes", column: "attachments", type: "jsonb" },
  { table: "opportunity_notes", column: "attachments", type: "jsonb" },
  { table: "organization_notes", column: "attachments", type: "jsonb" },
] as const;

// ============================================================================
// TYPES
// ============================================================================

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

interface AuditResult {
  timestamp: string;
  bucket: string;
  totalFilesInStorage: number;
  totalReferencesInDb: number;
  orphanedFiles: string[];
  orphanedCount: number;
  orphanedSizeBytes: number;
  referencedButMissing: string[];
  missingCount: number;
  deletedFiles: string[];
  deletedCount: number;
  errors: string[];
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Missing required environment variables:");
    console.error("   SUPABASE_URL:", url ? "✓" : "✗ MISSING");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", serviceKey ? "✓" : "✗ MISSING");
    console.error("\nHint: Run with environment variables set:");
    console.error(
      "  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/storage-hygiene.ts"
    );
    process.exit(1);
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// STORAGE FILE EXTRACTION
// ============================================================================

/**
 * Extract storage path from a Supabase storage URL
 *
 * Supabase URLs: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Match Supabase storage URL pattern
  const storagePattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
  const match = url.match(storagePattern);

  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Extract paths from various attachment formats
 */
function extractAttachmentPaths(attachments: unknown): string[] {
  const paths: string[] = [];

  if (!attachments) return paths;

  // Handle array of strings
  if (Array.isArray(attachments)) {
    for (const item of attachments) {
      if (typeof item === "string") {
        const path = extractStoragePath(item);
        if (path) paths.push(path);
      } else if (item && typeof item === "object" && "src" in item) {
        const path = extractStoragePath((item as { src: string }).src);
        if (path) paths.push(path);
      }
    }
  }

  // Handle single object with src
  if (typeof attachments === "object" && attachments !== null && "src" in attachments) {
    const path = extractStoragePath((attachments as { src: string }).src);
    if (path) paths.push(path);
  }

  return paths;
}

// ============================================================================
// DATABASE QUERIES
// ============================================================================

/**
 * Get all file paths referenced in the database
 */
async function getReferencedPaths(
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<{ paths: Set<string>; errors: string[] }> {
  const paths = new Set<string>();
  const errors: string[] = [];

  for (const { table, column, type } of STORAGE_COLUMNS) {
    try {
      const { data, error } = await supabase.from(table).select(column).not(column, "is", null);

      if (error) {
        errors.push(`Failed to query ${table}.${column}: ${error.message}`);
        continue;
      }

      if (!data) continue;

      for (const row of data) {
        const value = row[column];

        if (type === "text") {
          const path = extractStoragePath(value as string);
          if (path) paths.add(path);
        } else {
          // array or jsonb
          const extracted = extractAttachmentPaths(value);
          for (const path of extracted) {
            paths.add(path);
          }
        }
      }

      console.log(`  ✓ ${table}.${column}: found ${data.length} rows`);
    } catch (err) {
      errors.push(`Error querying ${table}.${column}: ${err}`);
    }
  }

  return { paths, errors };
}

// ============================================================================
// STORAGE QUERIES
// ============================================================================

/**
 * List all files in the storage bucket
 */
async function listStorageFiles(
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<{ files: StorageFile[]; errors: string[] }> {
  const files: StorageFile[] = [];
  const errors: string[] = [];

  try {
    // List files in root and subdirectories
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
      limit: 10000, // Adjust based on expected file count
      offset: 0,
    });

    if (error) {
      errors.push(`Failed to list storage files: ${error.message}`);
      return { files, errors };
    }

    if (data) {
      // Filter out folders (they have no id)
      const actualFiles = data.filter((item) => item.id);
      files.push(...(actualFiles as StorageFile[]));
    }

    console.log(`  ✓ Storage bucket "${BUCKET_NAME}": found ${files.length} files`);
  } catch (err) {
    errors.push(`Error listing storage: ${err}`);
  }

  return { files, errors };
}

// ============================================================================
// ORPHAN DETECTION
// ============================================================================

/**
 * Compare storage files against database references
 */
function findOrphans(
  storageFiles: StorageFile[],
  referencedPaths: Set<string>
): {
  orphaned: string[];
  missing: string[];
} {
  const storagePathSet = new Set(storageFiles.map((f) => f.name));

  // Files in storage but not in database
  const orphaned = storageFiles.map((f) => f.name).filter((path) => !referencedPaths.has(path));

  // Files referenced in database but not in storage
  const missing = Array.from(referencedPaths).filter((path) => !storagePathSet.has(path));

  return { orphaned, missing };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Delete orphaned files from storage
 */
async function deleteOrphans(
  supabase: ReturnType<typeof getSupabaseClient>,
  paths: string[]
): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];

  if (paths.length === 0) {
    return { deleted, errors };
  }

  // Delete in batches of 100
  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);

    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(batch);

      if (error) {
        errors.push(`Failed to delete batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        deleted.push(...batch);
      }
    } catch (err) {
      errors.push(`Error deleting batch ${i / batchSize + 1}: ${err}`);
    }
  }

  return { deleted, errors };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes("--delete");
  const jsonOutput = args.includes("--json");

  if (!jsonOutput) {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║             STORAGE HYGIENE AUDIT                              ║");
    console.log("║  Identifies orphaned files in Supabase Storage                 ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Mode: ${shouldDelete ? "DELETE" : "REPORT ONLY"}`);
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log("");
  }

  const supabase = getSupabaseClient();

  // Initialize result
  const result: AuditResult = {
    timestamp: new Date().toISOString(),
    bucket: BUCKET_NAME,
    totalFilesInStorage: 0,
    totalReferencesInDb: 0,
    orphanedFiles: [],
    orphanedCount: 0,
    orphanedSizeBytes: 0,
    referencedButMissing: [],
    missingCount: 0,
    deletedFiles: [],
    deletedCount: 0,
    errors: [],
  };

  // Step 1: Get database references
  if (!jsonOutput) console.log("📊 Scanning database for file references...");
  const { paths: referencedPaths, errors: dbErrors } = await getReferencedPaths(supabase);
  result.totalReferencesInDb = referencedPaths.size;
  result.errors.push(...dbErrors);

  // Step 2: List storage files
  if (!jsonOutput) console.log("\n📁 Listing storage files...");
  const { files: storageFiles, errors: storageErrors } = await listStorageFiles(supabase);
  result.totalFilesInStorage = storageFiles.length;
  result.errors.push(...storageErrors);

  // Step 3: Find orphans
  if (!jsonOutput) console.log("\n🔍 Comparing storage vs database...");
  const { orphaned, missing } = findOrphans(storageFiles, referencedPaths);
  result.orphanedFiles = orphaned;
  result.orphanedCount = orphaned.length;
  result.referencedButMissing = missing;
  result.missingCount = missing.length;

  // Step 4: Delete if requested
  if (shouldDelete && orphaned.length > 0) {
    if (!jsonOutput) console.log("\n🗑️ Deleting orphaned files...");
    const { deleted, errors: deleteErrors } = await deleteOrphans(supabase, orphaned);
    result.deletedFiles = deleted;
    result.deletedCount = deleted.length;
    result.errors.push(...deleteErrors);
  }

  // Output results
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("                         AUDIT RESULTS");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("");
    console.log(`  Files in storage:       ${result.totalFilesInStorage}`);
    console.log(`  References in database: ${result.totalReferencesInDb}`);
    console.log("");
    console.log(`  🔴 Orphaned files:      ${result.orphanedCount}`);
    console.log(`  🟡 Missing from storage: ${result.missingCount}`);
    console.log("");

    if (result.orphanedCount > 0) {
      console.log("  Orphaned files (not referenced in DB):");
      for (const file of result.orphanedFiles.slice(0, 10)) {
        console.log(`    - ${file}`);
      }
      if (result.orphanedCount > 10) {
        console.log(`    ... and ${result.orphanedCount - 10} more`);
      }
      console.log("");
    }

    if (result.missingCount > 0) {
      console.log("  ⚠️ Missing files (referenced in DB but not in storage):");
      for (const file of result.referencedButMissing.slice(0, 10)) {
        console.log(`    - ${file}`);
      }
      if (result.missingCount > 10) {
        console.log(`    ... and ${result.missingCount - 10} more`);
      }
      console.log("");
    }

    if (shouldDelete) {
      console.log(`  ✅ Deleted: ${result.deletedCount} files`);
    } else if (result.orphanedCount > 0) {
      console.log("  💡 To delete orphaned files, run with --delete flag:");
      console.log("     npx tsx scripts/storage-hygiene.ts --delete");
    }

    if (result.errors.length > 0) {
      console.log("\n  ❌ Errors encountered:");
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }

    console.log("");
    console.log("═══════════════════════════════════════════════════════════════════");
  }

  // Exit with error code if orphans found (useful for CI/CD)
  if (result.orphanedCount > 0 || result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
