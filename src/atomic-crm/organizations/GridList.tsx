import { RecordContextProvider, useListContext } from "ra-core";

import type { Company } from "../types";
import { OrganizationCard } from "./OrganizationCard";

const times = (nbChildren: number, fn: (key: number) => any) =>
  Array.from({ length: nbChildren }, (_, key) => fn(key));

const LoadingGridList = () => (
  <div className="flex flex-wrap w-[1008px] gap-1">
    {times(15, (key) => (
      <div className="h-[200px] w-[194px] flex flex-col bg-loading-skeleton" key={key} />
    ))}
  </div>
);

const LoadedGridList = () => {
  const { data, error, isPending } = useListContext<Company>();

  if (isPending || error) return null;

  return (
    <div
      className="w-full gap-2 grid"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      }}
    >
      {data.map((record) => (
        <RecordContextProvider key={record.id} value={record}>
          <OrganizationCard />
        </RecordContextProvider>
      ))}

      {data.length === 0 && <div className="p-2">No organizations found</div>}
    </div>
  );
};

export const GridList = () => {
  const { isPending } = useListContext();
  return isPending ? <LoadingGridList /> : <LoadedGridList />;
};
