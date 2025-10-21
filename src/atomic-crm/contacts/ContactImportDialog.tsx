import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Form, useRefresh } from "ra-core";
import { Link } from "react-router-dom";
import { usePapaParse } from "../misc/usePapaParse";
import type { ContactImportSchema, ImportResult } from "./useContactImport";
import { useContactImport } from "./useContactImport";
import { mapHeadersToFields } from "./columnAliases";
import type { PreviewData } from "./ContactImportPreview";
import { ContactImportPreview } from "./ContactImportPreview";
import { ContactImportResult } from "./ContactImportResult";

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
      console.log('🔵 [IMPORT DEBUG] Calling processBatchHook...');
      const result = await processBatchHook(batch, {
        preview: false,
        startingRow: rowOffsetRef.current + 1,  // Pass correct starting row for this batch
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
  }, [processBatchHook]);

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

      setImportResult(finalResult);
      setShowResult(true);
      refresh();
    }
  }, [actualImporter.importer.state, refresh]);

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
  const handlePreviewContinue = () => {
    console.log('🚀 [IMPORT DEBUG] handlePreviewContinue called');
    console.log('🚀 [IMPORT DEBUG] File:', file?.name, 'Size:', file?.size);

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
              {importer.state === "running" && (
                <div className="flex flex-col gap-2">
                  <Alert>
                    <AlertDescription className="flex flex-row gap-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      The import is running, please do not close this tab.
                    </AlertDescription>
                  </Alert>

                  <div className="text-sm">
                    Imported{" "}
                    <strong>
                      {importer.importCount} / {importer.rowCount}
                    </strong>{" "}
                    contacts, with <strong>{importer.errorCount}</strong> errors.
                    {importer.remainingTime !== null && (
                      <>
                        {" "}
                        Estimated remaining time:{" "}
                        <strong>
                          {millisecondsToTime(importer.remainingTime)}
                        </strong>
                        .{" "}
                        <button
                          onClick={handleReset}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Stop import
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {importer.state === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to import this file, please make sure your provided a
                    valid CSV file.
                  </AlertDescription>
                </Alert>
              )}

              {importer.state === "complete" && !ENABLE_IMPORT_PREVIEW && (
                <Alert>
                  <AlertDescription>
                    Contacts import complete. Imported {importer.importCount}{" "}
                    contacts, with {importer.errorCount} errors
                  </AlertDescription>
                </Alert>
              )}

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
