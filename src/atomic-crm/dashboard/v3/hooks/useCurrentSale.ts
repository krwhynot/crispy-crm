import { useEffect, useState } from 'react';
import { supabase } from '@/atomic-crm/providers/supabase/supabase';

/**
 * Hook to get current user's sales ID
 *
 * CRITICAL: Uses Supabase auth.getUser() and user.id (UUID) for lookup.
 * DO NOT use React Admin identity.id - it's a string representation
 * of sales.id which causes type mismatches in queries.
 *
 * This hook queries: SELECT id FROM sales WHERE user_id = auth.uid()
 * OR falls back to email match for legacy users with NULL user_id
 */
export function useCurrentSale() {
  const [salesId, setSalesId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSaleId = async () => {
      try {
        setLoading(true);

        // Get current user from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setLoading(false);
          return;
        }

        // Query sales table using user.id (UUID)
        // This is the ONLY correct way to get sales.id
        // ✅ Handle legacy users with NULL user_id by falling back to email match
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .select('id, user_id, email')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (saleError) throw saleError;

        if (sale?.id) {
          setSalesId(sale.id); // This is a number (bigint from DB)

          // Debug logging for B1 filtering investigation
          if (import.meta.env.DEV) {
            console.log('[useCurrentSale] Found sales record:', {
              salesId: sale.id,
              hasUserId: !!sale.user_id,
              email: sale.email,
            });
          }

          // If this is a legacy user without user_id, log a warning
          if (!sale.user_id) {
            console.warn(`Sales record ${sale.id} matched by email but has NULL user_id. Consider running migration to populate user_id.`);
          }
        } else {
          // Debug logging when no sales record found
          if (import.meta.env.DEV) {
            console.log('[useCurrentSale] No sales record found for user:', {
              userId: user.id,
              email: user.email,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch sales ID:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaleId();
  }, []); // Run once on mount

  return { salesId, loading, error };
}
