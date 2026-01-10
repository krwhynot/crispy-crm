import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { contactSchema } from "@/atomic-crm/validation/contacts";
import { z } from "zod";

interface ContactImportPreviewTableProps {
  sampleRows: unknown[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ContactImportPreviewTable({
  sampleRows,
  isExpanded,
  onToggle,
}: ContactImportPreviewTableProps) {
  const validateSampleRows = () => {
    const validationResults = sampleRows.map((row, index) => {
      try {
        contactSchema.parse(row);
        return { row: index + 1, valid: true };
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          return {
            row: index + 1,
            valid: false,
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          };
        }
        return { row: index + 1, valid: false, errors: [] };
      }
    });

    return validationResults;
  };

  const sampleValidation = validateSampleRows();
  const validSamples = sampleValidation.filter((r) => r.valid).length;

  return (
    <Collapsible open={isExpanded}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer" onClick={onToggle}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sample Data Preview</CardTitle>
                <CardDescription>
                  First 5 rows after transformation ({validSamples}/5 valid)
                </CardDescription>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.slice(0, 5).map((row, index) => {
                    const validation = sampleValidation[index];
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index + 1}
                            {validation?.valid ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.name || `${row.first_name} ${row.last_name}`}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.email?.[0]?.email || "-"}
                        </TableCell>
                        <TableCell>{row.organization_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {validation?.valid ? "Valid" : "Has Issues"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
