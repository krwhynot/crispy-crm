/**
 * Naming Convention Help Component
 *
 * Provides collapsible helper text with naming tips and examples
 * for opportunity names. Shows best practices and patterns.
 */

import * as React from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/admin/AdminButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const NamingConventionHelp: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-xs text-foreground/70 hover:text-foreground px-0"
        >
          <Lightbulb className="w-3 h-3" />
          {isOpen ? "Hide naming tips" : "Show naming tips"}
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </AdminButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground mb-2">💡 Naming Convention Tips</p>
            <p className="text-muted-foreground leading-relaxed">
              Opportunity names help you quickly identify deals at a glance. Use the auto-generate
              button to create names following the standard format, or customize them for specific
              situations.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Standard Format (Auto-Generated):</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>
                <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                  Customer Name - Principal Name - Q1 2025
                </code>
              </li>
              <li className="text-xs italic">Example: "Nobu Miami - Ocean Hugger - Q1 2025"</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Custom Name Examples:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li className="text-xs">
                <strong className="text-foreground">Program Name:</strong> "Roka Akor - Tuna Roll
                Program"
              </li>
              <li className="text-xs">
                <strong className="text-foreground">Trade Show Booth:</strong> "NRA Show 2025 - Blue
                Ribbon Sushi - Ocean Hugger"
              </li>
              <li className="text-xs">
                <strong className="text-foreground">Specific Product:</strong> "Nobu - Tombo Tuna
                Nigiri Launch"
              </li>
              <li className="text-xs">
                <strong className="text-foreground">Account Expansion:</strong> "Katsuya -
                Fishpeople - West Coast Rollout"
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Keep names concise (under 100
              characters) and include the customer and principal for easy filtering and reporting.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
