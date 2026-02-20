/**
 * OrganizationDatagridHeader
 *
 * Column headers for the Organizations datagrid with integrated filters.
 * Text and checkbox filters are embedded in column headers via FilterableColumnHeader.
 */

import { FilterableColumnHeader } from "@/components/ra-wrappers/column-filters";
import {
  ORGANIZATION_TYPE_CHOICES,
  PRIORITY_CHOICES,
  US_STATES,
  SEGMENT_CHOICES,
} from "./constants";

export function OrganizationNameHeader() {
  return <FilterableColumnHeader source="name" label="Organization Name" filterType="text" />;
}

export function OrganizationTypeHeader() {
  return (
    <FilterableColumnHeader
      source="organization_type"
      label="Type"
      filterType="checkbox"
      choices={[...ORGANIZATION_TYPE_CHOICES]}
    />
  );
}

export function OrganizationPriorityHeader() {
  return (
    <FilterableColumnHeader
      source="priority"
      label="Priority"
      filterType="checkbox"
      choices={[...PRIORITY_CHOICES]}
    />
  );
}

export function OrganizationStateHeader() {
  return (
    <FilterableColumnHeader
      source="state"
      label="State"
      filterType="checkbox"
      choices={[...US_STATES]}
    />
  );
}

export function OrganizationSegmentHeader() {
  return (
    <FilterableColumnHeader
      source="segment_id"
      label="Category"
      filterType="checkbox"
      choices={[...SEGMENT_CHOICES]}
    />
  );
}
