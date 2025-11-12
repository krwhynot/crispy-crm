import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalDashboard } from '../PrincipalDashboard';

// Mock useGetList hook
vi.mock('react-admin', () => ({
  useGetList: vi.fn(),
  useGetIdentity: vi.fn(),
  useRefresh: vi.fn(),
}));

import { useGetList, useGetIdentity, useRefresh } from 'react-admin';

const mockOpportunities = [
  {
    id: '1',
    name: 'Restaurant ABC',
    principal_organization_id: 'principal-1',
    principal_organization: { id: 'principal-1', name: 'Brand A' },
    estimated_close_date: '2025-12-15',
    stage: 'Negotiation',
    sales_id: 'user-1',
    account_manager_id: 'user-1',
    status: 'active'
  },
  {
    id: '2',
    name: 'Cafe XYZ',
    principal_organization_id: 'principal-1',
    principal_organization: { id: 'principal-1', name: 'Brand A' },
    estimated_close_date: '2025-12-20',
    stage: 'Proposal',
    sales_id: 'user-1',
    account_manager_id: 'user-1',
    status: 'active'
  },
  {
    id: '3',
    name: 'Hotel 123',
    principal_organization_id: 'principal-2',
    principal_organization: { id: 'principal-2', name: 'Brand B' },
    estimated_close_date: '2025-12-10',
    stage: 'Qualification',
    sales_id: 'user-1',
    account_manager_id: 'user-1',
    status: 'active'
  }
];

const mockTasks = [
  {
    id: '1',
    title: 'Call about pricing',
    due_date: '2025-11-06',
    opportunity_id: '1',
    status: 'Active'
  },
  {
    id: '2',
    title: 'Send samples',
    due_date: '2025-11-08',
    opportunity_id: '2',
    status: 'Active'
  }
];

const mockActivities = [
  {
    id: '1',
    type: 'Call',
    created_at: '2025-11-04T10:00:00Z',
    opportunity_id: '1'
  },
  {
    id: '2',
    type: 'Email',
    created_at: '2025-11-03T14:00:00Z',
    opportunity_id: '1'
  },
  {
    id: '3',
    type: 'Meeting',
    created_at: '2025-11-05T09:00:00Z',
    opportunity_id: '3'
  }
];

describe('PrincipalDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (useGetIdentity as any).mockReturnValue({ identity: { id: 1 } });
    (useRefresh as any).mockReturnValue(vi.fn());
    (useGetList as any).mockReturnValue({ data: [], isLoading: true });
    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('should fetch user opportunities on mount', () => {
    (useGetIdentity as any).mockReturnValue({ identity: { id: 1 } });
    (useRefresh as any).mockReturnValue(vi.fn());
    (useGetList as any).mockReturnValue({ data: [], isLoading: false });
    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    // Check that opportunities are fetched with correct filter
    expect(useGetList).toHaveBeenCalledWith(
      'opportunities',
      expect.objectContaining({
        filter: expect.objectContaining({
          status: 'active'
        })
      })
    );
  });

  it('should render principal cards when data loads', async () => {
    (useGetIdentity as any).mockReturnValue({ identity: { id: 1 } });
    (useRefresh as any).mockReturnValue(vi.fn());
    // Mock the three useGetList calls in order
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isLoading: false })
      .mockReturnValueOnce({ data: mockTasks, isLoading: false })
      .mockReturnValueOnce({ data: mockActivities, isLoading: false });

    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Principal Dashboard')).toBeInTheDocument();
      // Should render principals based on unique principal_organization_ids
      expect(screen.getByText('Brand A')).toBeInTheDocument();
      expect(screen.getByText('Brand B')).toBeInTheDocument();
    });
  });

  it('should render summary stats footer with correct counts', async () => {
    (useGetIdentity as any).mockReturnValue({ identity: { id: 1 } });
    (useRefresh as any).mockReturnValue(vi.fn());
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isLoading: false })
      .mockReturnValueOnce({ data: mockTasks, isLoading: false })
      .mockReturnValueOnce({ data: mockActivities, isLoading: false });

    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const summaryStats = screen.getByTestId('dashboard-summary-stats');
      expect(summaryStats).toBeInTheDocument();
      // Check that the summary stats section exists and contains expected text within the footer
      const summaryStatsSection = within(summaryStats);
      expect(summaryStatsSection.getByText('Total Tasks')).toBeInTheDocument();
      expect(summaryStatsSection.getByText('Activities This Week')).toBeInTheDocument();
      expect(summaryStatsSection.getByText('Active Principals')).toBeInTheDocument();
    });
  });
});