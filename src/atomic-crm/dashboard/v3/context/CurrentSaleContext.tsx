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

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
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
  const [salesId, setSalesId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchSaleId = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from Supabase auth
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (isMounted) {
            setSalesId(null);
            setLoading(false);
          }
          return;
        }

        // Query sales table using user.id (UUID)
        // Handle legacy users with NULL user_id by falling back to email match
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .select("id, user_id, email")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (saleError) throw saleError;

        if (isMounted) {
          if (sale?.id) {
            setSalesId(sale.id);

            // Debug logging for development
            if (import.meta.env.DEV) {
              console.log("[CurrentSaleProvider] Cached sales record:", {
                salesId: sale.id,
                hasUserId: !!sale.user_id,
              });
            }

            // Warn about legacy users
            if (!sale.user_id) {
              console.warn(
                `Sales record ${sale.id} matched by email but has NULL user_id. Consider running migration to populate user_id.`
              );
            }
          } else {
            setSalesId(null);
            if (import.meta.env.DEV) {
              console.log("[CurrentSaleProvider] No sales record found for user:", {
                userId: user.id,
                email: user.email,
              });
            }
          }
        }
      } catch (err) {
        console.error("[CurrentSaleProvider] Failed to fetch sales ID:", err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSaleId();

    return () => {
      isMounted = false;
    };
  }, [fetchTrigger]);

  const refetch = () => {
    setFetchTrigger((prev) => prev + 1);
  };

  return (
    <CurrentSaleContext.Provider value={{ salesId, loading, error, refetch }}>
      {children}
    </CurrentSaleContext.Provider>
  );
}
