import { useGetIdentity, useListContext } from "ra-core";
import { List } from "@/components/ra-wrappers/list";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { Badge } from "@/components/ui/badge";
import { SalesListSkeleton } from "@/components/ui/list-skeleton";
import { useRecordContext, EmailField, TextField } from "react-admin";
import type { Sale } from "../types";
import { TopToolbar } from "../layout/TopToolbar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { FloatingCreateButton } from "@/components/ra-wrappers/FloatingCreateButton";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { SalesSlideOver } from "./SalesSlideOver";
import { SALES_FILTER_CONFIG } from "./salesFilterConfig";

/**
 * SalesList - Standard list page for Sales (User) records
 *
 * Follows ContactList reference pattern:
 * - Identity-aware rendering with skeleton loading
 * - Keyboard navigation with slide-over integration
 * - Responsive columns using COLUMN_VISIBILITY semantic presets
 * - Sidebar filters for role and status (industry standard pattern)
 *
 * Note: This is an admin-only resource for team member management.
 * Default filter shows Active users only (industry standard: Google Workspace, Salesforce).
 */
export default function SalesList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  useFilterCleanup("sales");

  if (isIdentityPending) return <SalesListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="sales-list">
        <List
          title={false}
          actions={<SalesListActions />}
          sort={{ field: "first_name", order: "ASC" }}
          filterDefaultValues={{ disabled: false }}
        >
          <SalesListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </div>

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

/**
 * SalesListLayout - Handles loading, empty states, and datagrid rendering
 */
const SalesListLayout = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show skeleton during initial load
  if (isPending) {
    return (
      <div className="card-container">
        <SalesListSkeleton />
      </div>
    );
  }

  if (!data?.length && !hasFilters) {
    return (
      <div className="card-container">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No team members found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add team members to manage CRM access and permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-container">
      <ListSearchBar placeholder="Search team members..." filterConfig={SALES_FILTER_CONFIG} />
      <PremiumDatagrid
        onRowClick={(id) => openSlideOver(Number(id), "view")}
        focusedIndex={focusedIndex}
        bulkActionButtons={false}
      >
        {/* Column 1: First Name - Primary identifier (sortable) - always visible */}
        <TextField source="first_name" label="First Name" {...COLUMN_VISIBILITY.alwaysVisible} />

        {/* Column 2: Last Name - Secondary identifier (sortable) - always visible */}
        <TextField source="last_name" label="Last Name" {...COLUMN_VISIBILITY.alwaysVisible} />

        {/* Column 3: Email - Contact info (sortable) - hidden on tablet/mobile */}
        <EmailField source="email" label="Email" {...COLUMN_VISIBILITY.desktopOnly} />

        {/* Column 4: Role - Permission level badge (non-sortable) - always visible */}
        <RoleBadgeField label="Role" {...COLUMN_VISIBILITY.alwaysVisible} />

        {/* Column 5: Status - Account status (non-sortable) - hidden on tablet/mobile */}
        <StatusField label="Status" {...COLUMN_VISIBILITY.desktopOnly} />
      </PremiumDatagrid>
    </div>
  );
};

/**
 * SalesListActions - Empty TopToolbar (actions moved to ListSearchBar)
 */
const SalesListActions = () => <TopToolbar />;

/**
 * RoleBadgeField - Display role badge with semantic colors
 */
const RoleBadgeField = ({
  label: _label,
  ..._props
}: {
  label: string;
  cellClassName?: string;
  headerClassName?: string;
}) => {
  const record = useRecordContext<Sale>();
  if (!record) return null;

  let badge = null;
  switch (record.role) {
    case "admin":
      badge = (
        <Badge
          variant="outline"
          className="border-primary text-primary"
          role="status"
          aria-label="Role: Admin"
        >
          Admin
        </Badge>
      );
      break;
    case "manager":
      badge = (
        <Badge
          variant="outline"
          className="border-success text-success"
          role="status"
          aria-label="Role: Manager"
        >
          Manager
        </Badge>
      );
      break;
    case "rep":
      badge = (
        <Badge
          variant="outline"
          className="border-muted-foreground text-muted-foreground"
          role="status"
          aria-label="Role: Rep"
        >
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
const StatusField = ({
  label: _label,
  ..._props
}: {
  label: string;
  cellClassName?: string;
  headerClassName?: string;
}) => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="flex flex-row gap-1">
      {record.disabled ? (
        <Badge
          variant="outline"
          className="border-warning text-warning"
          role="status"
          aria-label="Account status: Disabled"
        >
          Disabled
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-success text-success"
          role="status"
          aria-label="Account status: Active"
        >
          Active
        </Badge>
      )}
    </div>
  );
};
