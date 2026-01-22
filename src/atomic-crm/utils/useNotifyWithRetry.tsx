import { useNotify } from "react-admin";
import { useCallback, type ReactNode } from "react";
import { Button } from "@/components/admin/AdminButton";

interface NotifyWithRetryOptions {
  type?: "error" | "warning";
  autoHideDuration?: number;
}

/**
 * Hook that provides notification with optional user-initiated retry.
 *
 * **Fail-Fast Compliance:** This hook does NOT implement automatic retry.
 * The retry button allows users to manually retry failed operations after
 * reviewing the error. This is an intentional UX pattern that:
 *
 * 1. Shows errors immediately (fail-fast)
 * 2. Gives users control over retry timing
 * 3. Prevents infinite retry loops
 *
 * @example
 * ```tsx
 * const notifyWithRetry = useNotifyWithRetry();
 *
 * const handleSave = async () => {
 *   try {
 *     await dataProvider.update(...);
 *     notify('Saved successfully', { type: 'success' });
 *   } catch (error) {
 *     notifyWithRetry('Failed to save', handleSave);
 *   }
 * };
 * ```
 *
 * @returns Callback function to show error notification with retry button
 */
export const useNotifyWithRetry = () => {
  const notify = useNotify();

  return useCallback(
    (message: string, retryAction: () => void, options?: NotifyWithRetryOptions) => {
      const RetryButton = (): ReactNode => (
        <AdminButton
          variant="ghost"
          size="sm"
          onClick={() => {
            retryAction();
          }}
          className="text-inherit underline hover:no-underline h-auto p-0 ml-2"
        >
          Retry
        </AdminButton>
      );

      notify(message, {
        type: options?.type ?? "error",
        autoHideDuration: options?.autoHideDuration ?? 10000, // Keep visible longer for retry
        messageArgs: {
          _: message,
          // React Admin notification supports React elements via messageArgs
          action: <RetryButton />,
        },
      });
    },
    [notify]
  );
};

export default useNotifyWithRetry;
