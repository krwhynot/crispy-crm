import { Package } from "lucide-react";
import { CreateButton } from "@/components/admin/create-button";
import { Card, CardContent } from "@/components/ui/card";

export const ProductEmpty = () => {
  return (
    <Card className="max-w-md mx-auto mt-16 bg-card border border-border shadow-sm rounded-xl">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Start building your product catalog. Add your first product to track inventory,
          pricing, and sales opportunities.
        </p>
        <CreateButton label="Add First Product" />
      </CardContent>
    </Card>
  );
};