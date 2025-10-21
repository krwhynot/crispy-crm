import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Tag } from "../types";
import { ZodError } from "zod";
import {
  applyDataQualityTransformations,
  validateTransformedOrganizations,
  type DataQualityDecisions as LogicDataQualityDecisions,
  type OrganizationImportSchema as LogicOrganizationImportSchema
} from "./organizationImport.logic";

/**
 * Organization CSV import schema
 * Re-exported from business logic for consistency
 */
export type OrganizationImportSchema = LogicOrganizationImportSchema;

/**
 * Data quality decisions for organization imports
 * Re-exported from business logic for consistency
 */
export type DataQualityDecisions = LogicDataQualityDecisions;

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

export interface ImportError {
  row: number;
  data: any;
  errors: FieldError[];
}

export interface ImportResult {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportError[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface ImportOptions {
  preview?: boolean;
  onProgress?: (current: number, total: number) => void;
  startingRow?: number;
}

export function useOrganizationImport() {
  const today = new Date().toISOString();
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();

  // Tags cache to avoid creating the same tag multiple times
  const tagsCache = useMemo(() => new Map<string, Tag>(), [dataProvider]);

  const getTags = useCallback(
    async (names: string[], preview = false) =>
      preview
        ? validateTagNames(names)
        : fetchRecordsWithCache<Tag>(
            "tags",
            tagsCache,
            names,
            (name) => ({
              name,
              color: "gray",
            }),
            dataProvider,
          ),
    [tagsCache, dataProvider],
  );

  const processBatch = useCallback(
    async (batch: OrganizationImportSchema[], options: ImportOptions = {}): Promise<ImportResult> => {
      const { preview = false, onProgress, startingRow = 1 } = options;
      console.log("processBatch called with:", { batchSize: batch.length, preview, startingRow });
      const startTime = new Date();
      const errors: ImportError[] = [];
      let successCount = 0;
      let skippedCount = 0;
      const totalProcessed = batch.length;

      if (onProgress) {
        onProgress(0, totalProcessed);
      }

      // TODO: Add validation logic when organizationImport.logic.ts is provided by backend agent
      // For now, we'll do basic validation inline
      const validatedBatch = batch.map((org, index) => ({
        ...org,
        originalIndex: index,
      }));

      // Fetch related records (tags) for valid organizations
      const tags = await getTags(
        validatedBatch.flatMap((org) => parseTags(org.tags)),
        preview,
      );

      // Process all organizations with Promise.allSettled
      const results = await Promise.allSettled(
        validatedBatch.map(async (orgData, index) => {
          const rowNumber = startingRow + orgData.originalIndex;
          const rowErrors: FieldError[] = [];

          const {
            name,
            organization_type,
            priority,
            segment,
            linkedin_url,
            website,
            phone,
            address,
            postal_code,
            city,
            state,
            description,
            tags: tagNames,
          } = orgData;

          // Validate required fields
          if (!name || !String(name).trim()) {
            rowErrors.push({
              field: "name",
              message: "Organization name is required",
              value: name,
            });
          }

          if (rowErrors.length > 0) {
            return {
              rowNumber,
              success: false,
              errors: rowErrors,
              data: orgData,
            };
          }

          try {
            const tagList = parseTags(tagNames)
              .map((name) => tags.get(name))
              .filter((tag): tag is Tag => !!tag);

            const organizationPayload = {
              name,
              organization_type: organization_type || "unknown",
              priority: priority || "C",
              segment_id: segment || null, // TODO: Map segment name to segment_id
              linkedin_url: linkedin_url || null,
              website: website || null,
              phone: phone || null,
              address: address || null,
              postal_code: postal_code || null,
              city: city || null,
              state: state || null,
              description: description || null,
              tags: preview ? [] : tagList.map((tag) => tag.id),
              sales_id: identity?.id,
              created_at: today,
            };

            if (preview) {
              // Dry run validation without actual database write
              await dataProvider.create("organizations", {
                data: organizationPayload,
                meta: { dryRun: true },
              });
            } else {
              await dataProvider.create("organizations", {
                data: organizationPayload,
              });
            }

            return { rowNumber, success: true };
          } catch (error: any) {
            const finalErrors: FieldError[] = [];
            if (error instanceof ZodError) {
              error.issues.forEach((issue) => {
                finalErrors.push({
                  field: issue.path.join("."),
                  message: issue.message,
                });
              });
            } else if (error.body?.errors) {
              for (const [field, message] of Object.entries(error.body.errors)) {
                finalErrors.push({ field, message: String(message) });
              }
            } else {
              finalErrors.push({
                field: "general",
                message: error.message || "Unknown error during record creation",
              });
            }
            return { rowNumber, success: false, errors: finalErrors, data: orgData };
          } finally {
            if (onProgress) {
              onProgress(index + 1, totalProcessed);
            }
          }
        }),
      );

      // Tally results
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const value = result.value as any;
          if (value.success) {
            successCount++;
          } else {
            errors.push({
              row: value.rowNumber,
              data: value.data,
              errors: value.errors,
            });
          }
        } else {
          errors.push({
            row: 0,
            data: {},
            errors: [{ field: "processing", message: result.reason?.message || "Unknown processing error" }],
          });
        }
      });

      const endTime = new Date();
      const finalResult = {
        totalProcessed,
        successCount,
        skippedCount,
        failedCount: errors.length,
        errors,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
      };

      console.log("processBatch returning:", finalResult);
      return finalResult;
    },
    [dataProvider, getTags, identity?.id, today],
  );

  return processBatch;
}

const fetchRecordsWithCache = async function <T>(
  resource: string,
  cache: Map<string, T>,
  names: string[],
  getCreateData: (name: string) => Partial<T>,
  dataProvider: DataProvider,
) {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const uncachedRecordNames = trimmedNames.filter((name) => !cache.has(name));

  if (uncachedRecordNames.length > 0) {
    const response = await dataProvider.getList(resource, {
      filter: {
        "name@in": `(${uncachedRecordNames
          .map((name) => `"${name}"`)
          .join(",")})`,
      },
      pagination: { page: 1, perPage: trimmedNames.length },
      sort: { field: "id", order: "ASC" },
    });
    for (const record of response.data) {
      cache.set(record.name.trim(), record);
    }
  }

  await Promise.all(
    uncachedRecordNames.map(async (name) => {
      if (cache.has(name)) return;
      const response = await dataProvider.create(resource, {
        data: getCreateData(name),
      });
      cache.set(name, response.data);
    }),
  );

  return trimmedNames.reduce((acc, name) => {
    acc.set(name, cache.get(name) as T);
    return acc;
  }, new Map<string, T>());
};

const parseTags = (tags: string) =>
  tags
    ?.split(",")
    ?.map((tag: string) => tag.trim())
    ?.filter((tag: string) => tag) ?? [];

/**
 * Validate tag names for preview mode
 */
const validateTagNames = async (names: string[]): Promise<Map<string, Tag>> => {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const result = new Map<string, Tag>();

  for (const name of trimmedNames) {
    result.set(name, {
      id: `preview-tag-${name}`,
      name,
      color: "gray",
    } as Tag);
  }

  return result;
};
