import { z } from "zod";

/**
 * Zod schema for React Admin file uploads (RAFile type)
 * Used by ImageField, FileField components
 */
export const raFileSchema = z.strictObject({
  src: z.string().url().max(2048),
  title: z.string().max(255).optional(),
  rawFile: z.instanceof(File).optional(),
});

export type RAFile = z.infer<typeof raFileSchema>;

export const optionalRaFileSchema = raFileSchema.optional().nullable();
