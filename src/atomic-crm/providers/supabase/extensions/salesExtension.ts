/**
 * Sales Extension Layer
 *
 * Delegates sales-related custom methods to SalesService.
 * Provides account manager creation, updates, and password reset functionality.
 *
 * Methods (3 total):
 * - salesCreate: Create account manager via Edge Function
 * - salesUpdate: Update account manager profile via Edge Function
 * - updatePassword: Trigger password reset email via Edge Function
 *
 * @module providers/supabase/extensions/salesExtension
 */

import type { Identifier } from "ra-core";
import type { ServiceContainer } from "../services";
import type { SalesFormData } from "@/atomic-crm/types";
import type { SalesCreateResult } from "./types";

/**
 * Sales extension methods interface
 */
export interface SalesExtension {
  salesCreate(body: SalesFormData): Promise<SalesCreateResult>;
  salesUpdate(id: Identifier, data: Partial<SalesFormData>): Promise<Partial<SalesFormData>>;
  updatePassword(id: Identifier): Promise<boolean>;
  resetUserPassword(targetEmail: string): Promise<{ success: boolean }>;
}

/**
 * Create Sales Extension
 *
 * Returns sales-related custom methods that delegate to SalesService.
 *
 * @param services - Pre-initialized service container
 * @returns Sales extension methods
 */
export function createSalesExtension(services: ServiceContainer): SalesExtension {
  return {
    /**
     * Create account manager via Edge Function
     * Delegates to SalesService which calls create-sales Edge Function
     *
     * @param body - Sales form data with email, profile info
     * @returns Created sale record with user_id
     */
    salesCreate: async (body: SalesFormData): Promise<SalesCreateResult> => {
      return services.sales.salesCreate(body);
    },

    /**
     * Update account manager profile via Edge Function
     * Delegates to SalesService which calls update-sales Edge Function
     *
     * @param id - Sale record ID
     * @param data - Partial sales data
     * @returns Updated partial sales data
     */
    salesUpdate: async (
      id: Identifier,
      data: Partial<SalesFormData>
    ): Promise<Partial<SalesFormData>> => {
      return services.sales.salesUpdate(id, data);
    },

    /**
     * Trigger self-service password reset email via Edge Function
     * Delegates to SalesService which calls reset-password Edge Function
     *
     * @param id - Sale record ID
     * @returns Success boolean
     */
    updatePassword: async (id: Identifier): Promise<boolean> => {
      return services.sales.updatePassword(id);
    },

    /**
     * Admin-initiated password reset for another user via Edge Function
     * Delegates to SalesService. Requires caller to have admin role.
     *
     * @param targetEmail - Email of the user to reset password for
     * @returns Object with success boolean
     */
    resetUserPassword: async (targetEmail: string): Promise<{ success: boolean }> => {
      return services.sales.resetUserPassword(targetEmail);
    },
  };
}
