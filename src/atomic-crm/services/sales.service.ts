import type { DataProvider, Identifier } from "ra-core";
import type { Sale, SalesFormData } from "../types";
import { devError } from "@/lib/devLogger";

/**
 * Sales service handles sales user management operations through Edge functions
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 *
 * Updated to use dataProvider exclusively - no direct Supabase access
 * per Engineering Constitution principle #2: Single Source of Truth
 */
export class SalesService {
  constructor(
    private dataProvider: DataProvider & {
      invoke?: <T = any>(functionName: string, options?: any) => Promise<T>;
    }
  ) {}

  /**
   * Create a new sales account manager via Edge function
   * @param body Sales form data including credentials and profile info
   * @returns Created sale record
   */
  async salesCreate(body: SalesFormData): Promise<Sale> {
    // Use the extended invoke capability from unifiedDataProvider
    if (!this.dataProvider.invoke) {
      devError("SalesService", "DataProvider missing invoke capability", {
        operation: "salesCreate",
        body,
      });
      throw new Error(
        `Sales creation failed: DataProvider does not support Edge Function operations`
      );
    }

    try {
      const data = await this.dataProvider.invoke<Sale>("users", {
        method: "POST",
        body,
      });

      if (!data) {
        devError("SalesService", "Create account manager returned no data", {
          body,
        });
        throw new Error(`Sales creation failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: any) {
      devError("SalesService", "Failed to create account manager", {
        body,
        error,
      });
      throw new Error(`Sales creation failed: ${error.message}`);
    }
  }

  /**
   * Update sales account manager profile via Edge function
   * @param id Sales user ID
   * @param data Profile update data (password excluded)
   * @returns Updated profile data
   */
  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>
  ): Promise<Partial<Omit<SalesFormData, "password">>> {
    const { email, first_name, last_name, administrator, avatar, disabled } = data;

    if (!this.dataProvider.invoke) {
      devError("SalesService", "DataProvider missing invoke capability", {
        operation: "salesUpdate",
        id,
        data,
      });
      throw new Error(
        `Sales update failed: DataProvider does not support Edge Function operations`
      );
    }

    try {
      const sale = await this.dataProvider.invoke<Sale>("users", {
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
      });

      if (!sale) {
        devError("SalesService", "Update account manager returned no data", {
          id,
          data,
        });
        throw new Error(`Sales update failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: any) {
      devError("SalesService", "Failed to update account manager", {
        id,
        data,
        error,
      });
      throw new Error(`Sales update failed: ${error.message}`);
    }
  }

  /**
   * Update sales user password via Edge function
   * @param id Sales user ID
   * @returns Success status
   */
  async updatePassword(id: Identifier): Promise<boolean> {
    if (!this.dataProvider.invoke) {
      devError("SalesService", "DataProvider missing invoke capability", {
        operation: "updatePassword",
        id,
      });
      throw new Error(
        `Password update failed: DataProvider does not support Edge Function operations`
      );
    }

    try {
      const passwordUpdated = await this.dataProvider.invoke<boolean>("updatePassword", {
        method: "PATCH",
        body: {
          sales_id: id,
        },
      });

      if (!passwordUpdated) {
        devError("SalesService", "Update password returned false", {
          id,
        });
        throw new Error(`Password update failed: Edge Function returned false`);
      }

      return passwordUpdated;
    } catch (error: any) {
      devError("SalesService", "Failed to update password", {
        id,
        error,
      });
      throw new Error(`Password update failed: ${error.message}`);
    }
  }
}
