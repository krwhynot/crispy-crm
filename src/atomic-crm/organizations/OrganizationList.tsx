import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext } from "ra-core";
import { TextField, ReferenceField, FunctionField } from "react-admin";
import { OrganizationBulkActionsToolbar } from "./OrganizationBulkActionsToolbar";
import { List } from "@/components/admin/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { OrganizationListSkeleton } from "@/components/ui/list-skeleton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { OrganizationSlideOver } from "./OrganizationSlideOver";
import { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { FilterableBadge } from "@/components/admin/FilterableBadge";
import { ListNoResults } from "@/components/admin/ListNoResults";
import { TopToolbar } from "../layout/TopToolbar";
import { SortButton } from "@/components/admin/sort-button";
import { ExportButton } from "@/components/admin/export-button";
import { ORGANIZATION_FILTER_CONFIG } from "./organizationFilterConfig";
import {
  OrganizationNameHeader,
  OrganizationTypeHeader,
  OrganizationPriorityHeader,
} from "./OrganizationDatagridHeader";
import { PageTutorialTrigger } from "../tutorial";
import type { Organization, Sale, Segment } from "../types";
import { DEFAULT_LIST_PAGE_SIZE } from "./constants";
import type { OrganizationExportRow, OrganizationRecord } from "./types";

const OrganizationListActions = () => (
  <TopToolbar>
    <SortButton
      fields={["name", "organization_type", "priority", "created_at"]}
      dataTutorial="org-sort-btn"
    />
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
            label={<OrganizationTypeHeader />}
            sortBy="organization_type"
            render={(record: OrganizationRecord) => (
              <FilterableBadge source="organization_type" value={record.organization_type}>
                <OrganizationTypeBadge type={record.organization_type} />
              </FilterableBadge>
            )}
          />

          {/* Column 3: Priority - Business priority indicator (sortable) - always visible */}
          <FunctionField
            label={<OrganizationPriorityHeader />}
            sortBy="priority"
            render={(record: OrganizationRecord) => (
              <FilterableBadge source="priority" value={record.priority}>
                <PriorityBadge priority={record.priority} />
              </FilterableBadge>
            )}
          />

          {/* Column 4: Parent - Hierarchy reference (sortable by parent_organization_id) - hidden on tablet */}
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
            label="Contacts"
            sortable={false}
            render={(record: OrganizationRecord) => record.nb_contacts || 0}
            textAlign="center"
            cellClassName="hidden md:table-cell"
            headerClassName="hidden md:table-cell"
          />

          {/* Column 6: Opportunities - Computed count metric (non-sortable) - hidden on mobile */}
          <FunctionField
            label="Opportunities"
            sortable={false}
            render={(record: OrganizationRecord) => record.nb_opportunities || 0}
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
          sort={{ field: "updated_at", order: "DESC" }}
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
