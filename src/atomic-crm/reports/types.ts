/**
 * Shared type definitions for the Reports module
 * Consolidates duplicated interfaces from multiple files
 */

/**
 * Sales representative information
 * Used in: GlobalFilterBar, OverviewTab, CampaignActivityReport
 */
export interface Sale {
  id: number;
  first_name: string;
  last_name: string;
}

/**
 * Activity record for reporting
 * Used in: ActivityTypeCard, CampaignActivityReport
 */
export interface Activity {
  id: number;
  type: string;
  subject: string;
  created_at: string;
  created_by: number;
  organization_id: number;
  contact_id: number | null;
  opportunity_id?: number | null;
  organization_name?: string;
  contact_name?: string;
}

/**
 * Grouped activities by type for visualization
 * Used in: ActivityTypeCard, CampaignActivityReport
 */
export interface ActivityGroup {
  type: string;
  activities: Activity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage?: number;
  mostActiveOrg?: string;
}
