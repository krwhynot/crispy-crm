import { useGetIdentity, useListContext } from "ra-core";

import {
  CreateButton,
  ExportButton,
  List,
  ListPagination,
  SortButton,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { ImageList } from "./GridList";

export const OrganizationList = () => {
  const { identity } = useGetIdentity();
  if (!identity) return null;
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      actions={<OrganizationListActions />}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    >
      <OrganizationListLayout />
    </List>
  );
};

const OrganizationListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <OrganizationEmpty />;

  return (
    <div className="w-full flex flex-row gap-8">
      <OrganizationListFilter />
      <div className="flex flex-col flex-1 gap-4">
        <ImageList />
      </div>
    </div>
  );
};

const OrganizationListActions = () => {
  return (
    <TopToolbar>
      <SortButton fields={["name", "created_at", "nb_contacts"]} />
      <ExportButton />
      <CreateButton label="New Organization" />
    </TopToolbar>
  );
};

export default OrganizationList;
