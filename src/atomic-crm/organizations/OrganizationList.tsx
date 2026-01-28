import { memo } from "react";
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext, useStore } from "ra-core";
import { TextField, ReferenceField, FunctionField } from "react-admin";
import { OrganizationBulkActionsToolbar } from "./OrganizationBulkActionsToolbar";
import { List } from "@/components/ra-wrappers/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { Button } from "@/components/ui/button";
import { Columns } from "lucide-react";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { FloatingCreateButton } from "@/components/ra-wrappers/FloatingCreateButton";
import { OrganizationListSkeleton } from "@/components/ui/list-skeleton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/ra-wrappers/ListSearchBar";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { OrganizationSlideOver } from "./OrganizationSlideOver";
import { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import { ListNoResults } from "@/components/ra-wrappers/ListNoResults";
import { TopToolbar } from "../layout/TopToolbar";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { ExportButton } from "@/components/ra-wrappers/export-button";
import { ORGANIZATION_FILTER_CONFIG } from "./organizationFilterConfig";
import {
  OrganizationNameHeader,
  OrganizationTypeHeader,
  OrganizationPriorityHeader,
  OrganizationStateHeader,
} from "./OrganizationDatagridHeader";
import { PageTutorialTrigger } from "../tutorial";
import type { Organization, Sale, Segment } from "../types";
import { DEFAULT_LIST_PAGE_SIZE } from "./constants";
import { SORT_BY_UPDATED_DESC } from "@/atomic-crm/constants/listDefaults";
import type { OrganizationExportRow, OrganizationRecord } from "./types";

/**
 * Memoized cell components for OrganizationList datagrid
 * Following SampleStatusBadge pattern with named functions for React DevTools
 */

/** OrganizationTypeCell - Renders organization type badge with FilterableBadge wrapper */
const OrganizationTypeCell = memo(function OrganizationTypeCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return (
    <FilterableBadge source="organization_type" value={record.organization_type}>
      <OrganizationTypeBadge type={record.organization_type} />
    </FilterableBadge>
  );
});

/** OrganizationPriorityCell - Renders priority badge with FilterableBadge wrapper */
const OrganizationPriorityCell = memo(function OrganizationPriorityCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return (
    <FilterableBadge source="priority" value={record.priority}>
      <PriorityBadge priority={record.priority} />
    </FilterableBadge>
  );
});

/** OrganizationContactsCell - Renders contact count metric */
const OrganizationContactsCell = memo(function OrganizationContactsCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return <>{record.nb_contacts || 0}</>;
});

/** OrganizationOpportunitiesCell - Renders opportunities count metric */
const OrganizationOpportunitiesCell = memo(function OrganizationOpportunitiesCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return <>{record.nb_opportunities || 0}</>;
});

/**
 * StyledColumnsButton - Custom columns selector that matches site design
 * Uses shadcn Button component instead of Material-UI from React Admin
 * Opens the DatagridConfigurable column preferences editor
 */
const StyledColumnsButton = ({ preferenceKey }: { preferenceKey: string }) => {
  const [, setInspectorOpen] = useStore(`preferences.${preferenceKey}.inspectorOpen`, false);

  const handleClick = () => {
    setInspectorOpen(true);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="gap-2"
      data-testid="select-columns-button"
      data-preference-key={preferenceKey}
    >
      <Columns className="h-4 w-4" />
      Columns
    </Button>
  );
};

const OrganizationListActions = () => (
  <TopToolbar>
    <SortButton
      fields={["name", "organization_type", "priority", "created_at"]}
      dataTutorial="org-sort-btn"
    />
    <StyledColumnsButton preferenceKey="organizations.datagrid" />
    <ExportButton dataTutorial="org-export-btn" />
  </TopToolbar>
);

const exporter: Exporter<Organization> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const segments = await fetchRelatedRecords<Segment>(records, "segment_id", "segments");

  // Collect all parent organization IDs
  const parentIds = Array.from(
    new Set(records.map((org) => org.parent_organization_id).filter(Boolean))
  );

  // Fetch parent organization names
  const parentOrganizations =
    parentIds.length > 0
      ? await fetchRelatedRecords<Organization>(
          parentIds.map((id) => ({ id, parent_organization_id: id })),
          "parent_organization_id",
          "organizations"
        )
      : {};

  const organizations = records.map((org) => {
    const exportedOrg: OrganizationExportRow = {
      // Core fields
      id: org.id,
      name: org.name,
      organization_type: org.organization_type,
      priority: org.priority,

      // Related data
      parent_organization: org.parent_organization_id
        ? parentOrganizations[org.parent_organization_id]?.name
        : undefined,
      segment: org.segment_id ? segments[org.segment_id]?.name : undefined,
      sales_rep: org.sales_id
        ? `${sales[org.sales_id]?.first_name} ${sales[org.sales_id]?.last_name}`
        : undefined,

      // Contact information
      website: org.website,
      phone: org.phone,
      email: org.email,

      // Location
      address: org.address,
      city: org.city,
      state: org.state,
      postal_code: org.postal_code,

      // Metrics
      nb_contacts: org.nb_contacts || 0,
      nb_opportunities: org.nb_opportunities || 0,

      // Metadata
      created_at: org.created_at,
      sales_id: org.sales_id,
      segment_id: org.segment_id,
      parent_organization_id: org.parent_organization_id,
    };

    return exportedOrg;
  });

  return jsonExport(organizations, {}, (_err: Error | null, csv: string) => {
    downloadCSV(csv, "organizations");
  });
};

const OrganizationListLayout = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show skeleton during initial load or while identity is loading
  if (isPending || isIdentityPending) {
    return (
      <StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
        <OrganizationListSkeleton />
      </StandardListLayout>
    );
  }

  if (!identity) return null;

  if (!data?.length && !hasFilters) return <OrganizationEmpty />;

  // Filtered empty state: filters are applied but no results match
  if (!data?.length && hasFilters) {
    return (
      <StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
        <ListSearchBar
          placeholder="Search organizations..."
          filterConfig={ORGANIZATION_FILTER_CONFIG}
          enableRecentSearches
        />
        <ListNoResults />
      </StandardListLayout>
    );
  }

  return (
    <>
      <StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
        <ListSearchBar
          placeholder="Search organizations..."
          filterConfig={ORGANIZATION_FILTER_CONFIG}
          enableRecentSearches
        />
        <PremiumDatagrid
          configurable={true}
          preferenceKey="organizations.datagrid"
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
        >
          {/* Column 1: Name - Primary identifier (sortable) - always visible */}
          <TextField
            source="name"
            label={<OrganizationNameHeader />}
            sortable
            cellClassName="truncate max-w-[250px]"
          />

          {/* Column 2: Type - Organization classification (sortable by organization_type) - always visible */}
          <FunctionField
            source="organization_type"
            label={<OrganizationTypeHeader />}
            sortBy="organization_type"
            render={(record: OrganizationRecord) => <OrganizationTypeCell record={record} />}
          />

          {/* Column 3: Priority - Business priority indicator (sortable) - always visible */}
          <FunctionField
            source="priority"
            label={<OrganizationPriorityHeader />}
            sortBy="priority"
            render={(record: OrganizationRecord) => <OrganizationPriorityCell record={record} />}
          />

          {/* Column 4: State - US state code (sortable, filterable) - hidden on tablet */}
          <TextField
            source="state"
            label={<OrganizationStateHeader />}
            sortable
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 5: Parent - Hierarchy reference (sortable by parent_organization_id) - hidden on tablet */}
          <ReferenceField
            source="parent_organization_id"
            reference="organizations"
            label="Parent"
            link={false}
            emptyText="-"
            sortable
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          >
            <TextField source="name" className="truncate max-w-[200px]" />
          </ReferenceField>

          {/* Column 5: Contacts - Computed count metric (non-sortable) - hidden on mobile */}
          <FunctionField
            source="nb_contacts"
            label="Contacts"
            sortable={false}
            render={(record: OrganizationRecord) => <OrganizationContactsCell record={record} />}
            textAlign="center"
            cellClassName="hidden md:table-cell"
            headerClassName="hidden md:table-cell"
          />

          {/* Column 6: Opportunities - Computed count metric (non-sortable) - hidden on mobile */}
          <FunctionField
            source="nb_opportunities"
            label="Opportunities"
            sortable={false}
            render={(record: OrganizationRecord) => (
              <OrganizationOpportunitiesCell record={record} />
            )}
            textAlign="center"
            cellClassName="hidden md:table-cell"
            headerClassName="hidden md:table-cell"
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <OrganizationBulkActionsToolbar />
    </>
  );
};

export const OrganizationList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup("organizations");

  if (isIdentityPending) return <OrganizationListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="organizations-list">
        <List
          title={false}
          actions={<OrganizationListActions />}
          perPage={DEFAULT_LIST_PAGE_SIZE}
          sort={SORT_BY_UPDATED_DESC}
          exporter={exporter}
        >
          <OrganizationListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </div>
      <OrganizationSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
      <PageTutorialTrigger chapter="organizations" position="bottom-left" />
    </>
  );
};

export default OrganizationList;
