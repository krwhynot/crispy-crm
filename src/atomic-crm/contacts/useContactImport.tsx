import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";
import { mapHeadersToFields, isFullNameColumn, findCanonicalField } from "./columnAliases";

export interface ContactImportSchema {
  first_name: string;
  last_name: string;
  gender?: string;
  title?: string;
  organization_name: string; // Primary organization (mandatory)
  organization_role?: string; // Role at organization (optional)
  email_work?: string;
  email_home?: string;
  email_other?: string;
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;
  avatar?: string;
  first_seen?: string;
  last_seen?: string;
  tags?: string;
  linkedin_url?: string;
}

export interface ImportError {
  row: number;
  data: any;
  reason: string;
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
            organization_role,
            tags: tagNames,
            linkedin_url,
          } = contactData;

          const rowNumber = index + 1;

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

            const trimmedOrgName = organization_name?.trim();

            // Validation: Ensure a primary organization name is provided
            if (!trimmedOrgName) {
              throw new Error("Missing primary organization name");
            }

            // In preview mode, just validate the organization exists in our map
            if (preview) {
              if (!organizations.has(trimmedOrgName)) {
                throw new Error(`Organization "${trimmedOrgName}" would need to be created`);
              }
            } else {
              const organization = organizations.get(trimmedOrgName);

              // If organization doesn't exist and couldn't be created, fail
              if (!organization?.id) {
                throw new Error(`Failed to find or create organization "${trimmedOrgName}"`);
              }
            }

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
              first_seen: first_seen
                ? new Date(first_seen).toISOString()
                : today,
              last_seen: last_seen
                ? new Date(last_seen).toISOString()
                : today,
              tags: preview ? [] : tagList.map((tag) => tag.id),
              sales_id: identity?.id,
              linkedin_url,
            };

            if (preview) {
              // Validate contact using data provider's dry-run mode
              await dataProvider.create("contacts", {
                data: contactPayload,
                meta: { dryRun: true },
              });
              // In preview mode, we don't need to validate contact_organizations
              return { rowNumber, success: true };
            } else {
              // Step 1: Create the contact record
              const contactResponse = await dataProvider.create("contacts", {
                data: contactPayload,
              });

              const contactId = contactResponse.data.id;

              // Step 2: Create the contact_organization junction table entry
              if (contactId) {
                const organization = organizations.get(trimmedOrgName);
                if (organization?.id) {
                  await dataProvider.create("contact_organizations", {
                    data: {
                      contact_id: contactId,
                      organization_id: organization.id,
                      is_primary: true, // Imported organization is primary
                      role: organization_role || "decision_maker", // Default role
                    },
                  });
                }
              } else {
                throw new Error("Failed to retrieve contact ID after creation");
              }

              return { rowNumber, success: true };
            }
          } catch (error: any) {
            // Return error details for this row
            return {
              rowNumber,
              success: false,
              error: error.message || "Unknown error",
              data: contactData,
            };
          } finally {
            // Report progress after each contact
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
              reason: value.error,
            });
          }
        } else {
          // Promise rejected (shouldn't happen with our try-catch, but handle it)
          failedCount++;
          errors.push({
            row: index + 1,
            data: batch[index],
            reason: result.reason?.message || result.reason || "Unknown error",
          });
        }
      });

      const endTime = new Date();

      return {
        totalProcessed,
        successCount,
        skippedCount,
        failedCount,
        errors,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
      };
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
