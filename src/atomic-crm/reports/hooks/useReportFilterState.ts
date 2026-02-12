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

/** Overview tab filter state */
export interface OverviewFilterState {
  datePreset: string;
  salesRepId: number | null;
}

const OVERVIEW_DEFAULTS: OverviewFilterState = {
  datePreset: "last30",
  salesRepId: null,
};

/** Campaign tab filter state */
export interface CampaignFilterState {
  selectedCampaign: string;
  datePreset: string;
  selectedActivityTypes: string[];
  selectedSalesRep: number | null;
  showStaleLeads: boolean;
}

const CAMPAIGN_DEFAULTS: CampaignFilterState = {
  selectedCampaign: "",
  datePreset: "allTime",
  selectedActivityTypes: [],
  selectedSalesRep: null,
  showStaleLeads: false,
};

/** Weekly tab filter state */
export interface WeeklyFilterState {
  start: string;
  end: string;
}

// Defaults are dynamic (current week), so the hook accepts them as a param

/** Opportunities tab filter state */
export interface OpportunitiesFilterState {
  principal_organization_id: number | null;
  stage: string[];
  opportunity_owner_id: number | null;
  startDate: string | null;
  endDate: string | null;
}

const OPPORTUNITIES_DEFAULTS: OpportunitiesFilterState = {
  principal_organization_id: null,
  stage: [],
  opportunity_owner_id: null,
  startDate: null,
  endDate: null,
};

type FilterState =
  | OverviewFilterState
  | CampaignFilterState
  | WeeklyFilterState
  | OpportunitiesFilterState;

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
 * Build a shareable URL with current tab and filter state encoded.
 *
 * @param tab - Active tab key
 * @param filters - Current filter state to encode
 * @param baseUrl - Base URL (defaults to current page URL without params)
 * @returns Full shareable URL string
 */
export function buildShareUrl<T extends FilterState>(
  tab: string,
  filters: T,
  defaults: T,
  baseUrl?: string
): string {
  const base = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set("tab", tab);

  // Only include non-default filter values to keep URL clean
  const nonDefaults: Record<string, unknown> = {};
  let hasNonDefaults = false;

  for (const key of Object.keys(filters)) {
    const filterVal = (filters as Record<string, unknown>)[key];
    const defaultVal = (defaults as Record<string, unknown>)[key];

    if (JSON.stringify(filterVal) !== JSON.stringify(defaultVal)) {
      nonDefaults[key] = filterVal;
      hasNonDefaults = true;
    }
  }

  if (hasNonDefaults) {
    params.set("filters", encodeURIComponent(JSON.stringify(nonDefaults)));
  }

  return `${base}?${params.toString()}`;
}

// Export defaults for consumer use
export { OVERVIEW_DEFAULTS, CAMPAIGN_DEFAULTS, OPPORTUNITIES_DEFAULTS };
