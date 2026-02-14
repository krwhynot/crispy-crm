import { useState, useMemo, useEffect, useRef } from "react";
import { useGetList, useNotify } from "ra-core";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { TrendingUp, Building2, BarChart3, Download } from "lucide-react";
import { KPICard } from "@/components/ui/kpi-card";
import { AdminButton } from "@/components/admin/AdminButton";
import { AppliedFiltersBar, EmptyState } from "./components";
import {
  useReportData,
  useReportFilterState,
  OPPORTUNITIES_DEFAULTS,
  type OpportunitiesFilterState,
} from "./hooks";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import type { Opportunity, Sale } from "../types";
import {
  PrincipalGroupCard,
  type PrincipalGroup,
} from "./opportunities-by-principal/components/PrincipalGroupCard";
import { exportOpportunitiesReport } from "./opportunities-by-principal/utils/exportOpportunitiesReport";

/**
 * Opportunities by Principal Report
 *
 * Full detailed report showing all opportunities grouped by principal organization.
 * Provides detailed view with opportunity details, filters, and CSV export.
 *
 * Features:
 * - Groups opportunities by principal organization
 * - Shows opportunity details: name, organization, stage, close date, rep
 * - Filters: principal, stage, sales rep, date range
 * - CSV export with all fields sanitized
 * - Expandable/collapsible principal sections
 * - Click-through to individual opportunities
 */
export default function OpportunitiesByPrincipalReport() {
  const navigate = useNavigate();
  const notify = useNotify();

  const [filterState, updateFilters, resetFilters] = useReportFilterState<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  // Track expanded principals
  const [expandedPrincipals, setExpandedPrincipals] = useState<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  // Build filter object for API
  // CRITICAL: Use primitive dependencies to prevent render loops
  // Depending on entire `filterState` object causes recalculation when object reference changes
  const stageJson = JSON.stringify(filterState.stage);
  const apiFilter = useMemo(() => {
    const filter: Record<string, unknown> = {
      "deleted_at@is": null,
      status: "active",
    };

    if (filterState.principal_organization_id) {
      filter.principal_organization_id = filterState.principal_organization_id;
    }

    if (filterState.stage.length > 0) {
      filter.stage = filterState.stage;
    }

    if (filterState.opportunity_owner_id) {
      filter.opportunity_owner_id = filterState.opportunity_owner_id;
    }

    if (filterState.startDate) {
      filter["estimated_close_date@gte"] = filterState.startDate;
    }

    if (filterState.endDate) {
      filter["estimated_close_date@lte"] = filterState.endDate;
    }

    return filter;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stageJson serializes filterState.stage for stable array comparison
  }, [
    filterState.principal_organization_id,
    stageJson,
    filterState.opportunity_owner_id,
    filterState.startDate,
    filterState.endDate,
  ]);

  // Fetch opportunities
  const {
    data: opportunities,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
  } = useReportData<Opportunity>("opportunities_summary", {
    additionalFilters: apiFilter,
  });

  // Fetch sales reps for filter and display
  const ownerIds = useMemo(
    () =>
      Array.from(new Set((opportunities || []).map((o) => o.opportunity_owner_id).filter(Boolean))),
    [opportunities]
  );

  // Memoize filter to prevent render loop (inline objects cause re-fetches)
  const salesFilter = useMemo(
    () => (ownerIds.length > 0 ? { id: ownerIds } : undefined),
    [ownerIds]
  );

  const { data: salesReps } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: Math.max(ownerIds.length, LOOKUP_PAGE_SIZE) },
    filter: salesFilter,
  });

  const salesMap = useMemo(
    () => new Map((salesReps || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Group opportunities by principal
  const principalGroups = useMemo(() => {
    if (!opportunities) return [];

    // Group by principal_organization_id
    const grouped = new Map<string | null, PrincipalGroup>();

    opportunities.forEach((opp) => {
      const principalId = opp.principal_organization_id?.toString() || null;
      const principalName = opp.principal_organization_name || "No Principal Assigned";

      if (!grouped.has(principalId)) {
        grouped.set(principalId, {
          principalId,
          principalName,
          opportunities: [],
          totalCount: 0,
          stageBreakdown: {},
        });
      }

      const group = grouped.get(principalId)!;
      group.opportunities.push(opp);
      group.totalCount += 1;

      // Track stage breakdown
      const stage = opp.stage || "Unknown";
      group.stageBreakdown[stage] = (group.stageBreakdown[stage] || 0) + 1;
    });

    // Convert to array and sort by total count (descending)
    return Array.from(grouped.values()).toSorted((a, b) => b.totalCount - a.totalCount);
  }, [opportunities]);

  // Auto-expand first 3 principals on initial load (run once)
  // Uses ref to track initialization and prevent re-running after user collapses all
  useEffect(() => {
    if (!hasInitializedRef.current && principalGroups.length > 0) {
      hasInitializedRef.current = true;
      const initialExpanded = new Set(
        principalGroups.slice(0, 3).map((g) => g.principalId || "null")
      );
      setExpandedPrincipals(initialExpanded);
    }
  }, [principalGroups]);

  // Toggle principal expansion
  const togglePrincipalExpansion = (principalId: string | null) => {
    const key = principalId || "null";
    const newExpanded = new Set(expandedPrincipals);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedPrincipals(newExpanded);
  };

  // Handle CSV export
  const handleExport = () => {
    exportOpportunitiesReport({
      principalGroups,
      salesMap,
      onSuccess: () => notify("Report exported successfully", { type: "success" }),
      onError: (message) => notify(message, { type: "error" }),
      onEmpty: () => notify("No data to export", { type: "warning" }),
    });
  };

  // Navigate to opportunity detail
  const handleOpportunityClick = (oppId: string | number) => {
    navigate(`/opportunities/${oppId}/show`);
  };

  // Build applied filters for AppliedFiltersBar
  const appliedFilters = useMemo(() => {
    const result: Array<{ label: string; value: string; onRemove: () => void }> = [];

    if (filterState.principal_organization_id) {
      result.push({
        label: "Principal",
        value: "Selected",
        onRemove: () => updateFilters({ principal_organization_id: null }),
      });
    }

    if (filterState.stage.length > 0) {
      result.push({
        label: "Stage",
        value: `${filterState.stage.length} selected`,
        onRemove: () => updateFilters({ stage: [] }),
      });
    }

    if (filterState.opportunity_owner_id) {
      result.push({
        label: "Sales Rep",
        value: "Selected",
        onRemove: () => updateFilters({ opportunity_owner_id: null }),
      });
    }

    if (filterState.startDate) {
      result.push({
        label: "Start Date",
        value: format(new Date(filterState.startDate), "MMM dd, yyyy"),
        onRemove: () => updateFilters({ startDate: null }),
      });
    }

    if (filterState.endDate) {
      result.push({
        label: "End Date",
        value: format(new Date(filterState.endDate), "MMM dd, yyyy"),
        onRemove: () => updateFilters({ endDate: null }),
      });
    }

    return result;
  }, [filterState, updateFilters]);

  const hasActiveFilters =
    filterState.principal_organization_id ||
    filterState.stage.length > 0 ||
    filterState.opportunity_owner_id ||
    filterState.startDate ||
    filterState.endDate;

  const handleResetAllFilters = () => {
    resetFilters();
  };

  const hasOpportunityData = (opportunities?.length ?? 0) > 0;
  const isFirstLoad = opportunitiesLoading && !hasOpportunityData;
  const isRefreshing = opportunitiesLoading && hasOpportunityData;

  if (isFirstLoad) {
    return (
      <div className="space-y-widget">
        <p className="text-muted-foreground">Loading opportunities...</p>
      </div>
    );
  }

  const totalOpportunities = opportunities?.length || 0;
  const totalPrincipals = principalGroups.length;

  return (
    <div className="space-y-widget">
      {isRefreshing && (
        <div className="text-xs text-muted-foreground animate-pulse" role="status">
          Updating...
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <AppliedFiltersBar
          filters={appliedFilters}
          onResetAll={handleResetAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
        <AdminButton
          variant="outline"
          size="sm"
          className="h-11 shrink-0 gap-2"
          onClick={handleExport}
          disabled={opportunitiesLoading || (opportunities?.length ?? 0) === 0}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </AdminButton>
      </div>

      {opportunitiesError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load opportunities</p>
          <p className="text-sm">{opportunitiesError.message}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-content">
        <KPICard title="Total Opportunities" value={totalOpportunities} icon={TrendingUp} />
        <KPICard title="Principals" value={totalPrincipals} icon={Building2} />
        <KPICard
          title="Avg per Principal"
          value={totalPrincipals > 0 ? Math.round(totalOpportunities / totalPrincipals) : 0}
          icon={BarChart3}
        />
      </div>

      {/* Principal Groups */}
      {principalGroups.length === 0 && !opportunitiesLoading && !opportunitiesError ? (
        <EmptyState
          title="No Opportunities Found"
          description="Try adjusting your filters or create a new opportunity."
          icon={TrendingUp}
          action={{
            label: "Create Opportunity",
            onClick: () => navigate("/opportunities/create"),
          }}
        />
      ) : (
        <div className="space-y-content">
          {principalGroups.map((group) => (
            <PrincipalGroupCard
              key={group.principalId || "null"}
              group={group}
              isExpanded={expandedPrincipals.has(group.principalId || "null")}
              onToggle={() => togglePrincipalExpansion(group.principalId)}
              onOpportunityClick={handleOpportunityClick}
              salesMap={salesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
