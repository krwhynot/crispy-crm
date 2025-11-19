import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('ra-core', async () => {
  const actual = await vi.importActual('ra-core');
  return {
    ...actual,
    useGetList: () => mockUseGetList(),
    useGetMany: () => mockUseGetMany(),
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
});
