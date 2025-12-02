import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { MessageCircle, Package, Phone, Users, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";

// Lazy load QuickLogForm - saves ~15-20KB from main dashboard chunk
const QuickLogForm = lazy(() =>
  import("./QuickLogForm").then((m) => ({ default: m.QuickLogForm }))
);

// Storage key for mobile draft persistence (separate from desktop FAB)
const MOBILE_DRAFT_STORAGE_KEY = "mobile-quick-action-draft";

// Debounce delay for saving drafts (ms)
const DRAFT_SAVE_DEBOUNCE_MS = 500;

// Draft expires after 24 hours
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Draft state stored in localStorage
 * Includes timestamp for expiry logic
 */
interface MobileDraft {
  formData: Partial<ActivityLogInput>;
  savedAt: number;
}

/**
 * Load draft from localStorage with expiry check
 */
function loadMobileDraft(): Partial<ActivityLogInput> | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(MOBILE_DRAFT_STORAGE_KEY);
    if (!stored) return null;

    const draft: MobileDraft = JSON.parse(stored);

    // Check if draft has expired
    if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(MOBILE_DRAFT_STORAGE_KEY);
      return null;
    }

    return draft.formData;
  } catch {
    // Invalid JSON or structure, clear it
    localStorage.removeItem(MOBILE_DRAFT_STORAGE_KEY);
    return null;
  }
}

/**
 * Save draft to localStorage with timestamp
 */
function saveMobileDraft(formData: Partial<ActivityLogInput>): void {
  if (typeof window === "undefined") return;

  // Don't save empty drafts
  const hasContent =
    formData.notes || formData.contactId || formData.organizationId || formData.opportunityId;

  if (!hasContent) {
    localStorage.removeItem(MOBILE_DRAFT_STORAGE_KEY);
    return;
  }

  const draft: MobileDraft = {
    formData,
    savedAt: Date.now(),
  };

  localStorage.setItem(MOBILE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

/**
 * Clear draft from localStorage
 */
function clearMobileDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOBILE_DRAFT_STORAGE_KEY);
}

/**
 * Quick action button configuration
 * Maps to activity types from PRD v1.18
 */
interface QuickAction {
  id: string;
  label: string;
  icon: typeof MessageCircle;
  /** Activity type to pre-fill in QuickLogForm */
  activityType?: "Check-in" | "Sample" | "Call" | "Meeting" | "Note";
  /** Custom action handler (for non-activity actions like Complete Task) */
  customAction?: boolean;
  /** Aria label for accessibility */
  ariaLabel: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "check-in",
    label: "Check-In",
    icon: MessageCircle,
    activityType: "Check-in",
    ariaLabel: "Log a check-in activity",
  },
  {
    id: "sample",
    label: "Sample",
    icon: Package,
    activityType: "Sample",
    ariaLabel: "Log a sample delivery or request",
  },
  {
    id: "call",
    label: "Call",
    icon: Phone,
    activityType: "Call",
    ariaLabel: "Log a phone call",
  },
  {
    id: "meeting",
    label: "Meeting",
    icon: Users,
    activityType: "Meeting",
    ariaLabel: "Log a meeting",
  },
  {
    id: "note",
    label: "Note",
    icon: FileText,
    activityType: "Note",
    ariaLabel: "Add a quick note",
  },
  {
    id: "complete-task",
    label: "Complete",
    icon: CheckCircle2,
    customAction: true,
    ariaLabel: "Mark a task as complete",
  },
];

/**
 * Skeleton fallback shown while QuickLogForm lazy loads
 * Matches the form structure for smooth loading transition
 */
function QuickLogFormSkeleton() {
  return (
    <div className="space-y-4" data-testid="quick-log-form-skeleton">
      {/* Activity Type section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Who was involved section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-24" />
        </div>
      </div>
    </div>
  );
}

interface MobileQuickActionBarProps {
  /** Callback to refresh dashboard data after activity is logged */
  onRefresh?: () => void;
  /** Callback for custom actions like "Complete Task" */
  onCompleteTask?: () => void;
  /** Optional className for styling customization */
  className?: string;
}

/**
 * MobileQuickActionBar - Bottom-positioned quick action bar for mobile
 *
 * Features:
 * - 6 quick action buttons (Check-In, Sample, Call, Meeting, Note, Complete Task)
 * - 44px minimum touch targets (WCAG AA compliant)
 * - Hidden on desktop (lg: breakpoint), visible on mobile/tablet
 * - Pre-fills activity type in QuickLogForm for faster logging
 * - Sticky bottom positioning with safe area insets for notched devices
 *
 * Layout:
 * - Fixed to bottom of viewport on mobile (< 1024px)
 * - Evenly distributed buttons with labels
 * - Semi-transparent backdrop blur for content visibility
 */
export function MobileQuickActionBar({
  onRefresh,
  onCompleteTask,
  className,
}: MobileQuickActionBarProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadMobileDraft();
    setHasDraft(draft !== null);
  }, []);

  // Clear pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle quick action button click
  const handleActionClick = useCallback(
    (action: QuickAction) => {
      if (action.customAction) {
        // Handle custom actions (e.g., Complete Task)
        onCompleteTask?.();
        return;
      }

      // Open sheet with pre-filled activity type
      setSelectedAction(action);
      setIsSheetOpen(true);
    },
    [onCompleteTask]
  );

  // Handle form completion (successful save)
  const handleComplete = useCallback(() => {
    clearMobileDraft();
    setHasDraft(false);
    setIsSheetOpen(false);
    setSelectedAction(null);
    onRefresh?.();
  }, [onRefresh]);

  // Handle form data changes for draft persistence
  const handleDraftChange = useCallback((formData: Partial<ActivityLogInput>) => {
    // Debounce saves to avoid excessive localStorage writes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveMobileDraft(formData);
      setHasDraft(true);
    }, DRAFT_SAVE_DEBOUNCE_MS);
  }, []);

  // Handle sheet close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedAction(null);
    }
  }, []);

  // Prepare initial draft: merge saved draft with pre-filled activity type
  // Activity type from button takes precedence, but restore other saved fields
  const initialDraft: Partial<ActivityLogInput> | null = isSheetOpen
    ? {
        ...(loadMobileDraft() || {}),
        ...(selectedAction?.activityType && { activityType: selectedAction.activityType }),
      }
    : null;

  return (
    <>
      {/* Quick Action Bar - Mobile only (hidden on lg: and up) */}
      <nav
        className={cn(
          // Positioning: Fixed to bottom, full width
          "fixed bottom-0 left-0 right-0 z-40",
          // Hidden on desktop (lg: 1024px+), visible on mobile/tablet
          "lg:hidden",
          // Background: Semi-transparent with backdrop blur
          "bg-background/95 backdrop-blur-sm",
          // Border and shadow for elevation
          "border-t border-border shadow-lg",
          // Safe area insets for notched devices (iPhone X+)
          "pb-[env(safe-area-inset-bottom)]",
          className
        )}
        aria-label="Quick actions"
        role="navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                className={cn(
                  // Touch target: 44px minimum (h-11 w-11 = 44x44px)
                  "flex h-14 min-w-[56px] flex-col items-center justify-center gap-1",
                  // Padding for touch comfort
                  "px-2 py-1",
                  // Text styling
                  "text-muted-foreground",
                  // Hover/active states
                  "hover:bg-accent hover:text-accent-foreground",
                  "active:bg-accent/80",
                  // Focus ring for accessibility
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                onClick={() => handleActionClick(action)}
                aria-label={action.ariaLabel}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium leading-none">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Activity Log Sheet - Opens when action selected */}
      <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="flex max-h-[90vh] flex-col rounded-t-xl"
          aria-labelledby="quick-action-title"
          aria-describedby="quick-action-description"
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle id="quick-action-title">
              {selectedAction ? `Log ${selectedAction.label}` : "Log Activity"}
            </SheetTitle>
            <SheetDescription id="quick-action-description">
              {selectedAction?.activityType === "Sample"
                ? "Record sample delivery, receipt, or feedback"
                : `Quick capture for ${selectedAction?.label.toLowerCase() || "activities"}`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <Suspense fallback={<QuickLogFormSkeleton />}>
              <QuickLogForm
                onComplete={handleComplete}
                onRefresh={onRefresh}
                initialDraft={initialDraft}
                onDraftChange={handleDraftChange}
              />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-20 lg:hidden" aria-hidden="true" role="presentation" />
    </>
  );
}
