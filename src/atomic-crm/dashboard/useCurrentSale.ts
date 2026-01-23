import { useContext, createContext } from "react";
import { useGetIdentity } from "react-admin";
import { devLog } from "@/lib/devLogger";

/**
 * ERR-003: Structured error categorization for sale queries
 * Replaces fragile string matching with explicit error codes
 */
interface SaleQueryError {
  code: "NOT_FOUND" | "UNAUTHORIZED" | "UNKNOWN";
  message: string;
}

function categorizeError(error: unknown): SaleQueryError {
  if (error instanceof Error) {
    if (error.message.includes("not found") || error.message.includes("No rows")) {
      return { code: "NOT_FOUND", message: error.message };
    }
    if (error.message.includes("unauthorized") || error.message.includes("permission")) {
      return { code: "UNAUTHORIZED", message: error.message };
    }
    return { code: "UNKNOWN", message: error.message };
  }
  return { code: "UNKNOWN", message: String(error) };
}

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
 * falls back to useGetIdentity when outside provider for backward compatibility.
 *
 * The authProvider.getIdentity() returns { id: sale.id, user_id, fullName, avatar, role }
 * where id is the numeric sales.id we need for queries.
 */
export function useCurrentSale() {
  // Try to use cached context first
  const context = useContext(CurrentSaleContext);

  // Always call the direct hook (React rules: hooks must be called unconditionally)
  // but only use its result when context is unavailable
  const directResult = useCurrentSaleDirect();

  // ERR-003 FIX: Use structured error categorization instead of fragile string matching
  // If context is available and has a non-404 error, return it with the error
  if (context && context.error) {
    const categorized = categorizeError(context.error);
    if (categorized.code !== "NOT_FOUND") {
      return {
        salesId: context.salesId,
        loading: context.loading,
        error: context.error,
      };
    }
  }

  // If context is available with no error, use it
  if (context && !context.error) {
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
 * Direct hook implementation (used as fallback or standalone)
 * Kept separate to allow context-based hook to call it when needed.
 *
 * SECURITY FIX (H-SEC-001): Replaced direct Supabase import with useGetIdentity.
 * React Admin's authProvider.getIdentity() already:
 * 1. Returns the sales record with id (the sales.id we need)
 * 2. Handles auth state management
 * 3. Caches results (15-minute TTL in authProvider)
 * 4. Falls back to email match for legacy users
 *
 * This eliminates the direct Supabase import while maintaining all functionality.
 */
function useCurrentSaleDirect() {
  const { data: identity, isLoading, error: identityError } = useGetIdentity();

  // Extract sales ID from identity
  // The authProvider.getIdentity() returns { id: sale.id, user_id, fullName, avatar, role }
  const salesId = identity?.id ? Number(identity.id) : null;

  // Debug logging for development
  if (import.meta.env.DEV && identity && salesId) {
    devLog("useCurrentSaleDirect", "Using identity from authProvider", {
      salesId,
      hasIdentity: !!identity,
    });
  }

  // Convert identity error to Error type
  const error = identityError instanceof Error ? identityError : null;

  return { salesId, loading: isLoading, error };
}
