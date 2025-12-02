import * as Sentry from "@sentry/react";
import type { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";
import { canAccess } from "../commons/canAccess";
import { supabase } from "./supabase";
import { logger } from "@/lib/logger";

const baseAuthProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const sale = await getSaleFromCache();

    if (sale == null) {
      const error = new Error("Missing sale record for authenticated user");
      Sentry.captureException(error, { tags: { scope: "authProvider.getIdentity" } });
      throw error;
    }

    const identity = {
      id: sale.id,
      fullName: `${sale.first_name} ${sale.last_name}`,
      avatar: sale.avatar_url,
      role: sale.role || "rep", // Default to 'rep' if not set
    };

    // Set Sentry user context for all future error reports
    logger.setUser({
      id: String(sale.id),
      username: identity.fullName,
      role: identity.role,
    });

    return identity;
  },
});

// Removed getIsInitialized - no longer checking for initial setup

export const authProvider: AuthProvider = {
  ...baseAuthProvider,
  login: async (params) => {
    const result = await baseAuthProvider.login(params);
    // clear cached sale
    cachedSale = undefined;
    logger.breadcrumb("User logged in", {}, "user");
    return result;
  },
  logout: async (params) => {
    // Clear Sentry user context on logout
    logger.setUser(null);
    logger.breadcrumb("User logged out", {}, "user");
    cachedSale = undefined;
    return baseAuthProvider.logout(params);
  },
  /**
   * Check authentication status
   * Phase 1 Security Remediation:
   * - SECURITY FIX: Always validate session first, don't trust URL-based checks
   * - Previous vulnerability: Users could bypass auth by navigating to public URLs
   * - Now: Session validation happens BEFORE checking if path is public
   */
  checkAuth: async (params) => {
    // Always check session first - don't trust URL alone
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // If no valid session, only allow public paths
    if (!session || error) {
      if (isPublicPath(window.location.pathname)) {
        return; // Allow access to public pages without session
      }
      // Add breadcrumb for auth redirect (helps trace redirects leading to issues)
      logger.breadcrumb(
        "Auth redirect - no session",
        {
          blockedPath: window.location.pathname,
          hasError: !!error,
        },
        "navigation"
      );
      throw new Error("Not authenticated");
    }

    // Valid session exists, proceed with normal auth check
    return baseAuthProvider.checkAuth(params);
  },
  canAccess: async (params) => {
    // Get the current user
    const sale = await getSaleFromCache();
    if (sale == null) return false;

    // Use the new role field (fallback to is_admin for backward compatibility)
    const role = sale.role || (sale.is_admin ? "admin" : "user");
    return canAccess(role, params);
  },
};

/**
 * Define public paths that don't require authentication
 * SECURITY: Whitelist approach - only these paths are accessible without a session
 * Phase 1 Security Remediation
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    "/login",
    "/forgot-password",
    "/set-password", // Only accessible via email recovery link
    "/reset-password",
  ];

  return publicPaths.some((path) => pathname.startsWith(path));
}

let cachedSale: any;
const getSaleFromCache = async () => {
  if (cachedSale != null) return cachedSale;

  const { data: dataSession, error: errorSession } = await supabase.auth.getSession();

  // Shouldn't happen after login but just in case
  if (dataSession?.session?.user == null || errorSession) {
    if (errorSession) {
      Sentry.captureException(errorSession, {
        tags: { scope: "authProvider.getIdentity", stage: "session" },
      });
    }
    return undefined;
  }

  const { data: dataSale, error: errorSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin, role")
    .match({ user_id: dataSession?.session?.user.id })
    .maybeSingle();

  // Shouldn't happen either as all users are sales but just in case
  if (dataSale == null || errorSale) {
    if (errorSale) {
      Sentry.captureException(errorSale, {
        tags: { scope: "authProvider.getIdentity", stage: "sale-fetch" },
      });
    }
    return undefined;
  }

  cachedSale = dataSale;
  return dataSale;
};
