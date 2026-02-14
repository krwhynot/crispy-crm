/**
 * CSV Exporter for Opportunity records
 *
 * Exports opportunities with related organization names and owner information.
 * Follows the same patterns as contactExporter.ts
 */
import jsonExport from "jsonexport/dist";
import type { Exporter } from "ra-core";
import { downloadCSV } from "ra-core";
import type { Opportunity, Organization, Sale } from "../types";
import { formatSalesName } from "../utils";
import { getOpportunityStageLabel } from "./constants";

/**
 * Sanitize value for CSV export to prevent formula injection
 * @see docs/decisions/file-handling-best-practices.md
 */
const sanitizeForCSV = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const formulaTriggers = ["=", "-", "+", "@", "\t", "\r"];
  if (formulaTriggers.some((char) => str.startsWith(char))) {
    return `\t${str}`;
  }
  return str;
};

export interface OpportunityExportRow {
  id: number | string;
  name: string;
  stage: string;
  status: string;
  priority: string;
  customer_name: string | undefined;
  principal_name: string | undefined;
  distributor_name: string | undefined;
  primary_account_manager: string;
  secondary_account_manager: string;
  lead_source: string | undefined;
  estimated_close_date: string;
  actual_close_date: string | undefined;
  campaign: string | undefined;
  competition: string | undefined;
  decision_criteria: string | undefined;
  next_action: string | undefined;
  next_action_date: string | undefined;
  tags: string;
  description: string;
  notes: string | undefined;
  nb_interactions: number | undefined;
  last_interaction_date: string | undefined;
  days_in_stage: number | undefined;
  created_at: string;
  stage_changed_at: string | undefined;
}

export const opportunityExporter: Exporter<Opportunity> = async (records, fetchRelatedRecords) => {
  // Fetch related records for display names
  const sales = await fetchRelatedRecords<Sale>(records, "opportunity_owner_id", "sales");
  const accountManagers = await fetchRelatedRecords<Sale>(records, "account_manager_id", "sales");
  const customers = await fetchRelatedRecords<Organization>(
    records,
    "customer_organization_id",
    "organizations"
  );
  const principals = await fetchRelatedRecords<Organization>(
    records,
    "principal_organization_id",
    "organizations"
  );
  const distributors = await fetchRelatedRecords<Organization>(
    records,
    "distributor_organization_id",
    "organizations"
  );

  const opportunities: OpportunityExportRow[] = records.map((opp) => ({
    id: opp.id,
    name: opp.name,
    stage: getOpportunityStageLabel(opp.stage),
    status: opp.status,
    priority: opp.priority,
    customer_name: opp.customer_organization_id
      ? customers[opp.customer_organization_id]?.name
      : undefined,
    principal_name: opp.principal_organization_id
      ? principals[opp.principal_organization_id]?.name
      : undefined,
    distributor_name: opp.distributor_organization_id
      ? distributors[opp.distributor_organization_id]?.name
      : undefined,
    primary_account_manager: formatSalesName(
      opp.opportunity_owner_id ? sales[opp.opportunity_owner_id] : null
    ),
    secondary_account_manager: formatSalesName(
      opp.account_manager_id ? accountManagers[opp.account_manager_id] : null
    ),
    lead_source: opp.lead_source,
    estimated_close_date: opp.estimated_close_date,
    actual_close_date: opp.actual_close_date,
    campaign: opp.campaign,
    competition: opp.competition,
    decision_criteria: opp.decision_criteria,
    next_action: opp.next_action,
    next_action_date: opp.next_action_date,
    tags: opp.tags?.join(", ") ?? "",
    description: opp.description,
    notes: opp.notes,
    nb_interactions: opp.nb_interactions,
    last_interaction_date: opp.last_interaction_date,
    days_in_stage: opp.days_in_stage,
    created_at: opp.created_at,
    stage_changed_at: opp.stage_changed_at,
  }));

  const safeOpportunities = opportunities.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeForCSV(value)]))
  );

  return jsonExport(
    safeOpportunities,
    {
      rowDelimiter: ",",
      endOfLine: "\r\n",
    },
    (err: Error | null, csv: string) => {
      if (err) {
        throw new Error(`CSV export failed: ${err.message}`);
      }
      downloadCSV(csv, "opportunities");
    }
  );
};
