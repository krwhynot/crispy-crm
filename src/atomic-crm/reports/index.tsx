import * as React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const WeeklyActivitySummaryLazy = React.lazy(() => import("./WeeklyActivitySummary"));
const OpportunitiesByPrincipalReportLazy = React.lazy(
  () => import("./OpportunitiesByPrincipalReport")
);
const CampaignActivityReportLazy = React.lazy(
  () => import("./CampaignActivity/CampaignActivityReport")
);

const WeeklyActivitySummary = () => (
  <ErrorBoundary feature="reports">
    <WeeklyActivitySummaryLazy />
  </ErrorBoundary>
);

const OpportunitiesByPrincipalReport = () => (
  <ErrorBoundary feature="reports">
    <OpportunitiesByPrincipalReportLazy />
  </ErrorBoundary>
);

const CampaignActivityReport = () => (
  <ErrorBoundary feature="reports">
    <CampaignActivityReportLazy />
  </ErrorBoundary>
);

export default {
  WeeklyActivitySummary,
  OpportunitiesByPrincipalReport,
  CampaignActivityReport,
};
