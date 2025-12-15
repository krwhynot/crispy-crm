/**
 * Department choices for contact forms
 * Common organizational departments in food distribution
 */
export const DEPARTMENT_CHOICES = [
  { id: "senior_management", name: "Senior Management" },
  { id: "sales_management", name: "Sales Management" },
  { id: "district_management", name: "District Management" },
  { id: "area_sales", name: "Area Sales" },
  { id: "sales_specialist", name: "Sales Specialist" },
  { id: "sales_support", name: "Sales Support" },
  { id: "procurement", name: "Procurement" },
  { id: "operations", name: "Operations" },
  { id: "marketing", name: "Marketing" },
  { id: "finance", name: "Finance" },
  { id: "other", name: "Other" },
] as const;

export type Department = (typeof DEPARTMENT_CHOICES)[number]["id"];
