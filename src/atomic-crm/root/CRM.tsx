import { Admin } from "@/components/admin/admin";
import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
import { SetPasswordPage } from "@/components/supabase/set-password-page";
import type { AuthProvider, DataProvider } from "ra-core";
import { CustomRoutes, localStorageStore, Resource } from "ra-core";
import { useEffect } from "react";
import { Route } from "react-router-dom";
import organizations from "../organizations";
import contacts from "../contacts";
import { Dashboard } from "../dashboard/Dashboard";
import opportunities from "../opportunities";
import products from "../products";
import notifications from "../notifications";
import { Layout } from "../layout/Layout";
import {
  authProvider as supabaseAuthProvider,
  dataProvider as supabaseDataProvider,
} from "../providers/supabase";
import sales from "../sales";
import { SettingsPage } from "../settings/SettingsPage";
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
        store={localStorageStore(undefined, "CRM")}
        layout={Layout}
        loginPage={StartPage}
        i18nProvider={i18nProvider}
        dashboard={Dashboard}
        requireAuth
        disableTelemetry
        {...rest}
      >
        <CustomRoutes noLayout>
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route
            path={ForgotPasswordPage.path}
            element={<ForgotPasswordPage />}
          />
        </CustomRoutes>

        <CustomRoutes>
          <Route path={SettingsPage.path} element={<SettingsPage />} />
        </CustomRoutes>
        <Resource name="opportunities" {...opportunities} />
        <Resource name="contacts" {...contacts} />
        <Resource name="organizations" {...organizations} />
        <Resource name="products" {...products} />
        <Resource name="contactNotes" />
        <Resource name="opportunityNotes" />
        <Resource name="tasks" />
        <Resource name="sales" {...sales} />
        <Resource name="tags" />
        <Resource name="segments" />
        <Resource name="notifications" {...notifications} />
      </Admin>
    </ConfigurationProvider>
  );
};
