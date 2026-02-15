import { memo } from "react";
import jsonExport from "jsonexport/dist";
import { downloadCSV, type Exporter, useGetIdentity } from "ra-core";
import { FunctionField } from "react-admin";

import { List } from "@/components/ra-wrappers/list";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { BulkActionsToolbarChildren } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { TextField } from "@/components/ra-wrappers/text-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { Badge } from "@/components/ui/badge";
import { ActivityListSkeleton } from "@/components/ui/list-skeleton";
import { SaleName } from "../sales/SaleName";
import { ActivityListFilter } from "./ActivityListFilter";
import { SampleStatusBadge } from "../components/SampleStatusBadge";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { ExportMenuItem } from "@/components/ra-wrappers/export-menu-item";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { PageTutorialTrigger } from "../tutorial";
import type { ActivityRecord, Contact, Opportunity, Organization, Sale } from "../types";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";
import { ACTIVITY_FILTER_CONFIG } from "./activityFilterConfig";
import { ActivitySlideOver } from "./ActivitySlideOver";
import { ucFirst } from "@/atomic-crm/utils";

/**
 * Memoized cell components for ActivityList datagrid
 * Following SampleStatusBadge pattern with named functions for React DevTools
 */

/** ActivityTypeCell - Renders activity type badge with INTERACTION_TYPE_OPTIONS lookup */
const ActivityTypeCell = memo(function ActivityTypeCell({ record }: { record: ActivityRecord }) {
  const typeOption = INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === record.type);
  return (
    <Badge variant="outline" className="text-xs">
      {typeOption?.label || record.type}
    </Badge>
  );
});

/** ActivitySampleStatusCell - Renders sample status badge for sample activities */
const ActivitySampleStatusCell = memo(function ActivitySampleStatusCell({
  record,
}: {
  record: ActivityRecord;
}) {
  if (record.type !== "sample" || !record.sample_status) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <SampleStatusBadge status={record.sample_status} />;
});

/** ActivitySentimentCell - Renders sentiment badge with color-coded variants */
const ActivitySentimentCell = memo(function ActivitySentimentCell({
  record,
}: {
  record: ActivityRecord;
}) {
  if (!record.sentiment) {
    return <span className="text-muted-foreground">—</span>;
  }
  const sentimentColors: Record<string, string> = {
    positive: "bg-success/10 text-success",
    neutral: "bg-muted text-muted-foreground",
    negative: "bg-destructive/10 text-destructive",
  };
  return (
    <Badge className={sentimentColors[record.sentiment] || ""} variant="outline">
      {ucFirst(record.sentiment)}
    </Badge>
  );
});

/** ActivityEmpty - Shown when no activities exist and no filters are applied */
const ActivityEmpty = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-muted-foreground">No activities found.</p>
    <p className="text-sm text-muted-foreground mt-2">
      Activities will appear here as you log interactions with customers.
    </p>
  </div>
);

/**
 * ActivityList - Standard list page for Activity records
 *
 * Uses UnifiedListPageLayout for centralized empty-state branching,
 * loading states, filter cleanup, and bulk actions.
 *
 * Features:
 * - Identity-aware rendering with skeleton loading
 * - Keyboard navigation with slide-over integration
 * - BulkActionsToolbar for selection operations
 * - Responsive columns using COLUMN_VISIBILITY semantic presets
 * - Filter by activity type (13 types including samples)
 * - Filter by sample_status (sent, received, feedback_pending, feedback_received)
 * - Quick filters: "Samples Only", "Pending Feedback"
 * - Date range filters
 * - Sentiment filters
 * - Export to CSV
 *
 * @see PRD §4.4 for sample tracking requirements
 */
export default function ActivityList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  if (isIdentityPending) return <ActivityListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="activities-list">
        <List
          title={false}
          perPage={25}
          sort={{ field: "activity_date", order: "DESC" }}
          exporter={exporter}
          filter={{
            "deleted_at@is": null,
          }}
          actions={false}
        >
          <UnifiedListPageLayout
            resource="activities"
            filterComponent={<ActivityListFilter />}
            filterConfig={ACTIVITY_FILTER_CONFIG}
            sortFields={["type", "subject", "activity_date", "created_at"]}
            searchPlaceholder="Search activities..."
            overflowActions={<ExportMenuItem />}
            primaryAction={<CreateButton />}
            emptyState={<ActivityEmpty />}
            loadingSkeleton={<ActivityListSkeleton />}
            bulkActions={<BulkActionsToolbarChildren />}
          >
            <ActivityDatagrid openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          </UnifiedListPageLayout>
        </List>
      </div>

      <ActivitySlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
      <PageTutorialTrigger chapter="activities" position="bottom-left" />
    </>
  );
}

/**
 * ActivityDatagrid - Keyboard-navigable datagrid with slide-over integration
 */
const ActivityDatagrid = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  return (
    <PremiumDatagrid
      onRowClick={(id) => openSlideOver(Number(id), "view")}
      focusedIndex={focusedIndex}
    >
      {/* Column 1: Activity Type - Classification badge (sortable) - always visible */}
      <FunctionField
        label="Type"
        sortBy="type"
        render={(record: ActivityRecord) => <ActivityTypeCell record={record} />}
        {...COLUMN_VISIBILITY.alwaysVisible}
      />

      {/* Column 2: Subject - Primary identifier (sortable) - always visible */}
      <TextField
        source="subject"
        label="Subject"
        className="max-w-[300px] truncate"
        {...COLUMN_VISIBILITY.alwaysVisible}
      />

      {/* Column 3: Activity Date - Time field (sortable) - always visible */}
      <DateField
        source="activity_date"
        label="Date"
        showTime={false}
        sortable
        {...COLUMN_VISIBILITY.alwaysVisible}
      />

      {/* Column 4: Sample Status - Only for sample activities (non-sortable) - hidden on tablet/mobile */}
      <FunctionField
        label="Sample Status"
        sortable={false}
        render={(record: ActivityRecord) => <ActivitySampleStatusCell record={record} />}
        {...COLUMN_VISIBILITY.desktopOnly}
      />

      {/* Column 5: Sentiment - Feedback indicator (non-sortable) - hidden on tablet/mobile */}
      <FunctionField
        label="Sentiment"
        sortable={false}
        render={(record: ActivityRecord) => <ActivitySentimentCell record={record} />}
        {...COLUMN_VISIBILITY.desktopOnly}
      />

      {/* Column 6: Organization - Reference field (sortable) - always visible */}
      <ReferenceField
        source="organization_id"
        reference="organizations"
        label="Organization"
        link={false}
        sortable
        {...COLUMN_VISIBILITY.alwaysVisible}
      >
        <TextField source="name" />
      </ReferenceField>

      {/* Column 7: Opportunity - Reference field (non-sortable) - hidden on tablet/mobile */}
      <ReferenceField
        source="opportunity_id"
        reference="opportunities"
        label="Opportunity"
        link={false}
        sortable={false}
        {...COLUMN_VISIBILITY.desktopOnly}
      >
        <TextField source="name" />
      </ReferenceField>

      {/* Column 8: Created By - Sales reference (non-sortable) - hidden on tablet/mobile */}
      <ReferenceField
        source="created_by"
        reference="sales"
        label="Created By"
        link={false}
        sortable={false}
        {...COLUMN_VISIBILITY.desktopOnly}
      >
        <SaleName />
      </ReferenceField>
    </PremiumDatagrid>
  );
};

/**
 * CSV exporter for Activity records
 */
const exporter: Exporter<ActivityRecord> = async (records, fetchRelatedRecords) => {
  // Fetch related data
  const contacts = await fetchRelatedRecords<Contact>(records, "contact_id", "contacts");
  const organizations = await fetchRelatedRecords<Organization>(
    records,
    "organization_id",
    "organizations"
  );
  const opportunities = await fetchRelatedRecords<Opportunity>(
    records,
    "opportunity_id",
    "opportunities"
  );
  const sales = await fetchRelatedRecords<Sale>(records, "created_by", "sales");

  const dataForExport = records.map((activity) => {
    const contact = activity.contact_id ? contacts[activity.contact_id] : null;
    const organization = activity.organization_id ? organizations[activity.organization_id] : null;
    const opportunity = activity.opportunity_id ? opportunities[activity.opportunity_id] : null;
    const createdBy = activity.created_by ? sales[activity.created_by] : null;

    return {
      id: activity.id,
      activity_type: activity.activity_type,
      type: activity.type,
      subject: activity.subject,
      description: activity.description || "",
      activity_date: activity.activity_date,
      duration_minutes: activity.duration_minutes || "",
      sample_status: activity.sample_status || "",
      sentiment: activity.sentiment || "",
      contact_name: contact ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() : "",
      organization_name: organization?.name || "",
      opportunity_name: opportunity?.name || "",
      created_by: createdBy
        ? `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim()
        : "",
      created_at: activity.created_at,
    };
  });

  jsonExport(
    dataForExport,
    {
      headers: [
        "id",
        "activity_type",
        "type",
        "subject",
        "description",
        "activity_date",
        "duration_minutes",
        "sample_status",
        "sentiment",
        "contact_name",
        "organization_name",
        "opportunity_name",
        "created_by",
        "created_at",
      ],
    },
    (err, csv) => {
      if (err) {
        throw new Error(`CSV export failed: ${err.message}`);
      }
      downloadCSV(csv, "activities");
    }
  );
};
