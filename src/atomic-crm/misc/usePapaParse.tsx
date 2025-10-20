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
        skipEmptyLines: true, // This auto-skips line 3 (empty row)
        preview: previewRowCount ? previewRowCount + 2 : undefined, // Add 2 for skipped rows
        async complete(results) {
          if (importIdRef.current !== importId) {
            return;
          }

          // With skipEmptyLines, Papa Parse structure is:
          // rawData[0] = Lines 1-2 (instruction rows)
          // rawData[1] = Lines 4-8 (header row - multiline cells combined)
          // rawData[2+] = Line 9+ (data rows)
          const rawData = results.data as any[][];
          if (rawData.length < 3) {
            setImporter({
              state: "error",
              errorMessage: "CSV file is too short (less than 3 rows)",
            });
            return;
          }

          // Row 2 (index 1) contains the actual headers (multiline cells are combined by Papa Parse)
          const headers = rawData[1] as string[];

          // Rows 3+ (index 2+) contain the data
          const dataRows = rawData.slice(2);

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

                // Handle full name splitting
                if (newHeader === '_full_name_source_') {
                  const fullName = row[oldHeader] || '';
                  const nameParts = fullName.trim().split(/\s+/);

                  if (nameParts.length === 0 || fullName.trim() === '') {
                    // Empty name
                    newRow.first_name = '';
                    newRow.last_name = '';
                  } else if (nameParts.length === 1) {
                    // Only one name part - treat as last name
                    newRow.first_name = '';
                    newRow.last_name = nameParts[0];
                  } else {
                    // Multiple parts - first is first name, rest is last name
                    newRow.first_name = nameParts[0];
                    newRow.last_name = nameParts.slice(1).join(' ');
                  }
                } else {
                  newRow[newHeader] = row[oldHeader];
                }
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
