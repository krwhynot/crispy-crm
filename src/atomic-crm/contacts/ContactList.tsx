import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext } from "ra-core";

import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SortButton } from "@/components/admin/sort-button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TextField } from "@/components/admin/text-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { EditButton } from "@/components/admin/edit-button";
import { FunctionField } from "react-admin";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import type { Organization, Contact, Sale, Tag } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ContactEmpty } from "./ContactEmpty";
import { ContactImportButton as _ContactImportButton } from "./ContactImportButton";
import { ContactExportTemplateButton as _ContactExportTemplateButton } from "./ContactExportTemplateButton";
import { ContactListFilter } from "./ContactListFilter";
import { ContactSlideOver } from "./ContactSlideOver";
import { TopToolbar } from "../layout/TopToolbar";
import { Avatar } from "./Avatar";
import { TagsList } from "./TagsList";
import { Status } from "../shared/components/Status";

export const ContactList = () => {
  const { identity } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup("contacts");

  if (!identity) return null;

  return (
    <>
      <List
        title={false}
        actions={<ContactListActions />}
        perPage={25}
        sort={{ field: "last_seen", order: "DESC" }}
        exporter={exporter}
      >
        <ContactListLayout openSlideOver={openSlideOver} />
        <FloatingCreateButton />
      </List>
      <ContactSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
};

const ContactListLayout = ({
  openSlideOver,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
}) => {
  const { data, isPending, filterValues } = useListContext();
  const { identity } = useGetIdentity();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!identity || isPending) return null;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <>
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <PremiumDatagrid onRowClick={(id) => openSlideOver(Number(id), "view")}>
          {/* Avatar Column - Non-sortable */}
          <FunctionField
            label=""
            sortable={false}
            render={(record: Contact) => <Avatar record={record} width={40} height={40} />}
          />

          {/* Name Column - Sortable */}
          <FunctionField
            label="Name"
            sortBy="first_name"
            render={(record: Contact) => {
              const firstName = record.first_name?.trim();
              const lastName = record.last_name?.trim();
              if (!firstName && !lastName) return "--";
              if (!firstName) return lastName;
              if (!lastName) return firstName;
              return `${firstName} ${lastName}`;
            }}
          />

          {/* Title Column - Sortable */}
          <TextField source="title" label="Title" sortable />

          {/* Department Column - Sortable */}
          <TextField source="department" label="Department" sortable />

          {/* Organization Column - Sortable */}
          <ReferenceField
            source="organization_id"
            reference="organizations"
            label="Organization"
            link={false}
            sortable
          >
            <TextField source="name" />
          </ReferenceField>

          {/* Tags Column - Non-sortable */}
          <FunctionField label="Tags" sortable={false} render={() => <TagsList />} />

          {/* Last Activity Column - Sortable */}
          <DateField source="last_seen" label="Last Activity" sortable showTime={false} />

          {/* Status Column - Non-sortable */}
          <FunctionField
            label="Status"
            sortable={false}
            render={(record: Contact) => <Status status={record.status} />}
          />

          {/* Actions Column - Non-sortable */}
          <FunctionField label="Actions" sortable={false} render={() => <EditButton />} />
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    {/* <ContactImportButton /> */}
    {/* <ContactExportTemplateButton /> */}
    <ExportButton exporter={exporter} />
    <CreateButton />
  </TopToolbar>
);

const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");

  // Collect all organization IDs from all contacts' organizations arrays
  const organizationIds = Array.from(
    new Set(
      records.flatMap((contact) => contact.organizations?.map((org) => org.organization_id) || [])
    )
  );

  // Fetch organization names for all unique organization IDs
  const organizations =
    organizationIds.length > 0
      ? await fetchRelatedRecords<Organization>(
          organizationIds.map((id) => ({ id, organization_id: id })),
          "organization_id",
          "organizations"
        )
      : {};

  const contacts = records.map((contact) => {
    // Find the primary organization from the organizations array
    const primaryOrganization = contact.organizations?.find((org) => org.is_primary);

    // Build the export object with canonical field names matching import expectations
    const exportedContact: any = {
      // Core identity fields
      first_name: contact.first_name,
      last_name: contact.last_name,
      gender: contact.gender,
      title: contact.title,

      // Organization fields - using canonical names from columnAliases.ts
      organization_name: primaryOrganization?.organization_id
        ? organizations[primaryOrganization.organization_id]?.name
        : undefined,
      organization_role: primaryOrganization?.job_title || undefined,

      // Email fields - flattened for import compatibility
      email_work: contact.email?.find((email) => email.type === "Work")?.email,
      email_home: contact.email?.find((email) => email.type === "Home")?.email,
      email_other: contact.email?.find((email) => email.type === "Other")?.email,

      // Phone fields - flattened for import compatibility
      phone_work: contact.phone?.find((phone) => phone.type === "Work")?.number,
      phone_home: contact.phone?.find((phone) => phone.type === "Home")?.number,
      phone_other: contact.phone?.find((phone) => phone.type === "Other")?.number,

      // Other standard fields
      avatar: contact.avatar,
      first_seen: contact.first_seen,
      last_seen: contact.last_seen,
      tags: contact.tags.map((tagId) => tags[tagId].name).join(", "),
      linkedin_url: contact.linkedin_url,

      // Additional fields that may be useful but aren't in import schema
      sales: `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`,
      department: contact.department || "",
      is_primary_contact: primaryOrganization ? "Yes" : "No",
      total_organizations: contact.organizations?.length || 0,

      // ID fields for reference
      id: contact.id,
      sales_id: contact.sales_id,
    };

    return exportedContact;
  });

  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};

export default ContactList;
