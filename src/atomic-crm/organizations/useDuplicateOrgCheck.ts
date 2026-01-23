/**
 * useDuplicateOrgCheck - Hook for soft duplicate organization detection
 *
 * Provides a way to check for potential duplicate organizations before saving,
 * with the ability to bypass the warning if the user confirms.
 *
 * This implements a "soft warning" pattern instead of hard validation blocking:
 * - Check is performed on save attempt
 * - If duplicate found, returns the duplicate org info
 * - User can confirm to proceed anyway via the confirmation dialog
 * - Once bypassed, the same name won't trigger the warning again
 *
 * @example
 * ```tsx
 * const { checkForDuplicate, duplicateOrg, clearDuplicate, bypassDuplicate } = useDuplicateOrgCheck();
 *
 * // In save handler:
 * const duplicate = await checkForDuplicate(name, currentOrgId);
 * if (duplicate) {
 *   // Show confirmation dialog
 *   return; // Don't save yet
 * }
 * // No duplicate or already bypassed - proceed with save
 * ```
 */
import { useState, useCallback, useRef } from "react";
import { useDataProvider, useNotify } from "ra-core";
import { logger } from "@/lib/logger";
import type { Company } from "../types";

interface DuplicateOrgInfo {
  id: string | number;
  name: string;
}

interface UseDuplicateOrgCheckResult {
  /** Check if a name has duplicates. Returns the duplicate org if found (and not bypassed). */
  checkForDuplicate: (
    name: string,
    currentOrgId?: string | number
  ) => Promise<DuplicateOrgInfo | null>;
  /** The currently detected duplicate org (if any) */
  duplicateOrg: DuplicateOrgInfo | null;
  /** Clear the duplicate warning (user chose to change name) */
  clearDuplicate: () => void;
  /** Mark the duplicate as bypassed (user confirmed to proceed anyway) */
  bypassDuplicate: () => void;
  /** Whether a duplicate check is in progress */
  isChecking: boolean;
}

export function useDuplicateOrgCheck(): UseDuplicateOrgCheckResult {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [duplicateOrg, setDuplicateOrg] = useState<DuplicateOrgInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Track bypassed names (lowercase for case-insensitive comparison)
  const bypassedNamesRef = useRef<Set<string>>(new Set());

  const checkForDuplicate = useCallback(
    async (name: string, currentOrgId?: string | number): Promise<DuplicateOrgInfo | null> => {
      // Empty names handled by required validation
      if (!name || name.trim().length === 0) {
        return null;
      }

      const normalizedName = name.trim().toLowerCase();

      // Check if this name was already bypassed
      if (bypassedNamesRef.current.has(normalizedName)) {
        return null;
      }

      setIsChecking(true);
      try {
        // Search for organizations with the same name (case-insensitive via ilike)
        // NOTE: Don't add deleted_at filter here - the composed data provider
        // routes list operations to organizations_summary view which handles
        // soft-delete filtering internally and doesn't expose deleted_at column
        const { data } = await dataProvider.getList<Company>("organizations", {
          filter: {
            "name@ilike": name.trim(),
          },
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
        });

        // Filter out current record (for edit mode)
        const duplicates = data.filter((org) => String(org.id) !== String(currentOrgId));

        if (duplicates.length > 0) {
          const duplicate: DuplicateOrgInfo = {
            id: duplicates[0].id,
            name: duplicates[0].name,
          };
          setDuplicateOrg(duplicate);
          return duplicate;
        }

        return null;
      } catch (error: unknown) {
        logger.error("Failed to check for duplicate organization", error, {
          feature: "useDuplicateOrgCheck",
          name,
          currentOrgId,
        });
        notify("Unable to check for duplicate organizations. Please try again.", {
          type: "warning",
        });
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [dataProvider, notify]
  );

  const clearDuplicate = useCallback(() => {
    setDuplicateOrg(null);
  }, []);

  const bypassDuplicate = useCallback(() => {
    if (duplicateOrg) {
      // Add to bypassed set so it won't warn again
      bypassedNamesRef.current.add(duplicateOrg.name.toLowerCase());
    }
    setDuplicateOrg(null);
  }, [duplicateOrg]);

  return {
    checkForDuplicate,
    duplicateOrg,
    clearDuplicate,
    bypassDuplicate,
    isChecking,
  };
}
