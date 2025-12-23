/**
 * Generate Opportunity Name Utility
 *
 * Auto-generates opportunity names following the format:
 * "{Principal Name} - {Customer Name} - MMYY"
 *
 * Example: "Ocean Hugger - Nobu Miami - 1225" (December 2025)
 *
 * Features:
 * - Principal name first, then customer name
 * - Uses MMYY format (month as 2 digits, year as 2 digits)
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
 * Format date as MMYY (month and year)
 * @param date - Date to format
 * @returns String in MMYY format (e.g., "1225" for December 2025)
 */
export function formatMonthYear(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 01-12
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  return `${month}${year}`;
}

/**
 * Generate an opportunity name from principal, customer, and date
 *
 * @param params - Principal name, customer name, and optional date (defaults to today)
 * @returns Generated name string, or empty string if insufficient data
 */
export function generateOpportunityName(params: OpportunityNameParams): string {
  const { customerName, principalName, date = new Date() } = params;

  const parts: string[] = [];

  // Add principal name FIRST if available (check trimmed value is not empty)
  const trimmedPrincipal = principalName?.trim();
  if (trimmedPrincipal) {
    parts.push(trimmedPrincipal);
  }

  // Add customer name SECOND if available (check trimmed value is not empty)
  const trimmedCustomer = customerName?.trim();
  if (trimmedCustomer) {
    parts.push(trimmedCustomer);
  }

  // Return empty string if both customer and principal are missing/empty after trimming
  if (parts.length === 0) {
    return "";
  }

  // Add month and year in MMYY format
  const monthYear = formatMonthYear(date);
  parts.push(monthYear);

  // Join parts with " - " separator
  let name = parts.join(" - ");

  // Truncate to 200 characters if needed
  if (name.length > 200) {
    name = name.substring(0, 197) + "...";
  }

  return name;
}
