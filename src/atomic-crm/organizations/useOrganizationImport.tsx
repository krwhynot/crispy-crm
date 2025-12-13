import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Tag } from "../types";
import { ZodError } from "zod";
import {
  applyDataQualityTransformations,
  validateTransformedOrganizations,
  type DataQualityDecisions as LogicDataQualityDecisions,
  type OrganizationImportSchema as LogicOrganizationImportSchema,
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
  value?: string | number | boolean | null;
}

export interface ImportError {
  row: number;
  data: OrganizationImportSchema;
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
  dataQualityDecisions?: DataQualityDecisions;
}

export function useOrganizationImport() {
  const today = new Date().toISOString();
  const { data: identity } = useGetIdentity();
  const dataProvider = useDataProvider();

  // Tags cache to avoid creating the same tag multiple times
  const tagsCache = useMemo(() => new Map<string, Tag>(), []);

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
            dataProvider
          ),
    [tagsCache, dataProvider]
  );

  const processBatch = useCallback(
    async (
      batch: OrganizationImportSchema[],
      options: ImportOptions = {}
    ): Promise<ImportResult> => {
      const { preview = false, onProgress, startingRow = 1, dataQualityDecisions } = options;
      console.log("processBatch called with:", {
        batchSize: batch.length,
        preview,
        startingRow,
        dataQualityDecisions,
      });
      const startTime = new Date();
      const errors: ImportError[] = [];
      let successCount = 0;
      const skippedCount = 0;
      const totalProcessed = batch.length;

      // Report progress if callback provided
      if (onProgress) {
        onProgress(0, totalProcessed);
      }

      // 1. Apply data quality transformations based on user decisions
      const { transformedOrganizations } = applyDataQualityTransformations(
        batch,
        dataQualityDecisions
      );

      // 2. Validate the entire transformed batch using business logic
      const { successful, failed } = validateTransformedOrganizations(transformedOrganizations);

      // Immediately add validation failures to the error list
      failed.forEach((failure) => {
        errors.push({
          row: startingRow + failure.originalIndex,
          data: failure.data,
          errors: failure.errors,
        });
      });

      // 3. Fetch related records (tags) for valid organizations only
      const tags = await getTags(
        successful.flatMap((org) => parseTags(org.tags)),
        preview
      );

      // 4. Process all valid organizations with Promise.allSettled
      const results = await Promise.allSettled(
        successful.map(async (orgData, index) => {
          const rowNumber = startingRow + orgData.originalIndex;
          const rowErrors: FieldError[] = [];

          const {
            name,
            organization_type,
            priority,
            segment_id,
            linkedin_url,
            website,
            phone,
            address,
            postal_code,
            city,
            state,
            description,
            tags: tagNames,
            sales_id,
          } = orgData;

          // Note: Validation already done by validateTransformedOrganizations
          // This section is for runtime errors from the data provider

          if (rowErrors.length > 0) {
            return {
              rowNumber,
              success: false,
              errors: rowErrors,
              data: orgData,
            };
          }

          try {
            const _tagList = parseTags(tagNames || "")
              .map((name) => tags.get(name))
              .filter((tag): tag is Tag => !!tag);

            const organizationPayload = {
              name,
              organization_type: organization_type || "prospect",
              priority: priority || "C",
              segment_id: segment_id || null,
              linkedin_url: linkedin_url || null,
              website: website || null,
              phone: phone || null,
              address: address || null,
              postal_code: postal_code || null,
              city: city || null,
              state: state || null,
              description: description || null,
              // tags field should be a comma-separated string for validation, not an array
              // The actual tag relationships are handled by the data provider separately
              tags: tagNames || undefined,
              // Use sales_id from CSV (already resolved to numeric ID) or fallback to current user
              sales_id: sales_id || identity?.id,
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
          } catch (error: unknown) {
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
              onProgress(index + 1 + failed.length, totalProcessed);
            }
          }
        })
      );

      // 5. Tally results
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const value = result.value as { success: boolean; rowNumber: number; errors?: FieldError[]; data?: OrganizationImportSchema };
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
          // This promise was rejected. Get the original data for correct row attribution.
          const failedOrgData = successful[index];
          const rowNumber = startingRow + failedOrgData.originalIndex;
          errors.push({
            row: rowNumber,
            data: failedOrgData,
            errors: [
              {
                field: "processing",
                message: result.reason?.message || "Unknown processing error",
              },
            ],
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
    [dataProvider, getTags, identity?.id, today]
  );

  return processBatch;
}

const fetchRecordsWithCache = async function <T>(
  resource: string,
  cache: Map<string, T>,
  names: string[],
  getCreateData: (name: string) => Partial<T>,
  dataProvider: DataProvider
) {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const uncachedRecordNames = trimmedNames.filter((name) => !cache.has(name));

  if (uncachedRecordNames.length > 0) {
    const response = await dataProvider.getList(resource, {
      filter: {
        "name@in": `(${uncachedRecordNames.map((name) => `"${name}"`).join(",")})`,
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
    })
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
