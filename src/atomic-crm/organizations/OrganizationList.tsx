import { useState } from "react";
import { useGetIdentity, useListContext } from "ra-core";
import {
  Datagrid,
  TextField,
  ReferenceField,
  FunctionField,
  SearchInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  BooleanInput,
} from "react-admin";

import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { TopToolbar } from "../layout/TopToolbar";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { OrganizationImportButton as _OrganizationImportButton } from "./OrganizationImportButton";
import { GridList } from "./GridList";
import { OrganizationViewSwitcher, type OrganizationView } from "./OrganizationViewSwitcher";

// Helper functions for view preference persistence
const ORGANIZATION_VIEW_KEY = "organization.view.preference";

const getViewPreference = (): OrganizationView => {
  const saved = localStorage.getItem(ORGANIZATION_VIEW_KEY);
  return saved === "grid" || saved === "table" ? saved : "table";
};

const saveViewPreference = (view: OrganizationView) => {
  localStorage.setItem(ORGANIZATION_VIEW_KEY, view);
};

/**
 * Organization list filters with hierarchy support
 */
const organizationFilters = [
  <SearchInput key="search" source="q" alwaysOn />,

  <SelectInput
    key="hierarchy_type"
    source="hierarchy_type"
    label="Hierarchy Type"
    choices={[
      { id: "all", name: "All Organizations" },
      { id: "parent", name: "Parent Organizations Only" },
      { id: "branch", name: "Branch Locations Only" },
      { id: "standalone", name: "Standalone Only" },
    ]}
    alwaysOn
  />,

  <ReferenceInput
    key="parent_org"
    source="parent_organization_id"
    reference="organizations"
    label="Parent Organization"
    filter={{
      child_branch_count: { $gt: 0 }, // Only parents
    }}
  >
    <AutocompleteInput
      optionText={(choice: any) =>
        choice ? `${choice.name} (${choice.child_branch_count} branches)` : ""
      }
      filterToQuery={(searchText: string) => ({
        name: { $ilike: `%${searchText}%` },
      })}
    />
  </ReferenceInput>,

  <BooleanInput
    key="has_branches"
    source="has_branches"
    label="Show only organizations with branches"
  />,
];

export const OrganizationList = () => {
  const { identity } = useGetIdentity();
  const [view, setView] = useState<OrganizationView>(getViewPreference);

  const handleViewChange = (newView: OrganizationView) => {
    setView(newView);
    saveViewPreference(newView);
  };

  if (!identity) return null;
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      actions={<OrganizationListActions view={view} onViewChange={handleViewChange} />}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
      filters={organizationFilters}
    >
      <OrganizationListLayout view={view} />
      <FloatingCreateButton />
    </List>
  );
};

const OrganizationListLayout = ({ view }: { view: OrganizationView }) => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <OrganizationEmpty />;

  return (
    <div className="w-full space-y-4">
      {view === "grid" ? (
        <GridList />
      ) : (
        <Datagrid
          rowClick="show"
          bulkActionButtons={false}
          sx={{
            "& .RaDatagrid-table": {
              fontVariantNumeric: "tabular-nums",
            },
          }}
        >
          <TextField source="name" label="Name" />
          <ReferenceField
            source="parent_organization_id"
            reference="organizations"
            label="Parent Organization"
            link="show"
            emptyText="-"
          >
            <TextField source="name" />
          </ReferenceField>
          <TextField source="organization_type" label="Type" />
          <TextField source="priority" label="Priority" />
          <FunctionField
            label="# Branches"
            render={(record: any) =>
              record.child_branch_count && record.child_branch_count > 0
                ? record.child_branch_count
                : "-"
            }
            textAlign="right"
          />
        </Datagrid>
      )}
      <BulkActionsToolbar />
    </div>
  );
};

const OrganizationListActions = ({
  view,
  onViewChange,
}: {
  view: OrganizationView;
  onViewChange: (view: OrganizationView) => void;
}) => {
  return (
    <TopToolbar>
      <OrganizationViewSwitcher view={view} onViewChange={onViewChange} />
      <SortButton fields={["name", "created_at", "nb_contacts"]} />
      {/* <OrganizationImportButton /> */}
      <ExportButton />
      <CreateButton label="New Organization" />
    </TopToolbar>
  );
};

export default OrganizationList;
