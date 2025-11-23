/**
 * Mock data for Reports Overview E2E tests
 *
 * These mocks match the data structures returned by the OverviewTab component's
 * useGetList calls to Supabase.
 */

// KPI data mock
export const mockKpiData = {
  totalOpportunities: 15,
  weekActivities: 42,
  staleLeads: 3,
  activityChange: 12,
  activityTrend: "up",
  opportunityChange: 5,
  opportunityTrend: "up",
};

// Pipeline by stage data mock
export const mockPipelineData = [
  { stage: "Lead", count: 5 },
  { stage: "Qualified", count: 4 },
  { stage: "Proposal", count: 3 },
  { stage: "Negotiation", count: 2 },
  { stage: "Closed Won", count: 1 },
];

// Activity trend data mock (last 14 days)
export const mockActivityTrendData = [
  { date: "Nov 9", count: 3 },
  { date: "Nov 10", count: 5 },
  { date: "Nov 11", count: 2 },
  { date: "Nov 12", count: 7 },
  { date: "Nov 13", count: 4 },
  { date: "Nov 14", count: 6 },
  { date: "Nov 15", count: 3 },
  { date: "Nov 16", count: 8 },
  { date: "Nov 17", count: 5 },
  { date: "Nov 18", count: 4 },
  { date: "Nov 19", count: 6 },
  { date: "Nov 20", count: 3 },
  { date: "Nov 21", count: 5 },
  { date: "Nov 22", count: 4 },
];

// Top principals data mock
export const mockTopPrincipalsData = [
  { name: "Acme Corp", count: 8 },
  { name: "Global Foods", count: 6 },
  { name: "Metro Distributors", count: 5 },
  { name: "Fresh Supply Co", count: 4 },
  { name: "Regional Brands", count: 3 },
];

// Rep performance data mock
export const mockRepPerformanceData = [
  { name: "John Smith", activities: 25, opportunities: 8 },
  { name: "Jane Doe", activities: 22, opportunities: 6 },
  { name: "Bob Wilson", activities: 18, opportunities: 5 },
  { name: "Alice Brown", activities: 15, opportunities: 4 },
  { name: "Charlie Davis", activities: 12, opportunities: 3 },
];

// Mock opportunities list (for useGetList("opportunities"))
export const mockOpportunities = [
  {
    id: 1,
    name: "Enterprise Deal",
    stage: "Lead",
    opportunity_owner_id: 1,
    principal_organization_id: 1,
    principal_organization_name: "Acme Corp",
    last_activity_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: 2,
    name: "Mid-Market Opportunity",
    stage: "Qualified",
    opportunity_owner_id: 2,
    principal_organization_id: 2,
    principal_organization_name: "Global Foods",
    last_activity_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    deleted_at: null,
  },
  {
    id: 3,
    name: "SMB Lead",
    stage: "Lead",
    opportunity_owner_id: 1,
    principal_organization_id: 3,
    principal_organization_name: "Metro Distributors",
    last_activity_at: null, // Stale - no activity
    deleted_at: null,
  },
];

// Mock activities list (for useGetList("activities"))
export const mockActivities = [
  {
    id: 1,
    type: "Call",
    created_at: new Date().toISOString(),
    created_by: 1,
  },
  {
    id: 2,
    type: "Email",
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_by: 2,
  },
  {
    id: 3,
    type: "Meeting",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_by: 1,
  },
];

// Mock sales reps list (for useGetList("sales"))
export const mockSalesReps = [
  { id: 1, first_name: "John", last_name: "Smith" },
  { id: 2, first_name: "Jane", last_name: "Doe" },
  { id: 3, first_name: "Bob", last_name: "Wilson" },
];
