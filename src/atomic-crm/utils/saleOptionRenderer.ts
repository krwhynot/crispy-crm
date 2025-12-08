import type { Sale } from "../types";

/**
 * Renders a Sale record for dropdown display.
 * Shows "FirstName LastName", falls back to email if no name, then "--" as last resort.
 */
export const saleOptionRenderer = (choice: Sale): string =>
  choice?.first_name || choice?.last_name
    ? `${choice.first_name || ""} ${choice.last_name || ""}`.trim()
    : choice?.email || "--";
