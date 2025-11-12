import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OverviewTab from './OverviewTab';
import { GlobalFilterProvider } from '../contexts/GlobalFilterContext';

// Mock ra-core hooks
vi.mock('ra-core', () => ({
  useGetList: vi.fn()
}));

// Mock PipelineChart to avoid canvas rendering issues in tests
vi.mock('../charts/PipelineChart', () => ({
  PipelineChart: () => <div>Pipeline Chart</div>
}));

import { useGetList } from 'ra-core';

const mockOpportunities = [
  {
    id: 1,
    name: 'Test Opportunity',
    amount: 50000,
    stage: 'Lead',
    last_activity_at: null,
  },
  {
    id: 2,
    name: 'Another Opportunity',
    amount: 75000,
    stage: 'Negotiation',
    last_activity_at: '2025-11-10T10:00:00Z',
  },
];

const mockActivities = [
  {
    id: 1,
    type: 'Call',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'Email',
    created_at: new Date().toISOString(),
  },
];

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlobalFilterProvider>
    {children}
  </GlobalFilterProvider>
);

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI cards', () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isPending: false })
      .mockReturnValueOnce({ data: mockActivities, isPending: false });

    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    expect(screen.getByText('Activities This Week')).toBeInTheDocument();
    expect(screen.getByText('Stale Leads')).toBeInTheDocument();
  });

  it('renders chart sections', () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isPending: false })
      .mockReturnValueOnce({ data: mockActivities, isPending: false });

    render(<OverviewTab />, { wrapper: Wrapper });

    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();
    expect(screen.getByText('Activity Trend')).toBeInTheDocument();
    expect(screen.getByText('Top Principals')).toBeInTheDocument();
    expect(screen.getByText('Rep Performance')).toBeInTheDocument();
  });
});
