import { useState, useMemo } from "react";
import { useShowContext, useGetList } from "react-admin";
import { format } from "date-fns";
import { History, User, Calendar, Filter, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/admin/AdminButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Opportunity } from "../types";
import { parseDateSafely } from "@/lib/date-utils";
import { formatFieldLabel } from "@/atomic-crm/utils/formatters";

interface AuditTrailEntry {
  audit_id: number;
  id?: number;
  table_name: string;
  record_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: number | null;
  changed_at: string;
  sales_name?: string;
}

/**
 * ChangeLogTab Component
 *
 * Displays field-level change history for an opportunity from the audit_trail table.
 * Shows who changed what field, when, and from what value to what value.
 *
 * Data flow:
 * 1. Fetches audit entries via dataProvider.getList("audit_trail", ...)
 * 2. Filters by table_name='opportunities' and record_id=opportunityId
 * 3. Joins with sales table to get user names (changed_by → sales.id)
 * 4. Displays entries in reverse chronological order
 */
export const ChangeLogTab = () => {
  const { record } = useShowContext<Opportunity>();

  // Replace manual fetching with useGetList
  const { data: rawEntries = [], isLoading } = useGetList<AuditTrailEntry>(
    "audit_trail",
    {
      filter: {
        table_name: "opportunities",
        record_id: record?.id,
      },
      sort: { field: "changed_at", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    {
      enabled: !!record?.id, // Only fetch when record.id is available
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform entries to add id field (memoized)
  const auditEntries = useMemo(
    () => rawEntries.map((entry) => ({ ...entry, id: entry.audit_id })),
    [rawEntries]
  );

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterField, setFilterField] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  // Apply client-side filters to audit entries
  const filteredEntries = auditEntries.filter((entry) => {
    // Filter by field name
    if (filterField !== "all" && entry.field_name !== filterField) {
      return false;
    }

    // Filter by user
    if (filterUser !== "all") {
      const userId = parseInt(filterUser);
      if (entry.changed_by !== userId) {
        return false;
      }
    }

    // Filter by date range
    const entryDate = parseDateSafely(entry.changed_at);
    if (!entryDate) return false;
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      if (entryDate < fromDate) {
        return false;
      }
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire end date
      if (entryDate > toDate) {
        return false;
      }
    }

    return true;
  });

  // Extract unique field names and users for filter dropdowns
  const uniqueFields = Array.from(new Set(auditEntries.map((e) => e.field_name))).sort();

  const uniqueUsers = Array.from(
    new Set(
      auditEntries
        .filter((e) => e.changed_by !== null)
        .map((e) => ({
          id: e.changed_by!,
          name: e.sales_name || `User #${e.changed_by}`,
        }))
    ).values()
  );

  // Export functionality
  const handleExport = () => {
    // Convert filtered entries to CSV
    const csvHeaders = ["Timestamp", "Field", "Old Value", "New Value", "Changed By"];

    const csvRows = filteredEntries.map((entry) => [
      parseDateSafely(entry.changed_at)
        ? format(parseDateSafely(entry.changed_at)!, "yyyy-MM-dd HH:mm:ss")
        : "Unknown",
      formatFieldLabel(entry.field_name),
      formatValue(entry.old_value),
      formatValue(entry.new_value),
      entry.sales_name || `User #${entry.changed_by}` || "System",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `opportunity-${record?.id}-changelog-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatValue = (value: string | null): string => {
    if (!value) return "(empty)";
    if (value.length > 100) return value.substring(0, 100) + "...";
    return value;
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterField("all");
    setFilterUser("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters =
    filterField !== "all" || filterUser !== "all" || filterDateFrom !== "" || filterDateTo !== "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading change history...</div>
      </div>
    );
  }

  if (auditEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Changes Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          When you make changes to this opportunity, they'll appear here with full history tracking
          who changed what and when.
        </p>
      </div>
    );
  }

  // Group filtered entries by date for better readability
  const groupedByDate = filteredEntries.reduce(
    (acc, entry) => {
      const parsedDate = parseDateSafely(entry.changed_at);
      if (!parsedDate) return acc;
      const date = format(parsedDate, "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    },
    {} as Record<string, AuditTrailEntry[]>
  );

  return (
    <div className="space-y-6 pt-4">
      {/* Header with Filter Toggle and Export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Change History</h3>
          <Badge variant="secondary" className="ml-2">
            {filteredEntries.length} of {auditEntries.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
                Active
              </Badge>
            )}
          </AdminButton>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </AdminButton>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-primary bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">Filter Change Log</h4>
              {hasActiveFilters && (
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </AdminButton>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Field Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-field" className="text-xs">
                  Field
                </Label>
                <Select value={filterField} onValueChange={setFilterField}>
                  <SelectTrigger id="filter-field">
                    <SelectValue placeholder="All fields" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {uniqueFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {formatFieldLabel(field)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-user" className="text-xs">
                  Changed By
                </Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger id="filter-user">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="filter-date-from" className="text-xs">
                  From Date
                </Label>
                <Input
                  id="filter-date-from"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="filter-date-to" className="text-xs">
                  To Date
                </Label>
                <Input
                  id="filter-date-to"
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedByDate).map(([date, entries]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {parseDateSafely(date) ? format(parseDateSafely(date)!, "MMMM d, yyyy") : date}
            </span>
          </div>

          {entries.map((entry) => (
            <ChangeLogEntry key={entry.audit_id} entry={entry} formatValue={formatValue} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * ChangeLogEntry Component
 *
 * Renders a single audit trail entry showing field change details.
 *
 * Display pattern:
 * - Field name (human-readable)
 * - Old value → New value (or "Created" for INSERT operations)
 * - Timestamp and user who made the change
 */
const ChangeLogEntry = ({
  entry,
  formatValue,
}: {
  entry: AuditTrailEntry;
  formatValue: (value: string | null) => string;
}) => {
  const isCreation = !entry.old_value && entry.new_value;
  const isDeletion = entry.old_value && !entry.new_value;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">{formatFieldLabel(entry.field_name)}</span>
              {isCreation && (
                <Badge variant="default" className="text-xs">
                  Created
                </Badge>
              )}
              {isDeletion && (
                <Badge variant="destructive" className="text-xs">
                  Deleted
                </Badge>
              )}
            </div>

            <div className="text-sm space-y-1">
              {!isCreation && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[60px]">From:</span>
                  <span className="text-destructive line-through">
                    {formatValue(entry.old_value)}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[60px]">
                  {isCreation ? "Value:" : "To:"}
                </span>
                <span className="text-success font-medium">{formatValue(entry.new_value)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1 mb-1">
              <User className="w-3 h-3" />
              <span>{entry.sales_name || `User #${entry.changed_by}` || "System"}</span>
            </div>
            <span>
              {parseDateSafely(entry.changed_at)
                ? format(parseDateSafely(entry.changed_at)!, "h:mm a")
                : "Unknown"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
