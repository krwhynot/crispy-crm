import React from 'react';
import { useGetOne, useGetList, useUpdate, useNotify, useRefresh } from 'react-admin';
import { FileIcon, HistoryIcon, InfoIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrefs } from '../hooks/usePrefs';
import { OPPORTUNITY_STAGE_CHOICES } from '@/atomic-crm/opportunities/stageConstants';
import type { TabName } from '../types';
import type { Opportunity, ActivityRecord } from '@/atomic-crm/types';
import { INTERACTION_TYPE_OPTIONS } from '@/atomic-crm/validation/activities';

interface RightSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number | null;
}

export function RightSlideOver({ isOpen, onClose, opportunityId }: RightSlideOverProps) {
  const [activeTab, setActiveTab] = usePrefs<TabName>('rightTab', 'details');
  const notify = useNotify();
  const refresh = useRefresh();
  const [update] = useUpdate();

  const { data: opportunity, isLoading: isLoadingOpp } = useGetOne<Opportunity>(
    'opportunities',
    { id: opportunityId! },
    { enabled: !!opportunityId }
  );

  const { data: activities, isLoading: isLoadingActivities } = useGetList<ActivityRecord>(
    'activities',
    {
      filter: { opportunity_id: opportunityId },
      sort: { field: 'activity_date', order: 'DESC' },
      pagination: { page: 1, perPage: 50 },
    },
    { enabled: !!opportunityId }
  );

  const handleStageChange = async (newStage: string) => {
    if (!opportunity) return;

    try {
      await update('opportunities', {
        id: opportunity.id,
        data: { stage: newStage },
        previousData: opportunity,
      });
      notify('Stage updated successfully', { type: 'success' });

      // Refresh to update OpportunitiesHierarchy and slide-over data
      refresh();
    } catch {
      notify('Failed to update stage', { type: 'error' });
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getActivityIcon = (type: string) => {
    const typeOption = INTERACTION_TYPE_OPTIONS.find(opt => opt.value === type);
    return typeOption?.label || type;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[40vw] min-w-[480px] max-w-[720px] bg-card shadow-md p-0 flex flex-col"
      >
        {!opportunityId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select an opportunity to view details</p>
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-border h-11 px-6 py-0 flex flex-row items-center justify-between shrink-0">
              <SheetTitle className="text-base font-semibold">
                {isLoadingOpp ? 'Loading...' : opportunity?.name || 'Opportunity Details'}
              </SheetTitle>
            </SheetHeader>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabName)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="border-b border-border h-11 rounded-none bg-transparent p-0 w-full justify-start">
                <TabsTrigger value="details" className="h-11 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <InfoIcon className="size-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="history" className="h-11 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <HistoryIcon className="size-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="files" className="h-11 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileIcon className="size-4 mr-2" />
                  Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
                {isLoadingOpp ? (
                  <div className="space-y-4">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ) : opportunity ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage</Label>
                      <Select
                        value={opportunity.stage}
                        onValueChange={handleStageChange}
                      >
                        <SelectTrigger id="stage" className="h-11 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPPORTUNITY_STAGE_CHOICES.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <div className="h-11 flex items-center">
                        <Badge
                          variant={opportunity.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {opportunity.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated_close">Estimated Close Date</Label>
                      <Input
                        id="estimated_close"
                        value={formatDate(opportunity.estimated_close_date)}
                        readOnly
                        className="h-11 bg-muted/50"
                      />
                    </div>

                    {opportunity.customer_organization_name && (
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Input
                          value={opportunity.customer_organization_name}
                          readOnly
                          className="h-11 bg-muted/50"
                        />
                      </div>
                    )}

                    {opportunity.principal_organization_name && (
                      <div className="space-y-2">
                        <Label>Principal</Label>
                        <Input
                          value={opportunity.principal_organization_name}
                          readOnly
                          className="h-11 bg-muted/50"
                        />
                      </div>
                    )}

                    {opportunity.notes && (
                      <div className="space-y-2">
                        <Label>Latest Notes</Label>
                        <div className="p-3 bg-muted/30 rounded-md border border-border text-sm text-foreground">
                          {opportunity.notes.length > 200
                            ? `${opportunity.notes.substring(0, 200)}...`
                            : opportunity.notes
                          }
                        </div>
                      </div>
                    )}

                    <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Days in Stage:</span>
                        <span className="font-medium text-foreground">
                          {opportunity.days_in_stage || 0}
                        </span>
                      </div>
                      {opportunity.nb_interactions !== undefined && (
                        <div className="flex justify-between">
                          <span>Total Interactions:</span>
                          <span className="font-medium text-foreground">
                            {opportunity.nb_interactions}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Opportunity not found</p>
                )}
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-y-auto p-6 m-0">
                {isLoadingActivities ? (
                  <div className="space-y-2">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-0">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="h-11 flex items-center gap-3 border-b border-border py-2"
                      >
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {getActivityIcon(activity.type)}
                          </Badge>
                          <span className="text-sm truncate flex-1">{activity.subject}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDateTime(activity.activity_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <HistoryIcon className="size-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">No activity recorded</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="files" className="flex-1 overflow-y-auto p-6 m-0">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileIcon className="size-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">File attachments coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
