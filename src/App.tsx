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
const App = () => <CRM />;

export default App;
