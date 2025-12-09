// Re-export resource config as default for CRM.tsx
// eslint-disable-next-line react-refresh/only-export-components -- Default export is React Admin resource config
export { default } from "./resource";
// Named exports for direct component imports
export { OpportunityListView, OpportunityCreateView, OpportunityEditView } from "./resource";
