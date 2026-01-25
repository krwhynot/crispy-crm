/**
 * Sidebar Component - Barrel Export
 *
 * This file re-exports from the split module structure for backward compatibility.
 * Import from '@/components/ui/sidebar' (resolves to sidebar/index.tsx)
 *
 * Original file: sidebar.tsx (673 lines) - Split for maintainability
 *
 * Module structure:
 * - SidebarProvider.tsx: Main provider with context and keyboard shortcuts
 * - Sidebar.tsx: Main sidebar component with mobile/desktop variants
 * - SidebarLayout.tsx: Layout components (Header, Footer, Content, Inset, Input, Separator)
 * - SidebarGroup.tsx: Group components (Group, GroupLabel, GroupAction, GroupContent)
 * - SidebarMenu.tsx: Menu components (Menu, MenuItem, MenuButton, MenuAction, MenuBadge, MenuSkeleton, MenuSub, etc.)
 * - SidebarControls.tsx: Control components (Trigger, Rail)
 *
 * External dependencies (kept in parent directory):
 * - sidebar.constants.ts: Dimension and configuration constants
 * - sidebar.utils.ts: Context and useSidebar hook
 */

export { SidebarProvider } from "./SidebarProvider";
export { Sidebar } from "./Sidebar";
export {
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarInset,
  SidebarInput,
  SidebarSeparator,
} from "./SidebarLayout";
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./SidebarGroup";
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./SidebarMenu";
export { SidebarTrigger, SidebarRail } from "./SidebarControls";
