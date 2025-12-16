import React, { useState } from "react";
import { useGetOne } from "react-admin";
import { PencilIcon, XIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SlideOverSkeleton } from "@/components/ui/list-skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";

/**
 * Props passed to each tab component
 */
export interface TabComponentProps {
  record: any;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  /** Whether this tab is currently active - use to enable/disable data fetching */
  isActiveTab: boolean;
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
  countFromRecord?: (record: any) => number | undefined | null;
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
  /** Resource-specific tab configuration */
  tabs: TabConfig[];
  /** Optional record representation function (defaults to record.name) */
  recordRepresentation?: (record: any) => string;
  /**
   * Optional breadcrumb component to render above the title.
   * Receives the record as a prop for dynamic breadcrumb generation.
   */
  breadcrumbComponent?: React.ComponentType<{ record: any }>;
  /**
   * Optional custom skeleton component for loading state.
   * Defaults to generic SlideOverSkeleton if not provided.
   * Use resource-specific skeletons (ContactDetailSkeleton, OrganizationDetailSkeleton)
   * for better visual matching during load.
   */
  loadingSkeleton?: React.ComponentType;
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
  tabs,
  recordRepresentation,
  breadcrumbComponent: BreadcrumbComponent,
  loadingSkeleton: LoadingSkeleton = SlideOverSkeleton,
}: ResourceSlideOverProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "");

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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-none lg:w-[40vw] lg:max-w-[600px] lg:min-w-[576px] bg-card shadow-md p-0 flex flex-col"
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
              <div className="flex flex-row items-center justify-between min-h-[28px] pr-10">
                <SheetTitle id="slide-over-title" className="text-base font-semibold">
                  {getRecordTitle()}
                </SheetTitle>

                {/* Mode toggle button (if handler provided) */}
                {onModeToggle && (
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
            </SheetHeader>

            {/* Tabbed content area */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="border-b border-border h-11 rounded-none bg-transparent p-0 w-full justify-start gap-2 px-2">
                {tabs.map((tab) => {
                  // Compute count badge value if function provided
                  const count = record && tab.countFromRecord ? tab.countFromRecord(record) : null;
                  const showBadge = count != null && count > 0;

                  return (
                    <Tooltip key={tab.key}>
                      <TooltipTrigger asChild>
                        <TabsTrigger
                          value={tab.key}
                          className="h-11 min-w-11 px-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary flex items-center justify-center gap-2 relative"
                          aria-label={showBadge ? `${tab.label} (${count})` : tab.label}
                        >
                          {tab.icon ? (
                            <tab.icon className="size-5" />
                          ) : (
                            <span className="text-sm font-medium">{tab.label.charAt(0)}</span>
                          )}
                          {showBadge && (
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-5 px-1.5 text-xs font-medium"
                            >
                              {count > 99 ? "99+" : count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4}>
                        {showBadge ? `${tab.label} (${count})` : tab.label}
                      </TooltipContent>
                    </Tooltip>
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

            {/* Footer message (edit mode only) */}
            {mode === "edit" && (
              <SheetFooter className="border-t border-border p-4 flex flex-row gap-2 justify-end items-center">
                <Button variant="outline" onClick={onModeToggle} className="h-11 px-4">
                  Cancel
                </Button>
                <Button type="submit" form="slide-over-edit-form" className="h-11 px-4">
                  Save Changes
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
