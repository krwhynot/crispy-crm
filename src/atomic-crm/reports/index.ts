import * as React from "react";

const WeeklyActivitySummary = React.lazy(() => import("./WeeklyActivitySummary"));
const OpportunitiesByPrincipalReport = React.lazy(() => import("./OpportunitiesByPrincipalReport"));
const CampaignActivityReport = React.lazy(
  () => import("./CampaignActivity/CampaignActivityReport")
);

export default {
  WeeklyActivitySummary,
  OpportunitiesByPrincipalReport,
  CampaignActivityReport,
};
