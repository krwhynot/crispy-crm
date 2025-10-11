import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const QuickAdd = () => {
  return (
    <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
      <div className="flex justify-around gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/contacts/create">
            <Plus className="w-4 h-4 mr-1" /> New Contact
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/opportunities/create">
            <Plus className="w-4 h-4 mr-1" /> New Opportunity
          </Link>
        </Button>
      </div>
    </Card>
  );
};
