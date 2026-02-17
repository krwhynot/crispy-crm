/**
 * useDuplicateOrgCheck - Hook for hard duplicate organization detection
 *
 * Provides a way to check for potential duplicate organizations before saving.
 * If a duplicate is detected, the user must either view the existing organization
 * or change the name -- there is no bypass path.
 *
 * @example
 * ```tsx
 * const { checkForDuplicate, duplicateOrg, clearDuplicate } = useDuplicateOrgCheck();
 *
 * // In save handler:
 * const duplicate = await checkForDuplicate(name, currentOrgId);
 * if (duplicate) {
 *   // Show blocking dialog - user must change name or view existing
 *   return; // Don't save
 * }
 * // No duplicate - proceed with save
 * ```
 */
import { useState, useCallback } from "react";
import { useDataProvider, useNotify } from "ra-core";
import { logger } from "@/lib/logger";
import type { Company } from "../types";

interface DuplicateOrgInfo {
  id: string | number;
  name: string;
}

interface UseDuplicateOrgCheckResult {
  /** Check if a name has duplicates. Returns the duplicate org if found. */
  checkForDuplicate: (
    name: string,
    currentOrgId?: string | number
  ) => Promise<DuplicateOrgInfo | null>;
  /** The currently detected duplicate org (if any) */
  duplicateOrg: DuplicateOrgInfo | null;
  /** Clear the duplicate warning (user chose to change name) */
  clearDuplicate: () => void;
  /** Whether a duplicate check is in progress */
  isChecking: boolean;
}

export function useDuplicateOrgCheck(): UseDuplicateOrgCheckResult {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [duplicateOrg, setDuplicateOrg] = useState<DuplicateOrgInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkForDuplicate = useCallback(
    async (name: string, currentOrgId?: string | number): Promise<DuplicateOrgInfo | null> => {
      // Empty names handled by required validation
      if (!name || name.trim().length === 0) {
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

  return {
    checkForDuplicate,
    duplicateOrg,
    clearDuplicate,
    isChecking,
  };
}
