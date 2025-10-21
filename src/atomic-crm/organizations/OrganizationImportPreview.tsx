import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DialogFooter } from "@/components/ui/dialog";

// Types for preview data
export interface PreviewData {
  sampleRows: any[];
  validCount: number;
  totalRows: number;
  newTags: string[];
}

interface OrganizationImportPreviewProps {
  preview: PreviewData;
  onContinue: () => void;
  onCancel: () => void;
}

export function OrganizationImportPreview({
  preview,
  onContinue,
  onCancel,
}: OrganizationImportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState({
    tags: false,
    sampleData: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Alert */}
      <Alert variant="default" className="mb-2">
        <AlertTitle className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Ready to Import
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <strong>{preview.validCount}</strong> organizations will be imported
              </span>
            </div>
            {preview.newTags.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {preview.newTags.length} new tags
                </span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Sample Data Preview */}
      <Collapsible open={expandedSections.sampleData}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection("sampleData")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sample Data Preview</CardTitle>
                  <CardDescription>
                    First 5 organizations after transformation
                  </CardDescription>
                </div>
                {expandedSections.sampleData ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
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
                      <TableHead>Type</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>City</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.sampleRows.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index + 1}
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.organization_type || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{row.website || "-"}</TableCell>
                        <TableCell>{row.city || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* New Tags */}
      {preview.newTags.length > 0 && (
        <Collapsible open={expandedSections.tags}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("tags")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <CardTitle>New Tags</CardTitle>
                    <Badge variant="secondary">{preview.newTags.length}</Badge>
                  </div>
                  {expandedSections.tags ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  These tags will be created automatically
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {preview.newTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Actions */}
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={onContinue}
          disabled={preview.validCount === 0}
        >
          Continue Import ({preview.validCount} organizations)
        </Button>
      </DialogFooter>
    </div>
  );
}

export default OrganizationImportPreview;
