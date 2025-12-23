import { useState, useCallback } from "react";

interface DialogError {
  message: string;
  field?: string;
}

export function useDialogError() {
  const [error, setError] = useState<DialogError | null>(null);

  const handleError = useCallback((err: unknown) => {
    setError({ message: parseServerError(err) });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
}

function parseServerError(err: unknown): string {
  if (!(err instanceof Error)) return "An unexpected error occurred";

  const msg = err.message.toLowerCase();

  if (msg.includes("unique constraint") || msg.includes("duplicate key")) {
    if (msg.includes("name")) return "A record with this name already exists";
    if (msg.includes("email")) return "This email is already in use";
    return "This record already exists";
  }

  if (msg.includes("foreign key constraint")) {
    return "Invalid selection - the referenced record doesn't exist";
  }

  if (msg.includes("permission denied") || msg.includes("rls")) {
    return "You don't have permission to perform this action";
  }

  return err.message;
}

export { parseServerError };
