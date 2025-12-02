import * as Sentry from "@sentry/react";
import { CRM } from "@/atomic-crm/root/CRM";

/**
 * Application entry point
 *
 * Customize Atomic CRM by passing props to the CRM component:
 *  - contactGender
 *  - companySectors
 *  - darkTheme
 *  - opportunityCategories
 *  - opportunityStages (replaces deprecated dealStages/dealPipelineStatuses)
 *  - dealCategories (deprecated, use opportunityCategories)
 *  - dealPipelineStatuses (deprecated, use opportunityStages)
 *  - dealStages (deprecated, use opportunityStages)
 *  - opportunityCategories
 *  - opportunityStages
 *  - lightTheme
 *  - logo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by shadcn-admin-kit's <Admin> component.
 *
 * @example
 * const App = () => (
 *    <CRM
 *       logo="./img/logo.png"
 *       title="Acme CRM"
 *    />
 * );
 */
const App = () => (
  <Sentry.ErrorBoundary
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">We've been notified and are looking into it.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    }
    showDialog
  >
    <CRM
      lightModeLogo="/logos/mfb-logo.webp"
      darkModeLogo="/logos/mfb-logo.webp"
      title="MFB Master Food Brokers"
    />
  </Sentry.ErrorBoundary>
);

export default App;
