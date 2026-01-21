/**
 * Safe Notification Hook
 *
 * Wraps React Admin's useNotify to automatically sanitize error messages.
 * Prevents raw database/technical errors from reaching users.
 *
 * Usage:
 * ```tsx
 * const { success, error, warning, info } = useSafeNotify();
 *
 * // For success messages
 * success("Organization created");
 *
 * // For errors - automatically sanitizes
 * error(err); // Uses mapErrorToUserMessage
 * error(err, "Couldn't create organization. Please try again."); // Custom fallback
 * ```
 *
 * Engineering Constitution: Single source of truth for error notifications
 */

import { useCallback } from "react";
import { useNotify } from "react-admin";
import { mapErrorToUserMessage, getActionErrorMessage } from "../utils/errorMessages";

export interface SafeNotifyOptions {
  /** Custom fallback message if error sanitization fails */
  fallback?: string;
  /** Auto-hide duration in milliseconds (default: 4000 for errors) */
  autoHideDuration?: number;
  /** Whether the notification can be undone */
  undoable?: boolean;
  /** Message ID for i18n translation */
  messageArgs?: Record<string, unknown>;
}

export interface SafeNotifyReturn {
  /** Show a success notification */
  success: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  /** Show an error notification - automatically sanitizes error messages */
  error: (error: unknown, fallbackOrOptions?: string | SafeNotifyOptions) => void;
  /** Show a warning notification */
  warning: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  /** Show an info notification */
  info: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  /** Show a contextual error for a specific action */
  actionError: (
    error: unknown,
    action: "create" | "update" | "delete" | "save" | "load",
    resource?: string
  ) => void;
}

/**
 * Hook that provides safe notification methods
 *
 * Automatically sanitizes error messages to prevent technical details
 * from being shown to users.
 */
export function useSafeNotify(): SafeNotifyReturn {
  const notify = useNotify();

  const success = useCallback(
    (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => {
      notify(message, {
        type: "success",
        autoHideDuration: options?.autoHideDuration ?? 3000,
        undoable: options?.undoable,
        messageArgs: options?.messageArgs,
      });
    },
    [notify]
  );

  const error = useCallback(
    (err: unknown, fallbackOrOptions?: string | SafeNotifyOptions) => {
      let fallback: string | undefined;
      let options: Omit<SafeNotifyOptions, "fallback"> = {};

      if (typeof fallbackOrOptions === "string") {
        fallback = fallbackOrOptions;
      } else if (fallbackOrOptions) {
        fallback = fallbackOrOptions.fallback;
        options = fallbackOrOptions;
      }

      // Use fallback if provided, otherwise sanitize the error
      const message = fallback ?? mapErrorToUserMessage(err);

      notify(message, {
        type: "error",
        autoHideDuration: options.autoHideDuration ?? 5000,
        undoable: options.undoable,
        messageArgs: options.messageArgs,
      });
    },
    [notify]
  );

  const warning = useCallback(
    (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => {
      notify(message, {
        type: "warning",
        autoHideDuration: options?.autoHideDuration ?? 4000,
        undoable: options?.undoable,
        messageArgs: options?.messageArgs,
      });
    },
    [notify]
  );

  const info = useCallback(
    (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => {
      notify(message, {
        type: "info",
        autoHideDuration: options?.autoHideDuration ?? 4000,
        undoable: options?.undoable,
        messageArgs: options?.messageArgs,
      });
    },
    [notify]
  );

  const actionError = useCallback(
    (err: unknown, action: "create" | "update" | "delete" | "save" | "load", resource?: string) => {
      // First try to get a meaningful message from the error
      const sanitized = mapErrorToUserMessage(err);

      // If we got a generic message, use the action-specific fallback
      const isGeneric = sanitized === "Something went wrong. Please try again.";
      const message = isGeneric ? getActionErrorMessage(action, resource) : sanitized;

      notify(message, {
        type: "error",
        autoHideDuration: 5000,
      });
    },
    [notify]
  );

  return {
    success,
    error,
    warning,
    info,
    actionError,
  };
}

export default useSafeNotify;
