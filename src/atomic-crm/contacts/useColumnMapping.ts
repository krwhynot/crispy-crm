/**
 * useColumnMapping - Reusable hook for CSV column-to-field mapping
 *
 * Extracted from ContactImportDialog.tsx to:
 * 1. Reduce component complexity (god component anti-pattern)
 * 2. Enable reuse for other import dialogs (organizations, opportunities)
 * 3. Isolate pure derived state for easier testing
 *
 * @see /docs/architecture/csv-import-architecture.md
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { mapHeadersToFields } from "./columnAliases";
import { processCsvDataWithMappings } from "./csvProcessor";
import type { ContactImportSchema } from "./contactImport.types";

/**
 * Return type for useColumnMapping hook
 */
export interface UseColumnMappingReturn {
  /** Final mappings (auto-detected merged with user overrides) */
  mappings: Record<string, string | null>;

  /** User's manual overrides (exposed for UI "Custom" badge display) */
  overrides: ReadonlyMap<string, string | null>;

  /** Contacts with current mappings applied - SOURCE OF TRUTH for import */
  contacts: ContactImportSchema[];

  /** Raw headers from CSV (for preview UI) */
  headers: string[];

  /** Set or clear a single column override */
  setOverride: (csvHeader: string, targetField: string | null) => void;

  /** Initialize with parsed CSV data (called from onPreview callback) */
  setRawData: (headers: string[], rows: unknown[][]) => void;

  /** Reset all state (called when dialog closes or new file selected) */
  reset: () => void;

  /** True if data has been loaded */
  hasData: boolean;
}

/**
 * Hook for managing CSV column-to-CRM-field mappings with user overrides.
 *
 * Implements a two-layer mapping strategy:
 * 1. Auto-detection via `mapHeadersToFields()` from columnAliases.ts
 * 2. User overrides stored in a Map (takes precedence over auto-detection)
 *
 * State is derived declaratively:
 * - rawHeaders + userOverrides → mergedMappings
 * - rawDataRows + mergedMappings → processedContacts
 *
 * @example
 * ```tsx
 * const { mappings, contacts, setOverride, setRawData, reset } = useColumnMapping();
 *
 * // When CSV is parsed
 * const onPreview = (data) => {
 *   setRawData(data.headers, data.rawDataRows);
 * };
 *
 * // When user changes a mapping in the UI
 * <Select onValueChange={(value) => setOverride(header, value)} />
 *
 * // When importing
 * await processBatch(contacts);
 * ```
 */
export function useColumnMapping(): UseColumnMappingReturn {
  // Core state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<unknown[][]>([]);
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());

  // Track previous headers to detect new file selection
  const prevHeadersRef = useRef<string[]>([]);

  // Reset overrides when headers change (new file selected)
  // This prevents stale overrides from a previous file affecting the new one
  useEffect(() => {
    const headersChanged =
      rawHeaders.length > 0 &&
      (prevHeadersRef.current.length !== rawHeaders.length ||
        !rawHeaders.every((h, i) => h === prevHeadersRef.current[i]));

    if (headersChanged) {
      setUserOverrides(new Map());
      prevHeadersRef.current = rawHeaders;
    }
  }, [rawHeaders]);

  /**
   * Derive final mappings by merging auto-detection with user overrides.
   * Priority: User override > Auto-detection
   */
  const mappings = useMemo<Record<string, string | null>>(() => {
    if (rawHeaders.length === 0) return {};

    const autoMappings = mapHeadersToFields(rawHeaders);
    const finalMappings: Record<string, string | null> = {};

    rawHeaders.forEach((header) => {
      // User override takes precedence over auto-detection
      finalMappings[header] = userOverrides.get(header) ?? autoMappings[header];
    });

    return finalMappings;
  }, [rawHeaders, userOverrides]);

  /**
   * Derive processed contacts by applying current mappings to raw data.
   * THIS IS THE SOURCE OF TRUTH FOR THE IMPORT - not re-parsing the file!
   */
  const contacts = useMemo<ContactImportSchema[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) {
      return [];
    }
    return processCsvDataWithMappings(rawHeaders, rawDataRows, mappings);
  }, [rawHeaders, rawDataRows, mappings]);

  /**
   * Set or clear a single column override.
   * - Pass a field name to override auto-detection
   * - Pass null or empty string to revert to auto-detection
   */
  const setOverride = useCallback((csvHeader: string, targetField: string | null) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      if (targetField === null || targetField === "") {
        // Clear override → revert to auto-detection
        next.delete(csvHeader);
      } else {
        next.set(csvHeader, targetField);
      }
      return next;
    });
  }, []);

  /**
   * Initialize with parsed CSV data.
   * Called from the onPreview callback when usePapaParse completes parsing.
   */
  const setRawData = useCallback((headers: string[], rows: unknown[][]) => {
    setRawHeaders(headers);
    setRawDataRows(rows);
  }, []);

  /**
   * Reset all state to initial values.
   * Called when dialog closes or user cancels import.
   */
  const reset = useCallback(() => {
    setUserOverrides(new Map());
    setRawHeaders([]);
    setRawDataRows([]);
    prevHeadersRef.current = [];
  }, []);

  return {
    mappings,
    overrides: userOverrides,
    contacts,
    headers: rawHeaders,
    setOverride,
    setRawData,
    reset,
    hasData: rawHeaders.length > 0,
  };
}
