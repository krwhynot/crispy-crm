import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ProductGeneralTab } from "./ProductGeneralTab";
import { ProductRelationshipsInputTab } from "./ProductRelationshipsInputTab";
import { ProductClassificationTab } from "./ProductClassificationTab";

export const ProductInputs = () => {
  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["name", "sku", "description"],
      content: <ProductGeneralTab />,
      dataTutorial: "product-tab-general",
    },
    {
      key: "relationships",
      label: "Relationships",
      fields: ["principal_id", "distributor_id"],
      content: <ProductRelationshipsInputTab />,
      dataTutorial: "product-tab-relationships",
    },
    {
      key: "classification",
      label: "Classification",
      fields: ["category", "status"],
      content: <ProductClassificationTab />,
      dataTutorial: "product-tab-classification",
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
};
