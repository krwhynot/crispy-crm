/**
 * useReportFilterState — Store-based filter persistence for report tabs
 *
 * Uses RA's useStore() (localStorage-backed) to persist report filters
 * across page navigation and tab switches.
 *
 * URL seeding: When the page loads with URL search params, they seed
 * the store, then are cleared from the URL to keep it clean.
 *
 * Share: getShareUrl() serializes current store state to a shareable URL.
 */

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "ra-core";
import { useSearchParams } from "react-router-dom";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";

/** Global report filter state — shared across all report tabs */
export interface GlobalReportFilterState {
  principalId: number | null;
  productId: number | null;
  ownerId: number | null;
  periodPreset: string;
  customStart: string | null;
  customEnd: string | null;
}

export const GLOBAL_DEFAULTS: GlobalReportFilterState = {
  principalId: null,
  productId: null,
  ownerId: null,
  periodPreset: "allTime",
  customStart: null,
  customEnd: null,
};

/** Campaign tab filter state */
export interface CampaignFilterState {
  selectedCampaign: string | null;
  selectedActivityTypes: string[];
  showStaleLeads: boolean;
}

const CAMPAIGN_DEFAULTS: CampaignFilterState = {
  selectedCampaign: null,
  selectedActivityTypes: INTERACTION_TYPE_OPTIONS.map((opt) => opt.value),
  showStaleLeads: false,
};

/** Opportunities tab filter state */
export interface OpportunitiesFilterState {
  stage: string[];
}

const OPPORTUNITIES_DEFAULTS: OpportunitiesFilterState = {
  stage: [],
};

type FilterState = GlobalReportFilterState | CampaignFilterState | OpportunitiesFilterState;

/**
 * Generic store-backed filter persistence hook.
 *
 * @param storeKey - localStorage key namespace (e.g., "reports.overview")
 * @param defaults - Default filter values for reset
 * @returns [state, setState, resetToDefaults]
 */
export function useReportFilterState<T extends FilterState>(
  storeKey: string,
  defaults: T
): [T, (update: Partial<T>) => void, () => void] {
  const [stored, setStored] = useStore<T>(storeKey, defaults);
  const [searchParams, setSearchParams] = useSearchParams();
  const seededRef = useRef(false);

  // On mount: seed store from URL params if present, then clear filter params from URL
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const filterParam = searchParams.get("filters");
    if (!filterParam) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(filterParam)) as Partial<T>;
      // Merge URL params into stored state (URL takes precedence)
      setStored({ ...stored, ...parsed });
    } catch {
      // Ignore malformed URL params
    }

    // Clean filter params from URL, preserve tab param
    const tab = searchParams.get("tab");
    const cleaned = new URLSearchParams();
    if (tab) cleaned.set("tab", tab);
    setSearchParams(cleaned, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount only
  }, []);

  const update = useCallback(
    (partial: Partial<T>) => {
      setStored({ ...stored, ...partial });
    },
    [stored, setStored]
  );

  const reset = useCallback(() => {
    setStored(defaults);
  }, [defaults, setStored]);

  return [stored, update, reset];
}

/**
 * Build a shareable URL with global + local filter state encoded.
 *
 * Supports the new split-store architecture: global filters go in a "global"
 * param, tab-local filters go in a "filters" param. Only non-default values
 * are serialized to keep URLs compact.
 *
 * Half-filled custom normalization: If periodPreset is "custom" but one of
 * the dates is missing, period fields are omitted entirely (no half state in URL).
 *
 * @param tab - Active tab key
 * @param globalFilters - Current global filter state
 * @param localFilters - Current tab-local filter state (optional)
 * @param localDefaults - Tab-local defaults for comparison (optional)
 * @param baseUrl - Base URL (defaults to current page URL without params)
 * @returns Full shareable URL string
 */
export function buildReportShareUrl(
  tab: string,
  globalFilters: GlobalReportFilterState,
  localFilters?: Record<string, unknown>,
  localDefaults?: Record<string, unknown>,
  baseUrl?: string
): string {
  const base = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set("tab", tab);

  // Serialize global -- only non-default values
  // Half-filled custom normalization: omit period fields if custom range incomplete
  const globalNonDefaults: Record<string, unknown> = {};
  let hasGlobal = false;

  for (const key of Object.keys(GLOBAL_DEFAULTS) as (keyof GlobalReportFilterState)[]) {
    // Skip half-filled custom period
    if (
      globalFilters.periodPreset === "custom" &&
      (globalFilters.customStart == null || globalFilters.customEnd == null)
    ) {
      if (key === "periodPreset" || key === "customStart" || key === "customEnd") continue;
    }

    const val = globalFilters[key];
    const def = GLOBAL_DEFAULTS[key];
    if (JSON.stringify(val) !== JSON.stringify(def)) {
      globalNonDefaults[key] = val;
      hasGlobal = true;
    }
  }

  if (hasGlobal) {
    params.set("global", encodeURIComponent(JSON.stringify(globalNonDefaults)));
  }

  // Serialize local -- only non-default values
  if (localFilters && localDefaults) {
    const localNonDefaults: Record<string, unknown> = {};
    let hasLocal = false;

    for (const key of Object.keys(localDefaults)) {
      const val = localFilters[key];
      const def = localDefaults[key];
      if (JSON.stringify(val) !== JSON.stringify(def)) {
        localNonDefaults[key] = val;
        hasLocal = true;
      }
    }

    if (hasLocal) {
      params.set("filters", encodeURIComponent(JSON.stringify(localNonDefaults)));
    }
  }

  return `${base}?${params.toString()}`;
}

// Export defaults for consumer use
export { CAMPAIGN_DEFAULTS, OPPORTUNITIES_DEFAULTS };
