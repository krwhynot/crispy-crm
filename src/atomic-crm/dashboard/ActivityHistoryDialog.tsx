import React from 'react';
import { useGetList } from 'react-admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';
import type { ActivityType } from './types';

interface ActivityHistoryDialogProps {
  principalId: number;
  principalName: string;
  open: boolean;
  onClose: () => void;
}

interface Activity {
  id: number;
  type: ActivityType;
  activity_date: string;
  subject: string;
  description?: string;
  opportunity_id?: number;
  organization_id: number;
}

export const ActivityHistoryDialog: React.FC<ActivityHistoryDialogProps> = ({
  principalId,
  principalName,
  open,
  onClose,
}) => {
  const { data: activities, isLoading } = useGetList<Activity>(
    'activities',
    {
      filter: { organization_id: principalId },
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'activity_date', order: 'DESC' },
    },
    { enabled: open }
  );

  const activityIcons = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    note: FileText,
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl lg:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl lg:text-2xl">
            Activity History - {principalName}
          </DialogTitle>
          <DialogDescription>
            Complete activity log for this principal organization
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-compact">
          {isLoading && (
            <div className="text-center py-widget text-muted-foreground">
              Loading activities...
            </div>
          )}

          {!isLoading && activities && activities.length === 0 && (
            <div className="text-center py-widget text-muted-foreground">
              No activities recorded for this principal
            </div>
          )}

          {!isLoading && activities && activities.length > 0 && (
            <div className="space-y-compact">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                  <div
                    key={activity.id}
                    className="p-content lg:p-widget border border-border rounded-md bg-card"
                  >
                    <div className="flex items-start gap-compact">
                      <div className="mt-1">
                        <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-compact">
                        <div className="flex items-start justify-between gap-compact">
                          <h4 className="font-semibold text-sm lg:text-base">
                            {activity.subject}
                          </h4>
                          <span className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(activity.activity_date)}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-compact text-xs text-muted-foreground">
                          <span className="capitalize">{activity.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-compact">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11"
            aria-label="Close dialog"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
