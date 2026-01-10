import { useCallback } from "react";
import Papa from "papaparse";
import { useNotify } from "ra-core";
import { getSecurePapaParseConfig } from "../utils/csvUploadValidator";
import type { RawCSVRow } from "./types";

interface ParseResult {
  headers: string[];
  rows: RawCSVRow[];
}

interface ParserCallbacks {
  onComplete: (result: ParseResult) => void;
  onError: (error: Error) => void;
}

interface ParserState {
  parseFile: (file: File, callbacks: ParserCallbacks) => void;
}

export function useOrganizationImportParser(): ParserState {
  const notify = useNotify();

  const parseFile = useCallback(
    (file: File, callbacks: ParserCallbacks) => {
      Papa.parse(file, {
        ...getSecurePapaParseConfig(),
        complete: (results) => {
          const rows = results.data as RawCSVRow[];
          const headers = results.meta.fields || [];

          const rawRows = rows.map((row) => headers.map((h) => row[h]));

          callbacks.onComplete({
            headers,
            rows: rawRows,
          });
        },
        error: (error) => {
          notify(`Error parsing CSV: ${error.message}`, { type: "error" });
          callbacks.onError(error);
        },
      });
    },
    [notify]
  );

  return {
    parseFile,
  };
}
