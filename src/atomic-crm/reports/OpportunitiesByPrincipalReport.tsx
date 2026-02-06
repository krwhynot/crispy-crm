import { useState, useMemo, useEffect, useRef } from "react";
import { useGetList, useNotify } from "ra-core";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import { ReportLayout } from "./ReportLayout";
import { Card, CardContent } from "@/components/ui/card";
import { AppliedFiltersBar, EmptyState } from "./components";
import { useReportData } from "./hooks";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import type { Opportunity, Sale } from "../types";
import {
  FilterToolbar,
  type FilterValues,
} from "./opportunities-by-principal/components/FilterToolbar";
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

  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    principal_organization_id: null,
    stage: [],
    opportunity_owner_id: null,
    startDate: null,
    endDate: null,
  });

  // Track expanded principals
  const [expandedPrincipals, setExpandedPrincipals] = useState<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  // Build filter object for API
  // CRITICAL: Use primitive dependencies to prevent render loops
  // Depending on entire `filters` object causes recalculation when object reference changes
  const apiFilter = useMemo(() => {
    const filter: Record<string, unknown> = {
      "deleted_at@is": null,
      status: "active",
    };

    if (filters.principal_organization_id) {
      filter.principal_organization_id = filters.principal_organization_id;
    }

    if (filters.stage.length > 0) {
      filter.stage = filters.stage;
    }

    if (filters.opportunity_owner_id) {
      filter.opportunity_owner_id = filters.opportunity_owner_id;
    }

    if (filters.startDate) {
      filter["estimated_close_date@gte"] = filters.startDate;
    }

    if (filters.endDate) {
      filter["estimated_close_date@lte"] = filters.endDate;
    }

    return filter;
  }, [
    filters.principal_organization_id,
    JSON.stringify(filters.stage), // Array needs serialization for stable comparison
    filters.opportunity_owner_id,
    filters.startDate,
    filters.endDate,
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
    pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
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

    if (filters.principal_organization_id) {
      result.push({
        label: "Principal",
        value: "Selected",
        onRemove: () => setFilters({ ...filters, principal_organization_id: null }),
      });
    }

    if (filters.stage.length > 0) {
      result.push({
        label: "Stage",
        value: `${filters.stage.length} selected`,
        onRemove: () => setFilters({ ...filters, stage: [] }),
      });
    }

    if (filters.opportunity_owner_id) {
      result.push({
        label: "Sales Rep",
        value: "Selected",
        onRemove: () => setFilters({ ...filters, opportunity_owner_id: null }),
      });
    }

    if (filters.startDate) {
      result.push({
        label: "Start Date",
        value: format(new Date(filters.startDate), "MMM dd, yyyy"),
        onRemove: () => setFilters({ ...filters, startDate: null }),
      });
    }

    if (filters.endDate) {
      result.push({
        label: "End Date",
        value: format(new Date(filters.endDate), "MMM dd, yyyy"),
        onRemove: () => setFilters({ ...filters, endDate: null }),
      });
    }

    return result;
  }, [filters]);

  const hasActiveFilters =
    filters.principal_organization_id ||
    filters.stage.length > 0 ||
    filters.opportunity_owner_id ||
    filters.startDate ||
    filters.endDate;

  const handleResetAllFilters = () => {
    setFilters({
      principal_organization_id: null,
      stage: [],
      opportunity_owner_id: null,
      startDate: null,
      endDate: null,
    });
  };

  // Loading state
  if (opportunitiesLoading) {
    return (
      <ReportLayout title="Opportunities by Principal">
        <p className="text-muted-foreground">Loading opportunities...</p>
      </ReportLayout>
    );
  }

  const totalOpportunities = opportunities?.length || 0;
  const totalPrincipals = principalGroups.length;

  return (
    <ReportLayout
      title="Opportunities by Principal"
      onExport={handleExport}
      actions={<FilterToolbar filters={filters} onFiltersChange={setFilters} />}
    >
      <div className="space-y-section">
        <AppliedFiltersBar
          filters={appliedFilters}
          onResetAll={handleResetAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {opportunitiesError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Failed to load opportunities</p>
            <p className="text-sm">{opportunitiesError.message}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-content">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Opportunities</p>
              <p className="text-2xl font-bold">{totalOpportunities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Principals</p>
              <p className="text-2xl font-bold">{totalPrincipals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg per Principal</p>
              <p className="text-2xl font-bold">
                {totalPrincipals > 0 ? Math.round(totalOpportunities / totalPrincipals) : 0}
              </p>
            </CardContent>
          </Card>
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
    </ReportLayout>
  );
}
