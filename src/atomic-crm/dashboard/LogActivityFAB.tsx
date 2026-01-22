import { useState, useEffect, useCallback, lazy, Suspense, useRef, useMemo } from "react";
import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import { safeJsonParse } from "@/atomic-crm/utils/safeJsonParse";
import {
  activityDraftSchema,
  type ActivityDraft,
} from "@/atomic-crm/activities/activityDraftSchema";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";

// Lazy load QuickLogForm - saves ~15-20KB from main dashboard chunk
const QuickLogForm = lazy(() =>
  import("./QuickLogForm").then((m) => ({ default: m.QuickLogForm }))
);

// Storage key for draft persistence
const DRAFT_STORAGE_KEY = "principal-dashboard-log-activity-draft";

// Debounce delay for saving drafts (ms)
const DRAFT_SAVE_DEBOUNCE_MS = 500;

// Draft expires after 24 hours
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface LogActivityFABProps {
  /** Callback to refresh dashboard data after activity is logged */
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

/**
 * Load draft from localStorage with expiry check
 */
function loadDraft(): Partial<ActivityLogInput> | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!stored) return null;

  const draft = safeJsonParse(stored, activityDraftSchema);
  if (!draft) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }

  // Check if draft has expired
  if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }

  return draft.formData;
}

/**
 * Save draft to localStorage with timestamp
 */
function saveDraft(formData: Partial<ActivityLogInput>): void {
  if (typeof window === "undefined") return;

  // Don't save empty drafts
  const hasContent =
    formData.notes || formData.contactId || formData.organizationId || formData.opportunityId;

  if (!hasContent) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return;
  }

  const draft: ActivityDraft = {
    formData,
    savedAt: Date.now(),
  };

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

/**
 * Clear draft from localStorage
 */
function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

/**
 * LogActivityFAB - Floating Action Button for logging activities
 *
 * Features:
 * - 56px circular FAB (spacious CTA per design tokens)
 * - Sheet slide-over with QuickLogForm
 * - localStorage draft persistence with 500ms debounce
 * - Warning badge when draft exists
 * - Full WCAG accessibility (aria-expanded, focus management)
 */
export function LogActivityFAB({ onRefresh }: LogActivityFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    setHasDraft(draft !== null);
  }, []);

  // Recently viewed items for smart pre-fill (mirrors QuickLogActivityDialog pattern)
  const { recentItems } = useRecentSearches();

  // Derive smart defaults from recently viewed contacts/orgs
  const recentDefaults = useMemo(() => {
    const recentContact = recentItems.find((item) => item.entityType === "contacts");
    const recentOrg = recentItems.find((item) => item.entityType === "organizations");

    return {
      ...(recentContact && { contactId: Number(recentContact.id) }),
      ...(recentOrg && { organizationId: Number(recentOrg.id) }),
    };
  }, [recentItems]);

  // Handle form completion (successful save)
  const handleComplete = useCallback(() => {
    clearDraft();
    setHasDraft(false);
    setIsOpen(false);

    // Return focus to FAB for accessibility
    // Small delay to allow Sheet close animation
    setTimeout(() => {
      fabRef.current?.focus();
    }, 100);
  }, []);

  // Handle form data changes for draft persistence
  const handleDraftChange = useCallback((formData: Partial<ActivityLogInput>) => {
    // Debounce saves to avoid excessive localStorage writes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveDraft(formData);
      setHasDraft(true);
    }, DRAFT_SAVE_DEBOUNCE_MS);
  }, []);

  // Handle sheet open/close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);

    // If closing without saving, draft remains (already persisted via debounce)
    // If opening, we'll load the draft in QuickLogForm via initialDraft prop
  }, []);

  // Clear pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Get initial draft for form, merging recently viewed with draft
  // Priority: recentDefaults (lowest) < draft (highest)
  const initialDraft = useMemo(() => {
    if (!isOpen) return null;

    const draft = loadDraft();
    const merged = { ...recentDefaults, ...(draft || {}) };

    return Object.keys(merged).length > 0 ? merged : null;
  }, [isOpen, recentDefaults]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          ref={fabRef}
          size="icon"
          className={cn(
            // Size: 56px (h-14 w-14) - Spacious CTA per design tokens
            "fixed bottom-6 right-6 z-40 h-14 w-14",
            // Hidden on mobile - MobileQuickActionBar handles mobile actions
            "hidden lg:flex",
            // Shape: Circular FAB
            "rounded-full",
            // Elevation: High (floating element)
            "shadow-lg hover:shadow-xl",
            // Transitions
            "transition-all duration-200",
            // Colors: Primary brand (semantic utility)
            "bg-primary text-primary-foreground hover:bg-primary/90",
            // Focus ring for accessibility
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label={hasDraft ? "Log Activity (draft saved)" : "Log Activity"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          data-tutorial="dashboard-log-activity"
        >
          <PencilLine className="h-6 w-6" />

          {/* Draft Badge - Warning color indicates unsaved work */}
          {hasDraft && (
            <span
              className={cn(
                "absolute -right-1 -top-1",
                "h-4 w-4 rounded-full",
                "bg-warning ring-2 ring-background",
                // Pulse animation to draw attention
                "animate-pulse"
              )}
              aria-hidden="true"
            />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-[420px]"
        aria-labelledby="log-activity-title"
        aria-describedby="log-activity-description"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle id="log-activity-title">Log Activity</SheetTitle>
          <SheetDescription id="log-activity-description">
            Quick capture for calls, meetings, and notes
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
  );
}
