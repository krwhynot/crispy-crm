import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ProductGeneralTab } from "./ProductGeneralTab";
import { ProductRelationshipsTab } from "./ProductRelationshipsTab";
import { ProductClassificationTab } from "./ProductClassificationTab";

export const ProductInputs = () => {
  const tabs = [
    {
      key: 'general',
      label: 'General',
      fields: ['name', 'sku', 'description'],
      content: <ProductGeneralTab />,
    },
    {
      key: 'relationships',
      label: 'Relationships',
      fields: ['principal_id', 'distributor_id'],
      content: <ProductRelationshipsTab />,
    },
    {
      key: 'classification',
      label: 'Classification',
      fields: ['category', 'status'],
      content: <ProductClassificationTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
};