/**
 * Generate Opportunity Name Utility
 *
 * Auto-generates opportunity names following the format:
 * "{Customer Name} - {Principal Name} - Q{quarter} {year}"
 *
 * Example: "Nobu Miami - Ocean Hugger - Q1 2025"
 *
 * Features:
 * - Calculates quarter from current date
 * - Handles missing customer or principal gracefully
 * - Truncates to 200 characters max
 * - Returns empty string if both customer and principal are missing
 */

export interface OpportunityNameParams {
  customerName?: string | null;
  principalName?: string | null;
  date?: Date;
}

/**
 * Calculate the quarter (1-4) from a given date
 */
export function getQuarter(date: Date): number {
  const month = date.getMonth(); // 0-11
  return Math.floor(month / 3) + 1; // 1-4
}

/**
 * Generate an opportunity name from customer, principal, and date
 *
 * @param params - Customer name, principal name, and optional date (defaults to today)
 * @returns Generated name string, or empty string if insufficient data
 */
export function generateOpportunityName(params: OpportunityNameParams): string {
  const { customerName, principalName, date = new Date() } = params;

  const parts: string[] = [];

  // Add customer name if available (check trimmed value is not empty)
  const trimmedCustomer = customerName?.trim();
  if (trimmedCustomer) {
    parts.push(trimmedCustomer);
  }

  // Add principal name if available (check trimmed value is not empty)
  const trimmedPrincipal = principalName?.trim();
  if (trimmedPrincipal) {
    parts.push(trimmedPrincipal);
  }

  // Return empty string if both customer and principal are missing/empty after trimming
  if (parts.length === 0) {
    return '';
  }

  // Add quarter and year
  const quarter = getQuarter(date);
  const year = date.getFullYear();
  parts.push(`Q${quarter} ${year}`);

  // Join parts with " - " separator
  let name = parts.join(' - ');

  // Truncate to 200 characters if needed
  if (name.length > 200) {
    name = name.substring(0, 197) + '...';
  }

  return name;
}
