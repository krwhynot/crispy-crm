import React, { useState } from 'react';
import { useCreate, useGetList, useNotify, useRefresh, useGetIdentity } from 'react-admin';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrincipalContext } from '../context/PrincipalContext';

type ActivityType = 'call' | 'email' | 'meeting' | 'note';
type Priority = 'low' | 'medium' | 'high' | 'critical';

const ACTIVITY_TYPES: Array<{
  value: ActivityType;
  label: string;
  icon: typeof Phone;
  interactionType: string;
}> = [
  { value: 'call', label: 'Call', icon: Phone, interactionType: 'call' },
  { value: 'email', label: 'Email', icon: Mail, interactionType: 'email' },
  { value: 'meeting', label: 'Meeting', icon: Calendar, interactionType: 'meeting' },
  { value: 'note', label: 'Note', icon: FileText, interactionType: 'check_in' },
];

export function QuickLogger() {
  const { selectedPrincipalId } = usePrincipalContext();
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [opportunityId, setOpportunityId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<Priority>('medium');

  const { create: createActivity } = useCreate();
  const { create: createTask } = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();

  // Fetch opportunities for selected principal
  const { data: opportunities } = useGetList(
    'principal_opportunities',
    {
      filter: selectedPrincipalId ? { principal_id: selectedPrincipalId } : {},
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'opportunity_name', order: 'ASC' },
    },
    {
      enabled: !!selectedPrincipalId,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrincipalId) {
      notify('Select a principal to log activity', { type: 'warning' });
      return;
    }

    if (!subject.trim()) {
      notify('Subject is required', { type: 'warning' });
      return;
    }

    if (createFollowUp) {
      if (!followUpTitle.trim()) {
        notify('Follow-up task title is required', { type: 'warning' });
        return;
      }
      if (!followUpDueDate) {
        notify('Follow-up due date is required', { type: 'warning' });
        return;
      }
    }

    try {
      const selectedType = ACTIVITY_TYPES.find((t) => t.value === activityType);

      // Create activity
      await createActivity('activities', {
        data: {
          subject: subject.trim(),
          description: description.trim() || null,
          activity_type: opportunityId ? 'interaction' : 'engagement',
          type: selectedType?.interactionType || 'check_in',
          opportunity_id: opportunityId,
          organization_id: selectedPrincipalId,
        },
      });

      // Create follow-up task if requested
      if (createFollowUp && identity?.id) {
        await createTask('tasks', {
          data: {
            title: followUpTitle.trim(),
            due_date: followUpDueDate,
            priority: followUpPriority,
            opportunity_id: opportunityId,
            sales_id: identity.id,
          },
        });
      }

      notify(createFollowUp ? 'Activity + task created' : 'Activity logged', { type: 'success' });

      // Clear form (keep principal selected)
      setSubject('');
      setDescription('');
      setOpportunityId(null);
      setCreateFollowUp(false);
      setFollowUpTitle('');
      setFollowUpDueDate('');
      setFollowUpPriority('medium');

      // Refresh to update Opportunities and Tasks columns
      refresh();
    } catch (error) {
      notify('Failed to log activity', { type: 'error' });
      console.error('Activity creation error:', error);
    }
  };

  const isDisabled = !selectedPrincipalId;

  return (
    <Card className="bg-card border border-border rounded-lg shadow-sm" data-testid="quick-logger-card">
      <CardHeader>
        <CardTitle>Quick Logger</CardTitle>
      </CardHeader>
      <CardContent>
        {isDisabled && (
          <p data-testid="quick-logger-helper" className="text-sm text-muted-foreground mb-3">
            Select a principal to log activity
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3" aria-label="Quick activity logger" data-testid="quick-logger-form">
          {/* Activity Type Buttons */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <div className="flex gap-2">
              {ACTIVITY_TYPES.map(({ value, icon: Icon }) => {
                const isActive = activityType === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="h-11 w-11 p-0"
                    onClick={() => setActivityType(value)}
                    aria-label={`Log ${value}`}
                    data-testid={`activity-type-${value}`}
                    disabled={isDisabled}
                  >
                    <Icon className="size-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Opportunity Selector */}
          <div className="space-y-2">
            <Label htmlFor="opportunity">Opportunity (Optional)</Label>
            <Select
              value={opportunityId?.toString() || ''}
              onValueChange={(value) => setOpportunityId(value ? parseInt(value, 10) : null)}
              disabled={isDisabled}
            >
              <SelectTrigger id="opportunity" className="h-11">
                <SelectValue
                  placeholder={
                    opportunities && opportunities.length === 0
                      ? 'No opportunities (optional)'
                      : 'Select opportunity'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {opportunities?.map((opp: any) => (
                  <SelectItem key={opp.opportunity_id} value={opp.opportunity_id.toString()}>
                    {opp.opportunity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary..."
              className="h-11"
              required
              aria-required="true"
              disabled={isDisabled}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Activity details..."
              className="min-h-[88px]"
              disabled={isDisabled}
            />
          </div>

          {/* Follow-up Checkbox */}
          <div className="flex items-center gap-2 h-11">
            <Checkbox
              id="create-followup"
              checked={createFollowUp}
              onCheckedChange={(checked) => setCreateFollowUp(checked === true)}
              data-testid="create-followup-checkbox"
              disabled={isDisabled}
            />
            <Label htmlFor="create-followup" className="cursor-pointer">
              Create follow-up task
            </Label>
          </div>

          {/* Progressive Disclosure: Follow-up Task Fields */}
          {createFollowUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  type="text"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  placeholder="Follow-up task..."
                  className="h-11"
                  required={createFollowUp}
                  aria-required={createFollowUp ? 'true' : 'false'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date *</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={followUpDueDate}
                  onChange={(e) => setFollowUpDueDate(e.target.value)}
                  className="h-11"
                  required={createFollowUp}
                  aria-required={createFollowUp ? 'true' : 'false'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={followUpPriority} onValueChange={(value) => setFollowUpPriority(value as Priority)}>
                  <SelectTrigger id="priority" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            data-testid="quick-logger-submit"
            type="submit"
            className="w-full bg-primary text-primary-foreground h-11"
            disabled={isDisabled}
          >
            Log Activity
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
