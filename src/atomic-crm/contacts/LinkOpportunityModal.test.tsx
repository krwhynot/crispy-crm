import { render, screen } from '@testing-library/react';
import { LinkOpportunityModal } from './LinkOpportunityModal';
import { vi } from 'vitest';

// Mock react-admin hooks
vi.mock('react-admin', () => ({
  useCreate: () => [vi.fn(), { isLoading: false }],
  useNotify: () => vi.fn(),
  Form: ({ children, onSubmit }: any) => (
    <form onSubmit={onSubmit}>{children}</form>
  ),
  ReferenceInput: ({ children }: any) => <div>{children}</div>,
}));

// Mock AutocompleteInput component
vi.mock('@/components/admin/autocomplete-input', () => ({
  AutocompleteInput: ({ label }: any) => <div data-testid="autocomplete">{label}</div>,
}));

describe('LinkOpportunityModal', () => {
  it('renders when open', () => {
    render(
      <LinkOpportunityModal
        open={true}
        contactName="Jane Doe"
        contactId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <LinkOpportunityModal
        open={false}
        contactName="Jane Doe"
        contactId={1}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText(/Link Opportunity to Jane Doe/i)).not.toBeInTheDocument();
  });
});
