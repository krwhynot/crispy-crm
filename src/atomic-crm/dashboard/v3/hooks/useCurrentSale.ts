import { useEffect, useState, useContext, createContext } from "react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

/**
 * CurrentSaleContext for session-level caching
 *
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * This context caches the salesId at the dashboard level, eliminating
 * redundant queries from multiple components (useKPIMetrics, useMyTasks,
 * useMyPerformance, usePrincipalPipeline all need salesId).
 *
 * Expected improvement: 4+ fewer queries, ~100-200ms faster initial load.
 */
interface CurrentSaleContextValue {
  salesId: number | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Context is created here but the Provider is in CurrentSaleContext.tsx
// This allows the hook to check for context availability
const CurrentSaleContext = createContext<CurrentSaleContextValue | null>(null);

// Export context for the Provider component
export { CurrentSaleContext };

/**
 * Hook to get current user's sales ID
 *
 * PERFORMANCE: Uses cached context when available (inside CurrentSaleProvider),
 * falls back to direct query when outside provider for backward compatibility.
 *
 * CRITICAL: Uses Supabase auth.getUser() and user.id (UUID) for lookup.
 * DO NOT use React Admin identity.id - it's a string representation
 * of sales.id which causes type mismatches in queries.
 *
 * This hook queries: SELECT id FROM sales WHERE user_id = auth.uid()
 * OR falls back to email match for legacy users with NULL user_id
 */
export function useCurrentSale() {
  // Try to use cached context first
  const context = useContext(CurrentSaleContext);

  // Always call the direct hook (React rules: hooks must be called unconditionally)
  // but only use its result when context is unavailable
  const directResult = useCurrentSaleDirect();

  // If context is available and not in error state, use it
  if (context && !context.error?.message?.includes("not found")) {
    return {
      salesId: context.salesId,
      loading: context.loading,
      error: context.error,
    };
  }

  // Fallback: direct query result (for components outside CurrentSaleProvider)
  return directResult;
}

/**
 * Direct query implementation (used as fallback or standalone)
 * Kept separate to allow context-based hook to call it when needed.
 */
function useCurrentSaleDirect() {
  const [salesId, setSalesId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSaleId = async () => {
      try {
        setLoading(true);

        // Get current user from Supabase auth
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // Query sales table using user.id (UUID)
        // This is the ONLY correct way to get sales.id
        // Handle legacy users with NULL user_id by falling back to email match
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .select("id, user_id, email")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (saleError) throw saleError;

        if (isMounted) {
          if (sale?.id) {
            setSalesId(sale.id); // This is a number (bigint from DB)

            // Debug logging for B1 filtering investigation
            if (import.meta.env.DEV) {
              console.log("[useCurrentSale] Found sales record:", {
                salesId: sale.id,
                hasUserId: !!sale.user_id,
                email: sale.email,
              });
            }

            // If this is a legacy user without user_id, log a warning
            if (!sale.user_id) {
              console.warn(
                `Sales record ${sale.id} matched by email but has NULL user_id. Consider running migration to populate user_id.`
              );
            }
          } else {
            // Debug logging when no sales record found
            if (import.meta.env.DEV) {
              console.log("[useCurrentSale] No sales record found for user:", {
                userId: user.id,
                email: user.email,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sales ID:", err);
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSaleId();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  return { salesId, loading, error };
}
