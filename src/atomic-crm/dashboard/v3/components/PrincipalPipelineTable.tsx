import { useState, useCallback, lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PrincipalPipelineRow, Momentum } from "../types";
import { usePrincipalPipeline } from "../hooks/usePrincipalPipeline";
import { usePipelineTableState, type SortField } from "../hooks/usePipelineTableState";
import { PipelineTableRow } from "./PipelineTableRow";

// Lazy load PipelineDrillDownSheet - saves ~3-5KB from main dashboard chunk
const PipelineDrillDownSheet = lazy(() =>
  import("./PipelineDrillDownSheet").then((m) => ({ default: m.PipelineDrillDownSheet }))
);

/**
 * PrincipalPipelineTable - Aggregated pipeline view by principal/manufacturer
 *
 * Displays opportunity pipeline metrics with:
 * - Sortable columns (name, pipeline count, weekly activity, momentum)
 * - Search filtering by principal name
 * - Momentum filter dropdown
 * - "My Principals Only" toggle
 * - Click-through to drill-down sheet
 *
 * Architecture:
 * - State management extracted to usePipelineTableState hook
 * - Row rendering extracted to PipelineTableRow component
 * - Drill-down sheet lazy-loaded for performance
 */
export function PrincipalPipelineTable() {
  const [myPrincipalsOnly, setMyPrincipalsOnly] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<{ id: number; name: string } | null>(
    null
  );

  const { data, loading, error } = usePrincipalPipeline({ myPrincipalsOnly });

  // Use extracted state management hook
  const {
    searchQuery,
    setSearchQuery,
    momentumFilters,
    toggleMomentumFilter,
    handleSort,
    sortedData,
    sortField,
    sortDirection,
    getAriaSortValue,
  } = usePipelineTableState({ data });

  // Render sort indicator for column headers
  const renderSortIcon = useCallback(
    (field: SortField) => {
      if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
      if (sortDirection === "ascending") return <ArrowUp className="ml-1 h-4 w-4" />;
      return <ArrowDown className="ml-1 h-4 w-4" />;
    },
    [sortField, sortDirection]
  );

  const handleRowClick = useCallback((row: PrincipalPipelineRow) => {
    setSelectedPrincipal({ id: row.id, name: row.name });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedPrincipal(null);
  }, []);

  // Loading state - matches production layout structure
  if (loading) {
    return (
      <Card className="card-container flex h-full flex-col">
        {/* Header skeleton matching production header */}
        <CardHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        {/* Table skeleton with header and rows */}
        <CardContent className="flex-1 overflow-auto p-0">
          {/* Table header */}
          <div className="flex gap-4 px-2 py-3 border-b border-border">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 hidden lg:block" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Table rows */}
          <div className="space-y-1 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-2 py-3 border-b border-border/50">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-8 ml-auto" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-8 hidden lg:block" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="card-container flex h-full flex-col">
        <CardHeader>
          <CardTitle>Pipeline by Principal</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Failed to load pipeline data</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-container flex h-full flex-col">
      {/* Header with title and filters */}
      <CardHeader className="border-b border-border pb-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Pipeline by Principal</CardTitle>
            <CardDescription>
              Track opportunity momentum across your customer accounts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search principals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-48 pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="my-principals"
                checked={myPrincipalsOnly}
                onCheckedChange={setMyPrincipalsOnly}
              />
              <label htmlFor="my-principals" className="text-sm">
                My Principals Only
              </label>
            </div>
            <MomentumFilterDropdown
              momentumFilters={momentumFilters}
              toggleMomentumFilter={toggleMomentumFilter}
            />
          </div>
        </div>
      </CardHeader>

      {/* Table */}
      <CardContent className="flex-1 overflow-auto p-0">
        {sortedData?.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <SortableTableHead
                  field="name"
                  label="Principal"
                  currentSortField={sortField}
                  onSort={handleSort}
                  getAriaSortValue={getAriaSortValue}
                  renderSortIcon={renderSortIcon}
                />
                <SortableTableHead
                  field="totalPipeline"
                  label="Pipeline"
                  currentSortField={sortField}
                  onSort={handleSort}
                  getAriaSortValue={getAriaSortValue}
                  renderSortIcon={renderSortIcon}
                  align="right"
                />
                <SortableTableHead
                  field="activeThisWeek"
                  label="This Week"
                  tooltip="Activities logged Mon–Sun of current week"
                  currentSortField={sortField}
                  onSort={handleSort}
                  getAriaSortValue={getAriaSortValue}
                  renderSortIcon={renderSortIcon}
                  align="center"
                />
                <SortableTableHead
                  field="activeLastWeek"
                  label="Last Week"
                  tooltip="Activities logged Mon–Sun of previous week"
                  currentSortField={sortField}
                  onSort={handleSort}
                  getAriaSortValue={getAriaSortValue}
                  renderSortIcon={renderSortIcon}
                  align="center"
                  className="hidden lg:table-cell"
                />
                <SortableTableHead
                  field="momentum"
                  label="Momentum"
                  tooltip="Based on activity trend over 14 days"
                  currentSortField={sortField}
                  onSort={handleSort}
                  getAriaSortValue={getAriaSortValue}
                  renderSortIcon={renderSortIcon}
                />
                <TableHead scope="col" className="max-w-[200px] lg:max-w-[280px]">Next Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData?.map((row) => (
                <PipelineTableRow key={row.id} row={row} onRowClick={handleRowClick} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Drill-Down Sheet - lazy loaded */}
      {selectedPrincipal !== null && (
        <Suspense fallback={null}>
          <PipelineDrillDownSheet
            principalId={selectedPrincipal.id}
            principalName={selectedPrincipal.name}
            isOpen={true}
            onClose={handleCloseSheet}
          />
        </Suspense>
      )}
    </Card>
  );
}

// ============================================================================
// Sub-components (internal to this file, not exported)
// ============================================================================

interface SortableTableHeadProps {
  field: SortField;
  label: string;
  tooltip?: string;
  currentSortField: SortField;
  onSort: (field: SortField) => void;
  getAriaSortValue: (field: SortField) => "ascending" | "descending" | "none";
  renderSortIcon: (field: SortField) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

function SortableTableHead({
  field,
  label,
  tooltip,
  onSort,
  getAriaSortValue,
  renderSortIcon,
  align = "left",
  className = "",
}: SortableTableHeadProps) {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";
  const justifyClass =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "";

  const labelContent = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dotted border-muted-foreground/50">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    label
  );

  return (
    <TableHead
      scope="col"
      className={`cursor-pointer select-none hover:bg-muted/50 ${alignClass} ${className}`}
      onClick={() => onSort(field)}
      aria-sort={getAriaSortValue(field)}
    >
      <div className={`flex items-center ${justifyClass}`}>
        {labelContent}
        {renderSortIcon(field)}
      </div>
    </TableHead>
  );
}

interface MomentumFilterDropdownProps {
  momentumFilters: Set<Momentum>;
  toggleMomentumFilter: (momentum: Momentum) => void;
}

function MomentumFilterDropdown({
  momentumFilters,
  toggleMomentumFilter,
}: MomentumFilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-11">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {momentumFilters.size > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {momentumFilters.size}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <p className="mb-2 text-sm font-medium">Filter by Momentum</p>
          <div className="space-y-2">
            {(["increasing", "steady", "decreasing", "stale"] as const).map((momentum) => (
              <div key={momentum} className="flex items-center gap-2">
                <Checkbox
                  id={`momentum-${momentum}`}
                  checked={momentumFilters.has(momentum)}
                  onCheckedChange={() => toggleMomentumFilter(momentum)}
                />
                <Label htmlFor={`momentum-${momentum}`} className="text-sm capitalize">
                  {momentum}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface EmptyStateProps {
  searchQuery: string;
}

function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center py-12">
      <div className="text-center">
        <p className="text-muted-foreground">
          {searchQuery ? "No matching principals found" : "No principals found"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchQuery
            ? `Try adjusting your search term "${searchQuery}"`
            : "Create opportunities linked to organizations to see them here"}
        </p>
      </div>
    </div>
  );
}
