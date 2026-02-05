import { memo } from "react";
import { Users, Target, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { OrganizationTypeBadge, PriorityBadge, SegmentBadge } from "./OrganizationBadges";
import { OrganizationHierarchyChips } from "./OrganizationHierarchyChips";
import type { OrganizationRecord } from "./types";

interface OrganizationCardProps {
  record: OrganizationRecord;
  onClick: (id: number) => void;
}

export const OrganizationCard = memo(function OrganizationCard({
  record,
  onClick,
}: OrganizationCardProps) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
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
      {/* Top: Avatar + Name + Hierarchy */}
      <div className="flex items-start gap-2 mb-2">
        <OrganizationAvatar record={record} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm truncate">{record.name}</span>
            <OrganizationHierarchyChips record={record} />
          </div>
          {/* Type + Segment badges */}
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <OrganizationTypeBadge type={record.organization_type} />
            <SegmentBadge segmentId={record.segment_id} segmentName={record.segment_name} />
          </div>
        </div>
      </div>

      {/* Bottom: Priority + State + Counts */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {record.priority && <PriorityBadge priority={record.priority} />}
          {record.state && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {record.state}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Contacts">
            <Users className="h-3 w-3" />
            {record.nb_contacts || 0}
          </span>
          <span className="flex items-center gap-1" title="Opportunities">
            <Target className="h-3 w-3" />
            {record.nb_opportunities || 0}
          </span>
        </div>
      </div>
    </Card>
  );
});
