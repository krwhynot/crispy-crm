import * as Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";
import { parseRawCsvData } from "./csvProcessor";

type Import =
  | {
      state: "idle";
    }
  | {
      state: "parsing";
    }
  | {
      state: "running" | "complete";

      rowCount: number;
      importCount: number;
      errorCount: number;

      // The remaining time in milliseconds
      remainingTime: number | null;
    }
  | {
      state: "error";

      error: Error;
    };

interface usePapaParseProps<T = Record<string, unknown>> {
  // The import batch size
  batchSize?: number;

  // processBatch returns the number of imported items (optional - required for actual import, not for preview)
  processBatch?: (batch: T[]) => Promise<void>;

  // Optional: Callback for preview mode - receives parsed preview data, headers, and raw data rows
  onPreview?: (data: { rows: T[]; headers: string[]; rawDataRows?: unknown[][] }) => void;

  // Optional: Parse only first N rows for preview mode
  previewRowCount?: number;
}

export function usePapaParse<T = Record<string, unknown>>({
  batchSize = 10,
  processBatch,
  onPreview,
  previewRowCount,
}: usePapaParseProps<T>) {
  const importIdRef = useRef<number>(0);

  const [importer, setImporter] = useState<Import>({
    state: "idle",
  });

  const reset = useCallback(() => {
    setImporter({
      state: "idle",
    });
    importIdRef.current += 1;
  }, []);

  const parseCsv = useCallback(
    (file: File) => {
      setImporter({
        state: "parsing",
      });

      const importId = importIdRef.current;
      // When header: false, PapaParse returns string[][] (array of row arrays)
      Papa.parse<string[]>(file, {
        header: false, // We'll manually handle headers after skipping rows
        skipEmptyLines: true, // This auto-skips line 3 (empty row)
        preview: previewRowCount ? previewRowCount + 2 : undefined, // Add 2 for skipped rows
        async complete(results) {
          if (importIdRef.current !== importId) {
            return;
          }

          let transformedData: T[];
          let headers: string[];
          try {
            // REFACTORED: Use the single source of truth to process raw CSV data.
            // results.data is string[][] when header: false
            const rawData = results.data as unknown[][];
            const parseResult = parseRawCsvData(rawData);
            transformedData = parseResult.contacts as T[];
            headers = parseResult.headers;
          } catch (error: unknown) {
            setImporter({
              state: "error",
              error: error instanceof Error ? error : new Error(String(error)),
            });
            return;
          }

          // If in preview mode, call onPreview callback and return early
          if (onPreview && previewRowCount) {
            // Pass raw data rows (skip first 3 rows: instructions, empty, headers)
            const rawData = results.data as unknown[][];
            const rawDataRows = rawData.slice(3);
            onPreview({ rows: transformedData, headers, rawDataRows });
            setImporter({
              state: "idle",
            });
            return;
          }

          if (!processBatch) {
            setImporter({
              state: "error",
              error: new Error("processBatch function not provided"),
            });
            return;
          }

          setImporter({
            state: "running",
            rowCount: transformedData.length,
            errorCount: results.errors.length,
            importCount: 0,
            remainingTime: null,
          });

          let totalTime = 0;
          for (let i = 0; i < transformedData.length; i += batchSize) {
            // Note: Removed importIdRef check that was breaking during React.StrictMode remounts
            // The check was causing early returns without setting state to "complete"

            const batch = transformedData.slice(i, i + batchSize);
            try {
              const start = Date.now();
              await processBatch(batch);
              const elapsed = Date.now() - start;
              totalTime += elapsed;

              const meanTime = totalTime / (i + batch.length);
              setImporter((previous) => {
                if (previous.state === "running") {
                  const importCount = previous.importCount + batch.length;
                  return {
                    ...previous,
                    importCount,
                    remainingTime: meanTime * (transformedData.length - importCount),
                  };
                }
                return previous;
              });
            } catch (error: unknown) {
              console.error("Batch processing error:", error);
              setImporter((previous) =>
                previous.state === "running"
                  ? {
                      ...previous,
                      errorCount: previous.errorCount + batch.length,
                    }
                  : previous
              );
            }
          }

          setImporter((previous) =>
            previous.state === "running"
              ? {
                  ...previous,
                  state: "complete",
                  remainingTime: null,
                }
              : previous
          );
        },
        error(error) {
          setImporter({
            state: "error",
            error,
          });
        },
        dynamicTyping: false, // Keep all values as strings to avoid type conversion issues (e.g., phone numbers)
      });
    },
    [batchSize, processBatch, onPreview, previewRowCount]
  );

  return useMemo(
    () => ({
      importer,
      parseCsv,
      reset,
    }),
    [importer, parseCsv, reset]
  );
}
