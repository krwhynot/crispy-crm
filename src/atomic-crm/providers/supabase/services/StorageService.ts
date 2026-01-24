import { HttpError } from "react-admin";
import { supabase } from "../supabase";
import type { RAFile } from "../../../types";
import { logger } from "@/lib/logger";

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
   * Internal helper for uploading files to storage buckets
   * @param fi - RAFile object containing file data
   * @returns Updated RAFile object with path and public URL
   */
  async uploadToBucket(fi: RAFile): Promise<RAFile> {
    if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
      // Sign URL check if path exists in the bucket
      if (fi.path) {
        try {
          const { data } = supabase.storage.from("attachments").getPublicUrl(fi.path);

          // If we can get a public URL, the file exists
          if (data?.publicUrl) {
            return fi;
          }
        } catch (error) {
          // File doesn't exist or check failed - proceed with upload
          // Debug level: expected flow when uploading new files
          logger.debug("File existence check failed, proceeding with upload", {
            feature: "StorageService",
            method: "uploadToBucket",
            path: fi.path,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const dataContent = fi.src ? await fetch(fi.src).then((res) => res.blob()) : fi.rawFile;

    const file = fi.rawFile;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
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
      console.error(`[StorageService] Remove failed`, error);
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
      console.error(`[StorageService] List failed`, error);
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
      console.debug("[StorageService.exists] File existence check failed", {
        bucket,
        path,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
