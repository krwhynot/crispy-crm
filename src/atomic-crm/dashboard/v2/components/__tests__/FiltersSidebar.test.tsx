import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiltersSidebar } from '../FiltersSidebar';
import type { FilterState } from '../../types';
import { BrowserRouter } from 'react-router-dom';

// Mock React Admin hooks
const mockUseGetList = vi.fn();

vi.mock('react-admin', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

// Mock ConfigurationContext
vi.mock('@/atomic-crm/root/ConfigurationContext', () => ({
  useConfigurationContext: () => ({
    opportunityStages: [
      { value: 'lead', label: 'Lead' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'proposal', label: 'Proposal' },
    ],
  }),
}));

// Mock usePrefs hook
vi.mock('../../hooks/usePrefs', () => ({
  usePrefs: () => [true, vi.fn()], // [isOpen, setIsOpen]
}));

describe('FiltersSidebar', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseGetList.mockReturnValue({
      data: [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' },
      ],
      total: 2,
      isLoading: false,
    });

    vi.clearAllMocks();
  });

  const mockFilters: FilterState = {
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
  };

  it('should not render group by customer toggle', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <FiltersSidebar
            filters={mockFilters}
            onFiltersChange={vi.fn()}
            onClearFilters={vi.fn()}
            activeCount={0}
            onToggle={vi.fn()}
          />
        </QueryClientProvider>
      </BrowserRouter>
    );

    expect(screen.queryByLabelText(/Group opportunities by customer/)).not.toBeInTheDocument();
  });
});
