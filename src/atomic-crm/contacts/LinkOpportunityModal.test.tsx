import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkOpportunityModal } from './LinkOpportunityModal';
import { AdminContext } from 'react-admin';
import { vi } from 'vitest';

const mockDataProvider = {
  create: vi.fn(),
};

describe('LinkOpportunityModal', () => {
  it('renders when open', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <LinkOpportunityModal
          open={true}
          contactName="Jane Doe"
          contactId={1}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <LinkOpportunityModal
          open={false}
          contactName="Jane Doe"
          contactId={1}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </AdminContext>
    );

    expect(screen.queryByText(/Link Opportunity to Jane Doe/i)).not.toBeInTheDocument();
  });
});
