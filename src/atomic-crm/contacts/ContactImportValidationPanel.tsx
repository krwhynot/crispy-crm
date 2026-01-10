import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PreviewData, DataQualityDecisions } from "./ContactImportPreview";

interface ValidationSectionState {
  organizations: boolean;
  tags: boolean;
  errors: boolean;
  warnings: boolean;
  organizationsWithoutContacts: boolean;
  contactsWithoutContactInfo: boolean;
  skippedColumns: boolean;
}

interface ContactImportValidationPanelProps {
  preview: PreviewData;
  expandedSections: ValidationSectionState;
  dataQualityDecisions: DataQualityDecisions;
  onToggleSection: (section: keyof ValidationSectionState) => void;
  onDataQualityChange: (decisions: DataQualityDecisions) => void;
}

export function ContactImportValidationPanel({
  preview,
  expandedSections,
  dataQualityDecisions,
  onToggleSection,
  onDataQualityChange,
}: ContactImportValidationPanelProps) {
  const skippedColumns = preview.mappings.filter((m) => m.target === null);

  return (
    <>
      {skippedColumns.length > 0 && (
        <Collapsible open={expandedSections.skippedColumns}>
          <Card className="border-muted">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => onToggleSection("skippedColumns")}
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
                <div className="space-y-2">
                  {skippedColumns.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-muted-foreground">{mapping.source}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground max-w-[300px] truncate">
                        {mapping.sampleValue || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {preview.newOrganizations.length > 0 && (
        <Collapsible open={expandedSections.organizations}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => onToggleSection("organizations")}
              >
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

      {preview.newTags.length > 0 && (
        <Collapsible open={expandedSections.tags}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => onToggleSection("tags")}>
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

      {preview.errors.length > 0 && (
        <Collapsible open={expandedSections.errors}>
          <Card className="border-destructive/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => onToggleSection("errors")}>
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
                        )}
                        : {error.message}
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

      {preview.warnings.length > 0 && (
        <Collapsible open={expandedSections.warnings}>
          <Card className="border-warning/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer" onClick={() => onToggleSection("warnings")}>
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
                        {warning.field && (
                          <span className="text-muted-foreground"> ({warning.field})</span>
                        )}
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

      {preview.organizationsWithoutContacts && preview.organizationsWithoutContacts.length > 0 && (
        <Collapsible open={expandedSections.organizationsWithoutContacts}>
          <Card className="border-primary/50">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => onToggleSection("organizationsWithoutContacts")}
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
                      onDataQualityChange({
                        ...dataQualityDecisions,
                        importOrganizationsWithoutContacts: checked === true,
                      })
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

      {preview.contactsWithoutContactInfo && preview.contactsWithoutContactInfo.length > 0 && (
        <Collapsible open={expandedSections.contactsWithoutContactInfo}>
          <Card className="border-warning/50">
            <CollapsibleTrigger asChild>
              <CardHeader
                className="cursor-pointer"
                onClick={() => onToggleSection("contactsWithoutContactInfo")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-warning" />
                    <CardTitle className="text-warning">Contacts Without Email or Phone</CardTitle>
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
                      onDataQualityChange({
                        ...dataQualityDecisions,
                        importContactsWithoutContactInfo: checked === true,
                      })
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
                          <span className="text-muted-foreground">
                            {" "}
                            at {contact.organization_name}
                          </span>
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
    </>
  );
}
