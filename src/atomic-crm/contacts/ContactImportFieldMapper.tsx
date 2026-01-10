import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAvailableFieldsWithLabels } from "./columnAliases";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";
import type { ColumnMapping } from "./ContactImportPreview";

interface ContactImportFieldMapperProps {
  mappedColumns: ColumnMapping[];
  skippedColumns: ColumnMapping[];
  userOverrides?: Map<string, string | null>;
  onMappingChange?: (csvHeader: string, targetField: string | null) => void;
}

export function ContactImportFieldMapper({
  mappedColumns,
  skippedColumns,
  userOverrides,
  onMappingChange,
}: ContactImportFieldMapperProps) {
  const availableFieldOptions = getAvailableFieldsWithLabels();

  if (mappedColumns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mappings</CardTitle>
        <CardDescription>
          {mappedColumns.length} CSV column{mappedColumns.length !== 1 ? "s" : ""} will be imported
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
              const isUserOverride = userOverrides?.has(mapping.source);

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
  );
}
