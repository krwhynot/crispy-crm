import { Package } from "lucide-react";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { EmptyState } from "@/components/ui/empty-state";

export const ProductEmpty = () => {
  return (
    <EmptyState
      variant="card"
      icon={Package}
      title="No Products Yet"
      description="Start building your product catalog. Add your first product to track inventory and sales opportunities."
    >
      <div className="mt-6">
        <CreateButton label="Add First Product" />
      </div>
    </EmptyState>
  );
};
