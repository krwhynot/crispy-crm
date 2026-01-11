import { useState, useMemo, useEffect } from "react";
import { useGetList, useNotify, downloadCSV } from "ra-core";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import jsonExport from "jsonexport/dist";
import { format } from "date-fns";
import { ReportLayout } from "./ReportLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ExternalLink, TrendingUp } from "lucide-react";
import { AppliedFiltersBar, EmptyState } from "./components";
import { useReportData } from "./hooks";
import { MultiSelectInput } from "@/components/admin/multi-select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { OPPORTUNITY_STAGE_CHOICES } from "../opportunities/constants/stageConstants";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import type { Opportunity, Sale } from "../types";
import { parseDateSafely } from "@/lib/date-utils";

interface PrincipalGroup {
  principalId: string | null;
  principalName: string;
  opportunities: Opportunity[];
  totalCount: number;
  stageBreakdown: Record<string, number>;
}

interface FilterValues {
  principal_organization_id: string | null;
  stage: string[];
  opportunity_owner_id: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface FilterToolbarProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
}

/**
 * Filter toolbar with form context for React Admin inputs
 * Wraps ReferenceInput components in FormProvider to provide required React Hook Form context
 */
function FilterToolbar({ filters, onFiltersChange }: FilterToolbarProps) {
  const form = useForm<FilterValues>({
    defaultValues: filters,
  });

  // Watch form values using useWatch hook (isolates re-renders, no subscription leak)
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    onFiltersChange(watchedValues as FilterValues);
  }, [watchedValues, onFiltersChange]);

  const hasActiveFilters =
    filters.principal_organization_id ||
    filters.stage.length > 0 ||
    filters.opportunity_owner_id ||
    filters.startDate ||
    filters.endDate;

  const clearFilters = () => {
    form.reset({
      principal_organization_id: null,
      stage: [],
      opportunity_owner_id: null,
      startDate: null,
      endDate: null,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="flex flex-wrap items-center gap-2">
        {/* Principal Filter */}
        <ReferenceInput
          source="principal_organization_id"
          reference="organizations"
          filter={{ organization_type: "principal" }}
        >
          <AutocompleteArrayInput
            label={false}
            placeholder="Filter by Principal"
            sx={{ minWidth: 200 }}
          />
        </ReferenceInput>

        {/* Stage Filter */}
        <MultiSelectInput
          source="stage"
          emptyText="All Stages"
          choices={OPPORTUNITY_STAGE_CHOICES}
          sx={{ minWidth: 150 }}
        />

        {/* Sales Rep Filter */}
        <ReferenceInput source="opportunity_owner_id" reference="sales">
          <AutocompleteArrayInput
            label={false}
            placeholder="Filter by Sales Rep"
            sx={{ minWidth: 200 }}
          />
        </ReferenceInput>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            {...form.register("startDate")}
            className="h-11 px-3 py-2 border border-border rounded text-sm"
            placeholder="From Date"
            aria-label="Filter from date"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            {...form.register("endDate")}
            className="h-11 px-3 py-2 border border-border rounded text-sm"
            placeholder="To Date"
            aria-label="Filter to date"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} type="button" className="h-11">
            Clear Filters
          </Button>
        )}
      </form>
    </FormProvider>
  );
}

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

  // Build filter object for API
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
  }, [filters]);

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

  const { data: salesReps } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 1000 },
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
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
    const groups = Array.from(grouped.values()).sort((a, b) => b.totalCount - a.totalCount);

    // Auto-expand first 3 principals
    if (expandedPrincipals.size === 0 && groups.length > 0) {
      const initialExpanded = new Set(groups.slice(0, 3).map((g) => g.principalId || "null"));
      setExpandedPrincipals(initialExpanded);
    }

    return groups;
  }, [opportunities, expandedPrincipals.size]);

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
    const exportData: Array<{
      principal: string;
      opportunity: string;
      organization: string;
      stage: string;
      close_date: string;
      sales_rep: string;
      priority: string;
      status: string;
      days_in_stage: number;
    }> = [];

    principalGroups.forEach((group) => {
      group.opportunities.forEach((opp) => {
        const closeDateObj = opp.estimated_close_date
          ? parseDateSafely(opp.estimated_close_date)
          : null;
        exportData.push({
          principal: sanitizeCsvValue(group.principalName),
          opportunity: sanitizeCsvValue(opp.name),
          organization: sanitizeCsvValue(opp.customer_organization_name || ""),
          stage: sanitizeCsvValue(opp.stage),
          close_date: closeDateObj ? format(closeDateObj, "yyyy-MM-dd") : "",
          sales_rep: sanitizeCsvValue(salesMap.get(opp.opportunity_owner_id!) || "Unassigned"),
          priority: sanitizeCsvValue(opp.priority || "medium"),
          status: sanitizeCsvValue(opp.status),
          days_in_stage: opp.days_in_stage || 0,
        });
      });
    });

    if (exportData.length === 0) {
      notify("No data to export", { type: "warning" });
      return;
    }

    jsonExport(exportData, (err, csv) => {
      if (err) {
        console.error("Export error:", err);
        notify("Export failed. Please try again.", { type: "error" });
        return;
      }
      downloadCSV(csv, `opportunities-by-principal-${format(new Date(), "yyyy-MM-dd")}`);
      notify("Report exported successfully", { type: "success" });
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

interface PrincipalGroupCardProps {
  group: PrincipalGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onOpportunityClick: (id: string | number) => void;
  salesMap: Map<string | number, string>;
}

function PrincipalGroupCard({
  group,
  isExpanded,
  onToggle,
  onOpportunityClick,
  salesMap,
}: PrincipalGroupCardProps) {
  // Get stage summary
  const stageSummary = Object.entries(group.stageBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span>{group.principalName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {group.totalCount} {group.totalCount === 1 ? "opportunity" : "opportunities"}
            </Badge>
            {stageSummary && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                ({stageSummary})
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-2 px-2 min-w-[200px]">Opportunity</th>
                  <th className="text-left py-2 px-2 min-w-[150px]">Organization</th>
                  <th className="text-left py-2 px-2 min-w-[120px]">Stage</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Close Date</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Sales Rep</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{opp.name}</span>
                        {opp.priority === "high" && (
                          <Badge variant="outline" className="text-xs bg-warning-light">
                            High
                          </Badge>
                        )}
                        {opp.priority === "critical" && (
                          <Badge variant="outline" className="text-xs bg-destructive-light">
                            Critical
                          </Badge>
                        )}
                        {opp.days_in_stage && opp.days_in_stage > 14 && (
                          <Badge variant="outline" className="text-xs">
                            {opp.days_in_stage} days
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">{opp.customer_organization_name || "-"}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline">{opp.stage}</Badge>
                    </td>
                    <td className="py-2 px-2">
                      {opp.estimated_close_date && parseDateSafely(opp.estimated_close_date)
                        ? format(parseDateSafely(opp.estimated_close_date)!, "MMM dd, yyyy")
                        : "-"}
                    </td>
                    <td className="py-2 px-2">
                      {salesMap.get(opp.opportunity_owner_id!) || "Unassigned"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpportunityClick(opp.id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
