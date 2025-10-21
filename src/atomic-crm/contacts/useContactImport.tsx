import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";
import { mapHeadersToFields, isFullNameColumn, findCanonicalField } from "./columnAliases";
import { importContactSchema } from "../validation/contacts";
import { ZodError } from "zod";
import { applyDataQualityTransformations, validateTransformedContacts } from "./contactImport.logic";

export interface ContactImportSchema {
  first_name: string;
  last_name: string;
  gender?: string;
  title?: string;
  organization_name: string; // Primary organization (mandatory)
  email_work?: string;
  email_home?: string;
  email_other?: string;
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;
  first_seen?: string;
  last_seen?: string;
  tags?: string;
  linkedin_url?: string;
  notes?: string; // Contact notes text field
}

export interface FieldError {
  field: string;
  message: string;
  value?: any;
}

export interface ImportError {
  row: number;
  data: any;
  errors: FieldError[]; // Changed from 'reason: string' to support multiple errors
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

export interface DataQualityDecisions {
  importOrganizationsWithoutContacts: boolean;
  importContactsWithoutContactInfo: boolean;
}

export interface ImportOptions {
  preview?: boolean;  // If true, validate only without database writes
  onProgress?: (current: number, total: number) => void;  // Progress callback
  startingRow?: number;  // The absolute starting row number for this batch (1-indexed)
  dataQualityDecisions?: DataQualityDecisions;  // User decisions about data quality issues
}

export function useContactImport() {
  const today = new Date().toISOString();
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();

  // organization cache to avoid creating the same organization multiple times and costly roundtrips
  // Cache is dependent of dataProvider, so it's safe to use it as a dependency
  const organizationsCache = useMemo(
    () => new Map<string, Organization>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataProvider],
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
            dataProvider,
          ),
    [organizationsCache, identity?.id, dataProvider],
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
            dataProvider,
          ),
    [tagsCache, dataProvider],
  );

  const processBatch = useCallback(
    async (batch: ContactImportSchema[], options: ImportOptions = {}): Promise<ImportResult> => {
      const { preview = false, onProgress, startingRow = 1, dataQualityDecisions } = options;
      console.log("processBatch called with:", { batchSize: batch.length, preview, startingRow, dataQualityDecisions });
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
      failed.forEach(failure => {
        errors.push({
          row: startingRow + failure.originalIndex,
          data: failure.data,
          errors: failure.errors,
        });
      });

      // 3. Fetch related records (organizations, tags) for valid contacts only
      const [organizations, tags] = await Promise.all([
        getOrganizations(
          successful
            .map((contact) => contact.organization_name?.trim())
            .filter((name): name is string => !!name),
          preview,
        ),
        getTags(successful.flatMap((contact) => parseTags(contact.tags)), preview),
      ]);

      // 4. Process all valid contacts with Promise.allSettled
      const results = await Promise.allSettled(
        successful.map(async (contactData, index) => {
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
          const trimmedOrgName = String(organization_name || '').trim();
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
              { email: email_work, type: "Work" },
              { email: email_home, type: "Home" },
              { email: email_other, type: "Other" },
            ].filter(({ email }) => email);

            const phone = [
              { number: phone_work, type: "Work" },
              { number: phone_home, type: "Home" },
              { number: phone_other, type: "Other" },
            ].filter(({ number }) => number);

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
              first_seen: first_seen ? new Date(first_seen).toISOString() : today,
              last_seen: last_seen ? new Date(last_seen).toISOString() : today,
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
          } catch (error: any) {
            // Catch errors from dataProvider (e.g., unique constraints)
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
            return { rowNumber, success: false, errors: finalErrors, data: contactData };
          } finally {
            if (onProgress) {
              onProgress(index + 1 + failed.length, totalProcessed);
            }
          }
        }),
      );

      // 5. Tally results
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
          // This case is less likely now but kept for safety
          errors.push({
            row: 0, // Cannot determine row number here
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
    [dataProvider, getOrganizations, getTags, identity?.id, today],
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

  // check the backend for existing records
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

  // create missing records in parallel
  await Promise.all(
    uncachedRecordNames.map(async (name) => {
      if (cache.has(name)) return;
      const response = await dataProvider.create(resource, {
        data: getCreateData(name),
      });
      cache.set(name, response.data);
    }),
  );

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
