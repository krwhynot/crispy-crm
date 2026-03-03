import { HttpError } from "react-admin";
import { supabase } from "../supabase";
import type { RAFile } from "@/atomic-crm/types";
import { logger } from "@/lib/logger";

/** Allowlisted MIME types mapped to valid file extensions. */
export const ALLOWED_MIME_TO_EXT: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "image/svg+xml": ["svg"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "text/plain": ["txt"],
  "text/csv": ["csv"],
} as const;

const ATTACHMENT_MIME_TYPES = new Set(Object.keys(ALLOWED_MIME_TO_EXT));

// Type for file metadata returned by Supabase Storage
interface StorageFileObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * StorageService handles all file upload and storage operations
 * Following Engineering Constitution principle #1: Single responsibility
 *
 * This service consolidates all storage logic previously scattered
 * in the monolithic unifiedDataProvider (was ~200 lines)
 */
export class StorageService {
  /**
   * Validate that a blob has an allowed MIME type and consistent extension.
   * Throws HttpError(415) on rejection.
   */
  private validateUpload(blob: Blob | File, context: string): void {
    if (!ATTACHMENT_MIME_TYPES.has(blob.type)) {
      throw new HttpError(`Unsupported file type "${blob.type}" for ${context}`, 415);
    }

    // If the blob is a File with a name, verify extension matches MIME
    if ("name" in blob && typeof (blob as File).name === "string") {
      const name = (blob as File).name;
      const ext = name.split(".").pop()?.toLowerCase();
      const allowedExts = ALLOWED_MIME_TO_EXT[blob.type];
      if (ext && allowedExts && !allowedExts.includes(ext)) {
        throw new HttpError(
          `MIME/extension mismatch: type "${blob.type}" does not match extension ".${ext}"`,
          415
        );
      }
    }
  }

  /**
   * Internal helper for uploading files to storage buckets
   * @param fi - RAFile object containing file data
   * @returns Updated RAFile object with path and public URL
   */
  async uploadToBucket(fi: RAFile): Promise<RAFile> {
    if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
      // Check if file already exists in the bucket before re-uploading
      if (fi.path) {
        const fileExists = await this.exists("attachments", fi.path);
        if (fileExists) {
          // File already exists - return with public URL
          const publicUrl = this.getPublicUrl("attachments", fi.path);
          return {
            ...fi,
            src: publicUrl,
          };
        }
        // File doesn't exist - proceed with upload
      }
    }

    const dataContent = fi.src ? await fetch(fi.src).then((res) => res.blob()) : fi.rawFile;

    if (dataContent) {
      this.validateUpload(dataContent, "attachments");

      // When content comes from fetch (blob URL), also validate rawFile extension against MIME
      if (fi.rawFile?.name && !("name" in dataContent && (dataContent as File).name)) {
        const ext = fi.rawFile.name.split(".").pop()?.toLowerCase();
        const allowedExts = ALLOWED_MIME_TO_EXT[dataContent.type];
        if (ext && allowedExts && !allowedExts.includes(ext)) {
          throw new HttpError(
            `MIME/extension mismatch: type "${dataContent.type}" does not match extension ".${ext}"`,
            415
          );
        }
      }
    }

    const file = fi.rawFile;
    const rawExt = file?.name?.split(".").pop() ?? "bin";
    const safeExt = rawExt
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
      .slice(0, 10);
    const fileName = `${crypto.randomUUID()}.${safeExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data: _data } = await supabase.storage
      .from("attachments")
      .upload(filePath, dataContent);

    if (uploadError) {
      logger.error("Upload error", uploadError, {
        feature: "StorageService",
        method: "uploadToBucket",
      });
      throw new HttpError("Failed to upload attachment", 500);
    }

    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath);

    return {
      ...fi,
      path: filePath,
      src: urlData.publicUrl,
    };
  }

  /**
   * Upload a file to Supabase storage with validation and error handling
   * @param bucket The storage bucket name
   * @param path The file path within the bucket
   * @param file The file to upload
   * @returns Upload result with path information
   */
  async upload(bucket: string, path: string, file: File | Blob): Promise<{ path: string }> {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new HttpError("File size exceeds 10MB limit", 413);
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      logger.error("Upload failed", error, {
        feature: "StorageService",
        method: "upload",
        bucket,
        path,
      });
      throw new HttpError(`Upload failed: ${error.message}`, 500);
    }

    return data;
  }

  /**
   * Get public URL for a file
   * @param bucket The storage bucket name
   * @param path The file path within the bucket
   * @returns The public URL for the file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Remove files from storage
   * @param bucket The storage bucket name
   * @param paths Array of file paths to remove
   */
  async remove(bucket: string, paths: string[]): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      logger.error("Remove failed", error, {
        feature: "StorageService",
        method: "remove",
        bucket,
        pathCount: paths.length,
      });
      throw new HttpError(`Remove failed: ${error.message}`, 500);
    }
  }

  /**
   * List files in a storage bucket
   * @param bucket The storage bucket name
   * @param path Optional path prefix to filter files
   * @returns Array of file metadata
   */
  async list(bucket: string, path?: string): Promise<StorageFileObject[]> {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      logger.error("List failed", error, {
        feature: "StorageService",
        method: "list",
        bucket,
        path,
      });
      throw new HttpError(`List failed: ${error.message}`, 500);
    }

    return data || [];
  }

  /**
   * Check if a file exists in storage
   * @param bucket The storage bucket name
   * @param path The file path to check
   * @returns True if file exists, false otherwise
   */
  async exists(bucket: string, path: string): Promise<boolean> {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      // Try to fetch the URL to verify it exists
      const response = await fetch(data.publicUrl, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      // Network or storage errors during existence check - file assumed not to exist
      logger.debug("File existence check failed", {
        feature: "StorageService",
        method: "exists",
        bucket,
        path,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
