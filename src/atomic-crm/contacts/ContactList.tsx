import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV, useGetIdentity, useListContext } from "ra-core";

import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SortButton } from "@/components/admin/sort-button";
import { Card } from "@/components/ui/card";
import type { Organization, Contact, Sale, Tag } from "../types";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { ContactEmpty } from "./ContactEmpty";
import { ContactImportButton } from "./ContactImportButton";
import { ContactListContent } from "./ContactListContent";
import { ContactListFilter } from "./ContactListFilter";
import { TopToolbar } from "../layout/TopToolbar";

export const ContactList = () => {
  const { identity } = useGetIdentity();

  // Clean up stale cached filters from localStorage
  // Generic hook validates all filters against filterRegistry.ts
  useFilterCleanup('contacts');

  if (!identity) return null;

  return (
    <List
      title={false}
      actions={<ContactListActions />}
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}
    >
      <ContactListLayout />
    </List>
  );
};

const ContactListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const { identity } = useGetIdentity();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!identity || isPending) return null;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <div className="flex flex-row gap-6">
      <ContactListFilter />
      <div className="flex-1 flex flex-col gap-4">
        <Card className="bg-card border border-border shadow-sm rounded-xl p-2">
          <ContactListContent />
        </Card>
      </div>
      <BulkActionsToolbar />
    </div>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    <ContactImportButton />
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
      records.flatMap(
        (contact) =>
          contact.organizations?.map((org) => org.organization_id) || [],
      ),
    ),
  );

  // Fetch organization names for all unique organization IDs
  const organizations =
    organizationIds.length > 0
      ? await fetchRelatedRecords<Organization>(
          organizationIds.map((id) => ({ id, organization_id: id })),
          "organization_id",
          "organizations",
        )
      : {};

  const contacts = records.map((contact) => {
    // Find the primary organization from the organizations array
    const primaryOrganization = contact.organizations?.find(
      (org) => org.is_primary,
    );

    const exportedContact = {
      ...contact,
      company: primaryOrganization?.organization_id
        ? organizations[primaryOrganization.organization_id]?.name
        : undefined,
      sales: `${sales[contact.sales_id].first_name} ${
        sales[contact.sales_id].last_name
      }`,
      tags: contact.tags.map((tagId) => tags[tagId].name).join(", "),
      email_work: contact.email?.find((email) => email.type === "Work")?.email,
      email_home: contact.email?.find((email) => email.type === "Home")?.email,
      email_other: contact.email?.find((email) => email.type === "Other")
        ?.email,
      email: JSON.stringify(contact.email),
      email_fts: undefined,
      phone_work: contact.phone?.find((phone) => phone.type === "Work")?.number,
      phone_home: contact.phone?.find((phone) => phone.type === "Home")?.number,
      phone_other: contact.phone?.find((phone) => phone.type === "Other")
        ?.number,
      phone: JSON.stringify(contact.phone),
      phone_fts: undefined,
      // New multi-organization fields
      department: contact.department || "",
      is_primary_contact: primaryOrganization ? "Yes" : "No",
      organizations: contact.organizations
        ? JSON.stringify(contact.organizations)
        : "[]",
      total_organizations: contact.organizations
        ? contact.organizations.length
        : 0,
    };
    delete exportedContact.email_fts;
    delete exportedContact.phone_fts;
    return exportedContact;
  });
  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};

export default ContactList;
