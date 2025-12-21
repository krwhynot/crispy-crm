/**
 * CurrentSaleContext - Session-level cache for current user's sales ID
 *
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * Previously, useCurrentSale() made a database query on every component mount.
 * With 5+ dashboard components all needing salesId, this created a serialization
 * bottleneck where all KPI queries had to wait for their own salesId lookup.
 *
 * This context:
 * 1. Queries salesId ONCE on dashboard load
 * 2. Caches the result for the session lifetime
 * 3. All child components get instant access without additional queries
 *
 * Expected improvement: Eliminates 4+ redundant queries, removes ~100-200ms
 * serialization delay from dashboard initial load.
 */

import { type ReactNode, useMemo, useCallback } from "react";
import { useGetIdentity } from "react-admin";
import { CurrentSaleContext } from "../hooks/useCurrentSale";

interface CurrentSaleProviderProps {
  children: ReactNode;
}

/**
 * Provider component that fetches and caches the current user's sales ID.
 * Wrap this around the dashboard (or app root) to enable cached access.
 *
 * Usage:
 * ```tsx
 * <CurrentSaleProvider>
 *   <PrincipalDashboardV3 />
 * </CurrentSaleProvider>
 * ```
 *
 * All child components using useCurrentSale() will get the cached value.
 */
export function CurrentSaleProvider({ children }: CurrentSaleProviderProps) {
  // Use React Admin's useGetIdentity to get the current user
  // This leverages authProvider.getIdentity() which already handles:
  // - Auth state management
  // - Caching (15-minute TTL)
  // - User lookup via user_id or email fallback
  const { data: identity, isLoading, error: identityError } = useGetIdentity();

  // Extract sales ID from identity
  // The authProvider.getIdentity() returns { id: sale.id, fullName, avatar, role }
  const salesId = identity?.id ? Number(identity.id) : null;
  const error = identityError instanceof Error ? identityError : null;

  // Debug logging for development
  if (import.meta.env.DEV && identity) {
    console.log("[CurrentSaleProvider] Using cached identity from authProvider:", {
      salesId,
      hasIdentity: !!identity,
    });
  }

  // No-op refetch since React Admin manages the cache
  // Identity cache is cleared on login/logout via authProvider
  const refetch = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("[CurrentSaleProvider] refetch called but no-op (managed by authProvider)");
    }
  }, []);

  const contextValue = useMemo(
    () => ({ salesId, loading: isLoading, error, refetch }),
    [salesId, isLoading, error, refetch]
  );

  return (
    <CurrentSaleContext.Provider value={contextValue}>
      {children}
    </CurrentSaleContext.Provider>
  );
}
