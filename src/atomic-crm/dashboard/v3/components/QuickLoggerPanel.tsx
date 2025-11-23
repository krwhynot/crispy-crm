import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuickLogForm } from "./QuickLogForm";

interface QuickLoggerPanelProps {
  onRefresh?: () => void;
}

export function QuickLoggerPanel({ onRefresh }: QuickLoggerPanelProps) {
  const [isLogging, setIsLogging] = useState(false);

  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Log Activity</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Quick capture for calls, meetings, and notes
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-4">
        {!isLogging ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Capture your customer interactions as they happen
            </p>
            <Button onClick={() => setIsLogging(true)} className="h-11 gap-2">
              <Plus className="h-4 w-4" />
              New Activity
            </Button>
          </div>
        ) : (
          <QuickLogForm
            onComplete={() => setIsLogging(false)}
            onRefresh={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
