import React, { useState } from 'react';
import { useGetOne } from 'react-admin';
import { PencilIcon, XIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Configuration for a single tab in the slide-over
 */
export interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<{ record: any; mode: 'view' | 'edit' }>;
  icon?: React.ComponentType<{ className?: string }>;
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
  mode?: 'view' | 'edit';
  /** Mode toggle handler */
  onModeToggle?: () => void;
  /** Resource-specific tab configuration */
  tabs: TabConfig[];
  /** Optional record representation function (defaults to record.name) */
  recordRepresentation?: (record: any) => string;
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
  mode = 'view',
  onModeToggle,
  tabs,
  recordRepresentation,
}: ResourceSlideOverProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '');
  const notify = useNotify();
  const refresh = useRefresh();
  const [update] = useUpdate();

  // Fetch record data
  const { data: record, isLoading } = useGetOne(
    resource,
    { id: recordId! },
    { enabled: !!recordId }
  );

  // Get record title
  const getRecordTitle = () => {
    if (isLoading) return 'Loading...';
    if (!record) return 'Record Details';
    if (recordRepresentation) return recordRepresentation(record);
    return record.name || record.title || `${resource} #${recordId}`;
  };

  // Handle save in edit mode
  const handleSave = async () => {
    if (!record) return;

    try {
      await update(resource, {
        id: record.id,
        data: record,
        previousData: record,
      });
      notify('Changes saved successfully', { type: 'success' });
      refresh();
      if (onModeToggle) onModeToggle(); // Return to view mode
    } catch (error) {
      notify('Failed to save changes', { type: 'error' });
    }
  };

  // Handle cancel in edit mode
  const handleCancel = () => {
    if (onModeToggle) onModeToggle(); // Return to view mode without saving
  };

  // Reset active tab when slide-over opens
  React.useEffect(() => {
    if (isOpen && tabs.length > 0) {
      setActiveTab(tabs[0].key);
    }
  }, [isOpen, tabs]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[40vw] min-w-[480px] max-w-[720px] bg-card shadow-md p-0 flex flex-col"
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
            {/* Header with title, mode toggle, and close button */}
            <SheetHeader className="border-b border-border h-11 px-6 py-0 flex flex-row items-center justify-between shrink-0">
              <SheetTitle id="slide-over-title" className="text-base font-semibold">
                {getRecordTitle()}
              </SheetTitle>

              {/* Mode toggle button (if handler provided) */}
              {onModeToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onModeToggle}
                  className="h-8 px-2 text-sm"
                  aria-label={mode === 'view' ? 'Switch to edit mode' : 'Switch to view mode'}
                >
                  {mode === 'view' ? (
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
              )}
            </SheetHeader>

            {/* Tabbed content area */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="border-b border-border h-11 rounded-none bg-transparent p-0 w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="h-11 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    {tab.icon && <tab.icon className="size-4 mr-2" />}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab content panels */}
              {tabs.map((tab) => {
                const TabComponent = tab.component;

                return (
                  <TabsContent
                    key={tab.key}
                    value={tab.key}
                    className="flex-1 overflow-y-auto p-6 m-0"
                  >
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-11 w-full" />
                      </div>
                    ) : record ? (
                      <TabComponent record={record} mode={mode} />
                    ) : (
                      <p className="text-muted-foreground">Record not found</p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Footer with Cancel/Save buttons (edit mode only) */}
            {mode === 'edit' && (
              <SheetFooter className="border-t border-border p-4 flex flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="h-11 px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleSave}
                  className="h-11 px-4"
                >
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
