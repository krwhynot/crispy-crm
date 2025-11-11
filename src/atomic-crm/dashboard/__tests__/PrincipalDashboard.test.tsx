import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalDashboard } from '../PrincipalDashboard';

// Mock useGetList hook
vi.mock('react-admin', () => ({
  useGetList: vi.fn()
}));

import { useGetList } from 'react-admin';

const mockOpportunities = [
  {
    id: '1',
    name: 'Restaurant ABC',
    principal_organization_id: 'principal-1',
    principal_organization: { id: 'principal-1', name: 'Brand A' },
    expected_value: 5000,
    stage: 'Negotiation',
    sales_id: 'user-1',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Cafe XYZ',
    principal_organization_id: 'principal-1',
    principal_organization: { id: 'principal-1', name: 'Brand A' },
    expected_value: 3000,
    stage: 'Proposal',
    sales_id: 'user-1',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Hotel 123',
    principal_organization_id: 'principal-2',
    principal_organization: { id: 'principal-2', name: 'Brand B' },
    expected_value: 7000,
    stage: 'Qualification',
    sales_id: 'user-1',
    status: 'Active'
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
    (useGetList as any).mockReturnValue({ data: [], isLoading: true });
    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('should fetch user opportunities on mount', () => {
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
          status: 'Active'
        })
      })
    );
  });

  it('should render principal cards when data loads', async () => {
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
      // Check that stats display correct counts
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 tasks
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 activities
    });
  });
});