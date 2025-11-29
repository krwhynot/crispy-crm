import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PrincipalPipelineRow } from "../types";
import { usePrincipalPipeline } from "../hooks/usePrincipalPipeline";

// Lazy load PipelineDrillDownSheet - saves ~3-5KB from main dashboard chunk
// Only loaded when user clicks a principal row to drill down
const PipelineDrillDownSheet = lazy(() =>
  import("./PipelineDrillDownSheet").then(m => ({ default: m.PipelineDrillDownSheet }))
);

type SortField = "name" | "totalPipeline" | "activeThisWeek" | "activeLastWeek" | "momentum";
type SortDirection = "ascending" | "descending" | "none";

export function PrincipalPipelineTable() {
  const [myPrincipalsOnly, setMyPrincipalsOnly] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<{ id: number; name: string } | null>(
    null
  );
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ascending");
  const [searchQuery, setSearchQuery] = useState("");
  const [momentumFilters, setMomentumFilters] = useState<Set<PrincipalPipelineRow["momentum"]>>(new Set());
  const { data, loading, error } = usePrincipalPipeline({ myPrincipalsOnly });

  // Handle momentum filter toggle
  const toggleMomentumFilter = useCallback((momentum: PrincipalPipelineRow["momentum"]) => {
    setMomentumFilters((prev) => {
      const next = new Set(prev);
      if (next.has(momentum)) {
        next.delete(momentum);
      } else {
        next.add(momentum);
      }
      return next;
    });
  }, []);

  // Handle column header click for sorting
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction: ascending -> descending -> ascending
      setSortDirection((prev) => (prev === "ascending" ? "descending" : "ascending"));
    } else {
      // New field: start with ascending for name, descending for numeric fields
      setSortField(field);
      setSortDirection(field === "name" ? "ascending" : "descending");
    }
  }, [sortField]);

  // Filter data based on search query and momentum filters
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    let result = data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }

    // Apply momentum filter (if any filters selected)
    if (momentumFilters.size > 0) {
      result = result.filter((row) => momentumFilters.has(row.momentum));
    }

    return result;
  }, [data, searchQuery, momentumFilters]);

  // Sort data based on current sort state
  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalPipeline":
          comparison = a.totalPipeline - b.totalPipeline;
          break;
        case "activeThisWeek":
          comparison = a.activeThisWeek - b.activeThisWeek;
          break;
        case "activeLastWeek":
          comparison = a.activeLastWeek - b.activeLastWeek;
          break;
        case "momentum": {
          const momentumOrder = { increasing: 3, steady: 2, decreasing: 1, stale: 0 };
          comparison = momentumOrder[a.momentum] - momentumOrder[b.momentum];
          break;
        }
      }

      return sortDirection === "descending" ? -comparison : comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Get aria-sort value for a column
  const getAriaSortValue = (field: SortField): "ascending" | "descending" | "none" => {
    if (sortField === field) return sortDirection;
    return "none";
  };

  // Render sort indicator
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    if (sortDirection === "ascending") return <ArrowUp className="ml-1 h-4 w-4" />;
    return <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handleRowClick = useCallback((row: PrincipalPipelineRow) => {
    setSelectedPrincipal({ id: row.id, name: row.name });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedPrincipal(null);
  }, []);

  const renderMomentumIcon = (momentum: PrincipalPipelineRow["momentum"]) => {
    switch (momentum) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case "steady":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      case "stale":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  /**
   * Returns the appropriate semantic background color class for the decay indicator bar.
   * Maps momentum state to visual urgency using the design system's semantic tokens.
   *
   * Color mapping (from most healthy to most urgent):
   * - increasing: success (green) - actively engaged, growing pipeline
   * - steady: muted (gray) - stable but not growing
   * - decreasing: warning (amber) - attention needed, engagement dropping
   * - stale: destructive (red) - critical, needs immediate action
   */
  const getDecayIndicatorColor = (momentum: PrincipalPipelineRow["momentum"]): string => {
    switch (momentum) {
      case "increasing":
        return "bg-success";
      case "steady":
        return "bg-muted-foreground/50";
      case "decreasing":
        return "bg-warning";
      case "stale":
        return "bg-destructive";
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border pb-4">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load pipeline data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with title and filters */}
      <div className="border-b border-border pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pipeline by Principal</h2>
            <p className="text-sm text-muted-foreground">
              Track opportunity momentum across your customer accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search principals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 pl-8"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {sortedData.length === 0 ? (
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
        ) : (
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort("name")}
                aria-sort={getAriaSortValue("name")}
              >
                <div className="flex items-center">
                  Principal
                  {renderSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right hover:bg-muted/50"
                onClick={() => handleSort("totalPipeline")}
                aria-sort={getAriaSortValue("totalPipeline")}
              >
                <div className="flex items-center justify-end">
                  Pipeline
                  {renderSortIcon("totalPipeline")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-center hover:bg-muted/50"
                onClick={() => handleSort("activeThisWeek")}
                aria-sort={getAriaSortValue("activeThisWeek")}
              >
                <div className="flex items-center justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="border-b border-dotted border-muted-foreground/50">
                        This Week
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">Opportunities with activity in the last 7 days</p>
                      <p className="mt-1 text-muted-foreground/80">
                        Counts opportunities where at least one activity (call, email, meeting, etc.) was logged this week.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {renderSortIcon("activeThisWeek")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-center hover:bg-muted/50"
                onClick={() => handleSort("activeLastWeek")}
                aria-sort={getAriaSortValue("activeLastWeek")}
              >
                <div className="flex items-center justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="border-b border-dotted border-muted-foreground/50">
                        Last Week
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">Opportunities with activity 8-14 days ago</p>
                      <p className="mt-1 text-muted-foreground/80">
                        Counts opportunities that had activity the previous week but may need follow-up now.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {renderSortIcon("activeLastWeek")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort("momentum")}
                aria-sort={getAriaSortValue("momentum")}
              >
                <div className="flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="border-b border-dotted border-muted-foreground/50">
                        Momentum
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">Pipeline engagement trend</p>
                      <p className="mt-1 text-muted-foreground/80">
                        Compares this week's activity to last week:
                      </p>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground/80">
                        <li>📈 <strong>Increasing</strong> – More activity this week</li>
                        <li>➡️ <strong>Steady</strong> – Similar activity levels</li>
                        <li>📉 <strong>Decreasing</strong> – Less activity this week</li>
                        <li>⚠️ <strong>Stale</strong> – No recent activity (needs attention)</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                  {renderSortIcon("momentum")}
                </div>
              </TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow
                key={row.id}
                className="table-row-premium cursor-pointer relative"
                onClick={() => handleRowClick(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(row);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View opportunities for ${row.name}. Pipeline momentum: ${row.momentum}`}
              >
                <TableCell className="font-medium relative">
                  {/* Decay indicator bar - 4px leading edge showing pipeline health */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${getDecayIndicatorColor(row.momentum)}`}
                    aria-hidden="true"
                  />
                  <span className="pl-2">{row.name}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-semibold">{row.totalPipeline}</div>
                </TableCell>
                <TableCell className="text-center">
                  {row.activeThisWeek > 0 ? (
                    <Badge variant="default" className="bg-success">
                      {row.activeThisWeek}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.activeLastWeek > 0 ? (
                    <Badge variant="secondary">{row.activeLastWeek}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {renderMomentumIcon(row.momentum)}
                    <span className="text-sm capitalize">{row.momentum}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.nextAction ? (
                    <span className="text-sm">{row.nextAction}</span>
                  ) : (
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      Schedule follow-up
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>

      {/* Drill-Down Sheet - lazy loaded, only renders when a principal is selected */}
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
    </div>
  );
}
