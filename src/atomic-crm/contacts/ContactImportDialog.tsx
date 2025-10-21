import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Users } from "lucide-react";
import { Form, useRefresh } from "ra-core";
import { Link } from "react-router-dom";
import { usePapaParse } from "../misc/usePapaParse";
import type { ContactImportSchema, ImportResult } from "./useContactImport";
import { useContactImport } from "./useContactImport";
import { mapHeadersToFields } from "./columnAliases";
import type { PreviewData, DataQualityDecisions } from "./ContactImportPreview";
import { ContactImportPreview } from "./ContactImportPreview";
import { ContactImportResult } from "./ContactImportResult";
import { isOrganizationOnlyEntry, isContactWithoutContactInfo } from "./contactImport.logic";

import { FileInput } from "@/components/admin/file-input";
import { FileField } from "@/components/admin/file-field";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import * as sampleCsv from "./contacts_export.csv?raw";

// Feature flag for enhanced import preview
const ENABLE_IMPORT_PREVIEW = true;

const SAMPLE_URL = `data:text/csv;name=crm_contacts_sample.csv;charset=utf-8,${encodeURIComponent(
  sampleCsv.default,
)}`;

type ContactImportModalProps = {
  open: boolean;
  onClose(): void;
};

export function ContactImportDialog({
  open,
  onClose,
}: ContactImportModalProps) {
  const refresh = useRefresh();
  const processBatchHook = useContactImport();

  // Preview state management (separate from parser state machine)
  const [showPreview, setShowPreview] = useState(false);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [parsedData, setParsedData] = useState<ContactImportSchema[]>([]);
  const [dataQualityDecisions, setDataQualityDecisions] = useState<DataQualityDecisions>({
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  });

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
  const rowOffsetRef = React.useRef(0);  // Track absolute row position in CSV file

  // Transform headers using column aliases
  const transformHeaders = useCallback((headers: string[]) => {
    console.log('📋 [HEADER DEBUG] Original CSV headers:', headers);

    const mappings = mapHeadersToFields(headers);
    console.log('📋 [HEADER DEBUG] Header mappings:', mappings);

    const transformedHeaders: string[] = [];

    // Build list of transformed headers
    headers.forEach(header => {
      const mapped = mappings[header];

      // Handle special cases like full name split
      if (mapped === '_full_name_split_') {
        // For full name columns, we'll handle splitting in data transformation
        // Mark this header so we can identify it later
        transformedHeaders.push('_full_name_source_');
      } else {
        transformedHeaders.push(mapped || header);
      }
    });

    console.log('📋 [HEADER DEBUG] Transformed headers:', transformedHeaders);
    return transformedHeaders;
  }, []);

  // Handle preview mode
  const onPreview = useCallback((rows: ContactImportSchema[]) => {
    if (!ENABLE_IMPORT_PREVIEW) return;

    console.log('📊 [PREVIEW DEBUG] First parsed row:', JSON.stringify(rows[0], null, 2));
    console.log('📊 [PREVIEW DEBUG] Total rows:', rows.length);

    // Store parsed data for later use
    setParsedData(rows);

    // Run data quality analysis
    const organizationsWithoutContacts = findOrganizationsWithoutContacts(rows);
    const contactsWithoutContactInfo = findContactsWithoutContactInfo(rows);

    console.log('📊 [DATA QUALITY] Organizations without contacts:', organizationsWithoutContacts.length);
    console.log('📊 [DATA QUALITY] Contacts without contact info:', contactsWithoutContactInfo.length);

    // Generate preview data
    const preview: PreviewData = {
      mappings: [], // This would be populated from the header mappings
      sampleRows: rows.slice(0, 5),
      validCount: rows.length, // This would be calculated based on validation
      skipCount: 0,
      totalRows: rows.length,
      errors: [],
      warnings: [],
      newOrganizations: extractNewOrganizations(rows),
      newTags: extractNewTags(rows),
      hasErrors: false,
      lowConfidenceMappings: 0,
      organizationsWithoutContacts,
      contactsWithoutContactInfo,
    };

    setPreviewData(preview);
    setShowPreview(true);
  }, []);

  // Enhanced processBatch wrapper with result accumulation across batches
  const processBatch = useCallback(async (batch: ContactImportSchema[]) => {
    console.log('🔵 [IMPORT DEBUG] processBatch called with', batch.length, 'contacts, starting at row', rowOffsetRef.current + 1);

    // Set start time on first batch
    if (!accumulatedResultRef.current.startTime) {
      accumulatedResultRef.current.startTime = new Date();
    }

    try {
      console.log('🔵 [IMPORT DEBUG] Calling processBatchHook with data quality decisions:', dataQualityDecisions);
      const result = await processBatchHook(batch, {
        preview: false,
        startingRow: rowOffsetRef.current + 1,  // Pass correct starting row for this batch
        dataQualityDecisions,  // Pass user's data quality decisions
        onProgress: (current, total) => {
          // Progress tracking could be added here
        }
      });

      rowOffsetRef.current += batch.length;  // Increment offset for next batch

      console.log('🔵 [IMPORT DEBUG] processBatchHook completed. Result:', result);

      // Accumulate results across all batches
      accumulatedResultRef.current.totalProcessed += result.totalProcessed;
      accumulatedResultRef.current.successCount += result.successCount;
      accumulatedResultRef.current.skippedCount += result.skippedCount;
      accumulatedResultRef.current.failedCount += result.failedCount;
      accumulatedResultRef.current.errors.push(...result.errors);

      console.log('📊 [IMPORT DEBUG] Accumulated totals:', {
        totalProcessed: accumulatedResultRef.current.totalProcessed,
        successCount: accumulatedResultRef.current.successCount,
        failedCount: accumulatedResultRef.current.failedCount,
        errorCount: accumulatedResultRef.current.errors.length,
      });
    } catch (error: any) {
      console.error("🔴 [IMPORT DEBUG] Batch processing error:", error);
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
      rowOffsetRef.current += batch.length;  // Ensure offset is still incremented
    }
  }, [processBatchHook, dataQualityDecisions]);

  // Two separate importers: one for preview, one for actual import
  const previewImporter = usePapaParse<ContactImportSchema>({
    transformHeaders: transformHeaders,
    onPreview: onPreview,
    previewRowCount: 100,
  });

  const actualImporter = usePapaParse<ContactImportSchema>({
    batchSize: 10,
    processBatch,
    transformHeaders: transformHeaders,
    // No preview callbacks - this does the actual import
  });

  // Use the appropriate importer based on whether preview is enabled
  const { importer, parseCsv, reset } = ENABLE_IMPORT_PREVIEW
    ? previewImporter
    : actualImporter;

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('🔍 [STATE DEBUG] actualImporter.importer.state changed to:', actualImporter.importer.state);
    console.log('🔍 [STATE DEBUG] previewImporter.importer.state:', previewImporter.importer.state);
    console.log('🔍 [STATE DEBUG] showPreview:', showPreview, 'previewConfirmed:', previewConfirmed);
    console.log('🔍 [STATE DEBUG] Accumulated results:', {
      totalProcessed: accumulatedResultRef.current.totalProcessed,
      successCount: accumulatedResultRef.current.successCount,
      failedCount: accumulatedResultRef.current.failedCount,
      errorCount: accumulatedResultRef.current.errors.length,
    });

    // Monitor actualImporter for completion (not the preview one)
    if (actualImporter.importer.state === "complete") {
      console.log('✅ [IMPORT DEBUG] Import complete! Building final result...');

      const endTime = new Date();
      const startTime = accumulatedResultRef.current.startTime || endTime;

      // Build final ImportResult from accumulated data
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

      console.log('📋 [IMPORT DEBUG] Final result:', finalResult);
      console.log('📋 [IMPORT DEBUG] About to show result dialog...');

      setImportResult(finalResult);
      setShowResult(true);
      refresh();
    }
  }, [actualImporter.importer.state, previewImporter.importer.state, showPreview, previewConfirmed, refresh]);

  const handleFileChange = (file: File | null) => {
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

  // Handle preview confirmation
  const handlePreviewContinue = (decisions: DataQualityDecisions) => {
    console.log('🚀 [IMPORT DEBUG] handlePreviewContinue called with decisions:', decisions);
    console.log('🚀 [IMPORT DEBUG] File:', file?.name, 'Size:', file?.size);

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
    rowOffsetRef.current = 0;  // Reset row offset for new import

    setShowPreview(false);
    setPreviewConfirmed(true);
    // Use the actualImporter to parse the file for real import
    if (file) {
      console.log('🚀 [IMPORT DEBUG] Calling actualImporter.parseCsv with file:', file.name);
      actualImporter.parseCsv(file);
    } else {
      console.error("Cannot continue import: file is missing");
    }
  };

  // Handle preview cancellation
  const handlePreviewCancel = () => {
    setShowPreview(false);
    setPreviewData(null);
    setParsedData([]);
    previewImporter.reset();
    actualImporter.reset();
  };

  const handleClose = () => {
    previewImporter.reset();
    actualImporter.reset();
    setShowPreview(false);
    setShowResult(false);
    setPreviewData(null);
    setParsedData([]);
    setImportResult(null);

    // Reset accumulated results
    accumulatedResultRef.current = {
      totalProcessed: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      startTime: null,
    };
    rowOffsetRef.current = 0;  // Reset row offset

    onClose();
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    previewImporter.reset();
    actualImporter.reset();
    setShowPreview(false);
    setPreviewData(null);
    setParsedData([]);
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
              {/* Show progress for actualImporter when importing after preview, or regular importer otherwise */}
              {((actualImporter.importer.state === "running" && ENABLE_IMPORT_PREVIEW && previewConfirmed) ||
                (importer.state === "running" && !ENABLE_IMPORT_PREVIEW)) && (() => {
                // Use the appropriate importer based on context
                const activeImporter = (ENABLE_IMPORT_PREVIEW && previewConfirmed)
                  ? actualImporter.importer
                  : importer;

                return (
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
                      <Progress value={(activeImporter.importCount / activeImporter.rowCount) * 100} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Batch {Math.ceil(activeImporter.importCount / 10) || 1} of {Math.ceil(activeImporter.rowCount / 10)}
                        </span>
                        <span>
                          {Math.round((activeImporter.importCount / activeImporter.rowCount) * 100)}% Complete
                        </span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Processed</p>
                        <p className="text-2xl font-bold text-primary">
                          {activeImporter.importCount}
                        </p>
                        <p className="text-xs text-muted-foreground">of {activeImporter.rowCount} contacts</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Errors</p>
                        <p className="text-2xl font-bold text-destructive">
                          {activeImporter.errorCount}
                        </p>
                        <p className="text-xs text-muted-foreground">failed imports</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Time Remaining</p>
                        <p className="text-2xl font-bold">
                          {activeImporter.remainingTime !== null
                            ? millisecondsToTime(activeImporter.remainingTime)
                            : "Calculating..."}
                        </p>
                        <p className="text-xs text-muted-foreground">estimated</p>
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
                );
              })()}

              {importer.state === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to import this file, please make sure your provided a
                    valid CSV file.
                  </AlertDescription>
                </Alert>
              )}

              {/* Show completion for both actualImporter (with preview) and importer (without preview) */}
              {((actualImporter.importer.state === "complete" && ENABLE_IMPORT_PREVIEW) ||
                (importer.state === "complete" && !ENABLE_IMPORT_PREVIEW)) && (() => {
                // Use the appropriate importer based on context
                const completedImporter = (ENABLE_IMPORT_PREVIEW && actualImporter.importer.state === "complete")
                  ? actualImporter.importer
                  : importer;

                return (
                <Card className="border-success/20 bg-success/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <CheckCircle2 className="h-12 w-12 text-success" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Import Complete!</h3>
                        <p className="text-sm text-muted-foreground">
                          Successfully processed {completedImporter.importCount} contacts
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-success" />
                          <span className="font-medium">{completedImporter.importCount} imported</span>
                        </div>
                        {completedImporter.errorCount > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-destructive">• {completedImporter.errorCount} errors</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })()}

              {importer.state === "idle" && (
                <>
                  <Alert>
                    <AlertDescription className="flex flex-col gap-4">
                      Here is a sample CSV file you can use as a template
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to={SAMPLE_URL}
                          download={"crm_contacts_sample.csv"}
                        >
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
                </>
              )}
            </div>
          </Form>

          <div className="flex justify-start pt-6 gap-2">
            {importer.state === "idle" ? (
              <Button onClick={startImport} disabled={!file}>
                Import
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={importer.state === "running"}
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog (when feature flag is enabled) */}
      {ENABLE_IMPORT_PREVIEW && showPreview && previewData && (
        <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Import Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <ContactImportPreview
                preview={previewData}
                onContinue={handlePreviewContinue}
                onCancel={handlePreviewCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Result Dialog */}
      {importResult && (
        <ContactImportResult
          open={showResult}
          onClose={() => {
            setShowResult(false);
            setImportResult(null);
            handleClose();
          }}
          result={importResult}
          allowRetry={false}
        />
      )}
    </>
  );
}

function millisecondsToTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (60 * 1000)) % 60);

  return `${minutes}m ${seconds}s`;
}

// Helper function to extract unique organizations from parsed data
function extractNewOrganizations(rows: ContactImportSchema[]): string[] {
  const organizations = new Set<string>();
  rows.forEach(row => {
    if (row.organization_name) {
      organizations.add(row.organization_name.trim());
    }
  });
  return Array.from(organizations);
}

// Helper function to extract unique tags from parsed data
function extractNewTags(rows: ContactImportSchema[]): string[] {
  const tags = new Set<string>();
  rows.forEach(row => {
    if (row.tags) {
      row.tags.split(',').forEach(tag => {
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
function findOrganizationsWithoutContacts(rows: ContactImportSchema[]): Array<{ organization_name: string; row: number }> {
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
function findContactsWithoutContactInfo(rows: ContactImportSchema[]): Array<{ name: string; organization_name: string; row: number }> {
  const contactsWithoutInfo: Array<{ name: string; organization_name: string; row: number }> = [];

  rows.forEach((row, index) => {
    if (isContactWithoutContactInfo(row)) {
      const hasFirstName = row.first_name && String(row.first_name).trim();
      const hasLastName = row.last_name && String(row.last_name).trim();
      const name = [
        hasFirstName ? String(row.first_name).trim() : '',
        hasLastName ? String(row.last_name).trim() : ''
      ].filter(Boolean).join(' ') || 'Unknown';

      contactsWithoutInfo.push({
        name,
        organization_name: row.organization_name ? String(row.organization_name).trim() : '',
        row: index + 4, // +3 for header rows, +1 for 1-indexed
      });
    }
  });

  return contactsWithoutInfo;
}
