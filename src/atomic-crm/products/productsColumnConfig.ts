/**
 * Products Column Configuration
 *
 * Maps column header components for use in ProductList.
 * Separated from ProductsDatagridHeader.tsx to satisfy react-refresh/only-export-components
 * lint rule (files with React components should only export components).
 */

import {
  ProductNameHeader,
  ProductCategoryHeader,
  ProductStatusHeader,
} from "./ProductsDatagridHeader";

/**
 * All product column headers exported for use in ProductList
 */
export const ProductColumnHeaders = {
  Name: ProductNameHeader,
  Category: ProductCategoryHeader,
  Status: ProductStatusHeader,
};
