import { useCallback, useRef } from "react";
import { useRefresh, useNotify } from "ra-core";
import {
  useOrganizationImport,
  type ImportResult,
  type ImportError,
} from "./useOrganizationImport";
import type { MappedCSVRow, OrganizationImportSchema } from "./types";
import type { DataQualityDecisions } from "./OrganizationImportPreview";

interface ExecutionProgress {
  count: number;
  total: number;
}

interface ExecutionState {
  processBatch: (batch: OrganizationImportSchema[]) => Promise<void>;
  executeImport: (
    organizations: MappedCSVRow[],
    decisions: DataQualityDecisions
  ) => Promise<ImportResult>;
  accumulatedResult: {
    totalProcessed: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    errors: ImportError[];
    startTime: Date | null;
  };
  resetAccumulatedResult: () => void;
}

interface ExecutionCallbacks {
  onProgressChange: (progress: ExecutionProgress) => void;
  onStateChange: (state: "running" | "complete" | "error") => void;
}

export function useOrganizationImportExecution(callbacks: ExecutionCallbacks): ExecutionState {
  const refresh = useRefresh();
  const notify = useNotify();
  const processBatchHook = useOrganizationImport();

  const { onProgressChange, onStateChange } = callbacks;

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

  const processBatch = useCallback(
    async (batch: OrganizationImportSchema[]) => {
      if (!accumulatedResultRef.current.startTime) {
        accumulatedResultRef.current.startTime = new Date();
      }

      try {
        const result = await processBatchHook(batch, {
          preview: false,
          startingRow: rowOffsetRef.current + 2,
          onProgress: (_current, _total) => {},
        });

        rowOffsetRef.current += batch.length;

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

        batch.forEach((orgData, index) => {
          accumulatedResultRef.current.errors.push({
            row: batchStartRow + index,
            data: orgData,
            errors: [{ field: "batch_processing", message: errorMessage }],
          });
        });

        accumulatedResultRef.current.totalProcessed += batch.length;
        accumulatedResultRef.current.failedCount += batch.length;
        rowOffsetRef.current += batch.length;
      }
    },
    [processBatchHook, notify, onProgressChange]
  );

  const executeImport = useCallback(
    async (
      organizations: MappedCSVRow[],
      decisions: DataQualityDecisions
    ): Promise<ImportResult> => {
      let organizationsToImport = organizations.filter(
        (org) => org.name && String(org.name).trim() !== ""
      );

      if (decisions.skipDuplicates) {
        const seenNames = new Set<string>();
        organizationsToImport = organizationsToImport.filter((org) => {
          const normalizedName = org.name!.toLowerCase().trim();
          if (seenNames.has(normalizedName)) return false;
          seenNames.add(normalizedName);
          return true;
        });
      }

      accumulatedResultRef.current = {
        totalProcessed: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [],
        startTime: null,
      };
      rowOffsetRef.current = 0;

      onStateChange("running");
      onProgressChange({ count: 0, total: organizationsToImport.length });

      try {
        const batchSize = 10;
        for (let i = 0; i < organizationsToImport.length; i += batchSize) {
          const batch = organizationsToImport.slice(i, i + batchSize);
          await processBatch(batch);
          onProgressChange({ count: i + batch.length, total: organizationsToImport.length });
        }

        onStateChange("complete");

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

        refresh();
        return finalResult;
      } catch (error: unknown) {
        notify(`Import failed: ${error instanceof Error ? error.message : "Import failed"}`, {
          type: "error",
        });
        onStateChange("error");
        throw error;
      }
    },
    [processBatch, refresh, notify, onProgressChange, onStateChange]
  );

  const resetAccumulatedResult = useCallback(() => {
    accumulatedResultRef.current = {
      totalProcessed: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      startTime: null,
    };
    rowOffsetRef.current = 0;
  }, []);

  return {
    processBatch,
    executeImport,
    accumulatedResult: accumulatedResultRef.current,
    resetAccumulatedResult,
  };
}
