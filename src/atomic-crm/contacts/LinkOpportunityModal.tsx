import { useState } from 'react';
import { useCreate, useNotify } from 'react-admin';
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
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkOpportunityModal({
  open,
  contactName,
  contactId,
  onClose,
  onSuccess,
}: LinkOpportunityModalProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();

  const handleLink = async () => {
    if (!selectedOpportunity) return;

    try {
      await create(
        'opportunity_contacts',
        {
          data: {
            opportunity_id: selectedOpportunity.id,
            contact_id: contactId,
          },
        },
        {
          onSuccess: () => {
            notify(`Linked to ${selectedOpportunity.name}`, { type: 'success' });
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

        <AutocompleteInput
          source="opportunity_id"
          reference="opportunities"
          filterToQuery={(searchText: string) => ({ name: searchText })}
          optionText={(opp: any) =>
            opp ? `${opp.name} - ${opp.customer?.name || ''} (${opp.stage})` : ''
          }
          suggestionLimit={10}
          label="Search opportunities"
          onChange={(value: any) => setSelectedOpportunity(value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={!selectedOpportunity || isLoading}>
            {isLoading ? 'Linking...' : 'Link Opportunity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
