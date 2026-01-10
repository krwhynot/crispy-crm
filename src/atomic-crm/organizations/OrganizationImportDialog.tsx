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
import { useState, useCallback, useMemo, useEffect } from "react";
import { useOrganizationImportUpload } from "./useOrganizationImportUpload";
import { useOrganizationImportParser } from "./useOrganizationImportParser";
import { useOrganizationImportMapper } from "./useOrganizationImportMapper";
import { useOrganizationImportExecution } from "./useOrganizationImportExecution";
import { useOrganizationImportPreview } from "./useOrganizationImportPreview";
import OrganizationImportPreview, { type DataQualityDecisions } from "./OrganizationImportPreview";
import type { RawCSVRow, MappedCSVRow } from "./types";
import type { ImportResult } from "./useOrganizationImport";

interface OrganizationImportDialogProps {
  open: boolean;
  onClose(): void;
}

type ImportState = "idle" | "parsing" | "running" | "complete" | "error";

export function OrganizationImportDialog({ open, onClose }: OrganizationImportDialogProps) {
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importProgress, setImportProgress] = useState({ count: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<RawCSVRow[]>([]);

  const upload = useOrganizationImportUpload();
  const parser = useOrganizationImportParser();
  const mapper = useOrganizationImportMapper();
  const preview = useOrganizationImportPreview();
  const execution = useOrganizationImportExecution({
    onProgressChange: setImportProgress,
    onStateChange: setImportState,
  });

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

  const mergedMappings = useMemo<Record<string, string | null>>(() => {
    if (rawHeaders.length === 0) return {};
    const autoMappings = require("./organizationColumnAliases").mapHeadersToFields(rawHeaders);
    const finalMappings: Record<string, string | null> = {};
    rawHeaders.forEach((header) => {
      finalMappings[header] = preview.userOverrides.get(header) ?? autoMappings[header];
    });
    return finalMappings;
  }, [rawHeaders, preview.userOverrides]);

  const reprocessedOrganizations = useMemo<MappedCSVRow[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return [];
    }
    return rawDataRows.map((row) =>
      mapper.transformRowData(
        row,
        rawHeaders,
        mergedMappings,
        mapper.salesLookupCache.current,
        mapper.segmentsLookupCache.current
      )
    );
  }, [rawHeaders, rawDataRows, mergedMappings, mapper]);

  const derivedPreviewData = useMemo(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return preview.previewData;
    }
    return preview.generatePreviewData(rawHeaders, rawDataRows, reprocessedOrganizations);
  }, [reprocessedOrganizations, rawHeaders, rawDataRows, preview]);

  const handleImport = useCallback(async () => {
    if (!upload.file) {
      return;
    }

    setImportState("parsing");

    parser.parseFile(upload.file, {
      onComplete: async (result) => {
        const { headers, rows } = result;
        setRawHeaders(headers);
        setRawDataRows(rows);

        const columnMapping = require("./organizationColumnAliases").mapHeadersToFields(headers);

        mapper.clearCaches();
        await mapper.resolveAccountManagers(rows, headers, columnMapping);
        await mapper.resolveSegments(rows, headers, columnMapping);

        preview.generatePreviewData(
          headers,
          rows,
          rows.map((row) =>
            mapper.transformRowData(
              row,
              headers,
              columnMapping,
              mapper.salesLookupCache.current,
              mapper.segmentsLookupCache.current
            )
          )
        );

        setImportState("idle");
        setShowPreview(true);
      },
      onError: () => {
        setImportState("error");
      },
    });
  }, [upload.file, parser, mapper, preview]);

  const handlePreviewContinue = useCallback(
    async (decisions: DataQualityDecisions) => {
      setShowPreview(false);
      const result = await execution.executeImport(reprocessedOrganizations, decisions);
      setImportResult(result);
    },
    [reprocessedOrganizations, execution]
  );

  const handlePreviewCancel = useCallback(() => {
    setShowPreview(false);
    preview.resetPreview();
    setRawHeaders([]);
    setRawDataRows([]);
  }, [preview]);

  const handleClose = useCallback(() => {
    upload.resetUpload();
    setImportState("idle");
    setImportResult(null);
    setImportProgress({ count: 0, total: 0 });
    setShowPreview(false);
    preview.resetPreview();
    setRawHeaders([]);
    setRawDataRows([]);
    execution.resetAccumulatedResult();
    onClose();
  }, [upload, preview, execution, onClose]);

  const progressPercent =
    importProgress.total > 0 ? Math.round((importProgress.count / importProgress.total) * 100) : 0;

  return (
    <>
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
                    ref={upload.fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={upload.handleFileChange}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => upload.fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {upload.file ? upload.file.name : "Choose CSV file"}
                  </Button>
                  {upload.file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {upload.file.name} ({Math.round(upload.file.size / 1024)} KB)
                    </p>
                  )}
                </div>

                {upload.validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="font-semibold mb-2">File validation failed:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {upload.validationErrors.map((error, idx) => (
                          <li key={idx}>{error.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {upload.validationWarnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <div className="font-semibold mb-2">Warnings:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {upload.validationWarnings.map((warning, idx) => (
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
                  <Button onClick={handleImport} disabled={!upload.file}>
                    Import
                  </Button>
                </div>
              </>
            )}

            {importState === "parsing" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Parsing CSV file...</span>
              </div>
            )}

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
                onMappingChange={preview.handleMappingChange}
                userOverrides={preview.userOverrides}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
