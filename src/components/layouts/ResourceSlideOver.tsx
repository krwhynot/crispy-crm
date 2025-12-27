import React, { useState, useCallback, useEffect } from "react";
import { useGetOne } from "react-admin";
import type { RaRecord } from "react-admin";
import { PencilIcon, XIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SlideOverSkeleton } from "@/components/ui/list-skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

/**
 * Props passed to each tab component
 */
export interface TabComponentProps {
  record: RaRecord;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  /** Whether this tab is currently active - use to enable/disable data fetching */
  isActiveTab: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Configuration for a single tab in the slide-over
 */
export interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<TabComponentProps>;
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Function to compute count badge value from record.
   * Return undefined/null/0 to hide badge.
   * @example countFromRecord: (record) => record.nb_notes
   */
  countFromRecord?: (record: RaRecord) => number | undefined | null;
}

/**
 * Props for the ResourceSlideOver component
 */
export interface ResourceSlideOverProps {
  /** Resource name (e.g., "contacts", "organizations") */
  resource: string;
  /** ID of record to display */
  recordId: number | null;
  /** Slide-over visibility */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current mode (default: 'view') */
  mode?: "view" | "edit";
  /** Mode toggle handler */
  onModeToggle?: () => void;
  /** Whether the current user can edit this record (default: true for backwards compatibility) */
  canEdit?: boolean;
  /** Resource-specific tab configuration */
  tabs: TabConfig[];
  /** Optional record representation function (defaults to record.name) */
  recordRepresentation?: (record: RaRecord) => string;
  /**
   * Optional breadcrumb component to render above the title.
   * Receives the record as a prop for dynamic breadcrumb generation.
   */
  breadcrumbComponent?: React.ComponentType<{ record: RaRecord }>;
  /**
   * Optional custom skeleton component for loading state.
   * Defaults to generic SlideOverSkeleton if not provided.
   * Use resource-specific skeletons (ContactDetailSkeleton, OrganizationDetailSkeleton)
   * for better visual matching during load.
   */
  loadingSkeleton?: React.ComponentType;
  /**
   * Optional header action buttons (rendered before Edit button)
   */
  headerActions?: (record: RaRecord) => React.ReactNode;
}

/**
 * Generic slide-over panel for viewing and editing resources.
 *
 * Based on Dashboard V2's RightSlideOver, this component provides a consistent
 * pattern for displaying record details in a side panel with tabbed navigation.
 *
 * Features:
 * - Two modes: view (read-only) and edit (form fields)
 * - Tabbed interface with custom tab components
 * - Data fetching via React Admin's useGetOne
 * - Focus trap and ARIA attributes for accessibility
 * - Slide-in animation from right
 *
 * **Edit Mode Responsibility:**
 * This component only manages the mode state (view/edit) and passes it to tab
 * components. Tab components are responsible for:
 * - Rendering edit forms when mode === 'edit'
 * - Handling their own save/cancel logic
 * - Managing form state and validation
 * - Calling onModeToggle() after successful save
 *
 * The wrapper does NOT handle save operations - it only provides the UI shell
 * and mode toggle functionality.
 *
 * @example
 * ```tsx
 * const contactTabs: TabConfig[] = [
 *   { key: 'details', label: 'Details', component: ContactDetailsTab },
 *   { key: 'activities', label: 'Activities', component: ContactActivitiesTab },
 * ];
 *
 * <ResourceSlideOver
 *   resource="contacts"
 *   recordId={123}
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   mode="view"
 *   onModeToggle={() => setMode(mode === 'view' ? 'edit' : 'view')}
 *   tabs={contactTabs}
 * />
 * ```
 */
export function ResourceSlideOver({
  resource,
  recordId,
  isOpen,
  onClose,
  mode = "view",
  onModeToggle,
  canEdit,
  tabs,
  recordRepresentation,
  breadcrumbComponent: BreadcrumbComponent,
  loadingSkeleton: LoadingSkeleton = SlideOverSkeleton,
  headerActions,
}: ResourceSlideOverProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "");
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Reset dirty when switching to view mode
  useEffect(() => {
    if (mode === "view") setIsDirty(false);
  }, [mode]);

  // Reset dirty when record changes
  useEffect(() => {
    setIsDirty(false);
  }, [recordId]);

  const handleCloseAttempt = useCallback(() => {
    if (mode === "edit" && isDirty) {
      setShowExitConfirm(true);
      return;
    }
    onClose();
  }, [mode, isDirty, onClose]);

  // Override ESC key to use our close handler (capture phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        handleCloseAttempt();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleCloseAttempt]);

  // Keyboard shortcuts for slide-over navigation
  useKeyboardShortcuts({
    onCancel: isOpen ? onClose : undefined,
    // Future: Add onSave handler when edit forms support it
  });

  // Fetch record data
  const { data: record, isLoading } = useGetOne(
    resource,
    { id: recordId! },
    { enabled: !!recordId }
  );

  // Get record title
  const getRecordTitle = () => {
    if (isLoading) return "Loading...";
    if (!record) return "Record Details";
    if (recordRepresentation) return recordRepresentation(record);
    return record.name || record.title || `${resource} #${recordId}`;
  };

  /**
   * NOTE: This wrapper component does NOT handle save operations.
   * Tab components receive the `mode` prop and are responsible for:
   * 1. Rendering edit forms when mode === 'edit'
   * 2. Implementing their own save/cancel handlers
   * 3. Managing form state and validation
   * 4. Calling onModeToggle() after successful save to return to view mode
   *
   * This separation of concerns keeps the wrapper generic and allows
   * each tab to implement domain-specific edit logic.
   */

  // Reset active tab when slide-over opens
  // Note: Depend on tabs[0]?.key (primitive) instead of tabs array to avoid
  // unnecessary re-runs when parent passes inline array literals
  const firstTabKey = tabs[0]?.key;
  React.useEffect(() => {
    if (isOpen && firstTabKey) {
      setActiveTab(firstTabKey);
    }
  }, [isOpen, firstTabKey]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseAttempt();
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-none sm:max-w-none bg-card shadow-md p-0 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
      >
        {!recordId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a record to view details</p>
          </div>
        ) : (
          <>
            {/* Header with optional breadcrumb, title, mode toggle, and close button */}
            <SheetHeader className="!p-0 border-b border-border px-4 py-2 gap-2 flex flex-col shrink-0">
              {/* Breadcrumb row (optional) */}
              {BreadcrumbComponent && record && !isLoading && (
                <div className="mb-1">
                  <BreadcrumbComponent record={record} />
                </div>
              )}

              {/* Title and actions row */}
              <div className="flex flex-row items-center justify-between min-h-[28px] pr-14">
                <SheetTitle id="slide-over-title" className="text-base font-semibold">
                  {getRecordTitle()}
                </SheetTitle>

                <div className="flex items-center gap-2">
                  {/* Custom header actions */}
                  {headerActions && record && !isLoading && headerActions(record)}

                  {/* Mode toggle button (if handler provided and user can edit) */}
                  {onModeToggle && canEdit !== false && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={onModeToggle}
                          className="h-11 px-3 text-sm"
                          aria-label={mode === "view" ? "Switch to edit mode" : "Switch to view mode"}
                        >
                          {mode === "view" ? (
                            <>
                              <PencilIcon className="size-4 mr-1" />
                              Edit
                            </>
                          ) : (
                            <>
                              <XIcon className="size-4 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {mode === "view"
                          ? "Edit record"
                          : `Cancel editing (${formatShortcut("Escape")})`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Tabbed content area */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start rounded-none border-b border-border h-auto p-0 bg-transparent px-6">
                {tabs.map((tab) => {
                  // Compute count badge value if function provided
                  const count = record && tab.countFromRecord ? tab.countFromRecord(record) : null;
                  const showBadge = count != null && count > 0;

                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4 flex items-center gap-2"
                      aria-label={showBadge ? `${tab.label} (${count})` : tab.label}
                    >
                      {tab.icon && <tab.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{tab.label}</span>
                      {showBadge && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
                        >
                          {count > 99 ? "99+" : count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Tab content panels - only render active tab's component for performance */}
              {tabs.map((tab) => {
                const TabComponent = tab.component;
                const isActive = activeTab === tab.key;

                return (
                  <TabsContent
                    key={tab.key}
                    value={tab.key}
                    className="flex-1 overflow-y-auto p-6 m-0"
                  >
                    {/* Only mount TabComponent when this tab is active to avoid:
                        1. Unnecessary React component tree creation
                        2. useEffect hooks firing in hidden tabs
                        3. Memory allocation for unused tab state */}
                    {isActive && (
                      <>
                        {isLoading ? (
                          <LoadingSkeleton />
                        ) : record ? (
                          <TabComponent
                            record={record}
                            mode={mode}
                            onModeToggle={onModeToggle}
                            isActiveTab={isActive}
                            onDirtyChange={setIsDirty}
                          />
                        ) : (
                          <p className="text-muted-foreground">Record not found</p>
                        )}
                      </>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Footer message (edit mode only, hidden when canEdit is false) */}
            {mode === "edit" && canEdit !== false && (
              <SheetFooter className="border-t border-border p-4 flex flex-row gap-2 justify-end items-center">
                <Button variant="outline" onClick={onModeToggle} className="h-11 px-4">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="slide-over-edit-form"
                  className="h-11 px-4"
                  disabled={!isDirty}
                >
                  Save Changes
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
      <UnsavedChangesDialog
        open={showExitConfirm}
        onConfirm={() => {
          setIsDirty(false);
          setShowExitConfirm(false);
          onClose();
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </Sheet>
  );
}
