import { Package } from "lucide-react";
import {
  ProductDistributorListView,
  ProductDistributorCreateView,
  ProductDistributorEditView,
  ProductDistributorShowView,
} from "./resource";

/**
 * React Admin resource configuration for Product Distributors (DOT Numbers).
 * Separated from component definitions to satisfy react-refresh/only-export-components.
 */
const productDistributorsConfig = {
  list: ProductDistributorListView,
  edit: ProductDistributorEditView,
  create: ProductDistributorCreateView,
  show: ProductDistributorShowView,
  icon: Package,
  options: { label: "DOT Numbers" },
};

export default productDistributorsConfig;
