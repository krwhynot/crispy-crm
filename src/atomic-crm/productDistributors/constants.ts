export const PRODUCT_DISTRIBUTOR_STATUS_CHOICES = [
  { id: "pending", name: "Pending" },
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
] as const;

export type ProductDistributorStatus = "pending" | "active" | "inactive";
