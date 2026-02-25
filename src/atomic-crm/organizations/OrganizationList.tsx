import { memo, useState } from "react";
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext } from "ra-core";
import { TextField, FunctionField } from "react-admin";
import { OrganizationBulkButtons } from "./OrganizationBulkActionsToolbar";
import { List } from "@/components/ra-wrappers/list";
import { ListPageLayout } from "@/components/layouts/ListPageLayout";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { RowHoverActions } from "@/components/ra-wrappers/RowHoverActions";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { OrganizationListSkeleton } from "@/components/ui/list-skeleton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { OrganizationSlideOver } from "./OrganizationSlideOver";
import { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
import { OrganizationEmpty } from "./OrganizationEmpty";
import { OrganizationHierarchyChips } from "./OrganizationHierarchyChips";
import { FilterableBadge } from "@/components/ra-wrappers/FilterableBadge";
import { ExportMenuItem } from "@/components/ra-wrappers/export-menu-item";
import { OrganizationImportMenuItem } from "./OrganizationImportMenuItem";
import { ORGANIZATION_FILTER_CONFIG } from "./organizationFilterConfig";
import {
  OrganizationNameHeader,
  OrganizationTypeHeader,
  OrganizationPriorityHeader,
  OrganizationSegmentHeader,
  OrganizationStateHeader,
} from "./OrganizationDatagridHeader";
import { PageTutorialTrigger } from "../tutorial";
import type { Organization, Sale } from "../types";
import { DEFAULT_LIST_PAGE_SIZE } from "./constants";
import { SORT_BY_UPDATED_DESC } from "@/atomic-crm/constants/listDefaults";
import type { OrganizationExportRow, OrganizationRecord } from "./types";
import { OrganizationViewSwitcher, type OrganizationView } from "./OrganizationViewSwitcher";
import { OrganizationCardGrid } from "./OrganizationCardGrid";

// View preference persistence helpers
const ORGANIZATION_VIEW_KEY = "organization.view.preference";

const getViewPreference = (): OrganizationView => {
  const saved = localStorage.getItem(ORGANIZATION_VIEW_KEY);
  return saved === "list" || saved === "card" ? saved : "list";
};

const saveViewPreference = (view: OrganizationView) => {
  localStorage.setItem(ORGANIZATION_VIEW_KEY, view);
};

// Define Segment locally since it's not exported from ../types
interface Segment {
  id: number;
  name: string;
}

/**
 * Memoized cell components for OrganizationList datagrid
 * Following SampleStatusBadge pattern with named functions for React DevTools
 */

/** OrganizationNameCell - Renders org name with hierarchy context chips
 * Line 1: Name + branches chip
 * Line 2: City, State + parent chip (subtle tag with CornerDownRight icon)
 */
const OrganizationNameCell = memo(function OrganizationNameCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="name-cell truncate text-base font-semibold leading-tight">
          {record.name}
        </span>
        <OrganizationHierarchyChips record={record} show="branches" />
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[13px] text-muted-foreground truncate leading-snug">
          {record.city && record.state
            ? `${record.city}, ${record.state}`
            : record.city || record.state || "\u2014"}
        </span>
        <OrganizationHierarchyChips record={record} show="parent" parentDisplayMode="listCompact" />
      </div>
    </div>
  );
});

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

/** OrganizationSegmentCell - Renders segment as muted plain text with FilterableBadge wrapper */
const OrganizationSegmentCell = memo(function OrganizationSegmentCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  const segmentName = record.segment_name;
  return (
    <FilterableBadge source="segment_id" value={record.segment_id}>
      {segmentName ? (
        <span className="text-sm text-muted-foreground truncate max-w-[160px]" title={segmentName}>
          {segmentName}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">{"\u2014"}</span>
      )}
    </FilterableBadge>
  );
});

/** OrganizationContactsCell - Renders contact count metric */
const OrganizationContactsCell = memo(function OrganizationContactsCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return <span className="tabular-nums text-muted-foreground">{record.nb_contacts || 0}</span>;
});

/** OrganizationOpportunitiesCell - Renders opportunities count metric */
const OrganizationOpportunitiesCell = memo(function OrganizationOpportunitiesCell({
  record,
}: {
  record: OrganizationRecord;
}) {
  return <span className="tabular-nums text-muted-foreground">{record.nb_opportunities || 0}</span>;
});

const exporter: Exporter<OrganizationRecord> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const secondarySales = await fetchRelatedRecords<Sale>(records, "secondary_sales_id", "sales");
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
      secondary_sales_rep: org.secondary_sales_id
        ? `${secondarySales[org.secondary_sales_id]?.first_name} ${secondarySales[org.secondary_sales_id]?.last_name}`
        : undefined,

      // Contact information
      website: org.website ?? null,
      linkedin_url: org.linkedin_url ?? null,
      phone: org.phone ?? null,
      email: org.email ?? null,
      description: org.description ?? null,

      // Location
      address: org.address ?? null,
      city: org.city ?? null,
      state: org.state ?? null,
      postal_code: org.postal_code ?? null,

      // Metrics
      nb_contacts: org.nb_contacts || 0,
      nb_opportunities: org.nb_opportunities || 0,

      // Metadata
      created_at: org.created_at!,
      sales_id: org.sales_id ? String(org.sales_id) : null,
      secondary_sales_id: org.secondary_sales_id ? String(org.secondary_sales_id) : null,
      segment_id: org.segment_id ? String(org.segment_id) : null,
      parent_organization_id: org.parent_organization_id
        ? String(org.parent_organization_id)
        : null,
    };

    return exportedOrg;
  });

  return jsonExport(organizations, {}, (_err: Error | null, csv: string) => {
    downloadCSV(csv, "organizations");
  });
};

/**
 * OrganizationDatagrid - Content component rendered inside ListPageLayout
 *
 * Handles keyboard navigation, view switching (card vs list), and column rendering.
 * Empty-state branching (loading, empty, filtered-empty) is handled by ListPageLayout.
 */
const OrganizationDatagrid = ({
  openSlideOver,
  isSlideOverOpen,
  view,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
  view: OrganizationView;
}) => {
  const { error } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open or in card view
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen && view === "list",
  });

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading organizations. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {view === "card" ? (
        <OrganizationCardGrid onCardClick={(id) => openSlideOver(id, "view")} />
      ) : (
        <PremiumDatagrid
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
          rowClassName={(_record: unknown, index: number) =>
            `organization-list-row${index % 2 === 1 ? " organization-list-row-zebra" : ""}`
          }
        >
          {/* Column 1: Name - Primary identifier with hierarchy chips (sortable) - always visible */}
          <FunctionField
            source="name"
            label={<OrganizationNameHeader />}
            sortBy="name"
            render={(record: OrganizationRecord) => <OrganizationNameCell record={record} />}
            cellClassName="max-w-[340px]"
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

          {/* Column 4: Segment - Playbook/Operator category (sortable by segment_name) - always visible */}
          <FunctionField
            source="segment_id"
            label={<OrganizationSegmentHeader />}
            sortBy="segment_name"
            render={(record: OrganizationRecord) => <OrganizationSegmentCell record={record} />}
            cellClassName="max-w-[160px]"
          />

          {/* Column 5: State - US state code (sortable, filterable) - hidden on tablet */}
          <TextField
            source="state"
            label={<OrganizationStateHeader />}
            sortable
            cellClassName="hidden lg:table-cell w-[60px] text-muted-foreground"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 6: Contacts - Computed count metric (non-sortable) - hidden on mobile */}
          <FunctionField
            source="nb_contacts"
            label="Contacts"
            sortable={false}
            render={(record: OrganizationRecord) => <OrganizationContactsCell record={record} />}
            textAlign="right"
            cellClassName="hidden md:table-cell"
            headerClassName="hidden md:table-cell"
          />

          {/* Column 7: Opportunities - Computed count metric (non-sortable) - hidden on mobile */}
          <FunctionField
            source="nb_opportunities"
            label="Opps"
            sortable={false}
            render={(record: OrganizationRecord) => (
              <OrganizationOpportunitiesCell record={record} />
            )}
            textAlign="right"
            cellClassName="hidden md:table-cell"
            headerClassName="hidden md:table-cell"
          />

          <FunctionField
            label="Actions"
            sortable={false}
            cellClassName="w-[72px] sm:w-[88px] text-right"
            render={(record: OrganizationRecord) => (
              <RowHoverActions
                className="inline-flex items-center justify-end gap-1"
                recordId={record.id}
                resource="organizations"
                onView={(id) => openSlideOver(Number(id), "view")}
                onEdit={(id) => openSlideOver(Number(id), "edit")}
              />
            )}
          />
        </PremiumDatagrid>
      )}
    </div>
  );
};

export const OrganizationList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  const [view, setView] = useState<OrganizationView>(getViewPreference);

  const handleViewChange = (newView: OrganizationView) => {
    setView(newView);
    saveViewPreference(newView);
  };

  if (isIdentityPending) return <OrganizationListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="organizations-list">
        <List
          title={false}
          actions={false}
          perPage={DEFAULT_LIST_PAGE_SIZE}
          sort={SORT_BY_UPDATED_DESC}
          exporter={exporter}
        >
          <ListPageLayout
            resource="organizations"
            filterComponent={<OrganizationListFilter />}
            filterConfig={ORGANIZATION_FILTER_CONFIG}
            sortFields={["name", "organization_type", "priority", "segment_name", "created_at"]}
            searchPlaceholder="Search organizations..."
            enableRecentSearches
            viewSwitcher={<OrganizationViewSwitcher view={view} onViewChange={handleViewChange} />}
            overflowActions={
              <>
                <OrganizationImportMenuItem />
                <ExportMenuItem />
              </>
            }
            primaryAction={<CreateButton variant="default" />}
            emptyState={<OrganizationEmpty />}
            loadingSkeleton={<OrganizationListSkeleton />}
            bulkActions={view === "list" ? <OrganizationBulkButtons /> : undefined}
          >
            <OrganizationDatagrid
              openSlideOver={openSlideOver}
              isSlideOverOpen={isOpen}
              view={view}
            />
          </ListPageLayout>
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
