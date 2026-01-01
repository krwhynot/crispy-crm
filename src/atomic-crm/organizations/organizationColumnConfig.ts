/**
 * Organization Column Configuration
 *
 * Maps column header components for use in OrganizationList.
 * Separated from OrganizationDatagridHeader.tsx to satisfy react-refresh/only-export-components
 * lint rule (files with React components should only export components).
 */

import {
  OrganizationNameHeader,
  OrganizationTypeHeader,
  OrganizationPriorityHeader,
} from "./OrganizationDatagridHeader";

/**
 * All organization column headers exported for use in OrganizationList
 */
export const OrganizationColumnHeaders = {
  Name: OrganizationNameHeader,
  Type: OrganizationTypeHeader,
  Priority: OrganizationPriorityHeader,
};
