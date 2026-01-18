/**
 * Hooks barrel export
 * Provides centralized access to all custom hooks
 */

// RBAC
export { useUserRole } from "./useUserRole";
export type { UserRole, UserIdentity } from "./useUserRole";
export { usePermissions } from "./usePermissions";
export type { PermissionAction, PermissionResource, UsePermissionsReturn } from "./usePermissions";
export { useTeamMembers } from "./useTeamMembers";
export type { TeamMember, UseTeamMembersReturn } from "./useTeamMembers";

// UI State
export { useSlideOverState } from "./useSlideOverState";
export { useKeyboardShortcuts, formatShortcut } from "./useKeyboardShortcuts";
export { useListKeyboardNavigation } from "./useListKeyboardNavigation";
export { useIsMobile } from "./use-mobile";

// Responsive Breakpoints
export {
  useBreakpoint,
  useIsDesktop,
  useIsLaptopOrLarger,
  useIsMobileOrTablet,
} from "./useBreakpoint";
export type { Breakpoint } from "./useBreakpoint";

// Form Utilities
export { useCityStateMapping } from "./useCityStateMapping";
export { useInAppUnsavedChanges } from "./useInAppUnsavedChanges";

// Dialog Utilities
export { useDialogError, parseServerError } from "./useDialogError";

// Favorites
export { useFavorites } from "./useFavorites";
export type { UseFavoritesReturn } from "./useFavorites";

// Organization Hierarchy
export { useOrganizationDescendants } from "./useOrganizationDescendants";
export type { UseOrganizationDescendantsReturn } from "./useOrganizationDescendants";
