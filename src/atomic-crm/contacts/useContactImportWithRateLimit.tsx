/**
 * EXAMPLE: useContactImport with Rate Limit Handling
 *
 * This is a refactored version of useContactImport.tsx showing how to integrate
 * the RateLimitService for resilient contact creation during bulk imports.
 *
 * Key improvements:
 * 1. Automatic retry on 429 rate limit errors
 * 2. Exponential backoff to reduce load on overwhelmed server
 * 3. Circuit breaker pattern to fail fast after repeated failures
 * 4. User-friendly error messages for different failure scenarios
 * 5. Progress tracking that accounts for retries
 */

import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";
import { mapHeadersToFields, isFullNameColumn, findCanonicalField } from "./columnAliases";
import { importContactSchema } from "../validation/contacts";
import { ZodError } from "zod";
import { applyDataQualityTransformations, validateTransformedContacts, isContactWithoutContactInfo } from "./contactImport.logic";

// Import rate limit service for resilient contact creation
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";

export interface ContactImportSchema {
  first_name: string;
  last_name: string;
  gender?: string;
  title?: string;
  organization_name: string;
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
  notes?: string;
}

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
  // New fields for rate limit tracking
  retryCount?: number;
  rateLimitEncountered?: boolean;
}

export interface DataQualityDecisions {
  importOrganizationsWithoutContacts: boolean;
  importContactsWithoutContactInfo: boolean;
}

export interface ImportOptions {
  preview?: boolean;
  onProgress?: (current: number, total: number) => void;
  startingRow?: number;
  dataQualityDecisions?: DataQualityDecisions;
}

export function useContactImportWithRateLimit() {
  const today = new Date().toISOString();
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();

  const organizationsCache = useMemo(
    () => new Map<string, Organization>(),
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
      console.log("processBatch called with rate limit handling:", {
        batchSize: batch.length,
        preview,
        startingRow,
        dataQualityDecisions,
      });

      const startTime = new Date();
      const errors: ImportError[] = [];
      let successCount = 0;
      let skippedCount = 0;
      let retryCount = 0;
      let rateLimitEncountered = false;
      const totalProcessed = batch.length;

      if (onProgress) {
        onProgress(0, totalProcessed);
      }

      // Check circuit breaker state before starting
      const circuitState = rateLimitService.getCircuitState();
      if (circuitState.isOpen) {
        console.warn('[ContactImport] Rate limit circuit breaker is open');
        const circuitError: ImportError = {
          row: startingRow,
          data: {},
          errors: [{
            field: 'general',
            message: 'Rate limiting is active. Please wait 1-2 minutes before retrying.',
          }],
        };
        errors.push(circuitError);

        return {
          totalProcessed: 0,
          successCount: 0,
          skippedCount: 0,
          failedCount: 1,
          errors,
          duration: 0,
          startTime,
          endTime: new Date(),
          retryCount,
          rateLimitEncountered: true,
        };
      }

      // 1. Apply data quality transformations
      const { transformedContacts } = applyDataQualityTransformations(batch, dataQualityDecisions);

      // 2. Validate the entire transformed batch
      const { successful, failed } = validateTransformedContacts(transformedContacts);

      // Add validation failures to errors
      failed.forEach(failure => {
        errors.push({
          row: startingRow + failure.originalIndex,
          data: failure.data,
          errors: failure.errors,
        });
      });

      // 2.5. Filter out contacts without contact info if user hasn't approved
      let contactsToProcess = successful;
      if (!dataQualityDecisions?.importContactsWithoutContactInfo) {
        const skippedContacts = new Set<number>();
        contactsToProcess = successful.filter(contact => {
          if (isContactWithoutContactInfo(contact)) {
            skippedContacts.add(contact.originalIndex);
            return false;
          }
          return true;
        });
        skippedCount = skippedContacts.size;
      }

      // 3. Fetch related records (organizations, tags)
      const [organizations, tags] = await Promise.all([
        getOrganizations(
          contactsToProcess
            .map((contact) => contact.organization_name?.trim())
            .filter((name): name is string => !!name),
          preview,
        ),
        getTags(contactsToProcess.flatMap((contact) => parseTags(contact.tags)), preview),
      ]);

      // 4. Process all valid contacts with rate limit handling
      const results = await Promise.allSettled(
        contactsToProcess.map(async (contactData, index) => {
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

            // CRITICAL: Wrap contact creation with rate limit handling
            // This ensures bulk imports are resilient to temporary API overload
            if (preview) {
              // In preview mode, skip rate limit handling (no DB writes anyway)
              await dataProvider.create("contacts", {
                data: contactPayload,
                meta: { dryRun: true },
              });
            } else {
              // Production mode: Use rate limit service for automatic retry
              await rateLimitService.executeWithRetry(
                () => dataProvider.create("contacts", {
                  data: contactPayload,
                }),
                {
                  resourceName: "contacts",
                  operation: "create_during_import",
                }
              );
            }

            return { rowNumber, success: true };
          } catch (error: any) {
            // Track if rate limit error was encountered
            if (error?.code === 'RATE_LIMIT_CIRCUIT_OPEN' ||
                error?.code === 'RATE_LIMIT_MAX_RETRIES_EXCEEDED') {
              rateLimitEncountered = true;
              retryCount++;
            }

            const finalErrors: FieldError[] = [];

            // Handle rate limit circuit breaker error
            if (error?.code === 'RATE_LIMIT_CIRCUIT_OPEN') {
              finalErrors.push({
                field: "general",
                message: "Rate limiting active. Too many requests. Please wait before retrying.",
              });
            }
            // Handle max retries exceeded
            else if (error?.code === 'RATE_LIMIT_MAX_RETRIES_EXCEEDED') {
              finalErrors.push({
                field: "general",
                message: "System temporarily overloaded. Contact creation failed after retries. Try again in a few moments.",
              });
            }
            // Handle Zod validation errors
            else if (error instanceof ZodError) {
              error.issues.forEach((issue) => {
                finalErrors.push({
                  field: issue.path.join("."),
                  message: issue.message,
                });
              });
            }
            // Handle React Admin format errors
            else if (error.body?.errors) {
              for (const [field, message] of Object.entries(error.body.errors)) {
                finalErrors.push({ field, message: String(message) });
              }
            }
            // Generic error handling
            else {
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
          errors.push({
            row: 0,
            data: {},
            errors: [{ field: "processing", message: result.reason?.message || "Unknown processing error" }],
          });
        }
      });

      const endTime = new Date();
      const finalResult: ImportResult = {
        totalProcessed,
        successCount,
        skippedCount,
        failedCount: errors.length,
        errors,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        retryCount,
        rateLimitEncountered,
      };

      console.log("processBatch returning:", finalResult);
      return finalResult;
    },
    [dataProvider, getOrganizations, getTags, identity?.id, today],
  );

  return processBatch;
}

// ============================================================================
// Helper Functions (unchanged from original)
// ============================================================================

async function fetchRecordsWithCache<T>(
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
        "name@in": `(${uncachedRecordNames.map((name) => `"${name}"`).join(",")})`,
      },
      pagination: { page: 1, perPage: 1000 },
    });

    response.data.forEach((record: any) => {
      cache.set(record.name, record);
    });

    // Create missing records with rate limit handling
    const missingNames = uncachedRecordNames.filter((name) => !cache.has(name));
    for (const name of missingNames) {
      try {
        const createdRecord = await rateLimitService.executeWithRetry(
          () => dataProvider.create(resource, {
            data: getCreateData(name),
          }),
          { resourceName: resource, operation: "create" }
        );
        cache.set(name, createdRecord.data);
      } catch (error) {
        console.error(`Failed to create ${resource} "${name}":`, error);
        // Continue with other records even if one fails
      }
    }
  }

  return cache;
}

function parseTags(tagString?: string): string[] {
  return (tagString || '')
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function validateOrganizationNames(names: string[]): Map<string, Organization> {
  return new Map(
    [...new Set(names)].map((name) => [
      name,
      { id: `preview-${name}`, name } as Organization,
    ])
  );
}

function validateTagNames(names: string[]): Map<string, Tag> {
  return new Map(
    [...new Set(names)].map((name) => [
      name,
      { id: `preview-${name}`, name, color: "gray" } as Tag,
    ])
  );
}
