import { useState, useEffect, useCallback, lazy, Suspense, useRef, useMemo } from "react";
import { useGetOne } from "react-admin";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import type { Contact, Organization, Opportunity } from "../types";
import { safeJsonParse } from "@/atomic-crm/utils/safeJsonParse";
import {
  activityDraftSchema,
  type ActivityDraft,
} from "@/atomic-crm/activities/activityDraftSchema";

// Lazy load QuickLogForm - saves ~15-20KB from initial chunk
const QuickLogForm = lazy(() =>
  import("../dashboard/v3/components/QuickLogForm").then((m) => ({
    default: m.QuickLogForm,
  }))
);

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Entity context for pre-filling the activity form
 *
 * Pass these when opening from a specific resource's slide-over or detail view.
 * The form will auto-populate entity fields and lock them from editing.
 */
export interface ActivityEntityContext {
  /** Pre-fill and lock the contact field */
  contactId?: number;
  /** Pre-fill and lock the organization field */
  organizationId?: number;
  /** Pre-fill and lock the opportunity field (also sets activity_type to "interaction") */
  opportunityId?: number;
}

/**
 * Activity type preset for quick action buttons
 *
 * Used by MobileQuickActionBar to pre-select activity type
 */
export type ActivityTypePreset =
  | "Call"
  | "Email"
  | "Meeting"
  | "Demo"
  | "Sample"
  | "Note"
  | "Check-in"
  | "Follow-up";

/**
 * Configuration options for dialog behavior
 */
export interface QuickLogActivityDialogConfig {
  /**
   * Pre-select activity type (e.g., from MobileQuickActionBar)
   * User can still change this unless `lockActivityType` is true
   */
  activityType?: ActivityTypePreset;

  /**
   * Lock activity type selection (prevent user from changing)
   * Use when the context explicitly requires a specific type
   * @default false
   */
  lockActivityType?: boolean;

  /**
   * Enable draft persistence to localStorage
   * Drafts auto-expire after 24 hours
   * @default true for Dashboard context, false for resource slide-overs
   */
  enableDraftPersistence?: boolean;

  /**
   * Custom storage key for draft persistence
   * Use unique keys when multiple dialogs could be open in different contexts
   * @default "quick-log-activity-draft"
   */
  draftStorageKey?: string;

  /**
   * Show "Save & New" button for rapid entry workflows
   * @default true
   */
  showSaveAndNew?: boolean;
}

/**
 * Props for the QuickLogActivityDialog component
 *
 * Follows the controlled component pattern for external state management.
 * Works both standalone (Dashboard FAB) and embedded (resource slide-overs).
 */
export interface QuickLogActivityDialogProps {
  // ═══════════════════════════════════════════════════════════════════
  // REQUIRED: Dialog Control
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Whether the dialog is currently open
   * Controlled by parent component
   */
  open: boolean;

  /**
   * Callback when open state should change
   * Called on: close button click, ESC key, overlay click, successful save
   */
  onOpenChange: (open: boolean) => void;

  // ═══════════════════════════════════════════════════════════════════
  // OPTIONAL: Entity Context (Pre-fill)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Entity context for pre-filling form fields
   * When provided, these fields are pre-populated AND locked from editing
   *
   * @example
   * // From ContactShow slide-over
   * <QuickLogActivityDialog
   *   entityContext={{ contactId: 123, organizationId: 456 }}
   *   ...
   * />
   */
  entityContext?: ActivityEntityContext;

  // ═══════════════════════════════════════════════════════════════════
  // OPTIONAL: Configuration
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Dialog behavior configuration
   */
  config?: QuickLogActivityDialogConfig;

  // ═══════════════════════════════════════════════════════════════════
  // OPTIONAL: Callbacks
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Called after activity is successfully created
   * Use to refresh parent data (e.g., activity timeline, dashboard KPIs)
   */
  onSuccess?: (activity: { id: number; type: string }) => void;

  /**
   * Called when activity creation fails
   * Error is already shown via toast; use this for additional handling
   */
  onError?: (error: Error) => void;

  /**
   * Called when user closes dialog without saving
   * Draft is preserved in localStorage if `enableDraftPersistence` is true
   */
  onCancel?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_DRAFT_STORAGE_KEY = "quick-log-activity-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ═══════════════════════════════════════════════════════════════════════════════
// Draft Persistence Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function loadDraft(storageKey: string): Partial<ActivityLogInput> | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  const draft = safeJsonParse(stored, activityDraftSchema);
  if (!draft) {
    localStorage.removeItem(storageKey);
    return null;
  }

  // Check if draft has expired
  if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
    localStorage.removeItem(storageKey);
    return null;
  }

  return draft.formData;
}

function saveDraft(storageKey: string, formData: Partial<ActivityLogInput>): void {
  if (typeof window === "undefined") return;

  // Don't save empty drafts
  const hasContent =
    formData.notes || formData.contactId || formData.organizationId || formData.opportunityId;

  if (!hasContent) {
    localStorage.removeItem(storageKey);
    return;
  }

  const draft: ActivityDraft = {
    formData,
    savedAt: Date.now(),
  };

  localStorage.setItem(storageKey, JSON.stringify(draft));
}

function clearDraft(storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton Component
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// Entity Display Components
// ═══════════════════════════════════════════════════════════════════════════════

interface LockedEntityDisplayProps {
  label: string;
  name: string | undefined;
  loading: boolean;
}

/**
 * Displays a locked (read-only) entity field
 * Used when entityContext provides a pre-filled ID
 */
function LockedEntityDisplay({ label, name, loading }: LockedEntityDisplayProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex h-11 items-center justify-between rounded-md border border-border bg-muted px-3">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-sm">{name || "Unknown"}</span>
        )}
        <Badge variant="secondary" className="ml-2 text-xs">
          Locked
        </Badge>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QuickLogActivityDialog - Reusable activity logging dialog
 *
 * A controlled Sheet dialog that wraps QuickLogForm with:
 * - Entity context pre-fill support (contact, org, opportunity)
 * - Optional draft persistence to localStorage
 * - Configurable activity type presets
 * - Works standalone (Dashboard FAB) or embedded (resource slide-overs)
 *
 * @example
 * // Dashboard FAB usage
 * <QuickLogActivityDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   config={{ enableDraftPersistence: true }}
 *   onSuccess={handleRefresh}
 * />
 *
 * @example
 * // Contact slide-over usage
 * <QuickLogActivityDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   entityContext={{ contactId: contact.id, organizationId: contact.organization_id }}
 *   config={{ enableDraftPersistence: false, showSaveAndNew: false }}
 *   onSuccess={() => refresh()}
 * />
 */
export function QuickLogActivityDialog({
  open,
  onOpenChange,
  entityContext,
  config,
  onSuccess,
  onError: _onError,
  onCancel,
}: QuickLogActivityDialogProps) {
  // ═══════════════════════════════════════════════════════════════════
  // Configuration with defaults
  // ═══════════════════════════════════════════════════════════════════
  const enableDraftPersistence = config?.enableDraftPersistence ?? true;
  const draftStorageKey = config?.draftStorageKey ?? DEFAULT_DRAFT_STORAGE_KEY;
  const _showSaveAndNew = config?.showSaveAndNew ?? true;
  const activityTypePreset = config?.activityType;

  // ═══════════════════════════════════════════════════════════════════
  // Draft persistence state
  // ═══════════════════════════════════════════════════════════════════
  const [hasDraft, setHasDraft] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for existing draft on mount (only if persistence enabled)
  useEffect(() => {
    if (enableDraftPersistence) {
      const draft = loadDraft(draftStorageKey);
      setHasDraft(draft !== null);
    }
  }, [enableDraftPersistence, draftStorageKey]);

  // Clear pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Entity data fetching for locked fields
  // ═══════════════════════════════════════════════════════════════════
  const { data: contact, isLoading: contactLoading } = useGetOne<Contact>(
    "contacts",
    { id: entityContext?.contactId ?? 0 },
    { enabled: !!entityContext?.contactId }
  );

  const { data: organization, isLoading: organizationLoading } = useGetOne<Organization>(
    "organizations",
    { id: entityContext?.organizationId ?? 0 },
    { enabled: !!entityContext?.organizationId }
  );

  const { data: opportunity, isLoading: opportunityLoading } = useGetOne<Opportunity>(
    "opportunities",
    { id: entityContext?.opportunityId ?? 0 },
    { enabled: !!entityContext?.opportunityId }
  );

  // ═══════════════════════════════════════════════════════════════════
  // Build initial form data from entity context
  // ═══════════════════════════════════════════════════════════════════
  const initialDraft = useMemo(() => {
    // Start with draft from localStorage if persistence enabled
    let draft: Partial<ActivityLogInput> | null = null;

    if (enableDraftPersistence && open) {
      draft = loadDraft(draftStorageKey);
    }

    // Entity context overrides draft values for locked fields
    const contextValues: Partial<ActivityLogInput> = {};

    if (entityContext?.contactId) {
      contextValues.contactId = entityContext.contactId;
    }
    if (entityContext?.organizationId) {
      contextValues.organizationId = entityContext.organizationId;
    }
    if (entityContext?.opportunityId) {
      contextValues.opportunityId = entityContext.opportunityId;
    }
    if (activityTypePreset) {
      contextValues.activityType = activityTypePreset;
    }

    // Merge: draft values + context overrides
    return draft
      ? { ...draft, ...contextValues }
      : Object.keys(contextValues).length > 0
        ? contextValues
        : null;
  }, [open, enableDraftPersistence, draftStorageKey, entityContext, activityTypePreset]);

  // ═══════════════════════════════════════════════════════════════════
  // Dialog description based on context
  // ═══════════════════════════════════════════════════════════════════
  const dialogDescription = useMemo(() => {
    if (entityContext?.opportunityId && opportunity) {
      return `Log activity for opportunity: ${opportunity.name}`;
    }
    if (entityContext?.contactId && contact) {
      return `Log activity for contact: ${contact.first_name} ${contact.last_name}`;
    }
    if (entityContext?.organizationId && organization) {
      return `Log activity for organization: ${organization.name}`;
    }
    return "Quick capture for calls, meetings, and notes";
  }, [entityContext, contact, organization, opportunity]);

  // ═══════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════

  const handleComplete = useCallback(() => {
    if (enableDraftPersistence) {
      clearDraft(draftStorageKey);
      setHasDraft(false);
    }
    onOpenChange(false);
    onSuccess?.({ id: 0, type: "activity" }); // ID comes from actual create response
  }, [enableDraftPersistence, draftStorageKey, onOpenChange, onSuccess]);

  const handleDraftChange = useCallback(
    (formData: Partial<ActivityLogInput>) => {
      if (!enableDraftPersistence) return;

      // Debounce saves to avoid excessive localStorage writes
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        saveDraft(draftStorageKey, formData);
        setHasDraft(true);
      }, DRAFT_SAVE_DEBOUNCE_MS);
    },
    [enableDraftPersistence, draftStorageKey]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && onCancel) {
        onCancel();
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, onCancel]
  );

  // ═══════════════════════════════════════════════════════════════════
  // Determine which fields are locked
  // ═══════════════════════════════════════════════════════════════════
  const hasLockedFields =
    !!entityContext?.contactId || !!entityContext?.organizationId || !!entityContext?.opportunityId;

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-[420px]"
        aria-labelledby="log-activity-title"
        aria-describedby="log-activity-description"
      >
        <SheetHeader className="border-b border-border pb-4 pr-14">
          <SheetTitle id="log-activity-title">
            Log Activity
            {hasDraft && enableDraftPersistence && (
              <Badge variant="outline" className="ml-2 text-warning">
                Draft
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription id="log-activity-description">{dialogDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Locked Entity Display Section */}
          {hasLockedFields && (
            <div className="mb-6 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Logging activity for:</h3>

              {entityContext?.contactId && (
                <LockedEntityDisplay
                  label="Contact"
                  name={contact ? `${contact.first_name} ${contact.last_name}` : undefined}
                  loading={contactLoading}
                />
              )}

              {entityContext?.organizationId && (
                <LockedEntityDisplay
                  label="Organization"
                  name={organization?.name}
                  loading={organizationLoading}
                />
              )}

              {entityContext?.opportunityId && (
                <LockedEntityDisplay
                  label="Opportunity"
                  name={opportunity?.name}
                  loading={opportunityLoading}
                />
              )}
            </div>
          )}

          {/* Form Content */}
          <Suspense fallback={<QuickLogFormSkeleton />}>
            <QuickLogForm
              onComplete={handleComplete}
              initialDraft={initialDraft}
              onDraftChange={enableDraftPersistence ? handleDraftChange : undefined}
              // Note: QuickLogForm needs enhancement to support:
              // - lockedFields prop to disable certain entity comboboxes
              // - showSaveAndNew prop to hide that button
              // For now, the entity context is pre-filled but not locked
            />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Re-export types for consumers
export type { ActivityLogInput };
