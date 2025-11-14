import * as React from "react";

const Dashboard = React.lazy(() => import("./Dashboard"));

// Compact Grid Dashboard
export { CompactGridDashboard } from './CompactGridDashboard';

// Principal Dashboard V2
export { PrincipalDashboardV2 } from './v2';

// Default export for dashboard (using V2 layout)
export { PrincipalDashboardV2 as default } from './v2';

// Legacy exports
export { Dashboard };
