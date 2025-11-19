import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ShowContextProvider } from 'ra-core';
import { OpportunitiesTab } from './OpportunitiesTab';

const mockContact = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  organization_id: 100,
  organization: { name: 'Acme Corp' }
};

const mockUseGetList = vi.fn();
const mockUseGetMany = vi.fn();
const mockUseRefresh = vi.fn();

// Mock StageBadgeWithHealth component
vi.mock('./StageBadgeWithHealth', () => ({
  StageBadgeWithHealth: ({ stage, health }: any) => (
    <div data-testid="stage-badge">{stage} - {health}</div>
  )
}));

// Mock LinkOpportunityModal component
vi.mock('./LinkOpportunityModal', () => ({
  LinkOpportunityModal: ({ open, contactName, onClose }: any) => {
    if (!open) return null;
    return (
      <div data-testid="link-modal">
        Link Opportunity to {contactName}
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

// Mock UnlinkConfirmDialog component
vi.mock('./UnlinkConfirmDialog', () => ({
  UnlinkConfirmDialog: ({ opportunity, contactName, onClose }: any) => {
    if (!opportunity) return null;
    return (
      <div data-testid="unlink-dialog">
        Unlink {opportunity.name} from {contactName}
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

// Mock react-admin components
vi.mock('react-admin', () => ({
  Datagrid: ({ children }: any) => <div data-testid="datagrid">{children}</div>,
  FunctionField: ({ label }: any) => <div data-testid={`field-${label}`}>function-field</div>,
  ReferenceField: ({ children, label }: any) => <div data-testid={`field-${label}`}>{children}</div>,
  TextField: () => <div>text-field</div>,
  NumberField: () => <div>number-field</div>,
  ListContextProvider: ({ children, value }: any) => {
    // Render the data items for testing
    return <div data-testid="list-context">
      {value?.data?.map((item: any) => (
        <div key={item.id} data-testid="opportunity-item">{item.name}</div>
      ))}
      {children}
    </div>;
  },
}));

vi.mock('ra-core', async () => {
  const actual = await vi.importActual('ra-core');
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
    useGetMany: () => mockUseGetMany(),
    useRefresh: () => mockUseRefresh,
  };
});

describe('OpportunitiesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseGetMany.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no opportunities linked', async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/no opportunities linked/i)).toBeInTheDocument();
    });
  });

  it('renders opportunities table with linked opportunities', async () => {
    const mockJunctionRecords = [
      { id: 'j1', contact_id: 1, opportunity_id: 10, created_at: '2025-01-01' },
      { id: 'j2', contact_id: 1, opportunity_id: 11, created_at: '2025-01-02' }
    ];

    const mockOpportunities = [
      { id: 10, name: 'Deal A', customer_organization_id: 100, stage: 'qualified', health_status: 'active', amount: 50000 },
      { id: 11, name: 'Deal B', customer_organization_id: 100, stage: 'proposal', health_status: 'cooling', amount: 75000 }
    ];

    mockUseGetList.mockReturnValue({
      data: mockJunctionRecords,
      isLoading: false,
    });
    mockUseGetMany.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Deal A')).toBeInTheDocument();
      expect(screen.getByText('Deal B')).toBeInTheDocument();
    });
  });

  it('opens link modal when clicking Link Opportunity button', async () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <ShowContextProvider value={{ record: mockContact, isLoading: false }}>
        <OpportunitiesTab />
      </ShowContextProvider>
    );

    const linkButton = screen.getByText(/Link Opportunity/i);
    fireEvent.click(linkButton);

    await waitFor(() => {
      expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
    });
  });
});
