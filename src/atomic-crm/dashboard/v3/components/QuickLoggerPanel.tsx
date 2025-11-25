import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

// Lazy load QuickLogForm - saves ~15-20KB from main dashboard chunk
// Only loaded when user clicks "New Activity"
const QuickLogForm = lazy(() => import("./QuickLogForm").then(m => ({ default: m.QuickLogForm })));

interface QuickLoggerPanelProps {
  onRefresh?: () => void;
}

/**
 * Skeleton fallback shown while QuickLogForm lazy loads
 * Matches the form structure for smooth loading transition
 */
function QuickLogFormSkeleton() {
  return (
    <div className="space-y-4" data-testid="quick-log-form-skeleton">
      {/* Activity Type section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" /> {/* "What happened?" heading */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" /> {/* Label */}
          <Skeleton className="h-11 w-full" /> {/* Select */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" /> {/* Label */}
          <Skeleton className="h-11 w-full" /> {/* Select */}
        </div>
      </div>

      {/* Who was involved section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" /> {/* "Who was involved?" heading */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" /> {/* Label */}
          <Skeleton className="h-11 w-full" /> {/* Combobox */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-11 w-full" /> {/* Combobox */}
        </div>
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" /> {/* Label */}
        <Skeleton className="h-24 w-full" /> {/* Textarea */}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-20" /> {/* Cancel */}
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" /> {/* Save & Close */}
          <Skeleton className="h-11 w-24" /> {/* Save & New */}
        </div>
      </div>
    </div>
  );
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
          <Suspense fallback={<QuickLogFormSkeleton />}>
            <QuickLogForm
              onComplete={() => setIsLogging(false)}
              onRefresh={onRefresh}
            />
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
}
