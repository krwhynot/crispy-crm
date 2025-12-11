import { UserIcon, ShieldCheckIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { SalesProfileTab } from "./SalesProfileTab";
import { SalesPermissionsTab } from "./SalesPermissionsTab";
import type { Sale } from "../types";

interface SalesSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

/**
 * SalesSlideOver - Slide-over panel for viewing and editing sales users
 *
 * Features:
 * - Profile tab: Name, Email, Phone, Avatar
 * - Permissions tab: Role, Administrator toggle, Disabled status
 * - View/Edit mode toggle
 * - URL synchronization
 * - ESC key to close
 *
 * Design:
 * - 40vw width (480-720px)
 * - Slide-in from right
 * - Two tabs with icons
 */
export function SalesSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: SalesSlideOverProps) {
  // Tab configuration
  const tabs: TabConfig[] = [
    {
      key: "profile",
      label: "Profile",
      component: SalesProfileTab,
      icon: UserIcon,
    },
    {
      key: "permissions",
      label: "Permissions",
      component: SalesPermissionsTab,
      icon: ShieldCheckIcon,
    },
  ];

  // Record representation function (with null safety for refetch cycles)
  const recordRepresentation = (record: Sale) => {
    return `${record?.first_name || ""} ${record?.last_name || ""}`.trim() || "User";
  };

  return (
    <ResourceSlideOver
      resource="sales"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
