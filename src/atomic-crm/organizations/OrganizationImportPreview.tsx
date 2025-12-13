import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Copy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getAvailableFieldsWithLabels } from "./organizationColumnAliases";
import type { RawCSVRow } from "./types";

// Types for preview data
export interface ColumnMapping {
  source: string;
  target: string | null;
  confidence: number;
  sampleValue?: string;
}

export interface DuplicateGroup {
  indices: number[];
  name: string;
  count: number;
}

export interface PreviewData {
  mappings: ColumnMapping[];
  sampleRows: RawCSVRow[];
  validCount: number;
  totalRows: number;
  newTags: string[];
  duplicates?: DuplicateGroup[];
  lowConfidenceMappings: number;
  missingNameCount?: number;
}

export interface DataQualityDecisions {
  skipDuplicates: boolean;
}

interface OrganizationImportPreviewProps {
  preview: PreviewData;
  onContinue: (decisions: DataQualityDecisions) => void;
  onCancel: () => void;
  onMappingChange?: (csvHeader: string, targetField: string | null) => void;
  userOverrides?: Map<string, string | null>;
}

export function OrganizationImportPreview({
  preview,
  onContinue,
  onCancel,
  onMappingChange,
  userOverrides,
}: OrganizationImportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState({
    mappings: preview.lowConfidenceMappings > 0, // Auto-expand if low confidence
    duplicates: (preview.duplicates?.length || 0) > 0, // Auto-expand if duplicates found
    tags: false,
    sampleData: false,
  });

  const [dataQualityDecisions, setDataQualityDecisions] = useState<DataQualityDecisions>({
    skipDuplicates: true, // Default to skipping duplicates
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleContinue = () => {
    onContinue(dataQualityDecisions);
  };

  const availableFields = getAvailableFieldsWithLabels();
  // Calculate actual duplicate entries (excluding first occurrence of each name)
  const duplicateCount =
    preview.duplicates?.reduce((sum, group) => sum + Math.max(0, group.count - 1), 0) || 0;

  // Calculate expected import count based on skip duplicates decision
  // Clamp to prevent negative values
  const expectedImportCount = Math.max(
    0,
    dataQualityDecisions.skipDuplicates ? preview.validCount - duplicateCount : preview.validCount
  );

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
                <strong>{expectedImportCount}</strong> organizations will be imported
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
            {duplicateCount > 0 && (
              <div className="flex items-center gap-4 text-sm text-warning">
                <span className="flex items-center gap-1">
                  <Copy className="h-3 w-3" />
                  {dataQualityDecisions.skipDuplicates
                    ? `${duplicateCount} duplicate ${duplicateCount === 1 ? "entry" : "entries"} will be skipped`
                    : `${duplicateCount} duplicate ${duplicateCount === 1 ? "entry" : "entries"} detected (will be imported)`}
                </span>
              </div>
            )}
            {preview.missingNameCount && preview.missingNameCount > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {preview.missingNameCount} row{preview.missingNameCount === 1 ? "" : "s"} missing
                  required 'name' will be skipped
                </span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Duplicates are detected by exact name match (case-insensitive, trimmed)
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Column Mappings */}
      {preview.lowConfidenceMappings > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review Column Mappings</AlertTitle>
          <AlertDescription>
            {preview.lowConfidenceMappings} column{preview.lowConfidenceMappings > 1 ? "s" : ""}{" "}
            could not be mapped automatically. Please review and adjust the mappings below.
          </AlertDescription>
        </Alert>
      )}

      <Collapsible open={expandedSections.mappings}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("mappings")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Column Mappings</CardTitle>
                  {preview.lowConfidenceMappings > 0 && (
                    <Badge variant="destructive">{preview.lowConfidenceMappings} need review</Badge>
                  )}
                </div>
                {expandedSections.mappings ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <CardDescription>How CSV columns map to organization fields</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Maps To</TableHead>
                    <TableHead>Sample Value</TableHead>
                    <TableHead className="w-20">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.mappings.map((mapping, index) => {
                    const currentMapping =
                      userOverrides?.get(mapping.source) !== undefined
                        ? userOverrides.get(mapping.source)
                        : mapping.target;

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{mapping.source}</TableCell>
                        <TableCell>
                          {onMappingChange ? (
                            <Select
                              value={currentMapping || "unmapped"}
                              onValueChange={(value) =>
                                onMappingChange(mapping.source, value === "unmapped" ? null : value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unmapped">
                                  <span className="text-muted-foreground">Skip this column</span>
                                </SelectItem>
                                {availableFields.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span>{currentMapping || "Unmapped"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mapping.sampleValue || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mapping.confidence >= 0.8
                                ? "default"
                                : mapping.confidence >= 0.5
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {Math.round(mapping.confidence * 100)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Duplicates Warning */}
      {preview.duplicates && preview.duplicates.length > 0 && (
        <Collapsible open={expandedSections.duplicates}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("duplicates")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <CardTitle>Duplicate Organizations</CardTitle>
                    <Badge variant="secondary">
                      {preview.duplicates.length} name{preview.duplicates.length > 1 ? "s" : ""},{" "}
                      {duplicateCount} duplicate{duplicateCount > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {expandedSections.duplicates ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  {preview.duplicates.length} organization name
                  {preview.duplicates.length > 1 ? "s appear" : " appears"} multiple times (
                  {duplicateCount} total duplicate {duplicateCount === 1 ? "entry" : "entries"})
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {preview.duplicates.slice(0, 10).map((group, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-warning" />
                        <span className="font-medium">{group.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {group.count} occurrences (rows: {group.indices.slice(0, 3).join(", ")}
                        {group.indices.length > 3 ? "..." : ""})
                      </Badge>
                    </div>
                  ))}
                  {preview.duplicates.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {preview.duplicates.length - 10} more duplicate groups
                    </p>
                  )}

                  {/* Data Quality Decision for Duplicates */}
                  <div className="mt-4 p-3 border rounded-md bg-background">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="skip-duplicates"
                        checked={dataQualityDecisions.skipDuplicates}
                        onCheckedChange={(checked) =>
                          setDataQualityDecisions({
                            ...dataQualityDecisions,
                            skipDuplicates: checked as boolean,
                          })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="skip-duplicates"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Skip duplicate organizations
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Keep only the first occurrence of each organization name. Later
                          occurrences will be completely ignored (no data merging). Recommended to
                          avoid creating duplicate records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Sample Data Preview */}
      <Collapsible open={expandedSections.sampleData}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("sampleData")}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sample Data Preview</CardTitle>
                  <CardDescription>First 5 organizations after transformation</CardDescription>
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
                            <CheckCircle className="h-3 w-3 text-success" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.organization_type || "prospect"}
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
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("tags")}>
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
                <CardDescription>These tags will be created automatically</CardDescription>
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
        <Button variant="default" onClick={handleContinue} disabled={expectedImportCount === 0}>
          Continue Import ({expectedImportCount} organizations)
        </Button>
      </DialogFooter>
    </div>
  );
}

export default OrganizationImportPreview;
