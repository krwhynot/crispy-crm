import * as Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";

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

  // processBatch returns the number of imported items
  processBatch(batch: T[]): Promise<void>;

  // Optional: Transform headers during parsing (e.g., apply column aliases)
  transformHeaders?: (headers: string[]) => string[];

  // Optional: Callback for preview mode - receives parsed preview data
  onPreview?: (rows: T[]) => void;

  // Optional: Parse only first N rows for preview mode
  previewRowCount?: number;
};

export function usePapaParse<T>({
  batchSize = 10,
  processBatch,
  transformHeaders,
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
      Papa.parse<T>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: transformHeaders ? (header) => {
          // Apply header transformation if provided
          const headers = [header];
          const transformed = transformHeaders(headers);
          return transformed[0] || header;
        } : undefined,
        preview: previewRowCount, // Limit rows if in preview mode
        async complete(results) {
          if (importIdRef.current !== importId) {
            return;
          }

          // If in preview mode, call onPreview callback and return early
          if (onPreview && previewRowCount) {
            onPreview(results.data);
            setImporter({
              state: "idle",
            });
            return;
          }

          setImporter({
            state: "running",
            rowCount: results.data.length,
            errorCount: results.errors.length,
            importCount: 0,
            remainingTime: null,
          });

          let totalTime = 0;
          for (let i = 0; i < results.data.length; i += batchSize) {
            if (importIdRef.current !== importId) {
              return;
            }

            const batch = results.data.slice(i, i + batchSize);
            try {
              const start = Date.now();
              await processBatch(batch);
              totalTime += Date.now() - start;

              const meanTime = totalTime / (i + batch.length);
              setImporter((previous) => {
                if (previous.state === "running") {
                  const importCount = previous.importCount + batch.length;
                  return {
                    ...previous,
                    importCount,
                    remainingTime:
                      meanTime * (results.data.length - importCount),
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
    [batchSize, processBatch, transformHeaders, onPreview, previewRowCount],
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
