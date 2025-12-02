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
import { FunctionField } from "react-admin";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { ContactListSkeleton } from "@/components/ui/list-skeleton";
import type { Organization, Contact, Sale, Tag } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ContactEmpty } from "./ContactEmpty";
import { ContactImportButton } from "./ContactImportButton";
import { ContactExportTemplateButton } from "./ContactExportTemplateButton";
import { ContactListFilter } from "./ContactListFilter";
import { ContactSlideOver } from "./ContactSlideOver";
import { TopToolbar } from "../layout/TopToolbar";
import { Avatar } from "./Avatar";
import { ContactStatusBadge } from "./ContactBadges";

export const ContactList = () => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup("contacts");

  if (isIdentityPending) {
    return <ContactListSkeleton />;
  }
  if (!identity) {
    return null;
  }

  return (
    <>
      <List
        title={false}
        actions={<ContactListActions />}
        perPage={25}
        sort={{ field: "last_seen", order: "DESC" }}
        exporter={exporter}
      >
        <ContactListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
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

  // Show skeleton during initial load (identity check happens in parent)
  if (isPending) {
    return (
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <ContactListSkeleton />
      </StandardListLayout>
    );
  }

  if (!data?.length && !hasFilters) {
    return <ContactEmpty />;
  }

  return (
    <>
      <StandardListLayout resource="contacts" filterComponent={<ContactListFilter />}>
        <PremiumDatagrid
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
        >
          {/* Column 1: Avatar - Visual identifier (non-sortable) - hidden on mobile */}
          <FunctionField
            label=""
            sortable={false}
            render={(record: Contact) => <Avatar record={record} width={40} height={40} />}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 2: Name - Primary identifier (sortable by first_name) - always visible */}
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

          {/* Column 3: Role - Merged Title + Department (sortable by title) - hidden on tablet */}
          <FunctionField
            label="Role"
            sortBy="title"
            render={(record: Contact) => {
              const title = record.title?.trim();
              const department = record.department?.trim();
              if (!title && !department) return "--";
              if (!title) return department;
              if (!department) return title;
              return `${title}, ${department}`;
            }}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 4: Organization - Relationship reference (sortable) - always visible */}
          <ReferenceField
            source="organization_id"
            reference="organizations"
            label="Organization"
            link={false}
            sortable
          >
            <TextField source="name" />
          </ReferenceField>

          {/* Column 5: Status - Badge-based indicator (non-sortable) - always visible */}
          <FunctionField
            label="Status"
            sortable={false}
            render={(record: Contact) => <ContactStatusBadge status={record.status} />}
          />

          {/* Column 6: Notes - Activity count metric (non-sortable) - hidden on tablet */}
          <FunctionField
            label="Notes"
            sortable={false}
            render={(record: Contact) => record.nb_notes ?? 0}
            textAlign="center"
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />

          {/* Column 7: Last Activity - Recency metric (sortable) - hidden on mobile */}
          <DateField
            source="last_seen"
            label="Last Activity"
            sortable
            showTime={false}
            cellClassName="hidden lg:table-cell"
            headerClassName="hidden lg:table-cell"
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    <ContactImportButton />
    <ContactExportTemplateButton />
    <ExportButton exporter={exporter} />
    <CreateButton />
  </TopToolbar>
);

const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");
  const organizations = await fetchRelatedRecords<Organization>(
    records,
    "organization_id",
    "organizations"
  );

  const contacts = records.map((contact) => {
    // Build the export object with canonical field names matching import expectations
    const exportedContact: Record<string, unknown> = {
      // Core identity fields
      first_name: contact.first_name,
      last_name: contact.last_name,
      gender: contact.gender,
      title: contact.title,

      // Organization fields - using canonical names from columnAliases.ts
      // Each contact has exactly one organization (organization_id is required per PRD)
      organization_name: contact.organization_id
        ? organizations[contact.organization_id]?.name
        : undefined,

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
      sales: contact.sales_id && sales[contact.sales_id]
        ? `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`
        : "",
      department: contact.department || "",

      // ID fields for reference
      id: contact.id,
      sales_id: contact.sales_id,
      organization_id: contact.organization_id,
    };

    return exportedContact;
  });

  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};

export default ContactList;
