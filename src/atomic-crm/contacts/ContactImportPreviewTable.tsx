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
import {
  validateContactImportRow,
  type ImportContactInput,
} from "@/atomic-crm/validation/contacts";

/**
 * Extended type for preview display - includes computed fields
 * from CSV transformation that aren't in the import schema
 */
interface ImportPreviewRow extends Partial<ImportContactInput> {
  name?: string;
  email?: Array<{ value?: string; email?: string }>;
}

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
    return sampleRows.map((row, index) => validateContactImportRow(row, index));
  };

  const sampleValidation = validateSampleRows();
  const validSamples = sampleValidation.filter((r) => r.valid).length;

  return (
    <Collapsible open={isExpanded}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center justify-between w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              aria-expanded={isExpanded}
              aria-controls="import-preview-content"
            >
              <div>
                <CardTitle>Sample Data Preview</CardTitle>
                <CardDescription>
                  First 5 rows after transformation ({validSamples}/5 valid)
                </CardDescription>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent id="import-preview-content">
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
                  {sampleRows.slice(0, 5).map((rawRow, index) => {
                    const row = rawRow as ImportPreviewRow;
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
                        <TableCell>
                          {row.name || `${row.first_name ?? ""} ${row.last_name ?? ""}`}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.email?.[0]?.email ?? row.email?.[0]?.value ?? "-"}
                        </TableCell>
                        <TableCell>{row.organization_name ?? "-"}</TableCell>
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
