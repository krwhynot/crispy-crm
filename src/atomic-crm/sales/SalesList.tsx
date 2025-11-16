import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { useRecordContext } from "ra-core";
import { TopToolbar } from "../layout/TopToolbar";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="New user" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="flex flex-row gap-1">
      {/* Show role badge - semantic utilities only */}
      {record.role === 'admin' && (
        <Badge variant="outline" className="border-primary text-primary">
          Admin
        </Badge>
      )}
      {record.role === 'manager' && (
        <Badge variant="outline" className="border-success text-success">
          Manager
        </Badge>
      )}
      {/* Rep role doesn't need a badge (default) */}

      {/* Show disabled badge */}
      {record.disabled && (
        <Badge variant="outline" className="border-warning text-warning">
          Disabled
        </Badge>
      )}
    </div>
  );
};

export function SalesList() {
  return (
    <List
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <DataTable>
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="email" />
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}
