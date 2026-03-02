import type { DataProvider, Identifier } from "ra-core";
import { HttpError } from "react-admin";
import type { Sale, SalesFormData } from "../types";
import type { SalesCreateResult } from "../providers/supabase/extensions/types";
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
   * Create a new sales account manager via Edge function.
   * Returns sale record + recovery URL for the admin to share.
   *
   * Backward-compatible: handles both old { data: Sale } and new { data: Sale, recoveryUrl } responses
   * to support rolling deploys (frontend may ship before Edge Function).
   */
  async salesCreate(body: SalesFormData): Promise<SalesCreateResult> {
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
      // Strip fields the Edge Function's inviteUserSchema doesn't accept
      const { first_name, last_name, email, role, disabled } = body;
      const invitePayload = { first_name, last_name, email, role, disabled };

      const response = await this.dataProvider.invoke<
        | { data: Sale; recoveryUrl?: string | null } // New format
        | Sale // Old format (backward compat)
      >("users", {
        method: "POST",
        body: invitePayload as Record<string, unknown>,
      });

      if (!response) {
        devError("SalesService", "Create account manager returned no data", { body });
        throw new Error(`Sales creation failed: No data returned from Edge Function`);
      }

      // Backward-compatible parsing: old Edge Function returns Sale directly,
      // new Edge Function returns { data: Sale, recoveryUrl: string | null }
      const isNewFormat =
        response &&
        typeof response === "object" &&
        "data" in response &&
        "recoveryUrl" in response;

      if (isNewFormat) {
        const typed = response as { data: Sale; recoveryUrl: string | null };
        if (!typed.data) {
          devError("SalesService", "Create account manager returned no data in new format", {
            body,
          });
          throw new Error(`Sales creation failed: No data returned from Edge Function`);
        }
        return { sale: typed.data, recoveryUrl: typed.recoveryUrl ?? null };
      }

      // Old format: response IS the Sale object
      return { sale: response as Sale, recoveryUrl: null };
    } catch (error: unknown) {
      devError("SalesService", "Failed to create account manager", { body, error });

      const message = getErrorMessage(error);

      let status = 500;
      if (error instanceof HttpError) {
        status = error.status;
      } else if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("duplicate")
      ) {
        status = 409;
      } else if (
        message.toLowerCase().includes("validation") ||
        message.toLowerCase().includes("invalid")
      ) {
        status = 400;
      } else if (
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("permission")
      ) {
        status = 403;
      } else if (
        message.toLowerCase().includes("not authenticated") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        status = 401;
      }

      const fieldErrors: Record<string, string> = {};
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("email")) fieldErrors.email = message;
      if (lowerMessage.includes("first_name") || lowerMessage.includes("first name"))
        fieldErrors.first_name = message;
      if (lowerMessage.includes("last_name") || lowerMessage.includes("last name"))
        fieldErrors.last_name = message;
      if (lowerMessage.includes("role")) fieldErrors.role = message;

      throw new HttpError(message, status, {
        errors: { root: { serverError: message }, ...fieldErrors },
      });
    }
  }

  /**
   * Update sales account manager profile via Edge function
   * @param id Sales user ID
   * @param data Profile update data
   * @returns Updated profile data
   */
  async salesUpdate(
    id: Identifier,
    data: Partial<SalesFormData> & { deleted_at?: string }
  ): Promise<Partial<SalesFormData> & { deleted_at?: string }> {
    // Destructure all fields that can be updated (avatar_url matches DB column name)
    const { email, first_name, last_name, phone, role, avatar_url, disabled, deleted_at } = data;

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
      if (phone) body.phone = phone;
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
   * Self-service password reset: sends reset email to the authenticated caller.
   * @param id Sales user ID (unused by Edge Function, kept for API compatibility)
   * @returns true on success
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
      // Edge Function returns { data: { success: true } } on success.
      // If invoke doesn't throw, the reset email was sent successfully.
      await this.dataProvider.invoke("updatepassword", {
        method: "PATCH",
        body: {
          sales_id: id,
        },
      });

      return true;
    } catch (error: unknown) {
      devError("SalesService", "Failed to update password", {
        id,
        error,
      });
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Password update failed: ${message}`);
    }
  }

  /**
   * Admin-initiated password reset: sends recovery email to a target user.
   * Only admins can use this endpoint. Supabase sends the recovery email directly.
   * @param targetEmail Email of the user to reset password for
   * @returns Object with success boolean
   */
  async resetUserPassword(targetEmail: string): Promise<{ success: boolean }> {
    if (!this.dataProvider.invoke) {
      devError("SalesService", "DataProvider missing invoke capability", {
        operation: "resetUserPassword",
        targetEmail,
      });
      throw new Error(
        `Admin password reset failed: DataProvider does not support Edge Function operations`
      );
    }

    try {
      await this.dataProvider.invoke("updatepassword", {
        method: "PATCH",
        body: {
          target_email: targetEmail,
        },
      });

      return { success: true };
    } catch (error: unknown) {
      devError("SalesService", "Failed to reset user password", {
        targetEmail,
        error,
      });
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Admin password reset failed: ${message}`);
    }
  }
}
