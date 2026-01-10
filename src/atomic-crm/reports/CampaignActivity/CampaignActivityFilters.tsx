import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { STAGE_STALE_THRESHOLDS } from "@/atomic-crm/utils/stalenessCalculation";

interface DateRange {
  start: string;
  end: string;
}

interface CampaignActivityFiltersProps {
  dateRange: DateRange | null;
  setDateRange: (range: DateRange | null) => void;
  datePreset: string;
  setDatePreset: (preset: string) => void;
  setDatePresetHandler: (preset: string) => void;
  selectedActivityTypes: string[];
  toggleActivityType: (type: string) => void;
  toggleAllActivityTypes: () => void;
  activityTypeOptions: readonly { value: string; label: string }[];
  activityTypeCounts: Map<string, number>;
  selectedSalesRep: number | null;
  setSelectedSalesRep: (repId: number | null) => void;
  salesRepOptions: Array<{ id: number; name: string; count: number }>;
  allCampaignActivitiesCount: number;
  showStaleLeads: boolean;
  setShowStaleLeads: (show: boolean) => void;
  staleOpportunitiesCount: number;
}

export const CampaignActivityFilters: React.FC<CampaignActivityFiltersProps> = ({
  dateRange,
  setDateRange,
  datePreset,
  setDatePreset,
  setDatePresetHandler,
  selectedActivityTypes,
  toggleActivityType,
  toggleAllActivityTypes,
  activityTypeOptions,
  activityTypeCounts,
  selectedSalesRep,
  setSelectedSalesRep,
  salesRepOptions,
  allCampaignActivitiesCount,
  showStaleLeads,
  setShowStaleLeads,
  staleOpportunitiesCount,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-section">
          <div>
            <h4 className="text-sm font-medium mb-3">Date Range</h4>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={datePreset === "allTime" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDatePresetHandler("allTime")}
                >
                  All time
                </Button>
                <Button
                  variant={datePreset === "last7" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDatePresetHandler("last7")}
                >
                  Last 7 days
                </Button>
                <Button
                  variant={datePreset === "last30" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDatePresetHandler("last30")}
                >
                  Last 30 days
                </Button>
                <Button
                  variant={datePreset === "thisMonth" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDatePresetHandler("thisMonth")}
                >
                  This month
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-xs">
                    Start Date
                  </Label>
                  <input
                    id="start-date"
                    type="date"
                    value={dateRange?.start || ""}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setDatePreset("");
                      const endDate = dateRange?.end || format(new Date(), "yyyy-MM-dd");
                      if (newStart <= endDate) {
                        setDateRange({ start: newStart, end: endDate });
                      }
                    }}
                    className="h-11 w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-xs">
                    End Date
                  </Label>
                  <input
                    id="end-date"
                    type="date"
                    value={dateRange?.end || ""}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setDatePreset("");
                      const startDate = dateRange?.start || format(new Date(), "yyyy-MM-dd");
                      if (startDate <= newEnd) {
                        setDateRange({ start: startDate, end: newEnd });
                      }
                    }}
                    className="h-11 w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Activity Type</h4>
              <Button
                variant="link"
                size="sm"
                onClick={toggleAllActivityTypes}
                className="h-auto p-0 text-xs"
              >
                {selectedActivityTypes.length === activityTypeOptions.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {activityTypeOptions.map((option) => {
                const count = activityTypeCounts.get(option.value) || 0;
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`activity-type-${option.value}`}
                      checked={selectedActivityTypes.includes(option.value)}
                      onCheckedChange={() => toggleActivityType(option.value)}
                    />
                    <Label
                      htmlFor={`activity-type-${option.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {option.label} ({count})
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Sales Rep</h4>
            <Select
              value={selectedSalesRep?.toString() || "all"}
              onValueChange={(value) =>
                setSelectedSalesRep(value === "all" ? null : parseInt(value, 10))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps ({allCampaignActivitiesCount})</SelectItem>
                {salesRepOptions.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id.toString()}>
                    {rep.name} ({rep.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Stale Leads</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-stale-leads"
                  checked={showStaleLeads}
                  onCheckedChange={(checked) => setShowStaleLeads(checked === true)}
                />
                <Label htmlFor="show-stale-leads" className="text-sm font-normal cursor-pointer">
                  Show stale leads (per-stage thresholds)
                </Label>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Thresholds by stage:</p>
                <p className="pl-2">• New Lead: {STAGE_STALE_THRESHOLDS.new_lead}d</p>
                <p className="pl-2">
                  • Outreach/Sample/Demo: {STAGE_STALE_THRESHOLDS.initial_outreach}d
                </p>
                <p className="pl-2">• Feedback: {STAGE_STALE_THRESHOLDS.feedback_logged}d</p>
                <p className="pl-2 italic">Closed stages excluded</p>
              </div>
              {showStaleLeads && staleOpportunitiesCount > 0 && (
                <div className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">
                  ⚠️ {staleOpportunitiesCount}{" "}
                  {staleOpportunitiesCount === 1 ? "lead needs" : "leads need"} follow-up
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
