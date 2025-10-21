import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Building2, Upload } from "lucide-react";
import { useRefresh, useNotify } from "ra-core";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { mapHeadersToFields } from "./organizationColumnAliases";
import { useOrganizationImport, type ImportResult, type ImportError } from "./useOrganizationImport";

type OrganizationImportDialogProps = {
  open: boolean;
  onClose(): void;
};

type ImportState = "idle" | "parsing" | "running" | "complete" | "error";

export function OrganizationImportDialog({
  open,
  onClose,
}: OrganizationImportDialogProps) {
  const refresh = useRefresh();
  const notify = useNotify();
  const processBatchHook = useOrganizationImport();

  const [file, setFile] = useState<File | null>(null);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Enhanced processBatch wrapper with result accumulation across batches
  const processBatch = useCallback(async (batch: any[]) => {
    // Set start time on first batch
    if (!accumulatedResultRef.current.startTime) {
      accumulatedResultRef.current.startTime = new Date();
    }

    try {
      const result = await processBatchHook(batch, {
        preview: false,
        startingRow: rowOffsetRef.current + 2, // +2 for CSV header row
        onProgress: (current, total) => {
          setImportProgress(prev => ({ ...prev, count: prev.count + 1 }));
        }
      });

      rowOffsetRef.current += batch.length;

      // Accumulate results across all batches
      accumulatedResultRef.current.totalProcessed += result.totalProcessed;
      accumulatedResultRef.current.successCount += result.successCount;
      accumulatedResultRef.current.skippedCount += result.skippedCount;
      accumulatedResultRef.current.failedCount += result.failedCount;
      accumulatedResultRef.current.errors.push(...result.errors);
    } catch (error: any) {
      const errorMessage = error.message || "A critical error occurred during batch processing.";
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
  }, [processBatchHook]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];

        // Map CSV headers to canonical field names
        const headers = results.meta.fields || [];
        const columnMapping = mapHeadersToFields(headers);

        // Transform rows using column mapping
        const mappedRows = rows.map((row) => {
          const mappedRow: any = {};
          headers.forEach((header) => {
            const canonicalField = columnMapping[header];
            if (canonicalField && row[header]) {
              mappedRow[canonicalField] = row[header];
            }
          });
          return mappedRow;
        });

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

        setImportProgress({ count: 0, total: mappedRows.length });
        setImportState("running");

        try {
          // Process organizations in batches to prevent overwhelming the server
          const batchSize = 10;
          for (let i = 0; i < mappedRows.length; i += batchSize) {
            const batch = mappedRows.slice(i, i + batchSize);
            await processBatch(batch);
            setImportProgress(prev => ({ ...prev, count: i + batch.length }));
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
        } catch (error: any) {
          notify(`Import failed: ${error.message}`, { type: "error" });
          setImportState("error");
        }
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
    importProgress.total > 0
      ? Math.round((importProgress.count / importProgress.total) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Import Organizations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          {importState === "idle" && (
            <>
              <Alert>
                <AlertDescription>
                  Upload a CSV file with organization data. Required column: name (or
                  "Organization Name"). Optional columns: website, phone, address, city,
                  state, postal_code, linkedin_url, priority, organization_type,
                  description.
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
                  Importing organizations... {importProgress.count} of{" "}
                  {importProgress.total}
                </span>
              </div>
              <Progress value={progressPercent} />
            </div>
          )}

          {/* Import Complete */}
          {importState === "complete" && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Import Complete</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {importResult.totalProcessed}
                  </div>
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
                  Failed to parse CSV file. Please check the file format and try
                  again.
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
  );
}
