import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
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
import { contactSchema } from "@/atomic-crm/validation/contacts";
import { z } from "zod";

// Types for preview data
export interface ColumnMapping {
  source: string;
  target: string | null;
  confidence: number;
  sampleValue?: string;
}

export interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface PreviewData {
  mappings: ColumnMapping[];
  sampleRows: any[];
  validCount: number;
  skipCount: number;
  totalRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  newOrganizations: string[];
  newTags: string[];
  hasErrors: boolean;
  lowConfidenceMappings: number;
}

interface ContactImportPreviewProps {
  preview: PreviewData;
  onContinue: () => void;
  onCancel: () => void;
  onRemap?: () => void; // Phase 2 feature
}

export function ContactImportPreview({
  preview,
  onContinue,
  onCancel,
  onRemap,
}: ContactImportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState({
    organizations: false,
    tags: false,
    errors: false,
    warnings: false,
    sampleData: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get confidence icon for mapping
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (confidence >= 0.5) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Validate sample rows client-side
  const validateSampleRows = () => {
    const validationResults = preview.sampleRows.map((row, index) => {
      try {
        contactSchema.parse(row);
        return { row: index + 1, valid: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            row: index + 1,
            valid: false,
            errors: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
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
    <div className="flex flex-col gap-4">
      {/* Summary Alert */}
      <Alert
        variant={preview.hasErrors ? "destructive" : "default"}
        className="mb-2"
      >
        <AlertTitle className="flex items-center gap-2">
          {preview.hasErrors ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              Review Required
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Ready to Import
            </>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <strong>{preview.validCount}</strong> contacts will be imported
              </span>
              {preview.skipCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  <strong>{preview.skipCount}</strong> rows will be skipped
                </span>
              )}
            </div>
            {(preview.newOrganizations.length > 0 || preview.newTags.length > 0) && (
              <div className="flex items-center gap-4 text-sm">
                {preview.newOrganizations.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {preview.newOrganizations.length} new organizations
                  </span>
                )}
                {preview.newTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {preview.newTags.length} new tags
                  </span>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Column Mappings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Column Mappings</CardTitle>
          <CardDescription>
            How your CSV columns will map to CRM fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CSV Column</TableHead>
                <TableHead className="text-center w-12">
                  <ArrowRight className="h-4 w-4 mx-auto" />
                </TableHead>
                <TableHead>CRM Field</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead>Sample Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">
                    {mapping.source}
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-3 w-3 mx-auto text-gray-400" />
                  </TableCell>
                  <TableCell>
                    {mapping.target ? (
                      <Badge variant="outline" className="font-mono">
                        {mapping.target}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Skipped</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getConfidenceIcon(mapping.confidence)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                    {mapping.sampleValue || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                    First 5 rows after transformation ({validSamples}/5 valid)
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
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.sampleRows.slice(0, 5).map((row, index) => {
                      const validation = sampleValidation[index];
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {index + 1}
                              {validation?.valid ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-red-500" />
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

      {/* New Organizations */}
      {preview.newOrganizations.length > 0 && (
        <Collapsible open={expandedSections.organizations}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("organizations")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <CardTitle>New Organizations</CardTitle>
                    <Badge variant="secondary">
                      {preview.newOrganizations.length}
                    </Badge>
                  </div>
                  {expandedSections.organizations ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  These organizations will be created automatically
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {preview.newOrganizations.map((org, index) => (
                    <Badge key={index} variant="outline">
                      {org}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

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

      {/* Validation Errors */}
      {preview.errors.length > 0 && (
        <Collapsible open={expandedSections.errors}>
          <Card className="border-red-200">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("errors")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <CardTitle className="text-red-700">
                      Validation Errors
                    </CardTitle>
                    <Badge variant="destructive">{preview.errors.length}</Badge>
                  </div>
                  {expandedSections.errors ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  These rows cannot be imported due to validation errors
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {preview.errors.slice(0, 10).map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {error.row}</span>
                        {error.field && (
                          <span className="text-gray-600"> ({error.field})</span>
                        )}
                        : {error.message}
                      </div>
                    </div>
                  ))}
                  {preview.errors.length > 10 && (
                    <div className="text-sm text-gray-600 text-center pt-2">
                      ... and {preview.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Validation Warnings */}
      {preview.warnings.length > 0 && (
        <Collapsible open={expandedSections.warnings}>
          <Card className="border-yellow-200">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("warnings")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <CardTitle className="text-yellow-700">Warnings</CardTitle>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      {preview.warnings.length}
                    </Badge>
                  </div>
                  {expandedSections.warnings ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  These issues won't prevent import but should be reviewed
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {preview.warnings.slice(0, 10).map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-yellow-50 rounded"
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {warning.row}</span>
                        {warning.field && (
                          <span className="text-gray-600"> ({warning.field})</span>
                        )}
                        : {warning.message}
                      </div>
                    </div>
                  ))}
                  {preview.warnings.length > 10 && (
                    <div className="text-sm text-gray-600 text-center pt-2">
                      ... and {preview.warnings.length - 10} more warnings
                    </div>
                  )}
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
        {preview.lowConfidenceMappings > 0 && onRemap && (
          <Button variant="outline" onClick={onRemap}>
            Review Mappings ({preview.lowConfidenceMappings} uncertain)
          </Button>
        )}
        <Button
          variant="default"
          onClick={onContinue}
          disabled={preview.validCount === 0}
        >
          Continue Import ({preview.validCount} contacts)
        </Button>
      </DialogFooter>
    </div>
  );
}

export default ContactImportPreview;