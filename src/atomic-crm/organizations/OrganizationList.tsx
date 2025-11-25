import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity } from "ra-core";
import { TextField, ReferenceField, FunctionField } from "react-admin";
import { List } from "@/components/admin/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { OrganizationListFilter } from "./OrganizationListFilter";
import { OrganizationSlideOver } from "./OrganizationSlideOver";
import { OrganizationTypeBadge, PriorityBadge } from "./OrganizationBadges";
import { TopToolbar } from "../layout/TopToolbar";
import type { Organization, Sale, Segment } from "../types";

const OrganizationListActions = () => (
  <TopToolbar>
    <SortButton fields={["name", "organization_type", "priority"]} />
    <ExportButton exporter={exporter} />
    <CreateButton />
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
    const exportedOrg: any = {
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
      zipcode: org.zipcode,
      country: org.country,

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

  return jsonExport(organizations, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "organizations");
  });
};

export const OrganizationList = () => {
  const { identity } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup("organizations");

  if (!identity) return null;

  return (
    <>
      <List
        title={false}
        actions={<OrganizationListActions />}
        perPage={25}
        sort={{ field: "name", order: "ASC" }}
        exporter={exporter}
      >
        <StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
          <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), "view")}>
            <TextField source="name" label="Organization Name" />

            <FunctionField
              label="Type"
              render={(record: any) => <OrganizationTypeBadge type={record.organization_type} />}
            />

            <FunctionField
              label="Priority"
              render={(record: any) => <PriorityBadge priority={record.priority} />}
            />

            <ReferenceField
              source="parent_organization_id"
              reference="organizations"
              label="Parent"
              link={false}
              emptyText="-"
            >
              <TextField source="name" />
            </ReferenceField>

            <FunctionField
              label="Contacts"
              render={(record: any) => record.nb_contacts || 0}
              textAlign="center"
            />

            <FunctionField
              label="Opportunities"
              render={(record: any) => record.nb_opportunities || 0}
              textAlign="center"
            />
          </PremiumDatagrid>
        </StandardListLayout>
        <FloatingCreateButton />
      </List>
      <OrganizationSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
};

export default OrganizationList;
