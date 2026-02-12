import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export interface NotFoundProps {
  resource?: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

export function NotFound({ resource, backTo, backLabel, className }: NotFoundProps) {
  const description = resource
    ? `This ${resource} doesn't exist or you don't have access to it.`
    : "The record you're looking for doesn't exist or you don't have access to it.";

  const resolvedBackLabel = backLabel ?? (resource ? `Back to ${resource}s` : "Go Back");

  const handleBack = () => {
    if (backTo) {
      window.location.href = backTo;
    } else {
      window.history.back();
    }
  };

  const handleHome = () => {
    window.location.href = "/";
  };

  return (
    <Card className={cn("mx-auto mt-16 max-w-md", className)}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div role="status" className="flex flex-col items-center justify-center gap-2">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Record not found</h3>
            <p className="max-w-md text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="mt-6 flex flex-row gap-2">
            <Button variant="outline" className="h-11" onClick={handleBack}>
              {resolvedBackLabel}
            </Button>
            <Button className="h-11" onClick={handleHome}>
              Go Home
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
