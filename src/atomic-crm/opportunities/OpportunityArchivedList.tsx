/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { useGetIdentity, useGetList } from "ra-core";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel } from "./constants/stageConstants";
import { parseDateSafely } from "@/lib/date-utils";

export const OpportunityArchivedList = () => {
  const { data: identity } = useGetIdentity();
  const {
    data: archivedLists,
    total,
    isPending,
  } = useGetList("opportunities", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "deleted_at", order: "DESC" },
    filter: { "deleted_at@not.is": null },
  });
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (!isPending && total === 0) {
      setOpenDialog(false);
    }
  }, [isPending, total]);

  useEffect(() => {
    setOpenDialog(false);
  }, [archivedLists]);

  if (!identity || isPending || !total || !archivedLists) return null;

  // Group archived lists by date
  const archivedListsByDate: { [date: string]: Opportunity[] } = archivedLists.reduce(
    (acc, opportunity) => {
      const parsedDate = parseDateSafely(opportunity.deleted_at);
      if (!parsedDate) return acc;
      const date = parsedDate.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(opportunity);
      return acc;
    },
    {} as { [date: string]: Opportunity[] }
  );

  return (
    <div className="w-full flex flex-row items-center justify-center">
      <Button variant="ghost" onClick={() => setOpenDialog(true)} className="my-4">
        View archived opportunities
      </Button>
      <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
        <DialogContent className="lg:max-w-4xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
          <DialogHeader>
            <DialogTitle>Archived Opportunities</DialogTitle>
            <DialogDescription>
              View opportunities that have been archived. These are grouped by archive date.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-8">
            {Object.entries(archivedListsByDate).map(([date, opportunities]) => (
              <div key={date} className="flex flex-col gap-4">
                <h4 className="font-bold">{getRelativeTimeString(date)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {opportunities.map((opportunity: Opportunity) => (
                    <div
                      key={opportunity.id}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <h3 className="font-medium text-sm text-foreground mb-2">
                        {opportunity.name}
                      </h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Stage: {getOpportunityStageLabel(opportunity.stage)}</div>
                        {opportunity.estimated_close_date && parseDateSafely(opportunity.estimated_close_date) && (
                          <div>
                            Close Date:{" "}
                            {format(parseDateSafely(opportunity.estimated_close_date)!, "MMM d, yyyy")}
                          </div>
                        )}
                        {opportunity.deleted_at && parseDateSafely(opportunity.deleted_at) && (
                          <div className="text-destructive mt-2">
                            Archived: {format(parseDateSafely(opportunity.deleted_at)!, "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = date.getTime() - today.getTime();
  const unitDiff = Math.round(diff / (1000 * 60 * 60 * 24));

  // Check if the date is more than one week old
  if (Math.abs(unitDiff) > 7) {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
    }).format(date);
  }

  // Intl.RelativeTimeFormat for dates within the last week
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  return ucFirst(rtf.format(unitDiff, "day"));
}

function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
