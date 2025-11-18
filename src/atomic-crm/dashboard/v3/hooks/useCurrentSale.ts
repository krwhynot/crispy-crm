/**
 * useCurrentSale Hook (STUB VERSION)
 *
 * This is a temporary stub implementation for Task 4.
 * Will be properly implemented in Task 6 when connecting to Supabase.
 *
 * Real implementation will fetch the current user's sales_id from the database.
 */

export function useCurrentSale() {
  // Stub: return mock sales ID for development
  // Task 6 will replace this with actual Supabase query
  return {
    salesId: 1, // Mock sales ID
    loading: false,
    error: null,
  };
}
