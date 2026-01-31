import { z } from "zod";

/**
 * Contact department validation schemas
 * For distributor staff classification
 */

// Contact department enum - for distributor staff classification
export const contactDepartmentSchema = z.enum([
  "senior_management",
  "sales_management",
  "district_management",
  "area_sales",
  "sales_specialist",
  "sales_support",
  "procurement",
]);
