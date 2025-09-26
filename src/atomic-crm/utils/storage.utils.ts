/**
 * Storage utilities for file upload and management
 *
 * Extracted from data provider for reuse in transformer registry
 * following Engineering Constitution principle #1: Single unified data provider
 */

import { supabase } from "../providers/supabase/supabase";
import type { RAFile } from "../types";

/**
 * Upload a file to Supabase Storage bucket
 *
 * Handles both blob URLs and data URLs, uploads to "attachments" bucket
 * with random filename generation and returns updated RAFile with public URL
 *
 * @param fi - RAFile object containing file data
 * @returns Updated RAFile object with path and public URL
 * @throws Error if upload fails
 */
export const uploadToBucket = async (fi: RAFile): Promise<RAFile> => {
  if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
    // Sign URL check if path exists in the bucket
    if (fi.path) {
      const { error } = await supabase.storage
        .from("attachments")
        .createSignedUrl(fi.path, 60);

      if (!error) {
        return fi;
      }
    }
  }

  const dataContent = fi.src
    ? await fetch(fi.src).then((res) => res.blob())
    : fi.rawFile;

  const file = fi.rawFile;
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, dataContent);

  if (uploadError) {
    console.error("uploadError", uploadError);
    throw new Error("Failed to upload attachment");
  }

  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);

  fi.path = filePath;
  fi.src = data.publicUrl;

  // save MIME type
  const mimeType = file.type;
  fi.type = mimeType;

  return fi;
};

/**
 * Generate public URL for a file in Supabase Storage
 *
 * @param filePath - Path to the file in the storage bucket
 * @param bucketName - Name of the storage bucket (defaults to "attachments")
 * @returns Public URL for the file
 */
export const getPublicUrl = (
  filePath: string,
  bucketName: string = "attachments"
): string => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Check if a file exists in the storage bucket
 *
 * @param filePath - Path to check in the storage bucket
 * @param bucketName - Name of the storage bucket (defaults to "attachments")
 * @returns True if file exists, false otherwise
 */
export const checkFileExists = async (
  filePath: string,
  bucketName: string = "attachments"
): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60);

  return !error;
};

/**
 * Detect MIME type from file content
 *
 * @param file - File object to analyze
 * @returns MIME type string
 */
export const detectMimeType = (file: File): string => {
  return file.type || "application/octet-stream";
};

/**
 * Validate file type based on allowed extensions
 *
 * @param fileName - Name of the file to validate
 * @param allowedExtensions - Array of allowed file extensions (with dots)
 * @returns Error message if invalid, undefined if valid
 */
export const validateFileType = (
  fileName: string,
  allowedExtensions: string[] = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
  ]
): string | undefined => {
  const fileExtension = fileName
    .toLowerCase()
    .substring(fileName.lastIndexOf("."));

  if (!allowedExtensions.includes(fileExtension)) {
    return `File type ${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(", ")}`;
  }

  return undefined;
};

/**
 * Validate file size
 *
 * @param sizeInBytes - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB (default 10MB)
 * @returns Error message if too large, undefined if valid
 */
export const validateFileSize = (
  sizeInBytes: number,
  maxSizeMB: number = 10
): string | undefined => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (sizeInBytes > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return undefined;
};

/**
 * Get file extension from filename
 *
 * @param fileName - Name of the file
 * @returns File extension including the dot, or empty string if none
 */
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.substring(lastDotIndex) : "";
};

/**
 * Generate a unique filename with original extension
 *
 * @param originalFileName - Original name of the file
 * @returns Unique filename with original extension
 */
export const generateUniqueFileName = (originalFileName: string): string => {
  const extension = getFileExtension(originalFileName);
  return `${Math.random()}${extension}`;
};

/**
 * Transform a File object to RAFile format
 *
 * @param file - File object to transform
 * @returns RAFile object with blob URL
 */
export const transformFileToRAFile = (file: File): RAFile => {
  return {
    src: URL.createObjectURL(file),
    title: file.name,
    rawFile: file,
    type: file.type,
  };
};

/**
 * Clean up blob URLs to prevent memory leaks
 *
 * @param raFile - RAFile object with blob URL to clean up
 */
export const cleanupBlobUrl = (raFile: RAFile): void => {
  if (raFile.src.startsWith("blob:")) {
    URL.revokeObjectURL(raFile.src);
  }
};

/**
 * Upload multiple files to storage
 *
 * @param files - Array of RAFile objects to upload
 * @returns Promise resolving to array of uploaded RAFile objects
 */
export const uploadMultipleFiles = async (files: RAFile[]): Promise<RAFile[]> => {
  const uploadPromises = files.map(uploadToBucket);
  return Promise.all(uploadPromises);
};