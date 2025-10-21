import * as Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";
import { parseRawCsvData } from "../atomic-crm/contacts/csvProcessor";

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

type usePapaParseProps<T> = {
  // The import batch size
  batchSize?: number;

  // processBatch returns the number of imported items (optional - required for actual import, not for preview)
  processBatch?: (batch: T[]) => Promise<void>;

  // Optional: Callback for preview mode - receives parsed preview data
  onPreview?: (rows: T[]) => void;

  // Optional: Parse only first N rows for preview mode
  previewRowCount?: number;
};

export function usePapaParse<T>({
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
      console.log('📄 [PAPA PARSE DEBUG] parseCsv called for file:', file.name);
      console.log('📄 [PAPA PARSE DEBUG] Preview mode:', !!previewRowCount, 'Preview count:', previewRowCount);
      console.log('📄 [PAPA PARSE DEBUG] Has processBatch:', !!processBatch);

      setImporter({
        state: "parsing",
      });

      const importId = importIdRef.current;
      Papa.parse<T>(file, {
        header: false, // We'll manually handle headers after skipping rows
        skipEmptyLines: true, // This auto-skips line 3 (empty row)
        preview: previewRowCount ? previewRowCount + 2 : undefined, // Add 2 for skipped rows
        async complete(results) {
          console.log('📄 [PAPA PARSE DEBUG] Parse complete. Rows:', results.data.length);
          if (importIdRef.current !== importId) {
            return;
          }

          let transformedData: T[];
          try {
            // REFACTORED: Use the single source of truth to process raw CSV data.
            // This replaces ~40 lines of duplicated logic.
            transformedData = parseRawCsvData(results.data as any[][]) as T[];
          } catch (error: any) {
            console.error("🔴 [PAPA PARSE DEBUG] CSV processing error:", error);
            setImporter({
              state: "error",
              error: error instanceof Error ? error : new Error(String(error)),
            });
            return;
          }

          // If in preview mode, call onPreview callback and return early
          if (onPreview && previewRowCount) {
            console.log('📄 [PAPA PARSE DEBUG] Preview mode - calling onPreview with', transformedData.length, 'rows');
            onPreview(transformedData);
            setImporter({
              state: "idle",
            });
            return;
          }

          console.log('📄 [PAPA PARSE DEBUG] NOT preview mode - starting actual import');
          console.log('📄 [PAPA PARSE DEBUG] processBatch exists:', !!processBatch);

          if (!processBatch) {
            console.error('🔴 [PAPA PARSE DEBUG] ERROR: processBatch is undefined! Cannot import.');
            setImporter({
              state: "error",
              error: new Error('processBatch function not provided'),
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

          console.log('📄 [PAPA PARSE DEBUG] Starting batch processing. Total rows:', transformedData.length, 'Batch size:', batchSize);

          let totalTime = 0;
          for (let i = 0; i < transformedData.length; i += batchSize) {
            // Note: Removed importIdRef check that was breaking during React.StrictMode remounts
            // The check was causing early returns without setting state to "complete"

            const batch = transformedData.slice(i, i + batchSize);
            try {
              console.log('📄 [PAPA PARSE DEBUG] Processing batch', (i / batchSize) + 1, '- contacts:', batch.length);
              const start = Date.now();
              await processBatch(batch);
              const elapsed = Date.now() - start;
              totalTime += elapsed;
              console.log('📄 [PAPA PARSE DEBUG] Batch completed in', elapsed, 'ms');

              const meanTime = totalTime / (i + batch.length);
              setImporter((previous) => {
                if (previous.state === "running") {
                  const importCount = previous.importCount + batch.length;
                  return {
                    ...previous,
                    importCount,
                    remainingTime:
                      meanTime * (transformedData.length - importCount),
                  };
                }
                return previous;
              });
            } catch (error) {
              console.error("Failed to import batch", error);
              setImporter((previous) =>
                previous.state === "running"
                  ? {
                      ...previous,
                      errorCount: previous.errorCount + batch.length,
                    }
                  : previous,
              );
            }
          }

          console.log('✅ [PAPA PARSE DEBUG] All batches processed successfully. Setting state to complete.');

          setImporter((previous) =>
            previous.state === "running"
              ? {
                  ...previous,
                  state: "complete",
                  remainingTime: null,
                }
              : previous,
          );
        },
        error(error) {
          console.error(
            "CSV parse error:",
            error instanceof Error ? error.message : String(error),
          );
          setImporter({
            state: "error",
            error,
          });
        },
        dynamicTyping: true,
      });
    },
    [batchSize, processBatch, onPreview, previewRowCount],
  );

  return useMemo(
    () => ({
      importer,
      parseCsv,
      reset,
    }),
    [importer, parseCsv, reset],
  );
}
