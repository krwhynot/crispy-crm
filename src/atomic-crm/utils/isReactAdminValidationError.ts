/**
 * Checks whether an error has the React Admin validation error shape.
 *
 * RA Form components process thrown errors with `.body.errors` (non-array object)
 * into field-level validation messages. Only errors matching this shape should be
 * re-thrown inside RA `<Form>` onSubmit handlers.
 *
 * Shape: `{ body: { errors: Record<string, string> } }`
 */
export function isReactAdminValidationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("body" in error)) return false;

  const body = (error as { body?: unknown }).body;
  if (typeof body !== "object" || body === null) return false;
  if (!("errors" in body)) return false;

  const errors = (body as { errors?: unknown }).errors;
  return typeof errors === "object" && errors !== null && !Array.isArray(errors);
}
