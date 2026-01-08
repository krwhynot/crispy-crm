import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Building2, Upload } from "lucide-react";
import { useRefresh, useNotify, useDataProvider } from "ra-core";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { findCanonicalField, mapHeadersToFields } from "./organizationColumnAliases";
import { detectDuplicateOrganizations } from "./organizationImport.logic";
import {
  useOrganizationImport,
  type ImportResult,
  type ImportError,
} from "./useOrganizationImport";
import OrganizationImportPreview, {
  type PreviewData,
  type DataQualityDecisions,
  type ColumnMapping,
  type DuplicateGroup,
} from "./OrganizationImportPreview";
import { formatName } from "../utils/formatName";
import {
  validateCsvFile,
  getSecurePapaParseConfig,
  sanitizeCsvValue,
  type CsvValidationError,
} from "../utils/csvUploadValidator";
import { devLog, devWarn } from "@/lib/devLogger";
import type { RawCSVRow, MappedCSVRow, OrganizationImportSchema } from "./types";

interface OrganizationImportDialogProps {
  open: boolean;
  onClose(): void;
}

type ImportState = "idle" | "parsing" | "running" | "complete" | "error";

export function OrganizationImportDialog({ open, onClose }: OrganizationImportDialogProps) {
  const refresh = useRefresh();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const processBatchHook = useOrganizationImport();

  const [file, setFile] = useState<File | null>(null);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SECURITY: Phase 1 Security Remediation - CSV validation
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Preview state management
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<RawCSVRow[]>([]);
  // Cache for account manager name -> sales_id mappings (useRef avoids re-renders)
  const salesLookupCache = useRef<Map<string, number>>(new Map());
  // Cache for segment name -> segment_id (UUID) mappings
  const segmentsLookupCache = useRef<Map<string, string>>(new Map());

  // Refs for accumulating results across batches
  const accumulatedResultRef = useRef<{
    totalProcessed: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    errors: ImportError[];
    startTime: Date | null;
  }>({
    totalProcessed: 0,
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
    startTime: null,
  });
  const rowOffsetRef = useRef(0);

  // ============================================================
  // BEFOREUNLOAD PROTECTION - Warn user before closing during import
  // ============================================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (importState === "running") {
        e.preventDefault();
        e.returnValue = "Import in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [importState]);

  /**
   * Helper function to transform raw CSV row data to mapped organization object
   * Handles special cases for sales_id (account manager) and segment_id field conversion
   */
  const transformRowData = useCallback(
    (
      rawRow: RawCSVRow,
      headers: string[],
      mappings: Record<string, string | null>,
      salesCache: Map<string, number>,
      segmentsCache: Map<string, string>
    ) => {
      const mappedRow: MappedCSVRow = {};
      headers.forEach((header, index) => {
        const canonicalField = mappings[header];
        const rawValue = rawRow[index];

        // SECURITY: Sanitize all CSV values (Phase 1 Security Remediation)
        const value = typeof rawValue === "string" ? sanitizeCsvValue(rawValue) : rawValue;

        if (canonicalField && value !== undefined && value !== "") {
          if (canonicalField === "sales_id" && typeof value === "string") {
            // Check if it's already a number (ID)
            const numValue = Number(value);
            if (!isNaN(numValue) && Number.isInteger(numValue)) {
              mappedRow[canonicalField] = numValue;
            } else {
              // Text name - lookup in cache
              const normalizedName = value.trim().toLowerCase();
              const salesId = salesCache.get(normalizedName);
              if (!salesId) {
                devWarn(
                  "OrgImport",
                  `Account manager "${value}" not found in cache - setting to null`
                );
              }
              mappedRow[canonicalField] = salesId ?? null; // Fallback to null instead of keeping string
            }
          } else if (canonicalField === "segment_id" && typeof value === "string") {
            // Check if it's already a UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(value)) {
              mappedRow[canonicalField] = value;
            } else {
              // Segment name - lookup in cache
              const normalizedName = value.trim().toLowerCase();
              const segmentId = segmentsCache.get(normalizedName);
              mappedRow[canonicalField] = segmentId ?? null; // Use null if segment not found (matches sales_id pattern)
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

  /**
   * Batch resolve and cache all unique account manager names from CSV
   * This eliminates per-row database queries and race conditions
   */
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

      // 1. Collect all unique text-based names from the sales_id column
      const names = new Set<string>();
      rows.forEach((row) => {
        const value = row[headerIndex];
        // Only consider non-numeric strings
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
        // 2. Check which names already exist in the DB (for user_id IS NULL)
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

        // 3. Populate cache with existing managers and identify new ones
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

        // 4. Batch insert new managers
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

        // 4. Batch insert new managers using Promise.allSettled for partial failure handling
        const insertResults = await Promise.allSettled(
          newSalesRecords.map(async (record) => {
            const response = await dataProvider.create("sales", { data: record });
            return response.data;
          })
        );

        // Extract successfully inserted records
        const inserted = insertResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value);

        // Log any failures
        const failures = insertResults.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          devWarn("OrgImport", "Some account managers failed to insert:", failures);
          notify(
            `${failures.length} account manager(s) could not be created. Import will continue.`,
            { type: "warning" }
          );
        }

        devLog("OrgImport", "Successfully inserted account managers:", inserted);

        // 5. Populate cache with newly created managers
        inserted.forEach((sale) => {
          const fullName = formatName(sale.first_name, sale.last_name);
          salesLookupCache.current.set(fullName.toLowerCase(), sale.id);
        });

        devLog(
          "OrgImport",
          "Final sales cache state:",
          Array.from(salesLookupCache.current.entries())
        );
      } catch (error) {
        devWarn("OrgImport", "Unexpected error resolving account managers:", error);
      }
    },
    [dataProvider, notify]
  );

  /**
   * Batch resolve and cache all unique segment names from CSV
   * Creates segments if they don't exist
   */
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

      // Collect all unique segment names
      const names = new Set<string>();
      rows.forEach((row) => {
        const value = row[headerIndex];
        // Only consider non-UUID strings
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
        // Check which segments already exist
        const response = await dataProvider.getList("segments", {
          filter: {
            "name@in": `(${uniqueNames.map((name) => `"${name}"`).join(",")})`,
          },
          pagination: { page: 1, perPage: uniqueNames.length },
          sort: { field: "id", order: "ASC" },
        });

        const existing = response.data;

        devLog("OrgImport", "Found existing segments:", existing);

        // Populate cache with existing segments
        const existingNames = new Set<string>();
        (existing || []).forEach((segment) => {
          const normalizedName = segment.name.toLowerCase();
          segmentsLookupCache.current.set(normalizedName, segment.id);
          existingNames.add(normalizedName);
        });

        // Identify new segments to create
        const newNamesToInsert = uniqueNames.filter(
          (name) => !existingNames.has(name.toLowerCase())
        );

        devLog("OrgImport", "New segments to insert:", newNamesToInsert);

        if (newNamesToInsert.length === 0) {
          devLog("OrgImport", "No new segments to insert");
          return;
        }

        // Batch insert new segments
        const newSegments = newNamesToInsert.map((name) => ({
          name: name.trim(),
        }));

        devLog("OrgImport", "Inserting segments:", newSegments);

        // Batch insert new segments using Promise.allSettled for partial failure handling
        const insertResults = await Promise.allSettled(
          newSegments.map(async (segment) => {
            const response = await dataProvider.create("segments", { data: segment });
            return response.data;
          })
        );

        // Extract successfully inserted records
        const inserted = insertResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .map((result) => result.value);

        // Log any failures
        const failures = insertResults.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          devWarn("OrgImport", "Some segments failed to insert:", failures);
          notify(`${failures.length} segment(s) could not be created. Import will continue.`, {
            type: "warning",
          });
        }

        devLog("OrgImport", "Successfully inserted segments:", inserted);

        // Populate cache with newly created segments
        inserted.forEach((segment) => {
          segmentsLookupCache.current.set(segment.name.toLowerCase(), segment.id);
        });

        devLog(
          "OrgImport",
          "Final segments cache state:",
          Array.from(segmentsLookupCache.current.entries())
        );
      } catch (error) {
        devWarn("OrgImport", "Unexpected error resolving segments:", error);
      }
    },
    [dataProvider, notify]
  );

  // Derive final mappings by merging auto-detection with user overrides
  const mergedMappings = useMemo<Record<string, string | null>>(() => {
    if (rawHeaders.length === 0) return {};

    const autoMappings = mapHeadersToFields(rawHeaders);
    const finalMappings: Record<string, string | null> = {};

    rawHeaders.forEach((header) => {
      // Priority: User override > Auto-detection
      finalMappings[header] = userOverrides.get(header) ?? autoMappings[header];
    });

    return finalMappings;
  }, [rawHeaders, userOverrides]);

  // Reprocess organizations whenever mappings or raw data change
  const reprocessedOrganizations = useMemo<MappedCSVRow[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return [];
    }

    // Transform raw rows using the centralized helper function
    return rawDataRows.map((row) =>
      transformRowData(
        row,
        rawHeaders,
        mergedMappings,
        salesLookupCache.current,
        segmentsLookupCache.current
      )
    );
  }, [rawHeaders, rawDataRows, mergedMappings, transformRowData]);

  // Derive preview data reactively whenever mappings change
  const derivedPreviewData = useMemo<PreviewData | null>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return previewData;
    }

    // Generate updated mappings for UI display with confidence scores
    const updatedMappings: ColumnMapping[] = rawHeaders.map((header, index) => {
      const target = mergedMappings[header];

      // Calculate confidence: 1.0 for matched (including user overrides), 0.0 for unmapped
      const confidence = target ? 1.0 : 0.0;

      // Get sample value from first non-empty value in first 10 rows
      // If still empty, try up to 50 rows for sparse columns
      const colValues = rawDataRows.slice(0, 10).map((row) => row[index]);
      let sampleValue = colValues.find(
        (val) => val !== undefined && val !== null && String(val).trim() !== ""
      );

      if (sampleValue === undefined) {
        const deeper = rawDataRows
          .slice(0, Math.min(50, rawDataRows.length))
          .map((row) => row[index]);
        sampleValue = deeper.find(
          (val) => val !== undefined && val !== null && String(val).trim() !== ""
        );
      }

      const sample = sampleValue !== undefined ? String(sampleValue).substring(0, 50) : undefined;

      return {
        source: header || "(empty)",
        target,
        confidence,
        sampleValue: sample,
      };
    });

    // Detect duplicates in reprocessed data
    const duplicateReport = detectDuplicateOrganizations(reprocessedOrganizations);
    const duplicateGroups: DuplicateGroup[] = duplicateReport.duplicates.map((dup) => ({
      indices: dup.indices.map((i) => i + 2), // +2 for CSV header row (1-indexed display)
      name: dup.name,
      count: dup.count,
    }));

    // Extract unique tags from reprocessed organizations
    const newTags = new Set<string>();
    reprocessedOrganizations.forEach((org) => {
      if (org.tags) {
        org.tags.split(",").forEach((tag: string) => {
          const trimmed = tag.trim();
          if (trimmed) {
            newTags.add(trimmed);
          }
        });
      }
    });

    // Count rows with non-empty names (required field)
    const namedRowsCount = reprocessedOrganizations.filter(
      (o) => o.name && String(o.name).trim() !== ""
    ).length;

    return {
      mappings: updatedMappings,
      sampleRows: reprocessedOrganizations.slice(0, 5),
      validCount: namedRowsCount,
      totalRows: reprocessedOrganizations.length,
      newTags: Array.from(newTags),
      duplicates: duplicateGroups.length > 0 ? duplicateGroups : undefined,
      lowConfidenceMappings: updatedMappings.filter((m) => m.confidence === 0).length,
      missingNameCount: reprocessedOrganizations.length - namedRowsCount,
    };
  }, [reprocessedOrganizations, mergedMappings, rawHeaders, rawDataRows, previewData]);

  // Handler for user changing a column mapping
  const handleMappingChange = useCallback((csvHeader: string, targetField: string | null) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      if (targetField === null || targetField === "") {
        // Clear override → revert to auto-detection
        next.delete(csvHeader);
      } else {
        next.set(csvHeader, targetField);
      }
      return next;
    });
  }, []);

  // Handle preview cancellation
  const handlePreviewCancel = useCallback(() => {
    setShowPreview(false);
    setPreviewData(null);
    setUserOverrides(new Map());
    setRawHeaders([]);
    setRawDataRows([]);
  }, []);

  // Handle preview confirmation and start the actual import
  // Enhanced processBatch wrapper with result accumulation across batches
  const processBatch = useCallback(
    async (batch: OrganizationImportSchema[]) => {
      // Set start time on first batch
      if (!accumulatedResultRef.current.startTime) {
        accumulatedResultRef.current.startTime = new Date();
      }

      try {
        const result = await processBatchHook(batch, {
          preview: false,
          startingRow: rowOffsetRef.current + 2, // +2 for CSV header row
          onProgress: (_current, _total) => {
            setImportProgress((prev) => ({ ...prev, count: prev.count + 1 }));
          },
        });

        rowOffsetRef.current += batch.length;

        // Accumulate results across all batches
        accumulatedResultRef.current.totalProcessed += result.totalProcessed;
        accumulatedResultRef.current.successCount += result.successCount;
        accumulatedResultRef.current.skippedCount += result.skippedCount;
        accumulatedResultRef.current.failedCount += result.failedCount;
        accumulatedResultRef.current.errors.push(...result.errors);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "A critical error occurred during batch processing.";
        notify(`Critical error during import batch: ${errorMessage}`, { type: "error" });
        const batchStartRow = rowOffsetRef.current + 2;

        // Add an error entry for each organization in the failed batch
        batch.forEach((orgData, index) => {
          accumulatedResultRef.current.errors.push({
            row: batchStartRow + index,
            data: orgData,
            errors: [{ field: "batch_processing", message: errorMessage }],
          });
        });

        // Count entire batch as failed
        accumulatedResultRef.current.totalProcessed += batch.length;
        accumulatedResultRef.current.failedCount += batch.length;
        rowOffsetRef.current += batch.length;
      }
    },
    [processBatchHook, notify]
  );

  const handlePreviewContinue = useCallback(
    async (decisions: DataQualityDecisions) => {
      // Always drop nameless rows
      let organizationsToImport = reprocessedOrganizations.filter(
        (org) => org.name && String(org.name).trim() !== ""
      );

      // Optionally skip duplicates (keep first occurrence only)
      if (decisions.skipDuplicates) {
        const seenNames = new Set<string>();
        organizationsToImport = organizationsToImport.filter((org) => {
          const normalizedName = org.name!.toLowerCase().trim();
          if (seenNames.has(normalizedName)) return false;
          seenNames.add(normalizedName);
          return true;
        });
      }

      // Reset accumulated results for new import
      accumulatedResultRef.current = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [],
        startTime: null,
      };
      rowOffsetRef.current = 0;

      setShowPreview(false);
      setImportState("running");
      setImportProgress({ count: 0, total: organizationsToImport.length });

      try {
        // Process organizations in batches to prevent overwhelming the server
        const batchSize = 10;
        for (let i = 0; i < organizationsToImport.length; i += batchSize) {
          const batch = organizationsToImport.slice(i, i + batchSize);
          await processBatch(batch);
          setImportProgress((prev) => ({ ...prev, count: i + batch.length }));
        }

        setImportState("complete");

        // Build final result from accumulated data
        const endTime = new Date();
        const startTime = accumulatedResultRef.current.startTime || endTime;
        const finalResult: ImportResult = {
          totalProcessed: accumulatedResultRef.current.totalProcessed,
          successCount: accumulatedResultRef.current.successCount,
          skippedCount: accumulatedResultRef.current.skippedCount,
          failedCount: accumulatedResultRef.current.failedCount,
          errors: accumulatedResultRef.current.errors,
          duration: endTime.getTime() - startTime.getTime(),
          startTime: startTime,
          endTime: endTime,
        };

        setImportResult(finalResult);
        refresh();
      } catch (error: unknown) {
        notify(`Import failed: ${error instanceof Error ? error.message : "Import failed"}`, {
          type: "error",
        });
        setImportState("error");
      }
    },
    [reprocessedOrganizations, processBatch, refresh, notify]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // SECURITY: Validate file before processing (Phase 1 Security Remediation)
    const validation = await validateCsvFile(selectedFile);

    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      setFile(null);
      return;
    }

    // Show warnings if any (non-blocking)
    if (validation.warnings && validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    setFile(selectedFile);
    // Reset state when file changes
    setImportState("idle");
    setImportResult(null);
    setImportProgress({ count: 0, total: 0 });
  };

  const handleImport = async () => {
    if (!file) {
      notify("Please select a file to import", { type: "warning" });
      return;
    }

    setImportState("parsing");

    // SECURITY: Use secure Papa Parse configuration (Phase 1 Security Remediation)
    Papa.parse(file, {
      ...getSecurePapaParseConfig(),
      complete: async (results) => {
        const rows = results.data as RawCSVRow[];
        const headers = results.meta.fields || [];

        // Store raw data for re-processing when user changes mappings
        setRawHeaders(headers);
        const rawRows = rows.map((row) => headers.map((h) => row[h]));
        setRawDataRows(rawRows);

        // Map CSV headers to canonical field names for initial preview
        const columnMapping = mapHeadersToFields(headers);

        // Clear caches and batch-resolve all account manager names and segments
        salesLookupCache.current.clear();
        segmentsLookupCache.current.clear();
        await resolveAccountManagers(rawRows, headers, columnMapping);
        await resolveSegments(rawRows, headers, columnMapping);

        // Transform rows using column mapping - caches are now populated
        const mappedRows = rawRows.map((row) =>
          transformRowData(
            row,
            headers,
            columnMapping,
            salesLookupCache.current,
            segmentsLookupCache.current
          )
        );

        // Generate column mappings with confidence scores
        const mappings: ColumnMapping[] = headers.map((header, _index) => {
          const canonicalField = findCanonicalField(header);
          const target = canonicalField;

          // Calculate confidence: 1.0 for exact matches, 0.0 for no match
          const confidence = canonicalField ? 1.0 : 0.0;

          // Get sample value from first row if available
          const sampleValue = rows[0]?.[header]
            ? String(rows[0][header]).substring(0, 50)
            : undefined;

          return {
            source: header || "(empty)",
            target,
            confidence,
            sampleValue,
          };
        });

        // Detect duplicates
        const duplicateReport = detectDuplicateOrganizations(mappedRows);
        const duplicateGroups: DuplicateGroup[] = duplicateReport.duplicates.map((dup) => ({
          indices: dup.indices.map((i) => i + 2), // +2 for CSV header row (1-indexed display)
          name: dup.name,
          count: dup.count,
        }));

        // Extract unique tags
        const newTags = new Set<string>();
        mappedRows.forEach((org) => {
          if (org.tags) {
            org.tags.split(",").forEach((tag: string) => {
              const trimmed = tag.trim();
              if (trimmed) {
                newTags.add(trimmed);
              }
            });
          }
        });

        // Generate preview data
        // Count rows with non-empty names (required field)
        const namedRowsCount = mappedRows.filter(
          (o) => o.name && String(o.name).trim() !== ""
        ).length;

        const preview: PreviewData = {
          mappings,
          sampleRows: mappedRows.slice(0, 5),
          validCount: namedRowsCount,
          totalRows: mappedRows.length,
          newTags: Array.from(newTags),
          duplicates: duplicateGroups.length > 0 ? duplicateGroups : undefined,
          lowConfidenceMappings: mappings.filter((m) => m.confidence === 0).length,
          missingNameCount: mappedRows.length - namedRowsCount,
        };

        setPreviewData(preview);
        setImportState("idle");
        setShowPreview(true);
      },
      error: (error) => {
        notify(`Error parsing CSV: ${error.message}`, { type: "error" });
        setImportState("error");
      },
    });
  };

  const handleClose = () => {
    setFile(null);
    setImportState("idle");
    setImportResult(null);
    setImportProgress({ count: 0, total: 0 });

    // Reset preview state
    setShowPreview(false);
    setPreviewData(null);
    setUserOverrides(new Map());
    setRawHeaders([]);
    setRawDataRows([]);

    // Reset accumulated results
    accumulatedResultRef.current = {
      totalProcessed: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      startTime: null,
    };
    rowOffsetRef.current = 0;

    onClose();
  };

  const progressPercent =
    importProgress.total > 0 ? Math.round((importProgress.count / importProgress.total) * 100) : 0;

  return (
    <>
      {/* Main Import Dialog - hide when showing preview */}
      <Dialog open={open && !showPreview} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Import Organizations
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to import organizations into your CRM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            {importState === "idle" && (
              <>
                <Alert>
                  <AlertDescription>
                    Upload a CSV file with organization data. Required column: name (or
                    "Organization Name"). Optional columns: website, phone, address, city, state,
                    postal_code, linkedin_url, priority, organization_type, description.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? file.name : "Choose CSV file"}
                  </Button>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  )}
                </div>

                {/* SECURITY: Display validation errors (Phase 1 Security Remediation) */}
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="font-semibold mb-2">File validation failed:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Display non-blocking warnings */}
                {validationWarnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="font-semibold mb-2">Warnings:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {validationWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!file}>
                    Import
                  </Button>
                </div>
              </>
            )}

            {/* Parsing State */}
            {importState === "parsing" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Parsing CSV file...</span>
              </div>
            )}

            {/* Import Progress */}
            {importState === "running" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>
                    Importing organizations... {importProgress.count} of {importProgress.total}
                  </span>
                </div>
                <Progress value={progressPercent} />
              </div>
            )}

            {/* Import Complete */}
            {importState === "complete" && importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Import Complete</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-success">
                      {importResult.successCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">
                      {importResult.failedCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{importResult.totalProcessed}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {/* Show errors if any */}
                {importResult.errors.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    <h4 className="font-medium mb-2">Errors:</h4>
                    <div className="space-y-2">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <Alert key={idx} variant="destructive">
                          <AlertDescription>
                            Row {error.row}:{" "}
                            {error.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-sm text-muted-foreground">
                          ... and {importResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleClose}>Close</Button>
                </div>
              </div>
            )}

            {/* Error State */}
            {importState === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to parse CSV file. Please check the file format and try again.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                  <Button onClick={handleClose}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {showPreview && derivedPreviewData && (
        <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
          <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Import Preview
              </DialogTitle>
              <DialogDescription>
                Review and map columns before importing your organizations.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <OrganizationImportPreview
                preview={derivedPreviewData}
                onContinue={handlePreviewContinue}
                onCancel={handlePreviewCancel}
                onMappingChange={handleMappingChange}
                userOverrides={userOverrides}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
