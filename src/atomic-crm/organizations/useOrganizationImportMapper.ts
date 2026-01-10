import { useCallback, useMemo, useRef } from "react";
import { useDataProvider, useNotify } from "ra-core";
import { sanitizeCsvValue } from "../utils/csvUploadValidator";
import { formatName } from "../utils/formatName";
import { devLog, devWarn } from "@/lib/devLogger";
import type { RawCSVRow, MappedCSVRow } from "./types";

interface MapperState {
  transformRowData: (
    rawRow: RawCSVRow,
    headers: string[],
    mappings: Record<string, string | null>,
    salesCache: Map<string, number>,
    segmentsCache: Map<string, string>
  ) => MappedCSVRow;
  resolveAccountManagers: (
    rows: RawCSVRow[],
    headers: string[],
    mappings: Record<string, string | null>
  ) => Promise<void>;
  resolveSegments: (
    rows: RawCSVRow[],
    headers: string[],
    mappings: Record<string, string | null>
  ) => Promise<void>;
  salesLookupCache: React.MutableRefObject<Map<string, number>>;
  segmentsLookupCache: React.MutableRefObject<Map<string, string>>;
  clearCaches: () => void;
}

export function useOrganizationImportMapper(): MapperState {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const salesLookupCache = useRef<Map<string, number>>(new Map());
  const segmentsLookupCache = useRef<Map<string, string>>(new Map());

  const transformRowData = useCallback(
    (
      rawRow: RawCSVRow,
      headers: string[],
      mappings: Record<string, string | null>,
      salesCache: Map<string, number>,
      segmentsCache: Map<string, string>
    ): MappedCSVRow => {
      const mappedRow: MappedCSVRow = {};
      headers.forEach((header, index) => {
        const canonicalField = mappings[header];
        const rawValue = rawRow[index];

        const value = typeof rawValue === "string" ? sanitizeCsvValue(rawValue) : rawValue;

        if (canonicalField && value !== undefined && value !== "") {
          if (canonicalField === "sales_id" && typeof value === "string") {
            const numValue = Number(value);
            if (!isNaN(numValue) && Number.isInteger(numValue)) {
              mappedRow[canonicalField] = numValue;
            } else {
              const normalizedName = value.trim().toLowerCase();
              const salesId = salesCache.get(normalizedName);
              if (!salesId) {
                devWarn(
                  "OrgImport",
                  `Account manager "${value}" not found in cache - setting to null`
                );
              }
              mappedRow[canonicalField] = salesId ?? null;
            }
          } else if (canonicalField === "segment_id" && typeof value === "string") {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(value)) {
              mappedRow[canonicalField] = value;
            } else {
              const normalizedName = value.trim().toLowerCase();
              const segmentId = segmentsCache.get(normalizedName);
              mappedRow[canonicalField] = segmentId ?? null;
            }
          } else {
            mappedRow[canonicalField] = value;
          }
        }
      });
      return mappedRow;
    },
    []
  );

  const resolveAccountManagers = useCallback(
    async (
      rows: RawCSVRow[],
      headers: string[],
      mappings: Record<string, string | null>
    ): Promise<void> => {
      devLog("OrgImport", "resolveAccountManagers called with", {
        headerCount: headers.length,
        rowCount: rows.length,
      });
      devLog("OrgImport", "Column mappings:", mappings);

      const accountManagerHeader = Object.keys(mappings).find((h) => mappings[h] === "sales_id");
      if (!accountManagerHeader) {
        devLog(
          "OrgImport",
          "No account manager header found in mappings (no column maps to sales_id)"
        );
        return;
      }

      devLog("OrgImport", "Found account manager header:", accountManagerHeader);

      const headerIndex = headers.indexOf(accountManagerHeader);
      if (headerIndex === -1) {
        devLog("OrgImport", "Account manager header not found in headers array");
        return;
      }

      devLog("OrgImport", "Account manager column index:", headerIndex);

      const names = new Set<string>();
      rows.forEach((row) => {
        const value = row[headerIndex];
        if (typeof value === "string" && value.trim() && isNaN(Number(value))) {
          names.add(value.trim());
        }
      });

      devLog("OrgImport", "Collected unique account manager names:", Array.from(names));

      if (names.size === 0) {
        devLog("OrgImport", "No account manager names found (all values empty or numeric)");
        return;
      }

      const uniqueNames = Array.from(names);
      const firstNames = uniqueNames.map((name) => name.split(/\s+/)[0]);
      devLog("OrgImport", "First names to check:", firstNames);

      try {
        const response = await dataProvider.getList("sales", {
          filter: {
            "first_name@in": `(${firstNames.map((name) => `"${name}"`).join(",")})`,
            user_id: null,
          },
          pagination: { page: 1, perPage: firstNames.length },
          sort: { field: "id", order: "ASC" },
        });

        const existing = response.data;

        devLog("OrgImport", "Found existing account managers:", existing);

        const existingNames = new Set<string>();

        (existing || []).forEach((sale) => {
          const fullName = formatName(sale.first_name, sale.last_name);
          const normalizedName = fullName.toLowerCase();
          salesLookupCache.current.set(normalizedName, sale.id);
          existingNames.add(normalizedName);
        });

        const newNamesToInsert = uniqueNames.filter(
          (name) => !existingNames.has(name.toLowerCase())
        );

        devLog("OrgImport", "New account managers to insert:", newNamesToInsert);

        if (newNamesToInsert.length === 0) {
          devLog("OrgImport", "No new account managers to insert (all already exist)");
          return;
        }

        const newSalesRecords = newNamesToInsert.map((name) => {
          const nameParts = name.trim().split(/\s+/);
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
          return {
            first_name: firstName,
            last_name: lastName,
            user_id: null,
            email: `${firstName.toLowerCase()}${lastName ? "." + lastName.toLowerCase() : ""}@imported.local`,
            is_admin: false,
            disabled: false,
          };
        });

        devLog("OrgImport", "Inserting sales records:", newSalesRecords);

        const insertResults = await Promise.allSettled(
          newSalesRecords.map(async (record) => {
            const response = await dataProvider.create("sales", { data: record });
            return response.data;
          })
        );

        const inserted = insertResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value);

        const failures = insertResults.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          devWarn("OrgImport", "Some account managers failed to insert:", failures);
          notify(
            `${failures.length} account manager(s) could not be created. Import will continue.`,
            { type: "warning" }
          );
        }

        devLog("OrgImport", "Successfully inserted account managers:", inserted);

        inserted.forEach((sale) => {
          const fullName = formatName(sale.first_name, sale.last_name);
          salesLookupCache.current.set(fullName.toLowerCase(), sale.id);
        });

        devLog(
          "OrgImport",
          "Final sales cache state:",
          Array.from(salesLookupCache.current.entries())
        );
      } catch (error: unknown) {
        devWarn("OrgImport", "Unexpected error resolving account managers:", error);
      }
    },
    [dataProvider, notify]
  );

  const resolveSegments = useCallback(
    async (
      rows: RawCSVRow[],
      headers: string[],
      mappings: Record<string, string | null>
    ): Promise<void> => {
      devLog("OrgImport", "resolveSegments called");

      const segmentHeader = Object.keys(mappings).find((h) => mappings[h] === "segment_id");
      if (!segmentHeader) {
        devLog("OrgImport", "No segment header found");
        return;
      }

      const headerIndex = headers.indexOf(segmentHeader);
      if (headerIndex === -1) {
        devLog("OrgImport", "Segment header not found in headers array");
        return;
      }

      const names = new Set<string>();
      rows.forEach((row) => {
        const value = row[headerIndex];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value === "string" && value.trim() && !uuidRegex.test(value)) {
          names.add(value.trim());
        }
      });

      devLog("OrgImport", "Collected unique segment names:", Array.from(names));

      if (names.size === 0) {
        devLog("OrgImport", "No segment names to resolve");
        return;
      }

      const uniqueNames = Array.from(names);

      try {
        const response = await dataProvider.getList("segments", {
          filter: {
            "name@in": `(${uniqueNames.map((name) => `"${name}"`).join(",")})`,
          },
          pagination: { page: 1, perPage: uniqueNames.length },
          sort: { field: "id", order: "ASC" },
        });

        const existing = response.data;

        devLog("OrgImport", "Found existing segments:", existing);

        const existingNames = new Set<string>();
        (existing || []).forEach((segment) => {
          const normalizedName = segment.name.toLowerCase();
          segmentsLookupCache.current.set(normalizedName, segment.id);
          existingNames.add(normalizedName);
        });

        const newNamesToInsert = uniqueNames.filter(
          (name) => !existingNames.has(name.toLowerCase())
        );

        devLog("OrgImport", "New segments to insert:", newNamesToInsert);

        if (newNamesToInsert.length === 0) {
          devLog("OrgImport", "No new segments to insert");
          return;
        }

        const newSegments = newNamesToInsert.map((name) => ({
          name: name.trim(),
        }));

        devLog("OrgImport", "Inserting segments:", newSegments);

        const insertResults = await Promise.allSettled(
          newSegments.map(async (segment) => {
            const response = await dataProvider.create("segments", { data: segment });
            return response.data;
          })
        );

        const inserted = insertResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value);

        const failures = insertResults.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          devWarn("OrgImport", "Some segments failed to insert:", failures);
          notify(`${failures.length} segment(s) could not be created. Import will continue.`, {
            type: "warning",
          });
        }

        devLog("OrgImport", "Successfully inserted segments:", inserted);

        inserted.forEach((segment) => {
          segmentsLookupCache.current.set(segment.name.toLowerCase(), segment.id);
        });

        devLog(
          "OrgImport",
          "Final segments cache state:",
          Array.from(segmentsLookupCache.current.entries())
        );
      } catch (error: unknown) {
        devWarn("OrgImport", "Unexpected error resolving segments:", error);
      }
    },
    [dataProvider, notify]
  );

  const clearCaches = useCallback(() => {
    salesLookupCache.current.clear();
    segmentsLookupCache.current.clear();
  }, []);

  return {
    transformRowData,
    resolveAccountManagers,
    resolveSegments,
    salesLookupCache,
    segmentsLookupCache,
    clearCaches,
  };
}
