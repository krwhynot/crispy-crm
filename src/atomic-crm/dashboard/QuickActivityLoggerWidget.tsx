import React, { useState } from 'react';
import { useGetList, useCreate, useNotify } from 'react-admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';
import { ActivityType } from './types';

export const QuickActivityLoggerWidget: React.FC = () => {
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [principalId, setPrincipalId] = useState<string>('');
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const notify = useNotify();
  const [create, { isLoading: isCreating }] = useCreate();

  // Fetch principal organizations
  const { data: principals, isLoading: isPrincipalsLoading } = useGetList('organizations', {
    filter: { organization_type: 'principal' },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' }
  });

  // Fetch opportunities for selected principal
  const { data: opportunities, isLoading: isOpportunitiesLoading } = useGetList(
    'opportunities',
    {
      filter: principalId ? { principal_organization_id: parseInt(principalId) } : {},
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'name', order: 'ASC' }
    },
    {
      enabled: !!principalId
    }
  );

  const activityTypes = [
    { value: 'call' as const, label: 'Call', icon: Phone, interactionType: 'call' },
    { value: 'email' as const, label: 'Email', icon: Mail, interactionType: 'email' },
    { value: 'meeting' as const, label: 'Meeting', icon: Calendar, interactionType: 'meeting' },
    { value: 'note' as const, label: 'Note', icon: FileText, interactionType: 'check_in' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!principalId) {
      notify('Please select a principal', { type: 'warning' });
      return;
    }

    if (!subject.trim()) {
      notify('Please provide a subject', { type: 'warning' });
      return;
    }

    try {
      const selectedType = activityTypes.find(t => t.value === activityType);

      await create('activities', {
        data: {
          activity_type: opportunityId ? 'interaction' : 'engagement',
          type: selectedType?.interactionType || 'check_in',
          subject: subject.trim(),
          description: description.trim() || null,
          organization_id: parseInt(principalId),
          opportunity_id: opportunityId ? parseInt(opportunityId) : null,
          activity_date: new Date().toISOString()
        }
      });

      notify('Activity logged successfully', { type: 'success' });

      // Reset form (keep principal for quick consecutive logs)
      setSubject('');
      setDescription('');
      setOpportunityId('');
    } catch (error) {
      notify('Failed to log activity', { type: 'error' });
      console.error('Activity creation error:', error);
    }
  };

  return (
    <Card className="h-64 lg:h-80 flex flex-col">
      <CardHeader>
        <CardTitle>Quick Log Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-compact">
          {/* Activity Type Selector */}
          <div className="space-y-compact">
            <label className="text-sm font-medium">Activity Type</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-compact">
              {activityTypes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={activityType === value ? 'default' : 'outline'}
                  className="h-11 w-full"
                  onClick={() => setActivityType(value)}
                  aria-label={`Log ${label}`}
                >
                  <Icon className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Principal Selector */}
          <div className="space-y-compact">
            <label htmlFor="principal" className="text-sm font-medium">Principal *</label>
            <Select value={principalId} onValueChange={setPrincipalId} disabled={isPrincipalsLoading}>
              <SelectTrigger id="principal" className="h-11">
                <SelectValue placeholder={isPrincipalsLoading ? "Loading..." : "Select principal"} />
              </SelectTrigger>
              <SelectContent>
                {principals?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opportunity Selector (Progressive Disclosure) */}
          {principalId && (
            <div className="space-y-compact">
              <label htmlFor="opportunity" className="text-sm font-medium">Opportunity (Optional)</label>
              <Select value={opportunityId} onValueChange={setOpportunityId} disabled={isOpportunitiesLoading}>
                <SelectTrigger id="opportunity" className="h-11">
                  <SelectValue placeholder={isOpportunitiesLoading ? "Loading..." : "Select opportunity"} />
                </SelectTrigger>
                <SelectContent>
                  {opportunities?.map(o => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-compact">
            <label htmlFor="subject" className="text-sm font-medium">Subject *</label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary..."
              className="h-11"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-compact">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Activity details..."
              className="min-h-[66px] resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isCreating || !principalId || !subject.trim()}
            aria-label="Log activity"
          >
            {isCreating ? 'Logging...' : 'Log Activity'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
