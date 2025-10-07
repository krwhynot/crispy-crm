import type { DataProvider } from "ra-core";
import { useDataProvider, useGetIdentity } from "ra-core";
import { useCallback, useMemo } from "react";
import type { Organization, Tag } from "../types";

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
    async (names: string[]) =>
      fetchRecordsWithCache<Organization>(
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
    async (names: string[]) =>
      fetchRecordsWithCache<Tag>(
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
    async (batch: ContactImportSchema[]) => {
      const [organizations, tags] = await Promise.all([
        getOrganizations(
          batch
            .map((contact) => contact.organization_name?.trim())
            .filter((name) => name),
        ),
        getTags(batch.flatMap((batch) => parseTags(batch.tags))),
      ]);

      await Promise.all(
        batch.map(
          async ({
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
          }) => {
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
            // Fail fast: Ensure a primary organization name is provided
            if (!trimmedOrgName) {
              console.warn(
                `Skipping contact ${first_name} ${last_name} due to missing primary organization name.`,
              );
              return Promise.resolve(); // Skip processing this contact
            }

            const organization = organizations.get(trimmedOrgName);

            // Fail fast: If organization doesn't exist and couldn't be created, skip
            if (!organization?.id) {
              console.error(
                `Failed to find or create organization "${trimmedOrgName}" for contact ${first_name} ${last_name}. Skipping contact.`,
              );
              return Promise.resolve();
            }

            const tagList = parseTags(tagNames)
              .map((name) => tags.get(name))
              .filter((tag): tag is Tag => !!tag);

            // Step 1: Create the contact record
            const contactResponse = await dataProvider.create("contacts", {
              data: {
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
                tags: tagList.map((tag) => tag.id),
                sales_id: identity?.id,
                linkedin_url,
              },
            });

            const contactId = contactResponse.data.id;

            // Step 2: Create the contact_organization junction table entry
            if (contactId) {
              await dataProvider.create("contact_organizations", {
                data: {
                  contact_id: contactId,
                  organization_id: organization.id,
                  is_primary: true, // Imported organization is primary
                  role: organization_role || "decision_maker", // Default role
                },
              });
            } else {
              console.error(
                `Failed to retrieve contact ID for ${first_name} ${last_name}. Cannot link to organization.`,
              );
            }
          },
        ),
      );
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
