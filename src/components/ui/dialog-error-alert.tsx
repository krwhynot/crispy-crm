import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogErrorAlertProps {
  message: string | null;
  className?: string;
}

export function DialogErrorAlert({ message, className }: DialogErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
