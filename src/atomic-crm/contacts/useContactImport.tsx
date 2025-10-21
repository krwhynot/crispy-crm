import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";
import { mapHeadersToFields, isFullNameColumn, findCanonicalField } from "./columnAliases";
import { importContactSchema } from "../validation/contacts";
import { ZodError } from "zod";

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

export interface ImportOptions {
  preview?: boolean;  // If true, validate only without database writes
  onProgress?: (current: number, total: number) => void;  // Progress callback
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
      const { preview = false, onProgress } = options;
      console.log("processBatch called with:", { batchSize: batch.length, preview, options });
      const startTime = new Date();
      const errors: ImportError[] = [];
      let successCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const totalProcessed = batch.length;
      // Report progress if callback provided
      if (onProgress) {
        onProgress(0, totalProcessed);
      }

      const [organizations, tags] = await Promise.all([
        getOrganizations(
          batch
            .map((contact) => contact.organization_name?.trim())
            .filter((name) => name),
          preview,
        ),
        getTags(batch.flatMap((batch) => parseTags(batch.tags)), preview),
      ]);

      // Process all contacts with Promise.allSettled for better error tracking
      const results = await Promise.allSettled(
        batch.map(async (contactData, index) => {
          const rowNumber = index + 1;
          const rowErrors: FieldError[] = [];

          // 1. Validate with Zod schema first to catch ALL format/presence errors
          const validationResult = importContactSchema.safeParse(contactData);
          if (!validationResult.success) {
            validationResult.error.issues.forEach((issue) => {
              const fieldPath = issue.path.join(".");
              const fieldValue = issue.path.reduce((obj: any, key) => obj?.[key], contactData);
              rowErrors.push({
                field: fieldPath,
                message: issue.message,
                value: fieldValue,
              });
            });
          }

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

          // 2. Perform logic-based validation (e.g., organization existence)
          const trimmedOrgName = organization_name?.trim();
          if (trimmedOrgName) {
            if (preview) {
              if (!organizations.has(trimmedOrgName)) {
                rowErrors.push({
                  field: "organization_name",
                  message: `Organization "${trimmedOrgName}" would need to be created`,
                  value: trimmedOrgName,
                });
              }
            } else {
              const organization = organizations.get(trimmedOrgName);
              if (!organization?.id) {
                rowErrors.push({
                  field: "organization_name",
                  message: `Failed to find or create organization "${trimmedOrgName}"`,
                  value: trimmedOrgName,
                });
              }
            }
          }

          // 3. If any errors were found, bail early and report ALL of them
          if (rowErrors.length > 0) {
            return {
              rowNumber,
              success: false,
              errors: rowErrors,
              data: contactData,
            };
          }

          // 4. If all validations pass, proceed with creating the payload
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

            const organization = organizations.get(trimmedOrgName);

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
            // 5. Catch errors from dataProvider (e.g., unique constraints, additional validation)
            const finalErrors: FieldError[] = [];

            if (error instanceof ZodError) {
              error.issues.forEach((issue) => {
                finalErrors.push({
                  field: issue.path.join("."),
                  message: issue.message,
                  value: issue.path.reduce((obj: any, key) => obj?.[key], contactData),
                });
              });
            } else if (error.body?.errors) {
              // Handle structured React Admin validation errors
              for (const [field, message] of Object.entries(error.body.errors)) {
                finalErrors.push({
                  field,
                  message: String(message),
                });
              }
            } else {
              finalErrors.push({
                field: "general",
                message: error.message || "Unknown error during record creation",
              });
            }

            return {
              rowNumber,
              success: false,
              errors: finalErrors,
              data: contactData,
            };
          } finally {
            if (onProgress) {
              onProgress(index + 1, totalProcessed);
            }
          }
        }),
      );

      // Process results and categorize them
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const value = result.value as any;
          if (value.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push({
              row: value.rowNumber,
              data: value.data,
              errors: value.errors,
            });
          }
        } else {
          // Promise rejected (catastrophic failure for this row)
          failedCount++;
          errors.push({
            row: index + 1,
            data: batch[index],
            errors: [
              {
                field: "processing",
                message: result.reason?.message || result.reason || "Unknown processing error",
              },
            ],
          });
        }
      });

      const endTime = new Date();

      const result = {
        totalProcessed,
        successCount,
        skippedCount,
        failedCount,
        errors,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
      };

      console.log("processBatch returning:", result);
      return result;
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
