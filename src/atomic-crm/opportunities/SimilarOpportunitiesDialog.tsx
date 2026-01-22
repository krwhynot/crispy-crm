/**
 * SimilarOpportunitiesDialog
 *
 * Displays a warning dialog when the user attempts to create an opportunity
 * with a name similar to existing opportunities. Uses Levenshtein distance
 * algorithm to detect near-matches (threshold: 3 edits).
 *
 * Follows design system:
 * - Semantic colors (text-muted-foreground, bg-warning, etc.)
 * - 44px minimum touch targets
 * - Desktop-first responsive design (lg: breakpoint)
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SimilarOpportunity } from "../../utils/levenshtein";
import { getOpportunityStageLabel, getOpportunityStageColor } from "./constants";

export interface SimilarOpportunitiesDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when user closes dialog (go back) */
  onClose: () => void;
  /** Callback when user confirms creation despite warning */
  onConfirm: () => void;
  /** The name the user is trying to create */
  proposedName: string;
  /** List of similar existing opportunities */
  similarOpportunities: SimilarOpportunity[];
  /** Whether the confirm action is loading */
  isLoading?: boolean;
}

/**
 * Get a human-readable similarity description based on edit distance
 */
function getSimilarityLabel(distance: number): string {
  if (distance === 1) return "Very Similar";
  if (distance === 2) return "Similar";
  return "Somewhat Similar";
}

/**
 * Get badge variant based on similarity (lower distance = higher severity)
 */
function getSimilarityVariant(distance: number): "destructive" | "warning" | "secondary" {
  if (distance === 1) return "destructive";
  if (distance === 2) return "warning";
  return "secondary";
}

export function SimilarOpportunitiesDialog({
  open,
  onClose,
  onConfirm,
  proposedName,
  similarOpportunities,
  isLoading = false,
}: SimilarOpportunitiesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Similar Opportunities Found
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            The opportunity name <strong className="text-foreground">"{proposedName}"</strong> is
            similar to {similarOpportunities.length} existing{" "}
            {similarOpportunities.length === 1 ? "opportunity" : "opportunities"}. Please review
            before proceeding to avoid duplicates.
          </DialogDescription>
        </DialogHeader>

        {/* Similar opportunities table */}
        <div className="max-h-64 overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead className="w-[20%]">Stage</TableHead>
                <TableHead className="w-[20%]">Principal</TableHead>
                <TableHead className="w-[20%] text-right">Similarity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {similarOpportunities.map((opp) => (
                <TableRow key={opp.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{opp.name}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-primary-foreground"
                      style={{
                        backgroundColor: getOpportunityStageColor(opp.stage),
                      }}
                    >
                      {getOpportunityStageLabel(opp.stage)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {opp.principal_organization_name || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getSimilarityVariant(opp.distance)}>
                      {getSimilarityLabel(opp.distance)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Help text */}
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> If this is a different opportunity, consider making the name more
          distinct (e.g., add a date, product name, or campaign identifier).
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 min-w-[120px]"
          >
            Go Back
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 min-w-[150px]"
          >
            {isLoading ? "Creating..." : "Create Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
