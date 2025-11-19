import { useCreate, useNotify, Form, ReferenceInput } from 'react-admin';
import { AutocompleteInput } from '@/components/admin/autocomplete-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LinkOpportunityModalProps {
  open: boolean;
  contactName: string;
  contactId: number;
  linkedOpportunityIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkOpportunityModal({
  open,
  contactName,
  contactId,
  linkedOpportunityIds,
  onClose,
  onSuccess,
}: LinkOpportunityModalProps) {
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();

  const handleLink = async (data: any) => {
    if (!data.opportunity_id) return;

    // Check for duplicate
    if (linkedOpportunityIds.includes(data.opportunity_id)) {
      notify('This contact is already linked to that opportunity', {
        type: 'warning',
      });
      return;
    }

    try {
      await create(
        'opportunity_contacts',
        {
          data: {
            opportunity_id: data.opportunity_id,
            contact_id: contactId,
          },
        },
        {
          onSuccess: () => {
            notify('Opportunity linked successfully', { type: 'success' });
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            notify(error?.message || 'Failed to link opportunity', { type: 'error' });
          },
        }
      );
    } catch {
      notify('Failed to link opportunity. Please try again.', { type: 'error' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Opportunity to {contactName}</DialogTitle>
        </DialogHeader>

        <Form onSubmit={handleLink} className="space-y-4">
          <ReferenceInput source="opportunity_id" reference="opportunities">
            <AutocompleteInput
              filterToQuery={(searchText: string) => ({ name: searchText })}
              optionText={(opp: any) =>
                opp ? `${opp.name} - ${opp.customer?.name || ''} (${opp.stage})` : ''
              }
              label="Search opportunities"
            />
          </ReferenceInput>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Linking...' : 'Link Opportunity'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
