/**
 * Hooks barrel export
 * Provides centralized access to all custom hooks
 */

// RBAC
export { useUserRole } from "./useUserRole";
export type { UserRole, UserIdentity } from "./useUserRole";

// UI State
export { useSlideOverState } from "./useSlideOverState";
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export { useIsMobile } from "./use-mobile";
