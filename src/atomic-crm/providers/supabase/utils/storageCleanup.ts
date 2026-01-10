/**
 * Storage Cleanup Utilities
 *
 * FIX [SF-C10]: Clean up orphaned files when records are deleted
 *
 * Problem: When a record is soft-deleted, its files remain in S3 forever.
 * This violates GDPR "Right to be Forgotten" and wastes storage costs.
 *
 * Solution: Extract file paths from URLs and delete them after archive.
 *
 * @module utils/storageCleanup
 */

import { supabase } from "../supabase";
import { devLog } from "@/lib/devLogger";

/**
 * The Supabase storage bucket name used for all attachments
 */
export const STORAGE_BUCKET = "attachments";

/**
 * Extract the file path from a Supabase storage URL
 *
 * Supabase storage URLs have this format:
 * https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * @param url - Full Supabase storage URL
 * @returns File path within the bucket, or null if not a valid storage URL
 *
 * @example
 * ```typescript
 * extractStoragePath("https://abc.supabase.co/storage/v1/object/public/attachments/0.123.jpg")
 * // Returns: "0.123.jpg"
 *
 * extractStoragePath("https://example.com/other-image.jpg")
 * // Returns: null (not a Supabase storage URL)
 * ```
 */
export function extractStoragePath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Match Supabase storage URL pattern
  // Format: .../storage/v1/object/public/<bucket>/<path>
  const storagePattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
  const match = url.match(storagePattern);

  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Extract multiple file paths from an array of URLs or JSONB attachments
 *
 * Handles various attachment formats:
 * - String array: ["url1", "url2"]
 * - Object array: [{ src: "url1" }, { src: "url2" }]
 * - JSONB with src field: { src: "url" }
 *
 * @param attachments - Array of URLs or attachment objects
 * @returns Array of valid storage paths
 */
export function extractAttachmentPaths(attachments: unknown[] | null | undefined): string[] {
  if (!attachments || !Array.isArray(attachments)) return [];

  const paths: string[] = [];

  for (const attachment of attachments) {
    let url: string | null = null;

    if (typeof attachment === "string") {
      url = attachment;
    } else if (attachment && typeof attachment === "object" && "src" in attachment) {
      url = (attachment as { src: string }).src;
    }

    const path = extractStoragePath(url);
    if (path) {
      paths.push(path);
    }
  }

  return paths;
}

/**
 * Delete files from Supabase storage
 *
 * Silently succeeds if files don't exist (idempotent).
 * Logs errors but doesn't throw (cleanup failure shouldn't block archive).
 *
 * @param paths - Array of file paths to delete
 * @returns Promise that resolves when cleanup attempt is complete
 */
export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

    if (error) {
      // Log but don't throw - cleanup failure shouldn't block the archive
      console.warn(`[StorageCleanup] Failed to delete ${paths.length} files:`, error.message);
    } else {
      devLog("StorageCleanup", `Deleted ${paths.length} files from storage`);
    }
  } catch (error: unknown) {
    console.warn(`[StorageCleanup] Unexpected error during cleanup:`, error);
  }
}

/**
 * Collect all file paths from a contact and its related records
 *
 * Fetches attachments from:
 * - activities (contact_id match)
 * - contact_notes (contact_id match)
 *
 * @param contactId - The contact ID being archived
 * @returns Array of all file paths to delete
 */
export async function collectContactFilePaths(contactId: number): Promise<string[]> {
  const paths: string[] = [];

  try {
    // Fetch activities with attachments
    const { data: activities } = await supabase
      .from("activities")
      .select("attachments")
      .eq("contact_id", contactId)
      .not("attachments", "is", null);

    if (activities) {
      for (const activity of activities) {
        paths.push(...extractAttachmentPaths(activity.attachments as unknown[]));
      }
    }

    // Fetch contact_notes with attachments
    const { data: notes } = await supabase
      .from("contact_notes")
      .select("attachments")
      .eq("contact_id", contactId)
      .not("attachments", "is", null);

    if (notes) {
      for (const note of notes) {
        paths.push(...extractAttachmentPaths(note.attachments as unknown[]));
      }
    }
  } catch (error: unknown) {
    console.warn("[StorageCleanup] Error collecting contact files:", error);
  }

  return paths;
}

/**
 * Collect all file paths from an organization and its related records
 *
 * Fetches:
 * - organization.logo_url
 * - organization_notes attachments
 * - All contacts' files (recursive via collectContactFilePaths)
 * - Opportunity notes attachments
 *
 * @param orgId - The organization ID being archived
 * @returns Array of all file paths to delete
 */
export async function collectOrganizationFilePaths(orgId: number): Promise<string[]> {
  const paths: string[] = [];

  try {
    // Get organization logo
    const { data: org } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", orgId)
      .single();

    if (org?.logo_url) {
      const logoPath = extractStoragePath(org.logo_url);
      if (logoPath) paths.push(logoPath);
    }

    // Fetch organization_notes with attachments
    const { data: orgNotes } = await supabase
      .from("organization_notes")
      .select("attachments")
      .eq("organization_id", orgId)
      .not("attachments", "is", null);

    if (orgNotes) {
      for (const note of orgNotes) {
        paths.push(...extractAttachmentPaths(note.attachments as unknown[]));
      }
    }

    // Fetch all contacts for this org (to get their files too)
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .is("deleted_at", null);

    if (contacts) {
      for (const contact of contacts) {
        const contactPaths = await collectContactFilePaths(contact.id);
        paths.push(...contactPaths);
      }
    }

    // Fetch opportunity_notes for opportunities linked to this org
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("id")
      .or(
        `customer_organization_id.eq.${orgId},principal_organization_id.eq.${orgId},distributor_organization_id.eq.${orgId}`
      )
      .is("deleted_at", null);

    if (opportunities) {
      for (const opp of opportunities) {
        const { data: oppNotes } = await supabase
          .from("opportunity_notes")
          .select("attachments")
          .eq("opportunity_id", opp.id)
          .not("attachments", "is", null);

        if (oppNotes) {
          for (const note of oppNotes) {
            paths.push(...extractAttachmentPaths(note.attachments as unknown[]));
          }
        }
      }
    }
  } catch (error: unknown) {
    console.warn("[StorageCleanup] Error collecting organization files:", error);
  }

  return paths;
}

export default {
  extractStoragePath,
  extractAttachmentPaths,
  deleteStorageFiles,
  collectContactFilePaths,
  collectOrganizationFilePaths,
  STORAGE_BUCKET,
};
