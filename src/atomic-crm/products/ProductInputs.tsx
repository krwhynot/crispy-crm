import { TabbedFormInputs } from "@/components/ra-wrappers/tabbed-form";
import { ProductDetailsInputTab } from "./ProductDetailsInputTab";
import { ProductDistributionTab } from "./ProductDistributionTab";

export const ProductInputs = () => {
  const tabs = [
    {
      key: "details",
      label: "Product Details",
      fields: ["name", "principal_id", "category", "status", "description"],
      content: <ProductDetailsInputTab />,
    },
    {
      key: "distribution",
      label: "Distribution",
      fields: ["distributor_ids", "product_distributors"],
      content: <ProductDistributionTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="details" />;
};
