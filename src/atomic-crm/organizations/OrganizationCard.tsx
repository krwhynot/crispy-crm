import { memo } from "react";
import { Users, Target, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { ucFirst } from "@/atomic-crm/utils";
import type { PriorityLevel } from "./constants";
import type { OrganizationRecord } from "./types";

interface OrganizationCardProps {
  record: OrganizationRecord;
  onClick: (id: number) => void;
}

/** Priority dot color per level — local to card, not exported */
const PRIORITY_DOT_COLOR: Record<PriorityLevel, string> = {
  A: "text-primary",
  B: "text-secondary-foreground",
  C: "text-muted-foreground",
  D: "text-muted-foreground/50",
};

function formatLocation(city: string | null | undefined, state: string | null | undefined): string {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "\u2014";
}

export const OrganizationCard = memo(function OrganizationCard({
  record,
  onClick,
}: OrganizationCardProps) {
  const hasParent =
    record.parent_organization_id != null &&
    record.parent_organization_name != null &&
    record.parent_organization_name !== "";

  return (
    <Card
      className="p-5 gap-0 cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      onClick={() => onClick(Number(record.id))}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(Number(record.id));
        }
      }}
      aria-label={`View ${record.name}`}
    >
      {/* Zone 1: Header — Avatar + Name + Priority */}
      <div className="flex items-start gap-3">
        <OrganizationAvatar record={record} />
        <span className="text-base font-semibold truncate min-w-0 flex-1">{record.name}</span>
        {record.priority && (
          <span className="text-sm font-medium flex items-center gap-1 flex-shrink-0">
            <span
              className={
                PRIORITY_DOT_COLOR[record.priority as PriorityLevel] ?? "text-muted-foreground"
              }
            >
              ●
            </span>
            {record.priority}
          </span>
        )}
      </div>

      {/* Zone 2: Metadata — Location, Type · Segment, Parent */}
      <div className="space-y-0.5 mt-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{formatLocation(record.city, record.state)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {ucFirst(record.organization_type)} · {record.segment_name || "\u2014"}
        </div>
        {hasParent && (
          <div className="text-xs text-muted-foreground italic">
            Part of {record.parent_organization_name}
          </div>
        )}
      </div>

      {/* Zone 3: Metrics — Contacts + Opportunities */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
        <span className="flex items-center gap-1 tabular-nums">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {record.nb_contacts || 0} Contacts
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          {record.nb_opportunities || 0} Opportunities
        </span>
      </div>
    </Card>
  );
});
