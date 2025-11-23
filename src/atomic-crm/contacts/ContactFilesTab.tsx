import { FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Contact } from "../types";

interface ContactFilesTabProps {
  record: Contact;
  mode: "view" | "edit";
}

/**
 * Files tab for ContactSlideOver.
 *
 * Placeholder component for file attachments feature.
 * Future implementation will support file upload, preview, and management.
 */
export function ContactFilesTab({ record: _record, mode: _mode }: ContactFilesTabProps) {
  return (
    <Card>
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <FileIcon className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">File Attachments Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This feature will allow you to upload and manage files associated with this contact,
          including documents, images, and other attachments.
        </p>
      </CardContent>
    </Card>
  );
}
