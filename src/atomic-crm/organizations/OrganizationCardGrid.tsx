import { useListContext } from "ra-core";
import { OrganizationCard } from "./OrganizationCard";
import type { OrganizationRecord } from "./types";

interface OrganizationCardGridProps {
  onCardClick: (id: number) => void;
}

export const OrganizationCardGrid = ({ onCardClick }: OrganizationCardGridProps) => {
  const { data } = useListContext<OrganizationRecord>();

  if (!data?.length) return null;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
        {data.map((record) => (
          <OrganizationCard key={record.id} record={record} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
};
