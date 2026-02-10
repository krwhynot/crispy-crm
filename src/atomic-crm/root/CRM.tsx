import { Admin } from "@/components/ra-wrappers/admin";
import { QueryClient } from "@tanstack/react-query";
import type { AuthProvider, DataProvider } from "ra-core";
import { CustomRoutes, localStorageStore, Resource } from "ra-core";
import React, { Suspense, useEffect } from "react";
import { Navigate, Route, useParams } from "react-router-dom";
import { AuthSkeleton } from "@/components/supabase/auth-skeleton";
import { ROUTES } from "@/constants/routes";
// Import from resource.tsx directly to avoid bundling all barrel exports
// This leverages the existing lazy loading in each resource.tsx file
import organizations from "../organizations/resource";
import contacts from "../contacts/resource";
import { DashboardErrorBoundary, PrincipalDashboardV3 } from "../dashboard";
import opportunities from "../opportunities/resource";
import products from "../products/resource";
import productDistributors from "../productDistributors/productDistributorsConfig";
import tasks from "../tasks/resource";
import notifications from "../notifications/resource";
import activities from "../activities/resource";
import tags from "../tags/resource";
import { Layout } from "../layout/Layout";
import {
  authProvider as supabaseAuthProvider,
  dataProvider as supabaseDataProvider,
} from "../providers/supabase";
import sales from "../sales/resource";
import type { ConfigurationContextValue } from "./ConfigurationContext";
import { ConfigurationProvider } from "./ConfigurationContext";
import {
  defaultContactGender,
  defaultDarkModeLogo,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultOpportunityCategories,
  defaultOpportunityStages,
  defaultTaskTypes,
  defaultTitle,
} from "./defaultConfiguration";
import { i18nProvider } from "./i18nProvider";
import { StartPage } from "@/atomic-crm/login/StartPage.tsx";
import { RESOURCES } from "../../constants/resources";

// Lazy load ReportsPage
const ReportsPage = React.lazy(() => import("../reports/ReportsPage"));

// Lazy load HealthDashboard (admin only)
const HealthDashboard = React.lazy(() => import("../admin/HealthDashboard"));

// Lazy load Settings and Auth pages
const SettingsPage = React.lazy(() =>
  import("../settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const SetPasswordPage = React.lazy(() =>
  import("@/components/supabase/set-password-page").then((m) => ({
    default: m.SetPasswordPage,
  }))
);
const ForgotPasswordPage = React.lazy(() =>
  import("@/components/supabase/forgot-password-page").then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);

// Redirect component for /admin/users/:id to /sales?view=:id (consolidation)
const AdminUserRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/sales?view=${id}`} replace />;
};

// Redirect component for legacy /contacts/:id/show URLs
const ContactShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/contacts?view=${id}`} replace />;
};

// Redirect component for legacy /tasks/:id/show URLs
const TaskShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/tasks?view=${id}`} replace />;
};

// Redirect component for legacy /products/:id/show URLs
const ProductShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/products?view=${id}`} replace />;
};

// Redirect component for legacy /organizations/:id/show URLs
const OrganizationShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/organizations?view=${id}`} replace />;
};

// Redirect component for legacy /opportunities/:id/show URLs
const OpportunityShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/opportunities?view=${id}`} replace />;
};

// Redirect component for /opportunities/kanban URL
// Intercepts before :id wildcard catches "kanban" as an ID
const OpportunityKanbanRedirect = () => {
  return <Navigate to="/opportunities?view=kanban" replace />;
};

// Configure QueryClient with appropriate stale times for CRM data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - CRM data changes frequently
      refetchOnWindowFocus: false, // Prevent API storms on tab switch (STALE_STATE_STRATEGY.md)
    },
  },
});

export interface CRMProps extends Partial<ConfigurationContextValue> {
  dataProvider?: DataProvider;
  authProvider?: AuthProvider;
  disableTelemetry?: boolean;
}

/**
 * CRM Component
 *
 * This component sets up and renders the main CRM application using `ra-core`. It provides
 * default configurations and themes but allows for customization through props. The component
 * wraps the application with a `ConfigurationProvider` to provide configuration values via context.
 *
 * @param {Array<ContactGender>} contactGender - The gender options for contacts used in the application.
 * @param {RaThemeOptions} darkTheme - The theme to use when the application is in dark mode.
 * @param {string[]} opportunityCategories - The categories of opportunities used in the application.
 * @param {OpportunityStage[]} opportunityStages - The stages of opportunities used in the application.
 * @param {string[]} opportunityCategories - The categories of opportunities used in the application.
 * @param {OpportunityStage[]} opportunityStages - The stages of opportunities used in the application.
 * @param {RaThemeOptions} lightTheme - The theme to use when the application is in light mode.
 * @param {string} logo - The logo used in the CRM application.
 * @param {NoteStatus[]} noteStatuses - The statuses of notes used in the application.
 * @param {string[]} taskTypes - The types of tasks used in the application.
 * @param {string} title - The title of the CRM application.
 *
 * @returns {JSX.Element} The rendered CRM application.
 *
 * @example
 * // Basic usage of the CRM component
 * import { CRM } from './CRM';
 *
 * const App = () => (
 *     <CRM
 *         logo="/path/to/logo.png"
 *         title="My Custom CRM"
 *         lightTheme={{
 *             ...defaultTheme,
 *             palette: {
 *                 primary: { main: 'var(--primary)' },
 *             },
 *         }}
 *     />
 * );
 *
 * export default App;
 */
export const CRM = ({
  contactGender = defaultContactGender,
  opportunityCategories = defaultOpportunityCategories,
  opportunityStages = defaultOpportunityStages,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  dataProvider = supabaseDataProvider,
  authProvider = supabaseAuthProvider,
  disableTelemetry,
  ...rest
}: CRMProps) => {
  useEffect(() => {
    if (
      disableTelemetry ||
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      typeof window.location === "undefined" ||
      typeof Image === "undefined"
    ) {
      return;
    }
    const img = new Image();
    img.src = `https://atomic-crm-telemetry.marmelab.com/atomic-crm-telemetry?domain=${window.location.hostname}`;
  }, [disableTelemetry]);

  return (
    <ConfigurationProvider
      contactGender={contactGender}
      opportunityCategories={opportunityCategories}
      opportunityStages={opportunityStages}
      darkModeLogo={darkModeLogo}
      lightModeLogo={lightModeLogo}
      noteStatuses={noteStatuses}
      taskTypes={taskTypes}
      title={title}
    >
      <Admin
        dataProvider={dataProvider}
        authProvider={authProvider}
        queryClient={queryClient}
        store={localStorageStore("2", "CRM")} // Version 2: Invalidates stale filters (fixes full_name column error)
        layout={Layout}
        loginPage={StartPage}
        i18nProvider={i18nProvider}
        dashboard={() => (
          <DashboardErrorBoundary>
            <PrincipalDashboardV3 />
          </DashboardErrorBoundary>
        )}
        requireAuth
        disableTelemetry
        {...rest}
      >
        <CustomRoutes noLayout>
          <Route
            path={ROUTES.SET_PASSWORD}
            element={
              <Suspense fallback={<AuthSkeleton />}>
                <SetPasswordPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <Suspense fallback={<AuthSkeleton />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
        </CustomRoutes>

        <CustomRoutes>
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin/health" element={<HealthDashboard />} />
          {/* CONSOLIDATED: /admin/users now redirects to /sales */}
          <Route path="/admin/users" element={<Navigate to="/sales" replace />} />
          <Route path="/admin/users/:id" element={<AdminUserRedirect />} />
          {/* View-specific routes (must come before :id wildcards) */}
          <Route path="/opportunities/kanban" element={<OpportunityKanbanRedirect />} />
          {/* Legacy redirects */}
          <Route path="/contacts/:id/show" element={<ContactShowRedirect />} />
          <Route path="/tasks/:id/show" element={<TaskShowRedirect />} />
          <Route path="/products/:id/show" element={<ProductShowRedirect />} />
          <Route path="/organizations/:id/show" element={<OrganizationShowRedirect />} />
          <Route path="/opportunities/:id/show" element={<OpportunityShowRedirect />} />
          {/* Activities create redirects to list - use QuickLogActivityDialog instead */}
          <Route path="/activities/create" element={<Navigate to="/activities" replace />} />
        </CustomRoutes>
        <Resource name={RESOURCES.OPPORTUNITIES} {...opportunities} />
        <Resource name={RESOURCES.CONTACTS} {...contacts} />
        <Resource name={RESOURCES.ORGANIZATIONS} {...organizations} />
        <Resource name={RESOURCES.PRODUCTS} {...products} />
        <Resource name={RESOURCES.PRODUCT_DISTRIBUTORS} {...productDistributors} />
        <Resource name={RESOURCES.TASKS} {...tasks} />
        <Resource name={RESOURCES.ACTIVITIES} {...activities} />
        <Resource name={RESOURCES.CONTACT_NOTES} />
        <Resource name={RESOURCES.OPPORTUNITY_NOTES} />
        <Resource name={RESOURCES.ORGANIZATION_NOTES} />
        <Resource name={RESOURCES.SALES} {...sales} />
        <Resource name={RESOURCES.TAGS} {...tags} />
        <Resource name={RESOURCES.SEGMENTS} />
        <Resource name={RESOURCES.NOTIFICATIONS} {...notifications} />
      </Admin>
    </ConfigurationProvider>
  );
};
