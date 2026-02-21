import { useGetResourceLabel } from "ra-core";
import { ResultCount } from "./ResultCount";

interface ListPageHeaderProps {
  resource: string;
  total: number | undefined;
  isPending: boolean;
}

export function ListPageHeader({ resource, total, isPending }: ListPageHeaderProps) {
  const getResourceLabel = useGetResourceLabel();
  const title = getResourceLabel(resource, 2); // plural

  return (
    <div className="flex items-baseline gap-3 px-content pt-content pb-2 shrink-0">
      <h1 className="text-lg font-semibold">{title}</h1>
      <ResultCount total={total} isPending={isPending} />
    </div>
  );
}
