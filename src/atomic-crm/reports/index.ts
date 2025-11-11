import * as React from "react";

const WeeklyActivitySummary = React.lazy(() => import("./WeeklyActivitySummary"));
const OpportunitiesByPrincipalReport = React.lazy(() => import("./OpportunitiesByPrincipalReport"));

export default {
  WeeklyActivitySummary,
  OpportunitiesByPrincipalReport,
};
