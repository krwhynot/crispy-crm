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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { contactSchema } from "@/atomic-crm/validation/contacts";
import { z } from "zod";
import { getAvailableFieldsWithLabels } from "./columnAliases";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";
import type { DataQualityDecisions } from "./contactImport.types";

// Re-export DataQualityDecisions for backward compatibility
export type { DataQualityDecisions } from "./contactImport.types";

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
  sampleRows: unknown[];
  validCount: number;
  skipCount: number;
  totalRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  newOrganizations: string[];
  newTags: string[];
  hasErrors: boolean;
  lowConfidenceMappings: number;
  // Data quality analysis
  organizationsWithoutContacts: Array<{ organization_name: string; row: number }>;
  contactsWithoutContactInfo: Array<{ name: string; organization_name: string; row: number }>;
}

interface ContactImportPreviewProps {
  preview: PreviewData;
  onContinue: (decisions: DataQualityDecisions) => void;
  onCancel: () => void;
  onRemap?: () => void; // Phase 2 feature
  onMappingChange?: (csvHeader: string, targetField: string | null) => void;
  userOverrides?: Map<string, string | null>;
}

export function ContactImportPreview({
  preview,
  onContinue,
  onCancel,
  onRemap,
  onMappingChange,
  userOverrides,
}: ContactImportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState({
    organizations: false,
    tags: false,
    errors: false,
    warnings: false,
    sampleData: false,
    organizationsWithoutContacts: false,
    contactsWithoutContactInfo: false,
    skippedColumns: false,
  });

  // Data quality decisions state
  const [dataQualityDecisions, setDataQualityDecisions] = useState<DataQualityDecisions>({
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get confidence icon for mapping
  const _getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    } else if (confidence >= 0.5) {
      return <AlertCircle className="h-4 w-4 text-warning" />;
    } else {
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
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

  // Split mappings into mapped and skipped for better UX
  const mappedColumns = preview.mappings.filter((m) => m.target !== null);
  const skippedColumns = preview.mappings.filter((m) => m.target === null);

  // Get available fields for dropdown
  const availableFieldOptions = getAvailableFieldsWithLabels();

  // Detect duplicate field mappings
  const targetFieldCounts = new Map<string, number>();
  const duplicateTargets = new Set<string>();

  preview.mappings.forEach((mapping) => {
    if (mapping.target && mapping.target !== "(ignored - no matching field)") {
      const count = targetFieldCounts.get(mapping.target) || 0;
      targetFieldCounts.set(mapping.target, count + 1);

      if (count + 1 > 1) {
        duplicateTargets.add(mapping.target);
      }
    }
  });

  const hasDuplicates = duplicateTargets.size > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Alert */}
      <Alert variant={preview.hasErrors ? "destructive" : "default"} className="mb-2">
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
                <span className="flex items-center gap-1 text-warning">
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

      {/* Duplicate Mappings Error */}
      {hasDuplicates && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Duplicate Field Mappings Detected</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <p>
                Multiple CSV columns cannot be mapped to the same CRM field. Please fix the
                following duplicates:
              </p>
              <ul className="list-disc list-inside">
                {Array.from(duplicateTargets).map((target) => (
                  <li key={target}>
                    <strong>{target}</strong> is mapped {targetFieldCounts.get(target)} times
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Column Mappings Card - Show only mapped columns */}
      {mappedColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mappings</CardTitle>
            <CardDescription>
              {mappedColumns.length} CSV column{mappedColumns.length !== 1 ? "s" : ""} will be
              imported
              {skippedColumns.length > 0 &&
                ` • ${skippedColumns.length} column${skippedColumns.length !== 1 ? "s" : ""} will be skipped`}
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
                  <TableHead>Sample Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedColumns.map((mapping, index) => {
                  // Determine if this mapping is a user override
                  const isUserOverride = userOverrides?.has(mapping.source);

                  // Get the actual value to display (handle full name marker)
                  // Use special marker for "no mapping" to avoid empty string (Radix UI doesn't allow empty values)
                  const displayValue =
                    mapping.target === "first_name + last_name (will be split)"
                      ? FULL_NAME_SPLIT_MARKER
                      : mapping.target || "__no_mapping__";

                  return (
                    <TableRow key={index} className={isUserOverride ? "bg-primary-subtle" : ""}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {mapping.source}
                        {isUserOverride && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Custom
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="h-3 w-3 mx-auto text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        {onMappingChange ? (
                          <Select
                            value={displayValue}
                            onValueChange={(value) => {
                              // Convert special marker back to null for "no mapping"
                              onMappingChange(
                                mapping.source,
                                value === "__no_mapping__" ? null : value
                              );
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="(No mapping)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__no_mapping__">(No mapping)</SelectItem>
                              {availableFieldOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs">
                            {mapping.target}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {mapping.sampleValue || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Skipped Columns - Collapsible */}
      {skippedColumns.length > 0 && (
        <Collapsible open={expandedSections.skippedColumns}>
          <Card className="border-muted">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("skippedColumns")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-muted-foreground">Skipped Columns</CardTitle>
                    <Badge variant="secondary">{skippedColumns.length}</Badge>
                  </div>
                  {expandedSections.skippedColumns ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  These CSV columns don't match any CRM fields and will be ignored
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CSV Column</TableHead>
                      <TableHead>Sample Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skippedColumns.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {mapping.source}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {mapping.sampleValue || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

      {/* New Organizations */}
      {preview.newOrganizations.length > 0 && (
        <Collapsible open={expandedSections.organizations}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("organizations")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <CardTitle>New Organizations</CardTitle>
                    <Badge variant="secondary">{preview.newOrganizations.length}</Badge>
                  </div>
                  {expandedSections.organizations ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>These organizations will be created automatically</CardDescription>
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

      {/* Validation Errors */}
      {preview.errors.length > 0 && (
        <Collapsible open={expandedSections.errors}>
          <Card className="border-destructive/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("errors")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-destructive">Validation Errors</CardTitle>
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
                      className="flex items-start gap-2 text-sm p-2 bg-destructive/10 rounded"
                    >
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {error.row}</span>
                        {error.field && (
                          <span className="text-muted-foreground"> ({error.field})</span>
                        )}: {error.message}
                      </div>
                    </div>
                  ))}
                  {preview.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center pt-2">
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
          <Card className="border-warning/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection("warnings")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <CardTitle className="text-warning">Warnings</CardTitle>
                    <Badge variant="outline" className="border-warning text-warning">
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
                      className="flex items-start gap-2 text-sm p-2 bg-warning/10 rounded"
                    >
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {warning.row}</span>
                        {warning.field && <span className="text-muted-foreground"> ({warning.field})</span>}
                        : {warning.message}
                      </div>
                    </div>
                  ))}
                  {preview.warnings.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      ... and {preview.warnings.length - 10} more warnings
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Data Quality Decision: Organizations Without Contacts */}
      {preview.organizationsWithoutContacts && preview.organizationsWithoutContacts.length > 0 && (
        <Collapsible open={expandedSections.organizationsWithoutContacts}>
          <Card className="border-primary/50">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("organizationsWithoutContacts")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-primary">
                      Organizations Without Contact Person
                    </CardTitle>
                    <Badge variant="outline" className="border-primary text-primary">
                      {preview.organizationsWithoutContacts.length}
                    </Badge>
                  </div>
                  {expandedSections.organizationsWithoutContacts ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  CSV rows with organization names but no contact person
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>What happens if I import these?</AlertTitle>
                  <AlertDescription>
                    A placeholder contact named "General Contact" will be created for each
                    organization. This allows you to maintain organizational records even without
                    specific contact details.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-orgs-without-contacts"
                    checked={dataQualityDecisions.importOrganizationsWithoutContacts}
                    onCheckedChange={(checked) =>
                      setDataQualityDecisions((prev) => ({
                        ...prev,
                        importOrganizationsWithoutContacts: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor="import-orgs-without-contacts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Create placeholder contacts for these{" "}
                    {preview.organizationsWithoutContacts.length} organizations
                  </Label>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.organizationsWithoutContacts.slice(0, 20).map((org, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-primary/10 rounded"
                    >
                      <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{org.organization_name}</span>
                        <span className="text-muted-foreground"> (Row {org.row})</span>
                      </div>
                    </div>
                  ))}
                  {preview.organizationsWithoutContacts.length > 20 && (
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      ... and {preview.organizationsWithoutContacts.length - 20} more
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Data Quality Decision: Contacts Without Contact Info */}
      {preview.contactsWithoutContactInfo && preview.contactsWithoutContactInfo.length > 0 && (
        <Collapsible open={expandedSections.contactsWithoutContactInfo}>
          <Card className="border-warning/50">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection("contactsWithoutContactInfo")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-warning" />
                    <CardTitle className="text-warning">
                      Contacts Without Email or Phone
                    </CardTitle>
                    <Badge variant="outline" className="border-warning text-warning">
                      {preview.contactsWithoutContactInfo.length}
                    </Badge>
                  </div>
                  {expandedSections.contactsWithoutContactInfo ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>Contacts missing both email and phone information</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Limited Usefulness</AlertTitle>
                  <AlertDescription>
                    These contacts have no email or phone number, which significantly limits their
                    value in a CRM. You can still import them, but you won't be able to contact them
                    through standard channels.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-contacts-without-info"
                    checked={dataQualityDecisions.importContactsWithoutContactInfo}
                    onCheckedChange={(checked) =>
                      setDataQualityDecisions((prev) => ({
                        ...prev,
                        importContactsWithoutContactInfo: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor="import-contacts-without-info"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Import these {preview.contactsWithoutContactInfo.length} contacts anyway
                  </Label>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.contactsWithoutContactInfo.slice(0, 20).map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-warning/10 rounded"
                    >
                      <User className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{contact.name}</span>
                        {contact.organization_name && (
                          <span className="text-muted-foreground"> at {contact.organization_name}</span>
                        )}
                        <span className="text-muted-foreground"> (Row {contact.row})</span>
                      </div>
                    </div>
                  ))}
                  {preview.contactsWithoutContactInfo.length > 20 && (
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      ... and {preview.contactsWithoutContactInfo.length - 20} more
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
          onClick={() => onContinue(dataQualityDecisions)}
          disabled={preview.validCount === 0 || hasDuplicates}
        >
          Continue Import ({preview.validCount} contacts)
        </Button>
      </DialogFooter>
    </div>
  );
}

export default ContactImportPreview;
