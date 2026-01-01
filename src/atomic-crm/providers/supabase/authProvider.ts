import type { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";
import { canAccess } from "../commons/canAccess";
import { supabase } from "./supabase";
import { escapeCacheManager } from "./dataProviderCache";

const baseAuthProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const sale = await getSaleFromCache();

    if (sale == null) {
      throw new Error();
    }

    return {
      id: sale.id,
      fullName: `${sale.first_name} ${sale.last_name}`,
      avatar: sale.avatar_url,
      role: sale.role || "rep", // Default to 'rep' if not set
    };
  },
});

// Removed getIsInitialized - no longer checking for initial setup

export const authProvider: AuthProvider = {
  ...baseAuthProvider,
  login: async (params) => {
    const result = await baseAuthProvider.login(params);
    cachedSale = undefined;
    cacheTimestamp = 0;
    return result;
  },
  logout: async (params) => {
    const result = await baseAuthProvider.logout(params);
    cachedSale = undefined;
    cacheTimestamp = 0;
    escapeCacheManager.clear();
    return result;
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

    // Detect stale JWT (user deleted but token still valid - e.g., after db reset)
    // Industry standard: auto-logout on auth errors for self-healing UX
    if (error?.message?.includes("does not exist") || error?.message?.includes("JWT")) {
      // Clear stale session and cache
      await supabase.auth.signOut();
      cachedSale = undefined;
      cacheTimestamp = 0;
      throw new Error("Session expired. Please log in again.");
    }

    // If no valid session, only allow public paths
    if (!session || error) {
      if (isPublicPath(window.location.pathname)) {
        return; // Allow access to public pages without session
      }
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

interface CachedSale {
  id: string | number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  role: string | null;
}

let cachedSale: CachedSale | undefined;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

const getSaleFromCache = async () => {
  const now = Date.now();
  const isCacheExpired = now - cacheTimestamp > CACHE_TTL_MS;

  if (cachedSale != null && !isCacheExpired) return cachedSale;

  const { data: dataSession, error: errorSession } = await supabase.auth.getSession();

  // Check for stale JWT error (user deleted but token valid - e.g., after db reset)
  if (errorSession?.message?.includes("does not exist")) {
    await supabase.auth.signOut();
    cachedSale = undefined;
    cacheTimestamp = 0;
    return undefined;
  }

  // Shouldn't happen after login but just in case
  if (dataSession?.session?.user == null || errorSession) {
    return undefined;
  }

  const { data: dataSale, error: errorSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin, role")
    .match({ user_id: dataSession?.session?.user.id })
    .maybeSingle();

  // Shouldn't happen either as all users are sales but just in case
  if (dataSale == null || errorSale) {
    return undefined;
  }

  cachedSale = dataSale;
  cacheTimestamp = Date.now();
  return dataSale;
};

/**
 * Invalidate the identity cache to force fresh data on next getIdentity() call.
 * Use after admin changes a user's role so new permissions take effect immediately.
 */
export const invalidateIdentityCache = () => {
  cachedSale = undefined;
  cacheTimestamp = 0;
  console.log("[authProvider] Identity cache cleared - next getIdentity will fetch fresh data");
};
