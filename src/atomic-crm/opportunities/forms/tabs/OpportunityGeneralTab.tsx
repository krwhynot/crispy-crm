import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import { useAutoGenerateName } from "../../hooks/useAutoGenerateName";
import { NamingConventionHelp } from "../NamingConventionHelp";

interface OpportunityGeneralTabProps {
  mode: "create" | "edit";
}

export const OpportunityGeneralTab = ({ mode }: OpportunityGeneralTabProps) => {
  const { regenerate, isLoading, canGenerate } = useAutoGenerateName(mode);

  return (
    <div className="space-y-2">
      <div className="relative">
        <TextInput
          source="name"
          label="Opportunity name *"
          helperText={false}
          data-tutorial="opp-name"
          InputProps={{
            endAdornment: (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={regenerate}
                      disabled={!canGenerate || isLoading}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate name from customer and principal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ),
          }}
        />
        <div className="mt-2">
          <NamingConventionHelp />
        </div>
      </div>
      <TextInput source="description" label="Description" multiline rows={2} helperText={false} />
      <TextInput
        source="estimated_close_date"
        label="Expected Closing Date *"
        helperText={false}
        type="date"
        data-tutorial="opp-close-date"
      />
    </div>
  );
};
