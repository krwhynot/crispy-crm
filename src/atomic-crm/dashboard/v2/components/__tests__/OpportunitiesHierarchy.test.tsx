/**
 * Unit tests for OpportunitiesHierarchy component
 *
 * Tests filter logic and empty state handling:
 * - Health filter includes/excludes opportunities correctly
 * - Empty health filter shows all opportunities (no filtering)
 * - Empty state messages differentiate scenarios (no principal, no data, no matches)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunitiesHierarchy } from '../OpportunitiesHierarchy';
import type { FilterState } from '../../types';

// Mock React Admin hooks
const mockUseGetList = vi.fn();

vi.mock('ra-core', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

// Mock react-admin (re-exports from ra-core)
vi.mock('react-admin', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

// Mock PrincipalContext
const mockUsePrincipalContext = vi.fn();

vi.mock('../../context/PrincipalContext', () => ({
  usePrincipalContext: () => mockUsePrincipalContext(),
}));

// Mock opportunity stage helper
vi.mock('@/atomic-crm/opportunities/stageConstants', () => ({
  getOpportunityStageLabel: (stage: string) => stage,
}));

describe('OpportunitiesHierarchy', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();

    // Default mock values
    mockUsePrincipalContext.mockReturnValue({ selectedPrincipalId: 1 });
    mockUseGetList.mockReturnValue({ data: [], isLoading: false, error: null });
  });

  const renderComponent = (filters: FilterState) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OpportunitiesHierarchy
          filters={filters}
          onOpportunityClick={() => {}}
        />
      </QueryClientProvider>
    );
  };

  it('filters opportunities by health status', () => {
    mockUseGetList.mockReturnValue({
      data: [
        {
          opportunity_id: 1,
          opportunity_name: 'Active Opp',
          health_status: 'active',
          customer_name: 'Acme',
          customer_organization_id: 1,
          stage: 'new_lead',
          days_since_activity: 0,
          last_activity: '2025-11-15T00:00:00Z',
        },
        {
          opportunity_id: 2,
          opportunity_name: 'Cooling Opp',
          health_status: 'cooling',
          customer_name: 'Beta',
          customer_organization_id: 2,
          stage: 'new_lead',
          days_since_activity: 8,
          last_activity: '2025-11-07T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    });

    const filters: FilterState = {
      health: ['active'],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    renderComponent(filters);

    // Should show active opportunity
    expect(screen.queryByText(/Active Opp/)).toBeInTheDocument();
    // Should NOT show cooling opportunity
    expect(screen.queryByText(/Cooling Opp/)).not.toBeInTheDocument();
  });

  it('shows all opportunities when health filter is empty', () => {
    mockUseGetList.mockReturnValue({
      data: [
        {
          opportunity_id: 1,
          opportunity_name: 'Active Opp',
          health_status: 'active',
          customer_organization_id: 1,
          customer_name: 'Acme',
          stage: 'new_lead',
          days_since_activity: 0,
          last_activity: '2025-11-15T00:00:00Z',
        },
        {
          opportunity_id: 2,
          opportunity_name: 'Cooling Opp',
          health_status: 'cooling',
          customer_organization_id: 2,
          customer_name: 'Beta',
          stage: 'new_lead',
          days_since_activity: 8,
          last_activity: '2025-11-07T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    });

    const filters: FilterState = {
      health: [], // Empty = show all
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    renderComponent(filters);

    expect(screen.queryByText(/Active Opp/)).toBeInTheDocument();
    expect(screen.queryByText(/Cooling Opp/)).toBeInTheDocument();
  });

  it('shows correct empty state messages', () => {
    const filters: FilterState = {
      health: [],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    // No principal selected
    mockUsePrincipalContext.mockReturnValue({ selectedPrincipalId: null });
    mockUseGetList.mockReturnValue({ data: [], isLoading: false, error: null });

    const { rerender } = renderComponent(filters);

    expect(screen.getByText('Select a principal to view opportunities')).toBeInTheDocument();

    // Principal selected but no opportunities
    mockUsePrincipalContext.mockReturnValue({ selectedPrincipalId: 1 });
    mockUseGetList.mockReturnValue({ data: [], isLoading: false, error: null });

    rerender(
      <QueryClientProvider client={queryClient}>
        <OpportunitiesHierarchy
          filters={filters}
          onOpportunityClick={() => {}}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('No opportunities for this principal')).toBeInTheDocument();

    // Opportunities exist but all filtered out
    mockUseGetList.mockReturnValue({
      data: [
        {
          opportunity_id: 1,
          opportunity_name: 'Cooling Opp',
          health_status: 'cooling',
          customer_organization_id: 1,
          customer_name: 'Acme',
          stage: 'new_lead',
          days_since_activity: 8,
          last_activity: '2025-11-07T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    });

    const filtersActive: FilterState = {
      health: ['active'], // Will exclude cooling
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    rerender(
      <QueryClientProvider client={queryClient}>
        <OpportunitiesHierarchy
          filters={filtersActive}
          onOpportunityClick={() => {}}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('No opportunities match current filters')).toBeInTheDocument();
  });
});
