import type { ZodSchema } from "zod";

/**
 * Safely parse JSON with Zod validation.
 * Defense-in-depth for localStorage/sessionStorage data.
 *
 * Security Rationale:
 * - JSON.parse on untrusted data (localStorage) can cause type confusion attacks
 * - XSS attackers can modify localStorage to inject malicious data
 * - Zod validation ensures parsed data matches expected schema
 * - Returns null on failure (fail-fast principle)
 *
 * @param json - Raw JSON string (or null)
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data, or null on failure
 *
 * @example
 * const schema = z.array(z.string());
 * const data = safeJsonParse(localStorage.getItem('key'), schema);
 * // Returns: string[] or null
 */
export function safeJsonParse<T>(json: string | null, schema: ZodSchema<T>): T | null {
  if (!json) return null;

  try {
    const parsed: unknown = JSON.parse(json);
    const result = schema.safeParse(parsed);

    if (!result.success) {
      console.warn("[safeJsonParse] Validation failed:", result.error.flatten());
      return null;
    }

    return result.data;
  } catch (error: unknown) {
    console.warn("[safeJsonParse] JSON.parse failed:", error);
    return null;
  }
}
