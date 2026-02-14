/**
 * CSV Exporter for Contact records
 */
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Contact, Sale, Tag, Organization } from "../types";
import { flattenEmailsForExport, flattenPhonesForExport } from "../utils/exportHelpers";
import { formatSalesName, formatTagsForExport } from "../utils/formatters";

/**
 * Sanitize value for CSV export to prevent formula injection
 * @see docs/decisions/file-handling-best-practices.md
 */
const sanitizeForCSV = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const formulaTriggers = ["=", "-", "+", "@", "\t", "\r"];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    return `\t${str}`; // Tab prefix neutralizes formulas
  }
  return str;
};

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
  primary_sales: string;
  secondary_sales: string;
  department: string;
  id: number | string;
  sales_id: number | string | null | undefined;
  organization_id: number | string | null | undefined;
}

export const contactExporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const secondarySales = await fetchRelatedRecords<Sale>(records, "secondary_sales_id", "sales");
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
    ...flattenEmailsForExport(contact.email),
    ...flattenPhonesForExport(contact.phone),
    avatar: contact.avatar,
    first_seen: contact.first_seen,
    last_seen: contact.last_seen,
    tags: formatTagsForExport(contact.tags, tags),
    linkedin_url: contact.linkedin_url,
    primary_sales: formatSalesName(contact.sales_id ? sales[contact.sales_id] : null),
    secondary_sales: formatSalesName(
      contact.secondary_sales_id ? secondarySales[contact.secondary_sales_id] : null
    ),
    department: contact.department || "",
    id: contact.id,
    sales_id: contact.sales_id,
    organization_id: contact.organization_id,
  }));

  const safeContacts = contacts.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeForCSV(value)]))
  );

  return jsonExport(
    safeContacts,
    {
      rowDelimiter: ",",
      endOfLine: "\r\n", // Windows/Excel compatibility
    },
    (err: Error | null, csv: string) => {
      if (err) {
        throw new Error(`CSV export failed: ${err.message}`);
      }
      downloadCSV(csv, "contacts");
    }
  );
};
