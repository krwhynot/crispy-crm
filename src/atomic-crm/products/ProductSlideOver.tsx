import { PackageIcon, Link2Icon, ShieldCheckIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { ProductDetailsTab } from "./ProductDetailsTab";
import { ProductRelationshipsTab } from "./ProductRelationshipsTab";
import { ProductCertificationsTab } from "./ProductCertificationsTab";

interface ProductSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

/**
 * ProductSlideOver - Slide-over panel for viewing and editing products
 *
 * Features:
 * - Details tab: Core product fields (name, SKU, description, category, status, principal)
 * - Relationships tab: Related organizations and opportunities
 * - Certifications tab: Certifications, allergens, nutritional info
 * - View/Edit mode toggle
 * - URL synchronization
 * - ESC key to close
 *
 * Design:
 * - 40vw width (480-720px)
 * - Slide-in from right
 * - Three tabs with icons
 */
export function ProductSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: ProductSlideOverProps) {
  // Tab configuration
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: ProductDetailsTab,
      icon: PackageIcon,
    },
    {
      key: "relationships",
      label: "Relationships",
      component: ProductRelationshipsTab,
      icon: Link2Icon,
    },
    {
      key: "certifications",
      label: "Certifications",
      component: ProductCertificationsTab,
      icon: ShieldCheckIcon,
    },
  ];

  // Record representation function
  const recordRepresentation = (record: any) => {
    return record.name || `Product #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="products"
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
