/**
 * Contact display formatters
 *
 * Local formatters for ContactList. These wrap the shared utilities
 * and can be used directly in FunctionField render props.
 */

import {
  formatFullName as sharedFormatFullName,
  formatRoleAndDept as sharedFormatRoleAndDept,
} from "../utils/formatters";

// Re-export for local use
export const formatFullName = sharedFormatFullName;
export const formatRoleAndDept = sharedFormatRoleAndDept;
