import type { DataProvider, RaRecord } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import {
  applyDataQualityTransformations,
  validateTransformedContacts,
  isContactWithoutContactInfo,
} from "./contactImport.logic";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * PERF-002 FIX: Simple concurrency limiter
 * Prevents 100+ simultaneous requests that overwhelm the backend
 */
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 10
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task()
      .then((value) => {
        results.push({ status: "fulfilled", value });
      })
      .catch((reason) => {
        results.push({ status: "rejected", reason });
      })
      .finally(() => {
        executing.splice(executing.indexOf(p), 1);
      });

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// Re-export types from centralized types file for backward compatibility
export type {
  ContactImportSchema,
  DataQualityDecisions,
  FieldError,
  ImportError,
  ImportResult,
  ImportOptions,
} from "./contactImport.types";

import type {
  ContactImportSchema,
  ImportError,
  ImportOptions,
  ImportResult,
  FieldError,
} from "./contactImport.types";

export function useContactImport() {
  const today = new Date().toISOString();
  const { data: identity } = useGetIdentity();
  const dataProvider = useDataProvider();

  // organization cache to avoid creating the same organization multiple times and costly roundtrips
  // Cache is dependent of dataProvider, so it's safe to use it as a dependency
  const organizationsCache = useMemo(
    () => new Map<string, Organization>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataProvider]
  );
  const getOrganizations = useCallback(
    async (names: string[], preview = false) =>
      preview
        ? validateOrganizationNames(names)
        : fetchRecordsWithCache<Organization>(
            "organizations",
            organizationsCache,
            names,
            (name) => ({
              name,
              created_at: new Date().toISOString(),
              sales_id: identity?.id,
            }),
            dataProvider
          ),
    [organizationsCache, identity?.id, dataProvider]
  );

  // Tags cache to avoid creating the same tag multiple times and costly roundtrips
  // Cache is dependent of dataProvider, so it's safe to use it as a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            dataProvider
          ),
    [tagsCache, dataProvider]
  );

  const processBatch = useCallback(
    async (batch: ContactImportSchema[], options: ImportOptions = {}): Promise<ImportResult> => {
      const { preview = false, onProgress, startingRow = 1, dataQualityDecisions } = options;
      const startTime = new Date();
      const errors: ImportError[] = [];
      let successCount = 0;
      let skippedCount = 0;
      const totalProcessed = batch.length;

      // Report progress if callback provided
      if (onProgress) {
        onProgress(0, totalProcessed);
      }

      // 1. Apply data quality transformations based on user decisions
      const { transformedContacts } = applyDataQualityTransformations(batch, dataQualityDecisions);

      // 2. Validate the entire transformed batch
      const { successful, failed } = validateTransformedContacts(transformedContacts);

      // Immediately add validation failures to the error list
      failed.forEach((failure) => {
        errors.push({
          row: startingRow + failure.originalIndex,
          data: failure.data,
          errors: failure.errors,
        });
      });

      // 2.5. Filter out contacts without contact info if user hasn't approved them
      let contactsToProcess = successful;
      if (!dataQualityDecisions?.importContactsWithoutContactInfo) {
        const skippedContacts = new Set<number>();
        contactsToProcess = successful.filter((contact) => {
          if (isContactWithoutContactInfo(contact)) {
            skippedContacts.add(contact.originalIndex);
            return false;
          }
          return true;
        });
        skippedCount = skippedContacts.size;
      }

      // 3. Fetch related records (organizations, tags) for valid contacts only
      const [organizations, tags] = await Promise.all([
        getOrganizations(
          contactsToProcess
            .map((contact) => contact.organization_name?.trim())
            .filter((name): name is string => !!name),
          preview
        ),
        getTags(
          contactsToProcess.flatMap((contact) => parseTags(contact.tags)),
          preview
        ),
      ]);

      // 4. Process all valid contacts with concurrency limit (PERF-002 FIX)
      const contactTasks = contactsToProcess.map((contactData, index) => async () => {
        const rowNumber = startingRow + contactData.originalIndex;
        const rowErrors: FieldError[] = [];

        const {
          first_name,
          last_name,
          gender,
          title,
          email_work,
          email_home,
          email_other,
          phone_work,
          phone_home,
          phone_other,
          first_seen,
          last_seen,
          organization_name,
          tags: tagNames,
          linkedin_url,
          notes,
        } = contactData;

        // Organization logic check
        const trimmedOrgName = String(organization_name || "").trim();
        const organization = organizations.get(trimmedOrgName);
        if (trimmedOrgName && !organization?.id && !preview) {
          rowErrors.push({
            field: "organization_name",
            message: `Failed to find or create organization "${trimmedOrgName}"`,
            value: trimmedOrgName,
          });
        }

        if (rowErrors.length > 0) {
          return {
            rowNumber,
            success: false,
            errors: rowErrors,
            data: contactData,
          };
        }

        try {
          const email = [
            { value: email_work, type: "work" as const },
            { value: email_home, type: "home" as const },
            { value: email_other, type: "other" as const },
          ].filter(({ value }) => value);

          const phone = [
            { value: phone_work, type: "work" as const },
            { value: phone_home, type: "home" as const },
            { value: phone_other, type: "other" as const },
          ].filter(({ value }) => value);

          const tagList = parseTags(tagNames)
            .map((name) => tags.get(name))
            .filter((tag): tag is Tag => !!tag);

          const contactPayload = {
            first_name,
            last_name,
            gender,
            title,
            email,
            phone,
            first_seen: first_seen ? (parseDateSafely(first_seen)?.toISOString() ?? today) : today,
            last_seen: last_seen ? (parseDateSafely(last_seen)?.toISOString() ?? today) : today,
            tags: preview ? [] : tagList.map((tag) => tag.id),
            sales_id: identity?.id,
            linkedin_url,
            notes,
            organization_id: organization?.id,
            avatar: undefined,
          };

          if (preview) {
            await dataProvider.create("contacts", {
              data: contactPayload,
              meta: { dryRun: true },
            });
          } else {
            await dataProvider.create("contacts", {
              data: contactPayload,
            });
          }

          return { rowNumber, success: true };
        } catch (error: unknown) {
          // Catch errors from dataProvider (e.g., unique constraints)
          const finalErrors: FieldError[] = [];
          if (error instanceof ZodError) {
            error.issues.forEach((issue) => {
              finalErrors.push({
                field: issue.path.join("."),
                message: issue.message,
              });
            });
          } else if (typeof error === "object" && error !== null && "body" in error) {
            const errorBody = error.body as Record<string, unknown> | undefined;
            if (errorBody?.errors && typeof errorBody.errors === "object") {
              for (const [field, message] of Object.entries(errorBody.errors)) {
                finalErrors.push({ field, message: String(message) });
              }
            }
          } else {
            finalErrors.push({
              field: "general",
              message:
                error instanceof Error ? error.message : "Unknown error during record creation",
            });
          }
          return { rowNumber, success: false, errors: finalErrors, data: contactData };
        } finally {
          if (onProgress) {
            onProgress(index + 1 + failed.length, totalProcessed);
          }
        }
      });
      const results = await withConcurrencyLimit(contactTasks, 10); // Max 10 concurrent

      // 5. Tally results
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const value = result.value;
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
          // This case is less likely now but kept for safety
          const reason = result.reason;
          errors.push({
            row: 0, // Cannot determine row number here
            data: {},
            errors: [
              {
                field: "processing",
                message: reason instanceof Error ? reason.message : "Unknown processing error",
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

      return finalResult;
    },
    [dataProvider, getOrganizations, getTags, identity?.id, today]
  );

  return processBatch;
}

const fetchRecordsWithCache = async function <T extends RaRecord>(
  resource: string,
  cache: Map<string, T>,
  names: string[],
  getCreateData: (name: string) => Partial<T>,
  dataProvider: DataProvider
) {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const uncachedRecordNames = trimmedNames.filter((name) => !cache.has(name));

  // check the backend for existing records
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

  // Create missing records - fail-fast on any error
  // PERF-002 FIX: Use concurrency limit to prevent overwhelming backend
  try {
    const tasks = uncachedRecordNames
      .filter((name) => !cache.has(name))
      .map((name) => async () => {
        const response = await dataProvider.create(resource, {
          data: getCreateData(name),
        });
        cache.set(name, response.data);
      });
    const results = await withConcurrencyLimit(tasks, 10);
    // Check for any failures and re-throw the first error for fail-fast behavior
    const firstFailure = results.find((r) => r.status === "rejected");
    if (firstFailure && firstFailure.status === "rejected") {
      throw firstFailure.reason;
    }
  } catch (error: unknown) {
    logger.error(`Failed to create ${resource} records`, error, {
      feature: "useContactImport",
      resource,
    });
    throw error; // Re-throw for fail-fast behavior
  }

  // now all records are in cache, return a map of all records
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
 * Validate organization names for preview mode
 * Returns a Map similar to fetchRecordsWithCache but without database operations
 */
const validateOrganizationNames = async (names: string[]): Promise<Map<string, Organization>> => {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const result = new Map<string, Organization>();

  // In preview mode, we just create placeholder organizations
  // to indicate they would be created during actual import
  for (const name of trimmedNames) {
    result.set(name, {
      id: `preview-org-${name}`,
      name,
      created_at: new Date().toISOString(),
    } as Organization);
  }

  return result;
};

/**
 * Validate tag names for preview mode
 * Returns a Map similar to fetchRecordsWithCache but without database operations
 */
const validateTagNames = async (names: string[]): Promise<Map<string, Tag>> => {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const result = new Map<string, Tag>();

  // In preview mode, we just create placeholder tags
  // to indicate they would be created during actual import
  for (const name of trimmedNames) {
    result.set(name, {
      id: `preview-tag-${name}`,
      name,
      color: "gray",
    } as Tag);
  }

  return result;
};
