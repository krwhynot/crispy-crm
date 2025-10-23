import { useGetIdentity, useListContext } from "ra-core";

import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { SortButton } from "@/components/admin/sort-button";
import { TopToolbar } from "../layout/TopToolbar";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { ImageList } from "./GridList";
import { OrganizationImportButton } from "./OrganizationImportButton";

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
      <BulkActionsToolbar />
    </div>
  );
};

const OrganizationListActions = () => {
  return (
    <TopToolbar>
      <SortButton fields={["name", "created_at", "nb_contacts"]} />
      <OrganizationImportButton />
      <ExportButton />
      <CreateButton label="New Organization" />
    </TopToolbar>
  );
};

export default OrganizationList;
