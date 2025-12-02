import jsonExport from "jsonexport/dist";
import { downloadCSV, type Exporter, useGetIdentity, useListContext } from "ra-core";
import { FunctionField } from "react-admin";

import { List } from "@/components/admin/list";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { SaleName } from "../sales/SaleName";
import { TopToolbar } from "../layout/TopToolbar";
import { ActivityListFilter } from "./ActivityListFilter";
import { SampleStatusBadge } from "../components/SampleStatusBadge";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import type { ActivityRecord, Contact, Opportunity, Organization, Sale } from "../types";
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";

/**
 * ActivityList Component
 *
 * Displays all activities in a StandardListLayout with PremiumDatagrid.
 *
 * Features:
 * - Filter by activity type (13 types including samples)
 * - Filter by sample_status (sent, received, feedback_pending, feedback_received)
 * - Quick filters: "Samples Only", "Pending Feedback"
 * - Date range filters
 * - Sentiment filters
 * - Export to CSV
 *
 * Design Pattern: Unified design system (StandardListLayout + PremiumDatagrid)
 *
 * @see PRD §4.4 for sample tracking requirements
 */
export default function ActivityList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();

  // Clean up stale cached filters from localStorage
  useFilterCleanup("activities");

  if (isIdentityPending) return <div>Loading...</div>;
  if (!identity) return null;

  return (
    <List
      title="Activities"
      perPage={50}
      sort={{ field: "activity_date", order: "DESC" }}
      exporter={exporter}
      filter={{
        "deleted_at@is": null,
      }}
      actions={<ActivityListActions />}
    >
      <ActivityListLayout />
      <FloatingCreateButton />
    </List>
  );
}

/**
 * Activity List Layout Component
 *
 * Renders the StandardListLayout with filter sidebar and PremiumDatagrid.
 */
const ActivityListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;

  if (!data?.length && !hasFilters) {
    return (
      <StandardListLayout resource="activities" filterComponent={<ActivityListFilter />}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No activities found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Activities will appear here as you log interactions with customers.
          </p>
        </div>
      </StandardListLayout>
    );
  }

  return (
    <>
      <StandardListLayout resource="activities" filterComponent={<ActivityListFilter />}>
        <PremiumDatagrid>
          {/* Activity Type Badge */}
          <FunctionField
            label="Type"
            sortBy="type"
            render={(record: ActivityRecord) => {
              const typeOption = INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === record.type);
              return (
                <Badge variant="outline" className="text-xs">
                  {typeOption?.label || record.type}
                </Badge>
              );
            }}
          />

          {/* Subject */}
          <TextField source="subject" label="Subject" />

          {/* Activity Date */}
          <DateField source="activity_date" label="Date" showTime={false} />

          {/* Sample Status - Only shown for sample activities - hidden on tablet */}
          <FunctionField
            label="Sample Status"
            render={(record: ActivityRecord) => {
              if (record.type !== "sample" || !record.sample_status) {
                return <span className="text-muted-foreground">—</span>;
              }
              return <SampleStatusBadge status={record.sample_status} readonly />;
            }}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Sentiment Badge - hidden on tablet */}
          <FunctionField
            label="Sentiment"
            render={(record: ActivityRecord) => {
              if (!record.sentiment) {
                return <span className="text-muted-foreground">—</span>;
              }
              const sentimentColors: Record<string, string> = {
                positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
                negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
              };
              return (
                <Badge className={sentimentColors[record.sentiment] || ""} variant="outline">
                  {record.sentiment.charAt(0).toUpperCase() + record.sentiment.slice(1)}
                </Badge>
              );
            }}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Organization Reference */}
          <ReferenceField
            source="organization_id"
            reference="organizations"
            label="Organization"
            link={false}
          >
            <TextField source="name" />
          </ReferenceField>

          {/* Opportunity Reference - hidden on tablet */}
          <ReferenceField
            source="opportunity_id"
            reference="opportunities"
            label="Opportunity"
            link={false}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          >
            <TextField source="name" />
          </ReferenceField>

          {/* Created By - hidden on tablet */}
          <ReferenceField
            source="created_by"
            reference="sales"
            label="Created By"
            link={false}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          >
            <SaleName />
          </ReferenceField>
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

/**
 * Activity List Actions Toolbar
 */
const ActivityListActions = () => (
  <TopToolbar>
    <ExportButton exporter={exporter} />
    <CreateButton label="Log Activity" />
  </TopToolbar>
);

/**
 * CSV Exporter for Activities
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
        console.error("Export error:", err);
        return;
      }
      downloadCSV(csv, "activities");
    }
  );
};
