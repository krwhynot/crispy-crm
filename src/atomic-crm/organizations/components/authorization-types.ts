/**
 * Type definitions for Authorization components
 *
 * Extracted from AuthorizationsTab.tsx to enable component splitting
 * without circular imports.
 */

import type { RaRecord } from "react-admin";
import type { TabComponentProps } from "@/components/layouts/ResourceSlideOver";

// =====================================================
// Component Props
// =====================================================

export interface AuthorizationsTabProps extends Partial<TabComponentProps> {
  /** For standalone use outside slide-over */
  distributorId?: string | number;
}

// =====================================================
// Data Models
// =====================================================

export interface PrincipalOrganization extends RaRecord {
  name: string;
  organization_type: string;
}

export interface Product extends RaRecord {
  id: number;
  name: string;
  sku: string;
  principal_id: number;
  category?: string;
  status?: string;
}

export interface AuthorizationWithPrincipal extends RaRecord {
  id: number;
  distributor_id: number;
  principal_id: number;
  is_authorized: boolean;
  authorization_date: string | null;
  expiration_date: string | null;
  territory_restrictions: string[] | null;
  notes: string | null;
  created_at: string;
  principal?: PrincipalOrganization;
}

export interface ProductAuthorization extends RaRecord {
  id: number;
  product_id: number;
  distributor_id: number;
  is_authorized: boolean;
  authorization_date: string | null;
  expiration_date: string | null;
  territory_restrictions: string[] | null;
  notes: string | null;
  special_pricing: Record<string, unknown> | null;
  created_at: string;
}

// =====================================================
// Dialog Props
// =====================================================

export interface RemoveConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  confirmLabel?: string;
}

export interface AddPrincipalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributorId: string | number;
  availablePrincipals: PrincipalOrganization[];
  onSuccess: () => void;
}

export interface AddProductExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributorId: number;
  availableProducts: Product[];
  inheritedAuthorization: boolean;
  onSuccess: () => void;
}

// =====================================================
// Section Props
// =====================================================

export interface ProductExceptionsSectionProps {
  authorization: AuthorizationWithPrincipal;
  distributorId: number;
  products: Product[];
  productAuths: ProductAuthorization[];
  isLoading: boolean;
}

export interface AuthorizationCardProps {
  authorization: AuthorizationWithPrincipal;
  distributorId: number;
  onRemove: () => void;
}
