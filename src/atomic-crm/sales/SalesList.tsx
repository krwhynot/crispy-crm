import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { Badge } from "@/components/ui/badge";
import { useRecordContext, EmailField, TextField } from "react-admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { SalesSlideOver } from "./SalesSlideOver";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="New user" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

/**
 * RoleBadgeField - Display role badge with semantic colors
 */
const RoleBadgeField = () => {
  const record = useRecordContext();
  if (!record) return null;

  let badge = null;
  switch (record.role) {
    case "admin":
      badge = (
        <Badge variant="outline" className="border-primary text-primary">
          Admin
        </Badge>
      );
      break;
    case "manager":
      badge = (
        <Badge variant="outline" className="border-success text-success">
          Manager
        </Badge>
      );
      break;
    case "rep":
      badge = (
        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
          Rep
        </Badge>
      );
      break;
  }

  return <div className="flex flex-row gap-1">{badge}</div>;
};

/**
 * StatusField - Display account status (Active/Disabled)
 */
const StatusField = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="flex flex-row gap-1">
      {record.disabled ? (
        <Badge variant="outline" className="border-warning text-warning">
          Disabled
        </Badge>
      ) : (
        <Badge variant="outline" className="border-success text-success">
          Active
        </Badge>
      )}
    </div>
  );
};

export default function SalesList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  return (
    <>
      <List
        filters={filters}
        actions={<SalesListActions />}
        sort={{ field: "first_name", order: "ASC" }}
      >
        {/* Sales has no filters, so no StandardListLayout wrapper needed - just inline search */}
        <div className="card-container">
          <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id))} bulkActionButtons={false}>
            <TextField source="first_name" label="First Name" />
            <TextField source="last_name" label="Last Name" />
            <EmailField source="email" label="Email" />
            <RoleBadgeField label="Role" />
            <StatusField label="Status" />
          </PremiumDatagrid>
        </div>
      </List>

      {/* Slide-over panel */}
      <SalesSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        onClose={closeSlideOver}
        mode={mode}
        onModeToggle={toggleMode}
      />
    </>
  );
}
