/**
 * Storage Extension Layer
 *
 * Provides file storage operations via Supabase Storage API.
 * Includes upload, download, delete, and list functionality with validation.
 *
 * Methods (4 total):
 * - upload: Upload file with size validation
 * - getPublicUrl: Get public URL for stored file
 * - remove: Delete files from storage
 * - list: List files in bucket
 *
 * @module providers/supabase/extensions/storageExtension
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FileObject } from "@supabase/storage-js";
import { logger } from "@/lib/logger";

/**
 * Error logging helper matching unifiedDataProvider pattern
 *
 * Uses centralized logger for Sentry integration and structured output.
 *
 * @param method - The method name (e.g., "storage.upload")
 * @param resource - Resource or bucket name being accessed
 * @param params - Parameters passed to the method
 * @param error - The error that occurred
 */
function logError(
  method: string,
  resource: string,
  params: Record<string, unknown>,
  error: unknown
): void {
  logger.error(`[DataProvider ${method}] Error in ${resource}`, error, {
    method,
    resource,
    params,
  });
}

/**
 * Storage extension methods interface
 */
export interface StorageExtension {
  storage: {
    upload(bucket: string, path: string, file: File | Blob): Promise<{ path: string }>;
    getPublicUrl(bucket: string, path: string): string;
    remove(bucket: string, paths: string[]): Promise<void>;
    list(bucket: string, path?: string): Promise<FileObject[]>;
  };
}

/**
 * Create Storage Extension
 *
 * Returns storage methods with validation and error handling.
 *
 * @param supabaseClient - Supabase client for storage access
 * @returns Storage extension methods
 */
export function createStorageExtension(supabaseClient: SupabaseClient): StorageExtension {
  return {
    /**
     * Storage operations for file handling
     *
     * Provides consistent file upload/download with validation and error handling.
     * All storage methods use the Supabase Storage API directly.
     */
    storage: {
      /**
       * Upload file to Supabase storage with size validation
       *
       * @param bucket - The storage bucket name
       * @param path - The file path within the bucket
       * @param file - The file to upload (File or Blob)
       * @returns Upload result with path information
       *
       * @throws Error if file size exceeds 10MB limit
       * @throws Error if upload fails
       */
      upload: async (
        bucket: string,
        path: string,
        file: File | Blob
      ): Promise<{ path: string }> => {
        try {
          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            throw new Error("File size exceeds 10MB limit");
          }

          const { data, error } = await supabaseClient.storage.from(bucket).upload(path, file, {
            cacheControl: "3600",
            upsert: true,
          });

          if (error) {
            logError("storage.upload", bucket, { path, size: file.size }, error);
            throw new Error(`Upload failed: ${error.message}`);
          }

          return data;
        } catch (error: unknown) {
          logError("storage.upload", bucket, { path }, error);
          throw error;
        }
      },

      /**
       * Get public URL for a stored file
       *
       * @param bucket - The storage bucket name
       * @param path - The file path within the bucket
       * @returns The public URL for the file
       */
      getPublicUrl: (bucket: string, path: string): string => {
        const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      },

      /**
       * Remove files from storage
       *
       * @param bucket - The storage bucket name
       * @param paths - Array of file paths to remove
       *
       * @throws Error if removal fails
       */
      remove: async (bucket: string, paths: string[]): Promise<void> => {
        try {
          const { error } = await supabaseClient.storage.from(bucket).remove(paths);

          if (error) {
            logError("storage.remove", bucket, { paths }, error);
            throw new Error(`Remove failed: ${error.message}`);
          }
        } catch (error: unknown) {
          logError("storage.remove", bucket, { paths }, error);
          throw error;
        }
      },

      /**
       * List files in a storage bucket
       *
       * @param bucket - The storage bucket name
       * @param path - Optional path prefix to filter files
       * @returns Array of file metadata
       *
       * @throws Error if listing fails
       */
      list: async (bucket: string, path?: string): Promise<FileObject[]> => {
        try {
          const { data, error } = await supabaseClient.storage.from(bucket).list(path);

          if (error) {
            logError("storage.list", bucket, { data: { path } }, error);
            throw new Error(`List failed: ${error.message}`);
          }

          return (data as FileObject[]) || [];
        } catch (error: unknown) {
          logError("storage.list", bucket, { data: { path } }, error);
          throw error;
        }
      },
    },
  };
}
