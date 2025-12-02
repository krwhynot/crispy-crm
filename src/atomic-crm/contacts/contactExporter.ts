/**
 * CSV Exporter for Contact records
 */
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Contact, Sale, Tag, Organization } from "../types";

export interface ContactExportRow {
  first_name: string | undefined;
  last_name: string | undefined;
  gender: string | undefined;
  title: string | undefined;
  organization_name: string | undefined;
  email_work: string | undefined;
  email_home: string | undefined;
  email_other: string | undefined;
  phone_work: string | undefined;
  phone_home: string | undefined;
  phone_other: string | undefined;
  avatar: string | undefined;
  first_seen: string | undefined;
  last_seen: string | undefined;
  tags: string;
  linkedin_url: string | null | undefined;
  sales: string;
  department: string;
  id: number | string;
  sales_id: number | string | null | undefined;
  organization_id: number | string | null | undefined;
}

export const contactExporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");
  const organizations = await fetchRelatedRecords<Organization>(
    records,
    "organization_id",
    "organizations"
  );

  const contacts: ContactExportRow[] = records.map((contact) => ({
    first_name: contact.first_name,
    last_name: contact.last_name,
    gender: contact.gender,
    title: contact.title,
    organization_name: contact.organization_id
      ? organizations[contact.organization_id]?.name
      : undefined,
    email_work: contact.email?.find((e) => e.type === "Work")?.email,
    email_home: contact.email?.find((e) => e.type === "Home")?.email,
    email_other: contact.email?.find((e) => e.type === "Other")?.email,
    phone_work: contact.phone?.find((p) => p.type === "Work")?.number,
    phone_home: contact.phone?.find((p) => p.type === "Home")?.number,
    phone_other: contact.phone?.find((p) => p.type === "Other")?.number,
    avatar: contact.avatar,
    first_seen: contact.first_seen,
    last_seen: contact.last_seen,
    tags: contact.tags
      .map((tagId) => tags[tagId]?.name)
      .filter(Boolean)
      .join(", "),
    linkedin_url: contact.linkedin_url,
    sales:
      contact.sales_id && sales[contact.sales_id]
        ? `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`
        : "",
    department: contact.department || "",
    id: contact.id,
    sales_id: contact.sales_id,
    organization_id: contact.organization_id,
  }));

  return jsonExport(contacts, {}, (err: Error | null, csv: string) => {
    if (err) {
      console.error("CSV export failed:", err);
      return;
    }
    downloadCSV(csv, "contacts");
  });
};
