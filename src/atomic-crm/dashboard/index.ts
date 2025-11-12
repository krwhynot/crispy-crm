import * as React from "react";

const Dashboard = React.lazy(() => import("./Dashboard"));

// Compact Grid Dashboard
export { CompactGridDashboard } from './CompactGridDashboard';

// Default export for dashboard (using compact layout)
export { CompactGridDashboard as default } from './CompactGridDashboard';

// Legacy export
export { Dashboard };
