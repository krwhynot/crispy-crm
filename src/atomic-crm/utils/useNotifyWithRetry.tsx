import { useNotify } from "react-admin";
import { useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface NotifyWithRetryOptions {
  type?: "error" | "warning";
  autoHideDuration?: number;
}

/**
 * useNotifyWithRetry - Error notifications with built-in retry action
 *
 * Provides a convenient wrapper around react-admin's notify() that adds
 * a retry button to error notifications. This improves UX by allowing
 * users to immediately retry failed operations without additional clicks.
 *
 * Usage:
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
 */
export const useNotifyWithRetry = () => {
  const notify = useNotify();

  return useCallback(
    (message: string, retryAction: () => void, options?: NotifyWithRetryOptions) => {
      const RetryButton = (): ReactNode => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            retryAction();
          }}
          className="text-inherit underline hover:no-underline h-auto p-0 ml-2"
        >
          Retry
        </Button>
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
