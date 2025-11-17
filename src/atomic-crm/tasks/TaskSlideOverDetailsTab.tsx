import { useState } from 'react';
import { useUpdate, useNotify, RecordContextProvider } from 'ra-core';
import { Form } from 'react-admin';
import { ReferenceField } from '@/components/admin/reference-field';
import { TextField } from '@/components/admin/text-field';
import { DateField } from '@/components/admin/date-field';
import { TextInput } from '@/components/admin/text-input';
import { SelectInput } from '@/components/admin/select-input';
import { ReferenceInput } from '@/components/admin/reference-input';
import { AutocompleteInput } from '@/components/admin/autocomplete-input';
import { BooleanInput } from '@/components/admin/boolean-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AsideSection } from '../misc/AsideSection';
import { SaleName } from '../sales/SaleName';
import { useConfigurationContext } from '../root/ConfigurationContext';
import { contactOptionText } from '../misc/ContactOption';
import type { Task } from '../types';

interface TaskSlideOverDetailsTabProps {
  record: Task;
  mode: 'view' | 'edit';
  onModeToggle?: () => void;
}

/**
 * Details tab for TaskSlideOver.
 *
 * **View Mode**: Displays all task fields:
 * - Title, Description
 * - Due Date, Reminder Date
 * - Priority (badge with semantic colors)
 * - Type (badge)
 * - Completed (checkbox - inline interactive)
 * - Assigned To (ReferenceField to sales)
 * - Related Contact, Opportunity
 *
 * **Edit Mode**: Full form with save/cancel buttons
 */
export function TaskSlideOverDetailsTab({ record, mode, onModeToggle }: TaskSlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);
  const { taskTypes } = useConfigurationContext();

  // Handle save in edit mode
  const handleSave = async (data: Partial<Task>) => {
    setIsSaving(true);
    try {
      await update('tasks', {
        id: record.id,
        data,
        previousData: record,
      });
      notify('Task updated successfully', { type: 'success' });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error) {
      notify('Error updating task', { type: 'error' });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle inline completion toggle in view mode
  const handleCompletionToggle = async (checked: boolean) => {
    try {
      await update('tasks', {
        id: record.id,
        data: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: record,
      });
      notify(checked ? 'Task marked complete' : 'Task marked incomplete', { type: 'success' });
    } catch (error) {
      notify('Error updating task', { type: 'error' });
      console.error('Completion toggle error:', error);
    }
  };

  if (mode === 'edit') {
    return (
      <RecordContextProvider value={record}>
        <Form onSubmit={handleSave} record={record}>
          <div className="space-y-6">
            <div className="space-y-4">
              <TextInput source="title" label="Task Title" />
              <TextInput source="description" label="Description" multiline rows={3} />
              <TextInput source="due_date" label="Due Date" type="date" />
              <TextInput source="reminder_date" label="Reminder Date" type="date" />

              <SelectInput
                source="priority"
                label="Priority"
                choices={[
                  { id: 'low', name: 'Low' },
                  { id: 'medium', name: 'Medium' },
                  { id: 'high', name: 'High' },
                  { id: 'critical', name: 'Critical' },
                ]}
              />

              <SelectInput
                source="type"
                label="Type"
                choices={taskTypes.map((type) => ({ id: type, name: type }))}
              />

              <BooleanInput source="completed" label="Completed" />

              <ReferenceInput source="sales_id" reference="sales">
                <AutocompleteInput label="Assigned To" optionText="first_name" />
              </ReferenceInput>

              <ReferenceInput source="contact_id" reference="contacts_summary">
                <AutocompleteInput label="Contact" optionText={contactOptionText} />
              </ReferenceInput>

              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput label="Opportunity" optionText="title" />
              </ReferenceInput>
            </div>

            {/* Save button - Cancel handled by slide-over header */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-4"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode - display all task fields
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {/* Task Info Section */}
        <AsideSection title="Task Details">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold mb-2">{record.title}</h3>
                {record.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {record.description}
                  </p>
                )}
              </div>

              {/* Completion status - Interactive checkbox even in view mode */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={record.completed || false}
                  onChange={(e) => handleCompletionToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm font-medium">
                  {record.completed ? 'Completed' : 'Mark as complete'}
                </span>
                {record.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    on <DateField source="completed_at" options={{ dateStyle: 'short' }} />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </AsideSection>

        {/* Dates Section */}
        <AsideSection title="Schedule">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <DateField
                source="due_date"
                options={{ year: 'numeric', month: 'long', day: 'numeric' }}
                className="font-medium"
              />
            </div>
            {record.reminder_date && (
              <div className="text-sm">
                <span className="text-muted-foreground">Reminder: </span>
                <DateField
                  source="reminder_date"
                  options={{ year: 'numeric', month: 'long', day: 'numeric' }}
                  className="font-medium"
                />
              </div>
            )}
          </div>
        </AsideSection>

        {/* Priority & Type Section */}
        <AsideSection title="Classification">
          <div className="space-y-2">
            {record.priority && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <PriorityBadge priority={record.priority} />
              </div>
            )}
            {record.type && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="outline">{record.type}</Badge>
              </div>
            )}
          </div>
        </AsideSection>

        {/* Assignment Section */}
        {record.sales_id && (
          <AsideSection title="Assigned To">
            <ReferenceField source="sales_id" reference="sales">
              <SaleName />
            </ReferenceField>
          </AsideSection>
        )}

        {/* Timestamps Section */}
        <AsideSection title="Timeline">
          <div className="space-y-2">
            {record.created_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Created: </span>
                <DateField
                  source="created_at"
                  options={{ year: 'numeric', month: 'short', day: 'numeric' }}
                />
              </div>
            )}
            {record.updated_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Updated: </span>
                <DateField
                  source="updated_at"
                  options={{ year: 'numeric', month: 'short', day: 'numeric' }}
                />
              </div>
            )}
          </div>
        </AsideSection>
      </div>
    </RecordContextProvider>
  );
}

// Priority badge component with semantic colors
function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, 'outline' | 'secondary' | 'default' | 'destructive'> = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    critical: 'destructive',
  };

  return (
    <Badge variant={variants[priority] || 'outline'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}
