import { useGetIdentity, useListContext } from "ra-core";
import { List } from "@/components/ra-wrappers/list";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { RowHoverActions } from "@/components/ra-wrappers/RowHoverActions";
import { Badge } from "@/components/ui/badge";
import { SalesListSkeleton } from "@/components/ui/list-skeleton";
import { FunctionField, useRecordContext, EmailField, TextField } from "react-admin";
import type { Sale } from "../types";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { SalesSlideOver } from "./SalesSlideOver";
import { SALES_FILTER_CONFIG } from "./salesFilterConfig";
import { SalesListFilter } from "./SalesListFilter";

/**
 * SalesList - Standard list page for Sales (User) records
 *
 * Follows UnifiedListPageLayout pattern:
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

  if (isIdentityPending) return <SalesListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="sales-list">
        <List
          title={false}
          actions={false}
          sort={{ field: "first_name", order: "ASC" }}
          filterDefaultValues={{ disabled: false }}
        >
          <UnifiedListPageLayout
            resource="sales"
            filterComponent={<SalesListFilter />}
            filterConfig={SALES_FILTER_CONFIG}
            sortFields={["first_name", "last_name", "email"]}
            searchPlaceholder="Search team members..."
            primaryAction={<CreateButton variant="default" />}
            emptyState={<SalesEmpty />}
            loadingSkeleton={<SalesListSkeleton />}
          >
            <SalesDatagrid openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          </UnifiedListPageLayout>
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
 * SalesEmpty - Empty state when no team members exist
 */
const SalesEmpty = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-muted-foreground">No team members found.</p>
    <p className="mt-2 text-sm text-muted-foreground">
      Add team members to manage CRM access and permissions.
    </p>
  </div>
);

/**
 * SalesDatagrid - Content component rendered inside UnifiedListPageLayout
 *
 * Handles keyboard navigation and column rendering.
 * Empty-state branching is handled by UnifiedListPageLayout.
 */
const SalesDatagrid = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { error } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading team members. Please try refreshing the page.
      </div>
    );
  }

  return (
    <PremiumDatagrid
      onRowClick={(id) => openSlideOver(Number(id), "view")}
      focusedIndex={focusedIndex}
      bulkActionButtons={false}
    >
      {/* Column 1: First Name - Primary identifier (sortable) - always visible */}
      <TextField source="first_name" label="First Name" {...COLUMN_VISIBILITY.always} />

      {/* Column 2: Last Name - Secondary identifier (sortable) - always visible */}
      <TextField source="last_name" label="Last Name" {...COLUMN_VISIBILITY.always} />

      {/* Column 3: Email - Contact info (sortable) - hidden on tablet/mobile */}
      <EmailField source="email" label="Email" {...COLUMN_VISIBILITY.ipadPlus} />

      {/* Column 4: Role - Permission level badge (non-sortable) - always visible */}
      <RoleBadgeField label="Role" {...COLUMN_VISIBILITY.always} />

      {/* Column 5: Status - Account status (non-sortable) - hidden on tablet/mobile */}
      <StatusField label="Status" {...COLUMN_VISIBILITY.ipadPlus} />

      <FunctionField
        label="Actions"
        sortable={false}
        cellClassName="w-[128px] text-right"
        render={(record: Sale) => (
          <RowHoverActions
            className="inline-flex items-center justify-end gap-1"
            recordId={record.id}
            resource="sales"
            onView={(id) => openSlideOver(Number(id), "view")}
            onEdit={(id) => openSlideOver(Number(id), "edit")}
          />
        )}
      />
    </PremiumDatagrid>
  );
};

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
  const record = useRecordContext<Sale>();
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

