import type { DataProvider, Identifier } from "ra-core";
import { HttpError } from "react-admin";
import type { Sale, SalesFormData } from "../types";
import { devError } from "@/lib/devLogger";
import { getErrorMessage } from "@/lib/type-guards";

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
      invoke?: <T = unknown>(
        functionName: string,
        options?: {
          method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
          body?: Record<string, unknown>;
          headers?: Record<string, string>;
        }
      ) => Promise<T>;
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
        body: body as Record<string, unknown>,
      });

      if (!data) {
        devError("SalesService", "Create account manager returned no data", {
          body,
        });
        throw new Error(`Sales creation failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: unknown) {
      devError("SalesService", "Failed to create account manager", {
        body,
        error,
      });

      // Extract message from error using type guards
      const message = getErrorMessage(error);

      // Determine appropriate HTTP status code
      let status = 500;
      if (error instanceof HttpError) {
        status = error.status;
      } else if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("duplicate")
      ) {
        status = 409; // Conflict
      } else if (
        message.toLowerCase().includes("validation") ||
        message.toLowerCase().includes("invalid")
      ) {
        status = 400; // Bad Request
      } else if (
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("permission")
      ) {
        status = 403; // Forbidden
      } else if (
        message.toLowerCase().includes("not authenticated") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        status = 401; // Unauthorized
      }

      // Map error messages to field-specific errors per React Admin server-side validation format
      const fieldErrors: Record<string, string> = {};
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("email")) {
        fieldErrors.email = message;
      }
      if (lowerMessage.includes("first_name") || lowerMessage.includes("first name")) {
        fieldErrors.first_name = message;
      }
      if (lowerMessage.includes("last_name") || lowerMessage.includes("last name")) {
        fieldErrors.last_name = message;
      }
      if (lowerMessage.includes("role")) {
        fieldErrors.role = message;
      }

      // Throw HttpError with body.errors format for React Admin form integration
      throw new HttpError(message, status, {
        errors: {
          root: { serverError: message },
          ...fieldErrors,
        },
      });
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
    data: Partial<Omit<SalesFormData, "password">> & { deleted_at?: string }
  ): Promise<Partial<Omit<SalesFormData, "password">> & { deleted_at?: string }> {
    // Destructure all fields that can be updated (avatar_url matches DB column name)
    const { email, first_name, last_name, role, avatar_url, disabled, deleted_at } = data;

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
      // Build body with only truthy values for strings, !== undefined for booleans/enums
      // Empty strings ("") must be excluded: Zod .url().nullish() rejects "" but accepts null/undefined
      const body: Record<string, unknown> = { sales_id: id };
      if (email) body.email = email;
      if (first_name) body.first_name = first_name;
      if (last_name) body.last_name = last_name;
      if (role !== undefined) body.role = role; // enum - keep !== undefined
      if (disabled !== undefined) body.disabled = disabled; // boolean - false is valid
      if (avatar_url) body.avatar_url = avatar_url;
      if (deleted_at) body.deleted_at = deleted_at;

      const sale = await this.dataProvider.invoke<Sale>("users", {
        method: "PATCH",
        body,
      });

      if (!sale) {
        devError("SalesService", "Update account manager returned no data", {
          id,
          data,
        });
        throw new Error(`Sales update failed: No data returned from Edge Function`);
      }

      return data;
    } catch (error: unknown) {
      devError("SalesService", "Failed to update account manager", {
        id,
        data,
        error,
      });
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Sales update failed: ${message}`);
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
    } catch (error: unknown) {
      devError("SalesService", "Failed to update password", {
        id,
        error,
      });
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Password update failed: ${message}`);
    }
  }
}
