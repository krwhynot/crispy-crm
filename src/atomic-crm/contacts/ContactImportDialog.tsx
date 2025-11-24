import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Users } from "lucide-react";
import { Form, useRefresh } from "ra-core";
import { Link } from "react-router-dom";
import { usePapaParse } from "./usePapaParse";
import type { ContactImportSchema, ImportResult, ImportError } from "./useContactImport";
import { useContactImport } from "./useContactImport";
import type { PreviewData, DataQualityDecisions } from "./ContactImportPreview";
import { ContactImportPreview } from "./ContactImportPreview";
import { ContactImportResult } from "./ContactImportResult";
import { isOrganizationOnlyEntry, isContactWithoutContactInfo } from "./contactImport.logic";
import { findCanonicalField, isFullNameColumn, mapHeadersToFields } from "./columnAliases";
import { processCsvDataWithMappings } from "./csvProcessor";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";
import {
  validateCsvFile,
  getSecurePapaParseConfig,
  type CsvValidationError,
} from "../utils/csvUploadValidator";
import { contactImportLimiter } from "../utils/rateLimiter";

import { FileInput } from "@/components/admin/file-input";
import { FileField } from "@/components/admin/file-field";
import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import * as sampleCsv from "./contacts_export.csv?raw";

// Feature flag for enhanced import preview
const ENABLE_IMPORT_PREVIEW = true;

const SAMPLE_URL = `data:text/csv;name=crm_contacts_sample.csv;charset=utf-8,${encodeURIComponent(
  sampleCsv.default
)}`;

interface ContactImportModalProps {
  open: boolean;
  onClose(): void;
}

type ImportState = "idle" | "running" | "complete" | "error";

export function ContactImportDialog({ open, onClose }: ContactImportModalProps) {
  const refresh = useRefresh();
  const processBatchHook = useContactImport();

  // Preview state management
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [dataQualityDecisions, setDataQualityDecisions] = useState<DataQualityDecisions>({
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  });

  // Interactive column mapping state
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<any[][]>([]);

  // State for the actual import process (replaces actualImporter)
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 });

  // Import result state - accumulate across all batches
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const accumulatedResultRef = React.useRef<{
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
  const rowOffsetRef = React.useRef(0); // Track absolute row position in CSV file

  // Handle preview mode
  const onPreview = useCallback(
    (data: { rows: ContactImportSchema[]; headers: string[]; rawDataRows?: any[][] }) => {
      if (!ENABLE_IMPORT_PREVIEW) return;

      const { rows, headers, rawDataRows: dataRows } = data;

      // Store raw data for re-processing when user changes mappings
      setRawHeaders(headers);
      if (dataRows) {
        setRawDataRows(dataRows);
      }

      // Run data quality analysis
      const organizationsWithoutContacts = findOrganizationsWithoutContacts(rows);
      const contactsWithoutContactInfo = findContactsWithoutContactInfo(rows);

      // Generate initial preview data with auto-detected mappings
      const mappings = headers.map((header, index) => {
        const canonicalField = findCanonicalField(header);
        const isFullName = isFullNameColumn(header);
        const target =
          canonicalField || (isFullName ? "first_name + last_name (will be split)" : null);

        // Calculate confidence: 1.0 for exact matches, 0.9 for full name patterns, 0 for no match
        let confidence = 0;
        if (canonicalField) confidence = 1.0;
        else if (isFullName) confidence = 0.9;

        // Get sample value from first row if available
        const sampleValue = dataRows?.[0]?.[index]
          ? String(dataRows[0][index]).substring(0, 50)
          : undefined;

        return {
          source: header || "(empty)",
          target,
          confidence,
          sampleValue,
        };
      });

      const preview: PreviewData = {
        mappings,
        sampleRows: rows.slice(0, 5),
        validCount: rows.length,
        skipCount: 0,
        totalRows: rows.length,
        errors: [],
        warnings: [],
        newOrganizations: extractNewOrganizations(rows),
        newTags: extractNewTags(rows),
        hasErrors: false,
        lowConfidenceMappings: mappings.filter((m) => m.confidence > 0 && m.confidence < 0.8)
          .length,
        organizationsWithoutContacts,
        contactsWithoutContactInfo,
      };

      setPreviewData(preview);
      setShowPreview(true);
    },
    []
  );

  // Handle user changing a column mapping - simplified to only manage state
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

  // Derive re-processed contacts whenever mappings or raw data change
  // THIS IS THE SOURCE OF TRUTH FOR THE IMPORT - not re-parsing the file!
  const reprocessedContacts = useMemo<ContactImportSchema[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return [];
    }
    return processCsvDataWithMappings(rawHeaders, rawDataRows, mergedMappings);
  }, [rawHeaders, rawDataRows, mergedMappings]);

  // Derive all preview data declaratively using useMemo
  const derivedPreviewData = useMemo<PreviewData | null>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return previewData; // Return initial previewData until raw data is ready
    }

    // Re-run data quality analysis on the latest reprocessed data
    const organizationsWithoutContacts = findOrganizationsWithoutContacts(reprocessedContacts);
    const contactsWithoutContactInfo = findContactsWithoutContactInfo(reprocessedContacts);

    // Generate updated mappings for UI display
    const updatedMappings = rawHeaders.map((header) => {
      const target = mergedMappings[header];

      // Calculate confidence: 1.0 for user override or auto-match, 0.9 for full name
      let confidence = 0;
      if (userOverrides.has(header)) {
        confidence = 1.0; // User override always high confidence
      } else if (target === FULL_NAME_SPLIT_MARKER) {
        confidence = 0.9;
      } else if (target) {
        confidence = 1.0; // Auto-detected match
      }

      // Get sample value from first reprocessed row
      const firstContact = reprocessedContacts[0];
      let sampleValue: string | undefined;
      if (firstContact) {
        // For full name splits, show the combined first + last
        if (
          target === FULL_NAME_SPLIT_MARKER ||
          target === "first_name + last_name (will be split)"
        ) {
          const first = firstContact["first_name"] || "";
          const last = firstContact["last_name"] || "";
          sampleValue = [first, last].filter(Boolean).join(" ").substring(0, 50);
        } else if (target && firstContact[target]) {
          sampleValue = String(firstContact[target]).substring(0, 50);
        }
      }

      return {
        source: header || "(empty)",
        target:
          target === FULL_NAME_SPLIT_MARKER ? "first_name + last_name (will be split)" : target,
        confidence,
        sampleValue,
      };
    });

    // Detect conflicting mappings (full name split + explicit first/last name)
    const warnings: PreviewData["warnings"] = [];
    const targetValues = Object.values(mergedMappings);
    const hasFullNameSplit = targetValues.includes(FULL_NAME_SPLIT_MARKER);
    const hasExplicitFirstName = targetValues.includes("first_name");
    const hasExplicitLastName = targetValues.includes("last_name");

    if (hasFullNameSplit && hasExplicitFirstName) {
      warnings.push({
        row: 0,
        message:
          "A column is mapped to 'Full Name (split)' and another to 'First Name'. The explicit 'First Name' column will take precedence.",
      });
    }
    if (hasFullNameSplit && hasExplicitLastName) {
      warnings.push({
        row: 0,
        message:
          "A column is mapped to 'Full Name (split)' and another to 'Last Name'. The explicit 'Last Name' column will take precedence.",
      });
    }

    return {
      mappings: updatedMappings,
      sampleRows: reprocessedContacts.slice(0, 5),
      validCount: reprocessedContacts.length,
      skipCount: 0,
      totalRows: reprocessedContacts.length,
      errors: [],
      warnings,
      newOrganizations: extractNewOrganizations(reprocessedContacts),
      newTags: extractNewTags(reprocessedContacts),
      hasErrors: false,
      lowConfidenceMappings: updatedMappings.filter((m) => m.confidence > 0 && m.confidence < 0.8)
        .length,
      organizationsWithoutContacts,
      contactsWithoutContactInfo,
    };
  }, [reprocessedContacts, mergedMappings, rawHeaders, rawDataRows, userOverrides, previewData]);

  // Enhanced processBatch wrapper with result accumulation across batches
  const processBatch = useCallback(
    async (batch: ContactImportSchema[]) => {
      // Set start time on first batch
      if (!accumulatedResultRef.current.startTime) {
        accumulatedResultRef.current.startTime = new Date();
      }

      try {
        const result = await processBatchHook(batch, {
          preview: false,
          startingRow: rowOffsetRef.current + 1, // Pass correct starting row for this batch
          dataQualityDecisions, // Pass user's data quality decisions
          onProgress: () => {
            setImportProgress((prev) => ({ ...prev, count: prev.count + 1 }));
          },
        });

        rowOffsetRef.current += batch.length; // Increment offset for next batch

        // Accumulate results across all batches
        accumulatedResultRef.current.totalProcessed += result.totalProcessed;
        accumulatedResultRef.current.successCount += result.successCount;
        accumulatedResultRef.current.skippedCount += result.skippedCount;
        accumulatedResultRef.current.failedCount += result.failedCount;
        accumulatedResultRef.current.errors.push(...result.errors);
      } catch (error: any) {
        const errorMessage = error.message || "A critical error occurred during batch processing.";
        const batchStartRow = rowOffsetRef.current + 1;

        // Add an error entry for each contact in the failed batch
        batch.forEach((contactData, index) => {
          accumulatedResultRef.current.errors.push({
            row: batchStartRow + index,
            data: contactData,
            errors: [{ field: "batch_processing", message: errorMessage }],
          });
        });

        // Count entire batch as failed
        accumulatedResultRef.current.totalProcessed += batch.length;
        accumulatedResultRef.current.failedCount += batch.length;
        rowOffsetRef.current += batch.length; // Ensure offset is still incremented
      }
    },
    [processBatchHook, dataQualityDecisions]
  );

  // Use a single importer for the preview step only
  // SECURITY: Apply secure Papa Parse configuration (Phase 1 Security Remediation)
  const {
    importer: previewImporter,
    parseCsv,
    reset: resetPreviewImporter,
  } = usePapaParse<ContactImportSchema>({
    onPreview: onPreview,
    previewRowCount: 100,
    papaConfig: getSecurePapaParseConfig(),
  });

  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Handle preview confirmation and start the actual import
  // THIS IS THE FIX: Use reprocessedContacts (with user overrides) instead of re-parsing the file
  const handlePreviewContinue = useCallback(
    async (decisions: DataQualityDecisions) => {
      // SECURITY: Check rate limit before starting import (Phase 1 Security Remediation)
      if (!contactImportLimiter.canProceed()) {
        const resetTime = contactImportLimiter.getResetTimeFormatted();
        const remaining = contactImportLimiter.getRemaining();
        alert(
          `Import rate limit exceeded.\n\n` +
            `You have ${remaining} imports remaining.\n` +
            `Rate limit resets in ${resetTime}.\n\n` +
            `This limit prevents accidental bulk data corruption and protects database performance.`
        );
        return;
      }

      // Store data quality decisions for validation logic
      setDataQualityDecisions(decisions);

      // Reset accumulated results for new import
      accumulatedResultRef.current = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [],
        startTime: null,
      };
      rowOffsetRef.current = 0; // Reset row offset for new import

      setShowPreview(false);
      setImportState("running");
      setImportProgress({ count: 0, total: reprocessedContacts.length });

      // Process the reprocessedContacts (which have user overrides applied) in batches
      const batchSize = 10;
      for (let i = 0; i < reprocessedContacts.length; i += batchSize) {
        const batch = reprocessedContacts.slice(i, i + batchSize);
        await processBatch(batch);
        setImportProgress((prev) => ({ ...prev, count: i + batch.length }));
      }

      setImportState("complete");

      // Build and show final result
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
      setShowResult(true);
      refresh();
    },
    [reprocessedContacts, processBatch, refresh]
  );

  const handleFileChange = async (file: File | null) => {
    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);

    if (!file) {
      setFile(null);
      return;
    }

    // SECURITY: Validate file before processing (Phase 1 Security Remediation)
    const validation = await validateCsvFile(file);

    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      setFile(null);
      return;
    }

    // Show warnings if any (non-blocking)
    if (validation.warnings && validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    setFile(file);
  };

  const startImport = () => {
    if (!file) return;

    if (ENABLE_IMPORT_PREVIEW) {
      // Parse for preview first
      parseCsv(file);
    } else {
      // Direct import without preview
      parseCsv(file);
    }
  };

  // Handle preview cancellation
  const handlePreviewCancel = () => {
    setShowPreview(false);
    setPreviewData(null);
    resetPreviewImporter();
  };

  const handleClose = () => {
    resetPreviewImporter();
    setImportState("idle");
    setShowPreview(false);
    setShowResult(false);
    setPreviewData(null);
    setImportResult(null);
    setFile(null);
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
    rowOffsetRef.current = 0; // Reset row offset

    onClose();
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleClose();
  };

  return (
    <>
      {/* Main Import Dialog */}
      <Dialog open={open && !showPreview && !showResult} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <Form className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Import</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col space-y-2">
              {importState === "running" && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6 space-y-4">
                    {/* Progress Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="font-medium">Processing CSV Import</span>
                      </div>
                      <div className="ml-auto">
                        <button
                          onClick={handleReset}
                          className="text-sm text-destructive hover:underline"
                        >
                          Cancel Import
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={(importProgress.count / importProgress.total) * 100}
                        className="h-3"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Processing {importProgress.count} of {importProgress.total} contacts
                        </span>
                        <span>
                          {Math.round((importProgress.count / importProgress.total) * 100)}%
                          Complete
                        </span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Processed</p>
                        <p className="text-2xl font-bold text-primary">{importProgress.count}</p>
                        <p className="text-xs text-muted-foreground">
                          of {importProgress.total} contacts
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Errors</p>
                        <p className="text-2xl font-bold text-destructive">
                          {accumulatedResultRef.current.errors.length}
                        </p>
                        <p className="text-xs text-muted-foreground">failed imports</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Success</p>
                        <p className="text-2xl font-bold text-success">
                          {accumulatedResultRef.current.successCount}
                        </p>
                        <p className="text-xs text-muted-foreground">imported</p>
                      </div>
                    </div>

                    {/* Warning Message */}
                    <Alert className="border-warning/50 bg-warning/10">
                      <AlertDescription className="text-sm">
                        Please keep this tab open until the import completes
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {previewImporter.state === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to import this file, please make sure your provided a valid CSV file.
                  </AlertDescription>
                </Alert>
              )}

              {importState === "complete" && (
                <Card className="border-success/20 bg-success/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <CheckCircle2 className="h-12 w-12 text-success" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Import Complete!</h3>
                        <p className="text-sm text-muted-foreground">
                          Successfully processed {accumulatedResultRef.current.totalProcessed}{" "}
                          contacts
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-success" />
                          <span className="font-medium">
                            {accumulatedResultRef.current.successCount} imported
                          </span>
                        </div>
                        {accumulatedResultRef.current.failedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-destructive">
                              • {accumulatedResultRef.current.failedCount} errors
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {previewImporter.state === "idle" && importState === "idle" && (
                <>
                  <Alert>
                    <AlertDescription className="flex flex-col gap-4">
                      Here is a sample CSV file you can use as a template
                      <Button asChild variant="outline" size="sm">
                        <Link to={SAMPLE_URL} download={"crm_contacts_sample.csv"}>
                          Download CSV sample
                        </Link>
                      </Button>{" "}
                    </AlertDescription>
                  </Alert>

                  <FileInput
                    source="csv"
                    label="CSV File"
                    accept={{ "text/csv": [".csv"] }}
                    onChange={handleFileChange}
                  >
                    <FileField source="src" title="title" target="_blank" />
                  </FileInput>

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
                </>
              )}
            </div>
          </Form>

          <div className="flex justify-start pt-6 gap-2">
            {importState === "idle" ? (
              <Button onClick={startImport} disabled={!file || previewImporter.state === "parsing"}>
                {previewImporter.state === "parsing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Import
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose} disabled={importState === "running"}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (when feature flag is enabled) */}
      {ENABLE_IMPORT_PREVIEW && showPreview && derivedPreviewData && (
        <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
          <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Import Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <ContactImportPreview
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

      {/* Enhanced Result Dialog */}
      {importResult && (
        <ContactImportResult
          open={showResult}
          onClose={handleClose}
          result={importResult}
          allowRetry={false}
        />
      )}
    </>
  );
}

// Helper function to extract unique organizations from parsed data
function extractNewOrganizations(rows: ContactImportSchema[]): string[] {
  const organizations = new Set<string>();
  rows.forEach((row) => {
    if (row.organization_name) {
      organizations.add(row.organization_name.trim());
    }
  });
  return Array.from(organizations);
}

// Helper function to extract unique tags from parsed data
function extractNewTags(rows: ContactImportSchema[]): string[] {
  const tags = new Set<string>();
  rows.forEach((row) => {
    if (row.tags) {
      row.tags.split(",").forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) {
          tags.add(trimmed);
        }
      });
    }
  });
  return Array.from(tags);
}

// Helper function to find organizations without contact persons
// These are rows with organization_name but no first_name AND no last_name
function findOrganizationsWithoutContacts(
  rows: ContactImportSchema[]
): Array<{ organization_name: string; row: number }> {
  const orgOnlyEntries: Array<{ organization_name: string; row: number }> = [];

  rows.forEach((row, index) => {
    if (isOrganizationOnlyEntry(row)) {
      orgOnlyEntries.push({
        organization_name: String(row.organization_name).trim(),
        row: index + 4, // +3 for header rows, +1 for 1-indexed
      });
    }
  });

  return orgOnlyEntries;
}

// Helper function to find contacts without email or phone
// These are contacts with a name but missing ALL email fields AND ALL phone fields
function findContactsWithoutContactInfo(
  rows: ContactImportSchema[]
): Array<{ name: string; organization_name: string; row: number }> {
  const contactsWithoutInfo: Array<{ name: string; organization_name: string; row: number }> = [];

  rows.forEach((row, index) => {
    if (isContactWithoutContactInfo(row)) {
      const hasFirstName = row.first_name && String(row.first_name).trim();
      const hasLastName = row.last_name && String(row.last_name).trim();
      const name =
        [
          hasFirstName ? String(row.first_name).trim() : "",
          hasLastName ? String(row.last_name).trim() : "",
        ]
          .filter(Boolean)
          .join(" ") || "Unknown";

      contactsWithoutInfo.push({
        name,
        organization_name: row.organization_name ? String(row.organization_name).trim() : "",
        row: index + 4, // +3 for header rows, +1 for 1-indexed
      });
    }
  });

  return contactsWithoutInfo;
}
