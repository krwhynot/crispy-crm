import { DEV, devError } from "@/lib/devLogger";

/**
 * Handle service errors with consistent logging and re-throwing
 * @param serviceName - Name of the service (for logging)
 * @param operation - Description of the failed operation
 * @param context - Additional context for debugging
 * @param error - The caught error
 * @throws Error with formatted message
 */
export function handleServiceError(
  serviceName: string,
  operation: string,
  context: Record<string, unknown>,
  error: unknown
): never {
  const message = error instanceof Error ? error.message : String(error);

  if (DEV) {
    devError(serviceName, `Failed to ${operation}`, { ...context, error });
  }

  throw new Error(`${operation} failed: ${message}`);
}
