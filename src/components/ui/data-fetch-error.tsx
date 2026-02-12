import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export interface DataFetchErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DataFetchError({
  title = "Failed to load data",
  message,
  onRetry,
  className,
}: DataFetchErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-row items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {message && (
          <>
            <button
              type="button"
              className="self-start text-xs underline underline-offset-2 opacity-75 hover:opacity-100"
              onClick={() => setShowDetails((prev) => !prev)}
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
            {showDetails && (
              <pre className="mt-1 whitespace-pre-wrap break-words text-xs opacity-75">
                {message}
              </pre>
            )}
          </>
        )}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="h-11 shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
