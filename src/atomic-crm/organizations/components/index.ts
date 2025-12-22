/**
 * Authorization Components - Barrel Export
 *
 * Components extracted from AuthorizationsTab.tsx for better modularity.
 */

// Types
export * from "./authorization-types";

// UI Components
export { AuthorizationsEmptyState } from "./AuthorizationsEmptyState";
export { AuthorizationCard } from "./AuthorizationCard";
export { ProductExceptionsSection } from "./ProductExceptionsSection";

// Dialogs
export { AddPrincipalDialog } from "./AddPrincipalDialog";
export { AddProductExceptionDialog } from "./AddProductExceptionDialog";
export { RemoveConfirmDialog } from "./RemoveConfirmDialog";
