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
        header: false, // We'll manually handle headers after skipping rows
        skipEmptyLines: true,
        preview: previewRowCount ? previewRowCount + 2 : undefined, // Add 2 for skipped rows
        async complete(results) {
          if (importIdRef.current !== importId) {
            return;
          }

          // Skip first 2 instruction rows and use row 3 as headers
          const rawData = results.data as any[][];
          if (rawData.length < 3) {
            setImporter({
              state: "error",
              errorMessage: "CSV file is too short (less than 3 rows)",
            });
            return;
          }

          // Row 3 (index 2) contains the actual headers
          const headers = rawData[2] as string[];

          // Rows 4+ (index 3+) contain the data
          const dataRows = rawData.slice(3);

          // Convert to objects using headers
          const data = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj as T;
          });

          // Transform headers if a transformation function is provided
          let transformedData = data; // Start with untransformed data
          if (transformHeaders) {
            const transformedHeaders = transformHeaders(headers);

            // Remap data with transformed headers
            transformedData = data.map((row: any) => {
              const newRow: any = {};
              headers.forEach((oldHeader, index) => {
                const newHeader = transformedHeaders[index] || oldHeader;
                newRow[newHeader] = row[oldHeader];
              });
              return newRow as T;
            });
          }

          // If in preview mode, call onPreview callback and return early
          if (onPreview && previewRowCount) {
            onPreview(transformedData);
            setImporter({
              state: "idle",
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
            if (importIdRef.current !== importId) {
              return;
            }

            const batch = transformedData.slice(i, i + batchSize);
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
