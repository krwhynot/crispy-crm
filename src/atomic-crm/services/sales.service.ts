import type { DataProvider, Identifier } from "ra-core";
import type { Sale, SalesFormData } from "../types";
import { supabase } from "../providers/supabase/supabase";

/**
 * Sales service handles sales user management operations through Edge functions
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class SalesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Create a new sales account manager via Edge function
   * @param body Sales form data including credentials and profile info
   * @returns Created sale record
   */
  async salesCreate(body: SalesFormData): Promise<Sale> {
    const { data, error } = await supabase.functions.invoke<Sale>("users", {
      method: "POST",
      body,
    });

    if (!data || error) {
      console.error("salesCreate.error", error);
      throw new Error("Failed to create account manager");
    }

    return data;
  }

  /**
   * Update sales account manager profile via Edge function
   * @param id Sales user ID
   * @param data Profile update data (password excluded)
   * @returns Updated profile data
   */
  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>,
  ): Promise<Partial<Omit<SalesFormData, "password">>> {
    const { email, first_name, last_name, administrator, avatar, disabled } =
      data;

    const { data: sale, error } = await supabase.functions.invoke<Sale>(
      "users",
      {
        method: "PATCH",
        body: {
          sales_id: id,
          email,
          first_name,
          last_name,
          administrator,
          disabled,
          avatar,
        },
      },
    );

    if (!sale || error) {
      console.error("salesCreate.error", error);
      throw new Error("Failed to update account manager");
    }

    return data;
  }

  /**
   * Update sales user password via Edge function
   * @param id Sales user ID
   * @returns Success status
   */
  async updatePassword(id: Identifier): Promise<boolean> {
    const { data: passwordUpdated, error } =
      await supabase.functions.invoke<boolean>("updatePassword", {
        method: "PATCH",
        body: {
          sales_id: id,
        },
      });

    if (!passwordUpdated || error) {
      console.error("passwordUpdate.error", error);
      throw new Error("Failed to update password");
    }

    return passwordUpdated;
  }
}