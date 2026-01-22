import { Button } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDown } from "lucide-react";
import { downloadCSV } from "ra-core";

export const ContactExportTemplateButton = () => {
  const handleDownloadTemplate = () => {
    // Canonical headers matching ContactImportSchema from useContactImport.tsx
    const headers = [
      "first_name",
      "last_name",
      "gender",
      "title",
      "organization_name", // Primary organization (mandatory)
      "organization_role", // Role at organization
      "email_work",
      "email_home",
      "email_other",
      "phone_work",
      "phone_home",
      "phone_other",
      "first_seen",
      "last_seen",
      "tags",
      "linkedin_url",
    ];

    // Sample data row with helpful examples
    const sampleRow = [
      "John", // first_name
      "Doe", // last_name
      "male", // gender (male/female/other)
      "Sales Executive", // title
      "Acme Corporation", // organization_name (REQUIRED)
      "decision_maker", // organization_role (decision_maker/influencer/end_user)
      "john.doe@company.com", // email_work
      "john.personal@gmail.com", // email_home
      "john.other@email.com", // email_other
      "555-0100", // phone_work
      "555-0101", // phone_home
      "555-0102", // phone_other
      "2024-01-01T00:00:00Z", // first_seen (ISO format)
      "2024-12-01T00:00:00Z", // last_seen (ISO format)
      "customer, vip, newsletter", // tags (comma-separated)
      "https://linkedin.com/in/johndoe", // linkedin_url
    ];

    // Combine headers and sample row
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");

    // Download the CSV template
    downloadCSV(csvContent, "contacts_import_template");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AdminButton
          variant="outline"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileDown />
          Template
        </AdminButton>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="space-y-2">
          <p className="font-semibold">Download Import Template</p>
          <p className="text-xs">
            Get a CSV template with the correct column headers and a sample row. The
            organization_name field is required for all contacts.
          </p>
          <div className="text-xs space-y-1 border-t pt-2">
            <p>
              <strong>Date format:</strong> ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
            </p>
            <p>
              <strong>Tags:</strong> Comma-separated list
            </p>
            <p>
              <strong>Gender:</strong> male, female, or other
            </p>
            <p>
              <strong>Role:</strong> decision_maker, influencer, or end_user
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
